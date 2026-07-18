import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Kbd, KbdGroup } from './kbd';

test('renders a single key inside a <kbd> with data-slot', async () => {
  const screen = await render(<Kbd>K</Kbd>);
  const kbd = screen.getByText('K');
  await expect.element(kbd).toBeInTheDocument();
  await expect.element(kbd).toHaveAttribute('data-slot', 'kbd');
  expect(kbd.element().tagName).toBe('KBD');
});

test('applies the size data attribute', async () => {
  const screen = await render(<Kbd size="sm">Esc</Kbd>);
  await expect.element(screen.getByText('Esc')).toHaveAttribute('data-size', 'sm');
});

test('renders each token of the keys array as its own chip', async () => {
  const screen = await render(<Kbd os="mac" keys={['⌘', 'K']} />);
  await expect.element(screen.getByText('⌘')).toBeInTheDocument();
  await expect.element(screen.getByText('K')).toBeInTheDocument();
});

test('rewrites mac modifier glyphs to words on non-mac platforms', async () => {
  const screen = await render(<Kbd os="other" keys={['⌘', '⇧', 'K']} />);
  await expect.element(screen.getByText('Ctrl')).toBeInTheDocument();
  await expect.element(screen.getByText('Shift')).toBeInTheDocument();
  await expect.element(screen.getByText('K')).toBeInTheDocument();
});

test('keeps mac glyphs when os is mac', async () => {
  const screen = await render(<Kbd os="mac">⌥</Kbd>);
  await expect.element(screen.getByText('⌥')).toBeInTheDocument();
});

test('KbdGroup composes individual Kbd chips', async () => {
  const screen = await render(
    <KbdGroup>
      <Kbd os="mac">⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>,
  );
  const group = screen.container.querySelector('[data-slot="kbd-group"]');
  expect(group).not.toBeNull();
  expect(group?.querySelectorAll('[data-slot="kbd"]').length).toBe(2);
});

test('forwards ref to the root kbd element', async () => {
  const ref = React.createRef<HTMLElement>();
  await render(<Kbd ref={ref}>K</Kbd>);
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.tagName).toBe('KBD');
  expect(ref.current?.dataset.slot).toBe('kbd');
});

test('KbdGroup forwards ref to the root span element', async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(
    <KbdGroup ref={ref}>
      <Kbd os="mac">⌘</Kbd>
    </KbdGroup>,
  );
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe('kbd-group');
});

test('no a11y violations', async () => {
  const screen = await render(<Kbd os="mac" keys={['⌘', 'K']} />);
  await expectNoA11yViolations(screen.container);
});

test('multi-key form forwards ref to the group root (not fanned across chips)', async () => {
  const ref = React.createRef<HTMLSpanElement>();
  const screen = await render(<Kbd ref={ref} keys={['⌘', 'K']} />);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe('kbd-group');
  // exactly two chips, and the ref is on the group, not duplicated onto a chip
  expect(screen.container.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
});
