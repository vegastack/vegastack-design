'use client';

import { useState, type ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/notification-bell` (dogfoods the registry) → auto-scanned.
import { NotificationBell } from '@/components/ui/notification-bell';
import { Button } from '@/components/ui/button';

export function notificationBell(): ReactNode {
  return (
    <Wrapper>
      <NotificationBell count={3} />
    </Wrapper>
  );
}

export function notificationBellCounts(): ReactNode {
  return (
    <Wrapper>
      <NotificationBell count={0} />
      <NotificationBell count={5} />
      <NotificationBell count={42} />
      <NotificationBell count={250} />
      <NotificationBell count={8} dot />
    </Wrapper>
  );
}

export function notificationBellOverflow(): ReactNode {
  return (
    <Wrapper>
      {/* count={99} is the exact cap (still numeric); count={100} is the first overflow → "99+". */}
      <NotificationBell count={99} />
      <NotificationBell count={100} />
    </Wrapper>
  );
}

export function notificationBellMotion(): ReactNode {
  const [count, setCount] = useState(0);
  return (
    <Wrapper className="flex-col gap-4">
      <NotificationBell count={count} />
      <Button variant="outline" size="sm" onClick={() => setCount((c) => c + 1)}>
        Simulate new notification
      </Button>
    </Wrapper>
  );
}

export function notificationBellPassthrough(): ReactNode {
  return (
    <Wrapper>
      {/* IconButtonProps (size, variant, disabled, …) forward straight through. */}
      <NotificationBell count={3} size="xs" />
      <NotificationBell count={3} size="sm" />
      <NotificationBell count={3} size="default" />
      <NotificationBell count={3} size="lg" />
      <NotificationBell count={3} variant="outline" />
      <NotificationBell count={3} variant="ghost" />
      <NotificationBell count={3} disabled />
    </Wrapper>
  );
}
