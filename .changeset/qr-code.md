---
"@vegastack/ui": patch
---

🧩 **QrCode** (new): a QR code for a `value`, drawn as one SVG path (`shape-rendering="crispEdges"`) — dark modules on a light, rounded tile in both themes so it always scans, with the standard 4-module quiet zone inside the drawing (`quietZone` to change it). `errorCorrection` takes `L`, `M` (default), `Q` or `H`; size it with a `size-*` class (default `size-40`). The root is `role="img"` named by the required `label`. Server-safe: the matrix is encoded during render by `uqr` (zero dependencies, MIT), a new sanctioned encoder dependency imported only by `qr-code.tsx`. An empty or unencodable value draws the empty tile (`data-state="invalid"`) instead of throwing.
[docs](https://design.vegastack.com/docs/components/qr-code)
