import "./stacking.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "../registry/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "../registry/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../registry/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../registry/ui/popover";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../registry/ui/tooltip";
import {
  Toast,
  ToastArrow,
  ToastContent,
  ToastPortal,
  ToastPositioner,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  createToastManager,
  toast,
  useToastManager,
} from "../registry/ui/toast";
import { Button } from "../registry/ui/button";

/**
 * Nested-overlay stacking contract (plan v5 T3, CX-8): every portaled surface sits in the ONE
 * `z-50` band and nesting resolves by DOM order (Base UI appends portals to <body>).
 * These are real-browser hit tests — `document.elementFromPoint` at the inner popup's centre
 * must land inside the inner popup, proving it paints ABOVE the outer overlay. Toasts sit one
 * band higher, on `z-60`, because their viewport mounts before any dialog opens and DOM order
 * would therefore bury them.
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

test("Select inside Dialog: the open listbox paints above the dialog", async () => {
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
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  // Native click dispatch avoids a WebKit Playwright race when opening a
  // second portaled popup from inside a modal focus trap. Poll the observable
  // portaled contract instead of assuming it mounts in the click task.
  (
    screen.getByRole("combobox", { name: "Fruit" }).element() as HTMLElement
  ).click();
  await expect
    .poll(() => document.querySelector('[role="listbox"]'))
    .not.toBeNull();
  const listbox = document.querySelector('[role="listbox"]')!;
  // Same band…
  const dialogPopup = document.querySelector('[data-slot="dialog-content"]')!;
  // Batch 3 of the shadcn reset put Select back on upstream's file: the band is written on the
  // POPUP (`relative isolate z-50`) and on its positioner, and neither carries a
  // `data-slot="select-positioner"` any more. The popup is the element the band belongs to.
  const selectPopup = document.querySelector('[data-slot="select-content"]')!;
  expect(getComputedStyle(selectPopup).zIndex).toBe(
    getComputedStyle(dialogPopup).zIndex,
  );
  // …but the select popup wins by DOM order: its centre is hittable.
  await expect.poll(() => hitTestInside(listbox)).toBe(true);
});

test("Popover inside Dialog: the popover paints above the dialog", async () => {
  const screen = await render(
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>With popover</DialogTitle>
        <Popover>
          <PopoverTrigger
            render={<Button variant="outline">Open popover</Button>}
          />
          <PopoverContent>Popover body content</PopoverContent>
        </Popover>
      </DialogContent>
    </Dialog>,
  );
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await screen.getByRole("button", { name: "Open popover" }).click();
  const popup = await screen.getByText("Popover body content").element();
  await expect.poll(() => hitTestInside(popup)).toBe(true);
});

test("Tooltip inside Sheet: the tooltip paints above the sheet", async () => {
  const screen = await render(
    <TooltipProvider delay={0}>
      <Sheet>
        <SheetTrigger>Open sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Sheet panel</SheetTitle>
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="outline">Hover me</Button>}
            />
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>
        </SheetContent>
      </Sheet>
    </TooltipProvider>,
  );
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  await screen.getByRole("button", { name: "Hover me" }).hover();
  const tip = await screen.getByText("Tooltip text").element();
  await expect.poll(() => hitTestInside(tip)).toBe(true);
});

test("nested Dialog paints above its parent Dialog", async () => {
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
  await screen.getByRole("button", { name: "Open outer" }).click();
  await screen.getByRole("button", { name: "Open inner" }).click();
  const inner = await screen.getByText("Inner dialog title").element();
  await expect.poll(() => hitTestInside(inner)).toBe(true);
});

// THE TOAST VIEWPORT SITS ONE BAND ABOVE THE OVERLAY BAND (OVL-15, MK 2026-09-22).
//
// Upstream ships the toast viewport at `fixed z-50`, the same band as the dialog backdrop and
// popup, so whichever portal `<body>` holds LAST paints on top — and a `<Toaster/>` mounted at the
// app root is always FIRST, because the dialog's portal is appended when it opens. The consequence
// was user-visible and measured here until 2026-09-22: a toast fired from inside a modal rendered
// behind the scrim.
//
// The viewport is now `z-60`. OVL-2 is untouched — every other surface stays in the single `z-50`
// band and DOM order still decides among them — so this is the one documented exception, and the
// test pins BOTH halves: the two computed bands, and the hit test that proves the ordering is
// actually what the user sees rather than what the z-index implies. The DOM-order assertion stays
// deliberately: it is what makes the z-60 claim meaningful, because the toaster still mounts first.
test("a toast fired from inside a modal paints above the scrim, on its own z-60 band", async () => {
  const screen = await render(
    <>
      <Toaster />
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Busy modal</DialogTitle>
          <Button
            onClick={() =>
              toast.add({ title: "Saved to workspace", timeout: 0 })
            }
          >
            Fire toast
          </Button>
        </DialogContent>
      </Dialog>
    </>,
  );
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await screen.getByRole("button", { name: "Fire toast" }).click();
  const toastEl = await screen.getByText("Saved to workspace").element();

  const viewport = document.querySelector<HTMLElement>(
    '[data-slot="toast-viewport"]',
  )!;
  const overlay = document.querySelector<HTMLElement>(
    '[data-slot="dialog-overlay"]',
  )!;
  expect(getComputedStyle(viewport).zIndex).toBe("60");
  expect(getComputedStyle(overlay).zIndex).toBe("50");

  // The toaster still mounts FIRST, so under one shared band the scrim would cover it. The higher
  // band is what overrides DOM order — assert the order, then that the toast is reachable anyway.
  const bodyIndex = (el: Element) =>
    [...document.body.children].findIndex((child) => child.contains(el));
  expect(bodyIndex(viewport)).toBeLessThan(bodyIndex(overlay));
  await expect.poll(() => hitTestInside(toastEl)).toBe(true);
});

// OVL-15: THE STACK GROWS AWAY FROM THE EDGE IT IS PINNED TO.
//
// `position` publishes `--toast-dir` on the viewport (`1` for a top corner, `-1` for a bottom one)
// and every vertical term in the root's transform is multiplied by it, so ONE set of transforms
// serves both. Class-name assertions live in the unit lane; that lane has no compiled CSS, so it
// cannot tell a working sign from a broken one. This measures the rendered geometry instead: fire
// two toasts and check which side of the frontmost the one behind it peeks out on.
async function peekOffset(position: "top-start" | "bottom-start") {
  const manager = createToastManager();
  await render(<Toaster toastManager={manager} position={position} />);

  // Earlier tests in this file leave their own viewport (and a `timeout: 0` toast) mounted, and
  // every toaster portals to <body> — so scope to THIS render's viewport, the most recent one.
  // A document-wide query would poll green on somebody else's toast and measure two unrelated
  // stacks, which is exactly how this test first passed while proving nothing.
  const viewports = [
    ...document.querySelectorAll('[data-slot="toast-viewport"]'),
  ];
  const own = viewports[viewports.length - 1]!;

  manager.add({ title: "First toast", timeout: 0 });
  manager.add({ title: "Second toast", timeout: 0 });

  const roots = () =>
    [...own.querySelectorAll('[data-slot="toast"]')] as HTMLElement[];
  await expect.poll(() => roots().length, { timeout: 3000 }).toBe(2);
  // Settle the enter transition before measuring — mid-animation the transform is in flight.
  await expect
    .poll(
      () =>
        roots().every((r) => getComputedStyle(r).transform !== "none") &&
        roots().every((r) => Number(getComputedStyle(r).opacity) >= 0.99),
      { timeout: 3000 },
    )
    .toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Base UI renders newest-first, so index 0 (the frontmost toast) is the first child and the
  // toast behind it is the second.
  const [front, behind] = roots().map((r) => r.getBoundingClientRect());
  expect(behind).toBeDefined();
  manager.close();
  manager.close();
  return behind!.top - front!.top;
}

test("OVL-15: a bottom-pinned stack peeks UPWARD from the frontmost toast", async () => {
  // dir = -1: the toast behind sits ABOVE the front one, so its top is smaller.
  expect(await peekOffset("bottom-start")).toBeLessThan(0);
});

test("OVL-15: a top-pinned stack peeks DOWNWARD from the frontmost toast", async () => {
  // dir = +1: the same expression, opposite sign — the toast behind sits BELOW.
  expect(await peekOffset("top-start")).toBeGreaterThan(0);
});

// OVL-15: AN ANCHORED TOAST IS PLACED BY THE POSITIONER, NOT BY THE CORNER STACK.
//
// This needs compiled CSS and a settle: `ToastPositioner` runs floating-ui, which computes
// asynchronously, so a measurement taken the moment the element appears reads an unpositioned
// 0,0 element and would "pass" against a corner-stacked toast. Measure after it settles, and
// assert against the ANCHOR rather than an absolute coordinate.
//
// It also pins the reason `Toast` reads `ToastAnchoredContext`: inside a positioner the root drops
// the stack recipe on its own, so an anchored composition needs no magic className. Without that,
// the root keeps `absolute bottom-0` plus the stack transform and lands ~80px off the positioner.
test("OVL-15: a toast inside a ToastPositioner is placed against its anchor", async () => {
  const manager = createToastManager();

  function AnchoredList({ anchor }: { anchor: Element | null }) {
    const { toasts } = useToastManager();
    return toasts.map((item) => (
      <ToastPositioner
        key={item.id}
        toast={item}
        anchor={anchor}
        side="top"
        sideOffset={8}
        className="w-56"
      >
        <Toast toast={item}>
          <ToastContent>
            <ToastTitle />
          </ToastContent>
          <ToastArrow />
        </Toast>
      </ToastPositioner>
    ));
  }

  function Fixture() {
    const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
    return (
      <ToastProvider toastManager={manager}>
        {/* Room on every side: pinned against a viewport edge, floating-ui SHIFTS to stay on
            screen and the toast is legitimately no longer centred — which would turn the
            assertion below into a test of the layout rather than of the anchoring. */}
        <div className="flex justify-center py-40">
          <Button
            ref={setAnchor}
            onClick={() => manager.add({ title: "Copied" })}
          >
            Copy link
          </Button>
        </div>
        <ToastPortal>
          <ToastViewport>
            <AnchoredList anchor={anchor} />
          </ToastViewport>
        </ToastPortal>
      </ToastProvider>
    );
  }

  const screen = await render(<Fixture />);
  const trigger = screen.getByRole("button", { name: "Copy link" });
  await trigger.click();
  await expect
    .poll(
      () => document.querySelector('[data-slot="toast-positioner"]') != null,
      { timeout: 3000 },
    )
    .toBe(true);
  // floating-ui positions asynchronously; without this the assertion is vacuous.
  await expect
    .poll(
      () => {
        const el = document.querySelector<HTMLElement>(
          '[data-slot="toast-positioner"]',
        );
        return el != null && getComputedStyle(el).transform !== "none";
      },
      { timeout: 3000 },
    )
    .toBe(true);

  const positioner = document.querySelector<HTMLElement>(
    '[data-slot="toast-positioner"]',
  )!;
  const anchorEl = (await trigger.element()) as HTMLElement;
  const p = positioner.getBoundingClientRect();
  const a = anchorEl.getBoundingClientRect();

  // Centred on the anchor — the whole point of anchoring. `side` may flip to avoid a collision,
  // so the vertical assertion is adjacency, not "above".
  expect(Math.abs(p.left + p.width / 2 - (a.left + a.width / 2))).toBeLessThan(
    2,
  );
  expect(
    Math.min(Math.abs(p.top - a.bottom), Math.abs(p.bottom - a.top)),
  ).toBeLessThan(24);

  // The root inside carries no stack transform, so it sits ON the positioner rather than offset
  // from it — this is what `ToastAnchoredContext` buys, and it fails loudly if that regresses.
  const root = positioner.querySelector<HTMLElement>('[data-slot="toast"]')!;
  const r = root.getBoundingClientRect();
  expect(Math.abs(r.top - p.top)).toBeLessThan(2);
  expect(document.querySelector('[data-slot="toast-arrow"]')).not.toBeNull();
  manager.close();
});
