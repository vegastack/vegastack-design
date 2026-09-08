import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Tag, TagGroup } from "./tag-group";

test("renders hue chips with the tag-token classes and data-hue", async () => {
  const screen = await render(
    <TagGroup aria-label="Categories">
      <Tag hue="yellow">Information Technology</Tag>
      <Tag hue="blue">B2B</Tag>
      <Tag>Neutral</Tag>
    </TagGroup>,
  );
  const it = screen.getByText("Information Technology");
  const chip = (it.element() as HTMLElement).closest(
    '[data-slot="tag"]',
  ) as HTMLElement;
  expect(chip.dataset.hue).toBe("yellow");
  expect(chip.className).toContain("bg-tag-yellow-subtle");
  expect(chip.className).toContain("rounded-full");
  expect(chip.className).toContain("text-tag-yellow-text");
  const neutral = (
    screen.getByText("Neutral").element() as HTMLElement
  ).closest('[data-slot="tag"]') as HTMLElement;
  expect(neutral.className).toContain("bg-surface-1");
});

test("group announces as a list with one listitem per tag", async () => {
  const screen = await render(
    <TagGroup aria-label="Categories">
      <Tag>One</Tag>
      <Tag>Two</Tag>
    </TagGroup>,
  );
  const list = screen.getByRole("list", { name: "Categories" });
  await expect.element(list).toBeInTheDocument();
  expect(
    (list.element() as HTMLElement).querySelectorAll('[role="listitem"]')
      .length,
  ).toBe(2);
});

test("max collapses overflow behind a +N button; activating expands inline", async () => {
  const screen = await render(
    <TagGroup max={2} aria-label="Categories">
      <Tag>One</Tag>
      <Tag>Two</Tag>
      <Tag>Three</Tag>
      <Tag>Four</Tag>
    </TagGroup>,
  );
  const overflow = screen.getByRole("button", { name: "Show 2 more tags" });
  await expect.element(overflow).toHaveTextContent("+2");
  await userEvent.click(overflow);
  await expect.element(screen.getByText("Four")).toBeInTheDocument();
  expect(
    (screen.getByRole("list").element() as HTMLElement).querySelectorAll(
      '[data-slot="tag"]',
    ).length,
  ).toBe(4);
  await expectNoA11yViolations(screen.container);
});

test("onRemove renders a labelled remove button and fires", async () => {
  const onRemove = vi.fn();
  const screen = await render(
    <TagGroup aria-label="Categories">
      <Tag hue="green" onRemove={onRemove} removeLabel="Remove SaaS">
        SaaS
      </Tag>
    </TagGroup>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Remove SaaS" }));
  expect(onRemove).toHaveBeenCalledTimes(1);
  const remove = screen.getByRole("button", { name: "Remove SaaS" }).element();
  expect(remove.className).toContain("appearance-none");
  expect(remove.className).toContain("before:-inset-2");
  await expectNoA11yViolations(screen.container);
});

test("overflow chip IS a chip — one pill that is its own 28px pointer target", async () => {
  const screen = await render(
    <TagGroup max={1} aria-label="Categories">
      <Tag>One</Tag>
      <Tag>Two</Tag>
    </TagGroup>,
  );
  const overflow = screen
    .getByRole("button", { name: "Show 1 more tags" })
    .element();
  // No inner visual span and no hit-area pseudo any more: the chip's real border box is
  // the target, so nothing can clip it below the 24px floor.
  expect(overflow.dataset.slot).toBe("tag-group-overflow");
  expect(overflow.dataset.size).toBe("sm");
  expect(overflow.className).toContain("h-(--size-sm)");
  expect(overflow.className).toContain("rounded-full");
  expect(overflow.querySelector("span")).toBeNull();
  // The one interactive chip carries the shared hover/pressed recipe verbatim.
  expect(overflow.className).toContain("hover:bg-surface-2");
  expect(overflow.className).toContain("active:bg-surface-3");
});

test("a Tag is the Chip primitive at the inline tier, with a real 24px remove control", async () => {
  const screen = await render(
    <TagGroup aria-label="Categories">
      <Tag hue="blue" onRemove={() => {}} removeLabel="Remove API">
        API
      </Tag>
    </TagGroup>,
  );
  const tag = screen.getByText("API").element().closest("[data-slot='tag']");
  expect(tag).not.toBeNull();
  expect((tag as HTMLElement).dataset.hue).toBe("blue");
  expect((tag as HTMLElement).dataset.size).toBe("sm");
  const remove = screen.getByRole("button", { name: "Remove API" }).element();
  // The shared ChipRemove — a real 24x24 IconButton, not the `::before` hit area that
  // native <button> clipping made un-hittable (B5-03). The real-geometry proof lives in
  // chip.test.tsx, which mirrors the compiled CSS this harness does not build.
  expect(remove.dataset.slot).toBe("chip-remove");
  expect(remove.className).toContain("w-(--size-xs)");
  expect(remove.className).toContain("h-(--size-xs)");
  expect(remove.className).toContain("rounded-full");
});

test("forwards refs to tag and group roots", async () => {
  const tagRef = React.createRef<HTMLSpanElement>();
  const groupRef = React.createRef<HTMLDivElement>();
  await render(
    <TagGroup ref={groupRef} aria-label="Categories">
      <Tag ref={tagRef}>One</Tag>
    </TagGroup>,
  );
  expect(tagRef.current?.dataset.slot).toBe("tag");
  expect(groupRef.current?.dataset.slot).toBe("tag-group");
});

test("expanding moves focus to the first revealed tag instead of losing it to <body>", async () => {
  const screen = await render(
    <TagGroup max={2} aria-label="Categories">
      <Tag>One</Tag>
      <Tag>Two</Tag>
      <Tag>Three</Tag>
      <Tag>Four</Tag>
    </TagGroup>,
  );
  const overflow = screen.getByRole("button", { name: "Show 2 more tags" });
  await userEvent.click(overflow);
  // The +N button unmounts on expand. Without focus management the active element falls back to
  // <body>, stranding keyboard and screen-reader users with no announcement of what appeared.
  await vi.waitFor(() => {
    const active = document.activeElement as HTMLElement | null;
    expect(active).not.toBe(document.body);
    expect(active?.getAttribute("role")).toBe("listitem");
    expect(active?.textContent).toContain("Three");
  });
});

test("has no accessibility violations", async () => {
  const screen = await render(
    <TagGroup max={1} aria-label="Categories">
      <Tag hue="purple">Enterprise</Tag>
      <Tag hue="pink">Design partner</Tag>
    </TagGroup>,
  );
  await expectNoA11yViolations(screen.container);
});
