---
---

🛠 **Playwright 1.61.0 → 1.63.0, and the Linux CI container tag follows it.** The
`playwright` devDependency moves in the root workspace and in `@vegastack/ui`; 1.63 ships Chromium
153.0.8010.12, Firefox 155.0 and WebKit 26.6, and drops Ubuntu 20.04 support. The audit's one
API-removal concern, `Locator.ariaRef()`, is a non-issue: it is absent from the type surface of the
1.61.0 we came from as well as 1.63.0, and nothing in this repo names it.
`tooling/verify-workflow-security.mjs` derives the required Linux job image
(`mcr.microsoft.com/playwright:v<version>-noble`) from the single `playwright` version the lockfile
resolves, so `ci.yml`, `release.yml` and `deploy.yml` now pin `v1.63.0-noble`.

`auto-install-peers=true` also makes pnpm resolve Next's optional `@playwright/test` peer even
though no manifest declares it, and left alone it stayed on 1.61.0 — two `playwright` versions in
one lockfile, which that gate refuses. A `pnpm-workspace.yaml` override pins the phantom peer to
the same version, so the container tag keeps exactly one authority.
