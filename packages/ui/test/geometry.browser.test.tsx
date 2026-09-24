import "./geometry.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import {
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  onTestFinished,
  test,
  vi,
} from "vitest";
import * as Preview from "@/components/preview";
import { Avatar, AvatarFallback } from "../registry/ui/avatar";
import { Badge, badgeVariants } from "../registry/ui/badge";
import { Button, buttonVariants } from "../registry/ui/button";
import { Checkbox } from "../registry/ui/checkbox";
import { Chip } from "../registry/ui/chip";
import { EditableCell } from "../registry/ui/editable-cell";
import { Kbd } from "../registry/ui/kbd";
import { navigationMenuTriggerStyle } from "../registry/ui/navigation-menu";
import { stepperNodeVariants } from "../registry/ui/stepper";
import { Switch } from "../registry/ui/switch";
import { Tag, TagGroup } from "../registry/ui/tag-group";
import { Toggle, toggleVariants } from "../registry/ui/toggle";
import { ToolCallChip } from "../registry/ui/tool-call-chip";
import { DataGrid, type DataGridColumn } from "../registry/ui/data-grid";
import { DataList, type DataListColumn } from "../registry/ui/data-list";
import { DataListPager } from "../registry/ui/data-list-pager";
import { InputGroup, InputGroupInput } from "../registry/ui/input-group";
import { SortableList } from "../registry/ui/sortable-list";
import contracts from "../component-contracts.json";
import {
  dynamicMountCount,
  pendingDynamicImports,
  resetDynamicTracking,
} from "./next-dynamic-stub";

/**
 * The behaviour contracts, over the preview fixtures, with compiled token CSS.
 *
 * WHAT THIS IS
 *   The three assertions that `apps/docs/vrt/contracts.spec.ts` ran against the static docs
 *   export under `@playwright/test`, moved verbatim in substance onto the fixtures themselves:
 *
 *     1. 320px reflow      the document does not scroll horizontally at the narrowest
 *                          supported viewport (WCAG 2.2 §1.4.10).
 *     2. RTL containment   the same, with `dir="rtl"` on the document element.
 *     3. 24px target floor the effective pointer target of every interactive control is at
 *                          least 24×24 (WCAG 2.2 §2.5.8) AND nothing else owns the interior of
 *                          that centred square.
 *
 *   Nothing here needs Next, a docs build, a served route, or a second test runner. The fixture
 *   IS the component's public composition, so mounting it directly asserts the same geometry the
 *   route asserted, minus the docs chrome — which was never the component's contract.
 *
 * WHAT WAS DELIBERATELY DROPPED, AND WHY
 *   - The dark and forced-colors lanes. Neither ever produced a finding. Dark surfaces stay
 *     covered by `contrast.browser.test.tsx`, which runs axe over real compiled colors in both
 *     themes.
 *   - The forced-colors focus check. Measured 2026-07-25 to be UNABLE TO FAIL: it ran under
 *     `forcedColors: "active"`, where Chromium paints its own ≥2px ring, so deleting the design
 *     system's `:focus-visible` rule left all 864 checks green — and its fallback branch was
 *     unconditionally true too, because forced-colors repaints borders on focus. See
 *     `docs/ledger/bugs.md`, 2026-07-25. It is REPLACED, not carried, by assertion (4) below,
 *     which measures the design system's OWN ring in normal colours and rejects the user agent's
 *     (`outline-style: auto`) explicitly — the exact substitution the old check could not see.
 *
 *     PROVED NON-VACUOUS, 2026-09-09. Deleting the one rule
 *     `:focus-visible { @apply outline-2 outline-offset-1 outline-ring }` from
 *     `packages/design-tokens/src/base.css` and rebuilding the token package turns 262 of this
 *     file's fixtures RED, each naming `outline-style: auto`; restoring it returns a clean sweep.
 *     The check it replaces stayed 864/864 green under the same deletion. Re-run that experiment
 *     before trusting any future edit to `focusIndicatorProblem`.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * SEMANTIC DIFFERENCES FROM THE OLD LANE — read before comparing coverage claims
 *
 *   1. ALL FIXTURES, NOT FIRST-PER-ROUTE. `contracts.spec.ts` measured
 *      `page.locator("[data-vrt-preview]").first()` — the FIRST demo on each of 111 component
 *      routes, plus a hand-maintained `EXTRA_TARGET_FIXTURES` list. This file mounts every
 *      export of the preview barrel: ~4.6× the compositions. The direct consequence is the
 *      `EXCLUDED` map below — fixtures that fail under assertions carried over verbatim, which
 *      the route lane structurally could not see.
 *
 *   2. FIXTURE-LOCAL CONTROLS, NOT BODY-WIDE. The route lane queried the whole docs page and
 *      relied on the docs chrome being excluded by hand; here the query root is the render's
 *      `baseElement`, so it covers the fixture plus anything it portals (Dialog, Popover,
 *      Toaster) and nothing else. Docs navigation, sidebar and TOC controls are simply not
 *      present — they were never the component's contract, and they are asserted by nothing
 *      here.
 *
 *   3. CSS MOTION SUPPRESSION, NOT `reducedMotion` EMULATION. The route lane called
 *      `emulateMedia({ reducedMotion: "reduce" })`, which makes `prefers-reduced-motion` MATCH,
 *      so the token stylesheet's own reduced-motion block applies. This lane instead forces the
 *      same end state from `geometry.css` (see the block at the end of that file), because the
 *      vitest Playwright provider's `contextOptions` are run-wide and setting the media
 *      emulation turns `contrast.browser.test.tsx` red. The end state is the same — animations
 *      and transitions collapse to 0.01ms — but `matchMedia("(prefers-reduced-motion: reduce)")`
 *      reports FALSE here, so any component that branches in JS on that query takes its
 *      full-motion path. No current component does; if one is added, this lane measures its
 *      animated branch at rest, not its reduced-motion branch.
 *
 *   4. FONTS. Fonts come from this test page, not `next/font`, so glyph metrics are not
 *      pixel-identical to the docs route. Both surviving assertions tolerate that by
 *      construction — they are a `<= +1px` bound and a `>= 24px` floor, never an equality.
 */

// ── exclusions ──────────────────────────────────────────────────────────────────────────────────

type Assertion = "reflow" | "rtl" | "target" | "focus";

/**
 * Fixtures excluded from ONE assertion each, with the reason and the measurement behind it.
 *
 * Exclusions are PER ASSERTION on purpose. A single flat exclusion list (the first version of
 * this file) dropped a fixture from all three contracts at once, so a component that only misses
 * the 24px floor silently stopped being checked for 320px reflow and RTL containment as well.
 *
 * Two guards keep the map honest, and both live in the sweep rather than in a separate meta test
 * so they cannot be satisfied by a fixture that never ran:
 *
 *   1. STALE NAME — an entry naming a fixture that is not in the preview barrel fails
 *      "the exclusion map has no stale entries" below.
 *   2. STALE EXEMPTION — an excluded assertion is still EXECUTED, in expect-failure mode. If it
 *      now passes, the fixture's test FAILS with "the exclusion is stale". So an exclusion
 *      cannot outlive the defect it records: fixing the component forces deleting the entry.
 *
 * Every measurement below was re-taken on 2026-09-09, by deleting the entry and reading what the
 * lane actually reports — the only honest way to read one, and the reason the numbers here are not
 * the ones recorded on 2026-09-08: those predate M2's fix to `test/geometry.css`, which had been
 * compiling every custom `@utility` to an empty rule. Guard 2 earned its keep on the first run: `comboboxMultiple` (recorded as a 16×16 chip remove — it measures
 * 24.00×24.00 now that the Chip primitive owns that control) and `chartDemoDonut` (recorded as a
 * donut `<g role="button">` the rectangular probe could not express — no such control matches
 * `INTERACTIVE_SELECTOR` at all; the only interactive node is the 270×256 `<svg>`, which passes)
 * were both exempting assertions that PASS. A flat list would have carried both indefinitely.
 */
const EXCLUDED: Record<string, Partial<Record<Assertion, string>>> = {
  // The focus-indicator group that used to head this map is GONE, not forgotten: #100 landed the
  // text-entry border tint and all ten entries were deleted with it (`docs/ledger/bugs.md`,
  // 2026-09-09). Its comment outlived the entries by one PR and is deleted here too — a comment
  // describing ten exclusions that do not exist reads as known-broken coverage that nobody owns.
  // ── 24px obstruction ──────────────────────────────────────────────────────────────────────
  // The control is big enough, but something else owns the interior of the centred 24px square:
  // `elementFromPoint` resolves the probe points to another element. Miss counts are out of the
  // five points probed (four edges of the centred square, plus its centre).
  //
  // ONE entry left, and it is ACCEPTED rather than outstanding — MK, 2026-09-09. The `timeline`
  // entry that stood beside it was closed the same day by `group-last/timeline-item:pb-1`.
  //
  // This is the one shape of "obstruction" the probe reports that is not a defect, so read the
  // reasoning before adding a second one like it: two targets genuinely cannot both own the same
  // pixel, and WCAG 2.2 §2.5.8 does not ask them to. Its key-terms note is explicit — "if two or
  // more targets are overlapping, the overlapping area should not be included in the measurement
  // of the target size" — so the SC measures each target's MINIMUM BOUNDING BOX with the shared
  // area removed; it never requires an unobstructed centred square. This probe does require one,
  // deliberately, because that stricter shape is what catches a control buried under an overlay
  // (`attachmentImageThumbnail`, 2026-09-09, was genuinely unclickable). The right answer to the
  // gap between the two is a named exclusion here, never a looser probe.
  // `resizableNested` used to live here: an ACCEPTED overlap where the nested horizontal handle's
  // own 24px hit area crossed the outer vertical one at a T-junction (MK 2026-09-09,
  // `docs/ledger/bugs.md`, which keeps the reasoning). Batch 5 of the shadcn reset rebuilt that
  // fixture from upstream's own nested example, where the inner group sits INSIDE a panel and the
  // two handles no longer cross — so the assertion passes and guard 2 above demanded the entry be
  // deleted rather than carried as a defect nobody owns. If two handles ever cross again, this map
  // is where that measurement goes back.
  //
  // Two entries came back on 2026-09-18, Batch 6 of the shadcn reset, and they are the SAME
  // ACCEPTED OVERLAP the paragraph above describes — two adjacent targets that both meet the SC
  // and therefore cannot both own the pixel between them.
  //
  // Measured, in this lane: upstream's `AttachmentActions` sets no gap in the horizontal
  // orientation, so two `AttachmentAction`s sit flush. In `attachmentStates` the error row's pair
  // lays out at L=332 R=356 and L=356 R=380, both exactly 24.00×24.00; probing "Retry upload" at
  // its own right edge (355.5, half a pixel inside) resolves to "Remove financial-model.xlsx".
  // `attachmentTrigger` is the identical shape with "Copy link" beside "Remove".
  //
  // That is not an SC 2.5.8 failure: both targets ARE 24×24, which satisfies the size requirement
  // outright, and the SC's key-terms note removes the shared area from the measurement rather than
  // demanding an unobstructed square. The spacing clause applies only to targets UNDER 24px. This
  // probe asks for the stricter shape on purpose (it is what catches a control buried under an
  // overlay), so the gap between the two is recorded here rather than dissolved by loosening it.
  // The SIZE half of the contract still runs — only the obstruction sweep is exempted — and
  // `attachment.test.tsx` measures both actions at 24×24 directly.
  //
  // Making these pass would mean putting a gap on `AttachmentActions`, which is a patch hunk with
  // no decision ID behind it, or removing the second action from upstream's own documented
  // examples. Both are worse than the entry.
  attachmentStates: {
    target:
      "two flush 24×24 AttachmentActions (Retry at L=332 R=356, Remove at L=356 R=380): the " +
      "right-edge probe at 355.5 resolves to the neighbour. Accepted overlap — both targets meet " +
      "SC 2.5.8 on size, and the SC excludes shared area from the measurement.",
  },
  attachmentTrigger: {
    target:
      "the same flush pair (Copy link beside Remove, 24×24 each, no gap in AttachmentActions' " +
      "horizontal orientation). Accepted overlap, identical reasoning to attachmentStates.",
  },
};

/**
 * The one fixture that is not swept AT ALL, because it cannot be measured deterministically.
 *
 * This is a different category from `EXCLUDED`: there is no assertion to run in expect-failure
 * mode, because the fixture's geometry is not stable enough to assert either way. Kept as a
 * separate map so it can never be confused with a recorded defect, and guarded against staleness
 * by the same name check.
 */
const UNSWEPT: Record<string, string> =
  contracts.affectedTestPolicy.geometryUnswept;

/**
 * Fixtures that mount a `next/dynamic` component, and the DOM that proves the REAL component —
 * not the loading fallback — is what got measured. See `waitForDynamicDom`.
 *
 * Not optional: a fixture that mounts a dynamic component with no entry here fails. The stub
 * counts its own mounts, so this map cannot silently fall behind the fixtures.
 */
const DYNAMIC_DOM: Record<string, string> = {
  // TextEdit is `next/dynamic`-wrapped to keep Tiptap out of the docs barrel's initial module
  // graph. `.tiptap` is the class the component puts on ProseMirror's contenteditable host
  // (`EDITOR_PROSE` in `registry/ui/text-edit.tsx`), so it appears only once the editor view is
  // actually created — which is the thing whose geometry these contracts measure.
  textEdit: ".tiptap[contenteditable]",
  textEditStates: ".tiptap[contenteditable]",
  textEditInvalid: ".tiptap[contenteditable]",
  textEditSubmit: ".tiptap[contenteditable]",
  textEditHeights: ".tiptap[contenteditable]",
};

type Fixture = () => React.ReactNode;

const ALL_FIXTURES = Object.entries(Preview).filter(
  (entry): entry is [string, Fixture] => typeof entry[1] === "function",
);

const requestedFixtureNames = (() => {
  const raw = (
    import.meta as ImportMeta & {
      env: Record<string, string | undefined>;
    }
  ).env.VEGASTACK_GEOMETRY_FIXTURES?.trim();
  if (!raw) return null;
  return new Set(
    raw
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );
})();

const SWEPT_FIXTURES = ALL_FIXTURES.filter(([name]) => !(name in UNSWEPT));
const FIXTURES = SWEPT_FIXTURES.filter(
  ([name]) => requestedFixtureNames === null || requestedFixtureNames.has(name),
).sort(([a], [b]) => a.localeCompare(b));

test("the requested geometry fixture selection is valid", () => {
  if (requestedFixtureNames === null) return;
  const known = new Set(ALL_FIXTURES.map(([name]) => name));
  const swept = new Set(SWEPT_FIXTURES.map(([name]) => name));
  const unknown = [...requestedFixtureNames].filter((name) => !known.has(name));
  const unswept = [...requestedFixtureNames].filter(
    (name) => known.has(name) && !swept.has(name),
  );
  expect(
    unknown,
    "VEGASTACK_GEOMETRY_FIXTURES names fixture exports that do not exist in the preview barrel",
  ).toEqual([]);
  expect(
    unswept,
    "VEGASTACK_GEOMETRY_FIXTURES selected fixtures that are explicitly UNSWEPT",
  ).toEqual([]);
  expect(
    FIXTURES.length,
    "VEGASTACK_GEOMETRY_FIXTURES selected no swept fixtures; targeted geometry must never pass vacuously",
  ).toBeGreaterThan(0);
});

test("the exclusion map has no stale entries", () => {
  const known = new Set(ALL_FIXTURES.map(([name]) => name));
  const missing = [
    ...Object.keys(EXCLUDED),
    ...Object.keys(UNSWEPT),
    ...Object.keys(DYNAMIC_DOM),
  ].filter((name) => !known.has(name));
  expect(
    missing,
    "EXCLUDED / UNSWEPT / DYNAMIC_DOM names a fixture that no longer exists in the preview " +
      "barrel. Delete the entry — a stale exemption silently drops a component from the " +
      "geometry contracts.",
  ).toEqual([]);
});

test("the preview barrel actually resolved", () => {
  // A broken alias or a barrel that failed to load would make `FIXTURES` empty and every
  // assertion below vacuous. Fail loudly instead of reporting a green sweep over nothing.
  expect(
    ALL_FIXTURES.length,
    "the preview barrel resolved to fewer than 100 fixtures — the alias is broken or the barrel " +
      "failed to load, and every geometry assertion in this file is running over nothing",
  ).toBeGreaterThan(100);
});

// ── the 24px effective-target probe (ported verbatim in substance from contracts.spec.ts) ───────

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  'input:not([type="hidden"])',
  "select",
  "textarea",
  "summary",
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Prove the effective pointer target, including an invisible `::before`/`::after` expansion.
 * A bounding-box-only assertion cannot see those pseudo-elements and previously produced false
 * failures (or encouraged visually oversized controls). Each point sits just inside the required
 * centred 24px target and must resolve back to the control through `elementFromPoint`.
 *
 * Unchanged from the Playwright original except that it runs directly in the test realm rather
 * than through `locator.evaluate` — the assertions and every constant are the same.
 */
function effectiveTargetProbe(element: Element) {
  // Base UI keeps the semantic range input visually hidden inside the
  // draggable thumb; pointer ownership belongs to that visible thumb. Input
  // groups likewise own the padded field surface around their nested input.
  const pointerOwner =
    (element.matches('input[type="range"]') &&
      element.closest('[data-slot="slider-thumb"]')) ||
    (element.matches('input[role="combobox"]') &&
      element.closest('[data-slot="combobox-input-group"]')) ||
    element;
  const rect = pointerOwner.getBoundingClientRect();
  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;
  // The 24px floor is checked as TWO independent facts, because one probe cannot express both:
  //
  //   1. SIZE — is the control itself at least 24×24? Asserted on the geometry below, where a
  //      sub-pixel shortfall is unambiguous.
  //   2. OBSTRUCTION — does anything else own the interior of the centred 24px square? Asserted
  //      by hit-testing, which is where an overlay or a clipped ::before hit-area shows up.
  //
  // Hit testing alone cannot carry (1). Blink hit-tests against PIXEL-SNAPPED bounds, so for a
  // fractionally positioned control (here top 394.265625, bottom 418.265625) the final fraction
  // of a pixel resolves to the PARENT: ownership was measured to flip between 0.25px and 0.5px
  // inside the bottom edge. Probing at a hair's inset therefore reported a miss for perfectly
  // sized 24px controls (attachment, code-block, filter-bar, text-edit) — always
  // on the right/bottom edge, never left/top, the signature of snapping
  // rather than a real defect. An earlier 0.001px inset failed for the same reason and was
  // additionally below LayoutUnit precision (1/64 px) entirely.
  //
  // So the obstruction probe insets a full half-pixel, landing on an unambiguous pixel centre,
  // and size is measured separately instead of being inferred from it.
  const OBSTRUCTION_INSET = 0.5;
  const halfTarget = 12 - OBSTRUCTION_INSET;
  const points = [
    [centerX - halfTarget, centerY],
    [centerX + halfTarget, centerY],
    [centerX, centerY - halfTarget],
    [centerX, centerY + halfTarget],
    [centerX, centerY],
  ];
  const ownsHit = (hit: Element | null) => {
    if (!hit) return false;
    if (hit === pointerOwner || pointerOwner.contains(hit)) return true;
    const label = hit.closest("label") as HTMLLabelElement | null;
    if (!label) return false;
    // `HTMLLabelElement.control` resolves only for NATIVE form controls. Base UI renders a
    // checkbox, radio and switch as `<span role="…">`, so `control` is null for exactly the
    // controls whose 24px hit area most often reaches under their own label — and the branch below
    // was dead for all of them. `htmlFor` is the same association, read directly. Clicking the
    // label activates the control, so the label owning the pixel is not an obstruction.
    if (label.control === element) return true;
    return label.htmlFor !== "" && label.htmlFor === element.id;
  };
  return {
    rect: { width: rect.width, height: rect.height },
    // Fact (1): the control's own effective target. `-inset-*` hit areas legitimately extend a
    // small glyph, so measure the union of the border box and the ::before/::after hit area
    // rather than the border box alone.
    effective: (() => {
      let { left, top, right, bottom } = rect;
      for (const pseudo of ["::before", "::after"]) {
        const style = getComputedStyle(pointerOwner, pseudo);
        if (style.content === "none" || style.position !== "absolute") continue;
        const parse = (value: string) =>
          value.endsWith("px") ? Number.parseFloat(value) : Number.NaN;
        const [t, r, b, l] = [
          style.top,
          style.right,
          style.bottom,
          style.left,
        ].map(parse) as [number, number, number, number];
        if ([t, r, b, l].some(Number.isNaN)) continue;
        // Negative inset values grow the box outward.
        left = Math.min(left, rect.left + l);
        top = Math.min(top, rect.top + t);
        right = Math.max(right, rect.right - r);
        bottom = Math.max(bottom, rect.bottom - b);
      }
      return { width: right - left, height: bottom - top };
    })(),
    misses: points
      .map(([x, y]) => ({
        x: x!,
        y: y!,
        hit: document.elementFromPoint(x!, y!),
      }))
      .filter(({ hit }) => !ownsHit(hit))
      // `Element`, not `HTMLElement`: an SVG node is neither, and reporting it as `null` reads
      // as "nothing was there" when in fact an ancestor `<svg>` owned the point. That misread
      // cost a diagnosis once; keep the wider type.
      .map(({ x, y, hit }) => ({
        x,
        y,
        hit: hit instanceof Element ? hit.outerHTML.slice(0, 160) : null,
      })),
  };
}

// ── the focus-indicator probe (assertion 4) ─────────────────────────────────────────────────────

/**
 * A CSS outline style that somebody AUTHORED. `auto` is deliberately excluded: it is the user
 * agent's own focus ring, and accepting it is exactly how the predecessor check became unable to
 * fail. Measured 2026-09-09 in this lane: with `@vegastack/design-tokens/base.css`'s
 * `:focus-visible { @apply outline-2 outline-offset-1 outline-ring }` in place a focused Button
 * computes `outline-style: solid`; with that one rule deleted and the token package rebuilt, the
 * same Button computes `outline-style: auto` — same element, same width, same colour. `auto` vs an
 * authored style is the ONLY signal that separates the design system's ring from Chromium's, so it
 * is the signal this assertion is built on.
 */
const AUTHORED_OUTLINE =
  /^(?:solid|dashed|dotted|double|groove|ridge|inset|outset)$/;

/**
 * The TEXT-ENTRY set, for which branch (A) is not an acceptable answer (2026-09-09).
 *
 * AGENTS.md § Accessibility: "visible `:focus-visible` (text-entry fields use a border tint
 * instead)". These controls carry `outline-hidden` precisely so the global ring does NOT paint on
 * them, and the border tint is their whole affordance. The generic predicate below accepted
 * whichever branch happened to be true, so a text-entry control that had LOST its `outline-hidden`
 * passed on the ring it is not supposed to have: the retired `otp-input`'s slot measured
 * `outline-style: solid / 2px` here and this assertion went green, because a class-glue defect had
 * destroyed `outline-hidden` and handed it branch (A). Pinning the set to branch (B) — and
 * asserting `outline-style: none` outright — is what makes that visible.
 *
 * `select-trigger` is deliberately NOT in this set, though the finding that produced this change
 * listed it. Measured 2026-09-09: a focused `[data-slot=select-trigger]` computes
 * `outline-style: solid`, `outline-width: 2px`. That is by design and documented on the component
 * ("button-style trigger: the centralized base.css `:focus-visible` outline also applies for
 * keyboard nav", select.tsx) — it wears `"rounded-lg border border-input bg-transparent transition-colors outline-none placeholder:text-muted-foreground focus:border-ring not-focus:aria-invalid:border-destructive not-focus:data-invalid:border-destructive disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80"` for its CHROME while remaining a button.
 * Adding it here would fail a correct control.
 */
const TEXT_ENTRY_SLOTS =
  "[data-slot=input],[data-slot=textarea],[data-slot=field-control]," +
  "[data-slot=combobox-input]," +
  // Batch 3 of the shadcn reset added upstream's `input-otp`, whose real control is ONE hidden
  // input behind the slots, and `input-group-control`, which is the `Input`/`Textarea` inside an
  // `InputGroup`. Both are text entry: they suppress the global ring and signal focus with a
  // border tint on a carrier — the active slot for the OTP, the group for the input group.
  // `command-input` is cmdk's input inside an `InputGroup`; upstream gives it its own slot name,
  // so it needs naming here too, and `input-group.tsx` carries the matching tint selector.
  "[data-slot=input-otp],[data-slot=input-group-control],[data-slot=command-input]," +
  // Batch 6 added upstream's `questionnaire`, whose freeform answer field is text entry with the
  // same treatment `input` takes: `outline-hidden` suppresses the global ring and `focus:border-ring/70`
  // is the whole affordance, so it must be held to branch (B) rather than an outline it should not have.
  "[data-slot=questionnaire-input]";

/**
 * The wrapper that owns a text-entry control's focus affordance, if any.
 *
 * AGENTS.md § Accessibility: "visible `:focus-visible` (text-entry fields use a border tint
 * instead)". The tint is applied by `fieldSurface` / `fieldGroupSurface` in `@vegastack/design` —
 * `focus:border-ring/70` on the control, `focus-within:border-…` on the group —
 * so the element whose border changes may be an ancestor of the focused control.
 */
function tintCarriers(control: Element): Element[] {
  const carriers: Element[] = [control];
  // Walk a bounded way up. The tint sits on whichever element owns the field SURFACE, and that is
  // not always one hop: an input group puts it on the padded wrapper around the control, a Field
  // puts it on `[data-field-group]`, TextEdit on `[data-slot="text-edit"]`, and a bare Input on
  // the control itself. Three ancestors covers every arrangement in the registry without reaching
  // out of the field and into page layout, where a border change would mean something else.
  let ancestor = control.parentElement;
  for (let depth = 0; depth < 3 && ancestor; depth++) {
    carriers.push(ancestor);
    ancestor = ancestor.parentElement;
  }
  // An OTP field's tint lands on the ACTIVE SLOT, which is a SIBLING of the hidden input rather
  // than an ancestor of it: one input drives every slot, and the slot the caret is in carries
  // `data-active` and with it `border-ring/70`. Walking ancestors can never see that, so the
  // slots of the control's own container join the carrier set.
  if (control.matches('[data-slot="input-otp"]')) {
    const container =
      control.closest(".cn-input-otp") ?? control.parentElement ?? control;
    carriers.push(
      ...container.querySelectorAll('[data-slot="input-otp-slot"]'),
    );
  }
  return carriers;
}

type FocusSignature = { outlineStyle: string; borders: string[] };

const focusSignature = (control: Element): FocusSignature => ({
  outlineStyle: getComputedStyle(control).outlineStyle,
  borders: tintCarriers(control).map(
    (element) => getComputedStyle(element).borderColor,
  ),
});

/**
 * Does this control present a focus indicator? Returns `null` when it does, or the reason it does
 * not — worded so the reader can tell WHICH of the two sanctioned affordances was expected.
 *
 * Two branches, both of them non-vacuous:
 *
 *   (A) an AUTHORED outline of at least 2px. Deleting the design system's `:focus-visible` rule
 *       collapses this to `auto` (the user agent's ring), which is rejected.
 *   (B) the sanctioned text-entry border tint: the control, its field group, or its immediate
 *       wrapper changes `border-color` between rest and focus. Deleting the tint from
 *       `fieldSurface` collapses this to an unchanged colour, which is rejected.
 *
 * There is no third branch and no fallback. The predecessor check had one ("forced colours repaints
 * borders on focus") that was unconditionally true, which is what made the whole assertion vacuous.
 *
 * The branches are NOT interchangeable (2026-09-09). For {@link TEXT_ENTRY_SLOTS} only (B) counts,
 * and `outline-style` must additionally be `none`: those controls suppress the global ring on
 * purpose, so an outline on one is a defect rather than an alternative affordance. Letting (A)
 * answer for them is how a destroyed `outline-hidden` on the OTP slot passed this very assertion.
 */
function focusIndicatorProblem(
  control: Element,
  rest: FocusSignature,
): string | null {
  const style = getComputedStyle(control);
  const width = Number.parseFloat(style.outlineWidth);
  const textEntry = control.matches(TEXT_ENTRY_SLOTS);

  // Text entry takes branch (B) and ONLY branch (B) — and must first prove it is not wearing the
  // ring it suppresses. What counts as suppressed is what PAINTS NOTHING: `outline-hidden` computes
  // as `outline-style: none`, and a control whose engine writes its own inline suppression (the
  // `input-otp` package writes `outline: transparent solid 0px`) computes as a solid outline of
  // zero width in a transparent colour. Both are "no ring"; anything with real width and a real
  // colour means the suppression was lost.
  const outlineWidth = Number.parseFloat(style.outlineWidth);
  const outlineIsInvisible =
    style.outlineStyle === "none" ||
    !(outlineWidth > 0) ||
    /,\s*0\s*\)$/.test(style.outlineColor);
  if (textEntry && !outlineIsInvisible) {
    return (
      `is a text-entry control painting outline-style "${style.outlineStyle}" ` +
      `(${style.outlineWidth}, ${style.outlineColor}). Text entry suppresses the global ` +
      `:focus-visible ring and signals focus with the border tint instead (AGENTS.md ` +
      `\u00a7 Accessibility) — a painted outline here means the suppression was lost`
    );
  }
  if (!textEntry && AUTHORED_OUTLINE.test(style.outlineStyle) && width >= 2)
    return null;

  const focused = focusSignature(control);
  if (focused.borders.some((border, index) => border !== rest.borders[index]))
    return null;

  if (textEntry)
    return (
      `is a text-entry control with no border tint on focus: no border-colour change on the ` +
      `control, its [data-field-group], or its wrapper. The tint IS the affordance for this set ` +
      `(AGENTS.md \u00a7 Accessibility), and the global ring is suppressed here`
    );
  return style.outlineStyle === "auto"
    ? `presents only the USER AGENT's focus ring (outline-style: auto, ${style.outlineWidth}). ` +
        `The design system's own ring is missing, and the browser's is not the contract — a ` +
        `forced-colors or non-Chromium user gets nothing. Expected an authored >=2px outline ` +
        `from :focus-visible, or the text-entry border tint`
    : `presents no focus indicator: outline-style "${style.outlineStyle}" (${style.outlineWidth}) ` +
        `and no border-colour change on the control, its [data-field-group], or its wrapper`;
}

/**
 * Freeze transitions for the duration of the focus sweep, and return the undo.
 *
 * WHY: `getComputedStyle` immediately after `element.focus()` reports the value the transition
 * STARTS from, not the one it settles on — and a running colour transition serialises in its
 * interpolation space, so a field whose tint genuinely lands read back as
 * `oklab(0.145 … / 0.08)` where its resting `border-input` read `oklch(0.145 0.003 75 / 0.08)`.
 * Same colour, different string. Measured 2026-09-09: one frame later the same element reads
 * `oklab(0.353 … / 0.7)`, the tint.
 *
 * A string comparison over those two values is not FALSE — a transition only runs when the value
 * really changes — but it makes the assertion pass on a serialisation artefact rather than on the
 * colour, and it would go quiet the day a `transition-none` fixture appeared. Freezing beats
 * waiting a frame per control: this file sweeps 554 fixtures, and a rAF per focusable control is
 * thousands of frames of runtime for the same fact.
 */
function freezeTransitions() {
  const style = document.createElement("style");
  style.textContent = "*, *::before, *::after { transition: none !important; }";
  document.head.append(style);
  return () => style.remove();
}

/**
 * The signature of a control with NOTHING focused — the honest baseline.
 *
 * Blurring first is load-bearing, not hygiene. The sweep walks a fixture's controls in document
 * order without releasing focus, so a control measured after a SIBLING inside the same field
 * surface inherits that sibling's `focus-within` tint as its "rest" — and then focusing it changes
 * nothing, and a component with a perfectly good indicator is reported as having none. TextEdit is
 * the reference case: its formatting toolbar lives inside `[data-slot="text-edit"]`, the element
 * that carries the tint, so the editor itself measured as unindicated behind every toolbar button.
 */
function restSignature(control: HTMLElement): FocusSignature {
  (document.activeElement as HTMLElement | null)?.blur?.();
  return focusSignature(control);
}

// ── helpers ─────────────────────────────────────────────────────────────────────────────────────

/**
 * Let layout settle. Two frames rather than one: the first flushes React's commit into style and
 * layout, the second lets any effect scheduled by that commit (a measured popover position, a
 * `ResizeObserver` callback) land before anything is measured.
 */
const settle = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

/**
 * Failure-only geometry detail. `scrollWidth` identifies the fact but not its owner, which made the
 * WebKit-only Dropzone overflow look like three different paint defects in succession. Keep this
 * eager with the first measurement, just like the headline numbers below, and cap it so a failure
 * remains readable in an Actions annotation.
 */
function horizontalOverflowDetail() {
  const root = document.documentElement;
  const edge = root.clientWidth;
  const candidates = [
    document.body,
    ...document.body.querySelectorAll<HTMLElement>("*"),
  ]
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const ownOverflow = element.scrollWidth > element.clientWidth + 1;
      const outsideViewport = rect.left < -1 || rect.right > edge + 1;
      if (!ownOverflow && !outsideViewport) return null;
      const slot = element.getAttribute("data-slot");
      const label = `${element.tagName.toLowerCase()}${slot ? `[data-slot=${slot}]` : ""}`;
      return (
        `${label} rect=${rect.left.toFixed(1)}..${rect.right.toFixed(1)} ` +
        `client/scroll=${element.clientWidth}/${element.scrollWidth}`
      );
    })
    .filter((value): value is string => value !== null)
    .slice(0, 8);
  const dropzone = document.querySelector<HTMLElement>(
    '[data-slot="dropzone"]',
  );
  const stroke = dropzone ? getComputedStyle(dropzone, "::after") : null;
  return (
    `; candidates=${candidates.join(" | ") || "none"}` +
    (dropzone && stroke
      ? `; dropzone=${dropzone.clientWidth}/${dropzone.scrollWidth}, ` +
        `after inset=${stroke.top}/${stroke.right}/${stroke.bottom}/${stroke.left}, ` +
        `box=${stroke.boxSizing}, border=${stroke.borderTopWidth}`
      : "")
  );
}

/**
 * The 320px containment fact, polled.
 *
 * Polling is not defensive padding — it is what the Playwright original did (`expect.poll`), and
 * it is load-bearing for the same reason: a fixture that measures itself asynchronously
 * (recharts' `ResponsiveContainer`, anything on a `ResizeObserver`) renders once at an intrinsic
 * width before its first measurement lands. Observed 2026-09-08: `chartDemoTooltipVariants`
 * reported `scrollWidth 345` on a loaded machine and 320 on an idle one, from the same tree.
 * Polling reads the settled layout on both; a genuine overflow never settles, so it still fails
 * — it just costs the poll timeout to do so.
 */
async function expectContained(name: string, lane: string) {
  await expect
    .poll(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
      {
        // Built eagerly, so the numbers are the FIRST measurement — the one taken before the
        // poll started. That is the useful one to read: if the poll went on to fail, the layout
        // never moved off it.
        message:
          `${name} overflows horizontally at 320px${lane} ` +
          `(first measured scrollWidth ${document.documentElement.scrollWidth} > clientWidth ${document.documentElement.clientWidth})` +
          horizontalOverflowDetail(),
      },
    )
    .toBe(true);
}

/**
 * Containment INSIDE the data surfaces, which `expectContained` cannot see.
 *
 * `expectContained` measures the document. Upstream `Table` wraps every table in an
 * `overflow-x-auto` `table-container`, so a table scrolling sideways inside its own container
 * leaves the document untouched and passes by construction — which is exactly how a mono first
 * column scrolling a DataList 390px wide inside a 320px container stayed green here (review round
 * 1, 2026-09-23). A pager whose page list overhangs its own box is invisible to it the same way
 * whenever the surface around it clips. So the two promises are measured on the boxes that make
 * them:
 *
 *   - DataList "never forces a horizontal scroll": its `table-container` and its root stack.
 *   - DataListPager "never scrolls sideways": its root, and every control inside its box.
 */
function dataSurfaceOverflow(root: ParentNode): string[] {
  const problems: string[] = [];
  const own = (element: Element, label: string, slack = 1) => {
    if (element.scrollWidth > element.clientWidth + slack)
      problems.push(
        `${label} scrolls: scrollWidth ${element.scrollWidth} > clientWidth ${element.clientWidth}`,
      );
  };
  for (const table of root.querySelectorAll('[data-slot="data-list"]')) {
    own(table.parentElement!, "DataList table-container");
    const stack = table.closest('[data-slot="data-list-root"]');
    if (stack) own(stack, "DataList root");
  }
  for (const pager of root.querySelectorAll('[data-slot="data-list-pager"]')) {
    // Zero slack, and from fractional rects: a three-digit slot made the compact list 241px in a
    // 240px pager, with Next 1px outside, and a 1px tolerance here could never see it (round 3).
    own(pager, "DataListPager root", 0);
    const box = pager.getBoundingClientRect();
    for (const part of pager.querySelectorAll(
      '[data-slot="data-list-pager-nav"], [data-slot="pagination-link"], ' +
        '[data-slot="data-list-pager-position"], [data-slot="select-trigger"]',
    )) {
      const rect = part.getBoundingClientRect();
      // A numbered slot must hold its own number: a fixed 32px slot spilled a five-digit page.
      if (
        part.matches('[data-slot="pagination-link"]') &&
        part.scrollWidth > part.clientWidth + 1
      )
        problems.push(
          `DataListPager ${describe(part)} ${part.getAttribute("aria-label") ?? ""} spills its ` +
            `own box: scrollWidth ${part.scrollWidth} > clientWidth ${part.clientWidth}`,
        );
      if (rect.left < box.left || rect.right > box.right)
        problems.push(
          `DataListPager ${describe(part)} ${part.getAttribute("aria-label") ?? ""} leaves the ` +
            `pager: ${rect.left.toFixed(1)}..${rect.right.toFixed(1)} outside ` +
            `${box.left.toFixed(1)}..${box.right.toFixed(1)}`,
        );
    }
  }
  return problems;
}

/** `dataSurfaceOverflow`, polled like `expectContained` (both follow a ResizeObserver). */
async function expectDataSurfacesContained(
  name: string,
  root: ParentNode,
  lane: string,
) {
  const first = dataSurfaceOverflow(root);
  await expect
    .poll(() => dataSurfaceOverflow(root), {
      message: `${name}: a data surface overflows its own box${lane} — ${first.join("; ")}`,
    })
    .toEqual([]);
}

/**
 * Run one assertion, honouring its per-fixture exclusion — and PROVING the exclusion.
 *
 * An excluded assertion is still executed, with the outcome inverted: it must throw. A component
 * fix that closes the defect therefore turns the exclusion itself red, which is the only way a
 * map like this stays true without anyone re-auditing it by hand.
 */
async function runAssertion(
  name: string,
  key: Assertion,
  assert: () => Promise<void> | void,
) {
  const reason = EXCLUDED[name]?.[key];
  if (!reason) {
    await assert();
    return;
  }
  let failure: unknown;
  try {
    await assert();
  } catch (error) {
    failure = error;
  }
  if (failure === undefined) {
    throw new Error(
      `EXCLUDED.${name}.${key} is STALE: the assertion now PASSES, but the map still exempts it ` +
        `with "${reason}". Delete the entry — an exclusion that no longer describes a real ` +
        `failure is dead coverage that reads as a known defect.`,
    );
  }
}

/** A short, locatable identity for a control in a failure message. */
function describe(element: Element) {
  const slot = element.getAttribute("data-slot");
  const role = element.getAttribute("role");
  return [
    element.tagName.toLowerCase(),
    slot && `data-slot=${slot}`,
    role && `role=${role}`,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Playwright's `isVisible`, in plain DOM: a non-empty box that is not `visibility: hidden`. */
function isVisible(element: Element) {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none";
}

/**
 * Playwright's `isDisabled`, in plain DOM, plus `inert`.
 *
 * `:disabled` covers native form controls (and, per the CSS selector's own semantics, a control
 * inside a disabled `<fieldset>`). ARIA disablement is INHERITED the same way Playwright treats
 * it: a control inside an `[aria-disabled="true"]` container — a disabled menu item wrapper, a
 * disabled toolbar group — is disabled too, even though the attribute is not on the control
 * itself. The first version of this file checked only the control's own attribute and so probed
 * controls the route lane had skipped.
 *
 * `inert` is the THIRD form of the same fact, and the strongest: an inert subtree is removed
 * from the tab order and the accessibility tree AND is not hit-testable at all, so a control
 * inside one accepts no pointer action whatsoever. WCAG 2.2 §2.5.8 sizes TARGETS — "a region of
 * the display that will accept a pointer action" — so a control that can accept none is out of
 * scope for the same reason a disabled one is. Recorded 2026-09-09 as `actionBarPending`:
 * `ActionBar` marks its action group `inert` while a bulk operation is in flight (a deliberate
 * choice over `disabled`, so the keyboard cannot re-trigger it either), and the probe then
 * reported the 58.6x28.0 button as obstructed by its own toolbar on all five points — the toolbar
 * root is simply the first NON-inert element under the pointer. Nothing about the control was
 * ever wrong. Without this the lane cannot tell "hidden from the pointer on purpose" from
 * "covered by a bug", which is the distinction the obstruction assertion exists to make.
 */
function isDisabled(element: Element) {
  return (
    element.matches(":disabled") ||
    element.closest('[aria-disabled="true"]') !== null ||
    element.closest("[inert]") !== null
  );
}

/** Poll a synchronous predicate to `true`, or throw `message`. */
async function waitFor(
  predicate: () => boolean,
  message: string,
  timeoutMs = 5_000,
) {
  const deadline = performance.now() + timeoutMs;
  for (;;) {
    if (predicate()) return;
    if (performance.now() > deadline) throw new Error(message);
    await settle();
  }
}

/**
 * Wait for a `next/dynamic` fixture's REAL component DOM before anything is measured.
 *
 * `test/next-dynamic-stub.tsx` stands in for `next/dynamic` with `React.lazy` + `Suspense`, so a
 * fixture that mounts one renders its FALLBACK first — an empty boundary for TextEdit, which has
 * no `loading` option. Measuring that fallback would produce a green result for a component that
 * never rendered: no contenteditable, no toolbar, nothing to overflow and no control to be under
 * 24px. Every assertion in this file would pass vacuously.
 *
 * So: if the stub recorded a dynamic mount, this fixture MUST declare the DOM that proves the
 * real component arrived, and that DOM must appear — at least once per dynamic mount — before
 * the sweep proceeds. If it never appears the test FAILS; it is never skipped and never measured
 * early.
 */
async function waitForDynamicDom(name: string, root: ParentNode) {
  const mounts = dynamicMountCount();
  if (mounts === 0) return;
  const selector = DYNAMIC_DOM[name];
  if (!selector) {
    throw new Error(
      `${name} mounts ${mounts} next/dynamic component(s) but declares no DYNAMIC_DOM selector. ` +
        `Without one the sweep would measure the Suspense fallback and pass vacuously. Add the ` +
        `selector that proves the real component rendered.`,
    );
  }
  await waitFor(
    () =>
      pendingDynamicImports() === 0 &&
      root.querySelectorAll(selector).length >= mounts,
    `${name} never rendered ${mounts}× "${selector}": the next/dynamic component did not finish ` +
      `mounting, so every geometry assertion would have measured the Suspense fallback instead ` +
      `of the real component. (pending imports: ${pendingDynamicImports()}, found: ` +
      `${root.querySelectorAll(selector).length})`,
  );
}

// ── the sweep ───────────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // 320px is the narrowest viewport WCAG 2.2 §1.4.10 requires content to reflow into. Set once
  // for the file: every test in it asserts at that width.
  await page.viewport(320, 812);

  // COMPILED-CSS SENTINEL. Every assertion in this file is a statement about compiled layout, and
  // all three of them fail OPEN if the stylesheet is missing: with no utilities, nothing is wide
  // enough to overflow 320px, and every control collapses to its intrinsic text box — which is
  // usually still >24px wide, so even the target floor mostly passes. A broken `@source` glob in
  // `geometry.css` produces exactly that silently, with no error anywhere.
  //
  // So prove the stylesheet before measuring anything: one element with known utilities, and one
  // theme variable. If either is wrong, this hook throws and the whole file goes red rather than
  // reporting a green sweep over unstyled DOM.
  const sentinel = document.createElement("div");
  sentinel.className = "w-6 h-6 min-w-0 truncate";
  sentinel.textContent = "sentinel";
  document.body.append(sentinel);
  try {
    const style = getComputedStyle(sentinel);
    expect(
      {
        width: style.width,
        height: style.height,
        minWidth: style.minWidth,
        textOverflow: style.textOverflow,
        overflow: style.overflowX,
        whiteSpace: style.whiteSpace,
      },
      "geometry.css did not compile the utilities these contracts measure. `w-6 h-6 min-w-0 " +
        "truncate` must resolve to real declarations — if it does not, the fixtures below are " +
        "being measured UNSTYLED and reflow/RTL/24px all pass vacuously. Check the `@source` " +
        "globs and the Tailwind import in test/geometry.css.",
    ).toEqual({
      width: "24px",
      height: "24px",
      minWidth: "0px",
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "nowrap",
    });
    // …and the token theme itself, which the utilities above do not depend on. The sentinel used
    // to be `h-8`; the shadcn reset deleted the `--size-*` family (LAY-1 = shadcn: upstream
    // writes `h-8`), so it is `--background` now — the one token whose absence means the theme
    // did not load at all, while plain Tailwind utilities still compile and every measurement in
    // this file silently reads unthemed values.
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim(),
      "the @vegastack token theme is not on this page (--background is unset), so every colour " +
        "and surface measured in this file is an unthemed default.",
    ).not.toBe("");
  } finally {
    sentinel.remove();
  }
});

beforeEach(() => {
  resetDynamicTracking();
});

afterEach(() => {
  // `dir` is set on the document element, which outlives the component cleanup. Restore it even
  // when an assertion threw mid-test, or every later fixture in the file runs RTL by accident.
  document.documentElement.removeAttribute("dir");
});

for (const [name, fixture] of FIXTURES) {
  test(name, async () => {
    // A fixture that throws on render must FAIL this test, not skip it: `render` is awaited
    // un-caught, so the rejection is the test's result. Nothing in this file swallows it.
    const screen = await render(
      React.createElement(fixture as React.ComponentType),
    );
    await settle();

    // The real component, not a `next/dynamic` Suspense fallback (no-op for the ~510 fixtures
    // that mount nothing dynamic).
    await waitForDynamicDom(name, screen.baseElement);

    // The fixture root is visible before anything is measured — the route lane's
    // `await expect(fixture).toBeVisible()`. A fixture that rendered an empty tree, or that
    // collapsed to a zero box, would otherwise sail through all three assertions: there is
    // nothing to overflow and no control to probe.
    await waitFor(
      () =>
        [...screen.baseElement.children].some(
          (child) =>
            isVisible(child) ||
            [...child.querySelectorAll("*")].some(isVisible),
        ),
      `${name} rendered nothing visible — every assertion below would pass over an empty tree.`,
    );

    // (1) 320px reflow. `+1` absorbs sub-pixel rounding, exactly as the route lane did.
    await runAssertion(name, "reflow", async () => {
      await expectContained(name, "");
      await expectDataSurfacesContained(name, screen.baseElement, "");
    });

    // (2) RTL containment — the same fact with the writing direction flipped, which is where a
    // hard-coded `left`/`ml-*` or a non-logical inset shows up as an overflow.
    document.documentElement.setAttribute("dir", "rtl");
    await settle();
    await runAssertion(name, "rtl", async () => {
      await expectContained(name, " in RTL");
      await expectDataSurfacesContained(name, screen.baseElement, " in RTL");
    });
    document.documentElement.removeAttribute("dir");
    await settle();

    // (3) the 24px effective pointer-target floor, per interactive control in the fixture.
    // `baseElement` rather than `container` so portalled surfaces (a Dialog, a Popover, a
    // Toaster) that a fixture opens on mount are swept too.
    await runAssertion(name, "target", () => {
      const controls = [
        ...screen.baseElement.querySelectorAll(INTERACTIVE_SELECTOR),
      ];
      for (const [index, control] of controls.entries()) {
        if (!isVisible(control) || isDisabled(control)) continue;
        if (control.getAttribute("aria-hidden") === "true") continue;

        // State-driven controls such as MessageScroller's inactive jump button remain mounted
        // for stable transitions but are deliberately removed from pointer interaction.
        // Visually hidden controls (skip links) are keyboard-only until focus reveals them.
        const visuallyHidden = control.classList.contains("sr-only");
        const inactiveMountedControl =
          control.getAttribute("data-slot") === "message-scroller-button" &&
          control.getAttribute("data-active") === "false" &&
          (control as HTMLElement).tabIndex < 0 &&
          getComputedStyle(control).pointerEvents === "none";
        if (visuallyHidden || inactiveMountedControl) continue;

        // An inline link inside a sentence cannot be 24px tall without breaking the line box;
        // WCAG 2.2 §2.5.8 exempts targets in a block of text for exactly this reason.
        if (
          control instanceof HTMLAnchorElement &&
          getComputedStyle(control).display === "inline"
        )
          continue;

        // A tab PANEL is not a target. It matches `INTERACTIVE_SELECTOR` only through
        // `[tabindex="0"]`, which Base UI puts there for the APG reason — a panel whose content
        // holds nothing focusable must still be reachable by keyboard — and it accepts no
        // pointer action of its own: clicking it activates nothing. WCAG 2.2 §2.5.8 sizes
        // "a region of the display that will accept a pointer action", so there is no target
        // here to size. Recorded 2026-09-09 as `tabsChip`, where the one-line "Record overview
        // panel." panel measured 237.97x21.00 — the panel's TEXT is short, which is not a defect
        // in anything. Scoped to `role="tabpanel"` alone and NOT to focusable containers in
        // general: a `role="separator"` resize handle is focusable AND a drag target, and must
        // keep being measured.
        if (control.getAttribute("role") === "tabpanel") continue;

        // Centre the control so nothing scrolled out of the 320×812 viewport can steal its hit.
        control.scrollIntoView({ block: "center", inline: "center" });
        const probe = effectiveTargetProbe(control);

        // (3a) size — sub-pixel tolerance only, so a genuinely undersized control still fails.
        expect(
          {
            width: probe.effective.width >= 23.5,
            height: probe.effective.height >= 23.5,
          },
          `interactive control ${index} in ${name} must be at least 24×24 including any -inset-* hit area (measured ${probe.effective.width.toFixed(2)}×${probe.effective.height.toFixed(2)}px)`,
        ).toEqual({ width: true, height: true });

        // (3b) obstruction — nothing else may own the interior of the centred 24px square.
        expect(
          probe.misses,
          `interactive control ${index} in ${name} must own a centred >=24px effective pointer target (visual ${probe.rect.width.toFixed(1)}×${probe.rect.height.toFixed(1)}px)`,
        ).toEqual([]);
      }
    });

    // (4) the focus indicator, per focusable control in the fixture.
    //
    // This replaces the check deleted on 2026-09-08 as a documented no-op. That one ran under
    // `forcedColors: "active"`, where Chromium paints its own ring, so it stayed green with the
    // design system's `:focus-visible` rule deleted. This one runs in normal colours and REJECTS
    // the user agent's ring by name (`outline-style: auto`), which is the whole difference.
    //
    // Focus is applied programmatically. Measured 2026-09-09 in this lane: `element.focus()` DOES
    // match `:focus-visible` here (Chromium's script-focus heuristic), so the keyboard-tab path
    // `contrast.browser.test.tsx` needs for its four surface specimens is not needed for a sweep
    // of this size — and a per-control tab walk would be O(controls²) trusted keypresses.
    await runAssertion(name, "focus", async () => {
      const controls = [
        ...screen.baseElement.querySelectorAll(INTERACTIVE_SELECTOR),
      ];
      const problems: string[] = [];
      const thaw = freezeTransitions();
      for (const [index, control] of controls.entries()) {
        if (!isVisible(control) || isDisabled(control)) continue;
        if (control.getAttribute("aria-hidden") === "true") continue;
        if (control.classList.contains("sr-only")) continue;
        // Not focusable at all: a `[role="option"]` inside a listbox that owns focus itself, a
        // `[role="menuitem"]` under a roving tabindex whose active item is elsewhere. Focus
        // indication is the business of whatever CAN hold focus.
        if (!(control instanceof HTMLElement) || control.tabIndex < 0) continue;

        const rest = restSignature(control);
        control.focus();
        // ONE frame, and only for the OTP field. Every other control in this system signals focus
        // in CSS (`:focus`/`:focus-visible`), which is live the instant focus moves; the OTP's cue
        // is carried by a SIBLING slot that React marks `data-active` in a focus handler, so it
        // lands on the next commit and a synchronous read would see the resting border. This is the
        // one shape that needs it, so the sweep does not pay a frame per control.
        if (control.matches('[data-slot="input-otp"]')) {
          await new Promise(requestAnimationFrame);
        }
        // A component may redirect focus (a wrapper hands it to its inner input). Measure whatever
        // actually holds focus, and only when it is this control or inside it — otherwise the
        // control never took focus and nothing about ITS indicator was demonstrated.
        const active = document.activeElement;
        if (active !== control && !control.contains(active)) continue;
        const focused = active instanceof HTMLElement ? active : control;
        // The redirect target needs a baseline of its OWN, and it has to be taken with focus
        // released — reading it here, while the target already holds focus, compared the focused
        // state against itself and could never report a missing indicator.
        const baseline =
          focused === control
            ? rest
            : (() => {
                const target = restSignature(focused);
                control.focus();
                return target;
              })();
        const problem = focusIndicatorProblem(focused, baseline);
        if (problem)
          problems.push(`control ${index} (${describe(focused)}) ${problem}`);
      }
      (document.activeElement as HTMLElement | null)?.blur?.();
      thaw();
      expect(
        problems,
        `${name}: every focusable control must show a focus indicator the design system owns ` +
          `(WCAG 2.2 §2.4.11/§2.4.13, AGENTS.md § Accessibility)`,
      ).toEqual([]);
    });
  });
}

// ── DataList / DataListPager: the no-horizontal-scroll promise, with compiled CSS ──────────────
//
// The preview fixtures above are the documented compositions. These are the SHAPES that broke
// the promise or sit on its edge — a mono or end-aligned first column (one line by default),
// many columns, the selection column, the injected row-action button, a composed toolbar and
// footer, dropped columns — each mounted in a 320px container and measured on the table
// container itself (`dataSurfaceOverflow`), not just the document. They run whenever this file
// runs; they are cheap and they are the only place the promise meets real CSS.

interface Invoice {
  id: string;
  ref: string;
  customer: string;
  email: string;
  team: string;
  status: string;
  amount: string;
}

const INVOICES: Invoice[] = Array.from({ length: 4 }, (_, index) => ({
  id: String(index + 1),
  ref: `INV-2026-${String(481 + index).padStart(5, "0")}`,
  customer: [
    "Northwind Traders",
    "Contoso Pharmaceuticals",
    "Fabrikam",
    "Tailspin",
  ][index]!,
  email: [
    "accounts.payable@northwind-traders.example",
    "billing-department@contoso-pharmaceuticals.example",
    "finance@fabrikam.example",
    "a-very-long-unbroken-mailbox-name-without-spaces@tailspin-toys.example",
  ][index]!,
  team: "Revenue operations",
  status: ["Active", "Invited", "Suspended", "Active"][index]!,
  amount: ["$12,480.00", "$940.00", "$2,150.00", "$1,234,567.89"][index]!,
}));

const invoiceColumns = (
  first: Partial<DataListColumn<Invoice>>,
): DataListColumn<Invoice>[] => [
  { key: "ref", header: "Invoice", sortable: true, ...first },
  { key: "customer", header: "Customer", sortable: true },
  { key: "email", header: "Billing email" },
  { key: "team", header: "Team" },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge variant="secondary">{row.status}</Badge>,
  },
  { key: "amount", header: "Amount", align: "end", mono: true },
];

const DATA_LIST_CASES: [string, () => React.ReactElement][] = [
  [
    "mono first column",
    () => (
      <DataList
        aria-label="Invoices"
        columns={invoiceColumns({ mono: true })}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    ),
  ],
  [
    "end-aligned first column",
    () => (
      <DataList
        aria-label="Invoices"
        columns={invoiceColumns({
          key: "amount",
          header: "Amount",
          align: "end",
        })}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    ),
  ],
  [
    "many columns",
    () => (
      <DataList
        aria-label="Wide"
        columns={Array.from({ length: 14 }, (_, index) => ({
          key: `c${index}`,
          header: `Column ${index}`,
          mono: index % 3 === 0,
          align: index % 4 === 0 ? ("end" as const) : undefined,
          render: (row: Invoice) =>
            index % 2 === 0 ? row.email : `${row.customer} ${row.team}`,
        }))}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    ),
  ],
  [
    "selectable, mono first",
    () => (
      <DataList
        aria-label="Invoices"
        columns={invoiceColumns({ mono: true })}
        data={INVOICES}
        getRowId={(row) => row.id}
        selectable
        selectedIds={new Set(["1", "3"])}
      />
    ),
  ],
  [
    "clickable rows, mono first",
    () => (
      <DataList
        aria-label="Invoices"
        columns={invoiceColumns({ mono: true })}
        data={INVOICES}
        getRowId={(row) => row.id}
        onRowClick={() => {}}
      />
    ),
  ],
  [
    "hidden columns and a sort on one of them",
    () => (
      <DataList
        aria-label="Invoices"
        columns={invoiceColumns({ mono: true }).map((column) =>
          column.key === "email" || column.key === "amount"
            ? { ...column, mobile: "hidden" as const, sortable: true }
            : column,
        )}
        data={INVOICES}
        getRowId={(row) => row.id}
        sort={{ key: "amount", direction: "desc" }}
      />
    ),
  ],
  [
    "composed toolbar and DataListPager footer",
    () => (
      <DataList
        aria-label="Invoices"
        columns={invoiceColumns({ mono: true })}
        data={INVOICES}
        getRowId={(row) => row.id}
        selectable
        onRowClick={() => {}}
        toolbar={
          <InputGroup>
            <InputGroupInput
              aria-label="Search invoices"
              placeholder="Search…"
            />
          </InputGroup>
        }
        footer={
          <DataListPager
            page={6}
            pageSize={15}
            total={1_234}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
          />
        }
      />
    ),
  ],
];

for (const [label, element] of DATA_LIST_CASES) {
  test(`DataList at 320px never scrolls sideways — ${label}`, async () => {
    const screen = await render(
      <div style={{ width: "320px" }}>{element()}</div>,
    );
    await settle();
    // Revelation measured and ran: at 320px something always leaves the header row here.
    await expect
      .poll(
        () =>
          screen.container.querySelectorAll('[data-slot="data-list-merged"]')
            .length +
          screen.container.querySelectorAll(
            '[data-slot="data-list-hidden-hint"]',
          ).length,
      )
      .toBeGreaterThan(0);
    await expectDataSurfacesContained(label, screen.container, "");
    await expectContained(label, "");
  });
}

/**
 * The squeeze reaches INTO a custom render. A cell's own `whitespace` does not reach a render's
 * `truncate` span or a Badge's `whitespace-nowrap`, and an auto-layout table sizes each column
 * from its content's min-content — so, before the squeeze released descendants, a `block
 * truncate` primary value scrolled the table to 411px at 240px (truncation cannot happen in an
 * auto-layout cell) and two always-visible Badge columns to 336px at 320px (review round 2).
 */
const SQUEEZE_CASES: [string, () => React.ReactElement][] = [
  [
    "a truncate render in the first column",
    () => (
      <DataList
        aria-label="Invoices"
        columns={[
          {
            key: "email",
            header: "Billing email",
            render: (row) => (
              <span className="block truncate">{row.email}</span>
            ),
          },
          { key: "customer", header: "Customer" },
        ]}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    ),
  ],
  [
    "a nowrap flex render in the first column",
    () => (
      <DataList
        aria-label="Invoices"
        columns={[
          {
            key: "email",
            header: "Billing email",
            render: (row) => (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="size-2 shrink-0 rounded-full bg-primary" />
                <span className="truncate">{row.email}</span>
              </div>
            ),
          },
          { key: "customer", header: "Customer" },
        ]}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    ),
  ],
  [
    "two always-visible Badge columns",
    () => (
      <DataList
        aria-label="Invoices"
        columns={[
          { key: "customer", header: "Customer" },
          {
            key: "status",
            header: "Status",
            mobile: "visible",
            render: (row) => (
              <Badge variant="secondary">Awaiting approval {row.status}</Badge>
            ),
          },
          {
            key: "team",
            header: "Team",
            mobile: "visible",
            render: (row) => <Badge>{row.team}</Badge>,
          },
        ]}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    ),
  ],
  [
    "four always-visible columns",
    () => (
      <DataList
        aria-label="Invoices"
        columns={[
          { key: "customer", header: "Customer" },
          { key: "email", header: "Billing email", mobile: "visible" },
          { key: "team", header: "Team", mobile: "visible" },
          {
            key: "amount",
            header: "Amount",
            align: "end",
            mono: true,
            mobile: "visible",
          },
        ]}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    ),
  ],
];

for (const [label, element] of SQUEEZE_CASES)
  for (const width of [240, 320])
    test(`DataList at ${width}px squeezes a custom render instead of scrolling — ${label}`, async () => {
      const screen = await render(
        <div style={{ width: `${width}px` }}>{element()}</div>,
      );
      await settle();
      await expectDataSurfacesContained(label, screen.container, "");
      await expectContained(label, "");
      // Every header is still there: the squeeze never hides a column.
      const headers = screen.container.querySelectorAll(
        '[data-slot="data-list"] thead th',
      );
      expect(headers.length).toBeGreaterThan(0);
      // A wrapped Badge grows to hold its label rather than clipping it (`overflow-hidden`).
      for (const badge of screen.container.querySelectorAll<HTMLElement>(
        '[data-slot="badge"]',
      ))
        expect(
          badge.scrollHeight - badge.clientHeight,
          `badge "${badge.textContent}" clips its wrapped label`,
        ).toBeLessThanOrEqual(1);
    });

/**
 * The squeeze releases TEXT, never a control. A Button is content-sized with a fixed height, so
 * when the descendant release reached it (`**:wrap-anywhere`), the table narrowed it and its label
 * wrapped inside `h-7`: 45px of text in a 26px box at 240 and 320px, 69px with a second visible
 * column, and 29px at 700px, where one long nowrap email was enough to squeeze (review round 3).
 * The release skips controls and fixed-size content and everything inside them, so a control
 * keeps its one-line min-content; the text around it still breaks, and the row grows instead.
 */
const invoiceAction = (): DataListColumn<Invoice> => ({
  key: "action",
  header: "Action",
  mobile: "visible",
  interactive: true,
  render: () => (
    <Button size="sm" variant="outline">
      View details
    </Button>
  ),
});
const nowrapEmail = (
  mobile?: DataListColumn<Invoice>["mobile"],
): DataListColumn<Invoice> => ({
  key: "email",
  header: "Billing email",
  mobile,
  render: (row) => <span className="whitespace-nowrap">{row.email}</span>,
});
const SQUEEZE_CONTROL_CASES: [string, DataListColumn<Invoice>[], boolean?][] = [
  [
    "a Button in a visible column",
    [{ key: "customer", header: "Customer" }, nowrapEmail(), invoiceAction()],
  ],
  [
    "a Button beside two other visible columns",
    [
      { key: "customer", header: "Customer" },
      nowrapEmail("visible"),
      {
        key: "status",
        header: "Status",
        mobile: "visible",
        render: (row) => <Badge variant="secondary">{row.status}</Badge>,
      },
      invoiceAction(),
    ],
  ],
  // DataList's own row-action wrapper is a <button> that HOLDS the first cell's text: it stays
  // released, so the nowrap email inside it still breaks while the Button beside it does not.
  [
    "a Button beside a clickable row's nowrap first value",
    [nowrapEmail(), { key: "customer", header: "Customer" }, invoiceAction()],
    true,
  ],
];

/** Every control (and Badge) in a table whose content spills its own box. */
function controlSpills(root: ParentNode): string[] {
  const problems: string[] = [];
  for (const control of root.querySelectorAll<HTMLElement>(
    '[data-slot="data-list"] :is(button, [data-slot="button"], [data-slot="badge"])',
  )) {
    if (
      control.scrollHeight > control.clientHeight ||
      control.scrollWidth > control.clientWidth
    )
      problems.push(
        `${describe(control)} "${control.textContent}" spills: ` +
          `${control.scrollWidth}×${control.scrollHeight} in ${control.clientWidth}×${control.clientHeight}`,
      );
  }
  return problems;
}

for (const [label, columns, clickable] of SQUEEZE_CONTROL_CASES)
  for (const width of [240, 320, 700])
    for (const dir of ["ltr", "rtl"] as const)
      test(`DataList at ${width}px squeezes text around a control, never the control — ${label}, ${dir}`, async () => {
        if (dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
        try {
          const screen = await render(
            <div style={{ width: `${width}px` }}>
              <DataList
                aria-label="Invoices"
                columns={columns}
                data={INVOICES}
                getRowId={(row) => row.id}
                onRowClick={clickable ? () => {} : undefined}
              />
            </div>,
          );
          await settle();
          // The long nowrap email outgrows its budget even at 700px: the squeeze is live.
          await expect
            .poll(() =>
              screen.container
                .querySelector('[data-slot="data-list"]')
                ?.hasAttribute("data-squeezed"),
            )
            .toBe(true);
          // Both hold at once: the controls keep their label inside their box, and the table
          // still does not scroll — the rows grow taller instead.
          await expect
            .poll(() => controlSpills(screen.container), {
              message: `${label} @${width} ${dir}: ${controlSpills(screen.container).join("; ")}`,
            })
            .toEqual([]);
          await expectDataSurfacesContained(
            `${label} @${width} ${dir}`,
            screen.container,
            "",
          );
          // The squeeze still reached the text beside the control.
          const email = screen.container.querySelector<HTMLElement>(
            '[data-slot="data-list"] tbody span.whitespace-nowrap',
          )!;
          expect(getComputedStyle(email).overflowWrap).toBe("anywhere");
        } finally {
          document.documentElement.removeAttribute("dir");
        }
      });

/**
 * The squeeze across everything a cell can hold (review round 4). Round 3 keyed the "keep it whole"
 * exclusion on tags, roles and slots, so `<a className={buttonVariants()}>` — the documented
 * link-as-button — carried none of them and wrapped inside its `h-7` box; `badgeVariants()` on an
 * anchor never got the Badge's `h-auto`; a Kbd inherited the cell's `wrap-anywhere` and broke `⌘K`
 * in two; a Chip's fixed `h-7` spilled its wrapped label. And the kept cases that are really TEXT
 * — a link-variant Button, EditableCell's display — stopped spilling but scrolled the table
 * sideways (394 and 416px in 240). Each render sits in the LAST visible column beside a long
 * nowrap email that forces the squeeze, where a Checkbox's or Switch's 24px target also used to
 * poke past the table and scroll it (10px and 3px).
 *
 * Two assertions, together: no text leaves any box it sits in (measured from the text's own line
 * rects, so a hit-area pseudo-element cannot fake a spill), and the table container does not
 * scroll.
 */
const SQUEEZE_NAME = "Ada Lovelace-Byron of the Analytical Engine Society";
const SQUEEZE_CONTENT: [string, () => React.ReactNode][] = [
  [
    "a Button",
    () => (
      <Button size="sm" variant="outline">
        View details
      </Button>
    ),
  ],
  [
    "an anchor wearing buttonVariants",
    () => (
      <a
        href="#"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        View invoice details
      </a>
    ),
  ],
  [
    "an anchor wearing badgeVariants",
    () => (
      <a href="#" className={badgeVariants({ variant: "secondary" })}>
        {SQUEEZE_NAME}
      </a>
    ),
  ],
  ["a Badge", () => <Badge variant="secondary">{SQUEEZE_NAME}</Badge>],
  [
    "a link Button rendered as an anchor",
    () => (
      <Button variant="link" render={<a href="#" />} nativeButton={false}>
        {SQUEEZE_NAME}
      </Button>
    ),
  ],
  [
    "a native link Button",
    () => <Button variant="link">{SQUEEZE_NAME}</Button>,
  ],
  [
    "an anchor wearing the link buttonVariants",
    () => (
      <a href="#" className={buttonVariants({ variant: "link" })}>
        {SQUEEZE_NAME}
      </a>
    ),
  ],
  [
    "an EditableCell",
    () => (
      <EditableCell value={SQUEEZE_NAME} onCommit={() => {}} label="Name" />
    ),
  ],
  [
    "an anchor wearing toggleVariants",
    () => (
      <a
        href="#"
        className={toggleVariants({ variant: "outline", size: "sm" })}
      >
        Pin this row
      </a>
    ),
  ],
  ["a Toggle", () => <Toggle size="sm">Pin row</Toggle>],
  [
    "an anchor wearing navigationMenuTriggerStyle",
    () => (
      <a href="#" className={navigationMenuTriggerStyle()}>
        Open page
      </a>
    ),
  ],
  [
    "a span wearing stepperNodeVariants",
    () => <span className={stepperNodeVariants({ size: "sm" })}>100</span>,
  ],
  ["a Chip", () => <Chip>{SQUEEZE_NAME}</Chip>],
  [
    "a TagGroup",
    () => (
      <TagGroup aria-label="Tags">
        <Tag>{SQUEEZE_NAME}</Tag>
        <Tag>Finance</Tag>
      </TagGroup>
    ),
  ],
  [
    "a ToolCallChip",
    () => <ToolCallChip label={SQUEEZE_NAME} meta="3 rows in 495ms" />,
  ],
  [
    "an Avatar and a Kbd beside text",
    () => (
      <span className="flex items-center gap-1">
        <Avatar className="size-6">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Kbd>⌘K</Kbd>
        {SQUEEZE_NAME}
      </span>
    ),
  ],
  // Directly in the cell, so it inherits the squeezed cell's `whitespace-normal` and
  // `wrap-anywhere`. (Inside a consumer's own flex row, an unsqueezed Kbd with a space in it
  // shrinks to its `min-w-5` and wraps anywhere — upstream Kbd's own behaviour, not DataList's.)
  ["a Kbd", () => <Kbd>Ctrl K</Kbd>],
  ["a Checkbox", () => <Checkbox aria-label="Pick" />],
  ["a Switch", () => <Switch aria-label="Active" />],
  [
    "a role=button span",
    () => (
      <span role="button" tabIndex={0}>
        {SQUEEZE_NAME}
      </span>
    ),
  ],
  ["a plain link", () => <a href="#">{SQUEEZE_NAME}</a>],
];

/** Every line of text in a table body that leaves a box it sits in, up to its cell. */
function textSpills(root: ParentNode): string[] {
  const problems: string[] = [];
  for (const body of root.querySelectorAll('[data-slot="data-list"] tbody')) {
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const lines = Array.from(range.getClientRects());
      for (
        let box = node.parentElement;
        box && box.tagName !== "TD";
        box = box.parentElement
      ) {
        // A visually-hidden label is clipped to 1px on purpose.
        if (
          getComputedStyle(box).position === "absolute" &&
          box.getBoundingClientRect().width <= 1
        )
          break;
        const rect = box.getBoundingClientRect();
        for (const line of lines)
          if (
            line.top < rect.top - 1 ||
            line.bottom > rect.bottom + 1 ||
            line.left < rect.left - 1 ||
            line.right > rect.right + 1
          )
            problems.push(
              `${describe(box)} "${node.textContent.slice(0, 16)}": a line at ` +
                `${line.left.toFixed(0)}..${line.right.toFixed(0)} × ${line.top.toFixed(0)}..${line.bottom.toFixed(0)} ` +
                `leaves ${rect.left.toFixed(0)}..${rect.right.toFixed(0)} × ${rect.top.toFixed(0)}..${rect.bottom.toFixed(0)}`,
            );
      }
    }
  }
  return [...new Set(problems)];
}

for (const [label, content] of SQUEEZE_CONTENT)
  for (const width of [240, 320, 700])
    for (const dir of ["ltr", "rtl"] as const)
      test(`DataList at ${width}px squeezes ${label} without a spill or a scroll, ${dir}`, async () => {
        if (dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
        try {
          const screen = await render(
            <div style={{ width: `${width}px` }}>
              <DataList
                aria-label="Invoices"
                columns={[
                  nowrapEmail(),
                  {
                    key: "x",
                    // One letter, so a lone control's cell is as narrow as the control itself.
                    header: "X",
                    mobile: "visible",
                    interactive: true,
                    render: content,
                  },
                ]}
                data={INVOICES}
                getRowId={(row) => row.id}
              />
            </div>,
          );
          await settle();
          // 240 and 320px are squeezed by the long email; 700px may not be, and must hold too.
          if (width < 700)
            await expect
              .poll(() =>
                screen.container
                  .querySelector('[data-slot="data-list"]')
                  ?.hasAttribute("data-squeezed"),
              )
              .toBe(true);
          await expect
            .poll(() => textSpills(screen.container), {
              message: `${label} @${width} ${dir}: ${textSpills(screen.container).join("; ")}`,
            })
            .toEqual([]);
          await expectDataSurfacesContained(
            `${label} @${width} ${dir}`,
            screen.container,
            "",
          );
        } finally {
          document.documentElement.removeAttribute("dir");
        }
      });

/**
 * The one case the squeeze cannot fit, asserted AS the exception so the docs' sentence stays true:
 * a control is kept on one line, so a control whose label alone is wider than the container
 * leaves the table nothing to squeeze. It scrolls — and the Button still holds its label.
 */
for (const dir of ["ltr", "rtl"] as const)
  test(`DataList keeps a Button wider than its container whole, and only then scrolls, ${dir}`, async () => {
    if (dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
    try {
      const screen = await render(
        <div style={{ width: "240px" }}>
          <DataList
            aria-label="Invoices"
            columns={[
              { key: "customer", header: "Customer" },
              {
                key: "x",
                header: "Action",
                mobile: "visible",
                interactive: true,
                render: () => (
                  <Button size="sm" variant="outline">
                    Download the full remittance advice for this invoice
                  </Button>
                ),
              },
            ]}
            data={INVOICES}
            getRowId={(row) => row.id}
          />
        </div>,
      );
      await settle();
      const container = screen.container.querySelector<HTMLElement>(
        '[data-slot="table-container"]',
      )!;
      const button = screen.container.querySelector<HTMLElement>(
        '[data-slot="data-list"] tbody [data-slot="button"]',
      )!;
      await expect.poll(() => controlSpills(screen.container)).toEqual([]);
      expect(button.getBoundingClientRect().width).toBeGreaterThan(240);
      expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });

test("a mono first column's merged values wrap in their own face (compiled CSS)", async () => {
  const screen = await render(
    <div style={{ width: "320px" }}>{DATA_LIST_CASES[0]![1]()}</div>,
  );
  await expect
    .poll(() =>
      screen.container.querySelector('[data-slot="data-list-merged"]'),
    )
    .not.toBeNull();
  const [email] = Array.from(
    screen.container.querySelector('[data-slot="data-list-merged"]')!.children,
  ) as HTMLElement[];
  const style = getComputedStyle(email!);
  expect({
    whiteSpace: style.whiteSpace,
    overflowWrap: style.overflowWrap,
    mono: style.fontFamily.includes("Mono"),
  }).toEqual({ whiteSpace: "normal", overflowWrap: "anywhere", mono: false });
});

/**
 * The pager's promise holds for any page count, not just the two-digit one the previews use: a
 * three-, four- or five-digit page number widens every numbered slot and the "Page N of M" position, so
 * the layout the width alone picks can still overflow. Each count is swept at the widths that
 * matter — the 200px floor, the 204px a 320px viewport's docs preview leaves, and each layout's
 * threshold — in both writing directions.
 */
const PAGER_COUNTS: { label: string; page: number; total: number }[] = [
  { label: "83 pages", page: 6, total: 1_234 },
  // Three digits: a 100–999-page count widens the compact list's last slot past 32px.
  { label: "100 pages", page: 3, total: 1_500 },
  { label: "999 pages", page: 50, total: 14_985 },
  { label: "8229 pages", page: 8_000, total: 123_435 },
  { label: "10000 pages", page: 1_000, total: 150_000 },
  { label: "82305 pages", page: 80_000, total: 1_234_567 },
];

for (const { label, page, total } of PAGER_COUNTS)
  for (const width of [200, 204, 240, 270, 320, 479, 480, 800])
    for (const dir of ["ltr", "rtl"] as const) {
      test(`DataListPager fits a ${width}px container — ${label}, ${dir}`, async () => {
        if (dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
        try {
          const screen = await render(
            <div style={{ width: `${width}px` }}>
              <DataListPager
                page={page}
                pageSize={15}
                total={total}
                onPageChange={() => {}}
                onPageSizeChange={() => {}}
              />
            </div>,
          );
          const pager = screen.container.querySelector<HTMLElement>(
            '[data-slot="data-list-pager"]',
          )!;
          if (total === 1_234) {
            const expected =
              width >= 480 ? "full" : width >= 240 ? "compact" : "minimal";
            await expect
              .poll(() => pager.getAttribute("data-layout"))
              .toBe(expected);
          }
          await expectDataSurfacesContained(
            `pager@${width} ${label} ${dir}`,
            screen.container,
            "",
          );
          // Both ends are always reachable — the clipped Next was the defect.
          for (const name of ["Go to previous page", "Go to next page"])
            expect(
              pager.querySelector(`[aria-label="${name}"]`),
              `${name} at ${width}px`,
            ).not.toBeNull();
          // Whatever the layout shows, the position is always there in full for assistive tech.
          const pages = Math.ceil(total / 15);
          const current = Math.min(page, pages);
          const position = pager.querySelector(
            '[data-slot="data-list-pager-position"]',
          );
          if (position)
            expect(
              position.querySelector(".sr-only")?.textContent ??
                position.textContent,
            ).toBe(`Page ${current} of ${pages}`);
          else
            expect(
              pager.querySelector(`[aria-label="Go to page ${current}"]`),
            ).not.toBeNull();
        } finally {
          document.documentElement.removeAttribute("dir");
        }
      });
    }

/**
 * The fit is re-taken on EVERY change that moves the page list, not only on a width the table's
 * column hook would notice (review round 4). That hook ignores changes of 1px or less (a guard
 * against revelation re-firing itself), so a 100-page pager resized 242 → 241px kept the compact
 * list with Next 0.36px outside, and 0.86px at 240.5px. And content that widens with no width
 * change at all — a web font swapping in, letter-spacing — was never re-measured: 0.4px of
 * letter-spacing left an item 0.56px outside at 242px (1px here, so the fixture overflows
 * whatever the host's font metrics).
 */
function mountPager(width: string) {
  return render(
    <div style={{ width }}>
      <DataListPager
        page={3}
        pageSize={15}
        total={1_500}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    </div>,
  );
}

for (const dir of ["ltr", "rtl"] as const) {
  test(`DataListPager re-fits on a sub-pixel resize: 242 → 241 → 240.5px, 100 pages, ${dir}`, async () => {
    if (dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
    try {
      const screen = await mountPager("242px");
      const host = screen.container.firstElementChild as HTMLElement;
      for (const width of ["242px", "241px", "240.5px"]) {
        host.style.width = width;
        await settle();
        await expectDataSurfacesContained(
          `pager@${width} ${dir}`,
          screen.container,
          "",
        );
      }
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });

  for (const [label, rule] of [
    ["1px of letter-spacing", "letter-spacing: 1px !important"],
    ["a wider font swapped in", "font-family: Verdana, monospace !important"],
  ] as const)
    test(`DataListPager re-fits when its content widens at a fixed width — ${label}, ${dir}`, async () => {
      if (dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
      try {
        const screen = await mountPager("242px");
        const pager = screen.container.querySelector<HTMLElement>(
          '[data-slot="data-list-pager"]',
        )!;
        await expect
          .poll(() => pager.getAttribute("data-layout"))
          .toBe("compact");
        await expectDataSurfacesContained(
          `pager@242 ${dir}`,
          screen.container,
          "",
        );
        // The width does not move; only the page list's own content does — a stylesheet
        // arriving, as a web font's metrics do, with no React render and no resize of the pager.
        const sheet = document.createElement("style");
        // Scoped to the page list: the range and the rows-per-page line are the pager's
        // documented unbreakable floor, not what this case measures.
        sheet.textContent = `[data-slot="data-list-pager-nav"] * { ${rule} }`;
        document.head.append(sheet);
        onTestFinished(() => sheet.remove());
        await settle();
        await expectDataSurfacesContained(
          `pager@242 ${label} ${dir}`,
          screen.container,
          "",
        );
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    });
}

/**
 * Re-fitting on every resize must still settle. The pager's width can depend on its own layout —
 * a pager in a shrink-to-fit host narrows when it steps down — so each case waits for the layout
 * to land and then watches the subtree for 20 frames: a pager that oscillated between two layouts
 * would keep rewriting it.
 */
for (const [label, hostStyle] of [
  ["a shrink-to-fit host", { display: "inline-block", maxWidth: "242px" }],
  ["a 240.5px host", { width: "240.5px" }],
  ["a 241px host", { width: "241px" }],
  ["a 479.5px host", { width: "479.5px" }],
] as const)
  test(`DataListPager settles in ${label} and never oscillates`, async () => {
    const screen = await render(
      <div style={hostStyle}>
        <DataListPager
          page={3}
          pageSize={15}
          total={1_500}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
        />
      </div>,
    );
    const pager = screen.container.querySelector<HTMLElement>(
      '[data-slot="data-list-pager"]',
    )!;
    for (let frame = 0; frame < 5; frame++) await settle();
    let mutations = 0;
    const observer = new MutationObserver((records) => {
      mutations += records.length;
    });
    observer.observe(pager, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    for (let frame = 0; frame < 20; frame++) await settle();
    observer.disconnect();
    expect(mutations, `${label}: the pager kept re-laying itself out`).toBe(0);
    await expectDataSurfacesContained(
      `pager in ${label}`,
      screen.container,
      "",
    );
  });

test("DataListPager steps down a layout for a long page count, and back up when it has room", async () => {
  const screen = await render(
    <div style={{ width: "260px" }}>
      <DataListPager
        page={80_000}
        pageSize={15}
        total={1_234_567}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    </div>,
  );
  const pager = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-pager"]',
  )!;
  await expect.poll(() => pager.getAttribute("data-layout")).not.toBe("full");
  await expectDataSurfacesContained("pager 480 five digits", pager, "");
  // At 200px only the short position fits; it keeps the whole sentence for assistive tech.
  (pager.parentElement as HTMLElement).style.width = "200px";
  await expect
    .poll(() =>
      pager
        .querySelector('[data-slot="data-list-pager-position"]')
        ?.hasAttribute("data-short"),
    )
    .toBe(true);
  const position = pager.querySelector(
    '[data-slot="data-list-pager-position"]',
  )!;
  expect(position.querySelector(".sr-only")?.textContent).toBe(
    "Page 80000 of 82305",
  );
  expect(position.querySelector('[aria-hidden="true"]')?.textContent).toBe(
    "80000 / 82305",
  );
  await expectDataSurfacesContained("pager 200 five digits", pager, "");
  // Room again: the verdict is re-taken for the new width, so the full list returns.
  (pager.parentElement as HTMLElement).style.width = "1200px";
  await expect.poll(() => pager.getAttribute("data-layout")).toBe("full");
  await expectDataSurfacesContained("pager 1200 five digits", pager, "");
});

test("DataGrid at 320px: merged values under a mono first column do not scroll the grid", async () => {
  const gridColumns: DataGridColumn<Invoice>[] = [
    { key: "ref", header: "Invoice", mono: true },
    { key: "customer", header: "Customer" },
    { key: "email", header: "Billing email" },
    { key: "team", header: "Team" },
    { key: "amount", header: "Amount", align: "end" },
  ];
  const screen = await render(
    <div style={{ width: "320px" }}>
      <DataGrid
        aria-label="Invoices"
        columns={gridColumns}
        data={INVOICES}
        getRowId={(row) => row.id}
        columnPicker={false}
      />
    </div>,
  );
  await expect
    .poll(() =>
      screen.container.querySelector('[data-slot="data-grid-merged"]'),
    )
    .not.toBeNull();
  const container = screen.container.querySelector<HTMLElement>(
    '[data-slot="table-container"]',
  )!;
  await expect
    .poll(() => container.scrollWidth - container.clientWidth)
    .toBeLessThanOrEqual(1);
});

/**
 * One header treatment. A sortable header's label is a ghost `sm` Button, which brings `text-xs`
 * and used to add `text-muted-foreground`; a plain header is upstream `TableHead` — `text-sm
 * font-medium text-foreground`. Side by side in one row they read as two different tables.
 */
async function headerTreatments(root: HTMLElement) {
  const sortable = root.querySelector<HTMLElement>(
    '[data-slot="data-table-sort"]',
  )!;
  const plain = [...root.querySelectorAll<HTMLElement>("th")].find(
    (th) => !th.querySelector("button, [role=checkbox]"),
  )!;
  const read = (element: HTMLElement) => {
    const style = getComputedStyle(element);
    return {
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      color: style.color,
      lineHeight: style.lineHeight,
    };
  };
  return { sortable: read(sortable), plain: read(plain) };
}

test("DataList: sortable and plain headers share one type and ink", async () => {
  const screen = await render(
    <DataList
      aria-label="Invoices"
      columns={[
        { key: "ref", header: "Invoice", sortable: true },
        { key: "customer", header: "Customer" },
      ]}
      data={INVOICES}
      getRowId={(row) => row.id}
    />,
  );
  const { sortable, plain } = await headerTreatments(screen.container);
  expect(sortable).toEqual(plain);
  expect(plain.fontSize).toBe("14px");
});

test("DataGrid: sortable and plain headers share one type and ink", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Invoices"
      columns={[
        { key: "ref", header: "Invoice", sortable: true },
        { key: "customer", header: "Customer" },
      ]}
      data={INVOICES}
      getRowId={(row) => row.id}
    />,
  );
  const { sortable, plain } = await headerTreatments(screen.container);
  expect(sortable).toEqual(plain);
});

/**
 * A sortable header's LABEL lines up with its column's values, like a plain header's does. The
 * sort control is a ghost Button whose padding and border sat inside the cell's own padding, so
 * the label started ~5px after the values below it (review round 2: header x=38, value x=33). A
 * start column compares text starts, an end column text ends — its direction glyph leads, outside
 * the text run, so the label's end is the button's content end. The label also keeps the plain
 * header's vertical position (the glyph must never become the baseline).
 */
function firstTextRect(element: Element): DOMRect {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.textContent!.trim() &&
      !(node.parentElement?.closest(".sr-only, [aria-hidden=true]") ?? null)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const text = walker.nextNode();
  expect(text, `no text in ${describe(element)}`).not.toBeNull();
  const range = document.createRange();
  range.selectNodeContents(text!);
  return range.getBoundingClientRect();
}

/** Each header as `label: edge offset, vertical offset from a plain header` (px). */
function headerOffsets(root: HTMLElement): string[] {
  const table = root.querySelector("table")!;
  const heads = [...table.querySelectorAll("thead th")];
  const cells = [...table.querySelectorAll("tbody tr:first-child td")];
  const plainHead = heads.find((th) => !th.querySelector("button"))!;
  const plainTop = firstTextRect(plainHead).top;
  return heads.map((th, index) => {
    const head = firstTextRect(th);
    const cell = firstTextRect(cells[index]!);
    // Compare the edge the column aligns to: its inline START or END, which swap sides in RTL.
    const end = th.className.includes("text-end");
    const rtl = getComputedStyle(th).direction === "rtl";
    const edge = end !== rtl ? head.right - cell.right : head.left - cell.left;
    // Whole pixels, and `0` for `-0`: a sub-pixel is rounding, not misalignment.
    const px = (value: number) => Math.round(value) || 0;
    // The glyph (and a multi-sort ordinal) never sits on the label.
    const glyph = th
      .querySelector('[data-slot="data-table-sort-glyph"]')
      ?.getBoundingClientRect();
    const overlaps =
      glyph &&
      glyph.width > 0 &&
      glyph.left < head.right - 0.5 &&
      glyph.right > head.left + 0.5;
    return `${th.textContent}: edge ${px(edge)}, top ${px(head.top - plainTop)}${overlaps ? ", glyph overlaps label" : ""}`;
  });
}

const ALIGN_COLUMNS = [
  { key: "ref", header: "Invoice", sortable: true },
  { key: "customer", header: "Customer" },
  { key: "amount", header: "Amount", align: "end" as const, sortable: true },
];
const ALIGNED = [
  "Invoice: edge 0, top 0",
  "Customer: edge 0, top 0",
  "Amount: edge 0, top 0",
];

test("DataGrid: a multi-key sort's ordinal never sits on an end column's label", async () => {
  const screen = await render(
    <div style={{ width: "900px" }}>
      <DataGrid
        aria-label="Invoices"
        columns={ALIGN_COLUMNS}
        data={INVOICES}
        getRowId={(row) => row.id}
        columnPicker={false}
        sort={[
          { key: "ref", direction: "asc" },
          { key: "amount", direction: "desc" },
        ]}
      />
    </div>,
  );
  await settle();
  expect(headerOffsets(screen.container)).toEqual([
    "Invoice1: edge 0, top 0",
    "Customer: edge 0, top 0",
    "Amount2: edge 0, top 0",
  ]);
});

for (const sort of [null, { key: "amount", direction: "desc" as const }])
  for (const dir of ["ltr", "rtl"] as const) {
    const label = `${sort ? "sorted" : "unsorted"}, ${dir}`;
    test(`DataList: a sortable header's label lines up with its values (${label})`, async () => {
      if (dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
      try {
        const screen = await render(
          <div style={{ width: "900px" }}>
            <DataList
              aria-label="Invoices"
              columns={ALIGN_COLUMNS}
              data={INVOICES}
              getRowId={(row) => row.id}
              sort={sort}
            />
          </div>,
        );
        await settle();
        expect(headerOffsets(screen.container)).toEqual(ALIGNED);
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    });
    test(`DataGrid: a sortable header's label lines up with its values (${label})`, async () => {
      if (dir === "rtl") document.documentElement.setAttribute("dir", "rtl");
      try {
        const screen = await render(
          <div style={{ width: "900px" }}>
            <DataGrid
              aria-label="Invoices"
              columns={ALIGN_COLUMNS}
              data={INVOICES}
              getRowId={(row) => row.id}
              columnPicker={false}
              {...(sort ? { sort: [sort] } : {})}
            />
          </div>,
        );
        await settle();
        expect(headerOffsets(screen.container)).toEqual(ALIGNED);
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    });
  }

/**
 * The AppShell previews frame a DESKTOP rail, which upstream pins with `position: fixed` and
 * `h-svh`. A docs frame is not the viewport: without `contain: paint` the rail resolves against the
 * viewport — the floating variant's bordered rail, its whole point, sat at the page edge while the
 * frame showed an empty 256px gap (review round 2) — and with it but at `h-svh` its bottom margin
 * and edge are cut off. Mounted wide, offset from the viewport origin, so both show.
 */
for (const name of [
  "appShellDemo",
  "appShellInset",
  "appShellFloating",
  "appShellMobile",
] as const) {
  test(`${name}: the desktop rail is drawn inside its preview frame`, async () => {
    await page.viewport(1280, 900);
    try {
      const fixture = (Preview as Record<string, () => React.ReactNode>)[name];
      expect(
        fixture,
        `${name} is not exported by the preview barrel`,
      ).toBeTypeOf("function");
      const Fixture = () => <>{fixture!()}</>;
      const screen = await render(
        <div style={{ margin: "120px 0 0 200px", width: "900px" }}>
          <Fixture />
        </div>,
      );
      await settle();
      const rail = screen.container.querySelector<HTMLElement>(
        '[data-slot="sidebar-inner"]',
      );
      expect(rail, `${name} mounted no desktop rail`).not.toBeNull();
      const frame = screen.container.firstElementChild!
        .firstElementChild as HTMLElement;
      const box = frame.getBoundingClientRect();
      const edge = rail!.getBoundingClientRect();
      expect(
        {
          left: edge.left >= box.left - 0.5,
          right: edge.right <= box.right + 0.5,
          top: edge.top >= box.top - 0.5,
          bottom: edge.bottom <= box.bottom + 0.5,
        },
        `rail ${edge.left},${edge.top}..${edge.right},${edge.bottom} vs frame ` +
          `${box.left},${box.top}..${box.right},${box.bottom}`,
      ).toEqual({ left: true, right: true, top: true, bottom: true });
      // And it is what a reader sees there: nothing paints over its middle.
      const hit = document.elementFromPoint(
        edge.left + edge.width / 2,
        edge.top + edge.height / 2,
      );
      expect(rail!.contains(hit), `${name}: the rail is covered`).toBe(true);
    } finally {
      await page.viewport(320, 812);
    }
  });
}

/**
 * A docs preview must hydrate onto its own server HTML. Upstream `SidebarMenuSkeleton` picks its
 * bar width with `Math.random()` in a state initialiser, so the server's `--skeleton-width` and the
 * client's never match and React logs a hydration mismatch on every load of the page (review round
 * 2). The sidebar preview mounts upstream's row after hydration only; `AppShellSkeleton` (ours) draws
 * its own deterministic rows, so its preview renders on the server like any other.
 */
const HYDRATION_FIXTURES = {
  appShellSkeletonDemo: "app-shell-skeleton-nav-row",
  sidebarMenuSkeleton: "sidebar-menu-skeleton",
} as const;
for (const [name, rowSlot] of Object.entries(HYDRATION_FIXTURES)) {
  test(`${name}: the docs preview hydrates without a mismatch`, async () => {
    const { renderToString } = await import("react-dom/server");
    const { hydrateRoot } = await import("react-dom/client");
    const fixture = (Preview as Record<string, () => React.ReactNode>)[name];
    expect(fixture, `${name} is not exported by the preview barrel`).toBeTypeOf(
      "function",
    );
    const Fixture = () => <>{fixture!()}</>;
    const host = document.createElement("div");
    host.innerHTML = renderToString(<Fixture />);
    document.body.append(host);
    const errors: string[] = [];
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation((...args: unknown[]) => {
        errors.push(args.map(String).join(" "));
      });
    const root = hydrateRoot(host, <Fixture />, {
      onRecoverableError: (error) => errors.push(String(error)),
    });
    try {
      await settle();
      await settle();
      expect(
        errors.filter((line) => /hydrat|didn't match/i.test(line)),
      ).toEqual([]);
      // And the skeleton rows do arrive once hydrated.
      expect(
        host.querySelectorAll(`[data-slot="${rowSlot}"]`).length,
      ).toBeGreaterThan(0);
    } finally {
      root.unmount();
      host.remove();
      spy.mockRestore();
    }
  });
}

test("DataList squeezes only when revelation alone cannot fit the table", async () => {
  // A first column whose own one-line value is wider than the whole container: revelation has
  // nothing left to move, so the table squeezes (every cell may break) instead of scrolling.
  const wideFirst: DataListColumn<Invoice>[] = [
    { key: "email", header: "Billing email", mono: true },
    { key: "customer", header: "Customer" },
  ];
  const narrow = await render(
    <div style={{ width: "240px" }}>
      <DataList
        aria-label="Squeezed"
        columns={wideFirst}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    </div>,
  );
  const table = () =>
    narrow.container.querySelector<HTMLElement>('[data-slot="data-list"]')!;
  await expect.poll(() => table().hasAttribute("data-squeezed")).toBe(true);
  await expectDataSurfacesContained("squeezed", narrow.container, "");
  await narrow.unmount();

  // The same columns with room to spare keep their one-line posture: no squeeze.
  const wide = await render(
    <div style={{ width: "1200px" }}>
      <DataList
        aria-label="Roomy"
        columns={wideFirst}
        data={INVOICES}
        getRowId={(row) => row.id}
      />
    </div>,
  );
  const roomy = wide.container.querySelector<HTMLElement>(
    '[data-slot="data-list"]',
  )!;
  await settle();
  await settle();
  expect(roomy.hasAttribute("data-squeezed")).toBe(false);
  expect(getComputedStyle(roomy.querySelector("td")!).whiteSpace).toBe(
    "nowrap",
  );
});

/**
 * Transcript (DS-49), on compiled layout at the file's 320px. The sweep proves the `transcript`
 * fixture reflows and that its seek buttons meet the 24px floor; it cannot see WHERE the list
 * scrolled to. This fixture mounts mid-recording (`currentTime` 16s, the third line), so the
 * engine's start position and follow's `scrollToMessage(…, { align: "center" })` both run on
 * mount — and the current line must end up centred in the list, with every line wrapping inside
 * it rather than pushing it sideways. With the engine's `content-visibility: auto` left on the
 * rows, the centring missed by a row or more (estimated heights), which is why rows opt out.
 */
test("transcript at 320px: lines wrap inside the list and the current line is centred", async () => {
  const fixture = (Preview as Record<string, () => React.ReactNode>).transcript;
  expect(
    fixture,
    "transcript is not exported by the preview barrel",
  ).toBeTypeOf("function");
  const Fixture = () => <>{fixture!()}</>;
  const screen = await render(<Fixture />);
  await settle();
  const viewport = screen.container.querySelector<HTMLElement>(
    '[data-slot="transcript-list"] [data-slot="message-scroller-viewport"]',
  )!;
  expect(viewport, "the transcript list mounted no viewport").not.toBeNull();
  expect(
    viewport.scrollWidth,
    `the list scrolls sideways: scrollWidth ${viewport.scrollWidth} > clientWidth ${viewport.clientWidth}`,
  ).toBeLessThanOrEqual(viewport.clientWidth);
  for (const row of viewport.querySelectorAll<HTMLElement>(
    '[data-slot="transcript-segment"]',
  )) {
    expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
  }
  const current = viewport.querySelector<HTMLElement>('[aria-current="true"]');
  expect(current, "no current line at 16s").not.toBeNull();
  await expect
    .poll(() => {
      const v = viewport.getBoundingClientRect();
      const r = current!.getBoundingClientRect();
      return Math.round(
        Math.abs(r.top + r.height / 2 - (v.top + v.height / 2)),
      );
    })
    .toBeLessThan(2);
});

/**
 * DS-77: a docked AudioPlayer is `position: sticky` at the bottom of its scroll column. With the
 * column scrolled to the TOP, its content runs on below the fold and the dock must still sit on the
 * column's bottom edge, painted over the notes behind it — and its bottom padding is the compiled
 * `calc(var(--spacing) * 3 + env(safe-area-inset-bottom))`, which is 12px where the inset is 0 (a
 * dropped arbitrary value would compute to the plain `p-3` only by accident of being overridden, so
 * the probe reads the rule the class generated rather than the resolved box alone).
 */
test("audioPlayerDocked: the dock sits on its column's bottom edge, clear of the safe area", async () => {
  await page.viewport(1280, 900);
  try {
    const screen = await render(<>{Preview.audioPlayerDocked()}</>);
    await settle();
    const dock = screen.container.querySelector<HTMLElement>(
      '[data-slot="audio-player"][data-docked]',
    );
    expect(dock, "the docked fixture mounted no dock").not.toBeNull();
    const column = dock!.parentElement!;
    expect(getComputedStyle(column).overflowY).toBe("auto");
    expect(
      column.scrollHeight,
      "the column must overflow for the probe to mean anything",
    ).toBeGreaterThan(column.clientHeight);
    column.scrollTop = 0;
    await settle();

    const style = getComputedStyle(dock!);
    expect(style.position).toBe("sticky");
    expect(style.bottom).toBe("0px");
    expect(style.paddingBottom).toBe("12px");
    const generated = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      })
      .map((rule) => rule.cssText)
      .find(
        (text) =>
          text.includes("safe-area-inset-bottom") && text.includes("pb-"),
      );
    expect(
      generated,
      "the safe-area padding utility was not compiled",
    ).toBeDefined();

    const box = column.getBoundingClientRect();
    const edge = dock!.getBoundingClientRect();
    const borderBottom = parseFloat(getComputedStyle(column).borderBottomWidth);
    expect(
      Math.abs(box.bottom - borderBottom - edge.bottom),
    ).toBeLessThanOrEqual(1);
    const hit = document.elementFromPoint(
      edge.left + edge.width / 2,
      edge.top + 4,
    );
    expect(dock!.contains(hit), "the dock is painted under the notes").toBe(
      true,
    );
  } finally {
    await page.viewport(320, 812);
  }
});

/**
 * SortableList's grid (DS-43) on real CSS: the auto-fill tracks (at least `--spacing(28)` = 112px)
 * give two tiles a row at 320px and ten at 1280px without overflowing, the overlaid handle sits in
 * the tile's top-start corner with nothing painted over it, and a horizontal drop edge draws the
 * `drag-item` hairline as a 2px line in the gap beside the tile.
 */
for (const width of [320, 1280] as const) {
  test(`SortableList grid at ${width}px: tiles fill tracks, the handle is on top, left/right hairlines`, async () => {
    const tiles = Array.from({ length: 12 }, (_, i) => ({
      id: `t${i}`,
      label: `Tile ${i + 1}`,
    }));
    const screen = await render(
      <div style={{ width: `${width}px` }}>
        <SortableList
          aria-label="Tiles"
          layout="grid"
          items={tiles}
          renderItem={(item) => (
            // Inline: this file's own class strings are not in the compiled sources.
            <span style={{ display: "block", aspectRatio: "1", width: "100%" }}>
              <span className="sr-only">{item.label}</span>
            </span>
          )}
          onReorder={() => {}}
        />
      </div>,
    );
    const group = screen.container.querySelector<HTMLElement>(
      '[data-slot="item-group"]',
    )!;
    const items = Array.from(
      group.querySelectorAll<HTMLElement>('[data-slot="sortable-list-item"]'),
    );
    const firstTop = items[0]!.getBoundingClientRect().top;
    const perRow = items.filter(
      (el) => Math.abs(el.getBoundingClientRect().top - firstTop) < 1,
    ).length;
    // As many tracks as fit, and the tiles actually wrap at that count.
    const tracks =
      getComputedStyle(group).gridTemplateColumns.split(" ").length;
    expect(perRow).toBe(tracks);
    expect(perRow).toBeGreaterThanOrEqual(width === 320 ? 2 : 8);
    const box = group.getBoundingClientRect();
    for (const el of items) {
      const r = el.getBoundingClientRect();
      expect(r.width).toBeGreaterThanOrEqual(112);
      expect(r.right).toBeLessThanOrEqual(box.right + 0.5);
    }
    const tile = items[0]!;
    const handle = tile.querySelector<HTMLElement>(
      '[data-slot="sortable-list-handle"]',
    )!;
    const t = tile.getBoundingClientRect();
    const h = handle.getBoundingClientRect();
    expect(h.left - t.left).toBeLessThan(8);
    expect(h.top - t.top).toBeLessThan(8);
    expect(
      handle.contains(
        document.elementFromPoint(h.left + h.width / 2, h.top + h.height / 2),
      ),
    ).toBe(true);
    for (const edge of ["left", "right"] as const) {
      tile.setAttribute("data-drop-edge", edge);
      const line = getComputedStyle(tile, "::before");
      expect(line.position).toBe("absolute");
      expect(line.width).toBe("2px");
      expect(line.getPropertyValue(edge)).toBe("-4px");
      // `inset-y-0` spans the tile's padding box: the full height inside its border.
      expect(parseFloat(line.height)).toBeCloseTo(tile.clientHeight, 0);
      expect(tile.clientHeight).toBeGreaterThan(100);
    }
    tile.removeAttribute("data-drop-edge");
  });
}
