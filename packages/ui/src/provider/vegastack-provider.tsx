"use client";

// This PACKAGE provider mirrors the canonical registry source
// (`packages/ui/registry/ui/provider.tsx`) so the npm build and the registry copy-in do
// not diverge. Keep them identical (composition order + props + defaults); the only
// intentional differences are the Toaster import path (`./toaster` here vs the consumer
// alias `@/components/ui/sonner` there) and the registry header stamp. If they must
// differ, change ONLY the registry source and re-mirror here — do not let behaviour drift.

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Tooltip } from "@base-ui/react/tooltip";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Toaster } from "./toaster";

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
 * toasts (Sonner), tooltip coordination, and text direction. Wrap your app
 * root with it exactly once.
 *
 * The host `<html>` needs `suppressHydrationWarning` (next-themes mutates it).
 *
 * The `toaster` prop lets a host suppress (`false`) or replace the bundled
 * `<Toaster />` — necessary because a Sonner toaster is a mount-once portal that
 * must not be mounted twice.
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
        <Tooltip.Provider>
          {children}
          {toasterNode}
        </Tooltip.Provider>
      </DirectionProvider>
    </NextThemesProvider>
  );
}
