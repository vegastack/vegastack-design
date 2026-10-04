// @vegastack comments@0.23.122 sha256-tTHi32bGP9KUfZCh6PcGCePJ4WvmvyeroVUzfzdJFPY=

"use client";

import * as React from "react";
import { DEFAULT_LOCALE, dayDelta, formatDate } from "@/lib/date-time";
import {
  ArrowUp,
  Bot,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Ellipsis,
  Link,
  Paperclip,
  Pencil,
  Reply,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Attachment } from "@/components/ui/attachment";
import type { FileViewerItem } from "@/components/ui/file-viewer";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownView } from "@/components/ui/markdown-view";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import { PersonHoverCard } from "@/components/ui/person-hover-card";
import {
  ReactionAdd,
  Reactions,
  type ReactionData,
} from "@/components/ui/reactions";
import { PersonBadge } from "@/components/ui/searchable-select";
import {
  RelativeTime,
  useDateTimeNow,
  useTimeZone,
} from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TEXT_EDIT_COMPACT_SLASH_COMMANDS,
  ImageViewerScope,
  TextEdit,
  type TextEditHandle,
  type TextEditProps,
} from "@/components/ui/text-edit";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/components/ui/use-media-query";

/* ------------------------------------------------------------------------------------------------
 * Comments — a record's discussion, Linear-style. `CommentThread` is one card: the first comment,
 * "Show N more replies", the replies (indented under the name) as rows split by hairlines, and a
 * flat reply row at the foot with the viewer's avatar. `CommentItem` is one comment: avatar, name,
 * relative time, "(edited)", hover actions (add reaction, a ⋯ menu with Reply / Copy link / Copy
 * text / Edit / Delete), in-place editing with ✕ / ✓ in the header, files and reaction pills under
 * the body. `CommentComposer` is a bordered card: the text on top and a toolbar row (attach, a
 * round ↑ send) under it; Cmd/Ctrl+Enter sends and files drop onto it. `CommentList` is the
 * section: "Comments N", an Oldest / Newest first toggle, day dividers, "Load earlier", and the
 * composer at the end (at the top while newest first). The parts hold only transient UI state —
 * the host owns the data and persists through callbacks; a callback that returns a promise drives
 * the saving/posting state and, on rejection, the error.
 * ----------------------------------------------------------------------------------------------*/

/** One comment, as `CommentList` and `CommentItem` show it. */
export interface CommentData {
  /** Stable id; the item's anchor is `comment-<id>`. */
  id: string;
  /** Who wrote it — name, image and a status `badge` such as "Inactive". */
  author: Person;
  /** The body, in Markdown. Ignored once `deleted`. */
  body: string;
  /** When it was posted. */
  createdAt: Date | string | number;
  /** When it was last edited; shows "(edited)" with this time on hover. @default undefined */
  editedAt?: Date | string | number | null;
  /** Soft-deleted: its author and time stay over "This comment was deleted" (hide it yourself when it has no replies). @default false */
  deleted?: boolean;
  /** The viewer may edit it (the menu shows Edit). @default false */
  canEdit?: boolean;
  /** The viewer may delete it (the menu shows Delete). @default false */
  canDelete?: boolean;
  /**
   * Written by an agent (an AI assistant, an automation): a violet bar at the row's start, a bot
   * avatar when it has no image, and an "Agent" label after the name. @default false
   */
  agent?: boolean;
  /** Emoji reactions, shown as pills under the body. @default undefined */
  reactions?: ReactionData[];
}

/** The send/save shortcut as the viewer's keyboard names it (a tooltip renders only on the client). */
const submitShortcut = () =>
  typeof navigator !== "undefined" &&
  /Mac|iP(hone|ad|od)/.test(navigator.platform)
    ? "⌘↵"
    : "Ctrl+Enter";

/** A callback that may persist asynchronously; a rejected promise shows its message. */
type MaybeAsync<T extends unknown[]> = (...args: T) => void | Promise<unknown>;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * A 40px touch target around a 24px control on a coarse pointer, without growing the control (or
 * the row) itself.
 */
const TOUCH_TARGET =
  "pointer-coarse:after:absolute pointer-coarse:after:-inset-2 pointer-coarse:after:rounded-full";

/** A comment's avatar (and the reply row's): 20px, as Linear's. */
const AVATAR = "data-[size=sm]:size-5";

/** The hover actions (add reaction, ⋯): shown on hover or focus inside the comment, while their
 * popup is open, and always on a coarse pointer, where there is no hover. */
const HOVER_ACTION =
  "opacity-0 transition-opacity duration-150 group-hover/comment:opacity-100 group-focus-within/comment:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100";

/* ------------------------------------------------------------------------------------------------
 * CommentItem
 * ----------------------------------------------------------------------------------------------*/

/** Props for `CommentItem`. */
export interface CommentItemProps {
  /** The comment. */
  comment: CommentData;
  /**
   * `root` — the body runs the row's full width under the avatar; `reply` — the body is indented
   * to the name. A comment inside a `comment-replies` list reads as a reply either way.
   * @default "root"
   */
  variant?: "root" | "reply";
  /** Save an edit: called with the comment's id and the new Markdown. @default undefined */
  onEdit?: MaybeAsync<[id: string, body: string]>;
  /** Delete at once (no confirm dialog — the host offers Undo, e.g. in a toast). @default undefined */
  onDelete?: MaybeAsync<[id: string]>;
  /** Copy a link to the comment; the menu shows Copy link when set. @default undefined */
  onCopyLink?: (id: string) => void;
  /** Copy the comment's Markdown; the menu shows Copy text when set. @default undefined */
  onCopyText?: (id: string, body: string) => void;
  /**
   * Start a reply (focus the thread's reply box); the menu shows Reply on a touch screen, where
   * the box may be off screen. @default undefined
   */
  onReply?: () => void;
  /**
   * Add or remove the viewer's reaction; enables the pills and the add-reaction hover action.
   * May return a promise. @default undefined
   */
  onReactionToggle?: MaybeAsync<[id: string, emoji: string]>;
  /** Tint the comment — it was opened from its `#comment-<id>` link. @default false */
  highlighted?: boolean;
  /** Start in editing mode (controlled when `onEditingChange` is set). @default undefined */
  editing?: boolean;
  /** Called when editing starts or ends. @default undefined */
  onEditingChange?: (editing: boolean) => void;
  /**
   * The edit box's starting text whenever editing starts — on mount in editing mode, or from the
   * ⋯ menu's Edit — so an unsaved edit the host retained comes back. Save stays enabled while it
   * differs from the body. Pass `undefined` (clear the draft on the `null` from
   * `onEditValueChange`) to start from the body.
   * @default comment.body
   */
  editDefaultValue?: string;
  /**
   * Called with the comment's id and the edit box's text on every change while editing, and with
   * `null` when editing ends (the save succeeded, or Cancel/Escape) — e.g. to guard an unsaved
   * edit. @default undefined
   */
  onEditValueChange?: (commentId: string, value: string | null) => void;
  /** Replies, under the comment (one level of `CommentItem`s, each split by a hairline). @default undefined */
  replies?: React.ReactNode;
  /** Pin the relative time's clock (docs, tests). @default undefined */
  now?: number;
  /**
   * Under the body — the comment's files, e.g. an `AttachmentGroup layout="list"`.
   * @default undefined
   */
  attachments?: React.ReactNode;
  /** `@` mentions in the edit box (see `TextEdit`'s `mentions`). @default undefined */
  mentions?: TextEditProps["mentions"];
  /** Where a mention chip in the body links (see `MarkdownView`'s `mentionHref`). @default undefined */
  mentionHref?: TextEditProps["mentionHref"];
  /** A person mention's avatar URL (see `MarkdownView`'s `mentionImage`). @default undefined */
  mentionImage?: TextEditProps["mentionImage"];
  /** A file chip's content type by href (see `MarkdownView`'s `fileContentType`). @default undefined */
  fileContentType?: TextEditProps["fileContentType"];
  /** Classes for the item. @default undefined */
  className?: string;
}

/**
 * `CommentItem` — one comment: a header row (avatar, name and badge, relative time, "(edited)")
 * with hover actions at its end (add reaction, and a ⋯ menu — Reply on a touch screen, Copy link,
 * Copy text, Edit, Delete — for what the viewer may do), then the Markdown body, its files and its
 * reaction pills. Edit turns the body into a compact box and the header actions into ✕ Cancel and
 * ✓ Save (disabled while empty or unchanged); Cmd/Ctrl+Enter saves and Escape cancels. Delete is
 * immediate — the host offers Undo.
 *
 * @example
 * <CommentItem comment={c} onEdit={save} onDelete={remove} onCopyLink={copy}
 *   onReactionToggle={(id, emoji) => toggle(id, emoji)} />
 */
export function CommentItem({
  comment,
  variant = "root",
  onEdit,
  onDelete,
  onCopyLink,
  onCopyText,
  onReply,
  onReactionToggle,
  highlighted = false,
  editing: editingProp,
  onEditingChange,
  editDefaultValue,
  onEditValueChange,
  replies,
  now,
  attachments,
  mentions,
  mentionHref,
  mentionImage,
  fileContentType,
  className,
}: CommentItemProps) {
  const [editingState, setEditingState] = React.useState(editingProp ?? false);
  const canEditThis = !!onEdit && !!comment.canEdit && !comment.deleted;
  const editingRequested = onEditingChange ? !!editingProp : editingState;
  const editing = canEditThis && editingRequested;
  React.useEffect(() => {
    if (!canEditThis && editingRequested) {
      setEditingState(false);
      onEditingChange?.(false);
    }
  }, [canEditThis, editingRequested, onEditingChange]);
  const setEditing = (next: boolean) => {
    setEditingState(next);
    onEditingChange?.(next);
  };
  const [saving, setSaving] = React.useState(false);
  // What the edit box opens with: the host's retained draft (`editDefaultValue`) when it has one,
  // else the body — decided each time editing starts, however it starts.
  const [editStart, setEditStart] = React.useState(
    () => editDefaultValue ?? comment.body,
  );
  const [draft, setDraft] = React.useState(editStart);
  const [wasEditing, setWasEditing] = React.useState(editing);
  if (editing !== wasEditing) {
    setWasEditing(editing);
    if (editing) {
      const start = editDefaultValue ?? comment.body;
      setEditStart(start);
      setDraft(start);
    }
  }
  const [error, setError] = React.useState<string | null>(null);
  // Reply sits in the menu on a touch screen only; with a mouse the reply box is right there.
  const coarse = useMediaQuery("(pointer: coarse)");
  const { author } = comment;
  const reactions = comment.reactions?.filter((r) => r.count > 0) ?? [];
  const toggleReaction = onReactionToggle
    ? (emoji: string) => onReactionToggle(comment.id, emoji)
    : undefined;
  const canReact = !!toggleReaction && !comment.deleted && !editing;
  const unchanged = draft.trim() === comment.body.trim();

  const save = async (body: string) => {
    if (!onEdit || !canEditThis || !body.trim() || saving) return;
    if (body.trim() === comment.body.trim()) return cancel();
    setSaving(true);
    setError(null);
    try {
      await onEdit(comment.id, body);
      setEditing(false);
      onEditValueChange?.(comment.id, null);
    } catch (e) {
      setError(errorMessage(e, "Couldn't save the comment."));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setError(null);
    setEditing(false);
    onEditValueChange?.(comment.id, null);
  };

  const remove = async () => {
    if (!onDelete || !comment.canDelete || comment.deleted) return;
    setError(null);
    try {
      await onDelete?.(comment.id);
    } catch (e) {
      setError(errorMessage(e, "Couldn't delete the comment."));
    }
  };

  const canReply = !!onReply && coarse && !comment.deleted;
  const canCopy = !!onCopyLink && !comment.deleted;
  const canCopyText = !!onCopyText && !comment.deleted && !!comment.body.trim();
  const canDeleteThis = !!onDelete && !!comment.canDelete && !comment.deleted;
  const hasShare = canReply || canCopy || canCopyText;
  const hasMenu = (hasShare || canEditThis || canDeleteThis) && !editing;

  return (
    <li
      id={`comment-${comment.id}`}
      data-slot="comment-item"
      data-variant={variant}
      data-deleted={comment.deleted ? "" : undefined}
      data-agent={comment.agent ? "" : undefined}
      className={cn(
        // On its own (a `CommentList`), a comment is a card: a hairline border, the light fill.
        // Inside a thread or a replies list it is a row of that card, split from the row above by
        // a hairline (`comment-replies` / `CommentThread`). The border never changes on hover,
        // focus or edit (FOC-14); only a `#comment-<id>` highlight tints a row.
        "flex min-w-0 scroll-mt-24 flex-col overflow-hidden rounded-lg border border-border bg-muted/30",
        "in-data-[slot=comment-replies]:overflow-visible in-data-[slot=comment-replies]:rounded-none in-data-[slot=comment-replies]:border-0 in-data-[slot=comment-replies]:bg-transparent",
        className,
      )}
    >
      <div
        data-slot="comment-card"
        data-highlighted={highlighted ? "" : undefined}
        // 16px in from the card's sides, 12px above and below. An agent's comment has a violet
        // bar at its start.
        className="group/comment flex min-w-0 flex-col px-4 py-3 transition-colors data-[highlighted]:bg-accent in-data-agent:relative in-data-agent:before:absolute in-data-agent:before:inset-y-2 in-data-agent:before:start-0 in-data-agent:before:w-0.5 in-data-agent:before:rounded-full in-data-agent:before:bg-tag-purple"
      >
        <div
          data-slot="comment-header"
          className="flex min-h-6 min-w-0 items-center gap-2"
        >
          {comment.agent && !author.image ? (
            <span
              aria-hidden
              data-slot="comment-agent-avatar"
              className="grid size-5 shrink-0 place-items-center rounded-full bg-tag-purple-subtle text-tag-purple-text"
            >
              <Bot className="size-3.5" />
            </span>
          ) : (
            <PersonAvatar person={author} className={AVATAR} />
          )}
          <span className="flex min-w-0 flex-1 items-center gap-x-2">
            <PersonHoverCard
              person={author}
              trigger="name"
              className="-my-0.5 truncate py-1 text-sm"
            >
              {author.name}
            </PersonHoverCard>
            {comment.agent ? (
              <span
                data-slot="comment-agent"
                className="shrink-0 rounded-sm bg-tag-purple-subtle px-1 text-xs font-medium text-tag-purple-text"
              >
                Agent
              </span>
            ) : null}
            <PersonBadge badge={author.badge} />
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <RelativeTime date={comment.createdAt} now={now} />
              {comment.editedAt && !comment.deleted ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span
                        tabIndex={0}
                        className="relative before:absolute before:inset-x-0 before:-inset-y-1"
                      />
                    }
                    data-slot="comment-edited"
                  >
                    (edited)
                  </TooltipTrigger>
                  <TooltipContent>
                    Edited{" "}
                    {new Date(comment.editedAt).toLocaleString(DEFAULT_LOCALE)}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </span>
          </span>
          {editing ? (
            <span
              data-slot="comment-edit-actions"
              className="-me-1 flex shrink-0 items-center gap-1"
            >
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className={cn("text-muted-foreground", TOUCH_TARGET)}
                      aria-label="Cancel"
                      onClick={cancel}
                    />
                  }
                >
                  <X aria-hidden />
                </TooltipTrigger>
                <TooltipContent>Cancel · Esc</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon-xs"
                      className={TOUCH_TARGET}
                      aria-label="Save"
                      loading={saving}
                      disabled={!draft.trim() || unchanged}
                      onClick={() => void save(draft)}
                    />
                  }
                >
                  <Check aria-hidden />
                </TooltipTrigger>
                <TooltipContent>Save · {submitShortcut()}</TooltipContent>
              </Tooltip>
            </span>
          ) : hasMenu || canReact ? (
            <span className="-me-1 flex shrink-0 items-center gap-0.5">
              {canReact ? (
                <ReactionAdd
                  onSelect={(emoji) => {
                    if (reactions.some((r) => r.emoji === emoji && r.reacted))
                      return;
                    void Promise.resolve(toggleReaction?.(emoji)).catch(
                      () => {},
                    );
                  }}
                  size="icon-sm"
                  className={cn("text-muted-foreground", HOVER_ACTION)}
                />
              ) : null}
              {hasMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        data-slot="comment-actions"
                        aria-label={`Actions for comment by ${author.name}`}
                        className={cn("text-muted-foreground", HOVER_ACTION)}
                      />
                    }
                  >
                    <Ellipsis aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    data-slot="comment-actions-content"
                    className="w-auto min-w-0 whitespace-nowrap"
                  >
                    {canReply ? (
                      <DropdownMenuItem onClick={onReply}>
                        <Reply aria-hidden />
                        Reply
                      </DropdownMenuItem>
                    ) : null}
                    {canCopy ? (
                      <DropdownMenuItem
                        onClick={() => onCopyLink?.(comment.id)}
                      >
                        <Link aria-hidden />
                        Copy link
                      </DropdownMenuItem>
                    ) : null}
                    {canCopyText ? (
                      <DropdownMenuItem
                        onClick={() => onCopyText?.(comment.id, comment.body)}
                      >
                        <Copy aria-hidden />
                        Copy text
                      </DropdownMenuItem>
                    ) : null}
                    {(canEditThis || canDeleteThis) && hasShare ? (
                      <DropdownMenuSeparator />
                    ) : null}
                    {canEditThis ? (
                      <DropdownMenuItem onClick={() => setEditing(true)}>
                        <Pencil aria-hidden />
                        Edit
                      </DropdownMenuItem>
                    ) : null}
                    {canDeleteThis ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => void remove()}
                      >
                        <Trash2 aria-hidden />
                        Delete
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </span>
          ) : null}
        </div>
        {/* 4px under the header; a reply's body lines up with the name (24px avatar + 8px). */}
        <div
          data-slot="comment-body"
          className="mt-1 flex min-w-0 flex-col gap-1.5 in-data-[variant=reply]:ps-7 in-data-[slot=comment-replies]:ps-7"
        >
          {comment.deleted ? (
            <p className="text-sm text-muted-foreground italic">
              This comment was deleted.
            </p>
          ) : editing ? (
            <CommentBox
              layout="edit"
              autoFocus
              label="Edit comment"
              defaultValue={editStart}
              onValueChange={(value) => {
                setDraft(value);
                onEditValueChange?.(comment.id, value);
              }}
              onSubmit={(value) => void save(value)}
              onRevert={cancel}
              busy={saving}
              invalid={!!error}
              mentions={mentions}
              mentionHref={mentionHref}
              mentionImage={mentionImage}
            />
          ) : comment.body.trim() ? (
            // A posted comment's images open in the `FileViewer`.
            <ImageViewerScope>
              <MarkdownView
                className="text-sm"
                mentionHref={mentionHref}
                mentionImage={mentionImage}
                fileContentType={fileContentType}
              >
                {comment.body}
              </MarkdownView>
            </ImageViewerScope>
          ) : null}
          {!comment.deleted && !editing && attachments ? (
            <div data-slot="comment-attachments" className="min-w-0">
              {attachments}
            </div>
          ) : null}
          {!comment.deleted && !editing && reactions.length > 0 ? (
            // The pills, and an add-reaction button after them.
            <Reactions
              reactions={reactions}
              onToggle={toggleReaction}
              showAdd={canReact}
            />
          ) : null}
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      {replies ? (
        <ul
          data-slot="comment-replies"
          className="flex flex-col divide-y divide-border/50 border-t border-border/50"
          aria-label="Replies"
        >
          {replies}
        </ul>
      ) : null}
    </li>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentMedia — a comment's (or a draft's) images, shown as the images themselves
 * ----------------------------------------------------------------------------------------------*/

/** One image `CommentMedia` shows. */
export interface CommentMediaItem {
  /** A stable key. */
  key: string;
  /** The image to show (a thumbnail, or the picked file's local preview while it uploads). */
  src: string;
  /** The file's name: the image's alt text and its open button's name. */
  name: string;
  /**
   * The file for the `FileViewer`: a click opens it, paging through every file in the enclosing
   * `AttachmentPreview` (wrap a comment's or a task's files in one). @default undefined
   */
  file?: FileViewerItem;
  /** The intrinsic size, to reserve the box before the image decodes. @default undefined */
  width?: number | null;
  height?: number | null;
  /** Upload state: `uploading`/`processing` dim it under a spinner. @default "done" */
  state?: "uploading" | "processing" | "error" | "done";
  /** Show a × that takes it off a draft. @default undefined */
  onRemove?: () => void;
}

/**
 * `CommentMedia` — a wrapping row of rounded image previews, each at most 200px tall in its own
 * aspect ratio; a click opens the `FileViewer`. A comment's posted images and a draft's pasted or
 * picked ones look the same (the draft's dim under a spinner while they upload, with a × to take
 * them off). Other files stay `Attachment` cards beside it.
 *
 * @example
 * <AttachmentPreview>
 *   <CommentMedia items={images} />
 *   <AttachmentGroup>{otherCards}</AttachmentGroup>
 * </AttachmentPreview>
 */
export function CommentMedia({
  items,
  className,
}: {
  items: readonly CommentMediaItem[];
  /** Classes for the row. @default undefined */
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div
      role="list"
      data-slot="comment-media"
      className={cn("flex min-w-0 flex-wrap gap-1.5", className)}
    >
      {items.map((item) => {
        const busy = item.state === "uploading" || item.state === "processing";
        return (
          <Attachment
            key={item.key}
            role="listitem"
            file={item.file}
            state={item.state ?? "done"}
            data-slot="comment-media-item"
            className="max-w-full overflow-hidden rounded-lg border-border bg-transparent p-0 has-[>a,>button]:hover:bg-transparent"
          >
            <img
              src={item.src}
              alt={item.name}
              width={item.width ?? undefined}
              height={item.height ?? undefined}
              loading="lazy"
              decoding="async"
              className={cn(
                "block h-auto max-h-50 w-auto max-w-full object-contain",
                busy && "opacity-60",
              )}
            />
            {busy ? (
              <span className="pointer-events-none absolute inset-0 grid place-items-center">
                <Spinner className="size-5" />
              </span>
            ) : null}
            {item.onRemove ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label={`Remove ${item.name}`}
                onClick={item.onRemove}
                className="absolute end-1 top-1 z-10 rounded-full shadow-sm"
              >
                <X aria-hidden />
              </Button>
            ) : null}
          </Attachment>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentBox — the editor box the composer, the reply row and in-place edit share
 * ----------------------------------------------------------------------------------------------*/

/** Focus the editable surface inside `root`, retrying for a few frames while the editor mounts. */
function focusEditor(root: HTMLElement | null, tries = 10) {
  const surface = root?.querySelector<HTMLElement>("[contenteditable=true]");
  if (surface) surface.focus();
  else if (root && tries > 0)
    requestAnimationFrame(() => focusEditor(root, tries - 1));
}

/** The dragged items carry files (not text or a link). */
const carriesFiles = (event: React.DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

interface CommentBoxProps {
  /**
   * `card` — a record's new comment: a bordered card, the text on top (two lines at rest) and a
   * toolbar row under it with attach and Send at its end. `inline` — a thread's reply row: no
   * border or fill, one line, attach and Send at the line's end. `edit` — in-place editing: an
   * `Input`-like box with no controls (the comment's header holds ✕ and ✓).
   */
  layout: "card" | "inline" | "edit";
  defaultValue?: string;
  placeholder?: string;
  label: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onRevert?: () => void;
  /** Escape keeps the text and calls this instead of reverting (a reply being cancelled). */
  onEscape?: () => void;
  busy?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  /** The host's extra controls, first in the end group before attach and Send. */
  extraActions?: React.ReactNode;
  /** Send (or nothing, for `edit`). */
  actions?: React.ReactNode;
  mentions?: TextEditProps["mentions"];
  mentionHref?: TextEditProps["mentionHref"];
  mentionImage?: TextEditProps["mentionImage"];
  onImageUpload?: TextEditProps["onImageUpload"];
  onFileUpload?: TextEditProps["onFileUpload"];
  onUploadError?: TextEditProps["onUploadError"];
  /** Files picked with the attach button, pasted or dropped go here instead of into the text. */
  onAttachFiles?: (files: File[]) => void;
  /** Inside the box under the text: the draft's attached files (cards with their upload progress). */
  files?: React.ReactNode;
}

function CommentBox({
  layout,
  defaultValue,
  placeholder,
  label,
  onValueChange,
  onSubmit,
  onRevert,
  onEscape,
  busy,
  disabled,
  invalid,
  autoFocus,
  extraActions,
  actions,
  mentions,
  mentionHref,
  mentionImage,
  onImageUpload,
  onFileUpload,
  onUploadError,
  onAttachFiles,
  files,
}: CommentBoxProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const handle = React.useRef<TextEditHandle>(null);
  React.useEffect(() => {
    if (autoFocus) focusEditor(ref.current);
  }, [autoFocus]);
  const canAttach =
    layout !== "edit" &&
    !!(onImageUpload || onFileUpload || onAttachFiles) &&
    !disabled;
  const canDrop = canAttach && !!onAttachFiles;
  const fileInput = React.useRef<HTMLInputElement>(null);
  // Enter/leave fire for every child the drag crosses: count them.
  const drags = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);

  const controls =
    layout === "edit" ? null : (
      <div
        data-slot="comment-box-actions"
        className="flex shrink-0 items-center gap-1"
      >
        {extraActions}
        {canAttach ? (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    data-slot="comment-attach"
                    aria-label="Attach files"
                    className={cn(
                      "rounded-full text-muted-foreground hover:text-foreground",
                      TOUCH_TARGET,
                    )}
                    // A picker of our own, clicked in the gesture (the lazy editor may not be in
                    // yet); picked files go to the host's tray, or the editor's upload flow.
                    onClick={() => fileInput.current?.click()}
                  />
                }
              >
                <Paperclip aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Attach files</TooltipContent>
            </Tooltip>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              tabIndex={-1}
              aria-hidden
              // The editor's rules: images only unless any file may upload.
              accept={onFileUpload || onAttachFiles ? undefined : "image/*"}
              onChange={(event) => {
                const picked = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = "";
                if (!picked.length) return;
                if (onAttachFiles) onAttachFiles(picked);
                else handle.current?.uploadFiles(picked);
              }}
            />
          </>
        ) : null}
        {actions}
      </div>
    );

  const shared = {
    handleRef: handle,
    format: "markdown" as const,
    slashCommands: TEXT_EDIT_COMPACT_SLASH_COMMANDS,
    slashHint: false,
    defaultValue,
    placeholder,
    "aria-label": label,
    onValueChange,
    onSubmit,
    onRevert,
    escapeBehavior: onEscape ? ("blur" as const) : undefined,
    saving: busy,
    disabled,
    dragHandles: false,
    "aria-invalid": invalid ? true : undefined,
    mentions,
    mentionHref,
    mentionImage,
    onImageUpload,
    onFileUpload,
    onUploadError,
  };

  return (
    <div
      ref={ref}
      data-slot="comment-box"
      data-layout={layout}
      data-dragging={dragging ? "" : undefined}
      aria-invalid={invalid || undefined}
      className="relative flex min-w-0 flex-1 flex-col"
      // With `onAttachFiles`, pasted or dropped files join the box's attached files (the same
      // tray as the paperclip) instead of going into the text.
      onPasteCapture={
        canDrop
          ? (event) => {
              const picked = Array.from(event.clipboardData?.files ?? []);
              if (!picked.length) return;
              event.preventDefault();
              event.stopPropagation();
              onAttachFiles?.(picked);
            }
          : undefined
      }
      onDragEnterCapture={
        canDrop
          ? (event) => {
              if (!carriesFiles(event)) return;
              drags.current += 1;
              setDragging(true);
            }
          : undefined
      }
      onDragOverCapture={
        canDrop
          ? (event) => {
              if (carriesFiles(event)) event.preventDefault();
            }
          : undefined
      }
      onDragLeaveCapture={
        canDrop
          ? (event) => {
              if (!carriesFiles(event)) return;
              drags.current = Math.max(0, drags.current - 1);
              if (drags.current === 0) setDragging(false);
            }
          : undefined
      }
      onDropCapture={
        canDrop
          ? (event) => {
              drags.current = 0;
              setDragging(false);
              const picked = Array.from(event.dataTransfer?.files ?? []);
              if (!picked.length) return;
              event.preventDefault();
              event.stopPropagation();
              onAttachFiles?.(picked);
            }
          : undefined
      }
      onKeyDown={
        onEscape
          ? (event) => {
              // A mention / slash menu's Escape stops propagation, so it only closes the menu.
              if (event.key === "Escape") onEscape();
            }
          : undefined
      }
    >
      {layout === "card" ? (
        // The text on top, then the draft's files, then the toolbar row (attach, Send).
        <TextEdit
          {...shared}
          variant="boxed"
          className="px-4 pt-3 pb-2 dark:bg-transparent"
          // Two 20px lines at rest; about twelve before it scrolls inside.
          minHeight="2.5rem"
          maxHeight="15rem"
        >
          {files ? (
            <div data-slot="comment-box-files" className="pt-1.5">
              {files}
            </div>
          ) : null}
          <div
            data-slot="comment-box-toolbar"
            className="flex items-center justify-end pt-1.5"
          >
            {controls}
          </div>
        </TextEdit>
      ) : (
        <TextEdit
          {...shared}
          variant="composer"
          className={cn(
            // The reply row: no border or fill of its own — the thread card draws the surface.
            layout === "inline" &&
              "min-h-6 rounded-none border-0 bg-transparent p-0 ps-0 dark:bg-transparent",
            // In-place editing: the Input box on the page's own surface, over the card's fill.
            layout === "edit" && "bg-background dark:bg-input/30",
          )}
          footer={
            files ? <div data-slot="comment-box-files">{files}</div> : undefined
          }
          actions={controls}
        />
      )}
      {dragging ? (
        <div
          aria-hidden
          data-slot="comment-box-drop"
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-primary/5 text-sm font-medium text-primary"
        >
          Drop files to attach
        </div>
      ) : null}
    </div>
  );
}

/**
 * The round ↑ send button. Disabled (nothing to send) it turns into a quiet grey disc with a
 * full-strength muted arrow rather than a half-transparent primary one, so it still reads clearly.
 */
function SendButton({
  label,
  disabled,
  loading,
  onClick,
  ...props
}: {
  label: string;
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
} & Omit<React.ComponentProps<typeof Button>, "onClick" | "disabled">) {
  const idle = disabled && !loading;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-xs"
            variant={idle ? "secondary" : "default"}
            aria-label={label}
            loading={loading}
            disabled={disabled}
            onClick={onClick}
            {...props}
            className={cn(
              "rounded-full data-disabled:not-data-loading:opacity-100 data-disabled:not-data-loading:text-muted-foreground",
              TOUCH_TARGET,
            )}
          />
        }
      >
        <ArrowUp aria-hidden />
      </TooltipTrigger>
      <TooltipContent>
        {label} · {submitShortcut()}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentComposer
 * ----------------------------------------------------------------------------------------------*/

/** Props for `CommentComposer`. */
export interface CommentComposerProps {
  /** Post the Markdown; the editor clears when it resolves and keeps the text when it rejects. */
  onSubmit: MaybeAsync<[body: string]>;
  /**
   * The editor's starting text on mount — e.g. a restored draft; Send is enabled while it is
   * non-empty. After a successful post the box starts empty. @default undefined
   */
  defaultValue?: string;
  /** Placeholder in the empty editor. @default "Add a comment…" ("Write a reply…" while `replyingTo`) */
  placeholder?: string;
  /** Accessible name of the round send button. @default "Send comment" ("Send reply" while `replyingTo`) */
  submitLabel?: string;
  /**
   * Extra controls on the toolbar row, before the attach and send buttons. The attach (paperclip)
   * button itself shows whenever `onImageUpload`, `onFileUpload` or `onAttachFiles` is set.
   * @default undefined
   */
  attachments?: React.ReactNode;
  /**
   * The comment being replied to: a "Replying to `name` ×" line shows over the box and the
   * placeholder becomes "Write a reply…". × or Escape calls `onCancelReply`; the text stays.
   * @default undefined
   */
  replyingTo?: { name: string } | null;
  /** Called from the "Replying to" line's × and from Escape while replying. @default undefined */
  onCancelReply?: () => void;
  /** Focus the editor when the composer mounts. @default false */
  autoFocus?: boolean;
  /** Mark the composer busy (controlled; otherwise it follows `onSubmit`'s promise). @default undefined */
  posting?: boolean;
  /** An error under the box (controlled; otherwise a rejected `onSubmit`'s message). @default undefined */
  error?: string | null;
  /** Disable the composer. @default false */
  disabled?: boolean;
  /** Called on every change, e.g. to guard unsaved text. @default undefined */
  onValueChange?: (value: string) => void;
  /** `@` mentions in the editor (see `TextEdit`'s `mentions`). @default undefined */
  mentions?: TextEditProps["mentions"];
  /** Where a mention chip links (see `TextEdit`'s `mentionHref`). @default undefined */
  mentionHref?: TextEditProps["mentionHref"];
  /** Upload a pasted or dropped image (see `TextEdit`'s `onImageUpload`). @default undefined */
  onImageUpload?: TextEditProps["onImageUpload"];
  /** Upload any other file, inserted as a link (see `TextEdit`'s `onFileUpload`). @default undefined */
  onFileUpload?: TextEditProps["onFileUpload"];
  /** Called when an upload rejects. @default undefined */
  onUploadError?: TextEditProps["onUploadError"];
  /** A person mention's avatar URL (see `TextEdit`'s `mentionImage`). @default undefined */
  mentionImage?: TextEditProps["mentionImage"];
  /**
   * Files picked with the attach button, pasted or dropped onto the box go here instead of into
   * the text — for a comment whose files show as cards under its body. Shows the attach button on
   * its own, and "Drop files to attach" while files are dragged over the box. @default undefined
   */
  onAttachFiles?: (files: File[]) => void;
  /** Inside the box under the text: the draft's attached files, e.g. cards with their upload progress. @default undefined */
  files?: React.ReactNode;
  /** The draft carries files (`files`): Send is enabled and posts with no text. @default false */
  hasFiles?: boolean;
  /** Classes for the composer. @default undefined */
  className?: string;
}

/**
 * `CommentComposer` — a bordered card holding a Markdown editor that grows with its text (two
 * lines at rest, about twelve before it scrolls inside), the draft's files under it, and a toolbar
 * row with the attach button and a round ↑ send button at its end, disabled while the box is
 * empty; Cmd/Ctrl+Enter sends too. Files dragged over it show "Drop files to attach".
 *
 * @example
 * <CommentComposer onSubmit={(body) => postComment(taskId, body)} />
 */
export function CommentComposer({
  onSubmit,
  defaultValue,
  placeholder,
  submitLabel,
  attachments,
  replyingTo,
  onCancelReply,
  autoFocus = false,
  posting: postingProp,
  error: errorProp,
  disabled = false,
  onValueChange,
  mentions,
  mentionHref,
  onImageUpload,
  onFileUpload,
  onUploadError,
  mentionImage,
  onAttachFiles,
  files,
  hasFiles = false,
  className,
}: CommentComposerProps) {
  const [generation, setGeneration] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [errorState, setErrorState] = React.useState<string | null>(null);
  const [body, setBody] = React.useState(defaultValue ?? "");
  const posting = postingProp ?? pending;
  const error = errorProp !== undefined ? errorProp : errorState;

  const submit = async (value: string) => {
    if ((!value.trim() && !hasFiles) || posting) return;
    setPending(true);
    setErrorState(null);
    try {
      await onSubmit(value);
      setGeneration((g) => g + 1);
      setBody("");
      onValueChange?.("");
    } catch (e) {
      setErrorState(errorMessage(e, "Couldn't post the comment."));
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      data-slot="comment-composer"
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
    >
      {replyingTo ? (
        <div
          data-slot="comment-composer-replying"
          className="flex min-w-0 items-center gap-1.5 ps-1 text-xs text-muted-foreground"
        >
          <Reply aria-hidden className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate">
            Replying to{" "}
            <span className="font-medium text-foreground">
              {replyingTo.name}
            </span>
          </span>
          {onCancelReply ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Cancel reply"
              className={cn("rounded-full", TOUCH_TARGET)}
              onClick={onCancelReply}
            >
              <X aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}
      <CommentBox
        key={generation}
        layout="card"
        label={replyingTo ? "Reply" : "Comment"}
        defaultValue={generation === 0 ? defaultValue : undefined}
        placeholder={
          placeholder ?? (replyingTo ? "Leave a reply…" : "Add a comment…")
        }
        onEscape={replyingTo ? onCancelReply : undefined}
        autoFocus={autoFocus || generation > 0}
        onValueChange={(next) => {
          setBody(next);
          onValueChange?.(next);
        }}
        onSubmit={(value) => void submit(value)}
        busy={posting}
        disabled={disabled}
        invalid={!!error}
        extraActions={attachments}
        mentions={mentions}
        mentionHref={mentionHref}
        mentionImage={mentionImage}
        onImageUpload={onImageUpload}
        onFileUpload={onFileUpload}
        onUploadError={onUploadError}
        onAttachFiles={onAttachFiles}
        files={files}
        actions={
          <SendButton
            label={submitLabel ?? (replyingTo ? "Send reply" : "Send comment")}
            loading={posting}
            disabled={disabled || (!body.trim() && !hasFiles)}
            onClick={() => void submit(body)}
          />
        }
      />
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentThread
 * ----------------------------------------------------------------------------------------------*/

/** A list's `editingId` / `onEditingIdChange` / `editDefaultValue` as one item's props. */
function editingPropsFor(
  editingId: string | null | undefined,
  onEditingIdChange: ((id: string | null) => void) | undefined,
  editDefaultValue: ((commentId: string) => string | undefined) | undefined,
) {
  return (
    id: string,
  ): Pick<
    CommentItemProps,
    "editing" | "onEditingChange" | "editDefaultValue"
  > => ({
    editing:
      onEditingIdChange || editingId != null ? editingId === id : undefined,
    onEditingChange: onEditingIdChange
      ? (editing) => {
          if (editing) onEditingIdChange(id);
          else if (editingId === id) onEditingIdChange(null);
        }
      : undefined,
    editDefaultValue: editDefaultValue?.(id),
  });
}

/** "3 replies", "1 reply". */
const replyCount = (n: number) => `${n} ${n === 1 ? "reply" : "replies"}`;

/**
 * The full-width row between the first comment and its replies: "Show N more replies" (or
 * "Show less"), muted, with a chevron; a promise from `onClick` shows a spinner until it settles.
 */
function RepliesToggle({
  children,
  expanded,
  onClick,
}: {
  children: React.ReactNode;
  expanded?: boolean;
  onClick?: () => void | Promise<unknown>;
}) {
  const [busy, setBusy] = React.useState(false);
  if (!onClick)
    return (
      <li
        data-slot="comment-thread-more"
        className="px-4 py-2 text-xs text-muted-foreground"
      >
        {children}
      </li>
    );
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <li data-slot="comment-thread-more">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={expanded}
        disabled={busy}
        onClick={() => {
          const result = onClick();
          if (!(result instanceof Promise)) return;
          setBusy(true);
          void result.catch(() => {}).finally(() => setBusy(false));
        }}
        className="h-auto w-full justify-start gap-1.5 rounded-none px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {busy ? (
          <Spinner className="size-3.5" />
        ) : (
          <Icon aria-hidden className="size-3.5" />
        )}
        {children}
      </Button>
    </li>
  );
}

/** One thread, as `CommentThread` shows it: an optional quote, the first comment and its replies. */
export interface CommentThreadData {
  /** Stable id — the thread's root comment id, or the host's own. */
  id: string;
  /** The words the thread is about (an inline comment's anchor quote). @default undefined */
  quote?: string | null;
  /** Set once the thread is resolved: who and when. @default undefined */
  resolved?: { by: Person; at: Date | string | number } | null;
  /** The quoted text is gone from the document: "Original text was removed" replaces the quote. @default false */
  orphaned?: boolean;
  /** The first comment. */
  root: CommentData;
  /** The replies shown, oldest first. */
  replies: CommentData[];
}

/** Props for `CommentThread`. */
export interface CommentThreadProps {
  /** The thread. */
  thread: CommentThreadData;
  /**
   * The signed-in person: their avatar leads the reply row. @default undefined
   */
  viewer?: Pick<Person, "name" | "email" | "image" | "hue">;
  /** Post a reply; omit to show the thread without a reply row. The box clears on success and keeps text on failure. @default undefined */
  onReply?: MaybeAsync<[body: string]>;
  /** Resolve the thread; the header shows a ✓ button when set. @default undefined */
  onResolve?: () => void | Promise<unknown>;
  /** Reopen a resolved thread; the resolved header shows Reopen when set. @default undefined */
  onReopen?: () => void | Promise<unknown>;
  /** Called when the quote is clicked — scroll the document to the highlight. @default undefined */
  onQuoteClick?: () => void;
  /** The thread's highlight is the active one: the card lifts. @default false */
  active?: boolean;
  /** Show the first comment, "N replies" and the last reply only, and no reply row. @default false */
  collapsed?: boolean;
  /** Called from a collapsed thread's "N replies" (shown as a button when set). @default undefined */
  onExpand?: () => void;
  /**
   * Replies not shown (not loaded yet, or folded away): "Show N more replies" sits between the
   * first comment and the replies. @default 0
   */
  hiddenReplies?: number;
  /** Show the hidden replies (load them); a promise shows a spinner on the row. @default undefined */
  onShowReplies?: () => void | Promise<unknown>;
  /** Fold the replies back; shows "Show less" when set and none are hidden. @default undefined */
  onHideReplies?: () => void;
  /** Save an edit to any comment in the thread. @default undefined */
  onEdit?: CommentItemProps["onEdit"];
  /** Delete a comment. @default undefined */
  onDelete?: CommentItemProps["onDelete"];
  /** Add or remove the viewer's reaction on a comment. @default undefined */
  onReactionToggle?: CommentItemProps["onReactionToggle"];
  /** Copy a comment's link. @default undefined */
  onCopyLink?: CommentItemProps["onCopyLink"];
  /** Copy a comment's Markdown. @default undefined */
  onCopyText?: CommentItemProps["onCopyText"];
  /**
   * An edit box's text on every change, and `null` when that edit ends (see `CommentItem`).
   * @default undefined
   */
  onEditValueChange?: CommentItemProps["onEditValueChange"];
  /**
   * The comment being edited. Controlled when `onEditingIdChange` is set; otherwise it only picks
   * the comment that mounts in editing mode, and each comment keeps its own editing state.
   * @default undefined
   */
  editingId?: string | null;
  /** Called with the comment whose editing starts, and `null` when it ends. @default undefined */
  onEditingIdChange?: (id: string | null) => void;
  /**
   * The edit box's starting text for a comment whenever its editing starts (its
   * `editDefaultValue`) — an unsaved edit restored after a remount or a reopen.
   * @default undefined
   */
  editDefaultValue?: (commentId: string) => string | undefined;
  /** The comment to tint (from `#comment-<id>`). @default undefined */
  highlightedId?: string;
  /** A comment's files, under its body. @default undefined */
  renderAttachments?: (comment: CommentData) => React.ReactNode;
  /** A file chip's content type by href (see `MarkdownView`'s `fileContentType`). @default undefined */
  fileContentType?: TextEditProps["fileContentType"];
  /**
   * The reply box's options, passed through to its editor — `mentions`, `mentionHref`,
   * `mentionImage`, `onImageUpload`, `onFileUpload`, `onUploadError`, `onAttachFiles`, `files`, `placeholder`, `submitLabel`, `disabled`,
   * `attachments`; `defaultValue` (the starting text on mount, e.g. a restored draft —
   * Send is enabled), `onValueChange` (every change, and `""` after a reply
   * posts) and `posting` (busy, OR'd with the reply's own posting state: Send shows loading and
   * neither it nor Cmd/Ctrl+Enter sends — e.g. while an upload in the box is running).
   * @default undefined
   */
  composer?: Partial<
    Pick<
      CommentComposerProps,
      | "mentions"
      | "mentionHref"
      | "onImageUpload"
      | "onFileUpload"
      | "onUploadError"
      | "mentionImage"
      | "onAttachFiles"
      | "files"
      | "hasFiles"
      | "placeholder"
      | "submitLabel"
      | "disabled"
      | "attachments"
      | "defaultValue"
      | "onValueChange"
      | "posting"
    >
  >;
  /** Pin the relative times' clock (docs, tests). @default undefined */
  now?: number;
  /** Classes for the thread. @default undefined */
  className?: string;
}

/**
 * `CommentThread` — one card (Linear style): the quoted words (or "Original text was removed")
 * when the thread is about a piece of text, the first comment, "Show N more replies", the replies
 * — indented to the name, each over a hairline — and a flat reply row at the foot with the
 * viewer's avatar, a one-line "Write a reply…" box, attach and Send (Cmd/Ctrl+Enter sends). The
 * header's ✓ resolves it; a resolved thread says who resolved it and when, and offers Reopen.
 * `collapsed` shows the first comment, "N replies" and the last reply.
 *
 * @example
 * <CommentThread thread={thread} viewer={me} active={thread.id === activeId}
 *   onReply={(body) => reply(thread.id, body)} onResolve={() => resolve(thread.id)}
 *   onQuoteClick={() => editor.current?.pulseAnnotation(thread.id)} />
 */
export function CommentThread({
  thread,
  viewer,
  onReply,
  onResolve,
  onReopen,
  onQuoteClick,
  active = false,
  collapsed = false,
  onExpand,
  hiddenReplies = 0,
  onShowReplies,
  onHideReplies,
  onEdit,
  onDelete,
  onReactionToggle,
  onCopyLink,
  onCopyText,
  onEditValueChange,
  editingId,
  onEditingIdChange,
  editDefaultValue,
  highlightedId,
  renderAttachments,
  fileContentType,
  composer,
  now,
  className,
}: CommentThreadProps) {
  const editingProps = editingPropsFor(
    editingId,
    onEditingIdChange,
    editDefaultValue,
  );
  const [generation, setGeneration] = React.useState(0);
  const [draft, setDraft] = React.useState(composer?.defaultValue ?? "");
  const [pending, setPending] = React.useState(false);
  const posting = pending || !!composer?.posting;
  const [error, setError] = React.useState<string | null>(null);
  const replyBox = React.useRef<HTMLDivElement>(null);
  const { resolved, orphaned, quote, root } = thread;
  // A deleted first comment keeps its thread open for replies (the host's `onReply` decides).
  const canReply = !collapsed && !!onReply;

  const reply = async (body: string) => {
    if (
      !canReply ||
      composer?.disabled ||
      (!body.trim() && !composer?.hasFiles) ||
      posting
    )
      return;
    setPending(true);
    setError(null);
    try {
      await onReply?.(body);
      setGeneration((g) => g + 1);
      setDraft("");
      composer?.onValueChange?.("");
    } catch (e) {
      setError(errorMessage(e, "Couldn't post the reply."));
    } finally {
      setPending(false);
    }
  };

  const startReply = () => {
    replyBox.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    focusEditor(replyBox.current);
  };

  const item = (comment: CommentData, isRoot: boolean, inset = false) => (
    <CommentItem
      key={comment.id}
      comment={comment}
      variant={isRoot ? "root" : "reply"}
      highlighted={comment.id === highlightedId}
      onEdit={onEdit}
      onDelete={onDelete}
      onReactionToggle={onReactionToggle}
      onCopyLink={onCopyLink}
      onCopyText={onCopyText}
      onReply={isRoot && canReply ? startReply : undefined}
      onEditValueChange={onEditValueChange}
      {...editingProps(comment.id)}
      attachments={renderAttachments?.(comment)}
      mentions={composer?.mentions}
      mentionHref={composer?.mentionHref}
      mentionImage={composer?.mentionImage}
      fileContentType={fileContentType}
      now={now}
      // A reply is a row of the card, over a hairline.
      // Under the first comment the hairline spans the card; between replies it starts at the
      // text (16px padding + 20px avatar + 8px), Linear style.
      className={
        isRoot
          ? undefined
          : inset
            ? "relative border-t-0 before:absolute before:start-11 before:end-0 before:top-0 before:h-px before:bg-border/50"
            : "border-t border-border/50"
      }
    />
  );
  const shown = collapsed ? thread.replies.slice(-1) : thread.replies;
  const folded = collapsed
    ? Math.max(0, thread.replies.length - 1) + hiddenReplies
    : hiddenReplies;
  const hasHeader = orphaned || !!quote || !!resolved || !!onResolve;

  return (
    <article
      data-slot="comment-thread"
      data-active={active ? "" : undefined}
      data-resolved={resolved ? "" : undefined}
      data-collapsed={collapsed ? "" : undefined}
      aria-label={`Comment by ${root.author.name}`}
      className={cn(
        // One card: a hairline border and the light fill; its comments are rows (a descendant
        // rule beats the item's own card classes).
        "flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/30 text-card-foreground transition-shadow duration-150 data-active:shadow-md",
        "[&_[data-slot=comment-item]]:overflow-visible [&_[data-slot=comment-item]]:rounded-none [&_[data-slot=comment-item]]:border-x-0 [&_[data-slot=comment-item]]:border-b-0 [&_[data-slot=comment-item]]:bg-transparent [&_[data-slot=comment-item][data-variant=root]]:border-t-0",
        className,
      )}
    >
      {hasHeader ? (
        <div
          data-slot="comment-thread-header"
          className="flex min-w-0 items-start gap-2 px-4 pt-3"
        >
          <div className="min-w-0 flex-1">
            {orphaned ? (
              <p
                data-slot="comment-thread-quote"
                data-orphaned=""
                className="text-sm text-muted-foreground italic"
              >
                Original text was removed
              </p>
            ) : quote ? (
              onQuoteClick ? (
                <Button
                  variant="ghost"
                  onClick={onQuoteClick}
                  data-slot="comment-thread-quote"
                  className="h-auto w-full min-w-0 justify-start rounded-none rounded-e-sm border-0 border-s-2 border-border px-2 py-0.5 text-start text-sm font-normal whitespace-normal text-muted-foreground"
                >
                  <span className="line-clamp-3 min-w-0">{quote}</span>
                </Button>
              ) : (
                <blockquote
                  data-slot="comment-thread-quote"
                  className="border-s-2 border-border ps-2 text-sm text-muted-foreground"
                >
                  <span className="line-clamp-3">{quote}</span>
                </blockquote>
              )
            ) : null}
            {resolved ? (
              <p
                data-slot="comment-thread-resolved"
                className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground"
              >
                <Check aria-hidden className="size-3.5" />
                Resolved by {resolved.by.name}
                <span aria-hidden>·</span>
                <RelativeTime date={resolved.at} now={now} />
              </p>
            ) : null}
          </div>
          {resolved ? (
            onReopen ? (
              <Button
                variant="ghost"
                size="sm"
                className="-me-1"
                onClick={() => void Promise.resolve(onReopen()).catch(() => {})}
              >
                Reopen
              </Button>
            ) : null
          ) : onResolve ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Resolve"
                    className="-me-1 text-muted-foreground"
                    onClick={() =>
                      void Promise.resolve(onResolve()).catch(() => {})
                    }
                  />
                }
              >
                <Check aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Resolve</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
      <ul data-slot="comment-thread-comments" className="flex flex-col">
        {item(root, true)}
        {folded > 0 || (collapsed && thread.replies.length > 0) ? (
          <RepliesToggle onClick={collapsed ? onExpand : onShowReplies}>
            {collapsed
              ? replyCount(thread.replies.length + hiddenReplies)
              : `Show ${folded} more ${folded === 1 ? "reply" : "replies"}`}
          </RepliesToggle>
        ) : !collapsed && onHideReplies ? (
          <RepliesToggle expanded onClick={onHideReplies}>
            Show less
          </RepliesToggle>
        ) : null}
        {shown.map((comment, i) => item(comment, false, i > 0))}
      </ul>
      {canReply ? (
        <div
          ref={replyBox}
          data-slot="comment-thread-reply"
          className="flex min-w-0 flex-col gap-1 border-t border-border/50 px-4 py-3"
        >
          <div className="flex min-w-0 items-start gap-2">
            {viewer ? (
              <PersonAvatar person={viewer} className={cn(AVATAR, "my-0.5")} />
            ) : null}
            <CommentBox
              key={generation}
              layout="inline"
              autoFocus={generation > 0}
              label="Reply"
              defaultValue={
                generation === 0 ? composer?.defaultValue : undefined
              }
              placeholder={composer?.placeholder ?? "Leave a reply…"}
              onValueChange={(value) => {
                setDraft(value);
                composer?.onValueChange?.(value);
              }}
              onSubmit={(value) => void reply(value)}
              busy={posting}
              disabled={composer?.disabled}
              invalid={!!error}
              extraActions={composer?.attachments}
              mentions={composer?.mentions}
              mentionHref={composer?.mentionHref}
              mentionImage={composer?.mentionImage}
              onImageUpload={composer?.onImageUpload}
              onFileUpload={composer?.onFileUpload}
              onUploadError={composer?.onUploadError}
              onAttachFiles={composer?.onAttachFiles}
              files={composer?.files}
              actions={
                <SendButton
                  label={composer?.submitLabel ?? "Send reply"}
                  loading={posting}
                  disabled={
                    !!composer?.disabled ||
                    (!draft.trim() && !composer?.hasFiles)
                  }
                  onClick={() => void reply(draft)}
                />
              }
            />
          </div>
          {error ? (
            <p role="alert" className="ps-7 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentDayDivider
 * ----------------------------------------------------------------------------------------------*/

/**
 * The clock and zone day labels are computed in — or `null` while unknown. A calendar day depends
 * on the zone: without a provider's zone, labels wait for the browser's clock (after hydration),
 * so the server's render and the first client render agree.
 */
function useDayClock(nowProp: number | undefined) {
  const timeZone = useTimeZone();
  const clock = useDateTimeNow();
  if (clock === undefined && timeZone === undefined) return null;
  const now = nowProp ?? clock;
  return now === undefined ? null : { now, timeZone };
}

/** The calendar day an instant falls on, in the viewer's zone, as a comparable key. */
function dayKey(
  date: Date | string | number,
  now: number,
  timeZone: string | undefined,
) {
  return dayDelta(new Date(date), { now, timeZone });
}

/**
 * `CommentDayDivider` — a small, centred, muted day label between comments posted on different
 * days: "Today", "Yesterday", or the date ("Sep 25", "Dec 20, 2025"), in the viewer's zone.
 *
 * @example
 * <CommentDayDivider date={thread.root.createdAt} />
 */
export function CommentDayDivider({
  date,
  now: nowProp,
  className,
}: {
  /** An instant on the day to name. */
  date: Date | string | number;
  /** Pin the clock (docs, tests). @default undefined */
  now?: number;
  /** Classes for the divider. @default undefined */
  className?: string;
}) {
  const day = useDayClock(nowProp);
  if (!day) return null;
  const { now, timeZone } = day;
  const delta = dayKey(date, now, timeZone);
  const label =
    delta === 0
      ? "Today"
      : delta === -1
        ? "Yesterday"
        : formatDate(date, { absolute: true, now, timeZone });
  return (
    <p
      role="separator"
      aria-label={label}
      data-slot="comment-day-divider"
      className={cn(
        "pt-1 text-center text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {label}
    </p>
  );
}

/**
 * Whether a day divider goes before item `index` — the first item, and each item posted on a
 * different calendar day from the one before it (in the order shown).
 */
function startsDay(
  dates: readonly (Date | string | number)[],
  index: number,
  now: number,
  timeZone: string | undefined,
) {
  if (index === 0) return true;
  return (
    dayKey(dates[index]!, now, timeZone) !==
    dayKey(dates[index - 1]!, now, timeZone)
  );
}

/**
 * The list's day dividers: for each index, whether a `CommentDayDivider` goes before it. Empty
 * until the clock is known (no hydration mismatch).
 *
 * @example
 * const dividers = useCommentDayDividers(threads.map((t) => t.root.createdAt));
 */
export function useCommentDayDividers(
  dates: readonly (Date | string | number)[],
  nowProp?: number,
): boolean[] {
  const day = useDayClock(nowProp);
  if (!day) return dates.map(() => false);
  return dates.map((_, i) => startsDay(dates, i, day.now, day.timeZone));
}

/* ------------------------------------------------------------------------------------------------
 * CommentList
 * ----------------------------------------------------------------------------------------------*/

/** The order `CommentList` shows comments in. */
export type CommentOrder = "oldest" | "newest";

/** Props for `CommentList`. */
export interface CommentListProps {
  /** The comments, oldest first (the list reverses them for `order="newest"`). */
  comments: CommentData[];
  /** The total, shown after the heading; defaults to the comments shown. @default comments.length */
  count?: number;
  /** The section heading (an `h2`). @default "Comments" */
  title?: string;
  /** The order shown. @default "oldest" */
  order?: CommentOrder;
  /** Called from the header's "Oldest first" / "Newest first" toggle; the toggle shows when set. @default undefined */
  onOrderChange?: (order: CommentOrder) => void;
  /** Show the skeleton instead of the list. @default false */
  loading?: boolean;
  /** Older comments exist: show "Load earlier" before them. @default false */
  hasEarlier?: boolean;
  /** Load the older page. @default undefined */
  onLoadEarlier?: () => void;
  /** The older page is loading. @default false */
  loadingEarlier?: boolean;
  /** The id of the comment to tint and scroll to (from `#comment-<id>`). @default undefined */
  highlightedId?: string;
  /** Save an edit. @default undefined */
  onEdit?: CommentItemProps["onEdit"];
  /** Delete a comment. @default undefined */
  onDelete?: CommentItemProps["onDelete"];
  /** Copy a comment's link. @default undefined */
  onCopyLink?: CommentItemProps["onCopyLink"];
  /** Copy a comment's Markdown. @default undefined */
  onCopyText?: CommentItemProps["onCopyText"];
  /** Add or remove the viewer's reaction on a comment. @default undefined */
  onReactionToggle?: CommentItemProps["onReactionToggle"];
  /**
   * An edit box's text on every change, and `null` when that edit ends (see `CommentItem`).
   * @default undefined
   */
  onEditValueChange?: CommentItemProps["onEditValueChange"];
  /**
   * The comment being edited. Controlled when `onEditingIdChange` is set; otherwise it only picks
   * the comment that mounts in editing mode, and each comment keeps its own editing state.
   * @default undefined
   */
  editingId?: string | null;
  /** Called with the comment whose editing starts, and `null` when it ends. @default undefined */
  onEditingIdChange?: (id: string | null) => void;
  /**
   * The edit box's starting text for a comment whenever its editing starts (its
   * `editDefaultValue`) — an unsaved edit restored after a remount or a reopen.
   * @default undefined
   */
  editDefaultValue?: (commentId: string) => string | undefined;
  /** Replies under a comment (threads). @default undefined */
  renderReplies?: (comment: CommentData) => React.ReactNode;
  /** A comment's files, under its body (its `attachments`). @default undefined */
  renderAttachments?: (comment: CommentData) => React.ReactNode;
  /** Where a mention chip in each comment's body links (see `MarkdownView`'s `mentionHref`). @default undefined */
  mentionHref?: CommentItemProps["mentionHref"];
  /** A person mention's avatar URL in each body (see `MarkdownView`'s `mentionImage`). @default undefined */
  mentionImage?: CommentItemProps["mentionImage"];
  /** A file chip's content type by href (see `MarkdownView`'s `fileContentType`). @default undefined */
  fileContentType?: CommentItemProps["fileContentType"];
  /**
   * The composer — at the section's end oldest first, and right under the heading newest first
   * (where the newest comment is). @default undefined
   */
  composer?: React.ReactNode;
  /** Name the day between comments posted on different days. @default true */
  dayDividers?: boolean;
  /** A muted line shown while there are no comments; none by default (the composer is enough). @default undefined */
  emptyText?: string;
  /** Pin the relative times' clock (docs, tests). @default undefined */
  now?: number;
  /** Classes for the section. @default undefined */
  className?: string;
}

/**
 * `CommentList` — a record's comments section: "Comments" with a count and an Oldest / Newest
 * first toggle, "Load earlier", the comments (each a card, with a day label where the day
 * changes), and the composer — at the end oldest first, at the top newest first. A skeleton while
 * loading; with none, just the composer (or `emptyText` over it).
 *
 * @example
 * <CommentList comments={comments} order={order} onOrderChange={setOrder}
 *   onEdit={edit} onDelete={remove} onCopyLink={copy}
 *   composer={<CommentComposer onSubmit={post} />} />
 */
export function CommentList({
  comments,
  count,
  title = "Comments",
  order = "oldest",
  onOrderChange,
  loading = false,
  hasEarlier = false,
  onLoadEarlier,
  loadingEarlier = false,
  highlightedId,
  onEdit,
  onDelete,
  onCopyLink,
  onCopyText,
  onReactionToggle,
  onEditValueChange,
  editingId,
  onEditingIdChange,
  editDefaultValue,
  renderReplies,
  renderAttachments,
  mentionHref,
  mentionImage,
  fileContentType,
  composer,
  dayDividers = true,
  emptyText,
  now,
  className,
}: CommentListProps) {
  const editingProps = editingPropsFor(
    editingId,
    onEditingIdChange,
    editDefaultValue,
  );
  const headingId = React.useId();
  const total = count ?? comments.length;
  const empty = comments.length === 0;
  const shown = order === "newest" ? [...comments].reverse() : comments;
  const dividers = useCommentDayDividers(
    shown.map((c) => c.createdAt),
    now,
  );

  React.useEffect(() => {
    if (!highlightedId || loading) return;
    document
      .getElementById(`comment-${highlightedId}`)
      ?.scrollIntoView({ block: "center" });
  }, [highlightedId, loading]);

  const loadEarlier = hasEarlier ? (
    <Button
      variant="ghost"
      size="sm"
      className="self-start text-muted-foreground"
      onClick={onLoadEarlier}
      loading={loadingEarlier}
    >
      Load earlier
    </Button>
  ) : null;
  const composerShown = composer && !loading ? composer : null;

  return (
    <section
      data-slot="comment-list"
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-3", className)}
    >
      <CommentListHeader
        headingId={headingId}
        title={title}
        count={loading ? 0 : total}
        order={onOrderChange && !loading && !empty ? order : undefined}
        onOrderChange={onOrderChange}
      />
      {/* One composer instance, keyed, moves between the end (oldest first) and the top (newest
          first): React moves it, so its text survives the toggle. */}
      {(order === "newest" ? ["composer", "list"] : ["list", "composer"]).map(
        (part) =>
          part === "composer" ? (
            <React.Fragment key="composer">{composerShown}</React.Fragment>
          ) : (
            <React.Fragment key="list">
              {loading ? (
                <CommentListSkeleton />
              ) : empty ? (
                emptyText ? (
                  <p
                    data-slot="comment-list-empty"
                    className="text-sm text-muted-foreground"
                  >
                    {emptyText}
                  </p>
                ) : null
              ) : (
                <>
                  {order === "oldest" ? loadEarlier : null}
                  <ul className="flex flex-col gap-3">
                    {shown.map((comment, i) => (
                      <React.Fragment key={comment.id}>
                        {dayDividers && dividers[i] ? (
                          <li>
                            <CommentDayDivider
                              date={comment.createdAt}
                              now={now}
                            />
                          </li>
                        ) : null}
                        <CommentItem
                          comment={comment}
                          highlighted={comment.id === highlightedId}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onCopyLink={onCopyLink}
                          onCopyText={onCopyText}
                          onReactionToggle={onReactionToggle}
                          onEditValueChange={onEditValueChange}
                          {...editingProps(comment.id)}
                          replies={renderReplies?.(comment)}
                          attachments={renderAttachments?.(comment)}
                          mentionHref={mentionHref}
                          mentionImage={mentionImage}
                          fileContentType={fileContentType}
                          now={now}
                        />
                      </React.Fragment>
                    ))}
                  </ul>
                  {order === "newest" ? loadEarlier : null}
                </>
              )}
            </React.Fragment>
          ),
      )}
    </section>
  );
}

/**
 * `CommentListHeader` — a comments section's heading row: the title (an `h2`) with its count,
 * and the Oldest / Newest first toggle when `order` is set — for a host that lays out its own
 * threads under it.
 *
 * @example
 * <CommentListHeader headingId={id} count={total} order={order} onOrderChange={setOrder} />
 */
export function CommentListHeader({
  headingId,
  title = "Comments",
  count = 0,
  order,
  onOrderChange,
}: {
  /** The `h2`'s id, for the section's `aria-labelledby`. */
  headingId: string;
  /** The heading. @default "Comments" */
  title?: string;
  /** The total, shown after the heading when above zero. @default 0 */
  count?: number;
  /** The order shown; the toggle shows when it and `onOrderChange` are set. @default undefined */
  order?: CommentOrder;
  /** Called from the toggle. @default undefined */
  onOrderChange?: (order: CommentOrder) => void;
}) {
  return (
    <div
      data-slot="comment-list-header"
      className="flex min-h-8 items-center justify-between gap-2"
    >
      <h2
        id={headingId}
        className="flex items-center gap-2 text-base font-medium"
      >
        {title}
        {count > 0 ? (
          <span className="text-muted-foreground tabular-nums">{count}</span>
        ) : null}
      </h2>
      {order && onOrderChange ? (
        <Button
          variant="ghost"
          size="sm"
          className="-me-2 text-muted-foreground"
          onClick={() =>
            onOrderChange(order === "newest" ? "oldest" : "newest")
          }
        >
          <ArrowUpDown aria-hidden />
          {order === "newest" ? "Newest first" : "Oldest first"}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * `CommentListSkeleton` — two placeholder thread cards and the composer's card while comments
 * load, in their real shapes. @example <CommentListSkeleton />
 */
export function CommentListSkeleton() {
  return (
    <div
      aria-hidden
      data-slot="comment-list-skeleton"
      className="flex flex-col gap-3"
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3"
        >
          <div className="flex h-6 items-center gap-2">
            <Skeleton className="size-5 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex flex-col gap-1.5 py-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
      <div className="flex flex-col rounded-lg border border-border px-4 pt-3 pb-2">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex justify-end gap-1 pt-5">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="size-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}
