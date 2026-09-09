---
---

📦 **Vitest 5.** `vitest` 4.1.11 → 5.0.0, `@vitest/browser-playwright` 4.1.11 → 5.0.0 and
`vitest-browser-react` 2.2.0 → 2.3.0 across the workspace — the runner under every test in the
repository, including the browser suite `pnpm verify` gates on. Vitest 5 matches locator text and
accessible names whole-string by default and makes `toHaveTextContent` whole-string equality
(`toMatchTextContent` is the partial/RegExp matcher), which turned ten of 2363 browser tests red.
Every one was fixed at the call site rather than by restoring the old substring behaviour: eight now
assert the FULL accessible name — a tab's trailing count badge, a link's sr-only "(opens in new
tab)", a requirement row's sr-only "Met: " prefix — so a query proves what a screen-reader user
hears. `getByRole('tab', { name: 'A' })` had been resolving a tab named `Activity3`. Vitest 5 also
consolidates every run artifact under one `.vitest` directory, so `workspace-clean.mjs`'s tree walk
for the old `.vitest-attachments` directory is deleted rather than kept. No component source, no
published output and no registry item changes; item count stays at 568.
