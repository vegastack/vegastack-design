// @vegastack agent-panel@0.25.88 sha256-gAYTUZjw1pRAnzUOhKGUV9d3sc3RcOr6inQ+YhyXA98=

"use client";

import * as React from "react";
import {
  ArrowUp,
  Bot,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Ellipsis,
  MessageSquare,
  Pencil,
  RefreshCw,
  Square,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  PersonAgentLabel,
  PersonAvatar,
  personAccessibleName,
  type Person,
} from "@/components/ui/person-avatar";
import {
  RecordAsideAction,
  RecordAsideCard,
  RecordAsideSection,
} from "@/components/ui/record-aside";
import { SplitChip, SplitChipButton } from "@/components/ui/record-chip";
import {
  DateTime,
  RelativeTime,
  useDateTimeNow,
} from "@/components/ui/relative-time";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * AgentPanel — an agent working on a record, as a collaborator: who it is and whom it acts for,
 * where it stands (queued, working, a question, an approval, failed, blocked, done, stopped) with
 * the one or two actions that state needs, its instructions, its latest messages and changes, a
 * reply box, and its runs with View and Undo. One part, two shapes: the rail card on a record page
 * (`variant="card"`) and the collapsible section in a peek (`variant="section"`). Around it:
 *
 * - `AgentSlot` — the one-line Delegate property ("(bot) Claude Code ◌ Working"), its empty ghost
 *   ("Delegate to an agent…") and its muted reason when the viewer can't delegate.
 * - `AgentChip` — the same, as a pill in a peek's pill row or a phone's facts row.
 * - `AgentStateBadge` — the state as an icon and a word; `AgentStateRing` — the avatar ring for
 *   lists and boards (amber: needs you, red: failed).
 * - `AgentHoverCard` — the agent behind an avatar or a name: acting for, access, state, View agent.
 *
 * Presentational: the host owns the delegation and passes its state, data and callbacks. Which
 * actions show is decided by the callbacks passed, so a viewer who can't steer gets the words only.
 * Every string comes in through `labels`, with English defaults.
 * ----------------------------------------------------------------------------------------------*/

/** Where a delegation stands. `none` — nothing is delegated (the panel renders nothing). */
export type AgentState =
  | "none"
  | "queued"
  | "working"
  | "question"
  | "approval"
  | "failed"
  | "blocked"
  | "done"
  | "stopped";

/** The short word for each state, as badges, slots and chips write it. */
export type AgentStateLabels = Record<Exclude<AgentState, "none">, string>;

const DEFAULT_STATE_LABELS: AgentStateLabels = {
  queued: "Queued",
  working: "Working",
  question: "Needs you",
  approval: "Needs you",
  blocked: "Needs you",
  failed: "Failed",
  done: "Done",
  stopped: "Stopped",
};

/** The agent an `AgentPanel` shows: a `Person` drawn as an agent, plus its access. */
export interface AgentPanelAgent extends Pick<Person, "name" | "image"> {
  /** The member it acts for: "Priya" reads "Acting for Priya". @default undefined */
  via?: string | null;
  /** What it may do, in a few words: "Read & write". @default undefined */
  access?: string | null;
}

type Tone = "muted" | "info" | "warning" | "destructive" | "success";

const STATE_TONE: Record<Exclude<AgentState, "none">, Tone> = {
  queued: "muted",
  working: "info",
  question: "warning",
  approval: "warning",
  blocked: "warning",
  failed: "destructive",
  done: "success",
  stopped: "muted",
};

const TONE_TEXT: Record<Tone, string> = {
  muted: "text-muted-foreground",
  info: "text-info-text",
  warning: "text-warning-text",
  destructive: "text-destructive-text",
  success: "text-success-text",
};

/** States the agent is still on: Stop applies, and a disconnect can still block it. */
const ACTIVE: ReadonlySet<AgentState> = new Set([
  "queued",
  "working",
  "question",
  "approval",
  "blocked",
]);

/** States the work is over in: "Agent since disconnected" may follow. */
const FINISHED: ReadonlySet<AgentState> = new Set([
  "done",
  "failed",
  "stopped",
]);

function toneOf(state: AgentState): Tone {
  return state === "none" ? "muted" : STATE_TONE[state];
}

/** The state's glyph: a clock, a spinner, "!", ✕, ✓ or ■ — always beside its word. */
function AgentStateIcon({
  state,
  className,
}: {
  state: AgentState;
  className?: string;
}) {
  const cls = cn("size-3.5 shrink-0", TONE_TEXT[toneOf(state)], className);
  switch (state) {
    case "queued":
      return <Clock aria-hidden data-slot="agent-state-icon" className={cls} />;
    case "working":
      return (
        <Spinner
          aria-hidden
          role={undefined}
          aria-label={undefined}
          data-slot="agent-state-icon"
          className={cls}
        />
      );
    case "question":
    case "approval":
    case "blocked":
      return (
        <CircleAlert aria-hidden data-slot="agent-state-icon" className={cls} />
      );
    case "failed":
      return (
        <CircleX aria-hidden data-slot="agent-state-icon" className={cls} />
      );
    case "done":
      return (
        <CircleCheck aria-hidden data-slot="agent-state-icon" className={cls} />
      );
    case "stopped":
      return (
        <Square
          aria-hidden
          data-slot="agent-state-icon"
          className={cn(cls, "fill-current")}
        />
      );
    default:
      return null;
  }
}

/** The agent as a `Person`, so the avatar draws the purple bot. */
function asPerson(agent: AgentPanelAgent) {
  return { name: agent.name, image: agent.image, kind: "agent" as const };
}

/** "4 min", "1 h 5 min" — an elapsed or run time, never under a minute. */
function defaultDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function toMs(value: Date | string | number): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/* ------------------------------------------------------------------------------------------------
 * AgentStateBadge and AgentStateRing
 * ----------------------------------------------------------------------------------------------*/

/** Props for `AgentStateBadge`. */
export interface AgentStateBadgeProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The state; `none` renders nothing. */
  state: AgentState;
  /** Replace any state word (`AgentStateLabels`). @default undefined */
  stateLabels?: Partial<AgentStateLabels>;
}

/**
 * `AgentStateBadge` — a delegation's state as its icon and word in the state's ink: ◷ Queued,
 * ◌ Working, ! Needs you (amber), ✕ Failed (red), ✓ Done (green), ■ Stopped. It never truncates:
 * give the name beside it the room to shrink.
 *
 * @example <AgentStateBadge state="working" />
 */
export function AgentStateBadge({
  state,
  stateLabels,
  className,
  ...props
}: AgentStateBadgeProps) {
  if (state === "none") return null;
  const word = { ...DEFAULT_STATE_LABELS, ...stateLabels }[state];
  return (
    <span
      data-slot="agent-state-badge"
      data-state={state}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap",
        TONE_TEXT[toneOf(state)],
        state === "working" && "text-foreground",
        className,
      )}
      {...props}
    >
      <AgentStateIcon state={state} />
      {word}
    </span>
  );
}

/** Props for `AgentStateRing`. */
export interface AgentStateRingProps extends React.ComponentPropsWithRef<"span"> {
  /** The state: amber ring while it needs you, red when it failed, none otherwise. */
  state: AgentState;
  /**
   * Say the state to screen readers after the avatar ("Needs you"). Turn it off when the state's
   * word is already written beside it (an `AgentStateBadge`).
   * @default true
   */
  srLabel?: boolean;
  /** Replace any state word (`AgentStateLabels`). @default undefined */
  stateLabels?: Partial<AgentStateLabels>;
}

/**
 * `AgentStateRing` — wraps an agent's `PersonAvatar` in a list, a board card or a grid row header
 * with a ring for the states that need someone: amber while it needs you (a question, an approval,
 * a block), red when it failed. Other states draw no ring. The colour is never the only cue: the
 * state is said to screen readers, and the host shows its word where there is room.
 *
 * @example
 * <AgentStateRing state="question"><PersonAvatar person={{ name: "Claude Code", kind: "agent" }} /></AgentStateRing>
 */
export function AgentStateRing({
  state,
  srLabel = true,
  stateLabels,
  className,
  children,
  ...props
}: AgentStateRingProps) {
  const tone = toneOf(state);
  const word =
    state === "none"
      ? null
      : { ...DEFAULT_STATE_LABELS, ...stateLabels }[state];
  return (
    <span
      data-slot="agent-state-ring"
      data-state={state}
      className={cn(
        "inline-flex shrink-0 rounded-full",
        tone === "warning" && "ring-2 ring-warning",
        tone === "destructive" && "ring-2 ring-destructive",
        className,
      )}
      {...props}
    >
      {children}
      {srLabel && word ? <span className="sr-only">, {word}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * AgentSlot and AgentChip
 * ----------------------------------------------------------------------------------------------*/

/** Props for `AgentSlot`. */
export interface AgentSlotProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children"
> {
  /** The agent delegated to; none shows the ghost placeholder. @default undefined */
  agent?: AgentPanelAgent | null;
  /** Where its work stands. @default "working" when an agent is set */
  state?: AgentState;
  /** The empty slot's ghost text. @default "Delegate to an agent…" */
  placeholder?: React.ReactNode;
  /**
   * Why the viewer can't delegate ("Only Priya can delegate — assign it to yourself first"): the
   * empty slot shows it, muted, as text instead of a button.
   * @default undefined
   */
  disabledReason?: React.ReactNode;
  /** Show the agent as text, not a button (the viewer can't change it). @default false */
  readOnly?: boolean;
  /** Replace any state word (`AgentStateLabels`). @default undefined */
  stateLabels?: Partial<AgentStateLabels>;
}

/**
 * `AgentSlot` — the Delegate property's value, on one line: the agent's bot, its name (which
 * truncates) and its state (which never does). Empty, it is a ghost "Delegate to an agent…"; when
 * the viewer can't delegate, the muted reason instead. It is a ghost button sized like a ghost
 * `RecordChip`, and hangs the same way inside a `PropertyValue`; every other prop, and the ref, go
 * (to the span in its text forms)
 * to the button, so it drops into a trigger's `render` (the `DelegatePopover`).
 *
 * @example
 * <PropertyRow>
 *   <PropertyLabel>Delegate</PropertyLabel>
 *   <PropertyValue>
 *     <DelegatePopover agents={agents} onDelegate={delegate}>
 *       <AgentSlot agent={delegation?.agent} state={delegation?.state} />
 *     </DelegatePopover>
 *   </PropertyValue>
 * </PropertyRow>
 */
export function AgentSlot({
  agent,
  state: stateProp,
  placeholder = "Delegate to an agent…",
  disabledReason,
  readOnly = false,
  stateLabels,
  className,
  ...props
}: AgentSlotProps) {
  const state = stateProp ?? (agent ? "working" : "none");
  // The text forms take the same host props (id, aria-*, data-*, the ref) on their span.
  const spanProps = props as unknown as React.ComponentPropsWithRef<"span">;
  if (!agent && disabledReason != null) {
    return (
      <span
        {...spanProps}
        data-slot="agent-slot"
        data-empty=""
        data-disabled=""
        className={cn("text-sm text-muted-foreground", className)}
      >
        {disabledReason}
      </span>
    );
  }
  const content = agent ? (
    <>
      <PersonAvatar
        person={asPerson(agent)}
        aria-hidden
        size="default"
        className="size-5"
      />
      <span className="min-w-0 truncate">{agent.name}</span>
      {state !== "none" ? <span className="sr-only">, </span> : null}
      <AgentStateBadge
        state={state}
        stateLabels={stateLabels}
        className="text-sm"
      />
    </>
  ) : (
    <span className="min-w-0 truncate">{placeholder}</span>
  );
  if (agent && readOnly) {
    return (
      <span
        {...spanProps}
        data-slot="agent-slot"
        data-state={state}
        className={cn(
          "inline-flex h-6 max-w-full min-w-0 items-center gap-1.5 text-sm",
          className,
        )}
      >
        {content}
      </span>
    );
  }
  return (
    <Button
      variant="ghost"
      data-slot="agent-slot"
      data-state={state}
      data-empty={agent ? undefined : ""}
      className={cn(
        "h-6 max-w-full min-w-0 justify-start gap-1.5 rounded-md px-1.5 text-sm font-normal active:not-aria-[haspopup]:translate-y-0",
        // Inside a PropertyValue it hangs like a ghost RecordChip: its text starts where plain
        // values do and the row keeps a text row's height.
        "in-data-[slot=property-value]:-my-0.5 in-data-[slot=property-value]:-ms-1.5",
        !agent && "text-muted-foreground",
        className,
      )}
      {...props}
    >
      {content}
    </Button>
  );
}

/** Props for `AgentChip`. */
export interface AgentChipProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children"
> {
  /** The agent delegated to; none shows the dashed `placeholder` pill. @default undefined */
  agent?: AgentPanelAgent | null;
  /** Where its work stands. @default "working" when an agent is set */
  state?: AgentState;
  /** The empty pill's text. @default "Delegate" */
  placeholder?: React.ReactNode;
  /** Replace any state word (`AgentStateLabels`). @default undefined */
  stateLabels?: Partial<AgentStateLabels>;
}

/**
 * `AgentChip` — the delegation as one pill, for a peek's pill row and a phone's facts row:
 * "(bot) Claude Code · Working". Empty, a dashed "Delegate" pill. Every other prop, and the ref,
 * go to the button: on a phone it opens the record's sheet at the Agent section; in a peek it can
 * be the `DelegatePopover`'s trigger.
 *
 * @example <AgentChip agent={{ name: "Claude Code" }} state="working" onClick={openAgentSection} />
 */
export function AgentChip({
  agent,
  state: stateProp,
  placeholder = "Delegate",
  stateLabels,
  className,
  ...props
}: AgentChipProps) {
  const state = stateProp ?? (agent ? "working" : "none");
  const word =
    state === "none"
      ? null
      : { ...DEFAULT_STATE_LABELS, ...stateLabels }[state];
  return (
    <SplitChip
      data-slot="agent-chip"
      data-state={state}
      data-empty={agent ? undefined : ""}
      className={cn(
        "data-empty:border-dashed data-empty:text-muted-foreground",
        className,
      )}
    >
      <SplitChipButton {...props}>
        {agent ? (
          <>
            <PersonAvatar
              person={asPerson(agent)}
              aria-hidden
              size="sm"
              className="size-4"
            />
            <span className="min-w-0 truncate">{agent.name}</span>
            {word ? <span className="sr-only">, </span> : null}
            {word ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap",
                  TONE_TEXT[toneOf(state)],
                  state === "working" && "text-muted-foreground",
                )}
              >
                <span aria-hidden>·</span>
                {word}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <Bot aria-hidden className="text-muted-foreground" />
            <span className="min-w-0 truncate">{placeholder}</span>
          </>
        )}
      </SplitChipButton>
    </SplitChip>
  );
}

/* ------------------------------------------------------------------------------------------------
 * AgentHoverCard
 * ----------------------------------------------------------------------------------------------*/

/** Every string `AgentHoverCard` renders. */
export interface AgentHoverCardLabels {
  /** The purple label after the name. */
  agent: string;
  /** "Acting for Priya". */
  actingFor: (owner: string) => string;
  /** The View agent link. */
  viewAgent: string;
  /** The avatar trigger's accessible name: "Claude Code via Priya, agent". */
  name: (agent: string, owner?: string | null) => string;
}

const DEFAULT_HOVER_LABELS: AgentHoverCardLabels = {
  agent: "Agent",
  actingFor: (owner) => `Acting for ${owner}`,
  viewAgent: "View agent",
  name: (agent, owner) =>
    personAccessibleName({ name: agent, kind: "agent", via: owner }),
};

/** Props for `AgentHoverCard`. */
export interface AgentHoverCardProps {
  /** The agent. */
  agent: AgentPanelAgent;
  /** Where its work on this record stands, shown under its access. @default undefined */
  state?: AgentState;
  /** The trigger — the agent's `PersonAvatar` (`trigger="avatar"`) or its name (`trigger="name"`). */
  children: React.ReactNode;
  /**
   * `avatar` — the children sit in a round ghost button named for the agent. `name` — inline text
   * (an activity's actor) in a quiet text button.
   * @default "avatar"
   */
  trigger?: "avatar" | "name";
  /** Open the agent's page; the View agent link shows when set. @default undefined */
  onViewAgent?: () => void;
  /** Replace any of the strings (`AgentHoverCardLabels`). @default undefined */
  labels?: Partial<AgentHoverCardLabels>;
  /** Replace any state word (`AgentStateLabels`). @default undefined */
  stateLabels?: Partial<AgentStateLabels>;
  /** Classes for the trigger button. @default undefined */
  className?: string;
}

/**
 * `AgentHoverCard` — hover or focus an agent's avatar or name (tap it on touch) for who it is:
 * its bot and name with the "Agent" label, "Acting for Priya · Read & write", where its work on
 * this record stands, and View agent. `PersonHoverCard` for an agent, with the agent's facts.
 *
 * @example
 * <AgentHoverCard agent={{ name: "Claude Code", via: "Priya", access: "Read & write" }} state="working" onViewAgent={openAgent}>
 *   <PersonAvatar person={{ name: "Claude Code", kind: "agent" }} />
 * </AgentHoverCard>
 */
export function AgentHoverCard({
  agent,
  state,
  children,
  trigger = "avatar",
  onViewAgent,
  labels: labelsProp,
  stateLabels,
  className,
}: AgentHoverCardProps) {
  const labels = { ...DEFAULT_HOVER_LABELS, ...labelsProp };
  const [open, setOpen] = React.useState(false);
  const name = labels.name(agent.name, agent.via);
  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={
          trigger === "name" ? (
            <Button
              variant="link"
              data-slot="agent-hover-card-name"
              className={cn(
                "h-6 min-w-0 px-0 font-medium text-foreground no-underline hover:underline",
                className,
              )}
              onClick={() => setOpen((o) => !o)}
            />
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              data-slot="agent-hover-card-avatar"
              aria-label={name}
              className={cn("rounded-full", className)}
              onClick={() => setOpen((o) => !o)}
            />
          )
        }
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64 p-2.5">
        <div
          data-slot="agent-hover-card"
          className="flex min-w-0 flex-col gap-2"
        >
          <AgentIdentity agent={agent} labels={labels} />
          {state && state !== "none" ? (
            <AgentStateBadge
              state={state}
              stateLabels={stateLabels}
              className="text-sm"
            />
          ) : null}
          {onViewAgent ? (
            <Button
              variant="link"
              size="xs"
              className="self-start px-0"
              onClick={() => {
                setOpen(false);
                onViewAgent();
              }}
            >
              {labels.viewAgent}
              <ChevronRight aria-hidden data-icon="inline-end" />
            </Button>
          ) : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/** The bot, the name with "Agent", and "Acting for Priya · Read & write" under it. */
function AgentIdentity({
  agent,
  labels,
}: {
  agent: AgentPanelAgent;
  labels: Pick<AgentHoverCardLabels, "agent" | "actingFor">;
}) {
  const facts = [agent.via ? labels.actingFor(agent.via) : null, agent.access]
    .filter(Boolean)
    .join(" · ");
  return (
    <div
      data-slot="agent-identity"
      className="flex min-w-0 items-center gap-2.5"
    >
      <PersonAvatar person={asPerson(agent)} aria-hidden size="default" />
      <div className="flex min-w-0 flex-col">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <span className="wrap-anywhere">{agent.name}</span>
          <PersonAgentLabel>{labels.agent}</PersonAgentLabel>
        </span>
        {facts ? (
          <span
            data-slot="agent-identity-facts"
            className="text-xs wrap-anywhere text-muted-foreground"
          >
            {facts}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * AgentPanel
 * ----------------------------------------------------------------------------------------------*/

/** One of the agent's recent messages or changes, under Latest. */
export interface AgentPanelEvent {
  /** A stable key. */
  id: string;
  /** A message from the agent (💬) or a change it made (↻). */
  kind: "message" | "change";
  /** The message, or the change ("Status → In progress"). */
  text: React.ReactNode;
  /** When. */
  at: Date | string | number;
}

/** One of the agent's runs on the record, under History. */
export interface AgentPanelRun {
  /** A stable key. */
  id: string;
  /** How many changes the run made. */
  changeCount: number;
  /** When the run made its last change. */
  at: Date | string | number;
  /** Open the run's changes; View shows when set. @default undefined */
  onView?: () => void;
  /** Undo the run's changes; Undo shows when set. @default undefined */
  onUndo?: () => void;
  /**
   * Why the run can't be undone ("Edited since"): Undo shows disabled with this as its tooltip
   * and description.
   * @default undefined
   */
  undoDisabledReason?: string;
  /** The undo is running: Undo spins and is disabled. @default false */
  undoing?: boolean;
}

/** A one-tap answer to the agent's question. */
export interface AgentPanelChoice {
  /** What is sent back, and the key. */
  value: string;
  /** The button's text. @default value */
  label?: string;
}

/** Every string `AgentPanel` renders or names a control with. */
export interface AgentPanelLabels extends AgentHoverCardLabels {
  /** The card's and the section's title. */
  title: string;
  /** The ⋯ menu's accessible name: "More actions for Claude Code". */
  more: (agent: string) => string;
  /** Menu: Change agent. */
  changeAgent: string;
  /** Menu and state line: Stop. */
  stop: string;
  /** Menu and the Failed line: Remove. */
  remove: string;
  /** The Queued line: "Waiting for Claude Code to pick this up". */
  waiting: (agent: string) => string;
  /** The hint once it has queued a while: "Claude Code picks up work when it's running on your machine." */
  queuedHint: (agent: string) => string;
  /** The Approval line's word. */
  wantsApproval: string;
  /** Approve. */
  approve: string;
  /** Decline. */
  decline: string;
  /** Retry. */
  retry: string;
  /** Reconnect (blocked, for the owner). */
  reconnect: string;
  /** The Done line's action. */
  markDone: string;
  /** "Stopped by Priya". */
  stoppedBy: (person: string) => string;
  /** "Its 12 changes stay — undo them in History". */
  changesStay: (count: number) => string;
  /** The Stopped line's action. */
  delegateAgain: string;
  /** The muted note on a finished card whose agent was disconnected since. */
  disconnected: string;
  /** An elapsed or run time: "4 min". */
  duration: (seconds: number) => string;
  /** The Instructions heading. */
  instructions: string;
  /** The ✎ button's name. */
  editInstructions: string;
  /** The empty instructions' button, for a viewer who can steer. */
  addInstructions: string;
  /** Save. */
  save: string;
  /** Cancel. */
  cancel: string;
  /** The Latest heading. */
  latest: string;
  /** "Show all 5", or "Show all" without a total. */
  showAll: (total?: number) => string;
  /** A message's screen-reader prefix. */
  message: string;
  /** A change's screen-reader prefix. */
  change: string;
  /** The question line's link to the reply box. */
  replyLink: string;
  /** The reply box's placeholder and name: "Reply to Claude Code…". */
  replyPlaceholder: (agent: string) => string;
  /** The send button's name. */
  send: string;
  /** The History heading. */
  history: string;
  /** "Run · 3 changes". */
  run: (changeCount: number) => string;
  /** View a run. */
  view: string;
  /** Undo a run. */
  undo: string;
  /** What a state change announces: "Claude Code: Needs you". */
  announce: (agent: string, state: string) => string;
}

const DEFAULT_LABELS: AgentPanelLabels = {
  ...DEFAULT_HOVER_LABELS,
  title: "Agent",
  more: (agent) => `More actions for ${agent}`,
  changeAgent: "Change agent",
  stop: "Stop",
  remove: "Remove",
  waiting: (agent) => `Waiting for ${agent} to pick this up`,
  queuedHint: (agent) =>
    `${agent} picks up work when it's running on your machine.`,
  wantsApproval: "Wants approval",
  approve: "Approve",
  decline: "Decline",
  retry: "Retry",
  reconnect: "Reconnect",
  markDone: "Mark task done",
  stoppedBy: (person) => `Stopped by ${person}`,
  changesStay: (count) =>
    count === 1
      ? "Its 1 change stays — undo it in History"
      : `Its ${count} changes stay — undo them in History`,
  delegateAgain: "Delegate again",
  disconnected: "Agent since disconnected",
  duration: defaultDuration,
  instructions: "Instructions",
  editInstructions: "Edit instructions",
  addInstructions: "Add instructions",
  save: "Save",
  cancel: "Cancel",
  latest: "Latest",
  showAll: (total) => (total == null ? "Show all" : `Show all ${total}`),
  message: "Message",
  change: "Change",
  replyLink: "Reply…",
  replyPlaceholder: (agent) => `Reply to ${agent}…`,
  send: "Send reply",
  history: "History",
  run: (n) => (n === 1 ? "Run · 1 change" : `Run · ${n} changes`),
  view: "View",
  undo: "Undo",
  announce: (agent, state) => `${agent}: ${state}`,
};

/** Props for `AgentPanel`. */
export interface AgentPanelProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children" | "title"
> {
  /** The agent. */
  agent: AgentPanelAgent;
  /** Where the delegation stands; `none` renders nothing (the Delegate slot is empty). */
  state: AgentState;
  /**
   * `card` — the record page's rail card. `section` — the peek's collapsible section, its header
   * a one-line summary; open unless the work is done or stopped.
   * @default "card"
   */
  variant?: "card" | "section";
  /** The section's open state (controlled). @default undefined */
  open?: boolean;
  /** The section's initial open state. @default true, false when done or stopped */
  defaultOpen?: boolean;
  /** Called when the section opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** When the agent started (working: "Working · 4 min"). @default undefined */
  startedAt?: Date | string | number;
  /** The agent's latest progress line while working ("Reading the 3 linked pages…"). @default undefined */
  progress?: React.ReactNode;
  /** Queued a while (the host's 10 minutes): add the "picks up work when it's running" hint. @default false */
  queuedHint?: boolean;
  /** The agent's open question (state `question`). @default undefined */
  question?: React.ReactNode;
  /** One-tap answers to the question. @default [] */
  choices?: readonly AgentPanelChoice[];
  /** Answer the question with a choice; the choice buttons show when set. @default undefined */
  onAnswer?: (value: string) => void;
  /** What the agent asks to do (state `approval`): "Move 3 tasks to Trash". @default undefined */
  approval?: React.ReactNode;
  /** Approve; shows when set. @default undefined */
  onApprove?: () => void;
  /** Decline; shows when set. @default undefined */
  onDecline?: () => void;
  /** The agent's problem (state `failed`): "Couldn't open M-15 — no access." @default undefined */
  error?: React.ReactNode;
  /** Retry (failed); shows when set. @default undefined */
  onRetry?: () => void;
  /** Why it can't go on (state `blocked`): "Its token expired". @default undefined */
  blockedReason?: React.ReactNode;
  /** Reconnect (blocked) — pass it to the agent's owner only. @default undefined */
  onReconnect?: () => void;
  /** When it finished (done) or was stopped (stopped). @default undefined */
  finishedAt?: Date | string | number;
  /** How long the run took (done), in seconds: "3 min". @default undefined */
  durationSeconds?: number;
  /** The agent's closing message (done): "Proposal drafted in P-42." @default undefined */
  summary?: React.ReactNode;
  /** Mark the record done (done, when it isn't done on its own); shows when set. @default undefined */
  onMarkDone?: () => void;
  /** Who stopped it (stopped): "Priya". @default undefined */
  stoppedBy?: string;
  /** How many of its changes stay (stopped). @default undefined */
  changeCount?: number;
  /** Delegate again (stopped); shows when set. @default undefined */
  onDelegateAgain?: () => void;
  /**
   * The agent was disconnected since: a finished, failed or stopped card adds the muted "Agent
   * since disconnected" and never turns back into Needs you.
   * @default false
   */
  disconnected?: boolean;
  /** What the agent was asked to do. @default undefined */
  instructions?: string | null;
  /**
   * Save edited instructions — only for a viewer who may steer: ✎ shows, and an empty
   * instruction offers "Add instructions". A returned promise keeps the editor open until it
   * settles, and open on a rejection.
   * @default undefined
   */
  onInstructionsChange?: (instructions: string) => void | Promise<void>;
  /** The agent's latest messages and changes, newest first; the first three show. @default [] */
  latest?: readonly AgentPanelEvent[];
  /** How many there are in all, for "Show all 5". @default undefined */
  latestTotal?: number;
  /** Show them all (filter the activity to this agent); "Show all" shows when set. @default undefined */
  onShowAll?: () => void;
  /**
   * Send a reply to the agent — only for a viewer who may steer; the reply box shows when set. A
   * returned promise keeps the text until it resolves.
   * @default undefined
   */
  onReply?: (text: string) => void | Promise<void>;
  /** Why the reply box is disabled ("It's stopped"), shown under it. @default undefined */
  replyDisabledReason?: React.ReactNode;
  /** The agent's runs, newest first, under History. @default [] */
  runs?: readonly AgentPanelRun[];
  /** Menu: View agent; shows when set. @default undefined */
  onViewAgent?: () => void;
  /** Menu: Change agent; shows when set. @default undefined */
  onChangeAgent?: () => void;
  /** Stop (queued and working lines, and the menu while it is on the work); shows when set. @default undefined */
  onStop?: () => void;
  /** Remove the agent from the record (menu, and the Failed line); shows when set. @default undefined */
  onRemove?: () => void;
  /** Replace any of the strings (`AgentPanelLabels`). @default undefined */
  labels?: Partial<AgentPanelLabels>;
  /** Replace any state word (`AgentStateLabels`). @default undefined */
  stateLabels?: Partial<AgentStateLabels>;
  /** Pin the clock for elapsed and relative times (docs, tests). @default undefined */
  now?: number;
}

/** The small button every state line uses. */
function LineButton({
  className,
  variant = "outline",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button size="xs" variant={variant} className={className} {...props} />
  );
}

/** "· " between facts on a line. */
function Dot() {
  return <span aria-hidden> · </span>;
}

type ResolvedProps = Omit<
  AgentPanelProps,
  "labels" | "stateLabels" | "variant"
> & {
  labels: AgentPanelLabels;
  stateLabels: AgentStateLabels;
  nowMs: number | undefined;
  focusReply: () => void;
};

/** The facts after the state word, as one inline run: "4 min · “Reading…”". */
function StateFacts({ p }: { p: ResolvedProps }) {
  const { state, labels, nowMs } = p;
  const parts: React.ReactNode[] = [];
  if (state === "queued") parts.push(labels.waiting(p.agent.name));
  if (state === "working") {
    if (p.startedAt != null && nowMs !== undefined)
      parts.push(
        labels.duration(Math.max(0, (nowMs - toMs(p.startedAt)) / 1000)),
      );
  }
  if (state === "approval" && p.approval != null) parts.push(p.approval);
  if (state === "failed" && p.error != null) parts.push(<q>{p.error}</q>);
  if (state === "blocked" && p.blockedReason != null)
    parts.push(p.blockedReason);
  if (state === "done" || state === "stopped") {
    if (p.finishedAt != null)
      parts.push(
        <DateTime
          date={p.finishedAt}
          focusable={false}
          options={nowMs !== undefined ? { now: nowMs } : undefined}
        />,
      );
  }
  if (state === "done") {
    if (p.durationSeconds != null)
      parts.push(labels.duration(p.durationSeconds));
    if (p.summary != null) parts.push(<q>{p.summary}</q>);
  }
  if (state === "stopped" && p.changeCount != null && p.changeCount > 0)
    parts.push(labels.changesStay(p.changeCount));
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <Dot />
          {part}
        </React.Fragment>
      ))}
    </>
  );
}

/** The state's word on the line: "Wants approval", "Stopped by Priya", else the short word. */
function stateTitle(p: ResolvedProps): string {
  if (p.state === "none") return "";
  if (p.state === "approval") return p.labels.wantsApproval;
  if (p.state === "stopped" && p.stoppedBy)
    return p.labels.stoppedBy(p.stoppedBy);
  return p.stateLabels[p.state];
}

/** The actions a state line offers, in the mockup's order. */
function StateActions({ p }: { p: ResolvedProps }) {
  const { state, labels } = p;
  const buttons: React.ReactNode[] = [];
  if ((state === "queued" || state === "working") && p.onStop)
    buttons.push(
      <LineButton key="stop" onClick={p.onStop}>
        {labels.stop}
      </LineButton>,
    );
  if (state === "approval") {
    if (p.onApprove)
      buttons.push(
        <LineButton key="approve" variant="default" onClick={p.onApprove}>
          {labels.approve}
        </LineButton>,
      );
    if (p.onDecline)
      buttons.push(
        <LineButton key="decline" onClick={p.onDecline}>
          {labels.decline}
        </LineButton>,
      );
  }
  if (state === "failed") {
    if (p.onRetry)
      buttons.push(
        <LineButton key="retry" onClick={p.onRetry}>
          {labels.retry}
        </LineButton>,
      );
    if (p.onRemove)
      buttons.push(
        <LineButton key="remove" onClick={p.onRemove}>
          {labels.remove}
        </LineButton>,
      );
  }
  if (state === "blocked" && p.onReconnect)
    buttons.push(
      <LineButton key="reconnect" onClick={p.onReconnect}>
        {labels.reconnect}
      </LineButton>,
    );
  if (state === "done" && p.onMarkDone)
    buttons.push(
      <LineButton key="done" onClick={p.onMarkDone}>
        {labels.markDone}
      </LineButton>,
    );
  if (state === "stopped" && p.onDelegateAgain)
    buttons.push(
      <LineButton key="again" onClick={p.onDelegateAgain}>
        {labels.delegateAgain}
      </LineButton>,
    );
  if (buttons.length === 0) return null;
  return (
    <div
      data-slot="agent-panel-state-actions"
      className="flex flex-wrap items-center gap-1.5"
    >
      {buttons}
    </div>
  );
}

/** The state block: the line, its detail (question, live line, hint, disconnect) and actions. */
function StateBlock({ p }: { p: ResolvedProps }) {
  const { state, labels } = p;
  const tone = toneOf(state);
  const question = state === "question";
  return (
    <div
      data-slot="agent-panel-state"
      data-state={state}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 text-sm",
        // A question or an approval sits on the warning tint: it is what the card is for now.
        (question || state === "approval") &&
          "rounded-md bg-warning/10 p-2 dark:bg-warning/20",
      )}
    >
      <p className="min-w-0 wrap-anywhere">
        <span
          className={cn(
            "inline-flex items-center gap-1 align-[-0.125em] font-medium",
            TONE_TEXT[tone],
            state === "working" && "text-foreground",
          )}
        >
          <AgentStateIcon state={state} />
          {stateTitle(p)}
        </span>
        <span className="text-muted-foreground">
          <StateFacts p={p} />
        </span>
      </p>
      {state === "working" && p.progress != null ? (
        <p
          data-slot="agent-panel-progress"
          className="min-w-0 ps-4.5 wrap-anywhere text-muted-foreground"
        >
          <q>{p.progress}</q>
        </p>
      ) : null}
      {state === "queued" && p.queuedHint ? (
        <p
          data-slot="agent-panel-hint"
          className="ps-4.5 text-xs text-muted-foreground"
        >
          {labels.queuedHint(p.agent.name)}
        </p>
      ) : null}
      {question && p.question != null ? (
        <p
          data-slot="agent-panel-question"
          className="min-w-0 wrap-anywhere text-foreground"
        >
          <q>{p.question}</q>
        </p>
      ) : null}
      {question &&
      ((p.onAnswer && (p.choices?.length ?? 0) > 0) || p.onReply) ? (
        <div
          data-slot="agent-panel-choices"
          className="flex flex-wrap items-center gap-1.5"
        >
          {p.onAnswer
            ? p.choices?.map((choice) => (
                <LineButton
                  key={choice.value}
                  onClick={() => p.onAnswer?.(choice.value)}
                >
                  {choice.label ?? choice.value}
                </LineButton>
              ))
            : null}
          {p.onReply ? (
            <LineButton variant="ghost" onClick={p.focusReply}>
              {labels.replyLink}
            </LineButton>
          ) : null}
        </div>
      ) : null}
      <StateActions p={p} />
      {p.disconnected && FINISHED.has(state) ? (
        <p
          data-slot="agent-panel-disconnected"
          className="text-xs text-muted-foreground"
        >
          {labels.disconnected}
        </p>
      ) : null}
    </div>
  );
}

/** A sub-block of the panel: a small heading, an optional action, its content. */
function Block({
  title,
  action,
  slot,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  slot: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <section
      data-slot={slot}
      aria-labelledby={id}
      className="flex min-w-0 flex-col gap-1"
    >
      <div className="flex min-h-6 min-w-0 items-center justify-between gap-2">
        <h3 id={id} className="text-xs font-medium text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Instructions, with ✎ to edit them in place for a viewer who may steer. */
function InstructionsBlock({ p }: { p: ResolvedProps }) {
  const { labels } = p;
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const savingRef = React.useRef(false);
  const editRef = React.useRef<HTMLTextAreaElement | null>(null);
  const editId = React.useId();
  const text = p.instructions?.trim() ? p.instructions : null;
  const canEdit = p.onInstructionsChange !== undefined;
  if (!text && !canEdit) return null;

  const start = () => {
    setDraft(p.instructions ?? "");
    setEditing(true);
    requestAnimationFrame(() => editRef.current?.focus());
  };
  // Closing the editor hands focus back to ✎ (or Add instructions), never to the page.
  const close = () => {
    setEditing(false);
    requestAnimationFrame(() => document.getElementById(editId)?.focus());
  };
  const save = async () => {
    if (!p.onInstructionsChange || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await p.onInstructionsChange(draft.trim());
      close();
    } catch {
      // Stay open with the draft: the host reports the failure.
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Block
      slot="agent-panel-instructions"
      title={labels.instructions}
      action={
        canEdit && !editing && text ? (
          <RecordAsideAction
            id={editId}
            label={labels.editInstructions}
            icon={<Pencil />}
            onClick={start}
          />
        ) : null
      }
    >
      {editing ? (
        <div className="flex flex-col gap-1.5">
          <Textarea
            ref={editRef}
            aria-label={labels.instructions}
            value={draft}
            // Read-only while saving, so the saved text is what the editor closes on.
            readOnly={saving}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                close();
              } else if (
                event.key === "Enter" &&
                (event.metaKey || event.ctrlKey)
              ) {
                event.preventDefault();
                void save();
              }
            }}
            className="min-h-16 text-sm"
          />
          <div className="flex justify-end gap-1.5">
            <LineButton variant="ghost" disabled={saving} onClick={close}>
              {labels.cancel}
            </LineButton>
            <LineButton
              variant="default"
              disabled={saving}
              data-loading={saving ? "" : undefined}
              aria-busy={saving || undefined}
              onClick={() => void save()}
            >
              {labels.save}
            </LineButton>
          </div>
        </div>
      ) : text ? (
        <p className="text-sm wrap-anywhere whitespace-pre-line">{text}</p>
      ) : (
        <LineButton
          id={editId}
          variant="ghost"
          className="-ms-2 self-start text-muted-foreground"
          onClick={start}
        >
          <Pencil aria-hidden data-icon="inline-start" />
          {labels.addInstructions}
        </LineButton>
      )}
    </Block>
  );
}

/** The newest two or three messages (💬) and changes (↻), with their times. */
function LatestBlock({ p }: { p: ResolvedProps }) {
  const { labels } = p;
  const items = (p.latest ?? []).slice(0, 3);
  if (items.length === 0) return null;
  return (
    <Block slot="agent-panel-latest" title={labels.latest}>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => {
          const Icon = item.kind === "message" ? MessageSquare : RefreshCw;
          return (
            <li
              key={item.id}
              data-slot="agent-panel-event"
              data-kind={item.kind}
              className="flex min-w-0 items-start gap-2 text-sm"
            >
              <Icon
                aria-hidden
                className="mt-0.75 size-3.5 shrink-0 text-muted-foreground"
              />
              <span className="sr-only">
                {item.kind === "message" ? labels.message : labels.change}:{" "}
              </span>
              <span className="line-clamp-2 min-w-0 flex-1 wrap-anywhere">
                {item.text}
              </span>
              <RelativeTime
                date={item.at}
                now={p.nowMs}
                focusable={false}
                aria-live="off"
                className="shrink-0 text-xs text-muted-foreground tabular-nums"
              />
            </li>
          );
        })}
      </ul>
      {p.onShowAll ? (
        <LineButton
          variant="link"
          className="self-start px-0"
          onClick={p.onShowAll}
        >
          {labels.showAll(p.latestTotal)}
          <ChevronRight aria-hidden data-icon="inline-end" />
        </LineButton>
      ) : null}
    </Block>
  );
}

/** The reply box: Cmd/Ctrl+Enter or ↑ sends. */
function ReplyBox({
  p,
  textareaRef,
}: {
  p: ResolvedProps;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const { labels } = p;
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const sendingRef = React.useRef(false);
  const reasonId = React.useId();
  if (!p.onReply) return null;
  const disabled = p.replyDisabledReason != null;
  const send = async () => {
    const sent = text;
    const value = sent.trim();
    if (!value || disabled || sendingRef.current || !p.onReply) return;
    sendingRef.current = true;
    setSending(true);
    try {
      await p.onReply(value);
      // Clear what was sent; a newer draft typed meanwhile stays.
      setText((current) => (current === sent ? "" : current));
    } catch {
      // Keep the text: the host reports the failure.
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  const placeholder = labels.replyPlaceholder(p.agent.name);
  return (
    <div data-slot="agent-panel-reply" className="flex flex-col gap-1">
      <InputGroup data-disabled={disabled ? "" : undefined}>
        <InputGroupTextarea
          ref={textareaRef}
          rows={1}
          aria-label={placeholder}
          placeholder={placeholder}
          value={text}
          disabled={disabled}
          aria-describedby={disabled ? reasonId : undefined}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void send();
            }
          }}
          className="min-h-8 py-1.5 text-sm"
        />
        <InputGroupAddon align="inline-end" className="self-end pb-1">
          <InputGroupButton
            size="icon-xs"
            variant="default"
            className="rounded-full"
            aria-label={labels.send}
            disabled={disabled || sending || text.trim() === ""}
            onClick={() => void send()}
          >
            <ArrowUp aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {disabled ? (
        <p id={reasonId} className="text-xs text-muted-foreground">
          {p.replyDisabledReason}
        </p>
      ) : null}
    </div>
  );
}

/** Same-day runs read the time ("10:42"), older ones the date ("Oct 14"). */
function RunTime({
  at,
  nowMs,
}: {
  at: Date | string | number;
  nowMs: number | undefined;
}) {
  const sameDay =
    nowMs !== undefined &&
    new Date(toMs(at)).toDateString() === new Date(nowMs).toDateString();
  return (
    <DateTime
      date={at}
      variant={sameDay ? "time" : "date"}
      focusable={false}
      options={nowMs !== undefined ? { now: nowMs } : undefined}
    />
  );
}

/** One run: "Run · 3 changes · 10:42", View, Undo (disabled with its reason when it can't). */
function RunRow({ run, p }: { run: AgentPanelRun; p: ResolvedProps }) {
  const { labels } = p;
  const reasonId = React.useId();
  const reason = run.onUndo ? run.undoDisabledReason : undefined;
  const undoButton = run.onUndo ? (
    <LineButton
      variant="ghost"
      disabled={reason !== undefined || run.undoing}
      data-loading={run.undoing ? "" : undefined}
      aria-busy={run.undoing || undefined}
      aria-describedby={reason ? reasonId : undefined}
      onClick={run.onUndo}
    >
      {run.undoing ? <Spinner aria-hidden data-icon="inline-start" /> : null}
      {labels.undo}
    </LineButton>
  ) : null;
  return (
    <li
      data-slot="agent-panel-run"
      className="flex min-w-0 items-center justify-between gap-x-2 text-sm"
    >
      {/* One line, the buttons always whole: the time gives way first, then the run's words. */}
      <span className="flex min-w-0 grow basis-0 items-baseline text-muted-foreground">
        <span className="min-w-0 truncate text-foreground">
          {labels.run(run.changeCount)}
        </span>
        <span className="min-w-0 shrink-999 truncate ps-1">
          <span aria-hidden>· </span>
          <RunTime at={run.at} nowMs={p.nowMs} />
        </span>
      </span>
      <span className="-me-2 flex shrink-0 items-center">
        {run.onView ? (
          <LineButton variant="ghost" onClick={run.onView}>
            {labels.view}
          </LineButton>
        ) : null}
        {reason ? (
          <>
            <span id={reasonId} hidden>
              {reason}
            </span>
            <Tooltip>
              <TooltipTrigger render={undoButton as React.ReactElement} />
              <TooltipContent>{reason}</TooltipContent>
            </Tooltip>
          </>
        ) : (
          undoButton
        )}
      </span>
    </li>
  );
}

function HistoryBlock({ p }: { p: ResolvedProps }) {
  const runs = p.runs ?? [];
  if (runs.length === 0) return null;
  return (
    <Block slot="agent-panel-history" title={p.labels.history}>
      <ul className="flex flex-col gap-0.5">
        {runs.map((run) => (
          <RunRow key={run.id} run={run} p={p} />
        ))}
      </ul>
    </Block>
  );
}

/** The ⋯ menu: View agent · Change agent · Stop · Remove — each only when its handler is set. */
function PanelMenu({ p }: { p: ResolvedProps }) {
  const { labels } = p;
  const canStop = p.onStop !== undefined && ACTIVE.has(p.state);
  const first = [
    p.onViewAgent ? (
      <DropdownMenuItem key="view" onClick={p.onViewAgent}>
        {labels.viewAgent}
      </DropdownMenuItem>
    ) : null,
    p.onChangeAgent ? (
      <DropdownMenuItem key="change" onClick={p.onChangeAgent}>
        {labels.changeAgent}
      </DropdownMenuItem>
    ) : null,
  ].filter(Boolean);
  const second = [
    canStop ? (
      <DropdownMenuItem key="stop" onClick={p.onStop}>
        {labels.stop}
      </DropdownMenuItem>
    ) : null,
    p.onRemove ? (
      <DropdownMenuItem key="remove" variant="destructive" onClick={p.onRemove}>
        {labels.remove}
      </DropdownMenuItem>
    ) : null,
  ].filter(Boolean);
  if (first.length + second.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            data-slot="agent-panel-menu"
            aria-label={labels.more(p.agent.name)}
            className="text-muted-foreground"
          />
        }
      >
        <Ellipsis aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {first.length ? <DropdownMenuGroup>{first}</DropdownMenuGroup> : null}
        {first.length && second.length ? <DropdownMenuSeparator /> : null}
        {second.length ? <DropdownMenuGroup>{second}</DropdownMenuGroup> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The one-line summary in the section's header: "◌ Working · 4 min · “Reading…”". */
function SectionSummary({ p }: { p: ResolvedProps }) {
  const { state } = p;
  const detail: React.ReactNode =
    state === "working" && p.progress != null ? (
      <q>{p.progress}</q>
    ) : state === "question" && p.question != null ? (
      <q>{p.question}</q>
    ) : null;
  return (
    <span
      data-slot="agent-panel-summary"
      className="min-w-0 flex-1 truncate text-start font-normal text-muted-foreground"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 align-[-0.125em] font-medium",
          TONE_TEXT[toneOf(state)],
          state === "working" && "text-foreground",
        )}
      >
        <AgentStateIcon state={state} />
        {stateTitle(p)}
      </span>
      <StateFacts p={{ ...p, summary: undefined, changeCount: undefined }} />
      {detail ? (
        <>
          <Dot />
          {detail}
        </>
      ) : null}
    </span>
  );
}

/** The data and callback props `AgentPanel` reads; everything else goes to its root element. */
const PANEL_KEYS = [
  "agent",
  "state",
  "startedAt",
  "progress",
  "queuedHint",
  "question",
  "choices",
  "onAnswer",
  "approval",
  "onApprove",
  "onDecline",
  "error",
  "onRetry",
  "blockedReason",
  "onReconnect",
  "finishedAt",
  "durationSeconds",
  "summary",
  "onMarkDone",
  "stoppedBy",
  "changeCount",
  "onDelegateAgain",
  "disconnected",
  "instructions",
  "onInstructionsChange",
  "latest",
  "latestTotal",
  "onShowAll",
  "onReply",
  "replyDisabledReason",
  "runs",
  "onViewAgent",
  "onChangeAgent",
  "onStop",
  "onRemove",
] as const satisfies readonly (keyof AgentPanelProps)[];

/** `rest` without the panel's own props: what the root element receives. */
function domProps(
  rest: Omit<
    AgentPanelProps,
    | "variant"
    | "labels"
    | "stateLabels"
    | "open"
    | "defaultOpen"
    | "onOpenChange"
    | "now"
    | "className"
  >,
): React.ComponentPropsWithRef<"div"> {
  const out: Record<string, unknown> = { ...rest };
  for (const key of PANEL_KEYS) delete out[key];
  return out as React.ComponentPropsWithRef<"div">;
}

/**
 * `AgentPanel` — the agent on a record: its bot, name and "Agent" label, "Acting for Priya · Read
 * & write" and a ⋯ menu (View agent · Change agent · Stop · Remove); the state line with its
 * actions; its Instructions (✎ for a viewer who may steer); Latest — its newest messages and
 * changes with "Show all"; a Reply box; and History — its runs with View and Undo. `state="none"`
 * renders nothing. A state change is announced politely. Put the card above Properties while it
 * needs you (`data-attention`).
 *
 * @example
 * <AgentPanel
 *   agent={{ name: "Claude Code", via: "Priya", access: "Read & write" }}
 *   state="working"
 *   startedAt={run.startedAt}
 *   progress="Reading the 3 linked pages…"
 *   instructions="Draft the proposal from M-15."
 *   onInstructionsChange={canSteer ? saveInstructions : undefined}
 *   latest={events}
 *   onShowAll={() => filterActivity(agent.id)}
 *   onReply={canSteer ? reply : undefined}
 *   runs={runs}
 *   onViewAgent={openAgent}
 *   onStop={canSteer ? stop : undefined}
 *   onRemove={canRemove ? remove : undefined}
 * />
 *
 * @example
 * <AgentPanel variant="section" agent={agent} state="question" question="Which price list — v2 or the client's?" choices={[{ value: "v2" }, { value: "Client's" }]} onAnswer={answer} onReply={reply} />
 */
export function AgentPanel({
  variant = "card",
  labels: labelsProp,
  stateLabels: stateLabelsProp,
  open: openProp,
  defaultOpen,
  onOpenChange,
  now,
  className,
  ...rest
}: AgentPanelProps) {
  const { agent, state, queuedHint, onStop } = rest;
  const props = domProps(rest);
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const stateLabels = { ...DEFAULT_STATE_LABELS, ...stateLabelsProp };
  const clock = useDateTimeNow();
  const nowMs = now ?? clock;
  const replyRef = React.useRef<HTMLTextAreaElement | null>(null);
  const { announce, Announcer } = useAnnouncer();

  // Announce a live change of state, never the state the panel mounted with.
  const message =
    state === "none" ? "" : labels.announce(agent.name, stateLabels[state]);
  const [announced, setAnnounced] = React.useState(state);
  React.useEffect(() => {
    if (announced === state) return;
    setAnnounced(state);
    if (message) announce(message);
  }, [announced, state, announce, message]);

  const finished = state === "done" || state === "stopped";
  const [openState, setOpenState] = React.useState(defaultOpen ?? !finished);
  // The section opens again when finished work comes back to life, and closes when it finishes.
  const [wasFinished, setWasFinished] = React.useState(finished);
  if (finished !== wasFinished) {
    setWasFinished(finished);
    setOpenState(!finished);
  }
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  if (state === "none") return <Announcer />;

  const p: ResolvedProps = {
    ...rest,
    labels,
    stateLabels,
    nowMs,
    focusReply: () => replyRef.current?.focus(),
  };
  const attention =
    state === "question" ||
    state === "approval" ||
    state === "blocked" ||
    state === "failed";

  const body = (
    <>
      <InstructionsBlock p={p} />
      <LatestBlock p={p} />
      <ReplyBox p={p} textareaRef={replyRef} />
      <HistoryBlock p={p} />
    </>
  );

  if (variant === "section") {
    // Queued and working say everything on the header line; the others keep their block below.
    const lineInHeader = state === "working" || state === "queued";
    return (
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        render={
          <div
            data-slot="agent-panel"
            data-variant="section"
            data-state={state}
            data-attention={attention ? "" : undefined}
            className={cn(
              "flex min-w-0 flex-col rounded-lg border border-border",
              className,
            )}
            {...props}
          />
        }
      >
        <div
          data-slot="agent-panel-header"
          className="flex min-h-9 min-w-0 items-center gap-1 px-1.5 py-1"
        >
          <h2 className="flex min-w-0 flex-1">
            <CollapsibleTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="group/agent-trigger h-7 min-w-0 flex-1 justify-start gap-1.5 px-1.5 text-sm aria-expanded:not-hover:bg-transparent"
                />
              }
            >
              <ChevronRight
                aria-hidden
                className="size-3.5 text-muted-foreground transition-transform group-aria-expanded/agent-trigger:rotate-90"
              />
              <span className="shrink-0">{labels.title}</span>
              <SectionSummary p={p} />
            </CollapsibleTrigger>
          </h2>
          {(state === "queued" || state === "working") && onStop ? (
            <LineButton onClick={onStop}>{labels.stop}</LineButton>
          ) : null}
          <PanelMenu p={p} />
        </div>
        {/* Kept mounted while closed, so a draft or a reply in flight survives collapsing. */}
        <CollapsibleContent
          keepMounted
          data-slot="agent-panel-content"
          className="flex min-w-0 flex-col gap-3 px-3 pt-1 pb-3"
        >
          <AgentIdentity agent={agent} labels={labels} />
          {lineInHeader ? (
            state === "queued" && queuedHint ? (
              <p className="text-xs text-muted-foreground">
                {labels.queuedHint(agent.name)}
              </p>
            ) : null
          ) : (
            <StateBlock p={p} />
          )}
          {body}
        </CollapsibleContent>
        <Announcer />
      </Collapsible>
    );
  }

  return (
    <RecordAsideCard
      data-slot="agent-panel"
      data-variant="card"
      data-state={state}
      data-attention={attention ? "" : undefined}
      className={className}
      {...props}
    >
      <RecordAsideSection title={labels.title} action={<PanelMenu p={p} />}>
        <div className="flex min-w-0 flex-col gap-3">
          <AgentIdentity agent={agent} labels={labels} />
          <StateBlock p={p} />
          {body}
        </div>
      </RecordAsideSection>
      <Announcer />
    </RecordAsideCard>
  );
}
