# Animation plans

Produced by the `improve-animations` skill against commit `e48990f`. Each plan
is self-contained: an executor with no context can run one without reading the
audit that produced it.

| # | Plan | Severity | Category | Files | Status |
| --- | --- | --- | --- | --- | --- |
| 001 | [Replace `transition: all`](001-replace-transition-all.md) | HIGH | Performance | 7 | DONE |
| 002 | [Reduced-motion coverage](002-reduced-motion-coverage.md) | MEDIUM | Accessibility | 6 | DONE |
| 003 | [Gate hover motion](003-gate-hover-motion.md) | MEDIUM | Accessibility | 7 | DONE |

All three are applied and **verified in a real Chromium**, across the seven
pages, with two identical runs to rule out a race:

- **001** — no `transition: all` survives anywhere.
- **002** — emulating `prefers-reduced-motion: reduce`, no `transform`
  survives. Short `box-shadow` / colour transitions do survive, which is what
  the plan specified: AUDIT.md §6 asks for "fewer and gentler, not zero".
- **003** — the gate evaluates `true` with a mouse and `false` on a touch
  context, so the hover lift never sticks after a tap.

Reproduce with `node tools/verify-animations.mjs`; see
`.claude/skills/verificar-en-navegador/SKILL.md`.

### What the browser found that reading the code did not

`.game-card` carried `animation: cardFadeIn 0.6s ease-out both`. With the
forwards fill, the animation stays the owner of `transform` after it ends, and
**an animation beats a normal declaration in the cascade** — so the hover lift
never applied, on any device. The shadow still moved, which is why the card
looked alive and the bug went unnoticed.

It predates these plans (already present at `e48990f`). Fixed by dropping
`both`: the cards carry no `animation-delay`, so `backwards` was doing nothing,
and the base styles already match the last keyframe — verified frame by frame
that the entrance still fades in from `opacity: 0` with no flash. Check 004 in
the verifier guards against it coming back.

## Execution order

**001 → 003 → 002.** The order is load-bearing:

- **001 before 003** — plan 003 splits the `.option-btn:hover` and
  `.game-card:hover` rules in two. Doing that first would mean editing the
  transition shorthand twice, and plan 001's line references would drift.
- **003 before 002** — plan 002 appends its `prefers-reduced-motion` block at
  the very end of each `<style>`, where it must override everything above it,
  including the media-query blocks plan 003 introduces. Running 002 first puts
  the reduced-motion rules above plan 003's rules, and equal-specificity
  conflicts would resolve the wrong way.

Run them one at a time and verify each before starting the next. All three
touch the same `<style>` blocks in the same files.

## Not covered

The audit produced seven findings; these plans cover three. Still open:

| Finding | Severity | Summary |
| --- | --- | --- |
| 4 | MEDIUM | `ease-in-out` on hover where AUDIT.md §2 wants `ease`; `pulse-green` runs 500ms against a 300ms UI ceiling |
| 5 | MEDIUM | `popIn` enters from `scale(0.5)`; AUDIT.md §3 targets `scale(0.9–0.97)` |
| 6 | LOW | No easing/duration tokens; curves hand-typed and duplicated across 4–6 files |
| 7 | LOW | `index.html:342-350` uses `animation: none !important` where §6 asks for "fewer and gentler, not zero" |

Note that plan 001 partially resolves finding 4 as a side effect: replacing
`.option-btn`'s `transition: all 0.2s ease-in-out` with an enumerated list also
swaps the easing to `ease` and the duration to 160ms. The `pulse-green`
duration is untouched.

Three additive opportunities were also identified and have no plans: a fade on
question change, a dedicated curve for the progress bar, and real delight on
the end screen.

## Regenerating

`improve-animations reconcile` re-checks these plans against current code,
marks completed ones DONE and refreshes stale line references.
