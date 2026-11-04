// @vegastack delegate-popover@0.33.0 sha256-TE1p69ChIgFkkuF9XWUQ6eSyyybllYf4pKkdfjJxwac=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { Bot, ChevronRight } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  PeoplePickerContent,
  type PeoplePickerOption,
} from "@/components/ui/people-picker";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { AvatarHue } from "@/components/ui/avatar";
import type { PersonMark } from "@/components/ui/person-avatar";

/* ------------------------------------------------------------------------------------------------
 * DelegatePopover — hand a record (or a selection of rows) to an agent: pick one of the viewer's
 * agents (an agent that can't take it is listed, disabled, with its reason), say what to do, and
 * — for a task — what happens when it finishes. One popover for every surface that delegates: the
 * Delegate property, a peek's pill, the `D` key, a bulk bar. With no agents connected it says how
 * to connect one. Presentational: the host passes the agents and receives the choice.
 * ----------------------------------------------------------------------------------------------*/

/** An agent offered by `DelegatePopover`. */
export interface DelegatePopoverAgent {
  /** A stable id. */
  id: string;
  /** The agent's name: "Claude Code". */
  name: string;
  /** Its image, under the purple bot. @default undefined */
  image?: string | null;
  /** Its mark inside the hexagon (a provider's logo, or a glyph on its `hue`). @default undefined */
  mark?: PersonMark;
  /** Its colour behind the bot or a glyph mark. @default undefined */
  hue?: AvatarHue | null;
  /** The member it acts for, when the list mixes owners. @default undefined */
  for?: string | null;
  /** What it may do, as its second line: "Read & write · Tasks". @default undefined */
  access?: string | null;
  /**
   * Why it can't take this ("Can't — read only"): listed, disabled, with the reason as its
   * second line.
   * @default undefined
   */
  disabledReason?: string | null;
  /**
   * A caution that does not stop the pick ("Can't see this space yet"): its second line, in the
   * warning ink. Pair it with `renderPicked` to offer the way out when it is picked.
   * @default undefined
   */
  hint?: string | null;
}

/** What `renderPicked` can do with the popover. */
export interface DelegatePopoverPickedContext {
  /** Close the popover (after the step's action has run). */
  close: () => void;
  /** Un-pick the agent, back to the list and the form, which keeps what was typed. */
  clear: () => void;
}

/** One "When finished" choice: "Move to review", "Mark done". */
export interface DelegatePopoverOption {
  /** The value passed back. */
  value: string;
  /** The text shown. */
  label: string;
}

/** What `onDelegate` receives. */
export interface DelegatePopoverValue {
  /** The chosen agent's id. */
  agentId: string;
  /** The instructions, trimmed; `""` when none. */
  instructions: string;
  /** The "When finished" choice, when the popover offers one. */
  whenFinished?: string;
}

/** Every string `DelegatePopover` renders or names a control with. */
export interface DelegatePopoverLabels {
  /** The search field's placeholder and name. */
  search: string;
  /** No agent matches the search. */
  noMatch: string;
  /** The heading over the agents. */
  agents: string;
  /** The instructions field's label. */
  instructions: string;
  /** The instructions field's placeholder. */
  instructionsPlaceholder: string;
  /** The "When finished" label. */
  whenFinished: string;
  /** The connect link (and the empty state's button). */
  connect: string;
  /** The primary button. */
  delegate: string;
  /** The empty state's line. */
  empty: string;
}

const DEFAULT_LABELS: DelegatePopoverLabels = {
  search: "Search agents",
  noMatch: "No agents found",
  agents: "Agents you can use",
  instructions: "Instructions (optional)",
  instructionsPlaceholder: "Say what to do…",
  whenFinished: "When finished",
  connect: "Connect an app",
  delegate: "Delegate",
  empty: "Connect Claude, Codex or any MCP app to delegate work.",
};

/** Props for `DelegatePopover`. */
export interface DelegatePopoverProps {
  /**
   * The trigger: an `AgentSlot`, an `AgentChip`, a bulk bar's button — any element that takes a
   * ref and an `onClick`. The `D` key opens it through `open` with the trigger as its anchor.
   */
  children: React.ReactElement;
  /** The viewer's agents, in order. `[]` shows the connect empty state. */
  agents: readonly DelegatePopoverAgent[];
  /** The agents are loading: skeleton rows in the list. @default false */
  loading?: boolean;
  /** Delegate with the chosen agent, instructions and finish rule. A returned promise keeps the popover open (and the button busy) until it settles. */
  onDelegate: (value: DelegatePopoverValue) => void | Promise<void>;
  /** The title. Bulk: "Delegate 40 rows to…". @default "Delegate to an agent" */
  title?: React.ReactNode;
  /** The agent chosen when it opens (Change agent: the current one). @default the only agent that can take it, if there is one */
  defaultAgentId?: string | null;
  /** The instructions it opens with. @default "" */
  defaultInstructions?: string;
  /** The instructions' maximum length. @default 2000 */
  instructionsMaxLength?: number;
  /** "When finished" choices — tasks only; leave out for rows and bulk. @default undefined */
  whenFinishedOptions?: readonly DelegatePopoverOption[];
  /** The "When finished" choice it opens with. @default the first option */
  defaultWhenFinished?: string;
  /**
   * Open the place to connect an agent; the link (and the empty state's button) show when this or
   * `connectHref` is set (with `connectHref`, it runs on the link's click). @default undefined
   */
  onConnect?: () => void;
  /** The page to connect an agent: the connect link and the empty state's button go there. @default undefined */
  connectHref?: string;
  /**
   * The element the connect link renders — a router link such as `<Link href="" />`;
   * `connectHref` wins over the template's.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * A step in place of the instructions once an agent is picked — return it for an agent that
   * needs one before it can start (it can't see the record yet: "Give access" or "Ask the space
   * owner", with Cancel), or `null` for the usual form. The host's buttons call `close` or `clear`.
   * @default undefined
   */
  renderPicked?: (
    agent: DelegatePopoverAgent,
    context: DelegatePopoverPickedContext,
  ) => React.ReactNode;
  /** Open state (controlled). @default undefined */
  open?: boolean;
  /** Called when it opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** Where it aligns against the trigger. @default "start" */
  align?: "start" | "center" | "end";
  /** Replace any of the strings (`DelegatePopoverLabels`). @default undefined */
  labels?: Partial<DelegatePopoverLabels>;
  /** Classes for the popover. @default undefined */
  className?: string;
}

/** The agent as a picker option: its hexagon, its access (or its hint) as the second line. */
function toOption(agent: DelegatePopoverAgent): PeoplePickerOption {
  return {
    id: agent.id,
    name: agent.name,
    image: agent.image,
    mark: agent.mark,
    hue: agent.hue,
    for: agent.for,
    kind: "agent",
    description: agent.access ?? null,
    disabledReason: agent.disabledReason ?? null,
    hint: agent.hint ?? null,
  };
}

function initialAgent(
  agents: readonly DelegatePopoverAgent[],
  defaultAgentId: string | null | undefined,
): string | null {
  if (defaultAgentId !== undefined) return defaultAgentId;
  // An agent with a hint needs someone's choice first, so it is never picked for them.
  const open = agents.filter((a) => !a.disabledReason && !a.hint);
  return open.length === 1 ? open[0]!.id : null;
}

/**
 * `DelegatePopover` — "Delegate to an agent": search the viewer's agents (arrow keys move, Enter
 * picks; one that can't take it is disabled with its reason), optional instructions, a "When
 * finished" choice for tasks, "Connect an app ›" and Delegate. With no agents it shows "Connect
 * Claude, Codex or any MCP app to delegate work." and the connect button. Cmd/Ctrl+Enter in the
 * instructions delegates. The host shows the toast ("Delegated to Claude Code · Undo").
 *
 * @example
 * <DelegatePopover
 *   agents={agents}
 *   whenFinishedOptions={[{ value: "review", label: "Move to review" }, { value: "done", label: "Mark done" }]}
 *   connectHref="/agents/connect"
 *   onDelegate={({ agentId, instructions, whenFinished }) => delegate(task.id, agentId, instructions, whenFinished)}
 * >
 *   <AgentSlot />
 * </DelegatePopover>
 *
 * @example
 * <DelegatePopover title={`Delegate ${n} rows to…`} agents={agents} onDelegate={delegateRows}>
 *   <Button size="sm" variant="outline">Delegate…</Button>
 * </DelegatePopover>
 */
export function DelegatePopover({
  children,
  agents,
  loading = false,
  onDelegate,
  title = "Delegate to an agent",
  defaultAgentId,
  defaultInstructions = "",
  instructionsMaxLength = 2000,
  whenFinishedOptions,
  defaultWhenFinished,
  onConnect,
  connectHref,
  linkRender,
  renderPicked,
  open: openProp,
  onOpenChange,
  align = "start",
  labels: labelsProp,
  className,
}: DelegatePopoverProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  const [agentId, setAgentId] = React.useState<string | null>(() =>
    initialAgent(agents, defaultAgentId),
  );
  // Un-picked by hand this opening: the one-agent default stands down until the next.
  const [cleared, setCleared] = React.useState(false);
  const [instructions, setInstructions] = React.useState(defaultInstructions);
  const [whenFinished, setWhenFinished] = React.useState<string | undefined>(
    defaultWhenFinished ?? whenFinishedOptions?.[0]?.value,
  );
  // A delegation in flight survives closing and reopening: it is never sent twice.
  const [pending, setPending] = React.useState(false);
  const pendingRef = React.useRef(false);
  // Each opening is a session; a request only closes the session it was sent from.
  const [session, setSession] = React.useState(0);
  const sessionRef = React.useRef(0);
  sessionRef.current = session;

  // Every opening starts from the defaults: a closed popover keeps nothing typed.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSession((n) => n + 1);
      setAgentId(initialAgent(agents, defaultAgentId));
      setCleared(false);
      setInstructions(defaultInstructions);
      setWhenFinished(defaultWhenFinished ?? whenFinishedOptions?.[0]?.value);
    }
  }
  // Agents that arrive after opening (they were loading) still get the one-agent default.
  if (agentId === null && defaultAgentId === undefined && !cleared) {
    const only = initialAgent(agents, undefined);
    if (only !== null) setAgentId(only);
  }

  const chosen = agents.find((a) => a.id === agentId && !a.disabledReason);
  // A picked agent that went away or can no longer take it is un-picked, never left as a dead form.
  if (agentId !== null && !chosen && !loading && agents.length > 0)
    setAgentId(null);
  const instructionsId = React.useId();
  const finishId = React.useId();

  const submit = async () => {
    if (!chosen || pendingRef.current) return;
    const value: DelegatePopoverValue = {
      agentId: chosen.id,
      instructions: instructions.trim(),
      ...(whenFinishedOptions?.length ? { whenFinished } : {}),
    };
    const result = onDelegate(value);
    if (result && typeof (result as Promise<void>).then === "function") {
      const sentFrom = sessionRef.current;
      pendingRef.current = true;
      setPending(true);
      try {
        await result;
        if (sessionRef.current === sentFrom) setOpen(false);
      } catch {
        // Stay open with the choice: the host reports the failure.
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    } else {
      setOpen(false);
    }
  };

  const options = React.useMemo(() => agents.map(toOption), [agents]);
  const empty = !loading && agents.length === 0;
  const canConnect = Boolean(onConnect || connectHref);
  const connect = (event: React.MouseEvent) => {
    // A link opened in a new tab leaves this one as it was, with what was typed.
    if (connectHref && (event.metaKey || event.ctrlKey || event.shiftKey))
      return;
    setOpen(false);
    onConnect?.();
  };
  // A link when the host gives the page, so it opens like one (a new tab, a copied address).
  const connectControl = (
    variant: "default" | "link",
    size: "sm" | "xs",
    className?: string,
    trailing?: React.ReactNode,
  ) =>
    connectHref ? (
      React.cloneElement(
        linkRender ?? <a />,
        mergeProps((linkRender?.props ?? {}) as object, {
          href: connectHref,
          "data-slot": "delegate-popover-connect",
          className: buttonVariants({ variant, size, className }),
          onClick: connect,
          children: (
            <>
              {labels.connect}
              {trailing}
            </>
          ),
        }) as object,
      )
    ) : (
      <Button
        variant={variant}
        size={size}
        data-slot="delegate-popover-connect"
        className={className}
        onClick={connect}
      >
        {labels.connect}
        {trailing}
      </Button>
    );
  const step =
    open && chosen
      ? renderPicked?.(chosen, {
          close: () => setOpen(false),
          clear: () => {
            setAgentId(null);
            setCleared(true);
          },
        })
      : null;
  const picked = step === false || step === "" ? null : (step ?? null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent
        align={align}
        size="md"
        data-slot="delegate-popover"
        className={cn("gap-0 p-0", className)}
      >
        <PopoverHeader className="px-3 pt-3 pb-1">
          <PopoverTitle>{title}</PopoverTitle>
        </PopoverHeader>
        {empty ? (
          <Empty
            size="sm"
            icon={<Bot aria-hidden />}
            data-slot="delegate-popover-empty"
          >
            <EmptyHeader>
              <EmptyDescription>{labels.empty}</EmptyDescription>
            </EmptyHeader>
            {canConnect ? (
              <EmptyContent>{connectControl("default", "sm")}</EmptyContent>
            ) : null}
          </Empty>
        ) : (
          <>
            {loading ? (
              <div
                aria-busy
                data-slot="delegate-popover-loading"
                className="flex flex-col p-1"
              >
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                    <Skeleton className="size-6 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Skeleton className={cn("h-3", i ? "w-24" : "w-32")} />
                      <Skeleton className="h-2.5 w-40 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <PeoplePickerContent
                options={options}
                selected={agentId ? [agentId] : []}
                searchPlaceholder={labels.search}
                emptyText={labels.noMatch}
                heading={labels.agents}
                agentLabel={false}
                onSelect={(option) => setAgentId(option.id)}
                className="bg-transparent [&_[data-slot=command-list]]:max-h-48"
              />
            )}
            <Separator />
            {/* Always mounted, so a step that appears is read out: focus stays in the search. */}
            <div aria-live="polite">
              {picked != null ? (
                <div
                  data-slot="delegate-popover-picked"
                  className="flex flex-col gap-2 p-3 text-sm"
                >
                  {picked}
                </div>
              ) : null}
            </div>
            {picked != null ? null : (
              <div
                data-slot="delegate-popover-form"
                className="flex flex-col gap-3 p-3"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={instructionsId}>{labels.instructions}</Label>
                  <Textarea
                    id={instructionsId}
                    value={instructions}
                    maxLength={instructionsMaxLength}
                    placeholder={labels.instructionsPlaceholder}
                    onChange={(event) => setInstructions(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        (event.metaKey || event.ctrlKey) &&
                        !event.nativeEvent.isComposing &&
                        event.keyCode !== 229
                      ) {
                        event.preventDefault();
                        void submit();
                      }
                    }}
                    className="max-h-40 min-h-16 text-sm"
                  />
                </div>
                {whenFinishedOptions?.length ? (
                  <div className="flex items-center justify-between gap-3">
                    <Label id={finishId}>{labels.whenFinished}</Label>
                    <Select
                      items={whenFinishedOptions.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                      value={whenFinished ?? null}
                      onValueChange={(value) =>
                        setWhenFinished((value as string | null) ?? undefined)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        aria-labelledby={finishId}
                        data-slot="delegate-popover-finish"
                        className="w-fit min-w-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {whenFinishedOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div
                  data-slot="delegate-popover-footer"
                  className="flex items-center justify-between gap-2"
                >
                  {canConnect ? (
                    connectControl(
                      "link",
                      "xs",
                      "px-0",
                      <ChevronRight aria-hidden data-icon="inline-end" />,
                    )
                  ) : (
                    <span />
                  )}
                  <Button
                    size="sm"
                    data-slot="delegate-popover-submit"
                    disabled={!chosen || pending}
                    data-loading={pending ? "" : undefined}
                    aria-busy={pending || undefined}
                    onClick={() => void submit()}
                  >
                    {pending ? (
                      <Spinner aria-hidden data-icon="inline-start" />
                    ) : null}
                    {labels.delegate}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
