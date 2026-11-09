"""
TraceDoc – End-to-End Integration Test Suite (Prompt 23)
Tests health, clean hard-negative restraint, tampered bundle detection,
evidence crop retrieval, review actions, and dossier exports.
"""
import asyncio
import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport
import sys

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.main import app
from app.db import create_all


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    asyncio.run(create_all())


async def _poll_until_complete(ac: AsyncClient, case_id: str, max_wait_sec: float = 10.0):
    start = asyncio.get_event_loop().time()
    while asyncio.get_event_loop().time() - start < max_wait_sec:
        res = await ac.get(f"/api/cases/{case_id}/status")
        if res.status_code == 200 and res.json()["status"] == "complete":
            return True
        await asyncio.sleep(0.3)
    return False


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["ok", "degraded"]
        assert data["db"] == "ok"
        assert data["solver"] == "ok"


@pytest.mark.asyncio
async def test_corrupt_file_fails_visibly():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        c_res = await ac.post("/api/cases", json={"bundle_type": "LOAN_APPLICATION"})
        assert c_res.status_code == 201
        case_id = c_res.json()["case_id"]

        files = [("files", ("bad.txt", b"this is not a valid pdf", "text/plain"))]
        u_res = await ac.post(f"/api/cases/{case_id}/documents", files=files)
        assert u_res.status_code == 422
        assert "Unsupported file type" in u_res.json()["detail"]


@pytest.mark.asyncio
async def test_clean_bundle_no_escalation():
    """Clean hard-negative: split payments (40k + 25k) reconcile payslip 65k."""
    clean_dir = Path(__file__).resolve().parent.parent.parent / "data" / "synthetic" / "clean_bundle"
    assert clean_dir.exists(), "Clean bundle directory missing"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        c_res = await ac.post("/api/cases", json={"bundle_type": "LOAN_APPLICATION"})
        assert c_res.status_code == 201
        case_id = c_res.json()["case_id"]

        upload_files = []
        for pdf_file in sorted(clean_dir.glob("*.pdf")):
            upload_files.append(("files", (pdf_file.name, pdf_file.read_bytes(), "application/pdf")))

        u_res = await ac.post(f"/api/cases/{case_id}/documents", files=upload_files)
        assert u_res.status_code == 201
        assert len(u_res.json()) == 4

        a_res = await ac.post(f"/api/cases/{case_id}/analyze")
        assert a_res.status_code == 200

        # Poll until complete
        done = await _poll_until_complete(ac, case_id)
        assert done, "Pipeline timed out for clean bundle"

        # Check findings: should NOT escalate to potential_manipulation
        f_res = await ac.get(f"/api/cases/{case_id}/findings")
        assert f_res.status_code == 200
        findings = f_res.json()

        manipulation_findings = [f for f in findings if f["status"] == "potential_manipulation"]
        assert len(manipulation_findings) == 0, f"Clean case wrongly escalated: {manipulation_findings}"

        # Claims were extracted
        cl_res = await ac.get(f"/api/cases/{case_id}/claims")
        assert cl_res.status_code == 200
        claims = cl_res.json()
        assert len(claims) >= 4


@pytest.mark.asyncio
async def test_tampered_bundle_detection():
    """Tampered bundle: Net pay is INR 95,000, creating INR 30,000 conflict with bank and declaration."""
    tampered_dir = Path(__file__).resolve().parent.parent.parent / "data" / "synthetic" / "tampered_bundle"
    assert tampered_dir.exists(), "Tampered bundle directory missing"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        c_res = await ac.post("/api/cases", json={"bundle_type": "LOAN_APPLICATION"})
        assert c_res.status_code == 201
        case_id = c_res.json()["case_id"]

        upload_files = []
        for pdf_file in sorted(tampered_dir.glob("*.pdf")):
            upload_files.append(("files", (pdf_file.name, pdf_file.read_bytes(), "application/pdf")))

        u_res = await ac.post(f"/api/cases/{case_id}/documents", files=upload_files)
        assert u_res.status_code == 201

        a_res = await ac.post(f"/api/cases/{case_id}/analyze")
        assert a_res.status_code == 200

        # Poll until complete
        done = await _poll_until_complete(ac, case_id)
        assert done, "Pipeline timed out for tampered bundle"

        # Check findings: must flag potential_manipulation or inconsistency
        f_res = await ac.get(f"/api/cases/{case_id}/findings")
        assert f_res.status_code == 200
        findings = f_res.json()
        assert len(findings) > 0

        target_finding = next((f for f in findings if f["status"] in ["potential_manipulation", "inconsistency"]), None)
        assert target_finding is not None, f"Expected conflict finding, got {findings}"

        # Test evidence crop retrieval for witness claims
        witness_claim_ids = target_finding["witness_claim_ids"]
        assert len(witness_claim_ids) > 0
        for cid in witness_claim_ids:
            crop_res = await ac.get(f"/api/claims/{cid}/crop")
            assert crop_res.status_code == 200
            assert crop_res.headers["content-type"] == "image/png"

        # Test Human Review API: accept with reason and annotation
        rev_res = await ac.post(
            f"/api/findings/{target_finding['finding_id']}/review",
            json={"action": "accept", "reason": "Confirmed INR 30,000 net pay discrepancy", "annotation": "Audited by senior forensic reviewer"},
        )
        assert rev_res.status_code == 200
        rev_data = rev_res.json()
        assert rev_data["action"] == "accept"
        assert rev_data["previous_event_hash"] is not None

        # Verify review history audit chain
        hist_res = await ac.get(f"/api/findings/{target_finding['finding_id']}/review/history")
        assert hist_res.status_code == 200
        assert len(hist_res.json()) >= 1

        # Test Dossier Export: JSON and PDF
        dossier_json_res = await ac.get(f"/api/cases/{case_id}/dossier?format=json")
        assert dossier_json_res.status_code == 200
        dj = dossier_json_res.json()
        assert dj["dossier_hash"] is not None
        assert len(dj["findings"]) > 0

        dossier_pdf_res = await ac.get(f"/api/cases/{case_id}/dossier?format=pdf")
        assert dossier_pdf_res.status_code == 200
        assert dossier_pdf_res.headers["content-type"] == "application/pdf"
        assert len(dossier_pdf_res.content) > 1000
