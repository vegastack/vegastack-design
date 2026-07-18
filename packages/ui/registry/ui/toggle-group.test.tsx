import * as React from 'react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

function Basic({
  multiple,
  onValueChange,
  size,
}: {
  multiple?: boolean;
  onValueChange?: (value: string[]) => void;
  size?: 'sm' | 'default' | 'lg';
} = {}) {
  return (
    <ToggleGroup
      aria-label="Text alignment"
      multiple={multiple}
      onValueChange={onValueChange}
      size={size}
    >
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  );
}

test('renders all items as toggle buttons', async () => {
  const screen = await render(<Basic />);
  await expect.element(screen.getByRole('button', { name: 'Left' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Center' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Right' })).toBeInTheDocument();
});

test('selecting an item presses it and fires onValueChange', async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Basic onValueChange={onValueChange} />);
  const center = screen.getByRole('button', { name: 'Center' });
  await center.click();
  await expect.element(center).toHaveAttribute('data-pressed');
  await expect.element(center).toHaveAttribute('aria-pressed', 'true');
  expect(onValueChange).toHaveBeenCalledWith(['center']);
});

test('single-select: pressing a second item unpresses the first', async () => {
  const screen = await render(<Basic />);
  const left = screen.getByRole('button', { name: 'Left' });
  const right = screen.getByRole('button', { name: 'Right' });
  await left.click();
  await expect.element(left).toHaveAttribute('data-pressed');
  await right.click();
  await expect.element(right).toHaveAttribute('data-pressed');
  await expect.element(left).not.toHaveAttribute('data-pressed');
});

test('multiple-select: items press independently and accumulate', async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Basic multiple onValueChange={onValueChange} />);
  const left = screen.getByRole('button', { name: 'Left' });
  const right = screen.getByRole('button', { name: 'Right' });
  await left.click();
  await right.click();
  await expect.element(left).toHaveAttribute('data-pressed');
  await expect.element(right).toHaveAttribute('data-pressed');
  // Last call carries both pressed values, and only the array (no event details).
  expect(onValueChange).toHaveBeenLastCalledWith(['left', 'right']);
});

test('multiple-select sets data-multiple on the group', async () => {
  const screen = await render(<Basic multiple />);
  const group = screen.container.querySelector('[data-slot="toggle-group"]');
  expect(group).toHaveAttribute('data-multiple');
});

test('clicking a pressed item again unpresses it (multiple)', async () => {
  const screen = await render(<Basic multiple />);
  const left = screen.getByRole('button', { name: 'Left' });
  await left.click();
  await expect.element(left).toHaveAttribute('data-pressed');
  await left.click();
  await expect.element(left).not.toHaveAttribute('data-pressed');
});

test('applies size data attribute to the group and items', async () => {
  const screen = await render(<Basic size="lg" />);
  const group = screen.container.querySelector('[data-slot="toggle-group"]');
  expect(group).toHaveAttribute('data-size', 'lg');
  const item = screen.container.querySelector('[data-slot="toggle-group-item"]');
  expect(item).toHaveAttribute('data-size', 'lg');
});

test('group size flows to items via context', async () => {
  const screen = await render(<Basic size="lg" />);
  const items = screen.container.querySelectorAll('[data-slot="toggle-group-item"]');
  expect(items.length).toBe(3);
  items.forEach((item) => expect(item).toHaveAttribute('data-size', 'lg'));
});

test('item size overrides the group context', async () => {
  const screen = await render(
    <ToggleGroup aria-label="Text alignment" size="lg">
      <ToggleGroupItem value="left" size="sm">
        Left
      </ToggleGroupItem>
    </ToggleGroup>,
  );
  const item = screen.getByRole('button', { name: 'Left' });
  await expect.element(item).toHaveAttribute('data-size', 'sm');
});

test('supports Base UI state-function className on root and item', async () => {
  const screen = await render(
    <ToggleGroup
      aria-label="Text formatting"
      defaultValue={['bold']}
      className={({ disabled }) => (disabled ? 'group-disabled' : 'group-ready')}
    >
      <ToggleGroupItem
        value="bold"
        className={({ pressed }) => (pressed ? 'item-pressed' : 'item-idle')}
      >
        Bold
      </ToggleGroupItem>
    </ToggleGroup>,
  );
  const group = screen.container.querySelector('[data-slot="toggle-group"]');
  expect(group?.className).toContain('group-ready');
  expect(screen.getByRole('button', { name: 'Bold' }).element().className).toContain('item-pressed');
});

test('honors defaultValue (uncontrolled)', async () => {
  const screen = await render(
    <ToggleGroup aria-label="Text formatting" defaultValue={['center']}>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>,
  );
  await expect
    .element(screen.getByRole('button', { name: 'Center' }))
    .toHaveAttribute('data-pressed');
});

test('arrow-key keyboard navigation moves focus and toggles with Enter', async () => {
  const screen = await render(<Basic />);
  const left = screen.getByRole('button', { name: 'Left' });
  await left.click();
  await expect.element(left).toHaveAttribute('data-pressed');
  // Roving focus: arrow moves to the next item, Enter toggles it.
  await userEvent.keyboard('{ArrowRight}{Enter}');
  await expect
    .element(screen.getByRole('button', { name: 'Center' }))
    .toHaveAttribute('data-pressed');
});

test('disabled group does not toggle on click', async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <ToggleGroup aria-label="Text alignment" disabled onValueChange={onValueChange}>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
    </ToggleGroup>,
  );
  const left = screen.getByRole('button', { name: 'Left' });
  await expect.element(left).toBeDisabled();
  await left.click({ force: true });
  await expect.element(left).not.toHaveAttribute('data-pressed');
  expect(onValueChange).not.toHaveBeenCalled();
});

test('vertical orientation is reflected on the group', async () => {
  const screen = await render(
    <ToggleGroup aria-label="View" orientation="vertical">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
    </ToggleGroup>,
  );
  const group = screen.container.querySelector('[data-slot="toggle-group"]');
  expect(group).toHaveAttribute('data-orientation', 'vertical');
});

test('no a11y violations', async () => {
  const screen = await render(<Basic />);
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — pressed', async () => {
  const screen = await render(<Basic />);
  await screen.getByRole('button', { name: 'Left' }).click();
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — disabled', async () => {
  const screen = await render(
    <ToggleGroup aria-label="Text alignment" disabled>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
    </ToggleGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test('forwards ref to the underlying toggle-group root element', async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <ToggleGroup ref={ref} aria-label="Text alignment">
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
    </ToggleGroup>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe('toggle-group');
});
