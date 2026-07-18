import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Spinner } from './spinner';

test('renders an accessible status with a default label', async () => {
  const screen = await render(<Spinner />);
  const spinner = screen.getByRole('status');
  await expect.element(spinner).toBeInTheDocument();
  await expect.element(spinner).toHaveAttribute('data-slot', 'spinner');
  await expect.element(spinner).toHaveAttribute('aria-label', 'Loading');
});

test('applies the size data attribute', async () => {
  const screen = await render(<Spinner size="lg" />);
  const spinner = screen.getByRole('status');
  await expect.element(spinner).toHaveAttribute('data-size', 'lg');
});

test('uses a custom label as the accessible name', async () => {
  const screen = await render(<Spinner label="Saving changes" />);
  await expect.element(screen.getByRole('status')).toHaveAttribute(
    'aria-label',
    'Saving changes',
  );
});

test('is decorative (aria-hidden, no status role) when label is empty', async () => {
  const screen = await render(<Spinner label="" data-testid="deco" />);
  const spinner = screen.getByTestId('deco');
  await expect.element(spinner).toHaveAttribute('aria-hidden', 'true');
  expect(spinner.element().getAttribute('role')).toBeNull();
});

test('no a11y violations', async () => {
  const screen = await render(<Spinner label="Loading content" />);
  await expectNoA11yViolations(screen.container);
});

test('forwards ref to the underlying svg element', async () => {
  const ref = React.createRef<SVGSVGElement>();
  await render(<Spinner ref={ref} />);
  expect(ref.current).toBeInstanceOf(SVGSVGElement);
  expect(ref.current?.dataset.slot).toBe('spinner');
});
