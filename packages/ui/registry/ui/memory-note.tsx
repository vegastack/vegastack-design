// @vegastack memory-note@0.69.0 sha256-MSmvCb4Rxb3BoNpjAUU/NMuHeepRf2DfUcokzipSsPg=

"use client";

import * as React from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  CircleAlert,
  Eraser,
  Lightbulb,
  PencilLine,
} from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/* ------------------------------------------------------------------------------------------------
 * MemoryNote — one quiet line under a chat message saying what an agent did with memory:
 * "Remembered in Personal memory: you write to customers informally", with text actions at the
 * row's end (Undo · Edit · Why?). A suggestion is the one tone with a filled action, Keep. Settled
 * states swap the actions for a muted outcome in the same box, so the row never jumps. The words
 * of the lead are the component's own, per tone; the notebook, the line and the outcome are the
 * host's. In a list (`compact`) it drops its icon and chrome.
 * ----------------------------------------------------------------------------------------------*/

/** What happened, or would happen, to a memory line. */
export type MemoryNoteTone =
  | "remembered"
  | "updated"
  | "suggested"
  | "forgot"
  | "would"
  | "queued"
  | "failed";

/** Where the note's actions stand. */
export type MemoryNoteState =
  "idle" | "busy" | "undone" | "kept" | "dismissed" | "edited";

/** Every tone, in display order. */
export const MEMORY_NOTE_TONES = [
  "remembered",
  "updated",
  "suggested",
  "forgot",
  "would",
  "queued",
  "failed",
] as const satisfies readonly MemoryNoteTone[];

/** Props accepted by `MemoryNote`. */
export interface MemoryNoteProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** What happened: sets the lead words, the icon and which actions show. */
  tone: MemoryNoteTone;
  /** The notebook's name, as the reader knows it: "Personal memory", "Sales memory". */
  notebook: string;
  /** The line as saved (at most 160 characters). Wraps; never cut. */
  line: string;
  /** For `updated`: the old line, shown muted as "(was …)". @default undefined */
  before?: string;
  /** Where it came from, a muted suffix: "from an email". @default undefined */
  source?: string;
  /**
   * `busy` — an action is running: the actions hold still, disabled, behind a spinner. `undone`,
   * `kept`, `dismissed` and `edited` — settled: the actions give way to a muted outcome, and
   * `undone` strikes the line through.
   * @default "idle"
   */
  state?: MemoryNoteState;
  /** Undo the save or the forget. Shows on `remembered`, `updated` and `forgot`. @default undefined */
  onUndo?: () => void;
  /** Edit the line. Shows on `remembered`, `updated` and `suggested`. @default undefined */
  onEdit?: () => void;
  /** Explain why it was saved. Shows on `remembered`, `updated`, `suggested` and `forgot`. @default undefined */
  onWhy?: () => void;
  /** Keep a suggestion: the one filled action. Shows on `suggested`. @default undefined */
  onKeep?: () => void;
  /** Dismiss a suggestion. Shows on `suggested`. @default undefined */
  onDismiss?: () => void;
  /** Open the notebook. Shows on every tone but `would` and `queued`. @default undefined */
  onOpen?: () => void;
  /** Try the save again. Shows on `failed`. @default undefined */
  onRetry?: () => void;
  /** Replaces the actions with a muted line: "Suggested for Sales: waiting for a reviewer". @default undefined */
  note?: string;
  /** The settled words, in place of the default per state: "Kept by Priya". @default undefined */
  outcome?: string;
  /** For lists: no icon, no border, tighter. @default false */
  compact?: boolean;
}

type ActionKey =
  "keep" | "undo" | "edit" | "dismiss" | "why" | "retry" | "open";

const ACTIONS: Record<MemoryNoteTone, readonly ActionKey[]> = {
  remembered: ["undo", "edit", "why", "open"],
  updated: ["undo", "edit", "why", "open"],
  suggested: ["keep", "edit", "dismiss", "why", "open"],
  forgot: ["undo", "why", "open"],
  would: [],
  queued: [],
  failed: ["retry", "open"],
};

const LABEL: Record<ActionKey, string> = {
  keep: "Keep",
  undo: "Undo",
  edit: "Edit",
  dismiss: "Dismiss",
  why: "Why?",
  retry: "Retry",
  open: "Open",
};

const SETTLED: Partial<Record<MemoryNoteState, string>> = {
  undone: "Undone",
  kept: "Kept",
  dismissed: "Dismissed",
  edited: "Edited",
};

const ICON: Record<
  Exclude<MemoryNoteTone, "queued">,
  { Icon: typeof BookmarkCheck; className: string }
> = {
  remembered: { Icon: BookmarkCheck, className: "text-success-text" },
  updated: { Icon: PencilLine, className: "text-success-text" },
  suggested: { Icon: Lightbulb, className: "text-info-text" },
  forgot: { Icon: Eraser, className: "text-muted-foreground" },
  would: { Icon: BookmarkPlus, className: "text-muted-foreground" },
  failed: { Icon: CircleAlert, className: "text-destructive-text" },
};

function leadFor(tone: MemoryNoteTone, notebook: string): string {
  switch (tone) {
    case "remembered":
      return `Remembered in ${notebook}:`;
    case "updated":
      return `Updated ${notebook}:`;
    case "suggested":
      return `Suggested for ${notebook}:`;
    case "forgot":
      return `Forgot from ${notebook}:`;
    case "would":
      return `Would remember in ${notebook}:`;
    case "queued":
      return `Saving to ${notebook}…`;
    case "failed":
      return `Couldn't save to ${notebook}.`;
  }
}

/**
 * `MemoryNote` — what an agent remembered, updated, suggested or forgot, as one quiet row under a
 * chat message, with Undo, Edit and Why? at its end. Pass a handler to show its action.
 *
 * @example
 * <MemoryNote
 *   tone="remembered"
 *   notebook="Personal memory"
 *   line="You write to customers informally, first names"
 *   onUndo={undo}
 *   onEdit={edit}
 *   onWhy={why}
 * />
 *
 * @example
 * // a suggestion: Keep is the one filled action
 * <MemoryNote tone="suggested" notebook="Sales memory" line="Quotes go out in INR" onKeep={keep} onDismiss={dismiss} />
 */
export function MemoryNote({
  tone,
  notebook,
  line,
  before,
  source,
  state = "idle",
  onUndo,
  onEdit,
  onWhy,
  onKeep,
  onDismiss,
  onOpen,
  onRetry,
  note,
  outcome,
  compact = false,
  className,
  ...props
}: MemoryNoteProps) {
  const lineId = React.useId();
  const lead = leadFor(tone, notebook);
  const leadName = lead.replace(/[:.…]$/, "");
  const busy = state === "busy";
  const settled = SETTLED[state];
  const muted = tone === "would";
  const undone = state === "undone";

  const handlers: Record<ActionKey, (() => void) | undefined> = {
    keep: onKeep,
    undo: onUndo,
    edit: onEdit,
    dismiss: onDismiss,
    why: onWhy,
    retry: onRetry,
    open: onOpen,
  };
  const actions = ACTIONS[tone].filter((key) => handlers[key]);

  const sentence = [
    `${lead} ${line}`,
    tone === "updated" && before ? `(was ${before})` : null,
    source ? `· ${source}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  let end: React.ReactNode = null;
  if (settled) {
    end = (
      <span
        data-slot="memory-note-outcome"
        className="inline-flex min-h-6 items-center text-muted-foreground"
      >
        {outcome ?? settled}
      </span>
    );
  } else if (note) {
    end = (
      <span
        data-slot="memory-note-note"
        className="inline-flex min-h-6 items-center text-muted-foreground wrap-anywhere"
      >
        {note}
      </span>
    );
  } else if (actions.length) {
    end = (
      <span
        data-slot="memory-note-actions"
        className="inline-flex min-h-6 shrink-0 items-center gap-1.5 whitespace-nowrap"
      >
        {busy ? (
          <Spinner
            data-slot="memory-note-spinner"
            aria-label="Working"
            className="size-3.5 text-muted-foreground"
          />
        ) : null}
        {actions.map((key, index) => {
          const filled = key === "keep";
          const prev = actions[index - 1];
          return (
            <React.Fragment key={key}>
              {index > 0 && !filled && prev !== "keep" ? (
                <span aria-hidden className="text-muted-foreground">
                  ·
                </span>
              ) : null}
              <Button
                variant={filled ? "default" : "link"}
                size="xs"
                data-action={key}
                disabled={busy}
                aria-label={`${LABEL[key]}: ${leadName}`}
                aria-describedby={lineId}
                onClick={handlers[key]}
                className={cn(
                  !filled && "px-0 text-sm",
                  !filled &&
                    (key === "retry"
                      ? "text-destructive-text"
                      : "text-muted-foreground hover:text-foreground"),
                )}
              >
                {LABEL[key]}
              </Button>
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  const icon = compact ? null : tone === "queued" ? (
    <Spinner
      data-slot="memory-note-icon"
      aria-label="Saving"
      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
    />
  ) : (
    (() => {
      const { Icon, className: ink } = ICON[tone];
      return (
        <Icon
          aria-hidden
          data-slot="memory-note-icon"
          className={cn("mt-0.5 size-4 shrink-0", ink)}
        />
      );
    })()
  );

  return (
    <div
      data-slot="memory-note"
      data-tone={tone}
      data-state={state}
      data-compact={compact ? "" : undefined}
      role="group"
      aria-label={sentence}
      aria-busy={busy || tone === "queued" || undefined}
      className={cn(
        "flex w-full min-w-0 flex-wrap items-start gap-x-3 gap-y-1 text-sm",
        compact ? "py-0.5" : "rounded-md border border-border px-2.5 py-1.5",
        className,
      )}
      {...props}
    >
      <p
        data-slot="memory-note-text"
        className="flex min-w-0 flex-1 basis-64 items-start gap-2 py-0.5"
      >
        {icon}
        <span
          className={cn(
            "min-w-0 wrap-anywhere",
            muted ? "text-muted-foreground" : "text-foreground",
          )}
        >
          <span
            data-slot="memory-note-lead"
            className={cn(
              "font-medium",
              tone === "failed" && "text-destructive-text",
            )}
          >
            {lead}
          </span>{" "}
          <span
            id={lineId}
            data-slot="memory-note-line"
            className={cn(
              (tone === "failed" || tone === "queued") &&
                "text-muted-foreground",
              undone && "text-muted-foreground line-through",
            )}
          >
            {line}
          </span>
          {tone === "updated" && before ? (
            <span
              data-slot="memory-note-before"
              className="text-muted-foreground"
            >
              {" "}
              (was {before})
            </span>
          ) : null}
          {source ? (
            <span
              data-slot="memory-note-source"
              className="text-muted-foreground"
            >
              {" "}
              · {source}
            </span>
          ) : null}
        </span>
      </p>
      {end ? (
        <div className="ms-auto flex min-w-0 items-start">{end}</div>
      ) : null}
    </div>
  );
}
