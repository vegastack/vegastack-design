'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/status-icon` (dogfoods the registry) → auto-scanned.
import { StatusIcon } from '@/components/ui/status-icon';

export function statusIcon(): ReactNode {
  return (
    <Wrapper>
      <StatusIcon status="progress" />
    </Wrapper>
  );
}

export function statusIconStates(): ReactNode {
  return (
    <Wrapper>
      <StatusIcon status="todo" />
      <StatusIcon status="progress" />
      <StatusIcon status="blocked" />
      <StatusIcon status="done" />
    </Wrapper>
  );
}

export function statusIconSizes(): ReactNode {
  return (
    <Wrapper>
      <StatusIcon status="done" size="xs" />
      <StatusIcon status="done" size="sm" />
      <StatusIcon status="done" size="default" />
      <StatusIcon status="done" size="lg" />
    </Wrapper>
  );
}

export function statusIconWithLabel(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-3">
      <span className="flex items-center gap-2 text-base text-muted-foreground">
        <StatusIcon status="todo" label="" />
        To do
      </span>
      <span className="flex items-center gap-2 text-base text-info-text">
        <StatusIcon status="progress" label="" />
        In progress
      </span>
      <span className="flex items-center gap-2 text-base text-destructive-text">
        <StatusIcon status="blocked" label="" />
        Blocked
      </span>
      <span className="flex items-center gap-2 text-base text-success-text">
        <StatusIcon status="done" label="" />
        Done
      </span>
    </Wrapper>
  );
}

export function statusIconStatusSizeMatrix(): ReactNode {
  const statuses = ['todo', 'progress', 'blocked', 'done'] as const;
  const sizes = ['xs', 'sm', 'default', 'lg'] as const;
  return (
    <Wrapper>
      <div className="grid grid-cols-4 gap-6">
        {statuses.map((status) =>
          sizes.map((size) => (
            <StatusIcon key={`${status}-${size}`} status={status} size={size} />
          )),
        )}
      </div>
    </Wrapper>
  );
}
