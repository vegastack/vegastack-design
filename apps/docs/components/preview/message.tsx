"use client";

import type { ReactNode } from "react";
import {
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/message` (dogfoods the registry) → auto-scanned.
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { Spinner } from "@/components/ui/spinner";

/*
 * Upstream's own examples (`vendor/shadcn/4.21.0/docs/message.md`), adapted only for import paths
 * and for the two assets that must stay local: upstream's `/avatars/NN.png` and its Unsplash
 * attachment image become this repo's committed `public/preview/*` fixtures, because a demo and
 * the geometry lane must never depend on a live third-party image service. Composition, Features
 * and Accessibility carry no code fence upstream — the coverage gate requires a live preview under
 * every section, so those three compose upstream's own prose claims verbatim.
 *
 * `Message` is six plain `<div>`s with a class each: no hook, no handler, nothing interactive of
 * its own. This module is deliberately server-safe — there is no `"use client"` here.
 */

const ME = "/preview/avatar-1.svg";
const RABBIT = "/preview/avatar-2.svg";
const OLIVER = "/preview/avatar-3.svg";
const LANDSCAPE = "/preview/landscape.svg";

export function message(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-6 py-12">
        <Message align="end">
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={ME} alt="@me" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>Deploying to prod real quick.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={RABBIT} alt="@rabbit" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>It&apos;s 4:55 PM. On a Friday.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={ME} alt="@me" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>It&apos;s a one-line change.</BubbleContent>
            </Bubble>
            <MessageFooter>Delivered</MessageFooter>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={RABBIT} alt="@rabbit" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <BubbleGroup>
              <Bubble variant="muted">
                <BubbleContent>
                  It&apos;s always a one-line change 😭.
                </BubbleContent>
              </Bubble>
              <Bubble variant="muted">
                <BubbleContent>Alright, let me take a look.</BubbleContent>
                <BubbleReactions role="img" aria-label="Reactions: thumbs up">
                  <span>👍</span>
                </BubbleReactions>
              </Bubble>
            </BubbleGroup>
          </MessageContent>
        </Message>
        <Marker role="status">
          <MarkerContent className="shimmer">
            <span className="font-medium">Oliver</span> is typing...
          </MarkerContent>
        </Marker>
      </div>
    </Wrapper>
  );
}

export function messageComposition(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-6 py-12">
        {/* Message → MessageAvatar + MessageContent(MessageHeader, Bubble, MessageFooter) */}
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={OLIVER} alt="@oliver" />
              <AvatarFallback>O</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Oliver</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>
                The avatar, the header, the surface and the footer are four
                slots around one row.
              </BubbleContent>
            </Bubble>
            <MessageFooter>Delivered</MessageFooter>
          </MessageContent>
        </Message>
        {/* MessageGroup → Message + Message */}
        <MessageGroup>
          <Message align="end">
            <MessageAvatar />
            <MessageContent>
              <Bubble>
                <BubbleContent>Two rows, one sender.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Message align="end">
            <MessageAvatar>
              <Avatar>
                <AvatarImage src={ME} alt="@me" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble>
                <BubbleContent>
                  The group stacks them; the avatar sits on the last one.
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </MessageGroup>
      </div>
    </Wrapper>
  );
}

export function messageFeatures(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-6 py-12">
        {/* Start alignment, with a header naming the sender. */}
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={RABBIT} alt="@rabbit" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Rabbit</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>
                The row owns the layout; the bubble owns the surface.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        {/* End alignment: the row reverses, and the footer follows the message side. */}
        <Message align="end">
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={ME} alt="@me" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>
                On an end-aligned row the avatar moves to the end and the footer
                follows it.
              </BubbleContent>
            </Bubble>
            {/* The avatar lifts clear of this footer — `group-has-data-[slot=message-footer]`. */}
            <MessageFooter>Read</MessageFooter>
          </MessageContent>
        </Message>
      </div>
    </Wrapper>
  );
}

export function messageAvatar(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-6 py-12">
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={OLIVER} alt="@avatar" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>
                The build failed during dependency installation.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={ME} alt="@avatar" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>Can you share the exact error?</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={OLIVER} alt="@avatar" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <BubbleGroup>
              <Bubble variant="muted">
                <BubbleContent>
                  Here&apos;s the error from the logs
                </BubbleContent>
              </Bubble>
              <Bubble variant="muted">
                <BubbleContent>
                  Something went wrong with the build. The libraries are not
                  installed correctly. Try running the build again.
                </BubbleContent>
              </Bubble>
            </BubbleGroup>
          </MessageContent>
        </Message>
      </div>
    </Wrapper>
  );
}

export function messageGroup(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-6 py-12">
        <MessageGroup>
          <Message>
            <MessageAvatar />
            <MessageContent>
              <Bubble variant="muted">
                <BubbleContent>I checked the registry addresses.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarImage src={RABBIT} alt="@avatar" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble variant="muted">
                <BubbleContent>
                  The component and example JSON now live under the UI registry.
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </MessageGroup>
      </div>
    </Wrapper>
  );
}

export function messageHeaderAndFooter(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        <Message>
          <MessageContent>
            <MessageHeader>Olivia</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>I already checked the logs.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageContent>
            <Bubble>
              <BubbleContent>
                Send the report to the team. Ping @shadcn if you need help.
              </BubbleContent>
            </Bubble>
            <MessageFooter>
              <div>
                Read <span className="font-normal">Yesterday</span>
              </div>
            </MessageFooter>
          </MessageContent>
        </Message>
      </div>
    </Wrapper>
  );
}

export function messageActions(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        <Message>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>
                The install failure is coming from the workspace package.
              </BubbleContent>
            </Bubble>
            <MessageFooter>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy"
                title="Copy"
              >
                <CopyIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Like"
                title="Like"
              >
                <ThumbsUpIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Dislike"
                title="Dislike"
              >
                <ThumbsDownIcon />
              </Button>
            </MessageFooter>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageContent>
            <Bubble>
              <BubbleContent>
                Okay drop me a link. Taking a look...
              </BubbleContent>
            </Bubble>
            <MessageFooter className="gap-2">
              <span className="font-normal text-destructive-text">
                Failed to send
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                title="Retry"
                aria-label="Retry"
              >
                <RefreshCcwIcon />
              </Button>
            </MessageFooter>
          </MessageContent>
        </Message>
      </div>
    </Wrapper>
  );
}

export function messageAttachment(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        <Message align="end">
          <MessageContent>
            <Attachment orientation="vertical">
              <AttachmentMedia variant="image">
                <img src={LANDSCAPE} alt="Workspace" />
              </AttachmentMedia>
            </Attachment>
            <Bubble>
              <BubbleContent>
                Here&apos;s the image. Can you add it to the PDF? Use it for the
                cover page.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>
                Done. Here&apos;s the PDF with the image added as the cover
                page.
              </BubbleContent>
            </Bubble>
            <Attachment>
              <AttachmentMedia>
                <FileTextIcon />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
                <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  type="button"
                  title="Download"
                  aria-label="Download"
                  size="icon-sm"
                  variant="secondary"
                >
                  <DownloadIcon />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageContent>
            <Bubble>
              <BubbleContent>Thanks. Looks good.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </div>
    </Wrapper>
  );
}

export function messageAccessibility(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        {/* Icon-only footer actions each carry an `aria-label`. */}
        <Message>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>
                Every icon-only action below is named for a screen reader.
              </BubbleContent>
            </Bubble>
            <MessageFooter>
              <Button variant="ghost" size="icon" aria-label="Copy">
                <CopyIcon />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Retry">
                <RefreshCcwIcon />
              </Button>
            </MessageFooter>
          </MessageContent>
        </Message>
        {/* An in-progress message is a `role="status"` Marker, so it announces as it appears. */}
        <Message>
          <MessageContent>
            <Marker role="status">
              <MarkerIcon>
                <Spinner />
              </MarkerIcon>
              <MarkerContent>Checking the logs...</MarkerContent>
            </Marker>
          </MessageContent>
        </Message>
      </div>
    </Wrapper>
  );
}
