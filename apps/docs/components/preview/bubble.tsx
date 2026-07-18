"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Info } from "lucide-react";
import { toast } from "sonner";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/bubble` (dogfoods the registry) → auto-scanned.
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const VARIANTS = [
  "default",
  "secondary",
  "muted",
  "tinted",
  "outline",
  "ghost",
  "destructive",
] as const;

export function bubble(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-md flex-col gap-2">
        {VARIANTS.map((variant) => (
          <Bubble key={variant} variant={variant}>
            <BubbleContent>
              {variant.charAt(0).toUpperCase() + variant.slice(1)} bubble
            </BubbleContent>
          </Bubble>
        ))}
      </div>
    </Wrapper>
  );
}

export function bubbleAlignment(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-2">
        <Bubble variant="muted">
          <BubbleContent>Received — hugs the start edge.</BubbleContent>
        </Bubble>
        <Bubble align="end">
          <BubbleContent>Sent — hugs the end edge.</BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleGroup(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <BubbleGroup>
          <Bubble align="end">
            <BubbleContent>Are we still on for 3pm?</BubbleContent>
          </Bubble>
          <Bubble align="end">
            <BubbleContent>I can move it earlier if that helps.</BubbleContent>
          </Bubble>
          <Bubble align="end">
            <BubbleContent>Let me know!</BubbleContent>
          </Bubble>
        </BubbleGroup>
        <Bubble variant="muted">
          <BubbleContent>3pm works — see you then.</BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleConversation(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <BubbleGroup className="w-full max-w-md">
        <Bubble variant="muted">
          <BubbleContent>Nice work on the launch! 🚀</BubbleContent>
        </Bubble>
        <Bubble align="end">
          <BubbleContent>Thanks — couldn't have done it alone.</BubbleContent>
          <BubbleReactions role="img" aria-label="2 thumbs-up reactions">
            👍 2
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
    </Wrapper>
  );
}

export function bubbleReactions(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-8 py-4">
        <Bubble variant="muted">
          <BubbleContent>Bottom-start reaction</BubbleContent>
          <BubbleReactions side="bottom" align="start" role="img" aria-label="heart">
            ❤️
          </BubbleReactions>
        </Bubble>
        <Bubble align="end">
          <BubbleContent>Top-end, multiple reactions</BubbleContent>
          <BubbleReactions side="top" align="end" role="img" aria-label="reactions">
            😂🎉👍
          </BubbleReactions>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>Overflow count</BubbleContent>
          <BubbleReactions role="img" aria-label="8 reactions">
            👍 +8
          </BubbleReactions>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleInteractive(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Bubble variant="muted">
          <BubbleContent>Want me to deploy to production?</BubbleContent>
        </Bubble>
        <BubbleGroup className="items-end">
          <Bubble variant="tinted" align="end">
            <BubbleContent
              render={
                <button
                  type="button"
                  onClick={() => toast("Deploying to production…")}
                />
              }
            >
              Yes, deploy now
            </BubbleContent>
          </Bubble>
          <Bubble variant="tinted" align="end">
            <BubbleContent
              render={
                <button
                  type="button"
                  onClick={() => toast("Okay, holding off.")}
                />
              }
            >
              Not yet
            </BubbleContent>
          </Bubble>
        </BubbleGroup>
        <Bubble align="end">
          <BubbleContent render={<a href="#" />}>
            Open the deploy logs ↗
          </BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleAnimateIn(): ReactNode {
  const [sent, setSent] = useState(false);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col items-end gap-3">
        {sent ? (
          <Bubble key="sent" align="end" animateIn>
            <BubbleContent>On my way — be there in five.</BubbleContent>
          </Bubble>
        ) : null}
        <Button variant="outline" size="sm" disabled={sent} onClick={() => setSent(true)}>
          Send message
        </Button>
      </div>
    </Wrapper>
  );
}

export function bubbleCollapsible(): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md justify-end">
        <Bubble variant="muted" align="end">
          <BubbleContent>
            <Collapsible open={open} onOpenChange={setOpen}>
              <p>
                Here's the gist: the migration moves all timestamps to UTC and
                backfills the new column.
              </p>
              <CollapsibleContent>
                <p className="mt-2 text-muted-foreground">
                  It runs in batches of 1,000 rows, is idempotent, and can be
                  re-run safely. Expect about 20 minutes on production.
                </p>
              </CollapsibleContent>
              <CollapsibleTrigger
                render={<Button variant="link" size="sm" className="mt-1 px-0" />}
              >
                {open ? "Show less" : "Show more"}
                <ChevronDown
                  className={
                    open
                      ? "rotate-180 transition-transform duration-fast ease-standard"
                      : "transition-transform duration-fast ease-standard"
                  }
                />
              </CollapsibleTrigger>
            </Collapsible>
          </BubbleContent>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubblePopover(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md justify-end py-4">
        <Bubble variant="destructive" align="end">
          <BubbleContent>Couldn't send your message.</BubbleContent>
          <BubbleReactions side="bottom" align="end">
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="ghost" size="icon-xs" aria-label="Why did this fail?">
                    <Info />
                  </Button>
                }
              />
              <PopoverContent className="max-w-xs">
                <PopoverTitle>Delivery failed</PopoverTitle>
                <PopoverDescription>
                  The recipient's inbox is full. We'll retry automatically for
                  the next 24 hours.
                </PopoverDescription>
              </PopoverContent>
            </Popover>
          </BubbleReactions>
        </Bubble>
      </div>
    </Wrapper>
  );
}

export function bubbleTooltip(): ReactNode {
  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md justify-end py-4">
        <Bubble align="end">
          <BubbleContent>Heading out now — see you soon!</BubbleContent>
          <BubbleReactions side="bottom" align="end" className="p-0">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-xs" aria-label="Read receipt">
                    <Check />
                  </Button>
                }
              />
              <TooltipContent>Read at 10:32 AM</TooltipContent>
            </Tooltip>
          </BubbleReactions>
        </Bubble>
      </div>
    </Wrapper>
  );
}
