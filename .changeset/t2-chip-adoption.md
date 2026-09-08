---
"@vegastack/ui": minor
---

🔧 **Tag**, **FilterChip**, **ComboboxChip**, **ChipInput**, **TagGroup** — all now compose
the `chip` primitive. Three consequences are visible: a `Tag` is 28px rather than 20px and a
`FilterChip` is a pill rather than a rounded rectangle (chips are `rounded-full` by doctrine); the
neutral chip rests on `surface-1` and an applied filter sits on `surface-2` instead of the `accent`
alias; and every remove control is the same 24×24 target. That last one fixes `ComboboxChipRemove`, a
bare 16px box with no hit-area expansion at all (a WCAG 2.5.8 failure), and retires `Tag`'s
`::before` hit area, which a nested native `<button>` clipped and so never actually expanded
anything. TagGroup's `+N` overflow control is itself a chip, so the whole 28px pill is the pointer
target and its hover/pressed steps come from the shared `surfaceInteractive` recipe rather than a
hand-written descendant selector.
[docs](https://design.vegastack.com/docs/components/chip)
