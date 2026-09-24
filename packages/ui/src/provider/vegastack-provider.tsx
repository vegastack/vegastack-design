"use client";

// This PACKAGE provider mirrors the canonical registry source
// (`packages/ui/registry/ui/provider.tsx`) so the npm build and the registry copy-in do
// not diverge. Keep them identical (composition order + props + defaults); the only
// intentional differences are the Toaster import path (`./toaster` here vs the consumer
// alias `@/components/ui/toast` there) and the registry header stamp. `TooltipProvider` is
// imported through the same consumer alias in both files — there is no second tooltip mirror. If they must
// differ, change ONLY the registry source and re-mirror here — do not let behaviour drift.

import * as React from "react";
import { TIMINGS } from "@vegastack/design";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ToastProvider, Toaster, toast } from "./toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export interface VegaStackProviderProps extends Omit<
  React.ComponentProps<typeof NextThemesProvider>,
  "children"
> {
  children: React.ReactNode;
  /** Text direction for Base UI components. @default 'ltr' */
  direction?: "ltr" | "rtl";
  /**
   * Controls the bundled `Toaster`. Mount-once portal toasters must not be
   * double-mounted, so pass `false` if you already render a `<Toaster />`
   * elsewhere (e.g. a registry copy-in), or pass your own element to override
   * the default. @default true
   */
  toaster?: boolean | React.ReactNode;
}

/**
 * `VegaStackProvider` — single root wrapper bundling theme (next-themes),
 * toasts (Base UI Toast), tooltip coordination, and text direction. Wrap your
 * app root with it exactly once.
 *
 * The host `<html>` needs `suppressHydrationWarning` (next-themes mutates it).
 *
 * `ToastProvider` always mounts with the module `toast` manager — so the
 * imperative `toast()` and `useToastManager()` write into one store — and a
 * `<Toaster />` below it reuses it. The `toaster` prop suppresses (`false`) or
 * replaces only the VISIBLE viewport, which is the part that must not be
 * mounted twice.
 */
export function VegaStackProvider({
  children,
  direction = "ltr",
  toaster = true,
  ...themeProps
}: VegaStackProviderProps) {
  const toasterNode =
    toaster === true ? <Toaster /> : toaster === false ? null : toaster;
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...themeProps}
    >
      <DirectionProvider direction={direction}>
        <TooltipProvider
          delay={TIMINGS.tooltipOpenDelayMs}
          closeDelay={TIMINGS.tooltipCloseDelayMs}
        >
          {/* OVL-17: the provider carries the module `toast` manager, so `toast()` and
              `useToastManager()` feed one store, and the bundled `Toaster` renders into it. */}
          <ToastProvider toastManager={toast}>
            {children}
            {toasterNode}
          </ToastProvider>
        </TooltipProvider>
      </DirectionProvider>
    </NextThemesProvider>
  );
}
