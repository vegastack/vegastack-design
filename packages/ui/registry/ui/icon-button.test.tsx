import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test, vi } from 'vitest';
import { Plus } from 'lucide-react';
import { expectNoA11yViolations } from '../../test/a11y';
import { IconButton } from './icon-button';

test('renders an accessibly-named button from aria-label', async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  await expect.element(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
});

test('fires onClick', async () => {
  const onClick = vi.fn();
  const screen = await render(
    <IconButton aria-label="Add item" onClick={onClick}>
      <Plus />
    </IconButton>,
  );
  await screen.getByRole('button', { name: 'Add item' }).click();
  expect(onClick).toHaveBeenCalledOnce();
});

test('maps size to the square icon-* scale and tags the slot', async () => {
  const screen = await render(
    <IconButton aria-label="Add item" size="sm">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole('button', { name: 'Add item' });
  await expect.element(btn).toHaveAttribute('data-size', 'icon-sm');
  await expect.element(btn).toHaveAttribute('data-slot', 'icon-button');
});

test('default size maps to `icon`', async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  await expect
    .element(screen.getByRole('button', { name: 'Add item' }))
    .toHaveAttribute('data-size', 'icon');
});

test('passes variant through to Button', async () => {
  const screen = await render(
    <IconButton aria-label="Delete" variant="destructive">
      <Plus />
    </IconButton>,
  );
  await expect
    .element(screen.getByRole('button', { name: 'Delete' }))
    .toHaveAttribute('data-variant', 'destructive');
});

test('no a11y violations', async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — disabled', async () => {
  const screen = await render(
    <IconButton aria-label="Add item" disabled>
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — loading', async () => {
  const screen = await render(
    <IconButton aria-label="Add item" loading>
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test('forwards ref to the underlying button element', async () => {
  // Delegating wrapper: {...props} (carrying ref) is spread onto Button, which
  // forwards onto its <button> host. No code change needed (Pattern D).
  const ref = React.createRef<HTMLButtonElement>();
  await render(
    <IconButton ref={ref} aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe('icon-button');
});

test('loading renders exactly one svg (the spinner replaces the icon in the fixed square)', async () => {
  const screen = await render(
    <IconButton aria-label="Add item" loading>
      <Plus />
    </IconButton>,
  );
  // The accessible name survives the swap — it comes from aria-label, not the icon.
  const btn = screen.getByRole('button', { name: 'Add item' });
  await expect.element(btn).toHaveAttribute('aria-busy', 'true');
  const el = btn.element() as HTMLElement;
  expect(el.querySelectorAll('svg')).toHaveLength(1);
});
