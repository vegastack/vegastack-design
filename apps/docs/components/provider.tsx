"use client";
import SearchDialog from "@/components/search";
import { RootProvider } from "fumadocs-ui/provider/next";
// Dogfood the PUBLISHED package entrypoint: the docs tree is wrapped by
// `VegaStackProvider` imported from `@vegastack/ui`, so a broken/divergent package
// entrypoint (theme + Base UI direction + Tooltip.Provider + toaster) fails the docs
// typecheck/build instead of silently passing.
import { VegaStackProvider } from "@vegastack/ui";
// Dogfood the REGISTRY item too: mount the copied-in Toaster (the exact registry source
// consumers get) as the single toaster, so the Toast showcase exercises the copy-in (a
// registry/copy-in divergence would surface here). `VegaStackProvider` therefore runs with
// `toaster={false}` so we don't double-mount a portal toaster; the package's own Toaster is
// covered by its package tests + the reconciliation in src/provider/toaster.tsx.
import { Toaster } from "@/components/ui/sonner";
import { type ReactNode } from "react";

export function Provider({ children }: { children: ReactNode }) {
  return (
    // Fumadocs `RootProvider` stays the outer shell (search + its own DirectionProvider),
    // but its next-themes ThemeProvider is disabled — `VegaStackProvider` is the single owner
    // of theme (next-themes), Base UI direction, and tooltips, so nothing is double-mounted.
    //
    // fumadocs-ui 16.13 added a global `d` hotkey that toggles light/dark. It is mounted by
    // `RootProvider` INSIDE the `theme?.enabled !== false` branch (fumadocs-ui 16.15.8,
    // dist/provider/base.js — `const { enabled: _, hotKey = "d", ...themeProps } = theme`), so
    // `enabled: false` already keeps it off this site: no window `keydown` listener is
    // registered, and typing `d` in a component showcase does nothing. If theme ownership ever
    // moves back to fumadocs, add `hotKey: false` here — a bare `d` swallowed from every
    // non-editable element is a hazard on 110 interactive component pages.
    <RootProvider search={{ SearchDialog }} theme={{ enabled: false }}>
      <VegaStackProvider toaster={false}>
        {children}
        <Toaster />
      </VegaStackProvider>
    </RootProvider>
  );
}
