# Manual Component QA Remediation

Date: 2026-08-27

Status: Approved by MK and implemented locally. Verification is complete except for the documented
host-level Playwright WebKit launch blocker; nothing has been published or deployed.

## Source And Baseline

- Manual QA source: [Vegastack Design functionality test](https://docs.google.com/spreadsheets/d/1kE2Zo60pAqyhoS5Ns36Wz-FU5yr0r6o3YVlftX4tmfI/edit?usp=sharing), read-only for this work.
- The sheet has one tab (`Sheet1`) and 13 component rows with an issue or suggestion. Rows marked
  `working` with `none` and no suggestion are outside this remediation pass.
- Public npm baseline: `@vegastack/design@0.3.0`.
- Workspace package baseline: `@vegastack/design@0.3.0`, commit `487a85b` on `main` when this plan
  was written.
- The worktree already contains unrelated in-progress Progress Indicator and media-player work.
  Preserve it. Before every remediation item, inspect the current diff and do not overwrite or
  reclassify those changes. Generated-surface commands must be reviewed for both workstreams.

## Objective

Reproduce, classify, and resolve every actionable report item one at a time. Each item is complete
only when the published behavior has been compared with the current local source, the root cause is
fixed at its authority, regression coverage is added, the relevant local component gate passes, and
the changed pixels have been reviewed.

“Fix the suggestion” does not mean applying a proposed visual change blindly. Suggestions are design
inputs. The implementation must retain WCAG 2.2 AA, semantic invalid/error cues, native table/menu
semantics, the component ownership boundaries, and the doctrine in `design.md`. When the reported
experience is caused by a docs demo or preview harness rather than the registry component, fix that
surface and leave the correct component API unchanged.

## Operating Rules

For every item below:

1. Reproduce it against `design.vegastack.com` and the current local docs route at the same viewport,
   input method, theme, and state. Record the exact click/keyboard/drag sequence and whether the
   defect is in canonical source, a block, a docs preview, docs infrastructure, or is already fixed
   locally but not yet published.
2. Add a failing regression test or another deterministic failing check before changing behavior.
   For visual-only geometry, measure real browser layout rather than asserting only class strings.
3. Fix the narrowest authority: canonical registry source for component behavior, canonical block
   files for `dashboard-01`, or docs preview/MDX for a demonstration defect. Never edit generated
   `apps/docs/components/ui/*` or `apps/docs/public/r/*` files.
4. Use semantic tokens, CVA/data-state conventions, React 19 ref-as-prop, existing VegaStack
   components, container queries where layout follows the component frame, and the sanctioned
   engines already present. Add no dependency exception.
5. Update JSDoc, MDX, preview examples, `component-contracts.json`, and `design.md` only when the
   public contract or system direction actually changes. Regenerate derived surfaces from their
   authorities.
6. Run the item’s narrow tests and `pnpm gates:component <name>` (or the block’s targeted tests and
   route). Inspect the route at 320px, desktop, RTL where applicable, keyboard-only, light/dark, and
   the relevant error/disabled/open states.
7. Mark the item complete in the execution log only after the test and visual evidence agree. Do not
   let a shared fix silently close another row; replay that row’s own reported scenario.

## Ordered Remediation Queue

### 1. Dropzone

Reports: dragging a file does not acquire it; selected files cannot be removed; rejection/error copy
uses the default text color.

- Reproduce drag, browse, and paste separately so a real acquisition defect is not confused with a
  preview-state defect. Exercise accepted and rejected payloads, including a drag crossing child
  elements.
- If drag acquisition fails in `use-file-drop`, fix the sanctioned `react-dropzone` adapter and keep
  `Dropzone` as an acquisition-only shell. Do not add upload or staged-file ownership to the
  component.
- Update the docs preview to demonstrate host-owned staged files with an accessible per-file remove
  action. Announce removal and keep focus behavior deterministic.
- Render rejection entries with the semantic destructive text role while accepted entries retain
  their normal/success treatment.
- Extend `dropzone.test.tsx` for the failing acquisition path and the preview/route coverage for
  remove and error presentation. Verify browse and paste do not regress.

Acceptance: a real file drop and browse both add files; every staged file can be removed by pointer
and keyboard; rejection text is visibly and semantically distinct; live-region output is useful and
not duplicated.

### 2. Field Inline

Report: switching between display and edit mode shifts layout because the focus/edit border changes
the rendered box.

- Measure the idle and focused edit-mode bounding boxes for default and `borderless` modes.
- Keep border geometry present in both modes using semantic/transparent border treatment, without
  weakening the text-entry focus tint or adding hardcoded dimensions.
- Add a regression test asserting stable outer geometry across click-to-edit, focus, commit, and
  cancel. Recheck error text and controlled edit mode.

Acceptance: entering/leaving edit mode produces no width or height jump, and the focused input still
has a visible compliant affordance.

### 3. Switch

Suggestion: remove the red border shown on the Switch.

- Confirm whether the report refers to the intentional `aria-invalid` state, a persistent border in
  the default preview, or an unintended focus/error combination.
- Preserve an unmistakable non-color-only invalid state. If the standalone red hairline is the
  problem, refine the invalid presentation or the preview composition while retaining the
  associated Field error and accessible invalid semantics. Do not simply delete the only visual
  invalid cue.
- Cover default, checked, focus-visible, invalid, invalid+checked, disabled, and Field-driven invalid
  states in tests and pixel review.

Acceptance: normal Switches never show a destructive border; invalid Switches remain accessible and
visually distinguishable without an unnecessarily dominant treatment.

### 4. Date Picker — Range Selection

Report: the range popover closes after choosing either endpoint, preventing a new start and end from
being chosen in one session.

- Add a controlled regression case that opens with an existing complete range, chooses a new start,
  verifies the popover stays open, then chooses the end and verifies it closes.
- Make close behavior depend on completion of the current selection gesture, not merely on the
  emitted range containing both `from` and `to`. Retain preset close behavior, disabled-date guards,
  locale formatting, and one-/two-month modes.
- Verify mouse, touch-equivalent click, and keyboard day selection.

Acceptance: a fresh two-endpoint selection is possible without reopening; only a genuinely completed
range or preset closes the popover.

### 5. Dropdown Menu — Inset Example

Report: activating options in the inset example navigates to a 404 page.

- Reproduce the exact target and capture the destination URL. Determine whether activation leaks to
  an ancestor link/docs control, whether the example accidentally renders a link, or whether the
  static docs router handles the event incorrectly.
- Fix the docs example or shared preview infrastructure if the canonical `DropdownMenuItem` remains a
  non-link action. Change the component only if the same unintended navigation reproduces in an
  isolated test.
- Add a regression asserting each inset item activates/closes as intended and leaves `location`
  unchanged.

Acceptance: every inset option works as an action with no route change or 404, using pointer and
keyboard activation.

### 6. Context Menu — Inset Example

Report: activating options in the inset example navigates to a 404 page.

- Replay independently from Dropdown Menu, including right-click, keyboard Context Menu/Shift+F10,
  submenu opening, disabled Forward, and leaf activation.
- Reuse a shared docs-infrastructure fix only if the root cause is proven identical; otherwise fix
  the context-menu-specific authority.
- Add the same location-stability regression for leaf items.

Acceptance: inset leaf and submenu actions do not navigate, the disabled item remains inert, and the
menu’s keyboard contract stays intact.

### 7. Tabs — Line Variant

Report: the line variant has unwanted spacing and shows a scrollbar.

- Compare line, pill, and chip at natural width and under true overflow. Identify whether the spacing
  comes from trigger padding, the list rule/indicator overlap, docs framing, or scrollbar allocation.
- Keep horizontal overflow functional for long tab sets, but hide native scrollbar chrome with the
  existing `scrollbar-none` utility and retain the edge fade and keyboard/pointer scrolling.
- Correct only the line variant’s proven spacing defect; do not compress the shared control scale or
  change pill/chip geometry.
- Add layout tests for indicator alignment, no reserved scrollbar gutter, 320px overflow, RTL, and a
  visible focus indicator inside the masked scroll area.

Acceptance: a short line tab row has no stray gap or scrollbar; a long row remains discoverably and
operably scrollable in LTR and RTL.

### 8. Sidebar — Collapsed Counts

Report/suggestion: numeric badges disappear when collapsed; show a compact bubble instead.

- Keep the expanded numeric badge. In icon-collapsed mode, replace the visible number with a small
  semantic status dot/bubble that does not collide with the icon, active rail, tooltip, or hit area.
- Preserve the full count for assistive technology when it conveys meaningful status; document how
  callers label decorative versus meaningful badges.
- Test active/inactive items, one- and multi-digit counts, LTR/RTL, all menu-button sizes, and
  expanded/collapsed transitions.

Acceptance: collapsed items with a count have a clear compact indicator, expanded items retain the
number, and no label/count information is lost to assistive technology.

### 9. Sidebar — Mobile Overlay And Trigger

Report: on small screens the sidebar should overlay the screen and be opened by a burger/menu icon.

- Test the canonical component at a real sub-768px viewport separately from the docs frame-width
  toggle. The component already has a Sheet path; establish whether the failure is product behavior,
  the primary preview’s forced `mobileBreakpoint={1}`, or the preview harness’s container/viewport
  mismatch.
- Ensure a trigger remains outside the closed mobile Sheet, opens it as an overlay, receives/returns
  focus correctly, and closes on Escape and route/action selection where documented.
- Rewrite the Sidebar preview composition to demonstrate the real mobile contract instead of forcing
  the desktop rail at every preview width. Do not duplicate AppShell internals.
- Add genuine mobile tests rather than mocking every suite render to desktop.

Acceptance: at 320px/375px the rail is absent until the visible trigger is activated, then appears as
an accessible overlay without pushing content off-screen.

### 10. App Shell — Mobile Sidebar

Report: the App Shell also needs the small-screen overlay sidebar and burger/menu trigger.

- Re-test after item 9 because AppShell composes Sidebar, but keep this row open until its own docs
  route passes.
- Verify `AppShellHeader`’s trigger is visible and operable at a real mobile viewport and within the
  responsive preview experience; verify the header middle/actions still shrink without overflow.
- Add an AppShell mobile integration test covering open, focus trap/return, Escape, content
  containment, and the single navigation/banner/main landmark contract.

Acceptance: the AppShell route exposes the menu trigger at mobile width, opens navigation over the
content, and preserves shell landmarks and content width.

### 11. Chart — Pie/Donut Examples

Suggestion: add more chart variants such as pie charts.

- Treat this as a documentation/example expansion over the existing generic Recharts wrapper, not a
  new Chart variant prop or renderer abstraction.
- Add deterministic pie and donut examples using the installed Recharts engine, semantic chart
  tokens, `ChartConfig`, tooltip/legend composition where applicable, and accessible textual context.
- Document when to use pie/donut versus line/bar and cap slice counts so comparison remains legible.
- Add a focused render/axe test only for behavior the existing Chart tests do not cover; update the
  contract record if the preview/state coverage changes.

Acceptance: the Chart page includes responsive pie and donut examples with no hardcoded palette,
stable data, useful labels/tooltips, and clean accessibility checks.

### 12. Pricing Section

Report: the pricing cards are not responsive on small screens.

- Replace viewport-dependent card columns with a named container-query layout so the component
  responds to its actual frame, including the docs mobile-width control and narrow embedded regions.
- Test one through four cards, long plan/price/feature copy, highlighted badges, and CTA alignment at
  320px, intermediate widths, and desktop.
- Keep DOM order and reading order aligned; no horizontal scrolling for the card grid.

Acceptance: cards stack at narrow container widths, grow through sensible intermediate columns, and
never clip text, badges, or actions.

### 13. Comparison Matrix

Report: the matrix is not optimized for a small screen.

- Preserve one native semantic table. Do not duplicate data into a second mobile-only DOM that can
  drift or create conflicting accessibility output.
- Make horizontal overflow deliberate and discoverable: give the matrix a readable minimum layout,
  keep the feature column identifiable while scrolling if sticky behavior proves usable, apply edge
  fade/scrollbar treatment from the existing utilities, and expose a named keyboard-focusable scroll
  region when required.
- Test long feature/plan names, boolean and literal cells, highlighted columns, 320px, RTL, keyboard
  scrolling, and forced-colors/high-contrast behavior.

Acceptance: the matrix stays semantically correct and usable at 320px without page-level overflow or
unreadably compressed columns.

### 14. Dashboard 01 Block

Report: the dashboard block is not responsive on small screens.

- Re-test after Sidebar/AppShell remediation, then isolate any block-specific overflow in stat cards,
  chart, recent activity, header action, breadcrumb, loading, empty, and error states.
- Remove the suite-wide false assumption that mobile behavior can be covered while `matchMedia` is
  always mocked to desktop. Add a real mobile block scenario that opens the navigation Sheet and
  exercises the populated page.
- Use the existing `@container/app-shell-content` layout contract for content regions. Fix block
  composition in `packages/ui/registry/blocks/dashboard-01/**`, not generated registry payloads.

Acceptance: every Dashboard state fits a 320px viewport, the mobile navigation overlay works, charts
and activity remain usable, and no region causes page-level horizontal overflow.

## Execution Disposition

| Item                  | Root cause and disposition                                                                                                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Dropzone           | Canonical drag, browse, paste, and child-crossing acquisition tests were already green. The published preview silently discarded staged files and rejections. The preview now owns staged state, accessible removal, live removal announcements, and destructive rejection copy.   |
| 2. Field Inline       | Display mode did not reserve Input's height, padding, and border geometry. It now mirrors those dimensions with a transparent border; `borderless` removes the geometry in both modes.                                                                                             |
| 3. Switch             | The invalid-state border was intentionally destructive but visually dominant. It is now a compact status dot while `aria-invalid` and composed Field error text remain intact.                                                                                                     |
| 4. Date Picker        | A complete prior range made the first click of a new gesture look complete. The picker now tracks the current gesture, normalizes the first click to an open range, and closes only after the second endpoint.                                                                     |
| 5. Dropdown Menu      | The inset demo rendered `GroupLabel` outside `Menu.Group`, causing Base UI's missing-context error boundary (perceived as a 404). The label and items now share a real group; activation leaves the URL unchanged.                                                                 |
| 6. Context Menu       | The same invalid group composition independently affected the context-menu inset demo. It now uses `ContextMenuGroup`; leaf actions remain local actions.                                                                                                                          |
| 7. Tabs               | Native scrollbar allocation created the reported gap. Horizontal overflow remains operable, native chrome is hidden with `scrollbar-none`, and the focus outline is inset inside the fade mask.                                                                                    |
| 8. Sidebar counts     | The collapsed selector hid badges entirely. Collapsed badges now render a compact status bubble while the full count remains in the accessibility tree; expanded badges retain the number.                                                                                         |
| 9. Sidebar mobile     | The primary preview forced desktop mode and placed its trigger inside the rail. It now uses the real breakpoint with a persistent external header trigger, plus a forced-mobile docs fixture for the container-width harness.                                                      |
| 10. AppShell mobile   | Canonical Sheet behavior and integration tests were already correct; the docs frame could not demonstrate a viewport media query. A forced-mobile example now proves the persistent header trigger and overlay path.                                                               |
| 11. Chart             | The generic Recharts wrapper supported polar charts, but the docs showed only Cartesian examples. Deterministic token-only pie and donut examples now include legends, tooltips, and a text equivalent.                                                                            |
| 12. Pricing           | Viewport breakpoints misread narrow embedded frames. An intrinsic `auto-fit` grid keyed to the semantic `--container-3xs` width now responds directly to available component width without adding a wrapper or changing ref/className ownership.                                   |
| 13. Comparison Matrix | Columns compressed without a deliberate scroll contract. The native table now has readable minimum columns inside a labelled focusable scroll region, edge affordance, and sticky body feature headers; the blank header corner deliberately scrolls so it cannot cover plan CTAs. |
| 14. Dashboard 01      | The block inherited correct AppShell behavior, but its tests always mocked desktop and the docs frame could not trip `matchMedia`. The block now forwards `mobileBreakpoint`/root `className`, has a forced-mobile demo, and tests the real Sheet branch with axe.                 |

The Pricing implementation uses intrinsic grid sizing instead of the plan's initially proposed named
container-query wrapper. This is deliberate: it reacts to the same actual frame width while
preserving the component's single grid root and its existing `ref`/`className` contract.

## Cross-Cutting Verification

After each item, run the narrowest disproof first. Before the full batch is called complete, run:

```bash
node tooling/design-lint.mjs packages/ui/registry
cd packages/ui && pnpm exec tsc --noEmit && pnpm exec vitest run && cd ../..
pnpm registry:build
pnpm design:derived
pnpm design:verify
pnpm registry:verify-consume
pnpm contracts
```

Also run `pnpm gates:component <name>` after every changed component. For `dashboard-01`, run its
targeted browser test and route first. Run the cross-engine smoke for the affected routes whose risk
is mobile overlay, scrolling, drag/drop, or Recharts. At the end, run `node tooling/vrt-review.mjs`,
inspect every changed image, and classify it intended, unintended, or uncertain. The focus-indicator
contract lane is known unable to fail and must not be cited as focus coverage; use explicit browser
tests and manual visual inspection for those assertions.

`pnpm registry:build` and `pnpm design:derived` must be idempotent after their generated output is
accepted. Because the worktree contains another active workstream, review their diffs rather than
requiring a globally clean tree.

## Deliverables

- Root-cause and disposition entry for every numbered item above.
- Canonical fixes and regression tests at the correct authority.
- Updated previews/MDX for changed behavior and new Chart examples.
- Updated `component-contracts.json`/`design.md` only where the contract or doctrine changes, followed
  by regenerated derived surfaces.
- One patch changeset for the consumer-visible remediation batch, written after all item scopes are
  known so it does not overstate fixes.
- A final evidence summary listing commands run, route-level browser results, visual-review verdicts,
  any standards-driven no-change disposition, and remaining limitations.

## Risks And Controls

- **Published/local drift:** reproduce both before patching; a production-only defect may already be
  fixed locally, but still needs release-note coverage and proof.
- **Shared-root false closure:** Sidebar may fix AppShell/Dashboard, but each report is replayed and
  signed off independently.
- **Responsive harness ambiguity:** a constrained preview container is not a viewport. Test both the
  docs control and a real browser viewport and fix the authority that is actually lying.
- **Accessibility regression from visual simplification:** Switch invalid styling, collapsed counts,
  hidden scrollbars, sticky table cells, and removal actions all receive keyboard, screen-reader/ARIA,
  forced-colors where relevant, and axe coverage.
- **Generated-file collisions:** preserve current Progress Indicator/media-player edits, edit only
  authorities, and inspect regeneration diffs before accepting them.
- **Scope expansion:** if reproduction reveals a shared infrastructure defect affecting components
  outside these rows, document the blast radius and return for approval before broadening this plan.

## Non-Goals

- No changes to rows reported as `working` with no issue or suggestion.
- No upload queue, retry, or transport logic inside Dropzone.
- No new charting, drag/drop, menu, or responsive dependency.
- No replacement of AppShell/Sidebar’s approved composition model.
- No hand-edited generated source, registry JSON, integrity metadata, or derived docs.
- No edits to the Google Sheet unless MK separately requests status write-back.
- No commit, push, release, npm publish, registry signing, or deployment. Shipping remains a separate
  explicit MK decision through the `ship` skill.
