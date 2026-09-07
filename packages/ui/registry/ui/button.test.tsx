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

test("tone defaults to neutral and emits its custom-property class", async () => {
  const screen = await render(<Button>Save</Button>);
  const btn = screen.getByRole("button", { name: "Save" });
  await expect.element(btn).toHaveAttribute("data-tone", "neutral");
  // The solid recipe reads `--btn-fill`; the neutral tone must actually declare it. That the
  // property RESOLVES is measured under compiled CSS in test/button-matrix.browser.test.tsx.
  expect((btn.element() as HTMLElement).className).toContain(
    "[--btn-fill:var(--primary)]",
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

test("a loading button keeps its accessible name", async () => {
  // Regression: hiding the label with `visibility: hidden` while the spinner overlays it dropped
  // the label out of the accessibility tree, so axe reported `button-name` on the Button route.
  const screen = await render(<Button loading>Save changes</Button>);
  await expect
    .element(screen.getByRole("button", { name: "Save changes" }))
    .toBeInTheDocument();
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

test("loading takes the spinner out of flow and only hides the label", async () => {
  // The measured width claim lives in test/button-matrix.browser.test.tsx (compiled CSS); this is
  // the structural half — the spinner is absolutely positioned and the label keeps its box.
  const screen = await render(<Button loading>Save changes</Button>);
  const btn = screen
    .getByRole("button", { name: "Save changes" })
    .element() as HTMLElement;
  expect(btn.className).toContain("relative");
  const spinnerHost = btn.querySelector("span[aria-hidden]")!;
  expect(spinnerHost.className).toContain("absolute");
  const label = btn.querySelector("span.contents")!;
  // `opacity-0`, not `invisible` — `visibility: hidden` would drop the label out of the
  // accessibility tree and leave the loading button with no discernible name.
  expect(label.className).toContain("opacity-0");
  expect(label.className).not.toContain("invisible");
  expect(label.textContent).toBe("Save changes");
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
  await btn.click({ force: true });
  expect(onClick).not.toHaveBeenCalled();
});

test("the dim is keyed off data-disabled and excluded while loading", async () => {
  // Rendered opacity is measured in test/button-matrix.browser.test.tsx; here we pin that the
  // pending state is marked so the dim can be excluded from it at all.
  const screen = await render(<Button loading>Save</Button>);
  const btn = screen.getByRole("button", { name: "Save" });
  await expect.element(btn).toHaveAttribute("data-loading", "");
  expect((btn.element() as HTMLElement).className).toContain(
    "data-disabled:not-data-loading:opacity-(--opacity-dim)",
  );
});
