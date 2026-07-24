---
"@vegastack/ui": minor
---

Fix `Terminal`'s scrollable command pane having no visible focus indicator under
`forced-colors: active`.

The pane is keyboard-focusable and signalled focus with a border tint plus `outline-none`. Forced
colors replaces `border-color` outright, so the tint vanished, and Tailwind v4's `outline-none`
suppresses the shared `:focus-visible` outline with no forced-colors carve-out — leaving no
indicator at all in the forced palette. The affordance is now that shared outline, inset with a
negative offset so neither the terminal's `overflow-hidden` root nor `scroll-fade-x`'s mask can clip
it. The layout-reserving transparent border is removed with the tint it existed for, so the pane
renders 2px shorter.
