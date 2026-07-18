import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { NotificationBell } from './notification-bell';

test('renders the bell trigger with a default accessible name', async () => {
  const screen = await render(<NotificationBell />);
  await expect
    .element(screen.getByRole('button', { name: 'Notifications' }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="notification-bell"]'),
  ).not.toBeNull();
});

test('shows the count badge when count > 0', async () => {
  const screen = await render(<NotificationBell count={3} />);
  const badge = screen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(badge).not.toBeNull();
  expect(badge?.textContent).toBe('3');
});

test('folds the count into the accessible name', async () => {
  const screen = await render(<NotificationBell count={3} />);
  await expect
    .element(screen.getByRole('button', { name: 'Notifications, 3 unread' }))
    .toBeInTheDocument();
});

test('renders no badge when count is 0', async () => {
  const screen = await render(<NotificationBell count={0} />);
  expect(
    screen.container.querySelector('[data-slot="notification-bell-badge"]'),
  ).toBeNull();
  // Accessible name stays the bare label (no "unread" suffix).
  await expect.element(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
});

test('caps the displayed count at "99+"', async () => {
  const screen = await render(<NotificationBell count={250} />);
  const badge = screen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(badge?.textContent).toBe('99+');
  await expect
    .element(screen.getByRole('button', { name: 'Notifications, 99+ unread' }))
    .toBeInTheDocument();
});

test('dot mode renders an empty indicator instead of the number', async () => {
  const screen = await render(<NotificationBell count={5} dot />);
  const badge = screen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(badge).not.toBeNull();
  expect(badge?.textContent).toBe('');
  // Count is still announced even though the visual is a dot.
  await expect
    .element(screen.getByRole('button', { name: 'Notifications, 5 unread' }))
    .toBeInTheDocument();
});

test('honours a custom aria-label as the base name', async () => {
  const screen = await render(<NotificationBell count={2} aria-label="Alerts" />);
  await expect
    .element(screen.getByRole('button', { name: 'Alerts, 2 unread' }))
    .toBeInTheDocument();
});

test('fires onClick', async () => {
  const onClick = vi.fn();
  const screen = await render(<NotificationBell count={1} onClick={onClick} />);
  await screen.getByRole('button', { name: 'Notifications, 1 unread' }).click();
  expect(onClick).toHaveBeenCalledOnce();
});

test('marks the badge decorative (aria-hidden)', async () => {
  const screen = await render(<NotificationBell count={4} />);
  const badge = screen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(badge?.getAttribute('aria-hidden')).toBe('true');
});

test('no a11y violations', async () => {
  const screen = await render(<NotificationBell count={7} />);
  await expectNoA11yViolations(screen.container);
});

/* ---------------------------------------------------------------------------------------------
 * Motion (Phase M, audit 09 §d3): both badge modes pop in on mount (`motion-pop-in`), and the
 * count badge REPLAYS the pop by remounting whenever the DISPLAYED value changes — the "new
 * activity" cue. It is keyed on `displayCount` (not the raw `count`) so two counts that both cap
 * to "99+" don't fire a cue for a change nobody can see.
 * ------------------------------------------------------------------------------------------- */

test('carries the motion-pop-in arrival class in both count and dot modes', async () => {
  const countScreen = await render(<NotificationBell count={3} />);
  const countBadge = countScreen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(countBadge?.className).toContain('motion-pop-in');

  const dotScreen = await render(<NotificationBell count={3} dot />);
  const dotBadge = dotScreen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(dotBadge?.className).toContain('motion-pop-in');
});

test('replays the pop (remounts the badge node) when the displayed count changes', async () => {
  const screen = await render(<NotificationBell count={3} />);
  const badgeBefore = screen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(badgeBefore).not.toBeNull();

  await screen.rerender(<NotificationBell count={4} />);
  const badgeAfter = screen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(badgeAfter).not.toBeNull();
  expect(badgeAfter).not.toBe(badgeBefore);
});

test('does not replay when the displayed count is unchanged (both cap to "99+")', async () => {
  const screen = await render(<NotificationBell count={150} />);
  const badgeBefore = screen.container.querySelector('[data-slot="notification-bell-badge"]');

  await screen.rerender(<NotificationBell count={200} />);
  const badgeAfter = screen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(badgeAfter?.textContent).toBe('99+');
  expect(badgeAfter).toBe(badgeBefore);
});

test('rapid successive count changes settle on the final value without crashing', async () => {
  const screen = await render(<NotificationBell count={1} />);
  for (const count of [2, 3, 4, 5, 42]) {
    await screen.rerender(<NotificationBell count={count} />);
  }
  const badge = screen.container.querySelector('[data-slot="notification-bell-badge"]');
  expect(badge?.textContent).toBe('42');
  await expect
    .element(screen.getByRole('button', { name: 'Notifications, 42 unread' }))
    .toBeInTheDocument();
});

test('the count badge is left-anchored so wide counts grow outward, not over the bell', async () => {
  // Regression: `-right-1` anchored the badge by its RIGHT edge, so "99+" grew inward and
  // covered the bell. `left-full -translate-x-3` pins the LEFT edge exactly where a one-digit
  // badge (min-w-4, previously right:-4px) started, so single digits render identically while
  // overflow extends outward past the bell.
  const screen = await render(<NotificationBell count={100} />);
  const badge = screen.container.querySelector(
    '[data-slot="notification-bell-badge"]',
  ) as HTMLElement;
  expect(badge.textContent).toBe('99+');
  expect(badge.classList.contains('left-full')).toBe(true);
  expect(badge.classList.contains('-translate-x-3')).toBe(true);
  expect(badge.classList.contains('-right-1')).toBe(false);
});

test('forwards ref to the underlying IconButton button element', async () => {
  // Delegating wrapper: {...props} (carrying ref) is spread onto IconButton,
  // which forwards onto its <button> host. No code change needed (Pattern D).
  const ref = React.createRef<HTMLButtonElement>();
  await render(<NotificationBell ref={ref} count={3} />);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe('icon-button');
});
