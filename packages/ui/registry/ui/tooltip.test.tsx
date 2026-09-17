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
 *
 * The padding matters: the positioner flips away from a viewport edge, so a trigger rendered at the
 * very top of the document reports `data-side="bottom"` no matter what `side` asked for.
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
      <div style={{ padding: 150 }}>
        <Tooltip defaultOpen={defaultOpen}>
          <TooltipTrigger aria-label="Settings">Open settings</TooltipTrigger>
          <TooltipContent side={side}>Settings</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/** The portaled popup, wherever in the document Base UI mounted it. */
function popupOf(container: Element): HTMLElement | null {
  return container.ownerDocument.querySelector<HTMLElement>(
    '[data-slot="tooltip-content"]',
  );
}

/** Every open popup in the document. */
function popupsIn(container: Element): HTMLElement[] {
  return [
    ...container.ownerDocument.querySelectorAll<HTMLElement>(
      '[data-slot="tooltip-content"]',
    ),
  ];
}

test("renders the trigger with its data-slot", async () => {
  const screen = await render(<Subject />);
  const trigger = screen.getByRole("button", { name: "Settings" });
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
        <TooltipTrigger aria-label="Settings">Open settings</TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Settings" });
  await expect.element(trigger).toBeInTheDocument();
  expect(trigger.element().hasAttribute("data-popup-open")).toBe(false);
  expect(popupOf(screen.container)).toBeNull();
});

test("the popup appears on hover (Usage)", async () => {
  const screen = await render(<Subject />);
  await userEvent.hover(screen.getByRole("button", { name: "Settings" }));
  await expect
    .element(screen.getByRole("button", { name: "Settings" }))
    .toHaveAttribute("data-popup-open", "");
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  expect(popup!.textContent).toContain("Settings");
});

test("the popup appears on keyboard focus (Usage)", async () => {
  const screen = await render(<Subject />);
  await userEvent.tab();
  const trigger = screen.getByRole("button", { name: "Settings" });
  await expect.element(trigger).toHaveFocus();
  await expect.element(trigger).toHaveAttribute("data-popup-open", "");
  expect(popupOf(screen.container)?.textContent).toContain("Settings");
});

test("Escape closes an open tooltip", async () => {
  const screen = await render(<Subject />);
  await userEvent.tab();
  const trigger = screen.getByRole("button", { name: "Settings" });
  await expect.element(trigger).toHaveAttribute("data-popup-open", "");
  await userEvent.keyboard("{Escape}");
  await expect.element(trigger).not.toHaveAttribute("data-popup-open");
});

/**
 * Base UI's Tooltip is deliberately VISUAL-ONLY: the popup carries no `role="tooltip"` and the
 * trigger gets no `aria-describedby`. Its own guidance
 * (`@base-ui/react/docs/react/components/tooltip.md`) is that the trigger must carry an `aria-label`
 * matching the popup's text — which is what every fixture and every example on the docs page does.
 * This pins that contract, so a future Base UI release that starts wiring the association is
 * noticed rather than assumed.
 */
test("the popup is visual-only and never becomes the trigger's name (Composition)", async () => {
  const screen = await render(<Subject defaultOpen />);
  const trigger = screen.getByRole("button", { name: "Settings" });
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  expect(popup!.getAttribute("role")).toBeNull();
  expect(trigger.element().getAttribute("aria-describedby")).toBeNull();
  await expect.element(trigger).toHaveAccessibleName("Settings");
});

test("the popup is portaled out of the trigger's subtree (Composition)", async () => {
  const screen = await render(<Subject defaultOpen />);
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  expect(screen.container.contains(popup)).toBe(false);
});

test("the side prop reaches the positioner and the popup (Side)", async () => {
  const SIDES = ["left", "top", "bottom", "right"] as const;
  const screen = await render(
    <TooltipProvider>
      <div
        style={{
          padding: 140,
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        {SIDES.map((side) => (
          <Tooltip key={side} defaultOpen>
            <TooltipTrigger aria-label={side}>{side}</TooltipTrigger>
            <TooltipContent side={side}>{`on ${side}`}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>,
  );
  const popups = popupsIn(screen.container);
  expect(popups).toHaveLength(SIDES.length);
  for (const side of SIDES) {
    const popup = popups.find((p) => p.textContent?.includes(`on ${side}`));
    expect(popup, `no popup for side "${side}"`).toBeDefined();
    expect(popup!.getAttribute("data-side")).toBe(side);
    expect(popup!.parentElement!.getAttribute("data-side")).toBe(side);
  }
});

test("OVL-13: the positioner re-applies the nested theme scope across the portal", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger aria-label="Settings">Open settings</TooltipTrigger>
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

test("a kbd hint rides inside the popup (With Keyboard Shortcut)", async () => {
  const screen = await render(
    <TooltipProvider>
      <div style={{ padding: 150 }}>
        <Tooltip defaultOpen>
          <TooltipTrigger aria-label="Save Changes">
            <svg aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>
            Save Changes <kbd data-slot="kbd">S</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>,
  );
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  expect(popup!.textContent).toContain("Save Changes");
  expect(popup!.querySelector('[data-slot="kbd"]')?.textContent).toBe("S");
});

test("a span trigger carries the tooltip for a disabled control (Disabled Button)", async () => {
  const screen = await render(
    <TooltipProvider>
      <div style={{ padding: 150 }}>
        <Tooltip defaultOpen>
          <TooltipTrigger render={<span className="inline-block w-fit" />}>
            <button type="button" disabled>
              Disabled
            </button>
          </TooltipTrigger>
          <TooltipContent>This feature is currently unavailable</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>,
  );
  const popup = popupOf(screen.container);
  expect(popup).not.toBeNull();
  expect(popup!.textContent).toContain("This feature is currently unavailable");
  const trigger = screen.container.querySelector(
    '[data-slot="tooltip-trigger"]',
  );
  expect(trigger?.tagName).toBe("SPAN");
  // The wrapper is what receives the pointer events the disabled button never fires.
  expect(trigger?.querySelector("button")?.disabled).toBe(true);
});

test("no a11y violations — closed", async () => {
  const screen = await render(
    <TooltipProvider>
      <Tooltip open={false}>
        <TooltipTrigger aria-label="Settings">Open settings</TooltipTrigger>
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

test("no a11y violations — icon-only trigger, open", async () => {
  const screen = await render(
    <TooltipProvider>
      <div style={{ padding: 150 }}>
        <Tooltip defaultOpen>
          <TooltipTrigger aria-label="Save Changes">
            <svg aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>Save Changes</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>,
  );
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});
