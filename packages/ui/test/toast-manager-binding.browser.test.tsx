import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, expect, test } from "vitest";
import { VegaStackProvider } from "../src/provider/vegastack-provider";
import {
  ToastProvider,
  Toaster,
  toast,
  toastManager,
} from "../registry/ui/toast";

/**
 * The toast manager is a MODULE SINGLETON, so a toast fired here outlives the React tree that
 * showed it. Every mounted viewport that shares the manager would replay it into the next test.
 */
afterEach(() => {
  toastManager.close();
});

/** How many toast nodes are currently mounted in the portal under <body>. */
const toastCount = () =>
  document.querySelectorAll('[data-slot="toast"]').length;

/**
 * The toast surface exists in TWO modules that each call `Toast.createToastManager()` at module
 * scope: the canonical registry item (`registry/ui/toast.tsx`, which is what `shadcn add` copies
 * in) and its byte-for-byte package mirror (`src/provider/toaster.tsx`, re-exported from
 * `@vegastack/ui`). Two modules, two stores.
 *
 * `toast()` writes into ITS OWN module's manager; a `<Toaster/>` renders whatever the nearest
 * `ToastProvider` above it is BOUND to. So a viewport from one module under a provider from the
 * other is a silent black hole — no error, no console warning, no toast. That is exactly what the
 * docs app shipped after the O2 sonner→Base UI migration (`sonner`'s emitter was global, so the
 * same composition used to work): five triggers on `/docs/components/toast`, zero toasts, live in
 * production until the 2026-09-07 appearance probes caught it.
 *
 * These two tests pin both halves of the rule. `tooling/verify-provider-dogfood.mjs` enforces the
 * structural half — that `apps/docs/components/provider.tsx` cannot mount a copy-in `<Toaster/>`
 * without the matching `<ToastProvider>` from the same module.
 */
test("a copy-in Toaster bound to a different module's manager shows nothing", async () => {
  await render(
    <VegaStackProvider toaster={false}>
      <Toaster />
    </VegaStackProvider>,
  );
  // `VegaStackProvider` mounts the PACKAGE `ToastProvider`, so the copy-in viewport above listens
  // to the package store while this `toast()` writes into the registry store.
  toast("Cross-manager toast");
  await new Promise((resolve) => setTimeout(resolve, 500));
  expect(toastCount()).toBe(0);
});

test("the docs composition — copy-in ToastProvider + Toaster under the package provider — shows a toast", async () => {
  await render(
    <VegaStackProvider toaster={false}>
      <ToastProvider>
        <Toaster />
      </ToastProvider>
    </VegaStackProvider>,
  );
  toast("Same-manager toast");
  await expect
    .poll(
      () =>
        [...document.querySelectorAll('[data-slot="toast"]')].some((element) =>
          element.textContent?.includes("Same-manager toast"),
        ),
      { timeout: 2000 },
    )
    .toBe(true);
});
