import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Badge } from "./badge";

test("renders children inside a span by default", async () => {
  const screen = await render(<Badge>Active</Badge>);
  const badge = screen.getByText("Active");
  await expect.element(badge).toBeInTheDocument();
  await expect.element(badge).toHaveAttribute("data-slot", "badge");
});

test("applies variant + color + size data attributes", async () => {
  const screen = await render(
    <Badge variant="solid" intent="success" size="lg">
      Done
    </Badge>,
  );
  const badge = screen.getByText("Done");
  await expect.element(badge).toHaveAttribute("data-variant", "solid");
  await expect.element(badge).toHaveAttribute("data-intent", "success");
  await expect.element(badge).toHaveAttribute("data-size", "lg");
});

test("minimal carries a leading dot by default — status is never colour alone", async () => {
  // A minimal badge has no container, so colour is the only thing left to carry
  // status unless something non-colour does (WCAG 1.4.1). The dot is that
  // carrier, and it is on by default ONLY here.
  const screen = await render(
    <Badge variant="minimal" intent="warning" data-testid="m">
      Pending
    </Badge>,
  );
  const el = screen.getByTestId("m").element();
  expect(el.getAttribute("data-dot")).toBe("");
  expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();

  // ...and off by default on every container-ful variant.
  const soft = await render(
    <Badge intent="warning" data-testid="s">
      Pending
    </Badge>,
  );
  expect(soft.getByTestId("s").element().getAttribute("data-dot")).toBeNull();
});

test("an explicit dot={false} opts a minimal badge out", async () => {
  const screen = await render(
    <Badge variant="minimal" dot={false} data-testid="m">
      Quiet
    </Badge>,
  );
  expect(screen.getByTestId("m").element().getAttribute("data-dot")).toBeNull();
});

test("icon takes the dot's place rather than joining it", async () => {
  const screen = await render(
    <Badge variant="minimal" icon={<svg data-testid="ic" />} data-testid="m">
      Paid
    </Badge>,
  );
  const el = screen.getByTestId("m").element();
  expect(el.querySelector('[data-testid="ic"]')).not.toBeNull();
  // `icon` suppresses the default dot — one leading marker, never two.
  expect(el.getAttribute("data-dot")).toBeNull();
});

test("renders a decorative dot when dot is set", async () => {
  const screen = await render(<Badge dot>Online</Badge>);
  const badge = screen.getByText("Online");
  const dot = badge.element().querySelector('[aria-hidden="true"]');
  expect(dot).not.toBeNull();
});

test("loading sets aria-busy and replaces the dot with a spinner", async () => {
  const screen = await render(
    <Badge dot loading>
      Syncing
    </Badge>,
  );
  const badge = screen.getByText("Syncing");
  await expect.element(badge).toHaveAttribute("aria-busy", "true");
  await expect.element(badge).toHaveAttribute("data-loading", "");
  // The spinner (svg) is rendered; the dot span is suppressed while loading.
  const spinner = badge.element().querySelector("svg");
  expect(spinner).not.toBeNull();
  expect(spinner?.className.baseVal).toContain("animate-spin");
  // Reduced motion is the global base.css reset's job; a component never restates it.
  expect(spinner?.className.baseVal).not.toContain("motion-reduce:");
});

test("does not carry the motion-pop-in class by default", async () => {
  const screen = await render(<Badge>Active</Badge>);
  const badge = screen.getByText("Active");
  expect(badge.element().className).not.toContain("motion-pop-in");
});

test("animateIn applies the motion-pop-in arrival class", async () => {
  const screen = await render(<Badge animateIn>Verified</Badge>);
  const badge = screen.getByText("Verified");
  await expect.element(badge).toHaveClass("motion-pop-in");
});

test("render prop swaps the element (polymorphism)", async () => {
  const screen = await render(<Badge render={<a href="/x" />}>Link</Badge>);
  await expect
    .element(screen.getByRole("link", { name: "Link" }))
    .toHaveAttribute("href", "/x");
});

test("no a11y violations", async () => {
  const screen = await render(<Badge intent="info">Beta</Badge>);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — loading", async () => {
  const screen = await render(<Badge loading>Syncing</Badge>);
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the root span element", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(<Badge ref={ref}>Active</Badge>);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe("badge");
});

test("bordered subtle badge carries the matching-hue border class", async () => {
  const screen = await render(
    <Badge intent="success" bordered>
      Active
    </Badge>,
  );
  const el = screen.getByText("Active");
  await expect.element(el).toHaveAttribute("data-bordered", "");
  expect((el.element() as HTMLElement).className).toContain(
    "border-success/(--alpha-outline-border)",
  );
});

test("outline variant renders the hairline tag chip without a fill", async () => {
  const screen = await render(<Badge variant="outline">B2B</Badge>);
  const el = screen.getByText("B2B");
  await expect.element(el).toHaveAttribute("data-variant", "outline");
  expect((el.element() as HTMLElement).className).toContain("border-border");
  expect((el.element() as HTMLElement).className).toContain("bg-transparent");
});
