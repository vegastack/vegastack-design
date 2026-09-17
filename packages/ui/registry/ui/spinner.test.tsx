import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Spinner } from "./spinner";

/** The one element this component renders. */
function spinnerIn(container: Element): SVGElement {
  const element = container.querySelector<SVGElement>('[data-slot="spinner"]');
  expect(element).not.toBeNull();
  return element!;
}

test("renders an svg carrying data-slot, role=status and its accessible name", async () => {
  const screen = await render(<Spinner />);
  const spinner = spinnerIn(screen.container);
  expect(spinner.tagName.toLowerCase()).toBe("svg");
  expect(spinner.getAttribute("role")).toBe("status");
  expect(spinner.getAttribute("aria-label")).toBe("Loading");
  await expect
    .element(screen.getByRole("status", { name: "Loading" }))
    .toBeInTheDocument();
});

test("the default recipe is the upstream one (Usage)", async () => {
  const screen = await render(<Spinner />);
  const classes = spinnerIn(screen.container)
    .getAttribute("class")!
    .split(/\s+/);
  expect(classes).toContain("size-4");
  expect(classes).toContain("animate-spin");
});

test("the size-* utility replaces the default tier rather than stacking with it (Size)", async () => {
  for (const size of ["size-3", "size-4", "size-6", "size-8"] as const) {
    const screen = await render(<Spinner className={size} />);
    const classes = spinnerIn(screen.container)
      .getAttribute("class")!
      .split(/\s+/);
    expect(classes).toContain(size);
    expect(classes).toContain("animate-spin");
    // `cn` resolves the conflict in the caller's favour: exactly one size utility survives.
    expect(classes.filter((c) => /^size-\d+$/.test(c))).toHaveLength(1);
    screen.unmount();
  }
});

test("the icon is swappable without moving the contract (Customization)", async () => {
  // The component is one lucide icon; a swap changes the mark and nothing else. The contract the
  // rest of the system depends on is the data-slot, the role, the name and the spin.
  const screen = await render(<Spinner />);
  const spinner = spinnerIn(screen.container);
  expect(spinner.getAttribute("data-slot")).toBe("spinner");
  expect(spinner.getAttribute("role")).toBe("status");
  expect(spinner.querySelector("path")).not.toBeNull();
});

test("colour is inherited, never declared — no fill or stroke of its own", async () => {
  const screen = await render(<Spinner />);
  const classes = spinnerIn(screen.container)
    .getAttribute("class")!
    .split(/\s+/);
  expect(classes.some((c) => /^(?:text|fill|stroke)-/.test(c))).toBe(false);
});

test("data-icon spacing attributes are forwarded to the host control (Button, Badge)", async () => {
  const screen = await render(
    <button type="button">
      <Spinner data-icon="inline-start" />
      Loading...
    </button>,
  );
  expect(spinnerIn(screen.container).getAttribute("data-icon")).toBe(
    "inline-start",
  );
});

test("aria-label can be suppressed where the host already announces the wait", async () => {
  const screen = await render(
    <span aria-busy="true">
      Processing payment
      <Spinner aria-label={undefined} />
    </span>,
  );
  const spinner = spinnerIn(screen.container);
  expect(spinner.hasAttribute("aria-label")).toBe(false);
});

test("no a11y violations — rest", async () => {
  const screen = await render(<Spinner />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — inside a busy control (Button)", async () => {
  const screen = await render(
    <button type="button" disabled aria-busy="true">
      <Spinner aria-label={undefined} data-icon="inline-start" />
      Loading...
    </button>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — sized", async () => {
  const screen = await render(
    <div>
      <Spinner className="size-3" />
      <Spinner className="size-8" />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
