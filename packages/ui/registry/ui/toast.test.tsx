import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { ToastProvider, Toaster, toast, toastManager } from "./toast";

/**
 * Every test mounts the same host the app provider does: the toast context plus one viewport.
 * The imperative `toast()` writes into the module-scope manager, which is why nothing here has
 * to thread a hook through.
 */
function Host(props: React.ComponentProps<typeof Toaster> = {}) {
  return (
    <ToastProvider>
      <Toaster {...props} />
    </ToastProvider>
  );
}

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

function toastEl(text: string) {
  return [...document.querySelectorAll('[data-slot="toast"]')].find((element) =>
    element.textContent?.includes(text),
  ) as HTMLElement | undefined;
}

test("calling toast() shows a toast with its text", async () => {
  await render(<Host />);
  toast("Profile saved");
  // Toasts portal to <body>, so query the document rather than the container.
  await waitForToast("Profile saved");
});

test("the viewport is a labelled polite live region (D23 default)", async () => {
  await render(<Host />);
  toast("Profile saved");
  await waitForToast("Profile saved");
  const viewport = document.querySelector<HTMLElement>(
    '[data-slot="toast-viewport"]',
  );
  expect(viewport?.getAttribute("role")).toBe("region");
  expect(viewport?.getAttribute("aria-live")).toBe("polite");
  expect(viewport?.getAttribute("aria-label")).toBe("Notifications");
});

test("each type carries its own tint, icon and data-type", async () => {
  await render(<Host />);
  toast.success("Changes saved");
  toast.error("Could not save");
  toast.warning("Storage almost full");
  toast.info("Update available");
  await waitForToast("Changes saved");
  await waitForToast("Could not save");
  await waitForToast("Storage almost full");
  await waitForToast("Update available");
  for (const [text, type, tint] of [
    ["Changes saved", "success", "bg-success-subtle"],
    ["Could not save", "error", "bg-destructive-subtle"],
    ["Storage almost full", "warning", "bg-warning-subtle"],
    ["Update available", "info", "bg-info-subtle"],
  ] as const) {
    const element = toastEl(text);
    expect(element?.getAttribute("data-type")).toBe(type);
    // The suite runs without compiled CSS, so assert the class contract; the compiled colours
    // are the contrast gate's job.
    expect(element?.className).toContain(tint);
    expect(element?.querySelector('[data-slot="toast-icon"]')).not.toBeNull();
  }
});

test("D23: destructive and warning toasts are announced urgently, the rest politely", async () => {
  await render(<Host />);
  toast.error("Deploy failed");
  await waitForToast("Deploy failed");
  // Base UI renders a visually hidden role="alert" mirror for high-priority toasts only.
  await expect
    .poll(() =>
      [...document.querySelectorAll('[role="alert"]')].some((element) =>
        element.textContent?.includes("Deploy failed"),
      ),
    )
    .toBe(true);
  toast.success("Deploy succeeded");
  await waitForToast("Deploy succeeded");
  expect(
    [...document.querySelectorAll('[role="alert"]')].some((element) =>
      element.textContent?.includes("Deploy succeeded"),
    ),
  ).toBe(false);
});

test("Escape dismisses the focused toast", async () => {
  await render(<Host />);
  toast("Dismiss me with Escape");
  await waitForToast("Dismiss me with Escape");
  const element = toastEl("Dismiss me with Escape");
  element?.focus();
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => toastEl("Dismiss me with Escape")).toBeUndefined();
});

test("F6 moves focus into the toast viewport landmark", async () => {
  const screen = await render(
    <>
      <button type="button">Page control</button>
      <Host />
    </>,
  );
  toast("Reachable by F6");
  await waitForToast("Reachable by F6");
  (
    screen
      .getByRole("button", { name: "Page control" })
      .element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{F6}");
  const viewport = document.querySelector('[data-slot="toast-viewport"]');
  await expect
    .poll(() => viewport?.contains(document.activeElement))
    .toBe(true);
});

test("the dismiss X closes its toast", async () => {
  await render(<Host />);
  toast("Close me");
  await waitForToast("Close me");
  const close = toastEl("Close me")?.querySelector<HTMLElement>(
    '[data-slot="toast-close"]',
  );
  expect(close).not.toBeNull();
  expect(close?.getAttribute("aria-label")).toBe("Dismiss notification");
  close?.click();
  await expect.poll(() => toastEl("Close me")).toBeUndefined();
});

test("closeButton={false} drops the dismiss X", async () => {
  await render(<Host closeButton={false} />);
  toast("No X here");
  await waitForToast("No X here");
  expect(
    toastEl("No X here")?.querySelector('[data-slot="toast-close"]'),
  ).toBeNull();
});

test("actionProps renders the action button and fires its handler", async () => {
  await render(<Host />);
  let undone = false;
  toast("Invitation sent", {
    actionProps: {
      children: "Undo",
      onClick: () => {
        undone = true;
      },
    },
  });
  await waitForToast("Invitation sent");
  const action = toastEl("Invitation sent")?.querySelector<HTMLElement>(
    '[data-slot="toast-action"]',
  );
  expect(action?.textContent).toBe("Undo");
  action?.click();
  expect(undone).toBe(true);
});

test("toast.promise drives one toast through loading → success", async () => {
  await render(<Host />);
  let resolve: (value: string) => void = () => {};
  const pending = new Promise<string>((r) => {
    resolve = r;
  });
  const settled = toast.promise(pending, {
    loading: "Saving…",
    success: (value) => `Saved ${value}`,
    error: "Save failed",
  });
  await waitForToast("Saving…");
  // A loading toast never auto-dismisses — that is Base UI's own timer rule, not ours.
  expect(toastEl("Saving…")?.getAttribute("data-type")).toBe("loading");
  resolve("draft");
  await settled;
  await waitForToast("Saved draft");
  expect(toastEl("Saved draft")?.getAttribute("data-type")).toBe("success");
});

test("toast.custom renders its own body inside a real toast", async () => {
  await render(<Host />);
  toast.custom((item) => <p>custom body for {item.id}</p>);
  await waitForToast("custom body for");
  const element = toastEl("custom body for");
  // Still a real toast: it keeps the surface, the close control and the stacking slot.
  expect(element?.getAttribute("data-slot")).toBe("toast");
  expect(element?.querySelector('[data-slot="toast-close"]')).not.toBeNull();
});

test("re-adding the same id updates the toast in place instead of stacking", async () => {
  await render(<Host />);
  toast("First copy", { id: "dedupe" });
  await waitForToast("First copy");
  toast("Second copy", { id: "dedupe" });
  await waitForToast("Second copy");
  expect(document.querySelectorAll('[data-slot="toast"]').length).toBe(1);
});

test("the viewport pins to the requested edge and sets the stack direction", async () => {
  await render(<Host position="top-start" />);
  toast("Top-start toast");
  await waitForToast("Top-start toast");
  const viewport = document.querySelector<HTMLElement>(
    '[data-slot="toast-viewport"]',
  );
  expect(viewport?.className).toContain("[--toast-dir:1]");
  expect(viewport?.className).toContain("bottom-auto");
  expect(toastEl("Top-start toast")?.className).toContain("origin-top");
});

test("toastManager.close() with no id clears every toast", async () => {
  await render(<Host />);
  toast("One");
  toast("Two");
  await waitForToast("One");
  await waitForToast("Two");
  toastManager.close();
  await expect
    .poll(() => document.querySelectorAll('[data-slot="toast"]').length)
    .toBe(0);
});

test("no a11y violations", async () => {
  await render(<Host />);
  toast("Heads up", { description: "Something happened" });
  await waitForToast("Heads up");
  // The toast portals to <body>, so audit the whole document. `color-contrast` is skipped HERE
  // because Tailwind utilities aren't compiled in this fast unit run — the token classes don't
  // resolve, so the default ink reports a FALSE contrast failure. The REAL contrast is proven by
  // the compiled-CSS gate test/contrast.browser.test.tsx, which fires every type in both themes.
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("no a11y violations — error toast with an action", async () => {
  await render(<Host />);
  toast.error("Something went wrong", {
    description: "Try again in a moment",
    actionProps: { children: "Retry" },
  });
  await waitForToast("Something went wrong");
  // `aria-hidden-focus` is disabled HERE, and only here, for a state that is real but transient.
  // Base UI puts `aria-hidden` on a HIGH-priority toast while nothing inside the viewport has
  // focus (`toast/root/ToastRoot.js`: `'aria-hidden': isHighPriority && !focused ? true :
  // undefined`), so the toast is announced ONCE — by the visually hidden `role="alert"` mirror the
  // viewport renders — instead of twice, by the mirror and again by the polite live region. The
  // toast is still `tabIndex=0`, so the static DOM axe measures does hold an aria-hidden subtree
  // containing focusable content.
  //
  // It does not survive contact with a keyboard: the viewport's `onFocus` bubbles from any
  // descendant (`toast/viewport/ToastViewport.js`: `handleFocus`), which flips `focused` and drops
  // the attribute. The test below proves exactly that, with the rule ENABLED — so this is a
  // compensated suppression, not a hidden failure. It applies only to `error`/`warning` toasts,
  // which is why the other two a11y tests here keep the rule on.
  await expectNoA11yViolations(document.body, [
    "color-contrast",
    "aria-hidden-focus",
  ]);
});

test("an urgent toast drops aria-hidden the moment focus reaches it (compensates the suppression above)", async () => {
  await render(<Host />);
  toast.error("Something went wrong", {
    description: "Try again in a moment",
    actionProps: { children: "Retry" },
  });
  await waitForToast("Something went wrong");
  expect(toastEl("Something went wrong")?.getAttribute("aria-hidden")).toBe(
    "true",
  );
  // F6 is the documented way in: Base UI's global handler focuses the viewport and sets `focused`
  // outright, so this asserts the real keyboard path rather than a programmatic focus() whose
  // :focus-visible resolution would be browser-dependent.
  await userEvent.keyboard("{F6}");
  await expect
    .poll(() => toastEl("Something went wrong")?.getAttribute("aria-hidden"))
    .toBeNull();
  // With focus inside the viewport there is nothing left to suppress: audit the SAME toast with
  // `aria-hidden-focus` enabled.
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("no a11y violations — loading toast", async () => {
  await render(<Host />);
  toast.loading("Saving changes");
  await waitForToast("Saving changes");
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
