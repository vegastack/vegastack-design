"use client";

import { useState, type ReactNode } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  InfoIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/bubble` (dogfoods the registry) → auto-scanned.
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarkdownView } from "@/components/ui/markdown-view";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/*
 * Upstream's own examples (`vendor/shadcn/4.21.0/docs/bubble.md`), adapted only for import paths
 * and for the two things that do not exist here: upstream's docs-chrome `<Markdown>` becomes the
 * registry's `MarkdownView`, and `sonner`'s bare `toast()` becomes this system's `toast.add()`.
 * Composition, Features and Accessibility carry no code fence upstream — the gate requires a live
 * preview under every section, so those three compose upstream's own prose claims verbatim.
 */

export function bubble(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        <Bubble align="end">
          <BubbleContent>Hey there! what&apos;s up?</BubbleContent>
        </Bubble>
        <BubbleGroup>
          <Bubble variant="muted">
            <BubbleContent>Hey! Want to see chat bubbles?</BubbleContent>
          </Bubble>
          <Bubble variant="muted">
            <BubbleContent>
              I can group messages, switch sides, and keep the whole thread easy
              to scan.
            </BubbleContent>
            <BubbleReactions role="img" aria-label="Reaction: thumbs up">
              <span>👍</span>
            </BubbleReactions>
          </Bubble>
        </BubbleGroup>
        <Bubble align="end">
          <BubbleContent>Sure. Hit me with your best demo.</BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>
            Yes. You are reading a demo that is demoing itself. Very meta. Very
            on-brand.
          </BubbleContent>
          <BubbleReactions
            role="img"
            aria-label="Reactions: thumbs up, fire, eyes, and 2 more"
          >
            <span>👍</span>
            <span>🔥</span>
            <span>👀</span>
            <span>+2</span>
          </BubbleReactions>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleComposition(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-10 py-12">
        <Bubble>
          <BubbleContent>
            I checked the registry output and removed the stale route.
          </BubbleContent>
          <BubbleReactions role="img" aria-label="Reaction: thumbs up">
            <span>👍</span>
          </BubbleReactions>
        </Bubble>
        <BubbleGroup>
          <Bubble variant="muted">
            <BubbleContent>Two bubbles, one sender.</BubbleContent>
          </Bubble>
          <Bubble variant="muted">
            <BubbleContent>
              The group owns the stacking; each bubble still owns its own
              variant and alignment.
            </BubbleContent>
          </Bubble>
        </BubbleGroup>
      </div>
    </Wrapper>
  );
}

export function bubbleFeatures(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-10 py-12">
        {/* Sizes to its content, up to 80% of the row. */}
        <Bubble variant="muted">
          <BubbleContent>Short.</BubbleContent>
        </Bubble>
        {/* Start and end alignment, for sender and receiver. */}
        <Bubble align="end">
          <BubbleContent>
            A longer message stops at 80% of the container width, so the row
            never reads as full-bleed text.
          </BubbleContent>
        </Bubble>
        {/* Reactions anchor to the bubble edge, with a configurable side and alignment. */}
        <Bubble variant="secondary">
          <BubbleContent>Reactions anchor to the edge.</BubbleContent>
          <BubbleReactions
            side="top"
            align="start"
            role="img"
            aria-label="Reactions: party popper, clapping hands"
          >
            <span>🎉</span>
            <span>👏</span>
          </BubbleReactions>
        </Bubble>
        {/* Polymorphic content via `render` — a real button, with the global focus outline. */}
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={
              <button
                type="button"
                onClick={() => toast.add({ title: "Polymorphic bubble" })}
              />
            }
          >
            A bubble rendered as a real button
          </BubbleContent>
        </Bubble>
        {/* Ghost drops the frame and the max-width, for assistant text. */}
        <Bubble variant="ghost">
          <BubbleContent>
            Ghost is unframed and full width, for assistant output that should
            not look like a chat surface at all.
          </BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleVariants(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-12 py-12">
        <Bubble>
          <BubbleContent>This is the default primary bubble.</BubbleContent>
        </Bubble>
        <Bubble variant="secondary" align="end">
          <BubbleContent>This is the secondary variant.</BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>
            This one is muted. It uses a lower emphasis color for the chat
            bubble.
          </BubbleContent>
          <BubbleReactions role="img" aria-label="Reaction: thumbs up">
            <span>👍</span>
          </BubbleReactions>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent>
            This one is tinted. The tint is a softer color derived from the
            primary color.
          </BubbleContent>
        </Bubble>
        <Bubble variant="outline">
          <BubbleContent>We can also use an outlined variant.</BubbleContent>
        </Bubble>
        <Bubble variant="destructive" align="end">
          <BubbleContent>
            Or a destructive variant with a reaction.
          </BubbleContent>
          <BubbleReactions role="img" aria-label="Reaction: fire">
            <span>🔥</span>
          </BubbleReactions>
        </Bubble>
        <Bubble variant="ghost">
          <BubbleContent>
            <MarkdownView>{`Ghost bubbles work for assistant text, **markdown**, and other content that should not be framed.

This is perfect for assistant messages that should not have a frame and can take the full width of the container. You can also render \`code\` in it.

Ghost bubbles are full width and can take the full width of the container.
`}</MarkdownView>
          </BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleAlignment(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        <Bubble variant="muted">
          <BubbleContent>
            This bubble is aligned to the start. This is the default alignment.
          </BubbleContent>
        </Bubble>
        <Bubble align="end">
          <BubbleContent>
            This bubble is aligned to the end. Use this for user messages.
          </BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleGroup(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        <Bubble variant="muted">
          <BubbleContent>Can you tell me what&apos;s the issue?</BubbleContent>
        </Bubble>
        <BubbleGroup>
          <Bubble align="end">
            <BubbleContent>You tell me!</BubbleContent>
          </Bubble>
          <Bubble align="end">
            <BubbleContent>It worked yesterday. You broke it!</BubbleContent>
          </Bubble>
          <Bubble align="end">
            <BubbleContent>Find the bug and fix it.</BubbleContent>
            <BubbleReactions
              role="img"
              aria-label="Reactions: eyes"
              align="start"
            >
              <span>👀</span>
            </BubbleReactions>
          </Bubble>
        </BubbleGroup>
        <Bubble variant="muted">
          <BubbleContent>
            Want me to diff yesterday&apos;s you against today&apos;s you?
            It&apos;s a bit embarrassing.
          </BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleLinksAndButtons(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        <Bubble variant="muted">
          <BubbleContent>How can I help you today?</BubbleContent>
        </Bubble>
        <BubbleGroup>
          <Bubble variant="tinted" align="end">
            <BubbleContent
              render={
                <button
                  type="button"
                  onClick={() =>
                    toast.add({ title: "You clicked forgot password" })
                  }
                />
              }
            >
              I forgot my password
            </BubbleContent>
          </Bubble>
          <Bubble variant="tinted" align="end">
            <BubbleContent
              render={
                <button
                  type="button"
                  onClick={() =>
                    toast.add({ title: "You clicked help with subscription" })
                  }
                />
              }
            >
              I need help with my subscription
            </BubbleContent>
          </Bubble>
          <Bubble variant="tinted" align="end">
            <BubbleContent
              render={
                <button
                  type="button"
                  onClick={() =>
                    toast.add({
                      title: "You clicked something else. Talk to a human.",
                    })
                  }
                />
              }
            >
              Something else. Talk to a human.
            </BubbleContent>
          </Bubble>
        </BubbleGroup>
      </div>
    </Wrapper>
  );
}

export function bubbleReactions(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-12 py-12">
        <Bubble variant="muted" align="end">
          <BubbleContent>
            I don&apos;t need tests, I know my code works.
          </BubbleContent>
          <BubbleReactions
            align="start"
            role="img"
            aria-label="Reactions: thumbs up, surprised"
          >
            <span>👍</span>
            <span>😮</span>
          </BubbleReactions>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>
            Bold. Fine I&apos;ll add some tests. I&apos;ll let you know when
            they&apos;re done.
          </BubbleContent>
          <BubbleReactions
            role="img"
            aria-label="Reactions: eyes, rocket, and 2 more"
          >
            <span>👀</span>
            <span>🚀</span>
            <span>+2</span>
          </BubbleReactions>
        </Bubble>
        <Bubble variant="default" align="end">
          <BubbleContent>
            Tests passed on the first try. All 142 of them. Looking good!
          </BubbleContent>
          <BubbleReactions
            side="top"
            align="start"
            role="img"
            aria-label="Reactions: party popper, clapping hands"
          >
            <span>🎉</span>
            <span>👏</span>
          </BubbleReactions>
        </Bubble>
        <Bubble variant="destructive">
          <BubbleContent>Are you sure I can run this command?</BubbleContent>
          <BubbleReactions>
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                toast.add({
                  type: "success",
                  title: "You clicked yes, running command...",
                })
              }
            >
              Yes, run it
            </Button>
          </BubbleReactions>
        </Bubble>
      </div>
    </Wrapper>
  );
}

const showMoreText = `The accessibility review found two focus states that were visually too subtle in dark mode.

I checked the dialog, menu, and drawer paths because each one renders focusable controls inside a layered surface.

The dialog and drawer are fine. The menu needs the hover and focus tokens split so keyboard focus stays visible when the pointer is not involved.

I also recommend keeping the change in the style file instead of the primitive so the other themes can choose their own focus treatment later.`;

const showMorePreviewLength = 180;

export function bubbleShowMoreCollapsible(): ReactNode {
  const [open, setOpen] = useState(false);
  const isLong = showMoreText.length > showMorePreviewLength;
  const preview = `${showMoreText.slice(0, showMorePreviewLength)}...`;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-8 py-12">
        <Bubble variant="muted">
          <BubbleContent>How can I help you today?</BubbleContent>
        </Bubble>

        <Bubble variant="muted" align="end">
          <BubbleContent className="whitespace-pre-line">
            <Collapsible open={open} onOpenChange={setOpen}>
              <div>{open || !isLong ? showMoreText : preview}</div>
              {isLong ? (
                <CollapsibleTrigger
                  render={
                    <Button
                      variant="link"
                      className="gap-1 p-0 text-muted-foreground"
                    />
                  }
                >
                  {open ? "Show less" : "Show more"}
                  <ChevronDownIcon
                    data-icon="inline-end"
                    className="group-data-panel-open/button:rotate-180"
                  />
                </CollapsibleTrigger>
              ) : null}
            </Collapsible>
          </BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleTooltip(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <TooltipProvider>
        <div className="flex w-full max-w-sm flex-col gap-4 py-12">
          <Bubble variant="secondary">
            <BubbleContent>Did you remove the stale route?</BubbleContent>
          </Bubble>
          <Bubble align="end">
            <BubbleContent>Yes, removed it from the registry.</BubbleContent>
            <BubbleReactions>
              <Tooltip>
                <TooltipTrigger
                  aria-label="Read receipt"
                  render={<Button variant="ghost" size="icon-xs" />}
                >
                  <CheckIcon />
                </TooltipTrigger>
                <TooltipContent>Read on Jan 5, 2026 at 4:32 PM</TooltipContent>
              </Tooltip>
            </BubbleReactions>
          </Bubble>
        </div>
      </TooltipProvider>
    </Wrapper>
  );
}

export function bubblePopover(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-4 py-12">
        <Bubble align="end">
          <BubbleContent>Run the build script.</BubbleContent>
        </Bubble>
        <Bubble variant="destructive">
          <BubbleContent>Failed to run the command.</BubbleContent>
          <BubbleReactions>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Show error details"
                    className="aria-expanded:text-destructive"
                  />
                }
              >
                <InfoIcon />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle className="text-sm">
                    Command failed with exit code 1
                  </PopoverTitle>
                  <PopoverDescription className="text-sm">
                    ENOENT: no such file or directory, open pnpm-lock.yaml
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          </BubbleReactions>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleAccessibility(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-sm flex-col gap-12 py-12">
        {/* Labeling reactions — one `role="img"` row, read once, counters included. */}
        <Bubble variant="muted">
          <BubbleContent>
            A row of glyphs is grouped as a single image.
          </BubbleContent>
          <BubbleReactions
            role="img"
            aria-label="Reactions: thumbs up, fire, and 8 more"
          >
            <span>👍</span>
            <span>🔥</span>
            <span>+8</span>
          </BubbleReactions>
        </Bubble>
        {/* Interactive reactions are real buttons, and an icon-only one is named. */}
        <Bubble variant="muted">
          <BubbleContent>
            Interactive reactions are buttons, not glyphs.
          </BubbleContent>
          <BubbleReactions>
            <Button aria-label="Thumbs up" variant="secondary" size="icon-xs">
              <ThumbsUpIcon />
            </Button>
          </BubbleReactions>
        </Bubble>
        {/* Interactive bubble — a real button, named by its own text, wearing the global outline. */}
        <Bubble variant="muted" align="end">
          <BubbleContent
            render={
              <button
                type="button"
                onClick={() => toast.add({ title: "Reply sent" })}
              />
            }
          >
            I forgot my password
          </BubbleContent>
        </Bubble>
        {/* Meaning beyond colour — the destructive bubble says what failed in words. */}
        <Bubble variant="destructive">
          <BubbleContent>
            Failed to send: the recipient&apos;s mailbox is full.
          </BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}
