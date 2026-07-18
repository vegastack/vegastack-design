import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
import { MarketingSurface } from '@/components/ui/marketing-surface';
import { SectionHeader } from '@/components/ui/section-header';

export function sectionHeader(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <SectionHeader
          eyebrow="Platform"
          title="Ship agentic UI, fast."
          description="Tokens, components, and a private registry — one system for humans and agents."
        />
      </MarketingSurface>
    </Wrapper>
  );
}

export function sectionHeaderEmphasis(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <SectionHeader
          eyebrow="01 / Platform"
          title={
            <>
              Built for <em className="font-serif italic">agentic</em> teams
            </>
          }
          size="lg"
        />
      </MarketingSurface>
    </Wrapper>
  );
}

export function sectionHeaderSizes(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6 p-0">
      <MarketingSurface className="flex w-full flex-col gap-6 rounded-lg p-8">
        <SectionHeader eyebrow="sm" title="Section header" size="sm" />
        <SectionHeader eyebrow="md" title="Section header" size="md" />
        <SectionHeader eyebrow="lg" title="Section header" size="lg" />
        <SectionHeader eyebrow="xl" title="Section header" size="xl" />
      </MarketingSurface>
    </Wrapper>
  );
}

export function sectionHeaderCenter(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <SectionHeader
          align="center"
          eyebrow="Now shipping"
          title="One system, every surface."
          description="Product and marketing share the same tokens — only the ground shifts."
        />
      </MarketingSurface>
    </Wrapper>
  );
}
