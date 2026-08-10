# 003 — Gate hover-triggered movement behind a fine-pointer media query

- **Status**: TODO
- **Commit**: e48990f
- **Severity**: MEDIUM
- **Category**: Accessibility (AUDIT.md §6)
- **Estimated scope**: 7 files, ~14 edits

## Problem

Touch devices synthesise a `:hover` state on tap and keep it until the user taps
elsewhere. Every hover rule that moves an element therefore leaves the element
stuck in its hovered position after a tap. AUDIT.md §6 requires gating those
rules behind `@media (hover: hover) and (pointer: fine)`.

This is a vocabulary app for 8+ learners, so tablet use is a primary case, not
an edge case.

CSS hover rules that move things:

```css
/* trivia.html:33-36 — current (identical in triviaScience.html:33,
   vocabulario-science.html:33, vocabulario-unidad.html:58) */
.option-btn:hover:not(:disabled) {
    transform: scale(1.02) translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
```

```css
/* index.html:232-235 — current */
.game-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 50px var(--card-shadow-hover);
}
```

```css
/* index.html:276 — current */
.game-card:hover .icon { transform: scale(1.25) rotate(-10deg); }
```

Tailwind `hover:scale-105` utilities, same problem:

- `trivia.html:115` and `:144`
- `triviaScience.html:115` and `:144`
- `vocabulario-science.html:115` and `:144`
- `vocabulario-unidad.html:142` and `:188`
- `pares-de-palabras.html:106`
- `vocabulario.html:180`

## Target

Wrap the movement in the media query; leave non-movement hover feedback
(colour, shadow) ungated so tapping still gives visual response on touch.

```css
/* target — trivia.html, triviaScience.html,
   vocabulario-science.html, vocabulario-unidad.html */
.option-btn:hover:not(:disabled) {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
@media (hover: hover) and (pointer: fine) {
    .option-btn:hover:not(:disabled) {
        transform: scale(1.02) translateY(-2px);
    }
}
```

```css
/* target — index.html */
.game-card:hover {
    box-shadow: 0 16px 50px var(--card-shadow-hover);
}
@media (hover: hover) and (pointer: fine) {
    .game-card:hover { transform: translateY(-8px) scale(1.02); }
    .game-card:hover .icon { transform: scale(1.25) rotate(-10deg); }
}
```

For the Tailwind utilities, Tailwind has no built-in fine-pointer variant, and
this project has no config file to add one (CDN build). Use the CDN's inline
config instead — `index.html:10-21` already shows the pattern for extending the
theme. Add to every file that needs it:

```js
tailwind.config = {
    theme: { /* existing content unchanged */ },
    plugins: [
        function ({ addVariant }) {
            addVariant('fine', '@media (hover: hover) and (pointer: fine)');
        }
    ]
}
```

Then rewrite each utility as `fine:hover:scale-105` (replacing
`hover:scale-105`).

**If the plugin approach fails to compile in the CDN build, STOP and report.**
Do not fall back to deleting the hover scale — losing the pointer affordance on
desktop is a worse outcome than the current bug.

## Repo conventions to follow

- Inline `tailwind.config` blocks already exist in every file — see
  `trivia.html:9-21`. Extend the existing object; do not add a second one.
- `index.html:342-350` shows the project already neutralises
  `.game-card:hover` transforms inside a media query, so this pattern is
  established in the codebase.
- Per-file duplication is expected; there is no shared stylesheet.

## Steps

1. `trivia.html:33` — split the `.option-btn:hover` rule per the target.
2. `triviaScience.html:33` — same.
3. `vocabulario-science.html:33` — same.
4. `vocabulario-unidad.html:58` — same.
5. `index.html:232` and `:276` — split per the target.
6. Add the `fine` variant plugin to the inline `tailwind.config` in
   `trivia.html`, `triviaScience.html`, `vocabulario-science.html`,
   `vocabulario-unidad.html`, `pares-de-palabras.html`, `vocabulario.html`.
7. Replace `hover:scale-105` with `fine:hover:scale-105` at all ten locations
   listed under Problem.

## Boundaries

- Do NOT gate `:active` / press feedback — that is pointer-agnostic and correct
  on touch.
- Do NOT gate colour-only or shadow-only hover rules, e.g.
  `index.html:176` (`.filter-btn:hover`) and
  `index.html:244` (`.game-card.recommended:hover`). They stay as they are.
- Do NOT remove any hover affordance outright.
- Do NOT touch `@keyframes` or the reduced-motion blocks from plan 002.
- If line numbers have drifted since commit e48990f, STOP and report.

## Verification

- **Mechanical**: `grep -n "hover:scale-105" *.html` must return zero
  ungated occurrences (all should read `fine:hover:scale-105`).
- **Feel check**: DevTools → Device Toolbar → iPad, with touch emulation on.
  - Tap an option button in `trivia.html`. It must not lift or stay lifted.
  - Tap a card in `index.html`. It must not translate upward and stick.
  - Tap the target-word card in `vocabulario-unidad.html`. Audio must still
    play, and the card must not remain scaled after the tap.
  - Switch back to a desktop viewport with a real mouse: every hover lift must
    behave exactly as it does today.
- **Done when**: no element remains visually displaced after a tap on touch
  emulation, and desktop hover is unchanged.
