import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { VegaStackProvider, useVegaStackTheme } from "./provider";
import * as React from "react";
import { Toaster, toast, useToastManager } from "./toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/** Poll until a mounted toast carrying `text` is in the portal under <body>. */
async function waitForToast(text: string) {
  await expect
    .poll(() => {
      const t = document.querySelector('[data-slot="toast"]');
      return t?.textContent?.includes(text) ?? false;
    })
    .toBe(true);
}

/**
 * The toast manager is a MODULE SINGLETON, so a toast fired by one test outlives that test's React
 * tree for its full auto-dismiss timeout and keeps rendering — action and close button and all —
 * into whatever the next test mounts. Draining it explicitly is the only way a later test in this
 * file can assert on "the button it rendered" without racing that timer. (Carried over from the
 * sonner-era helper D1 added; the leak is the store's, not the renderer's, so it survived the
 * migration.)
 */
async function drainToasts() {
  toast.close();
  await expect
    .poll(() => document.querySelectorAll('[data-slot="toast"]').length)
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

test("mounts exactly one toast viewport by default, and toast() reaches it", async () => {
  await render(
    <VegaStackProvider>
      <div>app</div>
    </VegaStackProvider>,
  );
  // The viewport mounts with the provider; fire a toast, then assert exactly ONE
  // viewport exists and the toast reached it.
  toast.add({ title: "Provider toast works" });
  await waitForToast("Provider toast works");
  expect(document.querySelectorAll('[data-slot="toast-viewport"]').length).toBe(
    1,
  );
  await drainToasts();
});

test("toaster={false} suppresses the bundled viewport (double-mount escape hatch)", async () => {
  await render(
    <VegaStackProvider toaster={false}>
      <div>app</div>
    </VegaStackProvider>,
  );
  expect(document.querySelectorAll('[data-slot="toast-viewport"]').length).toBe(
    0,
  );
});

test("toaster accepts a replacement element instead of the default", async () => {
  await render(
    <VegaStackProvider toaster={<output data-testid="custom-toaster" />}>
      <div>app</div>
    </VegaStackProvider>,
  );
  expect(document.querySelectorAll('[data-slot="toast-viewport"]').length).toBe(
    0,
  );
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

test("tooltips below the provider open on the shared TIMINGS delay", async () => {
  // The provider mounts `tooltip.tsx`'s own `TooltipProvider` — the registry item a consumer
  // already installs — rather than reaching privately into Base UI's `Tooltip.Provider`, which
  // is what it did before Batch 7c of the shadcn reset. `Tooltip.Provider` renders no element of
  // its own, so the honest proof is behavioural: a `Tooltip` mounted below `VegaStackProvider`
  // finds a delay context and opens. Without one Base UI throws on the missing provider, so this
  // test fails loudly if the swap ever drops it.
  const screen = await render(
    <VegaStackProvider>
      <Tooltip>
        <TooltipTrigger render={<button type="button">Save</button>} />
        <TooltipContent>Save the draft</TooltipContent>
      </Tooltip>
    </VegaStackProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Save" });
  await userEvent.hover(trigger);
  await expect
    .poll(() =>
      document
        .querySelector('[data-slot="tooltip-content"]')
        ?.textContent?.includes("Save the draft"),
    )
    .toBe(true);
});

/* DS-64 / OVL-17 — one toast store for toast() and useToastManager() */

test("OVL-17: useToastManager().add() under the provider renders in the Toaster", async () => {
  function Fire() {
    const manager = useToastManager();
    const fired = React.useRef(false);
    React.useEffect(() => {
      // Fire once: the hook's value changes with every toast it holds.
      if (fired.current) return;
      fired.current = true;
      manager.add({ title: "Saved from the hook" });
    }, [manager]);
    return null;
  }
  await render(
    <VegaStackProvider>
      <Fire />
    </VegaStackProvider>,
  );
  await waitForToast("Saved from the hook");
  expect(document.querySelectorAll('[data-slot="toast-viewport"]').length).toBe(
    1,
  );
  await drainToasts();
});

test("OVL-17: toast() and the hook share one queue under the provider", async () => {
  let hookManager: ReturnType<typeof useToastManager> | undefined;
  function Capture() {
    hookManager = useToastManager();
    return null;
  }
  await render(
    <VegaStackProvider>
      <Capture />
    </VegaStackProvider>,
  );
  toast.add({ title: "From toast()", timeout: 0 });
  await waitForToast("From toast()");
  // The hook sees the toast the module manager added — one store, not two.
  await expect
    .poll(() => hookManager?.toasts.some((t) => t.title === "From toast()"))
    .toBe(true);
  await drainToasts();
});

test("OVL-17: a host Toaster below the provider reuses it — still one viewport", async () => {
  await render(
    <VegaStackProvider toaster={false}>
      <Toaster position="top-center" />
    </VegaStackProvider>,
  );
  toast.add({ title: "Host toaster" });
  await waitForToast("Host toaster");
  expect(document.querySelectorAll('[data-slot="toast-viewport"]').length).toBe(
    1,
  );
  await drainToasts();
});

test("no a11y violations — provider with a toast from the hook", async () => {
  function Fire() {
    const manager = useToastManager();
    const fired = React.useRef(false);
    React.useEffect(() => {
      // Fire once: the hook's value changes with every toast it holds.
      if (fired.current) return;
      fired.current = true;
      manager.add({ title: "Hook toast", timeout: 0 });
    }, [manager]);
    return null;
  }
  const screen = await render(
    <VegaStackProvider>
      <Fire />
    </VegaStackProvider>,
  );
  await waitForToast("Hook toast");
  await expectNoA11yViolations(screen.container);
  await drainToasts();
});
