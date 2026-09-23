import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

/** Upstream's two size tiers. Card has no variant dimension. */
const SIZES = ["default", "sm"] as const;

/** Every exported part, with the `data-slot` each one stamps. */
const SLOTS = [
  "card",
  "card-header",
  "card-title",
  "card-description",
  "card-action",
  "card-content",
  "card-footer",
] as const;

function FullCard(props: React.ComponentProps<typeof Card>) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
        <CardAction>Card Action</CardAction>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
}

/** BRD-1: a real 1px `border border-border`, never upstream's `ring-1 ring-foreground/10` outline. */
function expectBorderNotRing(element: HTMLElement) {
  const tokens = element.className.split(/\s+/);
  expect(tokens).toContain("border");
  expect(tokens).toContain("border-border");
  expect(element.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
}

test("renders a div carrying data-slot and the default size", async () => {
  const screen = await render(<FullCard />);
  const card = screen.container.querySelector("[data-slot=card]")!;
  expect(card.tagName).toBe("DIV");
  expect(card.getAttribute("data-size")).toBe("default");
});

test("every exported part renders and carries its own data-slot (Composition)", async () => {
  const screen = await render(<FullCard />);
  for (const slot of SLOTS) {
    expect(screen.container.querySelector(`[data-slot=${slot}]`)).not.toBe(
      null,
    );
  }
  await expect.element(screen.getByText("Card Title")).toBeInTheDocument();
  await expect.element(screen.getByText("Card Footer")).toBeInTheDocument();
});

test("CardAction opens the second header column and parks itself in it (Composition)", async () => {
  const screen = await render(<FullCard />);
  const header = screen.container.querySelector("[data-slot=card-header]")!;
  expect(header.className).toContain(
    "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
  );
  const action = screen.container.querySelector("[data-slot=card-action]")!;
  expect(action.className).toContain("col-start-2");
  expect(action.className).toContain("justify-self-end");
  // Reading order is the visual order: the action is written after the description.
  expect(
    action.compareDocumentPosition(
      screen.container.querySelector("[data-slot=card-description]")!,
    ) & Node.DOCUMENT_POSITION_PRECEDING,
  ).toBeTruthy();
});

test("every size produces its own data-size, from one class string (Size)", async () => {
  const seen = new Set<string>();
  for (const size of SIZES) {
    const screen = await render(<FullCard size={size} />);
    const card = screen.container.querySelector("[data-slot=card]")!;
    expect(card.getAttribute("data-size")).toBe(size);
    seen.add(`${card.getAttribute("data-size")}`);
  }
  expect(seen.size).toBe(SIZES.length);
});

test("the small tier retunes the spacing variable rather than restating padding (Size)", async () => {
  const screen = await render(<FullCard size="sm" />);
  const card = screen.container.querySelector("[data-slot=card]")!;
  expect(card.className).toContain(
    "data-[size=sm]:[--card-spacing:--spacing(3)]",
  );
  expect(card.className).toContain("[--card-spacing:--spacing(4)]");
});

test("every part insets from the one spacing variable (Spacing)", async () => {
  const screen = await render(<FullCard />);
  const header = screen.container.querySelector("[data-slot=card-header]")!;
  const content = screen.container.querySelector("[data-slot=card-content]")!;
  const footer = screen.container.querySelector("[data-slot=card-footer]")!;
  expect(header.className).toContain("px-(--card-spacing)");
  expect(content.className).toContain("px-(--card-spacing)");
  expect(footer.className).toContain("p-(--card-spacing)");
  const card = screen.container.querySelector("[data-slot=card]")!;
  expect(card.className).toContain("gap-(--card-spacing)");
  expect(card.className).toContain("py-(--card-spacing)");
});

test("a footer removes the root's bottom padding (Spacing)", async () => {
  const screen = await render(<FullCard />);
  const card = screen.container.querySelector("[data-slot=card]")!;
  expect(card.className).toContain("has-data-[slot=card-footer]:pb-0");
});

test("a leading image removes the top padding and rounds with the card (Image)", async () => {
  const screen = await render(
    <Card>
      <img src="/preview/landscape.svg" alt="" />
      <CardHeader>
        <CardTitle>Design systems meetup</CardTitle>
      </CardHeader>
    </Card>,
  );
  const card = screen.container.querySelector("[data-slot=card]")!;
  expect(card.querySelector(":scope > img:first-child")).not.toBe(null);
  expect(card.className).toContain("has-[>img:first-child]:pt-0");
  expect(card.className).toContain("*:[img:first-child]:rounded-t-xl");
  expect(card.className).toContain("overflow-hidden");
});

test("RTL: no part reaches for a physical direction (RTL)", async () => {
  const screen = await render(<FullCard dir="rtl" />);
  for (const slot of SLOTS) {
    const part = screen.container.querySelector(`[data-slot=${slot}]`)!;
    expect(part.className).not.toMatch(/(?:^|\s)(?:pl|pr|ml|mr)-/);
    expect(part.className).not.toMatch(/(?:^|\s)(?:left|right)-/);
    expect(part.className).not.toMatch(/(?:^|\s)text-(?:left|right)(?:\s|$)/);
  }
});

test("DOC-2: cn from @vegastack/design merges a caller's className onto every part", async () => {
  const screen = await render(
    <Card className="[--card-spacing:--spacing(6)] max-w-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Card Title</CardTitle>
      </CardHeader>
    </Card>,
  );
  const card = screen.container.querySelector("[data-slot=card]")!;
  expect(card.className).toContain("[--card-spacing:--spacing(6)]");
  expect(card.className).toContain("max-w-sm");
  const header = screen.container.querySelector("[data-slot=card-header]")!;
  expect(header.className).toContain("border-b");
  const title = screen.container.querySelector("[data-slot=card-title]")!;
  // tailwind-merge aware: the caller's size replaces the recipe's, never stacks on it.
  expect(title.className).toContain("text-lg");
  expect(title.className).not.toContain("text-base");
});

test("BRD-1: the card draws a real border, not a ring outline", async () => {
  const screen = await render(<FullCard />);
  const card =
    screen.container.querySelector<HTMLElement>('[data-slot="card"]')!;
  expectBorderNotRing(card);
  // The image-edge rounding stays upstream's: `overflow-hidden` clips at the border's inner edge.
  expect(card.className).toContain("overflow-hidden");
  expect(card.className).toContain("*:[img:first-child]:rounded-t-xl");
});

test("no a11y violations — rest", async () => {
  const screen = await render(<FullCard />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — small size", async () => {
  const screen = await render(<FullCard size="sm" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — with a decorative image", async () => {
  const screen = await render(
    <Card>
      <img src="/preview/landscape.svg" alt="" />
      <CardHeader>
        <CardTitle>Design systems meetup</CardTitle>
        <CardDescription>A practical talk on component APIs.</CardDescription>
      </CardHeader>
    </Card>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — empty card", async () => {
  const screen = await render(<Card />);
  await expectNoA11yViolations(screen.container);
});
