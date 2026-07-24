# HANDOFF-STATUS — vegastack-design (build-LOCAL complete)

> **Historical handoff.** Its broad human-docs SSO assertions are superseded by
> [`public-docs-cutover.md`](public-docs-cutover.md); preserve the remaining build history as written.

**For:** MK · **Branch:** `feat/local-build` (local-only — never pushed) · **Date:** 2026-06-21

The entire design system is **built and proven locally**, then hardened through **16 rounds** of Codex
adversarial review (every high/medium fixed at root). Everything stops at the build-LOCAL boundary:
**no git push, no npm publish, no Cloudflare deploy, no VRT-baseline generation, no Cloudflare Access
config** — those are the irreversible / external-environment actions you trigger (commands in §6).

There is **one product decision** waiting on you (the `@vegastack/ui` provider distribution — §4), and
the rest is environment/credential actions only.

---

## 1. What's done (all green locally — Node 24)

| Gate                                                   | Result                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck` (Turborepo, all packages)             | ✅ 10/10                                                                                                                                                                                                                                                                                                             |
| `pnpm test` (Vitest browser + axe, real Chromium)      | ✅ **617 tests / 67 files**                                                                                                                                                                                                                                                                                          |
| `pnpm lint` (all packages)                             | ✅ 10/10 — design-lint (token-only + sanctioned-icon + §7.6 render-contract + outline-none focus-contract + inline-style var-only + **token-CSS `!important`** coverage), contrast-check (28 pairs WCAG AA), ESLint, content-lint (no floating tags / no skipped VRT), verify-preset-source, verify-provider-dogfood |
| `pnpm build` (token build + DTS + Next static export)  | ✅ **144 pages**; `@vegastack/ui` dist preserves the `'use client'` directive (postbuild guard)                                                                                                                                                                                                                      |
| `pnpm registry:build` + integrity                      | ✅ 64 items; recomputed hash == `meta.integrity` == signed manifest for **64/64**; idempotent (full-worktree CI check)                                                                                                                                                                                               |
| `pnpm registry:verify-consume`                         | ✅ **real `shadcn add` 3/3** dependency graphs via the actual shadcn 4.7.0 CLI (deps from locally-packed tarballs) + **64/64 items × 2 consumer layouts** (`components/ui` + `src/components/ui`) simulated                                                                                                          |
| Compiled-CSS color-contrast a11y gate                  | ✅ rendered AA in light + dark                                                                                                                                                                                                                                                                                       |
| Overlay portal-stacking + `--primary` override repaint | ✅ portals out of an isolated root + z-50; `--color-primary: var(--primary)` bridge repaints                                                                                                                                                                                                                         |
| **VRT (visual regression)**                            | ✅ **proven-functional locally**: the suite renders all 68 showcase pages, writes + re-validates baselines — **68/68 twice** (mac). Committable **Linux** baselines need the pinned container → §4/§6.4.                                                                                                             |

## 2. Component matrix — 64 primitives, every column ✅

See `docs/ledger/component-matrix.md` (built · Vitest · axe · render · §7.6 · registry · copy-in · showcase).

- **Full platform parity where it's data/exports:** `CountrySelect`/`StateSelect` ship the complete 198
  countries / 45 subdivision datasets; `TruncatedText` ships all three platform exports (+`IconText`/`TableCellText`).
- **Deliberate Model-A refinements (recorded in §12 + each component's docs, not silent drops):**
  `Button` uses children composition + `SplitButton`; `Tooltip` uses `TooltipContent`
  composition + `TooltipKbd`, while interactive actions belong in `Popover`.
- **Presentational-core scope (the primitive renders; the app owns state):** `data-list`, `text-edit`,
  `FilterBar` — complete at that defined scope. Full-parity `data-grid` / `text-edit-collab` /
  `filter-bar-managed` are separate **deferred** inventory items.
- The inventory is the 64 DS primitives — **not** a 1:1 file port of platform `common`; app-coupled /
  page-level / DS-replaced / already-covered items are excluded with rationale (§12).

## 3. Codex adversarial-review history (16 rounds)

Full per-round log: `docs/ledger/codex-rounds.md`. The loop drove from core correctness to deep
packaging/parity edges. Representative root-cause fixes:

- **Security / supply-chain:** a TOCTOU registry verifier that accepted malicious alias **retargeting**
  (`@/…/button` → `@/…/evil`) — closed with category+path canonicalization + negative tests; exact-identity
  Sigstore pin; whole-item integrity + provenance headers on all 64.
- **Distribution / consumability:** registry targets migrated to shadcn **`@ui/` placeholders** (a
  hard-coded `components/ui/…` broke `src/components/ui` consumers); a real `shadcn add` consume gate;
  the published-preset `@source` fix; `@vegastack/ui` kept **private** to honor the locked public/private
  model (would otherwise have published publicly).
- **a11y / correctness:** WCAG-AA token fixes + a fail-closed contrast gate; forwarded refs on all 64;
  keyboard-reachable password toggle; DataList row-activation ARIA + off-page selection data-loss;
  DatePicker disabled-date enforcement; TextEdit focused-value reconcile; cmdk ARIA.
- **Release safety:** release/deploy made fail-closed on the full gate **and** a pinned-container VRT job;
  hermetic docs build (declared `zod@4`); `'use client'` preserved in the built package; token-CSS under
  the `!important` audit; the authoring skill can no longer ship skipped VRT.

**Where the loop landed (after 16 rounds):** every actionable high/medium was fixed at root and
committed. By round 14 the reviewer found **zero component-logic bugs**; rounds 15–16 were packaging /
scope / tooling polish (Tooltip & FilterBar scope records, `'use client'` preservation, token + docs
`!important` audit coverage, registry-index integrity, a FieldInline a11y fix, a recovered copy-in
header check). The review never returns a literal "0 findings" verdict for one structural reason: it
**re-flags VRT every round** (12×) because the Linux baselines can't be committed without the Docker
container — and it correctly flags the **provider-distribution decision** as unresolved. Those two are
exactly the items in §4. **No third class of issue remains open.**

## 4. Open items for you (one decision + environment actions)

1. **DECISION — `@vegastack/ui` (provider) distribution.** The locked model (§NG4) makes only the four
   token-layer packages public and keeps component source private (registry copy-in), which doesn't
   unambiguously place the **provider** (`VegaStackProvider` + `Toaster`). I set `@vegastack/ui`
   **`private: true`** (safe, reversible — prevents an unintended public publish; you can publish later).
   **Choose one:** (a) publish it as a public runtime package (extend §NG4 to list it, flip `private` off,
   re-add a changeset), or (b) ship the provider as a **registry copy-in** (`shadcn add @vegastack/provider`,
   consistent with "non-token source via the private registry"). `skills/consume/SKILL.md` documents both
   paths. Until decided, the provider is workspace-internal (the docs dogfood it via `workspace:*`).
2. **VRT Linux baselines (Docker/CI only).** The suite + `vrt.yml` are wired and **proven-functional
   locally**, but committable baselines must be generated in the pinned `mcr.microsoft.com/playwright:
v1.61.0-noble` container (mac PNGs fail CI on font/render deltas). There's no Docker daemon on the build
   machine, so this is a CI action → §6.4. The suite **self-activates** the moment baselines are committed
   (no `describe.skip` to flip); PR VRT is **fail-closed** on visual-surface changes without baselines, and
   release/deploy are fail-closed on a passing VRT gate. Local render + a11y are independently enforced.
3. **Deferred inventory:** `data-grid` / `text-edit-collab` / `filter-bar-managed` — full-parity versions,
   build only if commissioned (`text-edit-collab` also needs the F4 collab-adapter contract).

## 5. Hard constraints honored

No `git push`, no `npm publish`, no Cloudflare deploy, no Cloudflare Access change, no VRT-baseline
generation, no public-resource creation. **35 commits**, all local on `feat/local-build`. Node 24
(`/opt/homebrew/opt/node@24/bin`) for every build/test.

## 6. Exact commands YOU run (the irreversible / external actions)

> **Prereqs.** GitHub repo `VegaStack/vegastack-design`. Secrets: `NPM_TOKEN` (npm publish),
> `CF_API_TOKEN` + `CF_ACCOUNT_ID` (deploy), `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET` (the
> `/r/*` service token). Repo **variable** `DOCS_URL` (the deployed origin, for the post-deploy Access
> check). Cloudflare Zero-Trust **Access policies** configured: human docs behind SSO, `/r/*`
> service-token-only (the deploy verifies this fail-closed but does not create it).

### 6.1 Push + PR (runs `ci.yml`: typecheck/lint/test/build/registry:build+full-worktree/verify-consume/changeset)

```bash
git push -u origin feat/local-build
gh pr create --base main --head feat/local-build --title "feat: VegaStack design system v1" --body-file docs/plans/HANDOFF-STATUS.md
```

### 6.2 Publish the public npm layer (changesets)

Merging to `main` triggers `.github/workflows/release.yml` (now **fail-closed** on the full gate +
a pinned-container `vrt-gate`) → opens a "Version Packages" PR; merging that runs `changeset publish`.
Manual equivalent:

```bash
pnpm changeset version && pnpm install
pnpm changeset publish   # publishes ONLY @vegastack/tokens|tailwind-preset|utils|icons (the public 4).
                         # @vegastack/ui is private → versioned but NOT published (see §4 decision).
```

### 6.3 Generate VRT baselines FIRST (required before deploy/release — they are fail-closed on it)

```bash
gh workflow run "VRT (visual regression)" -f update_baselines=true
# Download the vrt-baselines artifact, commit it under apps/docs/vrt/**/*-snapshots/**, and push.
# The suite self-activates into a blocking pixel gate automatically — no code change needed.
```

### 6.4 Deploy docs + signed registry (`deploy.yml`, manual — needs §6.3 baselines committed)

```bash
gh workflow run "Deploy (docs + signed registry)"
```

Runs the `vrt-gate` (fail-closed) → `registry:build` → cosign-signs the integrity manifest (keyless,
GitHub OIDC) → `next build` (out/r carries the signed manifest) → asserts it → `wrangler deploy` →
**verifies the live Cloudflare Access policy fail-closed** (anonymous docs SSO-gated, `/r/*` rejects
anonymous + accepts the service token).

---

_Generated by the build agent. Stop point reached: build complete, locally proven, 15 review rounds
converged. Awaiting MK's provider-distribution decision + the environment actions above._
