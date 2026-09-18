import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Label } from "./label";

/** The canonical source as text, for the deviation assertions below. */
const SOURCE =
  Object.values(
    import.meta.glob<string>("./label.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
      // The repo's ambient `ImportMeta.glob` (declared in animated-icons.test.tsx) is narrower
      // than Vite's own signature; the assertion re-widens it without loosening the call.
    } as { eager: true }),
  )[0] ?? "";

test("renders a native label carrying data-slot", async () => {
  const screen = await render(<Label>Accept terms and conditions</Label>);
  const label = screen.getByText("Accept terms and conditions");
  await expect.element(label).toBeInTheDocument();
  expect(label.element().tagName).toBe("LABEL");
  await expect.element(label).toHaveAttribute("data-slot", "label");
});

test("Usage: htmlFor associates the label with its control's accessible name", async () => {
  const screen = await render(
    <div>
      <input id="label-terms" type="checkbox" />
      <Label htmlFor="label-terms">Accept terms and conditions</Label>
    </div>,
  );
  const control = screen.getByRole("checkbox", {
    name: "Accept terms and conditions",
  });
  await expect.element(control).toBeInTheDocument();
  const label = screen.container.querySelector("label");
  expect(label?.getAttribute("for")).toBe("label-terms");
});

test("Usage: clicking the label activates the control it names", async () => {
  const screen = await render(
    <div>
      <input id="label-click" type="checkbox" />
      <Label htmlFor="label-click">Accept terms and conditions</Label>
    </div>,
  );
  const control = screen.getByRole("checkbox", {
    name: "Accept terms and conditions",
  });
  expect((control.element() as HTMLInputElement).checked).toBe(false);
  (screen.container.querySelector("label") as HTMLLabelElement).click();
  expect((control.element() as HTMLInputElement).checked).toBe(true);
});

test("Label in Field: a disabled peer and a disabled group each dim the label", async () => {
  const screen = await render(<Label>Your email address</Label>);
  const classes =
    screen.container.querySelector("[data-slot=label]")?.className ?? "";
  expect(classes).toContain("peer-disabled:opacity-50");
  expect(classes).toContain("peer-disabled:cursor-not-allowed");
  expect(classes).toContain("group-data-[disabled=true]:opacity-50");
  expect(classes).toContain("group-data-[disabled=true]:pointer-events-none");
});

test("Label in Field: the label is a flex row that will not select on a double click", async () => {
  const screen = await render(
    <Label>
      <svg aria-hidden="true" />
      Your email address
    </Label>,
  );
  const classes =
    screen.container.querySelector("[data-slot=label]")?.className ?? "";
  expect(classes).toContain("flex");
  expect(classes).toContain("items-center");
  expect(classes).toContain("gap-2");
  expect(classes).toContain("select-none");
});

test("Label in Field: a caller's className merges rather than replacing the recipe", async () => {
  const screen = await render(
    <Label className="font-normal">Same as shipping address</Label>,
  );
  const classes =
    screen.container.querySelector("[data-slot=label]")?.className ?? "";
  expect(classes).toContain("font-normal");
  expect(classes).not.toContain("font-medium");
  expect(classes).toContain("text-sm");
});

test("RTL: the recipe is written in logical properties, never left/right", async () => {
  const screen = await render(
    <div dir="rtl">
      <Label>قبول الشروط والأحكام</Label>
    </div>,
  );
  const classes =
    screen.container.querySelector("[data-slot=label]")?.className ?? "";
  expect(classes).not.toMatch(/(?:^|\s)(?:ml|mr|pl|pr|left|right)-/);
});

test("API-16: the canonical source carries no 'use client' directive", async () => {
  expect(SOURCE).not.toMatch(/["']use client["']/);
  // It renders a native element and touches no React hook, so it is server-safe by default.
  expect(SOURCE).not.toMatch(/\bReact\.use[A-Z]/);
  expect(SOURCE).not.toMatch(/\buse(?:State|Effect|Ref|Id|Memo|Callback)\s*\(/);
});

test("DOC-2: the canonical source imports cn from the published package", async () => {
  expect(SOURCE).toContain('from "@vegastack/design"');
  expect(SOURCE).not.toContain('from "cn"');
});

test("no a11y violations — a label naming a checkbox", async () => {
  const screen = await render(
    <div>
      <input id="label-a11y" type="checkbox" />
      <Label htmlFor="label-a11y">Accept terms and conditions</Label>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a label naming a disabled control", async () => {
  const screen = await render(
    <div>
      <input id="label-a11y-disabled" type="checkbox" disabled />
      <Label htmlFor="label-a11y-disabled">Accept terms and conditions</Label>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a label wrapping its own control", async () => {
  const screen = await render(
    <Label>
      <input type="checkbox" />
      Accept terms and conditions
    </Label>,
  );
  await expectNoA11yViolations(screen.container);
});
