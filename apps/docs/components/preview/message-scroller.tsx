"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
function ChatRow({ id, index, text }: { id: string; index: number; text: string }) {
  const sent = index % 3 === 2;
  return (
    <MessageScrollerItem messageId={id} scrollAnchor={sent}>
      <Message align={sent ? "end" : "start"}>
        <MessageContent>
          <Bubble variant={sent ? "default" : "muted"} align={sent ? "end" : "start"}>
            <BubbleContent>{text}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

/* ---------------------------------------------------------------------------
 * 1. Basic auto-scroll + send
 * -------------------------------------------------------------------------*/

export function messageScroller(): ReactNode {
  const [messages, setMessages] = useState<string[]>(SEED);

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="h-64 rounded-lg border border-border">
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {messages.map((text, i) => (
                  <ChatRow key={i} id={`m${i}`} index={i} text={text} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            {/* Button is a SIBLING of the viewport so it pins to the relative frame. */}
            <MessageScrollerButton direction="end" />
          </MessageScroller>
        </MessageScrollerProvider>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              setMessages((prev) => [...prev, `New message #${prev.length + 1}`])
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
 * 2. Commands — drive the transcript from outside via useMessageScroller
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
          <MessageScroller className="h-64 rounded-lg border border-border">
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow key={id} id={id} index={i} text={`Message ${i + 1}`} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" />
          </MessageScroller>
          <div className="flex justify-end">
            <JumpMenu ids={ids} />
          </div>
        </MessageScrollerProvider>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * 3. Scrollable status + scroll-to-start / scroll-to-end buttons
 * -------------------------------------------------------------------------*/

function ScrollableStatus() {
  const { start, end } = useMessageScrollerScrollable();
  return (
    <p className="text-sm text-muted-foreground">
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
          <MessageScroller className="h-64 rounded-lg border border-border">
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow key={id} id={id} index={i} text={`Message ${i + 1}`} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            {/* Both directions: scroll-to-start (top) and scroll-to-end (bottom). */}
            <MessageScrollerButton direction="start" />
            <MessageScrollerButton direction="end" />
          </MessageScroller>
          <ScrollableStatus />
        </MessageScrollerProvider>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * 4. Streaming — aria-busy + a shimmer typing indicator, auto-following
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
          <MessageScroller className="h-64 rounded-lg border border-border">
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
          </MessageScroller>
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
 * 5. Visibility — an outline that tracks the current anchored turn
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
            "text-left text-sm transition-colors duration-fast ease-standard hover:text-foreground",
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
        <MessageScrollerProvider defaultScrollPosition="start" scrollMargin={12}>
          <div className="flex gap-3">
            <MessageScroller className="h-64 flex-1 rounded-lg border border-border">
              <MessageScrollerViewport aria-label="Conversation" className="p-4">
                <MessageScrollerContent>
                  {ids.map((id, i) => (
                    <MessageScrollerItem key={id} messageId={id} scrollAnchor>
                      <Message align={i % 2 === 1 ? "end" : "start"}>
                        <MessageContent>
                          <Bubble
                            variant={i % 2 === 1 ? "default" : "muted"}
                            align={i % 2 === 1 ? "end" : "start"}
                          >
                            <BubbleContent>Turn {i + 1} of the conversation</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton direction="end" />
            </MessageScroller>
            <VisibilityOutline ids={ids} />
          </div>
        </MessageScrollerProvider>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * 6. Anchor restore — defaultScrollPosition="last-anchor" + scrollPreviousItemPeek
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
          <MessageScroller className="h-64 rounded-lg border border-border">
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
          </MessageScroller>
        </MessageScrollerProvider>
        <p className="text-sm text-muted-foreground">
          Opens at the anchored turn (tinted) rather than the top or bottom, with a
          peek of the previous message above it.
        </p>
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * 7. Button variant / size overrides + live visibleMessageIds
 * -------------------------------------------------------------------------*/

function VisibleCount({ total }: { total: number }) {
  const { visibleMessageIds } = useMessageScrollerVisibility();
  return (
    <p className="text-sm text-muted-foreground">
      Visible now:{" "}
      <span className="font-mono">{visibleMessageIds.length}</span> of{" "}
      <span className="font-mono">{total}</span> messages
    </p>
  );
}

export function messageScrollerButtonVariants(): ReactNode {
  const ids = Array.from({ length: 16 }, (_, i) => `b${i}`);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <MessageScrollerProvider defaultScrollPosition="start">
          <MessageScroller className="h-64 rounded-lg border border-border">
            <MessageScrollerViewport aria-label="Conversation" className="p-4">
              <MessageScrollerContent>
                {ids.map((id, i) => (
                  <ChatRow key={id} id={id} index={i} text={`Message ${i + 1}`} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            {/* Forward `variant`/`size` from ButtonProps to restyle the affordance. */}
            <MessageScrollerButton
              direction="end"
              variant="default"
              size="sm"
            >
              Jump to latest
            </MessageScrollerButton>
          </MessageScroller>
          <VisibleCount total={ids.length} />
        </MessageScrollerProvider>
      </div>
    </Wrapper>
  );
}
