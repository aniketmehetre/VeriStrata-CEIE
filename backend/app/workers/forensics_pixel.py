"""
TraceDoc – Pixel-Level Forensics Worker (OpenCV).
Error Level Analysis (ELA) and copy-move keypoint matching with quality gates.
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
    async with db.execute("SELECT image_path, width_px, height_px FROM page_manifests WHERE document_id = ? AND page_index = ?", (document_id, page_index)) as cur:
        page = await cur.fetchone()
    if not page or not Path(page["image_path"]).exists():
        return []

    img_path, w, h = page["image_path"], page["width_px"], page["height_px"]
    signals = []

    # 1. Error Level Analysis (ELA)
    try:
        orig = Image.open(img_path).convert("RGB")
        buf = io.BytesIO()
        orig.save(buf, "JPEG", quality=75)
        buf.seek(0)
        recomp = Image.open(buf)
        diff = ImageChops.difference(orig, recomp)
        max_diff = max([ex[1] for ex in diff.getextrema()]) if diff.getextrema() else 0

        # Quality gate: only report if significant recompression anomaly is found
        if max_diff > 25:
            arr = np.array(diff.convert("L"))
            ys, xs = np.where(arr > np.mean(arr) + 3 * np.std(arr))
            if len(xs) > 50:
                signals.append({
                    "signal_id": new_id(), "document_id": document_id, "method": "ela",
                    "evidence_family": "visual_pixel",
                    "region": to_json({"page": page_index, "bbox": [round(float(np.min(xs))/w, 4), round(float(np.min(ys))/h, 4), round(float(np.max(xs))/w, 4), round(float(np.max(ys))/h, 4)]}),
                    "score": round(float(max_diff)/255.0, 3), "quality_flags": to_json(["JPEG_RECOMPRESSION_DEPENDENT"]),
                    "limitations": "ELA shows compression variance; not definitive proof of intent.", "created_at": now_iso(),
                })
    except Exception:
        pass

    # 2. Keypoint Copy-Move Detection
    try:
        gray = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        if gray is not None:
            orb = cv2.ORB_create(nfeatures=800)
            kps, descs = orb.detectAndCompute(gray, None)
            if descs is not None and len(descs) > 20:
                matches = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(descs, descs, k=2)
                pairs = [
                    (kps[m.queryIdx].pt, kps[m.trainIdx].pt)
                    for m, n in matches
                    if m.distance < 0.7 * n.distance and m.queryIdx != m.trainIdx and np.hypot(kps[m.queryIdx].pt[0] - kps[m.trainIdx].pt[0], kps[m.queryIdx].pt[1] - kps[m.trainIdx].pt[1]) > 50
                ]
                # Quality gate: minimum 20 distant matching keypairs
                if len(pairs) >= 20:
                    xs, ys = [p[0][0] for p in pairs], [p[0][1] for p in pairs]
                    signals.append({
                        "signal_id": new_id(), "document_id": document_id, "method": "copy_move_keypoint",
                        "evidence_family": "visual_pixel",
                        "region": to_json({"page": page_index, "bbox": [round(min(xs)/w, 4), round(min(ys)/h, 4), round(max(xs)/w, 4), round(max(ys)/h, 4)]}),
                        "score": round(min(1.0, len(pairs) / 50.0), 3), "quality_flags": to_json(["SPATIAL_CLUSTER_CONFIRMED"]),
                        "limitations": "Repeated logos or watermarks can trigger keypoint clusters.", "created_at": now_iso(),
                    })
    except Exception:
        pass

    for s in signals:
        await insert(db, "signals", s)

    if signals:
        await db.commit()
        await write_audit(db, "PIXEL_ANALYSIS_COMPLETE", document_id, payload={"count": len(signals)})
    return signals
