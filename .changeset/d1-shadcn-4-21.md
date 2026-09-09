---
---

🛠 **shadcn CLI 4.13.0 → 4.21.0.** 4.13.1 fixed three unadvised security bugs — custom registry
headers leaking across cross-origin redirects, path traversal for registry items without an explicit
target, and flag injection from registry-supplied dependency strings. No GHSA or CVE was ever filed,
so no audit tool would have flagged the gap. `shadcn build` output is byte-identical and
`verify-shadcn-consume` still passes against the real CLI. 4.21.0 makes the `cn` package the upstream
default for generated `lib/utils`; **we did not adopt it** — `cn()` keeps coming from
`@vegastack/design`, which is a locked decision, and the change is registry _content_, not CLI
behaviour.
[`8e151d4`](https://github.com/VegaStack/vegastack-design/commit/8e151d4)
