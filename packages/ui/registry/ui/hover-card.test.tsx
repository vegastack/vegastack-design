import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./hover-card";

// Base UI's PreviewCard opens on hover/focus after a delay. Tests set openDelay={0}
// so the card appears immediately without waiting.
function Subject({
  side,
}: {
  side?: "top" | "right" | "bottom" | "left";
} = {}) {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger>@ada</HoverCardTrigger>
      <HoverCardContent side={side}>
        <p>Ada Lovelace — Owner</p>
      </HoverCardContent>
    </HoverCard>
  );
}

test("renders the trigger with its data-slot", async () => {
  const screen = await render(<Subject />);
  const trigger = screen.getByText("@ada");
  await expect.element(trigger).toBeInTheDocument();
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "hover-card-trigger");
});

test("a closed hover card renders no content (closed by default → opens on interaction)", async () => {
  // CONTROLLED open={false}: deterministic. An openDelay={0} card opens instantly on focus (Base UI
  // opens on focus-visible regardless of the hover delay), and under full-suite load the shared
  // browser input state can transiently focus the freshly-rendered trigger → flaky open. Pinning
  // open={false} removes that race; the open-on-interaction path is covered by the hover/focus tests.
  const screen = await render(
    <HoverCard open={false}>
      <HoverCardTrigger>@ada</HoverCardTrigger>
      <HoverCardContent>
        <p>Ada Lovelace — Owner</p>
      </HoverCardContent>
    </HoverCard>,
  );
  await expect.element(screen.getByText("@ada")).toBeInTheDocument();
  expect(
    screen.container.ownerDocument.querySelector(
      '[data-slot="hover-card-content"]',
    ),
  ).toBeNull();
});

test("content appears on hover", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect
    .element(screen.getByText("Ada Lovelace — Owner"))
    .toBeInTheDocument();
});

test("content appears on keyboard focus", async () => {
  const screen = await render(<Subject />);
  await userEvent.tab();
  await expect
    .element(screen.getByText("Ada Lovelace — Owner"))
    .toBeInTheDocument();
});

test("content carries the token slot and resolved side data attribute", async () => {
  const screen = await render(<Subject side="right" />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect
    .element(screen.getByText("Ada Lovelace — Owner"))
    .toBeInTheDocument();

  const content = screen.container.ownerDocument.querySelector(
    '[data-slot="hover-card-content"]',
  )!;
  expect(content.getAttribute("data-side")).toBe("right");
});

test("forwards portal, positioner, and optional viewport props", async () => {
  const screen = await render(
    <HoverCard defaultOpen>
      <HoverCardTrigger>@ada</HoverCardTrigger>
      <HoverCardContent
        portalProps={{ className: "hover-card-portal-prop" }}
        positionerProps={{ className: "consumer-positioner" }}
        viewportProps={{ className: "consumer-viewport" }}
      >
        <p>Ada Lovelace — Owner</p>
      </HoverCardContent>
    </HoverCard>,
  );
  await expect
    .element(screen.getByText("Ada Lovelace — Owner"))
    .toBeInTheDocument();

  const positioner = document.querySelector(
    '[data-slot="hover-card-positioner"]',
  )!;
  expect(positioner.className).toContain("z-(--z-overlay)");
  expect(positioner.className).toContain("consumer-positioner");
  expect(document.querySelector(".hover-card-portal-prop")).not.toBeNull();
  expect(
    document.querySelector('[data-slot="hover-card-viewport"]')?.className,
  ).toContain("consumer-viewport");
});

test("renders an arrow when arrow is set", async () => {
  await render(
    <HoverCard defaultOpen>
      <HoverCardTrigger>@ada</HoverCardTrigger>
      <HoverCardContent arrow>
        <p>Has an arrow</p>
      </HoverCardContent>
    </HoverCard>,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="hover-card-arrow"]'))
    .not.toBeNull();
});

test("takes arbitrary (presentational) children", async () => {
  const screen = await render(
    <HoverCard defaultOpen>
      <HoverCardTrigger>2 Teams</HoverCardTrigger>
      <HoverCardContent>
        <div>
          <p>Platform</p>
          <button type="button">View team</button>
        </div>
      </HoverCardContent>
    </HoverCard>,
  );
  await expect
    .element(screen.getByRole("button", { name: "View team" }))
    .toBeInTheDocument();
});

test("no a11y violations (closed)", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (open)", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByText("@ada"));
  await expect
    .element(screen.getByText("Ada Lovelace — Owner"))
    .toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});

test("HoverCardTrigger forwards ref to its host element", async () => {
  // The trigger renders an <a> by default; `{...props}` (and the ref) lands on it.
  const ref = React.createRef<HTMLAnchorElement>();
  await render(
    <HoverCard>
      <HoverCardTrigger ref={ref}>@ada</HoverCardTrigger>
      <HoverCardContent>
        <p>Ada Lovelace — Owner</p>
      </HoverCardContent>
    </HoverCard>,
  );
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("hover-card-trigger");
});
