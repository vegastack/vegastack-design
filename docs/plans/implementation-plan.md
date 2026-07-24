# VegaStack Design System — Implementation & Migration Plan (master)

> **Historical implementation plan.** Current release authority is [`../RELEASING.md`](../RELEASING.md)
> and [`../../skills/internal/ship/SKILL.md`](../../skills/internal/ship/SKILL.md); current docs/access architecture is
> [`public-docs-cutover.md`](public-docs-cutover.md). Preserve the remaining detail as build history.

|                     |                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope**           | Build `vegastack-design` end-to-end + migrate `engg-vegastack-platform` onto it.                                                                          |
| **Status**          | v2 — command-level, decision-free. All versions/configs verified against official docs + the cloned `references/fumadocs` repo on **2026-06-21**.         |
| **Source of truth** | [requirements.md](../requirements.md) (what/why) + [gap-analysis.md](../gap-analysis.md) (decisions F1–F5, G1–G33). This file + `detail/*` = exactly how. |
| **Reviser note**    | Revise the plan after the **P1 checkpoint** (Fumadocs showcase deployed to Cloudflare), per MK.                                                           |

## How to execute this plan

0. **Read [`00-START-HERE.md`](00-START-HERE.md) FIRST** — operating mode (**build LOCAL, stop at publish/deploy**), final locked decisions, the user-provisioning checklist, and the reference repos to read.
1. **Make no decisions.** Every choice is pre-made in §Decision log; every config is verbatim in a `detail/*` file. If something is genuinely missing, stop and ask — do not improvise.
2. **Pin every version** to the §Version matrix. Do not run bare `@latest` for the pinned packages.
3. Work phase-by-phase; each phase has an **acceptance gate** that must pass before the next.
4. The `detail/*` files hold the copy-paste configs. The phase steps below tell you _which_ detail file and _in what order_.

### Detail files (the verbatim specs)

- [detail/01-monorepo-release-ci.md](detail/01-monorepo-release-ci.md) — pnpm/catalog, Turborepo, Changesets (public + provenance), public-scoped `package.json`, the release + CI workflows, Renovate preset.
- [detail/02-tokens-and-theming.md](detail/02-tokens-and-theming.md) — DTCG tokens, Style Dictionary v5 (custom OKLCH transform + `tailwind/theme` format), Tailwind v4 `globals.css`, `tw-animate-css`, motion tokens + reduced-motion, next-themes, multi-theme, `<VegaStackProvider>`.
- [detail/03-fumadocs-showcase.md](detail/03-fumadocs-showcase.md) — Fumadocs scaffold, every config verbatim, the `ComponentPreview` (Preview⇄Code) pattern, `AutoTypeTable`, Shiki+Twoslash, static Orama search, `llms.txt`, static export.
- [detail/04-registry-and-cloudflare.md](detail/04-registry-and-cloudflare.md) — `registry.json`/`registry-item.json` schemas, `shadcn build`, the `meta.integrity` content-hash, token-range pinning, `components.json` + auth, MCP, Cloudflare Workers Static Assets deploy, CF Access service tokens + `/r/*` policy.
- [detail/05-components-and-testing.md](detail/05-components-and-testing.md) — Base UI patterns (`@base-ui/react`, `render` prop, `data-starting-style`), the per-component contract, forms (Field + RHF `Controller` + Zod 4), Vitest 4 browser mode + `vitest-axe` + Playwright VRT, the CI gate, the `vegastack-add-component` skill.
- [detail/06-platform-migration.md](detail/06-platform-migration.md) — the P4 `engg-vegastack-platform` migration sub-plan.

---

## Version matrix (pinned — verified npm `latest`, 2026-06-21)

> Use these exact constraints in `package.json`/`pnpm-workspace.yaml` catalog. Sources are in the relevant `detail/*` file.

| Area                  | Package                                                         | Version                                                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**           | node                                                            | `>= 24.14.0` · pnpm `11.7` · Turborepo `2.9.18`                                                                                                                                              |
| **Framework**         | next                                                            | `16.2.9` (Fumadocs v16 peer is `16.x.x`) · react / react-dom `^19.2.7` · typescript `^6.0.3`                                                                                                 |
| **Primitives**        | `@base-ui/react`                                                | `1.6.0` _(NOT `@base-ui-components/react` — deprecated/renamed)_                                                                                                                             |
| **Styling**           | tailwindcss + `@tailwindcss/postcss`                            | `^4.3.1` · `tw-animate-css` `^1.4.0` · postcss `^8.5.15` · `class-variance-authority` `^0.7.x` · `clsx` `^2.1.x` · `tailwind-merge` `^3.6.0`                                                 |
| **Tokens**            | style-dictionary                                                | `5.4.4` (ESM, Node ≥22) · DTCG format `2025.10`                                                                                                                                              |
| **Theming**           | next-themes                                                     | `0.4.6`                                                                                                                                                                                      |
| **Docs**              | fumadocs-core / fumadocs-ui                                     | `16.10.5` · fumadocs-mdx `15.0.12` · fumadocs-typescript `5.2.6` · fumadocs-twoslash `3.2.0` · create-fumadocs-app `16.0.126` · shiki `^4.2.0` · `@orama/orama` `^3.1.18`                    |
| **Registry/CLI**      | shadcn                                                          | `4.7.0` (CLI v4)                                                                                                                                                                             |
| **Icons**             | lucide-react                                                    | `^1.20.0` · `thesvg` (brand) · lucide-animated (registry copy-in)                                                                                                                            |
| **Forms**             | react-hook-form `7.80.0`                                        | `@hookform/resolvers` `5.4.0` · zod `4.4.3`                                                                                                                                                  |
| **Testing**           | vitest + `@vitest/browser-playwright` `4.1.9`                   | `vitest-browser-react` `2.2.0` · `@playwright/test` `1.61.0` · `vitest-axe` `0.1.0` (pin `axe-core` `4.12.1`) · `@testing-library/jest-dom` `6.9.1` · `@testing-library/user-event` `14.6.1` |
| **Release**           | `@changesets/cli` + `@changesets/changelog-github`              | `changesets/action@v1` · `actions/checkout@v6` · `actions/setup-node@v6` · `pnpm/action-setup@v6`                                                                                            |
| **Deploy**            | wrangler (Workers Static Assets)                                | latest; `compatibility_date` `2026-06-20`                                                                                                                                                    |
| **Build/sign**        | `tsup` (pinned root devDep — emits package `dist/*.js`+`.d.ts`) | `sigstore/cosign-installer@v3` + cosign (Sigstore manifest signing — Codex F2)                                                                                                               |
| **Editor (deferred)** | tiptap (OSS)                                                    | `text-edit` base only; `text-edit-collab` DEFERRED (F4)                                                                                                                                      |

---

## Decision log (pre-made — the executing agent does NOT re-decide these)

| #        | Decision                                                                                                                                                                                                                                                                                                                                                                                        | Verified rationale                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **DL1**  | Primitives = **`@base-ui/react@1.6.0`**, selected at init via `pnpm dlx shadcn@latest init --base base` (materializes a Base UI style + `@base-ui/react` dep; this repo records it as `style: "base-vega"`).                                                                                                                                                                                    | Current shadcn Base UI docs/CLI + Base UI npm (old `@base-ui-components/react` is deprecated).   |
| **DL2**  | Docs site uses **`fumadocs-ui` (Radix-internal, `fd-*` namespaced)**; it coexists with our Base UI _showcased_ components — no collision.                                                                                                                                                                                                                                                       | Fumadocs internals are namespaced; verified in `references/fumadocs/packages/radix-ui`.          |
| **DL3**  | Live preview = **site-authored `ComponentPreview`** built on the Fumadocs `preview:` frontmatter registry + `<Tabs>` Preview⇄Code (Fumadocs ships **no** built-in toggle).                                                                                                                                                                                                                      | Verified `references/fumadocs/apps/docs/components/preview/*`.                                   |
| **DL4**  | Props table = **Fumadocs `AutoTypeTable`** (`fumadocs-typescript`, ts-morph) — NOT `react-docgen-typescript` (stale, weak on Base UI namespaced types).                                                                                                                                                                                                                                         | Verified npm dates + `references/fumadocs/packages/typescript`.                                  |
| **DL5**  | Tokens: **DTCG structured-color** (`{colorSpace:"oklch",components,…}`) + Style Dictionary **custom `color/oklch` transform** + **two builds** (light→`:root`, dark→`.dark`) using built-in **`css/variables`** (`selector` + `outputReferences:false`) + a small **`tailwind/inline-bridge`** format, concatenated into one `theme.css`. Built-in `color/css` **destroys OKLCH** — never used. | designtokens.org + styledictionary.com (`css/variables` `selector`/`outputReferences` verified). |
| **DL6**  | Semantic tokens via **`@theme inline`** over `:root`/`.dark`; primitives via plain `@theme`. Dark mode via `@custom-variant dark (&:where(.dark, .dark *))` + next-themes `attribute="class"`.                                                                                                                                                                                                  | tailwindcss.com + shadcn + Fumadocs `attribute="class"`.                                         |
| **DL7**  | Deploy = **Cloudflare Workers Static Assets** (`output: 'export'`, assets-only `wrangler.jsonc`, no Worker script). NOT Pages, NOT OpenNext (no SSR needed).                                                                                                                                                                                                                                    | Cloudflare 2026 guidance (Pages→Workers).                                                        |
| **DL8**  | Search = **static Orama** (`staticGET` + `oramaStaticClient` + custom `SearchDialog`); the default server `/api/search` does not work under `output:'export'`.                                                                                                                                                                                                                                  | Verified `references/fumadocs/examples/next-static`.                                             |
| **DL9**  | Registry has **no native integrity/version field** → store **SHA-256 in `meta.integrity`** (free-form, survives `shadcn build`); pin token compat via the item's `dependencies: ["@vegastack/tokens@^x"]`.                                                                                                                                                                                      | Verified against current shadcn registry behavior.                                               |
| **DL10** | npm packages (`tokens`/`tailwind-preset`/`utils`/`icons`) are **public** with **provenance** (`id-token: write` + `NPM_CONFIG_PROVENANCE`); components stay private (registry).                                                                                                                                                                                                                 | F5 + npm provenance docs.                                                                        |
| **DL11** | Tests run in **Vitest 4 browser mode** (`playwright()` provider, real Chromium) — jsdom only for pure logic. VRT via Playwright in the pinned `mcr.microsoft.com/playwright` Docker image (font determinism).                                                                                                                                                                                   | vitest.dev + playwright.dev.                                                                     |
| **DL12** | Forms = Base UI `Field` + react-hook-form **`Controller`** (Field.Control emits `onValueChange`, not `onChange`) + Zod 4 (`z.email()`).                                                                                                                                                                                                                                                         | base-ui.com/react/handbook/forms.                                                                |
| **DL13** | Registry private-auth: **internal** = one shared CF Access service token; **external/client** = tokenless (public npm + dev-time copy-in). `/r/*` on a tighter Access policy.                                                                                                                                                                                                                   | F5.                                                                                              |

---

## Phases & acceptance gates

> Steps cite the detail file + section. Do them in listed order.

### P0 — Repo & infra skeleton

**Goal:** empty monorepo that builds, publishes a public probe package, deploys an empty static site behind CF Access.
**Steps:** [detail/01](detail/01-monorepo-release-ci.md) §1–§3 (pnpm workspace+catalog, turbo.json, Changesets init) → §6 (CI skeleton) → [detail/04](detail/04-registry-and-cloudflare.md) §5–§6 (Cloudflare project + Access app + `/r/*` policy + service token) → root `AGENTS.md`/`CLAUDE.md` → [detail/01](detail/01-monorepo-release-ci.md) §8 (Renovate preset repo).
**Gate (LOCAL — build-local-stop, per 00-START-HERE):** `pnpm build` green; package skeletons + workflow files written; a `pnpm publish --dry-run` of a probe package succeeds (NOT a real publish); the Fumadocs static export builds locally. **The user provisions npm/Cloudflare/GitHub + secrets and triggers the first real publish + deploy** — at which point the publish/provenance + browser-SSO + `/r/health.json` 403-vs-200 + signed-manifest checks run for real (detail/01 §6, detail/04 §5–§6). Record blockers in `HANDOFF-STATUS.md`.

### P1 — Foundations + showcase shell _(the pre-checkpoint heavy lift)_

**Goal:** tokens locked; the full showcase machinery proven on 2 pilot components; deployed to Cloudflare.
**Steps (in order):**

1. **Tokens** — [detail/02](detail/02-tokens-and-theming.md) §2–§3 (author DTCG from `research/catalog-vegastack-platform.md` OKLCH values; Style Dictionary build → `theme.css`+`tokens.ts`). Identity refine-pass per [requirements §7.5](../requirements.md) (fix `:focus-visible`, AA contrast).
2. **Theme + Tailwind v4** — [detail/02](detail/02-tokens-and-theming.md) §1,§4–§7 (`globals.css`, `tw-animate-css`, motion tokens, next-themes, `<VegaStackProvider>`).
3. **Icons + utils + preset** — [detail/02](detail/02-tokens-and-theming.md) §8 + [detail/05](detail/05-components-and-testing.md) §icons (`Icon`/`BrandIcon`, sanctioned-source ESLint rule).
4. **Fumadocs app** — [detail/03](detail/03-fumadocs-showcase.md) §1–§10 (scaffold, configs, `ComponentPreview`, `AutoTypeTable`, Twoslash, static search, `llms.txt`, static export).
5. **Registry plumbing** — [detail/04](detail/04-registry-and-cloudflare.md) §1–§4 (`registry.json`, `shadcn build`, `meta.integrity` hash script, internal `components.json`).
6. **Testing/CI** — [detail/05](detail/05-components-and-testing.md) §test (Vitest browser + vitest-axe + Playwright VRT) wired into [detail/01](detail/01-monorepo-release-ci.md) §6 CI.
7. **Pilot components** — Button + Badge through the entire pipeline.
8. **Deploy** — [detail/04](detail/04-registry-and-cloudflare.md) §5 (static export → Workers Static Assets).
   **Gate:** foundations pages render and theme/dark-mode work; **a one-file `--primary` override in the scratch app repaints every component** (Codex F3); Button+Badge go source → hashed+token-pinned registry item → MDX page (all §7.3 sections) → live `ComponentPreview` → `AutoTypeTable` → pass Vitest+axe+VRT → **consume preflight verifies the published item (fail-closed)** then `shadcn add @vegastack/button` copies it in + installs compatible tokens + renders; external dry-run consumes public token packages with no token; site live on Cloudflare; **CF Access verified BOTH ways** — browser SSO opens the human docs, service-token headers fetch `/r/*` while a no-header hit is blocked (Codex F8).

### ▶ CHECKPOINT (MK) — revise the plan

After P1 deploys and the pilot installs cleanly: re-validate the template, add-component pipeline, token binding/drift, VRT stability, CF Access (internal token + tokenless external), build/deploy perf. Update P2–P5. **No bulk component porting before this gate.**

### P2 — Pipeline proof: Wave 1 (~10 core components)

Button, Input, Field, Badge, Dialog, Select, Tooltip, DropdownMenu, Tabs, Alert. Build the **`vegastack-add-component`** + **`vegastack-consume`** skills ([detail/05](detail/05-components-and-testing.md) §skill). Prove the release loop: an **additive token bump** → Renovate auto-PRs a scratch consumer → CI/VRT green → merges with zero code edits.
**Gate:** add-component skill emits a complete, contract-passing component in one run; token-bump→Renovate→merge works without breaking a stale copy.

### P3 — Scale: Waves 2–N (remaining ~40)

Grouped waves (Form · Overlay · Display · Navigation · Data · Feedback · Rich-text **`text-edit` base only** · Media presentational per G7). Apply the app-coupled presentational split. Resolve `DataList` placement. Stand up `vegastack-release` + `vegastack-design-audit` (incl. the `meta.integrity` drift check) + `vegastack-brand`. **`text-edit-collab` stays deferred (F4).**
**Gate:** all 64 meet the contract; audit clean; release/codemod flow exercised on a real breaking change.

### P4 — Migration: `engg-vegastack-platform`

Full sub-plan in [detail/06-platform-migration.md](detail/06-platform-migration.md).
**Gate:** platform runs entirely on `@vegastack`; a token release reaches it via Renovate with zero code edits; visual parity vs pre-migration baseline.

### P5 — Rollout

Onboard other internal apps; `shadcn init` becomes the greenfield default; document + dry-run the external/client self-contained mode; wire the shadcn MCP into team agents; publish the brand skill.

---

## Autonomy & handoff (MK)

- **The autonomous local build is run by a fresh session** per [`00-START-HERE.md`](00-START-HERE.md) + [`HANDOFF-PROMPT.md`](HANDOFF-PROMPT.md): **go dark (NEVER pause — decide on best judgment + log to `docs/ledger/operator-review.md`), build the whole system locally (P1–P3) consuming the EXACT packages, NO push/publish/deploy until MK reviews**; subagent self-correction; a mandatory ledger (`docs/ledger/`); and a **Codex adversarial-review loop until 0 high/0 medium**.
- **Browser/visual testing IS available (confirmed in-session) via the Preview MCP** (`preview_start` the Fumadocs dev server → `preview_screenshot` + `preview_inspect` for exact computed CSS / token values); fallbacks Claude-in-Chrome (live browser) or `/codex`. Run **Vitest + vitest-axe** every phase. Only the Playwright `toHaveScreenshot` **baseline-VRT** is deferred until Docker — write those specs `describe.skip`.
- **Node 24** is installed at `/opt/homebrew/opt/node@24/bin` (prepend to PATH; harness default is v22).

## Cross-cutting (every phase)

- **CI gate order** (per PR, in the pinned Playwright Docker image): `pnpm install --frozen-lockfile` → `tsc --noEmit` → `pnpm lint` (incl. design-lint: no hex/px, sanctioned icons) → `vitest run` (unit + a11y) → `playwright test` (VRT — **deferred until Docker**) → `pnpm build` → `registry:build` + stale-check → changeset check. Detail: [detail/05](detail/05-components-and-testing.md) §ci.
- **Skills** built alongside the phase that needs them.
- **License/security register** maintained (Base UI MIT · lucide MIT · lucide-animated MIT · thesvg MIT · motion MIT · Tiptap MIT core, Cloud excluded).

## Open items carried into execution

`DataList` placement (P3) · O1 export-naming (`Vega*` drop — codemod-able) · O3 DTCG coverage · O4 repo suffix · O5 brand assets · `text-edit-collab` adapter contract (post-v1, F4).
