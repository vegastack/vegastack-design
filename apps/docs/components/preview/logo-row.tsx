import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
import { MarketingSurface } from '@/components/ui/marketing-surface';
import { LogoRow } from '@/components/ui/logo-row';

const items = [
  { name: 'ACME' },
  { name: 'NIMBUS' },
  { name: 'COREBASE' },
  { name: 'LATTICE' },
  { name: 'OUTPOST' },
];

export function logoRow(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <LogoRow label="Built with" items={items} />
      </MarketingSurface>
    </Wrapper>
  );
}

export function logoRowLinked(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full rounded-lg p-8">
        <LogoRow items={[{ name: 'ACME', href: '#' }, { name: 'NIMBUS', href: '#' }]} />
      </MarketingSurface>
    </Wrapper>
  );
}
