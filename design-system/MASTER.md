# TraceDoc CEIE — Design System Master

## 1. Product Identity: "The Autopsy Table"
TraceDoc CEIE is a document-forensics investigation workbench for institutional finance and banking.
Visual theme: One forged salary slip sits in a dark, quiet void and is forensically dissected as the user scrolls. Editorial, scientific, calm authority, high signal-to-noise. Not generic neon sci-fi.

## 2. Core Color Palette
- **Ground (Base background)**: `#07090c` (deep neutral obsidian void)
- **Panel**: `#0e1218` (workbench cards and shelves)
- **Panel-2**: `#151b24` (elevated cards, floating overlays)
- **Line**: `#1f2733` (subtle structural divider hairlines)
- **Line-strong**: `#3a4757` (high-contrast active card borders, sheet edges)
- **Text**: `#e8e6df` (high-contrast bone-white primary typography)
- **Muted**: `#aab4c2` (supporting explanations and labels)
- **Dim**: `#8e98a6` (sub-captions, timestamps, kickers)
- **Paper**: `#e9e4d4` (warm tactile document specimen sheet)
- **Ink**: `#14120d` (document typography on paper)

### Semantic Functional Accents (Strict Role-Based Usage)
- **Lime**: `#c6f432`
  * Role: Z3 SAT outcome, mathematical restraint, verified observation, primary CTA button.
  * *Never used decoratively.*
- **Ruby**: `#ff4d6a`
  * Role: Z3 UNSAT contradiction, residual delta, potential manipulation alert.
  * *Never used decoratively.*
- **Ruby-Text**: `#ff8da0` (accessible readable red for dark backgrounds)
- **Cyan**: `#5ce1e6`
  * Role: 200 DPI scan laser sweep line and precision Loupe cursor only.
- **Amber**: `#f5a524`
  * Role: Inconsistency warning and quarantine review states.

## 3. Typography
- **Display**: `Instrument Serif` (Google Fonts: 400, 400 italic).
  * Rule: Use italics for exactly one emphasized phrase per heading (e.g. *"Cross-examine them."*).
- **Interface**: `Inter Tight` (Google Fonts: 400, 500, 600, 700).
- **Data & Forensics**: `JetBrains Mono` (Google Fonts: 400, 500, 600).
  * Rule: Strict tabular numerals (`tabular-nums`) for currency amounts, coordinates, hashes, and solver outputs.

## 4. Spacing, Radii & Easing
- **Radius**: `14px` (panels, dialogs, drawers), `999px` (pills, badges), `6px` (paper specimen sheets).
- **Focus Ring**: `2px solid #c6f432`, `2px` offset (`#07090c`).
- **Easing**: `cubic-bezier(.22, 1, .36, 1)`.
- **Durations**: Micro (160ms), Standard (420ms), Scene (900ms).

## 5. Status Vocabulary Rules
Never use colloquial words like "fraud", "scam", or "fake" in the system interface.
Allowed status categories:
1. `Observation` (Green / Lime): Legitimately reconciled (e.g. split payroll credits sum to declared salary).
2. `Inconsistency` (Amber): Intra-document calculation anomaly or missing non-critical declaration.
3. `Potential manipulation` (Ruby): Unresolved mathematical contradiction verified across multiple witness claims and corroborated by forensic detector signals.
4. `Reviewer-confirmed` (Sealed): Signed and sealed by human investigator into SHA-256 hash chain.
