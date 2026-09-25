// @vegastack comments@0.23.30 sha256-IYc4X27NZBFWv5Pqabp0kHYqrHBJoMXy+SEi0bLzn8M=

"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
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
  RowActionsMenu,
  type RowAction,
} from "@/components/ui/data-table-parts";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { MarkdownView } from "@/components/ui/markdown-view";
import { PersonAvatar, type Person } from "@/components/ui/person-hover-card";
import { PersonBadge } from "@/components/ui/searchable-select";
import { RelativeTime } from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { TextEdit } from "@/components/ui/text-edit";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * Comments — a record's discussion: `CommentList` (heading with a count, oldest first, "Load
 * earlier", skeleton and empty states), `CommentItem` (avatar, name, relative time with the exact
 * time on hover, "edited", a ⋯ menu with Copy link / Edit / Delete, in-place markdown editing,
 * a highlight when opened from a `#comment-<id>` link, and a replies slot) and `CommentComposer`
 * (the viewer's avatar and a minimal markdown editor; Cmd/Ctrl+Enter or "Comment" posts). The
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

/**
 * `CommentItem` — one comment: avatar, name and badge, relative time ("edited" after an edit),
 * the Markdown body, and a ⋯ menu (Copy link · Edit · Delete) for what the viewer may do. Edit
 * turns the body into a borderless editor in place with Cancel and Save; Delete asks first.
 *
 * @example
 * <CommentItem comment={c} onEdit={save} onDelete={remove} onCopyLink={copy} />
 */
export function CommentItem({
  comment,
  onEdit,
  onDelete,
  onCopyLink,
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
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const { author } = comment;

  const save = async (body: string) => {
    if (!onEdit || !body.trim()) return;
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

  const remove = async () => {
    setConfirmOpen(false);
    setError(null);
    try {
      await onDelete?.(comment.id);
    } catch (e) {
      setError(errorMessage(e, "Couldn't delete the comment."));
    }
  };

  const actions: RowAction[] = comment.deleted
    ? []
    : [
        ...(onCopyLink
          ? [{ label: "Copy link", onSelect: () => onCopyLink(comment.id) }]
          : []),
        ...(onEdit && comment.canEdit
          ? [{ label: "Edit", onSelect: () => setEditing(true) }]
          : []),
        ...(onDelete && comment.canDelete
          ? [
              {
                label: "Delete",
                destructive: true,
                separatorBefore: true,
                onSelect: () => setConfirmOpen(true),
              },
            ]
          : []),
      ];

  return (
    <li
      id={`comment-${comment.id}`}
      data-slot="comment-item"
      data-deleted={comment.deleted ? "" : undefined}
      className={cn("flex min-w-0 scroll-mt-24 flex-col gap-3", className)}
    >
      <div
        data-highlighted={highlighted ? "" : undefined}
        className="-mx-2 flex min-w-0 gap-3 rounded-lg px-2 py-2 transition-colors data-[highlighted]:bg-accent"
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
                  <RelativeTime
                    date={comment.createdAt}
                    now={now}
                    unitStyle="short"
                  />
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
            {actions.length > 0 && !editing ? (
              <span className="ms-auto shrink-0">
                <RowActionsMenu
                  label={`comment by ${author.name}`}
                  actions={actions}
                />
              </span>
            ) : null}
          </div>
          {comment.deleted ? null : editing ? (
            <TextEdit
              format="markdown"
              toolbar="minimal"
              defaultValue={comment.body}
              aria-label="Edit comment"
              onCommit={save}
              onRevert={() => {
                setError(null);
                setEditing(false);
              }}
              saving={saving}
            />
          ) : (
            <MarkdownView className="text-sm">{comment.body}</MarkdownView>
          )}
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
 * CommentComposer
 * ----------------------------------------------------------------------------------------------*/

/** Props for `CommentComposer`. */
export interface CommentComposerProps {
  /** The viewer, whose avatar leads the editor. */
  author: Person;
  /** Post the Markdown; the editor clears when it resolves and keeps the text when it rejects. */
  onSubmit: MaybeAsync<[body: string]>;
  /** Placeholder in the empty editor. @default "Leave a comment…" */
  placeholder?: string;
  /** Label of the post button. @default "Comment" */
  submitLabel?: string;
  /** Mark the composer busy (controlled; otherwise it follows `onSubmit`'s promise). @default undefined */
  posting?: boolean;
  /** An error under the editor (controlled; otherwise a rejected `onSubmit`'s message). @default undefined */
  error?: string | null;
  /** Disable the composer. @default false */
  disabled?: boolean;
  /** Called on every change, e.g. to guard unsaved text. @default undefined */
  onValueChange?: (value: string) => void;
  /** Classes for the composer. @default undefined */
  className?: string;
}

/**
 * `CommentComposer` — the viewer's avatar beside a minimal Markdown editor (bold, italic, link,
 * bullet list) with the "Comment" button under it; Cmd/Ctrl+Enter posts too.
 *
 * @example
 * <CommentComposer author={me} onSubmit={(body) => postComment(taskId, body)} />
 */
export function CommentComposer({
  author,
  onSubmit,
  placeholder = "Leave a comment…",
  submitLabel = "Comment",
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

  const submit = async (body: string) => {
    if (!body.trim() || posting) return;
    setPending(true);
    setErrorState(null);
    try {
      await onSubmit(body);
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
      className={cn("flex min-w-0 gap-3", className)}
    >
      <PersonAvatar person={author} className="mt-2" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <TextEdit
          key={generation}
          format="markdown"
          toolbar="minimal"
          placeholder={placeholder}
          aria-label="Comment"
          onValueChange={(next) => {
            setBody(next);
            onValueChange?.(next);
          }}
          onSubmit={submit}
          saving={posting}
          disabled={disabled}
          minHeight={72}
          aria-invalid={error ? true : undefined}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            loading={posting}
            disabled={disabled || !body.trim()}
            onClick={() => void submit(body)}
          >
            {submitLabel}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * CommentList
 * ----------------------------------------------------------------------------------------------*/

/** Props for `CommentList`. */
export interface CommentListProps {
  /** The comments, oldest first. */
  comments: CommentData[];
  /** The total, shown after the heading; defaults to the comments shown. @default comments.length */
  count?: number;
  /** The section heading (an `h2`). @default "Comments" */
  title?: string;
  /** Show the skeleton instead of the list. @default false */
  loading?: boolean;
  /** Older comments exist: show "Load earlier" above the list. @default false */
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
  /** Replies under a comment (threads). @default undefined */
  renderReplies?: (comment: CommentData) => React.ReactNode;
  /** The composer, at the section's end. @default undefined */
  composer?: React.ReactNode;
  /** The empty state's text. @default "No comments yet" */
  emptyText?: string;
  /** Pin the relative times' clock (docs, tests). @default undefined */
  now?: number;
  /** Classes for the section. @default undefined */
  className?: string;
}

/**
 * `CommentList` — a record's comments section: "Comments" with a count, "Load earlier", the
 * comments oldest first, and the composer at the end; a skeleton while loading and "No comments
 * yet" when there are none.
 *
 * @example
 * <CommentList comments={comments} onEdit={edit} onDelete={remove} onCopyLink={copy}
 *   composer={<CommentComposer author={me} onSubmit={post} />} />
 */
export function CommentList({
  comments,
  count,
  title = "Comments",
  loading = false,
  hasEarlier = false,
  onLoadEarlier,
  loadingEarlier = false,
  highlightedId,
  onEdit,
  onDelete,
  onCopyLink,
  renderReplies,
  composer,
  emptyText = "No comments yet",
  now,
  className,
}: CommentListProps) {
  const headingId = React.useId();
  const total = count ?? comments.length;

  React.useEffect(() => {
    if (!highlightedId || loading) return;
    document
      .getElementById(`comment-${highlightedId}`)
      ?.scrollIntoView({ block: "center" });
  }, [highlightedId, loading]);

  return (
    <section
      data-slot="comment-list"
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-4", className)}
    >
      <h2
        id={headingId}
        className="flex items-center gap-2 text-base font-medium"
      >
        {title}
        {!loading && total > 0 ? (
          <span className="text-muted-foreground tabular-nums">{total}</span>
        ) : null}
      </h2>
      {loading ? (
        <CommentListSkeleton />
      ) : (
        <>
          {hasEarlier ? (
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={onLoadEarlier}
              disabled={loadingEarlier}
            >
              {loadingEarlier ? "Loading…" : "Load earlier"}
            </Button>
          ) : null}
          {comments.length === 0 ? (
            <Empty size="sm" icon={<MessageSquare aria-hidden />}>
              <EmptyHeader>
                <EmptyDescription>{emptyText}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  highlighted={comment.id === highlightedId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCopyLink={onCopyLink}
                  replies={renderReplies?.(comment)}
                  now={now}
                />
              ))}
            </ul>
          )}
        </>
      )}
      {composer}
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
