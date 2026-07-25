import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Toaster, toast } from "./sonner";

/** Poll until a mounted toast carrying `text` is in the portal under <body>. */
async function waitForToast(text: string) {
  await expect
    .poll(
      () => {
        const t = document.querySelector(
          '[data-sonner-toast][data-mounted="true"]',
        );
        return t?.textContent?.includes(text) ? t : null;
      },
      { timeout: 2000 },
    )
    .not.toBeNull();
}

test("renders the toaster region once a toast is shown", async () => {
  await render(<Toaster />);
  toast("Profile saved");
  // Sonner mounts its labelled notifications region (an <ol data-sonner-toaster>)
  // lazily, only when there is content to announce.
  await expect
    .poll(() => document.querySelector("[data-sonner-toaster]"), {
      timeout: 2000,
    })
    .not.toBeNull();
});

test("calling toast() shows a toast with its text", async () => {
  await render(<Toaster />);
  toast("Profile saved");
  // Toasts portal to <body>, so query the document rather than the container.
  await waitForToast("Profile saved");
});

test("toast.success() shows the success message", async () => {
  await render(<Toaster />);
  toast.success("Changes saved");
  await waitForToast("Changes saved");
});

test("uses the semantic token bridge and variant icon classes", async () => {
  await render(<Toaster />);
  toast.success("Changes saved");
  await waitForToast("Changes saved");
  const toaster = document.querySelector<HTMLElement>("[data-sonner-toaster]");
  expect(toaster?.style.getPropertyValue("--normal-bg")).toBe("var(--popover)");
  expect(toaster?.style.getPropertyValue("--normal-text")).toBe(
    "var(--popover-foreground)",
  );
  expect(toaster?.style.getPropertyValue("--normal-border")).toBe(
    "var(--border)",
  );
  expect(toaster?.style.getPropertyValue("--border-radius")).toBe(
    "var(--radius-lg)",
  );
  // Scope to the icon slot — with the closeButton default ON, the dismiss X's
  // svg is also inside the toast and a bare `svg` selector would match it first.
  expect(
    document.querySelector("[data-sonner-toast] [data-icon] svg"),
  ).toHaveClass("text-success-text");
});

test("toasts are dismissable by default: close X present, top-right via the re-pointed vars", async () => {
  await render(<Toaster />);
  toast("Dismiss me");
  await waitForToast("Dismiss me");
  const closeBtn = document.querySelector<HTMLElement>(
    "[data-sonner-toast] [data-close-button]",
  );
  expect(closeBtn).not.toBeNull();
  // This suite runs without compiled CSS, so assert the class contract: the arbitrary-property
  // utilities that re-point Sonner's close-button side vars must ride each TOAST element —
  // declared there they beat the inherited `html[dir]`/toaster-level LTR defaults, which a
  // toaster-root utility class cannot (attribute-selector specificity). Compiled behavior is VRT's.
  const toastEl = document.querySelector<HTMLElement>("[data-sonner-toast]");
  expect(toastEl?.className).toContain("[--toast-close-button-end:0]");
  expect(toastEl?.className).toContain("[--toast-close-button-start:auto]");
});

test("offset/mobileOffset default to safe-area-aware CSS vars (audit §a: env(safe-area-inset-*))", async () => {
  await render(<Toaster />);
  toast("Profile saved");
  await waitForToast("Profile saved");
  const toaster = document.querySelector<HTMLElement>("[data-sonner-toaster]");
  // Every side carries our token spacing PLUS the matching safe-area inset, so edge-pinned
  // toasts clear the iOS home indicator/notch. `env()` resolves to 0 on non-notched devices,
  // so this is the same 24px/16px Sonner ships by default there — zero visual change.
  for (const side of ["top", "right", "bottom", "left"]) {
    expect(toaster?.style.getPropertyValue(`--offset-${side}`)).toBe(
      `calc(var(--spacing) * 6 + env(safe-area-inset-${side}))`,
    );
    expect(toaster?.style.getPropertyValue(`--mobile-offset-${side}`)).toBe(
      `calc(var(--spacing) * 4 + env(safe-area-inset-${side}))`,
    );
  }
});

test("consumer-supplied offset/mobileOffset override the safe-area default", async () => {
  await render(<Toaster offset={{ top: "8px" }} mobileOffset={12} />);
  toast("Profile saved");
  await waitForToast("Profile saved");
  const toaster = document.querySelector<HTMLElement>("[data-sonner-toaster]");
  expect(toaster?.style.getPropertyValue("--offset-top")).toBe("8px");
  expect(toaster?.style.getPropertyValue("--mobile-offset-top")).toBe("12px");
});

test("no a11y violations", async () => {
  await render(<Toaster />);
  toast("Heads up");
  // Wait for the toast to finish mounting so axe audits the settled, styled DOM.
  await waitForToast("Heads up");
  // The toast portals to <body>, so audit the whole document. `color-contrast` is skipped HERE
  // because Tailwind utilities aren't compiled in this fast unit run — `text-popover-foreground`/
  // `bg-popover` don't resolve, so Sonner's default near-white text reports a FALSE contrast
  // failure. The REAL contrast is now proven by the compiled-CSS gate test/contrast.browser.test.tsx,
  // which mounts this Toaster, fires every variant (default/success/error/warning/info), waits for
  // each toast to fully settle, and runs axe `color-contrast` against the real token colors in BOTH
  // light and dark themes.
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("no a11y violations — error toast", async () => {
  await render(<Toaster />);
  toast.error("Something went wrong");
  await waitForToast("Something went wrong");
  // color-contrast disabled for the same reason as the default a11y test above —
  // Tailwind utilities aren't compiled in this fast unit run.
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("no a11y violations — loading toast", async () => {
  await render(<Toaster />);
  toast.loading("Saving changes");
  await waitForToast("Saving changes");
  // color-contrast disabled for the same reason as the default a11y test above —
  // Tailwind utilities aren't compiled in this fast unit run.
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
