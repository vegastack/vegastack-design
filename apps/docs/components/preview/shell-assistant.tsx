"use client";

import * as React from "react";
import { ArrowUpIcon, CircleDotIcon, SquarePenIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/shell-assistant` (dogfoods the registry) → auto-scanned.
import {
  AssistantCard,
  AssistantCardBody,
  AssistantCardComposer,
  AssistantCardContext,
  AssistantCardHeader,
} from "@/components/ui/shell-assistant";
import { Button } from "@/components/ui/button";
import { ToolGroupItem } from "@/components/ui/tool-group";
import { Textarea } from "@/components/ui/textarea";

function Page({ withContext = true }: { withContext?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [about, setAbout] = React.useState(withContext);
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
            The card opens from the global bar&apos;s Ask or ⌘J and docks
            beside the page. Paragraph {i + 1}.
          </p>
        ))}
      </div>
      <AssistantCard
        className={open ? "w-90 shrink-0" : "hidden"}
        id="assistant-card-demo"
        open={open}
        onOpenChange={setOpen}
      >
        <AssistantCardHeader
          title="William"
          actions={
            <ToolGroupItem label="New chat" onClick={() => setAbout(false)}>
              <SquarePenIcon />
            </ToolGroupItem>
          }
          onClose={() => setOpen(false)}
          onOpenFull={() => setOpen(false)}
        />
        {about ? (
          <AssistantCardContext
            icon={<CircleDotIcon />}
            onRemove={() => setAbout(false)}
          >
            #3 Review Q3 pricing
          </AssistantCardContext>
        ) : null}
        <AssistantCardBody>
          <p className="text-muted-foreground">
            {about
              ? "Ask about this task: what changed, who is waiting, what to do next."
              : "Ask anything about your workspace."}
          </p>
        </AssistantCardBody>
        <AssistantCardComposer>
          <form
            className="flex items-end gap-2 rounded-bubble border border-border p-2"
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
        </AssistantCardComposer>
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

export function shellAssistantNoContext(): React.ReactNode {
  return (
    <Wrapper className="p-0">
      <Page withContext={false} />
    </Wrapper>
  );
}
