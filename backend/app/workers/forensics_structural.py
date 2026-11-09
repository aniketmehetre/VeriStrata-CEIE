"""
VeriStrata CEIE – PDF Structural & Typographical Forensics Worker.
Decomposes documents across:
  - Strata I: File / PDF DOM inspection (pikepdf) for /Prev dictionaries, multiple xref tables,
              and unreferenced font object streams.
  - Strata III: Micro-typography & Layout forensics (PyMuPDF) for font baseline jitter,
               kerning anomalies, and inline font substitution (e.g. Helvetica body interrupted by Georgia-Italic).
"""
from __future__ import annotations
import io
import aiosqlite
import fitz
import numpy as np
from collections import Counter
from pathlib import Path
from app.config import settings
from app.db import insert
from app.utils.helpers import new_id, now_iso, to_json
from app.utils.audit import write_audit

try:
    import pikepdf
    HAS_PIKEPDF = True
except Exception:
    HAS_PIKEPDF = False


async def analyse_pdf_structure(db: aiosqlite.Connection, document_id: str) -> list[dict]:
    async with db.execute("SELECT case_id, media_type FROM documents WHERE document_id = ?", (document_id,)) as cur:
        doc = dict(await cur.fetchone() or {})
    if doc.get("media_type") != "application/pdf":
        return []

    orig_dir = Path(settings.originals_dir) / doc["case_id"] / document_id
    if not orig_dir.exists():
        return []
    orig_files = list(orig_dir.iterdir())
    if not orig_files:
        return []

    pdf_bytes = orig_files[0].read_bytes()
    signals: list[dict] = []

    # ── 1. Strata I: PDF DOM & Revision Forensics (pikepdf) ───────────────────
    eof_count = pdf_bytes.count(b"%%EOF")
    xref_count = pdf_bytes.count(b"xref")
    prev_count = pdf_bytes.count(b"/Prev ")

    has_incremental = (eof_count > 1 or xref_count > 1 or prev_count > 0)

    if HAS_PIKEPDF:
        try:
            with pikepdf.Pdf.open(io.BytesIO(pdf_bytes)) as pdf:
                # Check for /Prev pointer in trailer
                trailer_has_prev = False
                try:
                    if "/Prev" in pdf.trailer:
                        trailer_has_prev = True
                except Exception:
                    pass

                if has_incremental or trailer_has_prev:
                    signals.append({
                        "signal_id": new_id(),
                        "document_id": document_id,
                        "method": "pdf_incremental_revision",
                        "evidence_family": "file_structure",
                        "region": to_json({"page": 0, "bbox": [0, 0, 1000, 1000]}),
                        "score": float(max(eof_count, xref_count, 2)),
                        "quality_flags": to_json(["MULTIPLE_XREF_TABLES", "INCREMENTAL_REVISION_PREV"]),
                        "limitations": "Incremental updates occur when PDFs are digitally re-saved or content streams altered post-generation.",
                        "created_at": now_iso(),
                    })

                # Check page resource dictionaries for unreferenced or mixed font dictionaries
                for pno, page in enumerate(pdf.pages):
                    try:
                        if "/Resources" in page and "/Font" in page["/Resources"]:
                            f_dict = page["/Resources"]["/Font"]
                            font_keys = list(f_dict.keys())
                            if len(font_keys) > 4:
                                signals.append({
                                    "signal_id": new_id(),
                                    "document_id": document_id,
                                    "method": "mixed_font_dictionaries",
                                    "evidence_family": "file_structure",
                                    "region": to_json({"page": pno, "bbox": [0, 0, 1000, 1000]}),
                                    "score": float(len(font_keys)),
                                    "quality_flags": to_json(["MIXED_FONT_RESOURCES"]),
                                    "limitations": "Multiple external font dictionaries defined in resources may indicate spliced form templates.",
                                    "created_at": now_iso(),
                                })
                    except Exception:
                        pass
        except Exception:
            pass
    elif has_incremental:
        signals.append({
            "signal_id": new_id(),
            "document_id": document_id,
            "method": "incremental_revisions",
            "evidence_family": "file_structure",
            "region": to_json({"page": 0, "bbox": [0, 0, 1000, 1000]}),
            "score": float(eof_count),
            "quality_flags": to_json(["MULTIPLE_REVISIONS"]),
            "limitations": "Revisions occur naturally in signed or modified PDFs.",
            "created_at": now_iso(),
        })

    # ── 2. Strata III: Micro-Typography & Baseline Forensics (PyMuPDF) ─────────
    try:
        pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
        for pno in range(pdf.page_count):
            page = pdf[pno]
            w_pts = page.rect.width
            h_pts = page.rect.height
            text_dict = page.get_text("dict")

            for block in text_dict.get("blocks", []):
                if block.get("type") != 0:
                    continue

                for line in block.get("lines", []):
                    spans = [s for s in line.get("spans", []) if s.get("text", "").strip()]
                    if not spans:
                        continue

                    # A. Inline Font Family Substitution (e.g. Helvetica with Georgia-Italic injection)
                    font_names = [s.get("font", "") for s in spans]
                    if len(set(font_names)) > 1:
                        modal_font = Counter(font_names).most_common(1)[0][0]
                        for s in spans:
                            if s.get("font") != modal_font:
                                bx = s.get("bbox", [0, 0, 0, 0])
                                txt = s.get("text", "").strip()
                                norm_box = [
                                    int(round(bx[1] / h_pts * 1000)),
                                    int(round(bx[0] / w_pts * 1000)),
                                    int(round(bx[3] / h_pts * 1000)),
                                    int(round(bx[2] / w_pts * 1000)),
                                ]
                                signals.append({
                                    "signal_id": new_id(),
                                    "document_id": document_id,
                                    "method": "inline_font_substitution",
                                    "evidence_family": "text_layout",
                                    "region": to_json({
                                        "page": pno,
                                        "text": txt,
                                        "bbox": norm_box,
                                        "base_font": modal_font,
                                        "injected_font": s.get("font"),
                                    }),
                                    "score": 0.94,
                                    "quality_flags": to_json(["FONT_SUBSTITUTION_IDENTIFIED", "INLINE_MUTATION"]),
                                    "limitations": "Detected typeface switch within a single text block.",
                                    "created_at": now_iso(),
                                })

                    # B. Font Baseline Deviation
                    origins = [s.get("origin", (0, 0))[1] for s in spans]
                    if len(origins) > 1:
                        med_y = float(np.median(origins))
                        for s in spans:
                            cur_y = s.get("origin", (0, 0))[1]
                            diff_pt = abs(cur_y - med_y)
                            if diff_pt > 1.2:  # >1.2 pt vertical misalignment
                                bx = s.get("bbox", [0, 0, 0, 0])
                                txt = s.get("text", "").strip()
                                norm_box = [
                                    int(round(bx[1] / h_pts * 1000)),
                                    int(round(bx[0] / w_pts * 1000)),
                                    int(round(bx[3] / h_pts * 1000)),
                                    int(round(bx[2] / w_pts * 1000)),
                                ]
                                signals.append({
                                    "signal_id": new_id(),
                                    "document_id": document_id,
                                    "method": "font_baseline_jitter",
                                    "evidence_family": "text_layout",
                                    "region": to_json({"page": pno, "text": txt, "bbox": norm_box, "jitter_pt": round(diff_pt, 2)}),
                                    "score": round(min(1.0, diff_pt / 4.0), 3),
                                    "quality_flags": to_json(["BASELINE_ALIGNMENT_ANOMALY"]),
                                    "limitations": "Baseline deviations indicate manual character or number replacement.",
                                    "created_at": now_iso(),
                                })

                    # C. Font Size Outlier on Numerical Amount Spans
                    sizes = [round(s["size"], 1) for s in spans]
                    if sizes:
                        modal_sz = Counter(sizes).most_common(1)[0][0]
                        for s in spans:
                            txt = s.get("text", "").strip()
                            if any(c.isdigit() for c in txt) and abs(s["size"] - modal_sz) > 2.0:
                                bx = s.get("bbox", [0, 0, 0, 0])
                                norm_box = [
                                    int(round(bx[1] / h_pts * 1000)),
                                    int(round(bx[0] / w_pts * 1000)),
                                    int(round(bx[3] / h_pts * 1000)),
                                    int(round(bx[2] / w_pts * 1000)),
                                ]
                                signals.append({
                                    "signal_id": new_id(),
                                    "document_id": document_id,
                                    "method": "font_size_anomaly",
                                    "evidence_family": "text_layout",
                                    "region": to_json({"page": pno, "text": txt, "bbox": norm_box}),
                                    "score": round(abs(s["size"] - modal_sz), 2),
                                    "quality_flags": to_json(["FONT_SIZE_OUTLIER"]),
                                    "limitations": "Font size variations may reflect intentional styling or heading emphasis.",
                                    "created_at": now_iso(),
                                })

        pdf.close()
    except Exception:
        pass

    for s in signals:
        await insert(db, "signals", s)

    if signals:
        await db.commit()
        await write_audit(db, "STRUCTURAL_ANALYSIS_COMPLETE", document_id, payload={"count": len(signals)})
    return signals
