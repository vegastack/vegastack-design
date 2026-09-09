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

## 2. Run `pnpm verify`, then read the one report

Never open with a code read. The audit half is one command and its output: `pnpm verify` names the
stage it failed at, and every stage below is inside it. A finding the build already catches is not
worth a review slot, and a green claim that is actually red is the most valuable finding available.

```bash
node tooling/design-lint.mjs packages/ui/registry                    # component source, all rules
node tooling/design-lint.mjs --token-css packages/design-tokens/src  # token CSS (!important only)
node tooling/design-lint.mjs --token-css apps/docs/app               # docs app CSS (!important only)
pnpm verify                                      # the whole gate: typecheck · lint · design:verify · browser suite
pnpm registry:build && git status --porcelain    # must be idempotent — clean tree after
pnpm design:derived && git status --porcelain    # contract-derived surfaces must be current
```

`pnpm verify` subsumes the browser lanes, including the geometry contracts. It is the same command
CI runs, so "CI was green" and "I ran it" are now the same evidence — which is the point. Add
`pnpm verify:release` when the round touches the docs export, the registry's consumability, or
anything cross-engine; it is otherwise a deploy-time cost.

Any error is a finding. **A gate that passes while its subject is broken is a `high` finding about
the gate.**

`packages/ui/registry` also runs the AST passes (icon-button names, forward-ref, raw interactive
HTML, cursor cues, client boundaries) — these need real TypeScript parsing, not a regex. Both
`--token-css` roots run ONLY the `!important` check; the Tailwind-utility rules would false-positive
on legitimate `oklch()`/custom-property CSS.

`pnpm lint` includes three integrity gates worth knowing by name:

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
   an assumption, not a gate. Four gates in this tree carry their own proof, and they are the models
   to hold a new gate against: `verify-docs-shell --self-test` (mutates the built export and requires
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
   `docs/requirements.md` §3, or between any two documents. Decide which side is wrong; do not just
   note the mismatch.
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

Visual verification is one thing now: the geometry contracts in
`packages/ui/test/geometry.browser.test.tsx` (320px reflow, RTL containment, the effective 24px
pointer target), which run inside `pnpm verify` and therefore inside CI, taking no screenshots and
needing no baselines. There is no pixel lane and no baseline of any kind — a claim that "the pixel
review passed" describes a tool that no longer exists.

**Attestation is gone, and so is the review obligation it created.** Until 2026-09-08 no CI runner
executed a browser and the lanes were attested by a committed evidence file, so a review that
accepted "CI was green" had accepted an attestation rather than a run. CI now executes the same
`pnpm verify` on the LAN Linux runners, and the reviewable question is simply whether the check ran
and what it said. Prose naming any of the removed machinery — the evidence file and its guard jobs,
the change classifier, route scoping, the pixel lane, the Playwright-over-the-export contract runner
— is a finding: it describes a mechanism that no longer exists.

- **No committed screenshot, and no capture lane to produce one.**
  `tooling/verify-workflow-security.mjs` rejects any workflow reaching for the removed baseline
  machinery. A PR reintroducing either is a high finding.
- **No skipped visual test.** `tooling/content-lint.mjs` rejects one; also flag prose that still
  describes deferred visual coverage as acceptable.

Reviewing the contract gate:

- It is the only blocking visual-surface gate. Weakening an assertion in
  `packages/ui/test/geometry.browser.test.tsx` without a recorded reason removes coverage nothing
  else replaces.
- A gate run that executed zero tests is not passing evidence. It now iterates the preview barrel, so
  a fixture silently dropped from that barrel is a fixture silently dropped from the gate — check the
  reported test count against the fixture count rather than the exit code.
- **Scope risk is gone, and that is the design.** There is no route scoping and no classifier
  deciding which lanes a change requires: every run is the full loop. A green run therefore cannot mean "the wrong subset passed". Any
  proposal to reintroduce scoping needs its own plan, because the two-minute loop is what made
  scoping pointless in the first place.

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
