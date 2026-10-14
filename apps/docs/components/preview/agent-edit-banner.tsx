"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/agent-edit-banner` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  AgentEditBanner,
  type AgentEditBannerStatus,
} from "@/components/ui/agent-edit-banner";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const MINUTE = 60_000;

const claude = { name: "Claude", via: "Manoj" };

const run = {
  agent: claude,
  changeCount: 3,
  at: NOW - 2 * MINUTE,
  now: NOW,
};

export function agentEditBanner(): ReactNode {
  // The strip under a page's header after an agent edited it. Undo spins, then the host hides it.
  const [status, setStatus] = useState<AgentEditBannerStatus>("idle");
  const [shown, setShown] = useState(true);
  return (
    <Wrapper className="min-h-24 flex-col items-stretch">
      {shown ? (
        <AgentEditBanner
          {...run}
          status={status}
          onViewChanges={() => {}}
          onUndo={() => {
            setStatus("undoing");
            setTimeout(() => {
              setShown(false);
              setStatus("idle");
            }, 900);
          }}
          onDismiss={() => setShown(false)}
        />
      ) : (
        <Button variant="link" onClick={() => setShown(true)}>
          Show the banner again
        </Button>
      )}
    </Wrapper>
  );
}

export function agentEditBannerStates(): ReactNode {
  // Undoing, refused, too old (no Undo or View changes), a read-only viewer (no ✕ either), created.
  return (
    <Wrapper className="flex-col items-stretch">
      <AgentEditBanner
        {...run}
        status="undoing"
        onViewChanges={() => {}}
        onUndo={() => {}}
        onDismiss={() => {}}
      />
      <AgentEditBanner
        {...run}
        status="refused"
        onViewChanges={() => {}}
        onUndo={() => {}}
        onOpenVersions={() => {}}
        onDismiss={() => {}}
      />
      <AgentEditBanner {...run} onDismiss={() => {}} />
      <AgentEditBanner {...run} />
      <AgentEditBanner
        agent={claude}
        kind="created"
        at={NOW - 5 * MINUTE}
        now={NOW}
        onDismiss={() => {}}
      />
    </Wrapper>
  );
}

export function agentEditBannerStacked(): ReactNode {
  // Two banners at most; the second ends with "+N more agents", each listed with its own Undo.
  return (
    <Wrapper className="flex-col items-stretch">
      <AgentEditBanner
        {...run}
        onViewChanges={() => {}}
        onUndo={() => {}}
        onDismiss={() => {}}
      />
      <AgentEditBanner
        agent={{ name: "Codex", via: "Priya" }}
        changeCount={1}
        at={NOW - 12 * MINUTE}
        now={NOW}
        onViewChanges={() => {}}
        onUndo={() => {}}
        onDismiss={() => {}}
        moreAgents={[
          {
            id: "asha",
            agent: { name: "Claude", via: "Asha" },
            changeCount: 2,
            at: NOW - 40 * MINUTE,
            onUndo: () => {},
          },
        ]}
      />
    </Wrapper>
  );
}

export function agentEditBannerNarrow(): ReactNode {
  // On a phone the text wraps beside the ✕ and the buttons take their own row.
  return (
    <Wrapper className="flex-col items-stretch">
      <AgentEditBanner
        {...run}
        className="max-w-sm"
        onViewChanges={() => {}}
        onUndo={() => {}}
        onDismiss={() => {}}
      />
    </Wrapper>
  );
}
