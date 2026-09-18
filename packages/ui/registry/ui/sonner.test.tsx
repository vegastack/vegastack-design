import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { toast } from "sonner";
import { expectNoA11yViolations } from "../../test/a11y";
import { Toaster } from "./sonner";

/*
 * sonner's `toast` writes into ONE global store, and every mounted `<Toaster />` subscribes to it.
 * Each test therefore scopes itself with `id` on the toaster and `toasterId` on the call, so a toast
 * fired by one test can never appear in another test's viewport.
 */
let seq = 0;
const scope = () => `sonner-test-${++seq}`;

/**
 * Every toast surface currently mounted. Each test scopes itself with its own toaster `id`, so this
 * only ever sees that test's own toasts.
 */
const toasts = () => [...document.querySelectorAll("[data-sonner-toast]")];

/** sonner's own live region. */
const liveRegion = () =>
  document.querySelector('section[aria-live="polite"]') as HTMLElement | null;

async function waitForToast(text: string) {
  await expect
    .poll(
      () =>
        [...document.querySelectorAll("[data-sonner-toast]")].some((element) =>
          element.textContent?.includes(text),
        ),
      { timeout: 3000 },
    )
    .toBe(true);
}

const toastEl = (text: string) =>
  [...document.querySelectorAll("[data-sonner-toast]")].find((element) =>
    element.textContent?.includes(text),
  ) as HTMLElement | undefined;

/** The five types the item binds a lucide glyph to. */
const TYPES = ["success", "info", "warning", "error", "loading"] as const;

// --- Usage --------------------------------------------------------------------------------------

/**
 * sonner mounts the `<ol data-sonner-toaster>` only once it has a toast to put in it — the live
 * region below is what exists from the first render — so the shell tests fire one first.
 */
async function toasterIn(container: ParentNode, id: string) {
  toast("Shell", { toasterId: id });
  await waitForToast("Shell");
  return container.querySelector("[data-sonner-toaster]") as HTMLElement;
}

test("the Toaster renders sonner's toaster shell (Usage)", async () => {
  const id = scope();
  const screen = await render(<Toaster id={id} />);
  const toaster = await toasterIn(screen.container, id);
  expect(toaster).not.toBeNull();
  // The one export this item ships, carrying the class it adds on top of sonner's own.
  expect(toaster.className).toContain("toaster");
  expect(toaster.tagName).toBe("OL");
  // Our toastOptions class lands on the toast itself.
  expect(toastEl("Shell")!.className).toContain("cn-toast");
});

test("toast() shows a toast with its message and description (Usage)", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  toast("Event created", {
    toasterId: id,
    description: "Sunday, December 3 at 9:00 AM",
  });
  await waitForToast("Event created");
  const element = toastEl("Event created")!;
  expect(element.querySelector("[data-title]")?.textContent).toBe(
    "Event created",
  );
  expect(element.querySelector("[data-description]")?.textContent).toBe(
    "Sunday, December 3 at 9:00 AM",
  );
});

test("the token bridge binds our variables onto sonner's surface (Usage)", async () => {
  const id = scope();
  const screen = await render(<Toaster id={id} />);
  const toaster = await toasterIn(screen.container, id);
  // Read the inline style rather than the computed value: this lane compiles no CSS, so the point
  // is that the bridge is WIRED to the token names, not what they resolve to.
  const BRIDGE: [string, string][] = [
    ["--normal-bg", "var(--popover)"],
    ["--normal-text", "var(--popover-foreground)"],
    ["--normal-border", "var(--border)"],
    ["--border-radius", "var(--radius)"],
  ];
  for (const [property, token] of BRIDGE) {
    expect(toaster.style.getPropertyValue(property), property).toBe(token);
  }
});

// --- Types --------------------------------------------------------------------------------------

test("each type renders its own glyph and data-type (Types)", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  for (const type of TYPES) {
    toast[type](`${type} toast`, { toasterId: id });
  }
  toast("default toast", { toasterId: id });
  for (const type of TYPES) await waitForToast(`${type} toast`);
  await waitForToast("default toast");

  const shapes: string[] = [];
  for (const type of TYPES) {
    const element = toastEl(`${type} toast`)!;
    expect(element.getAttribute("data-type"), type).toBe(type);
    const icon = element.querySelector("[data-icon] svg") as SVGElement;
    expect(icon, `${type} has no icon`).not.toBeNull();
    shapes.push(icon.innerHTML);
  }
  // Distinct glyphs, so the type is never signalled by colour alone.
  expect(new Set(shapes).size).toBe(TYPES.length);
  // A plain toast carries no type and no glyph: the icon is the type's own affordance.
  const plain = toastEl("default toast")!;
  expect(plain.getAttribute("data-type")).toBeNull();
  expect(plain.querySelector("[data-icon]")).toBeNull();
});

// --- Action -------------------------------------------------------------------------------------

test("action renders a button that runs its handler (Action)", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  const onClick = vi.fn();
  toast("Event created", {
    toasterId: id,
    description: "Sunday, December 3 at 9:00 AM",
    action: { label: "Undo", onClick },
  });
  await waitForToast("Event created");
  const action = toastEl("Event created")!.querySelector(
    "[data-button]",
  ) as HTMLElement;
  expect(action).not.toBeNull();
  expect(action.textContent).toBe("Undo");
  await userEvent.click(action);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("toast.dismiss removes the toast it names (Action)", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  const toastId = toast("Event created", { toasterId: id });
  await waitForToast("Event created");
  toast.dismiss(toastId);
  await expect
    .poll(() => toastEl("Event created"), { timeout: 3000 })
    .toBeUndefined();
});

// --- Promise ------------------------------------------------------------------------------------

test("toast.promise drives one toast from loading to success (Promise)", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  let resolve!: (value: { name: string }) => void;
  const pending = new Promise<{ name: string }>((r) => {
    resolve = r;
  });
  toast.promise(pending, {
    toasterId: id,
    loading: "Creating event…",
    success: (data) => `${data.name} created.`,
    error: "Could not create event.",
  });
  await waitForToast("Creating event…");
  expect(toastEl("Creating event…")!.getAttribute("data-type")).toBe("loading");
  // ONE toast, updated in place — not a second one beside it.
  expect(toasts().length).toBe(1);
  resolve({ name: "Event" });
  await waitForToast("Event created.");
  expect(toasts().length).toBe(1);
  expect(toastEl("Event created.")!.getAttribute("data-type")).toBe("success");
});

test("toast.promise moves the same toast to error on rejection (Promise)", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  let reject!: (reason: unknown) => void;
  const pending = new Promise<{ name: string }>((_, r) => {
    reject = r;
  });
  pending.catch(() => {});
  toast.promise(pending, {
    toasterId: id,
    loading: "Creating event…",
    success: "Event created.",
    error: "Could not create event.",
  });
  await waitForToast("Creating event…");
  reject(new Error("nope"));
  await waitForToast("Could not create event.");
  expect(toasts().length).toBe(1);
  expect(toastEl("Could not create event.")!.getAttribute("data-type")).toBe(
    "error",
  );
});

// --- Decision IDs from packages/ui/upstream/patches/sonner.patch --------------------------------

test("A11Y-3/A11Y-4: the polite region exists BEFORE any toast is fired", async () => {
  await render(<Toaster id={scope()} />);
  // NO HUNK in sonner.patch rests on exactly this: sonner already renders one mounted-for-life
  // polite region, so we add none of our own. The day the engine stops, this fails.
  const live = liveRegion();
  expect(live).not.toBeNull();
  expect(live!.getAttribute("aria-live")).toBe("polite");
  expect(live!.getAttribute("aria-atomic")).toBe("false");
  expect(live!.getAttribute("aria-label")).toContain("Notifications");
  // Mounted EMPTY: nothing has been fired.
  expect(document.querySelectorAll("[data-sonner-toast]").length).toBe(0);
  // Polite, never assertive by default, and exactly ONE region — a second would announce twice.
  expect(document.querySelectorAll('[aria-live="assertive"]').length).toBe(0);
  expect(document.querySelectorAll("section[aria-live]").length).toBe(1);
});

test("A11Y-3/A11Y-4: the SAME region is reused for every toast", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  const before = liveRegion();
  toast("Event created", { toasterId: id });
  await waitForToast("Event created");
  toast("Event updated", { toasterId: id });
  await waitForToast("Event updated");
  expect(liveRegion()).toBe(before);
  expect(document.querySelectorAll("section[aria-live]").length).toBe(1);
});

// --- Accessibility ------------------------------------------------------------------------------

test("no a11y violations — idle", async () => {
  await render(<Toaster id={scope()} />);
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — one toast", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  toast("Event created", {
    toasterId: id,
    description: "Sunday, December 3 at 9:00 AM",
    action: { label: "Undo", onClick: () => {} },
  });
  await waitForToast("Event created");
  // `color-contrast` only: sonner paints its surface from inline `--normal-bg`/`--normal-text`,
  // which are bound to `var(--popover)`/`var(--popover-foreground)`. This lane compiles no Tailwind,
  // so those variables do not resolve and axe measures sonner's own stylesheet fallback
  // (#ededed on #ffffff) rather than our tokens. Real rendered contrast for this surface is proven
  // by the compiled-CSS gate `packages/ui/test/contrast.browser.test.tsx`.
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("no a11y violations — typed toast", async () => {
  const id = scope();
  await render(<Toaster id={id} />);
  toast.error("Could not create event", {
    toasterId: id,
    description: "Try again in a moment.",
  });
  await waitForToast("Could not create event");
  // `color-contrast` only: sonner paints its surface from inline `--normal-bg`/`--normal-text`,
  // which are bound to `var(--popover)`/`var(--popover-foreground)`. This lane compiles no Tailwind,
  // so those variables do not resolve and axe measures sonner's own stylesheet fallback
  // (#ededed on #ffffff) rather than our tokens. Real rendered contrast for this surface is proven
  // by the compiled-CSS gate `packages/ui/test/contrast.browser.test.tsx`.
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
