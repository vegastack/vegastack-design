# Audit-tail close-out

Date: 2026-09-11

Status: complete locally — ready for review

## Current evidence

- `main` is `78ed4874`; the audit's final doctrine and adversarial fixes are merged.
- `pnpm verify` passes: 144 browser files and 2,407 tests, including 554 geometry fixtures.
- `pnpm registry:build` reports zero updates on the second run, and `pnpm design:derived` leaves the
  tracked-diff hash unchanged, over all 597 registry items.
- `pnpm verify:release` passes in 429.3s: both visibility builds, 145 public HTML routes in each
  matrix, agent-clean exports, links, emitted CSS, five docs-shell contracts, all nine negative
  mutations, registry idempotency, and the complete two-layout consume round-trip.
- The sequential browser release run passes Chromium 2,407/2,407 and Firefox 2,392 passed + 15
  intentionally skipped = 2,407. Local WebKit reports its explicit host-incompatibility skip; CI
  and deploy retain `WEBKIT_LANE=require`, so the outward gate remains fail-closed.
- Dialog, AlertDialog and Sheet now share the canonical native-inert boundary. The 25-step built
  docs walk stays contained, Toast remains announced and interactive above a modal, and inline
  live-status controls remain inert behind it.
- The icon gallery owns a dedicated route. Ordinary docs routes reference 3,313,238 raw JS bytes,
  down 443,422 bytes (11.8%) from the 3,756,660-byte baseline.
- Issues #58 and #31 remain open intentionally until the merged-main build proves the boundary.

## Work package 0 — make the all-engine runner actually serial

`vitest.all-browsers.config.ts` sets `maxWorkers: 1`, which serializes files inside each browser
instance, but Vitest still runs the browser instances concurrently. Two complete release runs failed
in disjoint files under that load: first animated-icons + AppShell; then DropdownMenu + five
ParticleField animation-frame waits. Every focused reproduction passed immediately, including
82/82 and 44/44 two-engine sets with retries disabled. Random timeout increases are rejected.

1. Keep `webkit-lane.ts` as the single authority for `auto` / `off` / `require` and export the full
   selected engine order from it.
2. Add a small Node/TypeScript runner in `packages/ui` that resolves that order once, then spawns one
   complete Vitest invocation per engine sequentially, stopping on the first non-zero exit.
3. Let `vitest.all-browsers.config.ts` accept the runner's one validated engine through a private
   environment variable, so an invocation creates exactly one browser instance. Direct config use
   without the variable keeps its current developer behavior.
4. Keep CI's `WEBKIT_LANE=require` contract unchanged: a missing WebKit still fails closed before
   the suite starts. Keep the local skip banner explicit.
5. Do not raise test, actionability, polling, or animation-frame timeouts. Prove the runner under the
   full load with retries disabled once, then with the normal release retry policy.

## Work package 1 — close DC-03 at canonical Dialog's modality boundary

The initial plan assumed the defect was confined to fullscreen. Adversarial verification overturned
that assumption: the ordinary Dialog demo leaked into docs navigation in the same 25-Tab walk. The
public API stays unchanged, but native inert ownership therefore belongs in canonical Dialog.
Base UI marks the correct live modal stack with `aria-hidden` / `data-base-ui-inert` but does not set
the native `inert` property, and its guards currently let focus fall through `<body>` into those
roots.

1. The ordinary AlertDialog and Sheet demos leaked in the same adversarial walk, so extract one
   canonical `use-modal-inert` registry hook and compose it from Dialog, AlertDialog and Sheet.
   Observe Base UI's own `data-base-ui-inert` markers outside the current portal and mirror them to
   native inert. Reference-count ownership so nested/stacked modal lifecycles restore the original
   value only after their final owner releases it. Preserve Base UI's region-level live-surface
   exception so a toast portaled above the modal remains announced and interactive, without letting
   control-local status announcers reopen background controls. Do not add inert for `modal={false}` or
   `modal="trap-focus"`, whose outside-pointer contracts differ.
2. In `tooling/verify-docs-shell.mjs`, restore the 25-Tab DC-03 assertion. Permit only the popup,
   Base UI focus guards, and the transient body hand-off; reject every focusable outside element.
3. Add a DC-03 negative mutation that removes the native inert values after open and prove the walk
   fails against the current leak. Update the stale Base UI 1.6.0 explanation to the measured 1.8.0
   behavior and remove the `NOT ASSERTED` warning.
4. Verify Escape, background isolation, focus return, and nested demo portals still work.

## Work package 2 — isolate the animated-icon gallery (#58)

1. Add the dedicated static route `/docs/foundations/icons/gallery`, importing `IconGallery`
   directly. Give it normal docs metadata and a route-local heading/description.
2. Replace `<IconGallery />` on the Icons MDX page with a link to that route.
3. Remove `IconGallery` from the global MDX React map and browser-only export manifest so the
   generated 467-icon module is absent from ordinary docs route client graphs.
4. Change `verify-component-contracts.mjs` from requiring the gallery inside the shared MDX page to
   requiring both the link and the dedicated route's direct render. Preserve the generated-icon
   membership reconciliation.
5. Measure referenced JavaScript bytes for `/docs/foundations/icons` and a representative component
   route before/after, recording the exact reduction. Keep `/docs/foundations/icons/gallery`
   intentionally heavy.
6. Close #58 only after the merged main build proves the route and payload boundary. Close epic #31
   at the same time: all twenty batches are already closed and this is its last follow-up.

## Verification and hand-off

Run, in order:

1. Focused all-engine tests for the runner's prior failures, with retries disabled.
2. Targeted docs-shell normal run and `--self-test`.
3. `pnpm verify`.
4. `pnpm registry:build` and `pnpm design:derived`, each followed by a clean-tree check.
5. `pnpm verify:release` to cover both visibility matrices, exported links/metadata, registry
   consumption, and Chromium/Firefox/WebKit.
6. Record the round in the append-only review ledgers.

No merge, Version PR action, npm publication, or deploy is part of these work packages. After the
fix PR lands, the remaining sequence is explicitly MK-gated: decide PR #106; then decide whether to
merge Version PR #89 (publication); then separately decide whether to dispatch `deploy.yml`.
