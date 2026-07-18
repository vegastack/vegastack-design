import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
import { MarketingSurface } from '@/components/ui/marketing-surface';
import { StaggeredTextReveal } from '@/components/ui/staggered-text-reveal';

export function staggeredTextReveal(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <h1 className="text-display-md text-foreground">
          <StaggeredTextReveal text="Ship agentic UI, fast." />
        </h1>
      </MarketingSurface>
    </Wrapper>
  );
}

export function staggeredTextRevealStep(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <h1 className="text-display-md text-foreground">
          <StaggeredTextReveal text="Slower per-word stagger" stepMultiplier={2} />
        </h1>
      </MarketingSurface>
    </Wrapper>
  );
}
