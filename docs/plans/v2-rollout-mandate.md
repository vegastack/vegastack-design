# MANDATE — v2 Design System Autonomous Rollout (READ FIRST after any compaction)

**Status:** IN PROGRESS · autonomous · DO NOT STOP until every phase is done + build green.
**Operator is away.** Make sound decisions, log every one in `v2-rollout-ledger.md`, finish everything, report only at the end.

## The mission
Propagate the finalized v2 spec (`/design.md`) into the **live repo** — tokens + all 59 components + Fumadocs showcase — so the entire system is driven by the **global token files** with **zero local style overrides** for anything globally tokenized. Goal: change a global token → 100% consistent re-skin across every component, now and for future components.

## Hard rules
1. **No commits / no push / no publish / no deploy.** Operator reviews locally, then commits themselves. (Build LOCAL, stop at publish.)
2. **Build + all gates MUST pass** at the end: `pnpm build`, `tooling/contrast-check.mjs`, `tooling/design-lint.mjs`, unit tests + vitest-axe, registry integrity. Do not declare done until green.
3. **No local styles that should be global.** Components must not hardcode sizes/radii/colors/shadows that the token system owns. Everything routes through semantic Tailwind utilities backed by tokens. Remove every divergence.
4. **Every component, every variant** updated AND shown in the Fumadocs showcase exactly as the component renders (no local doc-only fixes). 60+ components — miss none.
5. **Persist state continuously** — update the ledger + TaskList after each step so compaction can't lose progress.
6. Don't defer, skim, or skip. If blocked on one thing, log it and continue; fix it before final report.

## Source of truth
- **Spec:** `/design.md` (v2 — warm neutrals, neutral `primary`, `brand`=purple, `info`=blue, status, solid border, neutral `ring`=primary, heights 28/32/40, radius 6/8/12/full, tokenized size/radius/shadow/type).
- **Plan + per-component spec table + roadmap:** `docs/plans/design-v2-implementation.md` (§5 per-component targets, §9 execution roadmap).
- **Gap analysis:** `docs/plans/design-md-gap-analysis-vs-vercel.md`.

## Locked decisions (from operator)
- Focus = **one neutral ring**: set `--ring` = `primary` (re-colours base.css + 30 components via the token; NO component focus surgery). Optionally thin to ~2px in base.css.
- Heights **28 / 32 / 40** (`h-7`/`h-8` default/`h-10`); padding-x sm10/md12/lg16 (btn), 12 (input).
- Border = **solid warm neutral** (`neutral-200` light / `neutral-800` dark); `input` + `sidebar-border` **alias** to `border`.
- **Tokenize all four** scales: `--size-*`, `--radius-*`, `--shadow-overlay`, `--text-*` (type+shadow need new Style-Dictionary formats in `build-tokens.mjs`).
- selected/checked/active state = **`brand`** (purple); primary button stays neutral `primary`.
- Keep `showcase-*` (used in 8 files); keep repo neutral ramp step keys (`50–950`, warm the values); keep repo `motion-ease-standard [0.2,0,0,1]`; charts extend 1→8 (additive).
- Warm ramp: keep each step's existing **L**, set **C≈0.003, H=75** (low-risk; preserves contrast structure).

## Execution phases (see roadmap §9 for detail)
0. Baseline: build + gates green; capture before-state.
1. Token VALUES (primitives + semantic + dark) → regenerate → contrast gate. **Re-skins all 59.**
2. Scale TOKENS + `build-tokens.mjs` formats (size/radius/shadow/type) → `@theme inline`.
3. **Component migration (60+, parallel subagents, ~3 each):** sizing 28/32/40 + padding; selected→brand; radius per surface; **strip local styles that should be global**; update each component's **Fumadocs showcase** (all variants). Then **codex adversarial review** per batch → fix all findings → clean.
4. Validation: build, contrast, design-lint, tests/axe, **regenerate ALL VRT screenshots**, **regenerate registry-integrity hashes**, docs QA.
5. Reconcile `design.md` ↔ tokens (ramp keys, motion-ease).
6. Cleanup: archive superseded `proposed-design-system.html`; fix docs MDX on old values.
7. (USER) commit/push — NOT done by me.

## Quality bar
- Follow `/vercel-react-best-practices` + design-system best practices (CVA, `cn()`, `data-*` state, forwarded refs, `render`, server-safe default, `'use client'` only at leaf).
- Web-search to confirm current patterns + find pre-existing bugs; fix them; log in ledger.
- Adversarial-review (codex) every batch; fix until clean.

## Sub-agent mandate template (Phase 3)
Each agent gets EXACTLY 3 components and is told: read `/design.md` + `docs/plans/design-v2-implementation.md` §5 + its 3 `packages/ui/registry/ui/<c>.tsx` + their Fumadocs showcase pages. Apply: heights 28/32/40 via tokens; radius per surface; selected/checked/active → `brand`; remove any hardcoded/local style the token system owns; ensure CVA/cn/data-* best practices; update the showcase to render every variant cleanly with no doc-local style. Report what changed + any pre-existing bugs found. Do NOT touch tokens/build.
