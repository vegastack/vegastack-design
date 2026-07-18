import './stacking.css'; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '../registry/ui/dialog';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '../registry/ui/sheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../registry/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '../registry/ui/popover';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../registry/ui/tooltip';
import { Toaster, toast } from '../registry/ui/sonner';
import { Button } from '../registry/ui/button';

/**
 * Nested-overlay stacking contract (plan v5 T3, CX-8): every portaled surface sits in the ONE
 * `--z-overlay` band and nesting resolves by DOM order (Base UI appends portals to <body>).
 * These are real-browser hit tests — `document.elementFromPoint` at the inner popup's centre
 * must land inside the inner popup, proving it paints ABOVE the outer overlay. Toasts are the
 * documented exemption above the band (library-managed z).
 */

function centerOf(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function hitTestInside(target: Element) {
  const { x, y } = centerOf(target);
  const hit = document.elementFromPoint(x, y);
  return hit != null && (target === hit || target.contains(hit));
}

test('Select inside Dialog: the open listbox paints above the dialog', async () => {
  const screen = await render(
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Pick something</DialogTitle>
        <Select defaultValue="a">
          <SelectTrigger aria-label="Fruit">
            <SelectValue placeholder="Pick a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Apple</SelectItem>
            <SelectItem value="b">Banana</SelectItem>
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>,
  );
  await screen.getByRole('button', { name: 'Open dialog' }).click();
  await expect.element(screen.getByRole('dialog')).toBeInTheDocument();

  await screen.getByRole('combobox', { name: 'Fruit' }).click();
  const listbox = await screen.getByRole('listbox').element();
  // Same band…
  const dialogPopup = document.querySelector('[data-slot="dialog-content"]')!;
  expect(getComputedStyle(listbox.closest('[data-slot="select-positioner"]') ?? listbox).zIndex).toBe(
    getComputedStyle(dialogPopup).zIndex,
  );
  // …but the select popup wins by DOM order: its centre is hittable.
  await expect.poll(() => hitTestInside(listbox)).toBe(true);
});

test('Popover inside Dialog: the popover paints above the dialog', async () => {
  const screen = await render(
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>With popover</DialogTitle>
        <Popover>
          <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
          <PopoverContent>Popover body content</PopoverContent>
        </Popover>
      </DialogContent>
    </Dialog>,
  );
  await screen.getByRole('button', { name: 'Open dialog' }).click();
  await screen.getByRole('button', { name: 'Open popover' }).click();
  const popup = await screen.getByText('Popover body content').element();
  await expect.poll(() => hitTestInside(popup)).toBe(true);
});

test('Tooltip inside Sheet: the tooltip paints above the sheet', async () => {
  const screen = await render(
    <TooltipProvider delay={0}>
      <Sheet>
        <SheetTrigger>Open sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Sheet panel</SheetTitle>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>
        </SheetContent>
      </Sheet>
    </TooltipProvider>,
  );
  await screen.getByRole('button', { name: 'Open sheet' }).click();
  await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
  await screen.getByRole('button', { name: 'Hover me' }).hover();
  const tip = await screen.getByText('Tooltip text').element();
  await expect.poll(() => hitTestInside(tip)).toBe(true);
});

test('nested Dialog paints above its parent Dialog', async () => {
  const screen = await render(
    <Dialog>
      <DialogTrigger>Open outer</DialogTrigger>
      <DialogContent>
        <DialogTitle>Outer</DialogTitle>
        <Dialog>
          <DialogTrigger>Open inner</DialogTrigger>
          <DialogContent>
            <DialogTitle>Inner dialog title</DialogTitle>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>,
  );
  await screen.getByRole('button', { name: 'Open outer' }).click();
  await screen.getByRole('button', { name: 'Open inner' }).click();
  const inner = await screen.getByText('Inner dialog title').element();
  await expect.poll(() => hitTestInside(inner)).toBe(true);
});

test('a toast fired while a Dialog is open stays visible above it (documented sonner exemption)', async () => {
  const screen = await render(
    <>
      <Toaster />
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Busy modal</DialogTitle>
          <Button onClick={() => toast('Saved to workspace')}>Fire toast</Button>
        </DialogContent>
      </Dialog>
    </>,
  );
  await screen.getByRole('button', { name: 'Open dialog' }).click();
  await screen.getByRole('button', { name: 'Fire toast' }).click();
  const toastEl = await screen.getByText('Saved to workspace').element();
  await expect.poll(() => hitTestInside(toastEl)).toBe(true);
});
