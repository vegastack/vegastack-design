# Dynamic dependency-aware verification and ship plan

**Date:** 2026-07-29  
**Status:** approved 2026-07-30; local/shadow implementation in progress, activation blocked  
**Branch reviewed:** `codex/cicd-release-efficiency`  
**Reviewed tree:** `e4496b2b097f03fa0e03029f87ecd41674868235`  
**Supersession:** this plan extends, but does not replace, the locked production-evidence decisions
in `2026-07-28-cicd-release-efficiency-audit.md`. Where the two differ, the older plan's D1-D7 and
exact-final-tree `production-full` requirements remain authoritative until MK changes them.

## Summary and recommendation

The proposed idea is good and materially more efficient after one safety correction:

- Operational prose such as plans, append-only ledgers, maintainer skills, and root instructions can
  skip component unit, browser, contract, consume, and VRT work during iteration when machine
  classification proves that no executable or rendered authority changed.
- Rendered documentation is not operational prose. MDX, previews, generated docs copies, tokens,
  global CSS, fonts, providers, the docs shell, build configuration, dependencies, and toolchain can
  change pixels or runtime behavior and must select their reachable product surface.
- A canonical component change must select the component and every reachable dependent component,
  test, route, registry item, preview, and consumer. A shared or foundational change may correctly
  expand to most or all of the system.
- Registry/import closure, Vitest-related selection, route authority, and task hashes are independent
  signals. Agreement may select their union; missing data or any disagreement widens to full.
- This can safely reduce inner-loop and pre-push duplication. It cannot yet replace final
  `pnpm gates:ship`: production policy requires a complete exact-final-tree browser and contract
  proof. Allowing a docs-only or component-scoped final ship would be cross-tree/compositional
  production evidence and therefore requires D7, its evidence checkpoint, and separate MK approval.

Recommendation: implement the common impact planner and selected local runners in shadow, collect
the required full-oracle comparison evidence, then ask MK separately to enable dynamic pre-push.
Keep production `/ship`, Release, and deploy receipt acceptance unchanged. The `/ship` skill itself
can become clearer immediately: show the machine decision, skip VRT when the pixel planner proves an
empty surface, present changed screenshots in plain language, and still run the final full proof.

## Scope and non-goals

### In scope after this plan is approved

- One fail-closed change inventory and impact-plan schema shared by component diagnostics, selected
  contract diagnostics, VRT selection, affected shadow comparison, and operator output. Ordinary
  `gates:push` intentionally retains the legacy `route-scope` contract oracle until dynamic
  pre-push activation is separately approved; it never consumes a shadow plan to omit work.
- Complete reverse dependency closure for canonical registry items, copy-in mirrors, previews,
  rendered docs routes, browser tests, contract routes, blocks, and isolated consume roots.
- An independent Vitest-related oracle and explicit treatment of dynamic imports, barrels, aliases,
  shared utilities, package exports, configuration, and generated authorities.
- Exact selected-test execution with list-before-run and nonzero planned/listed/executed checks.
- Structured lane states and measurement fields.
- Negative/mutation coverage for every narrowing rule.
- Shadow-first rollout, zero-escape samples, and explicit activation checkpoints.
- Consistent current instructions for Codex and Claude, including understandable VRT handoff.

### Explicitly out of scope without later approval

- No weaker or scoped receipt may satisfy deploy.
- No cross-tree carry beyond the existing independently reconstructed pure-version-bump carry.
- No production browser/contract leaf may be skipped or executed on another tree.
- No selected consume result replaces the full oracle while D1 is open.
- No task-specific Turbo inputs replace `globalDependencies: ["tooling/**"]` until their independent
  input inventory and mutation checkpoint pass.
- No exact-tree reuse, affected reuse, candidate reuse, hosted-runner change, or cache-canary
  activation is inferred from approval of this plan.
- No push, publication, Version PR merge, deploy dispatch, repository setting, Cloudflare change, or
  runner-host change.

## Current execution graph and retained invariants

```text
working-tree inventory (tracked + staged + unstaged + untracked + metadata)
              |
              +--> classify-change --> push lane booleans
              |                         unit and smoke execute broad suites today
              |                         contracts already use route closure
              |
              +--> route-scope -------> contract routes / VRT fixture + page routes
              |                         unknown => full; remains the ordinary push contract oracle
              |
              +--> smoke-scope -------> registry dependency model U Vitest-related shadow
              |                         stale/disagreement => full smoke
              |
              +--> gate-impact -------> shadow unit/smoke/all-browser/contracts/consume/Turbo plan
                                        gates:affected compares it with unchanged push/ship oracle

gates:ship --> full typecheck/lint/unit/smoke/all browsers/registry/consume/108 routes/864 contracts
           --> schema-2 production-full receipt bound to exact tree/config/toolchain/authorities
           --> VRT review remains a separate human decision

CI/Release --> receipt guard + independent non-browser rerun
deploy     --> production-full receipt only + mandatory exact-tree rebuild + sign/probe/complete
```

The implementation must preserve these invariants:

1. Selection is a scheduling optimization, never the trust root.
2. Unknown, malformed, stale, deleted, renamed, binary, symlink, mode-only, untracked, or unmodeled
   input widens; it never disappears.
3. The selected set is the union of independent authorities. Disagreement widens to full rather
   than choosing the smaller answer.
4. Planned nonempty work that lists or executes zero tests/routes is a failure.
5. Retry is diagnostic-only and never writes evidence.
6. Scoped evidence cannot overwrite or dominate a same-tree `production-full` receipt.
7. Production-full leaves remain complete, exact-tree, and canonical: unit/axe; smoke in Chromium,
   Firefox, and WebKit; complete browsers in all three engines; 108 routes and 864 contracts.
8. A result is one of `executed/pass`, `executed/fail`, `safely-skipped`, `not-reached`, or `unknown`.
   `safely-skipped` requires a machine reason and selector/input digest; `unknown` cannot pass.
9. VRT differences remain a human decision. The agent explains visible effects in short bullets and
   links every available status-appropriate artifact: changed has Before/After/Difference, new has
   After, removed has Before, and broken has no verdict until rerun.
10. “Common planner” means one diagnostic selection schema, not current gate activation. Until the
    pre-push checkpoint is approved, ordinary `gates:push` contracts continue to use `route-scope`;
    disagreement in `gate-impact` widens the affected diagnostic and cannot narrow that oracle.

## Fail-closed change taxonomy

Path names are an input to classification, not proof. Each row also requires current file facts,
change kind, authority membership, and graph reconstruction.

| Change class                         | Examples                                                                                       | Minimum local impact                                                                     | Widening rule                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Operational prose                    | `docs/plans/*.md`, ledgers, `README.md`, `AGENTS.md`, internal skills                          | formatting, links/skill/operator-doc semantics; no product lanes                         | Any rendered import/generation edge makes it rendered docs or unknown              |
| Workflow/release/hook prose and code | `.github/**`, `.husky/**`, release/gate CLI help                                               | workflow security, hook/CLI/operator mutations                                           | Gate implementation changes invalidate every lane the implementation can influence |
| Rendered docs content                | `apps/docs/content/**/*.mdx`                                                                   | docs build/content/link checks; own page VRT; component fixture contract when applicable | Shared MDX provider/plugin/layout change is global rendered surface                |
| Preview/fixture                      | `apps/docs/components/preview/<name>.tsx`                                                      | own component + dependent route closure, docs build, selected contracts/VRT              | Unmapped preview is full, not skipped                                              |
| Canonical component/hook/block       | `packages/ui/registry/{ui,blocks}/**`                                                          | reverse dependent unit/all-browser/contract/VRT/consume closure; smoke union             | Missing ownership/import edge, dynamic path, or graph disagreement is full         |
| Generated component/registry output  | docs copy-ins, `public/r/*.json`, generated manifests                                          | verify authority/idempotency; map back to owner; consume impact                          | Orphaned/manual/stale output is a hard failure or full, never trusted as source    |
| Shared visual/runtime foundation     | tokens, global CSS, fonts, provider/theme, app shell, preview utilities, public design runtime | full rendered/browser/contract/VRT surface and relevant builds                           | Always full until a proven finer authority exists                                  |
| Registry/contract authority          | `registry.json`, `component-contracts.json`, generated route/smoke manifests                   | authority reconciliation, registry integrity, full affected lanes conservatively         | Pure version-only exemption remains the one independently reconstructed exception  |
| Toolchain/config/dependency          | lockfile, package manifests, Vitest/Playwright/Next/Turbo/TS config                            | every lane whose runtime/hash/config may change                                          | Missing transitive/config/environment input is full                                |
| Test-only                            | exact unit/smoke/contract assertion file                                                       | exact test plus required engine(s); assertion authority changes never skip itself        | Rename/stale selector/zero list is failure; shared setup/config is full            |
| Metadata or unknown                  | mode, symlink, binary, deletion, rename, untracked, unknown directory                          | full impact cone, usually all product lanes                                              | Narrow only after an explicit modeled authority and negative proof are added       |

## Lane decision table

`Selected` always means changed targets plus all reachable dependents and the union of independent
oracles. This table governs iteration/pre-push and shadow planning only; final production remains the
last row.

| Proven change class                           | Static/lint/type                | Unit + axe                                       | Smoke                    | Complete browsers    | Contracts                      | VRT                           | Registry/consume            | Builds                 |
| --------------------------------------------- | ------------------------------- | ------------------------------------------------ | ------------------------ | -------------------- | ------------------------------ | ----------------------------- | --------------------------- | ---------------------- |
| Operational prose only                        | selected doc/skill checks       | safely skipped                                   | safely skipped           | safely skipped       | safely skipped                 | safely skipped                | safely skipped              | safely skipped         |
| Workflow/hook/release only                    | workflow + mutation checks      | skipped unless gate code affects it              | same                     | same                 | same                           | same                          | relevant release checks     | safely skipped         |
| Non-component rendered MDX                    | content/link/type + docs        | skipped if no imported product edge              | skipped if proven        | skipped if proven    | skipped                        | own full page                 | skipped                     | docs build             |
| Component MDX/preview                         | content/type + docs             | selected if fixture imports/behavior changed     | selected on risk closure | shadow-selected only | own route + reached dependents | own page/fixture + dependents | selected shadow             | docs build             |
| Leaf component/test                           | component + package lint/type   | selected                                         | selected risk union      | shadow-selected      | selected routes                | selected routes               | selected shadow             | affected tasks         |
| Foundational/shared visual                    | full relevant                   | full                                             | full                     | full                 | full                           | full                          | full where applicable       | full relevant          |
| Registry-only generated bytes                 | authority/idempotency/integrity | skipped if exact rederivation proves non-runtime | same                     | same                 | same                           | no pixel work                 | selected/full per authority | affected registry/docs |
| Toolchain/config/global/unknown/metadata      | full relevant                   | full                                             | full                     | full                 | full                           | full                          | full                        | full relevant          |
| Final production `/ship` under current policy | full                            | **full**                                         | **full**                 | **full**             | **full 864**                   | affected human review         | **full**                    | full relevant          |

Notes:

- Complete-browser selection is useful for diagnostics and shadow comparison, but pre-push currently
  does not run that lane and production runs it in full. Do not silently add expensive work to push.
- VRT already scopes by route. The change is to make the reason and evidence explicit and keep its
  classification synchronized with the common planner.
- Consume remains `selected-shadow`/diagnostic until D1. CI, Release, and ship stay full.
- Typecheck and lint may remain broader than component tests where compiler/plugin/package graphs do
  not provide a complete safe selector. Do not trade correctness for a cosmetically dynamic label.

## Dependency closure and independent oracle

### Canonical product graph

Build a versioned, canonical impact manifest from:

1. `component-contracts.json`: item identity, source/test files, docs route, coverage profile.
2. `registry.json`: item files, declared registry dependencies, package dependencies, item type.
3. TypeScript AST import/export graph over canonical sources, previews, shared utilities, barrels,
   re-exports, aliases, literal dynamic imports, and literal `require` calls.
4. Generated-copy ownership: canonical source -> docs copy-in -> registry JSON; drift fails before
   scheduling.
5. Docs graph: component MDX -> preview -> registry item; non-component MDX -> rendered route; shared
   layout/provider/plugin/style inputs -> all rendered routes.
6. Contract/VRT route authorities and block/full-page relationships.
7. Package graph, exports, lockfile, toolchain/config, environment profile, and relevant Turbo task
   graph.

Compute forward dependencies and reverse dependents. For a changed node, traverse reverse edges to
every consumer. Keep canonical sorted leaves and a content/type/mode/symlink-bound manifest digest.
String-computed dynamic imports, unresolved aliases, missing files, duplicate ownership, cycles that
cannot be normalized, and imports outside the modeled roots produce `full` with an explicit reason.

### Independent comparison

- Ask Vitest 4.1.9 for related test specifications for the changed sources. Official behavior follows
  static imports but not computed dynamic paths, so it is an oracle, not the sole authority.
- Compare Vitest's set with the canonical registry/import graph. Use the union when both are current;
  widen to full on missing, stale, or disagreeing results until the disagreement is understood and a
  mutation is added.
- Compare contract and VRT route sets with their independent route authority.
- Use Turbo 2.10.5 `--dry=json`/summaries only to explain task selection and hash inputs. Turbo
  package/task graphs do not prove component/browser closure, and task `inputs` remain shadow because
  specifying them opts out of defaults unless `$TURBO_DEFAULT$` is restored.

### Selected execution protocol

1. Freeze the tree identity and change inventory.
2. Write a plan containing changed file facts, graph versions/digests, reasons, required and selected
   leaves, widening events, and expected counts.
3. List exact Vitest/Playwright tests before execution. Prefer explicit files/projects/test lists over
   ambiguous substring filters; anchor any unavoidable regex.
4. Fail if planned count, listed count, or executed count is zero for a required lane, or if listed
   leaves differ from the plan.
5. Execute on the same tree and environment profile.
6. Write results atomically with exact executed leaves and durations.
7. Recheck tree/authority/config digests. A change during execution makes the result unknown and it
   is not evidence.

## Structured plan and result contract

The machine report should include at least:

- schema and planner generation;
- exact tree and change-inventory digest;
- file path, old/new type, mode, symlink target/content digest, and change kind;
- authority, import-graph, route, test-manifest, toolchain, config, lockfile, and environment digests;
- per lane: state, reason code, mode (`none`, `selected`, `full`), required leaves, selected leaves,
  listed leaves, executed leaves, and missing/extra leaves;
- oracle sets and disagreements;
- selector overhead, execution wall time, summed child time where available, cache state, CPU/RSS
  where measured, and closure size;
- evidence eligibility (`diagnostic`, `change`, or `production-full`) and why;
- terminal state: `executed/pass`, `executed/fail`, `safely-skipped`, `not-reached`, or `unknown`.

Reports with corrupt JSON, unsupported schema, duplicate conflicting keys, partial writes, absent
terminal states, stale digests, or unexplained `skipped` fail. Selected reports are never promoted to
production-full by relabeling.

## Negative and mutation matrix

Add the mutation first, force its intended failure, then implement the narrowing rule.

| Mutation                                                            | Required result/reason                                               |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Operational `.md` only                                              | product lanes safely skipped with machine reason                     |
| Rendered guide/component MDX mislabeled as prose                    | docs/VRT/fixture impact selected; mutation rejecting broad docs skip |
| Canonical leaf component                                            | own and every reverse dependent test/route/item selected             |
| Foundational Button/provider/token/global CSS/font/app-shell change | complete reachable closure, full when global                         |
| Barrel or re-export added/removed                                   | dependent closure changes; stale graph rejected                      |
| Literal dynamic import/require                                      | edge modeled by AST                                                  |
| Computed dynamic import                                             | full with unmodeled-dynamic reason                                   |
| Alias change or unresolved alias                                    | full until resolver/config authority agrees                          |
| Relative shared utility imported by multiple components             | every importing component and dependent selected                     |
| Generated docs copy edited directly                                 | authority/idempotency failure; no narrow pass                        |
| Registry/contract/smoke manifest stale                              | hard failure or full; never trust stale set                          |
| Deletion or rename                                                  | old and new ownership considered; unknown side widens                |
| File mode, symlink target/type, binary, untracked file              | metadata/full widening with exact reason                             |
| Mixed safe prose plus unknown/global file                           | global/full wins                                                     |
| Lockfile/package/toolchain/config mutation                          | all influenced lanes full                                            |
| Registry graph disagreement with source imports                     | registry verification fails and selection widens                     |
| Vitest-related disagreement/missing/stale output                    | selected set cannot narrow; full lane                                |
| Turbo omitted external data/config/dynamic input                    | mutation changes behavior without hash -> activation blocked         |
| Empty selected test files/routes                                    | fail before execution                                                |
| Selector lists tests but executes zero                              | fail; no pass-with-no-tests                                          |
| Stale or renamed exact target                                       | fail with stale-selector reason                                      |
| Malformed/partial structured report                                 | terminal unknown/fail                                                |
| Retry passes after original failure                                 | diagnostic only; original failure/evidence unchanged                 |
| Scoped result attempts to overwrite full receipt                    | stronger receipt remains; overwrite rejected                         |
| Change occurs during plan/run                                       | tree mismatch -> unknown, rerun required                             |
| Planner says nonvisual but VRT/route oracle says visual             | union/widen and record disagreement                                  |
| Candidate selected plan omits an oracle failure                     | count as escape; checkpoint not ready                                |

Existing classifier, route-scope, smoke-scope, receipt/profile, retry, consume, and affected negative
suites remain mandatory. New fixtures must not weaken their public CLI interfaces.

## Implementation stages, files, flags, and rollback

Each stage is a separate commit and rollback surface. Approval of this plan authorizes local
implementation and tests only; activation checkpoints remain separate.

### Stage 1 — common impact schema and semantic documentation fixtures

**Invariant:** every current surface describes the same taxonomy and production boundary.

Add negative operator fixtures for: blanket docs/non-component skip, rendered MDX skipped, component
checked without dependents, unknown path skipped, disagreement choosing the smaller set, a skipped
lane without machine reason, scoped evidence accepted as production-full, and pixel-only visual
handoff without plain-language/image paths.

Files:

- `tooling/verify-operator-docs.mjs`
- `AGENTS.md`, `README.md`, `docs/README.md`, `docs/RELEASING.md`
- `skills/internal/ship/SKILL.md` and `references/visual-review.md`
- `skills/internal/gates/SKILL.md`, `skills/internal/review/SKILL.md`
- applicable active local-first/boundary runbooks
- `.husky/pre-push` output and package script descriptions if command wording changes

The `.agents/skills/*` and `.claude/skills/*` paths are symlinks to canonical internal skills and are
verified, not edited. No public/package skill mirror changes unless public consumer instructions
actually change.

Rollback: revert documentation/verifier commit; no execution behavior changed.

### Stage 2 — canonical dependency manifest and independent oracle

**Invariant:** no selected execution exists without independently reconstructable graph leaves.

Likely files:

- new `tooling/lib/change-impact.mjs` or a disciplined extraction from `gate-impact.mjs` as the one
  shared planner authority;
- new `tooling/lib/import-closure.mjs` and verifier;
- `tooling/lib/gate-impact.mjs`, `route-scope.mjs`, `smoke-scope.mjs`, `consume-plan.mjs`;
- `tooling/verify-registry-deps.mjs` for alias/barrel/shared-import authority where appropriate;
- `tooling/sync-smoke-impact.mjs` and a generated canonical impact manifest under `packages/ui/`;
- `tooling/verify-gate-impact.mjs`, `verify-route-scope.mjs`, `verify-smoke-scope.mjs`, plus a new
  import/impact negative suite;
- `package.json` scripts and `design:derived` ownership if a generated manifest is introduced.

Flag/state: `shadowOnly: true`, `executionEnabled: false`, `productionEligible: false`.

Rollback: delete the generated manifest/new planner and restore existing shadow planner. Current
push/ship behavior remains unchanged.

### Stage 3 — exact selected runner and structured outcomes

**Invariant:** a selected pass proves the exact planned nonempty leaves ran on the same tree.

Files:

- `tooling/vitest-run.mjs` and `vitest-structured-reporter.mjs` for repeated/exact file selectors,
  pre-listing, engine leaves, planned/listed/executed reconciliation, and atomic reports;
- `tooling/contracts-run.mjs` for plan digest/result reconciliation without bypassing its server/port
  ownership;
- `tooling/vrt-review.mjs` for common-plan reason/digest output while preserving affected capture;
- `tooling/gates.mjs` for a plan-only or shadow-selected execution path;
- runner/retry/workflow-security negative suites for empty/stale/malformed selectors and reports.

Playwright's supported `--test-list`/`--project`/reporter facilities may replace fragile grep where
they fit the installed 1.61.0 behavior; contracts still go through `contracts-run.mjs`.

Flag/state: selectable runner available only through diagnostic/shadow commands. It writes no
receipt and cannot replace a gate result.

Rollback: remove selected runner entry point; full runners remain unchanged.

### Stage 4 — shadow comparison and measurement

**Invariant:** savings are never accepted without a same-tree full oracle and zero escapes.

Files:

- `tooling/gates-affected.mjs`, `summarize-affected-shadow.mjs`, measurement helpers;
- immutable samples and summaries below `.gates/diagnostics/affected/**`;
- benchmark/status CLI help and operator docs;
- append-only `docs/ledger/bugs.md`, `operator-review.md`, `codex-rounds.md`.

For each required scenario—prose, workflow, unit failure, smoke failure, one route, foundational
component, header policy, registry graph, global input—retain selector overhead, closure and executed
counts, selected wall time, full-oracle wall time, widening, and escapes. A push oracle is useful
diagnostic data but does not count toward the existing 30 production-full sample checkpoint.

Flag/state: shadow only. Readiness requires at least 30 representative production-full samples, all
scenarios, zero escapes, no invalid/duplicate-conflicting/partial samples. Readiness prints “ask MK”
and never self-enables.
The current authority has no agreeing greater-than-six-route foundation fixture, so this cohort is
machine-blocked at 0/30. Do not collect qualifying checkpoint samples until MK separately resolves
that authority/policy blocker; synthetic or substitute samples never count.

Rollback: remove shadow sampling; production and hooks are unchanged.

### Stage 5 — dynamic pre-push activation (blocked pending checkpoint and MK)

**Invariant:** pre-push executes every current-tree affected leaf; a selector never creates a green
gap.

Potential files after approval:

- `tooling/gates.mjs` and `.husky/pre-push`;
- `tooling/classify-change.mjs` only to consume the shared plan, not as the trust root;
- `package.json`, gates/ship/review docs, CLI help, and operator verifier;
- receipt generation/verification tests to preserve monotonic strength and exact bindings.

Activation must be one explicit flag/config constant with safe default off. Unknowns run full. The
change receipt records selected exact leaves and cannot satisfy production-full. A same-tree full
receipt is never overwritten.

Rollback: disable the flag; broad push execution remains available immediately.

### Stage 6 — dynamic `/ship` presentation, not production weakening

**Invariant:** MK sees why each lane ran or safely skipped, while final production proof stays full.

The ship procedure will:

1. fetch/prune and freeze inventory;
2. show the impact plan in plain language;
3. use selected local diagnostics during remediation;
4. run VRT only when the pixel plan selects routes, reporting `safely-skipped` otherwise;
5. for each difference, state what visibly changed in short bullets and link absolute Before, After,
   Difference, and report paths;
6. run the complete final-tree `pnpm gates:ship` and verify the production-full receipt;
7. stop for MK push approval.

Rollback: restore earlier ship wording. The gate itself was never narrowed.

### Stage 7 — production composition (design only; blocked by D7)

Do not implement or enable under this approval. A future proposal would need canonical content
fingerprints for every leaf, proof that a final tree's leaf universe is composed only from exact
matching content/config/toolchain/authority inputs, corruption/concurrency/deletion handling, a
new receipt profile, representative production evidence, and explicit MK approval. Docs-only final
ship skipping is part of this stage, not Stage 5 or 6.

## Operator-document consistency requirements

Update all current surfaces in the same stage and add semantic mutations so they cannot drift:

- operational prose may skip product lanes only when machine-proven;
- rendered MDX is not operational prose;
- component selection includes all reachable dependents;
- shared/global/unknown/metadata changes widen;
- disagreement widens rather than narrows;
- selected, safely skipped, not reached, and unknown are distinct;
- affected/selected evidence does not satisfy production-full;
- final ship remains full until D7/MK;
- retry remains diagnostic-only;
- VRT differences require understandable bullets and absolute screenshot/report paths;
- each outward action still has a separate MK approval.

Historical plans and ledgers remain historical. Mark supersession where a current-looking statement
would otherwise mislead; do not rewrite dated evidence.

## Verification order

For each stage, add the negative first and prove the intended failure. Then run the cheapest disproof:

1. focused planner/import/route/smoke/Vitest runner positives and mutations;
2. operator-doc positive and semantic-negative suite;
3. workflow-security positive and negative suites;
4. classifier/change-set tests including deletion, rename, binary, symlink, mode, generated,
   untracked, version-only, mixed, and unknown changes;
5. receipt/profile/reuse/retry/affected/consume/candidate positives and negatives;
6. `pnpm lint` and `pnpm typecheck`;
7. registry and derived generation with clean-tree idempotency;
8. controlled selected-versus-full browser/contract comparisons in isolated exact-tree worktrees;
9. `pnpm release:preflight` where release surfaces changed;
10. preliminary and terminal `pnpm gates:ship` only after executable work is approved and complete;
11. VRT review when the planner selects a pixel surface; inspect structured report and screenshots.

Finally perform deterministic review, then an unchanged-scope adversarial review for stale prose,
unmodeled imports, fail-open selectors, zero execution, report ambiguity, receipt weakening, mirror
drift, and dead code. Fix and repeat until zero high and zero medium findings and no recurrence.

## Measurement and benefit ledger

Retain old and new workflow generations separately. Every observation states measured,
API-reported, modeled, estimated, or unknown; tree; environment; cold/warm/thermal knowledge; sample
size; closure size; listed/executed count; widening; and escapes.

| Hypothesis                                                    | Current evidence                                                                                | Target                                                                                 | Acceptance                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Operational prose inner-loop avoids product lanes             | planner models this; selected execution disabled                                                | product lanes 0; planner overhead <=3s                                                 | same-tree full oracle shows zero escape in samples    |
| Leaf component verifies dependents rather than all unit/smoke | route/smoke closures exist; push still broad                                                    | normal affected proof 10-90s                                                           | exact leaf sets, nonzero execution, zero escapes      |
| Foundational closure remains bounded when honestly narrow     | No current >6-route fixture has agreeing registry/import authorities; those changes widen full. | <=4m only where a future approved closure permits                                      | blocked; no sample collection or saving claim yet     |
| Unchanged post-ship push                                      | exact-tree reuse shadow 0/20                                                                    | p95 <=10s                                                                              | separate 20-following-run checkpoint + MK             |
| Final full ship                                               | retained full runs 30m15s-48m25s, n=3; sample median 37m57s                                     | <=19m p50/<=22m p95 remains unmet                                                      | no coverage/worker/schedule weakening; honest verdict |
| Final docs-only ship skips browsers/contracts                 | forbidden by current exact-tree policy                                                          | unknown                                                                                | D7 design + evidence + separate MK approval           |
| Selector correctness                                          | affected checkpoint 0/30 and foundation scenario machine-blocked at reviewed tree               | zero escapes across >=30 representative full oracles after authority/policy resolution | all nine scenarios; no invalid or substitute samples  |

No time saving is claimed from a plan or path count. Selector overhead plus executed work is included;
hidden producer/build/cache work is not moved outside the measured interval.

## Primary-source confirmation

Access date: 2026-07-29. These mechanics cannot override VegaStack policy.

| Area                             | Official/primary source                                                                                      | Installed relevance | Conclusion and plan effect                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest related/changed/list      | <https://v4.vitest.dev/guide/cli>                                                                            | Vitest 4.1.9        | `related` follows static imports but not computed dynamic imports; `list --json` and exact file filters support pre-execution reconciliation. Use it as an independent oracle and widen on dynamic/disagreement. |
| Vitest structured reporters      | <https://v4.vitest.dev/guide/reporters>                                                                      | Vitest 4.1.9        | JSON/custom reporters can coexist with terminal output. Preserve exact executed leaves and reject absent/corrupt/zero results.                                                                                   |
| Turbo inputs/global dependencies | <https://turborepo.dev/docs/reference/configuration>                                                         | Turbo 2.10.5        | `globalDependencies` affect every task hash; custom task inputs replace defaults unless `$TURBO_DEFAULT$` is included. Keep blanket tooling authority until the full input inventory is proven.                  |
| Turbo dry-run/cache diagnostics  | <https://turborepo.dev/docs/reference/run> and <https://turborepo.dev/docs/crafting-your-repository/caching> | Turbo 2.10.5        | `--dry=json` exposes task hashes/inputs/dependencies; summaries explain cache changes. Use for comparison/observability, not browser trust.                                                                      |
| Playwright exact selection       | <https://playwright.dev/docs/test-cli>                                                                       | Playwright 1.61.0   | Projects, grep, JSON reporters, listing, and test-list selection are supported. Keep list-before-run, exact project identity, and no pass-with-no-tests.                                                         |

## Open decisions and approval boundaries

| Checkpoint                       | Owner/evidence needed                                                                                                                     | Safe next action                                                                  | Still disabled                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| Implementation plan approval     | MK approved 2026-07-30                                                                                                                    | Continue locally; preserve blocked activation surfaces                            | dynamic activation and all outward actions      |
| Enable dynamic pre-push          | First resolve the no-agreeing-foundation-fixture blocker with MK; then >=30 representative production-full zero-escape samples and review | Do not collect qualifying samples yet; present the authority/policy blocker to MK | Stage 5 flag                                    |
| Exact-tree full receipt reuse    | MK after separate 20 following observations                                                                                               | review `.gates/reuse-plan` cohort                                                 | reuse flag                                      |
| Selected consume replaces full   | D1/MK plus isolated closure evidence                                                                                                      | review consume measurement and escapes                                            | CI/Release/ship reduction                       |
| Task-specific Turbo inputs       | recorded input-inventory checkpoint/MK                                                                                                    | prove all root data/config/dynamic reads with mutations                           | removal of `tooling/**` global dependency       |
| Dynamic/compositional final ship | D7/MK plus a new evidence design and canary                                                                                               | review a separate production-evidence proposal                                    | any scoped/docs-only production-full acceptance |
| Push                             | MK after implementation, full proof, VRT decision, zero-high/medium review                                                                | explicit “yes, push”                                                              | all remote mutation                             |
| Version PR merge                 | separate MK approval after real Release observation                                                                                       | explicit merge approval                                                           | npm publication                                 |
| Deploy                           | separate MK approval after publication/registry state known                                                                               | explicit deploy dispatch approval                                                 | production/Cloudflare mutation                  |

## Approval record

MK approved local implementation of Stages 1-4 and Stage 6 on 2026-07-30: common fail-closed impact
planning, selected diagnostic runners, shadow full-oracle comparison, measurements, and consistent
operator documentation. That approval did **not** enable selected pre-push, exact-tree reuse,
selected consume, task-specific Turbo inputs, or dynamic production ship. Those remain disabled at
their recorded checkpoints, and it did not authorize an outward action.

## Implementation record — 2026-07-30

MK approved Stages 1–4 and 6. Stages 5 and 7 remain deliberately unimplemented. This record is the
file-level rollback and evidence ledger; terminal full-tree results are appended only after they
actually execute.

### Stage/file ledger

| Stage                         | Invariant and negative-first proof                                                                                                                                                                                                                         | Implementation/files                                                                                                                                                                                                                                                      | Rollout and rollback                                                                                                                                                                                                | Approval state                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1 — current authority         | A docs label cannot authorize a product skip; dependents cannot be ignored; unknowns and oracle disagreement cannot narrow; every safe skip needs reason/digest. Five semantic mutations fail with their named reason.                                     | `tooling/verify-operator-docs.mjs`; `AGENTS.md`; root/docs READMEs; `docs/RELEASING.md`; `ship`, `gates`, `review`, and visual-review skills; `.husky/pre-push`.                                                                                                          | Documentation and verifier only. Revert this stage to remove the explanation surface; no scheduler flag changes.                                                                                                    | Implemented locally; no outward action. |
| 2 — common impact authority   | Content/type/mode/symlink/binary/untracked/deleted/renamed inputs remain visible; computed/unresolved imports and unknown ownership widen; any registry/import/route/Vitest disagreement widens full.                                                      | `tooling/lib/change-set.mjs`, `import-closure.mjs`, `gate-impact.mjs`, `route-scope.mjs`; change-inventory/import/impact/route mutation suites. Retained 2026-07-30 graph: 1,647 sources, 3,518 internal edges, zero issues (`n=1`, measured on the implementation tree). | `generation=dynamic-impact-shadow-v2`, `rollout.enabled=false`, `productionEligible=false`. Revert planner/library/tests together; existing full gates remain the fallback throughout.                              | Implemented shadow-only.                |
| 3 — exact diagnostics         | Empty, duplicate, stale, renamed, malformed, missing, extra, skipped-only, or zero-execution selectors fail. Planned/listed/executed leaves must match exactly. VRT common-plan/route disagreement widens and its report is atomic and receipt-ineligible. | `tooling/lib/vitest-selection.mjs`, `vrt-selection.mjs`; `vitest-run.mjs`, structured reporter, `contracts-run.mjs`, `vrt-review.mjs`; four focused mutation suites.                                                                                                      | `--selected-shadow`/`--diagnostic` only; `diagnosticOnly=true`, `evidenceWritten=false` for test diagnostics, `receiptWritten=false`. Remove these flags/runners without changing ordinary full commands.           | Implemented diagnostic-only.            |
| 4 — observable shadow         | Planning cannot write evidence or a receipt, cannot claim production eligibility, and cannot hide selector/Turbo overhead or widening.                                                                                                                     | `tooling/impact-plan.mjs`, `gates-affected.mjs`, `package.json`; canonical immutable `.gates/diagnostics/affected` reports.                                                                                                                                               | Exact selected diagnostics require `--execute-selected`; `rollout.enabled=false`, reuse disabled, and the unchanged full oracle remains mandatory. Revert CLI/report additions to restore the current oracle alone. | Implemented shadow-only.                |
| 5 — dynamic pre-push          | Requires an MK-resolved foundation authority/policy fixture, then at least 30 representative production-full zero-escape samples and separate activation approval.                                                                                         | No executable hook/gate activation was added. `.husky/pre-push` explains the disabled state only.                                                                                                                                                                         | Do not collect qualifying samples while the current no-fixture blocker remains; current pre-push oracle is unchanged.                                                                                               | **Blocked/not implemented.**            |
| 6 — dynamic ship presentation | `/ship` shows the machine reason, skips VRT only on a reconciled empty pixel plan, explains visible changes in short bullets, and links every available status-appropriate image plus the report. Final production proof stays complete.                   | Canonical ship skill and visual-review reference, agent/gates/review instructions, release docs, operator verifier, `vrt-review.mjs`.                                                                                                                                     | Presentation and human-review applicability only. Terminal `pnpm gates:ship` remains full. Revert docs/VRT reconciliation to restore the former route-only presentation.                                            | Implemented; D7 not crossed.            |
| 7 — production composition    | No scoped or cross-tree leaf may satisfy production-full under current policy.                                                                                                                                                                             | No receipt, workflow, deploy, Release, or production acceptance code changed.                                                                                                                                                                                             | Complete exact-final-tree schema-2 receipt remains mandatory.                                                                                                                                                       | **D7/MK blocked/not implemented.**      |

### Failures and recovery ledger

| Forced case or review finding                                                                                                     | Intended result                                                                                                              | Recovery/root fix                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blanket Markdown/docs skip, own-component-only, unknown-path skip, smaller-on-disagreement, unexplained safe skip                 | Operator verifier rejects each named semantic reason.                                                                        | Five current-instruction rules plus corrected surfaces; historical sections remain historical.                                                                                                                                                                             |
| Relative, alias, barrel/re-export, literal dynamic, computed dynamic, unresolved internal/alias, cycle, duplicate exclusive owner | Literal edges close transitively; computed/unresolved widens; exclusive duplicates reject.                                   | Installed TypeScript AST plus modeled aliases and multi-owner sets for legitimate shared tests/routes.                                                                                                                                                                     |
| Initial real graph reported 43 unresolved imports                                                                                 | Planner would have widened every component, eliminating useful selection.                                                    | Candidate resolution now treats only recognized source suffixes as extensions; real graph is zero-issue.                                                                                                                                                                   |
| Mode-only change disappeared behind provenance subtraction                                                                        | Scheduler would not see metadata even though the content-only classifier returned empty.                                     | `--no-renames` inventory plus metadata reconciliation retains mode/type/add/delete/rename/untracked paths; pure provenance content alone still drops.                                                                                                                      |
| Binary content on a known component path                                                                                          | Static dependency parsing is not trustworthy.                                                                                | Tracked `--numstat` and untracked NUL detection mark binary; every product lane widens to full.                                                                                                                                                                            |
| `_headers` route selector fell through as unknown/full while boundary planner called it nonvisual                                 | Independent authorities disagreed.                                                                                           | Both route lanes explicitly classify the exact header authority nonvisual; boundary/public-build checks remain required.                                                                                                                                                   |
| Route-scope implementation changed while raw VRT selector called all tooling nonvisual                                            | Common plan and route oracle disagreed.                                                                                      | VRT reconciles both; either may add coverage and any full result wins.                                                                                                                                                                                                     |
| Empty/malformed/duplicate/missing/extra Vitest leaves; wrong engine/project; skipped-only execution                               | Selected diagnostic exits nonzero and writes no receipt evidence.                                                            | List-before-run plus exact planned/listed/executed reconciliation and structured reporter leaves.                                                                                                                                                                          |
| Contract diagnostic missing/empty routes                                                                                          | Exit 2 for `--diagnostic requires a nonempty exact --routes selector`.                                                       | Supported wrapper retains build/port/server/list/count ownership.                                                                                                                                                                                                          |
| Non-atomic VRT report, unstructured skip/execution, missing digest/requested-selector validation or reporting, receipt promotion  | Seven report mutations reject.                                                                                               | Atomic report writer; explicit safely-skipped/executed-pass/executed-fail states; reconciled digest plus independently validated/reported exact selectors; human-review-only eligibility.                                                                                  |
| Explicit full-page VRT omitted the extra page routes from its digest/report                                                       | Report could describe less than the grep executed.                                                                           | Full-page expansion is included before selector hashing and structured scope publication.                                                                                                                                                                                  |
| Hand-maintained VRT pages omitted a real rendered MDX route                                                                       | The selected route must not be filtered into a false empty/not-applicable result.                                            | `design:derived` generates and freshness-checks all 138 routable MDX pages plus `/` (139 total); missing-both, stale, dynamic, duplicate, symlink, add, and remove mutations fail closed.                                                                                  |
| Exact VRT diagnostic could not name rendered pages, then initially retained inferred page/fixture/icon work                       | A diagnostic selector must execute exactly the named fixtures/pages, while an independent full-impact result must still win. | `--page-routes` replaces inferred full-page work and clears inferred fixture/icon work; combined `--routes` plus `--page-routes` retains only both explicit sets. Empty, duplicate, malformed, whitespace, leaked automatic work, and ambiguous `--all` combinations fail. |
| Runner diagnostics constructed expected contract leaves from zero arguments or report-owned scope                                 | A passing full diagnostic must reconcile against an independent exact 108-route/864-check universe.                          | The workflow reconstructs current route authority, passes it explicitly, and rejects zero-argument, report-owned, omitted-scope, wrong-route, or wrong-leaf outcomes.                                                                                                      |
| Scenario candidate was accepted although its pre-oracle shape could never satisfy retained proof                                  | Invalid partial-global or mixed workflow/header candidates must stop before a full oracle spawn.                             | Candidate predicates now match retained proof: global means all six lanes full; workflow/header permit no selected executable work; source-order mutations prove pre-spawn rejection.                                                                                      |
| Any affected `ship` oracle requested while the required foundation scenario is machine-unattainable                               | Exit 2 before report creation, selected execution, the full oracle, or retained sample write.                                | One fail-closed guard covers raw and selected `ship` oracle paths; branch-independent fresh-directory integration mutations prove neither path can start checkpoint work at 0/30.                                                                                          |

### Before/after and benefits ledger

All local measurements below are measured on macOS arm64 / Node 24.18.0; thermal/cold state and
summed CPU/RSS are unknown unless stated. A controlled path is a diagnostic input, not a production
sample.

| Surface                   | Before                                                                                              | After observation                                                                                                                                                                                                                                                             | Class/sample                                                                              | Verdict                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Operational plan          | No common machine explanation; full gate was the only safe answer.                                  | One controlled plan path selected zero product lanes in 2,805.537 ms total process-relative planning wall: 1,018.345 ms impact selection and 673.724 ms checkpoint analysis; each lane reported `safely-skipped` with reason/digest. External `/usr/bin/time` wall was 2.85s. | Measured `n=1`; exact working tree recorded in command output; warm/cold and RSS unknown. | Planner-overhead target <=3s met for this one sample; execution saving and p95 remain unclaimed.   |
| Full branch impact plan   | Existing affected v1 used registry/route/Turbo shadows without one import/metadata/VRT explanation. | Current dirty-tree observation: 123 substantive paths, 72 conservative widenings; 4,873.610 ms total planning (930.238 ms impact, 1,249.033 ms Turbo dry-run, 813.683 ms cohort, 652.878 ms checkpoint analysis). Current graph: 1,647 sources/3,518 edges/0 issues.          | Measured `n=1`; pre-final dirty implementation tree; external wall 4.94s.                 | Complete cost is visible; this intentionally full plan does not claim affected execution savings.  |
| Selected unit diagnostic  | Single exact retry target only.                                                                     | Button + dependent CopyButton listed/executed exactly 2 files and 34 tests; 3.465s structured duration / 5.75s process wall; no evidence/receipt written.                                                                                                                     | Measured `n=1`; selector digest retained; warm/cold unknown.                              | Mechanism and <=10–90s local target met for this controlled leaf; representative cohort pending.   |
| Selected contracts        | Existing wrapper already scoped routes but had no explicit shadow evidence boundary.                | Button listed/executed exactly 8/8 checks in 167.710s report / 167.99s process wall. Cold docs build was 140.471s; Playwright was 19.7s. No receipt/evidence written.                                                                                                         | Measured `n=1`, zero Turbo cache hits, CPU 240.01s; thermal/RSS unknown.                  | Exact closure met; hidden build cost included; <=10–90s normal target not met on this cold sample. |
| Affected checkpoint       | 0/30 at approval.                                                                                   | Still 0/30; reuse disabled. The current authority set has zero agreeing greater-than-six-route foundation fixtures, so the required foundation scenario is unattainable without a new authority design or MK policy decision.                                                 | Machine-derived attainability plus summary, `n=0` valid production-full samples.          | Blocked before observation; synthetic evidence cannot count.                                       |
| Dynamic pre-push          | Broad current oracle.                                                                               | Unchanged. Selected commands are printed only when safe and remain diagnostic.                                                                                                                                                                                                | Policy fact.                                                                              | Stage 5 blocked.                                                                                   |
| Final ship                | Retained complete samples 30m15s–48m25s (`n=3`, unknown cache/thermal); sample median 37m57s.       | Complete terminal run still required after final freeze; no lane may be selected away.                                                                                                                                                                                        | Historical measured baseline; new result pending.                                         | <=19m/<=22m remains unmet/unproven; no weakening.                                                  |
| Docs-only production ship | Complete proof required.                                                                            | Complete proof still required.                                                                                                                                                                                                                                                | Policy fact.                                                                              | D7 blocked; zero fabricated saving.                                                                |

### Current checkpoints

| Checkpoint                            | Evidence still required                                                                                                                                                                 | Safe next action                                                                                          | Rollback/authority                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Dynamic pre-push                      | A separately accepted comparable authority/fixture for the foundation scenario, then >=30 valid production-full zero-escape samples covering all nine scenarios and separate MK review. | Keep reuse disabled; review the machine-reported authority blocker before collecting a qualifying cohort. | Current full push oracle.                                 |
| Exact-tree reuse                      | Separate 20-following-run cohort and MK approval.                                                                                                                                       | Observe only after a separately approved push.                                                            | Reuse remains disabled.                                   |
| Selected consume                      | D1 plus independent closure/measurement acceptance.                                                                                                                                     | Keep selected consume diagnostic and full oracle mandatory.                                               | Full consume in CI/Release/ship.                          |
| Turbo inputs/cache                    | Complete external/root/dynamic input inventory and mutations, then MK.                                                                                                                  | Compare shadow hashes only.                                                                               | `globalDependencies: ["tooling/**"]` stays.               |
| Production composition/docs-only ship | D7, new evidence profile/design, canary, and MK.                                                                                                                                        | No local activation action exists.                                                                        | Exact-final-tree production-full receipt.                 |
| Push / Version PR / Deploy            | Three separate MK approvals and real upstream state at each boundary.                                                                                                                   | Stop after local final evidence and ask only for push approval.                                           | No remote or production action under this implementation. |

### Post-implementation VRT capture remediation — 2026-07-30

The origin/main review exposed a false OTP delta: two of five state rows were intermittently absent
from a locator snapshot although the full failure screenshot contained the complete component. Two
incremental safeguards—hydration readiness and geometric containment—were each mutation-tested but
then honestly superseded when runtime same-tree evidence reproduced the delta. Official Playwright
behavior explains the remaining gap: locator screenshots scroll their element into view after the
pre-capture proof.

The final mechanism keeps all five-row readiness, scroll reset, anchoring, and containment checks,
then uses `expect(page).toHaveScreenshot` with the verified non-null fixture bounding box as `clip`
for the exact OTP route. Ordinary fixtures still use locator screenshots. Nineteen semantic harness
mutations reject every relaxation. Exact same-tree commit
`0202fb160ff2ede9c1003f6caef55f3af88aa808` executed four project leaves and reported 0 changed /
4 unchanged / 0 new / 0 removed / 0 broken; all four retained images visibly show all five OTP
states. This is measured capture evidence (`n=4`, cold base 5.8m, warm head 3.5m; CPU/RSS and thermal
state unknown), not receipt evidence and not a production-policy change.

Adversarial review superseded the initial 19-mutation verifier scope. Presence checks could not prove
that assertions were reachable or unswallowed, and non-null geometry did not prove that a
non-full-page clip remained inside the viewport. The current verifier parses TSX with installed
TypeScript 6.0.3 and enforces exact ordered readiness/capture control flow, terminal call methods,
null guards, and a finite positive viewport-contained rectangle. Forty-four mutations cover the
reproduced unreachable, early-return, overwrite, ignored-promise, short-circuit, swallowed-failure,
negative, zero-size, and overflow cases plus the original route/readiness/default-path cases. A
second exact same-tree run at `8a5cd944079ee85ec43285bdb5bc23bb5105c7ac` reported 0 changed /
4 unchanged / 0 new / 0 removed / 0 broken (`n=4`; cold base 7.0m, warm head 3.2m; CPU/RSS/thermal
unknown). This additional proof remains VRT diagnostic evidence only.

The final frozen-head review also exposed a verifier-only assumption: the classifier mutation clone
unconditionally committed the copied current module closure. Once that closure was already committed,
Git returned `nothing added to commit` and root lint stopped before classifier assertions. Fixture
setup now preserves HEAD when the staged closure is identical, commits only a real staged delta, and
propagates unexpected Git failures. Direct fixtures cover both branches; clean commit `9d6ff0df`
passes 74 classifier assertions. No classifier selection or rollout behavior changed.
