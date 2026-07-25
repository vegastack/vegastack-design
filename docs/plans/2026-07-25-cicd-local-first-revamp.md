# Local-first CI/CD revamp — measured plan (Option A)

**Date:** 2026-07-25 · **Status:** proposed, awaiting MK approval · **Author:** Claude Code session

Greenfield rewrite of the verification topology. No backward compatibility required.

**Decision taken (MK, this session): Option A.** No GitHub-hosted runner ever verifies a browser
gate. Every browser lane — the unit suite, the cross-engine lanes, the 768 contracts, the pixels —
runs on developer machines through git hooks and the `/ship` skill. GitHub-hosted runners are reduced
to the four things that physically cannot run anywhere else. The free mac minis independently
re-execute the entire non-browser half.

Goal: keep every fail-closed property the repo has today where it can still be kept, be honest in
writing about the one place it converts to attestation, and cut GitHub-hosted minutes ~98%.

---

## 1. Facts, measured today

Everything below was executed in this session, not recalled. Nothing is quoted from prose.

### 1a. What Actions costs now

From the GitHub API over the last **94 runs / 7.2 days** (per-job `started_at`/`completed_at`,
self-hosted split out by job labels):

|                             |    minutes |
| --------------------------- | ---------: |
| GitHub-hosted (billable)    |  **1,892** |
| Self-hosted (free)          |         17 |
| Hosted per day              |    **264** |
| Hosted, projected per month | **~7,900** |

Top consumers:

| minutes |   n |   avg | job                                     |
| ------: | --: | ----: | --------------------------------------- |
|     497 |  20 | 24.9m | `CI :: contracts (shard)`               |
|     416 |  31 | 13.4m | `Release :: vrt-gate` _(since deleted)_ |
|     307 |  26 | 11.8m | `VRT` workflow _(since deleted)_        |
|     169 |   2 | 84.3m | `CI :: contracts` unsharded             |
|     160 |  17 |  9.4m | `CI :: verify`                          |
|     104 |   8 | 13.0m | `Deploy :: vrt-gate` _(since deleted)_  |
|      96 |   4 | 23.9m | `Release :: contracts-gate (shard)`     |

**Steady state per PR push today:** `verify` ~10–17 min + 4 contract shards × ~25 min =
**~110 billable minutes**, re-paid on every push (`cancel-in-progress`).

Org billing this period (`docs/ledger/operator-review.md` § 2026-07-25): **20,412 Linux minutes,
$24.15 past the included allowance, hosted jobs currently refusing to start.** The release is blocked
by billing, not by code.

### 1b. What the same work costs locally (this Mac, 10 logical cores)

| gate                                                     |                wall clock | result                          |
| -------------------------------------------------------- | ------------------------: | ------------------------------- |
| `design-lint` over `packages/ui/registry`                |                  **1.4s** | clean                           |
| `secret-scan`                                            |                  **0.6s** | 2521 files                      |
| `skill-lint`                                             |                 **0.08s** | 7 skills                        |
| `verify-component-contracts`                             |                 **0.14s** | reconciled                      |
| `pnpm typecheck` (cold, `--force`)                       |                   **12s** | —                               |
| `turbo run lint` (cold, `--force`)                       |                   **20s** | —                               |
| `@vegastack/ui#test` — browser unit + axe                |                   **16s** | —                               |
| `test:smoke` — 3 engines, 10 selected files              |                 **15.8s** | 30 files / **468 tests passed** |
| `test:all-browsers` — 3 engines, full suite              |                **1m 39s** | passed                          |
| docs build, turbo cache **MISS**                         |                **1m 39s** | —                               |
| docs build, turbo cache **HIT**                          | **2.9s** `>>> FULL TURBO` | —                               |
| contracts, **1 route × 4 projects** (8 tests)            |                **1m 54s** | 8 passed                        |
| contracts, **full 768**                                  |               **13m 36s** | **768/768 passed**              |
| `registry:verify-consume` — real `shadcn add` round-trip |                **3m 45s** | 538 items × 2 layouts           |

### 1c. The four findings that decide the design

**Finding 1 — the contract lane's floor is the docs build, not the tests.**
`apps/docs/playwright.config.ts` runs `webServer.command = "pnpm build && pnpm exec serve out"` with
`reuseExistingServer: false`, so _every_ invocation pays a full `next build`. The 1-route run cost
1m54s, of which ~1m40 was that build; the 8 tests were ~12s. Meanwhile `turbo run build
--filter=@vegastack/docs` is a **2.9-second FULL TURBO hit** — `turbo.json` already declares `out/**`
as an output, so the content hash already exists. Scoping alone: 13.6 min → 1.9 min. Scoping **plus a
turbo-owned build**: **~15 seconds**. Scoping without the build fix is mostly wasted.

**Finding 2 — `ci.yml`'s `verify` needs a hosted runner for exactly two steps, and the mini already
proved the rest.** Job `89606685733` (run `30131471680`) ran `verify` on a mini:

```
5  success  pnpm install --frozen-lockfile
7  success  pnpm design:verify          <- token build, design.md sync, 538 contracts, contrast, parity, RSC safety
8  success  pnpm typecheck
9  success  pnpm lint
10 failure  pnpm test                   <- browsers
11-17 skipped
```

`design:verify`, `typecheck`, and `lint` are **proven green on the mini**. Only browsers failed.

**Finding 3 — `pnpm test` is two packages, and only one of them is a browser lane.**
`packages/design`'s test script is three plain `node test/*.mjs` files. `packages/ui`'s is
`vitest run` in browser mode. So the split is clean: `packages/design` tests stay in CI on the mini;
only `@vegastack/ui#test` moves local.

**Finding 4 — a recorded number is stale, and it changes a decision.**
`operator-review.md:169` records "768/768 passed in 5.6 minutes" on macOS ARM64. Measured today on
macOS ARM64: **13m36s** (`real 815.43`, `user 3789.34` → 4.6× parallelism at 5 workers on 10 cores;
CPU-bound, as documented). 13.6 min is the working figure. That is what keeps the full sweep out of
`pre-push` and puts the deferred `focusViaKeyboard` fix back on the table.

### 1d. Why the minis are not on the critical path any more

Diagnostic run `30150905149`, today: `launchd manager: System`, `gui domain: MISSING`, no LaunchAgent
plist, and all three engines dying with `SIGTRAP`. (That run's `contract suite wall clock: 2m31s` is a
fail-fast over 768 launch failures — **not** passing evidence. Do not cite it.)

Under Option A this no longer blocks anything: **the minis are never asked to launch a browser.**
The LaunchAgent fix is dropped from this plan entirely. It becomes a nice-to-have that would only
matter if you later want a second machine re-running the browser gates.

---

## 2. Answers to the questions asked

**"Can the 768 contract checks be a pre-commit hook?"**
Scoped, with the build fix, a component's own routes run in ~15s — so technically yes. `pre-commit`
is still the wrong home, for a reason that is not squeamishness: **a commit is not a publication
boundary.** WIP commits, `--amend`, and `rebase -i` each fire it, and none of them is the moment code
leaves the machine. `pre-push` is that moment and it knows the whole range being pushed. So:
pre-commit gets the ~3s static gates; pre-push gets the scoped browser gates; the full 768 (13.6 min)
belongs to `/ship`.

**"What does the cross-engine smoke do?"**
`pnpm --filter @vegastack/ui test:smoke` runs **10 test files against WebKit and Firefox** (plus
Chromium, because `mergeConfig` unions the base config's instances) — measured today: 30 files, **468
tests, 15.8s**. The ten are generated, not hand-picked: `contract-smoke-tests.generated.json` is
derived from every component whose `component-contracts.json` record carries
`coverage.crossBrowserSmoke: "selected"` — the motion mechanisms (`animated-number`,
`notification-bell`, `progress-indicator`, `skeleton`, `use-animation-replay`) and the
interaction/keyboard/clipboard surfaces (`checkbox`, `copy-button`, `input`, `password-input`,
`auto-save-input`). It exists to catch engine disagreements Chromium alone cannot show — day one it
found WebKit's Tab-skips-buttons convention breaking a keyboard test whose component was fine
everywhere else. `test:all-browsers` is the different, larger lane: the complete suite × 3 engines,
main/release only, the only lane that needed the pinned Playwright image — **1m39s locally.**

**"Add route scoping. Why the hesitation?"** Withdrawn. Husky is in, and §1b is the budget that makes
`pre-push` defensible rather than hopeful.

---

## 3. Target topology

The rule: **work runs on the cheapest machine that can produce trustworthy evidence, and CI
re-executes for free everything it possibly can.**

```
Tier 1  pre-commit      ~3-5s     static gates, staged files only. Never a browser.
Tier 2  pre-push        ~35-80s   typecheck · lint · ui unit suite · SCOPED contracts
                                  (+ cross-engine smoke when a smoke-selected component changed)
                                  → writes .gates/receipt.json
Tier 3  /ship (local)   ~20min    full lint chain · all-browsers 1m39 · full 768 contracts 13m36 ·
                        + pixels  verify-consume 3m45 · then vrt-review (scope-dependent).
                                  Agent reads every report. MK decides.
Tier 4a minis (free)              ALL non-browser work that executes repository code —
                                  independently re-executed, not attested
Tier 4b hosted (paid)   ~5min/rel only what cannot run anywhere else
```

### Tier 4b — the complete hosted list

| job                                       | why it cannot move                                                                                                                                                                                       |   cost |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `release.yml :: publish`                  | npm trusted publishing does not support self-hosted runners; the repo holds no `NPM_TOKEN`                                                                                                               | ~2 min |
| `release.yml :: package-build`            | **see §3a** — keeps published npm bytes originating on an ephemeral runner                                                                                                                               | ~4 min |
| `deploy.yml :: sign-curated`              | the only Sigstore OIDC job; runs no repository code                                                                                                                                                      |   ~30s |
| `deploy.yml :: deploy-curated`            | Cloudflare credentials, third-party actions, no repository code                                                                                                                                          | ~1 min |
| `deploy.yml ::` the three boundary probes | must originate **outside** VegaStack's network — a runner inside it can be silently authenticated by Cloudflare device posture, which _voids_ an anonymous-rejection proof rather than merely risking it | ~1 min |

Everything else self-hosted. `GITHUB_HOSTED_JOBS` in `tooling/verify-workflow-security.mjs` becomes
exactly:

```js
"ci.yml":     [],                     // nothing hosted at all
"release.yml": ["package-build", "publish"],
"deploy.yml":  ["sign-curated", "deploy-curated",
                "pre-cutover-purge", "verify-protected-boundary", "verify-public-boundary"],
```

Verified compatible: the allowlist reads `GITHUB_HOSTED_JOBS[name] ?? []`, then requires every
non-listed job to be `[self-hosted, vsk-runners-mac-mini]` and every listed job to be
`ubuntu-latest`, and fails if a listed job no longer exists. An empty array is a valid, fully-enforced
"nothing hosted here". The split stays an enforced allowlist, not a convention.

**Deleted outright:** `ci.yml :: contracts` (all four shards) · `release.yml :: contracts-gate` ·
`deploy.yml :: contracts-gate` · every `playwright install --with-deps` step · the pinned Playwright
container (nothing hosted needs a browser any more, so the digest-pinning assertion in
`verify-workflow-security.mjs` becomes dead and is removed with a negative test proving the ban).

### 3a. One deliberate hosted job I recommend keeping — npm artifact provenance

Today `quality-gate` builds `packages/design/dist` + `packages/design-tokens/dist` on
`ubuntu-latest`, uploads them, and `publish` downloads _those exact bytes_ and runs `changeset
publish`. If the build moves to a mini, the bytes on public npm originate on a **persistent**
self-hosted runner, while the OIDC provenance statement still asserts "built by release.yml in this
repository". That makes the attestation less true, and persistent runners can carry state between
runs — a concern this repo already takes seriously (the port-reaping comments exist for it).

So I recommend a small hosted `package-build` job: no browsers, no `playwright install`, no
container — `pnpm install`, build the two public packages, upload the artifact. ~4 minutes per
release. Everything else that `quality-gate` does today (typecheck, lint, registry idempotency,
verify-consume, the docs build) moves to the mini.

Noted asymmetry, deliberately: `deploy.yml :: build-curated` already builds the **registry** artifact
on a mini and `sign-curated` signs it. That was accepted in the previous approved plan, so this does
not reopen it — but it means the registry and npm paths differ in provenance. If you would rather they
match, say so and `package-build` moves to the mini too; it is a one-line allowlist change either way.

### Projected hosted usage

|                                                |        today |                                after |
| ---------------------------------------------- | -----------: | -----------------------------------: |
| per PR push                                    |     ~110 min |                            **0 min** |
| per main push (no changesets)                  | ~100-140 min | ~6 min (`package-build` + `publish`) |
| per main push (changeset-bearing → Version PR) | ~100-140 min |                            **0 min** |
| per deploy                                     |     ~135 min |                               ~3 min |
| per month at current cadence (13 runs/day)     |   ~7,900 min |                     **~100-150 min** |

**~98% reduction, and pull requests become free.** Well inside the included allowance.

---

## 4. Reliability under Option A — what is proven, what is attested

`AGENTS.md` § Verification ladder says every gate fails closed, and the repo refuses to trust a gate
clearable by regenerating its own evidence. Option A removes the second machine from the browser
lanes, so this section is the honest accounting. **Do not soften this table when the plan lands in
`AGENTS.md`.**

| gate                                                                                                                                                        | where it runs                     | status in CI                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| static gates (`design-lint`, `secret-scan`, `skill-lint`, workflow + boundary security)                                                                     | pre-commit **and** mini           | **independently re-executed**                                                    |
| `design:verify` (token build, design.md sync, 538-item contracts, contrast, theme parity, portal scope, RSC safety, toaster mirror, both negative fixtures) | pre-push **and** mini             | **independently re-executed** (mini-proven, §1c Finding 2)                       |
| `typecheck`, `turbo run lint`                                                                                                                               | pre-push **and** mini             | **independently re-executed** (mini-proven)                                      |
| `packages/design` node tests                                                                                                                                | mini                              | **independently re-executed**                                                    |
| `registry:build` idempotency, `design:derived:check`, `changeset status`                                                                                    | pre-commit **and** mini           | **independently re-executed**                                                    |
| `registry:verify-consume` (real `shadcn add` round-trip)                                                                                                    | mini                              | **independently re-executed** — network-free, all sidecar servers on `127.0.0.1` |
| `pnpm build` both `SITE_VISIBILITY` matrices                                                                                                                | mini                              | **independently re-executed**                                                    |
| `@vegastack/ui#test` browser unit + axe                                                                                                                     | pre-push, `/ship`                 | **attested**                                                                     |
| `test:smoke` cross-engine                                                                                                                                   | pre-push (scoped), `/ship`        | **attested**                                                                     |
| `test:all-browsers` three-engine                                                                                                                            | `/ship`                           | **attested**                                                                     |
| 768 contracts                                                                                                                                               | pre-push (scoped), `/ship` (full) | **attested**                                                                     |
| `vrt-review` pixels                                                                                                                                         | `/ship`                           | **attested** (already a review step, never a gate)                               |

Seven of eleven rows are still machine-verified for free. Four rows — every browser lane — become
attestation. That is the trade Option A buys, stated plainly.

**4a. Tree-bound gate receipt.** `tooling/gate-receipt.mjs` writes `.gates/receipt.json` (committed —
it is the record): the git tree hash the gates ran against, each gate → `{status, executed, scope,
reason, duration}`, the contract SHA-256, `playwright` version + installed browser revisions, and
OS/arch. `pre-push` writes it. A `receipt-guard` job **on the mini** fails when:

- the receipt does not cover `git rev-parse HEAD^{tree}`;
- any listed gate is not `pass`;
- a gate the change class requires is absent — a component change with no contract lane is a
  **failure**, not a pass. The change class comes from `release.yml`'s existing `visual` classifier
  (see 4b);
- the recorded Playwright version or browser revisions do not match the lockfile — a receipt produced
  against different browser builds is not evidence about this tree;
- a skip is recorded (4e) without MK acknowledgement.

**Stated limitation, in the file itself and in `AGENTS.md`: a receipt is attestation, not proof.**
`--no-verify` plus a hand-edited JSON defeats it. What it buys is that skipping a browser gate becomes
a visible, auditable act instead of a silent one — and under Option A that is the _entire_ guarantee on
those four rows. It is the right trade while MK is the only person merging component changes. The day
that stops being true, the answer is required status checks plus a second machine actually re-running
the lanes — not a cleverer receipt.

**4b. The `visual` classifier is kept and repurposed.** `release.yml`'s `changes` job reads diff
_bodies_ to tell a real component change from provenance-header re-stamping across 1082 files. With
`contracts-gate` deleted its old consumer is gone, but it is exactly the right authority for "must this
receipt contain a contract lane?" — so it stays, on the mini, feeding `receipt-guard`. That preserves
a carefully-earned piece of logic instead of deleting it.

**4c. Zero-executed guard, locally.** `release.yml` already fails a contract run that executed 0
tests. The local runner gets the same guard: a scoped run resolving to an empty test set is a failure.

**4d. Scoping fails open to everything.** Reuse `selectRoutes`'s philosophy verbatim: anything
unrecognised → full sweep. Over-capturing costs minutes; under-capturing ships an unverified change.

**4e. A loud escape hatch.** `GATES_SKIP=<reason> git push` records the skip and the reason in the
receipt; `receipt-guard` fails on it until MK acknowledges. `--no-verify` stays possible and stays a
policy violation — the receipt is what makes it visible.

**4f. Negative tests, because an unobserved gate is an assumption.** The repo already keeps
`verify-design-lint-structural.mjs` and `verify-registry-integrity-negative.mjs` for this reason. Add,
all wired into `pnpm design:verify`:

- `tooling/verify-gate-receipt-negative.mjs` — the guard must reject a stale tree hash, a missing
  required gate, a `fail` status, a forged contract SHA, a browser-revision mismatch, and an
  unacknowledged skip.
- `tooling/verify-hooks-installed.mjs` — `core.hooksPath` must point at the husky directory and every
  expected hook must exist and be executable. Wired into `pnpm lint`, so a tree with hooks disabled
  fails the gate chain. **Under Option A this is load-bearing:** it is the only thing standing between
  "hooks are installed" and "hooks were assumed".
- `tooling/verify-route-scope.mjs` — a global-surface file must yield `routes === null`; a single
  component file must yield its transitive `registryDependencies` closure and nothing less; and both
  directions of 4g.

**4g. The `contracts.spec.ts` inversion — the one trap in reusing `selectRoutes`.**
`vrt-review.mjs`'s `NON_VISUAL` list contains
`/^apps\/docs\/vrt\/(contract-routes\.generated|…|contracts\.spec)\.ts$/`. Correct for _pixels_
(editing the spec cannot move a pixel) and **exactly backwards for contracts** (editing the spec
changes the assertions; editing the generated route list changes the route set). The shared module
takes per-consumer overrides and `verify-route-scope.mjs` asserts both directions. Getting this
backwards is a silent fail-open.

**4h. The gap Option A accepts, recorded so it is a decision and not an accident.** A component
change can reach `main` having only ever had its **scoped** routes checked, if `/ship` is not run. The
full 768 is a `/ship` gate. `receipt-guard` enforces that the scoped lane ran and covered the changed
routes' dependency closure; nothing enforces the full sweep before merge. Acceptable while `/ship`
precedes every publish and deploy and MK runs both. Revisit when someone else merges component
changes.

---

## 5. What gets built

### 5a. `tooling/lib/route-scope.mjs` — extracted, not invented

Lift `selectRoutes`, `NON_VISUAL`, `GLOBAL_SURFACE`, `routeByName`, and `dependentsByRoute` out of
`vrt-review.mjs` into a shared module taking `{nonVisual, globalSurface}` overrides. `vrt-review.mjs`
becomes a consumer with its existing lists; the contract runner becomes a consumer with 4g applied.
The transitive `registryDependencies` closure already exists and is already proven correct by
`verify-registry-deps.mjs` — reuse it, do not re-derive it.

### 5b. `tooling/contracts-run.mjs` — the scoped contract runner

- `--scope` (default) · `--all` · `--routes a,b` · `--base <ref>`
- Routes computed from merge-base → **working tree**, same as `vrt-review.mjs`.
- **Owns the server.** `turbo run build --filter=@vegastack/docs` (2.9s on a hit, ~1m40 on a real
  miss), then `serve out` on a reserved free port; `playwright.config.ts`'s `webServer` becomes
  conditional on the runner not having supplied one. Freshness comes from turbo's content hash, never
  from "a server was already up" — that is the stale-capture trap the config comments record being
  bitten by twice, and this preserves the guarantee while dropping the cost.
- **Anchored** `--grep` from the route list — `/docs/components/button ` must not match
  `button-group`. Free port reserved and reaped, so two runs never collide and no orphan bricks the
  next one.
- Writes `.gates/contracts.json`: scope decision + reason, routes, executed count, per-test results,
  wall clock. Fails on zero executed.

Measured effect: **1m54s → ~15s** for a one-component change; `--all` keeps the full sweep.

### 5c. `tooling/gates.mjs` — one entry point per tier

`pnpm gates:commit` · `pnpm gates:push` · `pnpm gates:component <name>` · `pnpm gates:ship`.
Each writes `.gates/<gate>.json`, plus `.gates/last-failure.json` on failure; prints a short human
summary then one line addressed to the agent. `.gates/` is gitignored except `receipt.json`.

### 5d. Husky

`husky` + `lint-staged`, `"prepare": "husky"` in the root `package.json`.

- **`pre-commit`** (~3-5s): `design-lint` on staged component sources · `secret-scan` · prettier check
  on staged files · `skill-lint` if `skills/**` staged · `verify-component-contracts` +
  `design:derived:check` if the contract JSON staged · registry stamp freshness if registry sources
  staged · `changelog-lint` if `CHANGELOG.md` staged.
- **`commit-msg`**: conventional-commit prefix check, matching `CLAUDE.md` § Commit Message Format.
- **`pre-push`**: `typecheck` 12s · `turbo run lint` 20s · `@vegastack/ui#test` 16s ·
  `contracts-run --scope` ~15s · `test:smoke` 16s **only when a smoke-selected component changed** ·
  write the receipt.

Measured budget: **~32s** for a non-component change, **~65-80s** for a one-component change. A
global-surface change (tokens, `packages/design`, docs shell) escalates to the full sweep — rare, and
exactly the change class that has earned it.

### 5e. Agent in the loop

Hooks cannot call a model, so the model enters at two defined points.

- **Reports are the interface.** Every gate emits schema'd JSON; `.gates/last-failure.json` carries
  the failing gate, the assertion, `file:line`, and the raw output slice.
- **Claude Code**: `SessionStart` + `UserPromptSubmit` hooks in `.claude/settings.json` inject a
  compact digest of `.gates/last-failure.json` when it is newer than the last acknowledgement — a
  failed push is already in the agent's context on the next turn, no copy-paste.
- **New `gates` skill**, symlinked into both `.claude/skills/` and `.agents/skills/` (which
  `skill-lint.mjs` already fails closed on): reads the reports and classifies each failure — token
  rule violation · real a11y/reflow regression · flake · stale generated file — names the root cause,
  proposes the fix at the root, and **presents facts without self-clearing**, mirroring the discipline
  `references/visual-review.md` already imposes on pixels.
- **`/ship` gains step 0**: `pnpm gates:ship` (full lint chain · `test:all-browsers` 1m39s · full 768
  contracts 13.6min · `verify-consume` · `vrt-review`), then the agent reads every report _and_ the
  before/after images and presents one table — gate · scope · executed · result · root-cause reading —
  then stops for MK. Under Option A `/ship` is the only place the full browser surface is ever
  checked, so this step is mandatory, not optional.
- **`/component` gains the inner loop**: `pnpm gates:component <name>` after each edit — design-lint +
  that component's vitest file + its contract-route closure, ~20-30s, agent interprets.

### 5f. Docs that must move with it

`AGENTS.md` § Verification ladder + § Workflows + § Locked decisions (the visual-verification entry is
superseded and must be rewritten, not appended to) · `CLAUDE.md` · `docs/RELEASING.md` § Where the
jobs run · the `ship`, `component`, and `review` skills · a `docs/ledger/operator-review.md` entry
recording this change, the 5.6→13.6 min correction, the §4 proven/attested table, and the 4h gap.

---

## 6. Phasing

**Phase 0 — free, agent-runnable, ~10 min.** Extend `runner-diagnostics.yml` with a **non-browser**
lane that runs exactly the steps Option A is about to depend on and that no mini has ever executed:
`pnpm build` (both `SITE_VISIBILITY` matrices), `pnpm registry:build` + idempotency, and
`pnpm registry:verify-consume`. `design:verify`/`typecheck`/`lint` are already mini-proven (§1c
Finding 2); these three are not — no `build-curated` job has ever run. Nothing OS-specific is involved
and it passes on this Mac, so the risk is low — but the repo's own doctrine is that an unobserved gate
is an assumption, and this costs nothing to convert into a fact. Self-hosted, therefore free.

**Phase 1 — the build fix and route scoping.** 5a, 5b, `verify-route-scope.mjs`. Pure speed, no
policy change. Verification: a one-route scoped run under 30s; `--all` still 768/768; both negative
scope directions proven; `vrt-review.mjs` unchanged in behaviour after the extraction.

**Phase 2 — husky, gates, and the receipt.** 5c, 5d, 4a, `verify-gate-receipt-negative.mjs`,
`verify-hooks-installed.mjs`. Verification: force each hook to fail and confirm it blocks; forge each
receipt field and confirm `receipt-guard` rejects it; disable `core.hooksPath` and confirm `pnpm lint`
goes red.

**Phase 3 — rewrite the three workflows.** Delete every hosted browser job and every
`playwright install`; re-point `ci.yml` entirely and `release.yml`'s validation to the minis; split out
`package-build` (§3a); add `receipt-guard`; keep and rewire the `visual` classifier; update
`GITHUB_HOSTED_JOBS` and remove the now-dead container assertion with a negative test. Verification:
`verify-workflow-security.mjs` green, then one real PR measured end-to-end against the **0 hosted
minutes** target.

**Phase 4 — agent wiring and docs.** 5e, 5f. Verification: a deliberately broken component reaches the
next agent turn as injected context and is classified correctly; `skill-lint` green on both symlink
sets.

**Phase 5 — optional, separately scoped: fix `focusViaKeyboard`.** It is quadratic in round-trips — it
recomputes `maximumTabs` from every interactive element on the page, including the whole Fumadocs
sidebar, search, and TOC, then Tabs through that chrome to reach each fixture control.
`operator-review.md` names it the largest available speedup and deliberately deferred it. With the
full sweep measured at 13.6 min and now living on developer machines, it is the main remaining cost —
and under Option A it is the cost of the _only_ full browser verification that exists. Its own change,
its own verification: identical executed test count before and after, and it must still catch the
`terminal.tsx` focus defect it was validated against.

---

## 7. Non-goals

- Changing what any assertion _asserts_. Scope, schedule, and location change; the 768 checks, the
  design-lint rule set, and the token vocabulary do not.
- Re-opening any locked decision in `AGENTS.md` § Locked decisions, except the visual-verification
  entry, which this plan supersedes and must rewrite.
- Weakening the outward-step approvals. Every publish, Version-PR merge, and deploy stays MK's
  explicit, separate call.
- Fixing the mini runners' LaunchAgent problem. Out of scope under Option A.
- A third-party remote cache. `turbo.json` already sets `remoteCache.signature`, but a hosted cache
  conflicts with § Third-Party Services; a self-hosted cache on the minis is a later option.

## 8. Risks

| risk                                                                           | mitigation                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The receipt is forgeable, and under Option A nothing re-runs the browser lanes | Stated in writing in three places rather than hidden. `verify-hooks-installed.mjs` makes a disabled-hooks tree fail `pnpm lint`. `/ship` becomes mandatory before any outward step. Required status checks + a second machine are the real answer when the team grows.                                           |
| Turbo cache hit on a stale `out/`                                              | Freshness is turbo's content hash over declared inputs, never "a server was up". `/ship` and `--all` rebuild cold whenever inputs moved.                                                                                                                                                                         |
| Scoping under-captures                                                         | Fail open to full sweep on anything unrecognised; `verify-route-scope.mjs` in both directions; 4g asserted explicitly.                                                                                                                                                                                           |
| A component reaches `main` with only its scoped routes checked                 | Recorded as an accepted gap (4h), bounded by the dependency closure and by `/ship` preceding every publish and deploy.                                                                                                                                                                                           |
| Pre-push slow enough to be bypassed                                            | Measured 32-80s budget; the escape hatch is loud, not invisible. Past ~2 min, Phase 5 is the fix.                                                                                                                                                                                                                |
| Mini capacity — two machines now carry all of CI                               | Measured: the heaviest mini lane is `registry:verify-consume` at **3m45s** and it is single-threaded (`user 220.9s` ≈ `real 224.9s`), so a full mini CI pass is roughly **8-10 min** and two minis absorb it. `concurrency.cancel-in-progress` already sheds superseded pushes. Re-measure on a mini in Phase 0. |
| `main` has no branch protection (`…/branches/main/protection` → 404)           | Pre-existing and recorded; unchanged here, but Option A raises its importance — it is the one repository setting that would convert the attested rows back into enforced ones. MK's to set.                                                                                                                      |
