// @vegastack provider@0.116.0 sha256-AmbcV8QRQl/N1r3in4BGB0yiFsriNTXG5dzzWErG8pY=

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
  /**
   * Mount the toast context here. `false` leaves toasts out of this provider, so the layouts that
   * show them mount `VegaStackToasts` themselves and a route group without toasts mounts no toast
   * viewport. `toaster` is ignored when it is `false`.
   * @default true
   */
  toasts?: boolean;
  /**
   * Mount the shared tooltip delays here. `false` leaves them to a `VegaStackTooltips` in the
   * layouts that show tooltips.
   * @default true
   */
  tooltips?: boolean;
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
 * Toasts and tooltip delays can sit lower instead: `toasts={false}` and `tooltips={false}` leave
 * them out, and `VegaStackToasts` and `VegaStackTooltips` mount them in the layouts that use them.
 *
 * `ToastProvider` (in `VegaStackToasts`) mounts with the module `toast` manager — so the
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
  toasts = true,
  tooltips = true,
  ...themeProps
}: VegaStackProviderProps) {
  let content = children;
  if (toasts)
    content = <VegaStackToasts toaster={toaster}>{content}</VegaStackToasts>;
  if (tooltips) content = <VegaStackTooltips>{content}</VegaStackTooltips>;
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...themeProps}
    >
      <DirectionProvider direction={direction}>{content}</DirectionProvider>
    </NextThemesProvider>
  );
}

/** Props accepted by `VegaStackToasts`. */
export interface VegaStackToastsProps {
  /** The subtree whose `toast()` calls show. */
  children: React.ReactNode;
  /**
   * The visible viewport: `true` the bundled `Toaster`, `false` none (a `<Toaster />` you render
   * below reuses this store), or your own element.
   * @default true
   */
  toaster?: boolean | React.ReactNode;
}

/**
 * `VegaStackToasts` — the toast context on its own: the module `toast` manager's provider and one
 * viewport. `VegaStackProvider` mounts it unless `toasts={false}`; mount it yourself in the
 * layouts that toast, once per tree.
 *
 * @example
 * // app/(app)/layout.tsx, under a root <VegaStackProvider toasts={false}>
 * <VegaStackToasts toaster={<Toaster position="bottom-center" />}>{children}</VegaStackToasts>
 */
export function VegaStackToasts({
  children,
  toaster = true,
}: VegaStackToastsProps) {
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
    // OVL-17: the provider carries the module `toast` manager, so `toast()` and
    // `useToastManager()` feed one store, and the bundled `Toaster` renders into it.
    <ToastProvider toastManager={toast} limit={limit} timeout={timeout}>
      {children}
      {toasterNode}
    </ToastProvider>
  );
}

/**
 * `VegaStackTooltips` — the shared tooltip delays (`TIMINGS`) on their own, through
 * `tooltip.tsx`'s `TooltipProvider`. `VegaStackProvider` mounts it unless `tooltips={false}`.
 *
 * @example
 * <VegaStackTooltips>{children}</VegaStackTooltips>
 */
export function VegaStackTooltips({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider
      delay={TIMINGS.tooltipOpenDelayMs}
      closeDelay={TIMINGS.tooltipCloseDelayMs}
    >
      {children}
    </TooltipProvider>
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
