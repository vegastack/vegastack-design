// @vegastack notifications-01@0.23.5 sha256-GN1y1vIZaPOl1fy7G4TQbQviUfoE/zrHGb5vc/ItW/k=

/**
 * Sample data for `notifications-01`. Replace it with your notifications API; the shape is what
 * `InboxSheet` reads.
 */

/** One notification. */
export interface InboxNotification {
  id: string;
  title: string;
  /** One or two lines of detail. */
  body: string;
  href: string;
  /** When it happened, as an ISO date. */
  at: string;
  unread: boolean;
}

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 24, 15);

/** The first page, newest first. */
export const NOTIFICATIONS: InboxNotification[] = [
  {
    id: "n1",
    title: "Raj Patel assigned you a task",
    body: "Confirm the support hiring budget with finance.",
    href: "/tasks/t41",
    at: new Date(NOW - 0.5 * HOUR).toISOString(),
    unread: true,
  },
  {
    id: "n2",
    title: "Weekly sync with Skyline is ready to review",
    body: "Summary, 4 action items and the transcript.",
    href: "/meetings/m12",
    at: new Date(NOW - 2 * HOUR).toISOString(),
    unread: true,
  },
  {
    id: "n3",
    title: "Mei Chen mentioned you",
    body: "“Can you check the regional numbers before Friday?”",
    href: "/tasks/t39#comment-3",
    at: new Date(NOW - 5 * HOUR).toISOString(),
    unread: true,
  },
  {
    id: "n4",
    title: "Harbor Coffee moved to Active",
    body: "Ana Ruiz changed the status.",
    href: "/customers/c2",
    at: new Date(NOW - 30 * HOUR).toISOString(),
    unread: false,
  },
  {
    id: "n5",
    title: "Export finished",
    body: "Price list, 1,284 products.",
    href: "/exports/e7",
    at: new Date(NOW - 52 * HOUR).toISOString(),
    unread: false,
  },
];

/** The next page, loaded by "Load older". */
export const OLDER_NOTIFICATIONS: InboxNotification[] = [
  {
    id: "n6",
    title: "Juniper Retail was added",
    body: "Raj Patel added a customer.",
    href: "/customers/c4",
    at: new Date(NOW - 80 * HOUR).toISOString(),
    unread: false,
  },
  {
    id: "n7",
    title: "Weekly sync with Skyline was scheduled",
    body: "Tuesday 3 September, 10:00.",
    href: "/meetings/m12",
    at: new Date(NOW - 120 * HOUR).toISOString(),
    unread: false,
  },
];

/** The moment the sample treats as now, so "Today" is stable. */
export const SAMPLE_NOW = NOW;
