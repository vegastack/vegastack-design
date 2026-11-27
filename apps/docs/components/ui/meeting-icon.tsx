// @vegastack meeting-icon@0.136.7 sha256-Cedt822NodoeDBjD1ix0r6F/VB95qId6ugndVUkJJGs=

import * as React from "react";
import {
  CircleDot,
  Pause,
  Play,
  Square,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Spinner } from "@/components/ui/spinner";

/**
 * The statuses in which a meeting is still being recorded or processed: its icon is the loading
 * `Spinner` until the run finishes.
 */
export const MEETING_LIVE_STATUSES = [
  "recording",
  "uploading",
  "uploaded",
  "transcribing",
  "processing",
] as const;

/** Which glyph a meeting shows: one voice, several voices, or still recording or processing. */
export type MeetingIconKind = "person" | "group" | "live";

/** What decides a meeting's icon: its status and how many voices its speaker map holds. */
export interface MeetingIconInput {
  /** The meeting's status ("recording", "processed" …); unknown statuses count as finished. */
  status?: string | null;
  /** How many speakers the meeting has; `null` or absent while nobody has mapped them. */
  speakerCount?: number | null;
}

/**
 * The one rule for a meeting's icon: `live` while it records or is processed
 * (`MEETING_LIVE_STATUSES`), `person` with exactly one speaker, otherwise `group` (two or more,
 * or not known yet).
 *
 * @example
 * meetingIconKind({ status: "processed", speakerCount: 1 }); // "person"
 */
export function meetingIconKind({
  status,
  speakerCount,
}: MeetingIconInput): MeetingIconKind {
  if (status && (MEETING_LIVE_STATUSES as readonly string[]).includes(status))
    return "live";
  return speakerCount === 1 ? "person" : "group";
}

/** Props accepted by `MeetingIcon`. */
export interface MeetingIconProps
  extends Omit<React.ComponentProps<"svg">, "children">, MeetingIconInput {
  /**
   * Accessible label. Omitted, the icon is decorative (`aria-hidden`): a meeting's title beside it
   * already says what it is. Pass one ("Recording") where the icon stands alone.
   * @default undefined
   */
  label?: string;
}

/**
 * `MeetingIcon` — a meeting's icon wherever it shows, mixed lists included: a single person
 * (`UserRound`) for one speaker, a group (`UsersRound`) for two or more or while unknown, and the
 * app's loading `Spinner` while the meeting records or is processed (`meetingIconKind`). It sizes
 * like any lucide icon (`size-4` by default) and inherits the text colour.
 *
 * Server-safe and presentational. Forwards its ref to the `<svg>`.
 *
 * @example
 * <MeetingIcon status={meeting.status} speakerCount={meeting.speakerCount} />
 *
 * @example
 * <MeetingIcon status="recording" label="Recording" className="size-5" />
 */
export function MeetingIcon({
  status,
  speakerCount,
  label,
  className,
  ref,
  ...props
}: MeetingIconProps) {
  const kind = meetingIconKind({ status, speakerCount });
  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : {
        role: undefined,
        "aria-label": undefined,
        "aria-hidden": true as const,
      };
  if (kind === "live") {
    return (
      <Spinner
        ref={ref}
        data-slot="meeting-icon"
        data-kind={kind}
        className={cn("shrink-0", className)}
        {...props}
        {...a11y}
      />
    );
  }
  const Icon = kind === "person" ? UserRound : UsersRound;
  return (
    <Icon
      ref={ref}
      data-slot="meeting-icon"
      data-kind={kind}
      className={cn("size-4 shrink-0", className)}
      {...props}
      {...a11y}
    />
  );
}

/** A recording control: start, pause, resume or stop. */
export type RecordingAction = "start" | "pause" | "resume" | "stop";

/**
 * The words and glyph of each recording control. `label` is the sentence-case name every control,
 * button, tooltip and list uses; `menuLabel` is its Title Case form, for macOS menus (the menu
 * bar, the menu bar icon's menu) only. Start's glyph is the record dot (`CircleDot`); the
 * microphone is only ever voice input.
 */
export const RECORDING_ACTIONS: Record<
  RecordingAction,
  { label: string; menuLabel: string; icon: LucideIcon }
> = {
  start: {
    label: "Start recording",
    menuLabel: "Start Recording",
    icon: CircleDot,
  },
  pause: {
    label: "Pause recording",
    menuLabel: "Pause Recording",
    icon: Pause,
  },
  resume: {
    label: "Resume recording",
    menuLabel: "Resume Recording",
    icon: Play,
  },
  stop: { label: "Stop recording", menuLabel: "Stop Recording", icon: Square },
};

/** Props accepted by `RecordingActionIcon`. */
export interface RecordingActionIconProps extends Omit<
  React.ComponentProps<"svg">,
  "children"
> {
  /** Which control the glyph is for. */
  action: RecordingAction;
}

/**
 * `RecordingActionIcon` — the glyph of a recording control (`RECORDING_ACTIONS`): the record dot
 * in the destructive ink for Start, pause, play and stop for the rest. Decorative: the control's
 * own label names it.
 *
 * @example
 * <Button variant="outline">
 *   <RecordingActionIcon action="start" />
 *   {RECORDING_ACTIONS.start.label}
 * </Button>
 */
export function RecordingActionIcon({
  action,
  className,
  ref,
  ...props
}: RecordingActionIconProps) {
  const Icon = RECORDING_ACTIONS[action].icon;
  return (
    <Icon
      ref={ref}
      aria-hidden
      data-slot="recording-action-icon"
      data-action={action}
      className={cn(action === "start" && "text-destructive-text", className)}
      {...props}
    />
  );
}
