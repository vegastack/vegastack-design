import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import { DirectionProvider } from "./direction";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

/**
 * This lane compiles no CSS, so anything the stylesheet would decide (the popup's width cap, the
 * footer's band, whether a scroller actually overflows) is asserted as the class contract the
 * component publishes; `test/geometry.browser.test.tsx` measures the rendered result.
 */

function Subject({
  contentProps,
  footerProps,
  ...rootProps
}: {
  contentProps?: React.ComponentProps<typeof DialogContent>;
  footerProps?: React.ComponentProps<typeof DialogFooter>;
} & React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...rootProps}>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent {...contentProps}>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter {...footerProps}>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const bySlot = (slot: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);

/** Fire a native click on a portaled control identified by its `data-slot`. */
function clickBySlot(slot: string) {
  const element = bySlot(slot);
  expect(element, `expected a [data-slot="${slot}"] element`).not.toBeNull();
  element!.click();
}

/** Poll until the popup has left the DOM (it outlives the state change by an exit animation). */
async function waitForClosed() {
  await expect
    .poll(() => document.querySelector('[role="dialog"]'), { timeout: 2000 })
    .toBeNull();
}

/**
 * The nearest ancestor (self included) whose native `inert` property is true. Base UI marks the
 * OUTSIDE ROOTS, not each focusable inside them, so "is this element inert" is a question about
 * its ancestor chain.
 */
function inertOwner(start: Element | null): HTMLElement | null {
  for (let node = start; node; node = node.parentElement) {
    if (node instanceof HTMLElement && node.inert) return node;
  }
  return null;
}

test("renders the trigger and stays closed until it is used (Usage)", async () => {
  const screen = await render(<Subject />);
  await expect
    .element(screen.getByRole("button", { name: "Open dialog" }))
    .toBeInTheDocument();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("opening renders every exported part (Usage, Composition)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  for (const slot of [
    "dialog-trigger",
    "dialog-overlay",
    "dialog-content",
    "dialog-header",
    "dialog-title",
    "dialog-description",
    "dialog-footer",
    "dialog-close",
  ]) {
    expect(bySlot(slot), `missing [data-slot="${slot}"]`).not.toBeNull();
  }
  // DialogPortal has no slot of its own on the DOM — Base UI's portal element is the host, and the
  // `display: contents` wrapper the patch adds lives inside it (see the OVL-13 tests).
  const portal = bySlot("dialog-content")!.closest("[data-base-ui-portal]");
  expect(portal).not.toBeNull();
  expect(screen.container.contains(portal)).toBe(false);
});

test("title and description are wired to the popup (Usage)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  const popup = screen.getByRole("dialog").element() as HTMLElement;
  expect(document.getElementById(popup.getAttribute("aria-labelledby")!)).toBe(
    bySlot("dialog-title"),
  );
  expect(document.getElementById(popup.getAttribute("aria-describedby")!)).toBe(
    bySlot("dialog-description"),
  );
});

test("Escape closes the dialog (Usage)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await waitForClosed();
});

test("a DialogClose given a render prop closes the dialog (Custom Close Button)", async () => {
  const screen = await render(
    <Dialog>
      <DialogTrigger>Share</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>Anyone with this link can view.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<button type="button" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  );
  await screen.getByRole("button", { name: "Share" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const close = bySlot("dialog-close")!;
  expect(close.tagName).toBe("BUTTON");
  close.click();
  await waitForClosed();
});

/*
 * One render per test. Repeated `render()` calls accumulate in the page and the locators are
 * page-scoped, so a second render of the same subject leaves two matching triggers behind and
 * Playwright fails on strict mode rather than on the component.
 */
test("the content appends a corner close button by default (No Close Button)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // Two closes: the footer's own "Cancel", and the corner control the content appends last.
  const closes = [
    ...bySlot("dialog-content")!.querySelectorAll<HTMLElement>(
      '[data-slot="dialog-close"]',
    ),
  ];
  expect(closes.length).toBe(2);
  const corner = closes[closes.length - 1]!;
  expect(bySlot("dialog-footer")!.contains(corner)).toBe(false);
  expect(corner.textContent).toContain("Close");
  corner.click();
  await waitForClosed();
});

test("showCloseButton={false} drops it and the footer can opt into its own (No Close Button)", async () => {
  const screen = await render(
    <Subject
      contentProps={{ showCloseButton: false }}
      footerProps={{ showCloseButton: true }}
    />,
  );
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // No corner control. The footer's opt-in Close and the footer's own child are what remain, and
  // both sit inside the band.
  const closes = [
    ...bySlot("dialog-content")!.querySelectorAll<HTMLElement>(
      '[data-slot="dialog-close"]',
    ),
  ];
  const footer = bySlot("dialog-footer")!;
  expect(closes.length).toBe(1);
  expect(footer.contains(closes[0]!)).toBe(true);
  // DialogFooter's own close is rendered after its children and is not a DialogClose slot; it is
  // the outline Button the band appends.
  const bandClose = [...footer.querySelectorAll("button")].find((button) =>
    button.textContent?.includes("Close"),
  );
  expect(bandClose).toBeDefined();
  bandClose!.click();
  await waitForClosed();
});

test("the footer is an edge-to-edge band, not content (Sticky Footer)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const footer = bySlot("dialog-footer")!;
  expect(bySlot("dialog-content")!.contains(footer)).toBe(true);
  expect(footer.className).toContain("bg-muted/50");
  expect(footer.className).toContain("-mx-4");
  expect(footer.className).toContain("-mb-4");
  expect(footer.className).toContain("border-t");
});

test("the popup does not scroll — the caller's element does (Scrollable Content)", async () => {
  const screen = await render(
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scrollable Content</DialogTitle>
          <DialogDescription>
            A dialog with scrollable content.
          </DialogDescription>
        </DialogHeader>
        <div
          data-testid="scroller"
          className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4"
        >
          {Array.from({ length: 10 }).map((_, index) => (
            <p key={index}>Paragraph {index}</p>
          ))}
        </div>
      </DialogContent>
    </Dialog>,
  );
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const popup = bySlot("dialog-content")!;
  expect(popup.className).not.toContain("overflow-y-auto");
  const scroller = document.querySelector<HTMLElement>(
    '[data-testid="scroller"]',
  )!;
  expect(popup.contains(scroller)).toBe(true);
  expect(scroller.className).toContain("overflow-y-auto");
  expect(scroller.querySelectorAll("p").length).toBe(10);
});

test("RTL: the portaled popup takes the direction it is handed (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Subject contentProps={{ dir: "rtl" }} />
      </div>
    </DirectionProvider>,
  );
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const popup = bySlot("dialog-content")!;
  expect(getComputedStyle(popup).direction).toBe("rtl");
  // The mirrored offset is written as an `rtl:` counterpart, not a second class list.
  expect(popup.className).toContain("rtl:translate-x-1/2");
  // The position and the close button are logical, so they need no counterpart.
  expect(popup.className).toContain("start-1/2");
});

test("RTL: the popup leaves the rtl subtree, which is why dir is passed (RTL)", async () => {
  // This is the mechanism behind the example above: `DialogContent` portals to `<body>`, so a `dir`
  // on an ancestor of the TRIGGER never reaches the popup and has to be handed to the content.
  const screen = await render(
    <div dir="rtl">
      <Subject />
    </div>,
  );
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const popup = bySlot("dialog-content")!;
  expect(screen.container.contains(popup)).toBe(false);
  expect(getComputedStyle(popup).direction).toBe("ltr");
});

test("OVL-13: the portal subtree carries a display:contents host around the surface", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const popup = bySlot("dialog-content")!;
  const portal = popup.closest<HTMLElement>("[data-base-ui-portal]")!;
  const host = popup.closest<HTMLElement>(".contents")!;
  expect(host).not.toBeNull();
  expect(portal.contains(host)).toBe(true);
  expect(host.contains(bySlot("dialog-overlay"))).toBe(true);
  // With no scope in the tree the host carries nothing but `contents`.
  expect(host.className).toBe("contents");
});

test("OVL-13: a nested theme scope lands on that host, inside the portal", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <Subject />
    </InternalThemeScopeProvider>,
  );
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const popup = bySlot("dialog-content")!;
  const portal = popup.closest<HTMLElement>("[data-base-ui-portal]")!;
  const scoped = portal.querySelector<HTMLElement>(".vs-scope-under-test");
  expect(scoped).not.toBeNull();
  expect(scoped!.className).toContain("contents");
  expect(scoped!.contains(popup)).toBe(true);
});

test("A11Y-9: a modal dialog makes the background natively inert and restores it", async () => {
  const outside = document.createElement("button");
  outside.textContent = "Outside action";
  document.body.prepend(outside);
  try {
    const screen = await render(<Subject />);
    await screen.getByRole("button", { name: "Open dialog" }).click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
    await expect.poll(() => inertOwner(outside) !== null).toBe(true);
    clickBySlot("dialog-close");
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
    // Both dialogs share this one outside element, so the modal pass PROVES the element is
    // markable before the non-modal pass claims it was left alone.
    const screen = await render(
      <div>
        <Subject />
        <Dialog modal={false}>
          <DialogTrigger>Open non-modal</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Non-modal</DialogTitle>
              <DialogDescription>The page stays usable.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>,
    );

    await screen.getByRole("button", { name: "Open dialog" }).click();
    await expect.poll(() => inertOwner(outside) !== null).toBe(true);
    clickBySlot("dialog-close");
    await waitForClosed();
    await expect.poll(() => inertOwner(outside)).toBeNull();

    await screen.getByRole("button", { name: "Open non-modal" }).click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
    await expect.poll(() => inertOwner(outside)).toBeNull();
  } finally {
    outside.remove();
  }
});

test("FOC-1/FOC-6: nothing the dialog renders carries a focus glow", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
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

test("no a11y violations — closed", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — open and non-modal", async () => {
  const screen = await render(<Subject modal={false} />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
