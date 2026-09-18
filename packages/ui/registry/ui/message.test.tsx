/*
 * COMPILED CSS, ON PURPOSE.
 *
 * `message.tsx` is six plain `<div>`s with a class each, and its patch carries NO STYLING HUNK AT
 * ALL — not one row in the exception map reaches it. What is left to prove is therefore entirely
 * about what those six classes DO, and two of the three claims the patch header makes on this
 * file's behalf are layout facts rather than structure:
 *
 *   - `data-[align=end]:flex-row-reverse` — the row really does reverse, so the avatar lands on
 *     the end side. A `className.includes(...)` assertion would only restate the source.
 *   - `group-has-data-[slot=message-footer]/message:-translate-y-8` — the avatar lifts clear of the
 *     footer, and ONLY when a footer is present. That is a computed transform or it is nothing.
 *
 * So this file imports the same stylesheet the geometry lane compiles (real Tailwind + the real
 * token theme). One consequence before editing it: axe's `color-contrast` rule is LIVE here (it is
 * vacuous in the unstyled lanes), so an a11y assertion in this file is a real rendered-colour
 * assertion too.
 *
 * The part-list test below is the tripwire the patch header names: if a future upstream adds a
 * control, a live region or a focus affordance to this file, the "no exception row reaches it"
 * claim stops being true and this file is where that shows up.
 */
import "../../test/geometry.css";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { beforeAll, expect, test } from "vitest";
import { DownloadIcon, FileTextIcon, ThumbsUpIcon } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "./message";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "./attachment";
import { Avatar, AvatarFallback } from "./avatar";
import { Bubble, BubbleContent } from "./bubble";
import { Button } from "./button";

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

  // COMPILED-CSS SENTINEL: with no stylesheet `flex-row-reverse` and `-translate-y-8` are inert and
  // every measurement below reports green for a reason that has nothing to do with the component.
  const sentinel = document.createElement("div");
  sentinel.className = "w-5 h-5";
  document.body.append(sentinel);
  try {
    const style = getComputedStyle(sentinel);
    expect(
      { width: style.width, height: style.height },
      "test/geometry.css did not compile: `w-5 h-5` must resolve to 20px. Every measurement in " +
        "this file is meaningless without it.",
    ).toEqual({ width: "20px", height: "20px" });
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--muted")
        .trim(),
      "the @vegastack token theme is not on this page (--muted is unset).",
    ).not.toBe("");
  } finally {
    sentinel.remove();
  }
});

/**
 * The vertical translation of an element, in px.
 *
 * Tailwind v4 compiles `-translate-y-8` onto the standalone `translate` property, not onto
 * `transform`, so both are read: a helper that only knew `transform` would report 0 for every
 * translate utility in the system and turn the offset contract below into a no-op.
 */
function translateY(element: HTMLElement): number {
  const style = getComputedStyle(element);
  if (style.translate && style.translate !== "none") {
    const parts = style.translate.split(/\s+/);
    return Number.parseFloat(parts[1] ?? "0") || 0;
  }
  const { transform } = style;
  if (transform === "none") return 0;
  // matrix(a, b, c, d, tx, ty)
  const values = transform
    .slice(transform.indexOf("(") + 1, -1)
    .split(",")
    .map((value) => Number.parseFloat(value));
  return values[5] ?? 0;
}

/* ── Usage ──────────────────────────────────────────────────────────────────────────────────── */

test("renders every exported part with its data-slot (Usage)", async () => {
  const screen = await render(
    <MessageGroup>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Olivia</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>How can I help you today?</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>,
  );
  for (const name of [
    "message-group",
    "message",
    "message-avatar",
    "message-content",
    "message-header",
    "message-footer",
  ]) {
    expect(slot(screen.container, name), name).not.toBeNull();
  }
});

test("NO HUNK: the six parts are plain divs — no control, no live region, no focus affordance", async () => {
  const screen = await render(
    <MessageGroup>
      <Message>
        <MessageAvatar />
        <MessageContent>
          <MessageHeader>Olivia</MessageHeader>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>,
  );
  // The patch header's claim, made checkable: nothing in this file is a control, a pointer target,
  // a live region or a portal, which is WHY not one row in the exception map reaches it. An
  // upstream pull that adds one lands here first.
  for (const name of [
    "message-group",
    "message",
    "message-avatar",
    "message-content",
    "message-header",
    "message-footer",
  ]) {
    const element = slot(screen.container, name) as HTMLElement;
    expect(element.tagName, name).toBe("DIV");
    expect(element.getAttribute("role"), name).toBeNull();
    expect(element.getAttribute("aria-live"), name).toBeNull();
    expect(element.tabIndex, name).toBe(-1);
  }
});

/* ── Composition ────────────────────────────────────────────────────────────────────────────── */

test("Composition: the content column holds the header, the surface and the footer, in that order", async () => {
  const screen = await render(
    <Message>
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>Olivia</MessageHeader>
        <Bubble variant="muted">
          <BubbleContent>I already checked the logs.</BubbleContent>
        </Bubble>
        <MessageFooter>Delivered</MessageFooter>
      </MessageContent>
    </Message>,
  );
  const row = slot(screen.container, "message") as HTMLElement;
  const avatar = slot(screen.container, "message-avatar") as HTMLElement;
  const content = slot(screen.container, "message-content") as HTMLElement;
  expect(avatar.parentElement).toBe(row);
  expect(content.parentElement).toBe(row);
  expect(
    [...content.children].map((child) =>
      (child as HTMLElement).getAttribute("data-slot"),
    ),
  ).toEqual(["message-header", "bubble", "message-footer"]);
});

/* ── Features / Avatar — the `align` switch ─────────────────────────────────────────────────── */

test("Avatar: `align` sets data-align, defaults to start, and `end` reverses the row", async () => {
  const screen = await render(
    <div>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>The build failed.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>Can you share the exact error?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>,
  );
  const start = nth(screen.container, "message", 0);
  const end = nth(screen.container, "message", 1);
  expect(start.dataset.align).toBe("start");
  expect(end.dataset.align).toBe("end");
  expect(getComputedStyle(start).flexDirection).toBe("row");
  expect(getComputedStyle(end).flexDirection).toBe("row-reverse");

  // …and the reversal is what physically moves the avatar to the end of the row.
  const startAvatar = nth(screen.container, "message-avatar", 0);
  const endAvatar = nth(screen.container, "message-avatar", 1);
  const startContent = nth(screen.container, "message-content", 0);
  const endContent = nth(screen.container, "message-content", 1);
  expect(startAvatar.getBoundingClientRect().left).toBeLessThan(
    startContent.getBoundingClientRect().left,
  );
  expect(endAvatar.getBoundingClientRect().left).toBeGreaterThan(
    endContent.getBoundingClientRect().left,
  );
});

test("Avatar: the avatar lifts clear of a footer, and only when one is present", async () => {
  const screen = await render(
    <div>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>No footer on this row.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>This row has one.</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
    </div>,
  );
  const withoutFooter = nth(screen.container, "message-avatar", 0);
  const withFooter = nth(screen.container, "message-avatar", 1);
  // `group-has-data-[slot=message-footer]/message:-translate-y-8` — 8 spacing steps up (2rem),
  // applied by the ROW's `:has()`, so a row with no footer must be untouched.
  expect(translateY(withoutFooter)).toBe(0);
  expect(translateY(withFooter)).toBe(-32);
});

/* ── Group ──────────────────────────────────────────────────────────────────────────────────── */

test("Group: MessageGroup stacks rows, and an empty avatar keeps the earlier ones aligned", async () => {
  const screen = await render(
    <MessageGroup>
      <Message>
        <MessageAvatar />
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>I checked the registry addresses.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>The example JSON now lives there.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>,
  );
  const group = slot(screen.container, "message-group") as HTMLElement;
  const style = getComputedStyle(group);
  expect(style.display).toBe("flex");
  expect(style.flexDirection).toBe("column");
  const empty = nth(screen.container, "message-avatar", 0);
  const filled = nth(screen.container, "message-avatar", 1);
  // `min-w-8` is what makes the empty slot hold the column open under the filled one.
  expect(empty.getBoundingClientRect().width).toBeGreaterThanOrEqual(32);
  expect(empty.getBoundingClientRect().left).toBe(
    filled.getBoundingClientRect().left,
  );
});

/* ── Header and Footer ──────────────────────────────────────────────────────────────────────── */

test("Header and Footer: the header holds the start edge while the footer follows the message side", async () => {
  const screen = await render(
    <div style={{ width: "600px" }}>
      <Message>
        <MessageContent>
          <MessageHeader>Olivia</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>I already checked the logs.</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <MessageHeader>Me</MessageHeader>
          <Bubble>
            <BubbleContent>Send the report to the team.</BubbleContent>
          </Bubble>
          <MessageFooter>Read</MessageFooter>
        </MessageContent>
      </Message>
    </div>,
  );
  const startFooter = nth(screen.container, "message-footer", 0);
  const endFooter = nth(screen.container, "message-footer", 1);
  const endHeader = nth(screen.container, "message-header", 1);
  // `group-data-[align=end]/message:justify-end` on the footer, and nothing of the kind on the
  // header — which is exactly what upstream's API table promises.
  expect(getComputedStyle(startFooter).justifyContent).not.toBe("flex-end");
  expect(getComputedStyle(endFooter).justifyContent).toBe("flex-end");
  expect(getComputedStyle(endHeader).justifyContent).not.toBe("flex-end");
});

/* ── Actions ────────────────────────────────────────────────────────────────────────────────── */

test("Actions: footer controls are reachable and named", async () => {
  const screen = await render(
    <Message>
      <MessageContent>
        <Bubble variant="muted">
          <BubbleContent>
            The install failure is in the workspace.
          </BubbleContent>
        </Bubble>
        <MessageFooter>
          <Button variant="ghost" size="icon" aria-label="Like" title="Like">
            <ThumbsUpIcon />
          </Button>
        </MessageFooter>
      </MessageContent>
    </Message>,
  );
  const footer = slot(screen.container, "message-footer") as HTMLElement;
  const action = screen.getByRole("button", { name: "Like" });
  expect(footer.contains(action.element())).toBe(true);
});

/* ── Attachment ─────────────────────────────────────────────────────────────────────────────── */

const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3C/svg%3E";

test("Attachment: an attachment is a sibling of the bubble inside the content column", async () => {
  const screen = await render(
    <Message align="end">
      <MessageContent>
        <Attachment orientation="vertical">
          <AttachmentMedia variant="image">
            <img src={PIXEL} alt="Workspace" />
          </AttachmentMedia>
        </Attachment>
        <Bubble>
          <BubbleContent>Can you add it to the PDF?</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>,
  );
  const content = slot(screen.container, "message-content") as HTMLElement;
  expect(
    [...content.children].map((child) =>
      (child as HTMLElement).getAttribute("data-slot"),
    ),
  ).toEqual(["attachment", "bubble"]);
  // `group-data-[align=end]/message:*:data-slot:self-end` — every direct slotted child of an
  // end-aligned row hugs the end edge, the attachment included.
  expect(getComputedStyle(slot(content, "attachment")!).alignSelf).toBe(
    "flex-end",
  );
});

/* ── the standing FOC invariant ─────────────────────────────────────────────────────────────── */

test("FOC-1/FOC-6: no ring glow and no outline suppression anywhere in the tree", async () => {
  const screen = await render(
    <MessageGroup>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Olivia</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>I already checked the logs.</BubbleContent>
          </Bubble>
          <MessageFooter>
            <Button variant="ghost" size="icon" aria-label="Like">
              <ThumbsUpIcon />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>,
  );
  // This component has no styling hunk and no focus affordance of its own, which is precisely why
  // the invariant is stated here: it is the assertion that would notice one arriving.
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\//);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toMatch(/\boutline-none\b|\boutline-hidden\b/);
  }
});

/* ── accessibility ──────────────────────────────────────────────────────────────────────────── */

test("no a11y violations — a plain message row", async () => {
  const screen = await render(
    <Message>
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <Bubble variant="muted">
          <BubbleContent>How can I help you today?</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a group of stacked rows", async () => {
  const screen = await render(
    <MessageGroup>
      <Message>
        <MessageAvatar />
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>I checked the registry addresses.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>The example JSON now lives there.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a row with a header and a footer", async () => {
  const screen = await render(
    <Message align="end">
      <MessageContent>
        <MessageHeader>Olivia</MessageHeader>
        <Bubble>
          <BubbleContent>Send the report to the team.</BubbleContent>
        </Bubble>
        <MessageFooter>Read yesterday</MessageFooter>
      </MessageContent>
    </Message>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — footer actions, each icon-only button named", async () => {
  const screen = await render(
    <Message>
      <MessageContent>
        <Bubble variant="muted">
          <BubbleContent>
            The install failure is in the workspace.
          </BubbleContent>
        </Bubble>
        <MessageFooter>
          <Button variant="ghost" size="icon" aria-label="Copy" title="Copy">
            <FileTextIcon />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Like" title="Like">
            <ThumbsUpIcon />
          </Button>
        </MessageFooter>
      </MessageContent>
    </Message>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a message carrying an attachment", async () => {
  const screen = await render(
    <Message>
      <MessageContent>
        <Bubble variant="muted">
          <BubbleContent>Here is the PDF with the cover page.</BubbleContent>
        </Bubble>
        <Attachment>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              type="button"
              title="Download"
              aria-label="Download"
              size="icon-sm"
              variant="secondary"
            >
              <DownloadIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </MessageContent>
    </Message>,
  );
  await expectNoA11yViolations(screen.container);
});
