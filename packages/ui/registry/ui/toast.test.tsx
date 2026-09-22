import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { InternalThemeScopeProvider } from "@vegastack/design/theme-scope";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastArrow,
  ToastPortal,
  ToastPositioner,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  createToastManager,
  toast,
  useToastManager,
} from "./toast";

/*
 * Every test makes its OWN manager. `toast` is a module-scope singleton, so a shared one would leak
 * a toast from one test into the next test's viewport; an app wants exactly the opposite, which is
 * why it is a singleton there.
 */
const host = () => {
  const manager = createToastManager();
  return { manager, ui: <Toaster toastManager={manager} /> };
};

/** Poll until a mounted toast carrying `text` is in the portal under <body>. */
async function waitForToast(text: string) {
  await expect
    .poll(
      () =>
        [...document.querySelectorAll('[data-slot="toast"]')].some((element) =>
          element.textContent?.includes(text),
        ),
      { timeout: 2000 },
    )
    .toBe(true);
}

const toastEl = (text: string) =>
  [...document.querySelectorAll('[data-slot="toast"]')].find((element) =>
    element.textContent?.includes(text),
  ) as HTMLElement | undefined;

const viewport = () =>
  document.querySelector('[data-slot="toast-viewport"]') as HTMLElement | null;

/** The four typed toasts and the ink COL-12 assigns each of them. */
const TYPES = [
  { type: "success", ink: "text-success-text" },
  { type: "info", ink: "text-info-text" },
  { type: "warning", ink: "text-warning-text" },
  { type: "error", ink: "text-destructive-text" },
] as const;

// --- Usage --------------------------------------------------------------------------------------

test("toast.add shows a toast with its title and description (Usage)", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({
    title: "Event created",
    description: "Sunday, December 3 at 9:00 AM",
  });
  await waitForToast("Event created");
  const element = toastEl("Event created")!;
  expect(element.querySelector('[data-slot="toast-title"]')?.textContent).toBe(
    "Event created",
  );
  expect(
    element.querySelector('[data-slot="toast-description"]')?.textContent,
  ).toBe("Sunday, December 3 at 9:00 AM");
  // Toasts portal out of the caller's subtree.
  expect(element.closest('[data-slot="toast-viewport"]')).not.toBeNull();
});

test("every exported part renders through one Toaster (Usage)", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({
    title: "Event created",
    description: "Sunday, December 3 at 9:00 AM",
    actionProps: { children: "Undo" },
  });
  await waitForToast("Event created");
  const element = toastEl("Event created")!;
  for (const slot of [
    "toast-content",
    "toast-title",
    "toast-description",
    "toast-action",
    "toast-close",
  ]) {
    expect(
      element.querySelector(`[data-slot="${slot}"]`),
      `no [data-slot="${slot}"]`,
    ).not.toBeNull();
  }
  expect(viewport()).not.toBeNull();
  // The three function exports.
  expect(typeof createToastManager).toBe("function");
  expect(typeof useToastManager).toBe("function");
  expect(typeof toast.add).toBe("function");
});

test("the raw parts compose the same surface by hand (Usage)", async () => {
  const manager = createToastManager();
  function Manual() {
    const { toasts } = useToastManager();
    return toasts.map((item) => (
      <Toast key={item.id} toast={item}>
        <ToastContent>
          <ToastTitle />
          <ToastDescription />
          <ToastAction />
          <ToastClose />
        </ToastContent>
      </Toast>
    ));
  }
  await render(
    <ToastProvider toastManager={manager}>
      <ToastPortal>
        <ToastViewport>
          <Manual />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>,
  );
  manager.add({ title: "Hand rolled", actionProps: { children: "Undo" } });
  await waitForToast("Hand rolled");
  expect(
    toastEl("Hand rolled")!.querySelector('[data-slot="toast-action"]'),
  ).not.toBeNull();
});

test("toast.close removes the toast it names (Usage)", async () => {
  const { manager, ui } = host();
  await render(ui);
  const id = manager.add({ title: "Event created" });
  await waitForToast("Event created");
  manager.close(id);
  await expect.poll(() => toastEl("Event created")).toBeUndefined();
});

// --- Types --------------------------------------------------------------------------------------

test("each type renders its own icon and data-type (Types)", async () => {
  const { manager, ui } = host();
  await render(ui);
  for (const { type } of TYPES) {
    manager.add({ type, title: `${type} toast` });
  }
  manager.add({ title: "default toast" });
  for (const { type } of TYPES) await waitForToast(`${type} toast`);
  await waitForToast("default toast");

  for (const { type } of TYPES) {
    const element = toastEl(`${type} toast`)!;
    expect(element.getAttribute("data-type")).toBe(type);
    expect(
      element.querySelector('[data-slot="toast-icon"] svg'),
      `${type} has no icon`,
    ).not.toBeNull();
  }
  // A toast with no type gets no icon — the slot is the type's own affordance.
  expect(
    toastEl("default toast")!.querySelector('[data-slot="toast-icon"]'),
  ).toBeNull();
});

test("priority high is carried onto the toast (Types)", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({
    type: "error",
    title: "Could not create",
    priority: "high",
  });
  await waitForToast("Could not create");
  // Base UI announces a high-priority toast urgently through its own machinery; what this file owns
  // is that the option reaches the toast rather than being dropped on the floor.
  const element = toastEl("Could not create")!;
  expect(element.getAttribute("data-type")).toBe("error");
});

// --- Action -------------------------------------------------------------------------------------

test("actionProps render a button that can close its own toast (Action)", async () => {
  const { manager, ui } = host();
  await render(ui);
  const onClick = vi.fn();
  const id = manager.add({
    title: "Event created",
    actionProps: {
      children: "Undo",
      onClick: () => {
        onClick();
        manager.close(id);
      },
    },
  });
  await waitForToast("Event created");
  const action = toastEl("Event created")!.querySelector(
    '[data-slot="toast-action"]',
  ) as HTMLElement;
  expect(action.textContent).toBe("Undo");
  await userEvent.click(action);
  expect(onClick).toHaveBeenCalledTimes(1);
  await expect.poll(() => toastEl("Event created")).toBeUndefined();
});

test("the close button is labelled and dismisses the toast (Action)", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({ title: "Event created" });
  await waitForToast("Event created");
  const close = toastEl("Event created")!.querySelector(
    '[data-slot="toast-close"]',
  ) as HTMLElement;
  expect(close.getAttribute("aria-label")).toBe("Close toast");
  await userEvent.click(close);
  await expect.poll(() => toastEl("Event created")).toBeUndefined();
});

// --- Promise ------------------------------------------------------------------------------------

test("toast.promise drives one toast from loading to success (Promise)", async () => {
  const { manager, ui } = host();
  await render(ui);
  let resolve!: (value: { name: string }) => void;
  const pending = new Promise<{ name: string }>((r) => {
    resolve = r;
  });
  manager.promise(pending, {
    loading: "Creating event…",
    success: (data) => `${data.name} created.`,
    error: "Could not create event.",
  });
  await waitForToast("Creating event…");
  expect(toastEl("Creating event…")!.getAttribute("data-type")).toBe("loading");
  // ONE toast, updated in place — not a second one beside it.
  expect(document.querySelectorAll('[data-slot="toast"]').length).toBe(1);
  resolve({ name: "Event" });
  await waitForToast("Event created.");
  expect(document.querySelectorAll('[data-slot="toast"]').length).toBe(1);
  expect(toastEl("Event created.")!.getAttribute("data-type")).toBe("success");
});

test("toast.promise moves the same toast to error on rejection (Promise)", async () => {
  const { manager, ui } = host();
  await render(ui);
  let reject!: (reason: unknown) => void;
  const pending = new Promise<{ name: string }>((_, r) => {
    reject = r;
  });
  manager
    .promise(pending, {
      loading: "Creating event…",
      success: "Event created.",
      error: "Could not create event.",
    })
    .catch(() => {});
  await waitForToast("Creating event…");
  reject(new Error("nope"));
  await waitForToast("Could not create event.");
  expect(document.querySelectorAll('[data-slot="toast"]').length).toBe(1);
  expect(toastEl("Could not create event.")!.getAttribute("data-type")).toBe(
    "error",
  );
});

test("toast.update rewrites a toast in place (Promise)", async () => {
  const { manager, ui } = host();
  await render(ui);
  const id = manager.add({ title: "Uploading…", type: "loading" });
  await waitForToast("Uploading…");
  manager.update(id, { title: "Uploaded", type: "success" });
  await waitForToast("Uploaded");
  expect(document.querySelectorAll('[data-slot="toast"]').length).toBe(1);
});

// --- Decision IDs from packages/ui/upstream/patches/toast.patch ---------------------------------

test("FOC-1/FOC-6: no rendered element carries a focus glow", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({
    title: "Event created",
    description: "Sunday",
    actionProps: { children: "Undo" },
  });
  await waitForToast("Event created");
  const element = toastEl("Event created")!;
  const classes = [element, ...element.querySelectorAll("*")]
    .map((node) => (node as HTMLElement).className ?? "")
    .filter((value) => typeof value === "string");
  for (const value of classes) {
    expect(value).not.toMatch(/ring-3|ring-\[3px\]/);
    expect(value).not.toContain("focus-visible:ring-");
  }
  // The root must not suppress the one global outline either.
  expect(element.className).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
});

test("COL-12: each type paints its icon with the family's -text ink", async () => {
  const { manager, ui } = host();
  await render(ui);
  for (const { type } of TYPES) manager.add({ type, title: `${type} toast` });
  for (const { type } of TYPES) await waitForToast(`${type} toast`);

  for (const { type, ink } of TYPES) {
    const icon = toastEl(`${type} toast`)!.querySelector(
      '[data-slot="toast-icon"] svg',
    ) as SVGElement;
    expect(icon, `${type} has no icon`).not.toBeNull();
    expect(icon.getAttribute("class") ?? "", `${type} ink`).toContain(ink);
  }
});

test("A11Y-8: each type is a DISTINCT glyph, so type is never colour alone", async () => {
  const { manager, ui } = host();
  await render(ui);
  const all = [...TYPES.map((t) => t.type), "loading"];
  for (const type of all) manager.add({ type, title: `${type} toast` });
  for (const type of all) await waitForToast(`${type} toast`);

  const shapes = all.map((type) => {
    const icon = toastEl(`${type} toast`)!.querySelector(
      '[data-slot="toast-icon"] svg',
    ) as SVGElement;
    expect(icon, `${type} has no icon`).not.toBeNull();
    // The path geometry, not the colour: two types sharing a glyph would collapse here.
    return icon.innerHTML;
  });
  expect(new Set(shapes).size).toBe(all.length);
});

test("A11Y-3/A11Y-4: the viewport is a polite region BEFORE any toast exists", async () => {
  const { manager, ui } = host();
  await render(ui);
  // Nothing added yet: the region has to already be mounted, or the platform never observes it.
  const region = viewport();
  expect(region).not.toBeNull();
  expect(region!.getAttribute("role")).toBe("region");
  expect(region!.getAttribute("aria-live")).toBe("polite");
  expect(region!.getAttribute("aria-label")).toBe("Notifications");
  expect(document.querySelectorAll('[data-slot="toast"]').length).toBe(0);

  // And it is the ONLY live region this component ships — a second one would announce twice.
  manager.add({ title: "Event created" });
  await waitForToast("Event created");
  expect(document.querySelectorAll("[aria-live]").length).toBe(1);
  expect(viewport()).toBe(region);
});

test("A11Y-9: an aria-hidden toast leaves the tab order, and comes back with it", async () => {
  const { manager, ui } = host();
  await render(ui);
  // The engine shape this hunk is written against, pinned so the hunk fails as STALE the day Base
  // UI fixes it rather than lingering unnoticed. For a `priority: "high"` toast,
  // `@base-ui/react@1.8.0` announces a visually hidden `role="alert"` clone in the viewport and
  // marks the VISIBLE root `role="alertdialog" aria-hidden="true"` so the viewport's own polite
  // region does not announce it twice — while leaving `tabIndex={0}` on the root and its buttons.
  // Nothing tabbable may sit inside an `aria-hidden` subtree (axe: SERIOUS `aria-hidden-focus`), so
  // A11Y-9 makes `tabIndex` follow `aria-hidden` on the root and on the parts it owns.
  manager.add({
    title: "Could not create",
    type: "error",
    priority: "high",
    actionProps: { children: "Retry" },
  });
  await waitForToast("Could not create");
  const high = toastEl("Could not create")!;
  expect(high.getAttribute("aria-hidden")).toBe("true");
  expect(high.getAttribute("role")).toBe("alertdialog");
  expect(high.tabIndex).toBe(-1);
  for (const slot of ["toast-action", "toast-close"]) {
    const button = high.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
    expect(button, `no [data-slot="${slot}"]`).not.toBeNull();
    expect(button.getAttribute("tabindex"), slot).toBe("-1");
  }

  // A low-priority toast takes the other path: never aria-hidden, so it is tabbable throughout.
  manager.add({ title: "Event created", actionProps: { children: "Undo" } });
  await waitForToast("Event created");
  const low = toastEl("Event created")!;
  expect(low.getAttribute("aria-hidden")).toBeNull();
  expect(low.tabIndex).toBe(0);
  for (const slot of ["toast-action", "toast-close"]) {
    const button = low.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
    expect(button.getAttribute("tabindex"), slot).toBe("0");
  }

  // …and the high-priority toast comes BACK into the tab order the moment Base UI drops
  // `aria-hidden`, which it does as soon as the viewport takes focus (F6 is the engine's own
  // shortcut). The two attributes move together, which is the whole point of reading one off the
  // other rather than recomputing the condition.
  await userEvent.keyboard("{F6}");
  await vi.waitFor(() => {
    expect(toastEl("Could not create")!.getAttribute("aria-hidden")).toBeNull();
  });
  const focusedHigh = toastEl("Could not create")!;
  expect(focusedHigh.tabIndex).toBe(0);
  for (const slot of ["toast-action", "toast-close"]) {
    const button = focusedHigh.querySelector(
      `[data-slot="${slot}"]`,
    ) as HTMLElement;
    expect(button.getAttribute("tabindex"), slot).toBe("0");
  }
});

test("OVL-13: the portal re-applies the theme scope inside itself", async () => {
  const { manager, ui } = host();
  const screen = await render(
    <InternalThemeScopeProvider scope="vs-scope-under-test">
      {ui}
    </InternalThemeScopeProvider>,
  );
  manager.add({ title: "Event created" });
  await waitForToast("Event created");
  const scoped = document.querySelector(".vs-scope-under-test") as HTMLElement;
  expect(scoped).not.toBeNull();
  // Portaled: the scope carrier is NOT inside the component's own container subtree…
  expect(screen.container.contains(scoped)).toBe(false);
  // …and the viewport, with the toast in it, is inside the scope carrier.
  expect(scoped.contains(viewport())).toBe(true);
  expect(scoped.contains(toastEl("Event created")!)).toBe(true);
});

test("OVL-13: with no scope in the tree the portal carries only `contents`", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({ title: "Event created" });
  await waitForToast("Event created");
  expect(document.querySelector(".vs-scope-under-test")).toBeNull();
});

// --- OVL-15: position, anchored parts, custom body --------------------------------------------
//
// This lane runs WITHOUT compiled CSS — semantic utilities resolve to nothing here — so these
// assert the classes the variants emit. The computed halves are measured where real CSS exists:
// the `z-60` band in `test/stacking.browser.test.tsx`, the COL-23 inks in
// `test/contrast.browser.test.tsx`.

/** The six logical corners, with the growth sign and block edge each one must emit. */
const POSITIONS = [
  { position: "top-start", dir: "[--toast-dir:1]", edge: "top-4" },
  { position: "top-center", dir: "[--toast-dir:1]", edge: "top-4" },
  { position: "top-end", dir: "[--toast-dir:1]", edge: "top-4" },
  { position: "bottom-start", dir: "[--toast-dir:-1]", edge: "bottom-4" },
  { position: "bottom-center", dir: "[--toast-dir:-1]", edge: "bottom-4" },
  { position: "bottom-end", dir: "[--toast-dir:-1]", edge: "bottom-4" },
] as const;

test.for(POSITIONS)(
  "OVL-15: position $position pins $edge and emits $dir",
  async ({ position, dir, edge }) => {
    const manager = createToastManager();
    await render(<Toaster toastManager={manager} position={position} />);
    manager.add({ title: "Event created" });
    await waitForToast("Event created");

    const classes = viewport()!.className;
    // The growth sign every vertical term in `toastVariants` is multiplied by.
    expect(classes).toContain(dir);
    expect(classes).toContain(edge);
    // OVL-15: one band above the single z-50 overlay band.
    expect(classes).toContain("z-60");
    // The position is published for a consumer styling the viewport from outside.
    expect(viewport()!.dataset.position).toBe(position);
  },
);

test("OVL-15: the default position is bottom-end", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({ title: "Event created" });
  await waitForToast("Event created");
  expect(viewport()!.className).toContain("[--toast-dir:-1]");
  expect(viewport()!.className).toContain("bottom-4");
  expect(viewport()!.dataset.position).toBe("bottom-end");
});

test("OVL-15: a top position anchors the stack to the top edge", async () => {
  const manager = createToastManager();
  await render(<Toaster toastManager={manager} position="top-start" />);
  manager.add({ title: "Event created" });
  await waitForToast("Event created");
  // `origin` and the pointer-bridging `::after` edge are the half of the anchor variant that is
  // not arithmetic, so asserting them proves `Toaster` derived the anchor from `position`.
  const classes = toastEl("Event created")!.className;
  expect(classes).toContain("origin-top");
  expect(classes).toContain("after:bottom-full");
  expect(classes).not.toContain("origin-bottom");
});

test("OVL-15: a bottom position anchors the stack to the bottom edge", async () => {
  const manager = createToastManager();
  await render(<Toaster toastManager={manager} position="bottom-start" />);
  manager.add({ title: "Saved" });
  await waitForToast("Saved");
  const classes = toastEl("Saved")!.className;
  expect(classes).toContain("origin-bottom");
  expect(classes).toContain("after:top-full");
  expect(classes).not.toContain("origin-top");
});

test("OVL-15: a toast carrying data.render owns its body but stays a real toast", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({
    title: "ignored when a renderer is present",
    data: {
      render: () => <div data-testid="custom-body">Deploy finished</div>,
    },
  });
  await waitForToast("Deploy finished");

  const element = toastEl("Deploy finished")!;
  // The custom body replaced the default row…
  expect(element.querySelector('[data-testid="custom-body"]')).not.toBeNull();
  expect(element.querySelector('[data-slot="toast-title"]')).toBeNull();
  // …but it is still a real toast inside the live region, with the surface and the stack on it.
  expect(element.dataset.slot).toBe("toast");
  expect(element.closest('[data-slot="toast-viewport"]')).not.toBeNull();
  expect(element.querySelector('[data-slot="toast-content"]')).not.toBeNull();
});

test("OVL-15: ToastPositioner and ToastArrow compose an anchored toast", async () => {
  const manager = createToastManager();

  function AnchoredList() {
    const { toasts } = useToastManager();
    return toasts.map((item) => (
      <ToastPositioner key={item.id} toast={item}>
        <Toast toast={item}>
          <ToastContent>
            <ToastTitle />
            <ToastArrow />
          </ToastContent>
        </Toast>
      </ToastPositioner>
    ));
  }

  await render(
    <ToastProvider toastManager={manager}>
      <ToastPortal>
        <ToastViewport>
          <AnchoredList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>,
  );
  manager.add({ title: "Copied to clipboard" });
  await waitForToast("Copied to clipboard");

  const positioner = document.querySelector(
    '[data-slot="toast-positioner"]',
  ) as HTMLElement;
  expect(positioner).not.toBeNull();
  // The positioner shares the viewport's band, so an anchored toast clears a modal too.
  expect(positioner.className).toContain("z-60");
  expect(document.querySelector('[data-slot="toast-arrow"]')).not.toBeNull();
  expect(positioner.contains(toastEl("Copied to clipboard")!)).toBe(true);
});

// --- COL-23: the first text line carries the default ink ---------------------------------------

test("COL-23: a description-only toast has no title, so its description leads", async () => {
  const { manager, ui } = host();
  await render(ui);
  // Base UI renders `Toast.Title` as null when there is no title, so this description is the
  // toast's only line — its primary message. The rendered inks are measured in the contrast lane.
  manager.add({ description: "Event has been created." });
  await waitForToast("Event has been created.");

  const element = toastEl("Event has been created.")!;
  expect(element.querySelector('[data-slot="toast-title"]')).toBeNull();
  const description = element.querySelector(
    '[data-slot="toast-description"]',
  ) as HTMLElement;
  // `first:` is the condition — and it only means anything if the description really is first.
  expect(description.className).toContain("first:text-popover-foreground");
  expect(description.previousElementSibling).toBeNull();
});

test("COL-23: a description BELOW a title is not first, so it stays muted", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({
    title: "Event created",
    description: "Sunday, December 3 at 9:00 AM",
  });
  await waitForToast("Sunday, December 3 at 9:00 AM");

  const element = toastEl("Sunday, December 3 at 9:00 AM")!;
  const description = element.querySelector(
    '[data-slot="toast-description"]',
  ) as HTMLElement;
  expect(element.querySelector('[data-slot="toast-title"]')).not.toBeNull();
  expect(description.className).toContain("text-muted-foreground");
  // The title rendered before it, so `first:` cannot fire.
  expect(
    (description.previousElementSibling as HTMLElement | null)?.dataset.slot,
  ).toBe("toast-title");
});

// --- Accessibility ------------------------------------------------------------------------------

test("no a11y violations — idle", async () => {
  const { ui } = host();
  await render(ui);
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — one toast", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({
    title: "Event created",
    description: "Sunday, December 3 at 9:00 AM",
    actionProps: { children: "Undo" },
  });
  await waitForToast("Event created");
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — typed toast", async () => {
  const { manager, ui } = host();
  await render(ui);
  manager.add({
    type: "error",
    title: "Could not create event",
    description: "Try again in a moment.",
  });
  await waitForToast("Could not create event");
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — high-priority toast", async () => {
  const { manager, ui } = host();
  await render(ui);
  // Its own audited state: `priority: "high"` takes a different Base UI code path (`alertdialog`
  // plus `aria-hidden`), and leaving it unaudited would hide everything else about that path.
  manager.add({
    type: "error",
    title: "Could not create event",
    description: "Try again in a moment.",
    priority: "high",
  });
  await waitForToast("Could not create event");
  // `aria-hidden-focus` is disabled for the HIGH-PRIORITY state only, and only here: Base UI marks
  // the visible root `aria-hidden` while leaving it and its buttons tabbable (the test above pins
  // that exact shape, so this exemption fails as stale the day the engine fixes it). Every other
  // rule still runs, and every other toast state is audited with no exemption at all.
  await expectNoA11yViolations(document.body);
});
