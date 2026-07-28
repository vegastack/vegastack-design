---
name: review
description: Review or audit work in the vegastack-design repo — run the deterministic gates, triage findings against the design-lint rule set, then adversarially hunt what no gate can see: false coverage claims, fail-open gates, stale generated files, and unverified assumptions. Classify high/medium/low and fix at the root. Use when asked to review, audit, verify compliance, check design-system alignment, hunt bugs, do a second pass, or check work before a release.
---

# Review and audit

**Posture: assume nothing works and try hard to break it.** Do not be charitable. A comment, a plan
doc, a matrix cell, and a previous session's claim are all unverified assertions — run the thing.
Every finding cites `file:line` and demands a ROOT-CAUSE fix, never a surface patch.

Two modes, same skill. **Audit** = the deterministic pass in §2–§4: run the gates, triage what they
report. **Adversarial review** = §5 onward: hunt what the gates structurally cannot see. A pre-release
check does both. If the request was to _report_ rather than to change anything, stop after §7 and
hand over the findings.

To audit a downstream consumer app instead of this repo, use the `vegastack-design-audit` skill —
it has no repo-internal paths.

## 1. Scope the round

State the exact scope before starting, and stick to it:

```bash
git diff main...HEAD --stat        # branch diff — the usual scope
git status --porcelain             # uncommitted work
```

For a full-system round, scope to a named surface set (`packages/*`, `apps/docs`, `tooling/`,
`skills/`, the built registry under `apps/docs/public/r`) rather than "everything", so coverage is
checkable afterwards.

## 2. Run the gates

Never open with a code read. Open by running the gates: a finding the build already catches is not
worth a review slot, and a green claim that is actually red is the most valuable finding available.

```bash
node tooling/design-lint.mjs packages/ui/registry                    # component source, all rules
node tooling/design-lint.mjs --token-css packages/design-tokens/src  # token CSS (!important only)
node tooling/design-lint.mjs --token-css apps/docs/app               # docs app CSS (!important only)
node tooling/verify-operator-docs.mjs                                # current topology claims + negative fixtures
pnpm lint && pnpm typecheck
pnpm gates:ship                                  # the full sweep, including all 108 contract routes
pnpm registry:build && git status --porcelain    # must be idempotent — clean tree after
pnpm design:derived && git status --porcelain    # contract-derived surfaces must be current
pnpm classify                                    # which gates this change REQUIRES, and why
```

`pnpm gates:ship` subsumes the browser lanes. Read `.gates/ship.json` and `.gates/contracts.json`
rather than the exit code — a contracts entry with `status: "skipped"` or `executed: 0` after a
`--all` run is a defect in the runner or the route set, and it looks exactly like a pass.

Any error is a finding. **A gate that passes while its subject is broken is a `high` finding about
the gate.**

`packages/ui/registry` also runs the AST passes (icon-button names, forward-ref, raw interactive
HTML, cursor cues, client boundaries) — these need real TypeScript parsing, not a regex. Both
`--token-css` roots run ONLY the `!important` check; the Tailwind-utility rules would false-positive
on legitimate `oklch()`/custom-property CSS.

`pnpm lint` includes three integrity gates worth knowing by name:

- **`verify-portal-theme-scope`** — discovers every direct Base UI `Portal` and the Sonner engine
  host, compares them to the reviewed inventory, and requires the owning component to call
  `useInternalThemeScope()` and attach it through a `className` inside the host. A missing, added, or
  unscoped portal fails.
- **`sync-toaster-mirror --check`** — the private package Toaster must be byte-identical to the
  canonical registry source after removing only its generated header. Run without `--check` to
  re-mirror after editing canonical.
- **`verify-design-lint-structural`** — proves the AST rules fail on negative fixtures. A green
  design-lint with a silently broken AST pass is exactly what this catches.

## 3. Triage findings

[references/lint-rules.md](references/lint-rules.md) explains every rule, each cited by the exact
`id` `design-lint.mjs` reports. Cite the `id` in every finding. **If the reference and the script
disagree, the script wins** — `tooling/skill-lint.mjs` gates the two against each other, so a
mismatch means the reference needs re-syncing, not that the script is wrong.

## 4. Judgment rules (no lint can catch these)

- **Deprecated usage** — `@deprecated` APIs, and any copy-in below its registry item's current
  `meta.version`.
- **Docs completeness** — a component missing a Fumadocs page, an `AutoTypeTable`, or JSDoc on a
  public prop (which breaks the API Reference table). Section order per the `component` skill §6.
- **Naming-canon drift** — a new synonym prop for an existing semantic axis (a `color` or `status`
  prop where `intent` is established), or a dotted sub-component export (`Foo.Bar` not `FooBar`).
- **Coverage honesty** — a matrix cell or contract record claiming coverage the source lacks.

## 5. Adversarial attack surfaces

Work these in order; each is a distinct failure class, not a checklist to skim.

1. **Does the showcase render the REAL thing?** Hunt mocks, stubs, unstyled renders, broken imports,
   wrong relative paths, missing `@source`, components that never mount. A page that compiles is not
   a page that renders.
2. **Generated-file integrity.** Is every generated surface actually regenerated from its authority,
   or did someone hand-edit a copy?
3. **Claim vs. reality.** Cross-check every count, matrix cell, and coverage claim against the
   machine authority (`packages/ui/component-contracts.json`, `registry.json`). A ✅ that is not
   truly passing is a high finding — this program has shipped several.
4. **Contract compliance.** Every component: all UI states, the knobs contract
   (`className`/`render`/CVA/`data-*`/ref/slots), a11y (keyboard + ARIA + `:focus-visible` + axe),
   JSDoc feeding `AutoTypeTable`.
5. **Fail-closed gates.** Prove each one fails on a negative case. A gate never observed failing is
   an assumption, not a gate.
6. **Security and trust boundaries.** Registry integrity (hash + Sigstore identity pinning), workflow
   permissions, secret handling, the approval topology. Over-broad is a finding even if nothing has
   exploited it.
7. **Edge cases and unhandled failure modes.** Empty, loading, error, partial build, hash mismatch,
   missing token, offline, credential-less.
8. **Contradictions** — between built code and the locked decisions in `AGENTS.md` /
   `docs/requirements.md` §3, or between any two documents. Decide which side is wrong; do not just
   note the mismatch.
9. **Regression pressure.** For each fix landed this round, ask what it could plausibly have broken,
   and check that specifically.
10. **Measurement provenance.** Compare timing/cost claims only inside matching implementation,
    environment, cache/cold, engine, and route/check cohorts. Require sample size and one of measured,
    API-reported, modeled, estimate, or unknown. A mixed cohort or relabeled unknown is a finding.
11. **Workflow terminal states.** An upload/version ID is not a deployment pass. Confirm CI verify
    needs receipt-guard, the no-cache experiment is explicitly enabled and runner-pinned, and
    `deployment-complete` depends on the unskipped external probe with no `always()` or
    `continue-on-error` escape.
12. **Release-state closure.** Force npm timeout/5xx/malformed/wrong-version and all-empty Changesets
    inputs. They must block, while only exact E404 may select `versioned-unpublished`. Confirm
    registry-only `published` skips hosted npm jobs, one-published/one-missing resumes them, retrying
    cannot infer a publish, and the post-publish exact-version readback remains mandatory.

## 6. Registry integrity drift

```bash
vegastack-design check-updates
```

Repository-generated copies carry a line-1 provenance header, but the shadcn CLI removes leading
comments during downstream copy-in — **a missing header in a consumer is normal and never a finding
by itself**. Flag an `update`, a `drift`, an item-fetch `error`, a missing item file, or an ambiguous
target mapping. For **this repository's** generated copies a missing or mismatched header IS a build
violation, because `registry:build` owns those files.

Cross-check `registryDependencies` against actual `@/components/ui/*` imports. A phantom dep
(declared, unused) or a missing one (imported, undeclared — this breaks a downstream `shadcn add`) is
a finding even though the build gate would eventually catch it. Note the gate does **not** check
version ranges, so a wrong pin passes silently.

Surface `shadcn add <comp> --diff` into a scratch dir (read-only) so a maintainer can deliberately
cherry-pick upstream improvements — this system is Model A (own it), with no auto-tracking.

## 7. Verify each finding, then classify

A plausible finding is not a finding. Before it goes in the report:

- Reproduce it, or point at the exact line that makes it true.
- State the concrete failure: what input or state produces what wrong output.
- Try to refute it. If you cannot make it fail, downgrade or drop it.

Severity:

- **high** — broken, insecure, or a false claim of coverage/safety.
- **medium** — a real defect with a workaround, or a gate that cannot catch its own subject.
- **low** — correctness-preserving quality, clarity, or consistency.

Report format: grouped by file, each finding `file:line` · rule id or class · suggested fix ·
severity. **If the task was an audit, stop here — report, never auto-fix.**

## 8. Visual review discipline

Visual verification is split: **behaviour** is a gate (`apps/docs/vrt/contracts.spec.ts`, 864 checks,
no screenshots, no baselines) that runs in `.husky/pre-push` and is attested to CI by
`.gates/receipt.json`; **pixels** are a local review step (`tooling/vrt-review.mjs`, before/after on
one machine, nothing committed).

**Under this topology the receipt is a review target in its own right.** No CI runner executes a
browser, so a review that accepts "CI was green" as evidence the contracts ran has accepted nothing.
Check the receipt actually covers the tree and carries the lanes the change required:

For smoke-trigger changes, mutate a dependency of a selected component (Button is the canonical
specimen) and require smoke. Check the generated Vitest-related comparison; disagreement must widen,
never subtract a registry-reachable test.

```bash
pnpm gates:verify-receipt          # classifies the change itself, then verifies
node -p "const r=require('./.gates/receipt.json'); [r.tree, r.mode, JSON.stringify(r.gates)].join('\\n')"
```

A receipt whose `skips[]` is non-empty is a finding regardless of how the run looks: it means
`GATES_SKIP` was used and a browser lane did not run.

For an unchanged ship→commit→push sequence, inspect `.gates/reuse-plan.json` and the final receipt.
Reuse remains shadow-only, so the push report must still show the complete planned oracle. The
production-full receipt may dominate a later successful weaker change receipt only on the same exact
tree/toolchain/authority; a carried or stale receipt is ineligible. A later failure must remain
visible and must make the retained receipt ineligible for reuse.

For retry changes, force empty, renamed, stale-tree, unknown engine/project/route, and zero-executed
selectors. A valid retry report must be nonempty, `diagnosticOnly: true`, and
`evidenceWritten: false`; hash the original failure and receipt before/after. A retry pass that
removes the original failure, writes evidence, or becomes receipt input is a high finding.

For affected-planner changes, mutation-test prose, workflow, exact unit test, smoke dependency,
single route, foundational reverse closure, `_headers`, one registry graph, global inputs, unknown
paths, deletion, mode, symlink, and every referenced Turbo external tool. The planner is shadow-only:
the current oracle must still run, `.gates/receipt.json` and `.gates/evidence/` must remain unchanged,
and corrupt/partial/conflicting samples must block checkpoint readiness. A push-only observation is
not a checkpoint sample; only a complete `--oracle ship` result may count. Any skip before 30
representative production-full zero-escape samples plus MK approval is high. Any claim that affected or cross-tree
evidence satisfies production-full is high under current policy.

Reviewing a before/after report:

- **Individually review every entry.** N non-unchanged entries is N decisions. Read the before,
  after, AND diff image for each. Never bulk-accept, and never let a reading of an image substitute
  for the pixel count — the count decides what gets looked at, the image decides what it means.
- **A SKIPPED run is not a clean diff.** If the tool captured nothing, say so. Treating "no capture"
  as "no change" is the exact false-coverage claim this section exists to catch.
- **Exit code 2 is an infrastructure failure**, not a pass. A build or server died and no report
  exists. An empty report presented as evidence is a high finding.
- **A `note` field means the capture broke** (navigation error, timeout) — that entry has no visual
  verdict at all and must not be counted as unchanged.
- **Fresh-build requirement.** For the pixel lane `webServer.reuseExistingServer` must stay `false`. A
  reused server has served pre-rewrite pages into a "passing" capture twice in this program's history.
  Flag any config that reuses a server as a correctness risk, not a performance choice.

  The contract lane satisfies the same requirement differently and deliberately:
  `tooling/contracts-run.mjs` sets `PW_EXTERNAL_SERVER=1`, builds through
  `turbo run build --filter=@vegastack/docs`, and serves `out` itself. Freshness therefore comes from
  turbo's content hash over declared inputs rather than from "no server was reused" — which is
  strictly stronger, because it also catches a stale `out/` that a liveness check would happily serve.
  A change that makes the runner skip that build, or trust a running server, is a high finding.

- **All four lanes.** Every route captures desktop light/dark and mobile light/dark. An entry present
  in only one lane means the scope filter dropped the others — investigate rather than assume.
- **No committed screenshot, ever.** `.gitignore` excludes `apps/docs/vrt/*-snapshots/` and
  `.vrt-review/`; `tooling/verify-workflow-security.mjs` rejects any workflow reaching for the
  removed baseline machinery. A PR reintroducing either is a high finding.
- **No skipped visual test.** `tooling/content-lint.mjs` rejects one; also flag prose that still
  describes deferred visual coverage as acceptable.

Reviewing the contract gate:

- It is the only blocking visual-surface gate. Weakening an assertion in `contracts.spec.ts` without
  a recorded reason removes coverage nothing else replaces.
- A gate run that executed zero tests is not passing evidence. Three separate guards enforce that and
  all three must survive an edit: `contracts-run.mjs` fails on a non-empty scope executing nothing, it
  cross-checks its `--grep` against `--list` before running, and `verify-gate-receipt.mjs` rejects a
  receipt whose contracts entry reports pass over zero tests or zero routes.
- **SCOPE is now the highest-risk part of this gate.** A scoped run that selects the wrong routes is
  green and meaningless. The mapping lives in `tooling/lib/route-scope.mjs` and is proven by
  `tooling/verify-route-scope.mjs` — including the one path the two lanes classify OPPOSITELY
  (`contracts.spec.ts` cannot move a pixel, but it IS the contract assertions). Any new entry in
  either lane's `nonVisual` list is a finding until a matching assertion exists: non-visual is tested
  first, so a path in both lists is silently skipped.
- **Whether a lane is REQUIRED at all is `tooling/classify-change.mjs`, and it is executable — run it,
  do not read it.** `pnpm classify` for the working tree, or
  `node tooling/release-classify.mjs [--before <ref>] [--after <ref>]` to extract and run the workflow
  step verbatim. An output the step never set reads as false in an `if:`, which RELAXES a requirement
  rather than failing it — a green log with no coverage. This has happened twice; the headers of both
  scripts record how, and `tooling/verify-classify-change.mjs` now proves both directions against the
  real commits involved.

## 9. Fix at the root

- Fix the cause, not the symptom. If the same class of bug can recur elsewhere, fix the class — a
  lint rule, a generator, a type — not the one instance.
- Record any judgment call in
  [`docs/ledger/operator-review.md`](../../../docs/ledger/operator-review.md): options, choice, why.
- Re-run the gates after every fix. A fix that breaks a gate is a new finding.

## 10. Record the round

Append-only, never rewrite history:

- [`docs/ledger/codex-rounds.md`](../../../docs/ledger/codex-rounds.md) — date, scope, verdict
  (`clean` / `needs-attention (N high · M medium)`), every finding with its resolution, and explicit
  confirmation of which prior-round findings stayed fixed.
- [`docs/ledger/bugs.md`](../../../docs/ledger/bugs.md) — symptom, root cause, systemic fix. Write
  the root cause so the CLASS is recognizable next time, not just the instance.

## 11. Loop

Repeat until a full round returns **0 high · 0 medium** with no prior finding re-raised. A round that
finds nothing is only credible if the previous round found something and the scope did not shrink —
if both rounds are empty, widen the scope or change the attack angle rather than declaring victory.

For a genuinely independent read, delegate a round to Codex via the `codex:rescue` skill and treat
its findings the same way: verify each against source before accepting it. Cross-model rounds have
surfaced findings same-model rounds missed, and have also produced confident false positives — §7
applies to delegated findings too.
