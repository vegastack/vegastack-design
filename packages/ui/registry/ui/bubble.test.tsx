/*
 * COMPILED CSS, ON PURPOSE.
 *
 * Almost every component test in this repository runs unstyled — a fast structural lane where
 * `outline-3` and `:focus-visible` are inert. Bubble cannot, because all three exceptions its
 * patch implements are about PAINT, and none of them can be proven by a class-string assertion:
 *
 *   FOC-1 / FOC-6 — `BubbleContent` drops upstream's `[button,a]:outline-none` and its
 *     `focus-visible:ring-3 ring-ring/50` halo, so an interactive bubble takes `base.css`'s one
 *     2px `:focus-visible` outline. "The class is gone" is a paraphrase; "focus lands and paints a
 *     >= 2px SOLID outline, and nothing paints a 3px box-shadow spread" is the claim.
 *   FOC-6 — `bubbleReactionsVariants` swaps upstream's RESTING `ring-3 ring-card` for
 *     `outline-3 outline-card`. The band has to still BE 3px, or the exception traded a defect for
 *     a regression. Only a computed `outline-width` can say so.
 *   A11Y-13 — the `destructive` bubble's ink is the family's `-text` role rather than the fill,
 *     because the fill measures 3.987:1 on its own `/10` tint. That is a COLOUR, so the assertion
 *     is a computed `color` compared against live probes — and, more importantly, it is what makes
 *     axe's `color-contrast` rule below a real rendered-contrast gate rather than a vacuous one.
 *
 * So this file imports the same stylesheet the geometry lane compiles (real Tailwind + the real
 * token theme). Two consequences worth knowing before editing it:
 *   1. axe's `color-contrast` rule is LIVE here (it is vacuous in the unstyled lanes), so every
 *      `expectNoA11yViolations` call below is a real rendered-colour assertion too. Nothing is
 *      suppressed: no `disableRules` list is passed anywhere in this file.
 *   2. Chromium's `:focus-visible` heuristic is sensitive to what the last interaction was, so the
 *      focus test drives real keyboard focus (`userEvent.tab()`), never `element.focus()`.
 */
import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeAll, expect, test } from "vitest";
import { CheckIcon, InfoIcon } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "./bubble";
import { Button } from "./button";
import { Collapsible, CollapsibleTrigger } from "./collapsible";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

/** Upstream's own `variant` union, in upstream's own order. */
const VARIANTS = [
  "default",
  "secondary",
  "muted",
  "tinted",
  "outline",
  "ghost",
  "destructive",
] as const;

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const slots = (root: ParentNode, name: string) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];

/** The nth `data-slot="<name>"` element, asserted present rather than narrowed away. */
const nth = (root: ParentNode, name: string, index: number): HTMLElement => {
  const found = slots(root, name)[index];
  if (!found) throw new Error(`no [data-slot="${name}"] at index ${index}`);
  return found;
};

beforeAll(async () => {
  await page.viewport(900, 800);

  // COMPILED-CSS SENTINEL, the same fact the geometry lane proves in its own `beforeAll`: with no
  // stylesheet `outline-3` is inert, every measurement in this file reads 0px, and axe's
  // `color-contrast` rule goes quietly vacuous. A file whose central claims are measurements must
  // never report green over unstyled DOM.
  const sentinel = document.createElement("div");
  sentinel.className = "w-5 h-5";
  document.body.append(sentinel);
  try {
    const computed = getComputedStyle(sentinel);
    expect(
      { width: computed.width, height: computed.height },
      "test/geometry.css did not compile: `w-5 h-5` must resolve to 20px. Every measurement in " +
        "this file is meaningless without it.",
    ).toEqual({ width: "20px", height: "20px" });
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--card")
        .trim(),
      "the @vegastack token theme is not on this page (--card is unset).",
    ).not.toBe("");
  } finally {
    sentinel.remove();
  }
});

/** The rendered value of one Tailwind colour utility, read off a throwaway probe. */
function probeColor(className: string, property: "color" | "backgroundColor") {
  const probe = document.createElement("div");
  probe.className = className;
  document.body.append(probe);
  try {
    return getComputedStyle(probe)[property];
  } finally {
    probe.remove();
  }
}

/**
 * The 24px effective pointer target of one control, measured the way
 * `packages/ui/test/geometry.browser.test.tsx` measures it: the union of the border box and any
 * absolutely positioned `::before`/`::after` hit area for the SIZE, and five
 * `document.elementFromPoint` probes inside the centred 24px square for OBSTRUCTION.
 */
function effectiveTarget(element: HTMLElement) {
  element.scrollIntoView({ block: "center", inline: "center" });
  const rect = element.getBoundingClientRect();
  let { left, top, right, bottom } = rect;
  for (const pseudo of ["::before", "::after"]) {
    const style = getComputedStyle(element, pseudo);
    if (style.content === "none" || style.position !== "absolute") continue;
    if (style.display === "none" || style.visibility === "hidden") continue;
    const parse = (value: string) =>
      value.endsWith("px") ? Number.parseFloat(value) : Number.NaN;
    const [t, r, b, l] = [style.top, style.right, style.bottom, style.left].map(
      parse,
    ) as [number, number, number, number];
    if ([t, r, b, l].some(Number.isNaN)) continue;
    left = Math.min(left, rect.left + l);
    top = Math.min(top, rect.top + t);
    right = Math.max(right, rect.right - r);
    bottom = Math.max(bottom, rect.bottom - b);
  }

  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;
  // Half a pixel in from the 24px square's edge: Blink hit-tests against pixel-snapped bounds.
  const half = 12 - 0.5;
  const misses = (
    [
      [centerX - half, centerY],
      [centerX + half, centerY],
      [centerX, centerY - half],
      [centerX, centerY + half],
      [centerX, centerY],
    ] as const
  )
    .map(([x, y]) => ({ x, y, hit: document.elementFromPoint(x, y) }))
    .filter(({ hit }) => !hit || !(hit === element || element.contains(hit)))
    .map(({ x, y, hit }) => ({
      x,
      y,
      hit: hit instanceof Element ? hit.outerHTML.slice(0, 120) : null,
    }));

  return {
    visual: { width: rect.width, height: rect.height },
    effective: { width: right - left, height: bottom - top },
    misses,
  };
}

/* ── Usage ──────────────────────────────────────────────────────────────────────────────────── */

test("renders every exported part with its data-slot (Usage)", async () => {
  const screen = await render(
    <BubbleGroup>
      <Bubble>
        <BubbleContent>
          I checked the registry output and removed the stale route.
        </BubbleContent>
        <BubbleReactions role="img" aria-label="Reaction: thumbs up">
          <span>👍</span>
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>,
  );
  for (const name of [
    "bubble-group",
    "bubble",
    "bubble-content",
    "bubble-reactions",
  ]) {
    expect(slot(screen.container, name), name).not.toBeNull();
  }
});

/* ── Composition ────────────────────────────────────────────────────────────────────────────── */

test("Composition: the content is the bubble's child and the reactions float over it", async () => {
  const screen = await render(
    <Bubble>
      <BubbleContent>Framed text.</BubbleContent>
      <BubbleReactions role="img" aria-label="Reaction: thumbs up">
        <span>👍</span>
      </BubbleReactions>
    </Bubble>,
  );
  const bubble = slot(screen.container, "bubble") as HTMLElement;
  const content = slot(screen.container, "bubble-content") as HTMLElement;
  const reactions = slot(screen.container, "bubble-reactions") as HTMLElement;
  expect(content.parentElement).toBe(bubble);
  expect(reactions.parentElement).toBe(bubble);
  // The bubble is the positioning context; the chip is taken out of flow on top of it.
  expect(getComputedStyle(bubble).position).toBe("relative");
  expect(getComputedStyle(reactions).position).toBe("absolute");
});

/* ── Features ───────────────────────────────────────────────────────────────────────────────── */

test("Features: a bubble sizes to its content, capped at 80% of the row, and ghost lifts the cap", async () => {
  const screen = await render(
    <div style={{ width: "600px" }}>
      <Bubble>
        <BubbleContent>Short.</BubbleContent>
      </Bubble>
      <Bubble>
        <BubbleContent>
          A much longer message that would happily run the full width of this
          six-hundred-pixel row if the bubble let it, which it does not.
        </BubbleContent>
      </Bubble>
      <Bubble variant="ghost">
        <BubbleContent>
          A ghost bubble drops the cap so assistant text and rich content can
          span the whole row without looking like a chat surface at all.
        </BubbleContent>
      </Bubble>
    </div>,
  );
  const short = nth(screen.container, "bubble", 0);
  const long = nth(screen.container, "bubble", 1);
  const ghost = nth(screen.container, "bubble", 2);
  expect(short.getBoundingClientRect().width).toBeLessThan(600 * 0.8);
  expect(long.getBoundingClientRect().width).toBeCloseTo(600 * 0.8, 0);
  expect(ghost.getBoundingClientRect().width).toBeCloseTo(600, 0);
});

/* ── Variants ───────────────────────────────────────────────────────────────────────────────── */

test("Variants: every one of upstream's seven sets data-variant", async () => {
  const screen = await render(
    <div>
      {VARIANTS.map((variant) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent>{variant}</BubbleContent>
        </Bubble>
      ))}
    </div>,
  );
  expect(
    slots(screen.container, "bubble").map((el) => el.dataset.variant),
  ).toEqual([...VARIANTS]);
});

test("Variants: the default is `default`, and ghost strips the surface off the content", async () => {
  const screen = await render(
    <div>
      <Bubble>
        <BubbleContent>Default.</BubbleContent>
      </Bubble>
      <Bubble variant="ghost">
        <BubbleContent>Ghost.</BubbleContent>
      </Bubble>
    </div>,
  );
  const fallback = nth(screen.container, "bubble", 0);
  const ghost = nth(screen.container, "bubble", 1);
  expect(fallback.dataset.variant).toBe("default");
  const surface = getComputedStyle(nth(screen.container, "bubble-content", 1));
  // `*:data-[slot=bubble-content]:bg-transparent` + `:p-0` — the ghost content paints nothing.
  expect(surface.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(surface.paddingTop).toBe("0px");
  expect(ghost.dataset.variant).toBe("ghost");
});

/* ── Alignment ──────────────────────────────────────────────────────────────────────────────── */

test("Alignment: `align` sets data-align, defaults to start, and end self-aligns the bubble", async () => {
  const screen = await render(
    <div style={{ display: "flex", flexDirection: "column", width: "600px" }}>
      <Bubble variant="muted">
        <BubbleContent>Start (the default).</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>End.</BubbleContent>
      </Bubble>
    </div>,
  );
  const start = nth(screen.container, "bubble", 0);
  const end = nth(screen.container, "bubble", 1);
  expect(start.dataset.align).toBe("start");
  expect(end.dataset.align).toBe("end");
  expect(getComputedStyle(end).alignSelf).toBe("flex-end");
  expect(getComputedStyle(start).alignSelf).not.toBe("flex-end");
});

/* ── Bubble Group ───────────────────────────────────────────────────────────────────────────── */

test("Bubble Group: the group stacks bubbles and each one keeps its own align", async () => {
  const screen = await render(
    <BubbleGroup>
      <Bubble align="end">
        <BubbleContent>You tell me!</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>It worked yesterday.</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>Let me take a look.</BubbleContent>
      </Bubble>
    </BubbleGroup>,
  );
  const group = slot(screen.container, "bubble-group") as HTMLElement;
  const style = getComputedStyle(group);
  expect(style.display).toBe("flex");
  expect(style.flexDirection).toBe("column");
  expect(
    slots(screen.container, "bubble").map((el) => el.dataset.align),
  ).toEqual(["end", "end", "start"]);
  // The group adds no alignment of its own — that is what the docs note, and what makes the
  // per-bubble `align` the only authority.
  expect(group.dataset.align).toBeUndefined();
});

/* ── Links and Buttons ──────────────────────────────────────────────────────────────────────── */

test("Links and Buttons: `render` makes the content a real control, named by its own text", async () => {
  const clicked: string[] = [];
  const screen = await render(
    <BubbleGroup>
      <Bubble variant="tinted" align="end">
        <BubbleContent
          render={
            <button type="button" onClick={() => clicked.push("password")} />
          }
        >
          I forgot my password
        </BubbleContent>
      </Bubble>
      <Bubble variant="tinted" align="end">
        <BubbleContent render={<a href="#logs" />}>
          Open the deploy logs
        </BubbleContent>
      </Bubble>
    </BubbleGroup>,
  );
  const asButton = nth(screen.container, "bubble-content", 0);
  const asLink = nth(screen.container, "bubble-content", 1);
  expect(asButton.tagName).toBe("BUTTON");
  expect(asLink.tagName).toBe("A");
  await userEvent.click(
    screen.getByRole("button", { name: "I forgot my password" }),
  );
  expect(clicked).toEqual(["password"]);
  expect(
    screen.getByRole("link", { name: "Open the deploy logs" }),
  ).toBeTruthy();
});

test("A11Y-2 (NO HUNK): an interactive bubble clears the 24px pointer floor from the call site's own box", async () => {
  const screen = await render(
    <Bubble variant="tinted" align="end">
      <BubbleContent render={<button type="button" />}>Yes</BubbleContent>
    </Bubble>,
  );
  const control = slot(screen.container, "bubble-content") as HTMLElement;
  // The patch records A11Y-2 as audited with NO HUNK: nothing in bubble.tsx is a pointer target of
  // its own, and when a call site renders a control into `BubbleContent` the control's own box is
  // what has to clear the floor. `px-3 py-2 text-sm leading-relaxed` is that box — measured here so
  // the "no hunk needed" claim is a measurement rather than an assertion about intent.
  const probe = effectiveTarget(control);
  expect(probe.effective.width, JSON.stringify(probe)).toBeGreaterThanOrEqual(
    24,
  );
  expect(probe.effective.height, JSON.stringify(probe)).toBeGreaterThanOrEqual(
    24,
  );
  expect(probe.misses, JSON.stringify(probe)).toEqual([]);
});

/* ── Reactions ──────────────────────────────────────────────────────────────────────────────── */

test("Reactions: `side` and `align` set data-side / data-align, defaulting to bottom / end", async () => {
  const screen = await render(
    <div>
      <Bubble variant="muted">
        <BubbleContent>Defaults.</BubbleContent>
        <BubbleReactions role="img" aria-label="Reaction: eyes">
          <span>👀</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>Bottom start.</BubbleContent>
        <BubbleReactions
          side="bottom"
          align="start"
          role="img"
          aria-label="Reaction: thumbs up"
        >
          <span>👍</span>
        </BubbleReactions>
      </Bubble>
      <Bubble>
        <BubbleContent>Top start.</BubbleContent>
        <BubbleReactions
          side="top"
          align="start"
          role="img"
          aria-label="Reaction: party popper"
        >
          <span>🎉</span>
        </BubbleReactions>
      </Bubble>
      <Bubble>
        <BubbleContent>Top end.</BubbleContent>
        <BubbleReactions
          side="top"
          align="end"
          role="img"
          aria-label="Reaction: rocket"
        >
          <span>🚀</span>
        </BubbleReactions>
      </Bubble>
    </div>,
  );
  expect(
    slots(screen.container, "bubble-reactions").map((el) => [
      el.dataset.side,
      el.dataset.align,
    ]),
  ).toEqual([
    ["bottom", "end"],
    ["bottom", "start"],
    ["top", "start"],
    ["top", "end"],
  ]);
});

test("Reactions: the row anchors to the bubble edge it names", async () => {
  const screen = await render(
    <div>
      <Bubble variant="muted">
        <BubbleContent>Anchored to the bottom edge.</BubbleContent>
        <BubbleReactions role="img" aria-label="Reaction: eyes">
          <span>👀</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>Anchored to the top edge.</BubbleContent>
        <BubbleReactions side="top" role="img" aria-label="Reaction: eyes">
          <span>👀</span>
        </BubbleReactions>
      </Bubble>
    </div>,
  );
  const bubbleBottom = nth(screen.container, "bubble", 0);
  const bubbleTop = nth(screen.container, "bubble", 1);
  const chipBottom = nth(screen.container, "bubble-reactions", 0);
  const chipTop = nth(screen.container, "bubble-reactions", 1);
  const bottomBox = bubbleBottom.getBoundingClientRect();
  const topBox = bubbleTop.getBoundingClientRect();
  // `bottom-0 translate-y-3/4` / `top-0 -translate-y-3/4`: the chip straddles the named edge.
  expect(chipBottom.getBoundingClientRect().top).toBeGreaterThan(
    (bottomBox.top + bottomBox.bottom) / 2,
  );
  expect(chipTop.getBoundingClientRect().bottom).toBeLessThan(
    (topBox.top + topBox.bottom) / 2,
  );
});

test("Reactions: an interactive row renders real buttons the chip collapses its padding for", async () => {
  const clicked: string[] = [];
  const screen = await render(
    <Bubble variant="destructive">
      <BubbleContent>Are you sure I can run this command?</BubbleContent>
      <BubbleReactions>
        <Button variant="ghost" size="xs" onClick={() => clicked.push("run")}>
          Yes, run it
        </Button>
      </BubbleReactions>
    </Bubble>,
  );
  const chip = slot(screen.container, "bubble-reactions") as HTMLElement;
  // `has-[button]:p-0` — the button owns the chip's whole box once there is one.
  expect(getComputedStyle(chip).paddingTop).toBe("0px");
  await userEvent.click(screen.getByRole("button", { name: "Yes, run it" }));
  expect(clicked).toEqual(["run"]);
});

/* ── Show More / Collapsible ────────────────────────────────────────────────────────────────── */

test("Show More / Collapsible: the trigger inside the bubble expands and collapses the text", async () => {
  const text = "The accessibility review found two subtle focus states.";
  function Subject() {
    const [open, setOpen] = React.useState(false);
    return (
      <Bubble variant="muted" align="end">
        <BubbleContent className="whitespace-pre-line">
          <Collapsible open={open} onOpenChange={setOpen}>
            <div>{open ? text : `${text.slice(0, 20)}...`}</div>
            <CollapsibleTrigger
              render={<Button variant="link" className="p-0" />}
            >
              {open ? "Show less" : "Show more"}
            </CollapsibleTrigger>
          </Collapsible>
        </BubbleContent>
      </Bubble>
    );
  }
  const screen = await render(<Subject />);
  expect(screen.container.textContent).not.toContain(text);
  await userEvent.click(screen.getByRole("button", { name: "Show more" }));
  await expect.poll(() => screen.container.textContent).toContain(text);
  await userEvent.click(screen.getByRole("button", { name: "Show less" }));
  await expect
    .poll(() => screen.container.textContent?.includes(text))
    .toBe(false);
});

/* ── Tooltip ────────────────────────────────────────────────────────────────────────────────── */

test("Tooltip: a control in the reactions row opens a tooltip naming the metadata", async () => {
  const screen = await render(
    <TooltipProvider>
      <Bubble align="end">
        <BubbleContent>Yes, removed it from the registry.</BubbleContent>
        <BubbleReactions>
          <Tooltip>
            <TooltipTrigger
              aria-label="Read receipt"
              render={<Button variant="ghost" size="icon-xs" />}
            >
              <CheckIcon />
            </TooltipTrigger>
            <TooltipContent>Read on Jan 5, 2026 at 4:32 PM</TooltipContent>
          </Tooltip>
        </BubbleReactions>
      </Bubble>
    </TooltipProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Read receipt" });
  await userEvent.hover(trigger);
  await expect
    .poll(() => document.body.textContent)
    .toContain("Read on Jan 5, 2026 at 4:32 PM");
});

/* ── Popover ────────────────────────────────────────────────────────────────────────────────── */

test("Popover: a control in the reactions row opens the failure detail on demand", async () => {
  const screen = await render(
    <Bubble variant="destructive">
      <BubbleContent>Failed to run the command.</BubbleContent>
      <BubbleReactions>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Show error details"
              />
            }
          >
            <InfoIcon />
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle className="text-sm">
                Command failed with exit code 1
              </PopoverTitle>
              <PopoverDescription className="text-sm">
                ENOENT: no such file or directory, open pnpm-lock.yaml
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </BubbleReactions>
    </Bubble>,
  );
  expect(document.body.textContent).not.toContain("exit code 1");
  await userEvent.click(
    screen.getByRole("button", { name: "Show error details" }),
  );
  await expect
    .poll(() => document.body.textContent)
    .toContain("Command failed with exit code 1");
});

/* ── the exceptions the patch implements ────────────────────────────────────────────────────── */

test("FOC-1/FOC-6: keyboard focus on an interactive bubble paints the design system's own outline", async () => {
  const screen = await render(
    <Bubble variant="tinted" align="end">
      <BubbleContent render={<button type="button" />}>
        I forgot my password
      </BubbleContent>
    </Bubble>,
  );
  // Real keyboard focus, not `element.focus()`: Chromium's `:focus-visible` heuristic is sensitive
  // to what the last interaction was.
  await userEvent.tab();
  const focused = document.activeElement as HTMLElement;
  expect(focused.dataset.slot).toBe("bubble-content");
  const style = getComputedStyle(focused);
  // `auto` would be the USER AGENT's ring — accepting it is how a focus check becomes unfalsifiable,
  // and upstream's `[button,a]:outline-none` would have reported `none` here.
  expect(style.outlineStyle).toBe("solid");
  expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  // The halo upstream drew instead would show up here as a 3px box-shadow spread. Nothing paints one.
  expect(style.boxShadow).not.toMatch(/ 3px/);
  expect(slot(screen.container, "bubble-content")).toBe(focused);
});

test("FOC-6: the resting reactions chip paints a 3px OUTLINE band, not a ring", async () => {
  const screen = await render(
    <Bubble variant="muted">
      <BubbleContent>Punched out of the bubble edge.</BubbleContent>
      <BubbleReactions role="img" aria-label="Reaction: thumbs up">
        <span>👍</span>
      </BubbleReactions>
    </Bubble>,
  );
  const chip = slot(screen.container, "bubble-reactions") as HTMLElement;
  const style = getComputedStyle(chip);
  // Upstream's `ring-3 ring-card` is a box-shadow; `outline-3 outline-card` paints the identical
  // band with no shadow at all. Both halves are asserted, because dropping the ring without
  // keeping the 3px band would have traded a defect for a regression.
  expect(style.outlineStyle).toBe("solid");
  expect(Number.parseFloat(style.outlineWidth)).toBe(3);
  expect(style.boxShadow).toBe("none");
  // …and it is the `card` token, which is what makes the chip read as punched out of the
  // surface it sits on. Compared against a probe wearing `bg-card`, so the assertion is the
  // rendered colour rather than the class name.
  const cardColor = probeColor("bg-card", "backgroundColor");
  expect(cardColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(style.outlineColor).toBe(cardColor);
});

test("A11Y-13: the destructive bubble's ink is the family's -text role, not the fill", async () => {
  const screen = await render(
    <Bubble variant="destructive">
      <BubbleContent>Failed to run the command.</BubbleContent>
    </Bubble>,
  );
  const content = slot(screen.container, "bubble-content") as HTMLElement;
  // Upstream writes `text-destructive` here. On its own `/10` tint that composites to 3.987:1 —
  // under the AA floor — where the `-text` role reads 6.966:1. Measured as a COLOUR against live
  // probes rather than as a class string, so putting the fill back turns this red even if the
  // class name changes shape. The `expectNoA11yViolations` call for the destructive variant below
  // is the second half of the same claim: with this stylesheet compiled, axe's `color-contrast`
  // rule is live, so the ratio itself is gated and not merely the token name.
  const inkText = probeColor("text-destructive-text", "color");
  const inkFill = probeColor("text-destructive", "color");
  expect(inkText, "the token theme resolves no --destructive-text").not.toBe(
    "rgba(0, 0, 0, 0)",
  );
  expect(
    inkFill,
    "the two destructive inks resolve to the same colour, so this test cannot tell them apart",
  ).not.toBe(inkText);
  expect(getComputedStyle(content).color).toBe(inkText);
  // The fill itself is untouched — A11Y-13 moves the ink and nothing else in the variant.
  expect(getComputedStyle(content).backgroundColor).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
});

test("FOC-1/FOC-6: no ring glow and no outline suppression anywhere in the tree", async () => {
  const screen = await render(
    <BubbleGroup>
      {VARIANTS.map((variant) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent render={<button type="button" />}>
            {variant}
          </BubbleContent>
          <BubbleReactions role="img" aria-label="Reaction: thumbs up">
            <span>👍</span>
          </BubbleReactions>
        </Bubble>
      ))}
    </BubbleGroup>,
  );
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\//);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toMatch(/\boutline-none\b|\boutline-hidden\b/);
  }
});

/* ── accessibility ──────────────────────────────────────────────────────────────────────────── */

for (const variant of VARIANTS) {
  test(`no a11y violations — the ${variant} variant`, async () => {
    const screen = await render(
      <Bubble variant={variant}>
        <BubbleContent>
          A message in the {variant} variant, with enough words to be read.
        </BubbleContent>
      </Bubble>,
    );
    await expectNoA11yViolations(screen.container);
  });
}

test("no a11y violations — a labelled reactions row read as one image", async () => {
  const screen = await render(
    <Bubble variant="muted">
      <BubbleContent>
        A row of glyphs is grouped as a single image.
      </BubbleContent>
      <BubbleReactions
        role="img"
        aria-label="Reactions: thumbs up, fire, and 8 more"
      >
        <span>👍</span>
        <span>🔥</span>
        <span>+8</span>
      </BubbleReactions>
    </Bubble>,
  );
  const chip = slot(screen.container, "bubble-reactions") as HTMLElement;
  expect(chip.getAttribute("role")).toBe("img");
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — an interactive reactions row of named icon buttons", async () => {
  const screen = await render(
    <Bubble variant="muted">
      <BubbleContent>Interactive reactions are buttons.</BubbleContent>
      <BubbleReactions>
        <Button aria-label="Thumbs up" variant="secondary" size="icon-xs">
          <CheckIcon />
        </Button>
      </BubbleReactions>
    </Bubble>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — link and button bubbles", async () => {
  const screen = await render(
    <BubbleGroup>
      <Bubble variant="tinted" align="end">
        <BubbleContent render={<button type="button" />}>
          I forgot my password
        </BubbleContent>
      </Bubble>
      <Bubble variant="tinted" align="end">
        <BubbleContent render={<a href="#logs" />}>
          Open the deploy logs
        </BubbleContent>
      </Bubble>
    </BubbleGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a group of bubbles with a reaction on the last one", async () => {
  const screen = await render(
    <BubbleGroup>
      <Bubble align="end">
        <BubbleContent>You tell me!</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Find the bug and fix it.</BubbleContent>
        <BubbleReactions role="img" aria-label="Reactions: eyes" align="start">
          <span>👀</span>
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>,
  );
  await expectNoA11yViolations(screen.container);
});
