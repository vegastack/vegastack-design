# Package consolidation: 4 public packages → 2 (`@vegastack/design` + `@vegastack/design-tokens`)

**Date:** 2026-07-18 · **Approved by:** MK (chat, 2026-07-18) · **Status:** executing
**Supersedes** the 4-package distribution shape in `docs/requirements.md` §3 / `docs/gap-analysis.md` (locked-decision change, MK-approved). Greenfield: **no backward compatibility**, git history will be reset to a fresh first commit and 0.1.0 re-cut.

## Decision

| Package | Contents | Why it exists |
|---|---|---|
| **`@vegastack/design`** (NEW) | `cn()` (ex-utils) · icons runtime (ex-icons, at `./icons`) · Tailwind preset (ex-tailwind-preset, at `./preset` + `./preset.css`) · the `vegastack-design` CLI bin · thin CSS re-exports of tokens (`./theme.css`, `./base.css`, `./utilities.css` via `@import "@vegastack/design-tokens/…"`) | The one package app-builders install. One dep line per copied-in component. |
| **`@vegastack/design-tokens`** (renamed from `@vegastack/tokens`, 2026-07-18 — MK: "tokens will be confusing") | DTCG → Style Dictionary output: `theme.css`, `base.css`, `utilities.css`, `tokens.json`, `tokens.js` | Zero-dep portable design contract (Figma sync / native / non-Tailwind consumers install this alone). |
| `@vegastack/ui` (private, unchanged name) | registry workspace | not published |

**Deleted:** `packages/utils`, `packages/icons`, `packages/tailwind-preset` (merged into `packages/design`).

Rationale (from chat): consumers always need all four together; tokens is the only artifact with a genuine standalone use-case (zero deps). The CSS re-export subpaths exist so a pnpm-strict consumer never has to import a transitive dep directly — `@vegastack/design/theme.css` resolves tokens from *inside* design, where tokens is a direct dependency.

## `@vegastack/design` package spec

- `name: @vegastack/design`, version `0.1.0`, `publishConfig: { access: public, provenance: true }`.
- **exports:** `.` → cn (dist/index.js) · `./icons` → icons index (dist) · `./preset` → preset meta (dist) · `./preset.css` (static) · `./theme.css` / `./base.css` / `./utilities.css` (static one-line `@import` re-exports of `@vegastack/design-tokens/*`).
- **bin:** `{ "vegastack-design": "./bin/vegastack-design.mjs" }` — the deprecated `vegastack-verify-registry-item` alias is **dropped** (greenfield).
- **dependencies:** `@vegastack/design-tokens` (workspace:\*), `clsx`, `tailwind-merge`, `lucide-react`, `thesvg`.
- **peerDependencies:** `react`/`react-dom` ^19 (icons subpath); carry over the preset's optional peers (`@vegastack/ui`, `tailwindcss`, `tw-animate-css`) with `peerDependenciesMeta` as in the old tailwind-preset package.
- **build:** single tsup config, three entries (`src/index.ts`, `src/icons/index.tsx`, `src/preset.ts`), esm + dts, `--external react`.
- `preset.css`: `@source` relative paths updated — icons sources are now *inside this package*; `@vegastack/ui` stays a node_modules sibling (`../ui/dist`).
- `src/preset.ts` metadata: `css: '@vegastack/design/preset.css'`, `tokens: '@vegastack/design-tokens'`.
- utils' `test/` (compare + check-updates tests) moves in unchanged.

## Import-specifier rewrites (source of truth: canonical only; copies regenerate)

| Old | New | Where |
|---|---|---|
| `from "@vegastack/utils"` | `from "@vegastack/design"` | `packages/ui/registry/**` (520 files incl. 440 icon mirrors), `packages/ui/src`, `tooling/mirror-animated-icons.mjs` template |
| `from "@vegastack/icons"` | `from "@vegastack/design/icons"` | `icon-button`, `filter-bar`, `split-button` + mirror template |
| registry.json npm dep `@vegastack/utils@^0.1.0` | `@vegastack/design@^0.1.0` | 522 items (node script, not sed) |
| registry.json npm dep `@vegastack/icons` (any form) | `@vegastack/design@^0.1.0` (dedupe) | 3 items |
| `@vegastack/design-tokens@^0.1.0` npm dep | **unchanged** | 84 items |

`apps/docs/components/ui/*` (521) and `apps/docs/public/r/*.json` (525) are **generated** — never hand-edited; `pnpm registry:build` re-syncs after canonical edits.

## Monorepo rewiring

- `packages/ui/package.json`: deps `utils`+`icons` → `@vegastack/design` workspace:\*.
- `apps/docs/package.json`: deps → `@vegastack/design`, `@vegastack/design-tokens`, `@vegastack/ui`.
- `apps/docs/app/global.css`: `@vegastack/design-tokens/theme.css|utilities.css` → `@vegastack/design/theme.css|utilities.css` (dogfoods the consumer path).
- `apps/docs` content MDX: install/changelog/foundations pages rewritten to the 2-package story (`npm i @vegastack/design` one-liner; tokens-standalone note).
- `.changeset/config.json`: `linked: [["@vegastack/design-tokens","@vegastack/design"]]`; changelog repo → `VegaStack/design` (pending repo rename below).
- `.github/workflows/vrt.yml` path filter: `packages/tailwind-preset/` → `packages/design/`.
- tooling: `verify-bin-parity.mjs`, `verify-shadcn-consume.mjs`, `verify-item.mjs` (bin path `packages/utils/bin` → `packages/design/bin`); `verify-preset-source.mjs` (path → `packages/design`).
- Root `package.json` name → `design`; all `repository.url` fields → `github.com/VegaStack/design` (repo rename is the last, user-confirmed step).
- Normative docs updated: `AGENTS.md` (locked decisions, layout, numbers), `docs/RELEASING.md`, `docs/requirements.md` §3 amendment note, `skills/*` references. Historical records (`docs/plans/*` others, `docs/audits/*`) left as dated history.

## Verification gate (all must pass before the reset commit)

1. `pnpm install` (lockfile regenerates; workspace resolution green)
2. `pnpm build` (turbo: tokens → design → ui → docs static export)
3. `pnpm registry:build` (validate → build → stamp → header → verify-headers → verify-registry-deps)
4. `pnpm registry:verify-parity` (bin hash parity from the NEW bin path)
5. `pnpm registry:verify-consume` (real `shadcn add` round-trip)
6. `pnpm lint` + `pnpm typecheck` + `pnpm test` (incl. moved utils tests)
7. grep gate: zero references to `@vegastack/(utils|icons|tailwind-preset)` outside historical docs + CHANGELOGs

## Endgame (user-gated, in order)

1. Fresh orphan commit (single first commit, as before — VRT baselines excluded, bootstrapped in CI after push).
2. MK decision (2026-07-18): KEEP the repo name `VegaStack/vegastack-design` (npm packages are the clean names); force-push `main`.
3. Post-push: dispatch `vrt.yml` baseline bootstrap → re-run Release once `NPM_TOKEN` is set (publishes `@vegastack/design` + `@vegastack/design-tokens` + re-run deploy chain). npm 2FA is bypassed by the automation token; no OTP needed in CI.
