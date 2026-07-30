---
name: gates
description: Read and act on the local verification gates in the vegastack-design repo — interpret a failed pre-commit or pre-push run, classify each failure at its root cause, and explain what the gate receipt means. Use when a git hook blocked a commit or push, when .gates/last-failure.json exists, when asked why CI rejected a receipt, or when asked to run the gate ladder before shipping.
---

# Interpret the gate ladder

The gates are programmatic; the interpretation is yours. Every gate writes structured JSON precisely
so that you can say **what** broke and **why**, instead of handing a developer raw output.

**Never self-clear a failure.** Classify it, fix the root cause, re-run. If a failure looks
environmental, say so with the evidence and let MK decide — the same discipline
`skills/internal/ship/references/visual-review.md` imposes on pixels.

## 1. Read the reports first

```bash
cat .gates/last-failure.json      # the failing gate, its assertion, file:line, raw output slice
ls .gates/                        # latest mode/contract reports · runs/ · receipt.json
pnpm gates:benchmarks             # p50/p95, separated by compatible measurement cohort
```

`.gates/last-failure.json` exists only while a run is failing; a passing run deletes it. Its
`reports` array lists the per-gate JSON worth opening next. Read the report, not just the exit code.
Every run also has immutable segment reports under `.gates/runs/<run-id>/`, including `total` and
`docs-warmup`. Treat `measurementClass`, cache/cold state, scope, sample size, and environment as part
of the result. `unknown` is honest; never relabel it measured or combine differing generations or
route/check counts to improve a percentile. Measurement reports are diagnostics, never receipts.

For `vitest-smoke.json` and `vitest-all-browsers.json`, inspect `runtimeExclusions` as well as
`results`. The only approved runtime exclusions are five exact Firefox Dropzone paste leaves under
the source-bound `synthetic-clipboard-files` capability. Each direct top-level registration must be
accounted for exactly once: reporter-excluded, or independently listed and passed when the engine
gains the capability. Absence from both is a gate failure, so an empty `runtimeExclusions` manifest
alone is never proof of recovery. The set may never be replaced or expanded. Any other reporter-only
skip, `test.skip` / `skipIf`, wrong file/engine/name, stale manifest, or pre-listed required leaf that
skips is a gate failure—not a smaller required universe.

## 2. Classify every failure before fixing anything

Four categories, and they need different responses. Getting the category wrong wastes the fix.

| Category                   | How it looks                                                                                                                       | What to do                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Token / rule violation** | `design-lint` names a rule and a `file:line`                                                                                       | Fix at the source. The rule vocabulary is `skills/internal/review/references/lint-rules.md`; never widen a rule to pass.                    |
| **Real regression**        | a contract assertion fails with measured numbers — a control under 24×24, `scrollWidth > clientWidth` at 320px, no focus indicator | Fix the component. The numbers in the message are the specification.                                                                        |
| **Stale generated file**   | `design:derived:check`, `sync-changelog --check`, or the registry idempotency step reports drift                                   | Regenerate through the authority (`pnpm design:derived`, `pnpm registry:build`) and commit the output. Never hand-edit a generated file.    |
| **Blocked release state**  | `release-state` reports `registry-unknown`, `changesets-all-empty`, `changesets-invalid`, or `workflow-diff-conflict`              | Read `.gates/release-state.json`; restore authoritative lookup or repair/split the input. Never reinterpret unknown as unpublished.         |
| **Flake**                  | passes on re-run with no change; timing or animation wording in the message                                                        | Say it is a flake AND why you believe that. Do not retry silently — a flake that is really a race will come back on someone else's machine. |

## 3. The contract lane, specifically

`.gates/contracts.json` carries the scope decision, not just the result. Read `scope.reason` before
`results` — a green run over the wrong routes is the failure mode this whole design guards against.

```bash
node -p "const r=require('./.gates/contracts.json'); [r.status, r.scope.reason, r.scope.routes.length+' routes', r.executed+' executed'].join(' · ')"
```

- `status: "skipped"` means **no contract surface changed**. Report it as skipped. It is not evidence
  that the contracts pass.
- `status: "no-evidence"` means a non-empty scope executed zero tests. That is a defect in the scope
  or the spec, never a pass.
- A failure lists `failures[]` with `title`, `project`, and the assertion message. The project name
  matters: a failure only in `mobile-chromium` is a narrow-viewport problem, only in `*-dark` is a
  token problem.

Re-run one route while iterating:

```bash
node tooling/contracts-run.mjs --routes /docs/components/<name>
```

## 4. Explain the receipt honestly when asked

`.gates/receipt.json` binds the browser lanes to a tree hash. It is **attestation, not proof** —
`--no-verify`, or `HUSKY=0`, plus a hand-edited JSON defeats it. Its value is that skipping a browser
gate becomes visible and auditable instead of silent. Say that plainly; a receipt read as proof is
worse than no receipt.

Schema 2 receipts have an explicit `change` or `production-full` profile plus a canonical
`evidence.leaves[]` manifest. Inspect `requiredUniverse`, `executedOnTree`, and `coverageRoot`; the
root summarizes the leaves and never replaces them. Deploy requires production-full unit/axe,
three-engine smoke, complete all-browsers, and exactly 108 routes / 864 contracts.

Smoke impact is dependency-aware. `tooling/lib/smoke-scope.mjs` follows the verified registry import
closure, while `packages/ui/smoke-impact.generated.json` records Vitest's related-test comparison.
Any stale/missing/unknown/disagreeing selector state widens; never restore exact-file-only triggering.

`pnpm gates:plan` is the read-only explanation surface for the dynamic planner. It reports each lane
as `not-reached` or `safely-skipped` with a machine reason and selector digest; `unknown` cannot pass.
Operational prose may have no product impact, but a docs/path label is never sufficient evidence:
rendered MDX, previews, generated authorities, tokens, CSS/fonts, provider/theme, app shell,
dependencies, toolchain/config, metadata, and unknown inputs select work or widen to full. For a
canonical component, union verified registry dependencies with the actual import/re-export/literal
dynamic-import graph and include every reachable dependent component, test, route, preview, and
consumer. Computed/unresolved imports and registry/import/Vitest/route disagreement widen; never use
the smaller set. Exact selected Vitest and contract commands are diagnostic-only and reconcile
planned, listed, and executed nonempty leaves. They write no receipt evidence.
`skills/internal/**` is operational prose. `skills/public/**` and its generated
`packages/design/skills/**` mirror are shipped but non-rendered package inputs: the planner may skip
component/browser/contract/VRT lanes, but it must retain skill-mirror, package-export, and
`@vegastack/design` build checks.

`gates:push` also writes `.gates/reuse-plan.json`. Exact-tree production-full reuse is currently
**shadow-only**: `decision: would-reuse` is an observation, not permission to skip. The full push
oracle still runs. A later weaker successful receipt cannot overwrite stronger exact-tree evidence;
a later failure is annotated onto it so stale success cannot erase the failure. Carried, stale,
wrong-toolchain, wrong-authority, malformed, or partial receipts always execute.

When `retryTargets` is nonempty in `.gates/last-failure.json`, `pnpm gates:retry` reruns each exact
file/engine/full-test-name or route/project/full-title selector. It rejects stale trees, missing or
renamed files, empty selectors, and unknown engines/projects/routes before execution. The result is
written to `.gates/retry-report.json` with `diagnosticOnly: true` and `evidenceWritten: false`.
Even a pass must leave the original failure, receipt, and `.gates/evidence/` byte-identical. It tells
you whether the specimen still reproduces; it never clears the gate or advances shipping evidence.

After fixing the root cause, `pnpm gates:affected` computes the full invalidated impact cone and
retains `.gates/diagnostics/affected/summary.json`, then executes the unchanged push oracle without
writing a receipt. This default is an observation only. The only sample-producing form is
`pnpm gates:affected:checkpoint -- --scenario <name>`; the explicit controlled scenario is required
before the complete ship oracle starts. Its report must retain `rollout.enabled: false`,
`checkpointEligible`, an exact `cohort`, structured `selectedExecution`, and the unchanged full
`oracle`, while receipt/evidence bytes stay identical. The status summary retains
`reuseEnabled: false`. Unknown, unmodeled, metadata, stale graph, authority disagreement, and
gate-definition inputs widen full. The proposed
Turbo external-input fingerprints are observations beside the current blanket `tooling/**` hashes;
they are not cache keys. `pnpm gates:affected:status` remains disabled until 30 representative
production-full zero-escape samples cover every required scenario, and a ready result still requires
MK approval. The current authority set has no agreeing greater-than-six-route foundation fixture, so
the checkpoint is machine-blocked until that authority gap or policy is separately resolved; never
substitute synthetic samples. Never use affected evidence for deploy: production requires a complete
exact-tree ship proof.

Dynamic pre-push execution is still disabled. A shadow-selected pass does not let `gates:push` omit
its current oracle, and a `safely-skipped` plan does not satisfy `production-full`. Activation still
requires the recorded 30 representative complete-oracle samples and separate MK approval; final
ship composition remains the independent D7 decision.

The ordinary `gates:push` contract lane still uses the established `route-scope` selection. The
common impact planner currently controls diagnostic/component/VRT selection and affected comparison,
not production or pre-push omission. If its registry/import oracle disagrees with route scope, the
shadow plan widens full and records the mismatch; it does not silently replace the live push oracle.

`verify-shadcn-consume.mjs` supports `diagnostic`, `affected`, and `full`. Each selected real and
simulated root gets a fresh consumer, an independently checked output manifest, post-write
verification, and typecheck. Full mode also runs the consolidated complete-registry oracle in both
layouts so target collisions and whole-layout compilation remain visible. Selected mode reports say
`evidenceReusable: false`, `receiptWritten: false`, and `ciFullOracleRequired: true`. D1 remains open,
so CI, Release, and `gates:ship` still execute the full oracle; use the affected command only to
localize a failure.

Common CI rejections and what each actually means:

| `verify-gate-receipt` says                                      | Cause                                                       | Fix                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| produced against tree X but this tree is Y                      | code changed after the gates ran                            | `pnpm gates:push`, commit the receipt                             |
| requires the `contracts` gate and the receipt does not carry it | the change touched a contract surface the local run skipped | re-run `pnpm gates:push` on the current tree                      |
| ran against @playwright/test A but this tree pins B             | gates ran on a stale install                                | `pnpm install`, re-run                                            |
| reports pass but executed 0 tests                               | an empty scope reported as green                            | investigate the scope; do not re-run hoping it changes            |
| was deliberately skipped … needs MK acknowledgement             | `GATES_SKIP` was used                                       | MK's call, not yours. Present the reason recorded in the receipt. |
| carry refuses an untracked or metadata-only path                | the version exemption cannot independently inspect it       | remove unintended work or run the gates on the complete tree      |

## 5. Running the ladder

```bash
pnpm gates:commit                 # ~3s   static gates, staged files
pnpm gates:push                   # ~35-80s  + unit · smoke · scoped contracts, writes the receipt
pnpm gates:retry                  # exact failing selectors; diagnostic only, writes no evidence
pnpm gates:plan                   # read-only lane/dependency explanation; shadow only
pnpm gates:affected               # post-fix shadow cone + current push oracle; no reuse/evidence
pnpm gates:affected:status        # checkpoint report; never enables reuse
pnpm gates:component <name>       # the inner loop while building one component
pnpm gates:ship                   # the full sweep — /ship requires it
```

`--verbose` streams each gate instead of capturing it. Use it when a gate hangs; the captured form is
better for everything else because it keeps a green ladder to four lines.

## 6. The ordering that matters

**Run the gates BEFORE committing, then commit the code and `.gates/receipt.json` together.**

That works because `.gates/` is excluded from the tree hash the receipt binds to — so adding the
receipt to the commit cannot invalidate the receipt it wrote. Commit FIRST and the receipt in `HEAD`
describes the _previous_ tree, and every workflow's `receipt-guard` rejects the push.

`gates push` checks this itself and refuses the push with the exact fix, so the mistake costs
seconds rather than a red CI run eight minutes later. If you see it:

```bash
git add .gates/receipt.json && git commit --amend --no-edit && git push
```

The gates already passed at that point — only the record was missing from the commit.
