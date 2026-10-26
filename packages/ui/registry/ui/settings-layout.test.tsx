import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { afterEach, expect, test } from "vitest";

import { expectNoA11yViolations } from "../../test/a11y";
// Real Tailwind + tokens: the two panes, the 960/720 measures and the container query ARE the
// contract, and the CSS-less harness would collapse every one of them.
import "../../test/stacking.css";
import {
  SettingsLayout,
  SettingsLayoutContent,
  SettingsNav,
  type SettingsNavSection,
} from "./settings-layout";

afterEach(async () => {
  await page.viewport(414, 896);
});

const SECTIONS: SettingsNavSection[] = [
  {
    label: "Account",
    items: [
      { href: "/settings/profile", label: "Profile" },
      { href: "/settings/notifications", label: "Notifications" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/settings/members", label: "Members", badge: 3 },
      { href: "/settings/teams", label: "Teams" },
    ],
  },
];

function Frame({
  width,
  view,
  kind = "form",
  activeHref = "/settings/profile",
}: {
  width: number;
  view?: "nav" | "content";
  kind?: "form" | "list";
  activeHref?: string;
}) {
  return (
    <div style={{ width }}>
      <SettingsLayout
        view={view}
        backHref="/settings"
        nav={<SettingsNav sections={SECTIONS} activeHref={activeHref} />}
      >
        <SettingsLayoutContent kind={kind}>
          <h1>Profile</h1>
          <div data-testid="body" style={{ height: 40 }} />
        </SettingsLayoutContent>
      </SettingsLayout>
    </div>
  );
}

const rect = (slot: string) =>
  document
    .querySelector<HTMLElement>(`[data-slot="${slot}"]`)!
    .getBoundingClientRect();

test("settings-layout: a 220px nav and one 960px column; a form is 720 and a list fills, at the same x", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Frame width={1216} kind="form" />);
  const nav = rect("settings-layout-nav");
  const main = rect("settings-layout-main");
  expect(Math.round(nav.width)).toBe(220);
  expect(Math.round(main.width)).toBe(960);
  expect(Math.round(main.left - nav.right)).toBe(32);
  const form = rect("settings-layout-content");
  expect(Math.round(form.width)).toBe(720);
  expect(Math.round(form.left)).toBe(Math.round(main.left));
  // The back link is the narrow layout's alone.
  expect(
    getComputedStyle(
      document.querySelector('[data-slot="settings-layout-back"]')!,
    ).display,
  ).toBe("none");
  await expectNoA11yViolations(screen.container);
  await screen.unmount();

  await render(<Frame width={1216} kind="list" />);
  const list = rect("settings-layout-content");
  expect(Math.round(list.width)).toBe(960);
  expect(Math.round(list.left)).toBe(
    Math.round(rect("settings-layout-main").left),
  );
});

test("settings-layout: the nav sticks while the page scrolls", async () => {
  await page.viewport(1440, 900);
  await render(<Frame width={1216} />);
  const nav = document.querySelector<HTMLElement>(
    '[data-slot="settings-layout-nav"]',
  )!;
  expect(getComputedStyle(nav).position).toBe("sticky");
});

test("settings-layout narrow: view=nav shows only the nav, full width, with 44px rows", async () => {
  await page.viewport(390, 844);
  const screen = await render(<Frame width={358} view="nav" />);
  const main = document.querySelector<HTMLElement>(
    '[data-slot="settings-layout-main"]',
  )!;
  expect(getComputedStyle(main).display).toBe("none");
  expect(Math.round(rect("settings-layout-nav").width)).toBe(358);
  const item = document.querySelector<HTMLElement>(
    '[data-slot="settings-nav-item"]',
  )!;
  expect(Math.round(item.getBoundingClientRect().height)).toBe(44);
  await expectNoA11yViolations(screen.container);
});

test("settings-layout narrow: view=content shows the page with a back link, and no nav", async () => {
  await page.viewport(390, 844);
  const screen = await render(<Frame width={358} view="content" />);
  const nav = document.querySelector<HTMLElement>(
    '[data-slot="settings-layout-nav"]',
  )!;
  expect(getComputedStyle(nav).display).toBe("none");
  const back = screen.getByRole("link", { name: "Settings" });
  await expect.element(back).toBeVisible();
  await expect.element(back).toHaveAttribute("href", "/settings");
  expect(Math.round(rect("settings-layout-content").width)).toBe(358);
  await expectNoA11yViolations(screen.container);
});

test("settings-nav marks the current page (a nested path too), names its groups and shows a count", async () => {
  await page.viewport(1440, 900);
  const screen = await render(
    <SettingsNav sections={SECTIONS} activeHref="/settings/members/42?tab=x" />,
  );
  const nav = screen.getByRole("navigation", { name: "Settings" });
  await expect.element(nav).toBeInTheDocument();
  const members = screen.getByRole("link", { name: "Members 3" });
  await expect.element(members).toHaveAttribute("aria-current", "page");
  await expect
    .element(screen.getByRole("link", { name: "Profile" }))
    .not.toHaveAttribute("aria-current");
  await expect
    .element(screen.getByRole("list", { name: "Workspace" }))
    .toBeInTheDocument();
  // `/settings/team` must not mark `/settings/teams`, nor the reverse.
  await screen.rerender(
    <SettingsNav sections={SECTIONS} activeHref="/settings/teamsx" />,
  );
  await expect
    .element(screen.getByRole("link", { name: "Teams" }))
    .not.toHaveAttribute("aria-current");
  await expectNoA11yViolations(screen.container);
});

test("settings-nav isActive overrides the path match; linkRender renders each item", async () => {
  function RouterLink(props: React.ComponentProps<"a">) {
    return <a data-router="" {...props} />;
  }
  const screen = await render(
    <SettingsNav
      sections={SECTIONS}
      isActive={(item) => item.href === "/settings/teams"}
      linkRender={<RouterLink className="extra" />}
    />,
  );
  const teams = screen.getByRole("link", { name: "Teams" });
  await expect.element(teams).toHaveAttribute("aria-current", "page");
  await expect.element(teams).toHaveAttribute("data-router", "");
  await expect.element(teams).toHaveClass("extra");
  await expect.element(teams).toHaveAttribute("href", "/settings/teams");
});

test("settings-layout forwards refs", async () => {
  const layoutRef = React.createRef<HTMLDivElement>();
  const contentRef = React.createRef<HTMLDivElement>();
  const navRef = React.createRef<HTMLElement>();
  await render(
    <SettingsLayout
      ref={layoutRef}
      nav={<SettingsNav ref={navRef} sections={SECTIONS} />}
    >
      <SettingsLayoutContent ref={contentRef} kind="list" />
    </SettingsLayout>,
  );
  expect(layoutRef.current?.dataset.slot).toBe("settings-layout");
  expect(layoutRef.current?.dataset.view).toBe("content");
  expect(contentRef.current?.dataset.kind).toBe("list");
  expect(navRef.current?.tagName).toBe("NAV");
});

test("settings-nav marks ONE item: the exact page, else its nearest ancestor", async () => {
  const sections: SettingsNavSection[] = [
    {
      items: [
        { href: "/settings/profile", label: "Profile" },
        { href: "/settings/profile/advanced", label: "Advanced" },
      ],
    },
  ];
  const screen = await render(
    <SettingsNav sections={sections} activeHref="/settings/profile/advanced" />,
  );
  expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  await expect
    .element(screen.getByRole("link", { name: "Advanced" }))
    .toHaveAttribute("aria-current", "page");
  await screen.rerender(
    <SettingsNav
      sections={sections}
      activeHref="/settings/profile/advanced/keys"
    />,
  );
  await expect
    .element(screen.getByRole("link", { name: "Advanced" }))
    .toHaveAttribute("aria-current", "page");
  await expect
    .element(screen.getByRole("link", { name: "Profile" }))
    .not.toHaveAttribute("aria-current");
});
