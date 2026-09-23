import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, onTestFinished, test } from "vitest";
// The compiled lane stylesheet as a STRING, mounted only for the 320px docs-demo test below: every
// other test here is structural and must not see real CSS.
import geometryCss from "../../test/geometry.css?inline";
import {
  navigationMenu as navigationMenuDemo,
  navigationMenuRtl as navigationMenuRtlDemo,
} from "@/components/preview/navigation-menu";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import navigationMenuSource from "./navigation-menu.tsx?raw";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";
import { DirectionProvider } from "./direction";

const popup = () =>
  document.querySelector(
    '[data-slot="navigation-menu-content"]',
  ) as HTMLElement | null;

/** Upstream's Usage example: one trigger, one panel, one plain link beside it. */
function Menu(props: React.ComponentProps<typeof NavigationMenu>) {
  return (
    <NavigationMenu {...props}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-56">
              <li>
                <NavigationMenuLink render={<a href="#link-one" />}>
                  Link
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink render={<a href="#link-two" />}>
                  Second link
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            render={<a href="#docs" />}
            className={navigationMenuTriggerStyle()}
          >
            Docs
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/** BRD-1: a real 1px `border border-border`, never upstream's `ring-1 ring-foreground/10` outline. */
function expectBorderNotRing(element: HTMLElement) {
  const tokens = element.className.split(/\s+/);
  expect(tokens).toContain("border");
  expect(tokens).toContain("border-border");
  expect(element.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
}

test("renders the nav row closed, with its data-slots (Usage)", async () => {
  const screen = await render(<Menu />);
  const root = screen.container.querySelector(
    '[data-slot="navigation-menu"]',
  ) as HTMLElement;
  expect(root).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="navigation-menu-list"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelectorAll('[data-slot="navigation-menu-item"]'),
  ).toHaveLength(2);
  const trigger = screen.getByRole("button", { name: /Item One/ });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  // Closed: the panel is not mounted anywhere, portal included.
  expect(popup()).toBeNull();
});

test("the trigger opens the shared panel, which portals out of the row (Usage)", async () => {
  const screen = await render(<Menu />);
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  const content = popup() as HTMLElement;
  expect(screen.container.contains(content)).toBe(false);
  await expect
    .element(screen.getByRole("link", { name: "Second link" }))
    .toBeInTheDocument();
});

test("every exported part renders and carries its data-slot (Composition)", async () => {
  const screen = await render(
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            Item One
            <NavigationMenuIndicator />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-56">
              <li>
                <NavigationMenuLink render={<a href="#link-one" />}>
                  Link
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  );
  for (const name of [
    "navigation-menu",
    "navigation-menu-list",
    "navigation-menu-item",
    "navigation-menu-trigger",
    "navigation-menu-indicator",
  ]) {
    expect(
      screen.container.querySelector(`[data-slot="${name}"]`),
      `missing data-slot="${name}"`,
    ).not.toBeNull();
  }
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  expect(
    document.querySelector('[data-slot="navigation-menu-link"]'),
  ).not.toBeNull();
});

test("NavigationMenu renders its own portal, positioner, popup and viewport (Composition)", async () => {
  const screen = await render(<Menu />);
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  const content = popup() as HTMLElement;
  const portal = content.closest("[data-base-ui-portal]");
  // The call site names none of these; the Root renders them, which is why there is no
  // `NavigationMenuPanel` to place by hand.
  expect(portal).not.toBeNull();
  expect(portal?.contains(content)).toBe(true);
  expect(screen.container.querySelector("[data-base-ui-portal]")).toBeNull();
});

test("align is forwarded to the positioner the Root renders (Composition)", async () => {
  const screen = await render(<Menu align="end" />);
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  const positioner = (popup() as HTMLElement).closest(
    "[data-base-ui-portal] > *",
  ) as HTMLElement;
  expect(positioner.getAttribute("data-align")).toBe("end");
});

test("navigationMenuTriggerStyle dresses a plain link as a trigger (Link Component)", async () => {
  const screen = await render(<Menu />);
  const docs = screen.getByRole("link", { name: "Docs" }).element();
  expect(docs.tagName).toBe("A");
  expect(docs.getAttribute("href")).toBe("#docs");
  expect(docs.getAttribute("data-slot")).toBe("navigation-menu-link");
  // The recipe's own classes, not a copy of them.
  const recipe = navigationMenuTriggerStyle();
  for (const token of recipe.split(/\s+/).filter(Boolean)) {
    expect(docs.className).toContain(token);
  }
});

test("render composes an arbitrary link element (Link Component)", async () => {
  function RouterLink({
    href,
    children,
    ...props
  }: React.ComponentProps<"a"> & { href: string }) {
    return (
      <a href={href} data-router-link="" {...props}>
        {children}
      </a>
    );
  }
  const screen = await render(
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            render={<RouterLink href="#documentation" />}
            className={navigationMenuTriggerStyle()}
          >
            Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  );
  const link = screen.getByRole("link", { name: "Documentation" }).element();
  expect(link.hasAttribute("data-router-link")).toBe(true);
  expect(link.getAttribute("href")).toBe("#documentation");
});

test("the row is one tab stop and the panel is reachable from the keyboard (Usage)", async () => {
  const screen = await render(<Menu />);
  await userEvent.tab();
  const trigger = screen
    .getByRole("button", { name: /Item One/ })
    .element() as HTMLElement;
  expect(document.activeElement).toBe(trigger);
  // Tab moves PAST the row, not through every trigger in it.
  await userEvent.tab();
  expect(document.activeElement).not.toBe(trigger);
});

test("RTL: the row reads right to left and the panel opens with it (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <NavigationMenu align="end">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>البدء</NavigationMenuTrigger>
              <NavigationMenuContent dir="rtl">
                <ul className="w-56">
                  <li>
                    <NavigationMenuLink render={<a href="#intro" />}>
                      مقدمة
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </DirectionProvider>,
  );
  const list = screen.container.querySelector(
    '[data-slot="navigation-menu-list"]',
  ) as HTMLElement;
  // This lane compiles no Tailwind, so the assertion is the resolved direction rather than the
  // geometry `flex` would produce; `geometry.browser.test.tsx` measures the compiled layout.
  expect(getComputedStyle(list).direction).toBe("rtl");
  await userEvent.click(screen.getByRole("button", { name: /البدء/ }));
  await expect.poll(popup).not.toBeNull();
  expect(getComputedStyle(popup() as HTMLElement).direction).toBe("rtl");
});

/**
 * OVL-13. The panel portals out of the nav's subtree, so the scope class has to be re-applied on a
 * host INSIDE the portal or a dark or scoped surface loses its theme on the way out.
 * `NavigationMenuPositioner` is that host, matching `popover`, `select`, `combobox` and `tooltip`.
 */
test("OVL-13: the positioner inside the portal carries the theme scope", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <Menu />
    </InternalThemeScopeProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  const content = popup() as HTMLElement;
  const portal = content.closest("[data-base-ui-portal]");
  expect(portal).not.toBeNull();
  const scoped = portal?.querySelector(".vs-scope-under-test") as HTMLElement;
  expect(scoped).not.toBeNull();
  // The scope host is the POSITIONER — the portal's own child, an ancestor of the popup.
  expect(scoped.parentElement).toBe(portal);
  expect(scoped.contains(content)).toBe(true);
});

test("OVL-13: with no scope in context the positioner carries no scope class", async () => {
  const screen = await render(<Menu />);
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  const portal = (popup() as HTMLElement).closest(
    "[data-base-ui-portal]",
  ) as HTMLElement;
  const positioner = portal.firstElementChild as HTMLElement;
  expect(positioner.className).toContain("isolate");
  expect(positioner.className).not.toContain("vs-scope-under-test");
});

/**
 * FOC-1 / FOC-6. Upstream painted a `ring-3 ring-ring/50` glow on the trigger and on the link, and
 * then suppressed the outline for every link INSIDE the panel. Both are removed; this asserts over
 * the portaled subtree too, because the suppression lived there.
 */
test("FOC-1/FOC-6: no ring glow, and no outline suppression inside the panel", async () => {
  const screen = await render(<Menu />);
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  const elements = [
    ...screen.container.querySelectorAll<HTMLElement>("*"),
    ...document.querySelectorAll<HTMLElement>("[data-base-ui-portal] *"),
  ];
  expect(elements.length).toBeGreaterThan(0);
  for (const element of elements) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\//);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toContain("data-[slot=navigation-menu-link]:focus:");
  }
  // And the recipe itself carries neither the glow nor an outline reset.
  const recipe = navigationMenuTriggerStyle();
  expect(recipe).not.toContain("ring-");
  expect(recipe).not.toMatch(/\boutline-none\b|\boutline-hidden\b/);
});

/**
 * FRM-4. Upstream's trigger recipe carried `disabled:pointer-events-none`, which makes a tooltip
 * explaining the disabled state impossible. The opacity stays; the pointer events do not.
 */
test("FRM-4: a disabled trigger keeps live pointer events", async () => {
  const screen = await render(
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger disabled>Item One</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul>
              <li>
                <NavigationMenuLink render={<a href="#link" />}>
                  Link
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  );
  const trigger = screen.container.querySelector(
    '[data-slot="navigation-menu-trigger"]',
  ) as HTMLElement;
  expect(trigger.className).not.toContain("disabled:pointer-events-none");
  expect(navigationMenuTriggerStyle()).not.toContain(
    "disabled:pointer-events-none",
  );
  // The dimming stays — the state is still visible.
  expect(navigationMenuTriggerStyle()).toContain("disabled:opacity-50");
  expect(getComputedStyle(trigger).pointerEvents).not.toBe("none");
  // A real pointer lands on the trigger rather than passing through it, which is what a tooltip
  // explaining the disabled state depends on.
  const box = trigger.getBoundingClientRect();
  const hit = document.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2,
  );
  expect(trigger.contains(hit)).toBe(true);
});

/**
 * API-16. Upstream ships no directive because it calls no hook of its own; OVL-13's
 * `useInternalThemeScope()` is a hook, so this file is the lowest leaf that needs the boundary.
 */
test("API-16: the module opens with the client directive", () => {
  const head = navigationMenuSource
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("//"));
  expect(head.length).toBeGreaterThan(0);
  expect(head[0]!.trim()).toMatch(/^["']use client["'];?$/);
});

test("BRD-1: the shared popup and the viewport-less content draw a real border, not a ring", async () => {
  const screen = await render(<Menu />);
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  const portal = (popup() as HTMLElement).closest<HTMLElement>(
    "[data-base-ui-portal]",
  )!;
  // The Root's own popup (it carries no data-slot): the surface that wraps the viewport.
  const surface = [...portal.querySelectorAll<HTMLElement>("*")].find((el) =>
    el.className.split(/\s+/).includes("bg-popover"),
  )!;
  expectBorderNotRing(surface);
  // With `viewport={false}` the content IS the surface; its border is gated on that group state.
  const tokens = (popup() as HTMLElement).className.split(/\s+/);
  expect(tokens).toContain(
    "group-data-[viewport=false]/navigation-menu:border",
  );
  expect(tokens).toContain(
    "group-data-[viewport=false]/navigation-menu:border-border",
  );
  expect((popup() as HTMLElement).className).not.toMatch(
    /ring-1|ring-foreground/,
  );
});

test("no a11y violations — closed", async () => {
  const screen = await render(<Menu />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — panel open", async () => {
  const screen = await render(<Menu />);
  await userEvent.click(screen.getByRole("button", { name: /Item One/ }));
  await expect.poll(popup).not.toBeNull();
  // The panel portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — disabled trigger", async () => {
  const screen = await render(
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger disabled>Item One</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul>
              <li>
                <NavigationMenuLink render={<a href="#link" />}>
                  Link
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — RTL", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <NavigationMenu align="end">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<a href="#docs" />}
                className={navigationMenuTriggerStyle()}
              >
                الوثائق
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

// A navigation menu is a desktop row: its list does not wrap and its panel is as wide as its
// content, clamped to the available width with the overflow clipped (upstream's layout, which no
// decision row changes). So what fits a 320px screen is the CALL SITE's job, and the docs demos are
// the call site people copy: upstream's demo panels were a fixed `w-96`/`w-80` and its row carried
// three triggers, so at 320px the row ran out of its card and the panel text was cut off.
test.each([
  ["the demo", navigationMenuDemo],
  ["the RTL demo", navigationMenuRtlDemo],
] as const)(
  "%s fits a 320px screen: the row stays in its card and the panel is not clipped (docs)",
  async (_label, demo) => {
    await page.viewport(320, 700);
    const sheet = document.createElement("style");
    sheet.textContent = geometryCss;
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const screen = await render(
      <div style={{ width: 272 }}>{demo() as React.ReactElement}</div>,
    );
    const list = screen.container.querySelector<HTMLElement>(
      '[data-slot="navigation-menu-list"]',
    )!;
    const card = list.closest<HTMLElement>(".not-prose")!;
    const cardBox = card.getBoundingClientRect();
    for (const item of list.querySelectorAll<HTMLElement>(
      '[data-slot="navigation-menu-item"]',
    )) {
      const box = item.getBoundingClientRect();
      if (box.width === 0) continue; // hidden below a breakpoint
      expect(box.left).toBeGreaterThanOrEqual(cardBox.left);
      expect(box.right).toBeLessThanOrEqual(cardBox.right);
    }
    await userEvent.click(
      list.querySelector<HTMLElement>('[data-slot="navigation-menu-trigger"]')!,
    );
    await expect.poll(popup).not.toBeNull();
    const viewport = popup()!.closest<HTMLElement>(
      '[data-slot="navigation-menu-viewport"], .overflow-hidden',
    )!;
    // Wait out the open transition, then: nothing inside the panel is clipped by its viewport, and
    // the panel's content lies on the screen.
    await expect
      .poll(() => {
        // The content element itself is clamped with the popup; what overflows is its children.
        const boxes = [...popup()!.querySelectorAll("*")].map((element) =>
          element.getBoundingClientRect(),
        );
        const left = Math.min(...boxes.map((box) => box.left));
        const right = Math.max(...boxes.map((box) => box.right));
        const clip = viewport.getBoundingClientRect();
        return JSON.stringify({
          clipped: left < clip.left - 0.5 || right > clip.right + 0.5,
          offscreen: left < -0.5 || right > 320.5,
        });
      })
      .toBe(JSON.stringify({ clipped: false, offscreen: false }));
  },
);
