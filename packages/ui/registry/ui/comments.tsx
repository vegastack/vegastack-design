// @vegastack comments@0.23.41 sha256-GKDDw25swiSigR1MJ4poBHyp3Ghj6VFtciHqhA9/XNA=

"use client";

import * as React from "react";
import {
  ArrowUp,
  ArrowUpDown,
  Ellipsis,
  Link,
  MessageSquare,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@vegastack/design";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { MarkdownView } from "@/components/ui/markdown-view";
import { PersonAvatar, type Person } from "@/components/ui/person-hover-card";
import {
  ReactionAdd,
  Reactions,
  type ReactionData,
} from "@/components/ui/reactions";
import { PersonBadge } from "@/components/ui/searchable-select";
import { RelativeTime } from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TEXT_EDIT_COMPACT_SLASH_COMMANDS,
  TextEdit,
} from "@/components/ui/text-edit";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * Comments — a record's discussion: `CommentList` (heading with a count and an Oldest / Newest
 * first toggle, "Load earlier", skeleton and an empty state whose "Add a comment" reveals the
 * composer), `CommentItem` (avatar, name, relative time, "edited", a ⋯ menu with Copy link / Edit
 * / Delete, in-place editing in a compact box, a `#comment-<id>` highlight and a replies slot) and
 * Slack-style reactions under the body (pills, and an add-reaction button in the hover actions),
 * `CommentComposer` (a light, near-transparent box with a round send button; Cmd/Ctrl+Enter sends). The
 * parts hold only transient UI state — the host owns the data and persists through callbacks; a
 * callback that returns a promise drives the saving/posting state and, on rejection, the error.
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
  /** When it was last edited; shows "edited" with this time on hover. @default undefined */
  editedAt?: Date | string | number | null;
  /** Soft-deleted: shown as "Comment deleted" (hide it yourself when it has no replies). @default false */
  deleted?: boolean;
  /** The viewer may edit it (the menu shows Edit). @default false */
  canEdit?: boolean;
  /** The viewer may delete it (the menu shows Delete). @default false */
  canDelete?: boolean;
  /** Emoji reactions, shown as pills under the body. @default undefined */
  reactions?: ReactionData[];
}

/** A callback that may persist asynchronously; a rejected promise shows its message. */
type MaybeAsync<T extends unknown[]> = (...args: T) => void | Promise<unknown>;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/* ------------------------------------------------------------------------------------------------
 * CommentItem
 * ----------------------------------------------------------------------------------------------*/

/** Props for `CommentItem`. */
export interface CommentItemProps {
  /** The comment. */
  comment: CommentData;
  /** Save an edit: called with the comment's id and the new Markdown. @default undefined */
  onEdit?: MaybeAsync<[id: string, body: string]>;
  /** Delete after the viewer confirms. @default undefined */
  onDelete?: MaybeAsync<[id: string]>;
  /** Copy a link to the comment; the menu shows Copy link when set. @default undefined */
  onCopyLink?: (id: string) => void;
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
  /** Replies, indented under the comment (one level of `CommentItem`s). @default undefined */
  replies?: React.ReactNode;
  /** Pin the relative time's clock (docs, tests). @default undefined */
  now?: number;
  /** Classes for the item. @default undefined */
  className?: string;
}

/** The hover actions (add reaction, ⋯): shown on hover or focus inside the comment, while their
 * popup is open, and always on a coarse pointer, where there is no hover. */
const HOVER_ACTION =
  "opacity-0 group-hover/comment:opacity-100 group-focus-within/comment:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100";

/**
 * `CommentItem` — one comment: avatar, name and badge, relative time ("edited" after an edit),
 * the Markdown body, and a ⋯ menu (Copy link · Edit · Delete) for what the viewer may do. Edit
 * turns the body into the composer's compact box with a round ↑ Save (disabled while empty or
 * unchanged) and a ghost × Cancel; Cmd/Ctrl+Enter saves and Escape cancels. Delete asks first.
 *
 * @example
 * <CommentItem comment={c} onEdit={save} onDelete={remove} onCopyLink={copy}
 *   onReactionToggle={(id, emoji) => toggle(id, emoji)} />
 */
export function CommentItem({
  comment,
  onEdit,
  onDelete,
  onCopyLink,
  onReactionToggle,
  highlighted = false,
  editing: editingProp,
  onEditingChange,
  replies,
  now,
  className,
}: CommentItemProps) {
  const [editingState, setEditingState] = React.useState(editingProp ?? false);
  const editing = onEditingChange ? !!editingProp : editingState;
  const setEditing = (next: boolean) => {
    setEditingState(next);
    onEditingChange?.(next);
  };
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState(comment.body);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const { author } = comment;
  const reactions = comment.reactions?.filter((r) => r.count > 0) ?? [];
  const toggleReaction = onReactionToggle
    ? (emoji: string) => onReactionToggle(comment.id, emoji)
    : undefined;
  const canReact = !!toggleReaction && !comment.deleted && !editing;

  const save = async (body: string) => {
    if (!onEdit || !body.trim()) return;
    if (body.trim() === comment.body.trim()) return cancel();
    setSaving(true);
    setError(null);
    try {
      await onEdit(comment.id, body);
      setEditing(false);
    } catch (e) {
      setError(errorMessage(e, "Couldn't save the comment."));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setError(null);
    setEditing(false);
  };

  const remove = async () => {
    setConfirmOpen(false);
    setError(null);
    try {
      await onDelete?.(comment.id);
    } catch (e) {
      setError(errorMessage(e, "Couldn't delete the comment."));
    }
  };

  const canCopy = !!onCopyLink && !comment.deleted;
  const canEditThis = !!onEdit && !!comment.canEdit && !comment.deleted;
  const canDeleteThis = !!onDelete && !!comment.canDelete && !comment.deleted;
  const hasMenu = (canCopy || canEditThis || canDeleteThis) && !editing;

  return (
    <li
      id={`comment-${comment.id}`}
      data-slot="comment-item"
      data-deleted={comment.deleted ? "" : undefined}
      className={cn("flex min-w-0 scroll-mt-24 flex-col gap-3", className)}
    >
      {/* The card: the composer's own surface (`bg-muted/30`, a hairline `border-border`,
          `rounded-xl`). Its border never changes on hover, focus or edit (FOC-14); only a
          `#comment-<id>` highlight tints the surface. */}
      <div
        data-slot="comment-card"
        data-highlighted={highlighted ? "" : undefined}
        className="group/comment flex min-w-0 gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 transition-colors data-[highlighted]:bg-accent"
      >
        {comment.deleted ? (
          <span aria-hidden className="size-6 shrink-0 rounded-full bg-muted" />
        ) : (
          <PersonAvatar person={author} className="mt-0.5" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-h-7 min-w-0 items-center gap-2">
            {comment.deleted ? (
              <span className="text-sm text-muted-foreground italic">
                Comment deleted
              </span>
            ) : (
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium wrap-anywhere">
                  {author.name}
                </span>
                <PersonBadge badge={author.badge} />
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RelativeTime date={comment.createdAt} now={now} />
                  {comment.editedAt ? (
                    <>
                      <span aria-hidden>·</span>
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
                          edited
                        </TooltipTrigger>
                        <TooltipContent>
                          Edited {new Date(comment.editedAt).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </>
                  ) : null}
                </span>
              </span>
            )}
            {hasMenu || canReact ? (
              <span className="ms-auto flex shrink-0 items-center gap-0.5">
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
                    className={HOVER_ACTION}
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
                          className={HOVER_ACTION}
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
                      {canCopy ? (
                        <DropdownMenuItem
                          onClick={() => onCopyLink?.(comment.id)}
                        >
                          <Link aria-hidden />
                          Copy link
                        </DropdownMenuItem>
                      ) : null}
                      {canEditThis ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setDraft(comment.body);
                            setEditing(true);
                          }}
                        >
                          <Pencil aria-hidden />
                          Edit
                        </DropdownMenuItem>
                      ) : null}
                      {canDeleteThis ? (
                        <>
                          {canCopy || canEditThis ? (
                            <DropdownMenuSeparator />
                          ) : null}
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setConfirmOpen(true)}
                          >
                            <Trash2 aria-hidden />
                            Delete
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </span>
            ) : null}
          </div>
          {comment.deleted ? null : editing ? (
            <CommentBox
              compact
              bare
              autoFocus
              label="Edit comment"
              defaultValue={comment.body}
              onValueChange={setDraft}
              onSubmit={(value) => void save(value)}
              onRevert={cancel}
              busy={saving}
              actions={
                <>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full"
                          aria-label="Cancel"
                          onClick={cancel}
                        />
                      }
                    >
                      <X aria-hidden />
                    </TooltipTrigger>
                    <TooltipContent>Cancel</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <SendButton
                          label="Save"
                          loading={saving}
                          disabled={
                            !draft.trim() ||
                            draft.trim() === comment.body.trim()
                          }
                          onClick={() => void save(draft)}
                        />
                      }
                    />
                    <TooltipContent>Save</TooltipContent>
                  </Tooltip>
                </>
              }
            />
          ) : (
            <MarkdownView className="text-sm">{comment.body}</MarkdownView>
          )}
          {!comment.deleted && !editing && reactions.length > 0 ? (
            <Reactions
              reactions={reactions}
              onToggle={toggleReaction}
              className="mt-1"
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
          className="ms-9 flex flex-col gap-3"
          aria-label="Replies"
        >
          {replies}
        </ul>
      ) : null}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This comment will be removed for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentBox — the light editor box the composer and in-place edit share: a near-transparent fill
 * (`bg-muted/30`) and a hairline border that never changes on focus (FOC-14), no editor tint of its own — the
 * caret is the cue — growing to
 * about twelve lines before it scrolls inside
 * ----------------------------------------------------------------------------------------------*/

/** Focus the editable surface inside `root`, retrying for a few frames while the editor mounts. */
function focusEditor(root: HTMLElement | null, tries = 10) {
  const surface = root?.querySelector<HTMLElement>("[contenteditable=true]");
  if (surface) surface.focus();
  else if (root && tries > 0)
    requestAnimationFrame(() => focusEditor(root, tries - 1));
}

interface CommentBoxProps {
  defaultValue?: string;
  placeholder?: string;
  label: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onRevert?: () => void;
  busy?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  compact?: boolean;
  /** Inside a comment card (edit mode): the card already draws the surface and border. */
  bare?: boolean;
  leading?: React.ReactNode;
  actions: React.ReactNode;
}

function CommentBox({
  defaultValue,
  placeholder,
  label,
  onValueChange,
  onSubmit,
  onRevert,
  busy,
  disabled,
  invalid,
  autoFocus,
  compact,
  bare,
  leading,
  actions,
}: CommentBoxProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (autoFocus) focusEditor(ref.current);
  }, [autoFocus]);
  return (
    <div
      ref={ref}
      data-slot="comment-box"
      data-compact={compact ? "" : undefined}
      data-bare={bare ? "" : undefined}
      aria-invalid={invalid || undefined}
      className="flex min-w-0 cursor-text flex-col gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 transition-colors aria-invalid:border-destructive data-[compact]:py-2 data-[bare]:rounded-none data-[bare]:border-0 data-[bare]:bg-transparent data-[bare]:p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) focusEditor(ref.current);
      }}
    >
      <TextEdit
        format="markdown"
        slashCommands={TEXT_EDIT_COMPACT_SLASH_COMMANDS}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={label}
        onValueChange={onValueChange}
        onSubmit={onSubmit}
        onRevert={onRevert}
        saving={busy}
        disabled={disabled}
        dragHandles={false}
        minHeight={compact ? undefined : 40}
        // About twelve lines of body text, then it scrolls inside the box.
        maxHeight="15rem"
        aria-invalid={invalid ? true : undefined}
      />
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      </div>
    </div>
  );
}

/**
 * The round ↑ send / save button. Disabled (nothing to send) it turns into a quiet grey disc with a
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
    <Button
      size="icon-sm"
      variant={idle ? "secondary" : "default"}
      aria-label={label}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      {...props}
      className="rounded-full data-disabled:not-data-loading:opacity-100 data-disabled:not-data-loading:text-muted-foreground"
    >
      <ArrowUp aria-hidden />
    </Button>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentComposer
 * ----------------------------------------------------------------------------------------------*/

/** Props for `CommentComposer`. */
export interface CommentComposerProps {
  /** Post the Markdown; the editor clears when it resolves and keeps the text when it rejects. */
  onSubmit: MaybeAsync<[body: string]>;
  /** Placeholder in the empty editor. @default "Add a comment…" */
  placeholder?: string;
  /** Accessible name of the round send button. @default "Send comment" */
  submitLabel?: string;
  /** Controls at the box's bottom left, before the send button (an attach button). @default undefined */
  attachments?: React.ReactNode;
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
  /** Classes for the composer. @default undefined */
  className?: string;
}

/**
 * `CommentComposer` — a light box holding a Markdown editor that grows with its text (to about
 * twelve lines, then scrolls inside), an optional `attachments` slot at the bottom left and a round ↑ send button at the
 * bottom right, disabled while the box is empty; Cmd/Ctrl+Enter sends too.
 *
 * @example
 * <CommentComposer onSubmit={(body) => postComment(taskId, body)} />
 */
export function CommentComposer({
  onSubmit,
  placeholder = "Add a comment…",
  submitLabel = "Send comment",
  attachments,
  autoFocus = false,
  posting: postingProp,
  error: errorProp,
  disabled = false,
  onValueChange,
  className,
}: CommentComposerProps) {
  const [generation, setGeneration] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [errorState, setErrorState] = React.useState<string | null>(null);
  const [body, setBody] = React.useState("");
  const posting = postingProp ?? pending;
  const error = errorProp !== undefined ? errorProp : errorState;

  const submit = async (value: string) => {
    if (!value.trim() || posting) return;
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
      <CommentBox
        key={generation}
        label="Comment"
        placeholder={placeholder}
        autoFocus={autoFocus || generation > 0}
        onValueChange={(next) => {
          setBody(next);
          onValueChange?.(next);
        }}
        onSubmit={(value) => void submit(value)}
        busy={posting}
        disabled={disabled}
        invalid={!!error}
        leading={attachments}
        actions={
          <SendButton
            label={submitLabel}
            loading={posting}
            disabled={disabled || !body.trim()}
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
  /** Add or remove the viewer's reaction on a comment. @default undefined */
  onReactionToggle?: CommentItemProps["onReactionToggle"];
  /** Replies under a comment (threads). @default undefined */
  renderReplies?: (comment: CommentData) => React.ReactNode;
  /**
   * The composer, at the section's end. With no comments it waits behind the empty state's
   * "Add a comment" button, then shows and takes focus.
   * @default undefined
   */
  composer?: React.ReactNode;
  /** The empty state's text. @default "No comments yet" */
  emptyText?: string;
  /** Pin the relative times' clock (docs, tests). @default undefined */
  now?: number;
  /** Classes for the section. @default undefined */
  className?: string;
}

/**
 * `CommentList` — a record's comments section: "Comments" with a count and an Oldest / Newest
 * first toggle, "Load earlier", the comments, and the composer at the end. A skeleton while
 * loading; with none, "No comments yet" and an "Add a comment" button that reveals the composer.
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
  onReactionToggle,
  renderReplies,
  composer,
  emptyText = "No comments yet",
  now,
  className,
}: CommentListProps) {
  const headingId = React.useId();
  const composerRef = React.useRef<HTMLDivElement>(null);
  const [adding, setAdding] = React.useState(false);
  const total = count ?? comments.length;
  const empty = comments.length === 0;
  const shown = order === "newest" ? [...comments].reverse() : comments;

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
      className="self-start"
      onClick={onLoadEarlier}
      disabled={loadingEarlier}
    >
      {loadingEarlier ? "Loading…" : "Load earlier"}
    </Button>
  ) : null;

  return (
    <section
      data-slot="comment-list"
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-4", className)}
    >
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-base font-medium"
        >
          {title}
          {!loading && total > 0 ? (
            <span className="text-muted-foreground tabular-nums">{total}</span>
          ) : null}
        </h2>
        {onOrderChange && !loading && !empty ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() =>
              onOrderChange(order === "newest" ? "oldest" : "newest")
            }
          >
            <ArrowUpDown aria-hidden />
            {order === "newest" ? "Newest first" : "Oldest first"}
          </Button>
        ) : null}
      </div>
      {loading ? (
        <CommentListSkeleton />
      ) : empty ? (
        adding || !composer ? null : (
          <Empty size="sm" icon={<MessageSquare aria-hidden />}>
            <EmptyHeader>
              <EmptyDescription>{emptyText}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdding(true);
                  requestAnimationFrame(() => focusEditor(composerRef.current));
                }}
              >
                Add a comment
              </Button>
            </EmptyContent>
          </Empty>
        )
      ) : (
        <>
          {order === "oldest" ? loadEarlier : null}
          <ul className="flex flex-col gap-3">
            {shown.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                highlighted={comment.id === highlightedId}
                onEdit={onEdit}
                onDelete={onDelete}
                onCopyLink={onCopyLink}
                onReactionToggle={onReactionToggle}
                replies={renderReplies?.(comment)}
                now={now}
              />
            ))}
          </ul>
          {order === "newest" ? loadEarlier : null}
        </>
      )}
      {empty && !composer && !loading ? (
        <Empty size="sm" icon={<MessageSquare aria-hidden />}>
          <EmptyHeader>
            <EmptyDescription>{emptyText}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {composer && !loading && (!empty || adding) ? (
        <div ref={composerRef}>{composer}</div>
      ) : null}
    </section>
  );
}

/** `CommentListSkeleton` — three placeholder comments while they load. @example <CommentListSkeleton /> */
export function CommentListSkeleton() {
  return (
    <div
      aria-hidden
      data-slot="comment-list-skeleton"
      className="flex flex-col gap-5"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
