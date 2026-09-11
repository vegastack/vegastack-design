// @vegastack bubble@0.8.1 sha256-ZdAm4Qk9Y4qhL1xYT2UXvw2UOaEDI8Yrox5z2cphh3I=

"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * BubbleGroup — stacks consecutive bubbles from one sender with tight spacing.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `BubbleGroup`. */
export type BubbleGroupProps = React.ComponentPropsWithRef<"div">;

/**
 * `BubbleGroup` — wraps consecutive `Bubble`s from the same sender so they stack
 * with consistent spacing.
 * @example <BubbleGroup><Bubble /><Bubble /></BubbleGroup>
 */
export function BubbleGroup({ className, ref, ...props }: BubbleGroupProps) {
  return (
    <div
      ref={ref}
      data-slot="bubble-group"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Bubble variants — the surface skin of a chat bubble. Every value is a semantic token (no
 * hardcoded colours): `default` is the dark neutral "sent" bubble; `secondary` / `muted` are
 * neutral "received" surfaces; `tinted` is a neutral `accent`-tinted received bubble (kept as a
 * distinct variant name; visually a touch stronger than `muted`); `outline` / `ghost` are quiet;
 * `destructive` flags errors and is the status family's soft recipe — the PRECOMPOSED
 * `destructive-subtle` ramp with `destructive-text` ink, exactly what the soft Buttons paint.
 * (It used to be `bg-destructive/(--alpha-soft-surface)` with `text-destructive`, the one place in
 * the registry that used a solid FILL token as body text: 5.24/4.31/4.44:1 in light and
 * 2.56/2.37/1.78:1 in dark, and its light ladder inverted because the pressed step jumped to a
 * precomposed token on a different ground. Audit 2026-09-09, HIGH-1.) Interactive bubbles
 * (a `button`/`a` as the content) lighten on hover. The variant skins the child
 * `[data-slot=bubble-content]` so the bubble tail/padding stay on the content element.
 *
 * Every tone's rest → hover → pressed steps are monotone: the neutral tones climb the surface
 * ladder (rung 1 → 2 → 3), `tinted` rests ON rung 2 (`accent`) so its pressed step is the ladder's
 * next alpha tint (`--alpha-ink-tint-strong`, L 0.884 light / 0.333 dark over card — a full rung
 * past `surface-3`) rather than `--alpha-pressed`, which composites to L 0.921 and was
 * indistinguishable from the `surface-3` hover it followed.
 * ----------------------------------------------------------------------------------------------*/

export const bubbleVariants = cva(
  "group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full",
  {
    variants: {
      variant: {
        /** Dark neutral surface — the current user's own ("sent") messages. */
        default:
          "*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary-hover [&>[data-slot=bubble-content]:is(button,a):active]:bg-primary-active",
        /** Neutral "received" surface. */
        secondary:
          "*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-surface-2 [&>[data-slot=bubble-content]:is(button,a):active]:bg-surface-3",
        /** Quieter neutral "received" surface. */
        muted:
          "*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-surface-2 [&>[data-slot=bubble-content]:is(button,a):active]:bg-surface-3",
        /** Neutral accent-tinted "received" surface, readable in light + dark. */
        tinted:
          "*:data-[slot=bubble-content]:bg-accent *:data-[slot=bubble-content]:text-accent-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-surface-3 [&>[data-slot=bubble-content]:is(button,a):active]:bg-foreground/(--alpha-ink-tint-strong)",
        /** Outlined surface on the page background. */
        outline:
          "*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-surface-2 [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground [&>[data-slot=bubble-content]:is(button,a):active]:bg-surface-3",
        /** No surface — plain text, no padding (e.g. for rich/markdown content). */
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-surface-2 [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground [&>[data-slot=bubble-content]:is(button,a):active]:bg-surface-3",
        /** Error / failed-message surface. */
        destructive:
          "*:data-[slot=bubble-content]:bg-destructive-subtle *:data-[slot=bubble-content]:text-destructive-text [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive-subtle-hover [&>[data-slot=bubble-content]:is(button,a):active]:bg-destructive-subtle-active",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** Surface skin a `Bubble` can take. */
export type BubbleVariant = NonNullable<
  VariantProps<typeof bubbleVariants>["variant"]
>;

/** Props accepted by `Bubble`. */
export interface BubbleProps
  extends
    React.ComponentPropsWithRef<"div">,
    VariantProps<typeof bubbleVariants> {
  /**
   * Surface skin.
   * - `default`: dark neutral, for sent messages.
   * - `secondary` / `muted`: neutral received surfaces.
   * - `tinted`: brand-tinted received surface.
   * - `outline` / `ghost`: quiet surfaces.
   * - `destructive`: error / failed message.
   * @default 'default'
   */
  variant?: BubbleVariant;
  /**
   * Which side the bubble hugs.
   * - `start`: received (default).
   * - `end`: sent — self-aligns to the end edge.
   * @default 'start'
   */
  align?: "start" | "end";
  /**
   * Opt-in entry animation (`motion-enter-up`, a fade + slight rise) for a
   * bubble that is newly appended to a live thread. **Default off**: an
   * existing transcript rendered on page load must not animate every bubble.
   * Enable it only on bubble(s) you append after mount — e.g. a streamed reply
   * or a message the user just sent (mirrors `Message`'s `animateIn`; set
   * either or both).
   * @default false
   */
  animateIn?: boolean;
}

/**
 * `Bubble` — the speech-bubble container inside a `Message`. Pick a `variant`
 * for the surface and `align` for the side; it skins its `BubbleContent`
 * child(ren). Inside a `Message`, the row's `align` is inherited automatically.
 * Pass `animateIn` on a newly-appended bubble (streaming/new message) to fade +
 * rise it in — off by default so existing transcripts render still.
 *
 * @example
 * <Bubble><BubbleContent>Hey there!</BubbleContent></Bubble>
 *
 * @example
 * <Bubble variant="tinted" align="end"><BubbleContent>On my way.</BubbleContent></Bubble>
 */
export function Bubble({
  variant = "default",
  align = "start",
  animateIn = false,
  className,
  ref,
  ...props
}: BubbleProps) {
  return (
    <div
      ref={ref}
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(
        bubbleVariants({ variant }),
        animateIn && "motion-enter-up",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `BubbleContent`. */
export interface BubbleContentProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Render the content surface as a different element (e.g. a `button` for an
   * interactive bubble, or an `a` for a link bubble) via Base UI `render`.

   * @default undefined
   */
  render?: useRender.RenderProp;
}

/**
 * `BubbleContent` — the actual rounded surface that carries the message text.
 * The parent `Bubble`'s `variant` colours it via `data-slot=bubble-content`.
 * Render it as a `button`/`a` for an interactive bubble — it gets a hover
 * surface and the global focus-visible ring.
 * @example <BubbleContent>Hello!</BubbleContent>
 */
export function BubbleContent({
  className,
  render,
  ref,
  ...props
}: BubbleContentProps) {
  return useRender({
    render: render ?? <div />,
    defaultTagName: "div",
    ref, // forward the consumer ref onto the rendered (or composed) element
    props: {
      "data-slot": "bubble-content",
      className: cn(
        "w-fit max-w-full min-w-0 overflow-hidden rounded-lg border border-transparent px-3 py-2.5 text-base leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:focus-visible:border-ring/(--alpha-tint-border)",
        className,
      ),
      ...props,
    },
  });
}

/* ------------------------------------------------------------------------------------------------
 * BubbleReactions — a small floating chip of reaction emoji/counts pinned to a bubble's corner.
 * ----------------------------------------------------------------------------------------------*/

export const bubbleReactionsVariants = cva(
  "absolute z-(--z-raised) flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-base ring-3 ring-card has-[button]:p-0",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  },
);

/** Props accepted by `BubbleReactions`. */
export interface BubbleReactionsProps
  extends
    React.ComponentPropsWithRef<"div">,
    VariantProps<typeof bubbleReactionsVariants> {
  /**
   * Vertical anchor relative to the bubble.
   * @default 'bottom'
   */
  side?: "top" | "bottom";
  /**
   * Horizontal anchor relative to the bubble.
   * @default 'end'
   */
  align?: "start" | "end";
}

/**
 * `BubbleReactions` — a floating reactions chip pinned to a bubble corner. Place
 * it inside a `Bubble` (which is `relative`); choose `side`/`align` for the
 * corner. A `ring-card` cuts a clean gap so it reads as separate from the bubble.
 *
 * @example
 * <Bubble>
 *   <BubbleContent>Nice work!</BubbleContent>
 *   <BubbleReactions>👍 3</BubbleReactions>
 * </Bubble>
 */
export function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  ref,
  ...props
}: BubbleReactionsProps) {
  return (
    <div
      ref={ref}
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  );
}
