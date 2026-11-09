# TraceDoc CEIE — Pre-Delivery Verification Checklist

- [ ] **No Emojis as Icons**: Strictly inline SVGs (Lucide React or custom inline SVGs).
- [ ] **Interactive Elements**: Every interactive element uses a semantic `<button>`, `<a>`, or `<input>` with `cursor-pointer`.
- [ ] **Focus Rings**: All focusable elements have a visible `2px` lime focus ring with `2px` offset.
- [ ] **Text Contrast**: Text on `#07090c` and panels `#0e1218` achieves at least 4.5:1 contrast (WCAG AA).
- [ ] **Tabular Numerals**: Financial amounts, hashes, solver formulas, and bounding boxes use `JetBrains Mono` with `tabular-nums`.
- [ ] **Motion Sensitivity**: `@media (prefers-reduced-motion: reduce)` respected:
  - Laser sweep pauses.
  - Floating parallax turns static.
  - Kinetic counter displays final value immediately.
  - Draggable trial split remains interactive.
- [ ] **Responsive Breakpoints**: Verified at 1440x900 (desktop autopsy stage) and 390x844 (mobile stack).
- [ ] **Restraint vs Escalation**:
  - Clean bundle strictly shows `Observation` (Z3 SAT).
  - Tampered bundle strictly shows `Potential manipulation` (Z3 UNSAT, ₹30,000 residual).
- [ ] **No Div Buttons**: Zero `<div>` with `onClick` without proper role and keyboard handlers.
- [ ] **Zero Console Errors**: Clean compilation under TypeScript strict with `npm run build`.
