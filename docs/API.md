# VeriStrata CEIE — Complete API Specification
**Version:** 1.1.0  
**Base URL:** `http://localhost:8000`  
**OpenAPI Specification:** `http://localhost:8000/docs` (`/openapi.json`)

All monetary parameters are expressed in **integer paise** ($1\text{ INR} = 100\text{ paise}$) to avoid floating-point rounding errors.

---

## 1. System & Health

| Method | Endpoint | Description | Response Model |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health check (DB, OCR, Z3 SMT solver) | `HealthOut` |
| `GET` | `/` | API status and version metadata | `dict` |

---

## 2. Case Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/cases` | Create a new investigation case container |
| `GET` | `/api/cases` | List all cases with status and timestamps |
| `GET` | `/api/cases/{case_id}` | Retrieve single case metadata |
| `POST` | `/api/cases/demo` | Seed and run a complete demo case (`clean` or `tampered`) |
| `POST` | `/api/cases/{case_id}/analyze` | Trigger asynchronous 4-strata forensic analysis |
| `GET` | `/api/cases/{case_id}/status` | Poll asynchronous pipeline execution status |

---

## 3. Documents & Evidence Imaging

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/cases/{case_id}/documents` | Upload PDF/image file into quarantine storage |
| `GET` | `/api/cases/{case_id}/documents` | List all documents belonging to a case |
| `POST` | `/api/cases/{case_id}/documents/{document_id}/classify` | Trigger document classification |
| `GET` | `/api/documents/{document_id}/pages/{page_index}` | High-resolution 200 DPI PNG page rendering |
| `GET` | `/api/claims/{claim_id}/crop` | High-resolution PNG image crop of specific bounding box |

---

## 4. Extraction & Forensic Telemetry

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cases/{case_id}/claims` | Retrieve extracted claims with normalized integer values and bounding boxes |
| `GET` | `/api/cases/{case_id}/signals` | Forensic signals across Strata 1 (DOM), Strata 2 (Pixel ELA), and Strata 3 (Typo) |
| `GET` | `/api/cases/{case_id}/hypotheses` | Z3 SMT theorem proving outcomes ($H_{split}$, $H_{delay}$, $H_{gross}$) |
| `GET` | `/api/cases/{case_id}/graph` | NetworkX bipartite contradiction and evidence graph |
| `GET` | `/api/cases/{case_id}/findings` | Synthesized findings with status (`Observation`, `Potential Manipulation`) |
| `GET` | `/api/findings/{finding_id}/evidence` | Forensic witness claims and telemetry for a specific finding |

---

## 5. Review Oversight & Cryptographic Audit

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/findings/{finding_id}/review` | Record human investigator review action (`accept`, `dismiss`) with justification |
| `GET` | `/api/findings/{finding_id}/review/history` | Historical review logs for a finding |
| `GET` | `/api/cases/{case_id}/audit` | Immutable ISO/IEC 27037 audit ledger with SHA-256 previous-event hash chain |
| `GET` | `/api/cases/{case_id}/dossier` | Generate certified investigation dossier (`format=pdf` or `format=json`) |

---

## 6. HTML Workbench Views

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/report/{case_id}` | Standalone server-rendered HTML forensic report |
| `GET` | `/cases/{case_id}/workbench` | Alternate route for server-rendered investigation workbench |
