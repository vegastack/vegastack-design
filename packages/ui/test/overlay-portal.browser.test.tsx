import * as React from 'react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../registry/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '../registry/ui/popover';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../registry/ui/sheet';

/**
 * Base UI portal contract (Codex R4 MED): overlay popups MUST portal out of their local DOM (to
 * <body>) so they escape ancestor stacking contexts and clipping, and carry the overlay band token (z-(--z-overlay)) so
 * they render above app chrome. These tests open each overlay inside an `isolation: isolate` app root
 * (the required root stacking context, set by @vegastack/design-tokens/base.css + the docs layout) and
 * assert the popup escaped the root and carries the overlay band. (Pixel-level stack ordering above the Fumadocs
 * chrome is the deferred VRT visual layer; this proves the portal + z-index contract deterministically.)
 */

function AppRoot({ children }: { children: React.ReactNode }) {
  // mirrors the required `<body className="isolate">` / base.css `body { isolation: isolate }`.
  return (
    <div data-testid="app-root" className="isolate">
      {children}
    </div>
  );
}

function assertPortaled(popup: Element | null) {
  expect(popup).not.toBeNull();
  const root = document.querySelector('[data-testid="app-root"]')!;
  // escaped the app root (portaled to body) — not clipped/trapped by ancestor stacking contexts.
  expect(root.contains(popup!)).toBe(false);
  expect(document.body.contains(popup!)).toBe(true);
  // carries the overlay band token so it stacks above page content (T3: z-(--z-overlay)).
  expect(popup!.className).toContain('z-(--z-overlay)');
}

test('Dialog content portals out of the app root and carries the overlay band', async () => {
  await render(
    <AppRoot>
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Body</DialogDescription>
        </DialogContent>
      </Dialog>
    </AppRoot>,
  );
  await expect.element(document.body.querySelector('[data-slot="dialog-content"]')!).toBeInTheDocument();
  assertPortaled(document.querySelector('[data-slot="dialog-content"]'));
});

test('Popover content portals out of the app root and carries the overlay band', async () => {
  const screen = await render(
    <AppRoot>
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>
    </AppRoot>,
  );
  await expect.element(screen.getByText('Popover body')).toBeInTheDocument();
  assertPortaled(document.querySelector('[data-slot="popover-content"]'));
});

test('Sheet content portals out of the app root and carries the overlay band', async () => {
  await render(
    <AppRoot>
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Sheet</SheetTitle>
          <SheetDescription>Sheet body</SheetDescription>
        </SheetContent>
      </Sheet>
    </AppRoot>,
  );
  await expect.element(document.body.querySelector('[data-slot="sheet-content"]')!).toBeInTheDocument();
  assertPortaled(document.querySelector('[data-slot="sheet-content"]'));
});
