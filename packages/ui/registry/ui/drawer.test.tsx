import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";

/** Upstream's four swipe directions, and the axis each one belongs to. */
const DIRECTIONS = [
  ["down", "y"],
  ["up", "y"],
  ["left", "x"],
  ["right", "x"],
] as const;

/** Snap points: a compact peek, a half sheet, and the full-height point (`1`). */
const SNAP_POINTS = ["10rem", "20rem", 1] as const;

const bySlot = (slot: string) =>
  document.querySelector(`[data-slot="${slot}"]`) as HTMLElement | null;

const popup = () => bySlot("drawer-popup");

function Example({
  contentProps,
  children,
  ...rootProps
}: {
  contentProps?: React.ComponentProps<typeof DrawerContent>;
  // Narrowed from the root's own `children`, which also admits Base UI's payload render function.
  children?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Drawer>, "children">) {
  return (
    <Drawer {...rootProps}>
      <DrawerTrigger>Open Drawer</DrawerTrigger>
      <DrawerContent {...contentProps}>
        <DrawerHeader>
          <DrawerTitle>Pick a delivery time</DrawerTitle>
          <DrawerDescription>
            We&apos;ll prepare your order as soon as possible.
          </DrawerDescription>
        </DrawerHeader>
        {children ?? <div className="p-4">Body</div>}
        <DrawerFooter>
          <DrawerClose>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const openDrawer = async (screen: {
  getByRole: (role: string, options: { name: string }) => { click: () => void };
}) => {
  await userEvent.click(
    screen.getByRole("button", { name: "Open Drawer" }) as never,
  );
  await expect.poll(popup).not.toBeNull();
};

/**
 * Fire a native click on a control that lives INSIDE the portal.
 *
 * A trusted Playwright click cannot reach one in this lane: no CSS is compiled, so Base UI's
 * `data-base-ui-inert` backdrop has no stacking context to sit behind and covers the popup, and
 * Playwright refuses to click through it. The same pattern is what `dialog.test.tsx` uses.
 */
function clickInPortal(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  expect(
    element,
    `expected a "${selector}" element in the portal`,
  ).not.toBeNull();
  element!.click();
}

// ── renders, and each exported part renders ─────────────────────────────────────────────────────

test("renders a trigger carrying its data-slot, closed (Usage)", async () => {
  const screen = await render(<Example />);
  const trigger = screen.getByRole("button", { name: "Open Drawer" });
  await expect.element(trigger).toHaveAttribute("data-slot", "drawer-trigger");
  expect(popup()).toBeNull();
});

test("opening portals a labelled dialog carrying every part (Usage, Composition)", async () => {
  const screen = await render(<Example showSwipeHandle />);
  await openDrawer(screen);

  for (const slot of [
    "drawer-overlay",
    "drawer-viewport",
    "drawer-popup",
    "drawer-swipe-handle",
    "drawer-content",
    "drawer-header",
    "drawer-title",
    "drawer-description",
    "drawer-footer",
    "drawer-close",
  ]) {
    expect(bySlot(slot), `missing [data-slot="${slot}"]`).not.toBeNull();
  }

  const content = popup() as HTMLElement;
  expect(content.getAttribute("role")).toBe("dialog");
  // Portaled: the popup is not inside the component's own container subtree.
  expect(screen.container.contains(content)).toBe(false);
  expect(
    document.getElementById(content.getAttribute("aria-labelledby") ?? "")
      ?.textContent,
  ).toBe("Pick a delivery time");
});

test("DrawerPortal, DrawerOverlay and DrawerSwipeHandle render standalone (Composition)", async () => {
  // The three low-level parts `DrawerContent` composes are exported for callers that need them
  // directly; this mounts them by hand to prove the export is usable, not merely present.
  await render(
    <Drawer defaultOpen>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerSwipeHandle />
      </DrawerPortal>
    </Drawer>,
  );
  await expect.poll(() => bySlot("drawer-overlay")).not.toBeNull();
  expect(bySlot("drawer-swipe-handle")).not.toBeNull();
});

test("Escape closes the drawer and returns focus to the trigger (Usage)", async () => {
  const screen = await render(<Example />);
  const trigger = screen.getByRole("button", { name: "Open Drawer" });
  await openDrawer(screen);

  await userEvent.keyboard("{Escape}");
  // `aria-expanded`/presence race: the popup plays an exit animation, so focus is the stable signal.
  await expect.poll(() => document.activeElement).toBe(trigger.element());
});

// ── one behaviour test per upstream docs section ────────────────────────────────────────────────

test("className and the axis variants land on the popup (Custom Sizes)", async () => {
  const screen = await render(
    <Example
      contentProps={{
        className: "data-[swipe-axis=x]:w-96 data-[swipe-axis=y]:max-h-[50vh]",
      }}
    />,
  );
  await openDrawer(screen);
  const content = popup() as HTMLElement;
  expect(content.className).toContain("data-[swipe-axis=y]:max-h-[50vh]");
  expect(content.getAttribute("data-swipe-axis")).toBe("y");
});

test("style variables set on DrawerContent reach the popup (Styling)", async () => {
  const screen = await render(
    <Example
      contentProps={{
        style: {
          "--drawer-inset": "0.75rem",
        } as React.CSSProperties,
      }}
    />,
  );
  await openDrawer(screen);
  const content = popup() as HTMLElement;
  expect(content.style.getPropertyValue("--drawer-inset")).toBe("0.75rem");
});

test.each(DIRECTIONS)(
  "swipeDirection=%s sets data-swipe-direction and data-swipe-axis=%s (Position)",
  async (swipeDirection, axis) => {
    const screen = await render(<Example swipeDirection={swipeDirection} />);
    await openDrawer(screen);
    const content = popup() as HTMLElement;
    expect(content.getAttribute("data-swipe-direction")).toBe(swipeDirection);
    expect(content.getAttribute("data-swipe-axis")).toBe(axis);
  },
);

test("showSwipeHandle renders an aria-hidden handle (Swipe Handle)", async () => {
  const screen = await render(<Example showSwipeHandle />);
  await openDrawer(screen);
  const handle = bySlot("drawer-swipe-handle") as HTMLElement;
  expect(handle).not.toBeNull();
  expect(handle.getAttribute("aria-hidden")).toBe("true");
  // Pointer-only decoration: never in the tab order, never in the accessibility tree.
  expect(handle.tabIndex).toBeLessThan(0);
});

test("without showSwipeHandle there is no handle (Swipe Handle)", async () => {
  const screen = await render(<Example />);
  await openDrawer(screen);
  expect(bySlot("drawer-swipe-handle")).toBeNull();
});

test("a nested drawer marks its parent data-nested-drawer-open (Nested)", async () => {
  const screen = await render(
    <Drawer>
      <DrawerTrigger>Open Drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Parent</DrawerTitle>
          <DrawerDescription>The outer drawer.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Drawer>
            <DrawerTrigger>Open Nested Drawer</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Nested</DrawerTitle>
                <DrawerDescription>
                  The parent stays mounted behind this one.
                </DrawerDescription>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>,
  );
  await openDrawer(screen);
  const parent = popup() as HTMLElement;
  expect(parent.hasAttribute("data-nested-drawer-open")).toBe(false);

  clickInPortal('[data-slot="drawer-footer"] [data-slot="drawer-trigger"]');
  await expect
    .poll(() => document.querySelectorAll('[data-slot="drawer-popup"]').length)
    .toBe(2);
  // The parent stays mounted, and takes the marker the stack styling reads.
  await expect
    .poll(() => parent.hasAttribute("data-nested-drawer-open"))
    .toBe(true);
  expect(document.body.contains(parent)).toBe(true);
});

test("modal={false} renders no overlay and leaves the page interactive (Non Modal)", async () => {
  const outside = document.createElement("button");
  outside.textContent = "Outside action";
  let clicks = 0;
  outside.addEventListener("click", () => {
    clicks += 1;
  });
  document.body.prepend(outside);
  try {
    const screen = await render(
      <Example modal={false} disablePointerDismissal />,
    );
    await openDrawer(screen);
    expect(bySlot("drawer-overlay")).toBeNull();
    expect(bySlot("drawer-viewport")?.getAttribute("data-modal")).toBe("false");

    outside.click();
    expect(clicks).toBe(1);
    // `disablePointerDismissal`: an outside interaction must not close the drawer.
    expect(popup()).not.toBeNull();
  } finally {
    outside.remove();
  }
});

// ── Snap Points ─────────────────────────────────────────────────────────────────────────────────

test("a snapPoints drawer marks the popup AND the overlay, and opens at the first point (Snap Points)", async () => {
  const screen = await render(<Example snapPoints={[...SNAP_POINTS]} />);
  await openDrawer(screen);
  const content = popup() as HTMLElement;
  expect(content.hasAttribute("data-snap-points")).toBe(true);
  expect(bySlot("drawer-overlay")?.hasAttribute("data-snap-points")).toBe(true);
  // The snap-point translation is published as a CSS variable on the popup.
  expect(content.style.getPropertyValue("--drawer-snap-point-offset")).not.toBe(
    "",
  );
  // Opened at `SNAP_POINTS[0]` ("10rem"), NOT at the full point — `data-expanded` is set only at `1`.
  expect(content.hasAttribute("data-expanded")).toBe(false);
});

test("a drawer without snapPoints carries neither marker (Snap Points)", async () => {
  const screen = await render(<Example />);
  await openDrawer(screen);
  expect((popup() as HTMLElement).hasAttribute("data-snap-points")).toBe(false);
  expect(bySlot("drawer-overlay")?.hasAttribute("data-snap-points")).toBe(
    false,
  );
});

test("defaultSnapPoint={1} opens expanded (Snap Points)", async () => {
  const screen = await render(
    <Example snapPoints={[...SNAP_POINTS]} defaultSnapPoint={1} />,
  );
  await openDrawer(screen);
  await expect
    .poll(() => (popup() as HTMLElement).hasAttribute("data-expanded"))
    .toBe(true);
});

test("the root accepts a snapPoints array with a controlled active snap point (Snap Points)", async () => {
  const reported: Array<string | number | null> = [];

  function Controlled() {
    const [snapPoint, setSnapPoint] = React.useState<string | number | null>(
      SNAP_POINTS[0],
    );
    return (
      <Drawer
        defaultOpen
        snapPoints={[...SNAP_POINTS]}
        snapPoint={snapPoint}
        onSnapPointChange={(next) => {
          reported.push(next);
          setSnapPoint(next);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Snap points</DrawerTitle>
            <DrawerDescription>Drag or press to snap.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <button
              type="button"
              data-testid="expand"
              onClick={() => setSnapPoint(1)}
            >
              Expand
            </button>
            <span data-testid="active">{String(snapPoint)}</span>
          </div>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  await render(<Controlled />);
  await expect.poll(popup).not.toBeNull();
  const content = popup() as HTMLElement;

  // The controlled value is what the drawer uses: the compact point is not the expanded one.
  expect(document.querySelector('[data-testid="active"]')?.textContent).toBe(
    "10rem",
  );
  expect(content.hasAttribute("data-expanded")).toBe(false);

  clickInPortal('[data-testid="expand"]');
  await expect
    .poll(() => (popup() as HTMLElement).hasAttribute("data-expanded"))
    .toBe(true);
  expect(document.querySelector('[data-testid="active"]')?.textContent).toBe(
    "1",
  );

  // Closing reports the snap point back through `onSnapPointChange` — the drawer resets to the
  // first point, and the controlled owner is told rather than being silently overruled.
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => reported.at(-1)).toBe(SNAP_POINTS[0]);
});

// ── Responsive ──────────────────────────────────────────────────────────────────────────────────

test("one open state drives a Drawer or a Dialog at a breakpoint (Responsive)", async () => {
  function Responsive({ isDesktop }: { isDesktop: boolean }) {
    if (isDesktop) {
      return (
        <Dialog open>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Desktop surface.</DialogDescription>
          </DialogContent>
        </Dialog>
      );
    }
    return (
      <Drawer open>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>Mobile surface.</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );
  }

  const narrow = await render(<Responsive isDesktop={false} />);
  await expect.poll(popup).not.toBeNull();
  expect(bySlot("dialog-content")).toBeNull();
  await narrow.unmount();
  await expect.poll(popup).toBeNull();

  await render(<Responsive isDesktop />);
  await expect.poll(() => bySlot("dialog-content")).not.toBeNull();
  expect(popup()).toBeNull();
});

// ── one assertion per decision ID in the patch header ───────────────────────────────────────────

test("A11Y-9: a modal drawer makes the background natively inert, and restores it on close", async () => {
  const outside = document.createElement("button");
  outside.textContent = "Outside action";
  document.body.prepend(outside);
  try {
    const screen = await render(<Example />);
    await openDrawer(screen);
    await expect.poll(() => outside.inert).toBe(true);

    await userEvent.keyboard("{Escape}");
    await expect.poll(() => outside.inert).toBe(false);
  } finally {
    outside.remove();
  }
});

test.each([false, "trap-focus"] as const)(
  "A11Y-9: modal=%s does NOT make the background inert",
  async (modal) => {
    const outside = document.createElement("button");
    outside.textContent = "Outside action";
    document.body.prepend(outside);
    try {
      const screen = await render(<Example modal={modal} />);
      await openDrawer(screen);
      expect(outside.inert).toBe(false);
    } finally {
      outside.remove();
    }
  },
);

test("OVL-13: the portal subtree carries a display:contents theme-scope host", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-test-scope">
      <Example />
    </InternalThemeScopeProvider>,
  );
  await openDrawer(screen);
  const portal = (popup() as HTMLElement).closest("[data-base-ui-portal]");
  expect(portal).not.toBeNull();
  const host = portal?.querySelector(".vs-test-scope") as HTMLElement;
  expect(host).not.toBeNull();
  expect(host.className).toContain("contents");
  // The host is a real ancestor of the popup inside the portal, not a sibling.
  expect(host.contains(popup())).toBe(true);
});

test("OVL-13: with no scope in context the host still wraps the portal in display:contents", async () => {
  const screen = await render(<Example />);
  await openDrawer(screen);
  const portal = (popup() as HTMLElement).closest(
    "[data-base-ui-portal]",
  ) as HTMLElement;
  const host = portal.querySelector(".contents") as HTMLElement;
  expect(host).not.toBeNull();
  expect(host.className).not.toContain("vs-test-scope");
  expect(host.contains(popup())).toBe(true);
});

test("FOC-1/FOC-6: nothing rendered carries a focus glow", async () => {
  const screen = await render(<Example showSwipeHandle />);
  await openDrawer(screen);
  const elements = [
    ...screen.container.querySelectorAll<HTMLElement>("*"),
    ...document.querySelectorAll<HTMLElement>("[data-base-ui-portal] *"),
  ];
  for (const element of elements) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]/);
    expect(classes).not.toContain("focus-visible:ring-");
  }
});

// ── a11y, per distinct state ────────────────────────────────────────────────────────────────────

test("no a11y violations — closed", async () => {
  const screen = await render(<Example />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Example showSwipeHandle />);
  await openDrawer(screen);
  // The popup portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — non-modal", async () => {
  const screen = await render(<Example modal={false} />);
  await openDrawer(screen);
  await expectNoA11yViolations(document.body);
});
