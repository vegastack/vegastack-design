// @vegastack message@0.2.0 sha256-vi0FnVCoJv3MwSNsqiFeXdbRiIIyCNi3b2fGR6+7EvU=

import * as React from "react";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * Message — the layout primitives for a single row in a conversation thread: an optional avatar
 * anchored to the row, a content column, and optional header / footer slots. Purely presentational
 * and server-safe (no hooks, no `'use client'`); compose `Avatar`, `Bubble`, and `Marker` as
 * children. `align` ("start" | "end") flips the row for sender vs receiver. Every class is a
 * semantic token / layout utility — no hardcoded colours or sizes.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageGroup`. */
export type MessageGroupProps = React.ComponentPropsWithRef<"div">;

/**
 * `MessageGroup` — wraps consecutive messages from the same sender so they stack
 * with consistent spacing.
 * @example <MessageGroup><Message /><Message /></MessageGroup>
 */
export function MessageGroup({ className, ref, ...props }: MessageGroupProps) {
  return (
    <div
      ref={ref}
      data-slot="message-group"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

/** Props accepted by `Message`. */
export interface MessageProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Which side the message sits on.
   * - `start`: received message — avatar/content read left-to-right (default).
   * - `end`: sent message — the row reverses so content hugs the end edge.
   * @default 'start'
   */
  align?: "start" | "end";
  /**
   * Opt-in entry animation (`motion-enter-up`, a fade + slight rise) for a
   * message row that is newly appended to a live thread — e.g. a message that
   * just streamed in, or one the user just sent. **Default off**: an existing
   * transcript rendered on page load must not animate every row. Enable it only
   * on the message(s) you append after mount (mirrors `Bubble`'s `animateIn`;
   * set either or both — a `MessageScroller` composes fine with it).
   * @default false
   */
  animateIn?: boolean;
}

/**
 * `Message` — one row in a conversation. A `group/message` flex row that an
 * avatar, content column, header, and footer compose into. Set `align="end"`
 * for the current user's own messages (the row reverses). Pass `animateIn` on
 * a message you append after mount (streaming/new-message arrival) to fade +
 * rise it in — off by default so existing transcripts render still. Server-safe.
 *
 * @example
 * <Message>
 *   <MessageAvatar><Avatar fallback="AL" /></MessageAvatar>
 *   <MessageContent>
 *     <Bubble><BubbleContent>Hello!</BubbleContent></Bubble>
 *   </MessageContent>
 * </Message>
 */
export function Message({
  className,
  align = "start",
  animateIn = false,
  ref,
  ...props
}: MessageProps) {
  return (
    <div
      ref={ref}
      data-slot="message"
      data-align={align}
      className={cn(
        "group/message relative flex w-full min-w-0 gap-2 text-base data-[align=end]:flex-row-reverse",
        animateIn && "motion-enter-up",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `MessageAvatar`. */
export type MessageAvatarProps = React.ComponentPropsWithRef<"div">;

/**
 * `MessageAvatar` — anchors an `Avatar` to the bottom of the message row. When
 * the row has a footer, the avatar lifts to stay aligned with the bubble.
 * @example <MessageAvatar><Avatar fallback="AL" /></MessageAvatar>
 */
export function MessageAvatar({
  className,
  ref,
  ...props
}: MessageAvatarProps) {
  return (
    <div
      ref={ref}
      data-slot="message-avatar"
      className={cn(
        "flex w-fit min-w-(--size-md) shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted group-has-data-[slot=message-footer]/message:-translate-y-8",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `MessageContent`. */
export type MessageContentProps = React.ComponentPropsWithRef<"div">;

/**
 * `MessageContent` — the vertical content column of a message (bubble(s), header,
 * footer). On an `end`-aligned row its direct slots align to the end edge.
 * @example <MessageContent><Bubble /></MessageContent>
 */
export function MessageContent({
  className,
  ref,
  ...props
}: MessageContentProps) {
  return (
    <div
      ref={ref}
      data-slot="message-content"
      className={cn(
        "flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `MessageHeader`. */
export type MessageHeaderProps = React.ComponentPropsWithRef<"div">;

/**
 * `MessageHeader` — a small, muted line above the bubble for a name or
 * timestamp. Drops its inline padding when the bubble uses the `ghost` variant.
 * @example <MessageHeader>Ada · 09:42</MessageHeader>
 */
export function MessageHeader({
  className,
  ref,
  ...props
}: MessageHeaderProps) {
  return (
    <div
      ref={ref}
      data-slot="message-header"
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-sm font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `MessageFooter`. */
export type MessageFooterProps = React.ComponentPropsWithRef<"div">;

/**
 * `MessageFooter` — a small, muted line below the bubble for status or actions.
 * Aligns to the end edge on `end`-aligned rows.
 * @example <MessageFooter>Delivered</MessageFooter>
 */
export function MessageFooter({
  className,
  ref,
  ...props
}: MessageFooterProps) {
  return (
    <div
      ref={ref}
      data-slot="message-footer"
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-sm font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end",
        className,
      )}
      {...props}
    />
  );
}
