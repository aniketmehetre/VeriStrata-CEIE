# TraceDoc CEIE — Live Demonstration & Pitch Guide
### DataOps Innovation Hackathon · 5-Beat Judge Demonstration

---

## 2-Minute Pitch Script

> "Document systems can read a salary slip, and forensic tools can flag suspicious pixels. But an investigator still has to connect the evidence and decide whether a mismatch is genuinely suspicious or simply caused by a split payment, posting delay, or formatting difference.
>
> **TraceDoc** investigates the whole document bundle as an interconnected evidence graph. Every extracted field becomes a source-linked claim with exact coordinates and extraction confidence. When claims conflict, our **Counterfactual Hypothesis Tester** (backed by the Z3 theorem prover) explicitly tests plausible legitimate explanations—like multiple payroll credits or posting-date delays—and computes the smallest contradiction witness that remains. Correlated forensic detector signals are evaluated across independent evidence families without double-counting.
>
> The human reviewer can inspect the original page crop, review the solver's formal test trace, record an immutable audit decision, and export a SHA-256 hash-anchored dossier in JSON or PDF format.
>
> Today, we demonstrate both capabilities live:
> 1. A clean hard-negative case where TraceDoc demonstrates restraint and resolves split salary credits without false alarm.
> 2. A tampered case where a manipulated salary slip is flagged, localized, and proven unexplained."

---

## 5-Beat Live Judge Demonstration

### Beat 1: Ingestion & Provenance (2 Minutes)
1. **Action:** Create a new case via `POST /api/cases` with bundle type `LOAN_APPLICATION`.
2. **Action:** Upload the clean synthetic 4-document bundle (`01_application_form.pdf`, `02_salary_slip.pdf`, `03_bank_statement.pdf`, `04_employer_declaration.pdf`).
3. **Show:**
   - Case ID and SHA-256 hash manifest.
   - Automatic document classification (`SALARY_SLIP`, `BANK_STATEMENT`, etc.).
   - Page normalization manifests with original resolution and crop geometries.
4. **Key Talking Point:** *"Original documents are quarantined and hashed immediately (read-only); every derivative and extracted claim retains complete cryptographic provenance."*

---

### Beat 2: Show Restraint — The Hard Negative (2 Minutes)
1. **Context:** The applicant's payslip shows Net Pay of **INR 65,000**. The bank statement has two payroll credits: **INR 40,000** on Sep 2 and **INR 25,000** on Sep 4.
2. **Action:** Run analysis (`POST /api/cases/{case_id}/analyze`).
3. **Show Findings:**
   - Status is **OBSERVATION** (low priority) — no escalation to fraud or manipulation!
   - Hypothesis test `split_credit` evaluated via Z3 solver returns:
     `"SUPPORTED: Initial mismatch explained by 2 supported payroll credits summing to INR 65,000.00; no unresolved salary conflict."`
4. **Key Talking Point:** *"A naive rules engine would flag a 25,000 mismatch against the first transaction. TraceDoc tests whether benign domain explanations reconcile the discrepancy, avoiding false positives."*

---

### Beat 3: Catch — The Controlled Tampering (2 Minutes)
1. **Context:** In the second bundle, the salary slip's net pay has been altered to **INR 95,000**, while the bank credits remain INR 65,000 and employer declaration states INR 65,000.
2. **Action:** Upload and analyze the tampered bundle.
3. **Show Findings:**
   - Status: **POTENTIAL_MANIPULATION** / **INCONSISTENCY** (High Review Priority).
   - Minimal Contradiction Witness: displays the 3 conflicting claims (`payslip.net_pay`, `bank.salary_credits`, `declaration.monthly_net_pay`).
   - Hypothesis Lab:
     - `split_credit`: **REJECTED** (leaves INR 30,000 unexplained).
     - `posting_delay`: **REJECTED**.
     - `gross_net_confusion`: **REJECTED**.
4. **Key Talking Point:** *"TraceDoc does not just claim there is an error; it proves that INR 30,000 remains unexplained after evaluating all plausible benign hypotheses."*

---

### Beat 4: Traceability & Page-Crop Evidence (2 Minutes)
1. **Action:** Call `GET /api/claims/{claim_id}/crop` for the net-pay claim.
2. **Show:**
   - Immediate pixel-accurate crop of the salary slip amount field.
   - Full claim provenance: page index, normalized bounding box `[0.34, 0.42, 0.65, 0.47]`, extractor version, and extraction confidence.
   - NetworkX Contradiction Graph via `GET /api/cases/{case_id}/graph`.
3. **Key Talking Point:** *"Every finding can be traced back to its exact document coordinate. No black-box scores."*

---

### Beat 5: Review & Hash-Linked Dossier Export (2 Minutes)
1. **Action:** Reviewer records an action:
   ```json
   POST /api/findings/{finding_id}/review
   {
     "action": "accept",
     "reason": "Confirmed INR 30,000 net pay discrepancy against employer records",
     "annotation": "Audited by Senior Reviewer"
   }
   ```
2. **Action:** Export dossier (`GET /api/cases/{case_id}/dossier?format=pdf` or `?format=json`).
3. **Show:**
   - Generated ReportLab PDF containing cover manifest, findings, minimal witness tables, hypothesis test traces, reviewer action, and limitations.
   - Root `dossier_hash` (SHA-256) anchoring the entire investigation audit chain.
4. **Key Talking Point:** *"Human oversight is mandatory. TraceDoc delivers an audit-ready, tamper-evident investigation dossier."*

---

## Judge Q&A Defense

| Question | Defensible Answer |
|---|---|
| **What is actually novel about this?** | We do not claim to invent a new OCR engine or pixel model. The innovation is the **counterfactual evidence investigation workflow**: turning a discrepancy into a reviewable path by testing benign hypotheses with Z3, computing minimal contradiction witnesses, and preserving claim-level coordinates. |
| **How do you avoid false positives?** | Through hard-negative testing, domain tolerances (INR 500 rounding, 5-day posting windows), quality gates that suppress unreliable signals, and dependency-aware grouping of related signals. |
| **Why not use an end-to-end LLM for everything?** | Forensic evidence requires deterministic reproducibility. OCR coordinates, arithmetic rules, Z3 constraint solving, and hash chains are mathematically verifiable. An LLM is only used optionally for phrasing and never has tool authority to alter claims or verdicts. |
| **Are you ISO compliant?** | We make no formal compliance claim. Our architecture is informed by the principles of ISO/IEC 27037 (evidence preservation), ISO/IEC 27041 (suitability), and ISO/IEC 27042 (analysis/interpretation) as referenced in the hackathon brief. |
| **Why use Z3 instead of simple if-else statements?** | Z3 supports bounded constraint satisfaction, integer-paise precision, tagged constraint assumptions, and unsat core minimization to identify the minimal set of conflicting claims. |

