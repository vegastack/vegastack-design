---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
"@vegastack/design": minor
---

⚠️ Corners are a role, not a size (BRD-12). Eleven corner tokens (`--corner-*`, read as `rounded-control`, `rounded-icon`, `rounded-chip`, `rounded-inline`, `rounded-mark`, `rounded-item`, `rounded-block`, `rounded-card`, `rounded-bubble`, `rounded-overlay`, `rounded-tile`) replace the size ramp in every component. Single-line controls are pills at every size (Button, Input, Select, InputGroup, Toggle, ToggleGroup, segmented Tabs), icon-only buttons are circles, tokens inside text keep a 6px corner, rows with a fill are 10px inside 16px menus padded 6px, blocks in content 12px, cards, popovers, menus and toasts 16px, bubbles and the command palette 20px, dialogs, drawers and sheets 24px, square media 25%. Table rows take the new `row-fill` utility, so their hover, pressed, selected and focus fills are an inset 10px shape like a select option. The `@vegastack/design` prose recipe follows them too (images, code blocks and tables 12px, inline code 6px, highlights 4px), and so do emails and the docs site. `rounded-chat-card` and `--chat-card-radius` are removed (use `rounded-card`). `design-lint` gains `no-radius-ramp`, and `vegastack-design doctor` reports `rounded-chat-card` and off-role corners (`rounded-sm|md|lg|xl…`, `rounded-[…]`) in app code.
