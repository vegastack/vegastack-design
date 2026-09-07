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

test("applies variant + tone + size data attributes", async () => {
  const screen = await render(
    <Button variant="soft" tone="destructive" size="lg">
      Delete
    </Button>,
  );
  const btn = screen.getByRole("button", { name: "Delete" });
  await expect.element(btn).toHaveAttribute("data-variant", "soft");
  await expect.element(btn).toHaveAttribute("data-tone", "destructive");
  await expect.element(btn).toHaveAttribute("data-size", "lg");
});

test("tone defaults to neutral and sets the tone custom properties", async () => {
  const screen = await render(<Button>Save</Button>);
  const btn = screen
    .getByRole("button", { name: "Save" })
    .element() as HTMLElement;
  await expect
    .element(screen.getByRole("button", { name: "Save" }))
    .toHaveAttribute("data-tone", "neutral");
  // The solid recipe reads `--btn-fill`; the neutral tone must actually define it.
  expect(getComputedStyle(btn).getPropertyValue("--btn-fill").trim()).not.toBe(
    "",
  );
});

test("cta emits no tone at all — it is brand-locked", async () => {
  const screen = await render(<Button variant="cta">Get started</Button>);
  await expect
    .element(screen.getByRole("button", { name: "Get started" }))
    .not.toHaveAttribute("data-tone");
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

test("cta variant does not disturb the solid variant classes", async () => {
  const screen = await render(<Button>Save</Button>);
  const btn = screen
    .getByRole("button", { name: "Save" })
    .element() as HTMLElement;
  expect(btn.classList.contains("rounded-(--radius-sharp)")).toBe(false);
  expect(btn.classList.contains("font-mono")).toBe(false);
  expect(btn.classList.contains("uppercase")).toBe(false);
});

/* ---------------------------------------------------------------------------
 * Loading — the spinner is taken OUT of flow and stacked over the label, so the
 * button's width is identical across the flip (audit B1-08).
 * ------------------------------------------------------------------------ */

test("loading keeps the label mounted (hidden) and shows exactly one spinner", async () => {
  const screen = await render(<Button loading>Save changes</Button>);
  const btn = screen
    .getByRole("button", { name: "Save changes" })
    .element() as HTMLElement;
  expect(btn.querySelectorAll("svg")).toHaveLength(1); // the spinner
  expect(btn.textContent).toContain("Save changes");
});

test("loading does not move the button's width", async () => {
  const idle = await render(<Button>Save changes</Button>);
  const idleWidth = (
    idle.getByRole("button", { name: "Save changes" }).element() as HTMLElement
  ).getBoundingClientRect().width;

  const busy = await render(<Button loading>Save changes</Button>);
  const busyWidth = (
    busy.getByRole("button", { name: "Save changes" }).element() as HTMLElement
  ).getBoundingClientRect().width;

  expect(Math.abs(busyWidth - idleWidth)).toBeLessThan(0.5);
});

/* ---------------------------------------------------------------------------
 * Disabled is the aria-disabled form (audit D7): the control keeps its pointer
 * events so a Tooltip can explain why it is unavailable.
 * ------------------------------------------------------------------------ */

test("disabled renders aria-disabled, not the native attribute, and keeps pointer events", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <Button disabled onClick={onClick}>
      Save
    </Button>,
  );
  const btn = screen.getByRole("button", { name: "Save" });
  await expect.element(btn).toHaveAttribute("aria-disabled", "true");
  await expect.element(btn).not.toHaveAttribute("disabled");
  const element = btn.element() as HTMLElement;
  expect(getComputedStyle(element).pointerEvents).not.toBe("none");
  await btn.click({ force: true });
  expect(onClick).not.toHaveBeenCalled();
});

test("a disabled button dims, a loading one does not", async () => {
  const off = await render(<Button disabled>Save</Button>);
  const offEl = off.getByRole("button", { name: "Save" }).element();
  expect(Number(getComputedStyle(offEl).opacity)).toBeLessThan(1);

  const busy = await render(<Button loading>Save</Button>);
  const busyEl = busy.getByRole("button", { name: "Save" }).element();
  expect(Number(getComputedStyle(busyEl).opacity)).toBe(1);
});
