import Link from "next/link";
import { ArrowRight, Database, FileText, ShieldCheck } from "lucide-react";
import { Icon } from "@vegastack/design/icons";
import { Avatar } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { StatusIcon } from "@/components/ui/status-icon";
import { ToolCallChip } from "@/components/ui/tool-call-chip";
import {
  TraceInputLayers,
  TraceTabs,
} from "@/components/home-system-trace-tabs";

/**
 * The home "system trace" — one component followed from token roles through owned behaviour
 * into a product pattern. Server-rendered (DC-13): the only client leaves are the system `Tabs`
 * and the Input trace's shared project-name state, both in `home-system-trace-tabs.tsx`.
 */
type Trace = "button" | "input" | "message";

const TRACE_ORDER = ["button", "input", "message"] as const;

const TRACE_DATA = {
  button: {
    label: "Button",
    docs: "/docs/components/button",
    description:
      "A semantic action moves from token roles into component state and a release workflow.",
    tokens: [
      ["--primary", "action ink"],
      ["--primary-foreground", "on-action text"],
      ["--radius-md", "8px"],
      ["--duration-fast", "150ms"],
    ],
  },
  input: {
    label: "Input",
    docs: "/docs/components/input",
    description:
      "Field structure, input surfaces, and focus roles stay connected inside a named form pattern.",
    tokens: [
      ["--input", "field surface"],
      ["--ring", "focus border"],
      ["--foreground", "entered text"],
      ["--muted-foreground", "supporting text"],
    ],
  },
  message: {
    label: "Message",
    docs: "/docs/components/message",
    description:
      "Conversation primitives combine semantic surfaces with agent-specific interaction metadata.",
    tokens: [
      ["--card", "message surface"],
      ["--muted", "received bubble"],
      ["--border", "separation"],
      ["--motion-ease-standard", "entry motion"],
    ],
  },
} as const;

function LayerHeader({
  index,
  title,
  meta,
}: {
  index: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-4">
      <div>
        <p className="font-mono text-mono-label text-muted-foreground">
          {index}
        </p>
        <h3 className="mt-2 text-h3 text-foreground">{title}</h3>
      </div>
      {meta ? (
        <span className="font-mono text-mono-label text-muted-foreground">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

function LayerCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

const COMPONENT_CAPTION =
  "Variants, state, keyboard semantics, and responsive behavior stay in one owned source.";
const PATTERN_CAPTION =
  "The composition remains recognizable because it inherits the same contract rather than restyling locally.";

function FoundationLayer({ trace }: { trace: Trace }) {
  const data = TRACE_DATA[trace];
  return (
    <div className="flex h-full min-w-0 flex-col gap-5 p-5">
      <LayerHeader index="01 / Foundation" title="Semantic roles" meta="DTCG" />
      <div className="flex flex-col">
        {data.tokens.map(([token, value]) => (
          <div
            key={token}
            className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0"
          >
            <code className="min-w-0 truncate text-code text-foreground">
              {token}
            </code>
            <span className="shrink-0 font-mono text-mono-label text-muted-foreground">
              {value}
            </span>
          </div>
        ))}
      </div>
      <LayerCaption>
        Light and dark resolve independently while the semantic name stays
        stable.
      </LayerCaption>
    </div>
  );
}

function StaticLayer({
  index,
  title,
  caption,
  children,
}: {
  index: string;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col gap-5 p-5">
      <LayerHeader index={index} title={title} />
      <div className="flex min-h-44 flex-1 items-center justify-center rounded-lg border border-border bg-background p-5">
        {children}
      </div>
      <LayerCaption>{caption}</LayerCaption>
    </div>
  );
}

function ComponentAndPatternLayers({ trace }: { trace: Trace }) {
  if (trace === "input") {
    return (
      <TraceInputLayers
        componentHeader={
          <LayerHeader index="02 / Component" title="Owned behavior" />
        }
        patternHeader={
          <LayerHeader index="03 / Pattern" title="Product context" />
        }
        componentCaption={<LayerCaption>{COMPONENT_CAPTION}</LayerCaption>}
        patternCaption={<LayerCaption>{PATTERN_CAPTION}</LayerCaption>}
      />
    );
  }
  return (
    <>
      <StaticLayer
        index="02 / Component"
        title="Owned behavior"
        caption={COMPONENT_CAPTION}
      >
        {trace === "button" ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button>Deploy</Button>
            <Button variant="outline" loading>
              Verifying
            </Button>
            <Button disabled>Unavailable</Button>
          </div>
        ) : (
          <ToolCallChip label="Registry searched" meta="6 matches">
            <Icon as={Database} size="xs" />
          </ToolCallChip>
        )}
      </StaticLayer>
      <StaticLayer
        index="03 / Pattern"
        title="Product context"
        caption={PATTERN_CAPTION}
      >
        {trace === "button" ? (
          <div className="w-full max-w-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-label text-foreground">Release v0.2</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  All required checks are complete.
                </p>
              </div>
              <StatusIcon status="done" label="Ready to deploy" />
            </div>
            <Button className="mt-5 w-full">Deploy release</Button>
          </div>
        ) : (
          <MessageGroup className="w-full max-w-sm">
            <Message>
              <MessageAvatar>
                <Avatar size="sm" fallback="AI" />
              </MessageAvatar>
              <MessageContent>
                <MessageHeader>Design agent</MessageHeader>
                <Bubble variant="muted">
                  <BubbleContent>
                    Use Message for the conversation row and Bubble for its
                    speech surface.
                  </BubbleContent>
                </Bubble>
                <ToolCallChip label="Contract verified" meta="message@0.2.0">
                  <Icon as={ShieldCheck} size="xs" />
                </ToolCallChip>
              </MessageContent>
            </Message>
          </MessageGroup>
        )}
      </StaticLayer>
    </>
  );
}

function TracePanel({ trace }: { trace: Trace }) {
  const data = TRACE_DATA[trace];
  return (
    <div>
      <p className="border-b border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
        {data.description}
      </p>

      <div className="grid lg:grid-cols-3 lg:divide-x lg:divide-border">
        <FoundationLayer trace={trace} />
        <ComponentAndPatternLayers trace={trace} />
      </div>

      <div className="grid border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
        <div className="flex items-center gap-3 px-5 py-4 text-sm text-muted-foreground">
          <Icon as={FileText} size="sm" />
          <span>Canonical source and docs stay paired.</span>
        </div>
        <div className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:border-t-0">
          <Icon as={ShieldCheck} size="sm" />
          <span>Behavior and accessibility are contract fields.</span>
        </div>
        <Link
          href={data.docs}
          className="group flex items-center justify-between gap-3 border-t border-border px-5 py-4 text-label text-foreground hover:bg-muted/(--alpha-wash-faint) active:bg-muted/(--alpha-wash-strong) sm:border-t-0"
        >
          Open {data.label} documentation
          <Icon
            as={ArrowRight}
            size="sm"
            className="text-muted-foreground group-hover:text-foreground"
          />
        </Link>
      </div>
    </div>
  );
}

export function HomeSystemTrace() {
  return (
    <div className="vs-type-product overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5">
        <div className="min-w-0">
          <p className="text-label text-foreground">Trace a real component</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Select a component to update its semantic foundation, owned
            behavior, and product pattern together.
          </p>
        </div>
      </div>
      <TraceTabs
        items={TRACE_ORDER.map((trace) => ({
          value: trace,
          label: TRACE_DATA[trace].label,
          panel: <TracePanel trace={trace} />,
        }))}
      />
    </div>
  );
}
