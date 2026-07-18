/**
 * `dashboard-01.test.tsx` — a browser smoke test for the dashboard-01 block's composed
 * `DashboardPage` (`./page.tsx`): asserts the shell's three landmarks render, each content region
 * (stat cards, chart, recent activity) renders its expected data, the full-page empty state and
 * per-region loading states render, and the whole composition is axe-clean.
 */

import * as React from 'react';
import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { DashboardPage } from './page';

/**
 * This suite's real Playwright viewport is mobile-sized by default (no explicit
 * `browser.viewport` config) — `useIsMobile`'s 768px breakpoint would otherwise mount
 * `AppShellSidebar`'s `Sidebar` in mobile-Sheet mode (CLOSED by default, no `<nav>` in the DOM)
 * for every test. Mock `window.matchMedia` to report "desktop" — same pattern as
 * `sidebar.test.tsx`'s own suite-wide setup.
 */
beforeEach(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: false,
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

test('renders the app-shell landmarks', async () => {
  const screen = await render(<DashboardPage />);
  await expect.element(screen.getByRole('banner')).toBeInTheDocument();
  await expect
    .element(screen.getByRole('navigation', { name: 'Main navigation' }))
    .toBeInTheDocument();
  await expect.element(screen.getByRole('main')).toBeInTheDocument();
});

test('renders the stat-card row with formatted values', async () => {
  const screen = await render(<DashboardPage />);
  await expect.element(screen.getByText('Active agents')).toBeInTheDocument();
  // `AnimatedNumber` renders the value TWICE (an `aria-hidden` visual span + a `sr-only`
  // `role="status"` live-region span carrying the same formatted text — see its own doc) —
  // `.first()` disambiguates the strict-mode-matched pair.
  await expect.element(screen.getByText('128').first()).toBeInTheDocument();
  await expect.element(screen.getByText('18,452').first()).toBeInTheDocument();
});

test('renders the usage chart card', async () => {
  const screen = await render(<DashboardPage />);
  await expect.element(screen.getByText('Usage over time')).toBeInTheDocument();
});

test('renders recent-activity rows with status and duration', async () => {
  const screen = await render(<DashboardPage />);
  await expect.element(screen.getByRole('table')).toBeInTheDocument();
  await expect.element(screen.getByText('Summarize Q2 investor report')).toBeInTheDocument();
  await expect.element(screen.getByText('1m 24s')).toBeInTheDocument();
});

test('renders the full-page empty state when isEmpty', async () => {
  const screen = await render(<DashboardPage isEmpty />);
  await expect.element(screen.getByText('No agents yet')).toBeInTheDocument();
  await expect.element(screen.getByText('Active agents')).not.toBeInTheDocument();
});

test('renders per-region loading skeletons independently', async () => {
  const screen = await render(<DashboardPage loading={{ activity: true }} />);
  // Recent activity shows DataList's built-in loading state...
  await expect.element(screen.getByText('Loading rows')).toBeInTheDocument();
  // ...while the other regions still render their real data.
  await expect.element(screen.getByText('Active agents')).toBeInTheDocument();
  await expect.element(screen.getByText('Usage over time')).toBeInTheDocument();
});

test('renders a per-region error state instead of that region\'s content', async () => {
  const screen = await render(<DashboardPage error={{ chart: 'Request timed out' }} />);
  await expect.element(screen.getByText("Couldn't load the usage chart")).toBeInTheDocument();
  await expect.element(screen.getByText('Request timed out')).toBeInTheDocument();
  await expect.element(screen.getByText('Usage over time')).not.toBeInTheDocument();
  // The other regions are unaffected by one region's error.
  await expect.element(screen.getByText('Active agents')).toBeInTheDocument();
});

test('no a11y violations in the default (populated) state', async () => {
  await render(<DashboardPage />);
  await expectNoA11yViolations(document.body);
});
