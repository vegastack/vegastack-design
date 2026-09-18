"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// The headless engine behind the styled parts — mounted directly by the Unstyled fixture only.
import { MessageScroller as MessageScrollerPrimitive } from "@shadcn/react/message-scroller";
// Copied INTO apps/docs via `shadcn add @vegastack/message-scroller` → auto-scanned.
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller";

const SEED = [
  "Hey — welcome to the thread!",
  "This viewport auto-scrolls to the latest message.",
  "Scroll up and the jump-to-latest button appears.",
  "Older messages keep their position when more load.",
  "It virtualises long histories with content-visibility.",
  "Try the controls below.",
];

/** One chat row — even indexes are received (muted), every third is sent (dark). */
function ChatRow({
  id,
  index,
  text,
  anchor = false,
  className,
}: {
  id: string;
  index: number;
  text: string;
  anchor?: boolean;
  className?: string;
}) {
  const sent = index % 3 === 2;
  return (
    <MessageScrollerItem
      messageId={id}
      scrollAnchor={anchor || sent}
      className={className}
    >
      <Message align={sent ? "end" : "start"}>
        <MessageContent>
          <Bubble
            variant={sent ? "default" : "muted"}
            align={sent ? "end" : "start"}
          >
            <BubbleContent>{text}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

/** The frame every fixture below reuses: a bounded, bordered transcript. */
function Frame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <MessageScroller
      className={cn("h-64 rounded-lg border border-border", className)}
    >
      {children}
    </MessageScroller>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

/* ---------------------------------------------------------------------------
 * Usage — basic auto-scroll + send
 * -------------------------------------------------------------------------*/

export function messageScroller(): ReactNode {
  const [messages, setMessages] = useState<string[]>(SEED);

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {messages.map((text, i) => (
                  <ChatRow key={i} id={`m${i}`} index={i} text={text} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            {/* Button is a SIBLING of the viewport so it pins to the relative frame. */}
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              setMessages((prev) => [
                ...prev,
                `New message #${prev.length + 1}`,
              ])
            }
          >
            Send a message
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * What Makes a Great Streaming Chat Experience — "never move the reader
 * against their intent": follow only while the reader is following.
 * -------------------------------------------------------------------------*/

export function messageScrollerStreamingExperience(): ReactNode {
  const [follow, setFollow] = useState(true);
  const [messages, setMessages] = useState<string[]>(SEED);

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider
          key={String(follow)}
          autoScroll={follow}
          defaultScrollPosition="end"
        >
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {messages.map((text, i) => (
                  <ChatRow key={i} id={`e${i}`} index={i} text={text} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant={follow ? "default" : "outline"}
            aria-pressed={follow}
            onClick={() => setFollow((value) => !value)}
          >
            {follow ? "Following the live edge" : "Holding the reader's place"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setMessages((prev) => [
                ...prev,
                `Reply #${prev.length + 1} arrived while you were reading.`,
              ])
            }
          >
            Receive a reply
          </Button>
        </div>
        <Caption>
          Scroll up, then receive a reply. With following off the transcript
          never moves under you — the jump control is how you come back.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * MessageScroller — the styled frame inside the headless provider
 * -------------------------------------------------------------------------*/

export function messageScrollerFrame(): ReactNode {
  const ids = Array.from({ length: 9 }, (_, i) => `f${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider defaultScrollPosition="end">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow
                    key={id}
                    id={id}
                    index={i}
                    text={`Turn ${i + 1} of the conversation`}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>
        <Caption>
          The provider owns scroll state; the frame owns layout. Neither owns
          the messages, the transport, or the model — those stay yours.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Composition — the five parts, each outlined
 * -------------------------------------------------------------------------*/

export function messageScrollerComposition(): ReactNode {
  const ids = Array.from({ length: 8 }, (_, i) => `c${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider defaultScrollPosition="start">
          <Frame className="border-dashed">
            {/* No decorative `outline-*` here: the viewport is a tab stop, and a resting
                outline would override the width of the one `:focus-visible` ring base.css owns. */}
            <MessageScrollerViewport aria-label="Conversation" className="p-3">
              <MessageScrollerContent className="gap-3">
                {ids.map((id, i) => (
                  <MessageScrollerItem
                    key={id}
                    messageId={id}
                    className="rounded-lg border border-dashed border-border p-2"
                  >
                    <Message align={i % 2 === 1 ? "end" : "start"}>
                      <MessageContent>
                        <Bubble
                          variant={i % 2 === 1 ? "default" : "muted"}
                          align={i % 2 === 1 ? "end" : "start"}
                        >
                          <BubbleContent>
                            MessageScrollerItem {i + 1}
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>
        <Caption>
          Dashed: the frame, the viewport it scrolls, and every row boundary.
          Wrap every direct child of the content in an item so the scroller can
          measure, anchor and jump to it.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Anchoring Turns
 * -------------------------------------------------------------------------*/

type Turn = { id: string; role: "user" | "assistant"; text: string };

const OPENING_TURNS: Turn[] = [
  { id: "t0", role: "user", text: "Can you summarise the release?" },
  {
    id: "t1",
    role: "assistant",
    text: "Sure. Three components landed, two were renamed, and the token ladder was flattened.",
  },
  { id: "t2", role: "user", text: "What changed for consumers?" },
  {
    id: "t3",
    role: "assistant",
    text: "Nothing they have to do today — the copy-in tracks updates through shadcn add --diff.",
  },
];

function TurnRow({
  turn,
  anchorRole,
  className,
}: {
  turn: Turn;
  anchorRole: Turn["role"];
  className?: string;
}) {
  const sent = turn.role === "user";
  return (
    <MessageScrollerItem
      messageId={turn.id}
      scrollAnchor={turn.role === anchorRole}
      className={className}
    >
      <Message align={sent ? "end" : "start"}>
        <MessageContent>
          <MessageHeader>{sent ? "You" : "Assistant"}</MessageHeader>
          <Bubble
            variant={sent ? "default" : "muted"}
            align={sent ? "end" : "start"}
          >
            <BubbleContent>{turn.text}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

export function messageScrollerAnchoring(): ReactNode {
  const [anchorRole, setAnchorRole] = useState<Turn["role"]>("user");
  const [turns, setTurns] = useState<Turn[]>(OPENING_TURNS);

  function send() {
    setTurns((prev) => {
      const n = prev.length;
      return [
        ...prev,
        { id: `t${n}`, role: "user", text: `Follow-up question ${n / 2 + 1}` },
        {
          id: `t${n + 1}`,
          role: "assistant",
          text: "Here is the answer, streamed in below the anchored turn so the exchange stays together.",
        },
      ];
    });
  }

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider
          autoScroll
          defaultScrollPosition="end"
          scrollPreviousItemPeek={48}
        >
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {turns.map((turn) => (
                  <TurnRow key={turn.id} turn={turn} anchorRole={anchorRole} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            aria-pressed={anchorRole === "assistant"}
            onClick={() =>
              setAnchorRole((role) => (role === "user" ? "assistant" : "user"))
            }
          >
            Anchor the {anchorRole === "user" ? "assistant" : "user"} turn
          </Button>
          <Button size="sm" onClick={send}>
            Send a turn
          </Button>
        </div>
        <Caption>
          The anchored row moves near the top of the viewport and the reply
          grows in below it, instead of the whole thread jumping to the bottom.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Group Chat (a marker, not a message, is the anchor)
 * -------------------------------------------------------------------------*/

export function messageScrollerGroupChat(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider
          defaultScrollPosition="last-anchor"
          scrollPreviousItemPeek={40}
        >
          <Frame>
            <MessageScrollerViewport aria-label="Team chat" className="p-4">
              <MessageScrollerContent>
                <ChatRow id="g0" index={0} text="Standup in five." />
                <ChatRow id="g1" index={1} text="On my way." />
                <ChatRow id="g2" index={2} text="Same — grabbing coffee." />
                <ChatRow id="g3" index={3} text="Who is taking notes?" />
                {/* Anchoring is role-independent: a marker can start a turn. */}
                <MessageScrollerItem messageId="marcus-joined" scrollAnchor>
                  <Marker variant="separator">
                    <MarkerContent>Marcus joined the chat</MarkerContent>
                  </Marker>
                </MessageScrollerItem>
                <ChatRow id="g4" index={4} text="Hey all — what did I miss?" />
                <ChatRow
                  id="g5"
                  index={5}
                  text="Nothing yet. We were about to start."
                />
                {/* A typing indicator is a row, but never a turn boundary. */}
                <MessageScrollerItem messageId="typing">
                  <Marker>
                    <MarkerContent>Marcus is typing…</MarkerContent>
                  </Marker>
                </MessageScrollerItem>
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>
        <Caption>
          The join marker is the anchor, so the thread opens on the moment the
          room changed. The typing row is deliberately not one.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Keeping Context Visible (scrollPreviousItemPeek)
 * -------------------------------------------------------------------------*/

const PEEKS = [0, 48, 96] as const;

export function messageScrollerContextPeek(): ReactNode {
  const [peek, setPeek] = useState<number>(48);
  const ids = Array.from({ length: 12 }, (_, i) => `p${i}`);
  const anchorIndex = 8;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider
          key={peek}
          defaultScrollPosition="last-anchor"
          scrollPreviousItemPeek={peek}
        >
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow
                    key={id}
                    id={id}
                    index={i}
                    anchor={i === anchorIndex}
                    text={
                      i === anchorIndex
                        ? `Turn ${i + 1} — the anchored row`
                        : `Turn ${i + 1}`
                    }
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="start" />
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {PEEKS.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={value === peek ? "default" : "outline"}
              aria-pressed={value === peek}
              onClick={() => setPeek(value)}
            >
              Peek {value}px
            </Button>
          ))}
        </div>
        <Caption>
          At 0 the anchored turn sits flush against the top edge and reads like
          a fresh page. A peek keeps the previous turn in frame.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Following the Live Edge (streaming + aria-busy)
 * -------------------------------------------------------------------------*/

export function messageScrollerStreaming(): ReactNode {
  const [messages, setMessages] = useState<string[]>(SEED.slice(0, 4));
  const [busy, setBusy] = useState(false);

  function stream() {
    if (busy) return;
    setBusy(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        "Done — all changes are summarised in the release notes.",
      ]);
      setBusy(false);
    }, 1600);
  }

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent aria-busy={busy}>
                {messages.map((text, i) => (
                  <ChatRow key={i} id={`m${i}`} index={i} text={text} />
                ))}
                {busy ? (
                  <MessageScrollerItem messageId="typing">
                    <Message>
                      <MessageContent>
                        <Bubble variant="muted">
                          <BubbleContent className="shimmer">
                            Assistant is typing…
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ) : null}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>

        <div className="flex justify-end">
          <Button size="sm" onClick={stream} disabled={busy}>
            Stream a reply
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Opening Saved Threads (defaultScrollPosition="last-anchor")
 * -------------------------------------------------------------------------*/

export function messageScrollerLastAnchor(): ReactNode {
  // The LAST item with `scrollAnchor` set is the one restored into view on mount;
  // `scrollPreviousItemPeek` leaves a sliver of the message above it visible so the
  // reader keeps their place in the thread. Here the 6th turn is the anchor.
  const ids = Array.from({ length: 10 }, (_, i) => `a${i}`);
  const anchorIndex = 5;
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider
          defaultScrollPosition="last-anchor"
          scrollPreviousItemPeek={48}
        >
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <MessageScrollerItem
                    key={id}
                    messageId={id}
                    scrollAnchor={i === anchorIndex}
                  >
                    <Message align={i % 2 === 1 ? "end" : "start"}>
                      <MessageContent>
                        <Bubble
                          variant={
                            i === anchorIndex
                              ? "tinted"
                              : i % 2 === 1
                                ? "default"
                                : "muted"
                          }
                          align={i % 2 === 1 ? "end" : "start"}
                        >
                          <BubbleContent>
                            {i === anchorIndex
                              ? `Turn ${i + 1} — restored into view`
                              : `Turn ${i + 1}`}
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>
        <Caption>
          Opens at the anchored turn (tinted) rather than the top or bottom,
          with a peek of the previous message above it.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Avoiding a Flash on Reload (data-pending-scroll)
 * -------------------------------------------------------------------------*/

export function messageScrollerPendingScroll(): ReactNode {
  const [generation, setGeneration] = useState(0);
  const ids = Array.from({ length: 14 }, (_, i) => `r${i}`);

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider key={generation} defaultScrollPosition="end">
          <Frame>
            <MessageScrollerViewport
              id="pending-scroll-viewport"
              aria-label="Conversation"
              className="p-4"
              suppressHydrationWarning
            >
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow
                    key={id}
                    id={id}
                    index={i}
                    text={`Saved message ${i + 1}`}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGeneration((value) => value + 1)}
          >
            Remount the transcript
          </Button>
        </div>
        <Caption>
          A scroll container always opens at the top, so a server-rendered
          transcript would show the oldest row and then jump. While
          <code> data-pending-scroll</code> is on the viewport the styled recipe
          keeps it <code>invisible</code>: you see the frame, never the jump.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Loading Earlier Messages (preserveScrollOnPrepend)
 * -------------------------------------------------------------------------*/

export function messageScrollerPrepend(): ReactNode {
  const [offset, setOffset] = useState(0);
  const recent = Array.from(
    { length: 10 },
    (_, i) => `Recent message ${i + 1}`,
  );
  const earlier = Array.from(
    { length: offset },
    (_, i) => `Earlier message ${offset - i}`,
  );

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider defaultScrollPosition="end">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                <MessageScrollerItem messageId="load-earlier">
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={offset >= 12}
                      onClick={() => setOffset((value) => value + 4)}
                    >
                      {offset >= 12 ? "Beginning of thread" : "Load earlier"}
                    </Button>
                  </div>
                </MessageScrollerItem>
                {earlier.map((text, i) => (
                  <ChatRow key={`e${i}`} id={`e${i}`} index={i} text={text} />
                ))}
                {recent.map((text, i) => (
                  <ChatRow key={`n${i}`} id={`n${i}`} index={i} text={text} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>
        <Caption>
          Rows are prepended above the reader. The viewport preserves the
          visible row, so history loads without moving what is being read — that
          is <code>preserveScrollOnPrepend</code>, on by default.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Animating New Messages
 * -------------------------------------------------------------------------*/

export function messageScrollerAnimated(): ReactNode {
  const [turns, setTurns] = useState<Turn[]>(OPENING_TURNS);

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {turns.map((turn, i) => (
                  <TurnRow
                    key={turn.id}
                    turn={turn}
                    anchorRole="user"
                    // `motion-enter-up` is the system's fade+rise arrival for chat
                    // rows; it collapses under prefers-reduced-motion in base.css.
                    className={
                      i >= OPENING_TURNS.length ? "motion-enter-up" : undefined
                    }
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              setTurns((prev) => [
                ...prev,
                {
                  id: `t${prev.length}`,
                  role: "user",
                  text: "Send one more, and watch it rise from the live edge.",
                },
              ])
            }
          >
            Send a message
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Jumping to Messages (useMessageScroller)
 * -------------------------------------------------------------------------*/

function JumpMenu({ ids }: { ids: string[] }) {
  const { scrollToMessage } = useMessageScroller();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            Jump to…
          </Button>
        }
      />
      <DropdownMenuContent>
        {ids.map((id, i) => (
          <DropdownMenuItem
            key={id}
            onClick={() =>
              scrollToMessage(id, { align: "start", behavior: "smooth" })
            }
          >
            Message {i + 1}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function messageScrollerCommands(): ReactNode {
  const ids = Array.from({ length: 12 }, (_, i) => `m${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider defaultScrollPosition="end">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow
                    key={id}
                    id={id}
                    index={i}
                    text={`Message ${i + 1}`}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
          <div className="flex justify-end">
            <JumpMenu ids={ids} />
          </div>
        </MessageScrollerProvider>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Tracking the Reader's Position (useMessageScrollerVisibility)
 * -------------------------------------------------------------------------*/

function VisibilityOutline({ ids }: { ids: string[] }) {
  const { currentAnchorId } = useMessageScrollerVisibility();
  const { scrollToMessage } = useMessageScroller();
  return (
    <div className="flex w-28 shrink-0 flex-col gap-1 border-l border-border pl-3">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => scrollToMessage(id, { align: "start" })}
          className={cn(
            // A 16px `text-xs` line box is under the 24px pointer-target floor
            // (WCAG 2.2 §2.5.8), and at a 20px pitch an invisible hit area could only
            // reach 24px by overlapping its neighbour's. So the entry itself is 24px
            // tall, which puts the pitch at 28px and leaves each target its own square.
            "flex min-h-6 items-center text-left text-xs hover:text-foreground",
            currentAnchorId === id
              ? "font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          Turn {i + 1}
        </button>
      ))}
    </div>
  );
}

export function messageScrollerVisibility(): ReactNode {
  const ids = Array.from({ length: 8 }, (_, i) => `t${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="w-full max-w-md">
        <MessageScrollerProvider
          defaultScrollPosition="start"
          scrollMargin={12}
        >
          <div className="flex gap-3">
            <Frame className="flex-1">
              <MessageScrollerViewport
                aria-label="Conversation"
                className="p-4"
              >
                <MessageScrollerContent>
                  {ids.map((id, i) => (
                    <MessageScrollerItem key={id} messageId={id} scrollAnchor>
                      <Message align={i % 2 === 1 ? "end" : "start"}>
                        <MessageContent>
                          <Bubble
                            variant={i % 2 === 1 ? "default" : "muted"}
                            align={i % 2 === 1 ? "end" : "start"}
                          >
                            <BubbleContent>
                              Turn {i + 1} of the conversation
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton direction="end" />
            </Frame>
            <VisibilityOutline ids={ids} />
          </div>
        </MessageScrollerProvider>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Core Concepts → Reading Scroll State (useMessageScrollerScrollable)
 * -------------------------------------------------------------------------*/

function ScrollableStatus() {
  const { start, end } = useMessageScrollerScrollable();
  return (
    <p className="text-xs text-muted-foreground">
      Can scroll up: <span className="font-mono">{String(start)}</span> · down:{" "}
      <span className="font-mono">{String(end)}</span>
    </p>
  );
}

export function messageScrollerScrollable(): ReactNode {
  const ids = Array.from({ length: 14 }, (_, i) => `m${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider defaultScrollPosition="start">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow
                    key={id}
                    id={id}
                    index={i}
                    text={`Message ${i + 1}`}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            {/* Both directions: scroll-to-start (top) and scroll-to-end (bottom). */}
            <MessageScrollerButton direction="start" />
            <MessageScrollerButton direction="end" />
          </Frame>
          <ScrollableStatus />
        </MessageScrollerProvider>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Performance — content-visibility over a long transcript
 * -------------------------------------------------------------------------*/

export function messageScrollerPerformance(): ReactNode {
  const ids = Array.from({ length: 60 }, (_, i) => `perf${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider defaultScrollPosition="end">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow
                    key={id}
                    id={id}
                    index={i}
                    text={`Turn ${i + 1} — every row stays in the DOM for selection, copy, find-in-page and assistive tech.`}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="start" />
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>
        <Caption>
          Sixty real rows, no virtualiser. Scroll position and anchoring are
          tracked imperatively, and each item carries
          <code> content-visibility: auto</code> so the browser skips paint work
          for rows far outside the viewport.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Virtualization — the viewport as the virtualiser's scroll element
 * -------------------------------------------------------------------------*/

export function messageScrollerVirtualized(): ReactNode {
  const messages = Array.from({ length: 1000 }, (_, i) => ({
    id: `v${i}`,
    text: `Virtualised message ${i + 1}`,
  }));
  const viewportRef = useRef<HTMLDivElement>(null);
  const getScrollElement = useCallback(() => viewportRef.current, []);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement,
    estimateSize: () => 56,
    getItemKey: (index) => messages[index]?.id ?? index,
    overscan: 8,
  });

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider defaultScrollPosition="start">
          <Frame>
            <MessageScrollerViewport
              ref={viewportRef}
              aria-label="Conversation"
              className="p-4"
            >
              <MessageScrollerContent className="block min-h-full">
                <div
                  className="relative w-full"
                  style={{ height: virtualizer.getTotalSize() }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const message = messages[virtualItem.index];
                    if (!message) return null;
                    return (
                      <div
                        key={virtualItem.key}
                        ref={virtualizer.measureElement}
                        data-index={virtualItem.index}
                        className="absolute start-0 top-0 w-full pb-2"
                        style={{
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <Message>
                          <MessageContent>
                            <Bubble variant="muted">
                              <BubbleContent>{message.text}</BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </div>
                    );
                  })}
                </div>
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>
        <Caption>
          A thousand rows. The virtualiser owns the rows; the viewport is only
          its scroll element, so the jump control and the scroll state still
          come from the provider.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Accessibility — the engine's region, log and labelled control
 * -------------------------------------------------------------------------*/

export function messageScrollerAccessibility(): ReactNode {
  const [busy, setBusy] = useState(false);
  const ids = Array.from({ length: 10 }, (_, i) => `ally${i}`);

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider defaultScrollPosition="start">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent aria-busy={busy}>
                {ids.map((id, i) => (
                  <ChatRow
                    key={id}
                    id={id}
                    index={i}
                    text={`Message ${i + 1}`}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </Frame>
        </MessageScrollerProvider>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            aria-pressed={busy}
            onClick={() => setBusy((value) => !value)}
          >
            {busy ? "Turn complete" : "Mark the turn streaming"}
          </Button>
        </div>
        <Caption>
          Tab into the transcript: the viewport is a labelled
          <code> role=&quot;region&quot;</code> and a tab stop, so a keyboard
          user can scroll it directly. The content is
          <code> role=&quot;log&quot;</code> with
          <code> aria-relevant=&quot;additions&quot;</code>, and
          <code> aria-busy</code> holds announcements until the turn finishes.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Unstyled — the headless parts from @shadcn/react, with your own markup
 * -------------------------------------------------------------------------*/

export function messageScrollerUnstyled(): ReactNode {
  const ids = Array.from({ length: 12 }, (_, i) => `u${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerPrimitive.Provider defaultScrollPosition="start">
          <MessageScrollerPrimitive.Root className="relative flex h-64 min-h-0 flex-col overflow-hidden rounded-lg border border-border">
            <MessageScrollerPrimitive.Viewport
              aria-label="Conversation"
              className="min-h-0 w-full flex-1 overflow-y-auto p-4"
            >
              <MessageScrollerPrimitive.Content className="flex flex-col gap-2">
                {ids.map((id, i) => (
                  <MessageScrollerPrimitive.Item
                    key={id}
                    messageId={id}
                    className="rounded-lg bg-muted px-3 py-2 text-sm"
                  >
                    Unstyled row {i + 1}
                  </MessageScrollerPrimitive.Item>
                ))}
              </MessageScrollerPrimitive.Content>
            </MessageScrollerPrimitive.Viewport>
          </MessageScrollerPrimitive.Root>
        </MessageScrollerPrimitive.Provider>
        <Caption>
          The same behaviour with none of our chrome: every class here is the
          example&apos;s own. Reach for this when the transcript has to look
          like something else entirely.
        </Caption>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Jump-button variant / size overrides + live visibleMessageIds
 * -------------------------------------------------------------------------*/

function VisibleCount({ total }: { total: number }) {
  const { visibleMessageIds } = useMessageScrollerVisibility();
  return (
    <p className="text-xs text-muted-foreground">
      Visible now: <span className="font-mono">{visibleMessageIds.length}</span>{" "}
      of <span className="font-mono">{total}</span> messages
    </p>
  );
}

export function messageScrollerButtonVariants(): ReactNode {
  const ids = Array.from({ length: 16 }, (_, i) => `b${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider defaultScrollPosition="start">
          <Frame>
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow
                    key={id}
                    id={id}
                    index={i}
                    text={`Message ${i + 1}`}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            {/* Forward `variant`/`size` from ButtonProps to restyle the affordance. */}
            <MessageScrollerButton direction="end" variant="default" size="sm">
              Jump to latest
            </MessageScrollerButton>
          </Frame>
          <VisibleCount total={ids.length} />
        </MessageScrollerProvider>
      </div>
    </Wrapper>
  );
}
