# 00 — START HERE (fresh-session handoff)

**You are the autonomous agent that will build the ENTIRE VegaStack design system locally.** Read this whole file, then execute [`implementation-plan.md`](implementation-plan.md) + the `detail/*` specs. **Go dark and run end-to-end without asking** — every decision is locked (below + requirements.md §3). Only pause if you hit something genuinely undecided that no `detail/*` file covers — log it in the ledger and keep working on everything else.

## Operating mode (locked by MK — read carefully)
- **GOAL:** build the **complete** design system **locally** and prove it works in the **Fumadocs showcase consuming the EXACT packages** — all `@vegastack/*` packages, all 64 components, the full showcase, the local registry, and the agent skills. Everything in the plan **except** the real npm publish + Cloudflare deploy (post-review).
- **DO NOT `git push`. DO NOT publish to npm. DO NOT deploy to Cloudflare.** Work on a local branch `feat/local-build`; commit incrementally (so work is saved + diffable); **never push**. MK reviews the local branch; the first push happens **only after MK approves**.
- **No credentials needed to start — go dark.** The showcase consumes packages via **workspace links** (`workspace:*`) and components via a **LOCAL registry** (serve `apps/docs/public/r/` over `http://localhost`; point a scratch `components.json` there). You build + test the **real** packages with **zero** npm/Cloudflare/GitHub credentials. Skip every account/secret prerequisite — they are post-review.
- **Use the EXACT package, never a mock.** Fumadocs must import `@vegastack/tokens`/`/theme.css` and render copied-in components from the local registry — so the showcase is a true test of shipped code. If something renders wrong, that's a real bug to fix at the root, not to paper over.
- **Node 24:** the harness default node is v22 (`~/.hermes` — do NOT touch it). Node 24 is installed at **`/opt/homebrew/opt/node@24/bin`**. **Prepend it to PATH for every build/test command** (or add it to `~/.zshrc` as your first step) and verify `node -v` = v24. `corepack prepare pnpm@11.7.0 --activate` for pnpm 11.
- **Visual + style verification IS available (confirmed in-session) — use the Preview MCP.** `preview_start` the Fumadocs dev server → `preview_screenshot` (layout) + `preview_inspect` (exact computed CSS — colors/fonts/spacing → verify token values precisely, e.g. `--primary` resolves to the right `oklch(...)`). **Visually verify EVERY component renders correctly via the real package.** Fallbacks: the **Claude-in-Chrome** MCP (a live local browser is connected) or ask **`/codex`** to run it. The Playwright *MCP* is broken on this machine (points at a missing browser) — do not use it. Run **Vitest + vitest-axe** (behavior + a11y) on every component. Only the **Playwright `toHaveScreenshot` baseline-VRT** (deterministic CI snapshots) is deferred until Docker; the shared suite self-skips when baselines are absent and is bootstrapped with `VRT_UPDATE=1` in the pinned Playwright container/CI. Log the approach in the ledger.
- **Identity refine-pass = mechanical/a11y only:** fix `:focus-visible`, ensure every token has a dark value + AA foreground, normalize names. **Do not redesign** — lock the current look as-is.
- **Research as you go:** for every library/API/config, **websearch + read the official docs** (and `/Users/kmanojkumar/code/references/fumadocs`) to confirm current correctness — don't trust memory. The `detail/*` files are verified, but re-verify anything that fails or looks off; log the source in the ledger.

## Self-correction (use subagents)
After each phase, **spawn multiple Opus 4.8 subagents in parallel** to hunt bugs/edge-cases/gaps — one per dimension: build/typecheck · a11y · token/Tailwind-v4 correctness · registry/integrity · per-component-contract completeness · showcase rendering. Fix everything they surface; re-run until clean. Log findings + fixes in the ledger.

## Codex adversarial-review loop (until 100% GTG)
After the full local build passes your own checks, run the **Codex adversarial review** (GPT-5.5, extra-high, zero-bias) directly via the companion — the strict prompt is the standalone file [`codex-review-prompt.md`](codex-review-prompt.md), passed verbatim (run from the repo root):
`node "/Users/kmanojkumar/.claude/plugins/cache/openai-codex/codex/1.0.4/scripts/codex-companion.mjs" adversarial-review "$(cat docs/plans/codex-review-prompt.md)"`
**Parse the verdict + findings. Fix EVERY high and medium finding surgically (root cause, not surface). Re-run. LOOP until a pass returns ZERO high and ZERO medium findings** (low/nits allowed, logged). Do not stop early. Log every round in the ledger. If the working tree is too large for the companion's input limit, scope reviews per-package/per-area and run several.

## The ledger (mandatory — append-only, never delete)
Maintain **`docs/ledger/LEDGER.md`** + `docs/ledger/{research.md, bugs.md, codex-rounds.md, operator-review.md, component-matrix.md}`. Record **everything**: each research query + source URL + conclusion; each file created/changed + why; **every bug found + root cause + fix**; every codex round (findings + resolutions + verdict). Timestamp entries (use `date`). **`operator-review.md` = the OPERATOR REVIEW section: every judgment-call / assumption / best-guess decision you make instead of pausing — with the options considered, what you chose, and why — for MK to review later.** This is MK's audit trail — miss nothing.

## Locked decisions (do NOT re-open — full rationale in requirements.md §3 + gap-analysis.md)
- **Primitives:** `@base-ui/react@1.6.0` (via shadcn `--base base`). · **Tailwind v4** (4.3.1). · **Next 16.2.9 / React 19.2 / Node 24 / pnpm 11.7 / Turborepo 2.9.18.**
- **Distribution = hybrid:** **public npm** for tokens/preset/utils/icons (external consumers need no creds) + **private shadcn registry** for components (copy-in).
- **Component model = A (own it), drop the platform prefix** → export unprefixed component names. No pristine-shadcn tier; the maintenance skill surfaces shadcn diffs for cherry-pick.
- **Tokens:** DTCG → Style Dictionary (custom `color/oklch` transform + two light/dark builds + `@theme inline` bridge); runtime font/ease vars are `--font-family-*`/`--motion-ease-*` (NOT self-referential).
- **Docs/showcase:** Fumadocs (static export → Cloudflare Workers Static Assets). Storybook deferred; **VRT is day-one** (Vitest browser + vitest-axe + Playwright).
- **Registry integrity:** whole-canonical-item SHA-256 in `meta.integrity` + **Sigstore-signed manifest (GitHub OIDC)** + fail-closed consume preflight.
- **CF Access:** human docs = SSO identity login; `/r/*` = service-token-only.
- **Tooling:** Changesets (public + provenance), Renovate repo-hosted preset, `tsup` for package builds, `cosign` for signing.
- **Deferred:** `text-edit-collab` (F4), `DataList` placement (decide in P3), `vegastack-brand` real assets (O5).
- **Repo name:** MK creates the repo; working default `vegastack-design` (`github.com/VegaStack/<repo>`).

## What you build (the FULL local system — P0 is already scaffolded on `main`)
P0's repo + pipeline skeleton is already committed on `main`. Build the rest on **`feat/local-build`** (never push).

> **The 64-component inventory is PORTED + REFINED from `/Users/kmanojkumar/code/engg-vegastack-platform` — never blind-copied.** For each: read its source in `src/components/common` (platform wrappers) + `src/components/ui` (shadcn primitives) to capture its **exact variants/sizes/states/features/props/behavior** (the **functional spec** — don't drop variants), then re-author it **cleanly** on **Base UI + `@vegastack` tokens, unprefixed**.
>
> **Refine, don't inherit the platform's flaws:** (a) **no component-level hardcoded styles** — no inline `style`, no hex/arbitrary values (`bg-[#…]`, `h-[13px]`, `text-[0.8rem]`), no raw palettes (`bg-neutral-900`); **every visual value uses a semantic token** (`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`, the size scale); (b) no `!important`, no `outline:none`/disabled-focus → `:focus-visible`; (c) idiomatic Base UI (`render` prop + `data-starting-style`, not leftover Radix `asChild`); (d) **consistent** variant/size/prop naming across ALL components; (e) modern Tailwind v4. Let **no platform anti-pattern leak in.**
>
> Platform styling lives in each component's `.tsx` CVA strings **and** `src/app/globals.css` + `src/app/tailwind-palette.css` + `src/lib/utils.ts`. Showcase to recreate: the platform's `/components` route; exact OKLCH tokens: those CSS files (+ [`research/catalog-vegastack-platform.md`](../research/catalog-vegastack-platform.md)). Inventory + app-coupled split: [requirements §12](../requirements.md).
- **P1 — Foundations + showcase shell:** DTCG tokens from the **exact OKLCH values** in [`research/catalog-vegastack-platform.md`](../research/catalog-vegastack-platform.md) → Style Dictionary build (`theme.css`/`base.css`/`tokens.ts`/`tokens.json` + tsup); mechanical identity/a11y pass; `tailwind-preset`/`utils`/`icons` (Icon/BrandIcon + sanctioned-source lint); `<VegaStackProvider>`; the **full Fumadocs app** (every config + `ComponentPreview` + `AutoTypeTable` + static Orama search + llms routes + `output:'export'`); `packages/ui/registry.json` + `pnpm registry:build` → `public/r/*.json` + local integrity stamp; foundations pages.
- **P2 — Wave 1 core components** + the `vegastack-add-component` + `vegastack-consume` skills.
- **P3 — Remaining component waves** + the app-coupled presentational split + `text-edit` base (collab deferred) + the `vegastack-release` / `vegastack-design-audit` / `vegastack-brand` (stub) skills. Resolve `DataList` placement (detail/04 §7 + judgment; log it).
- **PER-COMPONENT COMPLETENESS GATE — nothing missed (`docs/ledger/component-matrix.md`):** one row per component (**all 64**, the complete inventory), columns each ✅/❌: **built · Vitest(behavior) · vitest-axe(0) · browser-render (Preview `preview_screenshot` + `preview_inspect` on its showcase page → renders + tokens resolve) · §7.6 contract (all UI states + knobs + JSDoc props + AutoTypeTable) · registry-item (hashed + token-pinned) · local copy-in (`shadcn add` from the local `http://localhost:<port>/r/` registry → renders) · in-showcase.** A component is done ONLY when every column is ✅; the build is NOT complete until **EVERY component's row is fully green — no skips, no sampling.** Prove the `--primary` one-file override repaints every component. (Playwright VRT snapshots are bootstrapped with `VRT_UPDATE=1` in the pinned Linux container; the suite self-skips only when baselines are absent.)
- **Stop point:** the system builds; **`component-matrix.md` is 100% green for ALL 50+ components (every column)**; the `--primary` override repaints → run the codex loop to **0 high / 0 medium** → write `HANDOFF-STATUS.md` (incl. the matrix summary) → **wait for MK.** No push/publish/deploy.

## Provisioning is POST-REVIEW (NOT needed to build — do not attempt, do not block on it)
For the eventual publish + deploy, which happen **after MK reviews**. You need NONE of them to build locally:
- npm public org `@vegastack` + `NPM_TOKEN`; GitHub secrets (`NPM_TOKEN`, `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_ACCESS_CLIENT_ID/SECRET`) + branch protection; Cloudflare account + `design.vegastack.com` DNS + Access + SSO IdP + service token + Workers.
- **Already done:** the private repo exists; **Node 24** is installed (`/opt/homebrew/opt/node@24/bin`). Docker is **not** installed → VRT deferred.
- **Fonts:** OK to vendor self-hosted **Geist (MIT)** + **Lora (OFL)** — both freely redistributable. Build with them.

## Reference material you SHOULD read (don't re-derive)
- **Verbatim configs:** [`detail/01`](detail/01-monorepo-release-ci.md)…[`detail/06`](detail/06-platform-migration.md) — copy these, don't reinvent.
- **The reference repo (authoritative for Fumadocs):** `/Users/kmanojkumar/code/references/fumadocs` (its `packages/*` ARE the npm sources; `examples/next-static` + `examples/next-shadcn` are the canonical patterns).
- **Exact component APIs + token values + the showcase to recreate:** `/Users/kmanojkumar/code/engg-vegastack-platform` (`src/components/common` + `src/components/ui` = the source inventory behind the 64-component system; `src/app/.../components` = the showcase; `src/app/globals.css` = the OKLCH tokens).
- **Skill model:** `/Users/kmanojkumar/code/references/resend-design-skills`.
- **Research catalogs:** [`docs/research/`](../research/README.md).

## Execution order
1. **First:** prepend Node 24 to PATH (verify `node -v` = v24); `corepack prepare pnpm@11.7.0 --activate`; `git checkout -b feat/local-build`; create `docs/ledger/`.
2. Read [`implementation-plan.md`](implementation-plan.md) (version matrix + decision log) + the relevant `detail/*` for each step.
3. Build **P1 → P2 → P3** end-to-end (above). After each phase: subagent bug-hunt + fix; ledger update.
4. Run the **Codex adversarial-review loop until ZERO high/medium findings** (the "Codex adversarial-review loop" section above; the prompt is the standalone file [`codex-review-prompt.md`](codex-review-prompt.md)). Fix surgically each round; log every round.
5. Write `HANDOFF-STATUS.md` (what's green locally, the codex GTG verdict, the exact publish/deploy commands for MK) and **stop — wait for MK review.** Never push/publish/deploy. P4 (platform migration) + P5 (rollout) are separate post-review efforts on other repos.

## NEVER pause — decide, proceed, log for Operator review
- **Do not pause, do not ask MK anything.** If something is genuinely undecided and no `detail/*` file + locked decision covers it → **assume the best, make the call on your own best judgment, keep building**, and log the decision (options considered + what you chose + why) to **`docs/ledger/operator-review.md`** for MK to review. Never re-ask things already decided.
- If a pinned version/API in `detail/*` doesn't match what's actually installed/available → websearch the official docs, use the correct current value, **proceed**, and log the discrepancy + fix to `operator-review.md` (never silently diverge unrecorded).
- The **only** hard stop is an irreversible/outward action: **never push, publish, deploy, or create public resources.** Everything else — decide and continue.
