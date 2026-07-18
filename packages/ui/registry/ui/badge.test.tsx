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
  expect(spinner?.className.baseVal).toContain("motion-reduce:animate-none");
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
