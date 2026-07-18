import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

function Demo({ defaultValue }: { defaultValue?: string[] } = {}) {
  return (
    <Accordion defaultValue={defaultValue}>
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Ships in 2–3 business days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>30-day return window.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

test('renders a trigger for each item', async () => {
  const screen = await render(<Demo />);
  await expect.element(screen.getByRole('button', { name: 'Shipping' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Returns' })).toBeInTheDocument();
});

test('clicking a trigger expands its panel and sets data-panel-open', async () => {
  const screen = await render(<Demo />);
  const trigger = screen.getByRole('button', { name: 'Shipping' });

  // Collapsed by default — trigger is not marked open.
  await expect.element(trigger).not.toHaveAttribute('data-panel-open');

  await trigger.click();

  // Open — trigger carries data-panel-open and the panel content is shown.
  await expect.element(trigger).toHaveAttribute('data-panel-open');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByText('Ships in 2–3 business days.')).toBeInTheDocument();
});

test('single-select keeps only one panel open at a time', async () => {
  const screen = await render(
    <Accordion>
      <AccordionItem value="a">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionContent>First content</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionContent>Second content</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );

  const first = screen.getByRole('button', { name: 'First' });
  const second = screen.getByRole('button', { name: 'Second' });

  await first.click();
  await expect.element(first).toHaveAttribute('aria-expanded', 'true');

  await second.click();
  await expect.element(second).toHaveAttribute('aria-expanded', 'true');
  // Opening the second collapses the first (exclusive / single-open).
  await expect.element(first).toHaveAttribute('aria-expanded', 'false');
});

test('disabled item cannot be expanded', async () => {
  const screen = await render(
    <Accordion>
      <AccordionItem value="locked" disabled>
        <AccordionTrigger>Locked</AccordionTrigger>
        <AccordionContent>Hidden content</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  const trigger = screen.getByRole('button', { name: 'Locked' });
  await expect.element(trigger).toBeDisabled();
});

test('disabled item trigger dims via data-disabled (Base UI surfaces item-level disabled as a data attribute)', async () => {
  const screen = await render(
    <Accordion>
      <AccordionItem value="locked" disabled>
        <AccordionTrigger>Locked</AccordionTrigger>
        <AccordionContent>Hidden content</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  const trigger = screen.getByRole('button', { name: 'Locked' });
  // Base UI writes `data-disabled` on the trigger for an item-level `disabled` —
  // the native `disabled:` variant alone would never match, so the class string
  // must also carry the data-disabled dim.
  await expect.element(trigger).toHaveAttribute('data-disabled');
  const el = screen.container.querySelector('[data-slot="accordion-trigger"]')!;
  expect(el.className).toContain('data-disabled:opacity-(--opacity-dim)');
  expect(el.className).toContain('data-disabled:pointer-events-none');
});

test('forwards ref to the underlying accordion root element', async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Accordion ref={ref}>
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Ships in 2–3 business days.</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe('accordion');
});

test('no a11y violations', async () => {
  const screen = await render(<Demo />);
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — disabled item', async () => {
  const screen = await render(
    <Accordion>
      <AccordionItem value="locked" disabled>
        <AccordionTrigger>Locked</AccordionTrigger>
        <AccordionContent>Hidden content</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  await expectNoA11yViolations(screen.container);
});

test('no a11y violations — expanded', async () => {
  const screen = await render(<Demo defaultValue={['shipping']} />);
  await expectNoA11yViolations(screen.container);
});
