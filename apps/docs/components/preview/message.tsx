"use client";

import { useState, type ReactNode } from "react";
import {
  Copy,
  Download,
  FileText,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/{message,bubble,avatar,button}` → auto-scanned.
import { Avatar } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";

export function message(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <MessageGroup className="w-full max-w-md">
        <Message>
          <MessageAvatar>
            <Avatar fallback="AL" />
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Ada Lovelace</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>
                Morning! Did the deploy finish overnight?
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>

        <Message align="end">
          <MessageContent>
            <Bubble align="end">
              <BubbleContent>Yes — green across the board. 🎉</BubbleContent>
            </Bubble>
            <MessageFooter>Sent 2m ago</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
    </Wrapper>
  );
}

export function messageGroup(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <MessageGroup className="w-full max-w-md">
        <Message>
          <MessageAvatar>
            <Avatar fallback="LT" />
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Linus</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>I pushed the fix to the branch.</BubbleContent>
            </Bubble>
            <Bubble variant="muted">
              <BubbleContent>Tests are green now.</BubbleContent>
            </Bubble>
            <Bubble variant="muted">
              <BubbleContent>Want me to open the PR?</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </Wrapper>
  );
}

export function messageHeaderFooter(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <MessageGroup className="w-full max-w-md">
        <Message>
          <MessageAvatar>
            <Avatar fallback="AL" />
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Ada Lovelace</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>Can you review the latest draft?</BubbleContent>
            </Bubble>
            <MessageFooter>10:24 AM</MessageFooter>
          </MessageContent>
        </Message>

        <Message align="end">
          <MessageContent>
            <Bubble align="end">
              <BubbleContent>On it — give me five minutes.</BubbleContent>
            </Bubble>
            <MessageFooter>Read</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
    </Wrapper>
  );
}

export function messageActions(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <MessageGroup className="w-full max-w-md">
        <Message>
          <MessageAvatar>
            <Avatar fallback="AI" />
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>
                Here's a summary of the changes in this release.
              </BubbleContent>
            </Bubble>
            <MessageFooter className="gap-0.5">
              <Button variant="ghost" size="icon-sm" aria-label="Copy">
                <Copy />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Retry">
                <RotateCcw />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Good response">
                <ThumbsUp />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Bad response">
                <ThumbsDown />
              </Button>
            </MessageFooter>
          </MessageContent>
        </Message>

        <Message align="end">
          <MessageContent>
            <Bubble variant="destructive" align="end">
              <BubbleContent>Send the invoice to the client.</BubbleContent>
            </Bubble>
            <MessageFooter className="gap-2">
              <span>Failed to send</span>
              <Button variant="ghost" size="sm">
                Retry
              </Button>
            </MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
    </Wrapper>
  );
}

export function messageAnimateIn(): ReactNode {
  const [replied, setReplied] = useState(false);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <MessageGroup className="w-full max-w-md">
        <Message>
          <MessageAvatar>
            <Avatar fallback="AL" />
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Ada Lovelace</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>Ping me when the deploy is done.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        {replied ? (
          <Message key="reply" align="end" animateIn>
            <MessageContent>
              <Bubble align="end" animateIn>
                <BubbleContent>Just shipped — all green. 🎉</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        ) : null}
      </MessageGroup>
      <Button
        variant="outline"
        size="sm"
        disabled={replied}
        onClick={() => setReplied(true)}
      >
        Send reply
      </Button>
    </Wrapper>
  );
}

export function messageGhostBubble(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <MessageGroup className="w-full max-w-md">
        {/* Header/footer drop their inline padding under a ghost bubble, so the
            muted lines align flush with the edge-to-edge media. */}
        <Message>
          <MessageAvatar>
            <Avatar fallback="AL" />
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Ada Lovelace</MessageHeader>
            <Bubble variant="ghost">
              <BubbleContent>
                <div className="aspect-video w-56 rounded-lg bg-gradient-to-br from-muted to-accent" />
              </BubbleContent>
            </Bubble>
            <MessageFooter>Shared a screenshot · 2m ago</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
    </Wrapper>
  );
}

export function messageAttachment(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <MessageGroup className="w-full max-w-md">
        <Message>
          <MessageAvatar>
            <Avatar fallback="AL" />
          </MessageAvatar>
          <MessageContent>
            {/* Image attachment — a ghost bubble removes the surface so media sits flush. */}
            <Bubble variant="ghost">
              <BubbleContent>
                <div className="aspect-video w-56 rounded-lg bg-gradient-to-br from-muted to-accent" />
              </BubbleContent>
            </Bubble>
            {/* File attachment — an outline bubble framing a file chip. */}
            <Bubble variant="outline">
              <BubbleContent>
                <span className="flex items-center gap-3">
                  <FileText className="size-(--icon-action) shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      release-notes.pdf
                    </span>
                    <span className="text-sm text-muted-foreground">
                      248 KB
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Download release-notes.pdf"
                  >
                    <Download />
                  </Button>
                </span>
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </Wrapper>
  );
}
