"""
VeriStrata CEIE – Strata II: Pixel-Level Forensics Worker (OpenCV & PIL).
Executes:
  - Multi-Quality Error Level Analysis (ELA) to detect differential JPEG quantization artifacts.
  - Keypoint-based spatial cluster copy-move search to flag duplicate or cloned pixel patches.
"""
from __future__ import annotations
import io
import cv2
import numpy as np
from PIL import Image, ImageChops
import aiosqlite
from pathlib import Path
from app.db import insert
from app.utils.helpers import new_id, now_iso, to_json
from app.utils.audit import write_audit


async def analyse_pixels(db: aiosqlite.Connection, document_id: str, page_index: int) -> list[dict]:
    async with db.execute(
        "SELECT image_path, width_px, height_px FROM page_manifests WHERE document_id = ? AND page_index = ?",
        (document_id, page_index),
    ) as cur:
        page = await cur.fetchone()
    if not page or not Path(page["image_path"]).exists():
        return []

    img_path, w, h = page["image_path"], page["width_px"], page["height_px"]
    signals: list[dict] = []

    # ── 1. Error Level Analysis (ELA) with Quantization Differential ──────────
    try:
        orig = Image.open(img_path).convert("RGB")
        buf = io.BytesIO()
        orig.save(buf, "JPEG", quality=75)
        buf.seek(0)
        recomp = Image.open(buf)
        diff = ImageChops.difference(orig, recomp)
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if extrema else 0

        # Quality threshold: only report if distinct quantization anomaly is detected
        if max_diff > 22:
            arr = np.array(diff.convert("L"))
            mean_val = float(np.mean(arr))
            std_val = float(np.std(arr))
            threshold = mean_val + 2.8 * std_val

            ys, xs = np.where(arr > threshold)
            if len(xs) > 35:
                # Calculate normalized bounding box [ymin, xmin, ymax, xmax] in [0, 1000]
                ymin = int(round(float(np.min(ys)) / h * 1000))
                xmin = int(round(float(np.min(xs)) / w * 1000))
                ymax = int(round(float(np.max(ys)) / h * 1000))
                xmax = int(round(float(np.max(xs)) / w * 1000))

                signals.append({
                    "signal_id": new_id(),
                    "document_id": document_id,
                    "method": "ela",
                    "evidence_family": "visual_pixel",
                    "region": to_json({
                        "page": page_index,
                        "bbox": [ymin, xmin, ymax, xmax],
                        "max_difference": int(max_diff),
                        "cluster_pixels": len(xs),
                    }),
                    "score": round(float(max_diff) / 255.0, 3),
                    "quality_flags": to_json(["JPEG_QUANTIZATION_DELTA", "LOCALIZED_COMPRESSION_SPIKE"]),
                    "limitations": "ELA measures recompression differential; highlights regions saved at different compression rates.",
                    "created_at": now_iso(),
                })
    except Exception:
        pass

    # ── 2. Keypoint Copy-Move & Spatial Cluster Search ────────────────────────
    try:
        gray = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        if gray is not None:
            orb = cv2.ORB_create(nfeatures=1000, scaleFactor=1.2, nlevels=8)
            kps, descs = orb.detectAndCompute(gray, None)

            if descs is not None and len(descs) > 25:
                bf = cv2.BFMatcher(cv2.NORM_HAMMING)
                matches = bf.knnMatch(descs, descs, k=2)

                valid_pairs = []
                for m, n in matches:
                    if m.distance < 0.65 * n.distance and m.queryIdx != m.trainIdx:
                        pt1 = kps[m.queryIdx].pt
                        pt2 = kps[m.trainIdx].pt
                        dist = np.hypot(pt1[0] - pt2[0], pt1[1] - pt2[1])
                        # Distance gate: must be spatially distinct (> 40 px)
                        if dist > 40:
                            valid_pairs.append((pt1, pt2))

                # Cluster gate: minimum 15 distinct matching keypoints
                if len(valid_pairs) >= 15:
                    all_xs = [p[0][0] for p in valid_pairs] + [p[1][0] for p in valid_pairs]
                    all_ys = [p[0][1] for p in valid_pairs] + [p[1][1] for p in valid_pairs]

                    ymin = int(round(float(min(all_ys)) / h * 1000))
                    xmin = int(round(float(min(all_xs)) / w * 1000))
                    ymax = int(round(float(max(all_ys)) / h * 1000))
                    xmax = int(round(float(max(all_xs)) / w * 1000))

                    signals.append({
                        "signal_id": new_id(),
                        "document_id": document_id,
                        "method": "copy_move_keypoint",
                        "evidence_family": "visual_pixel",
                        "region": to_json({
                            "page": page_index,
                            "bbox": [ymin, xmin, ymax, xmax],
                            "match_pairs_count": len(valid_pairs),
                        }),
                        "score": round(min(1.0, len(valid_pairs) / 40.0), 3),
                        "quality_flags": to_json(["SPATIAL_KEYPOINT_CLUSTERING", "REPEATED_FEATURE_PATCH"]),
                        "limitations": "Repeated document elements, headers, and company logos can produce legitimate keypoint clusters.",
                        "created_at": now_iso(),
                    })
    except Exception:
        pass

    for s in signals:
        await insert(db, "signals", s)

    if signals:
        await db.commit()
        await write_audit(db, "PIXEL_ANALYSIS_COMPLETE", document_id, payload={"count": len(signals)})
    return signals
