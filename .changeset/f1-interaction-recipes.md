---
"@vegastack/design": minor
---

🧩 **`surfaceInteractive` and `fillInteractive`** — the two hover/pressed recipes, exported
from `@vegastack/design` so no component writes a `hover:bg-*` literal again. `surfaceInteractive`
(`hover:bg-surface-2 active:bg-surface-3`) is for a control on a known ladder surface;
`fillInteractive.<tone>` (`hover:bg-<tone>/(--alpha-hover) active:bg-<tone>/(--alpha-pressed)`) is
for one on an unknown backdrop or hovering in its own hue. The `FillTone` type ships with them.
[docs](https://design.vegastack.com/docs/foundations/colors) ·
[`0e88dc5`](https://github.com/VegaStack/vegastack-design/commit/0e88dc5)
