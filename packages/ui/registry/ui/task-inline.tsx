// @vegastack task-inline@0.25.89 sha256-/GvJjZzez230BBg3MX2K6ZV31zwy8XpNuhxoFwY1ZpE=

"use client";

import * as React from "react";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { cn } from "@vegastack/design";
import type { AvatarHue } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PersonAvatar } from "@/components/ui/person-avatar";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";

/* ------------------------------------------------------------------------------------------------
 * TaskInline — a task in running text: a checklist line linked to a task (TextEdit, MarkdownView)
 * or a task named in a sentence. ONE box, the task's own done state; the title, which opens the
 * task where the host shows it (a peek); the assignee's avatar and the due date after it; and ↗ on
 * hover for the task's own page. It replaces the "two boxes" a linked line used to draw (the
 * line's checkbox and the mention chip's task glyph beside it).
 *
 * MakeTaskPopover — making that task: a popover anchored to the line (never a modal), the line's
 * text as the title, the host's own assignee, due and space pickers in slots, and Create.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Who a `TaskInline` is assigned to: a person, or a member's agent.
 *
 * @example
 * const assignee: TaskInlinePerson = { name: "Asha Rao", hue: "blue" };
 */
export interface TaskInlinePerson {
  /** Their name: the avatar's initials and its accessible name. */
  name: string;
  /** Their photo. @default undefined */
  image?: string | null;
  /** Their colour behind the initials. @default undefined */
  hue?: AvatarHue | null;
  /** A member's agent draws the agent avatar. @default "person" */
  kind?: "person" | "agent";
}

/**
 * Props for `TaskInline`.
 *
 * @example
 * <TaskInline title="Order glass" done={false} onToggle={setDone} onOpen={peek} />
 */
export interface TaskInlineProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "title" | "onToggle" | "children"
> {
  /** The task's title. */
  title: React.ReactNode;
  /**
   * Whether the task is done: the box's state, and a muted title.
   * @default false
   */
  done?: boolean;
  /**
   * Closed without being done (canceled, a duplicate): the title struck through.
   * @default false
   */
  struck?: boolean;
  /**
   * A small tag after the title ("Canceled", "In review").
   * @default undefined
   */
  status?: string;
  /**
   * Who it is assigned to: their avatar after the title.
   * @default undefined
   */
  assignee?: TaskInlinePerson | null;
  /**
   * When it is due, as the host words it ("Fri 31 Oct", "Tomorrow"): a small date chip.
   * @default undefined
   */
  due?: string | null;
  /**
   * The due date has passed: the chip takes the destructive ink.
   * @default false
   */
  overdue?: boolean;
  /**
   * Draw the task's checkbox. Off where the box is the host's own (a checklist line's).
   * @default true
   */
  checkbox?: boolean;
  /**
   * The box was ticked or unticked. Without it the box shows the state and cannot change it.
   * @default undefined
   */
  onToggle?: (done: boolean) => void;
  /**
   * The title was clicked (or Enter on it): open the task where the host shows it — a peek.
   * Without it the title is plain text.
   * @default undefined
   */
  onOpen?: () => void;
  /**
   * The task's own page: a ↗ link at the end, shown while the task is hovered or holds focus.
   * @default undefined
   */
  href?: string | null;
  /**
   * The ↗ link's accessible name.
   * @default "Open task page"
   */
  openLabel?: string;
  /**
   * The checkbox's accessible name, by its state.
   * @default (done) => done ? "Mark task not done" : "Mark task done"
   */
  toggleLabel?: (done: boolean) => string;
  /**
   * The due chip's accessible prefix.
   * @default "Due"
   */
  dueLabel?: string;
  /**
   * The avatar's accessible prefix.
   * @default "Assigned to"
   */
  assigneeLabel?: string;
}

const defaultToggleLabel = (done: boolean) =>
  done ? "Mark task not done" : "Mark task done";

/** The meta items after the title: inline boxes on the text's middle, so a line wraps around them. */
const META = "ms-1.5 inline-flex items-center gap-1 align-middle";

/**
 * `TaskInline` — a task in running text: one box (the task's done state), the title (opens the
 * task on a click: the host's peek), the assignee's avatar, a due chip, and ↗ to the task's page
 * on hover. An inline box: it wraps with the line it sits in, at that line's size.
 *
 * @example
 * <TaskInline
 *   title="Order glass for block B"
 *   assignee={{ name: "Asha Rao", hue: "blue" }}
 *   due="Fri 31 Oct"
 *   onToggle={(done) => setTask(id, done)}
 *   onOpen={() => openPeek(id)}
 *   href={`/tasks/${id}`}
 * />
 */
export function TaskInline({
  title,
  done = false,
  struck = false,
  status,
  assignee,
  due,
  overdue = false,
  checkbox = true,
  onToggle,
  onOpen,
  href,
  openLabel = "Open task page",
  toggleLabel = defaultToggleLabel,
  dueLabel = "Due",
  assigneeLabel = "Assigned to",
  className,
  ...props
}: TaskInlineProps) {
  const titleClass = cn(
    "rounded-sm decoration-muted-foreground/50 underline-offset-2",
    done && "text-muted-foreground",
    struck && "text-muted-foreground line-through",
  );
  return (
    <span
      data-slot="task-inline"
      data-done={done ? "" : undefined}
      data-struck={struck ? "" : undefined}
      className={cn("group/task-inline inline", className)}
      {...props}
    >
      {checkbox ? (
        <Checkbox
          shape="circle"
          checked={done}
          disabled={!onToggle}
          onCheckedChange={(next) => onToggle?.(next === true)}
          aria-label={toggleLabel(done)}
          className="me-1.5 inline-flex align-middle data-disabled:cursor-default data-disabled:opacity-100"
        />
      ) : null}
      {onOpen ? (
        // An inline button (as `InlineChip`'s): a `<button>` would break the line's wrapping.
        <span
          role="button"
          tabIndex={0}
          data-slot="task-inline-title"
          // A press on the title opens the task and nothing else: no caret is placed and no
          // editor around it starts an edit.
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen();
            }
          }}
          className={cn(
            titleClass,
            // A 28px tall hit area around the line-high title (WCAG 2.5.8), as `InlineChip`'s.
            "relative cursor-pointer before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] hover:underline",
          )}
        >
          {title}
        </span>
      ) : (
        <span data-slot="task-inline-title" className={titleClass}>
          {title}
        </span>
      )}
      {status ? (
        <span
          data-slot="task-inline-status"
          className={cn(META, "text-xs text-muted-foreground")}
        >
          {status}
        </span>
      ) : null}
      {assignee ? (
        <span
          data-slot="task-inline-assignee"
          role="img"
          aria-label={`${assigneeLabel} ${assignee.name}`}
          className={META}
        >
          <PersonAvatar
            person={{
              name: assignee.name,
              image: assignee.image,
              hue: assignee.hue,
              kind: assignee.kind === "agent" ? "agent" : undefined,
            }}
            aria-hidden
            className="size-4"
          />
        </span>
      ) : null}
      {due ? (
        <span
          data-slot="task-inline-due"
          data-overdue={overdue ? "" : undefined}
          className={cn(
            META,
            "rounded-sm bg-muted px-1 text-xs whitespace-nowrap text-muted-foreground",
            overdue && "bg-destructive/10 text-destructive-text",
          )}
        >
          <CalendarDays aria-hidden className="size-3" />
          <span className="sr-only">{dueLabel} </span>
          {due}
        </span>
      ) : null}
      {href ? (
        <a
          data-slot="task-inline-open"
          href={href}
          aria-label={openLabel}
          onMouseDown={(event) => event.stopPropagation()}
          contentEditable={false}
          title={openLabel}
          className={cn(
            "ms-1.5 rounded-sm align-middle text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            // Visually hidden — still a tab stop — until the task is hovered or holds focus: out of
            // the way of the line below when the line wraps, and never a stray target on touch.
            "sr-only group-focus-within/task-inline:not-sr-only group-hover/task-inline:not-sr-only focus-visible:not-sr-only",
          )}
        >
          {/* The 24px box, drawn once the link shows. */}
          <span className="inline-flex size-6 items-center justify-center">
            <ArrowUpRight aria-hidden className="size-3.5" />
          </span>
        </a>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MakeTaskPopover
 * ----------------------------------------------------------------------------------------------*/

/**
 * A line `MakeTaskPopover` makes a task of: its key (TextEdit's `TextEditTaskItem.key`) and its
 * text, the suggested title.
 *
 * @example
 * const line: MakeTaskLine = { key: "b1", text: "Order glass" };
 */
export interface MakeTaskLine {
  /** The line's key, handed back in `onCreate`. */
  key: string;
  /** The line's text: the title it starts with. */
  text: string;
}

/**
 * Props for `MakeTaskPopover`.
 *
 * @example
 * <MakeTaskPopover open={!!lines} onOpenChange={close} anchor={line} lines={lines} onCreate={make} />
 */
export interface MakeTaskPopoverProps {
  /** Whether the popover is open. */
  open: boolean;
  /** Asked to open or close (Escape, a click outside, Cancel, after Create). */
  onOpenChange: (open: boolean) => void;
  /**
   * The element it points at — the first line (TextEdit's `onMakeTask` hands it over). It follows
   * the element while the page scrolls; without one it sits at the top of the window.
   */
  anchor: Element | null;
  /** The lines to make tasks of: one title each, each line kept or skipped (several). */
  lines: readonly MakeTaskLine[];
  /**
   * Create was chosen: the kept lines with their titles (trimmed, never empty). Return a promise to
   * hold the popover busy until it settles; it stays open if the promise rejects.
   */
  onCreate: (lines: { key: string; title: string }[]) => void | Promise<void>;
  /**
   * The host's assignee picker, one for every task made.
   * @default undefined
   */
  assignee?: React.ReactNode;
  /**
   * The host's due date picker.
   * @default undefined
   */
  due?: React.ReactNode;
  /**
   * The host's space picker.
   * @default undefined
   */
  space?: React.ReactNode;
  /**
   * The heading.
   * @default lines.length > 1 ? `Make ${n} tasks` : "Make a task"
   */
  title?: string;
  /**
   * The Create button's text.
   * @default lines.length > 1 ? `Create ${kept} tasks` : "Create task"
   */
  createLabel?: string;
  /**
   * The Cancel button's text.
   * @default "Cancel"
   */
  cancelLabel?: string;
}

interface Row {
  key: string;
  title: string;
  keep: boolean;
}

/** Follow `anchor`'s bottom-left while open: the 0×0 anchor the popover points at, kept on it. */
function useAnchorPoint(anchor: Element | null, open: boolean) {
  const [point, setPoint] = React.useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  React.useLayoutEffect(() => {
    if (!open || !anchor) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = anchor.getBoundingClientRect();
        setPoint((now) =>
          now.left === rect.left && now.top === rect.bottom
            ? now
            : { left: rect.left, top: rect.bottom },
        );
      });
    };
    const rect = anchor.getBoundingClientRect();
    setPoint({ left: rect.left, top: rect.bottom });
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [anchor, open]);
  return point;
}

/**
 * `MakeTaskPopover` — make a task of a checklist line, in place: a popover anchored to the line
 * with the line's text as the title (each line with a keep box when several), the host's assignee,
 * due and space pickers in one row, and Create. Enter in a title creates; Escape closes.
 *
 * @example
 * <MakeTaskPopover
 *   open={pending !== null}
 *   onOpenChange={(open) => !open && setPending(null)}
 *   anchor={pending?.anchor ?? null}
 *   lines={pending?.items ?? []}
 *   assignee={<PeoplePicker … />}
 *   due={<DatePicker … />}
 *   onCreate={async (lines) => linkTaskItems(await createTasks(lines))}
 * />
 */
export function MakeTaskPopover({
  open,
  onOpenChange,
  anchor,
  lines,
  onCreate,
  assignee,
  due,
  space,
  title,
  createLabel,
  cancelLabel = "Cancel",
}: MakeTaskPopoverProps) {
  const point = useAnchorPoint(anchor, open);
  const [rows, setRows] = React.useState<Row[]>([]);
  // One session per opening and set of lines (by value): a host re-rendering with equal lines —
  // its picker changed — keeps the titles being edited.
  const session = open
    ? lines.map((line) => `${line.key}\u0000${line.text}`).join("\u0001")
    : null;
  const [shown, setShown] = React.useState<string | null>(null);
  if (session !== shown) {
    setShown(session);
    if (session !== null)
      setRows(
        lines.map((line) => ({
          key: line.key,
          title: line.text.trim(),
          keep: true,
        })),
      );
  }
  const [pending, setPending] = React.useState(false);
  const several = lines.length > 1;
  const kept = rows.filter((row) => row.keep && row.title.trim() !== "");
  const heading =
    title ?? (several ? `Make ${lines.length} tasks` : "Make a task");
  const create =
    createLabel ??
    (several
      ? `Create ${kept.length} ${kept.length === 1 ? "task" : "tasks"}`
      : "Create task");
  const titleId = React.useId();

  const submit = async () => {
    if (kept.length === 0 || pending) return;
    setPending(true);
    try {
      await onCreate(
        kept.map((row) => ({ key: row.key, title: row.title.trim() })),
      );
      onOpenChange(false);
    } catch {
      // Left open: the host says why (a toast); Create can be tried again.
    } finally {
      setPending(false);
    }
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };
  const slots = [assignee, due, space].filter(
    (slot) => slot !== undefined && slot !== null,
  );

  return (
    <Popover open={open} onOpenChange={(next) => onOpenChange(next)}>
      <PopoverAnchor
        data-slot="make-task-popover-anchor"
        className="fixed"
        style={{ left: point.left, top: point.top }}
      />
      <PopoverContent
        data-slot="make-task-popover"
        align="start"
        size="md"
        aria-labelledby={titleId}
        className="gap-3"
      >
        <PopoverHeader>
          <PopoverTitle id={titleId}>{heading}</PopoverTitle>
        </PopoverHeader>
        {several ? (
          <ul data-slot="make-task-popover-lines" className="grid gap-1.5">
            {rows.map((row, index) => (
              <li
                key={row.key}
                data-slot="make-task-popover-line"
                className="flex items-center gap-2"
              >
                <Checkbox
                  aria-label={`Make a task of line ${index + 1}`}
                  checked={row.keep}
                  onCheckedChange={(keep) =>
                    setRows((now) =>
                      now.map((each) =>
                        each.key === row.key
                          ? { ...each, keep: keep === true }
                          : each,
                      ),
                    )
                  }
                />
                <Input
                  aria-label={`Title of task ${index + 1}`}
                  value={row.title}
                  disabled={!row.keep}
                  onKeyDown={onKeyDown}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setRows((now) =>
                      now.map((each) =>
                        each.key === row.key ? { ...each, title: value } : each,
                      ),
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <Input
            data-slot="make-task-popover-title"
            aria-label="Task title"
            value={rows[0]?.title ?? ""}
            onKeyDown={onKeyDown}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setRows((now) =>
                now.map((each, index) =>
                  index === 0 ? { ...each, title: value } : each,
                ),
              );
            }}
          />
        )}
        {slots.length > 0 ? (
          <div
            data-slot="make-task-popover-fields"
            className="flex flex-wrap items-center gap-1.5"
          >
            {assignee}
            {due}
            {space}
          </div>
        ) : null}
        <div
          data-slot="make-task-popover-actions"
          className="flex justify-end gap-2"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={kept.length === 0}
            onClick={() => void submit()}
          >
            {create}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
