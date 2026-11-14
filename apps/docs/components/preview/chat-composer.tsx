"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Asterisk,
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
  ChatComposerActions,
  ChatComposerActionsEnd,
  ChatComposerActionsStart,
  ChatComposerAddButton,
  ChatComposerAttachments,
  ChatComposerHeader,
  ChatComposerHeaderTrigger,
  ChatComposerInput,
  ChatComposerMentionButton,
  ChatComposerNotice,
  ChatComposerSubmit,
  type ChatComposerHandle,
  type ChatComposerProps,
  type ComposerAttachment,
  type ComposerState,
  type ComposerSteer,
} from "@/components/ui/chat-composer";
import {
  ChatMenu,
  ChatMenuItem,
  ChatMenuSeparator,
} from "@/components/ui/chat-menu";
import { ComposerChip } from "@/components/ui/composer-chip";
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

function Column({
  children,
  width = "max-w-xl",
}: {
  children: ReactNode;
  width?: string;
}): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={`w-full ${width}`}>{children}</div>
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

function Model(): ReactNode {
  const [model, setModel] = useState("haiku");
  const [effort, setEffort] = useState<EffortLevel>("medium");
  return (
    <ModelEffortMenu
      models={MODELS}
      moreModels={MORE}
      modelId={model}
      onModel={setModel}
      efforts={["low", "medium", "high", "max"]}
      recommended="medium"
      effort={effort}
      onEffort={setEffort}
    />
  );
}

function Ring(): ReactNode {
  return (
    <ContextRing
      used={25_900}
      window={200_000}
      parts={[
        { id: "instructions", label: "Instructions and tools", tokens: 15_700 },
        { id: "memory", label: "Memory", tokens: 2_100 },
        { id: "conversation", label: "Conversation", tokens: 6_900 },
        { id: "tools", label: "Tool results", tokens: 1_200 },
      ]}
      onSummarize={() => {}}
    />
  );
}

function AddMenu({ onMention }: { onMention: () => void }): ReactNode {
  return (
    <>
      <ChatMenuItem onSelect={() => {}}>
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

/** The context strip: who the message goes to, and Plan. */
function Header({
  plan,
  onPlan,
}: {
  plan?: boolean;
  onPlan?: (on: boolean) => void;
}): ReactNode {
  return (
    <ChatComposerHeader>
      <ChatMenu
        trigger={
          <ChatComposerHeaderTrigger
            media={<Asterisk className="text-primary" />}
            description="Chief of staff"
          >
            Talking to William
          </ChatComposerHeaderTrigger>
        }
      >
        <ChatMenuItem selected onSelect={() => {}}>
          William
        </ChatMenuItem>
        <ChatMenuItem onSelect={() => {}}>BOQ processor</ChatMenuItem>
      </ChatMenu>
      {onPlan ? (
        <ComposerChip
          pressed={plan}
          onPressedChange={onPlan}
          tooltip="Plan first, then wait for your go-ahead"
        >
          Plan
        </ComposerChip>
      ) : null}
    </ChatComposerHeader>
  );
}

/** One composer the way a chat lays it out; the examples vary its root props. */
function Composer({
  placeholder = "Ask William anything…",
  header = true,
  notice,
  chips,
  ring = false,
  ...props
}: Omit<ChatComposerProps, "children"> & {
  placeholder?: string;
  header?: boolean;
  notice?: ReactNode;
  chips?: ReactNode;
  ring?: boolean;
}): ReactNode {
  return (
    <ChatComposer onSubmit={() => {}} onStop={() => {}} {...props}>
      {notice}
      {header ? <Header plan={false} onPlan={() => {}} /> : null}
      <ChatComposerAttachments>{chips}</ChatComposerAttachments>
      <ChatComposerInput placeholder={placeholder} mentions={mentions} />
      <ChatComposerActions>
        <ChatComposerActionsStart>
          <ChatComposerAddButton onClick={() => {}} />
          <ChatComposerMentionButton />
        </ChatComposerActionsStart>
        <ChatComposerActionsEnd>
          {ring ? <Ring /> : null}
          <Model />
          <ChatComposerSubmit />
        </ChatComposerActionsEnd>
      </ChatComposerActions>
    </ChatComposer>
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
        state={state}
        queues
        steers={steers}
        onCancelSteer={(id) =>
          setSteers((all) => all.filter((steer) => steer.id !== id))
        }
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
      >
        {state === "stopping" ? (
          <ChatComposerNotice tone="progress">Stopping…</ChatComposerNotice>
        ) : null}
        <Header plan={plan} onPlan={setPlan} />
        <ChatComposerAttachments />
        <ChatComposerInput
          placeholder={
            state === "running"
              ? "Type to steer, or wait…"
              : plan
                ? "Describe the job. It plans first."
                : "Ask William anything…"
          }
          mentions={mentions}
        />
        <ChatComposerActions>
          <ChatComposerActionsStart>
            <ChatComposerAddButton
              menu={
                <AddMenu onMention={() => handle.current?.openMentionMenu()} />
              }
            />
            <ChatComposerMentionButton />
          </ChatComposerActionsStart>
          <ChatComposerActionsEnd>
            <Ring />
            <Model />
            <ChatComposerSubmit />
          </ChatComposerActionsEnd>
        </ChatComposerActions>
      </ChatComposer>
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function chatComposerQuickAsk(): ReactNode {
  return (
    <Column width="max-w-md">
      <Composer header={false} placeholder="Ask anything…" autoFocus={false} />
    </Column>
  );
}

export function chatComposerStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-4">
      {(["idle", "sending", "running", "stopping"] as const).map((state) => (
        <div key={state} className="w-full max-w-xl">
          <Composer
            header={false}
            placeholder={`state="${state}"`}
            defaultValue={state === "idle" ? "Plan my day" : undefined}
            state={state}
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
      <Composer
        defaultValue="Compare these with last quarter"
        attachments={files}
        chips={<ContextChip />}
        onRemoveAttachment={(id) =>
          setFiles((all) => all.filter((file) => file.id !== id))
        }
        onRetryAttachment={() => {}}
        onFiles={(added) =>
          setFiles((all) => [
            ...all,
            ...added.map((file) => ({
              id: `${file.name}-${Date.now()}`,
              name: file.name,
              mediaType: file.type || "application/octet-stream",
            })),
          ])
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

export function chatComposerRunning(): ReactNode {
  return (
    <Column>
      <Composer
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
      />
    </Column>
  );
}

export function chatComposerNotice(): ReactNode {
  function Demo(): ReactNode {
    const [shown, setShown] = useState(true);
    return (
      <Composer
        header={false}
        placeholder="Ask a follow-up…"
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
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function chatComposerOffline(): ReactNode {
  return (
    <Column>
      <Composer
        defaultValue="Draft the site visit summary"
        submitDisabled
        notice={
          <ChatComposerNotice tone="warning" live>
            You're offline. What you write stays here and sends once you're
            back.
          </ChatComposerNotice>
        }
      />
    </Column>
  );
}

export function chatComposerError(): ReactNode {
  return (
    <Column>
      <Composer defaultValue="Plan my day" error="Couldn't send. Try again." />
    </Column>
  );
}

export function chatComposerDisabled(): ReactNode {
  return (
    <Column>
      <Composer placeholder="William is paused" disabled />
    </Column>
  );
}

const LONG =
  "Here is the full brief for the site visit on Thursday.\n\n" +
  Array.from(
    { length: 14 },
    (_, i) =>
      `${i + 1}. Check the panel schedule against drawing E-${200 + i} and note any differences.`,
  ).join("\n");

export function chatComposerLongText(): ReactNode {
  return (
    <Column>
      <Composer defaultValue={LONG} ring />
    </Column>
  );
}

export function chatComposerNarrow(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-80">
        <Composer
          defaultValue="Summarise yesterday's site reports"
          attachments={FILES.slice(0, 3)}
        />
      </div>
    </Wrapper>
  );
}

export function chatComposerRtl(): ReactNode {
  return (
    <Column>
      <div dir="rtl">
        <Composer
          placeholder="اسأل ويليام أي شيء…"
          attachments={FILES.slice(2, 4)}
        />
      </div>
    </Column>
  );
}
