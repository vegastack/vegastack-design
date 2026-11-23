"use client";

import * as React from "react";
import { ArrowUpIcon, XIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/shell-assistant` (dogfoods the registry) → auto-scanned.
import { AssistantCard } from "@/components/ui/shell-assistant";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function Page() {
  const [open, setOpen] = React.useState(false);
  return (
    // The split view in small: the page, and the card docked beside it while open (as `Shell`
    // docks it from 40rem).
    <div className="flex h-150 w-full gap-2 overflow-hidden rounded-block border border-border bg-muted p-2">
      <div className="min-w-0 flex-1 overflow-y-auto rounded-card border border-border bg-background p-6 text-sm text-muted-foreground">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-base font-semibold text-foreground">
            #3 Review Q3 pricing
          </p>
          <Button
            variant="outline"
            size="sm"
            aria-expanded={open}
            aria-controls="assistant-card-demo"
            aria-keyshortcuts="Meta+J"
            onClick={() => setOpen(true)}
          >
            Ask William
          </Button>
        </div>
        {Array.from({ length: 24 }, (_, i) => (
          <p key={i} className="mb-3">
            The card opens from the global bar&apos;s Ask or ⌘J and docks beside
            the page. Paragraph {i + 1}.
          </p>
        ))}
      </div>
      <AssistantCard
        className={open ? "w-1/2 max-w-90 shrink-0" : "hidden"}
        id="assistant-card-demo"
        aria-labelledby="assistant-card-demo-title"
        open={open}
        onOpenChange={setOpen}
      >
        {/* The chat draws its own header, thread and composer; the card is the frame. */}
        <div className="flex h-11 shrink-0 items-center gap-2 ps-4 pe-2">
          <h2
            id="assistant-card-demo-title"
            className="min-w-0 flex-1 truncate text-sm font-semibold"
          >
            William
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            <XIcon />
          </Button>
        </div>
        <div className="flex min-h-24 flex-1 flex-col overflow-y-auto px-4 py-2 text-sm text-muted-foreground">
          Ask about this task: what changed, who is waiting, what to do next.
        </div>
        <form
          className="m-2.5 flex shrink-0 items-end gap-2 rounded-bubble border border-border p-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <Textarea
            variant="ghost"
            aria-label="Message William"
            placeholder="Ask William…"
            className="min-h-0 flex-1 px-1.5 py-1"
          />
          <Button type="submit" size="icon-sm" aria-label="Send">
            <ArrowUpIcon />
          </Button>
        </form>
      </AssistantCard>
    </div>
  );
}

export function shellAssistant(): React.ReactNode {
  return (
    <Wrapper className="p-0">
      <Page />
    </Wrapper>
  );
}
