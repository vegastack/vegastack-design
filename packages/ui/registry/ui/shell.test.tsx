import { render } from "vitest-browser-react";
import { afterEach, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { Home, ListChecks } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { resolveShellLayout } from "../lib/shell-layout";
import { Button } from "./button";
import {
  GlobalBar,
  GlobalBarCenter,
  GlobalBarLeading,
  GlobalBarTrailing,
} from "./global-bar";
import { NavTree, NavTreeItem, NavTreeSection } from "./nav-tree";
import { Rail, RailItem } from "./rail";
import {
  Shell,
  ShellColumn,
  ShellColumnToggle,
  ShellMain,
  ShellPage,
  ShellTopBar,
  ShellTopBarFavorite,
  ShellTopBarMore,
  ShellTopBarPresence,
  ShellTopBarPrimary,
  ShellTopBarShare,
  ShellTopBarTitle,
  ShellTopBarTools,
} from "./shell";
import { ShellStateScript } from "./shell-scripts";
import "../../test/geometry.css";

afterEach(() => {
  const html = document.documentElement;
  html.removeAttribute("data-shell-col");
  html.removeAttribute("data-desktop-titlebar");
  html.style.removeProperty("--shell-column-saved");
  document.cookie = "vs_shell_col=; max-age=0; path=/";
});

function Frame({
  width,
  column = true,
  columnWidth,
}: {
  width: number;
  columnWidth?: number;
  column?: boolean;
}) {
  return (
    <div style={{ width, height: 600 }}>
      <Shell
        fill="parent"
        columnWidth={columnWidth}
        globalBar={
          <GlobalBar>
            <GlobalBarLeading>
              <ShellColumnToggle />
            </GlobalBarLeading>
            <GlobalBarCenter />
            <GlobalBarTrailing />
          </GlobalBar>
        }
        rail={
          <Rail>
            <RailItem icon={<Home />} label="Home" href="#home" />
            <RailItem
              icon={<ListChecks />}
              label="Tasks"
              href="#tasks"
              badge={120}
              active
            />
          </Rail>
        }
        column={
          column ? (
            <ShellColumn label="Tasks">
              <NavTree>
                <NavTreeSection label="Views">
                  <NavTreeItem label="My tasks" count={3} href="#mine" active />
                </NavTreeSection>
              </NavTree>
            </ShellColumn>
          ) : null
        }
      >
        <ShellTopBar>
          <ShellTopBarTitle>My tasks</ShellTopBarTitle>
        </ShellTopBar>
        <ShellMain>
          <ShellPage>Page</ShellPage>
        </ShellMain>
      </Shell>
    </div>
  );
}

const shell = () => document.querySelector<HTMLElement>('[data-slot="shell"]')!;
const settled = () =>
  expect.poll(() => shell().dataset.tier, { timeout: 2000 }).toBeTruthy();

test.each([390, 820, 1024, 1280, 1440, 1920] as const)(
  "at %ipx the CSS lays out what resolveShellLayout says",
  async (width) => {
    await render(<Frame width={width} />);
    await settled();
    const expected = resolveShellLayout({ width, columnOpen: true });
    const root = shell();
    expect(root.dataset.tier).toBe(expected.tier);
    const column =
      expected.tier === "phone"
        ? "none"
        : expected.columnShown
          ? "shown"
          : "folded";
    expect(root.dataset.column).toBe(column);
    const main = root.querySelector('[data-slot="shell-content"]')!;
    expect(Math.round(main.getBoundingClientRect().width)).toBe(
      expected.pageWidth,
    );
  },
);

test.each([
  // width, column width — the resolver's clamps
  [1485, 400],
  [1300, 200],
  [1300, 0],
] as const)(
  "at %ipx with a %ipx column the CSS still matches the resolver",
  async (width, columnWidth) => {
    await render(<Frame width={width} columnWidth={columnWidth} />);
    await settled();
    const expected = resolveShellLayout({
      width,
      columnOpen: true,
      columnWidth,
    });
    const main = shell().querySelector('[data-slot="shell-content"]')!;
    expect(Math.round(main.getBoundingClientRect().width)).toBe(
      expected.pageWidth,
    );
  },
);

test("landmarks: the rail and column are named navigation, the page is main, the title is h1", async () => {
  const screen = await render(<Frame width={1440} />);
  await settled();
  expect(document.querySelector('nav[aria-label="Modules"]')).not.toBeNull();
  expect(document.querySelector('nav[aria-label="Tasks"]')).not.toBeNull();
  expect(document.querySelector("main")).not.toBeNull();
  expect(document.querySelector("h1")?.textContent).toBe("My tasks");
  const tasks = document.querySelector('[data-slot="rail-item"][data-active]')!;
  expect(tasks.getAttribute("aria-current")).toBe("page");
  expect(tasks.getAttribute("aria-label")).toBe("Tasks, 99+");
  await expectNoA11yViolations(screen.container);
});

test("⌘\\ folds and unfolds the column and keeps the choice in the cookie", async () => {
  await render(<Frame width={1440} />);
  await settled();
  expect(shell().dataset.column).toBe("shown");
  await userEvent.keyboard("{Meta>}\\{/Meta}");
  await expect.poll(() => shell().dataset.column).toBe("folded");
  expect(document.documentElement.dataset.shellCol).toBe("closed");
  expect(document.cookie).toMatch(/vs_shell_col=closed:240/);
  await userEvent.keyboard("{Meta>}\\{/Meta}");
  await expect.poll(() => shell().dataset.column).toBe("shown");
});

test("on a tablet ▤ slides the column over the page, and Escape puts it away", async () => {
  await render(<Frame width={820} />);
  await settled();
  expect(shell().dataset.column).toBe("folded");
  const toggle = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="shell-column-toggle"]',
    ),
  ].find((b) => b.checkVisibility())!;
  toggle.click();
  await expect.poll(() => shell().dataset.column).toBe("over");
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => shell().dataset.column).toBe("folded");
});

test("F6 moves between the global bar, the rail, the column, the top bar and the page", async () => {
  await render(<Frame width={1440} />);
  await settled();
  const regions: string[] = [];
  for (let i = 0; i < 5; i++) {
    await userEvent.keyboard("{F6}");
    regions.push(
      (document.activeElement as HTMLElement).dataset.shellRegion ?? "",
    );
  }
  expect(regions).toEqual(["global-bar", "rail", "column", "topbar", "main"]);
});

test("the state script's mark wins over the server's column default", async () => {
  document.cookie = "vs_shell_col=closed:300; path=/";
  const script = document.createElement("script");
  const { container } = await render(<ShellStateScript />);
  script.textContent = container.querySelector("script")!.textContent;
  document.head.append(script);
  script.remove();
  expect(document.documentElement.dataset.shellCol).toBe("closed");
  expect(
    document.documentElement.style.getPropertyValue("--shell-column-saved"),
  ).toBe("300px");
  await render(<Frame width={1440} />);
  await settled();
  expect(shell().dataset.column).toBe("folded");
});

test("a screen without a column has no column region", async () => {
  await render(<Frame width={1440} column={false} />);
  await settled();
  expect(shell().dataset.column).toBe("none");
  expect(document.querySelector('[data-slot="shell-column-area"]')).toBeNull();
});

test("a section keeps its measure and a bleed reaches past the page gutter", async () => {
  const { ShellBleed, ShellSection } = await import("./shell");
  await render(
    <div style={{ width: 1440, height: 600 }}>
      <Shell fill="parent" rail={<Rail />}>
        <ShellMain>
          <ShellPage size="full">
            <ShellSection measure="default" data-testid="section">
              List
            </ShellSection>
            <ShellBleed data-testid="bleed">Grid</ShellBleed>
          </ShellPage>
        </ShellMain>
      </Shell>
    </div>,
  );
  const page = document
    .querySelector('[data-slot="shell-page"]')!
    .getBoundingClientRect();
  const section = document
    .querySelector('[data-testid="section"]')!
    .getBoundingClientRect();
  const bleed = document
    .querySelector('[data-testid="bleed"]')!
    .getBoundingClientRect();
  expect(section.width).toBe(1200);
  expect(Math.round(bleed.width)).toBe(Math.round(page.width));
});

const columnSwitch = () =>
  document.querySelector<HTMLElement>('[data-slot="shell-column-switch"]')!;

test("on a phone the title opens the column as a sheet", async () => {
  await render(<Frame width={390} />);
  await settled();
  expect(getComputedStyle(columnSwitch()).display).not.toBe("none");
  expect(document.querySelector("h1")?.textContent).toBe("My tasks");
  await userEvent.click(columnSwitch());
  await expect.poll(() => shell().dataset.column).toBe("over");
  expect(columnSwitch().getAttribute("aria-expanded")).toBe("true");
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => shell().dataset.column).toBe("none");
});

test.each([
  [390, false],
  [820, true],
  [1440, true],
] as const)(
  "at %ipx (column %s) the title has no switch",
  async (width, column) => {
    await render(<Frame width={width} column={column} />);
    await settled();
    expect(getComputedStyle(columnSwitch()).display).toBe("none");
  },
);

test.each([1440, 820])(
  "at %ipx the global bar runs across the top and the frame fills the rest",
  async (width) => {
    await render(<Frame width={width} />);
    await settled();
    const bar = document
      .querySelector('[data-slot="global-bar"]')!
      .getBoundingClientRect();
    const rail = document
      .querySelector('[data-slot="shell-rail-area"]')!
      .getBoundingClientRect();
    const room = document
      .querySelector('[data-slot="shell-room"]')!
      .getBoundingClientRect();
    expect([bar.top, bar.height, bar.width]).toEqual([0, 44, width]);
    expect(rail.top).toBe(44);
    expect(room.height).toBe(600 - 44);
    // The bar's first control sits on the rail's centre line, the same axis as the rail's icons.
    const toggle = document
      .querySelector('[data-slot="shell-column-toggle"]')!
      .getBoundingClientRect();
    const icon = document
      .querySelector('[data-slot="rail-item"] svg')!
      .getBoundingClientRect();
    expect(toggle.left + toggle.width / 2).toBeCloseTo(
      icon.left + icon.width / 2,
      0,
    );
  },
);

test("on a phone the global bar is hidden", async () => {
  await render(<Frame width={390} />);
  await settled();
  expect(
    getComputedStyle(document.querySelector('[data-slot="global-bar"]')!)
      .display,
  ).toBe("none");
});

test("the top bar keeps presence, tools, primary, Share, ☆ and ⋯ in order, whatever order they are written in", async () => {
  await render(
    <div style={{ width: 1200 }}>
      <ShellTopBar>
        <ShellTopBarMore>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            ⋯
          </Button>
        </ShellTopBarMore>
        <ShellTopBarFavorite>
          <Button variant="ghost" size="icon-sm" aria-label="Favourite">
            ☆
          </Button>
        </ShellTopBarFavorite>
        <ShellTopBarShare>
          <Button variant="outline" size="sm">
            Share
          </Button>
        </ShellTopBarShare>
        <ShellTopBarPrimary>
          <Button size="sm">Approve</Button>
        </ShellTopBarPrimary>
        <ShellTopBarTools>
          <Button variant="ghost" size="icon-sm" aria-label="Watch">
            W
          </Button>
        </ShellTopBarTools>
        <ShellTopBarPresence>
          <span>AC</span>
        </ShellTopBarPresence>
        <ShellTopBarTitle>Q3 pricing</ShellTopBarTitle>
      </ShellTopBar>
    </div>,
  );
  const order = [
    "shell-topbar-title",
    "shell-topbar-presence",
    "shell-topbar-tools",
    "shell-topbar-primary",
    "shell-topbar-share",
    "shell-topbar-favorite",
    "shell-topbar-more",
  ].map(
    (slot) =>
      document.querySelector(`[data-slot="${slot}"]`)!.getBoundingClientRect()
        .left,
  );
  expect(order).toEqual([...order].sort((a, b) => a - b));
  // The tools, Share, ☆ and ⋯ share one height.
  const heights = ["Watch", "Share", "Favourite", "More"].map(
    (name) =>
      [...document.querySelectorAll<HTMLElement>('[data-slot="button"]')]
        .find(
          (b) =>
            b.getAttribute("aria-label") === name || b.textContent === name,
        )!
        .getBoundingClientRect().height,
  );
  expect(new Set(heights)).toEqual(new Set([28]));
});

test("picking a place in a column that slid over closes it; folding a parent does not", async () => {
  await render(
    <div style={{ width: 820, height: 600 }}>
      <Shell
        fill="parent"
        globalBar={
          <GlobalBar>
            <GlobalBarLeading>
              <ShellColumnToggle />
            </GlobalBarLeading>
            <GlobalBarCenter />
            <GlobalBarTrailing />
          </GlobalBar>
        }
        rail={<Rail />}
        column={
          <ShellColumn label="Spaces">
            <NavTree>
              <NavTreeSection>
                <NavTreeItem label="Design">
                  <NavTreeItem label="Board" onClick={() => {}} />
                </NavTreeItem>
              </NavTreeSection>
            </NavTree>
          </ShellColumn>
        }
      >
        <ShellMain>
          <ShellPage>Page</ShellPage>
        </ShellMain>
      </Shell>
    </div>,
  );
  await settled();
  document
    .querySelector<HTMLElement>('[data-slot="shell-column-toggle"]')!
    .click();
  await expect.poll(() => shell().dataset.column).toBe("over");
  const row = (name: string) =>
    [
      ...document.querySelectorAll<HTMLElement>('[data-slot="nav-tree-item"]'),
    ].find((el) => el.textContent === name)!;
  await userEvent.click(row("Design"));
  expect(row("Design").getAttribute("aria-expanded")).toBe("true");
  expect(row("Board").checkVisibility()).toBe(true);
  expect(shell().dataset.column).toBe("over");
  await userEvent.click(row("Board"));
  await expect.poll(() => shell().dataset.column).toBe("folded");
});
