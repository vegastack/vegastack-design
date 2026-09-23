import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { BluetoothIcon } from "lucide-react";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import { DirectionProvider } from "./direction";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

/**
 * This lane compiles no CSS: the size tiers, the header's media column and the footer's two-column
 * layout are asserted as the `data-size`/`data-slot` contract the component publishes, and
 * `test/geometry.browser.test.tsx` measures what the stylesheet then does with it.
 */

function Subject({
  contentProps,
  media = false,
  ...rootProps
}: {
  contentProps?: React.ComponentProps<typeof AlertDialogContent>;
  media?: boolean;
} & React.ComponentProps<typeof AlertDialog>) {
  return (
    <AlertDialog {...rootProps}>
      <AlertDialogTrigger>Show dialog</AlertDialogTrigger>
      <AlertDialogContent {...contentProps}>
        <AlertDialogHeader>
          {media && (
            <AlertDialogMedia>
              <BluetoothIcon />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
    .poll(() => document.querySelector('[role="alertdialog"]'), {
      timeout: 2000,
    })
    .toBeNull();
}

/** The nearest ancestor (self included) whose native `inert` property is true. */
function inertOwner(start: Element | null): HTMLElement | null {
  for (let node = start; node; node = node.parentElement) {
    if (node instanceof HTMLElement && node.inert) return node;
  }
  return null;
}

/** BRD-1: a real 1px `border border-border`, never upstream's `ring-1 ring-foreground/10` outline. */
function expectBorderNotRing(element: HTMLElement) {
  const tokens = element.className.split(/\s+/);
  expect(tokens).toContain("border");
  expect(tokens).toContain("border-border");
  expect(element.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
}

test("renders the trigger and stays closed until it is used (Usage)", async () => {
  const screen = await render(<Subject />);
  await expect
    .element(screen.getByRole("button", { name: "Show dialog" }))
    .toBeInTheDocument();
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
});

test("opening renders every exported part (Usage, Composition)", async () => {
  const screen = await render(<Subject media />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();

  for (const slot of [
    "alert-dialog-trigger",
    "alert-dialog-overlay",
    "alert-dialog-content",
    "alert-dialog-header",
    "alert-dialog-media",
    "alert-dialog-title",
    "alert-dialog-description",
    "alert-dialog-footer",
    "alert-dialog-cancel",
    "alert-dialog-action",
  ]) {
    expect(bySlot(slot), `missing [data-slot="${slot}"]`).not.toBeNull();
  }
  const portal = bySlot("alert-dialog-content")!.closest(
    "[data-base-ui-portal]",
  );
  expect(portal).not.toBeNull();
  expect(screen.container.contains(portal)).toBe(false);
});

test("title and description name and describe the popup (Usage)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  const popup = screen.getByRole("alertdialog").element() as HTMLElement;
  expect(document.getElementById(popup.getAttribute("aria-labelledby")!)).toBe(
    bySlot("alert-dialog-title"),
  );
  expect(document.getElementById(popup.getAttribute("aria-describedby")!)).toBe(
    bySlot("alert-dialog-description"),
  );
});

test("cancel closes and action does not (Basic)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();

  // AlertDialogAction is a plain Button: it performs the caller's work and closes nothing itself.
  // `data-closed` rather than "is it still in the DOM": the popup outlives a close by its exit
  // animation, so presence alone would pass even if the click HAD closed it.
  clickBySlot("alert-dialog-action");
  expect(bySlot("alert-dialog-content")!.hasAttribute("data-closed")).toBe(
    false,
  );

  clickBySlot("alert-dialog-cancel");
  await waitForClosed();
});

test("Escape closes as a cancel request (Basic)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  await waitForClosed();
});

test("size publishes data-size and keeps the sm cap at every width (Small)", async () => {
  const screen = await render(<Subject contentProps={{ size: "sm" }} />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  const popup = bySlot("alert-dialog-content")!;
  expect(popup.getAttribute("data-size")).toBe("sm");
  // Both tiers start at `max-w-xs`; only `default` widens from the `sm` breakpoint.
  expect(popup.className).toContain("data-[size=sm]:max-w-xs");
  expect(popup.className).toContain("data-[size=default]:sm:max-w-sm");
});

test("the default size is recorded explicitly (Basic)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  expect(bySlot("alert-dialog-content")!.getAttribute("data-size")).toBe(
    "default",
  );
});

test("the media tile is a header child the layout keys off (Media)", async () => {
  const screen = await render(<Subject media />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  const header = bySlot("alert-dialog-header")!;
  const tile = bySlot("alert-dialog-media")!;
  expect(header.contains(tile)).toBe(true);
  expect(header.firstElementChild).toBe(tile);
  expect(tile.className).toContain("size-10");
  // The row layout is driven by the tile's presence, not by a prop on the header.
  expect(header.className).toContain("has-data-[slot=alert-dialog-media]");
  expect(tile.querySelector("svg")).not.toBeNull();
});

test("a header with no media keeps the two-row layout (Basic)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  expect(bySlot("alert-dialog-media")).toBeNull();
  expect(bySlot("alert-dialog-header")!.className).toContain(
    "grid-rows-[auto_1fr]",
  );
});

test("size and media compose (Small with Media)", async () => {
  const screen = await render(<Subject media contentProps={{ size: "sm" }} />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  const popup = bySlot("alert-dialog-content")!;
  expect(popup.getAttribute("data-size")).toBe("sm");
  expect(bySlot("alert-dialog-media")).not.toBeNull();
  // The media column is gated on the DEFAULT size, so `sm` keeps the tile above the title.
  expect(bySlot("alert-dialog-media")!.className).toContain(
    "sm:group-data-[size=default]/alert-dialog-content:row-span-2",
  );
  expect(bySlot("alert-dialog-footer")!.className).toContain(
    "group-data-[size=sm]/alert-dialog-content:grid-cols-2",
  );
});

test("the destructive confirmation is a Button variant, not footer colour (Destructive)", async () => {
  const screen = await render(
    <AlertDialog>
      <AlertDialogTrigger>Delete chat</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete chat?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes this conversation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
  await screen.getByRole("button", { name: "Delete chat" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  expect(bySlot("alert-dialog-action")!.className).toContain("bg-destructive/");
  expect(bySlot("alert-dialog-cancel")!.className).toContain("border-border");
  // The footer band itself stays neutral — the intent is carried by the action alone.
  expect(bySlot("alert-dialog-footer")!.className).not.toContain("destructive");
});

test("the cancel control accepts every Button variant it is given (Destructive)", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  // Default: outline, so cancel is visually quieter than a default-variant action.
  expect(bySlot("alert-dialog-cancel")!.className).toContain("border-border");
  expect(bySlot("alert-dialog-action")!.className).toContain("bg-primary");
});

test("RTL: the portaled popup takes the direction it is handed (RTL)", async () => {
  // The popup portals to `<body>`, so a `dir` on an ancestor of the TRIGGER never reaches it —
  // which is why upstream's own example hands `dir` to `AlertDialogContent`.
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Subject contentProps={{ dir: "rtl" }} />
      </div>
    </DirectionProvider>,
  );
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  const popup = bySlot("alert-dialog-content")!;
  expect(getComputedStyle(popup).direction).toBe("rtl");
  expect(popup.className).toContain("rtl:translate-x-1/2");
});

test("OVL-13: the portal subtree carries a display:contents host around the surface", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  const popup = bySlot("alert-dialog-content")!;
  const portal = popup.closest<HTMLElement>("[data-base-ui-portal]")!;
  const host = popup.closest<HTMLElement>(".contents")!;
  expect(host).not.toBeNull();
  expect(portal.contains(host)).toBe(true);
  expect(host.contains(bySlot("alert-dialog-overlay"))).toBe(true);
  expect(host.className).toBe("contents");
});

test("OVL-13: a nested theme scope lands on that host, inside the portal", async () => {
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      <Subject />
    </InternalThemeScopeProvider>,
  );
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  const popup = bySlot("alert-dialog-content")!;
  const portal = popup.closest<HTMLElement>("[data-base-ui-portal]")!;
  const scoped = portal.querySelector<HTMLElement>(".vs-scope-under-test");
  expect(scoped).not.toBeNull();
  expect(scoped!.className).toContain("contents");
  expect(scoped!.contains(popup)).toBe(true);
});

test("A11Y-9: an alert dialog makes the background natively inert and restores it", async () => {
  // There is no non-modal case to contrast: Base UI's AlertDialog omits `modal` from its root, so
  // the hook is always enabled and an alert dialog is always modal.
  const outside = document.createElement("button");
  outside.textContent = "Outside action";
  document.body.prepend(outside);
  try {
    const screen = await render(<Subject />);
    await screen.getByRole("button", { name: "Show dialog" }).click();
    await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
    await expect.poll(() => inertOwner(outside) !== null).toBe(true);
    clickBySlot("alert-dialog-cancel");
    await waitForClosed();
    await expect.poll(() => inertOwner(outside)).toBeNull();
  } finally {
    outside.remove();
  }
});

test("A11Y-9: the root exposes no modal prop to turn that off", () => {
  // A compile-time claim made at runtime: the union of the root's props has no `modal` member, so
  // `<AlertDialog modal={false}>` does not type-check and the hook has no disabled branch.
  type RootProps = React.ComponentProps<typeof AlertDialog>;
  const hasModal: "modal" extends keyof RootProps ? true : false = false;
  expect(hasModal).toBe(false);
});

test("FOC-1/FOC-6: nothing the alert dialog renders carries a focus glow", async () => {
  const screen = await render(<Subject media />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  // `getAttribute("class")` rather than `.className`: on an SVG element the latter is an
  // SVGAnimatedString, which would stringify to something no pattern here could ever match.
  const offenders = [...document.querySelectorAll("*")]
    .map((element) => element.getAttribute("class") ?? "")
    .filter((classes) =>
      /\bring-3\b|ring-\[3px\]|focus-visible:ring-/.test(classes),
    );
  expect(offenders).toEqual([]);
});

test("BRD-1: the alert dialog surface draws a real border, not a ring outline", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  expectBorderNotRing(bySlot("alert-dialog-content")!);
});

test("no a11y violations — closed", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — open", async () => {
  const screen = await render(<Subject />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document.
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — open, small, with media", async () => {
  const screen = await render(<Subject media contentProps={{ size: "sm" }} />);
  await screen.getByRole("button", { name: "Show dialog" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
