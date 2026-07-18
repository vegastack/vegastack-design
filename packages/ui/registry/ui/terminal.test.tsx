import * as React from 'react';
import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Terminal } from './terminal';

let writeText: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('renders string lines as commands prefixed with the prompt glyph', async () => {
  const screen = await render(<Terminal lines={['pnpm install']} />);
  const promptEls = screen.container.querySelectorAll('[data-slot="terminal-prompt"]');
  expect(promptEls.length).toBe(1);
  expect(promptEls[0]?.textContent).toBe('$');
  expect(promptEls[0]?.getAttribute('aria-hidden')).toBe('true');
  await expect.element(screen.getByText('pnpm install')).toBeInTheDocument();
});

test('body scrolls horizontally with a scroll-fade edge affordance (clipped commands read as scrollable)', async () => {
  const screen = await render(<Terminal lines={['pnpm run build --filter @vegastack/ui']} />);
  const body = screen.container.querySelector('[data-slot="terminal-body"]') as HTMLElement;
  expect(body.classList.contains('overflow-x-auto')).toBe(true);
  expect(body.classList.contains('scroll-fade-x')).toBe(true);
});

test('a custom prompt glyph replaces the default', async () => {
  const screen = await render(<Terminal lines={['pnpm install']} prompt=">" />);
  expect(screen.container.querySelector('[data-slot="terminal-prompt"]')?.textContent).toBe('>');
});

test('output lines render without a prompt glyph', async () => {
  const screen = await render(<Terminal lines={[{ output: '✓ Done' }]} />);
  expect(screen.container.querySelector('[data-slot="terminal-prompt"]')).toBeNull();
  await expect.element(screen.getByText('✓ Done')).toBeInTheDocument();
});

test('the header title defaults to "Terminal" and is overridable', async () => {
  const screen = await render(<Terminal lines={['x']} />);
  await expect.element(screen.getByText('Terminal')).toBeInTheDocument();

  const screen2 = await render(<Terminal lines={['x']} title="Install" />);
  await expect.element(screen2.getByText('Install')).toBeInTheDocument();
});

test('the header CopyButton copies only the command lines, joined by newline', async () => {
  const screen = await render(
    <Terminal lines={['first', { output: 'ignored' }, 'second']} />,
  );
  await screen.getByRole('button', { name: 'Copy command' }).click();
  expect(writeText).toHaveBeenCalledWith('first\nsecond');
});

test('copyValue overrides the default joined command text', async () => {
  const screen = await render(<Terminal lines={['first']} copyValue="explicit" />);
  await screen.getByRole('button', { name: 'Copy command' }).click();
  expect(writeText).toHaveBeenCalledWith('explicit');
});

test('is scoped to the marketing dark ground', async () => {
  const screen = await render(<Terminal lines={['x']} data-testid="terminal" />);
  const el = screen.getByTestId('terminal').element() as HTMLElement;
  expect(el.classList.contains('vs-marketing')).toBe(true);
});

test('no a11y violations', async () => {
  const screen = await render(
    <Terminal title="Install" lines={['pnpm dlx shadcn add @vegastack/button', { output: '✓ Installed' }]} />,
  );
  await expectNoA11yViolations(screen.container);
});
