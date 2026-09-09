# G1-b — lint rules and gate correctness (issue #49b), RE-SCOPED for the verification rebuild

**Do not start this until the component batches have merged and WP2/WP3 of
`docs/plans/2026-09-08-verification-rebuild.md` have landed.** Roughly half of the original G1-b
scope was written against machinery WP2/WP3 delete. Read `_common.md` first, then this file, then
the plan's §3.3 keep/delete lists. If anything below names a script that no longer exists, that item
is already resolved by the rebuild — say so and move on; do not resurrect it.

## Why this brief was rewritten

The original G1-b (issue #49) bundled twelve design-lint rules with a set of gate-plumbing fixes:
receipt v2, a verify-only pre-push mode, a Playwright worker cap, contract-lane scope classification,
and a receipt carry for generated-only rebases. **Every one of those plumbing items exists only
because browser lanes ran locally under an attested receipt.** WP2 deletes the receipt, the pre-push
hook and `.gates/`; WP3 deletes `contracts-run.mjs`, `classify-change.mjs`, `lib/route-scope.mjs`,
`vrt-review.mjs` and `apps/docs/vrt/` outright. Carrying those items forward would be work against
deleted code.

## KEEP — these are product invariants, independent of how verification runs

1. **The twelve design-lint rules from issue #49.** Read the issue body for the list; they are token
   and AST rules over `packages/ui/registry`, enforced by `tooling/design-lint.mjs`, and nothing in
   the rebuild touches that script. Each rule needs a negative fixture — `verify-design-lint-structural.mjs`
   exists precisely because a rule that has never been observed failing is an assumption.
2. **Hover-fill-without-active-rung.** A `hover:bg-*` or hover ink tint on an interactive element,
   with no sanctioned `active:` rung in the same class literal or via the recipes, fails closed.
   Extends `no-hover-fill-literal`. Negative fixture required. Source: Codex's F1 review, routed in
   `fix-round.md` line 12. **Depends on Needs-MK #11** (the AGENTS.md hover sentence wording) — and
   WP6 rewrites AGENTS.md, so coordinate the wording with whoever owns WP6 rather than editing it
   twice.
3. **`packages/ui/test/` is outside the `@vegastack/ui` tsconfig `include`.** Add it and fix the ~12
   errors that surface. This got MORE important with WP1: the geometry behaviour contracts now live
   in `packages/ui/test/geometry.browser.test.tsx`, so the repo's newest browser gate is currently
   not type-checked at all. Needs-MK #10, recommendation was proceed.
4. **`verify-component-contracts.mjs` hard-codes the registry inventory count**, so every component
   batch has to edit a gate script to add a component. Derive the expected count from
   `registry.json`; keep only the reconciliation checks. Needs-MK #17. **This has already caused a
   real defect**: O1 (#66) found `components: 111` committed against `totalRegistryItems: 559`, which
   does not add up (112 + 439 + 7 + 1 = 559). A count that can drift and still pass is a fail-open
   gate; deriving it removes the whole class.
5. **Token-reference lint** — a semantic token referenced in component source that does not exist in
   the built token contract should fail closed rather than render as an unstyled class.

## DROP — the rebuild deletes the thing these were fixing

- Receipt v2, the receipt carry for generated-only rebases, and the verify-only pre-push mode
  (`fix-round.md` 47, 48). WP2 deletes `.gates/`, `verify-gate-receipt.mjs`, `gate-receipt-carry.mjs`
  and `.husky/pre-push`. There is no receipt to version, carry or skip.
- Contract-lane scope classification and the `TITLE_SUFFIXES` gap that hid T1's named table tests
  from the scoped lane (`fix-round.md` 39). WP3 deletes `contracts-run.mjs` and `lib/route-scope.mjs`;
  the geometry lane runs every fixture every time, so scoping has nothing to optimise.
- The local Playwright worker cap. No Playwright runner survives WP3.

## VERIFY, THEN DROP OR KEEP — do not assume either way

These two were real defects in the old contract lane. WP1's geometry lane is supposed to have made
them structurally impossible, but **confirm by reading `packages/ui/test/geometry.browser.test.tsx`
before deciding**:

- **`.first()`-only fixture probing** (`fix-round.md` 18): the old lane probed only the first
  `[data-vrt-preview]` on a route, so defects on later fixtures were invisible. WP1's lane iterates
  every export of the preview barrel, which should close this. If it does, record that it is closed
  and by what, in `bugs.md` — do not leave the ledger claiming an open defect that no longer exists.
  Note the three 24 px-target defects this hid (timeline, data-grid, text-edit hero fixtures) are
  real and owned by T1/M2/C1; check they were actually fixed rather than merely un-probed.
- **The `relative-time` target-floor race** (`bugs.md` 2026-09-08): the probe measures a rect, then
  hit-tests, and the self-rescheduling fixture re-renders in between. WP1's plan says the lane mounts
  with a fixed `now`, which removes the race at its root. Confirm that is what the code does.

## The one thing that must not be quietly dropped

The **focus-indicator check has been unable to fail since 2026-07-25** — it ran under
`forcedColors: "active"`, where Chromium paints its own ring, so deleting the design system's
`:focus-visible` rule left all 864 checks green. WP3 deletes that check as a documented no-op rather
than fixing it. That is defensible, but it means **the repo would then have no automated
focus-indicator coverage at all**. Either add a real focus-indicator assertion to the geometry lane
(measure the system's own ring, not forced-colors') or record explicitly in `bugs.md` and
`design.md` that focus indication is covered by review only. Do not let it vanish silently — a gate
that was known-vacuous being deleted is fine; the coverage claim disappearing without a note is not.

## Acceptance

- Every new lint rule has a negative fixture that fails when the rule is removed, wired into
  `verify-design-lint-structural.mjs`.
- `pnpm verify` green (post-WP2 ladder). No `gates:*` invocation anywhere in this branch.
- `packages/ui/test/` type-checks; the geometry lane is included in `pnpm typecheck`.
- `verify-component-contracts.mjs` derives its count; deliberately corrupting `registry.json`'s item
  list fails the gate.
- `bugs.md` updated for each item you closed, with what closed it — including the two "verify then
  drop" items above, whichever way they land.
- PR body per `_common.md`, and a line for each ORIGINAL issue-#49 item saying kept / dropped / moved,
  with the reason. Reviewers must be able to see nothing was lost by accident.
