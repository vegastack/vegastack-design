# 06 — Tooling and gates

_Agent report, 2026-09-07. Read-only pass over tooling/, hooks, workflows, package scripts; reproductions were run where stated._

## Verdict

The gate ladder is unusually well-built: scope selection fails toward a full sweep, the contracts runner refuses green-but-empty runs, negative fixtures for six gates actually execute inside `pnpm lint`, and every script in `tooling/` is referenced by something. But two of the load-bearing claims in AGENTS.md are not what the code enforces: **`deploy.yml`'s "unconditional full-sweep" receipt-guard accepts a scoped one-route push receipt** (reproduced), and the **`GATES_SKIP` "loud door" is silent for the three ship-only gates**. A third real fail-open: `versionBumpOnly()` cannot see untracked files, so `pnpm classify` currently reports the working tree as a "pure version bump" while it holds 2,716 new files. Bloat is moderate (27 independent `ROOT` derivations, 7 directory walkers), and the stale `minimumReleaseAgeExclude` is confirmed.

## Findings

**TG-01 · High · fail-open · Deploy's "full sweep required" guard accepts a scoped push receipt**
`.github/workflows/deploy.yml:433` runs `verify-gate-receipt.mjs --contracts true --unit true --smoke true` and the surrounding comments (lines 389-391, 409-414) claim only `pnpm gates:ship` can satisfy it. `tooling/lib/gate-receipt.mjs` `verifyReceipt()` checks only `executed > 0` and `scopeRoutes === 0 && !full`; it never checks `mode === "ship"` or `contracts.full === true`. Worse, `tooling/gates.mjs:597` drops `all-browsers`, `registry`, and `consume` from the receipt (`if (!ALL_GATES.includes(result.id)) continue`), so the three-engine suite — listed as "attested via `.gates/receipt.json`" in AGENTS.md §Verification ladder — is never in the receipt at all.
Reproduction (synthetic receipt: mode `push`, contracts `{executed: 8, full: false, scopeRoutes: 1}`, real tree hash):

```
node --input-type=module -e '…verifyReceipt(scoped,{required:{contracts:true,unit:true,smoke:true}…})'
problems: []
```

`tooling/verify-gate-receipt-negative.mjs` has no case for this (grep `full|mode` → only fixture setup lines 35/48/241/252).
Fix: add a `requireFullSweep` option to `verifyReceipt` (deploy passes it) that fails unless `receipt.mode === "ship"`, `contracts.full === true`, `scopeRoutes === COMPONENT_ROUTES.length`, and a new `SHIP_GATES = ["all-browsers","registry","consume"]` set is present and passing; bump `SCHEMA` to 2; add the negative case.

**TG-02 · High · fail-open · `GATES_SKIP` records nothing when only ship-only gates fail**
`tooling/gates.mjs:640-650`: `skips` is built from `results.filter(r => r.status === "fail" && ALL_GATES.includes(r.id))`. Run `GATES_SKIP="x" pnpm gates:ship` with a failing `all-browsers`/`consume`/`registry` → receipt written with `skips: []`, every listed gate `pass`, exit 0. The "loud door" is silent for exactly the gates that only run at ship time.
Fix: record every failed gate id in `skips` regardless of `ALL_GATES`; have `verifyReceipt` reject any skip naming an unknown gate rather than ignoring it.

**TG-03 · Medium · fail-open · `versionBumpOnly()` treats untracked files as pure version churn**
`tooling/lib/change-set.mjs:668-717` diffs `git diff -U0 <before> -- <files>`; an untracked file produces no hunk, so it is never an offender. `dropProvenanceOnly` (lines 477-483) documents fixing this exact bug twice, but `versionBumpOnly` repeats it.
Reproduction on the current tree (only change: 2,716 untracked files under `docs/audits/…`):

```
$ node tooling/classify-change.mjs
  2716 changed file(s); 0 were provenance re-stamping only
  contracts       false — none (pure version bump — no observable change)
$ node -e 'versionBumpOnly(HEAD, null)'  → ok: true files: 2716 offenders: 0
```

A brand-new `packages/ui/registry/ui/foo.tsx` would classify identically. Blast radius: `pnpm classify`, `release-classify`, `verify-gate-receipt.mjs` run without flags, and `gate-receipt-carry.mjs` (working-tree mode inside `pnpm version-packages`). CI passes commit ranges and `gates.mjs push` does not use the predicate, so the hook lane is unaffected.
Fix: when `after === null`, add every `untrackedFiles()` entry as an offender; add a case to `verify-classify-change.mjs`.

**TG-04 · Medium · false coverage claim · "CI re-executes the entire non-browser half" is conditional**
`release.yml:212` `quality-gate: if: needs.changes.outputs.publish == 'true'`; `ci.yml` fires only on `pull_request`; `deploy.yml:385-388` states `main` has no branch protection. A direct push to `main` touching only `apps/docs/` (no changesets, no `packages/`) gets `changes` + `receipt-guard` and **no** `typecheck`/`lint`/`design:verify` re-execution; `deploy.yml` then runs only `registry:build` and `pnpm build`. Fix: drop the `if:` on `quality-gate` (it costs zero on the minis) or add `pnpm lint` to `build-sign-deploy`.

**TG-05 · Low · stale · "864 checks / 108 routes" is wrong everywhere it is written**
Contract has 110 components → 880 checks; the committed receipt says `executed: 880, scopeRoutes: 110`. Stale in `AGENTS.md` lines 97, 290, 304, 322, 328, 338; `ci.yml:15`; `tooling/gates.mjs` header; `tooling/lib/gate-receipt.mjs` header; `verify-hooks-installed.mjs` header. AGENTS.md's own rule is "never quote a count from prose". Fix: emit the route/check count from the generated §Numbers block and reference it, or say "every component route".

**TG-06 · Low · deps · `minimumReleaseAgeExclude` is stale (confirmed)**
`pnpm-workspace.yaml:27-29` excludes `fumadocs-core@16.10.5`/`fumadocs-ui@16.10.5`; installed is `16.11.5` (both `apps/docs/package.json` and lockfile). `pnpm config get minimumReleaseAge` → `undefined` on pnpm 11.7.0. The excludes are no-ops. Fix: delete them, and set `minimumReleaseAge` explicitly if the intent is to hold a floor.

**TG-07 · Low · bloat · duplicated plumbing, one swallowed-error walker**
`ROOT` is re-derived 27 times in 8 spellings (`join(...,"..")` ×7, `resolve` ×3, `dirname(dirname())` ×2, `process.cwd()` in `gates-digest.mjs`, a literal in one script) although `tooling/lib/change-set.mjs` exports it. Seven private directory walkers (`content-lint.mjs:37`, `design-lint.mjs:442/710`, `sync-package-skills.mjs:31`, `verify-portal-theme-scope.mjs:32`, `verify-rsc-safety.mjs:103`, …), five `fatal()`s, `createHash` in five files. `content-lint.mjs:37-43` returns `[]` on an unreadable root, so a moved `skills/` or `apps/docs/content` reads as clean — the exact fail-open `design-lint.mjs:472-479` explicitly fixed. Fix: `tooling/lib/fs.mjs` (walk, readJson, fatal) + import `ROOT`; make content-lint exit 2 on an unreadable root.

**TG-08 · Low · lint gap · motion pairing accepts raw Tailwind duration/ease steps**
`design-lint.mjs:499` only requires a `duration-`/`ease-` _prefix_; `raw-motion` (line 531) bans arbitrary `[…]`/`cubic-bezier` only. `transition-opacity duration-300 ease-in-out` passes lint while AGENTS.md §Build rules requires `duration-fast/base/slow` + `ease-standard/…`. Zero offenders today (`tooltip.tsx:211` `duration-0` is structural). Fix: anchor to `duration-(fast|base|slow)` and `ease-(standard|emphasized|exit|spring)`.

**TG-09 · Low · stale · `.npmrc:3-4` describes `actions/setup-node` injecting `NODE_AUTH_TOKEN`**, which `verify-workflow-security.mjs:417` forbids and `release.yml` no longer does (OIDC). Fix the comment.

## Design-lint coverage (offenders in `packages/ui/registry/ui/*.tsx`, non-test)

| Ban (AGENTS §Build rules / task list)                                                                                                                           | Enforced?                                                     | Rule                                  | Offenders                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| hex, raw palette                                                                                                                                                | yes                                                           | `hex-color`, `raw-palette`            | 0                                                                                     |
| raw control sizes `h/size/min-w-7\|8\|10`                                                                                                                       | yes                                                           | `raw-control-size`                    | 0                                                                                     |
| other raw sizes (`size-4` ×12, `size-3.5` ×9, `h-4` ×16, `h-5/6` ×10 each, `w-N` ≈45 excl. `w-0`)                                                               | **no** (only inside `[&_svg]` selectors / lucide `className`) | `raw-icon-size`, `direct-lucide-size` | ~90                                                                                   |
| `opacity-NN`, `/NN` alpha, role cross-use                                                                                                                       | yes                                                           | `raw-opacity`, `raw-alpha`, `*-role`  | 0                                                                                     |
| `z-N`, `rounded-xl`, `font-bold/semibold`, `tracking-*`, `shadow-*`, `text-4xl+`                                                                                | yes                                                           | one rule each                         | 0                                                                                     |
| `transition-all` / `transition-colors`                                                                                                                          | yes                                                           | `transition-all`, `color-transition`  | 0                                                                                     |
| raw `duration-300` / `ease-in-out`                                                                                                                              | **partial** (TG-08)                                           | `transition-pairing`                  | 0                                                                                     |
| `React.forwardRef`                                                                                                                                              | yes (AST)                                                     | `forward-ref`                         | 0                                                                                     |
| raw `<button>/<input>`                                                                                                                                          | yes, counted exemptions (14 files)                            | `raw-interactive-html`                | 0 unexempted                                                                          |
| physical `ml/mr/pl/pr/left/right-*`                                                                                                                             | **no** (RTL covered at runtime by contracts only)             | —                                     | 36                                                                                    |
| `text-left/right`                                                                                                                                               | **no**                                                        | —                                     | 5                                                                                     |
| `text-xs` on non-mono                                                                                                                                           | **no** (`uppercase-mono` fires only with `uppercase`)         | —                                     | 7                                                                                     |
| `rounded-full` override on IconButton                                                                                                                           | **no**                                                        | —                                     | 0 in `icon-button.tsx` (43 elsewhere: avatars, dots)                                  |
| `role="alert"`                                                                                                                                                  | **no**                                                        | —                                     | 3 (`alert`, `field`, `field-inline`)                                                  |
| `tabIndex={0}` on non-scrollable                                                                                                                                | **no**                                                        | —                                     | 6 (`audio-player` ×2, `comparison-matrix`, `scroll-area`, `terminal`, `video-player`) |
| trailing / double spaces in class strings                                                                                                                       | **no**                                                        | —                                     | 0 / 1 (`data-list.tsx:505`)                                                           |
| `hover:` on fill-less surface                                                                                                                                   | **no**                                                        | —                                     | 53 `hover:bg-` sites, unclassified                                                    |
| `{@link}` in MDX                                                                                                                                                | not linted (MDX compile fails anyway)                         | —                                     | 0                                                                                     |
| `outline-none` without affordance, inline `style`, arbitrary values, icon source, inline `<svg>`, `Omit<…,'render'>`, uppercase-mono, flex+truncate, faint text | yes                                                           | 9 rules                               | 0                                                                                     |

`skill-lint.mjs:286-320` proves `lint-rules.md` mirrors the 34 enforced ids in both directions — the "34-rule set" claim holds.

## Verified fine

- Tree clean except two untracked audit paths; `registry.json` 556 = contracts 110+439+6+1 = AGENTS §Numbers; `public/r` 558 = 556 + `registry.json` + `integrity-manifest.json`; `packages/design/skills` ≡ `skills/public` (`diff -r`); docs copy-in byte-identical; `region-select-data.ts` is a `files` entry, not a missing item.
- Committed receipt covers tree `7901cd…`; working tree hashes `2e1d66…` only because of the untracked captures — the guard rejects it correctly.
- Unrecognised paths force a full sweep (`route-scope.mjs:325-328`), proven by `verify-route-scope.mjs`; a `versionBumpOnly` exception in `classify-change.mjs:157` falls to the safe direction.
- `contracts-run.mjs`: grep cross-checked against `--list`, `executed === 0` → exit 2, empty scope → SKIPPED, process-group reaping with self-pid guard.
- All six negative fixtures run inside `pnpm lint`; `verify-hooks-installed` runs there too. No `|| true`/`continue-on-error` outside diagnostic-only `runner-diagnostics.yml`.
- Receipt guard: pinned Playwright, contract SHA, unknown-gate rejection, skip acknowledgement, carry re-derived from a reachable commit.
- Workflow security: SHA-pinned actions, empty hosted allowlist, `NPM_TOKEN` ban, container ban, `pull_request_target` ban.
- No dead scripts: every `tooling/*.mjs` is referenced by a package script, workflow, hook, `.claude/settings.json`, or another script.

## Doubts for the maintainer

| #    | Question                                                                                                                                                       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TD-1 | Should the receipt schema go to v2 so ship-only gates are recorded and deploy can demand `mode: ship` (TG-01)? That invalidates the current committed receipt. |
| TD-2 | Physical direction utilities (36 sites): is a lint ban wanted, or is the runtime RTL contract the intended sole guard?                                         |
| TD-3 | Is "`text-xs` only for mono" actually a design.md rule? I did not confirm it before counting the 7 sites.                                                      |
| TD-4 | `tabIndex={0}` in `audio-player`, `video-player`, `comparison-matrix`: focus-trap/scroll-region intent or leftover?                                            |
| TD-5 | The deps audit's claim that pnpm 11 defaults `minimumReleaseAge` to 1440 min is unverified against 11.7 docs; only the stale excludes are confirmed.           |
| TD-6 | Is `quality-gate`'s `publish` condition still wanted now that minis are free (TG-04)?                                                                          |
| TD-7 | `turbo.json` `globalDependencies: ["tooling/**"]` rebuilds the docs export on every tooling edit (~1m40, noted in `gates.mjs`). Intended?                      |
