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
 *     file's 541 fixtures RED, each naming `outline-style: auto`; restoring it returns 541/541.
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
 * Every measurement below was re-taken on 2026-09-08 with the per-assertion map in place; the
 * numbers are from that run, not carried over from the flat-list version. Guard 2 earned its
 * keep on the first run: `comboboxMultiple` (recorded as a 16×16 chip remove — it measures
 * 24.00×24.00 now that the Chip primitive owns that control) and `chartDemoDonut` (recorded as a
 * donut `<g role="button">` the rectangular probe could not express — no such control matches
 * `INTERACTIVE_SELECTOR` at all; the only interactive node is the 270×256 `<svg>`, which passes)
 * were both exempting assertions that PASS. A flat list would have carried both indefinitely.
 */
const EXCLUDED: Record<string, Partial<Record<Assertion, string>>> = {
  // ── focus indicator ───────────────────────────────────────────────────────────────────────
  // EVERY entry below is a text-entry control, and every one of them fails the SAME way: on
  // focus its computed `border-color` is `oklab(0.145 0.000776457 0.00289778 / 0.08)` — the
  // resting `--input` colour — where the sanctioned tint
  // (`focus:border-ring/(--alpha-tint-border)`, `fieldSurface` in `@vegastack/design`) should
  // produce `--ring` at 70%, around `oklab(0.353 … / 0.7)`. `outline-style` is `none` on these
  // controls by design: a text field cannot tell mouse from keyboard, so the border tint IS its
  // whole focus affordance. It is not appearing, so they have none.
  //
  // Measured 2026-09-09 while adding this assertion, and NOT a probe artefact — each of these was
  // checked directly: the utility is in the compiled sheet
  // (`.focus\:border-ring\/\(--alpha-tint-border\):focus { border-color: color-mix(in oklab,
  // var(--ring) var(--alpha-tint-border), transparent) }`), `--ring` computes to
  // `oklch(0.353 0.003 75)` at both `:root` and the control, `--alpha-tint-border` computes to
  // `70%`, `CSS.supports` accepts `color-mix`, and `control.matches(":focus")` is true. The rule
  // matches and the computed value is still the resting one. Diagnosing which declaration wins is
  // component/token work, not gate work: written up in `docs/ledger/bugs.md` (2026-09-09) and
  // flagged for MK rather than fixed here.
  //
  // These entries are SELF-INVALIDATING, like every other entry in this map: `runAssertion` still
  // executes an excluded assertion in expect-failure mode, so the day the tint lands, each of
  // these turns red with "the exclusion is stale" and must be deleted. Nobody has to remember.
  chipInputValidation: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  fieldBorderless: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  fieldStates: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  inputAddonStates: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  inputStates: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  otpInputField: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  otpInputStates: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  passwordInput: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  passwordInputStates: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  textareaStates: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  textEdit: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  textEditHeights: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  textEditInvalid: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  textEditStates: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  textEditSubmit: {
    focus:
      "focus: text-entry border tint absent — border-color stays oklab(0.145 0.000776457 0.00289778 / 0.08) (the resting --input) on :focus; expected --ring at --alpha-tint-border (70%)",
  },
  // ── reflow / RTL ──────────────────────────────────────────────────────────────────────────
  // The demo lays two fixed-width scroll panels side by side, which do not fit a 320px viewport.
  // The docs route absorbed that inside `PreviewFrameContainer`'s `overflow-x-auto`, so the
  // page-level reflow assertion never saw it. The overflow is in the DEMO's layout, not the
  // utility being demonstrated — and it is direction-independent, hence both lanes.
  scrollFadeEdge: {
    reflow:
      "reflow: two side-by-side scroll panels, scrollWidth 332 > clientWidth 320",
    rtl: "reflow (RTL): mirroring does not change the fixed widths, scrollWidth 332 > 320",
  },
  scrollFadeSize: {
    reflow:
      "reflow: two side-by-side scroll panels, scrollWidth 332 > clientWidth 320",
    rtl: "reflow (RTL): mirroring does not change the fixed widths, scrollWidth 332 > 320",
  },

  // ── 24px size floor ───────────────────────────────────────────────────────────────────────
  // The control's effective target (border box ∪ ::before/::after hit area) is under 24px on one
  // axis. Each of these still runs reflow AND RTL. Control index is the position in the
  // fixture's `INTERACTIVE_SELECTOR` order, so a failure is locatable without re-deriving it.
  iconText: {
    target:
      "size: control 0 (focusable truncation trigger) measures 206.00×21.00 — height short",
  },
  iconTextSides: {
    target:
      "size: control 0 (focusable truncation trigger) measures 206.00×21.00 — height short",
  },
  markerLinkButton: {
    target:
      "size: control 0 (marker link) measures 270.00×21.00 — height short",
  },
  messageScrollerVisibility: {
    target: "size: control 2 measures 99.00×16.00 — height short",
  },
  tabsChip: {
    target: "size: control 3 (chip tab) measures 237.97×21.00 — height short",
  },

  // ── 24px obstruction ──────────────────────────────────────────────────────────────────────
  // The control is big enough, but something else owns the interior of the centred 24px square:
  // `elementFromPoint` resolves the probe points to another element. Miss counts are out of the
  // five points probed (four edges of the centred square, plus its centre).
  actionBarPending: {
    target:
      "obstruction: control 0 (visual 58.6×28.0) misses all 5 points — the pending ActionBar " +
      "surface owns its own control's centre",
  },
  attachmentImageThumbnail: {
    target:
      "obstruction: control 0 (visual 24.0×24.0) misses all 5 points — the `absolute inset-0` " +
      "attachment trigger covers the 24×24 action beneath it",
  },
  resizableNested: {
    target:
      "obstruction: control 0 (visual 1.0×254.0, its -inset hit area passes the size floor) " +
      "misses 3 of 5 points — nested handles overlap, so the outer handle's centre is owned by " +
      "the inner one",
  },
  timeline: {
    target:
      "obstruction: control 0 (visual 63.4×16.0) misses 1 of 5 points — the timeline separator " +
      "marker owns the centre of the adjacent link",
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
 * The wrapper that owns a text-entry control's focus affordance, if any.
 *
 * AGENTS.md § Accessibility: "visible `:focus-visible` (text-entry fields use a border tint
 * instead)". The tint is applied by `fieldSurface` / `fieldGroupSurface` in `@vegastack/design` —
 * `focus:border-ring/(--alpha-tint-border)` on the control, `focus-within:border-…` on the group —
 * so the element whose border changes may be an ancestor of the focused control.
 */
function tintCarriers(control: Element): Element[] {
  return [
    control,
    control.closest("[data-field-group]"),
    control.closest('[data-slot="text-edit"]'),
    control.parentElement,
  ].filter((element): element is Element => element instanceof Element);
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
 */
function focusIndicatorProblem(
  control: Element,
  rest: FocusSignature,
): string | null {
  const style = getComputedStyle(control);
  const width = Number.parseFloat(style.outlineWidth);
  if (AUTHORED_OUTLINE.test(style.outlineStyle) && width >= 2) return null;

  const focused = focusSignature(control);
  if (focused.borders.some((border, index) => border !== rest.borders[index]))
    return null;

  return style.outlineStyle === "auto"
    ? `presents only the USER AGENT's focus ring (outline-style: auto, ${style.outlineWidth}). ` +
        `The design system's own ring is missing, and the browser's is not the contract — a ` +
        `forced-colors or non-Chromium user gets nothing. Expected an authored >=2px outline ` +
        `from :focus-visible, or the text-entry border tint`
    : `presents no focus indicator: outline-style "${style.outlineStyle}" (${style.outlineWidth}) ` +
        `and no border-colour change on the control, its [data-field-group], or its wrapper`;
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
 * Playwright's `isDisabled`, in plain DOM.
 *
 * `:disabled` covers native form controls (and, per the CSS selector's own semantics, a control
 * inside a disabled `<fieldset>`). ARIA disablement is INHERITED the same way Playwright treats
 * it: a control inside an `[aria-disabled="true"]` container — a disabled menu item wrapper, a
 * disabled toolbar group — is disabled too, even though the attribute is not on the control
 * itself. The first version of this file checked only the control's own attribute and so probed
 * controls the route lane had skipped.
 */
function isDisabled(element: Element) {
  return (
    element.matches(":disabled") ||
    element.closest('[aria-disabled="true"]') !== null
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
      for (const [index, control] of controls.entries()) {
        if (!isVisible(control) || isDisabled(control)) continue;
        if (control.getAttribute("aria-hidden") === "true") continue;
        if (control.classList.contains("sr-only")) continue;
        // Not focusable at all: a `[role="option"]` inside a listbox that owns focus itself, a
        // `[role="menuitem"]` under a roving tabindex whose active item is elsewhere. Focus
        // indication is the business of whatever CAN hold focus.
        if (!(control instanceof HTMLElement) || control.tabIndex < 0) continue;

        const rest = focusSignature(control);
        control.focus();
        // A component may redirect focus (a wrapper hands it to its inner input). Measure whatever
        // actually holds focus, and only when it is this control or inside it — otherwise the
        // control never took focus and nothing about ITS indicator was demonstrated.
        const active = document.activeElement;
        if (active !== control && !control.contains(active)) continue;
        const focused = active instanceof HTMLElement ? active : control;
        const problem = focusIndicatorProblem(
          focused,
          focused === control ? rest : focusSignature(focused),
        );
        if (problem)
          problems.push(`control ${index} (${describe(focused)}) ${problem}`);
      }
      (document.activeElement as HTMLElement | null)?.blur?.();
      expect(
        problems,
        `${name}: every focusable control must show a focus indicator the design system owns ` +
          `(WCAG 2.2 §2.4.11/§2.4.13, AGENTS.md § Accessibility)`,
      ).toEqual([]);
    });
  });
}
