"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/notification-bell` (dogfoods the registry) → auto-scanned.
import {
  NotificationBell,
  NotificationDot,
} from "@/components/ui/notification-bell";
import { Button } from "@/components/ui/button";

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
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCount((c) => c + 1)}
      >
        Simulate new notification
      </Button>
    </Wrapper>
  );
}

export function notificationBellPassthrough(): ReactNode {
  return (
    <Wrapper>
      {/* Button props (size, variant, disabled, …) forward straight through. */}
      <NotificationBell count={3} size="icon-xs" />
      <NotificationBell count={3} size="icon-sm" />
      <NotificationBell count={3} size="icon" />
      <NotificationBell count={3} size="icon-lg" />
      <NotificationBell count={3} variant="outline" />
      <NotificationBell count={3} variant="ghost" />
      <NotificationBell count={3} disabled />
    </Wrapper>
  );
}

const THREADS = [
  { title: "Design review for the billing page", unread: true },
  { title: "Quarterly planning notes", unread: false },
  { title: "Invoice 1042 failed to send", unread: true, attention: true },
];

// The shared unread dot on list rows: primary for "unread", destructive for
// something that needs attention. The dot is decorative, so each row says
// "unread" in its own text for screen readers.
export function notificationBellDot(): ReactNode {
  return (
    <Wrapper>
      <ul className="flex w-full max-w-sm flex-col divide-y divide-border rounded-lg border border-border bg-background">
        {THREADS.map((thread) => (
          <li
            key={thread.title}
            className="flex min-w-0 items-center gap-3 px-3 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 truncate">
              {thread.title}
              {thread.unread ? <span className="sr-only">, unread</span> : null}
            </span>
            {thread.unread ? (
              <NotificationDot
                tone={thread.attention ? "destructive" : "default"}
              />
            ) : null}
          </li>
        ))}
      </ul>
      <NotificationBell count={4} dot />
    </Wrapper>
  );
}

export function notificationBellCountLabel(): ReactNode {
  return (
    <Wrapper>
      {/* Accessible name: "Inbox, 3 new mentions". */}
      <NotificationBell
        count={3}
        aria-label="Inbox"
        countLabel={(n) => (n === 1 ? "1 new mention" : `${n} new mentions`)}
      />
    </Wrapper>
  );
}
