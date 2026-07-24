# HANDOFF-PROMPT — paste this into a fresh session

> **Historical record — do not paste or execute.** The autonomous build this prompt started is
> complete. Its authority, package names, counts, tools, and commands are stale. Current authority is
> `AGENTS.md` plus the applicable `component`, `review`, or `ship` skill.

Open a fresh Claude Code session **in `/Users/kmanojkumar/code/org-design`** (Opus 4.8) and paste the prompt below. It runs fully autonomously ("dark"), builds the entire design system locally, self-corrects with subagents, loops the Codex adversarial review until 100% GTG, keeps a ledger, and **stops before any push/publish/deploy** for MK's review.

---

## The prompt (copy verbatim)

```
You are taking over the VegaStack design-system build, FULLY AUTONOMOUSLY ("go dark" — do not ask me anything; everything is already decided). Work in /Users/kmanojkumar/code/org-design (the private repo "vegastack-design"; P0 repo+pipeline skeleton is already committed on main).

READ FIRST, in order: docs/plans/00-START-HERE.md → docs/plans/implementation-plan.md → docs/plans/detail/01..06 → docs/requirements.md → docs/gap-analysis.md. Everything is decided + verified — do NOT re-architect; follow the specs verbatim. The research catalogs are in docs/research/.

OPERATING MODE:
- Build the ENTIRE design system LOCALLY and prove it works in the Fumadocs showcase consuming the EXACT @vegastack/* packages (workspace links + a LOCAL registry served over http://localhost). Build everything in the plan EXCEPT the real npm publish and Cloudflare deploy.
- DO NOT git push. DO NOT publish to npm. DO NOT deploy to Cloudflare. Work on branch feat/local-build; commit incrementally; NEVER push. MK reviews locally; the first push happens only after MK approves.
- No credentials are needed. Skip all npm/Cloudflare/GitHub-secret prerequisites — they are post-review.
- Node 24 is installed at /opt/homebrew/opt/node@24/bin — prepend it to PATH for ALL build/test commands and verify `node -v` = v24 (the default node is v22; do NOT touch ~/.local/bin/node). Run `corepack prepare pnpm@11.7.0 --activate`.
- VISUAL + STYLE verification via the Preview MCP (CONFIRMED working in-session): preview_start the Fumadocs dev server → preview_screenshot (layout) + preview_inspect (exact computed CSS — verify token values, e.g. --primary resolves to the right oklch). VISUALLY VERIFY EVERY ONE of the 50+ components on its own showcase page — preview_screenshot (renders + all variants visible) + preview_inspect (computed CSS resolves to the right tokens) — and record each pass in the component matrix (below). Fallbacks: Claude-in-Chrome MCP (a live local browser is connected) or ask /codex to run it. The Playwright MCP is broken on this machine — do NOT use it. Run Vitest + vitest-axe on every component. Only the Playwright toHaveScreenshot baseline-VRT (deterministic CI snapshots) is deferred until Docker — write those specs describe.skip with a // TODO(VRT) note.
- Use the EXACT package, never a mock — if something renders wrong in the showcase, that's a real bug to fix at the root.
- Research as you go: websearch + official docs (+ the cloned /Users/kmanojkumar/code/references/fumadocs) to confirm correctness; don't trust memory. Reference component APIs + exact token values from /Users/kmanojkumar/code/engg-vegastack-platform; skill model from /Users/kmanojkumar/code/references/resend-design-skills.
- NEVER pause / never ask MK. If something is genuinely undecided and no detail/* + locked decision covers it → assume the best, decide on your own best judgment, KEEP BUILDING, and log the decision (options considered + what you chose + why) to docs/ledger/operator-review.md for MK's review. Never re-ask things already decided. The ONLY hard stop is an irreversible/outward action (push/publish/deploy/create public resources).

SCOPE (full build, P1 → P3): foundations + tokens + theme + the full Fumadocs showcase machinery (P1) → wave-1 core components + the add-component/consume skills (P2) → ALL 64 components + the app-coupled presentational split + text-edit base (collab deferred) + the release/audit/brand(stub) skills (P3). Every component must meet the requirements §7.6 contract (all UI states, the knobs contract, a11y, JSDoc props, AutoTypeTable) AND render in the showcase via the real package with Vitest+axe green. P4 (platform migration) and P5 (rollout) are NOT in this run.

PER-COMPONENT COMPLETENESS GATE (nothing missed): maintain docs/ledger/component-matrix.md — a table with ONE ROW PER COMPONENT (all 50+, the COMPLETE inventory from requirements §12 + the platform's src/components/common) and these columns, each ✅/❌: built · Vitest(behavior) · vitest-axe(0 violations) · browser-render(Preview screenshot + inspect: renders + tokens resolve) · §7.6 contract(all UI states + knobs + JSDoc props + AutoTypeTable) · registry-item(hashed + token-pinned) · local-copy-in(shadcn add from the LOCAL registry → renders) · in-showcase. A component is DONE only when EVERY column is ✅. You may NOT declare the build complete until EVERY component has EVERY column green — no skips, no sampling, no "good enough". Keep the matrix current as you build; it is the anti-miss mechanism.

SOURCE FOR EVERY COMPONENT — PORT + REFINE, never blind-copy: the 64-component inventory comes from /Users/kmanojkumar/code/engg-vegastack-platform/src/components/common (platform wrappers) + /src/components/ui (shadcn primitives). For each: READ the platform source to capture its EXACT variants/sizes/states/features/props/behavior — that's the FUNCTIONAL SPEC, do NOT drop variants or simplify — then RE-AUTHOR it CLEANLY on Base UI + @vegastack tokens, unprefixed. REFINE; do not inherit the platform's flaws:
  (a) NO component-level hardcoded styles — no inline style={}, no hex/arbitrary values (bg-[#...], h-[13px], text-[0.8rem]), no raw palettes (bg-neutral-900). EVERY visual value goes through a SEMANTIC token (bg-primary, text-muted-foreground, border-border, rounded-lg, the size scale).
  (b) NO !important; NO outline:none / disabled-focus → use :focus-visible.
  (c) Idiomatic Base UI (render prop + data-starting-style/ending-style), NOT leftover Radix/asChild patterns.
  (d) CONSISTENT variant/size/prop naming + structure across ALL 64 components.
  (e) Modern Tailwind v4.
The platform's styling lives in each component's .tsx CVA strings AND src/app/globals.css + src/app/tailwind-palette.css + src/lib/utils.ts — read those, port the INTENT, refine the IMPLEMENTATION, and let NO platform anti-pattern leak into this project. Showcase to recreate: the platform's /components route. Inventory + the app-coupled presentational split: requirements §12.

SELF-CORRECTION: after each phase, spawn MULTIPLE Opus 4.8 subagents in parallel to hunt bugs/edge-cases/gaps (dimensions: build/typecheck · a11y · token/Tailwind-v4 correctness · registry/integrity · per-component-contract completeness · showcase rendering). Fix everything at the root; re-run until clean.

LEDGER (mandatory, append-only, timestamped via `date`): maintain docs/ledger/LEDGER.md + docs/ledger/{research.md, bugs.md, codex-rounds.md, operator-review.md, component-matrix.md}. Record EVERYTHING — every research query+source URL+conclusion, every file created/changed+why, every bug found+root cause+fix, every codex round (findings+resolutions+verdict), and (in operator-review.md) every judgment-call/assumption made instead of pausing (options+choice+why). Miss nothing; this is MK's audit trail.

CODEX REVIEW LOOP (until 100% GTG): after the full local build passes your own checks + subagent fixes, run the Codex adversarial review directly via the companion. The strict review prompt is a STANDALONE FILE at docs/plans/codex-review-prompt.md — pass its FULL contents as the argument (cd into the repo first):
  node "/Users/kmanojkumar/.claude/plugins/cache/openai-codex/codex/1.0.4/scripts/codex-companion.mjs" adversarial-review "$(cat docs/plans/codex-review-prompt.md)"
Parse the verdict + findings. Fix EVERY high and medium finding SURGICALLY (root cause — never a surface patch). Re-run. LOOP until a pass returns ZERO high and ZERO medium findings (low/nits allowed — log them). Do not stop the loop early. If the working tree exceeds the companion input limit, scope reviews per-package/area and run several. Log every round in docs/ledger/codex-rounds.md.

STOP CONDITION: when the system builds; tsc/lint pass; **docs/ledger/component-matrix.md is 100% green for ALL 50+ components (EVERY column: Vitest + axe + browser-render + §7.6 contract + registry + local copy-in + in-showcase — no row, no cell missed)**; the --primary one-file override repaints; AND a Codex pass returns 0 high / 0 medium → write docs/plans/HANDOFF-STATUS.md (the component-matrix summary, what's green locally, the Codex GTG verdict, the exact `gh`/publish/deploy commands MK runs later) and STOP. Do not push/publish/deploy. Wait for MK.
```

---

## The strict Codex review prompt

It lives as a **standalone file** the agent passes verbatim to the companion: **[`codex-review-prompt.md`](codex-review-prompt.md)** (`"$(cat docs/plans/codex-review-prompt.md)"`). That file is the single source of truth for the review focus (not duplicated here, to avoid drift). Edit it if the review scope needs to change.

---

## After the loop returns GTG

The agent writes `HANDOFF-STATUS.md` and stops. MK reviews `feat/local-build` + the ledger, then (separately, with credentials provisioned) triggers the first push + `release.yml` (npm publish) + `deploy.yml` (Cloudflare + Sigstore signing).
