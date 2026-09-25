// @vegastack provider@0.23.14 sha256-JvAym+DPttLACb0n4o35nF2vlSXnNv6U5CmqLz+nSEk=

"use client";

// Canonical registry source for the app-root provider. The package provider
// (`packages/ui/src/provider/vegastack-provider.tsx` + `use-vegastack-theme.ts`) is
// mirrored from this implementation so the private npm build and the registry copy-in
// do not diverge — if they must differ, change ONLY this file and re-mirror there.
// (Same discipline as the Toaster: `registry/ui/toast.tsx` ↔ `src/provider/toaster.tsx`.)

import * as React from "react";
import { TIMINGS } from "@vegastack/design";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ToastProvider, Toaster, toast } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Props accepted by `VegaStackProvider`. */
export interface VegaStackProviderProps extends Omit<
  React.ComponentProps<typeof NextThemesProvider>,
  "children"
> {
  /** The application subtree that receives theme, direction, tooltip, and toast context. */
  children: React.ReactNode;
  /** Text direction for Base UI components. @default 'ltr' */
  direction?: "ltr" | "rtl";
  /**
   * Controls the bundled `Toaster`. Mount-once portal toasters must not be
   * double-mounted, so pass `false` if you already render a `<Toaster />`
   * elsewhere, or pass your own element to override the default.
   * @default true
   */
  toaster?: boolean | React.ReactNode;
}

/**
 * `VegaStackProvider` — single root wrapper bundling theme (next-themes),
 * toasts (Base UI Toast), tooltip coordination, and text direction. Wrap your
 * app root with it exactly once; every VegaStack component below it then gets
 * dark mode, working `toast()` calls, shared tooltip delays, and direction
 * context for free.
 *
 * The host `<html>` needs `suppressHydrationWarning` (next-themes mutates it
 * on the client before hydration).
 *
 * `ToastProvider` always mounts with the module `toast` manager — so the
 * imperative `toast()` and `useToastManager()` write into one store — and a
 * host that renders its own `<Toaster />` below it reuses it, so there is still
 * one toast queue and one viewport. The `toaster` prop suppresses
 * (`false`) or replaces only the VISIBLE viewport, which is the part that must
 * not be mounted twice.
 *
 * Tooltip delays are set here from `TIMINGS`, so every tooltip in the app opens
 * on the same rhythm and there is exactly one place to change it. The provider it
 * mounts is `tooltip.tsx`'s own `TooltipProvider` — the registry item a consumer
 * already installs with `Tooltip` — not a second, private call into Base UI's
 * `Tooltip.Provider`. One `data-slot="tooltip-provider"` in the tree either way.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en" suppressHydrationWarning>
 *       <body>
 *         <VegaStackProvider>{children}</VegaStackProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function VegaStackProvider({
  children,
  direction = "ltr",
  toaster = true,
  ...themeProps
}: VegaStackProviderProps) {
  const toasterNode =
    toaster === true ? <Toaster /> : toaster === false ? null : toaster;
  // A custom `<Toaster limit timeout />` renders into this provider's store, so its queue settings
  // are this provider's.
  const { limit, timeout } = React.isValidElement<{
    limit?: number;
    timeout?: number;
  }>(toaster)
    ? toaster.props
    : {};
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
          <ToastProvider toastManager={toast} limit={limit} timeout={timeout}>
            {children}
            {toasterNode}
          </ToastProvider>
        </TooltipProvider>
      </DirectionProvider>
    </NextThemesProvider>
  );
}

/**
 * `useVegaStackTheme` — thin wrapper over next-themes' `useTheme()`. Returns the
 * resolved theme plus a `setTheme` setter (`'light' | 'dark' | 'system'`). The theme choice
 * lives in the user menu as a radio group, not as a toggle button on the page (DS-26).
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useVegaStackTheme();
 * <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
 *   <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
 *   <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
 *   <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
 * </DropdownMenuRadioGroup>
 * ```
 */
export function useVegaStackTheme() {
  return useTheme();
}
