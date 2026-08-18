# 002 — Add `prefers-reduced-motion` to the six files that lack it

- **Status**: DONE — verified emulating `prefers-reduced-motion: reduce`: no
  `transform` survives on any page. The short `box-shadow` / colour transitions
  that do survive are the ones this plan specified on purpose (§6 asks for
  "fewer and gentler, not zero"). Reproduce with
  `node tools/verify-animations.mjs`
- **Commit**: e48990f (applied on top of 466ec10, after plan 003)
- **Severity**: MEDIUM
- **Category**: Accessibility (AUDIT.md §6)
- **Estimated scope**: 6 files, one new media query each

## Problem

Only `index.html` honours `prefers-reduced-motion`. The other six files ignore
it entirely:

| File | Movement that runs regardless |
| --- | --- |
| `trivia.html` | `shake-red` (±4px, 0.4s), `pulse-green` (scale 1.05, 0.5s), `popIn` |
| `triviaScience.html` | same three |
| `vocabulario-science.html` | same three |
| `vocabulario-unidad.html` | same three |
| `pares-de-palabras.html` | `shake` (±4px, 0.4s), `popIn` |
| `vocabulario.html` | card flip + hover scale only |

```css
/* trivia.html:52-58 — current */
.correct-answer { animation: pulse-green 0.5s ease-in-out; }
.wrong-answer   { animation: shake-red 0.4s cubic-bezier(.36,.07,.19,.97) both; }
```

This matters more here than in a typical app. The audience is 8+ learners, and
`shake-red` fires on every wrong answer — dozens of times per session. Rapid
horizontal oscillation is the specific pattern that triggers vestibular
discomfort. It is currently unavoidable for a user who has asked the OS to
reduce motion.

## Target

Append this block at the **end** of each file's existing `<style>` element, so
it wins on cascade order.

```css
/* target — trivia.html, triviaScience.html,
   vocabulario-science.html, vocabulario-unidad.html */
@media (prefers-reduced-motion: reduce) {
    .correct-answer { animation: none; }
    .wrong-answer   { animation: none; }
    .modal-enter    { animation: fadeInReduced 200ms ease-out both; }
    .option-btn     { transition: box-shadow 160ms ease; }
    .option-btn:hover:not(:disabled) { transform: none; }
}
@keyframes fadeInReduced {
    from { opacity: 0; }
    to   { opacity: 1; }
}
```

```css
/* target — pares-de-palabras.html */
@media (prefers-reduced-motion: reduce) {
    .card.error   { animation: none; }
    .card         { transition: box-shadow 200ms ease, border-color 200ms ease,
                                background-color 200ms ease; }
    .card.selected { transform: none; }
    .card.matched  { transform: none; }
    .modal-enter   { animation: fadeInReduced 200ms ease-out both; }
}
@keyframes fadeInReduced {
    from { opacity: 0; }
    to   { opacity: 1; }
}
```

```css
/* target — vocabulario.html */
/* current, vocabulario.html:13 —
   .transform-style-3d { transform-style: preserve-3d;
                         transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); } */
@media (prefers-reduced-motion: reduce) {
    .transform-style-3d { transition: none; }
}
```

The flip is the card's entire mechanic, so it cannot be replaced with a fade —
removing the transition makes the face swap instantly, which is the correct
reduced-motion behaviour here.

The design rule from AUDIT.md §6 is **fewer and gentler, not zero**. Every
target above removes position and scale change while keeping the colour and
opacity feedback that tells a child whether they got the answer right. Do not
replace these with a blanket `animation: none !important`.

## Repo conventions to follow

- `index.html:342-350` is the existing implementation and the placement
  exemplar: last rule in the `<style>` block.
- Note that `index.html` uses `animation: none !important` throughout. That is
  acceptable for its purely decorative floating shapes but is **not** the
  pattern to copy here, because these six files animate functional feedback.
  Tightening `index.html` itself is a separate LOW finding, not this plan.
- No shared stylesheet exists; the block is repeated per file by design.

## Steps

1. `trivia.html` — append the four-file target block at the end of `<style>`
   (immediately before `</style>`, after the `.text-glow` rule).
2. `triviaScience.html` — same.
3. `vocabulario-science.html` — same.
4. `vocabulario-unidad.html` — same.
5. `pares-de-palabras.html` — append its own target block.
6. `vocabulario.html` — append its own target block after the
   `.card-container.flipped` rule at line 15.

## Boundaries

- Do NOT change any animation that runs outside the media query.
- Do NOT use `!important` in the new blocks. If a rule loses to specificity,
  raise the selector's specificity instead and note it in the report.
- Do NOT delete the `@keyframes shake-red` / `pulse-green` / `popIn`
  definitions — they must still run for users without the preference set.
- Do NOT touch `index.html`.
- Do NOT add hover gating here — that is plan 003.
- If a file's `<style>` block does not end where described (drift since commit
  e48990f), STOP and report.

## Verification

- **Mechanical**: `grep -c "prefers-reduced-motion" *.html` must return 1 for
  all seven files.
- **Feel check**: DevTools → Rendering → "Emulate CSS prefers-reduced-motion:
  reduce", then in `trivia.html`:
  - Answer wrong. The button must turn red **with no horizontal shake**.
  - Answer right. The button must turn green **with no scale pulse**.
  - Reach the end screen. The modal must fade in, not pop from scale(0.5).
  - Hover an option. Shadow may change; the button must not move.
  - Turn the emulation off and confirm every animation returns.
- In `pares-de-palabras.html` with emulation on, mismatch a pair: red state,
  no shake. Match a pair: green state, no shrink.
- **Done when**: all seven files report 1, and no functional feedback (colour,
  opacity) was lost in the reduced-motion pass.
