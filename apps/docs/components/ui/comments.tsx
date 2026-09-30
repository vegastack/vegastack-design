// @vegastack comments@0.23.88 sha256-7vSJajkOUdHTOrodgqY9P1l9OQjXM0zcgrPiepFs4cY=

"use client";

import * as React from "react";
import { DEFAULT_LOCALE } from "@/lib/date-time";
import {
  ArrowUp,
  ArrowUpDown,
  Check,
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
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
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
  type TextEditProps,
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
  /** Replies, indented under the comment (one level of `CommentItem`s). @default undefined */
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
  editDefaultValue,
  onEditValueChange,
  replies,
  now,
  attachments,
  mentions,
  mentionHref,
  className,
}: CommentItemProps) {
  const [editingState, setEditingState] = React.useState(editingProp ?? false);
  const editing = onEditingChange ? !!editingProp : editingState;
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
                          Edited{" "}
                          {new Date(comment.editedAt).toLocaleString(
                            DEFAULT_LOCALE,
                          )}
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
                        <DropdownMenuItem onClick={() => setEditing(true)}>
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
              defaultValue={editStart}
              onValueChange={(value) => {
                setDraft(value);
                onEditValueChange?.(comment.id, value);
              }}
              onSubmit={(value) => void save(value)}
              onRevert={cancel}
              busy={saving}
              mentions={mentions}
              mentionHref={mentionHref}
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
            <MarkdownView className="text-sm" mentionHref={mentionHref}>
              {comment.body}
            </MarkdownView>
          )}
          {!comment.deleted && !editing && attachments ? (
            <div data-slot="comment-attachments" className="mt-1 min-w-0">
              {attachments}
            </div>
          ) : null}
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
 * CommentBox — the light editor box the composer and in-place edit share: `TextEdit`'s `boxed`
 * variant on a near-transparent fill (`bg-muted/30`) with a hairline border that darkens subtly
 * with an ease while the editor holds focus (text entry's border cue), no fill change, growing to
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
  /** A reply box: one line, its actions row hidden until it holds focus or text. */
  folded?: boolean;
  leading?: React.ReactNode;
  actions: React.ReactNode;
  mentions?: TextEditProps["mentions"];
  mentionHref?: TextEditProps["mentionHref"];
  onImageUpload?: TextEditProps["onImageUpload"];
  onFileUpload?: TextEditProps["onFileUpload"];
  onUploadError?: TextEditProps["onUploadError"];
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
  folded,
  leading,
  actions,
  mentions,
  mentionHref,
  onImageUpload,
  onFileUpload,
  onUploadError,
}: CommentBoxProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(!!defaultValue);
  React.useEffect(() => {
    if (autoFocus) focusEditor(ref.current);
  }, [autoFocus]);
  const unfolded = !folded || open;
  return (
    <div
      ref={ref}
      data-slot="comment-box"
      data-compact={compact ? "" : undefined}
      data-bare={bare ? "" : undefined}
      data-folded={folded && !open ? "" : undefined}
      aria-invalid={invalid || undefined}
      className="min-w-0"
      onFocus={folded ? () => setOpen(true) : undefined}
    >
      <TextEdit
        variant="boxed"
        className={cn(
          "rounded-xl border-border bg-muted/30 px-3 py-2.5 dark:bg-muted/30",
          compact && "py-2",
          bare &&
            "rounded-none border-0 bg-transparent p-0 dark:bg-transparent",
        )}
        format="markdown"
        slashCommands={TEXT_EDIT_COMPACT_SLASH_COMMANDS}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={label}
        onValueChange={(value) => {
          if (folded && value.trim()) setOpen(true);
          onValueChange(value);
        }}
        onSubmit={onSubmit}
        onRevert={() => {
          if (folded) setOpen(false);
          onRevert?.();
        }}
        saving={busy}
        disabled={disabled}
        dragHandles={false}
        minHeight={compact ? undefined : 40}
        // About twelve lines of body text, then it scrolls inside the box.
        maxHeight="15rem"
        aria-invalid={invalid ? true : undefined}
        mentions={mentions}
        mentionHref={mentionHref}
        onImageUpload={onImageUpload}
        onFileUpload={onFileUpload}
        onUploadError={onUploadError}
      >
        {unfolded ? (
          <div className="mt-2 flex min-w-0 items-center gap-2">
            {leading}
            <div className="ms-auto flex shrink-0 items-center gap-2">
              {actions}
            </div>
          </div>
        ) : null}
      </TextEdit>
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
  /**
   * The editor's starting text on mount — e.g. a restored draft; Send is enabled while it is
   * non-empty. After a successful post the box starts empty. @default undefined
   */
  defaultValue?: string;
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
  defaultValue,
  placeholder = "Add a comment…",
  submitLabel = "Send comment",
  attachments,
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
  className,
}: CommentComposerProps) {
  const [generation, setGeneration] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [errorState, setErrorState] = React.useState<string | null>(null);
  const [body, setBody] = React.useState(defaultValue ?? "");
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
        defaultValue={generation === 0 ? defaultValue : undefined}
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
        mentions={mentions}
        mentionHref={mentionHref}
        onImageUpload={onImageUpload}
        onFileUpload={onFileUpload}
        onUploadError={onUploadError}
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
  /** The replies, oldest first. */
  replies: CommentData[];
}

/** Props for `CommentThread`. */
export interface CommentThreadProps {
  /** The thread. */
  thread: CommentThreadData;
  /** Post a reply; the box clears when it resolves and keeps the text when it rejects. */
  onReply: MaybeAsync<[body: string]>;
  /** Resolve the thread; the header shows a ✓ button when set. @default undefined */
  onResolve?: () => void | Promise<unknown>;
  /** Reopen a resolved thread; the resolved header shows Reopen when set. @default undefined */
  onReopen?: () => void | Promise<unknown>;
  /** Called when the quote is clicked — scroll the document to the highlight. @default undefined */
  onQuoteClick?: () => void;
  /** The thread's highlight is the active one: the card lifts. @default false */
  active?: boolean;
  /** Show the first comment, "N replies" and the last reply only, and no reply box. @default false */
  collapsed?: boolean;
  /** Called from a collapsed thread's "N replies" (shown as a button when set). @default undefined */
  onExpand?: () => void;
  /** Save an edit to any comment in the thread. @default undefined */
  onEdit?: CommentItemProps["onEdit"];
  /** Delete a comment. @default undefined */
  onDelete?: CommentItemProps["onDelete"];
  /** Add or remove the viewer's reaction on a comment. @default undefined */
  onReactionToggle?: CommentItemProps["onReactionToggle"];
  /** Copy a comment's link. @default undefined */
  onCopyLink?: CommentItemProps["onCopyLink"];
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
  /** A comment's files, under its body. @default undefined */
  renderAttachments?: (comment: CommentData) => React.ReactNode;
  /**
   * The reply box's options, passed through to its editor — `mentions`, `mentionHref`,
   * `onImageUpload`, `onFileUpload`, `onUploadError`, `placeholder`, `submitLabel`, `disabled`,
   * `attachments`; `defaultValue` (the starting text on mount, e.g. a restored draft — the box
   * opens unfolded and Send is enabled), `onValueChange` (every change, and `""` after a reply
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
 * `CommentThread` — one discussion about a piece of text (Google Docs style): the quoted words (or
 * "Original text was removed"), the first comment, its replies and a one-line "Reply…" box that
 * opens when focused (Cmd/Ctrl+Enter sends). The header's ✓ resolves it; a resolved thread says
 * who resolved it and when, and offers Reopen. `collapsed` shows the first comment, "N replies"
 * and the last reply.
 *
 * @example
 * <CommentThread thread={thread} active={thread.id === activeId}
 *   onReply={(body) => reply(thread.id, body)} onResolve={() => resolve(thread.id)}
 *   onQuoteClick={() => editor.current?.pulseAnnotation(thread.id)} />
 */
export function CommentThread({
  thread,
  onReply,
  onResolve,
  onReopen,
  onQuoteClick,
  active = false,
  collapsed = false,
  onExpand,
  onEdit,
  onDelete,
  onReactionToggle,
  onCopyLink,
  onEditValueChange,
  editingId,
  onEditingIdChange,
  editDefaultValue,
  renderAttachments,
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
  const { resolved, orphaned, quote, root, replies } = thread;

  const reply = async (body: string) => {
    if (!body.trim() || posting) return;
    setPending(true);
    setError(null);
    try {
      await onReply(body);
      setGeneration((g) => g + 1);
      setDraft("");
      composer?.onValueChange?.("");
    } catch (e) {
      setError(errorMessage(e, "Couldn't post the reply."));
    } finally {
      setPending(false);
    }
  };

  const item = (comment: CommentData) => (
    <CommentItem
      key={comment.id}
      comment={comment}
      onEdit={onEdit}
      onDelete={onDelete}
      onReactionToggle={onReactionToggle}
      onCopyLink={onCopyLink}
      onEditValueChange={onEditValueChange}
      {...editingProps(comment.id)}
      attachments={renderAttachments?.(comment)}
      mentions={composer?.mentions}
      mentionHref={composer?.mentionHref}
      now={now}
    />
  );
  const last = replies[replies.length - 1];
  const replyCount = `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`;

  return (
    <article
      data-slot="comment-thread"
      data-active={active ? "" : undefined}
      data-resolved={resolved ? "" : undefined}
      data-collapsed={collapsed ? "" : undefined}
      aria-label={`Comment by ${root.author.name}`}
      className={cn(
        // Comments inside a thread sit flat on the thread's card: the root restates the item
        // card's surface at higher specificity (a descendant rule beats its own classes).
        "flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-3 text-card-foreground transition-shadow duration-150 data-active:shadow-md",
        "[&_[data-slot=comment-card]]:rounded-none [&_[data-slot=comment-card]]:border-0 [&_[data-slot=comment-card]]:bg-transparent [&_[data-slot=comment-card]]:p-0",
        className,
      )}
    >
      <div
        data-slot="comment-thread-header"
        className="flex min-w-0 items-start gap-2"
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
                className="h-auto w-full min-w-0 justify-start rounded-sm border-s-2 border-border px-2 py-0.5 text-start text-sm font-normal whitespace-normal text-muted-foreground"
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
      <ul data-slot="comment-thread-comments" className="flex flex-col gap-3">
        {item(root)}
        {collapsed && replies.length > 0 ? (
          <>
            <li data-slot="comment-thread-more" className="ms-9">
              {onExpand ? (
                <Button
                  variant="link"
                  size="sm"
                  className="relative h-auto p-0 text-xs before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']"
                  onClick={onExpand}
                >
                  {replyCount}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {replyCount}
                </span>
              )}
            </li>
            {last ? item(last) : null}
          </>
        ) : (
          replies.map(item)
        )}
      </ul>
      {collapsed ? null : (
        <div data-slot="comment-thread-reply" className="flex flex-col gap-1.5">
          <CommentBox
            key={generation}
            compact
            folded
            autoFocus={generation > 0}
            label="Reply"
            defaultValue={generation === 0 ? composer?.defaultValue : undefined}
            placeholder={composer?.placeholder ?? "Reply…"}
            onValueChange={(value) => {
              setDraft(value);
              composer?.onValueChange?.(value);
            }}
            onSubmit={(value) => void reply(value)}
            busy={posting}
            disabled={composer?.disabled}
            invalid={!!error}
            leading={composer?.attachments}
            mentions={composer?.mentions}
            mentionHref={composer?.mentionHref}
            onImageUpload={composer?.onImageUpload}
            onFileUpload={composer?.onFileUpload}
            onUploadError={composer?.onUploadError}
            actions={
              <SendButton
                label={composer?.submitLabel ?? "Send reply"}
                loading={posting}
                disabled={!!composer?.disabled || !draft.trim()}
                onClick={() => void reply(draft)}
              />
            }
          />
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </article>
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
  /** Where a mention chip in each comment's body links (see `MarkdownView`'s `mentionHref`). @default undefined */
  mentionHref?: CommentItemProps["mentionHref"];
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
  onEditValueChange,
  editingId,
  onEditingIdChange,
  editDefaultValue,
  renderReplies,
  mentionHref,
  composer,
  emptyText = "No comments yet",
  now,
  className,
}: CommentListProps) {
  const editingProps = editingPropsFor(
    editingId,
    onEditingIdChange,
    editDefaultValue,
  );
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
                onEditValueChange={onEditValueChange}
                {...editingProps(comment.id)}
                replies={renderReplies?.(comment)}
                mentionHref={mentionHref}
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
