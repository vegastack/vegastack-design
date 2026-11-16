"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/notification-dot` (dogfoods the registry) → auto-scanned.
import { NotificationDot } from "@/components/ui/notification-dot";

const THREADS = [
  { title: "Design review for the billing page", unread: true },
  { title: "Quarterly planning notes", unread: false },
  { title: "Invoice 1042 failed to send", unread: true, attention: true },
];

// The unread dot on list rows: info blue for "unread", destructive for something that needs
// attention. The dot is decorative, so each row says "unread" in its own text for screen readers.
export function notificationDot(): ReactNode {
  return (
    <Wrapper>
      <ul className="flex w-full max-w-sm flex-col divide-y divide-border rounded-card border border-border bg-background">
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
                intent={thread.attention ? "destructive" : "default"}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}
