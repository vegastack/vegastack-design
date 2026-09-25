"use client";

import * as React from "react";
import type { CSSProperties, ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/drawer` (dogfoods the registry) → auto-scanned.
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMediaQuery } from "@/components/ui/use-media-query";

/*
 * Every fixture renders CLOSED. A drawer covers the viewport, so a fixture that mounted open would
 * show the reader a full-bleed panel instead of the control that summons it — and the geometry lane
 * mounts all of these. The trigger is the resting state; opening it is the reader's move.
 */

const deliveryTimes = [
  {
    value: "asap",
    id: "delivery-asap",
    label: "Standard delivery",
    description: "25–35 min · Driver assigned now",
    badge: "Fastest",
  },
  {
    value: "5-00",
    id: "delivery-5-00",
    label: "5:00 PM – 5:15 PM",
    description: "Prep starts at 4:45 PM",
  },
  {
    value: "5-30",
    id: "delivery-5-30",
    label: "5:30 PM – 5:45 PM",
    description: "Good if you're heading home",
  },
  {
    value: "6-00",
    id: "delivery-6-00",
    label: "6:00 PM – 6:15 PM",
    description: "Most popular · High demand",
  },
];

export function drawer(): ReactNode {
  return <DrawerDemo />;
}

function DrawerDemo(): ReactNode {
  const [open, setOpen] = React.useState(false);
  const [deliveryTime, setDeliveryTime] = React.useState("asap");
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <Wrapper>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        showSwipeHandle={isMobile}
        swipeDirection={isMobile ? "down" : "right"}
      >
        <DrawerTrigger render={<Button variant="secondary" />}>
          Open Drawer
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pick a delivery time</DrawerTitle>
            <DrawerDescription>
              We&apos;ll prepare your order as soon as possible.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <RadioGroup
              value={deliveryTime}
              onValueChange={setDeliveryTime}
              className="gap-2"
            >
              {deliveryTimes.map((time) => (
                <FieldLabel key={time.value} htmlFor={time.id}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle className="flex items-center gap-2">
                        {time.label}
                        {time.badge ? (
                          <Badge variant="secondary">{time.badge}</Badge>
                        ) : null}
                      </FieldTitle>
                      <FieldDescription>{time.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={time.value} id={time.id} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </div>
          <DrawerFooter>
            <Button onClick={() => setOpen(false)}>
              Confirm Delivery Time
            </Button>
            <DrawerClose render={<Button variant="secondary" />}>
              Cancel
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}

export function drawerComposition(): ReactNode {
  return (
    <Wrapper>
      <Drawer>
        <DrawerTrigger render={<Button variant="outline" />}>
          Open
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 text-sm text-muted-foreground">
            Deleting the project removes its history and its deploy hooks.
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose render={<Button variant="secondary" />}>
              Cancel
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}

export function drawerCustomSizes(): ReactNode {
  return (
    <Wrapper className="gap-3">
      <Drawer>
        <DrawerTrigger render={<Button variant="secondary" />}>
          Half height
        </DrawerTrigger>
        <DrawerContent className="h-[50vh]">
          <DrawerHeader>
            <DrawerTitle>Half height</DrawerTitle>
            <DrawerDescription>
              `h-*` and `max-h-*` on DrawerContent override the content-sized
              default.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 24 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-md bg-muted p-3 text-sm text-muted-foreground"
                >
                  Scrollable row {index + 1}
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer swipeDirection="right">
        <DrawerTrigger render={<Button variant="secondary" />}>
          Wider side panel
        </DrawerTrigger>
        {/* One component, two directions: scope the override to the axis it belongs to. */}
        <DrawerContent className="data-[swipe-axis=x]:w-96 data-[swipe-axis=y]:max-h-[50vh]">
          <DrawerHeader>
            <DrawerTitle>Wider side panel</DrawerTitle>
            <DrawerDescription>
              A side drawer spans 75% of the viewport, or 24rem above the `sm`
              breakpoint.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 p-4">
            <div className="size-full rounded-lg bg-muted" />
          </div>
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}

export function drawerStyling(): ReactNode {
  return (
    <Wrapper>
      <Drawer>
        <DrawerTrigger render={<Button variant="secondary" />}>
          Inset Drawer
        </DrawerTrigger>
        {/* `--drawer-inset` floats the panel off the viewport edges; the bleed variable fills the
            gap the panel leaves behind while a swipe overshoots. */}
        <DrawerContent
          style={
            {
              "--drawer-inset": "0.75rem",
              "--drawer-bleed-background": "var(--color-muted)",
            } as CSSProperties
          }
          className="rounded-xl"
        >
          <DrawerHeader>
            <DrawerTitle>Inset Drawer</DrawerTitle>
            <DrawerDescription>
              Set the sizing variables on DrawerContent, and the overlay
              variable on `[data-slot=drawer-overlay]` in your own CSS.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 p-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground group-data-[swipe-axis=y]/drawer-popup:h-40">
              Descendants can target the popup&apos;s state with
              `group-data-[swipe-axis=y]/drawer-popup:` — this block is only
              tall on a vertical drawer.
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose render={<Button />}>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}

const SWIPE_DIRECTIONS = ["up", "right", "down", "left"] as const;

export function drawerPosition(): ReactNode {
  return (
    <Wrapper className="gap-3">
      {SWIPE_DIRECTIONS.map((swipeDirection) => (
        <Drawer key={swipeDirection} swipeDirection={swipeDirection}>
          <DrawerTrigger
            render={<Button variant="secondary" className="capitalize" />}
          >
            {swipeDirection}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="capitalize">
                {swipeDirection} drawer
              </DrawerTitle>
              <DrawerDescription>
                `swipeDirection` picks the edge the drawer rests against and the
                gesture that dismisses it.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 p-4">
              <div className="rounded-lg bg-muted group-data-[swipe-axis=x]/drawer-popup:size-full group-data-[swipe-axis=y]/drawer-popup:h-40 group-data-[swipe-axis=y]/drawer-popup:w-full" />
            </div>
            <DrawerFooter>
              <DrawerClose render={<Button />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </Wrapper>
  );
}

export function drawerSwipeHandle(): ReactNode {
  return (
    <Wrapper>
      <Drawer showSwipeHandle>
        <DrawerTrigger render={<Button variant="secondary" />}>
          Open Drawer
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer</DrawerTitle>
            <DrawerDescription>Drawer with a swipe handle.</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 p-4">
            <div className="rounded-lg bg-muted group-data-[swipe-axis=x]/drawer-popup:size-full group-data-[swipe-axis=y]/drawer-popup:h-40 group-data-[swipe-axis=y]/drawer-popup:w-full" />
          </div>
          <DrawerFooter>
            <DrawerClose render={<Button />}>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}

export function drawerNested(): ReactNode {
  return <DrawerNested />;
}

function DrawerNested(): ReactNode {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const swipeDirection = isMobile ? "down" : "right";

  return (
    <Wrapper>
      <Drawer showSwipeHandle={isMobile} swipeDirection={swipeDirection}>
        <DrawerTrigger render={<Button variant="secondary" />}>
          Open Drawer
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer</DrawerTitle>
            <DrawerDescription>
              Open another drawer from the same direction.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 p-4">
            <div className="rounded-lg bg-muted group-data-[swipe-axis=x]/drawer-popup:size-full group-data-[swipe-axis=y]/drawer-popup:aspect-video group-data-[swipe-axis=y]/drawer-popup:w-full" />
          </div>
          <DrawerFooter>
            <Drawer showSwipeHandle={isMobile} swipeDirection={swipeDirection}>
              <DrawerTrigger render={<Button variant="outline" />}>
                Open Nested Drawer
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Nested Drawer</DrawerTitle>
                  <DrawerDescription>
                    The parent drawer stays mounted behind this one.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 p-4">
                  <div className="rounded-lg bg-muted group-data-[swipe-axis=x]/drawer-popup:size-full group-data-[swipe-axis=y]/drawer-popup:aspect-video group-data-[swipe-axis=y]/drawer-popup:w-full" />
                </div>
                <DrawerFooter>
                  <Drawer
                    showSwipeHandle={isMobile}
                    swipeDirection={swipeDirection}
                  >
                    <DrawerTrigger render={<Button variant="outline" />}>
                      Open Third Drawer
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Third Drawer</DrawerTitle>
                        <DrawerDescription>
                          Two drawers are stacked behind this one.
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="flex-1 p-4">
                        <div className="rounded-lg bg-muted group-data-[swipe-axis=x]/drawer-popup:size-full group-data-[swipe-axis=y]/drawer-popup:aspect-video group-data-[swipe-axis=y]/drawer-popup:w-full" />
                      </div>
                      <DrawerFooter>
                        <DrawerClose render={<Button variant="secondary" />}>
                          Close
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                  <DrawerClose render={<Button variant="secondary" />}>
                    Close
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
            <DrawerClose render={<Button variant="secondary" />}>
              Close
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}

export function drawerNonModal(): ReactNode {
  return (
    <Wrapper>
      <Drawer modal={false} disablePointerDismissal swipeDirection="right">
        <DrawerTrigger render={<Button variant="outline" />}>
          Non Modal
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Non Modal Drawer</DrawerTitle>
            <DrawerDescription>
              The page behind stays scrollable and clickable; there is no
              overlay to dismiss.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 p-4">
            <div className="rounded-lg bg-muted group-data-[swipe-axis=x]/drawer-popup:size-full group-data-[swipe-axis=y]/drawer-popup:h-40 group-data-[swipe-axis=y]/drawer-popup:w-full" />
          </div>
          <DrawerFooter>
            <DrawerClose render={<Button />}>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}

/**
 * Snap points, controlled.
 *
 * `snapPoints` are the heights the drawer settles at: a number between 0 and 1 is a fraction of the
 * viewport, a number above 1 is pixels, and a string carries `px`/`rem`. The fixture reads and
 * writes the active one through `snapPoint`/`onSnapPointChange`, so the badge is the drawer's real
 * state rather than a guess, and the buttons move it without a gesture — which is also how a
 * keyboard user changes it.
 */
const SNAP_POINTS = ["10rem", "20rem", 1] as const;

export function drawerSnapPoints(): ReactNode {
  return <DrawerSnapPoints />;
}

function DrawerSnapPoints(): ReactNode {
  const [snapPoint, setSnapPoint] = React.useState<string | number | null>(
    SNAP_POINTS[0],
  );

  return (
    <Wrapper>
      <Drawer
        snapPoints={[...SNAP_POINTS]}
        snapPoint={snapPoint}
        onSnapPointChange={setSnapPoint}
        showSwipeHandle
      >
        <DrawerTrigger render={<Button variant="outline" />}>
          Open Snap Drawer
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Snap points</DrawerTitle>
            <DrawerDescription>
              Drag the handle to snap between a compact peek, a half sheet and
              the full height.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Active snap point</span>
              <Badge variant="secondary">{String(snapPoint)}</Badge>
              {/* `data-expanded` is set only at the full snap point (`1`). */}
              <Badge
                variant="outline"
                className="hidden group-data-expanded/drawer-popup:inline-flex"
              >
                expanded
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {SNAP_POINTS.map((point) => (
                <Button
                  key={String(point)}
                  variant={point === snapPoint ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSnapPoint(point)}
                >
                  {String(point)}
                </Button>
              ))}
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              At the full snap point the popup gains `data-expanded`, so a
              header can grow a border or a title can shrink with the
              `data-expanded:` variant.
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose render={<Button />}>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}

export function drawerResponsive(): ReactNode {
  return <DrawerResponsive />;
}

function ProfileForm({ className }: { className?: string }): ReactNode {
  return (
    <form className={className}>
      <div className="grid gap-3">
        <Label htmlFor="responsive-email">Email</Label>
        <Input
          type="email"
          id="responsive-email"
          defaultValue="ada@example.com"
        />
      </div>
      <div className="mt-4 grid gap-3">
        <Label htmlFor="responsive-username">Username</Label>
        <Input id="responsive-username" defaultValue="@ada" />
      </div>
      <Button type="submit" className="mt-4">
        Save changes
      </Button>
    </form>
  );
}

function DrawerResponsive(): ReactNode {
  const [open, setOpen] = React.useState(false);
  // `serverFallback: true` matches the mobile branch, so a phone never renders the desktop Dialog
  // for a frame before hydration corrects it.
  const isDesktop = !useMediaQuery("(max-width: 767px)", {
    serverFallback: true,
  });

  if (isDesktop) {
    return (
      <Wrapper>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" />}>
            Edit Profile
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <ProfileForm />
          </DialogContent>
        </Dialog>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger render={<Button variant="outline" />}>
          Edit Profile
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-start">
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DrawerDescription>
          </DrawerHeader>
          <ProfileForm className="p-4" />
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}
