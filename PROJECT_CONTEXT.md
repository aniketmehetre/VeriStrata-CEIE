# VeriStrata CEIE — Counterfactual Evidence Investigation Engine
## Complete In-Depth System Context, Architecture & Developer Reference

> **Target Audience**: Any Large Language Model (LLM), Senior Systems Architect, or Hackathon Judge requiring complete, unambiguous, and deep context of the VeriStrata CEIE project to analyze, extend, debug, or evaluate the system without needing additional queries.
> **Aligned with**: DataOps Innovation Hackathon — Problem Statement 2 (PS-2: *AI-Powered Document Forensics and Contextual Intelligence System*).

---

## 1. Executive Summary & System Philosophy

### 1.1 The Core Problem
Document fraud in retail lending, SME credit, insurance underwriting, and AP procurement cannot be reliably detected by standard Optical Character Recognition (OCR) or Large Language Model (LLM) extraction alone. Real-world fraud exhibits two failure modes:
1. **False Positives (Lack of Restraint)**: Legitimate applicants are rejected when multiple deposits sum up to their declared salary (e.g., split payroll transfers of ₹40,000 and ₹25,000 for a ₹65,000 monthly pay), or when banking holidays introduce posting delays.
2. **False Negatives (Lack of Verification)**: Sophisticated fraudsters forge payslips by modifying numbers directly within the PDF content stream or using graphic editing tools (modifying ₹65,000 to ₹95,000), leaving the rest of the layout visually convincing.

### 1.2 The VeriStrata Solution: Counterfactual Evidence Reasoning
**VeriStrata CEIE** is an automated forensic dataops platform that replaces fragile regex/heuristic rules with **Z3 Satisfiability Modulo Theories (SMT) Theorem Proving**, paired with **pixel and structural forensics**, **tamper-evident SHA-256 Merkle audit trails**, and a **next-generation 3D interactive investigation workbench**.

Instead of asking *"Does this single document look suspicious?"*, VeriStrata formulates **counterfactual explanations** (hypotheses) across the entire document bundle:
- *Hypothesis 1 (`split_credit`)*: Did the employer pay the employee via multiple discrete bank transfers whose exact sum equals declared net salary?
- *Hypothesis 2 (`posting_delay`)*: Did payroll credit post within a $\pm 5$-day settlement window across month-end?
- *Hypothesis 3 (`gross_net_confusion`)*: Did the applicant enter gross compensation instead of net take-home pay?

If **any** counterfactual model is **SATISFIABLE (SAT)**, VeriStrata demonstrates **mathematical restraint** and categorizes the case as an `OBSERVATION`, preventing false rejections. If **all** counterfactual models are **UNSATISFIABLE (UNSAT)** and forensic signals confirm alterations, VeriStrata escalates to `POTENTIAL_MANIPULATION`, isolates the **minimal contradiction witness claims**, and produces a court-admissible dossier.

---

## 2. Global Repository Structure

```
C:\HACKATHONS\Data-ops\
├── backend/
│   ├── app/
│   │   ├── config.py             # Canonical path resolution, data dirs, settings
│   │   ├── db.py                 # SQLite schema, open_db(), get_db(), insert()
│   │   ├── main.py               # FastAPI entry point, lifespan, CORS, timing middleware
│   │   ├── routers/
│   │   │   ├── cases.py          # Case CRUD, status polling, graph, demo triggers
│   │   │   ├── documents.py      # Multipart upload, classification override, page render
│   │   │   ├── claims.py         # Claims list, /api/claims/{id}/crop endpoint (200 DPI PNG)
│   │   │   ├── findings.py       # Findings synthesis, evidence subgraphs, reviewer actions
│   │   │   ├── dossier.py        # Court-admissible JSON and PDF export (Section 7 aligned)
│   │   │   └── workbench.py      # Server-rendered HTML fallback report (/report/{id})
│   │   ├── schemas/
│   │   │   └── __init__.py       # Pydantic v2 data models for API requests/responses
│   │   ├── templates/
│   │   │   └── workbench.html    # Standalone HTML workbench template
│   │   ├── utils/
│   │   │   ├── audit.py          # write_audit() with SHA-256 previous-event hash chaining
│   │   │   └── helpers.py        # new_id(), now_iso(), sha256_*, JSON serializer
│   │   └── workers/
│   │       ├── ingest.py         # Quarantine raw uploads, compute SHA-256
│   │       ├── normalise.py      # 200 DPI page rendering via PyMuPDF (fitz)
│   │       ├── classify.py       # Keyword document classification & confidence
│   │       ├── extract_pdf.py    # Structured claim extraction with FIELD_MAP & bounding boxes
│   │       ├── extract_ocr.py    # OCR fallback engine (PaddleOCR graceful degradation)
│   │       ├── forensics_structural.py # PDF revisions, font anomaly detection
│   │       ├── forensics_pixel.py      # Error Level Analysis (ELA) & Copy-Move keypoints
│   │       ├── rules_intra.py    # Intra-document arithmetic checks (gross - deductions = net)
│   │       ├── correlation.py    # Cross-document entity matching (PAN, Name, Net vs Bank)
│   │       ├── hypothesis.py     # Z3 SMT Theorem Prover counterfactual constraint engine
│   │       ├── findings.py       # Finding synthesis & escalation state machine
│   │       ├── graph.py          # NetworkX multi-layer evidence graph export
│   │       └── dossier.py        # ReportLab PDF + Cryptographic JSON generator (PS-2 Sec 7)
│   └── tests/
│       └── test_e2e.py           # Pytest suite (Clean restraint, Tampered escalation, Corrupt file)
├── frontend/                     # Modern React 19 + TypeScript + Vite + Tailwind v4 + Three.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── CaseStudioView.tsx     # 3-column deep forensic studio with bounding box HUD
│   │   │   ├── DashboardView.tsx      # Landing command center, stat counters, beat triggers
│   │   │   ├── DossierModal.tsx       # Live JSON inspector & court-admissible PDF trigger
│   │   │   ├── ForensicScanEffect.tsx # Anime.js v4 scanline sweep & animated counter
│   │   │   ├── Navbar.tsx             # System health pill, case switcher, demo launch
│   │   │   ├── NewCaseModal.tsx       # Interactive case initialization & PDF dropzone
│   │   │   ├── ReviewDrawer.tsx       # SHA-256 hash-chained sign & stamp with confetti
│   │   │   └── ThreeForensicCanvas.tsx# Interactive 3D Three.js holographic SMT core
│   │   ├── api.ts                # API client layer communicating with FastAPI
│   │   ├── App.tsx               # Root component with Lenis smooth scroll & state router
│   │   ├── index.css             # Tailwind v4 theme, glassmorphism, scanlines
│   │   ├── main.tsx              # React DOM entry
│   │   └── types.ts              # TypeScript interfaces mirroring backend contracts
│   ├── index.html                # Google Fonts (Inter + JetBrains Mono)
│   ├── package.json              # NPM dependencies (Three, Motion, Lenis, Anime.js, etc.)
│   ├── tsconfig.json             # TypeScript configuration
│   └── vite.config.ts            # Vite config with @tailwindcss/vite and API proxy
├── data/
│   ├── originals/                # Quarantined raw uploaded files by case_id/doc_id
│   ├── derivatives/              # 200 DPI rendered PNG pages by case_id/doc_id/pages/
│   └── synthetic/                # Synthetic PDF test bundles with ground truth
│       ├── clean_bundle/         # 4 Clean PDFs (₹65k salary, split bank credits ₹40k+₹25k)
│       ├── tampered_bundle/      # 4 Tampered PDFs (₹95k forged salary slip, font mismatch)
│       └── generate_bundle.py    # ReportLab generator for synthetic test data
├── run_demo.py                   # 5-Beat CLI judge demonstration script
├── tracedoc.db                   # SQLite primary database
└── Makefile                      # Convenience scripts for setup, test, and demo
```

---

## 3. Data Representation Standards & Rules

To ensure mathematical precision and cross-platform reproducibility, TraceDoc enforces 3 immutable rules:
1. **All Monies in Integer Paise**: Financial amounts are strictly stored and computed as integer paise ($1\text{ INR} = 100\text{ paise}$).
   - ₹65,000.00 is stored as integer `6500000`.
   - ₹40,000.00 is stored as integer `4000000`.
   - Floating-point rounding errors are mathematically eliminated from Z3 SMT formulas.
2. **Normalized Bounding Boxes**: All bounding boxes are 4-element float vectors:
   $$\text{bbox\_norm} = [x_0, y_0, x_1, y_1]$$
   where $0.0 \le x_0 < x_1 \le 1.0$ and $0.0 \le y_0 < y_1 \le 1.0$, measured relative to page width and page height.
3. **Deterministic Canonical Hashing**: Every ingested binary, every normalized page PNG, every audit log entry, and every human reviewer action is stamped with a SHA-256 cryptographic digest.

---

## 4. Database Schema (SQLite: `tracedoc.db`)

The database consists of 11 relational tables managed via asynchronous `aiosqlite`:

### 4.1 Table: `cases`
| Column | Type | Description |
|---|---|---|
| `case_id` | TEXT PRIMARY KEY | Unique UUID or deterministic identifier (e.g. `CASE-CLEAN-6B6A7718`) |
| `bundle_type` | TEXT | Application category (e.g., `LOAN_APPLICATION`, `INSURANCE_CLAIM`) |
| `status` | TEXT | Lifecycle status: `created`, `analyzing`, `complete` |
| `created_by` | TEXT | Actor identifier (e.g., `investigator_01`, `demo_clean`) |
| `retention_policy` | TEXT | Retention policy (default `30d`) |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.2 Table: `documents`
| Column | Type | Description |
|---|---|---|
| `document_id` | TEXT PRIMARY KEY | Unique document UUID |
| `case_id` | TEXT REFERENCES `cases(case_id)` | Parent case ID |
| `original_sha256` | TEXT | SHA-256 hash of quarantined upload binary |
| `media_type` | TEXT | MIME type (e.g., `application/pdf`) |
| `page_count` | INTEGER | Number of pages |
| `source_name` | TEXT | Original filename (e.g., `02_salary_slip.pdf`) |
| `classification` | TEXT | Classification: `APPLICATION_FORM`, `SALARY_SLIP`, `BANK_STATEMENT`, `EMPLOYER_DECLARATION`, `UNKNOWN` |
| `classification_confidence` | REAL | Confidence score ($0.0$ to $2.0$) |
| `status` | TEXT | Status: `uploaded`, `quarantined`, `normalised`, `classified` |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.3 Table: `page_manifests`
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Manifest record UUID |
| `document_id` | TEXT REFERENCES `documents(document_id)` | Document ID |
| `page_index` | INTEGER | 0-based page index |
| `image_path` | TEXT | Canonical path to 200 DPI rendered PNG file |
| `width_px` | INTEGER | Rendered pixel width |
| `height_px` | INTEGER | Rendered pixel height |
| `original_width_pt` | REAL | Source PDF width in points |
| `original_height_pt` | REAL | Source PDF height in points |
| `rotation_deg` | REAL | Rotation degrees (default 0) |
| `crop_box` | TEXT | Page bounding crop |
| `transform_hash` | TEXT | Hash of transformation pipeline |
| `sha256` | TEXT | SHA-256 digest of rendered image |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.4 Table: `claims`
Extracted structured assertions from documents.
| Column | Type | Description |
|---|---|---|
| `claim_id` | TEXT PRIMARY KEY | Unique claim UUID |
| `document_id` | TEXT REFERENCES `documents(document_id)` | Source document ID |
| `page_index` | INTEGER | Page number on which claim appears |
| `bbox_norm` | TEXT (JSON Array) | Normalized coords `[x0, y0, x1, y1]` |
| `coordinate_frame` | TEXT | Frame: `normalized_0_1` |
| `field_name` | TEXT | Canonical field name (e.g., `monthly_net_pay`, `gross_salary`, `credit_amount`, `pan_number`) |
| `raw_text` | TEXT | Verbatim extracted string from document (e.g., `"INR 65,000"`) |
| `normalized_value` | TEXT | Parsed value (e.g. integer paise `"6500000"` or normalized uppercase string) |
| `datatype` | TEXT | Data type: `amount_inr`, `date`, `string`, `identifier` |
| `unit` | TEXT | Unit of measurement |
| `currency` | TEXT | Currency code (e.g. `INR`) |
| `valid_period` | TEXT | Applicable temporal period |
| `extractor` | TEXT | Extraction engine: `pdf_text_exact` or `ocr_paddle` |
| `extractor_version` | TEXT | Extractor engine version string |
| `extraction_confidence` | REAL | Extractor confidence ($0.0$ to $1.0$) |
| `alternatives` | TEXT (JSON Array) | Alternative candidate values |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.5 Table: `signals`
Forensic detector outputs (structural anomalies and pixel mutations).
| Column | Type | Description |
|---|---|---|
| `signal_id` | TEXT PRIMARY KEY | Unique signal UUID |
| `document_id` | TEXT REFERENCES `documents(document_id)` | Target document ID |
| `method` | TEXT | Detector: `pdf_revision_detector`, `font_anomaly_detector`, `ela_detector`, `copy_move_detector` |
| `evidence_family` | TEXT | Family: `structural_integrity`, `pixel_integrity`, `compression_artifacts` |
| `region` | TEXT (JSON Array) | Bounding box where anomaly occurs `[x0, y0, x1, y1]` |
| `score` | REAL | Anomaly metric (e.g. font entropy score, ELA mean squared error) |
| `quality_flags` | TEXT (JSON Object) | Diagnostic indicators and confidence flags |
| `limitations` | TEXT (JSON Object) | Detector limitations and environmental flags |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.6 Table: `constraints`
Arithmetic and relational invariants evaluated per document or cross-bundle.
| Column | Type | Description |
|---|---|---|
| `constraint_id` | TEXT PRIMARY KEY | Unique constraint UUID |
| `case_id` | TEXT REFERENCES `cases(case_id)` | Case ID |
| `rule_name` | TEXT | Invariant name (e.g., `intra_payslip_arithmetic`, `intra_mandatory_pan`) |
| `input_claim_ids` | TEXT (JSON Array) | Claim IDs evaluated by rule |
| `expected_relation` | TEXT | Expected algebraic equality or format |
| `residual` | REAL | Measured delta in paise |
| `outcome` | TEXT | Evaluation status: `SATISFIED`, `VIOLATED`, `INDETERMINATE` |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.7 Table: `correlation_edges`
Cross-document semantic matches identified during bundle synthesis.
| Column | Type | Description |
|---|---|---|
| `edge_id` | TEXT PRIMARY KEY | Unique edge UUID |
| `case_id` | TEXT REFERENCES `cases(case_id)` | Case ID |
| `claim_id_a` | TEXT REFERENCES `claims(claim_id)` | Primary claim |
| `claim_id_b` | TEXT REFERENCES `claims(claim_id)` | Correlated claim |
| `relation_type` | TEXT | Semantic link: `ENTITY_MATCH_PAN`, `ENTITY_MATCH_NAME`, `FINANCIAL_COMPARISON_NET_PAY` |
| `match_score` | REAL | Match confidence ($0.0$ to $1.0$) |
| `match_features` | TEXT (JSON Object) | Extracted features used for correlation |
| `time_window_applied` | TEXT | Applied date alignment window |
| `outcome` | TEXT | Correlation outcome |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.8 Table: `hypothesis_tests`
Evaluated Z3 SMT theorem prover models.
| Column | Type | Description |
|---|---|---|
| `hypothesis_id` | TEXT PRIMARY KEY | Unique hypothesis UUID |
| `case_id` | TEXT REFERENCES `cases(case_id)` | Case ID |
| `constraint_id` | TEXT REFERENCES `constraints(constraint_id)` | Underlying constraint |
| `name` | TEXT | Hypothesis: `split_credit`, `posting_delay`, `gross_net_confusion` |
| `assumptions` | TEXT | Formulation assumptions |
| `evidence_used` | TEXT (JSON Array) | Claim IDs ingested into solver |
| `outcome` | TEXT | Outcome: `SUPPORTED` (SAT) or `REJECTED` (UNSAT) |
| `explanation` | TEXT | Plaintext mathematical synthesis |
| `residual_conflict` | REAL | Remaining unexplained monetary delta in paise |
| `solver_version` | TEXT | Solver identifier: `z3-4.14.0` |
| `solver_timeout_ms`| INTEGER | Solver timeout threshold in ms |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.9 Table: `findings`
Final synthesized investigative conclusions presented to the user.
| Column | Type | Description |
|---|---|---|
| `finding_id` | TEXT PRIMARY KEY | Unique finding UUID |
| `case_id` | TEXT REFERENCES `cases(case_id)` | Case ID |
| `status` | TEXT | Classification: `potential_manipulation`, `inconsistency`, `observation`, `reviewer_confirmed`, `reviewer_dismissed`, `under_review` |
| `priority` | TEXT | Priority level: `high_review_priority`, `medium`, `low` |
| `finding_type` | TEXT | Classification tag: `salary_claim_conflict`, `identity_mismatch`, `intra_arithmetic_failure` |
| `witness_claim_ids` | TEXT (JSON Array) | Minimal set of contradictory claim UUIDs |
| `supporting_signal_ids` | TEXT (JSON Array) | Corroborating forensic signal UUIDs |
| `uncertainty_profile` | TEXT (JSON Object) | Residual variance and extractor confidence bounds |
| `review_required` | INTEGER (0 or 1) | Mandatory reviewer flag |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

### 4.10 Table: `review_events`
Cryptographically hash-chained reviewer actions.
| Column | Type | Description |
|---|---|---|
| `review_id` | TEXT PRIMARY KEY | Unique review UUID |
| `finding_id` | TEXT REFERENCES `findings(finding_id)` | Target finding ID |
| `actor` | TEXT | Reviewer callsign (e.g. `reviewer_lead`) |
| `action` | TEXT | Action taken: `accept`, `dismiss`, `annotate` |
| `reason` | TEXT | Mandatory justification text |
| `timestamp` | TEXT | ISO-8601 UTC timestamp |
| `previous_event_hash` | TEXT | SHA-256 hash chaining to previous review record |

### 4.11 Table: `audit_events`
Immutable ledger of all pipeline actions.
| Column | Type | Description |
|---|---|---|
| `event_id` | TEXT PRIMARY KEY | Unique event UUID |
| `event_type` | TEXT | Action: `CASE_CREATED`, `DOC_INGESTED`, `CLAIMS_EXTRACTED`, `HYPOTHESES_COMPLETE`, `FINDINGS_GENERATED`, `REVIEW_ACTION` |
| `object_id` | TEXT | Target entity UUID |
| `timestamp` | TEXT | ISO-8601 UTC timestamp |
| `actor` | TEXT | System worker or reviewer username |
| `payload_hash` | TEXT | SHA-256 digest of event payload |
| `previous_hash` | TEXT | SHA-256 hash of preceding audit ledger entry |

---

## 5. End-to-End Pipeline Workflow (The 5 Beats)

```
[ Upload Files ] 
       │
       ▼
1. INGESTION & QUARANTINE ────────► Compute SHA-256, store in data/originals/
       │
       ▼
2. NORMALISATION & CLASSIFY ─────► Render 200 DPI PNGs, keyword classification
       │
       ▼
3. DUAL-PASS EXTRACTION ─────────► Native PyMuPDF text & PaddleOCR fallback
       │
       ├─────────────────────────► STRUCTURAL FORENSICS (PDF font mutations, revisions)
       ├─────────────────────────► PIXEL FORENSICS (Error Level Analysis, Copy-Move)
       ├─────────────────────────► INTRA-DOCUMENT ARITHMETIC (Gross - Ded = Net)
       │
       ▼
4. CORRELATION & SMT SOLVING ────► Match PAN, Name, Salary across documents
       │                           Z3 SMT Solver tests split_credit, delay, confusion
       │
       ▼
5. SYNTHESIS & REVIEW ───────────► Generate minimal witness set, findings escalation
                                   Cryptographic SHA-256 human review signing
                                   Export court-admissible JSON / PDF dossier
```

### Beat 1: Ingestion, Normalisation & Classification
- **Quarantine Storage**: Files are saved to `data/originals/{case_id}/{doc_id}/original.{ext}`.
- **Normalisation**: PyMuPDF renders page 0 at 200 DPI to `data/derivatives/{case_id}/{doc_id}/pages/page_0000.png`.
- **Classification Engine**: Keywords are matched with weights:
  - `APPLICATION_FORM`: "loan application", "applicant details", "pan"
  - `SALARY_SLIP`: "payslip", "salary slip", "earnings", "net pay", "basic salary"
  - `BANK_STATEMENT`: "account statement", "opening balance", "credit", "transaction date"
  - `EMPLOYER_DECLARATION`: "employer declaration", "form 16", "tds", "salary certificate"

### Beat 2: Structured Claim Extraction
- Ordered regular expressions and coordinate locators in `FIELD_MAP` scan text streams:
  - Exact net pay extraction prioritizes `"monthly net pay"` before `"net pay"` to avoid matching intermediate subheadings.
  - Numbers are parsed into integer paise with `_to_paise()`.
  - Bounding boxes are recorded in normalized `[x0, y0, x1, y1]` coordinates.
- **Crop Endpoint**: `GET /api/claims/{claim_id}/crop` extracts the native 200 DPI PNG crop around the bounding box with 20px padding for real-time visual inspection.

### Beat 3: Forensic Detectors (Structural & Pixel)
1. **PDF Structure & Font Anomaly (`forensics_structural.py`)**:
   - Inspects PDF revision history and trailer dictionaries for incremental updates.
   - Extracts all embedded font families. In authentic documents, font styles are homogeneous. If a numerical field uses a modified Helvetica or synthesized TrueType font distinct from the document baseline, a high-severity `font_anomaly_detector` signal is fired.
2. **Error Level Analysis (`forensics_pixel.py`)**:
   - Resaves page images at 90% JPEG quality and computes pixel delta against original uncompressed render.
   - Tampered regions with different compression artifacts generate distinct mean squared error spikes.
3. **Copy-Move Keypoint Analysis (`forensics_pixel.py`)**:
   - Fast keypoint cluster search identifies duplicated stamps, signatures, or digits.

### Beat 4: Z3 SMT Counterfactual Reasoning (`hypothesis.py`)
TraceDoc translates cross-document verification into a **Theorem Proving Problem**:

#### Model 1: `split_credit`
- **Variables**: Bank credit deposits $c_1, c_2, \dots, c_k \in \mathbb{Z}_{\ge 0}$ and declared salary $S_{\text{declared}} \in \mathbb{Z}_{\ge 0}$.
- **Constraint**:
  $$\sum_{i \in \text{Credits}} c_i == S_{\text{declared}}$$
- **Z3 Formulation**:
  ```python
  from z3 import Solver, Int, sat
  s = Solver()
  declared = Int("declared")
  s.add(declared == declared_paise)
  credits = [Int(f"c_{i}") for i in range(len(credit_amounts))]
  for var, amt in zip(credits, credit_amounts):
      s.add(var == amt)
  s.add(sum(credits) == declared)
  outcome = s.check()  # sat => SUPPORTED, unsat => REJECTED
  ```
- **Result in Clean Bundle**: $4000000 + 2500000 == 6500000 \implies \text{sat}$.
  - Outcome: `SUPPORTED`, residual conflict: ₹0.00. Finding classified as `observation`.
- **Result in Tampered Bundle**: $4000000 + 2500000 == 9500000 \implies \text{unsat}$.
  - Outcome: `REJECTED`, residual conflict: ₹30,000.00. Escalates to `potential_manipulation`.

#### Model 2: `posting_delay`
- Tests if payroll deposit occurred within a 5-day delta of month-end pay date.

#### Model 3: `gross_net_confusion`
- Tests if declared value equals `gross_salary` rather than `net_pay`.

### Beat 5: Synthesis & Finding Escalation
The synthesis worker (`findings.py`) evaluates the combined evidence:
- If `split_credit` is `SUPPORTED`, finding status is set to `observation` (Restraint).
- If all hypotheses are `REJECTED` and forensic signals (font anomaly / ELA) corroborate tampering:
  - Finding status is escalated to `potential_manipulation`.
  - Minimal Contradiction Witness set is assembled: `[claim_payslip_net_pay, claim_bank_credit_1, claim_bank_credit_2]`.
  - `review_required` flag is set to `true`.

---

## 6. Complete REST API Specifications

The FastAPI backend exposes the following endpoints (with CORS enabled for all origins):

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check (`status`, `db`, `ocr`, `solver`, `version`) |
| `GET` | `/api/cases` | List all investigation cases ordered by `created_at DESC` |
| `POST` | `/api/cases` | Create a new blank investigation case |
| `POST` | `/api/cases/demo` | 1-Click demo runner (`bundle_type`: `"clean"` or `"tampered"`) |
| `GET` | `/api/cases/{case_id}` | Fetch case details |
| `GET` | `/api/cases/{case_id}/status` | Poll asynchronous pipeline stages (`upload`, `normalised`, `extracted`, `forensics`, `hypothesis`, `findings`) |
| `POST` | `/api/cases/{case_id}/documents` | Multipart file upload; queues normalization and classification |
| `GET` | `/api/cases/{case_id}/documents` | List all documents belonging to a case |
| `GET` | `/api/documents/{doc_id}/pages/{page_idx}` | Retrieve 200 DPI rendered page PNG image |
| `POST` | `/api/cases/{case_id}/documents/{doc_id}/classify` | Manual classification override |
| `POST` | `/api/cases/{case_id}/analyze` | Trigger asynchronous pipeline execution |
| `GET` | `/api/cases/{case_id}/claims` | Retrieve all extracted claims with normalized bounding boxes |
| `GET` | `/api/claims/{claim_id}/crop` | Return native high-resolution 200 DPI PNG crop of field |
| `GET` | `/api/cases/{case_id}/signals` | Retrieve all forensic signals (ELA, font anomalies) |
| `GET` | `/api/cases/{case_id}/hypotheses` | Retrieve all evaluated Z3 SMT hypothesis outcomes |
| `GET` | `/api/cases/{case_id}/findings` | Retrieve synthesized findings and minimal witness sets |
| `GET` | `/api/findings/{finding_id}/evidence` | Return full evidence subgraph and witness claims |
| `POST` | `/api/findings/{finding_id}/review` | Commit reviewer signature with SHA-256 hash chaining |
| `GET` | `/api/findings/{finding_id}/review/history` | Retrieve complete hash-chained audit history of reviews |
| `GET` | `/api/cases/{case_id}/audit` | Retrieve full immutable audit trail for case |
| `GET` | `/api/cases/{case_id}/graph` | Export NetworkX multi-layer evidence graph (node-link JSON) |
| `GET` | `/api/cases/{case_id}/dossier` | Export court-admissible dossier (`?format=json` or `?format=pdf`) |
| `GET` | `/report/{case_id}` | Server-rendered HTML forensic workbench template |

---

## 7. Frontend Architecture (`frontend/`)

The frontend is an ultra-modern React application built with TypeScript, Vite, and Tailwind CSS v4, combining high aesthetic design with forensic precision.

### 7.1 Visual & Interactive Design Language
- **Palette**: Obsidian & Midnight Slate base (`#06080d`, `#0b1120`, `#0f172a`), Cyan Laser (`#00f0ff`, `#38bdf8`), Laser Emerald (`#10b981`), Ruby Contradiction Alert (`#f43f5e`), and Amber Warning (`#f59e0b`).
- **Typography**: Inter (UI prose) paired with JetBrains Mono (cryptographic hashes, coordinates, Z3 solver logic, monetary amounts).
- **Glassmorphism**: High-specular blur panels with subtle cyan glow borders (`backdrop-filter: blur(16px)`).

### 7.2 Component Directory & Responsibilities
1. **`App.tsx`**:
   - Initializes **Lenis smooth scrolling** tied to browser `requestAnimationFrame`.
   - Manages global state (`currentCaseId`, `cases`, `health`, `currentView`, `demoBanner`).
   - Renders Haikei-inspired ambient glowing background vector geometry.
2. **`ThreeForensicCanvas.tsx`**:
   - Built on Three.js, rendering an interactive 3D holographic evidence core:
     - Outer wireframe icosahedron representing SMT constraints.
     - Glowing inner pulsing singularity representing solver truth state.
     - 2 concentric orbiting tori.
     - 220+ floating particle swarm representing extracted claims.
     - Smooth mouse-reactive parallax tilt and camera rotation.
     - Mode switcher: *SMT Core* (cyan/blue), *Contradiction* (ruby/amber), *Lattice* (emerald).
3. **`ForensicScanEffect.tsx`**:
   - Anime.js v4-driven laser scanline sweep animation (`ForensicScanline`).
   - Dynamic easing number counter (`AnimatedCounter`) for amounts and telemetry counters.
4. **`Navbar.tsx`**:
   - System health status pill (real-time polling `/health` for FastAPI, SQLite, PyMuPDF, Z3 Solver).
   - Case quick switcher dropdown.
   - Instant 1-Click Clean Demo & Tampered Demo trigger buttons.
   - Dossier export and New Case modal triggers.
5. **`DashboardView.tsx`**:
   - Command center hero with dual action cards:
     - Beat 1 (Clean Bundle): Demonstrates Restraint.
     - Beat 2 (Tampered Bundle): Demonstrates Escalation.
   - Telemetry cards: Active investigations, SMT engine status, mutation detectors, and SHA-256 Merkle root.
   - Real-time case feed grid.
6. **`CaseStudioView.tsx`**:
   - **Evidence Shelf**: Document listing with SHA-256 checksums, classification tags, and drag-and-drop PDF uploader.
   - **Document Viewer Stage**: Renders 200 DPI page images with interactive SVG/Canvas bounding box overlays. Hovering shows field values; clicking opens the high-res crop.
   - **Forensic Signals Tab**: Displays pixel and font anomalies with detector scores.
   - **Z3 Counterfactual Matrix**: Lists solver outcomes (SUPPORTED/REJECTED) and residual discrepancies.
   - **Minimal Contradiction Witness Card**: Highlights the exact conflicting claims with high-res PNG crops.
7. **`ReviewDrawer.tsx`**:
   - Slide-in drawer with action picker (`Confirm`, `Dismiss`, `Annotate`) and mandatory justification text.
   - Commits review to `POST /api/findings/{id}/review`.
   - Displays real-time SHA-256 hash chaining.
   - Triggers celebratory confetti (`canvas-confetti`) upon signature commitment.
8. **`DossierModal.tsx`**:
   - Displays formatted JSON evidence tree with copy button.
   - 1-Click download trigger for the court-admissible ReportLab PDF dossier.
9. **`NewCaseModal.tsx`**:
   - Modal for creating custom cases and uploading multi-file document bundles.

---

## 8. Synthetic Bundles & Ground Truth Validation

The test suite and demonstration rely on two synthetic bundles generated via ReportLab in `data/synthetic/`:

### 8.1 Clean Bundle (`data/synthetic/clean_bundle/`)
- **Documents**:
  1. `01_application_form.pdf`: Declares applicant Rohan Mehta, monthly salary ₹65,000.
  2. `02_salary_slip.pdf`: Basic ₹40,000 + HRA ₹25,000 = Gross ₹65,000, Net Pay ₹65,000. Clean fonts, single revision.
  3. `03_bank_statement.pdf`: Two distinct credit deposits in same month: ₹40,000 (transfer 1) and ₹25,000 (transfer 2). Total = ₹65,000.
  4. `04_employer_declaration.pdf`: Declares ₹65,000 salary paid.
- **Expected Pipeline Behavior**:
  - `split_credit` hypothesis is **SUPPORTED** ($40,000 + 25,000 == 65,000$).
  - Zero residual conflict.
  - Case classified as `observation` (Mathematical Restraint: zero false escalation).

### 8.2 Tampered Bundle (`data/synthetic/tampered_bundle/`)
- **Documents**:
  1. `01_application_form.pdf`: Declares monthly salary ₹65,000 (or ₹95,000).
  2. `02_salary_slip.pdf`: Forged net pay altered to **₹95,000**. Font analysis flags non-standard font substitution in numerical stream; intra-arithmetic rule detects basic + HRA $\ne$ net pay.
  3. `03_bank_statement.pdf`: Bank deposits remain authentic ₹40,000 + ₹25,000 = ₹65,000.
  4. `04_employer_declaration.pdf`: Declares authentic ₹65,000.
- **Expected Pipeline Behavior**:
  - All counterfactual hypotheses are **REJECTED** ($40,000 + 25,000 \ne 95,000$).
  - Residual conflict calculated: **₹30,000.00**.
  - Font anomaly signal corroborates tampering.
  - Escalates to `potential_manipulation`.
  - Minimal Contradiction Witness set produced: Payslip ₹95,000 vs Bank credits ₹65,000.

---

## 9. Comprehensive Terminal Commands Guide

Follow these exact commands to set up, test, and run the entire TraceDoc CEIE platform:

### 9.1 Environment & Python Dependencies
```powershell
# 1. Navigate to project root
cd "c:\Users\anike\OneDrive\Desktop\HACKATHONS\Data-ops"

# 2. Install backend dependencies (if needed)
pip install fastapi uvicorn aiosqlite pydantic pymupdf z3-solver pillow reportlab networkx pytest httpx
```

### 9.2 Frontend Setup & Dependencies
```powershell
# Navigate to frontend and install npm packages
cd "c:\Users\anike\OneDrive\Desktop\HACKATHONS\Data-ops\frontend"
npm install
```

### 9.3 Run Backend End-to-End Automated Tests
```powershell
# From project root, run the comprehensive pytest suite (4 tests)
cd "c:\Users\anike\OneDrive\Desktop\HACKATHONS\Data-ops"
python -m pytest backend/tests/test_e2e.py -v
```
*Expected Output: `4 passed in ~5-10s` (verifies health, corrupt file rejection, clean bundle restraint, and tampered bundle escalation).*

### 9.4 Run the 5-Beat Interactive CLI Demonstration
```powershell
# From project root, run the judge demonstration runner
cd "c:\Users\anike\OneDrive\Desktop\HACKATHONS\Data-ops"
python run_demo.py
```
*This executes the 5 beats: Ingestion, Dual-pass extraction, SMT Counterfactual solving, Review hash chaining, and Dossier compilation.*

### 9.5 Start the Full Stack (Backend + Frontend)

#### Terminal 1 — Start FastAPI Backend Server
```powershell
cd "c:\Users\anike\OneDrive\Desktop\HACKATHONS\Data-ops"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload
```
*Backend runs at `http://127.0.0.1:8000`. Swagger API docs available at `http://127.0.0.1:8000/docs`.*

#### Terminal 2 — Start Vite React Frontend
```powershell
cd "c:\Users\anike\OneDrive\Desktop\HACKATHONS\Data-ops\frontend"
npm run dev -- --host 127.0.0.1 --port 5173
```
*Frontend runs at `http://127.0.0.1:5173` with proxying configured to the backend.*

### 9.6 Verify Systems via Command Line
```powershell
# Health check
curl.exe -s http://127.0.0.1:8000/health

# List active cases
curl.exe -s http://127.0.0.1:8000/api/cases

# Trigger 1-Click Clean Demo via API
curl.exe -s -X POST http://127.0.0.1:8000/api/cases/demo -H "Content-Type: application/json" -d '{"bundle_type":"clean"}'

# Trigger 1-Click Tampered Demo via API
curl.exe -s -X POST http://127.0.0.1:8000/api/cases/demo -H "Content-Type: application/json" -d '{"bundle_type":"tampered"}'
```

---

## 10. Official Hackathon Problem Statement (PS-2) Alignment Matrix

This section establishes complete compliance with every section of the official Hackathon specification (**`PS-2.pdf`**: *AI-Powered Document Forensics and Contextual Intelligence System*).

### 10.1 100-Point Judging Criteria Alignment (PS-2 Section 11)

| Criterion | Max Points | What Judges Assess | TraceDoc CEIE Implementation & Competitive Advantage |
|---|:---:|---|---|
| **OCR & Information Extraction** | **15** | Accuracy, reliability, and structured extraction of document information | Dual-pass extraction (native PyMuPDF text stream + PaddleOCR fallback), ordered precedence mapping (e.g. `monthly net pay` before `net pay`), integer paise standard, and normalized bounding box preservation. |
| **Document Understanding** | **15** | Interpretation of document layouts, fields, and relationships | 200 DPI page manifests, hierarchical field mapping, coordinate preservation, and multi-document container bindings. |
| **Visual Forensic Analysis** | **15** | Identification of suspicious modifications and visual inconsistencies | Structural PDF revision tracking, TrueType/Type1 font anomaly entropy detection, Error Level Analysis (90% resave compression delta), and copy-move keypoint cluster search. |
| **Contextual Intelligence** | **20** | Identification of contextual discrepancies and cross-document inconsistencies | **Z3 SMT Theorem Proving**: Formulates counterfactual models (`split_credit`, `posting_delay`, `gross_net_confusion`) to mathematically reconcile split deposits or isolate true tampering. |
| **Evidence & Traceability** | **10** | Ability to associate findings with original document evidence | Minimal Contradiction Witness sets, normalized `[x0, y0, x1, y1]` coordinates, and high-resolution 200 DPI PNG crop endpoint (`/api/claims/{id}/crop`). |
| **AI Reasoning & Explainability** | **10** | Quality of investigation explanations and anomaly reasoning | Formally proven SAT/UNSAT proofs with exact residual discrepancy amounts (e.g. ₹30,000.00), zero hallucinated explanations. |
| **Technical Implementation** | **10** | Architecture, integration, functionality, and robustness | Modular FastAPI backend, SQLite ledger, automated pytest suite (4 passing), and React 19 + Three.js 3D frontend. |
| **Innovation** | **5** | Novelty and practical applicability of proposed solution | Eliminating false rejections via **mathematical restraint** + tamper-evident SHA-256 Merkle hash chaining for human reviewer oversight. |
| **TOTAL** | **100** | | **Full 100/100 points coverage** |

### 10.2 Mandatory Working Prototype vs. Advanced Extensions (PS-2 Section 6)

| Prototype Tier | Required Feature | Status in TraceDoc | Implementation Details |
|---|---|:---:|---|
| **Mandatory** | Document ingestion & OCR extraction | **COMPLETE** | PyMuPDF + PaddleOCR dual engine |
| **Mandatory** | Structured extraction across multiple docs | **COMPLETE** | SQLite `claims` table with integer paise |
| **Mandatory** | Suspicious regions & visual inconsistencies | **COMPLETE** | Font anomaly detector + ELA detector |
| **Mandatory** | Intra- and cross-document inconsistencies | **COMPLETE** | `rules_intra.py` + `correlation.py` |
| **Mandatory** | Evidence mapping to original locations | **COMPLETE** | Normalized BBoxes + native PNG crop API |
| **Mandatory** | Structured investigation dossier | **COMPLETE** | Automated JSON & ReportLab PDF generation |
| **Mandatory** | Review interface for findings | **COMPLETE** | React 3D studio + fallback HTML workbench |
| **Advanced / Bonus** | Advanced document classification | **COMPLETE** | Confidence-weighted multi-keyword classifier with override |
| **Advanced / Bonus** | Handwritten text recognition | **COMPLETE** | PaddleOCR architecture integration |
| **Advanced / Bonus** | Advanced image forensics | **COMPLETE** | Error Level Analysis + Copy-Move keypoints |
| **Advanced / Bonus** | Cross-document relationship discovery | **COMPLETE** | NetworkX multi-layer evidence graph builder |
| **Advanced / Bonus** | Advanced contextual reasoning | **COMPLETE** | Z3 SMT Solver counterfactual hypothesis models |
| **Advanced / Bonus** | Interactive evidence exploration | **COMPLETE** | Three.js 3D evidence core + hover BBox inspector |
| **Advanced / Bonus** | Advanced audit workflows | **COMPLETE** | SHA-256 hash-chained human reviewer terminal |

### 10.3 Required Dossier Sections Alignment (PS-2 Section 7)

TraceDoc's [`dossier.py`](file:///c:/Users/anike/OneDrive/Desktop/HACKATHONS/Data-ops/backend/app/workers/dossier.py) generates structured dossiers containing the exact sections specified in Section 7 of the problem statement:
- **7.1 Document Overview**: Document identification, classifications, SHA-256 manifests, and page counts.
- **7.2 Extracted Information**: Structured fields, normalized values, confidence scores, and document anchors.
- **7.3 Contextual Analysis**: Evaluated SMT hypotheses (`split_credit`, `posting_delay`, `gross_net_confusion`) and cross-document discrepancy list.
- **7.4 Visual Forensic Findings**: PDF revisions, font entropy scores, and Error Level Analysis metrics.
- **7.5 Evidence and Traceability**: Minimal Contradiction Witness claims, normalized bounding boxes, and reviewer audit actions.
- **7.6 Investigation Summary**: Overall synthesis (`POTENTIAL_MANIPULATION` vs `OBSERVATION`), international standards compliance, system limitations, and root SHA-256 integrity hash.

### 10.4 International Standards Compliance (PS-2 Section 8)
- **ISO/IEC 27037**: Guidelines for identification, collection, acquisition, and preservation of digital evidence.
- **ISO/IEC 27041 / 27042**: Assurance of investigative methods suitability and digital evidence interpretation.
- **NIST SP 800-86**: Forensic techniques in incident response.
- **OWASP ML Security Top 10**: Robustness and explainability considerations.

### 10.5 Judges' Live Demonstration Checklist (PS-2 Section 10)
All 12 items on the evaluation checklist are verifiable via `python run_demo.py` and the React frontend:
1. Multi-document upload & ingestion.
2. Classification & OCR information extraction.
3. Structured conversion preserving document relations.
4. Identification & highlighting of suspicious regions (red bounding boxes).
5. Inconsistencies within individual documents.
6. Cross-document comparison & conflict identification.
7. Evidence graph relationship mapping.
8. Inspection of forensic evidence supporting anomalies.
9. Final investigation dossier export (JSON & PDF).
10. Tracing findings back to original document locations.
11. **Distinguishing potential anomalies from confirmed observations**:
    - Clean Bundle: Split credits ($40\text{k} + 25\text{k} == 65\text{k}$) $\implies$ Z3 SAT $\implies$ Classified as `OBSERVATION` (Restraint).
    - Tampered Bundle: Tampered payslip ($40\text{k} + 25\text{k} \ne 95\text{k}$) $\implies$ Z3 UNSAT (Residual ₹30k) + Font Anomaly $\implies$ Classified as `POTENTIAL_MANIPULATION` (Escalation).
12. Safe failure handling on corrupted files (HTTP 422 with audit logging).

---

## 11. Summary for Future LLMs

When interacting with this codebase:
- **Never store financial amounts in floating-point numbers**; always use integer paise (`1 INR = 100 paise`).
- **Never bypass the Z3 SMT constraint formulation**; restraint must always be tested before escalating any finding.
- **Never remove SHA-256 hash chaining**; every review event and audit event must link cryptographically to the prior event digest.
- **Backend files live in `backend/app/`**; use `open_db()` context manager with `aiosqlite.Row` for SQLite operations.
- **Frontend files live in `frontend/src/`**; all API interactions route through `frontend/src/api.ts`.
