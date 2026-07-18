import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { MarketingSurface } from './marketing-surface';

test('renders a div by default carrying the scope class + data-slot', async () => {
  const screen = await render(
    <MarketingSurface data-testid="surface">Hero copy</MarketingSurface>,
  );
  const el = screen.getByTestId('surface').element() as HTMLElement;
  expect(el.tagName).toBe('DIV');
  expect(el.dataset.slot).toBe('marketing-surface');
  expect(el.classList.contains('vs-marketing')).toBe(true);
  expect(el.classList.contains('bg-background')).toBe(true);
  expect(el.classList.contains('text-foreground')).toBe(true);
  await expect.element(screen.getByText('Hero copy')).toBeInTheDocument();
});

test('composes a different host element via render', async () => {
  const screen = await render(
    <MarketingSurface render={<section />} data-testid="surface">
      Content
    </MarketingSurface>,
  );
  const el = screen.getByTestId('surface').element() as HTMLElement;
  expect(el.tagName).toBe('SECTION');
  expect(el.dataset.slot).toBe('marketing-surface');
  expect(el.classList.contains('vs-marketing')).toBe(true);
});

test('merges a consumer className alongside the scope class', async () => {
  const screen = await render(
    <MarketingSurface className="px-6" data-testid="surface">
      Content
    </MarketingSurface>,
  );
  const el = screen.getByTestId('surface').element() as HTMLElement;
  expect(el.classList.contains('vs-marketing')).toBe(true);
  expect(el.classList.contains('px-6')).toBe(true);
});

test('forwards ref to the underlying element', async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<MarketingSurface ref={ref}>Content</MarketingSurface>);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe('marketing-surface');
});

test('no a11y violations', async () => {
  const screen = await render(
    <MarketingSurface>
      <h1>Ship agentic UI, fast.</h1>
    </MarketingSurface>,
  );
  await expectNoA11yViolations(screen.container);
});
