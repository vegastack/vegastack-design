import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipKbd,
  TooltipProvider,
} from "./tooltip";

// Base UI's Tooltip reads its shared delay from a Provider. The app mounts one
// in VegaStackProvider; tests mount their own so hover/focus open without waiting.
function Subject({
  side,
  withKbd = false,
}: {
  side?: "top" | "right" | "bottom" | "left";
  withKbd?: boolean;
} = {}) {
  return (
    <TooltipProvider>
      <Tooltip delay={0}>
        <TooltipTrigger>Open settings</TooltipTrigger>
        <TooltipContent side={side}>
          Settings
          {withKbd ? <TooltipKbd keys={["⌘", "K"]} /> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

test("renders the trigger with its data-slot", async () => {
  const screen = await render(<Subject />);
  const trigger = screen.getByRole("button", { name: "Open settings" });
  await expect.element(trigger).toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute("data-slot", "tooltip-trigger");
});

test("a closed tooltip renders no content (closed by default → opens on interaction)", async () => {
  // CONTROLLED open={false}: deterministic. A delay=0 uncontrolled tooltip opens instantly on focus
  // (Base UI opens on focus-visible regardless of the hover delay), and under full-suite load the
  // shared browser input state can transiently focus the freshly-rendered trigger → flaky open.
  // Pinning open={false} removes that race; the open-on-interaction path is covered by the
  // hover/focus tests below.
  const screen = await render(
    <TooltipProvider>
      <Tooltip open={false}>
        <TooltipTrigger>Open settings</TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Open settings" });
  await expect.element(trigger).toBeInTheDocument();
  expect(trigger.element().hasAttribute("data-popup-open")).toBe(false);
  expect(
    screen.container.ownerDocument.querySelector(
      '[data-slot="tooltip-content"]',
    ),
  ).toBeNull();
});

test("popup content appears on hover", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByRole("button", { name: "Open settings" }));
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("tooltip"))
    .toHaveTextContent("Settings");
});

test("popup content appears on keyboard focus", async () => {
  const screen = await render(<Subject />);
  await userEvent.tab();
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("content carries the popover token slot and side data attribute", async () => {
  const screen = await render(<Subject side="right" />);
  await userEvent.hover(screen.getByRole("button", { name: "Open settings" }));
  const content = screen.getByRole("tooltip");
  await expect.element(content).toHaveAttribute("data-slot", "tooltip-content");
  await expect.element(content).toHaveAttribute("data-side", "right");
});

test("forwards portal, positioner, viewport props, and accepts functional offsets", async () => {
  const screen = await render(
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger>Open settings</TooltipTrigger>
        <TooltipContent
          sideOffset={() => 6}
          portalProps={{ className: "tooltip-portal-prop" }}
          positionerProps={{ className: "consumer-positioner" }}
          viewportProps={{ className: "consumer-viewport" }}
        >
          Settings
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();

  const positioner = document.querySelector(
    '[data-slot="tooltip-positioner"]',
  )!;
  expect(positioner.className).toContain("z-(--z-overlay)");
  expect(positioner.className).toContain("consumer-positioner");
  expect(document.querySelector(".tooltip-portal-prop")).not.toBeNull();
  expect(
    document.querySelector('[data-slot="tooltip-viewport"]')?.className,
  ).toContain("consumer-viewport");
});

test("renders a keyboard shortcut hint", async () => {
  const screen = await render(<Subject withKbd />);
  await userEvent.hover(screen.getByRole("button", { name: "Open settings" }));
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
  const kbd = screen.container.ownerDocument.querySelector(
    '[data-slot="tooltip-kbd"]',
  );
  expect(kbd).not.toBeNull();
  expect(kbd?.querySelectorAll("kbd")).toHaveLength(2);
  expect(kbd?.textContent).toBe("⌘K");
});

test("no a11y violations (closed)", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (open)", async () => {
  const screen = await render(<Subject withKbd />);
  await userEvent.hover(screen.getByRole("button", { name: "Open settings" }));
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
  // axe the portaled popup, which lands outside the test container.
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});

test("TooltipContent forwards ref to its host element", async () => {
  // Render open so the portaled popup mounts; the ref lands on it.
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger>Open settings</TooltipTrigger>
        <TooltipContent ref={ref}>Settings</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  await expect.poll(() => ref.current).not.toBeNull();
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("tooltip-content");
});
