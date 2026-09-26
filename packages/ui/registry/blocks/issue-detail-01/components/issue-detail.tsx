// @vegastack issue-detail-01@0.23.43 sha256-yR/Aj8d1HngSTOhhmbENtgSH4Wbhm+ToGeS87/xUdOA=

"use client";

import * as React from "react";
import { Building2, CalendarDays, FolderKanban } from "lucide-react";

import {
  CommentComposer,
  CommentList,
  type CommentData,
  type CommentOrder,
} from "@/components/ui/comments";
import { EditableCell } from "@/components/ui/editable-cell";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { toggleReaction } from "@/components/ui/reactions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertySection,
  PropertyValue,
} from "@/components/ui/property-list";
import {
  PropertyPerson,
  RecordAsideCard,
  RecordAsideSection,
} from "@/components/ui/record-aside";
import { RecordChip } from "@/components/ui/record-chip";
import {
  RecordDetailsSheet,
  RecordLayout,
  RecordLayoutMain,
  RecordLayoutRail,
} from "@/components/ui/record-layout";
import { DateTime, DueLabel } from "@/components/ui/relative-time";
import { Separator } from "@/components/ui/separator";
import { StatusIcon } from "@/components/ui/status-icon";
import { TextEdit } from "@/components/ui/text-edit";

const ME = { name: "Asha Rao", email: "asha@acme.com" };
const ME_REACTOR = { id: "asha", name: ME.name };
const HOUR = 3_600_000;

function initialComments(now: number): CommentData[] {
  return [
    {
      id: "c1",
      author: { name: "Arjun Mehta", email: "arjun@acme.com" },
      body: "Customer asked for the **revised quote** by Friday.",
      createdAt: now - 26 * HOUR,
      reactions: [
        {
          emoji: "👀",
          count: 2,
          reacted: true,
          users: [
            ME_REACTOR,
            { id: "priya", name: "Priya Nair", inactive: true },
          ],
        },
      ],
    },
    {
      id: "c2",
      author: ME,
      body: "Sent it over — 12 units, delivery in October.",
      createdAt: now - 3 * HOUR,
      editedAt: now - 2 * HOUR,
      canEdit: true,
      canDelete: true,
      reactions: [
        {
          emoji: "👍",
          count: 3,
          reacted: false,
          users: [
            { id: "arjun", name: "Arjun Mehta" },
            { id: "neha", name: "Neha Kapoor" },
            { id: "ravi", name: "Ravi Iyer" },
          ],
        },
        {
          emoji: "🎉",
          count: 1,
          reacted: false,
          users: [{ id: "arjun", name: "Arjun Mehta" }],
        },
      ],
    },
  ];
}

const STATUSES = [
  { value: "todo", label: "Todo" },
  { value: "progress", label: "In progress" },
  { value: "done", label: "Done" },
] as const;
const PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;
const PEOPLE = [ME, { name: "Arjun Mehta" }, { name: "Neha Kapoor" }];
const DAY = 24 * HOUR;

/**
 * The issue's facts, shown in the rail card and in the Details sheet. Each editable value is a
 * ghost RecordChip — it reads as plain text and shows its ▾ on hover, focus or while open; the
 * links to other records keep the bordered chips under "Linked to".
 */
function Properties({ due: initialDue }: { due: number }) {
  const [status, setStatus] =
    React.useState<(typeof STATUSES)[number]["value"]>("progress");
  const [priority, setPriority] =
    React.useState<(typeof PRIORITIES)[number]["value"]>("high");
  const [assignee, setAssignee] = React.useState<string | null>(ME.name);
  const [due, setDue] = React.useState<number | null>(initialDue);
  const statusLabel = STATUSES.find((s) => s.value === status)!.label;
  const priorityLabel = PRIORITIES.find((p) => p.value === priority)!.label;
  return (
    <>
      <PropertyList variant="inline" aria-label="Properties">
        <PropertyRow>
          <PropertyLabel>Status</PropertyLabel>
          <PropertyValue>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <RecordChip
                    variant="ghost"
                    icon={<StatusIcon status={status} size="xs" label="" />}
                    value={statusLabel}
                    aria-label={`Status: ${statusLabel}`}
                  />
                }
              />
              <DropdownMenuContent align="start">
                {STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => setStatus(s.value)}
                  >
                    <StatusIcon status={s.value} size="sm" label="" />
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Priority</PropertyLabel>
          <PropertyValue>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <RecordChip
                    variant="ghost"
                    icon={
                      <PriorityIcon priority={priority} size="xs" label="" />
                    }
                    value={priorityLabel}
                    aria-label={`Priority: ${priorityLabel}`}
                  />
                }
              />
              <DropdownMenuContent align="start">
                {PRIORITIES.map((p) => (
                  <DropdownMenuItem
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                  >
                    <PriorityIcon priority={p.value} size="sm" label="" />
                    {p.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Assignee</PropertyLabel>
          <PropertyValue>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <RecordChip
                    variant="ghost"
                    person={assignee ? { name: assignee } : null}
                    placeholder="Unassigned"
                    aria-label={
                      assignee ? `Assignee: ${assignee}` : "Set assignee"
                    }
                  />
                }
              />
              <DropdownMenuContent align="start">
                {PEOPLE.map((p) => (
                  <DropdownMenuItem
                    key={p.name}
                    onClick={() => setAssignee(p.name)}
                  >
                    {p.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setAssignee(null)}>
                  Unassigned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<CalendarDays />}>Due</PropertyLabel>
          <PropertyValue>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <RecordChip
                    variant="ghost"
                    value={
                      due === null ? undefined : (
                        <DueLabel date={due} title={false} focusable={false} />
                      )
                    }
                    placeholder="Set due date"
                    aria-label={
                      due === null ? "Set due date" : "Change due date"
                    }
                  />
                }
              />
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setDue(Date.now())}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDue(Date.now() + DAY)}>
                  Tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDue(Date.now() + 7 * DAY)}>
                  Next week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDue(null)}>
                  No due date
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Created by</PropertyLabel>
          <PropertyValue>
            <PropertyPerson name="Priya Nair" badge="Inactive" />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Created</PropertyLabel>
          <PropertyValue>
            <DateTime date={initialDue - 6 * DAY} variant="datetime" />
          </PropertyValue>
        </PropertyRow>
      </PropertyList>
      <PropertySection title="Linked to">
        <RecordChip icon={<Building2 />} value="Northwind" href="#customer" />
        <RecordChip
          icon={<FolderKanban />}
          value="Office fit-out"
          href="#project"
        />
      </PropertySection>
    </>
  );
}

/**
 * `IssueDetail` — the issue page's client half: title and status, description, comments, and the
 * Properties rail. Replace the sample state with your data and persistence.
 *
 * @example
 * <IssueDetail />
 */
export function IssueDetail() {
  const [now] = React.useState(() => Date.now());
  const [title, setTitle] = React.useState(
    "Send the revised quote to Northwind",
  );
  const [description, setDescription] = React.useState(
    [
      "Update the quote with the **new unit price** and the October delivery window.",
      "## Checklist",
      "- [x] Confirm 12 units\n- [ ] Installation included\n  - [ ] Site survey booked",
      "| Item      | Qty | Price  |\n| --------- | --- | ------ |\n| Unit      | 12  | 1,450  |\n| Install   | 1   | 2,000  |",
      "> Delivery must land before the October freeze.",
    ].join("\n\n"),
  );
  const [comments, setComments] = React.useState(() => initialComments(now));
  const [order, setOrder] = React.useState<CommentOrder>("oldest");

  return (
    <RecordLayout>
      <RecordLayoutMain className="mx-auto w-full max-w-3xl gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <StatusIcon status="progress" size="lg" />
          <h1 className="min-w-0 flex-1 font-heading text-2xl font-medium">
            <EditableCell
              variant="heading"
              label="Title"
              required
              value={title}
              onSave={setTitle}
            />
          </h1>
          <RecordDetailsSheet>
            <Properties due={now + 2 * 24 * HOUR} />
          </RecordDetailsSheet>
        </div>
        <TextEdit
          format="markdown"
          aria-label="Description"
          placeholder="Add a description…"
          value={description}
          onCommit={setDescription}
        />
        <Separator className="my-2" />
        <CommentList
          comments={comments}
          order={order}
          onOrderChange={setOrder}
          onCopyLink={() => {}}
          onEdit={(id, body) =>
            setComments((xs) =>
              xs.map((c) =>
                c.id === id ? { ...c, body, editedAt: Date.now() } : c,
              ),
            )
          }
          onDelete={(id) => setComments((xs) => xs.filter((c) => c.id !== id))}
          onReactionToggle={(id, emoji) =>
            setComments((xs) =>
              xs.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      reactions: toggleReaction(
                        c.reactions ?? [],
                        emoji,
                        ME_REACTOR,
                      ),
                    }
                  : c,
              ),
            )
          }
          composer={
            <CommentComposer
              placeholder="Add a comment…"
              onSubmit={(body) =>
                setComments((xs) => [
                  ...xs,
                  {
                    id: `c${xs.length + 1}-${Date.now()}`,
                    author: ME,
                    body,
                    createdAt: Date.now(),
                    canEdit: true,
                    canDelete: true,
                  },
                ])
              }
            />
          }
        />
      </RecordLayoutMain>
      <RecordLayoutRail aria-label="Issue details">
        <RecordAsideCard>
          <RecordAsideSection title="Properties">
            <Properties due={now + 2 * 24 * HOUR} />
          </RecordAsideSection>
        </RecordAsideCard>
      </RecordLayoutRail>
    </RecordLayout>
  );
}
