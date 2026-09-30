"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  CommentComposer,
  CommentItem,
  CommentList,
  CommentThread,
  type CommentData,
  type CommentOrder,
  type CommentThreadData,
} from "@/components/ui/comments";
import { toggleReaction } from "@/components/ui/reactions";

const NOW = Date.parse("2026-09-26T10:00:00Z");
const ME = { name: "Asha Rao", email: "asha@acme.com", hue: "blue" as const };
const ARJUN = {
  name: "Arjun Mehta",
  email: "arjun@acme.com",
  image: "/preview/avatar-2.svg",
};
const PRIYA = { name: "Priya Nair", hue: "pink" as const, badge: "Inactive" };
const ME_REACTOR = { id: "asha", name: ME.name };

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
    reactions: [
      {
        emoji: "👍",
        count: 4,
        reacted: true,
        users: [
          ME_REACTOR,
          { id: "neha", name: "Neha Kapoor" },
          { id: "priya", name: "Priya Nair", inactive: true },
          { id: "ravi", name: "Ravi Iyer" },
        ],
      },
      {
        emoji: "🎉",
        count: 1,
        reacted: false,
        users: [{ id: "neha", name: "Neha Kapoor" }],
      },
    ],
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
        onReactionToggle={(id, emoji) =>
          setItems((xs) =>
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

/**
 * The composer at rest: a light, near-transparent box with the "Add a comment…" placeholder that
 * grows to about twelve lines before it scrolls inside; the ↑ send button is a quiet grey disc
 * while there is nothing to send, and turns primary once there is.
 */
export function commentsComposer(): ReactNode {
  return (
    <Demo className="flex max-w-2xl flex-col items-stretch gap-6">
      <CommentComposer onSubmit={() => {}} />
    </Demo>
  );
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

function ReactionsDemo() {
  const [comment, setComment] = React.useState<CommentData>(COMMENTS[1]!);
  return (
    <Demo>
      <ul>
        <CommentItem
          comment={comment}
          now={NOW}
          onReactionToggle={async (_id, emoji) => {
            setComment((c) => ({
              ...c,
              reactions: toggleReaction(c.reactions ?? [], emoji, ME_REACTOR),
            }));
            await wait(300);
          }}
        />
      </ul>
    </Demo>
  );
}

/** Reactions: pills under the body, and an add-reaction button in the hover actions. */
export function commentsReactions(): ReactNode {
  return <ReactionsDemo />;
}

const THREAD: CommentThreadData = {
  id: "t1",
  quote: "Use a 25 A breaker for the cooker",
  root: {
    id: "t1-1",
    author: ARJUN,
    body: "Is 25 A right for a 7 kW cooker?",
    createdAt: NOW - 5 * 3_600_000,
  },
  replies: [
    {
      id: "t1-2",
      author: ME,
      body: "Yes — it's on its own radial, 6 mm² cable.",
      createdAt: NOW - 4 * 3_600_000,
      canEdit: true,
      canDelete: true,
    },
    {
      id: "t1-3",
      author: PRIYA,
      body: "Agreed. Adding it to the checklist.",
      createdAt: NOW - 3_600_000,
    },
  ],
};

/**
 * A thread about a piece of text: the quote (click it to find the highlight), the first comment,
 * its replies and a one-line "Reply…" box that opens when focused. ✓ resolves it.
 */
export function commentsThreadCard(): ReactNode {
  const [thread, setThread] = React.useState(THREAD);
  return (
    <Demo>
      <CommentThread
        className="max-w-80"
        active
        now={NOW}
        thread={thread}
        onQuoteClick={() => {}}
        onReply={(body) =>
          setThread((current) => ({
            ...current,
            replies: [
              ...current.replies,
              {
                id: `r${current.replies.length + 2}`,
                author: ME,
                body,
                createdAt: Date.now(),
              },
            ],
          }))
        }
        onResolve={() =>
          setThread((current) => ({
            ...current,
            resolved: { by: ME, at: Date.now() },
          }))
        }
        onReopen={() =>
          setThread((current) => ({ ...current, resolved: null }))
        }
      />
    </Demo>
  );
}

/**
 * Restored drafts: a composer and a reply box that open on the text the viewer left
 * (`defaultValue`), and a reply box held busy by the host while an upload runs (`posting`).
 */
export function commentsDrafts(): ReactNode {
  return (
    <Demo className="flex max-w-2xl flex-col items-stretch gap-6">
      <CommentComposer
        defaultValue="Draft: the customer wants **delivery in October**"
        onSubmit={() => wait(600)}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <CommentThread
          now={NOW}
          thread={{ ...THREAD, replies: [] }}
          onReply={() => wait(600)}
          composer={{ defaultValue: "Checking the cable size first" }}
        />
        <CommentThread
          now={NOW}
          thread={{ ...THREAD, replies: [] }}
          onReply={() => {}}
          composer={{
            defaultValue: "Photo of the panel attached",
            posting: true,
          }}
        />
      </div>
    </Demo>
  );
}

/** Resolved (who and when, with Reopen), orphaned (its text is gone), and collapsed. */
export function commentsThreadStates(): ReactNode {
  return (
    <Demo>
      <div className="grid gap-4 md:grid-cols-3">
        <CommentThread
          now={NOW}
          thread={{ ...THREAD, resolved: { by: ME, at: NOW - 600_000 } }}
          onReply={() => {}}
          onReopen={() => {}}
        />
        <CommentThread
          now={NOW}
          thread={{ ...THREAD, orphaned: true, replies: [] }}
          onReply={() => {}}
          onResolve={() => {}}
        />
        <CommentThread
          now={NOW}
          collapsed
          onExpand={() => {}}
          thread={THREAD}
          onReply={() => {}}
          onResolve={() => {}}
        />
      </div>
    </Demo>
  );
}

const MENTIONED: CommentData[] = [
  {
    id: "mention-1",
    author: ARJUN,
    body: "Filed as [@Fix the hinge](mention://task/t-42) — [@Asha Rao](mention://user/u-1) can you take it? Spec in [@Hinge spec](mention://page/p-7).",
    createdAt: NOW - 3_600_000,
  },
];

/**
 * `mentionHref` on the list links every comment's mention chips (a person is never a link);
 * without it the chips are plain labels.
 */
export function commentsMentions(): ReactNode {
  return (
    <Demo className="flex max-w-2xl flex-col gap-8">
      <CommentList
        title="With mentionHref"
        comments={MENTIONED}
        now={NOW}
        mentionHref={(kind, id) => `#${kind}-${id}`}
      />
      <CommentList title="Without" comments={MENTIONED} now={NOW} />
    </Demo>
  );
}
