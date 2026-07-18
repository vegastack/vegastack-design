import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { SectionHeader } from './section-header';

test('renders the title as an h2', async () => {
  const screen = await render(<SectionHeader title="Ship agentic UI, fast." />);
  await expect
    .element(screen.getByRole('heading', { level: 2, name: 'Ship agentic UI, fast.' }))
    .toBeInTheDocument();
});

test('renders an eyebrow with a single brand marker dot', async () => {
  const screen = await render(<SectionHeader eyebrow="Platform" title="Title" />);
  const eyebrow = screen.container.querySelector('[data-slot="section-header-eyebrow"]');
  expect(eyebrow?.textContent).toContain('Platform');
  const dots = screen.container.querySelectorAll('[data-slot="section-header-eyebrow-mark"]');
  expect(dots.length).toBe(1);
  expect(dots[0]?.getAttribute('aria-hidden')).toBe('true');
});

test('omits the eyebrow entirely when not provided', async () => {
  const screen = await render(<SectionHeader title="Title" />);
  expect(screen.container.querySelector('[data-slot="section-header-eyebrow"]')).toBeNull();
});

test('renders an optional description', async () => {
  const screen = await render(<SectionHeader title="Title" description="Supporting copy." />);
  await expect.element(screen.getByText('Supporting copy.')).toBeInTheDocument();
});

test('center align sets data-align and centers text', async () => {
  const screen = await render(
    <SectionHeader title="Title" align="center" data-testid="header" />,
  );
  const el = screen.getByTestId('header').element() as HTMLElement;
  expect(el.dataset.align).toBe('center');
  expect(el.classList.contains('text-center')).toBe(true);
});

test('size maps to the tokenized display scale', async () => {
  const screen = await render(<SectionHeader title="Title" size="xl" />);
  const heading = screen.getByRole('heading', { level: 2 }).element() as HTMLElement;
  expect(heading.classList.contains('text-display-xl')).toBe(true);
});

test('supports a composed serif-italic emphasis span in the title', async () => {
  const screen = await render(
    <SectionHeader
      title={
        <>
          Ship agentic UI, <em className="font-serif italic">fast</em>.
        </>
      }
    />,
  );
  const emphasis = screen.container.querySelector('em');
  expect(emphasis?.classList.contains('font-serif')).toBe(true);
  expect(emphasis?.classList.contains('italic')).toBe(true);
});

test('no a11y violations', async () => {
  const screen = await render(
    <SectionHeader eyebrow="Platform" title="Title" description="Supporting copy." />,
  );
  await expectNoA11yViolations(screen.container);
});
