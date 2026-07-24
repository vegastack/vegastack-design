# Reference — Monorepo, Release, Deploy

> Durable reference. June-2026 research with concrete configs/commands. Backs requirements §6, §8.5, §10 and decisions D10, D11. Preserve in full.

## 1. Monorepo layouts of leading systems (verified)

| System                   | Pkg mgr                   | Orchestrator       | Docs/showcase                                     | Headless/styled split                                                                                                                                            |
| ------------------------ | ------------------------- | ------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn/ui                | pnpm                      | **Turborepo**      | `apps/v4` (Next.js App Router + fumadocs-mdx)     | registry copy-paste (on Radix); also `skills/shadcn/`, `templates/`, `.claude/`, `.cursor/rules/`                                                                |
| Radix Primitives         | pnpm                      | — (oxlint/oxfmt)   | `apps/` dev                                       | headless only; `packages/{core,react}`, one folder per primitive → `@radix-ui/react-*`                                                                           |
| Radix Themes             | pnpm                      | **Turborepo**      | `apps/playground`                                 | single `packages/radix-ui-themes`; ships **AGENTS.md + CLAUDE.md** at root                                                                                       |
| MUI                      | pnpm                      | **Lerna + Nx**     | root `docs/`                                      | `@mui/{system,material,lab,icons-material,utils}`; Base UI spun out; `packages-internal/` for tooling                                                            |
| Chakra v3                | pnpm                      | —                  | `apps/www` + `apps/compositions` + **`apps/mcp`** | built on Ark UI; `packages/{react,cli,codemod,charts,panda-preset}`                                                                                              |
| Mantine                  | **Yarn Berry**            | — (syncpack)       | `apps/mantine.dev`                                | `@mantine/{core,hooks,form,dates,charts,…,mcp-server}`                                                                                                           |
| Ark UI                   | **Bun** (biome, lefthook) | —                  | `website/`                                        | headless per-framework: `packages/{react,vue,solid,svelte,mcp}` (Zag.js engine)                                                                                  |
| Park UI                  | **Bun**                   | —                  | `website/`                                        | styled = `packages/preset` (Panda CSS) + `packages/cli` (shadcn-style copy-in)                                                                                   |
| React Spectrum           | **Yarn Berry**            | **Lerna** + Parcel | `packages/dev/docs`                               | cleanest 3-layer: `@react-stately/*` (state) + `@react-aria/*` (behavior/a11y) + `@react-spectrum/*` (styled) + `@internationalized/*` + `react-aria-components` |
| Geist (Vercel)           | npm                       | Makefile           | closed (vercel.com/geist)                         | **font/tokens only** — `geist` pkg = font; components are closed-source. `geist-ui` (community) is archived.                                                     |
| Catalyst (Tailwind Plus) | none (ZIP)                | none               | catalyst.tailwindui.com                           | copy-paste from licensed zip (`typescript/` + `javascript/`), no CLI/registry                                                                                    |

**Dominant 2026 stack:** **pnpm workspaces + Turborepo**; **pnpm catalogs** (9.5+) pin shared versions; Lerna+Nx only at MUI/Adobe scale; Bun emerging (Ark/Park). **MCP server as a first-class package is now near-universal** (Chakra `apps/mcp`, Ark `packages/mcp`, Mantine `@mantine/mcp-server`).

**Recurring package boundaries:** behavior-vs-style split · tokens/colors standalone (`@radix-ui/colors`) · icons separate+generated · config-as-package (eslint/tsconfig/tailwind presets, `@org/*-config` via `workspace:*`) · docs in `apps/`.

## 2. Recommended structure (→ requirements §6)

See requirements §6 for the full `vegastack-design/` tree. Key files:

**`pnpm-workspace.yaml`** (workspaces here, NOT in package.json; catalog pins versions):

```yaml
packages: ["apps/*", "packages/*", "config/*", "tooling/*"]
catalog:
  react: ^19.2.0
  react-dom: ^19.2.0
  tailwindcss: ^4.0.0
  typescript: ^5.6.0
```

Each package: `"react": "catalog:"`, internal deps `"@vegastack/tokens": "workspace:*"`.

**`turbo.json`** (v2 — `tasks` not `pipeline`; `^build` builds deps first):

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".open-next/**",
        ".next/**",
        "build/**",
        "!.next/cache/**",
      ],
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
  },
}
```

## 3. Tokens build (DTCG → Style Dictionary)

- **W3C DTCG reached first stable (2025.10) on Oct 28 2025** (theming/light-dark, P3/Oklch/CSS Color 4, aliases, multi-platform). **Style Dictionary v4** consumes DTCG → CSS vars + Tailwind theme + TS constants from one source.
- `packages/tokens/`: author `src/tokens/*.tokens.json` (DTCG) → `style-dictionary.config.mjs` → `build/{theme.css, tokens.ts, tokens.json}`.
- Sources: w3.org/community/design-tokens/2025/10/28/...; styledictionary.com/info/dtcg.

## 4. Release & versioning (→ §10, Changesets is the authority)

**Why not semantic-release:** a visual break can hide under a `fix:` commit; let a reviewed changeset decide the bump.

**Workflow:**

```bash
pnpm add -Dw @changesets/cli && pnpm changeset init
pnpm changeset           # author intent → .changeset/<name>.md (pkg → bump)
pnpm changeset version   # bump versions, rewrite internal deps, write CHANGELOGs
pnpm publish -r          # publish changed packages
```

Changeset file:

```markdown
---
"@vegastack/ui": minor
"@vegastack/tokens": patch
---

Add `loading` prop to Button
```

**`.changeset/config.json`:**

```json
{
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "VegaStack/vegastack-design" }
  ],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "bumpVersionsWithWorkspaceProtocolOnly": true,
  "fixed": [["@vegastack/ui", "@vegastack/tokens", "@vegastack/icons"]],
  "ignore": ["@vegastack/docs"]
}
```

- `fixed` → ui+tokens+icons share one version line (no skewed mix downstream).
- `bumpVersionsWithWorkspaceProtocolOnly` → only rewrites `workspace:` ranges (correct for pnpm).

**CI (`changesets/action`):** on push to `main` → if changesets exist, opens/updates a "Version Packages" PR (human gate); merging it publishes + redeploys.

```yaml
permissions: { contents: write, pull-requests: write, packages: write }
- uses: actions/setup-node@v4
  with: { node-version: 20, registry-url: https://npm.pkg.github.com, scope: '@vegastack' }
- run: pnpm install --frozen-lockfile
- uses: changesets/action@v1
  with: { version: pnpm changeset version, publish: pnpm publish -r --no-git-checks }
  env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}, NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
```

**Never-break-downstream:**

- Deprecation (MUI model): `@deprecated` JSDoc in a minor, keep both APIs, ship a codemod, remove at next major.
- **Codemods (jscodeshift):** publish `@vegastack/ui-codemod`; `npx @vegastack/ui-codemod@latest v2/rename-foo src/` (same pattern as `@mui/codemod`, `@next/codemod`).
- Visual regression: Chromatic / Lost Pixel / Playwright `toHaveScreenshot()` (catches breaks semver can't).
- React as **`peerDependencies`**; Renovate/Dependabot downstream for auto-merge of the npm layer.
- Pre-release: `changeset version --snapshot canary` → `0.0.0-canary-<ts>` (ephemeral per-PR tests); `pre enter next` (dedicated branch ONLY — docs warn it's dangerous on main) for beta→rc→stable majors.
- Sources: changesets docs (detailed-explanation, config-file-options, snapshot-releases, prereleases); pnpm.io/using-changesets.

## 5. GitHub Packages (private npm) — exact setup

`package.json`:

```jsonc
{
  "name": "@vegastack/ui",
  "repository": "https://github.com/VegaStack/vegastack-design.git",
  "publishConfig": { "registry": "https://npm.pkg.github.com" },
}
```

**Publish + consume `.npmrc`** (same scope map; token in env/`~/.npmrc`):

```ini
@vegastack:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

**Token matrix:** publish in CI same-repo → `secrets.GITHUB_TOKEN` (`packages: write`); publish local/cross-repo → classic PAT `write:packages`; install in CI same-org → `GITHUB_TOKEN` (`packages: read`); install local/other-org → classic PAT `read:packages`. **Critical:** no fine-grained PAT support — classic PAT or `GITHUB_TOKEN` only.

- Sources: docs.github.com/packages working-with-the-npm-registry; about-permissions-for-github-packages.

## 6. OpenNext + Cloudflare (→ D11)

- **`@opennextjs/cloudflare@1.19.x` — stable/GA**, weekly cadence. Peer: `next >=15.5.18 <16 || >=16.2.6` (avoid 16.0–16.2.5), `wrangler ^4.86.0`. Supports Next 15 (latest minor) + 16; App Router GA; runs Node runtime in Workers.
- **`@cloudflare/next-on-pages` is deprecated** → use OpenNext. Cloudflare committed to an official first-party adapter built on OpenNext later in 2026 (Next 16.2 stabilized the Adapter API) → building on OpenNext now is future-aligned.
- Feature support 🟢 App/Pages Router, RSC, SSG, SSR, ISR, Server Actions, streaming, `next/after`, middleware, image opt (Cloudflare Images), PPR, `'use cache'`. ⚪ not yet: Node runtime in middleware. Caching adapters in `open-next.config.ts` (KV/R2 incremental, D1/DO tag cache, DO queue for ISR).
- **Setup:**
  ```bash
  npm create cloudflare@latest -- my-docs --framework=next   # C3 starter
  # or: npm i @opennextjs/cloudflare@latest && npm i -D wrangler@latest
  ```
  `wrangler.jsonc`:
  ```jsonc
  {
    "main": ".open-next/worker.js",
    "name": "vegastack-design-docs",
    "compatibility_date": "2026-06-05",
    "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
    "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  }
  ```
  `open-next.config.ts`: `export default defineCloudflareConfig();`
  `next.config.ts`: `initOpenNextCloudflareForDev()` for bindings in `next dev`.
  Scripts: `preview: opennextjs-cloudflare build && opennextjs-cloudflare preview`; `deploy: … deploy`. Requires `nodejs_compat` + `compatibility_date >= 2024-09-23`.
- **Docs-site gotchas:** Worker size 3MB(Free)/10MB(Paid) gzipped _server_ bundle (static assets don't count; 20k/100k files, 25MiB each). Do **Shiki highlighting at build time** (no client highlighter). **For a purely-static showcase, `output: "export"` on Workers Static Assets is leaner/cheaper** (lose ISR/server-actions/route-handlers) — Cloudflare's recommended direction; Pages/`next-on-pages` is legacy.
- **Local dev (two-tier):** `next dev` (fast HMR, bindings as local sims via `getCloudflareContext()`, secrets in `.dev.vars`) → `opennextjs-cloudflare preview` (real Worker in workerd, prod-accurate). Remote bindings (beta) via `initOpenNextCloudflareForDev({ experimental: { remoteBindings: true } })`. `npm run cf-typegen` for typed bindings.
- Sources: opennext.js.org/cloudflare/{get-started,bindings,caching}; developers.cloudflare.com/workers/{static-assets,platform/limits,framework-guides/web-apps/nextjs}; nextjs.org/blog/nextjs-across-platforms; npmjs.com/package/@opennextjs/cloudflare.

### Our deploy decision (D11)

Static export on Workers Static Assets + **Cloudflare Access (Zero Trust)** gating the whole site incl. `/r/*.json`; downstream `components.json` sends **CF Access service-token headers** (`CF-Access-Client-Id`/`-Secret`) so the shadcn CLI/agents can fetch. All static, private, no custom Worker. Switch to OpenNext only if a live playground/search API is added.
