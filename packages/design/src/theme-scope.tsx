"use client";

import * as React from "react";

const InternalThemeScopeContext = React.createContext<string | undefined>(
  undefined,
);

/**
 * Carries a semantic theme-scope class through React's tree, including across
 * portals whose DOM nodes are mounted outside the scoped source subtree.
 *
 * @internal Registry infrastructure only. This is not a consumer-facing
 * theming API; use `MarketingSurface` to establish the supported scope.
 */
export function InternalThemeScopeProvider({
  children,
  scope,
}: {
  children: React.ReactNode;
  scope: string;
}) {
  return (
    <InternalThemeScopeContext.Provider value={scope}>
      {children}
    </InternalThemeScopeContext.Provider>
  );
}

/**
 * Reads the nearest semantic theme-scope class so portaled surfaces can apply
 * it to their actual DOM roots instead of falling back to the page theme.
 *
 * @internal Registry infrastructure only. Components outside the canonical
 * overlay implementations must not depend on this hook.
 */
export function useInternalThemeScope(): string | undefined {
  return React.useContext(InternalThemeScopeContext);
}
