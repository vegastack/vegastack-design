'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
// Dogfood the PUBLISHED package entrypoint: the docs tree is wrapped by
// `VegaStackProvider` imported from `@vegastack/ui`, so a broken/divergent package
// entrypoint (theme + Base UI direction + Tooltip.Provider + toaster) fails the docs
// typecheck/build instead of silently passing.
import { VegaStackProvider } from '@vegastack/ui';
// Dogfood the REGISTRY item too: mount the copied-in Toaster (the exact registry source
// consumers get) as the single toaster, so the Toast showcase exercises the copy-in (a
// registry/copy-in divergence would surface here). `VegaStackProvider` therefore runs with
// `toaster={false}` so we don't double-mount a portal toaster; the package's own Toaster is
// covered by its package tests + the reconciliation in src/provider/toaster.tsx.
import { Toaster } from '@/components/ui/sonner';
import { type ReactNode } from 'react';

export function Provider({ children }: { children: ReactNode }) {
  return (
    // Fumadocs `RootProvider` stays the outer shell (search + its own DirectionProvider),
    // but its next-themes ThemeProvider is disabled — `VegaStackProvider` is the single owner
    // of theme (next-themes), Base UI direction, and tooltips, so nothing is double-mounted.
    <RootProvider search={{ SearchDialog }} theme={{ enabled: false }}>
      <VegaStackProvider toaster={false}>
        {children}
        <Toaster />
      </VegaStackProvider>
    </RootProvider>
  );
}
