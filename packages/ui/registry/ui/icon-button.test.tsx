import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { Plus } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { IconButton } from "./icon-button";

test("renders an accessibly-named button from aria-label", async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Add item" }))
    .toBeInTheDocument();
});

test("fires onClick", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <IconButton aria-label="Add item" onClick={onClick}>
      <Plus />
    </IconButton>,
  );
  await screen.getByRole("button", { name: "Add item" }).click();
  expect(onClick).toHaveBeenCalledOnce();
});

test("uses the shared size vocabulary and tags the slot", async () => {
  const screen = await render(
    <IconButton aria-label="Add item" size="sm">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole("button", { name: "Add item" });
  await expect.element(btn).toHaveClass("size-7");
  await expect.element(btn).toHaveAttribute("data-slot", "icon-button");
});

test("defaults to the md square, which is Button's own `icon` tier", async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole("button", { name: "Add item" });
  // The rendered square is measured in test/button-states.browser.test.tsx (compiled CSS). Since
  // Batch 2 the geometry is upstream's `size-8` tier rather than a `w-8 px-0` override of a text
  // tier, so there is no padding left to cancel.
  const className = (btn.element() as HTMLElement).className;
  expect(className).toContain("size-8");
  expect(className).not.toContain("px-2.5");
});

test("passes variant through to Button", async () => {
  // Since Batch 2 of the shadcn reset `Button` is upstream's, with a flat `variant` list and no
  // `data-variant`/`data-tone` mirror — so the pass-through is proven by the recipe it resolves to.
  const screen = await render(
    <IconButton aria-label="Delete" variant="destructive">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole("button", { name: "Delete" });
  await expect.element(btn).toHaveClass("bg-destructive/10");
  await expect.element(btn).toHaveAttribute("data-slot", "icon-button");
});

test("maps each square size onto Button's own icon tier", async () => {
  for (const [size, tier] of [
    ["xs", "size-6"],
    ["sm", "size-7"],
    ["md", "size-8"],
    ["lg", "size-9"],
  ] as const) {
    const screen = await render(
      <IconButton aria-label={size} size={size}>
        <Plus />
      </IconButton>,
    );
    await expect
      .element(screen.getByRole("button", { name: size }))
      .toHaveClass(tier);
  }
});

test('shape="round" marks data-shape and wins over the base radius', async () => {
  const screen = await render(
    <IconButton aria-label="Add item" shape="round">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole("button", { name: "Add item" });
  await expect.element(btn).toHaveAttribute("data-shape", "round");
  const className = (btn.element() as HTMLElement).className;
  expect(className).toContain("rounded-full");
  expect(className).not.toContain("rounded-lg");
});

test("no a11y violations", async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <IconButton aria-label="Add item" disabled>
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — loading", async () => {
  const screen = await render(
    <IconButton aria-label="Add item" loading>
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the underlying button element", async () => {
  // Delegating wrapper: {...props} (carrying ref) is spread onto Button, which
  // forwards onto its <button> host. No code change needed (Pattern D).
  const ref = React.createRef<HTMLButtonElement>();
  await render(
    <IconButton ref={ref} aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("icon-button");
});

test("loading stacks the spinner over the hidden icon rather than replacing it", async () => {
  const screen = await render(
    <IconButton aria-label="Add item" loading>
      <Plus />
    </IconButton>,
  );
  // The accessible name survives — it comes from aria-label, not the icon.
  const btn = screen.getByRole("button", { name: "Add item" });
  await expect.element(btn).toHaveAttribute("aria-busy", "true");
  const el = btn.element() as HTMLElement;
  // Two glyphs: the out-of-flow spinner, and the icon still holding the square open.
  expect(el.querySelectorAll("svg")).toHaveLength(2);
  expect(el.querySelector("span.contents")!.className).toContain("opacity-0");
});
