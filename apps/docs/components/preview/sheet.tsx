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
        <Sheet key={side} side={side}>
          <SheetTrigger render={<Button variant="outline">{label}</Button>} />
          <SheetContent>
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

export function sheetSizes(): ReactNode {
  return (
    <Wrapper>
      {(["sm", "md", "lg", "full"] as const).map((size) => (
        <Sheet key={size}>
          <SheetTrigger render={<Button variant="outline">{size}</Button>} />
          <SheetContent size={size} closeLabel="Dismiss filters">
            <SheetHeader>
              <SheetTitle>Filters — {size}</SheetTitle>
              <SheetDescription>
                <code>size</code> reads as a width on a <code>left</code>/
                <code>right</code> sheet and as a height on a <code>top</code>/
                <code>bottom</code> one, from the same panel-width vocabulary.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4">
              <p className="text-muted-foreground">
                Drag the panel towards its edge to dismiss it — the sheet runs
                on Base UI&apos;s Drawer, so swipe-to-close is built in.
              </p>
            </div>
            <SheetFooter>
              <SheetClose render={<Button variant="outline">Cancel</Button>} />
              <SheetClose render={<Button>Apply</Button>} />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </Wrapper>
  );
}
