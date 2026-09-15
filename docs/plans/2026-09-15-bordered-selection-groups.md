# Bordered selection groups

**Date:** 2026-09-15 · **Status:** approved by MK · **Owner:** MK

## Decision to approve

Grouped selection controls must retain a visible boundary at rest. The boundary belongs to the
group or track, not to every option: outlining each unselected option would turn a segmented control
into a row of unrelated outline buttons and would create doubled seams in `ToggleGroup`.

- `ToggleGroup` gains one semantic `border-border` outer boundary while keeping its joined-item
  geometry and the existing selected-chip fill/hairline treatment.
- The shared selected-chip track gains one semantic `border-border` boundary. This intentionally
  affects `Segmented` and the `pill` Tabs variant, the two components that render that track.
- Standalone `Toggle` and free-standing `chip` Tabs remain borderless at rest. They have no group
  track, and changing `selectedChipVariants.item` would apply a border to every individual chip.
- The Fumadocs preview width chooser switches from `ToggleGroup` to `Segmented`, because it is an
  exactly-one-selected mode switcher. The adjacent fullscreen action remains a ghost `IconButton`.

## Implementation

1. Change only canonical component authorities under `packages/ui/registry/ui/` and the shared
   recipe in `packages/design/src/index.ts`; regenerate docs copy-ins and registry JSON with
   `pnpm registry:build`.
2. Preserve the documented control heights and 24px pointer-target floor. Draw the track boundary
   without allowing a new border box to silently increase the dense 28px and 32px tracks.
3. Update `ToggleGroup`, `Segmented`, Tabs/shared-recipe tests to assert the visible group boundary,
   retained selected state, keyboard behavior, and exact sizing. Update their MDX descriptions and
   previews where the changed treatment needs to be demonstrated.
4. Update `apps/docs/components/preview-controls.tsx` to compose `Segmented` and add focused coverage
   for the preview toolbar classification/geometry.
5. Add the required changeset. Do not hand-edit generated copies, registry JSON, or the release
   changelog.

## Required proof

- `node tooling/design-lint.mjs packages/ui/registry`
- `pnpm registry:build` followed by an idempotency check
- `pnpm check:component toggle-group`
- `pnpm check:component segmented`
- `pnpm check:component tabs`
- Targeted light/dark visual inspection of ToggleGroup, Segmented, pill Tabs, and the Fumadocs
  preview toolbar, including hover, pressed, selected, focus-visible, and disabled states.
- `pnpm check:affected`, with the emitted selection inspected to ensure the shared recipe and docs
  preview infrastructure do not fail open.
