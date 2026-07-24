# A11y + UI-State Audit — 2026-07-14

Scope: all 68 canonical components in `packages/ui/registry/ui/*.tsx` + their `*.test.tsx`,
`packages/ui/test/a11y.ts`, `packages/ui/test/contrast.browser.test.tsx`, `tooling/contrast-check.mjs`,
`apps/docs/playwright.config.ts` + `apps/docs/vrt/components.spec.ts`, `packages/tokens/src/base.css`,
`apps/docs/app/global.css`. Read-only audit; no source modified. Evidence-based — every finding cites
file:line. Base UI focus-management claims were verified against the installed
`@base-ui/react@1.6.0` source in `node_modules` (`popups/popupStoreUtils.js:45-47`), and the
message-scroller motion claim against the bundled `@shadcn/react` dist.

## Architecture facts every finding builds on

1. **Global focus indicator is OUTLINE-based, not ring-based.** `packages/tokens/src/base.css:16-18`
   (mirrored at `apps/docs/app/global.css:50-52`): `:focus-visible { outline-2 outline-offset-1 outline-ring }`.
   The stated contract is "components carry NO focus ring of their own; this re-skins from `ring`."
   This already matches the owner's border/outline-over-halo preference. A component with **no** local
   focus classes is _correct_, not deficient.
2. **Tailwind v4 layer-order hazard.** Utilities layer beats the base layer for the same property. Any
   unconditional `outline-none` utility on a component **silently defeats** the base-layer
   `:focus-visible` rule for that element — unless the component supplies its own compensating
   indicator (border tint, background change, ring). Every `outline-none` in the registry was traced
   (29 occurrences across 15 files); results in §(b) and §(d).
3. **Reduced motion** is handled globally by the sanctioned `!important` block
   (`packages/tokens/src/base.css:59-68`) — covers all CSS transitions/animations, **not** JS-driven
   scrolling (`Element.scrollTo({behavior:'smooth'})` is unaffected — see message-scroller finding).
4. **axe harness**: `packages/ui/test/a11y.ts` runs axe-core 4.12.1 with
   `wcag2a/wcag2aa/wcag21a/wcag21aa` tags and fails on any violation. Unit tests run **without
   compiled CSS**, so `color-contrast` is only meaningful in the dedicated compiled-CSS gate
   `packages/ui/test/contrast.browser.test.tsx` (light + dark, portal-aware).

---

## (a) Component × state matrix

Legend: `✓` implemented · `✗` applicable but missing · `—` not applicable · `(t)` implemented but
untested. Columns: Dflt=default, Hov=hover, Foc=focus-visible, Act=active/pressed, Dis=disabled,
Load=loading, Err=error/invalid, Succ=success, Emp=empty, RO=readonly.

| Component          | Dflt | Hov | Foc        | Act | Dis   | Load  | Err   | Succ | Emp | RO    | Notes                                                                                         |
| ------------------ | ---- | --- | ---------- | --- | ----- | ----- | ----- | ---- | --- | ----- | --------------------------------------------------------------------------------------------- |
| accordion          | ✓    | ✓   | ✓g         | —   | ✓     | —     | —     | —    | —   | —     | accordion.tsx:93-94                                                                           |
| alert              | ✓    | ✓   | ✓g+dup     | —   | —     | —     | —     | —    | —   | —     | 5 status _variants_; dismiss btn alert.tsx:151-152                                            |
| alert-dialog       | ✓    | ✓   | ✓g         | —   | —     | **✗** | —     | —    | —   | —     | no `loading` on Action for async confirms (alert-dialog.tsx:252-259)                          |
| auto-save-input    | ✓    | ✓   | ✓b         | —   | ✓     | ✓     | ✓     | ✓    | —   | —     | exemplary: role=status live region (auto-save-input.tsx:217-239)                              |
| avatar             | ✓    | —   | —          | —   | —     | ✓     | ✓     | —    | —   | —     | fallback-on-error via Base UI; alt enforced by types (avatar.tsx:35-55)                       |
| badge              | ✓    | —   | ✓g         | —   | —     | ✓     | —     | —    | —   | —     | aria-busy while loading (badge.tsx:205)                                                       |
| breadcrumb         | ✓    | ✓   | ✓g         | —   | —     | —     | —     | —    | —   | —     | aria-current="page" (breadcrumb.tsx:118-126)                                                  |
| bubble             | ✓    | ✓   | ✓**r**     | —   | ✗     | —     | —     | —    | —   | —     | ONLY ring-based focus in system (bubble.tsx:155); no disabled styling for interactive bubbles |
| button             | ✓    | ✓   | ✓g/b       | ✓   | ✓     | ✓     | ✓     | —    | —   | —     | loading keeps focusability via aria-disabled (button.tsx:104-121)                             |
| card               | —    | —   | —          | —   | —     | —     | —     | —    | —   | —     | pure container                                                                                |
| checkbox           | ✓    | ✓   | ✓g         | ✓   | ✓     | —     | ✓     | —    | —   | —     | indeterminate ✓ (checkbox.tsx:22-26)                                                          |
| collapsible        | ✓    | ✓   | ✓g         | —   | ✓     | —     | —     | —    | —   | —     |                                                                                               |
| color-picker       | ✓    | ✓   | ✓g/b       | ✓   | ✓     | —     | —     | —    | —   | —     | aria-pressed swatches (color-picker.tsx:192-193); Tab-only grid                               |
| command            | ✓    | ✓   | ✓b/v       | ✓   | ✓     | ✓     | —     | —    | ✓   | —     | CommandLoading role=progressbar (command.tsx:239-250); CommandEmpty ✓                         |
| context-menu       | ✓    | ✓   | ✓v         | ✓   | ✓     | —     | —     | —    | —   | —     | virtual highlight (context-menu.tsx:234-246)                                                  |
| copy-button        | ✓    | ✓   | ✓g         | —   | ✓(t)  | —     | —     | ✓    | —   | —     | copied state = label swap only, no live region (copy-button.tsx:102)                          |
| country-select     | ✓    | ✓   | ✓g/b       | —   | ✓     | —     | —     | —    | ✓   | —     | static data → no loading needed                                                               |
| data-list          | ✓    | ✓   | ✓g         | ✓   | ✓     | ✓     | —     | —    | ✓   | —     | loading live region + aria-sort (data-list.tsx:377-433)                                       |
| date-picker        | ✓    | ✓   | ✓g/b       | ✓   | ✓     | —     | —     | —    | ✓   | —     | disabled dates aria-disabled + defense-in-depth preset gating (date-picker.tsx:540-558)       |
| dialog             | ✓    | ✓   | ✓g         | —   | —     | —     | —     | —    | —   | —     | Popup outline-none (dialog.tsx:30) — see §(b) note                                            |
| dropdown-menu      | ✓    | ✓   | ✓v         | ✓   | ✓     | —     | —     | —    | —   | —     |                                                                                               |
| emoji-picker       | ✓    | ✓   | ✓g+bg      | —   | —     | —     | —     | —    | ✓   | —     | live region for result count (emoji-picker.tsx:580-587); Tab-only grid ✗                      |
| empty-state        | ✓    | —   | —          | —   | —     | —     | —     | —    | ✓   | —     | is the empty state                                                                            |
| field              | ✓    | —   | (via ctrl) | —   | ✓(t)  | —     | ✓     | ✓    | —   | ✗     | FieldError role=alert (field.tsx:125-126); disabled untested; no readonly hook                |
| field-inline       | ✓    | ✓   | ✓g         | —   | **✗** | —     | **✗** | —    | ✓   | **✗** | no disabled/readonly/error in API at all (field-inline.tsx:9-50)                              |
| filter-bar         | ✓    | ✓   | ✓g/b       | ✓   | ✓(t)  | —     | —     | —    | ✓   | —     | role=group + computed remove labels (filter-bar.tsx:184-186,289-291)                          |
| hover-card         | ✓    | ✓   | ✓g         | —   | —     | —     | —     | —    | —   | —     | opens on keyboard focus (tested)                                                              |
| icon-button        | ✓    | ✓   | ✓g/b       | ✓   | ✓     | ✓     | —     | —    | —   | —     | aria-label required at type level (icon-button.tsx:38)                                        |
| image              | ✓    | —   | —          | —   | —     | ✓     | ✓     | —    | ✓   | —     | error fallback drops `alt` (image.tsx:168-175) — §(b)                                         |
| input              | ✓    | —   | ✓b         | —   | ✓     | —     | ✓     | —    | —   | ~     | outline-none + focus:border-ring/70 (input.tsx:39-40); readonly = native only                 |
| kbd                | —    | —   | —          | —   | —     | —     | —     | —    | —   | —     | pointer-events-none chip                                                                      |
| label              | ✓    | —   | —          | —   | ✓     | —     | —     | —    | —   | —     | peer/group-disabled dimming (label.tsx:48-49)                                                 |
| markdown-view      | ✓    | ✓   | ✓g         | —   | —     | —     | —     | —    | ✓   | —     | XSS-safe by construction (tested)                                                             |
| marker             | ✓    | ✓   | ✓g         | —   | —     | —     | —     | —    | —   | —     |                                                                                               |
| message            | ✓    | —   | —          | —   | —     | —     | —     | —    | —   | —     | layout only                                                                                   |
| message-scroller   | ✓    | ✓   | ✓g         | —   | —     | —     | —     | —    | ~   | —     | role=log live region from primitive; smooth-scroll motion gap — §(b)                          |
| notification-bell  | ✓    | ✓   | ✓g         | —   | ✓(t)  | —     | —     | —    | ✓   | —     | count folded into accessible name (notification-bell.tsx:69)                                  |
| otp-input          | ✓    | —   | ✓b         | —   | ✓     | —     | ✓(t)  | ✓(t) | —   | ✓     | invalid/complete in CSS/API, zero tests (otp-input.tsx:94)                                    |
| page-header        | ✓    | ✓   | ✓g         | ✓   | ✓(t)  | —     | —     | —    | —   | —     | favorite aria-pressed (page-header.tsx:121)                                                   |
| pagination         | ✓    | ✓   | ✓g         | ✓   | ~     | —     | —     | —    | —   | —     | aria-disabled hook doesn't block keyboard — §(b)                                              |
| password-input     | ✓    | ✓   | ✓b+g       | ✓   | ✓     | —     | ✓(t)  | ✓    | —   | —     | exemplary live-region requirements checklist (password-input.tsx:122-129)                     |
| popover            | ✓    | —   | **✗**      | —   | —     | —     | —     | —    | —   | —     | Popup outline-none, no compensation — §(b) CRITICAL                                           |
| progress           | ✓    | —   | —          | —   | —     | ✓     | —     | —    | —   | —     | indeterminate ✓ (data-indeterminate)                                                          |
| progress-indicator | ✓    | —   | —          | —   | —     | ✓     | —     | —    | —   | —     | self-managed progressbar ARIA (progress-indicator.tsx:143-147)                                |
| radio-group        | ✓    | ✓   | ✓g         | ✓   | ✓     | —     | ✓(t)  | —    | —   | —     | invalid styling exists, untested (radio-group.tsx:165-172)                                    |
| relative-time      | ✓    | —   | ✓g         | —   | —     | —     | ✓     | —    | —   | —     | tabIndex only when tooltip trigger — correct (relative-time.tsx:218)                          |
| scroll-area        | ✓    | ✓   | ✓g         | —   | —     | —     | —     | —    | —   | —     | viewport tabIndex=0 + labelable (scroll-area.tsx:96-110)                                      |
| select             | ✓    | ✓   | ✓b/v       | ✓   | ✓     | ✗     | ✓(t)  | —    | ✗   | —     | no loading/empty-options affordance (consumer-owned)                                          |
| separator          | ✓    | —   | —          | —   | —     | —     | —     | —    | —   | —     | decorative/semantic swap done right (separator.tsx:43-45)                                     |
| settings-row       | ✓    | —   | —          | —   | —     | —     | —     | —    | —   | —     | real label htmlFor when controlId given                                                       |
| sheet              | ✓    | ✓   | **✗**      | —   | —     | —     | —     | —    | —   | —     | Popup outline-none in sheetVariants — §(b) CRITICAL                                           |
| sidebar            | ✓    | ✓   | ✓g         | ✓   | ✓(t)  | —     | —     | —    | —   | —     | collapsed = unlabeled icon buttons — §(b) HIGH                                                |
| skeleton           | ✓    | —   | —          | —   | —     | ✓     | —     | —    | —   | —     | aria-hidden + motion-reduce (skeleton.tsx:14,96-97)                                           |
| slider             | ✓    | ✓   | ✓g         | ✓   | ✓     | —     | —     | —    | —   | —     | dual-thumb distinct names ✓ (slider.tsx:33-43)                                                |
| sonner             | ✓    | ✓   | (lib)      | —   | —     | ✓     | ✓     | ✓    | —   | —     | live region is sonner-internal, preserved                                                     |
| spinner            | ✓    | —   | —          | —   | —     | ✓     | —     | —    | —   | —     | role=status + motion-reduce (spinner.tsx:16,76-79)                                            |
| split-button       | ✓    | ✓   | ✓g/b       | ✓   | ✓     | ~     | —     | —    | —   | —     | loading cue on primary half only (split-button.tsx:152-169)                                   |
| state-select       | ✓    | ✓   | ✓g/b       | —   | ✓     | —     | —     | —    | ✓   | —     | fallback Input path ✓ (state-select.tsx:1502-1524)                                            |
| status-icon        | ✓    | —   | —          | —   | —     | ✓     | ✓     | ✓    | —   | —     | shape+color per status → not color-alone (status-icon.tsx:34-39)                              |
| switch             | ✓    | ✓   | ✓g         | ✓   | ✓     | —     | ✓     | —    | —   | —     |                                                                                               |
| table              | ✓    | ✓   | —          | —   | —     | —     | —     | —    | —   | —     | styling-only primitive; scope="col" not defaulted (table.tsx:144-159)                         |
| tabs               | ✓    | ✓   | ✓g+dup     | ✓   | ✓     | —     | —     | —    | —   | —     | TabsContent dup of global rule (tabs.tsx:204)                                                 |
| text-edit          | ✓    | ✓   | ✓b         | ✓   | —     | —     | ✓     | —    | ✓   | ✓     | focus-within:border-ring/70 (text-edit.tsx:498); editable=false is the readonly               |
| textarea           | ✓    | —   | ✓b         | —   | ✓     | —     | ✓     | —    | —   | ~     | tested "no ring" assertion (textarea.test.tsx:42-47)                                          |
| toggle             | ✓    | ✓   | ✓g         | ✓   | ✓     | —     | —     | —    | —   | —     |                                                                                               |
| toggle-group       | ✓    | ✓   | ✓g+z       | ✓   | ✓     | —     | —     | —    | —   | —     | focus z-10 protects outline from sibling overpaint (toggle-group.tsx:165) — verified sound    |
| tooltip            | ✓    | ✓   | ✓g         | —   | —     | —     | —     | —    | —   | —     | opens on keyboard focus (tested)                                                              |
| truncated-text     | ✓    | ✓   | **✗**      | —   | —     | —     | —     | —    | —   | —     | tooltip trigger not focusable when truncated — §(b) HIGH                                      |

Focus legend: `✓g` = global outline · `✓b` = border-based local (`focus:border-ring/70` family) ·
`✓v` = virtual highlight (`data-[highlighted]:bg-accent`) · `✓r` = ring/box-shadow · `+dup` = redundant
local copy of the global rule · `+z` = z-index assist · `~` = partial.

**State-gap summary (applicable but missing/weak):** alert-dialog `loading` on Action;
field-inline `disabled`/`readonly`/`error`; bubble `disabled` for interactive bubbles; select
`loading`/`empty` options affordance (deliberate consumer-owned — document it); split-button
loading cue on the chevron half; field `readonly` hook.

---

## (b) A11y violations, ranked

### Critical — WCAG 2.4.7 Focus Visible (real, reachable suppression)

Verified mechanism (`@base-ui/react@1.6.0`, `popups/popupStoreUtils.js:45-47`,
`createDefaultInitialFocus`): Base UI focuses **the Popup element itself** when the popup has no
tabbable descendant (and on touch-open). A Popup carrying unconditional `outline-none` with no
compensating style then shows **no focus indicator at all** (the utilities layer beats the base-layer
global rule — architecture fact 2).

1. **popover.tsx:163** — `PopoverContent` Popup has `outline-none`, no compensating focus style.
   Popover has **no default close button**, so a read-only/info popover (no focusable content) opened
   by keyboard focuses the Popup with zero indicator. This is the common case, not an edge case.
2. **sheet.tsx:31** (via `sheetVariants`, applied at sheet.tsx:157) — same pattern. Reachable with
   `showCloseButton={false}` + non-interactive body (supported config, sheet.tsx:119/136), or
   touch-open. Also `sheet.tsx:152` Viewport `outline-none` (lower confidence, verify Dialog trap target).

_Same class of code, lower severity:_ **dialog.tsx:30** and **alert-dialog.tsx:127,135** carry the
identical `outline-none`-on-Popup pattern, but Dialog defaults `showCloseButton = true`
(dialog.tsx:129) and AlertDialog always renders Action/Cancel buttons — a tabbable descendant exists,
so keyboard-open lands on a control with a visible indicator. Rate **Low** today, but the fix for #1/#2
(a `focus-visible:outline-*` re-assert or border tint on the Popup class) should be applied to all four
so a future `showCloseButton={false}` Dialog doesn't regress. Note: touch-initiated focus generally
does not match `:focus-visible`, so the touch path is not itself a 2.4.7 failure — the
keyboard/no-tabbable path is.

### High

3. **sidebar.tsx:301** — collapsed rail hides the `SidebarMenuButton` label span via
   `group-data-[state=collapsed]/sidebar:[&>span:last-child]:hidden` (`display:none` → excluded from
   accessible-name computation). The documented composition (icon + `<span>Label</span>`,
   sidebar.tsx:333-337) therefore yields **unnamed icon-only nav buttons when collapsed** — invisible
   to screen readers and voice control. No aria-label/tooltip fallback exists or is enforced
   (sidebar.tsx:316-330). WCAG 4.1.2 / 2.4.4. (An `sr-only` treatment instead of `hidden`, or a
   required tooltip/label prop in collapsed mode, fixes it.)
4. **truncated-text.tsx:99-119 & 176-201 (IconText)** — when text actually overflows, the element is
   handed to `TooltipTrigger render={...}` as a bare `span`/`div` with **no `tabIndex`**. Base UI's
   `TooltipTrigger` does not inject focusability into render targets (verified in
   `TooltipTrigger.mjs`), so the full-text tooltip is unreachable by keyboard. Screen readers are
   unaffected (line-clamp is CSS-only; full text stays in the DOM), but sighted keyboard-only users
   have no path to the clipped content. WCAG 2.1.1 / 1.4.13. Contrast with **relative-time.tsx:218**,
   which does this correctly (`tabIndex={hasTooltip ? 0 : undefined}`) — reuse that pattern.

### Medium

5. **copy-button.tsx:102** — "Copied" confirmation is only an `aria-label` swap; no `aria-live`
   region, so the announcement is not guaranteed. WCAG 4.1.3. (Pattern to copy:
   auto-save-input.tsx:217-239 or password-input.tsx:122-129.)
6. **pagination.tsx:85,149-196** — boundary "disabled" prev/next relies on
   `aria-disabled:pointer-events-none aria-disabled:opacity-50` on real `<a href>` elements: mouse is
   blocked, **keyboard Enter still navigates**, and the component neither strips `href`, sets
   `tabIndex={-1}`, nor documents the contract. Announced-disabled vs. actually-operable mismatch.
   WCAG 4.1.2 / 2.1.1.
7. **image.tsx:168-175** — on load error the `<img>` (and its required `alt`) unmounts; the fallback
   wrapper carries no `aria-label={alt}`, so a non-text `fallback` leaves the broken-image state
   unnamed. WCAG 1.1.1.
8. **message-scroller.tsx:147-180 + `@shadcn/react` primitive (fn `St`)** — the scroll-to-end/start
   button defaults to `scrollTo({behavior:'smooth'})` with **no `prefers-reduced-motion` check**
   anywhere in the scroll path; the global CSS motion reset cannot touch native smooth scrolling
   (architecture fact 3). Auto-follow uses `behavior:'auto'` (fine). WCAG 2.3.3-adjacent / repo's own
   design contract ("honour prefers-reduced-motion", design-v1.md:290). Wrapper can pass
   `behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`.
9. **text-edit.tsx:209-277** — `TextEditProps` exposes only `aria-label`/`aria-describedby`; no
   `id`/`aria-labelledby`, so a **visible** external label cannot be associated with the
   contenteditable, and an omitted `aria-label` ships an unnamed `role="textbox"` (untested case).
   WCAG 4.1.2 / 3.3.2.
10. **emoji-picker.tsx:600-621** — ~300 emoji buttons in one sequential Tab chain; no roving
    tabindex/arrow-grid navigation. Operable but hostile keyboard UX (2.1.1 met; efficient-navigation
    failure in practice). Same, milder: **color-picker.tsx:174-221** (13 swatches, Tab-only).
11. **slider.test.tsx** — zero keyboard-interaction coverage (no arrow/Home/End test asserting
    `aria-valuenow` changes) despite a recent structural change to thumb positioning
    (slider.tsx:180-186). Behavior is Base UI-provided but locally unguarded.
12. **alert-dialog.tsx:252-259** — no `loading`/pending wiring on `AlertDialogAction` for async
    destructive confirms (state-completeness gap against the repo mandate).
13. **field-inline.tsx:9-50** — no `disabled`/`readonly`/`error` in the API; hosts must unmount the
    component to gate editability (state-completeness gap).

### Low (grouped)

- **`:focus` instead of `:focus-visible`** for the border-tint compensation: input.tsx:40 (+ group
  :56 `focus-within`), textarea.tsx:26, otp-input.tsx:93, select.tsx:20, command.tsx:171
  (`focus-within`), text-edit.tsx:498 (`focus-within`). Indicator also appears on mouse-click focus —
  consistent, deliberate-looking, and never a _missing_-indicator problem; `focus-within` variants
  cannot be `:focus-visible`-scoped without `:has(:focus-visible)`, so treat as accepted pattern or
  migrate the two plain `focus:` cases (input, textarea, otp, select) to `focus-visible:`.
- **JSDoc claims a "focus-visible ring" that doesn't exist** (behavior is the correct global outline):
  radio-group.tsx:149, slider.tsx:118, select.tsx:120, checkbox.tsx (doc comment), otp-input.tsx:85
  (says border-only — accurate). Fix the comments, not the code.
- **Redundant local duplicates of the global rule**: alert.tsx:152 (dismiss button), tabs.tsx:204
  (`TabsContent`). Harmless; delete or document as intentional pinning.
- **bubble.tsx:155** — the _only_ ring-based (box-shadow) focus indicator in the system
  (`focus-visible:ring-3 ring-ring/30` on interactive bubbles). WCAG-fine; inconsistent with the
  border/outline direction — see §(d) for the drop-in border alternative.
- **breadcrumb.tsx:118-126** — `role="link" aria-disabled="true"` on a non-focusable span
  (shadcn-conventional; AT behavior inconsistent rather than broken).
- **table.tsx:144-159** — `TableHead` never defaults/nudges `scope="col"`; this file's own non-a11y
  tests omit it (copy-paste hazard downstream). WCAG 1.3.1 risk in consumers.
- **markdown-view.tsx:77-90** — external links (`target="_blank"`) lack an "opens in new window"
  SR hint; markdown-view.tsx:20-73 — raw h1-h6 mapping can collide with the host page's `<h1>`.
- **pagination.tsx:209-210** — `role="presentation"` + `aria-hidden="true"` both set on Ellipsis (one suffices).
- **split-button.tsx:152-169** — `loading` shows a spinner on the primary half but only disables the
  chevron (no visual loading cue on the trigger half).
- **relative-time.tsx:184-195** — silent periodic text updates, no `aria-live`, rationale undocumented
  (defensible choice — polite live regions would be noisy — but make it an explicit JSDoc decision).
- **status-icon.tsx** — `role="img"` label swaps are not announced on in-place status transitions;
  inherent to a presentational component, but document the consumer-side `aria-live` need.
- **sheet.tsx:152** — Viewport `outline-none`; verify Base UI Dialog's trap target before dismissing.

**Explicitly verified NON-issues** (don't re-litigate): menu/listbox items' `outline-none` +
`data-[highlighted]` virtual focus (context-menu.tsx:234/288/458, dropdown-menu.tsx:192/246/416,
select.tsx:270, command.tsx:319) is the sanctioned Base UI pattern with AA-verified accent tokens;
toggle-group's `focus:z-10` (toggle-group.tsx:165) is a sound outline-clipping fix, not a decoy;
text-edit's contenteditable `outline-none` (text-edit.tsx:35) is compensated at text-edit.tsx:498;
truncated-text is a _keyboard_ problem only — screen readers get the full DOM text; skeleton/spinner/
status-icon all carry `motion-reduce:animate-none`; message-scroller's `role="log"` live region and
inert-when-hidden scroll button come correct from the primitive.

---

## (c) Test-coverage gaps

**Harness baseline:** 68/68 component test files call `expectNoA11yViolations` at least once
(verified by grep). The one file without axe is `field-form.test.tsx` (a type-contract + RHF/Zod
integration test — acceptable, but its rendered error-state DOM is also never axe'd anywhere).
`disableRules` appears in exactly 3 files — color-picker.test.tsx, sonner.test.tsx:78,
text-edit.test.tsx:223 — all `color-contrast` only, all with specific written justifications
cross-referencing the compiled-CSS gate `test/contrast.browser.test.tsx`. **All three are adequate,
none masks a real gap.**

**The systemic gap: axe is almost always run against only the default/happy state.** The repo mandate
is "every applicable UI state implemented" — but implemented ≠ audited:

| Component                    | States implemented but never axe-audited (file)                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| auto-save-input              | saving / saved / error — the component's entire purpose (auto-save-input.test.tsx:165)                      |
| field                        | error (`role="alert"` + aria-invalid) and disabled (field.test.tsx:111-118)                                 |
| command                      | `CommandDialog` (the ⌘K overlay), loading, empty (command.test.tsx:178,128,68)                              |
| checkbox                     | checked / indeterminate / disabled (checkbox.test.tsx:124)                                                  |
| button                       | loading (aria-busy + aria-disabled) / disabled (button.test.tsx:56)                                         |
| accordion                    | expanded panel (accordion.test.tsx:96)                                                                      |
| filter-bar                   | add-filter menu OPEN (portaled DOM) (filter-bar.test.tsx:171-188)                                           |
| data-list                    | loading skeleton / empty state (data-list.test.tsx:262-297)                                                 |
| date-picker                  | range / presets / disabled-dates (date-picker.test.tsx:308-316)                                             |
| context-menu, dropdown-menu  | submenu open                                                                                                |
| switch                       | checked / disabled (switch.test.tsx:69-72)                                                                  |
| tabs                         | pill variant / switched panel / vertical / disabled tab (tabs.test.tsx:126-129)                             |
| toggle, toggle-group         | pressed / multiple / disabled / vertical (toggle.test.tsx:74, toggle-group.test.tsx:185)                    |
| radio-group                  | checked / disabled / invalid (radio-group.test.tsx:96-110)                                                  |
| slider                       | range / disabled / boundary values — plus NO keyboard test at all (slider.test.tsx)                         |
| select                       | invalid / disabled trigger; no arrow/Home/End/typeahead/Escape test (select.test.tsx)                       |
| progress                     | indeterminate (progress.test.tsx)                                                                           |
| sidebar                      | collapsed — exactly where the High bug lives (sidebar.test.tsx:156-159)                                     |
| otp-input                    | invalid (`data-invalid`) / complete — zero tests, functional or axe (otp-input.test.tsx)                    |
| password-input               | revealed (`type="text"`) / aria-invalid (password-input.test.tsx:132-143)                                   |
| image                        | error / empty (image.test.tsx)                                                                              |
| input                        | aria-invalid / addon mode / disabled (input.test.tsx:86-94)                                                 |
| notification-bell            | dot mode / disabled (notification-bell.test.tsx:80-83)                                                      |
| copy-button                  | copied state (copy-button.test.tsx:80-83)                                                                   |
| text-edit                    | toolbar-active / readonly / invalid / placeholder-visible / **no-aria-label** (text-edit.test.tsx:207-224)  |
| truncated-text               | the actually-truncated + tooltip path — completely untested (truncated-text.test.tsx)                       |
| emoji-picker                 | search-filtered / empty-results (emoji-picker.test.tsx:152-160)                                             |
| state-select                 | fallback free-text-input path (state-select.test.tsx:184-198)                                               |
| sonner                       | per-variant DOM (success/error/warning/info) beyond default (sonner.test.tsx)                               |
| message-scroller             | empty thread / new-message live announcement / keyboard scroll / reduced-motion (message-scroller.test.tsx) |
| bubble, badge, avatar, alert | disabled-interactive / loading / fallback-only / non-info variants                                          |

**Best-in-class today** (use as templates): color-picker, country-select, hover-card, state-select,
tooltip (closed AND open axe'd), field-inline (3 states axe'd), alert-dialog/dialog/sheet/select
(open-state axe on `document.body`, portal-aware), separator (both semantics).

**VRT status:** `apps/docs/vrt/components.spec.ts` enumerates pages covering **all 68 components**
(sonner via `/docs/components/toast`) + 4 foundations + 2 utilities. **But zero baselines are
committed** (`components.spec.ts-snapshots/` does not exist), so `hasBaselines` is false and the whole
suite **self-skips on every PR** (components.spec.ts:20-23) — VRT is currently a no-op gate awaiting
the one-time `update_baselines` workflow_dispatch + commit (`.github/workflows/vrt.yml`). The
`packages/ui/registry/ui/__screenshots__/` PNGs are Vitest-browser incidental captures, not
assertions — **no in-test screenshot assertion exists anywhere** (grep: zero
`toHaveScreenshot|toMatchScreenshot` in unit tests). Until baselines land, nothing pixel-gates the 68
components.

**Contrast gates — what `tooling/contrast-check.mjs` verifies and misses:**

- Verifies: 15 canonical bg/fg token pairs + `{purple,destructive,success,warning,info}-text` on
  background/card/`-subtle`, both themes, dark resolved via cascade, deterministic OKLCH→WCAG math,
  fail-closed (contrast-check.mjs:16-32,57,95-104). Complemented by the rendered axe gate
  `test/contrast.browser.test.tsx` (light+dark, portal-aware, covers the 3 `disableRules` users).
- Misses: (1) **`muted-foreground` on `background`/`card`** — checked only on `muted`, yet
  `text-muted-foreground` sits on background/card in dozens of components; (2)
  **`muted-foreground-faint`** placeholder token (input.tsx:42) — checked nowhere in the token gate;
  (3) **opacity-composited colors** — `disabled:opacity-50`, `border-ring/70`,
  `destructive/70` borders, `data-pressed:bg-foreground/10` are all runtime-composited and outside
  the OKLCH math; (4) **non-text contrast (WCAG 1.4.11)** entirely — `border-input` vs background,
  the `outline-ring` focus indicator vs adjacent surfaces, switch `bg-track` vs `bg-primary`,
  checkbox borders (axe's color-contrast rule doesn't check non-text either, so nothing does);
  (5) disabled-state text (opacity-dimmed) — deliberate exemption under WCAG, but the 3:1 non-text
  expectation for disabled _borders_ on thin controls (checkbox at `opacity-50`) is unexamined.

---

## (d) Focus-indicator style table

Owner preference: no ring halos; border/outline treatments preferred — the **global outline rule is
already the preferred style**, so "outline (global)" rows need no change.

| Style                                                                | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Evidence                                                                                                                                            | Border-based alternative                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Outline (global rule)** — default, correct                         | accordion, alert*, avatar(N/A), badge, breadcrumb, button (non-outline variants), checkbox, collapsible, copy-button, data-list, empty-state, field-inline, hover-card, icon-button, label(N/A), marker, markdown-view links, message-scroller button, notification-bell, page-header, pagination, radio-group, relative-time, scroll-area viewport, settings-row(N/A), sidebar, slider thumbs, split-button, switch, table(N/A), tabs*, toggle, toggle-group (+`focus:z-10` guard), tooltip trigger, filter-bar, color-picker, date-picker day cells (via ghost Button) | base.css:16-18; per-file greps confirm no `outline-none` on these interactive elements                                                              | None needed — already the preferred treatment. (*alert.tsx:152 and tabs.tsx:204 carry redundant local copies — delete.)                                                                                                                                                 |
| **Border-based local** (outline suppressed, border tint compensates) | input (input.tsx:39-40, group :56), textarea (textarea.tsx:25-26), otp-input (otp-input.tsx:90,93), select trigger (select.tsx:20), command input (command.tsx:171,178), text-edit surface (text-edit.tsx:35,498), button `outline` variant supplement (button.tsx:23)                                                                                                                                                                                                                                                                                                   | `outline-none` + `focus:border-ring/70` / `focus-within:border-ring/70`                                                                             | Already border-based — matches preference. Optional polish: switch plain `focus:` → `focus-visible:` on input/textarea/otp/select.                                                                                                                                      |
| **Virtual highlight** (listbox/menu roving)                          | context-menu items, dropdown-menu items, select items, command items                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `outline-none` + `data-[highlighted]:bg-accent text-accent-foreground` (e.g. select.tsx:270-271)                                                    | Accepted Base UI pattern; accent pair AA-verified by contrast-check.mjs. No change.                                                                                                                                                                                     |
| **Ring-based (box-shadow)** — sole outlier                           | bubble interactive content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | bubble.tsx:155 `[button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/30` | Yes, drop-in: it already sets `focus-visible:border-ring`; delete `ring-3 ring-ring/30` (bubble has a border to tint: `border border-transparent`), or drop the whole override and let the global outline apply. Meets 2.4.11 either way.                               |
| **None (suppressed, uncompensated)** — violations                    | popover Popup (popover.tsx:163), sheet Popup (sheet.tsx:31/157) + Viewport (:152); latent same-pattern: dialog.tsx:30/146, alert-dialog.tsx:127/135                                                                                                                                                                                                                                                                                                                                                                                                                      | §(b) #1-2                                                                                                                                           | Add a border/outline re-assert on the popup class, e.g. `focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring` (identical to global) or `focus-visible:border-ring/70` on the already-bordered popup — border-based, preference-compliant. |
| **Not focusable but should be**                                      | truncated-text / IconText tooltip triggers (truncated-text.tsx:99-119,176-201)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §(b) #4                                                                                                                                             | `tabIndex={0}` when truncated (pattern: relative-time.tsx:218); indicator then comes from the global outline for free.                                                                                                                                                  |

---

## (e) Top 10 fixes (ordered by impact / effort)

1. **Re-assert focus on overlay Popups** — add the border/outline focus-visible classes to
   popover.tsx:163, sheet.tsx:31 (+:152), and preventively dialog.tsx:30, alert-dialog.tsx:135.
   One-line class additions; kills both Criticals and the latent pair. (WCAG 2.4.7)
2. **Fix collapsed sidebar naming** — sidebar.tsx:301: swap the label span's `hidden` for `sr-only`
   when collapsed (keeps accessible name, keeps visual rail clean), or require a tooltip/aria-label in
   collapsed mode; add a collapsed-state axe test. (WCAG 4.1.2)
3. **Make truncated-text keyboard-reachable** — `tabIndex={0}` on the tooltip-trigger element in
   `TruncatedText` and `IconText` when overflow engages (copy relative-time.tsx:218); add a real
   truncated + tooltip-open test. (WCAG 2.1.1 / 1.4.13)
4. **Give copy-button a real announcement** — visually-hidden `role="status" aria-live="polite"`
   span that flips to "Copied" (pattern already shipped in auto-save-input.tsx:217-239). (WCAG 4.1.3)
5. **Close the pagination boundary trap** — document + implement the disabled contract on
   Previous/Next: when `aria-disabled`, also render without `href` (or `tabIndex={-1}` +
   `onClick` guard); add a boundary test. (WCAG 4.1.2 / 2.1.1)
6. **Echo `alt` onto the image error fallback** — `aria-label={alt}` (or `role="img"` + label) on the
   fallback wrapper at image.tsx:168-175; axe-test the error state. (WCAG 1.1.1)
7. **Respect reduced motion in message-scroller** — pass
   `behavior: prefersReducedMotion ? 'auto' : 'smooth'` to the primitive's scroll button from the
   wrapper (message-scroller.tsx:147-180); the CSS reset cannot do this. (design contract §motion)
8. **Systematically axe the implemented states** — highest-value additions first: field error,
   auto-save-input all 4 states, CommandDialog open, filter-bar menu open, data-list loading/empty,
   sidebar collapsed, checkbox checked/indeterminate/disabled, switch/tabs/toggle-group/radio-group
   non-default states, button loading. Mechanical work; converts "implemented" into "audited" per the
   repo mandate. Add a slider keyboard test (arrow → `aria-valuenow`) while in there.
9. **Land the VRT baselines** — run `vrt.yml` `update_baselines`, commit
   `apps/docs/vrt/components.spec.ts-snapshots/**`; until then the entire pixel gate is a silent
   no-op across all 68 components.
10. **API completeness + hygiene sweep** — `loading` on `AlertDialogAction`;
    `disabled`/`readonly` on `FieldInline`; `id`/`aria-labelledby` on `TextEdit`; extend
    contrast-check.mjs with `muted-foreground`-on-background/card and `muted-foreground-faint`
    pairs; fix the four "focus-visible ring" JSDoc lies (radio-group.tsx:149, slider.tsx:118,
    select.tsx:120, checkbox doc); delete the two redundant local focus rules (alert.tsx:152,
    tabs.tsx:204); align bubble.tsx:155 to border-based focus.

---

_Method note: five parallel read-every-file audit passes (14+14+13+13+14 components) with a shared,
pre-verified context (global focus rule, Tailwind v4 layer-order semantics, Base UI focus-management
source, reduced-motion architecture), cross-checked against direct greps of all 68 sources and 69 test
files. Claims about Base UI/primitive behavior were verified in `node_modules`, not assumed._
