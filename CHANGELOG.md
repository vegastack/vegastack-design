# Changelog

All notable changes to VegaStack Design, versioned by the **design-system (registry) version**
— the version every registry item carries. npm package versions are listed per entry under
**📦 npm**. Sections use a fixed vocabulary (enforced by `tooling/changelog-lint.mjs`):
`🧩 New components` · `🔧 Changed components` · `🗑 Removed / renamed` · `🛠 CLI & tooling` ·
`📦 npm` · `📚 Docs` · `🐛 Fixed` · `⚠️ Breaking`.

The docs [Changelog page](https://design.vegastack.com/docs/changelog) is **generated from this
file** by `tooling/sync-changelog.mjs` — edit here, never there.

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

## [0.1.0] — July 18, 2026

### 🧩 New components

- Initial release: **75 components**, **440 animated-icon items**, 2 hooks
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

- Fumadocs showcase: 91 pages, live previews rendering the real shipped source, VRT-covered
  (both desktop + mobile lanes), deployed behind Cloudflare Access SSO.
  [`8a5bb2a`](https://github.com/VegaStack/vegastack-design/commit/8a5bb2a)
