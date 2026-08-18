# 001 — Replace `transition: all` with explicit property lists

- **Status**: DONE — verified in a real Chromium across the seven pages: no
  `transition: all` survives. Reproduce with `node tools/verify-animations.mjs`
- **Commit**: e48990f (applied on top of it)
- **Severity**: HIGH
- **Category**: Performance (AUDIT.md §5)
- **Estimated scope**: 7 files, ~16 edits, CSS/class-attribute only

## Problem

`transition: all` animates every property that changes, including ones that
trigger layout and paint off the GPU. AUDIT.md §5 lists it as always a finding.

Seven CSS declarations:

```css
/* trivia.html:30 — current (identical in triviaScience.html:30,
   vocabulario-science.html:30, vocabulario-unidad.html:55) */
.option-btn {
    transition: all 0.2s ease-in-out;
    transform: scale(1);
}
```

```css
/* pares-de-palabras.html:26 — current */
.card {
    transition: all 0.3s ease;
    transform-style: preserve-3d;
}
```

```css
/* index.html:173 — current */
.filter-btn { transition: all 0.25s ease; }
```

```css
/* index.html:211 — current */
.game-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
```

Plus nine Tailwind `transition-all` utilities:

- `trivia.html:103`, `triviaScience.html:103`, `vocabulario-science.html:103`,
  `vocabulario-unidad.html:130` — `transition-all duration-300` on the progress bar
- `trivia.html:115`, `triviaScience.html:115`, `vocabulario-science.html:115`,
  `vocabulario-unidad.html:142` — `transition-all duration-200` on the target card
- `vocabulario.html:180` — `transition-all duration-200` on a category filter button

There is a concrete correctness bug hiding in the `.option-btn` case, not just a
perf cost. `.correct-answer` and `.wrong-answer` swap `background-color`,
`border-color` and `color` with `!important` the instant an answer is picked
(`trivia.html:46-58`). Because the transition is `all`, those three colour
changes animate over 200ms instead of landing immediately, so the green/red
feedback arrives late and washes in rather than snapping.

## Target

Enumerate only what each rule actually changes on hover/active.

```css
/* target — trivia.html:30, triviaScience.html:30,
   vocabulario-science.html:30, vocabulario-unidad.html:55 */
.option-btn {
    transition: transform 160ms ease, box-shadow 160ms ease;
    transform: scale(1);
}
```

160ms comes from the AUDIT.md §2 button-press-feedback budget (100–160ms).
`ease` is the §2 choice for hover. Colour is deliberately absent so the
answer feedback lands instantly.

```css
/* target — pares-de-palabras.html:26 */
.card {
    transition: transform 200ms ease, box-shadow 200ms ease,
                border-color 200ms ease, background-color 200ms ease;
    transform-style: preserve-3d;
}
```

```css
/* target — index.html:173 */
.filter-btn { transition: color 200ms ease, background-color 200ms ease; }
```

```css
/* target — index.html:211 */
.game-card { transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
                         box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1); }
```

Tailwind utilities, replacing `transition-all`:

- Progress bar (4 files) → `transition-[width] duration-300 ease-out`
- Target card (4 files) → `transition-[transform,box-shadow] duration-200`
- `vocabulario.html:180` filter button → `transition-[transform] duration-200`

**Accepted tradeoff, do not "fix" further:** `box-shadow` is a paint property
and strictly violates the transform/opacity-only rule in AUDIT.md §5. It is kept
because removing it would change the visual design, which is out of scope for
this plan. Same for the progress bar's `width` — it is the bar's whole purpose.

## Repo conventions to follow

- No build step, no shared stylesheet. Every file carries its own `<style>`
  block; the same fix is repeated verbatim per file.
- Tailwind arrives via CDN (`cdn.tailwindcss.com`), so arbitrary-property
  variants like `transition-[transform,box-shadow]` are compiled in the browser
  and work without config changes.
- Exemplar of an already-correct enumerated transition: `index.html:45`
  (`transition: top 0.2s;` on `.skip-link`).

## Steps

1. `trivia.html:30` — replace the `.option-btn` declaration with the target above.
2. `triviaScience.html:30` — same edit.
3. `vocabulario-science.html:30` — same edit.
4. `vocabulario-unidad.html:55` — same edit.
5. `pares-de-palabras.html:26` — replace the `.card` declaration.
6. `index.html:173` — replace the `.filter-btn` declaration.
7. `index.html:211` — replace the `.game-card` declaration.
8. In `trivia.html:103`, `triviaScience.html:103`, `vocabulario-science.html:103`,
   `vocabulario-unidad.html:130`: swap `transition-all` for `transition-[width]`
   and append `ease-out`.
9. In `trivia.html:115`, `triviaScience.html:115`, `vocabulario-science.html:115`,
   `vocabulario-unidad.html:142`: swap `transition-all` for
   `transition-[transform,box-shadow]`.
10. `vocabulario.html:180` — swap `transition-all` for `transition-[transform]`.

## Boundaries

- Do NOT touch `@keyframes` blocks, `animation:` shorthands, or the modal
  `popIn` — separate findings, separate plans.
- Do NOT change markup, class names, colours, or layout. Motion properties only.
- Do NOT add dependencies, a build step, or a shared CSS file.
- Do NOT add `prefers-reduced-motion` or hover gating here — that is plan 002
  and plan 003.
- If a line does not match the excerpt above (drift since commit e48990f), STOP
  and report rather than improvising.

## Verification

- **Mechanical**: `grep -rn "transition: all\|transition-all" *.html` must return
  zero results.
- **Feel check**: open `trivia.html` in a browser and answer a question.
  - The green/red answer colour must appear **instantly**, not fade in over
    200ms. This is the observable proof the bug is fixed.
  - Hovering an option must still lift and shadow it exactly as before.
  - In DevTools → Performance, record a hover sweep across the options. The
    colour-change entries that previously appeared should be gone.
  - Open `index.html`, hover the game cards, confirm the lift is unchanged.
  - Open `pares-de-palabras.html`, select and mismatch a pair; the red error
    state and the shake must look identical to before.
- **Done when**: the grep is empty and answer-feedback colour is instant in all
  four quiz files.
