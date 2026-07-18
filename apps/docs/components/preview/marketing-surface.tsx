import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/marketing-surface` (dogfoods the registry) →
// auto-scanned.
import { MarketingSurface } from '@/components/ui/marketing-surface';
import { Button } from '@/components/ui/button';

export function marketingSurface(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="flex w-full flex-col items-start gap-3 rounded-lg p-8">
        <p className="font-mono text-mono-label text-muted-foreground uppercase">VegaStack</p>
        <p className="text-display-sm text-foreground">Always the dark brand ground.</p>
        <p className="max-w-md text-foreground/(--opacity-hint)">
          This card sits on a light docs page, but everything inside the marketing surface renders
          the brand&apos;s dark warm ground — independent of the page theme.
        </p>
        <Button variant="cta">Get started</Button>
      </MarketingSurface>
    </Wrapper>
  );
}

export function marketingSurfaceRender(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface render={<section />} className="w-full rounded-lg p-6">
        <p className="font-mono text-mono-label text-muted-foreground uppercase">
          Composed as a &lt;section&gt;
        </p>
      </MarketingSurface>
    </Wrapper>
  );
}
