# Sidebar Viewport Footer Pinning

Date: 2026-08-27

Status: Implemented locally on 2026-08-27 — not committed, published, or deployed.

## Source And Reproduction

- Consumer-app evidence:
  `.claude/claude-code-chat-images/image_1787828789701.png`.
- Published and workspace package baseline: `@vegastack/design@0.3.0`.
- The screenshot shows the desktop rail's lower edge around two-thirds of the viewport after the
  document has scrolled, leaving blank page space beneath it. The user footer is still at the
  bottom of the rail, but the rail itself has moved upward with the document.
- Canonical source confirms the cause: desktop `Sidebar` has `h-svh` but remains a relatively
  positioned flex item. `SidebarContent` is correctly the flexible internal scroll region, yet the
  rail is not anchored to the viewport when a consumer allows the document/body to own page scroll.
- The worktree contains the approved manual-QA remediation plus unrelated Progress Indicator and
  media-player work. Preserve every existing change and edit only the authorities listed below.

## Objective

Keep the desktop Sidebar rail within the viewport while the adjacent document scrolls, so
`SidebarFooter` remains visually pinned to the viewport bottom. When navigation itself exceeds the
available height, only `SidebarContent` should scroll; the header and footer must remain visible.

## Scope

1. Add viewport anchoring to both desktop Sidebar branches:
   - the regular collapsible rail (`icon` and `offcanvas`), and
   - `collapsible="none"`.
2. Preserve the existing `sidebar`, `inset`, and `floating` spacing/height treatments, both sides,
   and expanded/collapsed transitions.
3. Make the header and footer explicitly non-shrinking, with the footer occupying the rail's bottom
   slot while `SidebarContent` remains the sole flexible overflow region.
4. Preserve mobile behavior unchanged: below the breakpoint, Sidebar continues to render inside
   the fixed modal Sheet and must not gain a second sticky positioning layer.
5. Update Sidebar's JSDoc and MDX to state the scroll contract clearly: document scroll may move the
   main page, the desktop rail stays viewport-anchored, and overflowing navigation scrolls inside
   `SidebarContent`.
6. Record the consumer-visible behavior correction in a changeset.

## Implementation Authority

- Edit: `packages/ui/registry/ui/sidebar.tsx`.
- Test: `packages/ui/registry/ui/sidebar.test.tsx`.
- Documentation: `apps/docs/content/docs/components/sidebar.mdx`.
- Changeset: `.changeset/sidebar-viewport-pinning.md`.
- Regenerate, never hand-edit: `apps/docs/components/ui/sidebar.tsx` and
  `apps/docs/public/r/sidebar.json` via `pnpm registry:build`.

No new prop or variant is planned. Viewport anchoring is the corrected default desktop behavior, so
`component-contracts.json` and `design.md` should remain unchanged unless implementation reveals a
new public axis or doctrine decision.

## Regression Proof

Add a real-browser regression composition with a Sidebar beside content taller than the viewport.
Using an exact compiled-style mirror where the unit harness lacks Tailwind CSS:

1. Record the rail and footer rectangles at document scroll position zero.
2. Scroll the document vertically and assert the rail remains at the viewport's block start and the
   footer remains at the viewport's block end.
3. Render navigation taller than the rail, scroll `SidebarContent`, and assert the header/footer
   rectangles remain stable while the middle region's `scrollTop` changes.
4. Repeat the structural assertions for `collapsible="none"`, left/right sides, collapsed state,
   and floating treatment.
5. Verify the mobile Sheet path does not receive desktop sticky classes and still passes open,
   Escape, focus, and axe coverage.

The browser test must exercise geometry after a real scroll; a class-name-only assertion is not
sufficient for the reported failure.

## Verification

Run the cheapest disproof first, then widen:

```bash
pnpm --filter @vegastack/ui exec vitest run registry/ui/sidebar.test.tsx
pnpm gates:component sidebar
node tooling/design-lint.mjs packages/ui/registry
pnpm registry:build
pnpm design:derived:check
pnpm gates:push
node tooling/vrt-review.mjs --routes /docs/components/sidebar --full-pages
```

Review every changed Sidebar capture in desktop/mobile and light/dark. The expected desktop change
is positioning behavior during scroll, so an unchanged resting screenshot is acceptable only when
the scroll regression test proves the behavior. Do not cite the known fail-open focus-indicator
contract as focus coverage.

## Risks And Controls

- **Nested scroll containers:** sticky positioning anchors to the nearest scrolling ancestor. Test
  both body/document scrolling and Sidebar's intended internal content scrolling.
- **Floating spacing:** keep its detached outer gap while anchored; verify it does not snap flush to
  the viewport edge during scroll.
- **Consumer overrides:** `className` remains last in `cn()`, so an application can deliberately
  replace the default positioning if it owns a different shell strategy.
- **Mobile duplication:** apply anchoring only to desktop branches; the mobile Sheet already owns
  fixed viewport placement and scroll locking.
- **Dirty-worktree collisions:** regenerate from the canonical authority and inspect outputs without
  reverting or reclassifying the other active workstreams.

## Non-Goals

- No fixed-position spacer architecture or duplicate desktop rail.
- No change to mobile breakpoint detection, Sheet behavior, collapse state, or cookie persistence.
- No consumer-app edits; the fix belongs in the distributed Sidebar default.
- No new dependency, token, variant, or public API.
- No commit, push, publish, or deployment. Shipping remains a separate MK decision.

## Implementation Result

- Both desktop Sidebar branches are now sticky, viewport-height flex rails. The standard variants
  anchor at the viewport block start; the floating variant preserves its detached outer gap.
- `SidebarHeader` and `SidebarFooter` are explicitly non-shrinking, the footer occupies the final
  rail slot, and `SidebarContent` remains the flexible internal scroll region.
- The mobile Sheet branch is unchanged and has an explicit regression assertion preventing desktop
  sticky positioning from leaking into it.
- A real-browser geometry regression scrolls a containing page and the navigation region
  independently, proving the rail and footer remain anchored. Structural coverage includes
  `collapsible="none"`, collapsed offcanvas, right-side floating, and mobile rendering.
- The implementation uses a dedicated changeset instead of extending the broader manual-QA
  changeset. This keeps the Sidebar behavior correction independently attributable without changing
  its release semantics.

Verification completed:

- Sidebar browser unit and axe suite: 33/33 passed.
- `pnpm gates:component sidebar`: passed, including the Sidebar route and dependent behavior
  contracts.
- Design lint, `design:derived:check`, `design:verify`, and real shadcn consume verification: passed.
- Registry regeneration: passed and was idempotent on the second run (zero generated updates).
- Full behavior contracts: 110 routes and 880/880 checks passed.
- Targeted visual review: all four changed full-page captures are intentional documentation/reflow
  changes; all four Sidebar fixture captures are unchanged.
- `pnpm gates:push` completed typecheck, lint, Chromium unit/axe, and the full behavior-contract lane,
  but could not produce a passing receipt because the host WebKit process timed out before connecting.
  This is the repository's documented machine-level browser-launch failure; no Sidebar test or
  assertion failed, and the failure was not cleared or bypassed.
