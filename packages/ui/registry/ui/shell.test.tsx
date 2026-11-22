import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { CircleHelp, Home, ListChecks, Lock, Star } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { resolveShellLayout } from "../lib/shell-layout";
import { Button } from "./button";
import { Toggle } from "./toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
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
  ShellColumnSwitch,
  ShellColumnToggle,
  ShellMain,
  ShellPage,
  ShellTopBar,
  ShellTopBarAccount,
  ShellTopBarFavorite,
  ShellTopBarMore,
  ShellTopBarMembers,
  ShellTopBarShare,
  ShellTopBarTitle,
  ShellTopBarWatch,
} from "./shell";
import { ShellStateScript } from "./shell-scripts";
import { AssistantCard } from "./shell-assistant";
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
  module = "Tasks",
  assistant,
}: {
  width: number;
  columnWidth?: number;
  column?: boolean;
  module?: string;
  assistant?: React.ReactNode;
}) {
  return (
    <div style={{ width, height: 600 }}>
      <Shell
        fill="parent"
        columnWidth={columnWidth}
        assistant={assistant}
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
          <ShellColumnSwitch
            media={<span data-testid="logo" className="size-7" />}
          >
            {module}
          </ShellColumnSwitch>
          <ShellTopBarTitle>My tasks</ShellTopBarTitle>
          <ShellTopBarAccount>
            <Button variant="ghost" size="icon-lg" aria-label="Help">
              <CircleHelp />
            </Button>
            <Button variant="ghost" size="icon-lg" aria-label="Account">
              <Home />
            </Button>
          </ShellTopBarAccount>
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

test("on a phone the places button (logo, module, ⌄) opens the column as a sheet, and focus comes back to it", async () => {
  await render(<Frame width={390} />);
  await settled();
  expect(getComputedStyle(columnSwitch()).display).not.toBe("none");
  expect(columnSwitch().textContent).toBe("Tasks");
  expect(columnSwitch().querySelector('[data-testid="logo"]')).not.toBeNull();
  // A 36px button, a 44px+ target on touch.
  expect(columnSwitch().getBoundingClientRect().height).toBe(36);
  await userEvent.click(columnSwitch());
  await expect.poll(() => shell().dataset.column).toBe("over");
  expect(columnSwitch().getAttribute("aria-expanded")).toBe("true");
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => shell().dataset.column).toBe("none");
  expect(document.activeElement).toBe(columnSwitch());
  await expectNoA11yViolations(document.body);
});

test("on a phone focus comes back to the places button even when a tap never focused it (iOS Safari)", async () => {
  await render(<Frame width={390} />);
  await settled();
  // A tap in Safari doesn't focus a button: a click with nothing focused.
  (document.activeElement as HTMLElement | null)?.blur();
  columnSwitch().click();
  await expect.poll(() => shell().dataset.column).toBe("over");
  // The page behind the sheet went inert; focus dropped to the body.
  (document.activeElement as HTMLElement | null)?.blur();
  expect(document.activeElement).toBe(document.body);
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => shell().dataset.column).toBe("none");
  expect(document.activeElement).toBe(columnSwitch());
});

test.each(["ltr", "rtl"] as const)(
  "at 320px (%s) a long module name shortens, and Help and the account stay in the bar, 8px apart",
  async (dir) => {
    document.dir = dir;
    try {
      await render(
        <Frame width={320} module="Procurement and vendor onboarding" />,
      );
      await settled();
      const bar = document
        .querySelector('[data-slot="shell-topbar"]')!
        .getBoundingClientRect();
      const name = columnSwitch().querySelector(
        ":scope > span:not([data-slot])",
      )!;
      expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
      const [help, account] = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-slot="shell-topbar-account"] button',
        ),
      ].map((b) => b.getBoundingClientRect());
      for (const box of [help!, account!]) {
        expect(box.left).toBeGreaterThanOrEqual(bar.left);
        expect(box.right).toBeLessThanOrEqual(bar.right);
      }
      expect(
        Math.round(
          dir === "ltr"
            ? account!.left - help!.right
            : help!.left - account!.right,
        ),
      ).toBe(8);
    } finally {
      document.dir = "";
    }
  },
);

test.each([
  [390, true],
  [820, false],
  [1440, false],
] as const)(
  "at %ipx the bar's Help and account show: %s",
  async (width, shown) => {
    await render(<Frame width={width} />);
    await settled();
    const account = document.querySelector<HTMLElement>(
      '[data-slot="shell-topbar-account"]',
    )!;
    expect(getComputedStyle(account).display !== "none").toBe(shown);
  },
);

test("on a phone a drag down the column sheet moves it, never the page, and closes it", async () => {
  await render(<Frame width={390} />);
  await settled();
  await userEvent.click(columnSwitch());
  await expect.poll(() => shell().dataset.column).toBe("over");
  const sheet = document.querySelector<HTMLElement>(
    '[data-slot="shell-column-area"]',
  )!;
  const top = sheet.getBoundingClientRect().top + 8;
  const touch = (y: number) =>
    new Touch({ identifier: 1, target: sheet, clientX: 100, clientY: y });
  const send = (type: string, y: number) => {
    const event = new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type === "touchend" ? [] : [touch(y)],
      changedTouches: [touch(y)],
    });
    sheet.dispatchEvent(event);
    return event;
  };
  send("touchstart", top);
  // A short drag moves the sheet with the finger and keeps the page (and pull-to-refresh) still.
  expect(send("touchmove", top + 40).defaultPrevented).toBe(true);
  expect(sheet.style.translate).toBe("0px 40px");
  // Held, then let go short of the threshold: it settles back open.
  await new Promise((r) => setTimeout(r, 250));
  send("touchend", top + 40);
  expect(shell().dataset.column).toBe("over");
  expect(sheet.style.translate).toBe("");
  // A cancelled touch (the browser took the gesture) puts the sheet back and leaves it open.
  send("touchstart", top);
  send("touchmove", top + 160);
  send("touchcancel", top + 160);
  expect(shell().dataset.column).toBe("over");
  expect(sheet.style.translate).toBe("");
  // Past the threshold it closes.
  send("touchstart", top);
  send("touchmove", top + 60);
  send("touchmove", top + 160);
  send("touchend", top + 160);
  await expect.poll(() => shell().dataset.column).toBe("none");
  expect(sheet.style.translate).toBe("");
});

test.each([
  [390, false],
  [820, true],
  [1440, true],
] as const)(
  "at %ipx (column %s) the bar has no places button",
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

test("the top bar keeps members, Share, Watch, ☆ and ⋯ in order, whatever order they are written in", async () => {
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
        <ShellTopBarWatch>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Watch"
            aria-pressed={false}
          >
            W
          </Button>
        </ShellTopBarWatch>
        <ShellTopBarShare>
          <Button variant="ghost" size="sm">
            Share
          </Button>
        </ShellTopBarShare>
        <ShellTopBarMembers>
          <span>AC</span>
        </ShellTopBarMembers>
        <ShellTopBarTitle>Q3 pricing</ShellTopBarTitle>
      </ShellTopBar>
    </div>,
  );
  const order = [
    "shell-topbar-title",
    "shell-topbar-members",
    "shell-topbar-share",
    "shell-topbar-watch",
    "shell-topbar-favorite",
    "shell-topbar-more",
  ].map(
    (slot) =>
      document.querySelector(`[data-slot="${slot}"]`)!.getBoundingClientRect()
        .left,
  );
  expect(order).toEqual([...order].sort((a, b) => a - b));
  // Share, Watch, ☆ and ⋯ share one height.
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

const rect = (slot: string) =>
  document.querySelector(`[data-slot="${slot}"]`)!.getBoundingClientRect();

test("from 40rem the column and the page share one rounded card, inset from the end and the foot", async () => {
  const screen = await render(<Frame width={1280} />);
  await settled();
  const frame = shell().getBoundingClientRect();
  const card = rect("shell-card");
  const style = getComputedStyle(
    document.querySelector('[data-slot="shell-card"]')!,
  );
  expect(style.borderTopLeftRadius).toBe("12px");
  expect(Math.round(frame.right - card.right)).toBe(8);
  expect(Math.round(frame.bottom - card.bottom)).toBe(8);
  // It meets the rail and the global bar with no gap of its own.
  expect(Math.round(card.left)).toBe(Math.round(rect("shell-rail-area").right));
  expect(Math.round(card.top)).toBe(Math.round(rect("global-bar").bottom));
  // The column and the page are inside it; the rail and the bar sit on the canvas.
  const cardEl = document.querySelector('[data-slot="shell-card"]')!;
  expect(cardEl.contains(document.querySelector("main"))).toBe(true);
  expect(
    cardEl.contains(document.querySelector('[data-slot="shell-rail-area"]')),
  ).toBe(false);
  await expectNoA11yViolations(screen.container);
});

test("on a phone the page is full bleed: the card has no box of its own", async () => {
  await render(<Frame width={390} />);
  await settled();
  const style = getComputedStyle(
    document.querySelector('[data-slot="shell-card"]')!,
  );
  expect(style.display).toBe("contents");
});

test("the assistant docked beside the page is a second card, the page giving it room", async () => {
  await render(
    <Frame
      width={1440}
      assistant={
        <AssistantCard open onOpenChange={() => {}}>
          <p>How can I help?</p>
        </AssistantCard>
      }
    />,
  );
  await settled();
  const card = rect("shell-card");
  const dock = rect("assistant-card");
  expect(Math.round(dock.width)).toBe(400);
  expect(Math.round(dock.left - card.right)).toBe(8);
  expect(Math.round(shell().getBoundingClientRect().right - dock.right)).toBe(
    8,
  );
  expect(Math.round(dock.top)).toBe(Math.round(card.top));
  // The resolver knows the room it takes.
  const page = shell().querySelector('[data-slot="shell-content"]')!;
  expect(Math.round(page.getBoundingClientRect().width)).toBe(
    resolveShellLayout({ width: 1440, columnOpen: true, assistantDocked: true })
      .pageWidth,
  );
  expect(
    document
      .querySelector('[data-slot="assistant-card"]')!
      .getAttribute("role"),
  ).toBe("region");
});

test("on a phone the shell shows no assistant card: its parts go in a sheet", async () => {
  await render(
    <Frame
      width={390}
      assistant={
        <AssistantCard open onOpenChange={() => {}}>
          <p>How can I help?</p>
        </AssistantCard>
      }
    />,
  );
  await settled();
  expect(
    getComputedStyle(document.querySelector('[data-slot="assistant-card"]')!)
      .display,
  ).toBe("none");
});

test("every control at the bar's end reads 14px with a 16px icon, whatever size the page passes", async () => {
  const screen = await render(
    <ShellTopBar>
      <ShellTopBarTitle>Q3 pricing</ShellTopBarTitle>
      <ShellTopBarShare>
        <Button variant="ghost" size="sm">
          <Lock data-icon="inline-start" />
          Share
        </Button>
      </ShellTopBarShare>
      <ShellTopBarWatch>
        <Button variant="ghost" size="sm" render={<a href="/share" />}>
          Open
        </Button>
      </ShellTopBarWatch>
      <ShellTopBarFavorite>
        <Toggle variant="bare" size="sm" aria-label="Favourite">
          <Star />
        </Toggle>
      </ShellTopBarFavorite>
      <ShellTopBarMore>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
            <Lock data-icon="inline-start" />
            More
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Copy</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ShellTopBarMore>
    </ShellTopBar>,
  );
  // A Button rendered as a link holds the size too.
  const link = screen.container.querySelector<HTMLElement>('a[href="/share"]')!;
  expect(getComputedStyle(link).fontSize).toBe("14px");
  // A trigger renames the Button's slot; the bar's size still holds.
  const more = screen.getByRole("button", { name: "More" }).element();
  expect(getComputedStyle(more).fontSize).toBe("14px");
  expect(
    Math.round(more.querySelector("svg")!.getBoundingClientRect().width),
  ).toBe(16);
  const share = screen.getByRole("button", { name: "Share" }).element();
  expect(getComputedStyle(share).fontSize).toBe("14px");
  expect(
    Math.round(share.querySelector("svg")!.getBoundingClientRect().width),
  ).toBe(16);
  const star = screen.getByRole("button", { name: "Favourite" }).element();
  expect(
    Math.round(star.querySelector("svg")!.getBoundingClientRect().width),
  ).toBe(16);
});
