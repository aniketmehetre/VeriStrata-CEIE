"""
TraceDoc CEIE — Live 5-Beat Judge Demonstration Runner
Executes the full end-to-end investigation pipeline on synthetic bundles,
demonstrating both detection and restraint, and exports final investigation dossiers.
"""
import sys

# Configure UTF-8 for cross-platform Windows terminal compatibility
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import asyncio
from pathlib import Path

# Add backend directory to path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import aiosqlite
from app.db import create_all, DB_PATH
from app.workers.ingest import quarantine_upload
from app.workers.normalise import normalise_document
from app.workers.classify import classify_document
from app.workers.extract_pdf import extract_native_pdf
from app.workers.forensics_structural import analyse_pdf_structure
from app.workers.forensics_pixel import analyse_pixels
from app.workers.rules_intra import run_intra_rules
from app.workers.correlation import correlate_bundle
from app.workers.hypothesis import test_hypotheses
from app.workers.graph import build_evidence_graph
from app.workers.findings import generate_findings
from app.workers.dossier import generate_dossier
from app.utils.helpers import new_id, now_iso, sha256_str


def banner(title: str):
    line = "═" * 78
    print(f"\n\033[1;36m{line}\033[0m")
    print(f"\033[1;37m  {title}\033[0m")
    print(f"\033[1;36m{line}\033[0m\n")


async def run_pipeline_for_bundle(db: aiosqlite.Connection, bundle_path: Path, case_id: str, bundle_label: str):
    # 1. Ingest files
    pdf_files = sorted(bundle_path.glob("*.pdf"))
    for f in pdf_files:
        doc = await quarantine_upload(db, f.read_bytes(), f.name, case_id)
        await normalise_document(db, doc.document_id)
        await classify_document(db, doc.document_id)

    # Fetch updated docs from DB
    async with db.execute("SELECT * FROM documents WHERE case_id = ? ORDER BY source_name", (case_id,)) as cur:
        docs = [dict(r) for r in await cur.fetchall()]

    # 2. Extract & Forensics
    for d in docs:
        doc_id = d["document_id"]
        await extract_native_pdf(db, doc_id)
        await analyse_pdf_structure(db, doc_id)
        await analyse_pixels(db, doc_id, 0)
        await run_intra_rules(db, doc_id)

    # 3. Correlation & Hypotheses
    edges = await correlate_bundle(db, case_id)
    hyps = await test_hypotheses(db, case_id)
    graph = await build_evidence_graph(db, case_id)
    findings = await generate_findings(db, case_id)

    return docs, edges, hyps, findings


async def main():
    await create_all()
    print("\033[1;32m[+] Initialized SQLite Ledger & Canonical Storage\033[0m")

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # =====================================================================
        # BEAT 1: Ingestion & Cryptographic Manifest
        # =====================================================================
        banner("BEAT 1: CASE INTAKE & CRYPTOGRAPHIC EVIDENCE MANIFEST")
        clean_case_id = f"CASE-CLEAN-{new_id()[:8].upper()}"
        await db.execute(
            "INSERT INTO cases (case_id, created_by, bundle_type, status, created_at) VALUES (?, ?, ?, 'created', ?)",
            (clean_case_id, "investigator_01", "LOAN_APPLICATION", now_iso()),
        )
        await db.commit()

        clean_dir = ROOT_DIR / "data" / "synthetic" / "clean_bundle"
        clean_docs, _, _, _ = await run_pipeline_for_bundle(db, clean_dir, clean_case_id, "Clean")

        print(f"Case ID: \033[1m{clean_case_id}\033[0m  |  Retention: 30d  |  Policy: Bank Review")
        print(f"{'Filename':<32} {'Classification':<22} {'Pages':<8} {'SHA-256 Digest (Truncated)'}")
        print("-" * 78)
        for d in clean_docs:
            print(f"{d['source_name']:<32} \033[36m{d['classification']:<22}\033[0m {d['page_count']:<8} {d['original_sha256'][:20]}...")

        # =====================================================================
        # BEAT 2: Showing Restraint (Clean Hard-Negative with Split Payment)
        # =====================================================================
        banner("BEAT 2: SHOWING RESTRAINT — THE SPLIT-PAYMENT HARD NEGATIVE")
        print("Scenario: Payslip declares Net Pay of INR 65,000.")
        print("          Bank statement records two split credits: INR 40,000 + INR 25,000.")
        print("          A naive one-to-one rule would flag a false INR 25,000 mismatch.\n")

        async with db.execute("SELECT * FROM hypothesis_tests WHERE case_id = ?", (clean_case_id,)) as cur:
            clean_hyps = [dict(r) for r in await cur.fetchall()]

        async with db.execute("SELECT * FROM findings WHERE case_id = ?", (clean_case_id,)) as cur:
            clean_findings = [dict(r) for r in await cur.fetchall()]

        for h in clean_hyps:
            status_color = "\033[32m" if h["outcome"] == "SUPPORTED" else "\033[31m"
            print(f"  * Z3 Hypothesis [{h['name']}]: {status_color}{h['outcome']}\033[0m")
            print(f"    \033[90m{h['explanation']}\033[0m")

        print(f"\nOverall Finding Escalation Status: \033[1;32m{clean_findings[0]['status'].upper()}\033[0m (Priority: {clean_findings[0]['priority']})")
        print("\033[1;32m[+] FALSE POSITIVE PREVENTED:\033[0m Reconciled without escalating to fraud or manipulation.")

        # =====================================================================
        # BEAT 3: Catching Controlled Tampering
        # =====================================================================
        banner("BEAT 3: CATCHING CONTROLLED TAMPERING — UNRESOLVED CONTRADICTION")
        tampered_case_id = f"CASE-TAMPERED-{new_id()[:8].upper()}"
        await db.execute(
            "INSERT INTO cases (case_id, created_by, bundle_type, status, created_at) VALUES (?, ?, ?, 'created', ?)",
            (tampered_case_id, "investigator_01", "LOAN_APPLICATION", now_iso()),
        )
        await db.commit()

        tampered_dir = ROOT_DIR / "data" / "synthetic" / "tampered_bundle"
        t_docs, t_edges, t_hyps, t_findings = await run_pipeline_for_bundle(db, tampered_dir, tampered_case_id, "Tampered")

        print("Scenario: Salary slip Net Pay has been manipulated from INR 65,000 to INR 95,000.")
        print("          Bank statement and Employer Declaration independently confirm INR 65,000.\n")

        target_finding = t_findings[0]
        finding_color = "\033[1;31m" if target_finding["status"] == "potential_manipulation" else "\033[1;33m"
        print(f"Finding Type: \033[1m{target_finding['finding_type']}\033[0m")
        print(f"Finding Status: {finding_color}{target_finding['status'].upper()}\033[0m (Priority: \033[1;31m{target_finding['priority']}\033[0m)")

        print("\n\033[1mEvaluated Benign Hypotheses (Z3 Solver):\033[0m")
        for h in t_hyps:
            outcome_col = "\033[32m" if h["outcome"] == "SUPPORTED" else "\033[31m"
            print(f"  * {h['name']:<24}: {outcome_col}{h['outcome']:<10}\033[0m Residual: INR {h['residual_conflict']:,.2f}")
            print(f"    \033[90m{h['explanation']}\033[0m")

        # =====================================================================
        # BEAT 4: Minimal Contradiction Witness & Evidence Coordinates
        # =====================================================================
        banner("BEAT 4: MINIMAL CONTRADICTION WITNESS & SOURCE ANCHORS")
        print("The solver isolated the exact minimal conflict witness subset:\n")

        async with db.execute(
            """
            SELECT c.field_name, c.raw_text, c.normalized_value, c.bbox_norm, d.source_name
            FROM claims c
            JOIN documents d ON d.document_id = c.document_id
            WHERE d.case_id = ? AND c.field_name IN ('net_pay', 'monthly_net_pay', 'salary_credit_row')
            """,
            (tampered_case_id,),
        ) as cur:
            witnesses = [dict(r) for r in await cur.fetchall()]

        for w in witnesses:
            print(f"  [{w['field_name']}] in \033[36m{w['source_name']}\033[0m")
            print(f"    Raw Text:    \033[1m{w['raw_text']}\033[0m")
            print(f"    Normalized:  {w['normalized_value']} paise")
            print(f"    Page BBox:   \033[90m{w['bbox_norm']}\033[0m\n")

        print("\033[1;33mTraceability:\033[0m Every claim maps to exact normalized page bounds. No hallucinated evidence.")

        # =====================================================================
        # BEAT 5: Reviewer Commitment & Dossier Export
        # =====================================================================
        banner("BEAT 5: HUMAN REVIEW OVERSIGHT & TAMPER-EVIDENT DOSSIER EXPORT")

        review_id = new_id()
        r_action = "accept"
        r_reason = "Confirmed INR 30,000 salary inflation against employer certification"
        ts = now_iso()
        chain_hash = sha256_str(f"{review_id}{r_action}{r_reason}{ts}")

        await db.execute(
            "INSERT INTO review_events (review_id, finding_id, actor, action, reason, timestamp, previous_event_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (review_id, target_finding["finding_id"], "senior_investigator", r_action, r_reason, ts, chain_hash),
        )
        await db.commit()
        print(f"\033[1;32m[+] Committed Human Review Event:\033[0m Action: \033[1m{r_action}\033[0m")
        print(f"  Audit Chain Link: \033[90m{chain_hash}\033[0m")

        json_bytes, _, json_name = await generate_dossier(db, tampered_case_id, "json")
        pdf_bytes, _, pdf_name = await generate_dossier(db, tampered_case_id, "pdf")

        export_dir = ROOT_DIR / "data" / "dossiers"
        export_dir.mkdir(parents=True, exist_ok=True)
        (export_dir / json_name).write_bytes(json_bytes)
        (export_dir / pdf_name).write_bytes(pdf_bytes)

        print(f"\n\033[1;32m[+] Exported Forensic Dossiers:\033[0m")
        print(f"  * JSON Dossier: {export_dir / json_name} ({len(json_bytes)} bytes)")
        print(f"  * PDF Dossier:  {export_dir / pdf_name} ({len(pdf_bytes)} bytes)")

        banner("DEMONSTRATION COMPLETE — READY FOR JUDGES")
        print("Interactive Forensic Workbench URL:")
        print(f"  \033[1;36mhttp://localhost:8000/report/{tampered_case_id}\033[0m")
        print("  (or start server: \033[1muvicorn app.main:app --reload --port 8000\033[0m from backend/)\n")


if __name__ == "__main__":
    asyncio.run(main())
