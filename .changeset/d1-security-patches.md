---
---

🛠 **Security patches across the toolchain.** `@vitest/browser` 4.1.9 → 4.1.11 (critical: provider
commands bypassed `allowWrite`), `@tiptap/*` 3.27.4 → 3.31.3 (prototype pollution + paste XSS),
`postcss` 8.5.19 → 8.5.28 (source-map file read), `style-dictionary` 5.5.0 → 5.5.2 (prototype
pollution), plus the `shadcn` 4.21 bump that clears `postcss` under `shadcn`/`tsup`. Measured on the
same advisory database on 2026-09-09, `pnpm audit` goes from **59 findings (3 critical · 29 high · 25
moderate · 2 low)** before to **47 (0 critical · 24 high · 21 moderate · 2 low)** after. Every
remaining finding is a transitive dev-tool dependency with no path into published output.
`style-dictionary` is held at 5.5.2 deliberately: 5.5.3 touches `color/css` alpha precision, which is
token CSS output, and 5.5.2 already carries the fix.
