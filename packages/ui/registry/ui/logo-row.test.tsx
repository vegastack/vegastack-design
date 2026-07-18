import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { LogoRow } from './logo-row';

const items = [{ name: 'ACME' }, { name: 'NIMBUS', href: 'https://example.com' }];

test('renders every item as a list entry', async () => {
  const screen = await render(<LogoRow items={items} />);
  await expect.element(screen.getByText('ACME')).toBeInTheDocument();
  await expect.element(screen.getByText('NIMBUS')).toBeInTheDocument();
  expect(screen.container.querySelectorAll('[data-slot="logo-row-item"]').length).toBe(2);
});

test('renders a plain span for items without href, and a link for items with one', async () => {
  const screen = await render(<LogoRow items={items} />);
  const acme = screen.getByText('ACME').element();
  expect(acme.tagName).toBe('SPAN');
  const nimbus = screen.getByText('NIMBUS').element();
  expect(nimbus.tagName).toBe('A');
  expect(nimbus.getAttribute('href')).toBe('https://example.com');
});

test('omits the label when not provided', async () => {
  const screen = await render(<LogoRow items={items} />);
  expect(screen.container.querySelector('[data-slot="logo-row-label"]')).toBeNull();
});

test('renders the label when provided', async () => {
  const screen = await render(<LogoRow items={items} label="Trusted by" />);
  await expect.element(screen.getByText('Trusted by')).toBeInTheDocument();
});

test('no a11y violations', async () => {
  const screen = await render(<LogoRow items={items} label="Trusted by" />);
  await expectNoA11yViolations(screen.container);
});
