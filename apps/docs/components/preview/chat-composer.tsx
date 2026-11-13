"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AtSign,
  Clock,
  FolderOpen,
  SquareCheck,
  Upload,
  X,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-composer` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  ChatComposer,
  ChatComposerNotice,
  type ChatComposerHandle,
  type ComposerAttachment,
  type ComposerState,
  type ComposerSteer,
} from "@/components/ui/chat-composer";
import { ChatMenuItem, ChatMenuSeparator } from "@/components/ui/chat-menu";
import { ComposerMeta } from "@/components/ui/composer-meta";
import { ContextRing } from "@/components/ui/context-ring";
import {
  ModelEffortMenu,
  type EffortLevel,
} from "@/components/ui/model-effort-menu";
import {
  SplitChip,
  SplitChipButton,
  SplitChipSeparator,
  splitChipIconActionClassName,
} from "@/components/ui/record-chip";
import type { TextEditMentions } from "@/components/ui/text-edit";

const mentions: TextEditMentions = {
  kinds: [
    { id: "agent", noun: "Agent", plural: "Agents", order: 0 },
    { id: "user", noun: "Person", plural: "People", order: 1 },
  ],
  sections: ["people", "agents"],
  search: async (query) =>
    [
      { kind: "agent", id: "boq", label: "BOQ processor" },
      { kind: "agent", id: "assistant", label: "Assistant" },
      { kind: "user", id: "asha", label: "Asha Rao" },
    ].filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase()),
    ),
};

/** A small grey square as an image thumbnail, so the preview needs no network. */
const THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="gray"/><rect x="8" y="10" width="40" height="4" fill="silver"/><rect x="8" y="20" width="28" height="4" fill="silver"/></svg>',
  );

function ContextChip(): ReactNode {
  return (
    <SplitChip>
      <SplitChipButton>
        <SquareCheck aria-hidden />
        <span className="min-w-0 truncate">SR-12 Fix the IES upload</span>
      </SplitChipButton>
      <SplitChipSeparator />
      <button
        type="button"
        aria-label="Remove page from chat"
        className={splitChipIconActionClassName}
      >
        <X aria-hidden />
      </button>
    </SplitChip>
  );
}

function Column({ children }: { children: ReactNode }): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-xl">{children}</div>
    </Wrapper>
  );
}

const MODELS = [
  {
    id: "sonnet",
    label: "Sonnet 5.5",
    description: "Everyday work",
    available: true,
  },
  {
    id: "opus",
    label: "Opus 5.5",
    description: "Hard problems, longer thinking",
    available: true,
  },
  {
    id: "haiku",
    label: "Haiku 5.5",
    description: "Quick answers",
    available: true,
  },
];
const MORE = [
  { id: "gpt", label: "GPT-6", available: false },
  { id: "gemini", label: "Gemini 3 Pro", available: true },
];

/** The quiet line under the box, as a chat shows it. */
function Meta({
  plan,
  onPlan,
}: {
  plan: boolean;
  onPlan: () => void;
}): ReactNode {
  const [model, setModel] = useState("sonnet");
  const [effort, setEffort] = useState<EffortLevel>("high");
  return (
    <ComposerMeta
      privacy="Private · AI can make mistakes"
      privacyDetail="Only you can see this chat. AI can make mistakes; check important info."
      plan={{ on: plan, onToggle: onPlan, shortcut: "⇧Tab" }}
      model={
        <ModelEffortMenu
          models={MODELS}
          moreModels={MORE}
          modelId={model}
          onModel={setModel}
          efforts={["low", "medium", "high", "max"]}
          recommended={model === "sonnet" ? "high" : "medium"}
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
            { id: "memory", label: "Memory", tokens: 2_100 },
            { id: "conversation", label: "Conversation", tokens: 6_900 },
            { id: "tools", label: "Tool results", tokens: 1_200 },
          ]}
          onSummarize={() => {}}
        />
      }
    />
  );
}

function AddMenu({
  onUpload,
  onMention,
}: {
  onUpload: () => void;
  onMention: () => void;
}): ReactNode {
  return (
    <>
      <ChatMenuItem onSelect={onUpload}>
        <span className="inline-flex items-center gap-2">
          <Upload aria-hidden className="size-4 text-muted-foreground" />
          Upload files
        </span>
      </ChatMenuItem>
      <ChatMenuItem onSelect={() => {}}>
        <span className="inline-flex items-center gap-2">
          <FolderOpen aria-hidden className="size-4 text-muted-foreground" />
          From Library
        </span>
      </ChatMenuItem>
      <ChatMenuItem onSelect={() => {}}>
        <span className="inline-flex items-center gap-2">
          <Clock aria-hidden className="size-4 text-muted-foreground" />
          Recent outputs
        </span>
      </ChatMenuItem>
      <ChatMenuSeparator />
      <ChatMenuItem onSelect={onMention}>
        <span className="inline-flex items-center gap-2">
          <AtSign aria-hidden className="size-4 text-muted-foreground" />
          Mention a page or task
        </span>
      </ChatMenuItem>
    </>
  );
}

export function chatComposer(): ReactNode {
  function Demo(): ReactNode {
    const [state, setState] = useState<ComposerState>("idle");
    const [plan, setPlan] = useState(false);
    const [steers, setSteers] = useState<ComposerSteer[]>([]);
    const handle = useRef<ChatComposerHandle>(null);
    // The host moves sending → running after ~300ms; Stop winds down, then idle.
    useEffect(() => {
      if (state === "sending") {
        const t = setTimeout(() => setState("running"), 300);
        return () => clearTimeout(t);
      }
      if (state === "stopping") {
        const t = setTimeout(() => {
          setState("idle");
          setSteers([]);
        }, 1200);
        return () => clearTimeout(t);
      }
    }, [state]);
    return (
      <ChatComposer
        handleRef={handle}
        placeholder={
          state === "running"
            ? "Type to steer, or wait…"
            : "Ask William anything…"
        }
        state={state}
        queues
        mentions={mentions}
        steers={steers}
        onCancelSteer={(id) =>
          setSteers((all) => all.filter((steer) => steer.id !== id))
        }
        addMenu={
          <AddMenu
            onUpload={() => {}}
            onMention={() => handle.current?.openMentionMenu()}
          />
        }
        meta={<Meta plan={plan} onPlan={() => setPlan((on) => !on)} />}
        onSubmit={(text) => {
          if (state === "running") {
            setSteers((all) => [
              ...all,
              { id: String(Date.now()), text, state: "queued" },
            ]);
            return;
          }
          setState("sending");
        }}
        onStop={() => setState("stopping")}
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

const FILES: ComposerAttachment[] = [
  { id: "a", name: "site-photo.png", mediaType: "image/png", thumbUrl: THUMB },
  {
    id: "b",
    name: "panel-closeup.jpg",
    mediaType: "image/jpeg",
    thumbUrl: THUMB,
    progress: 0.6,
  },
  {
    id: "c",
    name: "q3-price-list-for-distributors-final.pdf",
    mediaType: "application/pdf",
  },
  { id: "d", name: "rows.csv", mediaType: "text/csv", progress: 0.42 },
  {
    id: "e",
    name: "drawing.dwg",
    mediaType: "application/acad",
    error: "Too large",
  },
];

export function chatComposerAttachments(): ReactNode {
  function Demo(): ReactNode {
    const [files, setFiles] = useState(FILES);
    return (
      <ChatComposer
        defaultValue="Compare these with last quarter"
        attachments={files}
        chips={<ContextChip />}
        onRemoveAttachment={(id) =>
          setFiles((all) => all.filter((file) => file.id !== id))
        }
        onRetryAttachment={() => {}}
        onAttach={() => {}}
        onSubmit={() => {}}
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function chatComposerRunning(): ReactNode {
  return (
    <Column>
      <ChatComposer
        placeholder="Type to steer, or wait…"
        state="running"
        queues
        steers={[
          { id: "1", text: "use the 2025 price list instead", state: "queued" },
        ]}
        onCancelSteer={() => {}}
        notice={
          <ChatComposerNotice
            tone="progress"
            action={
              <Button size="xs" variant="ghost">
                Reload
              </Button>
            }
          >
            Reconnecting — your agent kept working
          </ChatComposerNotice>
        }
        onAttach={() => {}}
        onSubmit={() => {}}
        onStop={() => {}}
      />
    </Column>
  );
}

export function chatComposerStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-4">
      {(["idle", "sending", "running", "stopping"] as const).map((state) => (
        <div key={state} className="w-full max-w-xl">
          <ChatComposer
            placeholder={`state="${state}"`}
            defaultValue={state === "idle" ? "Plan my day" : undefined}
            state={state}
            onAttach={() => {}}
            onSubmit={() => {}}
            onStop={() => {}}
            notice={
              state === "stopping" ? (
                <ChatComposerNotice tone="progress">
                  Stopping…
                </ChatComposerNotice>
              ) : undefined
            }
          />
        </div>
      ))}
    </Wrapper>
  );
}

export function chatComposerNotice(): ReactNode {
  function Demo(): ReactNode {
    const [shown, setShown] = useState(true);
    return (
      <ChatComposer
        placeholder="Ask a follow-up…"
        onAttach={() => {}}
        notice={
          shown ? (
            <ChatComposerNotice
              action={
                <Button size="xs" variant="ghost">
                  Details
                </Button>
              }
              onDismiss={() => setShown(false)}
            >
              You've used 90% of this month's agent budget.
            </ChatComposerNotice>
          ) : null
        }
        onSubmit={() => {}}
      />
    );
  }
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-6">
      <div className="w-full max-w-xl">
        <Demo />
      </div>
      <div className="w-full max-w-xl">
        <ChatComposer
          placeholder="Ask a follow-up…"
          onAttach={() => {}}
          notice={
            <ChatComposerNotice tone="warning">
              BOQ processor is paused. Your message sends when it's turned on.
            </ChatComposerNotice>
          }
        />
      </div>
    </Wrapper>
  );
}

export function chatComposerError(): ReactNode {
  return (
    <Column>
      <ChatComposer
        defaultValue="Plan my day"
        error="Couldn't send. Try again."
        onAttach={() => {}}
      />
    </Column>
  );
}

export function chatComposerDisabled(): ReactNode {
  return (
    <Column>
      <ChatComposer
        placeholder="BOQ processor is paused"
        disabled
        onAttach={() => {}}
      />
    </Column>
  );
}
