'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/spinner` (dogfoods the registry) → auto-scanned.
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

export function spinner(): ReactNode {
  return (
    <Wrapper>
      <Spinner />
    </Wrapper>
  );
}

export function spinnerSizes(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Spinner size="xs" label="" />
      <Spinner size="sm" label="" />
      <Spinner size="default" label="" />
      <Spinner size="lg" label="" />
    </Wrapper>
  );
}

export function spinnerLabelled(): ReactNode {
  return (
    <Wrapper>
      {/* The visible text labels the loading region, so the spinner is decorative (label=""). */}
      <span className="flex items-center gap-2 text-base text-muted-foreground">
        <Spinner size="sm" label="" />
        Saving changes…
      </span>
    </Wrapper>
  );
}

export function spinnerColors(): ReactNode {
  return (
    <Wrapper className="gap-6">
      {/* The spinner draws in currentColor, so the ancestor text color recolors it. */}
      <span className="text-primary">
        <Spinner label="" />
      </span>
      <span className="text-success-text">
        <Spinner label="" />
      </span>
      <span className="text-destructive">
        <Spinner label="" />
      </span>
      {/* In-button: the spinner inherits the button's text color via currentColor. */}
      <Button disabled>
        <Spinner size="sm" label="" />
        Saving…
      </Button>
    </Wrapper>
  );
}
