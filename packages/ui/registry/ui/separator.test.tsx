import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Separator } from "./separator";

/** The two orientations upstream documents (docs § Usage, § Vertical). */
const ORIENTATIONS = ["horizontal", "vertical"] as const;

/** The canonical source as text, for the deviation assertions below. */
const SOURCE =
  Object.values(
    import.meta.glob<string>("./separator.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
      // The repo's ambient `ImportMeta.glob` (declared in animated-icons.test.tsx) is narrower
      // than Vite's own signature; the assertion re-widens it without loosening the call.
    } as { eager: true }),
  )[0] ?? "";

test("renders a separator carrying data-slot, and defaults to horizontal", async () => {
  const screen = await render(<Separator />);
  const separator = screen.getByRole("separator");
  await expect.element(separator).toBeInTheDocument();
  await expect.element(separator).toHaveAttribute("data-slot", "separator");
  await expect
    .element(separator)
    .toHaveAttribute("data-orientation", "horizontal");
});

test("Usage: a horizontal separator is a hairline that spans its inline size", async () => {
  const screen = await render(<Separator />);
  const classes = screen.getByRole("separator").element().className;
  expect(classes).toContain("data-horizontal:h-px");
  expect(classes).toContain("data-horizontal:w-full");
  expect(classes).toContain("bg-border");
  expect(classes).toContain("shrink-0");
});

test("Vertical: orientation=vertical flips the axis and stretches to the row", async () => {
  const screen = await render(<Separator orientation="vertical" />);
  const separator = screen.getByRole("separator");
  await expect
    .element(separator)
    .toHaveAttribute("data-orientation", "vertical");
  await expect
    .element(separator)
    .toHaveAttribute("aria-orientation", "vertical");
  const classes = separator.element().className;
  expect(classes).toContain("data-vertical:w-px");
  expect(classes).toContain("data-vertical:self-stretch");
});

test("Vertical: each orientation stamps its own data-orientation", async () => {
  const seen = new Set<string>();
  for (const orientation of ORIENTATIONS) {
    const screen = await render(<Separator orientation={orientation} />);
    const value = screen.container
      .querySelector("[data-slot=separator]")
      ?.getAttribute("data-orientation");
    expect(value).toBe(orientation);
    seen.add(value ?? "");
  }
  expect(seen.size).toBe(ORIENTATIONS.length);
});

test("Vertical: one recipe carries both axes, so a caller never restates them", async () => {
  const horizontal = (await render(<Separator />)).container.querySelector(
    "[data-slot=separator]",
  )?.className;
  const vertical = (
    await render(<Separator orientation="vertical" />)
  ).container.querySelector("[data-slot=separator]")?.className;
  expect(horizontal).toBeTruthy();
  expect(horizontal).toBe(vertical);
});

test("Menu: vertical separators divide a row of menu entries", async () => {
  const screen = await render(
    <div className="flex items-center gap-2">
      <span>Settings</span>
      <Separator orientation="vertical" />
      <span>Account</span>
      <Separator orientation="vertical" />
      <span>Help</span>
    </div>,
  );
  const separators = screen.container.querySelectorAll("[data-slot=separator]");
  expect(separators.length).toBe(2);
  for (const separator of separators) {
    expect(separator.getAttribute("data-orientation")).toBe("vertical");
  }
});

test("Menu: a caller's className merges rather than replacing the recipe", async () => {
  const screen = await render(
    <Separator orientation="vertical" className="hidden md:block" />,
  );
  const classes = screen.getByRole("separator").element().className;
  expect(classes).toContain("hidden");
  expect(classes).toContain("md:block");
  expect(classes).toContain("bg-border");
});

test("List: horizontal separators divide a stack of rows", async () => {
  const screen = await render(
    <div className="flex flex-col gap-2">
      <dl>
        <dt>Item 1</dt>
        <dd>Value 1</dd>
      </dl>
      <Separator />
      <dl>
        <dt>Item 2</dt>
        <dd>Value 2</dd>
      </dl>
    </div>,
  );
  const separators = screen.container.querySelectorAll("[data-slot=separator]");
  expect(separators.length).toBe(1);
  expect(separators[0]?.getAttribute("data-orientation")).toBe("horizontal");
});

test("List: a separator is never focusable and never a control", async () => {
  const screen = await render(<Separator />);
  const separator = screen.getByRole("separator").element();
  expect(separator.hasAttribute("tabindex")).toBe(false);
  expect(separator.tagName).not.toBe("BUTTON");
});

test("RTL: the recipe is written in logical properties, never left/right", async () => {
  const screen = await render(
    <div dir="rtl">
      <Separator />
    </div>,
  );
  const classes = screen.getByRole("separator").element().className;
  expect(classes).not.toMatch(/(?:^|\s)(?:ml|mr|pl|pr|left|right)-/);
  // `w-full` spans the inline size, so a right-to-left document needs no change.
  expect(classes).toContain("data-horizontal:w-full");
});

test("DOC-2: the canonical source imports cn from the published package", async () => {
  expect(SOURCE).toContain('from "@vegastack/design"');
  expect(SOURCE).not.toContain('from "cn"');
});

test("no a11y violations — horizontal", async () => {
  const screen = await render(
    <div>
      <p>Above</p>
      <Separator />
      <p>Below</p>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — vertical", async () => {
  const screen = await render(
    <div className="flex items-center gap-2">
      <span>Blog</span>
      <Separator orientation="vertical" />
      <span>Docs</span>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a decorative separator hidden from the a11y tree", async () => {
  const screen = await render(
    <div>
      <p>Above</p>
      <Separator aria-hidden="true" />
      <p>Below</p>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
