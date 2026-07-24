# detail/01 — Monorepo, Release, CI (verbatim)

> **Historical implementation plan.** Do not use its release/provenance workflow. The private source
> repository cannot receive npm provenance attestations, and the current approval-gated authority is
> [`../../RELEASING.md`](../../RELEASING.md) plus
> [`../../../skills/internal/ship/SKILL.md`](../../../skills/internal/ship/SKILL.md).

Verified 2026-06-21 against pnpm.io, turborepo.com, changesets docs, docs.npmjs.com, docs.renovatebot.com, and the cloned `references/fumadocs` root configs. Versions: pnpm **11.7**, Turborepo **2.9.18**, Node **>= 24.14.0**.

## 1. pnpm workspace + catalog

`pnpm-workspace.yaml` (repo root):

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "config/*"
  - "tooling/*"

catalog:
  react: ^19.2.7
  react-dom: ^19.2.7
  tailwindcss: ^4.3.1
  typescript: ^6.0.3
```

In each package `package.json`: internal deps as `"@vegastack/tokens": "workspace:*"`; shared deps as `"react": "catalog:"`. Editing a version once in the catalog + `pnpm install` updates every package. Keep `react` + `react-dom` in the same catalog block for lockstep.

Source: https://pnpm.io/catalogs · https://pnpm.io/settings

## 2. Turborepo

`turbo.json` (repo root). The `tokens → tailwind-preset → ui → docs` order is derived automatically from each package's `dependencies` (declare them as `workspace:*`); `^build` means "build workspace deps first":

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "stream",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", "out/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

Root `package.json` scripts:

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "registry:build": "shadcn build packages/ui/registry.json -o apps/docs/public/r && node tooling/registry-stamp.mjs"
  }
}
```

The root **`registry:build`** is what CI calls (Codex F5); the registry index lives at **`packages/ui/registry.json`** (no path ambiguity). `tooling/registry-stamp.mjs` is detail/04 §3.
Source: https://turborepo.com/docs/reference/configuration

## 3. Changesets (public packages)

Install:

```bash
pnpm add -Dw @changesets/cli @changesets/changelog-github
pnpm changeset init
```

`.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "VegaStack/vegastack-design" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [
    ["@vegastack/tokens", "@vegastack/tailwind-preset", "@vegastack/icons"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@vegastack/docs"]
}
```

- `access: "public"` — publishes scoped `@vegastack/*` publicly (scoped = private by default).
- `linked` — the token layer shares one version line.
- `changelog-github` — needs `GITHUB_TOKEN` at version time.

Authoring / version / publish:

```bash
pnpm changeset            # author intent (pick packages + bump + summary)
pnpm changeset version    # bump versions + write CHANGELOGs (CI does this in the PR)
pnpm -r build
pnpm changeset publish     # publishes changed packages; honors access:"public"
```

Source: https://github.com/changesets/changesets/blob/main/docs/config-file-options.md · https://pnpm.io/using-changesets

## 4. Public-scoped `package.json` template (with a CSS export)

`packages/tokens/package.json` — **tokens-specific** (the other packages differ — see the per-package table below):

```json
{
  "name": "@vegastack/tokens",
  "version": "0.0.0",
  "description": "VegaStack design tokens (DTCG → Tailwind v4 theme + TS)",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/VegaStack/vegastack-design.git",
    "directory": "packages/tokens"
  },
  "type": "module",
  "sideEffects": ["**/*.css"],
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/tokens.d.ts", "import": "./dist/tokens.js" },
    "./theme.css": "./dist/theme.css",
    "./base.css": "./dist/base.css",
    "./tokens.json": "./dist/tokens.json"
  },
  "publishConfig": { "access": "public", "provenance": true }
}
```

- `exports["./theme.css"]` → consumers `@import "@vegastack/tokens/theme.css"`. Bare string (no `types`/`import` conditions) for a CSS asset.
- `sideEffects: ["**/*.css"]` → bundlers (webpack/esbuild/Vite) won't tree-shake the CSS. (Bundler convention, not an npm field.)
- `publishConfig.access: "public"` → public without a CLI flag; `.changeset` `access` reinforces it.

**Per-package `build` scripts (NOT identical — Codex F2/F4).** Add **`tsup` (pinned — version matrix)** as a root devDependency. Each package names its script **`build`** (so `turbo run build` discovers it) and emits real `dist/*.js` + `*.d.ts` so `exports` resolve:

| Package                      | `build` script                                                   | Main export                 | Notes                                                                       |
| ---------------------------- | ---------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| `@vegastack/tokens`          | `node build-tokens.mjs && tsup src/tokens.ts --format esm --dts` | `dist/tokens.js` (+`.d.ts`) | also `./theme.css`, `./base.css`, `./tokens.json`                           |
| `@vegastack/tailwind-preset` | `tsup src/preset.ts --format esm --dts`                          | `dist/preset.js` (+`.d.ts`) | exposes the Tailwind v4 preset                                              |
| `@vegastack/utils`           | `tsup src/index.ts --format esm --dts`                           | `dist/index.js` (+`.d.ts`)  | `cn()` etc.; no React dep                                                   |
| `@vegastack/icons`           | `tsup src/index.tsx --format esm --dts --external react`         | `dist/index.js` (+`.d.ts`)  | `react`/`react-dom` as **peerDependencies**; deps `lucide-react` + `thesvg` |

Source: https://docs.npmjs.com/cli/v11/configuring-npm/package-json/

## 5. `.npmrc` (local publish only; CI uses setup-node)

Repo root `.npmrc` (for local `pnpm publish`):

```ini
//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
@vegastack:registry=https://registry.npmjs.org/
```

## 6. CI workflows

`.github/workflows/ci.yml` (per-PR gate; runs inside the pinned Playwright image so Vitest browser mode + Playwright VRT share identical browsers/fonts):

```yaml
name: CI
on: pull_request

jobs:
  verify:
    runs-on: ubuntu-latest
    container: mcr.microsoft.com/playwright:v1.61.0-noble
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 } # needed for `changeset status --since=origin/main` (Codex F5)
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec tsc --noEmit
      - run: pnpm lint # incl. design-lint (no hex/px, sanctioned icons)
      - run: pnpm exec vitest run # unit + a11y
      - run: pnpm exec playwright test # VRT
      - run: pnpm build
      - run: pnpm registry:build # regenerate /r/*.json + integrity manifest
      - run: test -z "$(git status --porcelain -- apps/docs/public/r)" # stale OR new-untracked registry JSON/hashes fail CI (Codex F1)
      - run: pnpm exec changeset status --since=origin/main
```

`.github/workflows/release.yml` (publishes PUBLIC scoped packages with provenance):

```yaml
name: Release
on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write
  id-token: write # REQUIRED for npm provenance (OIDC)

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: pnpm
          registry-url: "https://registry.npmjs.org"
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

- `registry-url` makes `setup-node` write an `.npmrc` that reads `NODE_AUTH_TOKEN`. `changesets/action` also reads `NPM_TOKEN` — set both.
- Provenance requires GitHub-hosted runner + npm ≥ 9.5 + a public `repository` field in each package.
- First push → opens a "Version Packages" PR; merging it publishes.

Source: https://github.com/changesets/action · https://docs.npmjs.com/generating-provenance-statements/

## 7. GitHub Packages note (only if mirroring internally)

GitHub Packages npm still does **not** support fine-grained PATs — use a classic PAT (`read:packages`/`write:packages`) or the CI `GITHUB_TOKEN`. Our primary registry is **public npmjs**, so this does not block the main flow.

## 8. Renovate shareable preset

Repo `VegaStack/renovate-config`, file `default.json` (npm-hosted presets are deprecated in 2026 → repo-hosted; `matchPackagePrefixes` is removed → use `matchPackageNames` globs):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "description": "VegaStack shared Renovate preset — auto-PR @vegastack/* bumps",
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "description": "Group @vegastack/* design-system updates",
      "matchPackageNames": ["@vegastack/**"],
      "groupName": "vegastack design system"
    },
    {
      "description": "Automerge additive (minor) + patch @vegastack/* updates",
      "matchPackageNames": ["@vegastack/**"],
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    }
  ],
  "schedule": ["before 6am on monday"]
}
```

Consumer repo `renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>VegaStack/renovate-config"]
}
```

- Major bumps still open a normal PR. Automerge needs branch protection + required status checks so it only lands on green CI.

Source: https://docs.renovatebot.com/config-presets/ · https://docs.renovatebot.com/configuration-options/

## Flags

- `main` is optional for an assets-only Worker (see detail/04 §5) — confirm on first `wrangler deploy`.
- `sideEffects` is a bundler convention; confirm against the chosen bundler.
- Pin the `$schema` versions to whatever `pnpm changeset init` writes.
