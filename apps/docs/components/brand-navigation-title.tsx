import { appName } from "@/lib/shared";

/** Official VegaStack wordmark with a docs-product label for Fumadocs navigation chrome. */
export function BrandNavigationTitle() {
  return (
    <span
      className="flex min-w-0 items-center gap-2 text-foreground"
      data-brand-navigation-title
    >
      <span aria-hidden="true" className="vegastack-wordmark-mask shrink-0" />
      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
      <span
        aria-hidden="true"
        className="shrink-0 font-mono text-label uppercase text-muted-foreground"
      >
        Design
      </span>
      <span className="sr-only">{appName}</span>
    </span>
  );
}
