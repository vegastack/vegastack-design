// @vegastack reactions@0.23.39 sha256-r9l/K/cVznQug9C3ABad/QsEyUszs8RuYqvR/ElS8MQ=

"use client";

import * as React from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { EmojiPicker, useEmojiData } from "@/components/ui/emoji-picker";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/* ------------------------------------------------------------------------------------------------
 * Reactions — Slack-style emoji reactions: a wrapping row of pills (emoji + count, tinted when the
 * viewer reacted; a click toggles) and a ghost "Add reaction" button that opens `EmojiPicker` with
 * a quick row. Hovering a pill opens a small card naming who reacted. The host owns the data; a
 * toggle that returns a promise keeps its pill busy until it settles.
 * ----------------------------------------------------------------------------------------------*/

/** Someone who reacted. */
export interface ReactionUser {
  /** Stable id. */
  id: string;
  /** Display name. */
  name: string;
  /** No longer active — the name is marked "(Inactive)". @default false */
  inactive?: boolean;
}

/** One emoji's reactions on a record. */
export interface ReactionData {
  /** The emoji character. */
  emoji: string;
  /** How many people reacted with it. */
  count: number;
  /** The viewer is one of them — the pill is tinted and pressed. */
  reacted: boolean;
  /** Who reacted, oldest first (may be fewer than `count`). */
  users: ReactionUser[];
}

/** The default quick reactions: 👍 ❤️ 😄 🎉 👀 🙏. */
export const QUICK_REACTIONS = ["👍", "❤️", "😄", "🎉", "👀", "🙏"];

type MaybeAsync<T extends unknown[]> = (...args: T) => void | Promise<unknown>;

/** Props for `Reactions`. */
export interface ReactionsProps {
  /** The reactions, in display order. Zero-count entries are skipped. */
  reactions: ReactionData[];
  /** Add or remove the viewer's reaction; may return a promise. @default undefined */
  onToggle?: MaybeAsync<[emoji: string]>;
  /** Names listed in a pill's card before "and N others". @default 10 */
  maxUsersShown?: number;
  /** The picker's quick row. @default QUICK_REACTIONS */
  quickReactions?: string[];
  /** Show the "Add reaction" button (needs `onToggle`). @default true */
  showAdd?: boolean;
  /** Classes for the row. @default undefined */
  className?: string;
}

/** `"A"`, `"A and B"`, `"A, B and C"`, `"A, B and 3 others"`. */
export function formatReactors(
  users: ReactionUser[],
  count: number,
  max = 10,
): string {
  const names = users
    .slice(0, Math.max(1, max))
    .map((u) => (u.inactive ? `${u.name} (Inactive)` : u.name));
  const rest = Math.max(0, count - names.length);
  if (rest > 0)
    return `${names.join(", ")} and ${rest} ${rest === 1 ? "other" : "others"}`;
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * `toggleReaction` — the next reactions after `viewer` toggles `emoji`: adds or removes them, keeps
 * the order, drops an emoji that falls to zero and appends a new one. Pure, for optimistic updates.
 *
 * @example
 * setReactions((rs) => toggleReaction(rs, "👍", me));
 */
export function toggleReaction(
  reactions: ReactionData[],
  emoji: string,
  viewer: ReactionUser,
): ReactionData[] {
  const current = reactions.find((r) => r.emoji === emoji);
  if (!current)
    return [...reactions, { emoji, count: 1, reacted: true, users: [viewer] }];
  return reactions
    .map((r) =>
      r.emoji !== emoji
        ? r
        : r.reacted
          ? {
              ...r,
              count: r.count - 1,
              reacted: false,
              users: r.users.filter((u) => u.id !== viewer.id),
            }
          : {
              ...r,
              count: r.count + 1,
              reacted: true,
              users: [...r.users, viewer],
            },
    )
    .filter((r) => r.count > 0);
}

function shortcode(name: string | undefined, emoji: string): string {
  return name ? `:${name.toLowerCase().replace(/[^a-z0-9+-]+/g, "_")}:` : emoji;
}

/** `ReactionPill` — one emoji and its count; pressed when the viewer reacted. */
function ReactionPill({
  reaction,
  onToggle,
  maxUsersShown,
}: {
  reaction: ReactionData;
  onToggle?: ReactionsProps["onToggle"];
  maxUsersShown: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const data = useEmojiData(open);
  const name = data?.getEmoji(reaction.emoji)?.name;
  const who = formatReactors(reaction.users, reaction.count, maxUsersShown);

  const toggle = async () => {
    if (!onToggle || busy) return;
    setBusy(true);
    try {
      await onToggle(reaction.emoji);
    } catch {
      // The host reports the failure (a toast) and rolls its data back.
    } finally {
      setBusy(false);
    }
  };

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        delay={300}
        closeDelay={100}
        render={
          <Button
            type="button"
            variant="outline"
            size="xs"
            data-slot="reaction-pill"
            data-reacted={reaction.reacted ? "" : undefined}
            aria-pressed={reaction.reacted}
            aria-busy={busy || undefined}
            aria-label={`${name ?? reaction.emoji} ${reaction.count}, ${
              reaction.reacted ? "remove your reaction" : "react"
            }`}
            onClick={() => void toggle()}
            className="rounded-full tabular-nums data-[reacted]:border-primary/40 data-[reacted]:bg-primary/10 data-[reacted]:hover:bg-primary/15"
          />
        }
      >
        <span aria-hidden className="text-sm leading-none">
          {reaction.emoji}
        </span>
        <span aria-hidden>{reaction.count}</span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        data-slot="reaction-card"
        className="flex w-auto max-w-64 flex-col items-center gap-1 p-2 text-center"
      >
        <span aria-hidden className="text-2xl leading-none">
          {reaction.emoji}
        </span>
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground">{who}</span> reacted with{" "}
          {shortcode(name, reaction.emoji)}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * `ReactionAdd` — the ghost "Add reaction" button that opens the compact `EmojiPicker` with the
 * quick row. `CommentItem` shows it in its hover actions.
 *
 * @example
 * <ReactionAdd onSelect={(emoji) => toggle(emoji)} />
 */
export function ReactionAdd({
  onSelect,
  quickReactions = QUICK_REACTIONS,
  label = "Add reaction",
  size = "icon-xs",
  className,
}: {
  /** Called with the picked emoji. */
  onSelect: (emoji: string) => void;
  /** The picker's quick row. @default QUICK_REACTIONS */
  quickReactions?: string[];
  /** Accessible label. @default "Add reaction" */
  label?: string;
  /** The button size — `icon-sm` beside another row action such as a ⋯ menu. @default "icon-xs" */
  size?: "icon-xs" | "icon-sm";
  /** Classes for the button. @default undefined */
  className?: string;
}) {
  return (
    <EmojiPicker
      size="sm"
      quickEmoji={quickReactions}
      onValueChange={onSelect}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size={size}
          aria-label={label}
          title={label}
          data-slot="reaction-add"
          className={cn(size === "icon-xs" && "rounded-full", className)}
        >
          <SmilePlus aria-hidden />
        </Button>
      }
    />
  );
}

/**
 * `Reactions` — a row of reaction pills plus an "Add reaction" button. A pill shows the emoji and
 * its count, is pressed and tinted when the viewer reacted, toggles on click, and on hover names
 * who reacted. Picking an emoji the viewer already reacted with does nothing.
 *
 * @example
 * <Reactions reactions={reactions} onToggle={(emoji) => toggle(emoji)} />
 */
export function Reactions({
  reactions,
  onToggle,
  maxUsersShown = 10,
  quickReactions = QUICK_REACTIONS,
  showAdd = true,
  className,
}: ReactionsProps) {
  const shown = reactions.filter((r) => r.count > 0);
  if (shown.length === 0 && !(showAdd && onToggle)) return null;

  const add = (emoji: string) => {
    if (shown.some((r) => r.emoji === emoji && r.reacted)) return;
    void Promise.resolve(onToggle?.(emoji)).catch(() => {});
  };

  return (
    <div
      role="group"
      aria-label="Reactions"
      data-slot="reactions"
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      {shown.map((reaction) => (
        <ReactionPill
          key={reaction.emoji}
          reaction={reaction}
          onToggle={onToggle}
          maxUsersShown={maxUsersShown}
        />
      ))}
      {showAdd && onToggle ? (
        <ReactionAdd onSelect={add} quickReactions={quickReactions} />
      ) : null}
    </div>
  );
}
