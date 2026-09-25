// @vegastack issue-detail-01@0.23.34 sha256-5f4S1RxR2S/aZ17KlcjmO7S8+rI08i/xC/KwzqFuoJw=

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
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
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
import { DueLabel } from "@/components/ui/relative-time";
import { Separator } from "@/components/ui/separator";
import { StatusIcon } from "@/components/ui/status-icon";
import { TextEdit } from "@/components/ui/text-edit";

const ME = { name: "Asha Rao", email: "asha@acme.com" };
const HOUR = 3_600_000;

function initialComments(now: number): CommentData[] {
  return [
    {
      id: "c1",
      author: { name: "Arjun Mehta", email: "arjun@acme.com" },
      body: "Customer asked for the **revised quote** by Friday.",
      createdAt: now - 26 * HOUR,
    },
    {
      id: "c2",
      author: ME,
      body: "Sent it over — 12 units, delivery in October.",
      createdAt: now - 3 * HOUR,
      editedAt: now - 2 * HOUR,
      canEdit: true,
      canDelete: true,
    },
  ];
}

/** The issue's facts, shown in the rail card and in the Details sheet. */
function Properties({ due }: { due: number }) {
  return (
    <PropertyList variant="inline" aria-label="Properties">
      <PropertyRow>
        <PropertyLabel>Status</PropertyLabel>
        <PropertyValue>
          <span className="inline-flex items-center gap-2">
            <StatusIcon status="progress" size="sm" />
            In progress
          </span>
        </PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Priority</PropertyLabel>
        <PropertyValue>
          <span className="inline-flex items-center gap-2">
            <PriorityIcon priority="high" size="sm" />
            High
          </span>
        </PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Assignee</PropertyLabel>
        <PropertyValue>
          <PropertyPerson name={ME.name} />
        </PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel icon={<CalendarDays />}>Due</PropertyLabel>
        <PropertyValue>
          <DueLabel date={due} />
        </PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Customer</PropertyLabel>
        <PropertyValue>
          <RecordChip icon={<Building2 />} value="Northwind" href="#customer" />
        </PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Project</PropertyLabel>
        <PropertyValue>
          <RecordChip
            icon={<FolderKanban />}
            value="Office fit-out"
            href="#project"
          />
        </PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Created by</PropertyLabel>
        <PropertyValue>
          <PropertyPerson name="Priya Nair" badge="Inactive" />
        </PropertyValue>
      </PropertyRow>
    </PropertyList>
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
    "Update the quote with the **new unit price** and the October delivery window.\n\n- 12 units\n- Installation included",
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
          composer={
            <CommentComposer
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
