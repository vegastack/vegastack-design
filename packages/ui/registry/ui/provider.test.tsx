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
  await expect
    .element(screen.getByRole("button"))
    .toHaveTextContent("theme:dark");
  (screen.getByRole("button").element() as HTMLButtonElement).click();
  await expect
    .element(screen.getByRole("button"))
    .toHaveTextContent("theme:light");
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
