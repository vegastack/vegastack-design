import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test, vi } from 'vitest';
import { Bold } from 'lucide-react';
import { expectNoA11yViolations } from '../../test/a11y';
import { Toggle } from './toggle';

test('renders children and is a button by default', async () => {
  const screen = await render(<Toggle>Bold</Toggle>);
  await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
});

test('starts unpressed (aria-pressed=false)', async () => {
  const screen = await render(<Toggle>Bold</Toggle>);
  await expect
    .element(screen.getByRole('button', { name: 'Bold' }))
    .toHaveAttribute('aria-pressed', 'false');
});

test('toggles pressed on click and fires onPressedChange', async () => {
  const onPressedChange = vi.fn();
  const screen = await render(<Toggle onPressedChange={onPressedChange}>Bold</Toggle>);
  const btn = screen.getByRole('button', { name: 'Bold' });
  await btn.click();
  expect(onPressedChange).toHaveBeenCalledOnce();
  expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
  await expect.element(btn).toHaveAttribute('aria-pressed', 'true');
  await expect.element(btn).toHaveAttribute('data-pressed', '');
});

test('reflects controlled pressed state', async () => {
  const screen = await render(<Toggle pressed>Bold</Toggle>);
  const btn = screen.getByRole('button', { name: 'Bold' });
  await expect.element(btn).toHaveAttribute('aria-pressed', 'true');
  await expect.element(btn).toHaveAttribute('data-pressed', '');
});

test('applies size data attribute', async () => {
  const screen = await render(<Toggle size="lg">Bold</Toggle>);
  const btn = screen.getByRole('button', { name: 'Bold' });
  await expect.element(btn).toHaveAttribute('data-size', 'lg');
  await expect.element(btn).toHaveAttribute('data-slot', 'toggle');
});

test('supports Base UI state-function className', async () => {
  const screen = await render(
    <Toggle pressed className={({ pressed }) => (pressed ? 'is-pressed' : 'is-idle')}>
      Bold
    </Toggle>,
  );
  expect(screen.getByRole('button', { name: 'Bold' }).element().className).toContain('is-pressed');
});

test('disabled prevents toggling', async () => {
  const onPressedChange = vi.fn();
  const screen = await render(
    <Toggle disabled onPressedChange={onPressedChange}>
      Bold
    </Toggle>,
  );
  const btn = screen.getByRole('button', { name: 'Bold' });
  await expect.element(btn).toBeDisabled();
  await btn.click({ force: true }).catch(() => {});
  expect(onPressedChange).not.toHaveBeenCalled();
});

test('forwards ref to the root button element', async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(<Toggle ref={ref}>Bold</Toggle>);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe('toggle');
});

test('no a11y violations (icon-only with aria-label)', async () => {
  const screen = await render(
    <Toggle aria-label="Toggle bold">
      <Bold />
    </Toggle>,
  );
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — pressed', async () => {
  const screen = await render(
    <Toggle aria-label="Toggle bold" pressed>
      <Bold />
    </Toggle>,
  );
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — disabled', async () => {
  const screen = await render(
    <Toggle aria-label="Toggle bold" disabled>
      <Bold />
    </Toggle>,
  );
  await expectNoA11yViolations(screen.container);
});
