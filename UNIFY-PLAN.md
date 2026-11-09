# Workbench Unification Plan (UNIFY-PLAN.md)

## 1. Executive Summary & Audit Findings

### A. Inventory of Existing UI Primitives & Vendor Components
| Path | Category | Status in Codebase |
| :--- | :--- | :--- |
| `src/ui/Btn.tsx` | UI Primitive | Exists (variants: default, lime, ruby, outline, ghost) |
| `src/ui/Chip.tsx` | UI Primitive | Exists (variants: default, lime, ruby, cyan, amber) |
| `src/ui/Kicker.tsx` | UI Primitive | Exists (JetBrains Mono tracking-widest uppercase tag) |
| `src/ui/MoneyText.tsx` | UI Primitive | Exists (tabular integer paise to INR formatter) |
| `src/ui/PaperSheet.tsx` | UI Primitive | Exists (textured paper background for legal specimen) |
| `src/ui/StatusLadder.tsx` | UI Primitive | Exists (4-step status progression ladder) |
| `src/ui/VerdictChip.tsx` | UI Primitive | Exists (SAT / UNSAT verdict badge) |
| `src/ui/interactions/EvidenceCursor.tsx` | Interaction | Exists (custom crosshair cursor) |
| `src/ui/interactions/HashTicker.tsx` | Interaction | Exists (cryptographic hash animation) |
| `src/ui/interactions/MagneticButton.tsx` | Interaction | Exists (magnetic cursor snap) |
| `src/ui/interactions/PaperGrain.tsx` | Interaction | Exists (subtle SVG noise texture overlay) |
| `src/ui/vendor/Accordion.tsx` | Vendor Component | Exists (collapsible disclosure) |
| `src/ui/vendor/AnimatedNumber.tsx` | Vendor Component | Exists (tabular counting numbers) |
| `src/ui/vendor/CommandPalette.tsx` | Vendor Component | Exists (Ctrl+K palette) |
| `src/ui/vendor/Dialog.tsx` | Vendor Component | Exists (accessible modal dialog) |
| `src/ui/vendor/Drawer.tsx` | Vendor Component | Exists (accessible slide-over drawer) |
| `src/ui/vendor/ScrambleText.tsx` | Vendor Component | Exists (matrix text decoding effect) |
| `src/ui/vendor/SpotlightPanel.tsx` | Vendor Component | Exists (mouse spotlight glow panel) |
| `src/ui/vendor/Tabs.tsx` | Vendor Component | Exists (tabbed navigation) |
| `src/ui/vendor/Tooltip.tsx` | Vendor Component | Exists (accessible hover tooltip) |

### B. Raw Palette & Hex Color Audit
- `components/CaseStudioView.tsx`: 102 lines with raw Tailwind palette classes (`slate-*`, `cyan-*`, `rose-*`, `emerald-*`, `amber-*`, `indigo-*`) and raw hex.
- `story/scenes/StudioScene.tsx`: 40 lines with raw palette or hex.
- `components/ReviewDrawer.tsx`: 32 lines with raw palette or hex.
- `components/DossierModal.tsx`: 12 lines with raw palette or hex.
- `components/ThreeForensicCanvas.tsx`: 13 lines with raw palette or hex.
- `components/ForensicScanEffect.tsx`: 1 line.
- `components/DashboardView.tsx`: 47 lines with raw palette or hex.
- `components/Navbar.tsx`: 19 lines with raw palette or hex.

### C. Banned Copy Audit (Strings: fraud, forgery, forged, court, admissible, adhering, compliant, confetti)
- `App.tsx:232`: `"Export Court Investigation Dossier"` $\to$ `"Export Investigation Dossier"`
- `components/DashboardView.tsx:67`: `"financial fraud"` $\to$ `"unreconciled discrepancies"`
- `components/DashboardView.tsx:110`: `"Payslip forged to INR 95k"` $\to$ `"Payslip tampered to INR 95k"`
- `components/DossierModal.tsx:62`: `"Court-Admissible Investigation Dossier"` $\to$ `"Certified Investigation Dossier"`
- `components/NewCaseModal.tsx:84`: `"AP Fraud"` $\to$ `"Discrepancy Analysis"`
- `components/ReviewDrawer.tsx:3,61,62`: `confetti` from `canvas-confetti` $\to$ Stamped seal animation with chain pulse
- `components/ReviewDrawer.tsx:190`: `"court-admissible justification"` $\to$ `"investigator justification"`
- `story/scenes/LayersScene.tsx:50`: `"A forgery has to lie"` $\to$ `"An alteration has to lie"`
- `story/scenes/SealScene.tsx:128,170,252`: `"court-admissible"`, `"ISO/IEC 27037 COURT SPECIFICATION"`, `"Court Dossier"` $\to$ `"investigator justification"`, `"ISO/IEC 27037 PRINCIPLES SPECIFICATION"`, `"Signed Investigation Dossier"`
- `story/scenes/SpecimenScene.tsx:71,85,101,171`: `"One forged"`, `"Dissect the forged slip"`, `"The Forgery"`, `"Forged Row"` $\to$ `"tampered"` terminology.

### D. Comparison: StudioScene vs CaseStudioView
- **StudioScene:** Static preview with hardcoded values, static simulated loupe, and no live data binding.
- **CaseStudioView:** Full dynamic view with live API binding, but uses floating rounded glass cards (`max-w-7xl rounded-2xl .glass-panel`), off-token colors, and lacks pan/zoom and live loupe.
- **Unification Target:** Extract all interactive blocks into `src/workbench/` shared components accepting `mode: "preview" | "full"`. `StudioScene` mounts the exact same components in `"preview"` mode, while `CaseStudioView` mounts them in `"full"` mode inside `WorkbenchShell`.

---

## 2. Target Component Architecture (`src/workbench/`)

| Component Name | File | Role & Props | Differences in `preview` vs `full` |
| :--- | :--- | :--- | :--- |
| `WorkbenchShell` | `src/workbench/WorkbenchShell.tsx` | Resizable docked shell (HUD, left dock, center stage, right dock, bottom audit) | Full only. Used as the frame for `#/studio`. |
| `EvidenceShelf` | `src/workbench/EvidenceShelf.tsx` | Document list & upload dropzone | In preview: read-only list. In full: clickable selection + dropzone upload. |
| `DocumentCard` | `src/workbench/DocumentCard.tsx` | Individual file item with SHA-256 chip and status dot | Same visuals; hover/click active in full. |
| `ProvenanceCard` | `src/workbench/ProvenanceCard.tsx` | MIME type, page count, classifier confidence, copyable SHA-256 | Same visuals; copy button interactive in both. |
| `DocumentStage` | `src/workbench/DocumentStage.tsx` | Rendered 200 DPI canvas, pan/zoom, layer overlays, reticle boxes, live loupe | In preview: fixed scale with simulated/static focus. In full: pan/zoom (0.5x-4x), live tracking loupe, keyboard roving focus. |
| `ClaimBox` | `src/workbench/ClaimBox.tsx` | Individual reticle bounding box with 10px corner brackets | In preview: static highlight. In full: accessible `<button>` with roving focus, hover tags, and click selection. |
| `WitnessPanel` | `src/workbench/WitnessPanel.tsx` | Minimal contradiction witness claims | Same visual style; in full: click focuses claim on canvas. |
| `ResidualCallout` | `src/workbench/ResidualCallout.tsx` | Large serif residual amount with count-up animation | Same visual style; in preview: static counter. In full: dynamic count-up on load. |
| `HypothesisMatrix` | `src/workbench/HypothesisMatrix.tsx` | Z3 counterfactual accordions (SUPPORTED / REJECTED) | In preview: compact list. In full: interactive disclosure accordions with sequential reveal. |
| `SignalList` | `src/workbench/SignalList.tsx` | Multi-strata signal cards (ELA, baseline, DOM) | In preview: compact chips. In full: expandable metadata with "Show on page" button. |
| `CropPreview` | `src/workbench/CropPreview.tsx` | Native 200 DPI PNG crop image with field metadata | Same visual component. |
| `AuditChain` | `src/workbench/AuditChain.tsx` | Cryptographic SHA-256 event chain dock | In preview: horizontal chain strip. In full: collapsible dock with in-browser chain re-verification (`crypto.subtle`). |
| `StatusPill` | `src/workbench/StatusPill.tsx` | Standardized status chip using `statusStyles` | Identical in both. |
| `Inspector` | `src/workbench/Inspector.tsx` | Right dock container grouping Witness, Residual, Hypotheses, Crop, and Review CTA | In preview: embedded column in Scene 4. In full: resizable collapsible dock. |
| `ContradictionCompare` | `src/workbench/ContradictionCompare.tsx` | Split-stage side-by-side comparison with dynamic SVG Bezier laser bridge | Full mode only when $\ge 2$ witness claims exist across documents. |

---

## 3. Implementation Phases & Verification Checklist

- [ ] **Phase 1: Audit & Map** (Done with this document).
- [ ] **Phase 2: Extract & Purge**
  - Implement `src/lib/bbox.ts` (`bboxToCss`) with unit tests.
  - Implement `src/lib/statusStyles.ts` with exhaustive status mapping and token colors.
  - Implement `src/data/useCaseData.ts` with parallel loading, polling backoff, and sample fallback.
  - Create all `src/workbench/*` shared components.
  - Purge raw palette classes and replace with theme tokens.
- [ ] **Phase 3: Workbench Shell**
  - Build `WorkbenchShell.tsx` (44px HUD, resizable docks, CSS variable grid, view transitions).
- [ ] **Phase 4: Document Canvas**
  - Pan/zoom (0.5x to 4x), layer chips, reticle boxes with corner brackets, coordinate readout, and live loupe.
- [ ] **Phase 5: Inspector**
  - Right dock with count-up residual, accordion Z3 matrix, crop preview, and "Open reviewer" button.
- [ ] **Phase 6: Contradiction Compare Mode**
  - Side-by-side document comparison with animated SVG Bezier laser line and residual callout.
- [ ] **Phase 7: Analyze Experience**
  - Instrumented laser scanline, HUD stage pill pulses, develop reveal animation, and accessible announcements.
- [ ] **Phase 8: Seal and Dossier**
  - Vendor drawer integration, remove confetti, implement double-ring stamped seal and chain pulse.
- [ ] **Phase 9: Layers Tab & Evidence Core**
  - Exploded 4-strata layer viewer with real signals + WebGL ThreeForensicCanvas unmount safety.
- [ ] **Phase 10: Story & Studio Continuity**
  - Unified HUD component for both story and studio, Scene 4 using shared workbench components, Case Library restyle.
- [ ] **Phase 11: Signature Polish**
  - SpotlightPanel, PaperGrain, ScrambleReveal, MagneticButton, optical grid alignment.
- [ ] **Phase 12: Hardening & QA**
  - Zero raw palette classes, zero banned copy terms, zero confetti, unit tests passing, production build green.

