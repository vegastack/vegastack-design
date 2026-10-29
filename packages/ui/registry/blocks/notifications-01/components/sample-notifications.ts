// @vegastack notifications-01@0.25.99 sha256-WF/EVFkC70EcrQYZWIPAHto6t5PStM7Iuaj2I9VSXHQ=

/**
 * Sample data for `notifications-01`. Replace it with your notifications API; the shape is what
 * `InboxSheet` reads.
 */

/** What a notification is about — picks the row's icon when there is no actor. */
type InboxNotificationKind = "task" | "meeting" | "failed" | "export";

/** One notification. */
export interface InboxNotification {
  id: string;
  kind: InboxNotificationKind;
  /** Who did it; shown as the avatar and emphasised in the title. */
  actor?: string;
  /** The sentence before and after the record, around `record`. */
  verb: string;
  /** The record's name, emphasised in the title. */
  record: string;
  /** One line of context under the title. */
  meta: string;
  href: string;
  /** When it happened, as an ISO date. */
  at: string;
  unread: boolean;
  /** How many updates to this record the row folds together. */
  count?: number;
  /** Everyone behind a grouped row, as stacked avatars. */
  actors?: string[];
  /** The updates behind a grouped row, newest first, listed when it expands. */
  events?: { id: string; actor: string; text: string; at: string }[];
  /** A decision the row asks for (Approve / Reject). */
  decision?: boolean;
  /** Archived: shown under the Archived tab only. */
  archived?: boolean;
}

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 24, 15);

/** The first page, newest first. */
export const NOTIFICATIONS: InboxNotification[] = [
  {
    id: "n1",
    kind: "task",
    actor: "Raj Patel",
    verb: "assigned you",
    record: "Confirm the support hiring budget",
    meta: "Task · Due Friday",
    href: "/tasks/t41",
    at: new Date(NOW - 0.5 * HOUR).toISOString(),
    unread: true,
    decision: true,
  },
  {
    id: "n2",
    kind: "meeting",
    verb: "Notes ready for",
    record: "Weekly sync with Skyline",
    meta: "Meeting · 4 action items",
    href: "/meetings/m12",
    at: new Date(NOW - 2 * HOUR).toISOString(),
    unread: true,
  },
  {
    id: "n3",
    kind: "task",
    actor: "Mei Chen",
    verb: "updated",
    record: "Regional numbers review",
    meta: "Task · Harbor Coffee",
    href: "/tasks/t39",
    at: new Date(NOW - 5 * HOUR).toISOString(),
    unread: true,
    count: 3,
    actors: ["Mei Chen", "Ana Ruiz"],
    events: [
      {
        id: "n3c",
        actor: "Mei Chen",
        text: "moved it to In review",
        at: new Date(NOW - 5 * HOUR).toISOString(),
      },
      {
        id: "n3b",
        actor: "Ana Ruiz",
        text: "commented: “Numbers look right”",
        at: new Date(NOW - 5.5 * HOUR).toISOString(),
      },
      {
        id: "n3a",
        actor: "Mei Chen",
        text: "changed the due date to Friday",
        at: new Date(NOW - 6 * HOUR).toISOString(),
      },
    ],
  },
  {
    id: "n4",
    kind: "failed",
    verb: "Processing failed for",
    record: "Lumen Build kickoff",
    meta: "Meeting · Upload the recording again",
    href: "/meetings/m9",
    at: new Date(NOW - 30 * HOUR).toISOString(),
    unread: false,
  },
  {
    id: "n5",
    kind: "export",
    verb: "Export finished:",
    record: "Price list",
    meta: "1,284 products",
    href: "/exports/e7",
    at: new Date(NOW - 52 * HOUR).toISOString(),
    unread: false,
  },
];

/** The next page, loaded by "Load older". */
export const OLDER_NOTIFICATIONS: InboxNotification[] = [
  {
    id: "n6",
    kind: "task",
    actor: "Ana Ruiz",
    verb: "completed",
    record: "Juniper Retail onboarding",
    meta: "Task · Juniper Retail",
    href: "/tasks/t22",
    at: new Date(NOW - 150 * HOUR).toISOString(),
    unread: false,
  },
  {
    id: "n7",
    kind: "meeting",
    actor: "Raj Patel",
    verb: "cancelled",
    record: "Quarterly review",
    meta: "Meeting · Tuesday 3 September",
    href: "/meetings/m7",
    at: new Date(NOW - 400 * HOUR).toISOString(),
    unread: false,
  },
];

/** The moment the sample treats as now, so the day groups are stable. */
export const SAMPLE_NOW = NOW;
