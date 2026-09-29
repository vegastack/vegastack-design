"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { CommentMargin, CommentPopover } from "@/components/ui/comment-margin";

const CARD =
  "rounded-xl border border-border bg-card p-3 text-sm text-card-foreground";

const ITEMS = [
  { id: "a", top: 0, text: "Is 25 A right for a 7 kW cooker?", lines: 2 },
  { id: "b", top: 16, text: "Add a photo of the earth bar.", lines: 1 },
  { id: "c", top: 40, text: "Who signs off the RCD test?", lines: 1 },
  { id: "d", top: 260, text: "Label the new circuit.", lines: 1 },
];

/**
 * Cards sit level with their text (`top`), pushed down just enough not to overlap; pick one to
 * make it active — it sits exactly at its `top` and the cards above it move up.
 */
export function commentMargin(): ReactNode {
  const [active, setActive] = React.useState<string | null>(null);
  return (
    <Wrapper className="block">
      <div className="flex gap-6">
        <div className="relative min-w-0 flex-1 text-sm text-muted-foreground">
          {ITEMS.map((item) => (
            <div
              key={item.id}
              className="absolute inset-x-0 border-t border-dashed border-border pt-1"
              style={{ top: item.top }}
            >
              Highlight {item.id.toUpperCase()} at {item.top}px
            </div>
          ))}
        </div>
        <CommentMargin
          className="w-64 shrink-0"
          activeId={active}
          items={ITEMS.map((item) => ({
            id: item.id,
            top: item.top,
            node: (
              <div className={CARD}>
                <p>{item.text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 -ms-2"
                  onClick={() => setActive(active === item.id ? null : item.id)}
                >
                  {active === item.id ? "Unfocus" : "Focus"}
                </Button>
              </div>
            ),
          }))}
        />
      </div>
    </Wrapper>
  );
}

/** Below the margin breakpoint the thread opens in a popover anchored to its highlight. */
export function commentMarginPopover(): ReactNode {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  return (
    <Wrapper>
      <p className="text-sm">
        Use a{" "}
        <Button
          variant="link"
          className="h-auto p-0 align-baseline"
          onClick={(event) => {
            setRect(event.currentTarget.getBoundingClientRect());
            setOpen(true);
          }}
        >
          25 A breaker
        </Button>{" "}
        for the cooker.
      </p>
      <CommentPopover anchorRect={rect} open={open} onOpenChange={setOpen}>
        <div className={CARD}>Is 25 A right for a 7 kW cooker?</div>
      </CommentPopover>
    </Wrapper>
  );
}
