import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { Hexagon, ListChecks, MoreHorizontal } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { NavTree, NavTreeItem, NavTreeSection } from "./nav-tree";
import "../../test/geometry.css";

function Tree({ size }: { size?: "default" | "touch" }) {
  return (
    <nav aria-label="Spaces" style={{ width: 240 }}>
      <NavTree size={size}>
        <NavTreeSection>
          <NavTreeItem
            icon={<ListChecks />}
            label="My tasks"
            count={12}
            href="#mine"
            active
          />
        </NavTreeSection>
        <NavTreeSection label="Spaces">
          <NavTreeItem
            icon={<Hexagon />}
            label="General"
            href="#general"
            defaultOpen
            action={
              <Button variant="ghost" size="icon-xs" aria-label="General menu">
                <MoreHorizontal />
              </Button>
            }
          >
            <NavTreeItem label="Launch plan" href="#launch" />
            <NavTreeItem label="Pricing review" count={0} href="#pricing" />
          </NavTreeItem>
          <NavTreeItem icon={<Hexagon />} label="Design">
            <NavTreeItem label="Shell layout" href="#shell" />
          </NavTreeItem>
        </NavTreeSection>
      </NavTree>
    </nav>
  );
}

const row = (name: string) =>
  [
    ...document.querySelectorAll<HTMLElement>('[data-slot="nav-tree-item"]'),
  ].find((el) => el.textContent?.startsWith(name))!;
const box = (el: Element) => el.getBoundingClientRect();

test("items sit level with their section title; children indent one 12px step", async () => {
  const screen = await render(<Tree />);
  const title = box(
    document.querySelector('[data-slot="nav-tree-section"] h3')!,
  );
  const parent = row("General");
  const child = row("Launch plan");
  // A row pads its content 8px; the section title starts on that same line.
  const parentStart = box(parent).left + 8;
  expect(title.left).toBe(parentStart);
  expect(box(child).left - box(parent).left).toBe(12);
  // The fold control sits at the row's END, so siblings keep one label line.
  const fold = parent.parentElement!.querySelector(
    '[data-slot="nav-tree-fold"]',
  )!;
  expect(box(fold).left).toBeGreaterThan(box(parent).left + 120);
  // No thread lines: the small indent alone groups a parent's children.
  const before = getComputedStyle(child.closest("li")!, "::before");
  expect(before.borderInlineStartWidth).toBe("0px");
  await expectNoA11yViolations(screen.container);
});

test("the current item is marked, its count is muted, and a zero count is left out", async () => {
  await render(<Tree />);
  const mine = row("My tasks");
  expect(mine.getAttribute("aria-current")).toBe("page");
  expect(mine.hasAttribute("data-active")).toBe(true);
  expect(
    row("Pricing review").querySelector('[data-slot="nav-tree-count"]'),
  ).toBeNull();
  expect(mine.querySelector('[data-slot="nav-tree-count"]')?.textContent).toBe(
    "12",
  );
});

test("a parent with no link folds on a click; the fold control says whether it is open", async () => {
  await render(<Tree />);
  const design = row("Design");
  const group = () =>
    design.closest("li")!.querySelector('[data-slot="nav-tree-group"]')!;
  expect(group().hasAttribute("hidden")).toBe(true);
  expect(design.getAttribute("aria-expanded")).toBe("false");
  await userEvent.click(design);
  expect(group().hasAttribute("hidden")).toBe(false);
  expect(design.getAttribute("aria-expanded")).toBe("true");
});

test("arrow keys move between visible rows, → opens and enters a parent, ← folds and returns", async () => {
  await render(<Tree />);
  row("My tasks").focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(row("General"));
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(row("Launch plan"));
  await userEvent.keyboard("{ArrowLeft}");
  expect(document.activeElement).toBe(row("General"));
  await userEvent.keyboard("{ArrowLeft}");
  const generalFold = row("General")
    .closest("li")!
    .querySelector('[data-slot="nav-tree-fold"]')!;
  expect(generalFold.getAttribute("aria-expanded")).toBe("false");
  // Folded children are skipped.
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(row("Design"));
  await userEvent.keyboard("{ArrowRight}");
  expect(row("Design").getAttribute("aria-expanded")).toBe("true");
  await userEvent.keyboard("{End}");
  expect(document.activeElement).toBe(row("Shell layout"));
  await userEvent.keyboard("{Home}");
  expect(document.activeElement).toBe(row("My tasks"));
});

test.each([
  ["default", 32],
  ["touch", 44],
] as const)("the %s size has %ipx rows", async (size, height) => {
  await render(<Tree size={size} />);
  expect(box(row("My tasks")).height).toBe(height);
  expect(box(row("Launch plan")).height).toBe(height);
});

test("the arrow keys skip a disabled row, and → enters a parent at its first enabled child", async () => {
  await render(
    <nav aria-label="Views">
      <NavTree>
        <NavTreeSection>
          <NavTreeItem label="One" href="#one" />
          <NavTreeItem label="Two" render={<button type="button" disabled />} />
          <NavTreeItem label="Three" href="#three" defaultOpen>
            <NavTreeItem
              label="Locked"
              render={<button type="button" disabled />}
            />
            <NavTreeItem label="Open" href="#open" />
          </NavTreeItem>
        </NavTreeSection>
      </NavTree>
    </nav>,
  );
  row("One").focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(row("Three"));
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(row("Open"));
  await userEvent.keyboard("{Home}");
  expect(document.activeElement).toBe(row("One"));
});

test("a child row draws no icon (two levels, N3) and a count over 99 shows 99+", async () => {
  await render(
    <nav aria-label="Views">
      <NavTree>
        <NavTreeSection>
          <NavTreeItem
            icon={<ListChecks data-testid="parent-icon" />}
            label="Tasks"
            count={140}
            href="#tasks"
            defaultOpen
          >
            <NavTreeItem
              icon={<Hexagon data-testid="child-icon" />}
              label="Overdue"
              href="#overdue"
            />
            <NavTreeItem label="Mentions" count="250" href="#mentions" />
          </NavTreeItem>
        </NavTreeSection>
      </NavTree>
    </nav>,
  );
  expect(
    row("Tasks").querySelector('[data-testid="parent-icon"]'),
  ).not.toBeNull();
  expect(row("Overdue").querySelector('[data-testid="child-icon"]')).toBeNull();
  expect(
    row("Tasks").querySelector('[data-slot="nav-tree-count"]')?.textContent,
  ).toBe("99+");
  expect(
    row("Mentions").querySelector('[data-slot="nav-tree-count"]')?.textContent,
  ).toBe("99+");
});
