"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Database, FileText, ShieldCheck } from "lucide-react";
import { Icon } from "@vegastack/design/icons";
import { Avatar } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { StatusIcon } from "@/components/ui/status-icon";
import { ToolCallChip } from "@/components/ui/tool-call-chip";

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

function FoundationLayer({ trace }: { trace: Trace }) {
  const data = TRACE_DATA[trace];
  return (
    <div className="flex h-full min-w-0 flex-col gap-5 p-5">
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-mono text-mono-label text-muted-foreground">
            01 / Foundation
          </p>
          <h3 className="mt-2 text-h3 text-foreground">Semantic roles</h3>
        </div>
        <span className="font-mono text-mono-label text-muted-foreground">
          DTCG
        </span>
      </div>
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
      <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
        Light and dark resolve independently while the semantic name stays
        stable.
      </p>
    </div>
  );
}

function ComponentLayer({
  trace,
  projectName,
  onProjectNameChange,
}: {
  trace: Trace;
  projectName: string;
  onProjectNameChange: (value: string) => void;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col gap-5 p-5">
      <div className="border-b border-border pb-4">
        <p className="font-mono text-mono-label text-muted-foreground">
          02 / Component
        </p>
        <h3 className="mt-2 text-h3 text-foreground">Owned behavior</h3>
      </div>
      <div className="flex min-h-44 flex-1 items-center justify-center rounded-lg border border-border bg-background p-5">
        {trace === "button" ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button>Deploy</Button>
            <Button variant="outline" loading>
              Verifying
            </Button>
            <Button disabled>Unavailable</Button>
          </div>
        ) : null}
        {trace === "input" ? (
          <Field
            label="Project name"
            description="The composed pattern updates while you type."
          >
            <Input
              name="trace-project-name"
              autoComplete="off"
              value={projectName}
              onValueChange={onProjectNameChange}
              placeholder="VegaStack Design…"
            />
          </Field>
        ) : null}
        {trace === "message" ? (
          <ToolCallChip label="Registry searched" meta="6 matches">
            <Icon as={Database} size="xs" />
          </ToolCallChip>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Variants, state, keyboard semantics, and responsive behavior stay in one
        owned source.
      </p>
    </div>
  );
}

function PatternLayer({
  trace,
  projectName,
}: {
  trace: Trace;
  projectName: string;
}) {
  const normalizedName = projectName.trim() || "Untitled project";
  const slug = normalizedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <div className="flex h-full min-w-0 flex-col gap-5 p-5">
      <div className="border-b border-border pb-4">
        <p className="font-mono text-mono-label text-muted-foreground">
          03 / Pattern
        </p>
        <h3 className="mt-2 text-h3 text-foreground">Product context</h3>
      </div>
      <div className="flex min-h-44 flex-1 items-center justify-center rounded-lg border border-border bg-background p-5">
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
        ) : null}
        {trace === "input" ? (
          <div className="w-full max-w-sm">
            <p className="text-label text-foreground">Project identity</p>
            <p className="mt-1 truncate text-h3 text-foreground">
              {normalizedName}
            </p>
            <p className="mt-1 truncate font-mono text-sm text-muted-foreground">
              /projects/{slug || "untitled-project"}
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <StatusIcon status="done" size="sm" label="Valid project name" />
              <span>Ready to create</span>
            </div>
          </div>
        ) : null}
        {trace === "message" ? (
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
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        The composition remains recognizable because it inherits the same
        contract rather than restyling locally.
      </p>
    </div>
  );
}

function TracePanel({
  trace,
  projectName,
  onProjectNameChange,
}: {
  trace: Trace;
  projectName: string;
  onProjectNameChange: (value: string) => void;
}) {
  const data = TRACE_DATA[trace];

  return (
    <div className="motion-enter-up">
      <p className="border-b border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
        {data.description}
      </p>

      <div className="grid lg:grid-cols-3 lg:divide-x lg:divide-border">
        <FoundationLayer trace={trace} />
        <ComponentLayer
          trace={trace}
          projectName={projectName}
          onProjectNameChange={onProjectNameChange}
        />
        <PatternLayer trace={trace} projectName={projectName} />
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
          className="group flex items-center justify-between gap-3 border-t border-border px-5 py-4 text-label text-foreground hover:bg-muted/(--alpha-wash-faint) sm:border-t-0"
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
  const [trace, setTrace] = React.useState<Trace>("button");
  const [projectName, setProjectName] = React.useState("VegaStack Design");

  const handleTabKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const currentIndex = TRACE_ORDER.indexOf(trace);
      let nextIndex = currentIndex;

      if (event.key === "ArrowLeft") {
        nextIndex =
          (currentIndex - 1 + TRACE_ORDER.length) % TRACE_ORDER.length;
      } else if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % TRACE_ORDER.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = TRACE_ORDER.length - 1;
      }

      const nextTrace = TRACE_ORDER[nextIndex];
      setTrace(nextTrace);
      requestAnimationFrame(() => {
        document.getElementById(`trace-tab-${nextTrace}`)?.focus();
      });
    },
    [trace],
  );

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

      <div className="border-b border-border p-3">
        <div
          role="tablist"
          aria-orientation="horizontal"
          aria-label="Choose a component to trace through the system"
          className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
          onKeyDown={handleTabKeyDown}
        >
          {TRACE_ORDER.map((value) => {
            const active = trace === value;
            return (
              <Button
                key={value}
                id={`trace-tab-${value}`}
                role="tab"
                aria-controls="trace-panel"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                data-active={active ? "" : undefined}
                variant="ghost"
                size="sm"
                className="w-full data-[active]:bg-foreground data-[active]:text-background data-[active]:hover:bg-foreground data-[active]:hover:text-background"
                onClick={() => setTrace(value)}
              >
                {TRACE_DATA[value].label}
              </Button>
            );
          })}
        </div>
      </div>

      <div
        id="trace-panel"
        role="tabpanel"
        aria-labelledby={`trace-tab-${trace}`}
        tabIndex={0}
      >
        <TracePanel
          key={trace}
          trace={trace}
          projectName={projectName}
          onProjectNameChange={setProjectName}
        />
      </div>
    </div>
  );
}
