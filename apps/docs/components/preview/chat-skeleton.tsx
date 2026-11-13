"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-skeleton` (dogfoods the registry).
import { ChatSkeleton, ScrollToLatest } from "@/components/ui/chat-skeleton";
import { Button } from "@/components/ui/button";

export function chatSkeleton(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <ChatSkeleton className="w-full max-w-180" />
    </Wrapper>
  );
}

function Scroll() {
  const [visible, setVisible] = useState(true);
  return (
    <div className="relative flex h-40 w-full max-w-180 items-start justify-start rounded-lg border border-border p-3">
      <Button size="xs" variant="outline" onClick={() => setVisible(!visible)}>
        {visible ? "Reader at the bottom" : "Reader scrolled up"}
      </Button>
      <ScrollToLatest
        visible={visible}
        hasNew
        onClick={() => setVisible(false)}
        className="absolute bottom-4 start-1/2 -translate-x-1/2"
      />
    </div>
  );
}

export function chatSkeletonScroll(): ReactNode {
  return (
    <Wrapper className="bg-background">
      <Scroll />
    </Wrapper>
  );
}
