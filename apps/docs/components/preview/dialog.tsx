'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/dialog` (dogfoods the registry) → auto-scanned.
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  type DialogContentSize,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function dialog(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline">Delete project</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              This permanently deletes the project and all of its data. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground">
            Type the project name to confirm, or close this dialog to keep it. Removed projects are
            retained for 30 days before final deletion.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <DialogClose render={<Button variant="destructive">Delete project</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

const SIZES: { size: DialogContentSize; label: string }[] = [
  { size: 'xs', label: 'Extra small' },
  { size: 'sm', label: 'Small' },
  { size: 'default', label: 'Default' },
  { size: 'lg', label: 'Large' },
  { size: 'full', label: 'Full' },
];

export function dialogSizes(): ReactNode {
  return (
    <Wrapper>
      {SIZES.map(({ size, label }) => (
        <Dialog key={size}>
          <DialogTrigger render={<Button variant="outline">{label}</Button>} />
          <DialogContent size={size}>
            <DialogHeader>
              <DialogTitle>{label} dialog</DialogTitle>
              <DialogDescription>
                This dialog uses the <code>{size}</code> size — its max-width scales accordingly.
              </DialogDescription>
            </DialogHeader>
            <p className="text-muted-foreground">
              The header, this body, and the action row below sit at 20px padding on a 12px-radius
              popover surface with the overlay shadow.
            </p>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <DialogClose render={<Button>Save changes</Button>} />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </Wrapper>
  );
}

export function dialogNoCloseButton(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline">Confirm subscription</Button>} />
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirm subscription</DialogTitle>
            <DialogDescription>
              With <code>{'showCloseButton={false}'}</code> the top-right <code>X</code> is
              removed, so the only way out is an explicit footer action. Use this when you want a
              deliberate choice rather than an easy dismiss.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Not now</Button>} />
            <DialogClose render={<Button>Subscribe</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

export function dialogCloseLabel(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline">Edit profile</Button>} />
        <DialogContent closeLabel="Dismiss dialog">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              The top-right close button carries an accessible label. Here{' '}
              <code>closeLabel=&quot;Dismiss dialog&quot;</code> overrides the default{' '}
              <code>&quot;Close&quot;</code> — inspect the <code>X</code> button to see the new{' '}
              <code>aria-label</code>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <DialogClose render={<Button>Save</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

export function dialogScrollable(): ReactNode {
  return (
    <Wrapper>
      <Dialog>
        <DialogTrigger render={<Button variant="outline">Read terms</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms of service</DialogTitle>
            <DialogDescription>
              When the body is taller than the viewport, the popup caps its height and the content
              scrolls — the header and footer stay pinned.
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-1 flex flex-col gap-3 overflow-y-auto px-1 text-muted-foreground">
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i}>
                <span className="font-medium text-foreground">Section {i + 1}.</span> This is a long
                body paragraph included to overflow the dialog vertically. The popup is capped at{' '}
                <code>max-h-[calc(100dvh-var(--spacing)*8)]</code> and this region scrolls within
                it while the header and footer remain fixed.
              </p>
            ))}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Decline</Button>} />
            <DialogClose render={<Button>Accept</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}
