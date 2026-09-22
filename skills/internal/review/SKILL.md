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

## 2. Run affected verification, then read the plan and report

Never open with a code read. `pnpm verify` runs full repository static verification once, derives the
working-tree component graph, prints its auditable selection, and executes only affected Chromium
tests. In CI the same planner receives the PR's exact base/head SHAs. A finding the gate already
catches is not worth a review slot, and a green claim that is actually red is the most valuable
finding available.

```bash
node tooling/design-lint.mjs packages/ui/registry                    # component source, all rules
node tooling/design-lint.mjs --token-css packages/design-tokens/src  # token CSS (!important only)
node tooling/design-lint.mjs --token-css apps/docs/app               # docs app CSS (!important only)
pnpm upstream:check                              # vendor integrity + byte parity + variant coverage
pnpm upstream:selftest                           # prove all four upstream gates can still fail
pnpm verify                                      # full static + working-tree affected Chromium tests
pnpm registry:build && git status --porcelain    # must be idempotent — clean tree after
pnpm design:derived && git status --porcelain    # contract-derived surfaces must be current
```

Read the affected list, not just the exit code. Confirm every changed item, transitive reverse
dependent, owned cross-cutting suite, and preview fixture is present. An unknown path must fail.
`pnpm verify:distribution` is the public artifact proof used by deploy; use it only when reviewing
distribution. The complete component suite is manual-only through `pnpm test:full`.

Any error is a finding. **A gate that passes while its subject is broken is a `high` finding about
the gate.**

`packages/ui/registry` also runs the AST passes (icon-button names, forward-ref, raw interactive
HTML, cursor cues, client boundaries) — these need real TypeScript parsing, not a regex. Both
`--token-css` roots run ONLY the `!important` check; the Tailwind-utility rules would false-positive
on legitimate `oklch()`/custom-property CSS.

### The four `upstream:*` gates — the anti-drift set

Since the shadcn reset (2026-09-18) every component shadcn ships is **upstream's file plus an
approved patch**, and four scripts under `tooling/upstream/` are what make that enforceable rather
than aspirational. Three of them run in `pnpm upstream:check`, inside `pnpm lint`, and all four carry
a `--self-test` that observes them failing (`pnpm upstream:selftest`). **All of them read
`vendor/shadcn/<cli>/` directly, so none can be switched off by editing a list** — that was a real
finding: parity, coverage and the JSDoc exemption all used to read one hand-maintained array in
`migrated.json`, and deleting a name from it silently disabled all three.

1. **`pull.mjs --verify-integrity`** (`upstream:integrity`) — re-hashes every committed file under
   `vendor/shadcn/4.21.0/` against its own `manifest.json`. Fails on a content mismatch, a recorded
   file that is gone, and a file no pull produced. It is the first stage, because every later claim is
   about that tree. `--check` is the separate, ONLINE proof used when moving a version; it needs the
   CLI and is not a gate.
2. **`verify-parity.mjs`** (`upstream:parity`) — applies `patches/<name>.patch` to the vendor file in
   memory and compares byte for byte. Also: a component with no patch must equal upstream exactly; a
   patch may only name an ID `decisions.json` marks **ours**; a patch must name every ID
   `exception-map.json` assigns to that component; a name in `excluded.json` must stay absent from the
   registry; a canonical file that is neither upstream-backed nor recorded in `ours.json` fails; and
   an `exempt` name must be fileless on **both** sides.
3. **`verify-variant-coverage.mjs`** (`upstream:variants`) — every section on upstream's own docs page
   exists on ours, matched **occurrence by occurrence in document order**, each carrying a
   `<ComponentPreview>` whose `name` the preview barrel exports, and no two required occurrences may
   answer with the same preview. Both of those are recent corrections: keying by normalised title in a
   `Map` had made a real gap on `combobox` read as `required 15 · present 15`, and "has a preview"
   used to mean the body contained the text `<ComponentPreview`.
4. **`diff.mjs`** (`pnpm upstream:diff <name>`) — the authoring tool, not a gate, but it fails closed
   too: it refuses to write a patch whose header carries no `# decisions:` line.

**What to attack here.** A patch header naming an ID the register marks **shadcn**. A hunk that
implements nothing on its own header. A `no hunk` claim with no test pinning the engine behaviour it
leans on. An exception assigned in `exception-map.json` that a component's patch silently does not
carry. A `ring-3` or `focus-visible:ring-*` reintroduced by a careless upstream copy — `design-lint`'s
`no-focus-ring-glow` is the specific guard, and its structural self-test observes both halves (a glow
rejected, a resting `0 0 0 1px` hairline accepted).

`pnpm lint` includes three further integrity gates worth knowing by name:

- **`verify-portal-theme-scope`** — discovers every direct Base UI `Portal`
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
- **Docs completeness** — a component missing a Fumadocs page, an `ApiTable`, or JSDoc on a
  public prop (which breaks the API Reference table). The page canon is `design.md` § Docs canon,
  enforced by `tooling/content-lint.mjs`; the authoring shape is in the `component` skill §6. **JSDoc
  is required only for a component that is ours**: an upstream-backed one is exempt, because upstream
  ships none and adding it would be a patch hunk with no decision ID. That boundary is DERIVED from
  `vendor/shadcn/<cli>/ui/*.tsx`, never listed — a claimed exemption for a component upstream does not
  ship is a high finding.
- **Naming-canon drift** — a new synonym prop for an existing semantic axis (a `color` or `status`
  prop where `intent` is established), or a dotted sub-component export (`Foo.Bar` not `FooBar`). On
  an upstream-backed component the canon is upstream's: a VegaStack-flavoured prop name added to a
  shared component is drift, and needs a decision ID or it is a finding.
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
   JSDoc feeding `ApiTable`.
5. **Fail-closed gates.** Prove each one fails on a negative case. A gate never observed failing is
   an assumption, not a gate. These gates carry their own proof and are the models to hold a new gate
   against: the four `upstream:*` self-tests above (`pull` tampers with a copy of the real vendor tree
   four ways and watches the failure clear again; `parity` matches failure TEXT rather than "something
   failed"), `verify-affected-tests --self-test` (selection and geometry wiring),
   `verify-docs-shell --self-test` (mutates the built export and requires
   its own contracts to fail), `verify-workflow-security-negative.mjs` (proves a move back onto a
   hosted runner, or a dropped container, is rejected in both directions),
   `verify-design-lint-structural.mjs` and `verify-registry-integrity-negative.mjs` (negative
   fixtures for the AST passes and for tampered `meta.integrity`), and `changeset-lint` (rejects a
   changeset body with no marker, two markers, or no text, with no grandfather list). The geometry
   lane is proved differently, and worth understanding before trusting it: a compiled-CSS sentinel
   fails the run if the real token CSS did not load (without it every reflow assertion would pass
   vacuously over unstyled fixtures), and each exclusion is per assertion, still EXECUTED in
   expect-failure mode, so an exclusion that has been fixed turns red instead of rotting. A gate
   whose only failure mode is "it did not run" is fail-open.
6. **Security and trust boundaries.** Registry integrity (hash + Sigstore identity pinning), workflow
   permissions, secret handling, the approval topology. Over-broad is a finding even if nothing has
   exploited it.
7. **Edge cases and unhandled failure modes.** Empty, loading, error, partial build, hash mismatch,
   missing token, offline, credential-less.
8. **Contradictions** — between built code and the locked decisions in `AGENTS.md` /
   `docs/requirements.md` §3 / `packages/ui/upstream/decisions.json`, or between any two documents.
   Decide which side is wrong; do not just note the mismatch. **A new decision row invented to
   legitimise a hunk is a high finding**, however good the hunk: the register is MK's, and a fix that
   genuinely has no row stops and asks instead. Two IDs (`A11Y-14`, `A11Y-15`) are permanently unused
   for exactly this reason.
9. **Regression pressure.** For each fix landed this round, ask what it could plausibly have broken,
   and check that specifically.

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

Blocking visual verification is the affected geometry selection in
`packages/ui/test/geometry.browser.test.tsx` (320px reflow, RTL containment, the effective 24px
pointer target, and the owned focus contract). It always executes its compiled-CSS/token sentinels
and metadata guards, then mounts the fixtures selected from changed preview modules and reverse
dependents. Agent visual review may use temporary captures, but no capture is committed or used as a
CI baseline.

**Selection is evidence.** CI executes affected tests rather than accepting an attestation, but a
green subset is credible only when its plan is correct. Cross-check the changed paths, seed items,
reverse closure, cross-cutting ownership, and fixture list. Broad inputs intentionally run dedicated
contracts plus fixed canaries; they do not claim complete per-component coverage.

- **No committed screenshot or baseline.** Targeted agent captures are temporary review material.
- **No skipped visual test.** `tooling/content-lint.mjs` rejects one; also flag prose that still
  describes deferred visual coverage as acceptable.

Reviewing the contract gate:

- It is the blocking component visual-surface gate. Weakening an assertion in
  `packages/ui/test/geometry.browser.test.tsx` without a recorded reason removes coverage nothing
  else replaces.
- A selected geometry run that executes zero fixtures is red. The barrel, exclusions, dynamic
  declarations, requested names, and CSS/token sentinels remain global guards on every invocation.
- **Scope risk is explicit.** `component-contracts.json` owns the graph and cross-cutting tests;
  `verify-registry-deps` proves registry edges against imports and every npm pin against the version
  `pnpm-lock.yaml` resolves for `packages/ui`; `affected-tests` fails unknown paths.
  A missing owner or dependency edge is a high finding about the selector.

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

Repeat until a complete review round returns **0 high · 0 medium** with no prior finding re-raised. A round that
finds nothing is only credible if the previous round found something and the scope did not shrink —
if both rounds are empty, widen the scope or change the attack angle rather than declaring victory.

For a genuinely independent read, delegate a round to Codex via the `codex:rescue` skill and treat
its findings the same way: verify each against source before accepting it. Cross-model rounds have
surfaced findings same-model rounds missed, and have also produced confident false positives — §7
applies to delegated findings too.
