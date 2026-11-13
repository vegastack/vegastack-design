"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/composer-meta` (dogfoods the registry) → auto-scanned.
import { ComposerMeta } from "@/components/ui/composer-meta";
import { ContextRing } from "@/components/ui/context-ring";
import {
  ModelEffortMenu,
  type EffortLevel,
} from "@/components/ui/model-effort-menu";

function Column({ children }: { children: ReactNode }): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-xl">{children}</div>
    </Wrapper>
  );
}

export function composerMeta(): ReactNode {
  function Demo(): ReactNode {
    const [plan, setPlan] = useState(false);
    const [effort, setEffort] = useState<EffortLevel>("high");
    return (
      <ComposerMeta
        privacy="Private · AI can make mistakes"
        privacyDetail="Only you can see this chat. AI can make mistakes; check important info."
        plan={{
          on: plan,
          onToggle: () => setPlan((on) => !on),
          shortcut: "⇧Tab",
        }}
        model={
          <ModelEffortMenu
            models={[
              { id: "sonnet", label: "Sonnet 5.5", available: true },
              { id: "opus", label: "Opus 5.5", available: true },
            ]}
            modelId="sonnet"
            onModel={() => {}}
            efforts={["low", "medium", "high", "max"]}
            recommended="high"
            effort={effort}
            onEffort={setEffort}
          />
        }
        context={
          <ContextRing
            used={25_900}
            window={200_000}
            parts={[
              {
                id: "instructions",
                label: "Instructions and tools",
                tokens: 15_700,
              },
              { id: "conversation", label: "Conversation", tokens: 10_200 },
            ]}
          />
        }
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function composerMetaStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-3">
      <div className="w-full max-w-xl">
        <ComposerMeta
          privacy="Private · AI can make mistakes"
          plan={{ on: true, onToggle: () => {} }}
          model={
            <ModelEffortMenu
              models={[{ id: "opus", label: "Opus 5.5", available: true }]}
              modelId="opus"
              efforts={["low", "medium", "high", "max"]}
              recommended="medium"
              effort="high"
              onModel={() => {}}
            />
          }
        />
      </div>
      <div className="w-full max-w-xl">
        <ComposerMeta
          privacy="Shared with 3 people · AI can make mistakes"
          plan={{
            on: false,
            onToggle: () => {},
            disabledReason: "This agent can't plan first",
          }}
          model={
            <ModelEffortMenu
              models={[{ id: "haiku", label: "Haiku 5.5", available: true }]}
              modelId="haiku"
              efforts={["low", "medium", "high", "max"]}
              recommended="medium"
              readOnly="Set on the agent"
            />
          }
        />
      </div>
    </Wrapper>
  );
}
