"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/sheet` (dogfoods the registry) → auto-scanned.
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
  type SheetSide,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function sheet(): ReactNode {
  return (
    <Wrapper>
      <Sheet>
        <SheetTrigger
          render={<Button variant="outline">Edit profile</Button>}
        />
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <p className="text-muted-foreground">
              Your name and bio are visible to everyone in the workspace. Email
              changes require re-verification before they take effect.
            </p>
          </div>
          <SheetFooter>
            <SheetClose render={<Button variant="outline">Cancel</Button>} />
            <SheetClose render={<Button>Save changes</Button>} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Wrapper>
  );
}

const SIDES: { side: SheetSide; label: string }[] = [
  { side: "top", label: "Top" },
  { side: "right", label: "Right" },
  { side: "bottom", label: "Bottom" },
  { side: "left", label: "Left" },
];

export function sheetSides(): ReactNode {
  return (
    <Wrapper>
      {SIDES.map(({ side, label }) => (
        <Sheet key={side}>
          <SheetTrigger render={<Button variant="outline">{label}</Button>} />
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{label} sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the <code>{side}</code> edge of the
                screen.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4">
              <p className="text-muted-foreground">
                Side panels are flush to their pinned edge with no radius; a top
                or bottom panel keeps a small radius on its free edge.
              </p>
            </div>
            <SheetFooter>
              <SheetClose render={<Button variant="outline">Cancel</Button>} />
              <SheetClose render={<Button>Confirm</Button>} />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </Wrapper>
  );
}

export function sheetCustom(): ReactNode {
  return (
    <Wrapper>
      {/* No close (X) button — the only way out is a footer action or Escape. */}
      <Sheet>
        <SheetTrigger
          render={<Button variant="outline">No close button</Button>}
        />
        <SheetContent showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Confirm before leaving</SheetTitle>
            <SheetDescription>
              With <code>showCloseButton={"{false}"}</code> there is no
              top-right <code>X</code> — dismiss the panel through an explicit
              footer action (or <kbd>Esc</kbd>).
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <p className="text-muted-foreground">
              Use this when leaving without a decision should be deliberate.
            </p>
          </div>
          <SheetFooter>
            <SheetClose render={<Button variant="outline">Discard</Button>} />
            <SheetClose render={<Button>Save changes</Button>} />
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Width override — canonical caps at max-w-sm; widen it via className. */}
      <Sheet>
        <SheetTrigger render={<Button variant="outline">Wider panel</Button>} />
        <SheetContent className="max-w-md" closeLabel="Dismiss filters">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              A <code>className=&quot;max-w-md&quot;</code> override widens the
              panel past the default <code>max-w-sm</code> cap. The close button
              carries a custom <code>closeLabel</code> for screen readers.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <p className="text-muted-foreground">
              Width overrides only apply to <code>left</code>/<code>right</code>{" "}
              sheets; <code>top</code>/<code>bottom</code> sheets are full-width
              and cap their height instead.
            </p>
          </div>
          <SheetFooter>
            <SheetClose render={<Button variant="outline">Cancel</Button>} />
            <SheetClose render={<Button>Apply</Button>} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Wrapper>
  );
}
