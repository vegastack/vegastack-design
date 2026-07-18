# HANDOFF — VegaStack Design System Overhaul v5 (Fable 5, GO-DARK AUTONOMOUS EXECUTION)

You are the EXECUTION agent for a fully-planned, adversarially-reviewed design-system overhaul at `/Users/kmanojkumar/code/org-design`. MK has authorized **fully autonomous, end-to-end execution**: do NOT pause for approval at phase gates, do NOT wait for check-ins, do NOT stop to confirm design micro-decisions. Go dark, execute the entire program meticulously, and surface a complete report at the end. Everything is decided and documented — your job is disciplined execution plus proactive improvement, not re-planning.

## Read in this exact order (all paths repo-relative)

1. `CLAUDE.md` + `AGENTS.md` — operating rules. Critical: **edit canonical `packages/ui/registry/ui/<name>.tsx` ONLY, then `pnpm registry:build`** regenerates copy-ins + JSON (never hand-edit `apps/docs/components/ui/`, never fix component styling in `preview/*.tsx`).
2. `docs/plans/2026-07-system-audit-remediation.md` — **plan v5**: 20 locked decisions (D1–D20 as amended), the 16-finding Codex disposition register (CX-1…16), MK's resolutions, and the phase DAG: **P → T1–T6 → U → C → X1 → X2 → R → M → S → D → A → B → Z** (Phase −1 rails are already done).
3. `docs/plans/2026-07-execution-checklist.md` — the step-by-step runbook with THE GATE commands. Work top to bottom; check items off in the file as you complete them.
4. `docs/audits/2026-07-14-system-audit/00-REGISTER-v2.md` — the ONLY findings register you execute from (94 findings re-verified: 80 OPEN, 13 AMENDED, 1 FIXED, each with current file:line + phase assignment). `00-SYNTHESIS.md` is superseded — never work from it.
5. `design.md` (repo root) — canonical visual spec (heights 28/32/40, radii 6/8/12, motion tokens, warm neutral ramp).
6. Per-phase inventory audits (all in `docs/audits/2026-07-14-system-audit/`): 01 token-purity (T2) · 02 api-consistency (C) · 03 merge-overlap (C/X) · 04 versions (U) · 05 a11y-states (P/C) · 06 visual-consistency (T1/T5) · 07 docs-previews (D) · 08 token-architecture (T2/T3/T5) · 09 motion (T4/M) · 10 transitions-dev (M) · 11 app-shell (S) · 12 responsive-mobile (R) · 13 docs-infra (D) · 14–17 brand forensics/typography/landscape/direction (T6/B) · 18 Codex adversarial review (context).

## Autonomy contract (MK, 2026-07-15)

- **No approval pauses.** Phase gates are SELF-verification: run them, make them pass, record the result, move on. Never ask "should I proceed".
- **Design micro-decisions**: decide yourself using the documented principles (plan D1–D20, design.md, audit 17 brand direction), and log every such call in `docs/plans/2026-07-decisions-log.md` (create it; one line each: decision, rationale, files touched) so MK can review after the fact.
- **transitions.dev**: fully cleared by MK — no license flag, no tweet archival needed. Execute Phase M per D11/CX-1 resolution: study their snippets as reference, re-express in Base UI idiom on our tokens (no verbatim copying — our own expression regardless).
- **Commits**: do NOT commit, tag, push, publish, or deploy. MK will explicitly ask when a commit is wanted. Work entirely in the working tree; keep it verifiable via the gates.
- **Proactive improvements are authorized**: when you find something worth improving beyond the register (cleaner pattern, dead code, better DX, missing edge case), do it if it fits the documented principles, and log it in the decisions log. If it would contradict a D-decision or CX disposition, log it as a recommendation instead and continue.
- **Stop only for**: publish/deploy/push actions (MK-only, per repo operating mode) or a genuine contradiction between two MK decisions that the plan cannot resolve. Nothing else stops the run.
- **End state**: entire checklist done, all gates green, decisions log complete, final summary report written to `docs/plans/2026-07-execution-report.md` (per-phase outcomes, gate evidence, VRT diff counts, improvements made, anything left for MK: commit, push, CI baseline workflow, publish).

## Non-negotiable standing rules (MK, verbatim intent)

- **Greenfield**: no backward compatibility, no alias windows, no deprecated re-exports, no compat shims, flat-only exports, one convention everywhere. Nothing deferred except the externally-blocked list in plan §Not-in-this-build.
- **Zero hardcoded style values — including opacity.** Everything from tokens. Every token migration lands atomically WITH its lint rule and VRT review (CX-2).
- Aesthetic: borders over shadows (single `shadow-overlay` exception) · ring-free focus (border-tint; a visible focus indicator is always preserved — a11y is never traded away) · max weight 600 · subtle motion only, never hover animations, reduced-motion-safe · mono = uppercase voice layer ≤14px, never headlines · uppercase is mono-exclusive · accent (phosphor green, THEME-SPLIT tokens per CX-9 — light variant must meet ≥3:1 for meaningful glyphs) = marker roles only.
- Clean code: no duplication, extract shared logic on second use, optimal-not-overengineered, WCAG 2.1 AA + axe on every state.
- **THE GATE after every phase** (checklist header has exact commands): `pnpm lint && pnpm typecheck && pnpm test` · `pnpm --filter @vegastack/docs test:vrt` (74/74 minimum, zero skips; mobile project added in Phase R raises this) · `pnpm registry:build && git diff --exit-code apps/docs/public/r apps/docs/components/ui packages/ui/registry.json` (idempotency — run AFTER staging intentional changes conceptually; a dirty diff from your own intended edits is expected mid-phase, the check is that a SECOND registry:build changes nothing) · `pnpm registry:verify-consume` when components changed. Review every VRT diff individually: intended → update baseline; unintended → fix before proceeding.

## Current state (where the previous session stopped)

- Phase −1 done: VRT **74/74 darwin baselines passing** (untracked, in `apps/docs/vrt/components.spec.ts-snapshots/`) · `tooling/version-sync.mjs` proven (507-item round-trip) + `release.yml` wired to `pnpm run version-packages` · `00-REGISTER-v2.md` written · root `pnpm build` green (6/6).
- **Begin at Phase P** (P0 fixes, register IDs P0-01…07 — note marker/bubble `'use client'` IS still missing; register v2 adjudicated Codex's contrary claim as wrong) and run the DAG to the end.
- CI Linux VRT baselines require the `vrt.yml` `update_baselines` workflow after MK pushes — record in the final report, do not attempt.

## Operational gotchas (learned the hard way — respect these)

- `export PATH=/opt/homebrew/opt/node@24/bin:$PATH` for all pnpm/build/VRT commands.
- **Never pipe test/build runs through `tail`/`head`** — it masks exit codes (this bit the previous session twice). Redirect to a log file, `echo $?`, then inspect the log.
- Playwright snapshot names sanitize `/`→`-` with a leading dash: `-docs-components-button-chromium-darwin.png`. The screenshot expect timeout is 30s (tall pages need two consecutive full-page captures).
- The VRT webServer builds + serves on port 3000 — kill anything on 3000 first (`lsof -ti :3000 | xargs kill`).
- Subagents: pass an explicit `model` override (default inherit hit an org-access error previously). Every subagent WRITES its findings/work summaries to disk so nothing is lost; if one stops saying "waiting for my background agents", resume it and tell it to finish inline.
- 68 canonical components in `packages/ui/registry/ui/` (+ `.test.tsx` each); the registry totals 507 items (includes vendored animated icons — do NOT restyle those beyond what Phase T4/M specifies).
- Keep long operations in background tasks with completion checks; keep a per-phase log so the final report has evidence, not memory.
