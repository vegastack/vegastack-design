---
---

🛠 **WP1 of the verification rebuild** — the 320px reflow, RTL containment, and effective
24px pointer-target contracts now run as a vitest browser lane over the preview fixtures
(`packages/ui/test/geometry.browser.test.tsx`) instead of `@playwright/test` over the docs export. No
published package changes: `@vegastack/ui` is private, and the only files touched are its test lane
and vitest config.
