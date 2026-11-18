import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Home, Inbox, ListChecks, Settings2 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Rail,
  RailBadge,
  RailBottom,
  RailItem,
  RailTile,
  RailTop,
  lazyAnimatedIcon,
} from "./rail";
import "../../test/geometry.css";

function Frame() {
  return (
    <div style={{ width: 64, height: 480, display: "flex" }}>
      <Rail>
        <RailItem icon={<Home />} label="Home" href="#home" active />
        <RailItem icon={<Inbox />} label="Inbox" href="#inbox" badge={120} />
        <RailItem icon={<ListChecks />} label="Tasks" href="#tasks" badge={7} />
        <RailBottom>
          <RailItem icon={<Settings2 />} label="Settings" href="#settings" />
        </RailBottom>
      </Rail>
    </div>
  );
}

const box = (el: Element) => el.getBoundingClientRect();

test("a named navigation of modules; the current one is marked and a count is in its name", async () => {
  const screen = await render(<Frame />);
  expect(document.querySelector('nav[aria-label="Modules"]')).not.toBeNull();
  await expect
    .element(screen.getByRole("link", { name: "Inbox, 99+" }))
    .toBeInTheDocument();
  const home = screen.getByRole("link", { name: "Home" }).element();
  expect(home.getAttribute("aria-current")).toBe("page");
  await expectNoA11yViolations(screen.container);
});

test("the bottom group sits at the rail's foot", async () => {
  await render(<Frame />);
  const settings = box(document.querySelector('[data-slot="rail-bottom"]')!);
  expect(Math.round(settings.bottom)).toBeGreaterThan(440);
});

test("every icon sits on the rail's centre line", async () => {
  await render(<Frame />);
  const nav = box(document.querySelector('[data-slot="rail"]')!);
  for (const svg of document.querySelectorAll('[data-slot="rail-item"] svg')) {
    const icon = box(svg);
    expect(icon.left + icon.width / 2).toBe(nav.left + nav.width / 2);
  }
});

test("the badge is compact and bites only the icon's corner, even at 99+", async () => {
  await render(<Frame />);
  for (const badge of document.querySelectorAll<HTMLElement>(
    '[data-slot="rail-badge"]',
  )) {
    const icon = box(badge.parentElement!.querySelector("svg")!);
    const chip = box(badge);
    expect(chip.height).toBe(14);
    expect(getComputedStyle(badge).fontSize).toBe("10px");
    expect(getComputedStyle(badge).fontVariantNumeric).toContain(
      "tabular-nums",
    );
    // It covers at most a 4px strip of the icon's right edge and the top quarter.
    expect(icon.right - chip.left).toBeLessThanOrEqual(4);
    expect(chip.bottom - icon.top).toBeLessThanOrEqual(8);
  }
  expect(document.querySelector('[data-slot="rail-badge"]')?.textContent).toBe(
    "99+",
  );
});

test("a badge of 0 or empty renders nothing", async () => {
  const { container } = await render(
    <span>
      <RailBadge count={0} />
      <RailBadge count="" />
    </span>,
  );
  expect(container.querySelector('[data-slot="rail-badge"]')).toBeNull();
});

test("an explicit aria-label wins over the label and its count", async () => {
  const screen = await render(
    <nav aria-label="Modules">
      <RailItem
        icon={<Home />}
        label="You"
        aria-label="Asha Kumar, account"
        badge={3}
        render={<button type="button" />}
      />
    </nav>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Asha Kumar, account" }))
    .toBeInTheDocument();
});

test("a render element's own aria-label is kept", async () => {
  const screen = await render(
    <nav aria-label="Modules">
      <RailItem
        icon={<Home />}
        label="Tasks"
        badge={4}
        render={<a href="#tasks" aria-label="Tasks in Acme" />}
      />
    </nav>,
  );
  await expect
    .element(screen.getByRole("link", { name: "Tasks in Acme" }))
    .toBeInTheDocument();
});

test("an animated rail icon paints static first, then swaps in at the same size once idle", async () => {
  const HomeIconLazy = lazyAnimatedIcon(() =>
    import("./icons/home").then((m) => m.HomeIcon),
  );
  await render(
    <nav aria-label="Modules">
      <RailItem
        icon={<Home data-testid="static" />}
        animatedIcon={<HomeIconLazy />}
        label="Home"
        href="#home"
      />
    </nav>,
  );
  const size = () => box(document.querySelector('[data-slot="rail-icon"]')!);
  const before = size();
  expect(document.querySelector('[data-testid="static"]')).not.toBeNull();
  await expect
    .poll(() => document.querySelector('[data-testid="static"]'), {
      timeout: 4000,
    })
    .toBeNull();
  const after = size();
  expect([after.width, after.height]).toEqual([before.width, before.height]);
});

test("the rail's two ends: the workspace's tile on top and the avatar under Settings", async () => {
  const screen = await render(
    <div style={{ width: 64, height: 480, display: "flex" }}>
      <Rail>
        <RailTop>
          <RailTile label="Workspace: Acme. Switch workspace">A</RailTile>
        </RailTop>
        <RailItem icon={<Home />} label="Home" href="#home" active />
        <RailBottom>
          <RailItem icon={<Settings2 />} label="Settings" href="#settings" />
          <RailTile shape="avatar" label="Ada Lovelace, account">
            AL
          </RailTile>
        </RailBottom>
      </Rail>
    </div>,
  );
  const tile = screen
    .getByRole("button", { name: "Workspace: Acme. Switch workspace" })
    .element();
  const avatar = screen
    .getByRole("button", { name: "Ada Lovelace, account" })
    .element();
  const home = screen.getByRole("link", { name: "Home" }).element();
  const settings = screen.getByRole("link", { name: "Settings" }).element();
  expect(box(tile).width).toBe(36);
  expect(box(avatar).width).toBe(32);
  expect(box(tile).bottom).toBeLessThan(box(home).top);
  expect(box(avatar).top).toBeGreaterThan(box(settings).bottom);
  // Both sit on the rail's centre line.
  const mid = (el: Element) => box(el).left + box(el).width / 2;
  expect(Math.round(mid(tile))).toBe(32);
  expect(Math.round(mid(avatar))).toBe(32);
  await expectNoA11yViolations(screen.container);
});
