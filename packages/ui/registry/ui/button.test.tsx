import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";

test("renders children and is a button by default", async () => {
  const screen = await render(<Button>Save</Button>);
  await expect
    .element(screen.getByRole("button", { name: "Save" }))
    .toBeInTheDocument();
});

test("fires onClick", async () => {
  const onClick = vi.fn();
  const screen = await render(<Button onClick={onClick}>Save</Button>);
  await screen.getByRole("button", { name: "Save" }).click();
  expect(onClick).toHaveBeenCalledOnce();
});

test("loading marks the button busy, inert, and focusable", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <Button loading onClick={onClick}>
      Save
    </Button>,
  );
  const btn = screen.getByRole("button", { name: "Save" });
  await expect.element(btn).toHaveAttribute("aria-busy", "true");
  await expect.element(btn).toHaveAttribute("aria-disabled", "true");
  await expect.element(btn).not.toHaveAttribute("disabled");
  await btn.click({ force: true });
  expect(onClick).not.toHaveBeenCalled();
});

test("render prop supports non-native action elements with nativeButton=false", async () => {
  const screen = await render(
    <Button render={<span />} nativeButton={false}>
      Open
    </Button>,
  );
  const btn = screen.getByRole("button", { name: "Open" });
  await expect.element(btn).toHaveAttribute("data-slot", "button");
  expect(btn.element().tagName).toBe("SPAN");
});

test("applies variant + size data attributes", async () => {
  const screen = await render(
    <Button variant="destructive" size="lg">
      Delete
    </Button>,
  );
  const btn = screen.getByRole("button", { name: "Delete" });
  await expect.element(btn).toHaveAttribute("data-variant", "destructive");
  await expect.element(btn).toHaveAttribute("data-size", "lg");
});

test("keeps the link variant underlined at rest", async () => {
  const screen = await render(<Button variant="link">Read details</Button>);
  const button = screen.getByRole("button", { name: "Read details" }).element();
  expect(button.classList).toContain("underline");
});

test("no a11y violations", async () => {
  const screen = await render(<Button>Save</Button>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Button disabled>Save</Button>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — loading", async () => {
  const screen = await render(<Button loading>Save</Button>);
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the underlying button element", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(<Button ref={ref}>Save</Button>);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("button");
});

test("forwards ref onto the composed non-native element via render", async () => {
  const ref = React.createRef<HTMLElement>();
  await render(
    <Button render={<span />} nativeButton={false} ref={ref}>
      Open
    </Button>,
  );
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
});

/* ---------------------------------------------------------------------------
 * Marketing CTA variant (Phase B, audit 17-brand-direction) — the ONE
 * sanctioned use of the `--brand` phosphor accent as a button.
 * ------------------------------------------------------------------------ */

test("cta variant sets data-variant and renders its label", async () => {
  const screen = await render(<Button variant="cta">Get started</Button>);
  const btn = screen.getByRole("button", { name: "Get started" });
  await expect.element(btn).toHaveAttribute("data-variant", "cta");
});

test("cta variant carries the sharp radius, brand outline, and mono-uppercase classes", async () => {
  const screen = await render(<Button variant="cta">Get started</Button>);
  const btn = screen
    .getByRole("button", { name: "Get started" })
    .element() as HTMLElement;
  expect(btn.classList.contains("rounded-(--radius-sharp)")).toBe(true);
  expect(btn.classList.contains("text-mono-label")).toBe(true);
  expect(btn.classList.contains("font-mono")).toBe(true);
  expect(btn.classList.contains("uppercase")).toBe(true);
  expect(btn.classList.contains("text-brand")).toBe(true);
});

test("cta variant composes a trailing icon as a child, not baked in", async () => {
  function ChevronStub() {
    return <svg data-testid="chevron" aria-hidden />;
  }
  const screen = await render(
    <Button variant="cta">
      Get started
      <ChevronStub />
    </Button>,
  );
  await expect.element(screen.getByTestId("chevron")).toBeInTheDocument();
});

test("cta variant does not disturb the default variant classes", async () => {
  const screen = await render(<Button>Save</Button>);
  const btn = screen
    .getByRole("button", { name: "Save" })
    .element() as HTMLElement;
  expect(btn.classList.contains("rounded-(--radius-sharp)")).toBe(false);
  expect(btn.classList.contains("font-mono")).toBe(false);
  expect(btn.classList.contains("uppercase")).toBe(false);
});

/* ---------------------------------------------------------------------------
 * Loading + fixed-square icon sizes — the spinner REPLACES the icon child
 * (both at once overflow the square). The aria-label keeps the accessible name.
 * ------------------------------------------------------------------------ */

test("loading with an icon size renders the spinner INSTEAD of the icon child (one glyph in the square)", async () => {
  function PlusStub() {
    return <svg data-testid="plus-icon" aria-hidden />;
  }
  const screen = await render(
    <Button size="icon" loading aria-label="Add item">
      <PlusStub />
    </Button>,
  );
  const btn = screen
    .getByRole("button", { name: "Add item" })
    .element() as HTMLElement;
  expect(btn.querySelectorAll("svg")).toHaveLength(1); // exactly one glyph: the spinner
  expect(btn.querySelector('[data-testid="plus-icon"]')).toBeNull();
});

test("loading with a text size keeps the label next to the spinner (unchanged behavior)", async () => {
  const screen = await render(<Button loading>Save</Button>);
  const btn = screen
    .getByRole("button", { name: "Save" })
    .element() as HTMLElement;
  expect(btn.querySelectorAll("svg")).toHaveLength(1); // the spinner
  expect(btn.textContent).toContain("Save");
});

test('finish="lit" applies the lit shadow on the default variant and marks data-finish', async () => {
  const screen = await render(<Button finish="lit">Create</Button>);
  const btn = screen.getByRole("button", { name: "Create" });
  await expect.element(btn).toHaveAttribute("data-finish", "lit");
  expect((btn.element() as HTMLElement).className).toContain(
    "shadow-(--shadow-lit)",
  );
});

test('finish="lit" is a no-op on non-default variants (flat stays the rule)', async () => {
  const screen = await render(
    <Button variant="outline" finish="lit">
      Cancel
    </Button>,
  );
  const btn = screen.getByRole("button", { name: "Cancel" });
  expect((btn.element() as HTMLElement).className).not.toContain(
    "shadow-(--shadow-lit)",
  );
});
