"""
TraceDoc – Investigation Dossier Worker.
Generates SHA-256 hash-anchored JSON and formatted PDF forensic dossiers
structured directly according to Hackathon Specification Section 7:
  7.1 Document Overview
  7.2 Extracted Information
  7.3 Contextual Analysis
  7.4 Visual & Structural Forensic Findings
  7.5 Evidence & Traceability
  7.6 Investigation Summary & Limitations
"""
from __future__ import annotations
import io
import json
import aiosqlite
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.utils.helpers import new_id, now_iso, sha256_str, from_json
from app.utils.audit import write_audit

STANDARDS = [
    "ISO/IEC 27037: Guidelines for identification, collection, acquisition, and preservation of digital evidence.",
    "ISO/IEC 27041 / 27042: Guidance on assuring suitability and interpretation of digital evidence.",
    "NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response.",
    "OWASP Machine Learning Security Top 10: Robustness and explainability considerations.",
]

LIMITATIONS = [
    "OCR quality may affect extraction confidence on low-contrast, skewed, or degraded scans.",
    "Visual signals reflect recompression and layout properties; contextual verification is required.",
    "Z3 theorem solver evaluates domain-valid arithmetic and relational hypotheses; UNKNOWN outcomes are marked for review.",
    "Human reviewer oversight is preserved for all consequential decisions.",
]


async def generate_dossier(db: aiosqlite.Connection, case_id: str, format: str = "json") -> tuple[bytes, str, str]:
    # 1. Fetch case, docs, claims, signals, findings, hypotheses
    async with db.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,)) as cur:
        case = dict(await cur.fetchone() or {})

    async with db.execute("SELECT * FROM documents WHERE case_id = ? ORDER BY created_at", (case_id,)) as cur:
        docs = [dict(d) for d in await cur.fetchall()]

    async with db.execute(
        "SELECT c.*, d.source_name FROM claims c JOIN documents d ON d.document_id = c.document_id WHERE d.case_id = ? ORDER BY c.page_index, c.field_name",
        (case_id,),
    ) as cur:
        claims = [dict(c) for c in await cur.fetchall()]
        for c in claims:
            c["bbox_norm"] = from_json(c.get("bbox_norm", "[]"))

    async with db.execute(
        "SELECT s.*, d.source_name FROM signals s JOIN documents d ON d.document_id = s.document_id WHERE d.case_id = ?",
        (case_id,),
    ) as cur:
        signals = [dict(s) for s in await cur.fetchall()]
        for s in signals:
            s["metadata"] = from_json(s.get("metadata", "{}") or s.get("limitations", "{}"))
            s["bbox_norm"] = from_json(s.get("bbox_norm", "[]") or s.get("region", "[]"))
            s["detector_name"] = s.get("detector_name") or s.get("method") or s.get("evidence_family", "forensics")
            s["severity"] = s.get("severity", "medium")

    async with db.execute("SELECT * FROM findings WHERE case_id = ?", (case_id,)) as cur:
        findings = [dict(f) for f in await cur.fetchall()]

    async with db.execute("SELECT * FROM hypothesis_tests WHERE case_id = ?", (case_id,)) as cur:
        hyps = [dict(h) for h in await cur.fetchall()]

    # Format findings with witness claim details and reviews
    formatted_findings = []
    for f in findings:
        witness_details = []
        for wid in from_json(f.get("witness_claim_ids", "[]")):
            async with db.execute("SELECT c.*, d.source_name FROM claims c JOIN documents d ON d.document_id = c.document_id WHERE c.claim_id = ?", (wid,)) as cur:
                cr = await cur.fetchone()
                if cr:
                    cd = dict(cr)
                    cd["bbox_norm"] = from_json(cd.get("bbox_norm", "[]"))
                    witness_details.append(cd)

        async with db.execute("SELECT * FROM review_events WHERE finding_id = ? ORDER BY timestamp DESC LIMIT 1", (f["finding_id"],)) as cur:
            rev = await cur.fetchone()

        formatted_findings.append({
            "finding_id": f["finding_id"],
            "title": f.get("title", f.get("finding_type", "Finding")),
            "status": f["status"],
            "priority": f["priority"],
            "finding_type": f.get("finding_type", "ANOMALY"),
            "summary": f.get("summary", ""),
            "minimal_witness": witness_details,
            "hypothesis_tests": hyps,
            "reviewer_outcome": dict(rev) if rev else None,
            "uncertainty_profile": from_json(f.get("uncertainty_profile", "{}")),
        })

    # Assemble structured 6-section payload matching PS-2 Section 7 (and backwards-compatible keys)
    payload = {
        "dossier_id": new_id(),
        "case_id": case_id,
        "bundle_type": case.get("bundle_type", "LOAN_APPLICATION"),
        "generated_at": now_iso(),
        "sha256_manifest": {d["document_id"]: d["original_sha256"] for d in docs},
        "documents": docs,
        "findings": formatted_findings,
        "limitations": LIMITATIONS,
        "section_7_1_document_overview": {
            "case_id": case_id,
            "bundle_type": case.get("bundle_type"),
            "status": case.get("status"),
            "documents": [
                {
                    "document_id": d["document_id"],
                    "source_name": d["source_name"],
                    "classification": d["classification"],
                    "confidence": d["classification_confidence"],
                    "sha256": d["original_sha256"],
                    "pages": d["page_count"],
                    "status": d["status"],
                }
                for d in docs
            ],
        },
        "section_7_2_extracted_information": [
            {
                "claim_id": c["claim_id"],
                "source_document": c.get("source_name"),
                "field_name": c["field_name"],
                "raw_text": c["raw_text"],
                "normalized_value": c["normalized_value"],
                "confidence": c["extraction_confidence"],
                "page_index": c["page_index"],
                "bbox_norm": c["bbox_norm"],
            }
            for c in claims
        ],
        "section_7_3_contextual_analysis": {
            "evaluated_hypotheses": hyps,
            "cross_document_discrepancies": [
                {
                    "finding_id": f["finding_id"],
                    "status": f["status"],
                    "title": f["title"],
                    "summary": f["summary"],
                }
                for f in formatted_findings
            ],
        },
        "section_7_4_visual_forensic_findings": [
            {
                "signal_id": s["signal_id"],
                "source_document": s.get("source_name"),
                "detector_name": s["detector_name"],
                "severity": s["severity"],
                "score": s["score"],
                "bbox_norm": s["bbox_norm"],
                "metadata": s["metadata"],
            }
            for s in signals
        ],
        "section_7_5_evidence_and_traceability": [
            {
                "finding_id": f["finding_id"],
                "status": f["status"],
                "minimal_contradiction_witnesses": f["minimal_witness"],
                "reviewer_audit": f["reviewer_outcome"],
            }
            for f in formatted_findings
        ],
        "section_7_6_investigation_summary": {
            "overall_conclusion": (
                "POTENTIAL_MANIPULATION: Unresolved mathematical conflict with corroborated forensic mutations."
                if any(f["status"] == "potential_manipulation" for f in findings)
                else "OBSERVATION: All financial constraints reconciled; no escalation warranted."
            ),
            "findings_count": len(findings),
            "signals_count": len(signals),
            "applicable_standards": STANDARDS,
            "investigation_limitations": LIMITATIONS,
        },
    }

    raw_json = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")
    dossier_hash = sha256_str(raw_json.decode("utf-8"))
    payload["dossier_hash"] = dossier_hash
    payload["dossier_integrity_hash"] = dossier_hash

    if format == "json":
        await write_audit(db, "DOSSIER_EXPORTED_JSON", case_id, payload={"hash": dossier_hash})
        return json.dumps(payload, indent=2).encode("utf-8"), "application/json", f"tracedoc_{case_id[:8]}.json"

    # 2. PDF Generation with ReportLab
    buf = io.BytesIO()
    pdf_doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    story = [
        Paragraph("<b>TraceDoc CEIE — Forensic Investigation Dossier</b>", styles["Heading1"]),
        Paragraph(
            f"<b>Case ID:</b> {case_id} &nbsp;|&nbsp; <b>Bundle Type:</b> {case.get('bundle_type')} &nbsp;|&nbsp; <b>Date:</b> {now_iso()[:10]}",
            styles["Normal"],
        ),
        Spacer(1, 10),
        Paragraph("<b>7.1 Document Overview (SHA-256 Manifest)</b>", styles["Heading2"]),
    ]

    doc_table = [["Document", "Class", "Pages", "SHA-256 Digest"]] + [
        [d["source_name"], d["classification"], str(d["page_count"]), d["original_sha256"][:20] + "..."] for d in docs
    ]
    t = Table(doc_table, colWidths=[180, 120, 45, 195])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ]))
    story += [t, Spacer(1, 10), Paragraph("<b>7.2 Extracted Information & Structure Sample</b>", styles["Heading2"])]

    # Sample of extracted claims
    claim_table = [["Field", "Source Doc", "Extracted Value", "Confidence"]] + [
        [c["field_name"][:20], c.get("source_name", "")[:20], c["raw_text"][:24], f"{c['extraction_confidence']*100:.0f}%"]
        for c in claims[:8]
    ]
    ct = Table(claim_table, colWidths=[140, 140, 180, 80])
    ct.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
    ]))
    story += [ct, Spacer(1, 10), Paragraph("<b>7.3 Contextual Analysis & SMT Counterfactual Reasoning</b>", styles["Heading2"])]

    for h in hyps:
        outcome_color = "#16a34a" if h["outcome"] == "SUPPORTED" else "#dc2626"
        story.append(Paragraph(
            f"• <b>Hypothesis [{h['name']}]:</b> <font color='{outcome_color}'><b>{h['outcome']}</b></font> — {h['explanation']}",
            styles["Normal"],
        ))

    story += [Spacer(1, 10), Paragraph("<b>7.4 Visual & Structural Forensic Findings</b>", styles["Heading2"])]
    if signals:
        for s in signals[:4]:
            story.append(Paragraph(
                f"• <b>{s['detector_name']}</b> on <i>{s.get('source_name')}</i> [Severity: <b>{s['severity'].upper()}</b>, Score: {s['score']:.3f}]",
                styles["Normal"],
            ))
    else:
        story.append(Paragraph("• No visual pixel or font structural mutations identified across bundle.", styles["Normal"]))

    story += [Spacer(1, 10), Paragraph("<b>7.5 Evidence, Minimal Witness & Traceability</b>", styles["Heading2"])]
    for f in formatted_findings:
        story.append(Paragraph(
            f"<b>Finding: {f['title']}</b> &nbsp; [Status: <b>{f['status'].upper()}</b> &nbsp;|&nbsp; Priority: {f['priority']}]",
            styles["Normal"],
        ))
        if f["minimal_witness"]:
            story.append(Paragraph("  <i>Minimal Contradiction Witness Set:</i>", styles["Normal"]))
            for w in f["minimal_witness"]:
                story.append(Paragraph(
                    f"    - {w['field_name']}: <b>{w['raw_text']}</b> (from {w.get('source_name')}, bbox: {w['bbox_norm']})",
                    styles["Normal"],
                ))
        if f["reviewer_outcome"]:
            ro = f["reviewer_outcome"]
            story.append(Paragraph(
                f"  <i>Reviewer Action:</i> <b>{ro['action'].upper()}</b> by {ro['actor']} (Reason: {ro.get('reason')}) — Previous Hash Chained",
                styles["Normal"],
            ))

    story += [
        Spacer(1, 10),
        Paragraph("<b>7.6 Investigation Summary, Standards & Limitations</b>", styles["Heading2"]),
        Paragraph(f"<b>Overall Synthesis:</b> {payload['section_7_6_investigation_summary']['overall_conclusion']}", styles["Normal"]),
        Spacer(1, 4),
        Paragraph("<b>Referenced Standards:</b> " + " • ".join(STANDARDS), styles["Normal"]),
        Spacer(1, 4),
        Paragraph("<b>System Limitations:</b> " + " • ".join(LIMITATIONS), styles["Normal"]),
        Spacer(1, 10),
        Paragraph(f"<b>Root Dossier Integrity Hash (SHA-256):</b> <font face='Courier' size='8'>{dossier_hash}</font>", styles["Normal"]),
    ]

    pdf_doc.build(story)
    pdf_bytes = buf.getvalue()
    buf.close()

    await write_audit(db, "DOSSIER_EXPORTED_PDF", case_id, payload={"hash": dossier_hash})
    return pdf_bytes, "application/pdf", f"tracedoc_{case_id[:8]}.pdf"
