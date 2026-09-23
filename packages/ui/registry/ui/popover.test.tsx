import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { DirectionProvider } from "./direction";
import { Field, FieldLabel } from "./field";
import { Input } from "./input";

/** Upstream's three alignments (`align` on `PopoverContent`). */
const ALIGNMENTS = ["start", "center", "end"] as const;

/**
 * Collision avoidance is on by default: a popup with no room on its requested side or alignment
 * flips, and `data-side`/`data-align` then report where it actually went. This lane compiles no
 * CSS, so `w-72` is inert and the popup is as wide as its text — which is why every placement
 * fixture below is a SMALL popup with a gutter around it, sized so the requested placement fits
 * inside the 414×896 test viewport and the attribute reports the request rather than a fallback.
 */
function Placed({
  children,
  ...contentProps
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <div style={{ padding: 140 }}>
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent style={{ width: 80 }} {...contentProps}>
          {children ?? "Placed"}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Example({
  contentProps,
  ...rootProps
}: {
  contentProps?: React.ComponentProps<typeof PopoverContent>;
} & React.ComponentProps<typeof Popover>) {
  return (
    <Popover {...rootProps}>
      <PopoverTrigger>Open Popover</PopoverTrigger>
      <PopoverContent {...contentProps}>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>
            Set the dimensions for the layer.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

const popup = () =>
  document.querySelector('[data-slot="popover-content"]') as HTMLElement | null;

/** BRD-1: a real 1px `border border-border`, never upstream's `ring-1 ring-foreground/10` outline. */
function expectBorderNotRing(element: HTMLElement) {
  const tokens = element.className.split(/\s+/);
  expect(tokens).toContain("border");
  expect(tokens).toContain("border-border");
  expect(element.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
}

test("renders a trigger carrying its data-slot (Usage)", async () => {
  const screen = await render(<Example />);
  const trigger = screen.getByRole("button", { name: "Open Popover" });
  await expect.element(trigger).toHaveAttribute("data-slot", "popover-trigger");
  expect(popup()).toBeNull();
});

test("opening portals a dialog carrying every part (Usage, Composition)", async () => {
  const screen = await render(<Example />);
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  const content = popup();
  expect(content).not.toBeNull();
  expect(content?.getAttribute("role")).toBe("dialog");
  // Portaled: the popup is not inside the component's own container subtree.
  expect(screen.container.contains(content)).toBe(false);
  for (const slot of [
    "popover-header",
    "popover-title",
    "popover-description",
  ]) {
    expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
  }
});

test("Escape closes the popover and returns focus to the trigger (Usage)", async () => {
  const screen = await render(<Example />);
  const trigger = screen.getByRole("button", { name: "Open Popover" });
  await userEvent.click(trigger);
  expect(popup()).not.toBeNull();

  await userEvent.keyboard("{Escape}");
  // `aria-expanded`, not the popup's presence: the popup plays an exit animation, so the element
  // outlives the state change by a frame or two and "is it gone" would be a timing assertion.
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => document.activeElement).toBe(trigger.element());
});

test("PopoverTitle names the popup and PopoverDescription describes it (Basic)", async () => {
  const screen = await render(<Example />);
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  const content = popup() as HTMLElement;
  const labelledBy = content.getAttribute("aria-labelledby");
  const describedBy = content.getAttribute("aria-describedby");
  expect(document.getElementById(labelledBy ?? "")?.textContent).toBe(
    "Dimensions",
  );
  expect(document.getElementById(describedBy ?? "")?.textContent).toBe(
    "Set the dimensions for the layer.",
  );
});

test.each(ALIGNMENTS)(
  "align=%s is recorded on the positioner and the popup (Align)",
  async (align) => {
    const screen = await render(<Placed align={align} />);
    await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
    const content = popup() as HTMLElement;
    expect(content.getAttribute("data-align")).toBe(align);
    expect(content.parentElement?.getAttribute("data-align")).toBe(align);
  },
);

test("side is forwarded to the positioner (Align)", async () => {
  const screen = await render(<Placed side="top" />);
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  expect((popup() as HTMLElement).getAttribute("data-side")).toBe("top");
});

test("form controls inside the popup are labelled and editable (With Form)", async () => {
  const screen = await render(
    <Popover>
      <PopoverTrigger>Open Popover</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions.</PopoverDescription>
        </PopoverHeader>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="popover-test-width">Width</FieldLabel>
          <Input id="popover-test-width" defaultValue="100%" />
        </Field>
      </PopoverContent>
    </Popover>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  const width = document.getElementById(
    "popover-test-width",
  ) as HTMLInputElement;
  expect(width).not.toBeNull();
  await userEvent.fill(width, "50%");
  expect(width.value).toBe("50%");
});

test("RTL: a logical side resolves against the direction context, not the portal (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Placed side="inline-start" dir="rtl" />
      </div>
    </DirectionProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  const content = popup() as HTMLElement;
  const trigger = screen
    .getByRole("button", { name: "Open Popover" })
    .element();
  expect(getComputedStyle(content).direction).toBe("rtl");
  expect(content.getAttribute("data-side")).toBe("inline-start");
  // `inline-start` under RTL is the RIGHT of the trigger. Without DirectionProvider the positioner
  // would read the portal's LTR context and place it on the left, so this is the assertion that
  // actually distinguishes the two.
  expect(content.getBoundingClientRect().left).toBeGreaterThanOrEqual(
    trigger.getBoundingClientRect().right,
  );
});

test("OVL-13: the positioner inside the portal carries the theme scope", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-test-scope">
      <Example />
    </InternalThemeScopeProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  const content = popup() as HTMLElement;
  const portal = content.closest("[data-base-ui-portal]");
  expect(portal).not.toBeNull();
  const scoped = portal?.querySelector(".vs-test-scope");
  expect(scoped).not.toBeNull();
  // The scope host is the POSITIONER — the popup's own parent, inside the portal.
  expect(scoped).toBe(content.parentElement);
});

test("OVL-13: with no scope in context the positioner carries no scope class", async () => {
  const screen = await render(<Example />);
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  const positioner = (popup() as HTMLElement).parentElement as HTMLElement;
  expect(positioner.className).toContain("isolate");
  expect(positioner.className).not.toContain("vs-test-scope");
});

test("FOC-1/FOC-6: nothing rendered carries a focus glow", async () => {
  const screen = await render(<Example />);
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  const classes = [
    ...screen.container.querySelectorAll<HTMLElement>("*"),
    ...document.querySelectorAll<HTMLElement>(
      "[data-base-ui-portal] *, [data-base-ui-portal]",
    ),
  ]
    .map((element) => element.className)
    .filter((value): value is string => typeof value === "string");
  for (const value of classes) {
    expect(value).not.toMatch(/ring-3|ring-\[3px\]/);
    expect(value).not.toContain("focus-visible:ring-");
  }
});

test("BRD-1: the popover surface draws a real border, not a ring outline", async () => {
  const screen = await render(<Example />);
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  expectBorderNotRing(popup() as HTMLElement);
});

test("no a11y violations — closed", async () => {
  const screen = await render(<Example />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Example />);
  await userEvent.click(screen.getByRole("button", { name: "Open Popover" }));
  // The popup portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(document.body);
});
