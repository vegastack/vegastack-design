// @vegastack agent-panel@0.57.3 sha256-OenZPPCVX+eIjmOY5v2OYzY1LFYb3jMcmKGRug7tnjE=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import {
  ArrowUp,
  Bot,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CirclePause,
  CircleX,
  Clock,
  Ellipsis,
  Hourglass,
  MessageSquare,
  Pencil,
  RefreshCw,
  Square,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { disclosureTriggerClasses } from "@/lib/disclosure-trigger";
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
  AgentShapeLayer,
  PersonAvatar,
  agentShapeStyle,
  agentShapeTarget,
  personAccessibleName,
  type Person,
} from "@/components/ui/person-avatar";
import {
  RecordAsideAction,
  RecordAsideCard,
} from "@/components/ui/record-aside";
import { SplitChip, SplitChipButton } from "@/components/ui/record-chip";
import {
  DateTime,
  RelativeTime,
  useDateTimeNow,
} from "@/components/ui/relative-time";
import { Spinner } from "@/components/ui/spinner";
import { FieldCounter } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * AgentPanel — an agent working on a record, as a collaborator: who it is and whom it acts for,
 * where it stands (queued, working, a question, an approval, failed, blocked, done, stopped) with
 * the one action that state needs, its instructions, its latest messages and changes, a
 * reply box, and its runs with View and Undo. One part, two shapes: the rail card on a record page
 * (`variant="card"`) and the collapsible section in a peek (`variant="section"`). Around it:
 *
 * - `AgentSlot` — the one-line Delegate property ("(bot) Claude Code ◌ Working"), its empty ghost
 *   ("Delegate to an agent…") and its muted reason when the viewer can't delegate.
 * - `AgentChip` — the same, as a pill in a peek's pill row or a phone's facts row.
 * - `AgentStateBadge` — the state as an icon and a word; `AgentStateRing` — the avatar ring for
 *   lists and boards (amber: needs you, red: failed).
 * - `AgentHoverCard` — the agent behind an avatar or a name: acting for, access, state, last action,
 *   Open agent. `AgentCard` is its body, for a `PersonHoverCardProvider`.
 *
 * Presentational: the host owns the delegation and passes its state, data and callbacks. Which
 * actions show is decided by the callbacks passed, so a viewer who can't steer gets the words only.
 * Every string comes in through `labels`, with English defaults.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Where a delegation stands. `none` — nothing is delegated (the panel renders nothing). Waiting:
 * `queued`, and `not-started` once it has waited past the host's promise. On it: `working`,
 * `quiet` (no update for a while), `question` and `approval` (it needs someone), `paused` (held,
 * with a reason) and `blocked` (it can't start). Over: `done`, `no-action` (done, nothing needed
 * doing), `failed` and `stopped`.
 */
export type AgentState =
  | "none"
  | "queued"
  | "not-started"
  | "working"
  | "quiet"
  | "question"
  | "approval"
  | "paused"
  | "failed"
  | "blocked"
  | "done"
  | "no-action"
  | "stopped";

/** The short word for each state, as badges, slots and chips write it. */
export type AgentStateLabels = Record<Exclude<AgentState, "none">, string>;

const DEFAULT_STATE_LABELS: AgentStateLabels = {
  queued: "Queued",
  "not-started": "Not started",
  working: "Working",
  quiet: "Quiet",
  question: "Needs you",
  approval: "Needs approval",
  paused: "Paused",
  blocked: "Can't start",
  failed: "Failed",
  done: "Done",
  "no-action": "No action needed",
  stopped: "Stopped",
};

/** The agent an `AgentPanel` shows: a `Person` drawn as an agent, plus its access. */
export interface AgentPanelAgent extends Pick<
  Person,
  "name" | "image" | "mark" | "hue"
> {
  /** The member it acts for: "Priya" reads "For Priya". @default undefined */
  for?: string | null;
  /** What it may do, in a few words: "Read & write". @default undefined */
  access?: string | null;
  /**
   * Where it runs, as the host names it ("claude.ai", "Cursor"): the panel's header reads "For
   * Priya · claude.ai". @default undefined
   */
  provider?: string | null;
}

type Tone = "muted" | "info" | "warning" | "destructive" | "success";

const STATE_TONE: Record<Exclude<AgentState, "none">, Tone> = {
  queued: "muted",
  "not-started": "warning",
  working: "info",
  quiet: "warning",
  question: "warning",
  approval: "warning",
  paused: "muted",
  blocked: "warning",
  failed: "destructive",
  done: "success",
  "no-action": "muted",
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
  "not-started",
  "working",
  "quiet",
  "question",
  "approval",
  "paused",
  "blocked",
]);

/** States the work is over in: "Agent since disconnected" may follow. */
const FINISHED: ReadonlySet<AgentState> = new Set([
  "done",
  "no-action",
  "failed",
  "stopped",
]);

/** States whose one action is Stop: on the status block, or a section's header. */
const STOPPABLE: ReadonlySet<AgentState> = new Set([
  "queued",
  "not-started",
  "working",
  "quiet",
]);

/** States that need someone: the avatar ring is amber for these, red for a failure. */
const NEEDS_SOMEONE: ReadonlySet<AgentState> = new Set([
  "question",
  "approval",
  "blocked",
  "failed",
]);

function toneOf(state: AgentState): Tone {
  return state === "none" ? "muted" : STATE_TONE[state];
}

/**
 * The state's glyph, always beside its word: a clock (waiting; amber once late), a spinner, an
 * hourglass (quiet), "!", a pause, ✕, ✓, a dash (no action) or ■.
 */
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
    case "not-started":
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
    case "quiet":
      return (
        <Hourglass aria-hidden data-slot="agent-state-icon" className={cls} />
      );
    case "question":
    case "approval":
    case "blocked":
      return (
        <CircleAlert aria-hidden data-slot="agent-state-icon" className={cls} />
      );
    case "paused":
      return (
        <CirclePause aria-hidden data-slot="agent-state-icon" className={cls} />
      );
    case "failed":
      return (
        <CircleX aria-hidden data-slot="agent-state-icon" className={cls} />
      );
    case "done":
      return (
        <CircleCheck aria-hidden data-slot="agent-state-icon" className={cls} />
      );
    case "no-action":
      return (
        <CircleMinus aria-hidden data-slot="agent-state-icon" className={cls} />
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
  return {
    name: agent.name,
    image: agent.image,
    mark: agent.mark,
    hue: agent.hue,
    kind: "agent" as const,
  };
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
  /**
   * Only the state's icon, with the word in a tooltip and for screen readers — for dense rows
   * where the word does not fit.
   * @default false
   */
  iconOnly?: boolean;
}

/**
 * `AgentStateBadge` — a delegation's state as its icon and word in the state's ink: ◷ Queued,
 * ◌ Working, ! Needs you (amber), ✕ Failed (red), ✓ Done (green), ■ Stopped. In a narrow row
 * the word gives way before the name beside it: it truncates, then drops out, leaving the icon
 * whole. `iconOnly` shows only the icon, with the word in a tooltip.
 *
 * @example <AgentStateBadge state="working" />
 * @example <AgentStateBadge state="question" iconOnly />
 */
export function AgentStateBadge({
  state,
  stateLabels,
  iconOnly = false,
  className,
  ...props
}: AgentStateBadgeProps) {
  if (state === "none") return null;
  const word = { ...DEFAULT_STATE_LABELS, ...stateLabels }[state];
  const badge = (
    <span
      data-slot="agent-state-badge"
      data-state={state}
      data-icon-only={iconOnly ? "" : undefined}
      className={cn(
        iconOnly
          ? "inline-flex shrink-0 items-center"
          : // In a row the word gives way first: it truncates down to about four characters,
            // then wraps onto a clipped second line, leaving the icon alone. The name beside it
            // only starts to truncate once the badge is down to its icon. `shrink-9999` (not
            // 999) keeps the name's share of the shrink under a layout unit, so it never shows
            // an ellipsis while the word still has room to give.
            "inline-flex h-lh min-w-3.5 shrink-9999 flex-wrap content-start items-center gap-x-1 overflow-hidden",
        TONE_TEXT[toneOf(state)],
        state === "working" && "text-foreground",
        className,
      )}
      {...props}
    >
      <AgentStateIcon state={state} />
      {iconOnly ? (
        <span className="sr-only">{word}</span>
      ) : (
        <span className="max-w-max min-w-[4ch] grow basis-[4ch] truncate">
          {word}
        </span>
      )}
    </span>
  );
  if (!iconOnly) return badge;
  return (
    <Tooltip>
      <TooltipTrigger render={badge} />
      <TooltipContent>{word}</TooltipContent>
    </Tooltip>
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
  /**
   * Badge a ringed state's icon ("!" needs you, ✕ failed) on the avatar's corner, so the state
   * isn't told by colour alone where its word can't sit beside it — a grid's narrow name cell.
   * Leave it off where an `AgentStateBadge` stands next to the avatar.
   * @default false
   */
  glyph?: boolean;
}

/**
 * `AgentStateRing` — wraps an agent's `PersonAvatar` in a list, a board card or a grid row header
 * with a ring for the states that need someone: amber while it needs you (a question, an approval,
 * a block), red when it failed. Other states draw no ring. Around an agent's hexagon the ring
 * follows the hexagon. The colour is never the only cue: the state is said to screen readers, and
 * the host shows its word where there is room, or badges the state's icon on the avatar (`glyph`).
 *
 * @example
 * <AgentStateRing state="question"><PersonAvatar person={{ name: "Claude Code", kind: "agent" }} /></AgentStateRing>
 * @example
 * <AgentStateRing state="failed" glyph><PersonAvatar person={{ name: "Codex", kind: "agent" }} size="2xs" /></AgentStateRing>
 */
export function AgentStateRing({
  state,
  srLabel = true,
  stateLabels,
  glyph = false,
  className,
  children,
  ...props
}: AgentStateRingProps) {
  // Only the states that need someone ring; an amber wait or a quiet spell is its icon's alone.
  const tone = NEEDS_SOMEONE.has(state) ? toneOf(state) : "muted";
  const badged = glyph && NEEDS_SOMEONE.has(state);
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
        badged && "relative",
        tone === "warning" && "ring-2 ring-warning",
        tone === "destructive" && "ring-2 ring-destructive",
        // An agent is a hexagon: its avatar draws the ring in its own shape, so a circle never
        // rings a hexagon.
        "has-data-[kind=agent]:ring-0",
        tone === "warning" &&
          "**:data-[kind=agent]:[--person-avatar-halo:var(--color-warning)]",
        tone === "destructive" &&
          "**:data-[kind=agent]:[--person-avatar-halo:var(--color-destructive)]",
        className,
      )}
      {...props}
    >
      {children}
      {badged ? (
        <span
          aria-hidden
          data-slot="agent-state-ring-glyph"
          className="absolute -end-1 -bottom-1 inline-flex rounded-full bg-background"
        >
          <AgentStateIcon state={state} className="size-2.5" />
        </span>
      ) : null}
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
 * `AgentSlot` — the Delegate property's value, on one line: the agent's hexagon, its name (which
 * gets the room and truncates last) and its state as an icon, with the word in its tooltip and
 * for screen readers. Empty, it is a ghost "Delegate to an agent…"; when
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
      <PersonAvatar person={asPerson(agent)} aria-hidden size="xs" />
      <span className="min-w-0 truncate">{agent.name}</span>
      {state !== "none" ? <span className="sr-only">, </span> : null}
      {/* The name gets the room; the state is its icon, the word in its tooltip (U3). */}
      <AgentStateBadge
        state={state}
        stateLabels={stateLabels}
        iconOnly
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
            <PersonAvatar person={asPerson(agent)} aria-hidden size="2xs" />
            <span className="min-w-0 truncate">{agent.name}</span>
            {word ? <span className="sr-only">, </span> : null}
            {word ? (
              <span
                className={cn(
                  // The word gives way before the name (shrink-9999), down to nothing.
                  "inline-flex min-w-0 shrink-9999 items-center gap-1 whitespace-nowrap",
                  TONE_TEXT[toneOf(state)],
                  state === "working" && "text-muted-foreground",
                )}
              >
                <span aria-hidden>·</span>
                <span className="min-w-0 truncate">{word}</span>
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
  /** The purple label after the name, when no `kindLabel` is given. */
  agent: string;
  /** "For Priya". */
  actingFor: (owner: string) => string;
  /** The link to the agent's page: "Open agent". */
  open: string;
  /** The avatar trigger's accessible name: "Claude Code for Priya, agent". */
  name: (agent: string, owner?: string | null) => string;
  /** The heading over `lastAction`. */
  lastAction: string;
}

const DEFAULT_HOVER_LABELS: AgentHoverCardLabels = {
  agent: "Agent",
  actingFor: (owner) => `For ${owner}`,
  open: "Open agent",
  name: (agent, owner) =>
    personAccessibleName({ name: agent, kind: "agent", for: owner }),
  lastAction: "Last action",
};

/** What the hover card says about the agent itself — its lanyard — beyond its name and state. */
export interface AgentLanyardProps {
  /**
   * What kind of agent it is, as a small outline badge after the name ("Custom", "Connected app",
   * "Built in"), in place of the purple "Agent" label. @default undefined
   */
  kindLabel?: string;
  /**
   * Whose it is, as the line under the name ("Asha Rao's agent", "Built in") — in place of "For
   * Priya · claude.ai · Read & write"; give those facts to `footer`. @default undefined
   */
  owner?: React.ReactNode;
  /** What it does, clamped to two lines. @default undefined */
  description?: React.ReactNode;
  /** More badges after the kind ("Managed by VegaStack"). @default undefined */
  badges?: React.ReactNode;
  /**
   * The technical facts — where it runs, how it signs in ("claude.ai · MCP · Access token") — in
   * a muted footer under a rule, so the card leads with the agent, not its plumbing.
   * @default undefined
   */
  footer?: React.ReactNode;
  /** The agent's page: "Open agent" is a link to it. @default undefined */
  href?: string;
  /**
   * The element the link renders — a router link such as `<Link href="" />`; `href` wins over the
   * template's.
   * @default <a />
   */
  linkRender?: React.ReactElement;
}

/** Props for `AgentCard`. */
export interface AgentCardProps extends AgentLanyardProps {
  /** The agent. */
  agent: AgentPanelAgent;
  /** Where its work on this record stands, shown under its access. @default undefined */
  state?: AgentState;
  /**
   * What it did or said last, under the state — its latest progress line ("Reading the 3 linked
   * pages…"), or why it stopped. Clamped to two lines. @default undefined
   */
  lastAction?: React.ReactNode;
  /**
   * Open the agent's page: "Open agent" shows when this or `href` is set (with `href`, it runs on
   * the link's click). @default undefined
   */
  onOpenAgent?: () => void;
  /** Replace any of the strings (`AgentHoverCardLabels`). @default undefined */
  labels?: Partial<AgentHoverCardLabels>;
  /** Replace any state word (`AgentStateLabels`). @default undefined */
  stateLabels?: Partial<AgentStateLabels>;
  /** Classes for the card. @default undefined */
  className?: string;
}

/**
 * `AgentCard` — the body of `AgentHoverCard`, the agent's lanyard: its hexagon and name with its
 * kind ("Custom") or the "Agent" label, whose it is ("Asha Rao's agent", else "For Priya ·
 * Read & write"), what it does, where its work on this record stands, what it did last, Open
 * agent, and the technical facts in a muted footer. Hand it to a `PersonHoverCardProvider` so an
 * agent's name in comments and activity opens the same card.
 *
 * @example
 * <AgentCard agent={{ name: "Claude Code", for: "Priya" }} state="working" lastAction="Reading the 3 linked pages…" />
 * @example
 * <AgentCard agent={agent} kindLabel="Connected app" owner="Asha Rao's agent" description="Works with Asha's access." footer="claude.ai · MCP" href="/agents/a1" />
 */
export function AgentCard({
  agent,
  state,
  lastAction,
  onOpenAgent,
  kindLabel,
  owner,
  description,
  badges,
  footer,
  href,
  linkRender,
  labels: labelsProp,
  stateLabels,
  className,
}: AgentCardProps) {
  const labels = { ...DEFAULT_HOVER_LABELS, ...labelsProp };
  const shown = (node: React.ReactNode) =>
    node != null && node !== false && node !== "";
  return (
    <div
      data-slot="agent-hover-card"
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      <AgentIdentity
        agent={agent}
        labels={labels}
        kindLabel={kindLabel}
        owner={owner}
        badges={badges}
      />
      {shown(description) ? (
        <p
          data-slot="agent-hover-card-description"
          className="line-clamp-2 text-sm wrap-anywhere text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {state && state !== "none" ? (
        <AgentStateBadge
          state={state}
          stateLabels={stateLabels}
          className="text-sm"
        />
      ) : null}
      {shown(lastAction) ? (
        <div
          data-slot="agent-hover-card-last-action"
          className="flex min-w-0 flex-col text-xs"
        >
          <span className="text-muted-foreground">{labels.lastAction}</span>
          <span className="line-clamp-2 wrap-anywhere text-foreground">
            {lastAction}
          </span>
        </div>
      ) : null}
      {href ? (
        React.cloneElement(
          linkRender ?? <a />,
          mergeProps((linkRender?.props ?? {}) as object, {
            href,
            "data-slot": "agent-hover-card-open",
            className: buttonVariants({
              variant: "link",
              size: "xs",
              className: "self-start px-0",
            }),
            onClick: onOpenAgent,
            children: (
              <>
                {labels.open}
                <ChevronRight aria-hidden data-icon="inline-end" />
              </>
            ),
          }) as object,
        )
      ) : onOpenAgent ? (
        <Button
          variant="link"
          size="xs"
          data-slot="agent-hover-card-open"
          className="self-start px-0"
          onClick={onOpenAgent}
        >
          {labels.open}
          <ChevronRight aria-hidden data-icon="inline-end" />
        </Button>
      ) : null}
      {shown(footer) ? (
        <div
          data-slot="agent-hover-card-footer"
          className="-mx-2.5 -mb-2.5 border-t px-2.5 py-1.5 text-xs wrap-anywhere text-muted-foreground"
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Props for `AgentHoverCard`. */
export interface AgentHoverCardProps extends AgentLanyardProps {
  /** The agent. */
  agent: AgentPanelAgent;
  /** Where its work on this record stands, shown under its access. @default undefined */
  state?: AgentState;
  /** What it did or said last, under the state (`AgentCard`'s `lastAction`). @default undefined */
  lastAction?: React.ReactNode;
  /** The trigger — the agent's `PersonAvatar` (`trigger="avatar"`) or its name (`trigger="name"`). */
  children: React.ReactNode;
  /**
   * `avatar` — the children sit in a ghost button in the agent's hexagon, named for the agent.
   * `name` — inline text (an activity's actor) in a quiet text button.
   * @default "avatar"
   */
  trigger?: "avatar" | "name";
  /**
   * Open the agent's page: "Open agent" shows when this or `href` is set (with `href`, it runs on
   * the link's click). @default undefined
   */
  onOpenAgent?: () => void;
  /** Replace any of the strings (`AgentHoverCardLabels`). @default undefined */
  labels?: Partial<AgentHoverCardLabels>;
  /** Replace any state word (`AgentStateLabels`). @default undefined */
  stateLabels?: Partial<AgentStateLabels>;
  /** Classes for the trigger button. @default undefined */
  className?: string;
}

/**
 * `AgentHoverCard` — hover or focus an agent's avatar or name (tap it on touch) for its lanyard:
 * its hexagon and name with its kind, whose it is, what it does, where its work on this record
 * stands, what it did last, Open agent, and the technical facts in a muted footer (`AgentCard`).
 * `PersonHoverCard` for an agent, with the agent's facts.
 *
 * @example
 * <AgentHoverCard agent={{ name: "Claude Code", for: "Priya", access: "Read & write" }} state="working" onOpenAgent={openAgent}>
 *   <PersonAvatar person={{ name: "Claude Code", kind: "agent" }} />
 * </AgentHoverCard>
 * @example
 * <AgentHoverCard agent={agent} kindLabel="Custom" owner="Asha Rao's agent" description={agent.description} href={`/agents/${agent.id}`}>
 *   <PersonAvatar person={agent} />
 * </AgentHoverCard>
 */
export function AgentHoverCard({
  agent,
  state,
  lastAction,
  children,
  trigger = "avatar",
  onOpenAgent,
  labels: labelsProp,
  stateLabels,
  className,
  ...lanyard
}: AgentHoverCardProps) {
  const labels = { ...DEFAULT_HOVER_LABELS, ...labelsProp };
  const [open, setOpen] = React.useState(false);
  const name = labels.name(agent.name, agent.for);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  // Focus opens the card; Enter then steps into it, so its link is reachable by keyboard.
  const press = (event: React.MouseEvent) => {
    const action =
      event.detail === 0 && open
        ? contentRef.current?.querySelector<HTMLElement>("a[href],button")
        : null;
    if (action) action.focus();
    else setOpen((o) => !o);
  };
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
              onClick={press}
            />
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              data-slot="agent-hover-card-avatar"
              aria-label={name}
              // The hover fill and focus tint follow the agent's hexagon, never a circle.
              style={agentShapeStyle}
              className={cn(agentShapeTarget, className)}
              onClick={press}
            />
          )
        }
      >
        {trigger === "avatar" ? <AgentShapeLayer /> : null}
        {children}
      </HoverCardTrigger>
      <HoverCardContent ref={contentRef} align="start" className="w-72 p-2.5">
        <AgentCard
          agent={agent}
          state={state}
          lastAction={lastAction}
          labels={labels}
          stateLabels={stateLabels}
          {...lanyard}
          onOpenAgent={
            onOpenAgent || lanyard.href
              ? () => {
                  setOpen(false);
                  onOpenAgent?.();
                }
              : undefined
          }
        />
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * The hexagon, the name with its kind (or "Agent"), and whose it is under it: the host's `owner`
 * line, else "For Priya · claude.ai · Read & write".
 */
function AgentIdentity({
  agent,
  labels,
  kindLabel,
  owner,
  badges,
}: {
  agent: AgentPanelAgent;
  labels: Pick<AgentHoverCardLabels, "agent" | "actingFor">;
} & Pick<AgentLanyardProps, "kindLabel" | "owner" | "badges">) {
  const hasOwner = owner != null && owner !== false && owner !== "";
  const facts = [
    agent.for ? labels.actingFor(agent.for) : null,
    agent.provider,
    agent.access,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div
      data-slot="agent-identity"
      className="flex min-w-0 items-center gap-2.5"
    >
      <PersonAvatar person={asPerson(agent)} aria-hidden size="lg" />
      <div className="flex min-w-0 flex-col">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-medium">
          <span className="wrap-anywhere">{agent.name}</span>
          {kindLabel ? (
            <Badge variant="outline" data-slot="agent-identity-kind">
              {kindLabel}
            </Badge>
          ) : (
            <PersonAgentLabel>{labels.agent}</PersonAgentLabel>
          )}
          {badges}
        </span>
        {hasOwner || facts ? (
          <span
            data-slot="agent-identity-facts"
            className="text-xs wrap-anywhere text-muted-foreground"
          >
            {hasOwner ? owner : facts}
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

/** One of the agent's runs on the record, under Runs. */
export interface AgentPanelRun {
  /** A stable key. */
  id: string;
  /** How many changes the run made. */
  changeCount: number;
  /**
   * What it changed, in a few words ("Status, Lines"): after the count, cut short before the
   * buttons are. @default undefined
   */
  summary?: string;
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
  /** The section's title (the peek); the rail card has none — its header is the agent. */
  title: string;
  /** The header's muted line: "For Priya". */
  forOwner: (owner: string) => string;
  /** The ⋯ menu's accessible name: "More actions for Claude Code". */
  more: (agent: string) => string;
  /** Menu: Change agent. */
  changeAgent: string;
  /** Menu and state line: Stop. */
  stop: string;
  /** Menu and the Failed line: Remove. */
  remove: string;
  /** The Queued sentence: "Waiting to start." */
  waiting: (agent: string) => string;
  /**
   * The Queued sentence once it has waited a while (`queuedHint={true}`): "Claude Code starts when
   * it next checks in." Hosts that know how the agent runs pass their own words as `queuedHint`.
   */
  queuedHint: (agent: string) => string;
  /** The Quiet sentence, given how long since its last update: "No update for 30 min." */
  noUpdate: (duration: string) => string;
  /** The Quiet sentence with no time to give. */
  noUpdateYet: string;
  /** Review (an approval decided elsewhere, such as an approval card). */
  review: string;
  /** Resume (paused). */
  resume: string;
  /** Give access (blocked because it can't see the record). */
  giveAccess: string;
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
  /** "Its 12 changes stay — undo them in Runs". */
  changesStay: (count: number) => string;
  /** The Stopped line's action. */
  delegateAgain: string;
  /** The sentence a finished card adds when its agent was disconnected since. */
  disconnected: (agent: string) => string;
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
  /** The runs' heading, and the compact line's word: "Runs". */
  history: string;
  /** A run's change count: "3 changes". */
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
  forOwner: (owner) => `For ${owner}`,
  more: (agent) => `More actions for ${agent}`,
  changeAgent: "Change agent",
  stop: "Stop",
  remove: "Remove",
  waiting: () => "Waiting to start.",
  queuedHint: (agent) => `${agent} starts when it next checks in.`,
  noUpdate: (duration) => `No update for ${duration}.`,
  noUpdateYet: "No update for a while.",
  review: "Review",
  resume: "Resume",
  giveAccess: "Give access",
  approve: "Approve",
  decline: "Decline",
  retry: "Retry",
  reconnect: "Reconnect",
  markDone: "Mark task done",
  stoppedBy: (person) => `Stopped by ${person}`,
  changesStay: (count) =>
    count === 1
      ? "Its 1 change stays — undo it in Runs"
      : `Its ${count} changes stay — undo them in Runs`,
  delegateAgain: "Delegate again",
  disconnected: (agent) => `${agent} has since been disconnected.`,
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
  history: "Runs",
  run: (n) => (n === 1 ? "1 change" : `${n} changes`),
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
   * a one-line summary; open unless the work is over (done, no action needed, stopped).
   * @default "card"
   */
  variant?: "card" | "section";
  /** The section's open state (controlled). @default undefined */
  open?: boolean;
  /** The section's initial open state. @default true, false once the work is over */
  defaultOpen?: boolean;
  /** Called when the section opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** When the agent started (working: "Working · 4 min"). @default undefined */
  startedAt?: Date | string | number;
  /** The agent's latest progress line while working ("Reading the 3 linked pages…"). @default undefined */
  progress?: React.ReactNode;
  /**
   * Queued a while (the host's 10 minutes): the Queued sentence becomes the hint. `true` uses
   * `labels.queuedHint`; a node is the host's own words for how this agent starts ("Claude checks
   * in every few minutes."). The design system holds no provider's vocabulary.
   * @default false
   */
  queuedHint?: boolean | React.ReactNode;
  /** The agent's open question (state `question`). @default undefined */
  question?: React.ReactNode;
  /**
   * Whom the open question waits on, for a viewer who may not answer it (state `question`): a
   * plain sentence ("Waiting on Priya to answer."), after the question's quoted words or alone
   * when the viewer isn't shown them. @default undefined
   */
  questionWait?: React.ReactNode;
  /** One-tap answers to the question. @default [] */
  choices?: readonly AgentPanelChoice[];
  /** Answer the question with a choice; the choice buttons show when set. @default undefined */
  onAnswer?: (value: string) => void;
  /** What the agent asks to do (state `approval`): "Move 3 tasks to Trash". @default undefined */
  approval?: React.ReactNode;
  /** Approve; shows when set. @default undefined */
  onApprove?: () => void;
  /**
   * Review the approval where it is decided (an approval card, a sheet): the Approval line's one
   * action when neither `onApprove` nor `onDecline` is set. @default undefined
   */
  onReview?: () => void;
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
  /**
   * Give the agent access to what it can't see (blocked) — pass it only to a viewer who can share;
   * the blocked line's action when `onReconnect` is not set. @default undefined
   */
  onGiveAccess?: () => void;
  /** When the agent last reported progress (quiet: "No update for 30 min."). @default undefined */
  lastUpdateAt?: Date | string | number;
  /** Why it is paused (state `paused`): "Reached its usage limit". @default undefined */
  pausedReason?: React.ReactNode;
  /**
   * What explains the reason (a Learn more link), after it and outside its quotes — states
   * `paused`, `failed` and `blocked`, when their words show. @default undefined
   */
  reasonHelp?: React.ReactNode;
  /** Resume (paused) — pass it only to a viewer who may. @default undefined */
  onResume?: () => void;
  /** When it finished (done) or was stopped (stopped). @default undefined */
  finishedAt?: Date | string | number;
  /** How long the run took (done), in seconds: "3 min". @default undefined */
  durationSeconds?: number;
  /** The agent's closing message (done, no-action): "Proposal drafted in P-42." @default undefined */
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
   * The agent was disconnected since: a finished, failed or stopped card adds "Claude Code was
   * disconnected since." to its sentence (with Reconnect when `onReconnect` is set and the state
   * has no other action) and never turns back into Needs you.
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
  /**
   * The most characters the instructions may hold while edited (`String.length` of the trimmed
   * text, as a server counts it). Nothing typed or pasted is cut: a `n/max` count shows under the
   * editor from 80% of it, and past it the count turns destructive, `instructionsMaxLengthMessage`
   * shows and Save waits.
   * @default undefined
   */
  instructionsMaxLength?: number;
  /**
   * What the instructions say while past `instructionsMaxLength`, given how many characters are
   * over — the host's words.
   * @default (excess) => `Remove ${excess} characters`
   */
  instructionsMaxLengthMessage?: (excess: number) => string;
  /** The agent's latest messages and changes, newest first; the first three show. @default [] */
  latest?: readonly AgentPanelEvent[];
  /**
   * Show Latest. Turn it off where the host page has its own Activity feed (a record page), so
   * the card doesn't repeat it; keep it in a peek, which has none.
   * @default true
   */
  showLatest?: boolean;
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
  /**
   * The most characters a reply may hold (`String.length` of the trimmed text, as a server counts
   * it). Nothing typed or pasted is cut: a `n/max` count shows under the box from 80% of it, and
   * past it the count turns destructive, `replyMaxLengthMessage` shows and Send waits.
   * @default undefined
   */
  replyMaxLength?: number;
  /**
   * What the reply box says while past `replyMaxLength`, given how many characters are over — the
   * host's words.
   * @default (excess) => `Remove ${excess} characters`
   */
  replyMaxLengthMessage?: (excess: number) => string;
  /** Why the reply box is disabled ("It's stopped"), shown under it. @default undefined */
  replyDisabledReason?: React.ReactNode;
  /** The agent's runs, newest first, under Runs. @default [] */
  runs?: readonly AgentPanelRun[];
  /**
   * `list` — Runs, a row per run. `line` — one compact Runs line for the newest run ("Runs · 3
   * changes · 2 hr ago · View · Undo"), for a page whose Activity feed lists the rest.
   * @default "list"
   */
  runsLayout?: "list" | "line";
  /** Menu: Open agent; shows when set. @default undefined */
  onOpenAgent?: () => void;
  /** Menu: Change agent; shows when set. @default undefined */
  onChangeAgent?: () => void;
  /**
   * Stop (the waiting and working states, a paused card with no Resume, and the menu while it is
   * on the work); shows when set. @default undefined
   */
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

/** What a box says past its limit when the host gave no words. */
const defaultExcessMessage = (excess: number) =>
  `Remove ${excess} ${excess === 1 ? "character" : "characters"}`;

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

/** The states whose sentence is a reason `reasonHelp` explains. */
const REASON_STATES: ReadonlySet<AgentState> = new Set([
  "paused",
  "failed",
  "blocked",
]);

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
  /** A section: Stop sits on the header, not the status block. */
  stopInHeader: boolean;
};

/** The short facts after the state word, as one inline run: " · 4 min", " · Oct 14 · 3 min". */
function StateFacts({ p }: { p: ResolvedProps }) {
  const { state, labels, nowMs } = p;
  const parts: React.ReactNode[] = [];
  if (state === "working" || state === "quiet") {
    if (p.startedAt != null && nowMs !== undefined)
      parts.push(
        labels.duration(Math.max(0, (nowMs - toMs(p.startedAt)) / 1000)),
      );
  }
  if (state === "done" || state === "no-action" || state === "stopped") {
    if (p.finishedAt != null)
      parts.push(
        <DateTime
          date={p.finishedAt}
          focusable={false}
          options={nowMs !== undefined ? { now: nowMs } : undefined}
        />,
      );
  }
  if ((state === "done" || state === "no-action") && p.durationSeconds != null)
    parts.push(labels.duration(p.durationSeconds));
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

/** The one sentence under the state word: what it waits on, says, asks, or why it stopped. */
function stateSentence(p: ResolvedProps): {
  slot: string;
  text: React.ReactNode;
} | null {
  const { state, labels, agent } = p;
  switch (state) {
    case "queued":
    case "not-started":
      return p.queuedHint
        ? {
            slot: "agent-panel-hint",
            text:
              p.queuedHint === true
                ? labels.queuedHint(agent.name)
                : p.queuedHint,
          }
        : { slot: "agent-panel-sentence", text: labels.waiting(agent.name) };
    case "working":
      return p.progress != null
        ? { slot: "agent-panel-progress", text: <q>{p.progress}</q> }
        : null;
    case "quiet":
      return {
        slot: "agent-panel-sentence",
        text:
          p.lastUpdateAt != null && p.nowMs !== undefined
            ? labels.noUpdate(
                labels.duration(
                  Math.max(0, (p.nowMs - toMs(p.lastUpdateAt)) / 1000),
                ),
              )
            : labels.noUpdateYet,
      };
    case "question": {
      const wait =
        p.questionWait != null ? (
          <span
            data-slot="agent-panel-question-wait"
            className="text-muted-foreground"
          >
            {p.questionWait}
          </span>
        ) : null;
      if (p.question != null)
        return {
          slot: "agent-panel-question",
          text: wait ? (
            <>
              <q>{p.question}</q> {wait}
            </>
          ) : (
            <q>{p.question}</q>
          ),
        };
      return wait ? { slot: "agent-panel-sentence", text: wait } : null;
    }
    case "approval":
      return p.approval != null
        ? { slot: "agent-panel-sentence", text: p.approval }
        : null;
    case "paused":
      return p.pausedReason != null
        ? { slot: "agent-panel-sentence", text: p.pausedReason }
        : null;
    case "failed":
      return p.error != null
        ? { slot: "agent-panel-sentence", text: <q>{p.error}</q> }
        : null;
    case "blocked":
      return p.blockedReason != null
        ? { slot: "agent-panel-sentence", text: p.blockedReason }
        : null;
    case "done":
    case "no-action":
      return p.summary != null
        ? { slot: "agent-panel-sentence", text: <q>{p.summary}</q> }
        : null;
    case "stopped":
      return p.changeCount != null && p.changeCount > 0
        ? {
            slot: "agent-panel-sentence",
            text: labels.changesStay(p.changeCount),
          }
        : null;
    default:
      return null;
  }
}

/** The state's word on the line: "Stopped by Priya", else the short word. */
function stateTitle(p: ResolvedProps): string {
  if (p.state === "none") return "";
  if (p.state === "stopped" && p.stoppedBy)
    return p.labels.stoppedBy(p.stoppedBy);
  return p.stateLabels[p.state];
}

/**
 * The state's one action — the next step it asks for (Stop, Review, Resume, Retry, Reconnect or
 * Give access, Mark task done, Delegate again), or an approval's Approve and Decline, which are
 * one decision. Everything else is in the ⋯ menu. The main action is secondary, Stop and Remove
 * outline (never primary in a card).
 */
function StateActions({ p }: { p: ResolvedProps }) {
  const { state, labels } = p;
  const disconnected = p.disconnected && FINISHED.has(state);
  const reconnect =
    disconnected && p.onReconnect ? (
      <LineButton key="reconnect" variant="secondary" onClick={p.onReconnect}>
        {labels.reconnect}
      </LineButton>
    ) : null;
  let buttons: React.ReactNode = null;
  if (STOPPABLE.has(state)) {
    // A section keeps Stop on its header, where it stays while collapsed.
    if (p.onStop && !p.stopInHeader)
      buttons = <LineButton onClick={p.onStop}>{labels.stop}</LineButton>;
  } else if (state === "approval" && (p.onApprove || p.onDecline))
    buttons = (
      <>
        {p.onApprove ? (
          <LineButton variant="secondary" onClick={p.onApprove}>
            {labels.approve}
          </LineButton>
        ) : null}
        {p.onDecline ? (
          <LineButton onClick={p.onDecline}>{labels.decline}</LineButton>
        ) : null}
      </>
    );
  else if (state === "approval" && p.onReview)
    buttons = (
      <LineButton variant="secondary" onClick={p.onReview}>
        {labels.review}
      </LineButton>
    );
  else if (state === "paused")
    buttons = p.onResume ? (
      <LineButton variant="secondary" onClick={p.onResume}>
        {labels.resume}
      </LineButton>
    ) : p.onStop ? (
      <LineButton onClick={p.onStop}>{labels.stop}</LineButton>
    ) : null;
  else if (state === "failed")
    buttons = p.onRetry ? (
      <LineButton variant="secondary" onClick={p.onRetry}>
        {labels.retry}
      </LineButton>
    ) : (
      (reconnect ??
      (p.onRemove ? (
        <LineButton onClick={p.onRemove}>{labels.remove}</LineButton>
      ) : null))
    );
  else if (state === "blocked")
    buttons = p.onReconnect ? (
      <LineButton variant="secondary" onClick={p.onReconnect}>
        {labels.reconnect}
      </LineButton>
    ) : p.onGiveAccess ? (
      <LineButton variant="secondary" onClick={p.onGiveAccess}>
        {labels.giveAccess}
      </LineButton>
    ) : p.onRemove ? (
      <LineButton onClick={p.onRemove}>{labels.remove}</LineButton>
    ) : null;
  else if (state === "done")
    buttons = p.onMarkDone ? (
      <LineButton variant="secondary" onClick={p.onMarkDone}>
        {labels.markDone}
      </LineButton>
    ) : (
      reconnect
    );
  else if (state === "no-action") buttons = reconnect;
  else if (state === "stopped")
    buttons = p.onDelegateAgain ? (
      <LineButton variant="secondary" onClick={p.onDelegateAgain}>
        {labels.delegateAgain}
      </LineButton>
    ) : (
      reconnect
    );
  if (!buttons) return null;
  return (
    <div
      data-slot="agent-panel-state-actions"
      className="col-start-2 flex flex-wrap items-center gap-1.5 pt-0.5"
    >
      {buttons}
    </div>
  );
}

/**
 * The status block: the state's icon and word (with its short facts) on the first line, then one
 * sentence and at most one action, all in the word's inset.
 */
function StateBlock({ p }: { p: ResolvedProps }) {
  const { state, labels } = p;
  const tone = toneOf(state);
  const question = state === "question";
  const sentence = stateSentence(p);
  const disconnected = p.disconnected && FINISHED.has(state);
  return (
    <div
      data-slot="agent-panel-state"
      data-state={state}
      className={cn(
        "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1.5 gap-y-1 text-sm",
        // A question or an approval sits on the warning tint: it is what the card is for now.
        (question || state === "approval") &&
          "rounded-md border border-warning/30 bg-warning/5 p-2 dark:bg-warning/10",
      )}
    >
      <span className="flex h-5 items-center">
        <AgentStateIcon state={state} />
      </span>
      <p data-slot="agent-panel-state-line" className="min-w-0 wrap-anywhere">
        <span
          className={cn(
            "font-medium",
            TONE_TEXT[tone],
            state === "working" && "text-foreground",
          )}
        >
          {stateTitle(p)}
        </span>
        <span className="text-muted-foreground">
          <StateFacts p={p} />
        </span>
      </p>
      {sentence || disconnected ? (
        <p
          data-slot={sentence?.slot ?? "agent-panel-sentence"}
          className={cn(
            "col-start-2 min-w-0 wrap-anywhere",
            question ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {sentence?.text}
          {sentence && p.reasonHelp != null && REASON_STATES.has(state) ? (
            <> {p.reasonHelp}</>
          ) : null}
          {sentence && disconnected ? " " : null}
          {disconnected ? (
            <span data-slot="agent-panel-disconnected">
              {labels.disconnected(p.agent.name)}
            </span>
          ) : null}
        </p>
      ) : null}
      {question &&
      ((p.onAnswer && (p.choices?.length ?? 0) > 0) || p.onReply) ? (
        <div
          data-slot="agent-panel-choices"
          className="col-start-2 flex flex-wrap items-center gap-1.5 pt-0.5"
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
    </div>
  );
}

/**
 * The rail card's header: the agent's avatar, its name (which gets the room and truncates last) and
 * one muted line, "For Priya · claude.ai", with the ⋯ menu at the end. No "Agent" title or label:
 * the avatar already says it is one.
 */
function PanelIdentity({
  p,
  action,
  heading = false,
}: {
  p: ResolvedProps;
  action?: React.ReactNode;
  /** The name is the card's heading (the rail card); the section's header is its own. */
  heading?: boolean;
}) {
  const Name = heading ? "h2" : "span";
  const { agent, labels } = p;
  const facts = [agent.for ? labels.forOwner(agent.for) : null, agent.provider]
    .filter(Boolean)
    .join(" · ");
  return (
    <div
      data-slot="agent-panel-header"
      className="flex min-w-0 items-center gap-2.5"
    >
      <PersonAvatar person={asPerson(agent)} aria-hidden size="default" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Name
          data-slot="agent-panel-name"
          className="min-w-0 truncate text-sm font-medium"
        >
          {agent.name}
        </Name>
        {facts ? (
          <span
            data-slot="agent-panel-facts"
            className="min-w-0 truncate text-xs text-muted-foreground"
          >
            {facts}
          </span>
        ) : null}
      </div>
      {action}
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
  const counterId = React.useId();
  const max = p.instructionsMaxLength;
  const nearLimit = max !== undefined && draft.length >= max * 0.8;
  // Past the limit (instructions saved before it, or a lowered limit): Save waits for a shorter text.
  const overLimit = max !== undefined && draft.trim().length > max;
  const errorId = React.useId();
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
    if (!p.onInstructionsChange || savingRef.current || overLimit) return;
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
            aria-describedby={
              [nearLimit ? counterId : null, overLimit ? errorId : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={overLimit || undefined}
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
                (event.metaKey || event.ctrlKey) &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault();
                void save();
              }
            }}
            className="min-h-16 text-sm"
          />
          {overLimit ? (
            <p
              id={errorId}
              data-slot="agent-panel-instructions-error"
              className="text-xs text-destructive-text"
            >
              {(p.instructionsMaxLengthMessage ?? defaultExcessMessage)(
                draft.trim().length - max!,
              )}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-1.5">
            {max !== undefined ? (
              <FieldCounter
                id={counterId}
                data-slot="agent-panel-instructions-counter"
                value={draft.trim()}
                maxLength={max}
                className="me-auto ms-0"
              />
            ) : null}
            <LineButton variant="ghost" disabled={saving} onClick={close}>
              {labels.cancel}
            </LineButton>
            <LineButton
              variant="default"
              disabled={saving || overLimit}
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
  if (p.showLatest === false || items.length === 0) return null;
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
  const counterId = React.useId();
  const errorId = React.useId();
  if (!p.onReply) return null;
  const max = p.replyMaxLength;
  const nearLimit = max !== undefined && text.length >= max * 0.8;
  const overLimit = max !== undefined && text.trim().length > max;
  const disabled = p.replyDisabledReason != null;
  const send = async () => {
    const sent = text;
    const value = sent.trim();
    if (!value || disabled || sendingRef.current || !p.onReply) return;
    if (max !== undefined && value.length > max) return;
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
          aria-describedby={
            [
              disabled ? reasonId : null,
              nearLimit ? counterId : null,
              overLimit ? errorId : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={overLimit || undefined}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey) &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
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
            disabled={disabled || sending || text.trim() === "" || overLimit}
            onClick={() => void send()}
          >
            <ArrowUp aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {max !== undefined ? (
        <FieldCounter
          id={counterId}
          data-slot="agent-panel-reply-counter"
          value={text.trim()}
          maxLength={max}
          className="self-end"
        />
      ) : null}
      {overLimit ? (
        <p
          id={errorId}
          data-slot="agent-panel-reply-error"
          className="text-xs text-destructive-text"
        >
          {(p.replyMaxLengthMessage ?? defaultExcessMessage)(
            text.trim().length - max!,
          )}
        </p>
      ) : null}
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

/**
 * A run's words on one line: an optional lead ("Runs"), its count — which never truncates — and its
 * time. The line is one row high and wraps: when the time doesn't fit, it (and its dot) moves onto
 * the clipped second row, whole, instead of showing a lone "·…".
 */
function RunFacts({
  lead,
  count,
  summary,
  children,
}: {
  lead?: string;
  count: string;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex h-5 min-w-0 grow basis-0 flex-wrap items-baseline gap-x-1 overflow-hidden text-muted-foreground">
      {/* The lead, the count and what changed hold the first line: what changed is cut short
          (never the count); the time, with its dot, drops out whole before it is. */}
      <span className="flex max-w-full min-w-0 items-baseline gap-x-1">
        {lead ? (
          <span className="shrink-0 font-medium whitespace-nowrap">
            {lead}
            <span aria-hidden> ·</span>
          </span>
        ) : null}
        <span className="shrink-0 whitespace-nowrap text-foreground">
          {count}
        </span>
        {summary ? (
          <>
            <span aria-hidden className="shrink-0">
              ·
            </span>
            {/* Cut short, it shows whole on hover, focus or a tap (`TruncatedText`). */}
            <TruncatedText
              data-slot="agent-panel-run-summary"
              className="min-w-0"
            >
              {summary}
            </TruncatedText>
          </>
        ) : null}
      </span>
      <span className="shrink-0 whitespace-nowrap">
        <span aria-hidden>· </span>
        {children}
      </span>
    </span>
  );
}

/** One run: "3 changes · Status, Lines · 10:42", View, Undo (disabled with its reason when it can't). */
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
      {/* One line, the buttons always whole: the count never truncates; the time, with its dot,
          drops out whole (it wraps onto the clipped second line) before anything is cut. */}
      <RunFacts count={labels.run(run.changeCount)} summary={run.summary}>
        <RunTime at={run.at} nowMs={p.nowMs} />
      </RunFacts>
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

/** The compact Runs line: "Runs · 3 changes · 2h ago", View, Undo — the newest run only. */
function RunsLine({ run, p }: { run: AgentPanelRun; p: ResolvedProps }) {
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
    <div
      data-slot="agent-panel-runs-line"
      className="flex min-w-0 items-center justify-between gap-x-2 text-sm"
    >
      <RunFacts
        lead={labels.history}
        count={labels.run(run.changeCount)}
        summary={run.summary}
      >
        <RelativeTime
          date={run.at}
          now={p.nowMs}
          focusable={false}
          aria-live="off"
          className="tabular-nums"
        />
      </RunFacts>
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
    </div>
  );
}

function HistoryBlock({ p }: { p: ResolvedProps }) {
  const runs = p.runs ?? [];
  if (runs.length === 0) return null;
  if (p.runsLayout === "line") return <RunsLine run={runs[0]!} p={p} />;
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

/** The ⋯ menu: Open agent · Change agent · Stop · Remove — each only when its handler is set. */
function PanelMenu({ p }: { p: ResolvedProps }) {
  const { labels } = p;
  const canStop = p.onStop !== undefined && ACTIVE.has(p.state);
  const first = [
    p.onOpenAgent ? (
      <DropdownMenuItem key="open" onClick={p.onOpenAgent}>
        {labels.open}
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
  // Working says everything on the line; the other states keep their sentence in the body.
  const detail: React.ReactNode =
    state === "working" || state === "question"
      ? (stateSentence(p)?.text ?? null)
      : null;
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
      <StateFacts p={p} />
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
  "onReview",
  "onDecline",
  "error",
  "onRetry",
  "blockedReason",
  "onReconnect",
  "onGiveAccess",
  "lastUpdateAt",
  "pausedReason",
  "reasonHelp",
  "questionWait",
  "onResume",
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
  "instructionsMaxLength",
  "instructionsMaxLengthMessage",
  "latest",
  "latestTotal",
  "showLatest",
  "onShowAll",
  "onReply",
  "replyMaxLength",
  "replyMaxLengthMessage",
  "replyDisabledReason",
  "runs",
  "runsLayout",
  "onOpenAgent",
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
 * `AgentPanel` — the agent on a record: a header with its avatar, its name and one muted line ("For
 * Priya · claude.ai") and a ⋯ menu (Open agent · Change agent · Stop · Remove); one status block —
 * the state's icon and word, one sentence and at most one action; its Instructions (✎ for a viewer
 * who may steer); Latest — its newest messages and changes with "Show all" (`showLatest={false}`
 * where the page has its own Activity feed); a Reply box; and Runs — its runs with View and Undo
 * (`runsLayout="line"` for one compact Runs line). `state="none"` renders nothing. A state change is announced politely. Put the card above Properties while it
 * needs you (`data-attention`).
 *
 * @example
 * <AgentPanel
 *   agent={{ name: "Claude Code", for: "Priya", provider: "claude.ai" }}
 *   state="working"
 *   startedAt={run.startedAt}
 *   progress="Reading the 3 linked pages…"
 *   instructions="Draft the proposal from M-15."
 *   onInstructionsChange={canSteer ? saveInstructions : undefined}
 *   latest={events}
 *   onShowAll={() => filterActivity(agent.id)}
 *   onReply={canSteer ? reply : undefined}
 *   runs={runs}
 *   onOpenAgent={openAgent}
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
  const { agent, state, onStop } = rest;
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

  const finished =
    state === "done" || state === "no-action" || state === "stopped";
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
    stopInHeader: variant === "section",
  };
  const attention = NEEDS_SOMEONE.has(state);

  const body = (
    <>
      <InstructionsBlock p={p} />
      <LatestBlock p={p} />
      <ReplyBox p={p} textareaRef={replyRef} />
      <HistoryBlock p={p} />
    </>
  );

  if (variant === "section") {
    // Working says everything on the header line; the others keep their block below.
    const lineInHeader = state === "working";
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
                  className={cn(
                    "group/agent-trigger h-7 min-w-0 flex-1 justify-start gap-1.5 px-1.5 text-sm",
                    disclosureTriggerClasses,
                  )}
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
          {STOPPABLE.has(state) && onStop ? (
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
          <PanelIdentity p={p} />
          {lineInHeader ? null : <StateBlock p={p} />}
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
      <div className="flex min-w-0 flex-col gap-3">
        <PanelIdentity p={p} heading action={<PanelMenu p={p} />} />
        <StateBlock p={p} />
        {body}
      </div>
      <Announcer />
    </RecordAsideCard>
  );
}
