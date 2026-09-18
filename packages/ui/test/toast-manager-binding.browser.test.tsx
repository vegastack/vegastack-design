import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, expect, test } from "vitest";
import { VegaStackProvider } from "../src/provider/vegastack-provider";
import { Toaster, toast } from "../registry/ui/toast";
import { toast as packageToast } from "../src/provider/toaster";

/**
 * The toast manager is a MODULE SINGLETON, so a toast fired here outlives the React tree that
 * showed it. Every mounted viewport that shares the manager would replay it into the next test.
 */
afterEach(() => {
  toast.close();
  packageToast.close();
});

/** How many toast nodes are currently mounted in the portal under <body>. */
const toastCount = () =>
  document.querySelectorAll('[data-slot="toast"]').length;

const hasToast = (text: string) =>
  [...document.querySelectorAll('[data-slot="toast"]')].some((element) =>
    element.textContent?.includes(text),
  );

/**
 * The toast surface exists in TWO modules that each call `Toast.createToastManager()` at module
 * scope: the canonical registry item (`registry/ui/toast.tsx`, which is what `shadcn add` copies
 * in) and its byte-for-byte package mirror (`src/provider/toaster.tsx`, re-exported from
 * `@vegastack/ui`). Two modules, two stores — that part has not changed.
 *
 * What DID change is the binding. Before the shadcn reset, `Toaster` was a bare viewport: it
 * rendered whatever the nearest `ToastProvider` above it was bound to, so a copy-in viewport under
 * the package's provider was a silent black hole — no error, no console warning, no toast. That is
 * what the docs app shipped after the O2 sonner→Base UI migration: five triggers on
 * `/docs/components/toast`, zero toasts, live in production until the 2026-09-07 appearance probes
 * caught it.
 *
 * Upstream's `Toaster` (Batch 4 of the reset) mounts its OWN `ToastProvider`, defaulted to its own
 * module's manager — `toastManager = toast` in `toast.tsx`. The black hole is closed by
 * construction: a viewport is bound to the manager its own module owns, whatever provider happens
 * to be above it. These two tests pin both halves of the new rule, so the day that default is
 * dropped the first one fails.
 *
 * `tooling/verify-provider-dogfood.mjs` enforces the structural half in `apps/docs`.
 */
test("a copy-in Toaster binds to its own module's manager, under any outer provider", async () => {
  await render(
    <VegaStackProvider toaster={false}>
      <Toaster />
    </VegaStackProvider>,
  );
  // `VegaStackProvider` mounts the PACKAGE `ToastProvider`. The copy-in viewport above brings its
  // own provider bound to the copy-in manager, which is the one this `toast.add()` writes to.
  toast.add({ title: "Same-module toast", timeout: 0 });
  await expect
    .poll(() => hasToast("Same-module toast"), { timeout: 2000 })
    .toBe(true);
});

test("a toast fired on the OTHER module's manager still shows nothing in it", async () => {
  await render(<Toaster />);
  // Two modules, two stores: the package mirror's manager has no viewport mounted here.
  packageToast.add({ title: "Cross-module toast", timeout: 0 });
  await new Promise((resolve) => setTimeout(resolve, 500));
  expect(toastCount()).toBe(0);
});
