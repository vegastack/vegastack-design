import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Progress } from "./progress";

test("renders a progressbar with the slot + default size attributes", async () => {
  const screen = await render(
    <Progress value={40} aria-label="Upload progress" />,
  );
  const bar = screen.getByRole("progressbar", { name: "Upload progress" });
  await expect.element(bar).toBeInTheDocument();
  await expect.element(bar).toHaveAttribute("data-slot", "progress");
  await expect.element(bar).toHaveAttribute("data-size", "default");
});

test("aria-valuenow reflects value against the default 0–100 scale", async () => {
  const screen = await render(<Progress value={60} aria-label="Progress" />);
  const bar = screen.getByRole("progressbar", { name: "Progress" });
  await expect.element(bar).toHaveAttribute("aria-valuenow", "60");
  await expect.element(bar).toHaveAttribute("aria-valuemin", "0");
  await expect.element(bar).toHaveAttribute("aria-valuemax", "100");
});

test("reports value relative to a custom max", async () => {
  const screen = await render(
    <Progress value={3} max={5} aria-label="Step 3 of 5" />,
  );
  const bar = screen.getByRole("progressbar", { name: "Step 3 of 5" });
  await expect.element(bar).toHaveAttribute("aria-valuenow", "3");
  await expect.element(bar).toHaveAttribute("aria-valuemax", "5");
});

test("is indeterminate when value is null", async () => {
  const screen = await render(<Progress value={null} aria-label="Loading" />);
  const bar = screen.getByRole("progressbar", { name: "Loading" });
  await expect.element(bar).toHaveAttribute("data-indeterminate");
  // An indeterminate bar omits aria-valuenow.
  await expect.element(bar).not.toHaveAttribute("aria-valuenow");
});

test("reflects the size variant on the data-size attribute", async () => {
  const screen = await render(
    <Progress value={50} size="lg" aria-label="Sync" />,
  );
  await expect
    .element(screen.getByRole("progressbar", { name: "Sync" }))
    .toHaveAttribute("data-size", "lg");
});

test("applies className to the root and trackClassName to the track", async () => {
  const screen = await render(
    <Progress
      value={50}
      aria-label="Sync"
      className="max-w-xs"
      trackClassName="bg-muted/(--alpha-wash-strong)"
      indicatorClassName="bg-success"
    />,
  );
  const bar = screen.getByRole("progressbar", { name: "Sync" });
  await expect.element(bar).toHaveClass("max-w-xs");
  const track = screen.container.querySelector('[data-slot="progress-track"]')!;
  expect(track.className).toContain("bg-muted/(--alpha-wash-strong)");
  const indicator = screen.container.querySelector(
    '[data-slot="progress-indicator"]',
  )!;
  expect(indicator.className).toContain("bg-success");
  expect(indicator.className).toContain("motion-reduce:transition-none");
});

test("no a11y violations with an accessible name", async () => {
  const screen = await render(<Progress value={75} aria-label="Download" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — indeterminate", async () => {
  const screen = await render(<Progress value={null} aria-label="Loading" />);
  await expectNoA11yViolations(screen.container);
});

test("render composes a custom root element while keeping slot + role", async () => {
  // Base UI's `render` replaces the Progress.Root host
  // but merges our data-slot/data-size/className and keeps role=progressbar +
  // the Track/Indicator children.
  const screen = await render(
    <Progress
      value={40}
      size="lg"
      aria-label="Upload progress"
      render={<section data-testid="custom-progress-root" />}
    />,
  );
  const bar = screen.getByRole("progressbar", { name: "Upload progress" });
  const el = bar.element() as HTMLElement;
  expect(el.tagName).toBe("SECTION");
  expect(el.getAttribute("data-testid")).toBe("custom-progress-root");
  expect(el.className).toContain("w-full");
  await expect.element(bar).toHaveAttribute("data-slot", "progress");
  await expect.element(bar).toHaveAttribute("data-size", "lg");
  // The Track survives the composition.
  expect(
    screen.container.querySelector('[data-slot="progress-track"]'),
  ).not.toBeNull();
});

test("forwards ref to the underlying progress root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Progress ref={ref} value={40} aria-label="Upload progress" />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("progress");
});
