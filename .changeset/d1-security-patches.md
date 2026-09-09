---
---

🛠 **Security patches across the toolchain.** `@vitest/browser` 4.1.9 → 4.1.11 (critical: provider
commands bypassed `allowWrite`), `@tiptap/*` 3.27.4 → 3.31.3 (prototype pollution + paste XSS),
`postcss` 8.5.19 → 8.5.28 (source-map file read), `style-dictionary` 5.5.0 → 5.5.2 (prototype
pollution). A lockfile refresh cleared the transitive advisories: `pnpm audit` went from 47 findings
to 3, with **0 critical**. The shadcn 4.21 bump then cleared the last high (`postcss` under
`shadcn`/`tsup`), leaving **1 low** — a Windows-only esbuild dev-server read reached through `tsup`.
`style-dictionary` is held at 5.5.2 deliberately: 5.5.3 touches `color/css` alpha precision, which is
token CSS output, and 5.5.2 already carries the fix.
[`8e151d4`](https://github.com/VegaStack/vegastack-design/commit/8e151d4)
