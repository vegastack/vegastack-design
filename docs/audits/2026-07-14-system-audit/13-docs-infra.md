# Docs Infrastructure Audit — 2026-07-14

Scope: `apps/docs` as **infrastructure** (Fumadocs 16.10.5 + Next 16.2.9 static export →
Cloudflare Workers Static Assets, Orama search, twoslash, the private `/r/*` registry host).
Does **not** re-cover component/docs *content* coverage (see `07-docs-previews.md`, which audited
all 68 components' MDX/preview/registry sync and found it clean) or the general dependency-version
sweep (see `04-versions-research.md`, which already flagged the Fumadocs pin — referenced, not
repeated, below). This file is additive: config wiring, LLM-consumption surface, showcase DX
benchmarking, static-export performance, registry hosting, and CI.

**Bottom line:** the LLM-consumption story is already unusually good for a 2026 design-system docs
site (`llms.txt`, `llms-full.txt`, per-page raw markdown routes, a `MarkdownCopyButton` +
`ViewOptionsPopover` in the UI, and a registry auth pattern shadcn's MCP server can consume
out-of-the-box). The two real gaps are (1) **zero SEO/metadata infrastructure** — no
`metadataBase`, no OG image generation, no sitemap, no robots.txt, despite Fumadocs shipping a
built-in OG generator — and (2) a **static-export bloat problem**: several component pages
generate 6–11MB of HTML each (1,500+ near-duplicate inline `<script>` chunks), which is the
concrete, file-line-verified performance finding in this pass.

---

## (a) Current-setup map

| Concern | Implementation | File |
|---|---|---|
| MDX pipeline | `fumadocs-mdx/next` + `defineDocs`/`defineConfig`, shallow custom frontmatter schema (avoids a TS2589 depth error under TS 6 + Zod 4) | `apps/docs/source.config.ts:1-39` |
| Next config | `output: 'export'`, `serverExternalPackages: ['typescript', 'twoslash']` | `apps/docs/next.config.mjs:1-12` |
| Root layout | Geist Sans/Mono via `next/font` (geist pkg) + Lora via `next/font/google`, no `<title>`/`metadata` export at all | `apps/docs/app/layout.tsx:1-27` |
| Docs layout | `DocsLayout` from `fumadocs-ui/layouts/docs`, `baseOptions()` (nav title + GitHub link only) | `apps/docs/app/docs/layout.tsx`, `apps/docs/lib/layout.shared.tsx` |
| Page render | `DocsPage` + `MarkdownCopyButton` + `ViewOptionsPopover` + optional page-level `<Preview>` component keyed off frontmatter `preview:` field | `apps/docs/app/docs/[[...slug]]/page.tsx:31-57` |
| Search | Orama static client (`fumadocs-core/search/client/orama-static`), server route `createFromSource` | `apps/docs/components/search.tsx`, `apps/docs/app/api/search/route.ts` |
| Theming/providers | Fumadocs `RootProvider` (search only, `theme.enabled:false`) wraps `VegaStackProvider` (single owner of next-themes + Base UI direction + tooltip) + dogfooded copy-in `Toaster` | `apps/docs/components/provider.tsx` |
| MDX components | Fumadocs defaults + Tabs + Twoslash + `TypeTable`/`AutoTypeTable` + custom `ComponentPreview`, `DoDont`, 8 foundation-spec components, `IconGallery`, `RegistryInstallCallout` | `apps/docs/components/mdx.tsx` |
| Component preview DX | Tabs("Preview"/"Code"), code tab reads source off disk at build time via `readFileSync` + `highlight()` (build-time only, compatible with `output:'export'`) | `apps/docs/components/component-preview.tsx` |
| LLM output | `llms.txt` (index), `llms-full.txt` (every page concatenated), `llms.mdx/docs/[...slug]` (per-page raw markdown) — all `revalidate:false` static routes | `apps/docs/app/llms.txt/route.ts`, `llms-full.txt/route.ts`, `llms.mdx/docs/[[...slug]]/route.ts` |
| Registry hosting | `public/r/*.json` (68 components + ~439 mirrored icons + `registry.json` index + Sigstore-signed `integrity-manifest.json`/`.sigstore`), served as static assets, gated by Cloudflare Access (SSO for docs, service-token for `/r/*`) | `apps/docs/wrangler.jsonc`, `.github/workflows/deploy.yml` |
| CI | 4 workflows: `ci.yml` (PR gate: typecheck/lint/test/build/registry-verify), `vrt.yml` (PR visual regression, self-activating), `deploy.yml` (manual, signs + deploys + verifies live CF Access policy), `release.yml` (main-push, changesets publish) | `.github/workflows/*.yml` |

No `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, custom `not-found.tsx`, `error.tsx`, or
`global-error.tsx` exist anywhere under `apps/docs/app` — verified by exhaustive `find`. The `out/`
static export does contain a generic Next-generated `404.html`/`_not-found.html`, but that's the
framework default, not an authored error page.

---

## (b) Fumadocs version + feature gaps

- **Version pin**: `fumadocs-core`/`fumadocs-ui` are held at `16.10.5` via
  `pnpm-workspace.yaml:26-28`'s `minimumReleaseAgeExclude`, while upstream is at **16.11.2+** (as
  of Jul 10 2026). This is the same pin `04-versions-research.md` already flagged as "deliberately
  exempted... document why, don't fix the exclude" — not re-litigating that here, just confirming
  it from the infra side: the exclude carves these two packages OUT of the repo's install-time
  minimum-release-age supply-chain guard (i.e., "trust fresh Fumadocs publishes immediately"),
  which is consistent with wanting to track a fast-moving framework closely. No independent
  evidence in this pass of a breaking change between 16.10.5 and current that would block a bump.
- **`generateOGImage` (`fumadocs-ui/og`)** — Fumadocs ships a built-in dynamic OG-image generator
  (`fumadocs.dev/docs/integrations/og`, Satori-based, works with `output:'export'` via a route
  handler). **Not used anywhere in this repo** (confirmed zero hits for `generateOGImage`,
  `opengraph`, `metadataBase`, or a title template across `apps/docs`). Every shared docs link
  (Slack, GitHub PR previews, etc.) currently renders with no preview image and a generic/empty
  title — a real gap for a project literally named "showcase."
- **Rust/WASM MDX compilation** — no fumadocs-specific Rust compiler exists for MDX itself (that's
  `mdxjs-rs`/`oxc`, general-purpose JS/TS tooling, not something Fumadocs has adopted as of this
  search); Fumadocs' own perf docs (`fumadocs.dev/docs/mdx/performance`) instead recommend
  splitting large doc sets and using Turbopack/webpack tuning. At **69 MDX pages** this repo is
  well below the "500+ files, slow" threshold Fumadocs' own docs cite, so this isn't an actionable
  gap yet — noting only because the mission asked.
- **OpenAPI integration** (Fumadocs OpenAPI v10) — not applicable; this is a component-library
  registry, not a REST API, so there's no OpenAPI spec to render playgrounds from. Correctly
  unused.
- **New Fumadocs UI features not adopted**: nothing else version-specific surfaced as missing in
  the 16.10→16.11 diff that's relevant to a component-showcase (the 16.2 "UI Refactor" and MDX 15
  release are both already behind us in the current pin).

Sources: [Fumadocs Blog](https://www.fumadocs.dev/blog), [Fumadocs OG Image Generation](https://www.fumadocs.dev/docs/integrations/og), [Fumadocs MDX Performance](https://www.fumadocs.dev/docs/mdx/performance), [fumadocs-ui npm](https://www.npmjs.com/package/fumadocs-ui).

---

## (c) Component showcase DX — ranked improvements

Current state: `ComponentPreview` is a static Tabs toggle (Preview / Code), server-rendered, code
read from disk at build time (`apps/docs/components/component-preview.tsx:21-29`). No editable
props, no responsive frame, no per-preview theme toggle, no "copy as prompt" affordance. This is
solid and correctly `output:'export'`-safe, but is baseline 2024-era shadcn-docs DX, not 2026
best-in-class (compare: shadcn's own docs added a v0-style "Open in v0"/copy-prompt button; Base UI
docs ship an editable-props playground per example).

Ranked by effort vs. impact (skipping the `MarkdownCopyButton`/`ViewOptionsPopover` win, which is
**already shipped** — see §d):

1. **High impact, low effort — "Copy as prompt for AI agents" button next to the existing
   Preview/Code tabs.** The infra to do this is already 90% built: `getPageMarkdownUrl` +
   `getLLMText` (`apps/docs/lib/source.ts:10-18`) already produce a clean `# Title (url)\n\n<md>`
   blob per page, and `MarkdownCopyButton` already copies it. The missing piece is a
   *component-level* variant scoped to just the preview's source file (not the whole page) — e.g. a
   button on the "Code" tab that copies `` `Implement using this VegaStack component:\n\n<file>` ``
   for pasting into an agent chat. Given the project's own positioning ("consumable by humans and
   AI agents alike" — `apps/docs/app/(home)/page.tsx:9`), this is squarely on-brand and reuses
   existing plumbing.
2. **Medium impact, low effort — responsive frame toggle (mobile/tablet/desktop) on
   `ComponentPreview`.** Radix Themes / shadcn's newer docs both ship this; it's a client-side
   width-constrained wrapper `div` around the existing `<Comp />`, no new data plumbing needed.
   Straightforward since `ComponentPreview` already isolates the live render in one place.
3. **Medium impact, medium effort — per-preview theme toggle (light/dark) independent of the site
   theme.** Useful for auditing token contrast without leaving the page. Requires either a
   client-island wrapper around each `<Comp />` with its own `data-theme` scope, or reusing
   `next-themes`' `ThemeProvider` scoping — needs to interact carefully with
   `VegaStackProvider`'s single-owner-of-theme design (`apps/docs/components/provider.tsx:19-21`),
   so more thought than #1/#2.
4. **Lower priority — variant matrices / editable props playground.** Real best-in-class (Base UI
   docs), but highest effort: needs a client-side prop-control UI wired to each component's actual
   prop types (could piggyback on the existing `AutoTypeTable`/`fumadocs-typescript` generator for
   prop introspection, but building the interactive control surface is a multi-week feature, not an
   infra tweak). Worth a follow-up design doc, not a quick win.

---

## (d) LLM/agent consumption — already strong, two concrete additions

**What's already shipped (good news, verified in this pass):**
- `GET /llms.txt` — an index of every page with a one-line description, generated via
  `fumadocs-core/source`'s `llms()` helper (`apps/docs/app/llms.txt/route.ts`).
- `GET /llms-full.txt` — every page's processed markdown concatenated (`llms-full.txt/route.ts`),
  424KB in the current `out/` build.
- `GET /llms.mdx/docs/[...slug]` — per-page raw markdown, statically generated for every doc page
  (`llms.mdx/docs/[[...slug]]/route.ts`), 596KB total across all pages in `out/`.
- In-UI: every doc page has a `MarkdownCopyButton` (copies that page's raw markdown) and a
  `ViewOptionsPopover` (links to the GitHub source + presumably the raw-markdown URL) —
  `apps/docs/app/docs/[[...slug]]/page.tsx:44-49`.
- Registry MCP compatibility: shadcn's official MCP server "works out of the box with any
  shadcn-compatible registry" as long as a `registry.json` index exists at the registry root
  (`ui.shadcn.com/docs/registry/mcp`) — confirmed `apps/docs/public/r/registry.json` exists and is
  well-formed. **This means a downstream agent's shadcn MCP server can already discover and browse
  the VegaStack registry**, gated the same way the CLI is (Cloudflare Access headers, documented
  below) — this wasn't previously called out anywhere in the repo's docs as a capability, worth a
  one-line callout in `docs/RELEASING.md` or `install.mdx` so consumers know it's possible.
- Registry auth story for CLI/agent consumers is already well-documented in
  `apps/docs/content/docs/install.mdx:44-62`: `components.json`'s `registries.@vegastack.headers`
  with `${CF_ACCESS_CLIENT_ID}`/`${CF_ACCESS_CLIENT_SECRET}` env-var expansion. This matches
  current shadcn CLI capability exactly (arbitrary custom headers with `${VAR}` expansion from
  `.env.local`/shell, confirmed via `ui.shadcn.com/docs/registry/authentication`) — **no gap here**,
  the documented pattern is correct and current.

**Concrete gaps / additions worth making:**
1. **No `llms.txt` discovery link in page `<head>`** — there's no `<link rel="llms.txt">` or
   equivalent hint, and no mention of `/llms.txt` in `robots.txt` (which doesn't exist — see §e).
   Cheap to add once a `robots.ts` exists.
2. **The component-level "copy as prompt" button** described in §c-1 is the single highest-leverage
   LLM-consumption addition beyond what's shipped — right now an agent (or human copying for an
   agent) has to fetch the whole-page markdown via `llms.mdx/docs/<slug>` and manually extract the
   relevant code block; a scoped button would remove that step.
3. **No machine-readable component *metadata* endpoint beyond the registry JSON itself** — the
   registry items carry `meta.whenToUse`/`meta.whenNotToUse` (confirmed in
   `packages/ui/registry.json`, e.g. the `marker` item), which is exactly the kind of
   agent-decision-support data a coding agent would want when choosing between components. This is
   already being authored — worth surfacing it more prominently (e.g. included verbatim in the
   `llms.txt` index one-liners, which currently only show `description`, not `whenToUse`).

---

## (e) Performance/quality findings (file:line where applicable)

**No metadata/SEO infrastructure at all** (the most concrete "not modern" finding):
- No `export const metadata` / `generateMetadata` beyond the bare per-page `{title, description}`
  in `apps/docs/app/docs/[[...slug]]/page.tsx:63-68` — no `metadataBase`, no `openGraph`/`twitter`
  fields, no title template (`%s | VegaStack Design`), confirmed via exhaustive grep across
  `apps/docs`.
- No `app/sitemap.ts`, no `app/robots.ts` — confirmed absent. Next.js supports both as static
  route handlers compatible with `output:'export'`.
- No `opengraph-image` route despite Fumadocs shipping `generateOGImage` — see §b.
- `apps/docs/app/(home)/page.tsx` (the marketing landing page) has no `export const metadata` at
  all, inheriting only the root layout's title-less `<html>` — the home page currently has **no
  `<title>` tag** distinct from whatever Next's default fallback produces.

**Static-export bloat — the concrete perf finding:**
- `apps/docs/out/docs/` is **543MB** across 745 files (the rest of `out/` — `_next`, `r`, `api`,
  `llms*` — totals ~12MB combined). Several individual component pages are 6–11MB of HTML:
  `sidebar.html` (11MB), `dropdown-menu.html` (11MB), `context-menu.html` (11MB), `select.html`
  (8.9MB), `alert-dialog.html` (7.3MB), `field.html`/`table.html` (6.8–6.9MB), `dialog.html`
  (6.8MB), `popover.html`/`sheet.html` (6.4–6.6MB).
- Root cause, verified by extraction: `sidebar.html` alone contains **1,578 inline `<script>`
  tags** totaling ~6.85MB, with dozens of near-identical chunks in the 74–78KB range (top 10
  script sizes: 77795, 77253, 74867, 74687, 74684, 74587, 74582, 74580, 74580, 74578 bytes — a
  tight cluster, not organically varied content). This is Next's RSC flight-data serialization
  duplicating near-identical payload across many client-component boundaries — `sidebar.mdx` has
  **18** separate `<ComponentPreview>`/`<AutoTypeTable>` invocations
  (`apps/docs/content/docs/components/sidebar.mdx`), each apparently forcing its own large
  serialized-props chunk. This is a genuine static-export size/perf problem: even though Cloudflare
  Workers Static Assets serves these as flat files (no server cost), an 11MB HTML response is a
  real Core Web Vitals hit (LCP/TBT) for anyone loading `/docs/components/sidebar` cold, and it
  balloons the deploy artifact pushed to Cloudflare on every `deploy.yml` run.
  - **Worth investigating** (not fixed here, per the read-only mandate): whether pages with many
    `<ComponentPreview>` instances can share one serialized RSC payload instead of one per
    instance, or whether `AutoTypeTable`'s generator output is being re-embedded per-invocation
    rather than deduplicated. This is a Fumadocs/Next RSC-serialization behavior worth a targeted
    follow-up, not a quick fix.
- **Font loading**: correctly modern — Geist Sans/Mono via the dedicated `geist` npm package
  (self-hosted, no external request) and Lora via `next/font/google` with `display:'swap'`
  (`apps/docs/app/layout.tsx:2-8`). No render-blocking web-font `<link>` tags. No issues found.
- **Images**: no `next/image` usage anywhere in the app (confirmed by exhaustive grep — the only
  hit is a code comment inside a copied-in registry component, `markdown-view.tsx:172`, explaining
  *why* it deliberately avoids `next/image`). Consistent with a near-image-free
  icon/color-swatch-driven showcase; not a gap, just worth confirming there's no
  hidden-unoptimized-`<img>` problem — there isn't.
- **CSS**: single `apps/docs/app/global.css` (71 lines), imports Tailwind v4 + `fumadocs-ui`
  presets + `@vegastack/tokens` + `tw-animate-css` + twoslash CSS, `@source`-scans the two
  workspace packages for class usage. One global stylesheet, no per-route CSS split observed to
  investigate — reasonable for this app's size.
- **Analytics**: none present (no Plausible/Vercel Analytics/PostHog script, no analytics-related
  env vars in workflows). Not necessarily a gap (internal tool), but worth an explicit decision —
  currently there's no way to know which components/pages downstream teams actually consult.

---

## (f) Registry hosting

- **`registry.json` at the registry root** — present, well-formed (`apps/docs/public/r/registry.json`),
  which is the one requirement for shadcn's MCP server auto-discovery (see §d).
- **No `_headers`/`_redirects` file** — Cloudflare Workers Static Assets supports a `_headers` file
  for per-path cache-control/CORS rules (Pages-style); none exists here (confirmed via `find`).
  Current cache behavior is whatever Workers Static Assets defaults to. Given `/r/*` items are
  **content-addressed by integrity hash** (the whole point of the SHA-256 provenance scheme) but
  served at a **name-based** URL (`/r/<name>.json`, not `/r/<name>-<hash>.json`), there's no
  versioned-URL immutable-caching opportunity without a URL scheme change — flagging as a
  observation, not proposing the scheme change (that would reopen the "not yet built" per-item
  independent-semver item already listed as a known future item in `docs/RELEASING.md`).
- **CORS**: the local dev registry (`registry:serve` → `serve public/r -l 4000 --cors`,
  `apps/docs/package.json:11`) explicitly enables CORS; the production Cloudflare deployment's CORS
  posture isn't configured in-repo (no `_headers`) and isn't verified by `deploy.yml`'s live-policy
  check, which only asserts the SSO/service-token gating (`.github/workflows/deploy.yml`'s "Verify
  Cloudflare Access policy" step) — it does not check CORS headers on `/r/*` responses. If the
  shadcn CLI or an MCP server ever fetches `/r/*` from a browser context (not just Node), missing
  CORS headers would silently break that path; worth adding a CORS assertion alongside the existing
  auth assertions if browser-context consumption is ever a target.
- **Versioned URLs**: not present — `meta.version` inside each JSON item is the only version
  signal; the URL itself (`/r/button.json`) is not versioned. This is by design per
  `docs/RELEASING.md`'s "Versioning model" section (integrity-hash-based staleness, not URL
  versioning) — consistent, not a bug.

---

## (g) CI findings

- **Redundant full builds across workflows, no Turborepo remote caching.** `turbo.json` defines
  local task caching only (`outputs: ["dist/**", ".next/**", ...]`, no `remoteCache` config), and
  none of the four workflows (`ci.yml`, `vrt.yml`, `deploy.yml`, `release.yml`) set `TURBO_TOKEN`/
  `TURBO_TEAM` (confirmed via grep — only `cache: pnpm` for the pnpm store appears, no Turbo remote
  cache). On a single PR, `ci.yml` and `vrt.yml` both run **independently** and each does its own
  full `pnpm install --frozen-lockfile` + `pnpm build` from a cold Turbo cache — two full builds in
  parallel jobs that could share one cached build via Turborepo remote caching (Vercel Remote Cache
  or a self-hosted one). `deploy.yml` and `release.yml` each add a *third* and *fourth* independent
  full build/VRT-gate cycle on their own trigger paths. This is the most actionable CI finding: an
  hour of setup (point `turbo.json` at a remote cache + add the token secret) would cut redundant
  build/VRT time significantly, especially valuable since VRT is in a heavyweight pinned Playwright
  container (`mcr.microsoft.com/playwright:v1.61.0-noble`) run from scratch in three of the four
  workflows.
- **No PR preview deployments.** `deploy.yml` is `workflow_dispatch`-only by design (the repo's
  documented "build LOCAL, stop at publish/deploy" policy — this is almost certainly intentional
  given the explicit operating-mode note in `AGENTS.md`, not an oversight). Flagging only because
  the mission asked to check for it: there is no Cloudflare Pages-style automatic PR preview URL, so
  reviewers currently only see the VRT pixel diffs, not a live clickable preview. Given the
  project's stated "build LOCAL, stop at publish" policy this is a deliberate tradeoff, not a gap to
  silently fix — surfacing for awareness only.
- **VRT/CI container pinning is consistent** — all four workflows pin the identical
  `mcr.microsoft.com/playwright:v1.61.0-noble` image (cross-checked line-by-line), which is
  correctly called out in each workflow's own comments as required for font-rendering determinism.
  No drift found.
- **Fail-closed gates are unusually rigorous** — VRT baseline-missing gate, zero-screenshot-executed
  guard, registry `git status --porcelain` idempotency check, and a live Cloudflare Access policy
  probe (anonymous-rejected / service-token-accepted) all present and correctly wired in
  `deploy.yml`. No changes recommended here; this is already best-practice-level CI rigor.
- **`pnpm typecheck` includes `fumadocs-mdx` + `next typegen`** as a scripted pre-step
  (`apps/docs/package.json:11`, `"typecheck": "fumadocs-mdx && next typegen && tsc --noEmit"`) —
  correct pattern for a Fumadocs + `output:'export'` project (typegen must run before `tsc` sees
  the generated route types); no issue found.

---

## Prioritized recommendation list

1. **[High impact, low effort] Add baseline SEO/metadata infra**: `metadataBase`, a title template,
   `app/sitemap.ts`, `app/robots.ts`, and wire up Fumadocs' built-in `generateOGImage` for at least
   the docs pages and the home page. Currently zero of these exist; this is the single biggest gap
   for a public-facing (even if SSO-gated) "showcase."
2. **[High impact, low effort] Ship a component-scoped "copy as agent prompt" button** on
   `ComponentPreview` (§c-1/§d-2), reusing the already-built `getLLMText`/markdown-copy plumbing —
   directly serves the project's stated "consumable by humans and AI agents alike" positioning.
3. **[Medium impact, low-to-medium effort] Set up Turborepo remote caching** and wire
   `TURBO_TOKEN`/`TURBO_TEAM` into all four workflows — the most concrete CI-time win available,
   given `ci.yml`/`vrt.yml`/`deploy.yml`/`release.yml` currently each do independent cold builds.
4. **[Medium impact, medium effort] Investigate the static-export HTML bloat** on
   multi-preview pages (`sidebar.html`/`dropdown-menu.html`/`context-menu.html` at 11MB each, 1,500+
   duplicated inline RSC script chunks) — root-cause whether the per-`<ComponentPreview>` RSC
   payload serialization can be deduplicated or streamed differently. Concrete perf/deploy-artifact
   cost, needs a Next/Fumadocs-specific investigation before a fix is chosen.
5. **[Medium impact, medium effort] Add a responsive frame toggle to `ComponentPreview`** (§c-2) —
   cheap relative to the other DX asks and closes a real gap vs. 2026 best-in-class component docs
   (Radix Themes, newer shadcn docs).
6. **[Low impact, low effort] Surface registry `meta.whenToUse`/`whenNotToUse` in `llms.txt`**
   entries and add a one-line "this registry is shadcn-MCP-compatible" callout to
   `docs/RELEASING.md`/`install.mdx` (§d-3) — both are small documentation/generator tweaks that
   make already-authored data more discoverable to agents.
7. **[Low impact, low effort] Add a `_headers` file** for `/r/*` cache-control (and CORS, if
   browser-context registry consumption is ever a goal) and extend `deploy.yml`'s live-policy check
   to assert on it, mirroring the existing SSO/service-token assertions.
8. **[No action / awareness only]** The Fumadocs 16.10.5 pin (§b) and the lack of PR preview
   deploys (§g) both read as deliberate decisions already documented elsewhere in the repo — not
   re-flagging as bugs, just confirmed from the infra angle in this pass.
