/*
 * COMPILED CSS, ON PURPOSE.
 *
 * Almost every component test in this repository runs unstyled — a fast structural lane where
 * `size-6` and `absolute inset-0` are inert. Attachment cannot, because three of the claims its
 * patch makes are only checkable against real compiled colour and geometry:
 *
 *   A11Y-2 is recorded in `attachment.patch` as AUDITED WITH NO HUNK, on the strength of one
 *   measurement: `AttachmentAction` defaults to `size="icon-xs"`, which is `size-6` — 24px, EXACTLY
 *   on the SC 2.5.8 floor with nothing to spare. A class-string assertion cannot tell that from
 *   23px; the day upstream retunes the icon tier this file is what notices.
 *
 *   FOC-1/FOC-6 deletes upstream's `focus-within:ring-1 ring-ring/50` from the CARD and upstream's
 *   `outline-none` from the TRIGGER, on the claim that the trigger then paints `base.css`'s one
 *   outline instead. "The class is absent" is half of that claim; the other half is that a focused
 *   trigger really does wear a ≥2px AUTHORED outline, which is only true with the token stylesheet
 *   compiled and a real keyboard focus path.
 *
 *   A11Y-13 exists BECAUSE of this import. axe's `color-contrast` rule is vacuous in the unstyled
 *   lanes, so upstream's `text-destructive/80` error ink — 4.113:1 on `card` at 12px — shipped
 *   unmeasured until this file compiled the stylesheet and the very first run reported it. The ink
 *   is now `text-destructive-text`, and `no a11y violations — state=error` below is what holds it
 *   there. `packages/ui/test/contrast.browser.test.tsx` carries the same card in BOTH themes.
 *
 * Two consequences worth knowing before editing this file:
 *   1. Every `expectNoA11yViolations` below is a real rendered-colour assertion, not only a
 *      structural one. None of them carries a suppression list, and none may gain one.
 *   2. Motion is neutralised by `geometry.css`, so a measurement is of the settled layout.
 */
import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { beforeAll, expect, test } from "vitest";
import {
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  FileWarningIcon,
  XIcon,
} from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentProgress,
  AttachmentTitle,
  AttachmentTrigger,
} from "./attachment";
import { Image } from "./image";
import { Spinner } from "./spinner";

const STATES = ["idle", "uploading", "processing", "error", "done"] as const;
type State = (typeof STATES)[number];

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const slots = (root: ParentNode, name: string) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];

/** Every class literal anywhere in a rendered tree, including the root. */
function classesOf(root: HTMLElement): string {
  return [root, ...root.querySelectorAll<HTMLElement>("*")]
    .map((element) =>
      typeof element.className === "string" ? element.className : "",
    )
    .join(" ");
}

/**
 * The 24px effective pointer target of one control, measured the way the geometry lane measures
 * it: the union of the border box and any absolutely positioned `::before`/`::after` hit area for
 * SIZE, plus five `document.elementFromPoint` probes inside the centred 24px square for
 * OBSTRUCTION. A pseudo-element the cascade has switched off is skipped, so a hit area that is
 * present in the class string but inert in the browser cannot pass on the class string's behalf.
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
  // Half a pixel in from the 24px square's edge: Blink hit-tests against pixel-snapped bounds, so
  // a smaller inset reports phantom misses on the right/bottom edge of a perfectly sized control —
  // and `AttachmentAction` is perfectly sized, which is exactly the shape that flaked before.
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

/** Walk the keyboard path until `target` has focus — `.focus()` does not imply `:focus-visible`. */
async function tabTo(target: HTMLElement) {
  for (let step = 0; step < 12 && document.activeElement !== target; step++) {
    await userEvent.tab();
  }
  expect(
    document.activeElement,
    "the keyboard path never reached the control",
  ).toBe(target);
  await Promise.all(
    target
      .getAnimations()
      .map((animation) => animation.finished.catch(() => {})),
  );
}

function Card({
  state,
  ...props
}: { state?: State } & Omit<React.ComponentProps<typeof Attachment>, "state">) {
  return (
    <Attachment state={state} className="w-full max-w-sm" {...props}>
      <AttachmentMedia>
        {state === "uploading" ? (
          <Spinner />
        ) : state === "error" ? (
          <FileWarningIcon />
        ) : state === "idle" ? (
          <ClockIcon />
        ) : state === "done" ? (
          <CheckIcon />
        ) : (
          <FileTextIcon />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
        <AttachmentDescription>
          {state === "error"
            ? "Upload failed — the file is over 25 MB."
            : "PDF · 2.4 MB"}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove sales-dashboard.pdf">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

beforeAll(async () => {
  // The lane's own sentinel: if `geometry.css` did not reach the page, `size-6` compiles to
  // nothing and every measurement below silently becomes an assertion about an unstyled box.
  const probe = document.createElement("div");
  probe.className = "size-6";
  document.body.append(probe);
  const { width, height } = probe.getBoundingClientRect();
  probe.remove();
  expect(
    { width, height },
    "compiled CSS did not reach the page — every measurement in this file would be vacuous",
  ).toEqual({ width: 24, height: 24 });
});

/* ── Usage ──────────────────────────────────────────────────────────────────────────────────── */

test("renders every exported part with its data-slot (Usage)", async () => {
  const screen = await render(
    <AttachmentGroup>
      <Attachment>
        <AttachmentMedia variant="image">
          <img src="/preview/landscape.svg" alt="A scenic landscape" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>landscape.svg</AttachmentTitle>
          <AttachmentDescription>SVG · 820 KB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove landscape.svg">
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
        <AttachmentTrigger aria-label="Open landscape.svg" />
      </Attachment>
    </AttachmentGroup>,
  );
  for (const name of [
    "attachment-group",
    "attachment",
    "attachment-media",
    "attachment-content",
    "attachment-title",
    "attachment-description",
    "attachment-actions",
    "attachment-action",
    "attachment-trigger",
  ]) {
    expect(slot(screen.container, name), name).not.toBeNull();
  }
});

test("the trigger is a real button by default, and `render` makes it a link (Usage)", async () => {
  const plain = await render(
    <Attachment>
      <AttachmentTrigger aria-label="Preview report.pdf" />
    </Attachment>,
  );
  const button = slot(plain.container, "attachment-trigger") as HTMLElement;
  expect(button.tagName).toBe("BUTTON");
  expect(button.getAttribute("type")).toBe("button");

  const linked = await render(
    <Attachment>
      <AttachmentTrigger
        render={
          <a href="/preview/landscape.svg" aria-label="Open landscape.svg" />
        }
      />
    </Attachment>,
  );
  const anchor = slot(linked.container, "attachment-trigger") as HTMLElement;
  expect(anchor.tagName).toBe("A");
  // `type` is only defaulted for the button spelling — an `<a type="button">` would be nonsense.
  expect(anchor.hasAttribute("type")).toBe(false);
});

/* ── Composition ────────────────────────────────────────────────────────────────────────────── */

test("Composition: content holds the title and description, actions sit above the trigger", async () => {
  const screen = await render(<Card state="done" />);
  const content = slot(screen.container, "attachment-content") as HTMLElement;
  expect(slot(content, "attachment-title")).not.toBeNull();
  expect(slot(content, "attachment-description")).not.toBeNull();

  const withTrigger = await render(
    <Attachment className="w-full max-w-sm">
      <AttachmentContent>
        <AttachmentTitle>research-summary.pdf</AttachmentTitle>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove research-summary.pdf">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger aria-label="Preview research-summary.pdf" />
    </Attachment>,
  );
  const actions = slot(
    withTrigger.container,
    "attachment-actions",
  ) as HTMLElement;
  const trigger = slot(
    withTrigger.container,
    "attachment-trigger",
  ) as HTMLElement;
  // The whole point of the arrangement: the trigger fills the card BEHIND the actions.
  expect(Number(getComputedStyle(actions).zIndex)).toBeGreaterThan(
    Number(getComputedStyle(trigger).zIndex),
  );
  expect(getComputedStyle(trigger).position).toBe("absolute");
});

test("Composition: AttachmentGroup lays its attachments out in one scrollable row", async () => {
  const screen = await render(
    <AttachmentGroup className="w-64">
      <Attachment className="w-64">
        <AttachmentContent>
          <AttachmentTitle>one.pdf</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
      <Attachment className="w-64">
        <AttachmentContent>
          <AttachmentTitle>two.pdf</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    </AttachmentGroup>,
  );
  const group = slot(screen.container, "attachment-group") as HTMLElement;
  const style = getComputedStyle(group);
  expect(style.overflowX).toBe("auto");
  expect(style.scrollSnapType).toContain("x");
  expect(group.scrollWidth).toBeGreaterThan(group.clientWidth);
  const [first, second] = slots(screen.container, "attachment");
  expect(first!.getBoundingClientRect().top).toBeCloseTo(
    second!.getBoundingClientRect().top,
    0,
  );
});

/* ── Features ───────────────────────────────────────────────────────────────────────────────── */

test.each(STATES)(
  "Features: the title shimmers while %s only when the upload is in progress",
  async (state) => {
    const screen = await render(<Card state={state} />);
    const title = slot(screen.container, "attachment-title") as HTMLElement;
    const running = ["uploading", "processing"].includes(state);
    expect(
      getComputedStyle(title).animationName,
      `state="${state}" shimmer`,
    ).toBe(running ? "tw-shimmer" : "none");
  },
);

test("Features: an action stays clickable while the trigger fills the card", async () => {
  const opened: string[] = [];
  const screen = await render(
    <Attachment className="w-full max-w-sm">
      <AttachmentContent>
        <AttachmentTitle>research-summary.pdf</AttachmentTitle>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          aria-label="Remove research-summary.pdf"
          onClick={() => opened.push("action")}
        >
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger
        aria-label="Preview research-summary.pdf"
        onClick={() => opened.push("trigger")}
      />
    </Attachment>,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Remove research-summary.pdf" }),
  );
  expect(opened).toEqual(["action"]);
  await userEvent.click(
    screen.getByRole("button", { name: "Preview research-summary.pdf" }),
  );
  expect(opened).toEqual(["action", "trigger"]);
});

/* ── Image ──────────────────────────────────────────────────────────────────────────────────── */

test.each([
  ["icon", "icon"],
  ["image", "image"],
] as const)(
  "Image: AttachmentMedia variant=%s reports data-variant",
  async (variant, expected) => {
    const screen = await render(
      <Attachment>
        <AttachmentMedia variant={variant}>
          {variant === "image" ? (
            <img src="/preview/landscape.svg" alt="A scenic landscape" />
          ) : (
            <FileTextIcon />
          )}
        </AttachmentMedia>
      </Attachment>,
    );
    const media = slot(screen.container, "attachment-media") as HTMLElement;
    expect(media.getAttribute("data-variant")).toBe(expected);
  },
);

test("Image: an image fills its media slot and is cropped rather than squashed", async () => {
  const screen = await render(
    <Attachment orientation="vertical">
      <AttachmentMedia variant="image">
        <img src="/preview/landscape.svg" alt="A scenic landscape" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>landscape.svg</AttachmentTitle>
      </AttachmentContent>
    </Attachment>,
  );
  const media = slot(screen.container, "attachment-media") as HTMLElement;
  const image = media.querySelector("img") as HTMLImageElement;
  expect(getComputedStyle(image).objectFit).toBe("cover");
  expect(image.getBoundingClientRect().width).toBeCloseTo(
    media.getBoundingClientRect().width,
    0,
  );
});

/* ── States ─────────────────────────────────────────────────────────────────────────────────── */

test.each(STATES)(
  "States: state=%s reaches the root as data-state",
  async (state) => {
    const screen = await render(<Card state={state} />);
    expect(
      (slot(screen.container, "attachment") as HTMLElement).getAttribute(
        "data-state",
      ),
    ).toBe(state);
  },
);

test("States: `done` is the default, and there is no `complete`", async () => {
  const screen = await render(
    <Attachment>
      <AttachmentContent>
        <AttachmentTitle>report.pdf</AttachmentTitle>
      </AttachmentContent>
    </Attachment>,
  );
  // Upstream renamed the settled state; the pre-reset `complete` is gone with no alias behind it.
  expect(
    (slot(screen.container, "attachment") as HTMLElement).getAttribute(
      "data-state",
    ),
  ).toBe("done");
});

test("States: `error` re-inks the description and the media, `idle` dashes the border", async () => {
  const settled = await render(<Card state="done" />);
  const errored = await render(<Card state="error" />);
  const idle = await render(<Card state="idle" />);

  const ink = (root: HTMLElement) =>
    getComputedStyle(slot(root, "attachment-description") as HTMLElement).color;
  expect(ink(errored.container as HTMLElement)).not.toBe(
    ink(settled.container as HTMLElement),
  );
  expect(
    getComputedStyle(slot(errored.container, "attachment-media") as HTMLElement)
      .color,
  ).not.toBe(
    getComputedStyle(slot(settled.container, "attachment-media") as HTMLElement)
      .color,
  );
  expect(
    getComputedStyle(slot(idle.container, "attachment") as HTMLElement)
      .borderTopStyle,
  ).toBe("dashed");
});

/* ── Sizes ──────────────────────────────────────────────────────────────────────────────────── */

test.each(["default", "sm", "xs"] as const)(
  "Sizes: size=%s reaches the root as data-size",
  async (size) => {
    const screen = await render(<Card state="done" size={size} />);
    expect(
      (slot(screen.container, "attachment") as HTMLElement).getAttribute(
        "data-size",
      ),
    ).toBe(size);
  },
);

test("Sizes: the three sizes are a real ladder, tallest to shortest", async () => {
  const heights: number[] = [];
  for (const size of ["default", "sm", "xs"] as const) {
    const screen = await render(
      <Attachment size={size} className="w-full max-w-sm">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
        </AttachmentContent>
      </Attachment>,
    );
    heights.push(
      (
        slot(screen.container, "attachment") as HTMLElement
      ).getBoundingClientRect().height,
    );
  }
  const [large, medium, small] = heights as [number, number, number];
  expect(large).toBeGreaterThan(medium);
  expect(medium).toBeGreaterThan(small);
});

/* ── Group ──────────────────────────────────────────────────────────────────────────────────── */

test("Group: every attachment snaps and refuses to shrink", async () => {
  const screen = await render(
    <AttachmentGroup className="w-64">
      {["one.pdf", "two.pdf", "three.pdf"].map((name) => (
        <Attachment key={name} className="w-64">
          <AttachmentContent>
            <AttachmentTitle>{name}</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
      ))}
    </AttachmentGroup>,
  );
  const cards = slots(screen.container, "attachment");
  expect(cards).toHaveLength(3);
  for (const card of cards) {
    const style = getComputedStyle(card);
    expect(style.scrollSnapAlign).toBe("start");
    expect(style.flexShrink).toBe("0");
  }
});

/* ── Trigger ────────────────────────────────────────────────────────────────────────────────── */

test("Trigger: the trigger owns the card's interior and the action owns its own", async () => {
  const screen = await render(
    <Attachment className="w-full max-w-sm">
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>research-summary.pdf</AttachmentTitle>
        <AttachmentDescription>Open preview dialog</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove research-summary.pdf">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger aria-label="Preview research-summary.pdf" />
    </Attachment>,
  );
  const card = slot(screen.container, "attachment") as HTMLElement;
  const trigger = slot(screen.container, "attachment-trigger") as HTMLElement;
  const action = slot(screen.container, "attachment-action") as HTMLElement;

  // `absolute inset-0` resolves against the card's PADDING box, so the trigger is the card minus
  // its 1px border on each side — measured, rather than assumed to be the border box.
  const triggerBox = trigger.getBoundingClientRect();
  expect(triggerBox.width).toBeCloseTo(card.clientWidth, 0);
  expect(triggerBox.height).toBeCloseTo(card.clientHeight, 0);

  // The media sits UNDER the trigger…
  const media = slot(screen.container, "attachment-media") as HTMLElement;
  const mediaBox = media.getBoundingClientRect();
  expect(
    document.elementFromPoint(
      (mediaBox.left + mediaBox.right) / 2,
      (mediaBox.top + mediaBox.bottom) / 2,
    ),
  ).toBe(trigger);
  // …and the action sits OVER it.
  const actionBox = action.getBoundingClientRect();
  const hit = document.elementFromPoint(
    (actionBox.left + actionBox.right) / 2,
    (actionBox.top + actionBox.bottom) / 2,
  );
  expect(hit === action || action.contains(hit)).toBe(true);
});

/* ── Accessibility ──────────────────────────────────────────────────────────────────────────── */

test("Accessibility: an icon-only action and the full-card trigger both carry a name", async () => {
  const screen = await render(
    <Attachment className="w-full max-w-sm">
      <AttachmentContent>
        <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove sales-dashboard.pdf">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger aria-label="Open sales-dashboard.pdf" />
    </Attachment>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Remove sales-dashboard.pdf" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Open sales-dashboard.pdf" }))
    .toBeInTheDocument();
});

test("Accessibility: an action and the trigger are separate tab stops, in DOM order", async () => {
  const screen = await render(
    <Attachment className="w-full max-w-sm">
      <AttachmentContent>
        <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove sales-dashboard.pdf">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger aria-label="Open sales-dashboard.pdf" />
    </Attachment>,
  );
  const action = slot(screen.container, "attachment-action") as HTMLElement;
  const trigger = slot(screen.container, "attachment-trigger") as HTMLElement;
  await tabTo(action);
  await userEvent.tab();
  expect(document.activeElement).toBe(trigger);
});

/* ── the exceptions `attachment.patch` implements ───────────────────────────────────────────── */

test("A11Y-2 (audited, NO HUNK): an AttachmentAction measures at least 24×24", async () => {
  const screen = await render(<Card state="error" />);
  const action = slot(screen.container, "attachment-action") as HTMLElement;
  const probe = effectiveTarget(action);
  // `size="icon-xs"` is `size-6`: 24px, exactly on the SC 2.5.8 floor and with nothing to spare.
  // That is the whole basis of the patch's "audited, no hunk" row, so it is measured, not assumed.
  expect(
    {
      width: probe.effective.width >= 23.5,
      height: probe.effective.height >= 23.5,
    },
    `AttachmentAction measured ${probe.effective.width.toFixed(2)}×${probe.effective.height.toFixed(2)}px`,
  ).toEqual({ width: true, height: true });
  expect(
    probe.misses,
    "AttachmentAction must own the interior of its centred 24px square",
  ).toEqual([]);
});

test("A11Y-2 (audited, NO HUNK): the trigger is the whole card, so it needs no hit area", async () => {
  const screen = await render(
    <Attachment className="w-full max-w-sm">
      <AttachmentContent>
        <AttachmentTitle>research-summary.pdf</AttachmentTitle>
      </AttachmentContent>
      <AttachmentTrigger aria-label="Preview research-summary.pdf" />
    </Attachment>,
  );
  const probe = effectiveTarget(
    slot(screen.container, "attachment-trigger") as HTMLElement,
  );
  expect(probe.effective.width).toBeGreaterThanOrEqual(24);
  expect(probe.effective.height).toBeGreaterThanOrEqual(24);
  expect(probe.misses).toEqual([]);
});

test("A11Y-13: the error line reads through the family's `-text` ink, not its fill", async () => {
  const screen = await render(<Card state="error" />);
  const description = slot(
    screen.container,
    "attachment-description",
  ) as HTMLElement;

  // Upstream's ink is the FILL at 80% — `text-destructive/80`, which rasterises to 4.113:1 on
  // `card` at 12px. The class assertion pins which ink is selected…
  expect(description.className).toContain(
    "group-data-[state=error]/attachment:text-destructive-text",
  );
  expect(description.className).not.toContain("text-destructive/80");

  // …and the rendered colour proves the selector actually wins, which a class string cannot. The
  // `-text` role is a darker, fully opaque red, so it is measurably not the composited fill.
  const rendered = getComputedStyle(description).color;
  const settled = await render(<Card state="done" />);
  expect(rendered).not.toBe(
    getComputedStyle(
      slot(settled.container, "attachment-description") as HTMLElement,
    ).color,
  );
  // An alpha channel in the computed value would mean the fill-at-80% ink came back.
  expect(rendered).not.toMatch(/\/\s*0?\.\d/);

  // `AttachmentMedia`'s error ICON ink is deliberately upstream-verbatim: measured 3.973:1 against
  // its own composited `/10` tint, over the 3:1 floor for non-text UI (WCAG 1.4.11). If a token
  // change ever drops it under, `contrast.browser.test.tsx`'s attachment card is where that shows.
  expect(
    (slot(screen.container, "attachment-media") as HTMLElement).className,
  ).toContain("group-data-[state=error]/attachment:text-destructive");
});

test("FOC-1/FOC-6: no focus glow survives anywhere in the rendered tree", async () => {
  const screen = await render(
    <AttachmentGroup>
      <Card state="error" />
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
        </AttachmentContent>
        <AttachmentTrigger aria-label="Open report.pdf" />
      </Attachment>
    </AttachmentGroup>,
  );
  const classes = classesOf(screen.container as HTMLElement);
  // Upstream's card wore `focus-within:ring-1 focus-within:ring-ring/50` on behalf of the
  // invisible trigger inside it. Both halves of that arrangement are gone.
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-within:ring-");
  expect(classes).not.toContain("focus-visible:ring-");
});

test("FOC-1: the trigger keeps its own outline, and follows the card's corner", async () => {
  const screen = await render(
    <Attachment className="w-full max-w-sm">
      <AttachmentContent>
        <AttachmentTitle>research-summary.pdf</AttachmentTitle>
      </AttachmentContent>
      <AttachmentTrigger aria-label="Preview research-summary.pdf" />
    </Attachment>,
  );
  const trigger = slot(screen.container, "attachment-trigger") as HTMLElement;
  const card = slot(screen.container, "attachment") as HTMLElement;

  // Upstream writes `outline-none` here; the patch deletes it. The class string is one half of
  // that claim…
  expect(trigger.className).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  expect(trigger.className).not.toMatch(/(?:^|\s)outline-hidden(?:\s|$)/);
  expect(trigger.className).toContain("rounded-[inherit]");
  // …and the corner is the other: without `rounded-[inherit]` the outline would cut a rectangle
  // across a `rounded-xl` card.
  expect(getComputedStyle(trigger).borderTopLeftRadius).toBe(
    getComputedStyle(card).borderTopLeftRadius,
  );
});

test("FOC-13: a keyboard-focused trigger paints the background tint, not a ring", async () => {
  const screen = await render(
    <Attachment className="w-full max-w-sm">
      <AttachmentContent>
        <AttachmentTitle>research-summary.pdf</AttachmentTitle>
      </AttachmentContent>
      <AttachmentTrigger aria-label="Preview research-summary.pdf" />
    </Attachment>,
  );
  const trigger = slot(screen.container, "attachment-trigger") as HTMLElement;
  await tabTo(trigger);
  expect(trigger.matches(":focus-visible")).toBe(true);
  const style = getComputedStyle(trigger);
  expect(style.outlineStyle).toBe("none");
  expect(style.backgroundImage, "the trigger paints no focus tint").toContain(
    "gradient",
  );
});

/* ── axe, per distinct state ────────────────────────────────────────────────────────────────── */

test.each(STATES)("no a11y violations — state=%s", async (state) => {
  const screen = await render(<Card state={state} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a group with a trigger and actions", async () => {
  const screen = await render(
    <AttachmentGroup>
      {["one.pdf", "two.pdf"].map((name) => (
        <Attachment key={name} className="w-64">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{name}</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={`Remove ${name}`}>
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
          <AttachmentTrigger aria-label={`Open ${name}`} />
        </Attachment>
      ))}
    </AttachmentGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

/* ── API-28: layout, progress, muted, nested images ─────────────────────────────────────────── */

test("AttachmentProgress announces a percentage (API-28)", async () => {
  const screen = await render(
    <Attachment state="uploading">
      <AttachmentContent>
        <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
      </AttachmentContent>
      <AttachmentProgress value={42} />
    </Attachment>,
  );
  const bar = screen.getByRole("progressbar");
  await expect.element(bar).toHaveAttribute("aria-valuetext", "42%");
  await expect.element(bar).toHaveAttribute("aria-valuenow", "42");
  await expect.element(bar).toHaveAccessibleName("Upload progress");
  expect(
    slot(screen.container, "attachment-progress")?.contains(
      slot(screen.container, "progress-indicator"),
    ),
  ).toBe(true);
});

test("API-28: AttachmentProgress speaks a clamped percent for an out-of-range value", async () => {
  const screen = await render(<AttachmentProgress value={150} />);
  await expect
    .element(screen.getByRole("progressbar"))
    .toHaveAttribute("aria-valuetext", "100%");
});

test("API-28: AttachmentProgress scales to max, takes its own row, and names itself from aria-label", async () => {
  const screen = await render(
    <Attachment state="uploading" className="w-80">
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>big.zip</AttachmentTitle>
      </AttachmentContent>
      <AttachmentProgress
        value={512}
        max={2048}
        aria-label="Uploading big.zip"
      />
    </Attachment>,
  );
  const bar = screen.getByRole("progressbar", { name: "Uploading big.zip" });
  await expect.element(bar).toHaveAttribute("aria-valuetext", "25%");
  const progress = slot(screen.container, "attachment-progress")!;
  const card = slot(screen.container, "attachment")!;
  const content = slot(screen.container, "attachment-content")!;
  // Its own row under the media and content, as wide as the card's content box.
  expect(progress.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    content.getBoundingClientRect().bottom - 1,
  );
  expect(progress.getBoundingClientRect().width).toBeGreaterThan(
    card.getBoundingClientRect().width * 0.8,
  );
});

test("API-28: an indeterminate AttachmentProgress keeps the engine's own value text", async () => {
  const screen = await render(
    <Attachment state="processing">
      <AttachmentProgress value={null} />
    </Attachment>,
  );
  const bar = screen.container.querySelector('[role="progressbar"]')!;
  expect(bar.getAttribute("aria-valuetext")).not.toMatch(/%$/);
  expect(bar.hasAttribute("aria-valuenow")).toBe(false);
});

test("API-28: uploading without AttachmentProgress keeps the shimmer and renders no bar", async () => {
  const screen = await render(<Card state="uploading" />);
  expect(screen.container.querySelector('[role="progressbar"]')).toBeNull();
  const title = slot(screen.container, "attachment-title")!;
  expect(getComputedStyle(title).animationName).toBe("tw-shimmer");
});

test("API-28: AttachmentGroup defaults to the scrolling row and reflects its layout", async () => {
  const screen = await render(
    <AttachmentGroup>
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>one.pdf</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    </AttachmentGroup>,
  );
  const group = slot(screen.container, "attachment-group")!;
  expect(group.getAttribute("data-layout")).toBe("scroll");
  expect(getComputedStyle(group).overflowX).toBe("auto");
});

test.each([320, 1280])(
  'API-28: layout="grid" wraps tiles into equal columns and never scrolls sideways at %ipx',
  async (width) => {
    const names = ["a.png", "b.png", "c.png", "d.png", "e.png", "f.png"];
    const screen = await render(
      <div style={{ width: `${width}px` }}>
        <AttachmentGroup layout="grid">
          {names.map((name) => (
            <Attachment key={name} orientation="vertical">
              <AttachmentMedia variant="image">
                <img src="/preview/landscape.svg" alt="" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{name}</AttachmentTitle>
              </AttachmentContent>
            </Attachment>
          ))}
        </AttachmentGroup>
      </div>,
    );
    const group = slot(screen.container, "attachment-group")!;
    expect(group.getAttribute("data-layout")).toBe("grid");
    expect(getComputedStyle(group).display).toBe("grid");
    expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth + 1);
    const tiles = slots(screen.container, "attachment");
    const widths = new Set(
      tiles.map((tile) => Math.round(tile.getBoundingClientRect().width)),
    );
    expect(widths.size).toBe(1);
    const rows = new Set(
      tiles.map((tile) => Math.round(tile.getBoundingClientRect().top)),
    );
    // Several tiles per row, and more than one row when the six do not fit across.
    expect(rows.size).toBeLessThan(tiles.length);
    if (width === 320) expect(rows.size).toBeGreaterThan(1);
  },
);

test("API-28: a muted tile dims its media, keeps its text, and still announces its description", async () => {
  const screen = await render(
    <Attachment muted>
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>old-spec.pdf</AttachmentTitle>
        <AttachmentDescription>Not used on this product</AttachmentDescription>
      </AttachmentContent>
      <AttachmentTrigger aria-label="Open old-spec.pdf" />
    </Attachment>,
  );
  const card = slot(screen.container, "attachment")!;
  expect(card.getAttribute("data-muted")).toBe("true");
  expect(
    getComputedStyle(slot(screen.container, "attachment-media")!).opacity,
  ).toBe("0.5");
  expect(
    getComputedStyle(slot(screen.container, "attachment-title")!).opacity,
  ).toBe("1");
  await expect
    .element(screen.getByText("Not used on this product"))
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("API-28: an unmuted tile carries no data-muted and full-opacity media", async () => {
  const screen = await render(<Card state="done" />);
  const card = slot(screen.container, "attachment")!;
  expect(card.hasAttribute("data-muted")).toBe(false);
  expect(
    getComputedStyle(slot(screen.container, "attachment-media")!).opacity,
  ).toBe("1");
});

test("API-28: a DS Image nested inside image media fills the slot, and falls back when it fails", async () => {
  const screen = await render(
    <div className="flex gap-3">
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <Image src="/preview/landscape.svg" alt="A scenic landscape" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>landscape.svg</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <Image
            alt="Missing image"
            fallback={<FileWarningIcon aria-hidden="true" />}
          />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>missing.png</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    </div>,
  );
  const [loaded, broken] = slots(screen.container, "attachment-media");
  // The frame fills the media slot, and the image inside it is cropped rather than squashed —
  // `[&_img]` reaches an `<img>` at any depth, where upstream's `*:[img]` reached only a child.
  const image = loaded!.querySelector<HTMLElement>('[data-slot="image"]')!;
  const img = loaded!.querySelector("img")!;
  expect(getComputedStyle(img).objectFit).toBe("cover");
  expect(image.getBoundingClientRect().width).toBeCloseTo(
    loaded!.getBoundingClientRect().width,
    0,
  );
  expect(img.getBoundingClientRect().width).toBeCloseTo(
    loaded!.getBoundingClientRect().width,
    0,
  );
  const frame = broken!.querySelector<HTMLElement>('[data-slot="image"]')!;
  await expect.poll(() => frame.getAttribute("data-state")).toBe("error");
  expect(frame.getBoundingClientRect().width).toBeCloseTo(
    broken!.getBoundingClientRect().width,
    0,
  );
});

test("no a11y violations — uploading with AttachmentProgress (API-28)", async () => {
  const screen = await render(
    <AttachmentGroup layout="grid">
      <Attachment state="uploading" orientation="vertical">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>spec.pdf</AttachmentTitle>
          <AttachmentDescription>1.2 MB of 2.4 MB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentProgress value={50} aria-label="Uploading spec.pdf" />
        <AttachmentActions>
          <AttachmentAction aria-label="Cancel upload of spec.pdf">
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment state="processing" orientation="vertical">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>scan.pdf</AttachmentTitle>
        </AttachmentContent>
        <AttachmentProgress value={null} aria-label="Processing scan.pdf" />
      </Attachment>
    </AttachmentGroup>,
  );
  await expectNoA11yViolations(screen.container);
});
