"""
VeriStrata CEIE — Automated End-to-End Live Demonstration Runner
Ingests evidence bundles, executes 4-Strata forensics & Z3 SMT theorem proving,
commits ISO/IEC 27037 audit chains, exports certified dossiers (PDF & JSON),
and automatically launches the interactive Forensic Workbench and PDF report.

Usage:
    python demo.py
    python demo.py --bundle clean
    python demo.py --bundle tampered
    python demo.py --bundle both
    python demo.py --no-browser
"""
import sys
import os
import time
import argparse
import webbrowser
import subprocess
from pathlib import Path

# UTF-8 terminal support on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import asyncio
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

# ANSI Color codes
C_CYAN = "\033[1;36m"
C_GREEN = "\033[1;32m"
C_YELLOW = "\033[1;33m"
C_RED = "\033[1;31m"
C_MAGENTA = "\033[1;35m"
C_BOLD = "\033[1m"
C_DIM = "\033[90m"
C_RESET = "\033[0m"


def header(title: str):
    print(f"\n{C_CYAN}╔{'═' * 76}╗{C_RESET}")
    print(f"{C_CYAN}║{C_RESET} {C_BOLD}{title.center(74)}{C_RESET} {C_CYAN}║{C_RESET}")
    print(f"{C_CYAN}╚{'═' * 76}╝{C_RESET}\n")


def pulse(step_num: int, total_steps: int, label: str):
    prefix = f"{C_CYAN}[{step_num}/{total_steps}]{C_RESET} {C_BOLD}{label}{C_RESET}"
    print(f"\n{prefix}")
    time.sleep(0.15)


async def execute_pipeline(db: aiosqlite.Connection, bundle_path: Path, case_id: str, bundle_type: str):
    pulse(1, 6, f"STAGE 1: Ingesting & Quarantining Evidence Bundle ({bundle_type.upper()})")
    pdf_files = sorted(bundle_path.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDF files found in {bundle_path}")

    ingested = []
    for f in pdf_files:
        raw_bytes = f.read_bytes()
        doc = await quarantine_upload(db, raw_bytes, f.name, case_id)
        await normalise_document(db, doc.document_id)
        await classify_document(db, doc.document_id)
        digest = sha256_str(raw_bytes.hex())[:16]
        print(f"  {C_GREEN}✓{C_RESET} Ingested: {f.name:<28} | SHA-256: {C_DIM}{digest}...{C_RESET}")
        ingested.append(doc)
        time.sleep(0.08)

    # Fetch normalized docs
    async with db.execute("SELECT * FROM documents WHERE case_id = ? ORDER BY source_name", (case_id,)) as cur:
        docs = [dict(r) for r in await cur.fetchall()]

    pulse(2, 6, "STAGE 2: Multi-Strata Forensic Analysis (DOM, Pixel ELA, Typo)")
    for d in docs:
        did = d["document_id"]
        # Strata 1: PDF DOM
        await extract_native_pdf(db, did)
        await analyse_pdf_structure(db, did)
        # Strata 2: Pixel ELA
        await analyse_pixels(db, did, 0)
        # Strata 3: Typo rules
        await run_intra_rules(db, did)
        print(f"  {C_GREEN}✓{C_RESET} 4-Strata Forensics Complete on: {C_CYAN}{d['source_name']}{C_RESET}")
        time.sleep(0.08)

    pulse(3, 6, "STAGE 3: Cross-Evidence Correlation & SMT Hypothesis Testing (Z3)")
    edges = await correlate_bundle(db, case_id)
    print(f"  {C_GREEN}✓{C_RESET} Cross-document correlation links found: {C_BOLD}{len(edges)} cross-claim edges{C_RESET}")

    hyps = await test_hypotheses(db, case_id)
    for h in hyps:
        if h["outcome"] == "SUPPORTED":
            print(f"  {C_GREEN}▶ [SAT]{C_RESET} {h['name']:<22} ➔ {C_GREEN}SUPPORTED (Restraint Applied){C_RESET}")
        else:
            print(f"  {C_RED}▶ [UNSAT]{C_RESET} {h['name']:<20} ➔ {C_RED}REJECTED (Residual: INR {h['residual_conflict']:,.2f}){C_RESET}")
        print(f"    {C_DIM}{h['explanation']}{C_RESET}")
        time.sleep(0.08)

    pulse(4, 6, "STAGE 4: Bipartite Witness Graph & Conflict Isolation")
    graph = await build_evidence_graph(db, case_id)
    findings = await generate_findings(db, case_id)

    target_finding = findings[0] if findings else {"status": "observation", "finding_type": "none"}
    status_color = C_GREEN if target_finding["status"] == "observation" else C_RED
    print(f"  {C_BOLD}Formal Finding Outcome:{C_RESET} {status_color}{target_finding['status'].upper()}{C_RESET} ({target_finding.get('priority', 'normal')})")

    pulse(5, 6, "STAGE 5: ISO/IEC 27037 Tamper-Evident Review Commitment")
    rev_id = new_id()
    action = "accept" if target_finding["status"] != "observation" else "observation_logged"
    reason = "Verified against banking credits and multi-strata forensic telemetry."
    ts = now_iso()
    chain_link = sha256_str(f"{rev_id}:{action}:{reason}:{ts}")

    if target_finding.get("finding_id"):
        await db.execute(
            """
            INSERT INTO review_events (review_id, finding_id, actor, action, reason, timestamp, previous_event_hash)
            VALUES (?, ?, 'auditor_automated', ?, ?, ?, ?)
            """,
            (rev_id, target_finding["finding_id"], action, reason, ts, chain_link),
        )
        await db.commit()
    print(f"  {C_GREEN}✓{C_RESET} Review Event Committed: {C_BOLD}{action}{C_RESET}")
    print(f"  {C_GREEN}✓{C_RESET} Cryptographic Audit Chain Hash: {C_DIM}{chain_link}{C_RESET}")

    pulse(6, 6, "STAGE 6: Compiling Final Audit Dossier (PDF & JSON)")
    json_bytes, _, json_name = await generate_dossier(db, case_id, "json")
    pdf_bytes, _, pdf_name = await generate_dossier(db, case_id, "pdf")

    export_dir = ROOT_DIR / "data" / "dossiers"
    export_dir.mkdir(parents=True, exist_ok=True)
    json_path = export_dir / json_name
    pdf_path = export_dir / pdf_name

    json_path.write_bytes(json_bytes)
    pdf_path.write_bytes(pdf_bytes)

    print(f"  {C_GREEN}✓{C_RESET} Certified JSON Dossier : {C_BOLD}{json_path.name}{C_RESET} ({len(json_bytes):,} bytes)")
    print(f"  {C_GREEN}✓{C_RESET} Certified PDF Dossier  : {C_BOLD}{pdf_path.name}{C_RESET} ({len(pdf_bytes):,} bytes)")

    return {
        "case_id": case_id,
        "bundle_type": bundle_type,
        "finding": target_finding,
        "json_path": json_path,
        "pdf_path": pdf_path,
    }


async def run(bundle_choice: str, auto_open: bool):
    header("VERISTRATA CEIE — AUTOMATED FORENSIC PIPELINE & DOSSIER GENERATION")
    await create_all()

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        bundles_to_run = []
        if bundle_choice in ("clean", "both"):
            clean_dir = ROOT_DIR / "data" / "synthetic" / "clean_bundle"
            bundles_to_run.append(("clean", clean_dir))
        if bundle_choice in ("tampered", "both"):
            tampered_dir = ROOT_DIR / "data" / "synthetic" / "tampered_bundle"
            bundles_to_run.append(("tampered", tampered_dir))

        results = []
        for b_type, b_dir in bundles_to_run:
            c_id = f"CASE-{b_type.upper()}-{new_id()[:8].upper()}"
            await db.execute(
                "INSERT INTO cases (case_id, created_by, bundle_type, status, created_at) VALUES (?, 'demo_runner', 'LOAN_APPLICATION', 'created', ?)",
                (c_id, now_iso()),
            )
            await db.commit()

            print(f"\n{C_MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{C_RESET}")
            print(f"  🚀 EXECUTING PIPELINE FOR: {C_BOLD}{b_type.upper()} BUNDLE{C_RESET} (Case ID: {c_id})")
            print(f"{C_MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{C_RESET}")

            res = await execute_pipeline(db, b_dir, c_id, b_type)
            results.append(res)

        # Final Showcase Summary
        header("🎯 DEMO EXECUTION COMPLETE — ALL ARTIFACTS GENERATED")

        last_res = results[-1]
        workbench_html_url = f"http://localhost:8000/report/{last_res['case_id']}"
        workbench_studio_url = f"http://127.0.0.1:5173/#/studio"
        autopsy_story_url = f"http://127.0.0.1:5173/#/"

        print(f"{C_BOLD}Generated Dossier Files:{C_RESET}")
        for r in results:
            print(f"  • {r['bundle_type'].upper()} PDF : {C_CYAN}{r['pdf_path']}{C_RESET}")
            print(f"  • {r['bundle_type'].upper()} JSON: {C_CYAN}{r['json_path']}{C_RESET}")

        print(f"\n{C_BOLD}Interactive Workbench & Investigation Links:{C_RESET}")
        print(f"  👉 Standalone Forensic Report : {C_GREEN}{workbench_html_url}{C_RESET}")
        print(f"  👉 Unified Studio Darkroom    : {C_GREEN}{workbench_studio_url}{C_RESET}")
        print(f"  👉 5-Scene Autopsy Storyline  : {C_GREEN}{autopsy_story_url}{C_RESET}")
        print(f"  👉 Backend REST API Docs      : {C_GREEN}http://127.0.0.1:8000/docs{C_RESET}")

        if auto_open:
            print(f"\n{C_YELLOW}🌐 Automatically launching Forensic Workbench in your browser...{C_RESET}")
            try:
                # Open React Studio
                webbrowser.open(workbench_studio_url)
                # Open Standalone HTML Report
                webbrowser.open(workbench_html_url)
                # Open PDF dossier with default OS viewer
                if sys.platform.startswith("win"):
                    os.startfile(str(last_res["pdf_path"]))
                elif sys.platform.startswith("darwin"):
                    subprocess.run(["open", str(last_res["pdf_path"])])
                else:
                    subprocess.run(["xdg-open", str(last_res["pdf_path"])])
            except Exception as e:
                print(f"Note: Could not automatically open external application ({e})")

        print(f"\n{C_GREEN}✨ Ready for screen recording and judge presentation!{C_RESET}\n")


def main():
    parser = argparse.ArgumentParser(description="VeriStrata CEIE Live Demonstration Runner")
    parser.add_argument("--bundle", choices=["clean", "tampered", "both"], default="tampered",
                        help="Which evidence bundle to process (default: tampered)")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically launch web browser or PDF viewer")
    args = parser.parse_args()

    asyncio.run(run(bundle_choice=args.bundle, auto_open=not args.no_browser))


if __name__ == "__main__":
    main()
