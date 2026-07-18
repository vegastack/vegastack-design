'use client';

import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Wrapper } from './wrapper';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
// The docs app itself is wrapped in the root provider, so previews demonstrate the
// CAPABILITIES the provider unlocks (theme, toasts, tooltip coordination) rather than
// mounting a second VegaStackProvider — its Toaster is a mount-once portal.
import { useVegaStackTheme } from '@/components/ui/provider';
import { toast } from '@/components/ui/sonner';

export function providerDemo(): ReactNode {
  return (
    <Wrapper>
      <ThemeToggleDemo />
      <Button variant="outline" onClick={() => toast.success('Wired through the provider')}>
        Fire a toast
      </Button>
    </Wrapper>
  );
}

function ThemeToggleDemo() {
  const { resolvedTheme, setTheme } = useVegaStackTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <Button
      variant="outline"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun /> : <Moon />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </Button>
  );
}

export function providerTooltips(): ReactNode {
  return (
    <Wrapper>
      {/* Shared-delay proof: hover the first, then move across — the rest follow instantly. */}
      {(['Cut', 'Copy', 'Paste'] as const).map((label) => (
        <Tooltip key={label}>
          <TooltipTrigger render={<Button variant="outline">{label}</Button>} />
          <TooltipContent>{label} selection</TooltipContent>
        </Tooltip>
      ))}
    </Wrapper>
  );
}
