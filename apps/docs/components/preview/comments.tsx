"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  CommentComposer,
  CommentItem,
  CommentList,
  type CommentData,
  type CommentOrder,
} from "@/components/ui/comments";

const NOW = Date.parse("2026-09-26T10:00:00Z");
const ME = { name: "Asha Rao", email: "asha@acme.com" };
const ARJUN = { name: "Arjun Mehta", email: "arjun@acme.com" };
const PRIYA = { name: "Priya Nair", badge: "Inactive" };

const COMMENTS: CommentData[] = [
  {
    id: "c1",
    author: PRIYA,
    body: "Customer asked for the **revised quote** by Friday.",
    createdAt: NOW - 26 * 3_600_000,
  },
  {
    id: "c2",
    author: ARJUN,
    body: "Sent it over. Details:\n\n- 12 units\n- delivery in October",
    createdAt: NOW - 3 * 3_600_000,
    editedAt: NOW - 2 * 3_600_000,
  },
  {
    id: "c3",
    author: ME,
    body: "Thanks — marking this done once they confirm.",
    createdAt: NOW - 5 * 60_000,
    canEdit: true,
    canDelete: true,
  },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Demo({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Wrapper className={className ?? "block max-w-2xl"}>{children}</Wrapper>
  );
}

function CommentsDemo() {
  const [items, setItems] = React.useState(COMMENTS);
  const [order, setOrder] = React.useState<CommentOrder>("oldest");
  return (
    <Demo>
      <CommentList
        comments={items}
        order={order}
        onOrderChange={setOrder}
        now={NOW}
        hasEarlier
        onLoadEarlier={() => {}}
        onCopyLink={() => {}}
        onEdit={async (id, body) => {
          await wait(400);
          setItems((xs) =>
            xs.map((c) => (c.id === id ? { ...c, body, editedAt: NOW } : c)),
          );
        }}
        onDelete={(id) => setItems((xs) => xs.filter((c) => c.id !== id))}
        composer={
          <CommentComposer
            onSubmit={async (body) => {
              await wait(600);
              setItems((xs) => [
                ...xs,
                {
                  id: `c${xs.length + 10}`,
                  author: ME,
                  body,
                  createdAt: NOW,
                  canEdit: true,
                  canDelete: true,
                },
              ]);
            }}
          />
        }
      />
    </Demo>
  );
}

/** The comments section: list, edit/delete/copy link, and the composer. */
export function comments(): ReactNode {
  return <CommentsDemo />;
}

/** No comments yet. */
export function commentsEmpty(): ReactNode {
  return (
    <Demo>
      <CommentList
        comments={[]}
        composer={<CommentComposer onSubmit={() => {}} />}
      />
    </Demo>
  );
}

/** Loading: the skeleton. */
export function commentsLoading(): ReactNode {
  return (
    <Demo>
      <CommentList comments={[]} loading />
    </Demo>
  );
}

/** An edited comment, a deleted one kept for its replies, and a reply. */
export function commentsThread(): ReactNode {
  return (
    <Demo>
      <ul className="flex flex-col gap-3">
        <CommentItem
          now={NOW}
          comment={{
            id: "d1",
            author: ARJUN,
            body: "",
            createdAt: NOW - 7_200_000,
            deleted: true,
          }}
          replies={
            <CommentItem
              now={NOW}
              comment={{
                id: "d2",
                author: ME,
                body: "Replying to the removed note — still relevant.",
                createdAt: NOW - 3_600_000,
                editedAt: NOW - 1_800_000,
              }}
            />
          }
        />
      </ul>
    </Demo>
  );
}

/** Editing in place, and highlighted from a `#comment-<id>` link. */
export function commentsEditing(): ReactNode {
  return (
    <Demo>
      <ul className="flex flex-col gap-3">
        <CommentItem
          now={NOW}
          editing
          onEditingChange={() => {}}
          onEdit={() => {}}
          comment={{ ...COMMENTS[2]! }}
        />
        <CommentItem now={NOW} highlighted comment={COMMENTS[1]!} />
      </ul>
    </Demo>
  );
}

/** The composer posting, and after a failed post. */
export function commentsComposerStates(): ReactNode {
  return (
    <Demo className="flex max-w-2xl flex-col items-stretch gap-6">
      <CommentComposer onSubmit={() => {}} posting />
      <CommentComposer
        onSubmit={() => {}}
        error="Couldn't post the comment. Check your connection and try again."
      />
    </Demo>
  );
}
