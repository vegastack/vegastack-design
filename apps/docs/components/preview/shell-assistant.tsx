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
  AssistantPill,
} from "@/components/ui/shell-assistant";
import { Button } from "@/components/ui/button";
import { ToolGroupItem } from "@/components/ui/tool-group";
import { Textarea } from "@/components/ui/textarea";

function Page({ withContext = true }: { withContext?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [about, setAbout] = React.useState(withContext);
  const scroller = React.useRef<HTMLDivElement>(null);
  return (
    <div className="relative h-150 w-full overflow-hidden rounded-block border border-border bg-background">
      <div
        ref={scroller}
        className="h-full overflow-y-auto p-6 text-sm text-muted-foreground"
      >
        <p className="mb-4 text-base font-semibold text-foreground">
          #3 Review Q3 pricing
        </p>
        {Array.from({ length: 24 }, (_, i) => (
          <p key={i} className="mb-3">
            Scroll down and the pill tucks away; scroll up, or hover its corner,
            and it comes back. Paragraph {i + 1}.
          </p>
        ))}
      </div>
      <AssistantPill
        name="William"
        expanded={open}
        aria-controls="assistant-card-demo"
        aria-keyshortcuts="Meta+J"
        scrollTarget={scroller}
        onClick={() => setOpen(true)}
      />
      <AssistantCard
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
          onMoveToPanel={() => setOpen(false)}
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
