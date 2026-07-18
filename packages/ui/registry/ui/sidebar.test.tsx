import * as React from 'react';
import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoA11yViolations } from '../../test/a11y';
import { Home, Inbox, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from './sidebar';

/* ---------------------------------------------------------------------------------------------
 * This suite's real Playwright viewport is MOBILE-sized (414×896 — verified empirically; there's
 * no explicit `browser.viewport` config, so `useIsMobile`'s default 768px breakpoint would
 * otherwise make `Sidebar` mount in mobile-Sheet mode — CLOSED by default — for every single test
 * in this file, including every pre-existing desktop test below. `beforeEach` mocks
 * `window.matchMedia` to report "desktop" (not mobile) by default, restored automatically by
 * `afterEach`; `withMobileViewport` flips a single shared override to opt a specific test back
 * into mobile mode.
 * ------------------------------------------------------------------------------------------- */
let mobileMediaQueryOverride: string | null = null;

beforeEach(() => {
  mobileMediaQueryOverride = null;
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: mobileMediaQueryOverride !== null && query === mobileMediaQueryOverride,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function Demo() {
  return (
    <SidebarProvider>
      <Sidebar aria-label="Main navigation">
        <SidebarHeader>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Inbox />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton>
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

test('renders a menu button for each item', async () => {
  const screen = await render(<Demo />);
  await expect.element(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Inbox' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
});

test('the active item is marked with data-active and aria-current', async () => {
  const screen = await render(<Demo />);
  const home = screen.getByRole('button', { name: 'Home' });
  const inbox = screen.getByRole('button', { name: 'Inbox' });

  await expect.element(home).toHaveAttribute('data-active', 'true');
  await expect.element(home).toHaveAttribute('aria-current', 'page');
  await expect.element(inbox).toHaveAttribute('data-active', 'false');
  await expect.element(inbox).not.toHaveAttribute('aria-current');
});

test('group labels render as headings', async () => {
  const screen = await render(<Demo />);
  await expect
    .element(screen.getByRole('heading', { level: 3, name: 'Workspace' }))
    .toBeInTheDocument();
});

test('the trigger toggles the collapsed state', async () => {
  const screen = await render(<Demo />);
  const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });

  // Expanded by default.
  await expect.element(sidebar).toHaveAttribute('data-state', 'expanded');

  // Clicking the trigger collapses the rail to the icon state.
  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect.element(sidebar).toHaveAttribute('data-state', 'collapsed');
  await expect.element(sidebar).toHaveAttribute('data-collapsible', 'icon');

  // Clicking again expands it back.
  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect.element(sidebar).toHaveAttribute('data-state', 'expanded');
});

test('keyboard shortcut can be disabled', async () => {
  const screen = await render(
    <SidebarProvider keyboardShortcut={false}>
      <Sidebar aria-label="Main navigation" />
    </SidebarProvider>,
  );
  const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
  await expect.element(sidebar).toHaveAttribute('data-state', 'expanded');
});

test('keyboard shortcut can be customized', async () => {
  const screen = await render(
    <SidebarProvider keyboardShortcut="k">
      <Sidebar aria-label="Main navigation" />
    </SidebarProvider>,
  );
  const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
  await expect.element(sidebar).toHaveAttribute('data-state', 'expanded');
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  await expect.element(sidebar).toHaveAttribute('data-state', 'collapsed');
});

test('render prop projects a menu button onto a nav link', async () => {
  const screen = await render(
    <SidebarProvider>
      <Sidebar aria-label="Links">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive render={<a href="/dashboard" />}>
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );
  const link = screen.getByRole('link', { name: 'Dashboard' });
  await expect.element(link).toHaveAttribute('href', '/dashboard');
  await expect.element(link).toHaveAttribute('aria-current', 'page');
});

test('forwards ref to the root nav element', async () => {
  const ref = React.createRef<HTMLElement>();
  await render(
    <SidebarProvider>
      <Sidebar ref={ref} aria-label="Main navigation" />
    </SidebarProvider>,
  );
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.tagName).toBe('NAV');
  expect(ref.current?.dataset.slot).toBe('sidebar');
});

test('no a11y violations', async () => {
  const screen = await render(<Demo />);
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — collapsed', async () => {
  const screen = await render(<Demo />);
  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect
    .element(screen.getByRole('navigation', { name: 'Main navigation' }))
    .toHaveAttribute('data-state', 'collapsed');
  await expectNoA11yViolations(screen.container);
});

test('collapsed menu buttons keep their accessible name (label is sr-only, not display:none)', async () => {
  const screen = await render(<Demo />);

  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect
    .element(screen.getByRole('navigation', { name: 'Main navigation' }))
    .toHaveAttribute('data-state', 'collapsed');

  // The label span must stay in the accessible name while collapsed (register P0-03):
  // `sr-only` keeps it in the accessibility tree where `hidden` (display:none) dropped it.
  await expect.element(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Inbox' })).toBeInTheDocument();
});

/* ---------------------------------------------------------------------------------------------
 * Phase S — mobile Sheet mode.
 * ------------------------------------------------------------------------------------------- */

/**
 * Flip the shared `matchMedia` override (installed in `beforeEach` above) so
 * `(max-width: 767px)` (the default `useIsMobile` breakpoint) matches for the duration of the
 * callback — simulating a mobile viewport. Reset automatically by the next `beforeEach`, but
 * also reset here in `finally` so nothing downstream in the SAME test observes it.
 */
async function withMobileViewport(run: () => Promise<void>) {
  mobileMediaQueryOverride = '(max-width: 767px)';
  try {
    await run();
  } finally {
    mobileMediaQueryOverride = null;
  }
}

test('below the mobile breakpoint, the sidebar is closed by default (no dialog in the DOM)', async () => {
  await withMobileViewport(async () => {
    await render(<Demo />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

/**
 * Unlike `Demo` (whose `SidebarTrigger` lives INSIDE `SidebarHeader`, inside `Sidebar` — fine on
 * desktop, where `Sidebar` always renders), a mobile-aware layout needs the trigger OUTSIDE
 * `Sidebar`: below the breakpoint `Sidebar`'s content (trigger included, if nested inside it)
 * only mounts once the Sheet is open — nesting the one control that OPENS it in there would be a
 * chicken-and-egg dead end. This is also the pattern the mdx usage doc now calls out.
 */
function MobileDemo() {
  return (
    <SidebarProvider>
      <SidebarTrigger />
      <Sidebar aria-label="Main navigation">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <Home />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

test('below the mobile breakpoint, the trigger opens the sidebar inside a Sheet', async () => {
  await withMobileViewport(async () => {
    const screen = await render(<MobileDemo />);

    await screen.getByRole('button', { name: 'Toggle sidebar' }).click();

    await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
    // The nav landmark (and its content) still render, now inside the sheet.
    await expect
      .element(screen.getByRole('navigation', { name: 'Main navigation' }))
      .toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });
});

test('below the mobile breakpoint, Escape closes the sidebar', async () => {
  await withMobileViewport(async () => {
    const screen = await render(<MobileDemo />);
    await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
    await expect.element(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await expect
      .poll(() => document.querySelector('[role="dialog"]'), { timeout: 2000 })
      .toBeNull();
  });
});

test('no a11y violations — mobile sheet open', async () => {
  await withMobileViewport(async () => {
    const screen = await render(<MobileDemo />);
    await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
    await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
    // The popup portals to <body>, so audit the whole document (same pattern as sheet.test.tsx).
    await expectNoA11yViolations(document.body);
  });
});

/* ---------------------------------------------------------------------------------------------
 * Phase S — `collapsible` modes.
 * ------------------------------------------------------------------------------------------- */

function CollapsibleDemo({ collapsible }: { collapsible?: 'offcanvas' | 'icon' | 'none' }) {
  return (
    <SidebarProvider>
      <Sidebar aria-label="Nav" collapsible={collapsible}>
        <SidebarHeader>
          <SidebarTrigger />
        </SidebarHeader>
      </Sidebar>
    </SidebarProvider>
  );
}

test('collapsible="icon" (default) is unchanged: data-collapsible is "icon" once collapsed', async () => {
  const screen = await render(<CollapsibleDemo />);
  const nav = screen.getByRole('navigation', { name: 'Nav' });
  await expect.element(nav).toHaveAttribute('data-collapsible', '');
  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect.element(nav).toHaveAttribute('data-collapsible', 'icon');
});

test('collapsible="offcanvas" carries the off-canvas width/translate utility classes', async () => {
  const screen = await render(<CollapsibleDemo collapsible="offcanvas" />);
  const nav = screen.getByRole('navigation', { name: 'Nav' }).element();
  expect(nav.className).toContain('data-[state=collapsed]:w-0');
  expect(nav.className).toContain('data-[state=collapsed]:data-[side=left]:-translate-x-full');
});

test('collapsible="offcanvas": data-collapsible reflects "offcanvas" once collapsed', async () => {
  const screen = await render(<CollapsibleDemo collapsible="offcanvas" />);
  const nav = screen.getByRole('navigation', { name: 'Nav' });
  await expect.element(nav).toHaveAttribute('data-collapsible', '');
  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect.element(nav).toHaveAttribute('data-state', 'collapsed');
  await expect.element(nav).toHaveAttribute('data-collapsible', 'offcanvas');
});

test('collapsible="none": always renders expanded, and toggling leaves it expanded', async () => {
  const screen = await render(<CollapsibleDemo collapsible="none" />);
  const nav = screen.getByRole('navigation', { name: 'Nav' });
  await expect.element(nav).toHaveAttribute('data-state', 'expanded');
  await expect.element(nav).toHaveAttribute('data-collapsible', 'none');

  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect.element(nav).toHaveAttribute('data-state', 'expanded');
  await expect.element(nav).toHaveAttribute('data-collapsible', 'none');
});

/* ---------------------------------------------------------------------------------------------
 * Phase S — `SidebarRail`.
 * ------------------------------------------------------------------------------------------- */

test('SidebarRail toggles the sidebar open state on click', async () => {
  const screen = await render(
    <SidebarProvider>
      <Sidebar aria-label="Main navigation">
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>,
  );
  const nav = screen.getByRole('navigation', { name: 'Main navigation' });
  await expect.element(nav).toHaveAttribute('data-state', 'expanded');

  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect.element(nav).toHaveAttribute('data-state', 'collapsed');

  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  await expect.element(nav).toHaveAttribute('data-state', 'expanded');
});

test('SidebarRail carries an accessible name and a title', async () => {
  const screen = await render(
    <SidebarProvider>
      <Sidebar aria-label="Main navigation">
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>,
  );
  const rail = screen.getByRole('button', { name: 'Toggle sidebar' });
  await expect.element(rail).toHaveAttribute('title', 'Toggle sidebar');
});

/* ---------------------------------------------------------------------------------------------
 * Phase S — `SidebarInset`.
 * ------------------------------------------------------------------------------------------- */

test('SidebarInset renders a <main> landmark and forwards className', async () => {
  const screen = await render(
    <SidebarProvider>
      <Sidebar variant="inset" aria-label="Main navigation" />
      <SidebarInset className="custom-inset">page content</SidebarInset>
    </SidebarProvider>,
  );
  const main = screen.getByRole('main');
  await expect.element(main).toBeInTheDocument();
  await expect.element(main).toHaveTextContent('page content');
  expect(main.element().className).toContain('custom-inset');
});

/* ---------------------------------------------------------------------------------------------
 * Phase S — `SidebarMenuSkeleton`.
 * ------------------------------------------------------------------------------------------- */

test('SidebarMenuSkeleton derives a deterministic, cycling text-line width from `index`', async () => {
  const screen = await render(
    <div>
      <SidebarMenuSkeleton data-testid="row-0" index={0} />
      <SidebarMenuSkeleton data-testid="row-0-again" index={0} />
      <SidebarMenuSkeleton data-testid="row-1" index={1} />
      <SidebarMenuSkeleton data-testid="row-5" index={5} />
    </div>,
  );
  const lineClass = (testId: string) =>
    screen
      .getByTestId(testId)
      .element()
      .querySelector('[data-shape="line"]')!.className;

  // Same index -> identical width every time (deterministic, no Math.random).
  expect(lineClass('row-0')).toBe(lineClass('row-0-again'));
  // A different index actually varies the width.
  expect(lineClass('row-0')).not.toBe(lineClass('row-1'));
  // The fixed 5-wide cycle wraps: index 5 (5 % 5 === 0) matches index 0.
  expect(lineClass('row-5')).toBe(lineClass('row-0'));
});

test('SidebarMenuSkeleton hides the icon placeholder when showIcon={false}', async () => {
  const screen = await render(<SidebarMenuSkeleton data-testid="row" showIcon={false} />);
  const row = screen.getByTestId('row').element();
  expect(row.querySelector('[data-shape="circle"]')).toBeNull();
  expect(row.querySelector('[data-shape="line"]')).not.toBeNull();
});

test('SidebarMenuSkeleton is decorative (aria-hidden) like the Skeleton it composes', async () => {
  const screen = await render(<SidebarMenuSkeleton data-testid="row" />);
  const circle = screen.getByTestId('row').element().querySelector('[data-shape="circle"]');
  expect(circle?.getAttribute('aria-hidden')).toBe('true');
});

/* ---------------------------------------------------------------------------------------------
 * Phase S — cookie persistence.
 * ------------------------------------------------------------------------------------------- */

test('SidebarProvider writes the sidebar_state cookie on every desktop toggle', async () => {
  document.cookie = 'sidebar_state=; path=/; max-age=0'; // clear any leftover value first
  const screen = await render(<Demo />);

  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  expect(document.cookie).toContain('sidebar_state=false');

  await screen.getByRole('button', { name: 'Toggle sidebar' }).click();
  expect(document.cookie).toContain('sidebar_state=true');
});

/* ---------------------------------------------------------------------------------------------
 * Phase S — `SidebarTrigger` touch-target remediation (WCAG 2.5.8) — same "compiled-Tailwind
 * mirror + real elementFromPoint hit-test" technique as checkbox.test.tsx's suite.
 * ------------------------------------------------------------------------------------------- */

function injectTriggerHitAreaMirror(): () => void {
  const style = document.createElement('style');
  style.textContent = `
    body { margin: 24px; }
    /* SidebarTrigger renders a real <button> — this harness runs with no compiled Tailwind, so
       the browser's native UA button border/padding (not zeroed by Preflight here) would
       otherwise shrink the ::before pseudo's containing block (padding-box) below the intended
       28px. Reset those two, same as Tailwind's Preflight does for real, so the mirror measures
       the intended box, not an artifact of an unstyled native <button>. */
    [data-slot="sidebar-trigger"] { position: relative; display: inline-flex; box-sizing: border-box; width: 28px; height: 28px; border: 0; padding: 0; }
    [data-slot="sidebar-trigger"]::before { content: ""; position: absolute; inset: -8px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test('SidebarTrigger resolves an effective hit area >= 44x44 via the before pseudo-element', async () => {
  const cleanup = injectTriggerHitAreaMirror();
  try {
    const screen = await render(<Demo />);
    const el = screen.getByRole('button', { name: 'Toggle sidebar' }).element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, '::before');
    expect(parseFloat(before.width)).toBeGreaterThanOrEqual(44);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(44);
  } finally {
    cleanup();
  }
});

test('a point just outside the visible trigger box, inside the expanded hit area, still hits and toggles it', async () => {
  const cleanup = injectTriggerHitAreaMirror();
  try {
    const screen = await render(<Demo />);
    const el = screen.getByRole('button', { name: 'Toggle sidebar' }).element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 5px above the visual top edge — inside the 8px `before:-inset-2` expansion, outside the 28px box.
    const x = rect.left + rect.width / 2;
    const y = rect.top - 5;
    const hit = document.elementFromPoint(x, y);
    expect(hit).toBe(el);
    (hit as HTMLElement).click();
  } finally {
    cleanup();
  }
});

test('SidebarMenuBadge is vertically centered on its row (top-1/2 -translate-y-1/2)', async () => {
  // Regression: as an absolutely-positioned sibling of the full-width menu button, the badge
  // has no static position — without an explicit vertical anchor it rendered BELOW its row.
  // The half-translate pair centers it for every menu-button size (no per-size top-* classes).
  const screen = await render(
    <SidebarProvider>
      <Sidebar aria-label="Main navigation">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Inbox />
                <span>Inbox</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>12</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );
  const badge = screen.container.querySelector('[data-slot="sidebar-menu-badge"]') as HTMLElement;
  expect(badge).not.toBeNull();
  expect(badge.textContent).toBe('12');
  expect(badge.classList.contains('absolute')).toBe(true);
  expect(badge.classList.contains('top-1/2')).toBe(true);
  expect(badge.classList.contains('-translate-y-1/2')).toBe(true);
});

test('a point beyond the expanded hit area does not resolve to the trigger', async () => {
  const cleanup = injectTriggerHitAreaMirror();
  try {
    const screen = await render(<Demo />);
    const el = screen.getByRole('button', { name: 'Toggle sidebar' }).element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 12px above the visual top edge — 4px beyond the 8px `before:-inset-2` expansion boundary.
    const x = rect.left + rect.width / 2;
    const y = rect.top - 12;
    const hit = document.elementFromPoint(x, y);
    expect(hit).not.toBe(el);
  } finally {
    cleanup();
  }
});
