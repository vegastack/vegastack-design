# Full-system adversarial review — 2026-07-24

> **Status: IN PROGRESS.** Findings register from a nine-angle adversarial review of the working
> tree as it stands (HEAD `1375a75` + ~2,000 uncommitted files). Every claim below was verified
> against source by the reviewing agent AND spot-checked independently before being recorded here.
> This file is the work list; it is not a mandate for autonomous execution. **/ship remains
> MK-gated.**

## How to read this

- **Owner: agent** — mechanical, verifiable, safe to fix in-repo.
- **Owner: MK** — requires a GitHub/Cloudflare setting, a credential, or a product decision.
  An agent must NOT do these.
- Severity: **P0** blocks a commit or ships a defect; **P1** consumer-visible or security;
  **P2** correctness/hygiene; **P3** polish.

---

## §0. Repository-state hazards (fix BEFORE any commit)

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Owner | Status   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | -------- |
| 0.1 | **The git index disagrees with the working tree.** Index `packages/ui/registry.json` has **539** items including `plan-banner`; the worktree has **538** and no `plan-banner`. 33 files are staged-as-added but deleted on disk (`AD`), incl. 5 `plan-banner` files and 30 `docs/research/attio-teardown/*`. A bare `git commit` would resurrect a deleted item and commit pre-reformat content for 509 unstaged `public/r` files — a snapshot that exists nowhere and whose integrity hashes would not match their sources.                                                                                                                                                                                                                                 | agent | **OPEN** |
| 0.2 | **Eleven generated authorities are untracked** (`??`), including `packages/ui/component-contracts.json` — the file AGENTS.md calls "the machine authority" (0 commits, not gitignored). Also `animated-icon-sources.json`, `contract-smoke-tests.generated.json`, `apps/docs/vrt/contract-routes.generated.ts`, `contracts.spec.ts`, `icon-chunks.generated.ts`, `apps/docs/lib/home-component-catalog.generated.ts`, `apps/docs/scripts/verify-vrt-baselines.ts`, `apps/docs/components/animated-icon-gallery.generated.tsx`, `packages/ui/vitest.all-browsers.config.ts`, plus `tooling/resolve-component-contracts.mjs` and `tooling/verify-component-contracts.mjs`. On a clean CI checkout `design:verify` and the blocking VRT gate cannot run at all. | agent | **OPEN** |
| 0.3 | **`pnpm format` and `pnpm registry:build` fight over 540 files.** No `.prettierrc` and no `.prettierignore` exist; root `format` is `prettier --write .`. `prettier --check 'apps/docs/public/r/*.json'` fails 540/540 (prettier collapses short arrays + adds a trailing newline; the generators write `JSON.stringify(…,null,2)` with neither). Anyone who formats before committing produces a 540-file diff CI silently reverts, then fails the drift gate. Integrity survives (hash is over the parsed object).                                                                                                                                                                                                                                         | agent | **OPEN** |

**Verified-clean baseline (measured, not assumed):** 538/538 integrity hashes recompute; 538/538
copy-ins byte-identical to canonical; 545/545 provenance headers valid; 0 orphans in either
direction; 0 duplicate item names; no secrets, no `/Users/…` paths in `public/r`.

---

## §1. Counts — claim vs measured

All AGENTS.md numbers verified **correct**: 538 items (535 ui / 2 hook / 1 block), 96 components,
439 generated icons, 96 matrix rows, 113 routes, 872 required baselines, 200 committed, 672
missing, 124 MDX (122 public + 2 internal), 8 guides. Framework pins all correct.

Counting gotcha worth preserving: **`icon-button` is a real component**, so 440 item names begin
`icon-` while only 439 are generated icons. A naive prefix split yields 95/440 and cannot reconcile
to 535. `component-contracts.json → expectedCounts` is the unambiguous authority.

**Wrong numbers found:**

| Location                                   | Claim                                                            | Actual                                                             | Owner |
| ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------ | ----- |
| `AGENTS.md` §Server-safe                   | "**28** server-safe components import `cn`"                      | **24**                                                             | agent |
| `AGENTS.md` §Layout                        | "`tooling/` — registry hashing/**signing**/verify scripts"       | No signing script exists; cosign lives only in `deploy.yml`        | agent |
| `AGENTS.md` §Releasing                     | "`verify-public-boundary` is the routine post-deploy gate"       | It **skips** until `PUBLIC_DOCS_CUTOVER=complete`                  | agent |
| `AGENTS.md` §Motion                        | omits `motion-flash`                                             | defined at `utilities.css:675`, taught in interaction-patterns.mdx | agent |
| `skills/design-system/SKILL.md:13`         | "97 components"                                                  | **96**                                                             | agent |
| `skills/design-system/SKILL.md:15`         | "539 items"                                                      | **538**                                                            | agent |
| `tooling/verify-shadcn-consume.mjs:31`     | comment "539/539"                                                | 538                                                                | agent |
| `.github/workflows/ci.yml:23`              | comment "539-item contracts"                                     | 538                                                                | agent |
| `.changeset/calm-components-zero-gap.md:5` | "all **97** registry components" — **publishes verbatim to npm** | 96                                                                 | agent |
| `apps/docs/vrt/components.spec.ts:81`      | comment "97"                                                     | 96                                                                 | agent |
| `CHANGELOG.md:80` (`[0.1.0]`, frozen)      | "440 animated-icon items"                                        | 439                                                                | agent |

**Non-finding, resolved:** `0.1.1` vs `[0.2.0]` is _not_ a contradiction — three separate version
lines. `@vegastack/ui` (= the design-system/registry version stamped on every item) is **0.2.0**;
npm `@vegastack/design` is 0.1.1 and `@vegastack/design-tokens` 0.1.0. The real defect is that
AGENTS.md's Status line never names the design-system version, so an agent reading `ship` §3 ("the
NEXT design-system version") has no anchor.

---

## §2. P0 — Security & supply chain

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Owner  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 2.1 | **Trusted-origin guard fails OPEN when the credential is missing.** `packages/design/bin/check-updates.mjs:243` returns early when no headers are present, bypassing the HTTPS + `VEGASTACK_TRUSTED_REGISTRY_ORIGIN` check. An unset `CF_ACCESS_CLIENT_SECRET` expands to `''`, is stripped, and an arbitrary origin's index is accepted — exit 0, no warning, with an `--overwrite` recommendation printed. Reproduced end-to-end. Same shape at `verify-registry-item.mjs:189` and `tooling/registry-request.mjs:58` (which also accepts `file://` and `http://169.254.169.254/`). | agent  |
| 2.2 | **`check-updates` drift detection is a no-op for headered files.** `check-updates.mjs:588` compares _line 1_ against the registry integrity and never reads the body — which is exactly what an edit changes. A backdoored `button.tsx` that keeps its header reports `current`, exit 0, under `--fail-on-update`. `install.mdx:139` promises the opposite ("Status is by **content**"). No test covers headered-body-edited.                                                                                                                                                        | agent  |
| 2.3 | **Sigstore identity uses the wrong repo casing.** `verify-registry-item.mjs:807` and `tooling/verify-item.mjs:89` default to `VegaStack/vegastack-design`; the actual login is lowercase `vegastack/vegastack-design`, and `--certificate-identity` is case-sensitive. Every downstream `verify` would reject a genuine signature. CI never notices — it derives the identity from `${{ github.repository }}` (already lowercase).                                                                                                                                                   | agent  |
| 2.4 | **`CF_API_TOKEN` / `CF_ACCOUNT_ID` are repository secrets, not environment secrets**, contradicting `deploy.yml:219`'s own comment. `ci.yml`/`vrt.yml` are `pull_request`-triggered and same-repo PRs receive repo secrets — a one-line PR can exfiltrate the production Cloudflare token before review.                                                                                                                                                                                                                                                                             | **MK** |
| 2.5 | **`main` has no branch protection** (`GET .../branches/main/protection` → 404), yet `release.yml` triggers on push to main. Nothing enforces the "PR → review → merge" model RELEASING.md assumes.                                                                                                                                                                                                                                                                                                                                                                                   | **MK** |
| 2.6 | Repo Actions defaults: `default_workflow_permissions: write`, `can_approve_pull_request_reviews: true`, `sha_pinning_required: false`, `allowed_actions: all`. Current workflows all declare `contents: read`, but any new workflow that forgets inherits write.                                                                                                                                                                                                                                                                                                                     | **MK** |

---

## §3. P0 — Shipping is currently impossible

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Owner                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 3.1 | **Zero GitHub Environments exist** (`total_count: 0`). Both `environment-guard` jobs GET `/environments/{name}` and throw on non-OK → 404 → release and deploy both hard-fail before any approval. AGENTS.md describes this as "GitHub Team lacks required reviewers"; the _code's_ actual failure is a 404 on an environment nobody created. Remediation differs, so the doc should say so precisely.                                                                              | **MK**                           |
| 3.2 | **VRT gate is red and blocks every PR, not just release.** 672/872 baselines missing. `vrt.yml:96` runs the completeness check on every PR (200 PNGs exist → `present=true`), so the pixel gate never even executes. A Version-PR merge always re-stamps `packages/ui/registry/ui/*.tsx`, matching `release.yml:39`'s visual regex — so npm publish cannot dodge it either. **13 routes have zero baselines in any lane**, matching the 12 new components + the new internal route. | **MK** dispatches; agent commits |
| 3.3 | `environment-guard` never checks `can_admins_bypass`, which RELEASING.md:58 makes mandatory. Environments created with the default `true` would let an admin skip the entire sole-reviewer topology, gate green.                                                                                                                                                                                                                                                                    | agent (code) + **MK** (setting)  |
| 3.4 | `CF_ZONE_ID` is referenced (`deploy.yml:296`) but does not exist; nor do the four `CF_*_ACCESS_APPLICATION_ID` vars. The cutover would burn an MK approval then die at `purge-retired-public-route.mjs:11`.                                                                                                                                                                                                                                                                         | **MK**                           |
| 3.5 | `publishConfig.provenance: true` on all three packages directly contradicts RELEASING.md:9 ("deliberately do not claim one" from a private repo). May hard-fail the first protected publish.                                                                                                                                                                                                                                                                                        | agent (after MK decides)         |

---

## §4. P1 — Fail-open gates (the safety net has holes)

| #    | Finding                                                                                                                                                                                                                                                                                                                                                          | Owner |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 4.1  | `design-lint.mjs:330,353,376,809` — all four literal-scoped rules extract class strings with `/["'`]([^"'`]*)["'`]/g`. One stray apostrophe (`{/* Don't ship this */}`) desyncs quote pairing for the rest of the line and silently disables `uppercase-mono`, `transition-pairing`, `flex-truncate-conflict`, `raw-motion`. Proven with a specimen.             | agent |
| 4.2  | `design-lint.mjs:212` — `RENDER_OMIT` is a per-line regex; `.` never crosses `\n`, so prettier's normal wrap of `Omit<…, 'render'>` defeats the §7.6 render-contract rule. Also `ARB` omits `grid-cols`/`translate`/`scale`/`aspect`, and `raw-effect`'s blur branch can't match `[`, so `backdrop-blur-[12px]` passes.                                          | agent |
| 4.3  | **No gate asserts `public/r/` contains one JSON per registry item.** `verify-headers`, `verify-registry-integrity-negative` and `verify-shadcn-consume` all enumerate the _output_ directory, so a dropped item makes every counter agree at N−1 and all three report green.                                                                                     | agent |
| 4.4  | `verify-rsc-safety.mjs:95` scans only `.tsx`, so `use-mobile.ts`, `use-animation-replay.ts`, `region-select-data.ts` — the two `registry:hook` items, the files most likely to call hooks — are never checked. Also defeated by `import { useState as useLocal }`.                                                                                               | agent |
| 4.5  | `verify-rsc-safety` PART A imports `packages/design/dist/`, but `design:verify` never builds `@vegastack/design` — it validates a possibly stale `dist`.                                                                                                                                                                                                         | agent |
| 4.6  | `registry:build` is **not idempotent** when a stale item JSON exists: `registry-stamp` runs before `registry-header` prunes, so one full build leaves a dead entry in the **Sigstore-signed** manifest. Reproduced. Manifest keys also come from `item.name` not the filename, and `readdirSync` order decides collisions — a non-deterministic signed artifact. | agent |
| 4.7  | `test -z "$(git status --porcelain)"` in `release.yml:115` and `deploy.yml:142` fails **open** — if git errors, stdout is empty and the test passes. `ci.yml:44` gets it right with `&&`.                                                                                                                                                                        | agent |
| 4.8  | `changelog-lint.mjs:67` silently skips any docs link with an anchor (`#api`) — the common case.                                                                                                                                                                                                                                                                  | agent |
| 4.9  | `secret-scan.mjs:37` inspects only the first credential assignment per line (non-global regex).                                                                                                                                                                                                                                                                  | agent |
| 4.10 | `contrast-check.mjs:303` `continue`s on a missing surface with no `fail()`, while claiming fail-closed coverage.                                                                                                                                                                                                                                                 | agent |
| 4.11 | `verify-portal-theme-scope.mjs:42` only matches tags whose leaf is literally `Portal` — an alias or raw `createPortal(` escapes both the violation check and the "unreviewed host" inventory.                                                                                                                                                                    | agent |
| 4.12 | `verify-workflow-security.mjs`: `container:` digest pinning matches only the shorthand string form (mapping form exempt); the `persist-credentials` check mis-blocks on `- name:`-first steps; `permissions`/OIDC assertions are hard-coded to `ci.yml`+`vrt.yml` so a new workflow is exempt.                                                                   | agent |
| 4.13 | `verify-registry-deps.mjs:35` misses `React.lazy(() => import('@/components/ui/x'))` and nested specifiers → undeclared registry dependencies ship.                                                                                                                                                                                                              | agent |
| 4.14 | **`verify-bin-parity.mjs` — the one gate protecting the shipped consumer bin against divergence — is wired to a script but run by NO workflow.** It is also single-specimen (`button` only, which has no `.json` file entry and no multi-file graph). This is exactly where finding 2.3 lives.                                                                   | agent |
| 4.15 | `tooling/normalize-public-api-docs.mjs` and `tooling/resolve-component-contracts.mjs` have **zero references** repo-wide — dead files. `normalize-public-api-docs` additionally writes canonical sources with no re-stamp and no `safe-path` containment.                                                                                                        | agent |
| 4.16 | `packages/ui` `postbuild` (the `'use client'` boundary check) is an npm lifecycle hook, so it is **skipped on any turbo cache hit**.                                                                                                                                                                                                                             | agent |

---

## §5. P1 — Docs teach patterns their own lint bans

| #   | Location                           | Defect                                                                                                                                                                                                                                                             | Owner |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| 5.1 | `foundations/motion.mdx:96`        | Uses `transition-colors` as the page's _positive_ example. Rule `color-transition` bans it.                                                                                                                                                                        | agent |
| 5.2 | `foundations/spacing.mdx:42`       | Teaches inline `style={{ paddingInline: … }}`; `design-lint.mjs:452` fails any non-`--*` style key, and design-principles.mdx says the opposite.                                                                                                                   | agent |
| 5.3 | `components/truncated-text.mdx:90` | Imports `@/components/ui/icon` (does not exist) and uses `<Icon name="file" />` (no `name` prop). Would not compile.                                                                                                                                               | agent |
| 5.4 | 13 component pages                 | Cite `border-ring/70` / `ring-ring/50` — raw `/NN` alpha, banned by `raw-alpha`, and absent from all shipped class strings. Correct forms: `/(--alpha-tint-border)`, `/(--alpha-outline-soft)`. Same stale string in JSDoc at `select.tsx:144`, `textarea.tsx:27`. | agent |

**Docs factual drift:** focus-ring offset stated as 2px on 4 pages (actual: `outline-offset-1`);
accessibility.mdx denies the `focus:` border-tint model for text-entry fields that the system
actually ships; "three easings" (four); `motion` called "an optional peer" (it is a hard dependency
of icon items); "no decorative brand hue" (contradicted by `--brand` + the 10-hue Tag palette);
theming.mdx calls `--primary` theme-independent (it is redefined under `.dark`); `motion-flash`
omitted; 5 public exports undocumented (`DialogTitleBar`, `ComboboxPopupInput`, `CommandFooter`,
`FavoriteStar`, `ChartGrid` — the last two actively harmful, since interaction-patterns.mdx
cross-references `CommandFooter` and chart.mdx teaches hand-rolling what `ChartGrid` exists to fix);
`production-checklist.mdx:32` publishes an exports list missing `./theme-scope`; `icons.mdx:11`
omits the `auto` BrandIcon variant that its own source says to use.

---

## §6. P1 — Packaging & CLI

| #   | Finding                                                                                                                                                                                                                                                                                                                                   | Owner |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 6.1 | `require('@vegastack/design')` and `require.resolve('@vegastack/design/package.json')` both fail — exports maps declare only `types`+`import`, no `require`/`default`, and no `./package.json` entry. Breaks CJS configs and any tool that resolves a package.json (Tailwind plugins, shadcn tooling). Verified against the real tarball. | agent |
| 6.2 | `lucide-react` (39 MB) + `thesvg` (75 MB) are hard runtime `dependencies` but **no shipped module imports them** (`import type` only; absent from `dist`). ~114 MB of dead weight for a consumer who wants `cn()`. Should be optional peers. `tsconfig-paths` is CLI-only.                                                                | agent |
| 6.3 | 3 orphaned chunks ship to npm; `tsup.config.ts` never sets `clean: true`.                                                                                                                                                                                                                                                                 | agent |
| 6.4 | `workspace:*` packs as an exact pin (`"0.1.0"`) → a consumer on `^0.1.0` can get two copies of design-tokens and two divergent `:root` blocks in one Tailwind build. Use `workspace:^`.                                                                                                                                                   | agent |
| 6.5 | CLI exit-code contract breakable: `--cwd` with no value crashes as exit **1** (= the "stale" code); `--filter --fail-on-again` silently consumes the next flag, disabling the CI gate; a removed component prints `?` then "Everything is up to date." and exits 0. `verify`'s parser already does this right — the two disagree.         | agent |
| 6.6 | `verify` has no try/catch on any fetch or on `execFileSync('cosign')` — a DNS failure and a tampered artifact both produce exit 1, the former with a raw Node stack.                                                                                                                                                                      | agent |
| 6.7 | No request timeout anywhere; `check-updates` is N+1 per component (439 icon items ⇒ hundreds of round trips).                                                                                                                                                                                                                             | agent |
| 6.8 | `engines` missing from both published packages.                                                                                                                                                                                                                                                                                           | agent |

---

## §7. Homepage

**Fixed in this session** (verified: `tsc --noEmit` exit 0, `design-lint --docs-shell` clean):

- 6 CTAs rendered `<a role="button" type="button">` via `<Button nativeButton={false} render={<Link/>}>`
  — overriding the link role, emitting invalid HTML, and violating the system's own documented
  Don't (`button.mdx:97`). The homepage was the only place in the repo doing this. Replaced with
  `cn(buttonVariants({…}))` on `<Link>`, matching `page-header.tsx:240`.
- Hero `<h1>` was flat `text-display-xl` (72px) with no mobile step-down, inside an
  `overflow-hidden` section → silently clipped below 375px. Now steps down like every sibling.
- `HomeSystemTrace` tabs pointed `aria-controls` at two non-existent ids. Now a single stable
  `trace-panel` id.
- Footer sat inside Fumadocs' `<main>`, so it mapped to `generic`, not `contentinfo` — no footer
  landmark and an unreachable label. Extracted to `components/home-footer.tsx` and rendered as a
  sibling of `HomeLayout` in `(home)/layout.tsx`.
- CTA labels moved to sentence case, matching all surrounding copy.

**Still open:** 11 spurious `<nav>` landmarks (13 on one page); dead `.home-monochrome` class
(referenced, defined nowhere); `home-component-lab.tsx` — 538 lines, untracked, zero importers;
get-started step 02 advertises a `pnpm dlx skills add …` command documented nowhere else; no
`app/not-found.tsx` (stock Next 404, hardcoded `#000`/`#fff`, canonicalizes to `/`);
`--opacity-track` borrowed for a text reveal at 25% (fails AA for anyone landing mid-page);
OG route hardcodes copy the shared metadata constants own; 719-line page component.

---

## §8. Component completeness — the 12 new arrivals

`announcement-banner`, `code-block`, `comparison-matrix`, `navigation-menu`,
`onboarding-checklist`, `pricing-section`, `property-list`, `ruled-band`, `segmented`, `stat`,
`tag-group`, `tool-call-chip`. (`plan-banner` was created _and_ renamed to `announcement-banner`
entirely within this uncommitted work — it never shipped, so **no `🗑 Removed / renamed` entry is
owed**.)

Complete: canonical source, byte-identical copy-in, registry JSON + integrity, registry.json entry,
contract record, MDX page, preview + barrel + nav, unit tests (53 tests, all passing), VRT route
registration, homepage catalog.

**Missing:**

- **0 of 96 required VRT baselines** — every new component is visually unverified in all 4 lanes.
- **0 CHANGELOG entries.** Top section is still `[0.2.0]`, listing Provider alone. No `[0.3.0]`.
- The `@vegastack/ui` changeset never names them (says "remediate all 97 registry components").
- **Every one has exactly ONE `expectNoA11yViolations`, at rest**, against `add-component` §5's
  explicit "one per meaningfully-different UI STATE". Worst: `navigation-menu`'s a11y test is
  literally named "(closed)" — the open portal panel, the highest-risk a11y surface of the set, is
  never axe-checked. Each fix is one line; the states are already exercised.

---

## §9. The skill layer — the structural gap

**Only `ship` is discoverable.** `tooling/skill-lint.mjs:18` hardcodes `DISCOVERABLE = ['ship']`,
and `.claude/skills/` + `.agents/skills/` contain exactly one symlink each. Proven empirically:
the skills roster in this session lists `ship` and no `vegastack-*` skill. So
`vegastack-add-component`, `vegastack-design-audit`, `vegastack-design-system`,
`vegastack-consume`, `vegastack-brand`, `vegastack-release` are invisible to **both** Claude Code
and Codex — including the two AGENTS.md calls "the post-overhaul authoring/audit canon" and the one
described as "the skill downstream agents load".

Contributing defects:

- Directory names don't match frontmatter `name` (`add-component` vs `vegastack-add-component`).
  Only `ship` matches — likely why it's the only one symlinked.
- `skills/SKILL.md` (the router) is not a valid skill location, advertises 5 unreachable names, and
  is **never linted** — `skill-lint` probes `skills/SKILL.md/SKILL.md`, which doesn't exist, and
  `continue`s.
- `skill-lint`'s header comment lies twice: it claims frontmatter must be "EXACTLY name +
  description" (the code only checks presence; `metadata:` is permitted and harmless) and that
  "name matches the directory" (no such check exists).

### Lifecycle ownership map — steps owned by NOTHING

| Step                        | Command                                                                   | Owner today                                               |
| --------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| Full system verify          | `pnpm design:verify` (13 gates incl. RSC-safety, contract reconciliation) | **nobody** — appears in zero skills                       |
| Real-consume proof          | `pnpm registry:verify-consume`                                            | **nobody**                                                |
| Dual discovery-matrix build | `SITE_VISIBILITY=private/public pnpm build`                               | **nobody** — `SITE_VISIBILITY` in zero skills             |
| Baseline completeness       | `pnpm --filter @vegastack/docs verify:vrt-baselines`                      | **nobody** — and it is red today                          |
| Contract record on MODIFY   | `packages/ui/component-contracts.json`                                    | **nobody** — `add-component` frames it as VRT-routes-only |

An agent that follows `add-component`'s "Verify (the local gate)" block runs design-lint + tsc +
vitest + registry:build + a shadcn add, and stops. **That set passes while `pnpm design:verify`
fails.** And there is no MODIFY skill at all — `add-component` is add-shaped throughout,
`design-audit` is read-only, `ship` starts after the change is complete. The most common workflow
is unowned end to end.

### Other skill defects

- `ship` §5 describes the cutover's two `public-docs-cutover` approvals as unconditional. Its own
  command passes no `-f run_public_cutover`, so **both jobs skip and neither approval appears** —
  an agent following §5 waits forever.
- `ship` §4 says `git push origin main`; `RELEASING.md:36` requires a reviewed PR. Contradiction,
  and `ship` (the one an agent follows) is the permissive one.
- `ship` §1 preflight omits `verify:vrt-baselines` — the gate that will actually block the ship.
- `ship` §6 says `pnpm test:smoke`; no such root script (`pnpm --filter @vegastack/ui test:smoke`).
- `ship` §1 says `git status --porcelain # must be empty` — fails right now, no stated remedy.
- `add-component` §6.5 teaches "check an existing recent item for the live version" for
  `lucide-react`; two pins exist in-tree (`^1.20.0` and `^0.525.0` on six of the newest items), so
  that instruction is a coin flip between a valid pin and a different major.
- Dangling `§7.6` cross-reference in `add-component:159` and `design-audit:70` — the section no
  longer exists (the matrix is now fully generated). `design-audit` gates _accepting a new render
  exemption_ on it.
- `design-audit:213` points at `PAGES` in `components.spec.ts`; routes now come from
  `contract-routes.generated.ts`.
- `ship/references/vrt-baselines.md` says "~200 PNGs" (a full bootstrap is 872), describes the
  hand-maintained `PAGES` array, and never mentions the 872 completeness gate.
- `skills/release/` is a deprecated router that is itself undiscoverable — nobody can reach the
  redirect it exists to serve.

---

## §10. Stale plans that grant authority AGENTS.md revokes

AGENTS.md points agents into `docs/plans/` (`00-START-HERE.md`). Eight files there carry live-voiced
autonomy grants and stale facts, with no superseded banner — while seven sibling plans already have
one, so the pattern exists and just wasn't applied uniformly:

`HANDOFF-FABLE5.md` ("MK has authorized **fully autonomous**"),
`2026-07-system-audit-remediation.md` ("**AUTONOMOUS EXECUTION AUTHORIZED** … no approval pauses"),
`v2-rollout-mandate.md` ("IN PROGRESS · autonomous · **DO NOT STOP**"),
`00-START-HERE.md` ("all **64** components", `@vegastack/tokens`, "public npm for
tokens/preset/**utils**/**icons**"), `design-v2-implementation.md` ("**59** built"),
`animated-icons-and-icon-coverage.md` (`@vegastack/icons`), plus three "awaiting approval" plans for
work already shipped. `docs/README.md:6,12` repeats the dead package names and "64-component
system".

These directly contradict the MK gate. **Cheapest high-value fix in the review.**

**Non-finding:** `.DS_Store` is correctly gitignored and untracked — not committed junk.

---

## Fix sequence

1. **§0 repo-state hazards** — restage, track the eleven authorities, add `.prettierignore`.
2. **§2.1–2.3 supply chain** + wire `verify-bin-parity` into CI (§4.14) — these are consumer-facing.
3. **§4 fail-open gates** — every one of these is a hole in the net that let the rest through.
4. **§5 docs** + §1 wrong numbers — cheap, high-volume, mechanical.
5. **§8** axe-per-state + CHANGELOG `[0.3.0]` + a naming changeset.
6. **§9 skill layer** — new `component-change` skill, symlink + rename all skills, fix `skill-lint`,
   correct `ship` §4/§5/§1/§6, retire `skills/release/`.
7. **§10** banner the stale plans.
8. **§6 packaging** — needs a changeset; consumer-visible.
9. **MK-owned** (§2.4–2.6, §3.1–3.4): environments, branch protection, secret scoping, Actions
   defaults, `CF_ZONE_ID`, VRT bootstrap dispatch.
