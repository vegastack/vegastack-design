'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/kbd` (dogfoods the registry) → auto-scanned.
import { Kbd, KbdGroup } from '@/components/ui/kbd';

export function kbd(): ReactNode {
  return (
    <Wrapper>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
      <Kbd>Esc</Kbd>
    </Wrapper>
  );
}

export function kbdCombos(): ReactNode {
  return (
    <Wrapper>
      <Kbd keys={['⌘', 'K']} />
      <Kbd keys={['⌘', '⇧', 'P']} />
      <Kbd keys={['⌘', '⏎']} />
      <KbdGroup>
        <Kbd>⌃</Kbd>
        <Kbd>⌫</Kbd>
      </KbdGroup>
    </Wrapper>
  );
}

export function kbdSizes(): ReactNode {
  return (
    <Wrapper>
      <Kbd size="xs">⌘</Kbd>
      <Kbd size="sm">⌘</Kbd>
      <Kbd size="default">⌘</Kbd>
    </Wrapper>
  );
}

export function kbdPlatformLabels(): ReactNode {
  // The distinguishing feature: the same shortcut tokens render mac glyphs by
  // default and readable Windows/Linux words under `os="other"`. The rewrite
  // applies to the `keys` array AND to a single string child (bottom row).
  return (
    <Wrapper className="flex-col items-start gap-4">
      {/* Scroll container + tighter small-width gap so the columns stay legible at 375px. */}
      <div className="w-full max-w-full overflow-x-auto">
        <div
          className="grid w-max grid-cols-[auto_auto_auto] items-center gap-x-4 gap-y-4 sm:gap-x-8"
          role="presentation"
        >
          <span className="text-sm text-muted-foreground">Shortcut</span>
          <span className="text-sm text-muted-foreground">mac (default)</span>
          <span className="text-sm text-muted-foreground">other</span>

          <span className="text-sm text-muted-foreground">Command palette</span>
          <Kbd os="mac" keys={['⌘', 'K']} />
          <Kbd os="other" keys={['⌘', 'K']} />

          <span className="text-sm text-muted-foreground">Save</span>
          <Kbd os="mac" keys={['⌘', '⇧', 'S']} />
          <Kbd os="other" keys={['⌘', '⇧', 'S']} />

          <span className="text-sm text-muted-foreground">Delete back</span>
          <Kbd os="mac" keys={['⌃', '⌫']} />
          <Kbd os="other" keys={['⌃', '⌫']} />

          {/* Single string child is rewritten too — ⌘ becomes "Ctrl" under `other`. */}
          <span className="text-sm text-muted-foreground">Single key</span>
          <Kbd os="mac">⌘</Kbd>
          <Kbd os="other">⌘</Kbd>
        </div>
      </div>
    </Wrapper>
  );
}
