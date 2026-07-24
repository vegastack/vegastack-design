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
  expect(neutral.className).toContain("bg-muted");
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

test("overflow chip keeps 20px pill geometry inside a true 24px target", async () => {
  const screen = await render(
    <TagGroup max={1} aria-label="Categories">
      <Tag>One</Tag>
      <Tag>Two</Tag>
    </TagGroup>,
  );
  const overflow = screen
    .getByRole("button", { name: "Show 1 more tags" })
    .element();
  expect(overflow.className).toContain("h-(--size-xs)");
  expect(overflow.className).toContain("min-w-(--size-xs)");
  expect(overflow.className).toContain("rounded-full");
  expect(overflow.className).toContain("justify-center");
  expect(overflow.className).toContain("appearance-none");
  const visual = overflow.querySelector("span");
  expect(visual?.className).toContain("h-5");
  expect(visual?.className).toContain("rounded-full");
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
