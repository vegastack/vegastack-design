import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import { DirectionProvider } from "./direction";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

/**
 * A Sheet is Base UI's Dialog with edge-anchored positioning. This lane compiles no CSS, so the
 * edge itself is asserted as the `data-side` contract every inset, border and slide offset branches
 * on; `test/geometry.browser.test.tsx` measures the rendered panel.
 */

/** Upstream's four edges, in upstream's order. */
const SIDES = ["top", "right", "bottom", "left"] as const;

function Subject({
  contentProps,
  ...rootProps
}: {
  contentProps?: React.ComponentProps<typeof SheetContent>;
} & React.ComponentProps<typeof Sheet>) {
  return (
    <Sheet {...rootProps}>
      <SheetTrigger>Open sheet</SheetTrigger>
      <SheetContent {...contentProps}>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose>Cancel</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const bySlot = (slot: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);

/** Poll until the panel has left the DOM (it outlives the state change by an exit transition). */
async function waitForClosed() {
  await expect
    .poll(() => document.querySelector('[role="dialog"]'), { timeout: 2000 })
    .toBeNull();
}

/** The nearest ancestor (self included) whose native `inert` property is true. */
function inertOwner(start: Element | null): HTMLElement | null {
  for (let node = start; node; node = node.parentElement) {
    if (node instanceof HTMLElement && node.inert) return node;
  }
  return null;
}

test("renders the trigger and stays closed until it is used (Usage)", async () => {
  const screen = await render(<Subject />);
  await expect
    .element(screen.getByRole("button", { name: "Open sheet" }))
    .toBeInTheDocument();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("opening renders every exported part (Usage, Composition)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  for (const slot of [
    "sheet-trigger",
    "sheet-overlay",
    "sheet-content",
    "sheet-header",
    "sheet-title",
    "sheet-description",
    "sheet-footer",
    "sheet-close",
  ]) {
    expect(bySlot(slot), `missing [data-slot="${slot}"]`).not.toBeNull();
  }
  const portal = bySlot("sheet-content")!.closest("[data-base-ui-portal]");
  expect(portal).not.toBeNull();
  expect(screen.container.contains(portal)).toBe(false);
  // The footer is pinned by `mt-auto` inside the panel's flex column, not by a sticky offset.
  expect(bySlot("sheet-footer")!.className).toContain("mt-auto");
  expect(bySlot("sheet-content")!.className).toContain("flex-col");
});

test("title and description are wired to the panel (Usage)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  const panel = screen.getByRole("dialog").element() as HTMLElement;
  expect(document.getElementById(panel.getAttribute("aria-labelledby")!)).toBe(
    bySlot("sheet-title"),
  );
  expect(document.getElementById(panel.getAttribute("aria-describedby")!)).toBe(
    bySlot("sheet-description"),
  );
});

test("a SheetClose in the footer closes the panel (Composition)", async () => {
  const screen = await render(
    <Subject contentProps={{ showCloseButton: false }} />,
  );
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const close = bySlot("sheet-close")!;
  expect(bySlot("sheet-footer")!.contains(close)).toBe(true);
  close.click();
  await waitForClosed();
});

/*
 * ONE render, every side, opened in turn. Repeated `render()` calls accumulate in the page and the
 * locators are page-scoped, so a loop that re-renders the same subject leaves several matching
 * triggers behind and Playwright fails on strict mode rather than on the component. Only one sheet
 * is open at a time, because each is modal.
 */
test("every upstream side publishes its own data-side (Side)", async () => {
  const screen = await render(
    <div>
      {SIDES.map((side) => (
        <Sheet key={side}>
          <SheetTrigger>Open {side}</SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Panel on the {side}</SheetTitle>
              <SheetDescription>Anchored to the {side} edge.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>Cancel</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>,
  );

  for (const side of SIDES) {
    await screen.getByRole("button", { name: `Open ${side}` }).click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
    const panel = bySlot("sheet-content")!;
    expect(panel.getAttribute("data-side"), `side "${side}"`).toBe(side);
    // Every inset, border and slide offset is a branch on that one attribute.
    expect(panel.className).toContain(`data-[side=${side}]:`);
    bySlot("sheet-close")!.click();
    await waitForClosed();
  }
});

test("right is the default edge and caps its width (Side)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const panel = bySlot("sheet-content")!;
  expect(panel.getAttribute("data-side")).toBe("right");
  expect(panel.className).toContain("data-[side=right]:sm:max-w-sm");
  expect(panel.className).toContain("data-[side=left]:sm:max-w-sm");
  // Top and bottom size to their content — there is no cap class for them to inherit.
  expect(panel.className).toContain("data-[side=top]:h-auto");
  expect(panel.className).toContain("data-[side=bottom]:h-auto");
});

test("the panel appends a corner close button by default (No Close Button)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // Two closes: the footer's own "Cancel", and the corner control the panel appends last.
  const closes = [
    ...bySlot("sheet-content")!.querySelectorAll<HTMLElement>(
      '[data-slot="sheet-close"]',
    ),
  ];
  expect(closes.length).toBe(2);
  const corner = closes[closes.length - 1]!;
  expect(bySlot("sheet-footer")!.contains(corner)).toBe(false);
  expect(corner.textContent).toContain("Close");
  corner.click();
  await waitForClosed();
});

test("showCloseButton={false} removes it and nothing replaces it (No Close Button)", async () => {
  const screen = await render(
    <Subject contentProps={{ showCloseButton: false }} />,
  );
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // Only the footer's own control is left — the panel adds no replacement of its own.
  const closes = [
    ...bySlot("sheet-content")!.querySelectorAll<HTMLElement>(
      '[data-slot="sheet-close"]',
    ),
  ];
  expect(closes.length).toBe(1);
  expect(bySlot("sheet-footer")!.contains(closes[0]!)).toBe(true);
});

test("RTL: the panel mirrors its direction and its slide offsets (RTL)", async () => {
  // The panel portals to `<body>`, so a `dir` on an ancestor of the TRIGGER never reaches it —
  // which is why upstream's own example hands `dir` to `SheetContent`, and mirrors the anchor.
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Subject contentProps={{ side: "left", dir: "rtl" }} />
      </div>
    </DirectionProvider>,
  );
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const panel = bySlot("sheet-content")!;
  expect(getComputedStyle(panel).direction).toBe("rtl");
  expect(panel.getAttribute("data-side")).toBe("left");
  // The transform has an explicit `rtl:` counterpart, because a translate is not a logical property.
  expect(panel.className).toContain(
    "rtl:data-[side=left]:data-starting-style:-translate-x-[-2.5rem]",
  );
  // The edge borders are logical, so they need no counterpart.
  expect(panel.className).toContain("data-[side=left]:border-e");
});

test("OVL-13: the portal subtree carries a display:contents host around the surface", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const panel = bySlot("sheet-content")!;
  const portal = panel.closest<HTMLElement>("[data-base-ui-portal]")!;
  const host = panel.closest<HTMLElement>(".contents")!;
  expect(host).not.toBeNull();
  expect(portal.contains(host)).toBe(true);
  expect(host.contains(bySlot("sheet-overlay"))).toBe(true);
  expect(host.className).toBe("contents");
});

test("OVL-13: a nested theme scope lands on that host, inside the portal", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <Subject />
    </InternalThemeScopeProvider>,
  );
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const panel = bySlot("sheet-content")!;
  const portal = panel.closest<HTMLElement>("[data-base-ui-portal]")!;
  const scoped = portal.querySelector<HTMLElement>(".vs-scope-under-test");
  expect(scoped).not.toBeNull();
  expect(scoped!.className).toContain("contents");
  expect(scoped!.contains(panel)).toBe(true);
});

test("A11Y-9: a modal sheet makes the background natively inert and restores it", async () => {
  const outside = document.createElement("button");
  outside.textContent = "Outside action";
  document.body.prepend(outside);
  try {
    const screen = await render(<Subject />);
    await screen.getByRole("button", { name: "Open sheet" }).click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
    await expect.poll(() => inertOwner(outside) !== null).toBe(true);
    bySlot("sheet-close")!.click();
    await waitForClosed();
    await expect.poll(() => inertOwner(outside)).toBeNull();
  } finally {
    outside.remove();
  }
});

test("A11Y-9: modal={false} keeps the background interactive", async () => {
  const outside = document.createElement("button");
  outside.textContent = "Outside action";
  document.body.prepend(outside);
  try {
    // Both sheets share this one outside element, so the modal pass PROVES the element is markable
    // before the non-modal pass claims it was left alone.
    const screen = await render(
      <div>
        <Subject />
        <Sheet modal={false}>
          <SheetTrigger>Open non-modal</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Non-modal</SheetTitle>
              <SheetDescription>The page stays usable.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>,
    );

    await screen.getByRole("button", { name: "Open sheet" }).click();
    await expect.poll(() => inertOwner(outside) !== null).toBe(true);
    bySlot("sheet-close")!.click();
    await waitForClosed();
    await expect.poll(() => inertOwner(outside)).toBeNull();

    await screen.getByRole("button", { name: "Open non-modal" }).click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
    await expect.poll(() => inertOwner(outside)).toBeNull();
  } finally {
    outside.remove();
  }
});

test("FOC-1/FOC-6: nothing the sheet renders carries a focus glow", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // `getAttribute("class")` rather than `.className`: on an SVG element the latter is an
  // SVGAnimatedString, which would stringify to something no pattern here could ever match.
  const offenders = [...document.querySelectorAll("*")]
    .map((element) => element.getAttribute("class") ?? "")
    .filter((classes) =>
      /\bring-3\b|ring-\[3px\]|focus-visible:ring-/.test(classes),
    );
  expect(offenders).toEqual([]);
});

test("Escape closes the panel (Usage)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await waitForClosed();
});

test("no a11y violations — closed", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // The panel portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — open and non-modal", async () => {
  const screen = await render(<Subject modal={false} />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
