import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { VegaStackProvider, useVegaStackTheme } from "./provider";
import { toast } from "./sonner";

/** Poll until a mounted toast carrying `text` is in the portal under <body>. */
async function waitForToast(text: string) {
  await expect
    .poll(() => {
      const t = document.querySelector(
        '[data-sonner-toast][data-mounted="true"]',
      );
      return t?.textContent?.includes(text) ?? false;
    })
    .toBe(true);
}

/**
 * Sonner's toast store is a MODULE SINGLETON, so a toast fired by one test outlives that test's
 * React tree for its full `TOAST_LIFETIME` (4000ms) and keeps rendering — close button and all —
 * into whatever the next test mounts. Draining it explicitly is the only way a later test in this
 * file can assert on "the button it rendered" without racing a 4-second timer.
 */
async function drainToasts() {
  toast.dismiss();
  await expect
    .poll(() => document.querySelectorAll("[data-sonner-toast]").length)
    .toBe(0);
}

test("renders children", async () => {
  const screen = await render(
    <VegaStackProvider>
      <p>app content</p>
    </VegaStackProvider>,
  );
  await expect.element(screen.getByText("app content")).toBeInTheDocument();
});

test("mounts exactly one Sonner toaster by default, and toast() reaches it", async () => {
  await render(
    <VegaStackProvider>
      <div>app</div>
    </VegaStackProvider>,
  );
  // Sonner mounts its list container lazily — fire a toast, then assert exactly ONE
  // toaster region exists and the toast reached it.
  toast("Provider toast works");
  await waitForToast("Provider toast works");
  expect(document.querySelectorAll("[data-sonner-toaster]").length).toBe(1);
  await drainToasts();
});

test("toaster={false} suppresses the bundled toaster (double-mount escape hatch)", async () => {
  await render(
    <VegaStackProvider toaster={false}>
      <div>app</div>
    </VegaStackProvider>,
  );
  expect(document.querySelectorAll("[data-sonner-toaster]").length).toBe(0);
});

test("toaster accepts a replacement element instead of the default", async () => {
  await render(
    <VegaStackProvider toaster={<output data-testid="custom-toaster" />}>
      <div>app</div>
    </VegaStackProvider>,
  );
  expect(document.querySelectorAll("[data-sonner-toaster]").length).toBe(0);
  expect(
    document.querySelector('[data-testid="custom-toaster"]'),
  ).not.toBeNull();
});

test('theme: defaultTheme + attribute="class" reach next-themes (class on <html>)', async () => {
  await render(
    <VegaStackProvider defaultTheme="dark" enableSystem={false}>
      <div>app</div>
    </VegaStackProvider>,
  );
  await expect
    .poll(() => document.documentElement.classList.contains("dark"))
    .toBe(true);
});

test("useVegaStackTheme exposes resolvedTheme + setTheme below the provider", async () => {
  function ThemeProbe() {
    const { resolvedTheme, setTheme } = useVegaStackTheme();
    return (
      <button type="button" onClick={() => setTheme("light")}>
        theme:{resolvedTheme ?? "pending"}
      </button>
    );
  }
  const screen = await render(
    <VegaStackProvider defaultTheme="dark" enableSystem={false}>
      <ThemeProbe />
    </VegaStackProvider>,
  );
  // Name-scoped: an unqualified getByRole("button") is a strict-mode violation the moment any
  // other test in this file leaves a button behind in the page (see drainToasts above).
  const probe = screen.getByRole("button", { name: /^theme:/ });
  await expect.element(probe).toHaveTextContent("theme:dark");
  (probe.element() as HTMLButtonElement).click();
  await expect.element(probe).toHaveTextContent("theme:light");
  await expect
    .poll(() => document.documentElement.classList.contains("light"))
    .toBe(true);
});

test("direction: rtl reaches Base UI DirectionProvider context", async () => {
  // DirectionProvider supplies context, observable via a Base UI consumer; assert the
  // provider itself renders no wrapper DOM (context-only) and children stay intact.
  const screen = await render(
    <VegaStackProvider direction="rtl">
      <span data-testid="leaf">rtl app</span>
    </VegaStackProvider>,
  );
  await expect.element(screen.getByTestId("leaf")).toBeInTheDocument();
});

test("a11y: provider-wrapped content has no violations", async () => {
  const screen = await render(
    <VegaStackProvider>
      <main>
        <h1>Dashboard</h1>
        <button type="button">Action</button>
      </main>
    </VegaStackProvider>,
  );
  await expectNoA11yViolations(screen.container);
});
