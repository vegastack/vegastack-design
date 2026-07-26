# Changelog

All notable changes to VegaStack Design, versioned by the **design-system (registry) version**
— the version every registry item carries. npm package versions are listed per entry under
**📦 npm**. Sections use a fixed vocabulary (enforced by `tooling/changelog-lint.mjs`):
`🧩 New components` · `🔧 Changed components` · `🗑 Removed / renamed` · `🛠 CLI & tooling` ·
`📦 npm` · `📚 Docs` · `🐛 Fixed` · `⚠️ Breaking`.

The docs [Changelog page](https://design.vegastack.com/docs/changelog) is **generated from this
file** by `tooling/sync-changelog.mjs` — edit here, never there.

## [0.4.0] — July 27, 2026

### 🧩 New components

- **ActionBar**, **ChipInput**, **EditableCell**, **FilterBuilder** (`filter-bar-managed`),
  **NumberField**, **ShortcutOverlay**, **Stepper**, and **Timeline** — eight additions from the
  CRM commission (plan 2026-07-26), each with complete docs, state coverage, accessibility tests,
  and registry integrity metadata.
  [components](https://design.vegastack.com/docs/components/action-bar)
- **useListNav** and **usePlatform** — two new registry hooks: roving-tabindex keyboard navigation
  for lists and grids (RTL-aware arrows, `homeEndScope`, overlay suppression), and SSR-safe
  platform detection (`{ os, isTouch }`) for `Kbd`'s modifier rewriting and touch gating.
  [guide](https://design.vegastack.com/docs/guides/components)

### 🔧 Changed components

- **Table** — new `containerClassName` / `containerProps` forwarded to the
  `data-slot="table-container"` scroll wrapper, the attachment point for sticky headers,
  fixed-height viewports, and virtualizers.
  [docs](https://design.vegastack.com/docs/components/table)
- **DataList** — `DataListProps` now extends `TableProps` (the spreadsheet voice and container
  hooks type-check), columns gain a per-cell `cellClassName` hook, and `render` receives an
  optional third `DataListCellContext` argument. All additive.
  [docs](https://design.vegastack.com/docs/components/data-list)
- **FieldInline** — additive controlled edit mode (`editing` / `onEditingChange`) and a `tabIndex`
  override for the display element, so `EditableCell` and grid hosts compose it instead of forking
  it. No behaviour change for existing consumers.
  [docs](https://design.vegastack.com/docs/components/field-inline)
- **ColorPicker** and **EmojiPicker** — internal refactor onto the shared `useListNav` hook; no
  visual or API change. EmojiPicker's horizontal arrow keys become RTL-aware, matching ColorPicker.
  [docs](https://design.vegastack.com/docs/components/color-picker)

### 🛠 CLI & tooling

- `verify-registry-deps` gains a fail-closed npm-range check: a registry item pin the installed
  version cannot satisfy now fails `registry:build` instead of passing silently.

### 📚 Docs

- Every registry item's npm dependency pin is reconciled to `packages/ui/package.json`
  (`lucide-react` was declared at both `^1.20.0` and `^0.525.0` across a major boundary;
  `@shadcn/react` at `^0.1.0` against an installed `^0.2.1`).
- `table.mdx` no longer claims the Table parts add no props; `data-list.mdx` documents that a
  column `render` is invoked as a plain function (hooks belong in a returned component element).

## [0.3.0] — July 24, 2026

### 🧩 New components

- **AnnouncementBanner**, **CodeBlock**, **ComparisonMatrix**, **NavigationMenu**,
  **OnboardingChecklist**, **PricingSection**, **PropertyList**, **RuledBand**, **Segmented**,
  **Stat**, **TagGroup**, and **ToolCallChip** — twelve production-ready additions with complete
  docs, state coverage, accessibility tests, responsive previews, and registry integrity metadata.
  [components](https://design.vegastack.com/docs/components/announcement-banner) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 🔧 Changed components

- **MarkdownView** — remote image sources are now same-origin by default; explicitly allow trusted
  remote origins with `allowedImageOrigins`. The renderer and copied-file verifier also enforce
  contained paths and digest-pinned post-write checks.
  [docs](https://design.vegastack.com/docs/components/markdown-view) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- **Provider** and all portal-owning components now share an explicit theme-scope contract, while
  server-safe modules are verified under React's real `react-server` condition.
  [docs](https://design.vegastack.com/docs/components/provider) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 🛠 CLI & tooling

- `vegastack-design skills install` now bundles and safely installs the four public VegaStack agent
  skills for Claude Code and Codex, with atomic conflict handling, symlink containment, dry-run,
  and single-surface options.
  [guide](https://design.vegastack.com/docs/guides/agent-skills) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- `vegastack-design check-updates` now verifies installed file bodies and the complete target set;
  matching provenance headers can no longer hide edited content, and removed or renamed targets
  fail `--fail-on-update`.
  [guide](https://design.vegastack.com/docs/guides/components) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- Registry builds now prune stale artifacts, reconcile exact authority/index/manifest sets, and
  prove real shadcn consumption against locally packed npm artifacts before release.
  [integrity](https://design.vegastack.com/docs/guides/registry-auth) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 📦 npm

- `@vegastack/design` **0.2.0** — adds bundled public agent skills, the skills installer,
  CommonJS-compatible exports, and the explicit `./theme-scope` client subpath while preserving a
  server-safe root.
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- `@vegastack/design-tokens` **0.2.0** — publishes the unified DTCG-backed doctrine, strong type and
  effect roles, exact dark/marketing parity, and verified ESM/CommonJS/package exports.
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- Private `@vegastack/ui` advances to **0.3.0** to stamp the 538-item registry; it remains private
  and is never published to npm.
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 📚 Docs

- The public design doctrine, component contracts, homepage catalog, API reference, agent guidance,
  internal SSO corpus, metadata, and release/cutover runbooks now derive from current machine
  authorities and build successfully in both private and public visibility modes.
  [design doctrine](https://design.vegastack.com/docs/foundations/design-principles) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### 🐛 Fixed

- State-specific accessibility coverage now exercises open, expanded, selected, disabled,
  highlighted, loading, empty, error, success, and removable states across the applicable
  component contracts; all token contrast pairs pass WCAG 2.2 AA gates in both themes.
  [accessibility](https://design.vegastack.com/docs/foundations/accessibility) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)
- Release and deploy workflows now use the reviewed-merge/manual-dispatch approval model supported
  by the private GitHub Team repository, retain isolated OIDC and repository secrets, and probe the
  Cloudflare Access boundary after deployment.
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

### ⚠️ Breaking

- `vegastack-design verify --post-write` now requires `--expected-integrity`; use the exact
  integrity-pinned command printed by the pre-write verification. **MarkdownView** also requires an
  explicit allowlist for cross-origin images.
  [verification](https://design.vegastack.com/docs/guides/registry-auth) ·
  [MarkdownView](https://design.vegastack.com/docs/components/markdown-view) ·
  [`6c60d53`](https://github.com/VegaStack/vegastack-design/commit/6c60d53)

## [0.2.0] — July 19, 2026

### 🧩 New components

- **Provider** — the app-root wrapper (theme, toasts, tooltip coordination, text direction);
  install once via `shadcn add @vegastack/provider`, composes the `sonner` Toaster item.
  [docs](https://design.vegastack.com/docs/components/provider) ·
  [`c7de692`](https://github.com/VegaStack/vegastack-design/commit/c7de692)

### 🔧 Changed components

- **Checkbox**, **Switch** — Story explorer controls narrowed to human-usable props (the raw
  Base UI prop graph serialized to ~24 MB per page, over Cloudflare's 25 MiB asset limit).
  No API change.
  [checkbox](https://design.vegastack.com/docs/components/checkbox) ·
  [switch](https://design.vegastack.com/docs/components/switch) ·
  [`45c7cf8`](https://github.com/VegaStack/vegastack-design/commit/45c7cf8)
- **dashboard-01** (block) — component files now target `app/dashboard/components/` (the page's
  relative imports were broken on clean installs) and `page.tsx` ships the default export Next
  requires for route files.
  [docs](https://design.vegastack.com/docs/blocks/dashboard-01) ·
  [`ac6288a`](https://github.com/VegaStack/vegastack-design/commit/ac6288a)
- **use-animation-replay** (hook) — stray duplicate header line removed (caused a false drift
  flag in `check-updates`).
  [`ac6288a`](https://github.com/VegaStack/vegastack-design/commit/ac6288a)

### 🛠 CLI & tooling

- `vegastack-design check-updates` is **header-optional**: the shadcn CLI strips provenance
  headers on copy-in, so copies are now identified by filename against the registry index and
  compared by alias-normalized content. New `≈ drift` status (differs — upstream update or
  local edits); `--fail-on-update` fails on `update` + `drift`.
  [guide](https://design.vegastack.com/docs/guides/components) ·
  [`ac6288a`](https://github.com/VegaStack/vegastack-design/commit/ac6288a)
- Release workflow is path-routed: the container pixel gate runs only when component-visual
  code changes; the release job only when something is publishable.
  [`e8a8450`](https://github.com/VegaStack/vegastack-design/commit/e8a8450)

### 📦 npm

- `@vegastack/design` **0.1.1** — `tw-animate-css` is a real dependency (was an optional peer
  that pnpm never installed, breaking every fresh consumer build at `preset.css`).
  Published via npm OIDC trusted publishing — the first fully-automated release.
  [`9532d42`](https://github.com/VegaStack/vegastack-design/commit/9532d42)
- `@vegastack/design-tokens` stays **0.1.0** (no changes).

### 📚 Docs

- New **Guides** section — [Quickstart](https://design.vegastack.com/docs/guides/quickstart),
  Registry access & auth, Working with components, Provider setup, Theming, Production
  checklist, Troubleshooting. Every command executed for real against the reference starter
  before being written down; 29 adversarial-review findings applied.
  [`7307231`](https://github.com/VegaStack/vegastack-design/commit/7307231) ·
  [`11836b6`](https://github.com/VegaStack/vegastack-design/commit/11836b6)
- Sidebar sections labeled; doc pages carry a server-rendered "Last updated" stamp.
  [`a323cba`](https://github.com/VegaStack/vegastack-design/commit/a323cba)
- Lifecycle guides for both audiences: **Internal projects** (the two-speed update
  model: npm = global on dep bump, registry = frozen until reviewed pull; the
  token-ordering trap) and **Client projects** (delivery model, handover checklist,
  zero-lock-in dependency table). Repo also gains a maintainer README.
  The internal guide is now SSO-only and intentionally absent from the public corpus;
  the [client-project guide](https://design.vegastack.com/docs/guides/external-projects)
  remains public.

## [0.1.0] — July 18, 2026

### 🧩 New components

- Initial release: **75 components**, **439 animated-icon items**, 2 hooks
  (`use-mobile`, `use-animation-replay`), and the `dashboard-01` starter block — all Base UI +
  Tailwind v4, semantic-token-only, WCAG 2.1 AA, distributed as copy-in via the private
  registry at `design.vegastack.com/r/*` (Cloudflare Access service-token auth,
  Sigstore-signed manifest).
  [components](https://design.vegastack.com/docs/components/button) ·
  [`8a5bb2a`](https://github.com/VegaStack/vegastack-design/commit/8a5bb2a)

### 📦 npm

- `@vegastack/design` **0.1.0** — `cn()`, the icon runtime (`./icons`), the Tailwind v4 preset
  (`./preset.css`), token CSS re-exports, and the `vegastack-design` CLI.
- `@vegastack/design-tokens` **0.1.0** — the zero-dependency DTCG token contract
  (`theme.css`, `base.css`, `utilities.css`, `tokens.json`).

### 📚 Docs

- At the 0.1.0 release, the Fumadocs showcase had 91 pages, live previews rendering the real
  shipped source, and complete desktop/mobile VRT coverage; it was deployed behind Cloudflare
  Access SSO. Current route and baseline counts are verified dynamically rather than inferred
  from this historical release entry.
  [`8a5bb2a`](https://github.com/VegaStack/vegastack-design/commit/8a5bb2a)
