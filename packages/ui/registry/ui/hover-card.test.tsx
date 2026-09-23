import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { DirectionProvider } from "./direction";

/** Upstream's four physical sides. */
const SIDES = ["left", "top", "bottom", "right"] as const;

const card = () =>
  document.querySelector(
    '[data-slot="hover-card-content"]',
  ) as HTMLElement | null;

/**
 * The card opens on hover after `delay`; every test that is not ABOUT the delay sets it to zero so
 * the assertion is about the card, not about timing.
 */
function Subject({
  triggerProps,
  ...contentProps
}: {
  triggerProps?: React.ComponentProps<typeof HoverCardTrigger>;
} & React.ComponentProps<typeof HoverCardContent>) {
  return (
    <HoverCard>
      <HoverCardTrigger delay={0} closeDelay={0} {...triggerProps}>
        @ada
      </HoverCardTrigger>
      <HoverCardContent {...contentProps}>
        <p>Ada Lovelace — Owner</p>
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * Collision avoidance is on by default and this lane compiles no CSS, so `w-64` is inert and the
 * card is as wide as its text. Placement fixtures therefore pin a small card inside a gutter sized
 * so the requested side and alignment fit in the 414×896 test viewport — otherwise `data-side`
 * would report the fallback the browser chose rather than the prop that was passed.
 */
function Placed({
  children,
  ...contentProps
}: React.ComponentProps<typeof HoverCardContent>) {
  return (
    <div style={{ padding: 140 }}>
      <HoverCard>
        <HoverCardTrigger delay={0} closeDelay={0}>
          @ada
        </HoverCardTrigger>
        <HoverCardContent style={{ width: 80 }} {...contentProps}>
          {children ?? "Placed"}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

/** BRD-1: a real 1px `border border-border`, never upstream's `ring-1 ring-foreground/10` outline. */
function expectBorderNotRing(element: HTMLElement) {
  const tokens = element.className.split(/\s+/);
  expect(tokens).toContain("border");
  expect(tokens).toContain("border-border");
  expect(element.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
}

test("renders a link trigger carrying its data-slot, closed (Usage)", async () => {
  const screen = await render(
    <HoverCard open={false}>
      <HoverCardTrigger>@ada</HoverCardTrigger>
      <HoverCardContent>
        <p>Ada Lovelace — Owner</p>
      </HoverCardContent>
    </HoverCard>,
  );
  const trigger = screen.getByText("@ada");
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "hover-card-trigger");
  expect(card()).toBeNull();
});

test("hovering the trigger portals the card (Usage, Composition)", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect
    .element(screen.getByText("Ada Lovelace — Owner"))
    .toBeInTheDocument();
  const content = card();
  expect(content).not.toBeNull();
  // Portaled: the card is not inside the component's own container subtree.
  expect(screen.container.contains(content)).toBe(false);
});

test("keyboard focus opens the card (Usage)", async () => {
  const screen = await render(<Subject />);
  await userEvent.tab();
  await expect
    .element(screen.getByText("Ada Lovelace — Owner"))
    .toBeInTheDocument();
});

test("delay holds the card closed until it elapses (Trigger Delays)", async () => {
  const screen = await render(
    <Subject triggerProps={{ delay: 5000, closeDelay: 0 }} />,
  );
  await userEvent.hover(screen.getByText("@ada"));
  // Well inside the 5s open delay: the card must still be absent. A zero-delay trigger (every
  // other test in this file) opens on the same gesture, so this is the delay and nothing else.
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(card()).toBeNull();
});

test("a zero delay opens the card on the same gesture (Trigger Delays)", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect.poll(card).not.toBeNull();
});

test("side and align are recorded on the positioner and the card (Positioning)", async () => {
  const screen = await render(<Placed side="top" align="start" />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect.poll(card).not.toBeNull();
  const content = card() as HTMLElement;
  expect(content.getAttribute("data-side")).toBe("top");
  expect(content.getAttribute("data-align")).toBe("start");
  expect(content.parentElement?.getAttribute("data-side")).toBe("top");
});

test("the card renders arbitrary preview content (Basic)", async () => {
  const screen = await render(
    <HoverCard>
      <HoverCardTrigger delay={0} closeDelay={0}>
        @nextjs
      </HoverCardTrigger>
      <HoverCardContent>
        <div>@nextjs</div>
        <div>The React Framework – created and maintained by @vercel.</div>
        <div>Joined December 2021</div>
      </HoverCardContent>
    </HoverCard>,
  );
  await userEvent.hover(screen.getByText("@nextjs"));
  await expect
    .element(screen.getByText("Joined December 2021"))
    .toBeInTheDocument();
});

test.each(SIDES)("side=%s is resolved onto the card (Sides)", async (side) => {
  const screen = await render(<Placed side={side} />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect.poll(card).not.toBeNull();
  expect((card() as HTMLElement).getAttribute("data-side")).toBe(side);
});

test("RTL: a logical side resolves against the direction context, not the portal (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Placed side="inline-start" dir="rtl" />
      </div>
    </DirectionProvider>,
  );
  const trigger = screen.getByText("@ada");
  await userEvent.hover(trigger);
  await expect.poll(card).not.toBeNull();
  const content = card() as HTMLElement;
  expect(getComputedStyle(content).direction).toBe("rtl");
  expect(content.getAttribute("data-side")).toBe("inline-start");
  // `inline-start` under RTL is the RIGHT of the trigger. Without DirectionProvider the positioner
  // would read the portal's LTR context and place it on the left, so this is the assertion that
  // actually distinguishes the two.
  expect(content.getBoundingClientRect().left).toBeGreaterThanOrEqual(
    trigger.element().getBoundingClientRect().right,
  );
});

test("OVL-13: the positioner inside the portal carries the theme scope", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-test-scope">
      <Subject />
    </InternalThemeScopeProvider>,
  );
  await userEvent.hover(screen.getByText("@ada"));
  await expect.poll(card).not.toBeNull();
  const content = card() as HTMLElement;
  const portal = content.closest("[data-base-ui-portal]");
  expect(portal).not.toBeNull();
  const scoped = portal?.querySelector(".vs-test-scope");
  expect(scoped).not.toBeNull();
  // The scope host is the POSITIONER — the card's own parent, inside the portal.
  expect(scoped).toBe(content.parentElement);
});

test("OVL-13: with no scope in context the positioner carries no scope class", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect.poll(card).not.toBeNull();
  const positioner = (card() as HTMLElement).parentElement as HTMLElement;
  expect(positioner.className).toContain("isolate");
  expect(positioner.className).not.toContain("vs-test-scope");
});

test("FOC-1/FOC-6: nothing rendered carries a focus glow", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect.poll(card).not.toBeNull();
  const elements = [
    ...screen.container.querySelectorAll<HTMLElement>("*"),
    ...document.querySelectorAll<HTMLElement>("[data-base-ui-portal] *"),
  ];
  for (const element of elements) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]/);
    expect(classes).not.toContain("focus-visible:ring-");
  }
});

test("BRD-1: the hover card surface draws a real border, not a ring outline", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect.poll(card).not.toBeNull();
  expectBorderNotRing(card() as HTMLElement);
});

test("no a11y violations — closed", async () => {
  const screen = await render(
    <HoverCard open={false}>
      <HoverCardTrigger>@ada</HoverCardTrigger>
      <HoverCardContent>
        <p>Ada Lovelace — Owner</p>
      </HoverCardContent>
    </HoverCard>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect
    .element(screen.getByText("Ada Lovelace — Owner"))
    .toBeInTheDocument();
  // The card portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(document.body);
});
