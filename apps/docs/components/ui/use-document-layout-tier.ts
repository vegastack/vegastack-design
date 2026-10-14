// @vegastack document-layout@0.25.41 sha256-trwWi7jVxtDZoTSR8mdh7VmmfJoXHm2wdFodJJRYg/A=

"use client";

import * as React from "react";
import type { DocumentLayoutTier } from "@/components/ui/document-layout";

const TIERS = new Set<DocumentLayoutTier>(["s", "m", "l", "xl"]);

/**
 * `useDocumentLayoutTier` — the tier a `DocumentLayout` is at now (`s` · `m` · `l` · `xl`), for
 * the branches CSS cannot take: comments in the margin or in a popover, the contents in a list or
 * a sheet. It reads `--document-layout-tier`, which the layout's container queries set, so the
 * script and the stylesheet can never disagree about the width a tier starts at. Re-read whenever
 * the layout resizes. `fallback` is the answer on the server and before the first measurement.
 *
 * @example
 * const ref = React.useRef<HTMLDivElement>(null);
 * const tier = useDocumentLayoutTier(ref);
 * return <DocumentLayout ref={ref} margin>{tier === "s" ? sheet : margin}</DocumentLayout>;
 */
export function useDocumentLayoutTier(
  ref: React.RefObject<HTMLElement | null>,
  fallback: DocumentLayoutTier = "xl",
): DocumentLayoutTier {
  const [tier, setTier] = React.useState<DocumentLayoutTier>(fallback);
  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const grid =
      root.querySelector<HTMLElement>("[data-slot=document-layout-grid]") ??
      root;
    const read = () => {
      const value = getComputedStyle(grid)
        .getPropertyValue("--document-layout-tier")
        .trim() as DocumentLayoutTier;
      if (TIERS.has(value)) setTier(value);
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(root);
    return () => observer.disconnect();
  }, [ref]);
  return tier;
}
