# TraceDoc CEIE — Design System Decisions & Reconciliations

| Topic | UI/UX Pro Max Recommendation | Our Concept Decision | Reason / Precedence |
|---|---|---|---|
| **Palette & Theme** | Dark mode OLED `#000000` / Cyberpunk `#0D0D0D` with bright green/cyan/magenta | `#07090c` (ground) with tactile `#e9e4d4` (paper) and `#c6f432` (lime) / `#ff4d6a` (ruby) | **Concept Wins**: Forensics requires calm, dignified editorial restraint. Avoids aggressive gaming aesthetic while maintaining superior contrast. |
| **Typography** | Lora / Raleway or Georgia / Sans | `Instrument Serif` (display italic), `Inter Tight` (UI), `JetBrains Mono` (forensic data) | **Concept Wins**: High-fashion editorial serif paired with surgical technical mono provides instant visual identity of an investigative institution. |
| **Scroll Engine** | Native CSS `scroll-behavior: smooth` or GSAP ScrollTrigger | CSS `position: sticky` scenes + Motion `useScroll` + Lenis smooth scroll | **Plan v2 Decision**: Eliminates heavy GSAP dependency. Motion's `useScroll` is native to React 19 and prevents scroll-jacking. |
| **Accessibility & Motion** | WCAG AA 4.5:1 text contrast, `prefers-reduced-motion` mandatory | Fully adopted: 4.5:1+ contrast on all text; reduced-motion provides static end states and pauses lasers/tickers | **Adopted from Skill**: Full compliance with WCAG accessibility standards. |
| **Interactive Controls** | Real HTML buttons, visible focus states, no div-buttons | Real `<button>`, `<a>`, `<label>`, `2px lime` focus rings with `2px offset` | **Adopted from Skill**: Strictly enforced across all components. |
| **Color Semantics** | Decorative neon accents | Functional semantics only: Lime = SAT / Restraint; Ruby = UNSAT / Contradiction; Cyan = Laser / Loupe | **Concept Wins**: Zero decorative neon noise. Color always carries cognitive meaning. |
| **Data Formatting** | Standard number formatting | Strict integer paise (`formatPaise(paise)`), `shortHash(sha)` | **Domain Rule**: Eliminates IEEE-754 floating-point inaccuracies in financial SMT proofs. |
