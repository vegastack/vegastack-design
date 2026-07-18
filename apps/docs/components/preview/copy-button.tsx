'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/copy-button` (dogfoods the registry) → auto-scanned.
import { CopyButton } from '@/components/ui/copy-button';
// `toast` is re-exported from the copied-in Sonner component. The `<Toaster />`
// itself is already mounted in `VegaStackProvider`, so previews just call toast().
import { toast } from '@/components/ui/sonner';

export function copyButton(): ReactNode {
  return (
    <Wrapper>
      {/* Idle shows the Copy icon; pressing copies and flips to a Check tinted
          text-success for ~1.5s. The copied state is owned internally by the
          component — both states are exercised on this live instance, no
          doc-local state hack. */}
      <code className="rounded-md border border-fd-border bg-fd-muted px-2 py-1 font-mono text-base">
        npx shadcn add @vegastack/button
      </code>
      <CopyButton value="npx shadcn add @vegastack/button" />
    </Wrapper>
  );
}

export function copyButtonStates(): ReactNode {
  return (
    <Wrapper className="gap-8">
      {/* Idle — the default Copy icon. */}
      <div className="flex flex-col items-center gap-2">
        <CopyButton value="idle" />
        <span className="text-sm text-fd-muted-foreground">Idle</span>
      </div>
      {/* Copied — the success tint + label flip are owned internally and only
          appear after a real clipboard write, so this is a labelled live cell:
          click it to see the Check icon (text-success) + "Copied" label for ~1.5s. */}
      <div className="flex flex-col items-center gap-2">
        <CopyButton value="click me to see the copied state" />
        <span className="text-sm text-fd-muted-foreground">Copied (click — live)</span>
      </div>
      {/* Disabled — forwarded straight to the underlying Button. */}
      <div className="flex flex-col items-center gap-2">
        <CopyButton value="disabled" disabled />
        <span className="text-sm text-fd-muted-foreground">Disabled</span>
      </div>
    </Wrapper>
  );
}

export function copyButtonVariants(): ReactNode {
  return (
    <Wrapper>
      {/* Defaults to ghost / icon-sm, but every Button presentation prop is forwarded. */}
      <CopyButton value="ghost" />
      <CopyButton value="outline" variant="outline" />
      <CopyButton value="secondary" variant="secondary" />
      <CopyButton value="destructive" variant="destructive" />
    </Wrapper>
  );
}

export function copyButtonSizes(): ReactNode {
  return (
    <Wrapper>
      {/* `size` is forwarded too — icon sizes keep the button square. */}
      <CopyButton value="icon-sm" variant="outline" size="icon-sm" />
      <CopyButton value="icon" variant="outline" size="icon" />
      <CopyButton value="icon-lg" variant="outline" size="icon-lg" />
    </Wrapper>
  );
}

export function copyButtonWithToast(): ReactNode {
  return (
    <Wrapper>
      {/* `onCopied` fires after a successful write — surface a toast (live). */}
      <code className="rounded-md border border-fd-border bg-fd-muted px-2 py-1 font-mono text-base">
        vsk_live_3f9a…
      </code>
      <CopyButton
        value="vsk_live_3f9a8c21d40e"
        variant="outline"
        onCopied={() => toast.success('API key copied')}
      />
    </Wrapper>
  );
}
