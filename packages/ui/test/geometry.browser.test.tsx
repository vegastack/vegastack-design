import "./geometry.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import * as Preview from "@/components/preview";
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
  resizableNested: {
    target:
      "ACCEPTED overlap, not a defect (MK 2026-09-09, `docs/ledger/bugs.md`). Control 0 is the " +
      "outer vertical handle, visual 1.0x254.0, hit area 24.0x254.0; the nested horizontal " +
      "handle's own 24px hit area crosses it at the T-junction and, being deeper in the DOM, " +
      "wins the shared band. Measured 2026-09-09: outer `after` spans x 94.6-118.6 over the full " +
      "254px; inner `after` spans y 141.0-165.0 from x 107.1 rightwards, so the shared band is " +
      "~11.5x24 and the outer handle keeps 12.5px of exclusive width across it and its full 24px " +
      "over the other 230px of its length. Under §2.5.8's overlap rule both handles still measure " +
      "far beyond 24x24. Whichever handle won, the other would lose the same square, so this is a " +
      "property of two crossing targets and not a tunable; 3 of 5 centred points miss",
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
const UNSWEPT: Record<string, string> = {
  // Omits `now` so the component reads the real clock and its refresh timer ticks — that IS the
  // feature being demonstrated. A self-rescheduling `setTimeout` re-renders the fixture between
  // the assertion and the measurement: the detach race in `docs/ledger/bugs.md` (2026-09-08).
  // Every other `relative-time` fixture pins `now` to a fixed instant and is swept normally, so
  // the component's geometry IS covered; only this one demo's live clock is not.
  relativeTimeLive:
    "live clock: re-renders on its own timer, geometry is not stable",
};

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

const FIXTURES = ALL_FIXTURES.filter(([name]) => !(name in UNSWEPT)).sort(
  ([a], [b]) => a.localeCompare(b),
);

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
    FIXTURES.length,
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
  // sized 24px controls (attachment, code-block, filter-bar, password-input, text-edit) — always
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
    return label?.control === element;
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
 * passed on the ring it is not supposed to have: `otp-input-slot` measured
 * `outline-style: solid / 2px` here and this assertion went green, because a class-glue defect had
 * destroyed `outline-hidden` and handed it branch (A). Pinning the set to branch (B) — and
 * asserting `outline-style: none` outright — is what makes that visible.
 *
 * `select-trigger` is deliberately NOT in this set, though the finding that produced this change
 * listed it. Measured 2026-09-09: a focused `[data-slot=select-trigger]` computes
 * `outline-style: solid`, `outline-width: 2px`. That is by design and documented on the component
 * ("button-style trigger: the centralized base.css `:focus-visible` outline also applies for
 * keyboard nav", select.tsx) — it wears `fieldControl` for its CHROME while remaining a button.
 * Adding it here would fail a correct control.
 */
const TEXT_ENTRY_SLOTS =
  "[data-slot=input],[data-slot=textarea],[data-slot=field-control]," +
  "[data-slot=otp-input-slot],[data-slot=combobox-input]";

/**
 * The wrapper that owns a text-entry control's focus affordance, if any.
 *
 * AGENTS.md § Accessibility: "visible `:focus-visible` (text-entry fields use a border tint
 * instead)". The tint is applied by `fieldSurface` / `fieldGroupSurface` in `@vegastack/design` —
 * `focus:border-ring/(--alpha-tint-border)` on the control, `focus-within:border-…` on the group —
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
  // ring it suppresses. `outline-hidden` compiles to a TRANSPARENT 2px outline (kept so
  // `forced-colors: active` has something to repaint), which computes as `outline-style: none`;
  // anything else means the suppression was lost.
  if (textEntry && style.outlineStyle !== "none") {
    return (
      `is a text-entry control presenting outline-style "${style.outlineStyle}" ` +
      `(${style.outlineWidth}). Text entry suppresses the global :focus-visible ring with ` +
      `\`outline-hidden\` and signals focus with the border tint instead (AGENTS.md ` +
      `\u00a7 Accessibility) — an outline here means the suppression was lost`
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
          `(first measured scrollWidth ${document.documentElement.scrollWidth} > clientWidth ${document.documentElement.clientWidth})`,
      },
    )
    .toBe(true);
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
    // …and the token theme itself, which the utilities above do not depend on: a missing
    // `@vegastack/design-tokens/theme.css` leaves every `--size-*`/`--icon-*` sizing utility
    // resolving to nothing while plain Tailwind utilities still compile.
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--size-md")
        .trim(),
      "the @vegastack token theme is not on this page (--size-md is unset), so every control " +
        "sized with `h-(--size-md)` collapses and the 24px floor is meaningless.",
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
    await runAssertion(name, "reflow", () => expectContained(name, ""));

    // (2) RTL containment — the same fact with the writing direction flipped, which is where a
    // hard-coded `left`/`ml-*` or a non-logical inset shows up as an overflow.
    document.documentElement.setAttribute("dir", "rtl");
    await settle();
    await runAssertion(name, "rtl", () => expectContained(name, " in RTL"));
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
    await runAssertion(name, "focus", () => {
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
