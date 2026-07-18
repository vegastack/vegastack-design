'use client';

import dynamic from 'next/dynamic';

/**
 * Lazily code-splits `ParticleField`'s JS (not just its draw loop — the
 * component itself is already idle/visibility-gated internally) out of the
 * initial docs-home bundle. `next/dynamic`'s `ssr: false` requires a Client
 * Component boundary, so this tiny wrapper is that boundary — `page.tsx`
 * stays a Server Component and just renders this.
 */
const ParticleField = dynamic(
  () => import('@/components/ui/particle-field').then((mod) => mod.ParticleField),
  { ssr: false },
);

export function HomeHeroParticles(props: React.ComponentProps<typeof ParticleField>) {
  return <ParticleField {...props} />;
}
