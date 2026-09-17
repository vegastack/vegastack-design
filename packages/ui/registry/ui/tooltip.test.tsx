import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

/**
 * Base UI's Tooltip reads its shared delay from a Provider. The app mounts one in the VegaStack
 * provider; tests mount their own so hover and focus open without waiting.
 */
function Subject({
  side,
  defaultOpen,
}: {
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  defaultOpen?: boolean;
} = {}) {
  return (
    <TooltipProvider>
      <Tooltip defaultOpen={defaultOpen}>
        <TooltipTrigger>Open settings</TooltipTrigger>
        <TooltipContent side={side}>Settings</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** The portaled popup, wherever in the document Base UI mounted it. */
function popupOf(container: Element): HTMLElement | null {
  return container.ownerDocument.querySelector<HTMLElement>(
    '[data-slot="tooltip-content"]',
  );
}

test("renders the trigger with its data-slot", async () => {
  const screen = await render(<Subject />);
  const trigger = screen.getByRole("button", { name: "Open settings" });
  await expect.element(trigger).toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute("data-slot", "tooltip-trigger");
});

test("a closed tooltip renders no popup", async () => {
  // CONTROLLED open={false}: deterministic. A delay=0 uncontrolled tooltip opens on focus-visible
  // regardless of the hover delay, and under full-suite load the shared browser input state can
  // transiently focus a freshly-rendered trigger. The open path is covered below.
  const screen = await render(
    <TooltipProvider>
      <Tooltip open={false}>
        <TooltipTrigger>Open settings</TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Open settings" }))
    .toBeInTheDocument();
  expect(popupOf(screen.container)).toBeNull();
});

test("the popup appears on hover (Usage)", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByRole("button", { name: "Open settings" }));
  const tooltip = screen.getByRole("tooltip");
  await expect.element(tooltip).toBeInTheDocument();
  await expect.element(tooltip).toHaveTextContent("Settings");
});

test("the popup appears on keyboard focus (Usage)", async () => {
  const screen = await render(<Subject />);
  await userEvent.tab();
  const trigger = screen.getByRole("button", { name: "Open settings" });
  await expect.element(trigger).toHaveFocus();
  await expect
    .element(screen.getByRole("tooltip"))
    .toHaveTextContent("Settings");
});

test("the open popup describes its trigger rather than naming it (Composition)", async () => {
  const screen = await render(<Subject defaultOpen />);
  const trigger = screen.getByRole("button", { name: "Open settings" });
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  const describedBy = trigger.element().getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(popup!.id).toBe(describedBy);
  // A description, never the name: the trigger still reads as "Open settings".
  await expect.element(trigger).toHaveAccessibleName("Open settings");
  await expect.element(trigger).toHaveAccessibleDescription("Settings");
});

test("the popup is portaled out of the trigger's subtree (Composition)", async () => {
  const screen = await render(<Subject defaultOpen />);
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  expect(screen.container.contains(popup)).toBe(false);
});

test("the side prop reaches the popup (Side)", async () => {
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const screen = await render(<Subject defaultOpen side={side} />);
    const popup = popupOf(screen.container);
    expect(popup).not.toBeNull();
    expect(popup!.getAttribute("data-side")).toBe(side);
    screen.unmount();
  }
});

test("OVL-13: the positioner re-applies the nested theme scope across the portal", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Open settings</TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </InternalThemeScopeProvider>,
  );
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  const positioner = popup!.parentElement;
  expect(positioner).not.toBeNull();
  expect(positioner!.className).toContain("vs-scope-under-test");
  expect(positioner!.className).toContain("isolate");
});

test("OVL-13: with no scope in the tree the positioner keeps only its own classes", async () => {
  const screen = await render(<Subject defaultOpen />);
  const positioner = popupOf(screen.container)!.parentElement!;
  expect(positioner.className).toContain("isolate");
  expect(positioner.className).not.toContain("vs-scope-under-test");
});

test("a kbd hint inside the popup keeps the popup's text (With Keyboard Shortcut)", async () => {
  const screen = await render(
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger aria-label="Save">
          <svg aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>
          Save Changes <kbd data-slot="kbd">S</kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  expect(popup!.textContent).toContain("Save Changes");
  expect(popup!.querySelector('[data-slot="kbd"]')?.textContent).toBe("S");
});

test("a span trigger can describe a disabled control (Disabled Button)", async () => {
  const screen = await render(
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger render={<span className="inline-block w-fit" />}>
          <button type="button" disabled>
            Disabled
          </button>
        </TooltipTrigger>
        <TooltipContent>This feature is currently unavailable</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  expect(popup!.textContent).toContain("This feature is currently unavailable");
  const trigger = screen.container.querySelector(
    '[data-slot="tooltip-trigger"]',
  );
  expect(trigger?.tagName).toBe("SPAN");
});

test("no a11y violations — closed", async () => {
  const screen = await render(
    <TooltipProvider>
      <Tooltip open={false}>
        <TooltipTrigger>Open settings</TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open (trigger and portaled popup)", async () => {
  const screen = await render(<Subject defaultOpen />);
  expect(popupOf(screen.container)).not.toBeNull();
  // The popup lives outside the render container, so the document body is the audit root.
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});
