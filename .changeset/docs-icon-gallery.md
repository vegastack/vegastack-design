---
---

🐛 **Docs** — the icon gallery was unusable by keyboard and inert on touch. Each tile was a
focusable `<div>` with no role, so all 439 were reachable and announced as nothing; each is now a
real `<button>`. A tile also drives its icon through a ref, and holding the ref suppresses every
trigger the icon provides for itself, including its tap-to-play `pointerdown` — the tile replaced
hover and focus but not that one, so on a phone nothing in the gallery ever moved. Tiles now carry
the tap driver too, under the same pointer-type rules.
[docs](https://design.vegastack.com/docs/foundations/icons) ·
[`cb20de9`](https://github.com/VegaStack/vegastack-design/commit/cb20de9)
