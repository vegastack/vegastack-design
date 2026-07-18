'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Tooltip } from '@base-ui/react/tooltip';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Toaster } from './toaster';

export interface VegaStackProviderProps
  extends Omit<React.ComponentProps<typeof NextThemesProvider>, 'children'> {
  children: React.ReactNode;
  /** Text direction for Base UI components. @default 'ltr' */
  direction?: 'ltr' | 'rtl';
  /**
   * Controls the bundled {@link Toaster}. Mount-once portal toasters must not be
   * double-mounted, so pass `false` if you already render a `<Toaster />`
   * elsewhere (e.g. a registry copy-in), or pass your own element to override
   * the default. @default true
   */
  toaster?: boolean | React.ReactNode;
}

/**
 * `VegaStackProvider` — single root wrapper bundling theme (next-themes),
 * toasts (Sonner), tooltips, and text direction. Wrap your app root with it.
 *
 * The host `<html>` needs `suppressHydrationWarning` (next-themes mutates it).
 *
 * The `toaster` prop lets a host suppress (`false`) or replace the bundled
 * `<Toaster />` — necessary because a Sonner toaster is a mount-once portal that
 * must not be mounted twice.
 */
export function VegaStackProvider({
  children,
  direction = 'ltr',
  toaster = true,
  ...themeProps
}: VegaStackProviderProps) {
  const toasterNode = toaster === true ? <Toaster /> : toaster === false ? null : toaster;
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
