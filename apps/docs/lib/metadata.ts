import type { Metadata } from 'next';
import { appName } from './shared';

// Canonical host confirmed in docs/plans/detail/04-registry-and-cloudflare.md (the registry
// `homepage` + the Cloudflare Access application domain are both `design.vegastack.com`). The
// docs app and the `/r/*` registry are served from the same Worker, so this is also the docs
// site's own public URL.
export const siteUrl = new URL('https://design.vegastack.com');

const defaultDescription =
  "VegaStack's internal design system: Base UI primitives, Tailwind v4 tokens, a live component showcase, and a private registry consumable by humans and AI agents.";

/**
 * Merges page-level metadata overrides with the site-wide openGraph/twitter defaults. Mirrors the
 * fumadocs.dev `createMetadata` pattern (see /Users/kmanojkumar/code/references/fumadocs/apps/docs/lib/metadata.ts)
 * adapted for the VegaStack brand + static export (no per-request host lookup).
 */
export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? defaultDescription,
      url: '/',
      siteName: appName,
      type: 'website',
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: override.title ?? undefined,
      description: override.description ?? defaultDescription,
      ...override.twitter,
    },
  };
}

export { defaultDescription };
