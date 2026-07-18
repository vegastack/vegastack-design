// @vegastack attachment@0.2.0 sha256-7ryHoVByrooaHrKM9hp8fFhFsGtmZ2wGXc8T1/2hek0=

"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";
import { Spinner } from "@/components/ui/spinner";
// `Progress` is owned by the sibling Progress component; shadcn rewrites this alias on
// `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { Progress, type ProgressProps } from "@/components/ui/progress";

/* ------------------------------------------------------------------------------------------------
 * Attachment — a self-owned, presentational file chip / card for chat and message-compose surfaces:
 * a media slot (file-type icon or image thumbnail), a name + meta line, an uploading/error/complete
 * lifecycle, and a slot for remove/download actions. There is no headless `@shadcn/react` Attachment
 * primitive published (verified against 0.2.1, which exports only `./message-scroller`), so — like
 * the rest of the chat family (`message.tsx`, `bubble.tsx`, `marker.tsx`) — this is fully self-owned:
 * plain CVA + `data-slot`/`data-*` styling hooks, no new npm dependency. Composition follows house
 * convention: state flows one level via `group/attachment` + `data-*` selectors (no React context —
 * matching `Bubble`/`Message`), and polymorphism goes through Base UI `useRender` (`AttachmentTrigger`)
 * rather than a Radix `Slot`. Every value below is a semantic token — no hardcoded colors/px/hex.
 * ----------------------------------------------------------------------------------------------*/

/** Lifecycle state of an attachment — drives the card's border, media, and text tinting. */
export type AttachmentState = "idle" | "uploading" | "error" | "complete" | "disabled";

export const attachmentVariants = cva(
  "group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 items-center gap-2 rounded-md border border-border bg-card text-sm text-card-foreground transition-colors duration-fast ease-standard focus-within:border-ring/(--alpha-tint-border) data-[state=error]:border-destructive/(--alpha-outline-border) data-[state=disabled]:pointer-events-none data-[state=disabled]:opacity-(--opacity-dim)",
  {
    variants: {
      size: {
        /** Standalone chip density. */
        default: "p-2",
        /** Tighter density for a message-compose attachment row. */
        sm: "gap-1.5 p-1.5 text-xs",
      },
      orientation: {
        /** A file chip row: media, then a name/meta column, then actions. */
        horizontal: "min-w-40 flex-row",
        /** An image-thumbnail card: media on top, content below, actions floated. */
        vertical: "w-28 flex-col items-stretch",
      },
    },
    defaultVariants: { size: "default", orientation: "horizontal" },
  },
);

/** Density — `default` for a standalone chip, `sm` for a tighter message-compose row. */
export type AttachmentSize = NonNullable<VariantProps<typeof attachmentVariants>["size"]>;

/** Layout — `horizontal` for a file chip row, `vertical` for an image-thumbnail card. */
export type AttachmentOrientation = NonNullable<
  VariantProps<typeof attachmentVariants>["orientation"]
>;

export interface AttachmentProps
  extends React.ComponentPropsWithRef<"div">, VariantProps<typeof attachmentVariants> {
  /**
   * Lifecycle state.
   * - `idle`: attached, not yet acted on.
   * - `uploading`: in flight — pair with `AttachmentProgress` and a `live` `AttachmentDescription`.
   * - `error`: failed — tints the border/media/description with destructive tokens.
   * - `complete`: finished/delivered.
   * - `disabled`: visually dimmed and inert (`pointer-events-none`); also pass `disabled` to any
   *   interactive descendant (e.g. `IconButton`) so it is unreachable by keyboard, not just the mouse.
   * @default 'idle'
   */
  state?: AttachmentState;
  /**
   * Density.
   * @default 'default'
   */
  size?: AttachmentSize;
  /**
   * Layout.
   * @default 'horizontal'
   */
  orientation?: AttachmentOrientation;
}

/**
 * `Attachment` — the root chip/card for a single file: compose `AttachmentMedia`,
 * `AttachmentContent` (`AttachmentTitle` + `AttachmentDescription` [+ `AttachmentProgress`]), and
 * `AttachmentActions`. Purely presentational — it owns no upload logic, only the visual `state`
 * machine; wire the actual upload/remove behavior in the app.
 *
 * @example
 * <Attachment state="complete">
 *   <AttachmentMedia><FileText /></AttachmentMedia>
 *   <AttachmentContent>
 *     <AttachmentTitle>release-notes.pdf</AttachmentTitle>
 *     <AttachmentDescription>248 KB</AttachmentDescription>
 *   </AttachmentContent>
 *   <AttachmentActions>
 *     <IconButton aria-label="Remove release-notes.pdf" variant="ghost" size="xs">
 *       <X />
 *     </IconButton>
 *   </AttachmentActions>
 * </Attachment>
 *
 * @example
 * // uploading, with a determinate bar and a live-announced status line
 * <Attachment state="uploading">
 *   <AttachmentMedia><FileText /></AttachmentMedia>
 *   <AttachmentContent>
 *     <AttachmentTitle>quarterly-report.xlsx</AttachmentTitle>
 *     <AttachmentDescription live>Uploading — 42%</AttachmentDescription>
 *     <AttachmentProgress value={42} aria-label="quarterly-report.xlsx upload progress" />
 *   </AttachmentContent>
 * </Attachment>
 */
export function Attachment({
  className,
  state = "idle",
  size = "default",
  orientation = "horizontal",
  ref,
  ...props
}: AttachmentProps) {
  return (
    <div
      ref={ref}
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      aria-disabled={state === "disabled" ? true : undefined}
      className={cn(attachmentVariants({ size, orientation }), className)}
      {...props}
    />
  );
}

export type AttachmentGroupProps = React.ComponentPropsWithRef<"div">;

/**
 * `AttachmentGroup` — wraps multiple `Attachment` chips (e.g. under a message-compose input),
 * wrapping onto new rows as they fill. A plain flex-wrap layout — no horizontal-scroll/snap
 * behavior, by judgment call: a wrapping row reads better than a scrolling carousel for the
 * few-to-a-dozen attachments a compose box typically holds.
 */
export function AttachmentGroup({ className, ref, ...props }: AttachmentGroupProps) {
  return (
    <div
      ref={ref}
      data-slot="attachment-group"
      className={cn("flex min-w-0 flex-wrap items-start gap-2", className)}
      {...props}
    />
  );
}

export const attachmentMediaVariants = cva(
  "relative flex size-(--size-lg) shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-(--icon-default) group-data-[size=sm]/attachment:size-(--size-md) group-data-[size=sm]/attachment:[&_svg:not([class*='size-'])]:size-(--icon-inline) group-data-[orientation=vertical]/attachment:aspect-square group-data-[orientation=vertical]/attachment:h-auto group-data-[orientation=vertical]/attachment:w-full group-data-[state=error]/attachment:bg-destructive-subtle group-data-[state=error]/attachment:text-destructive-text",
  {
    variants: {
      variant: {
        /** A centered `lucide-react` file-type glyph. */
        icon: "",
        /** An image thumbnail — pass an `Image` (or `img`) filling the box via `className="size-full"`. */
        image: "",
      },
    },
    defaultVariants: { variant: "icon" },
  },
);

/** Visual treatment of the media slot — `icon` for a file-type glyph, `image` for a thumbnail. */
export type AttachmentMediaVariant = NonNullable<
  VariantProps<typeof attachmentMediaVariants>["variant"]
>;

export interface AttachmentMediaProps
  extends React.ComponentPropsWithRef<"div">, VariantProps<typeof attachmentMediaVariants> {
  /**
   * `icon` centers a bare `lucide-react` glyph; `image` expects a filled thumbnail (compose
   * {@link "@/components/ui/image" Image} with `aspectRatio="square"` and `className="size-full"`).
   * @default 'icon'
   */
  variant?: AttachmentMediaVariant;
}

/**
 * `AttachmentMedia` — the leading visual slot: a file-type icon or an image thumbnail. Decorative
 * (`aria-hidden`) — the file name in `AttachmentTitle` carries the accessible identity, not the
 * media. While the parent `Attachment` is `state="uploading"`, an inline {@link Spinner} overlay
 * fades in automatically (composed here, not by the consumer) over a translucent backdrop.
 */
export function AttachmentMedia({
  className,
  variant = "icon",
  children,
  ref,
  ...props
}: AttachmentMediaProps) {
  return (
    <div
      ref={ref}
      data-slot="attachment-media"
      data-variant={variant}
      aria-hidden="true"
      className={cn(attachmentMediaVariants({ variant }), className)}
      {...props}
    >
      {children}
      <span
        data-slot="attachment-media-overlay"
        aria-hidden="true"
        className="absolute inset-0 hidden items-center justify-center bg-background/(--alpha-glass) text-foreground group-data-[state=uploading]/attachment:flex"
      >
        <Spinner size="inherit" label="" className="size-(--icon-default)" />
      </span>
    </div>
  );
}

export type AttachmentContentProps = React.ComponentPropsWithRef<"div">;

/**
 * `AttachmentContent` — the vertical column of `AttachmentTitle`, `AttachmentDescription`, and
 * (while uploading) `AttachmentProgress`. Flexes to fill the remaining width of the row.
 */
export function AttachmentContent({ className, ref, ...props }: AttachmentContentProps) {
  return (
    <div
      ref={ref}
      data-slot="attachment-content"
      className={cn(
        "flex max-w-full min-w-0 flex-1 flex-col justify-center leading-tight group-data-[orientation=vertical]/attachment:px-0.5",
        className,
      )}
      {...props}
    />
  );
}

export type AttachmentTitleProps = React.ComponentPropsWithRef<"span">;

/**
 * `AttachmentTitle` — the file name. Always `truncate`s (single line, ellipsis) so a long name
 * never breaks the chip's layout — pass the full name as `title` (or wrap in a `Tooltip`) if it
 * needs to be readable on hover. Shimmers while `state="uploading"` and tints destructive on
 * `state="error"`.
 */
export function AttachmentTitle({ className, ref, ...props }: AttachmentTitleProps) {
  return (
    <span
      ref={ref}
      data-slot="attachment-title"
      className={cn(
        "block max-w-full min-w-0 truncate font-medium text-foreground group-data-[state=error]/attachment:text-destructive-text group-data-[state=uploading]/attachment:shimmer",
        className,
      )}
      {...props}
    />
  );
}

export interface AttachmentDescriptionProps extends React.ComponentPropsWithRef<"span"> {
  /**
   * Mark this line as a polite live region — announce its text as it changes. Set this whenever
   * the description shows transient status copy (an upload percentage, an error message) so screen
   * reader users hear the update without having to re-focus the attachment. Leave `false` for a
   * static meta line (e.g. a plain file size) that never changes on its own.
   * @default false
   */
  live?: boolean;
}

/**
 * `AttachmentDescription` — the secondary meta line under the title: a file size, an upload
 * percentage, or an error message. Tints destructive on `state="error"`. Pass `live` to also make
 * it a `role="status"` `aria-live="polite"` region — see {@link AttachmentDescriptionProps.live}.
 */
export function AttachmentDescription({
  className,
  live = false,
  ref,
  ...props
}: AttachmentDescriptionProps) {
  return (
    <span
      ref={ref}
      data-slot="attachment-description"
      className={cn(
        "mt-0.5 block max-w-full min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive-text",
        className,
      )}
      {...(live
        ? { role: "status" as const, "aria-live": "polite" as const, "aria-atomic": "true" as const }
        : undefined)}
      {...props}
    />
  );
}

export interface AttachmentProgressProps extends Omit<ProgressProps, "size"> {
  /**
   * Accessible name for the underlying progress bar — required (there is no visible label). Include
   * the file name so assistive tech can tell multiple in-flight attachments apart, e.g.
   * `"quarterly-report.xlsx upload progress"`.
   */
  "aria-label": string;
}

/**
 * `AttachmentProgress` — a thin determinate bar for the `state="uploading"` lifecycle. A thin
 * wrapper over {@link Progress} (`size="sm"`) that sits under the title/description inside
 * `AttachmentContent`. Pair it with a `live` `AttachmentDescription` for the actual screen-reader
 * announcement — a bare `role="progressbar"` is not reliably announced on every value change.
 *
 * @example
 * <AttachmentProgress value={67} aria-label="quarterly-report.xlsx upload progress" />
 */
export function AttachmentProgress({ className, value = null, ...props }: AttachmentProgressProps) {
  return (
    <Progress
      data-slot="attachment-progress"
      size="sm"
      value={value}
      className={cn("mt-1.5", className)}
      {...props}
    />
  );
}

export type AttachmentActionsProps = React.ComponentPropsWithRef<"div">;

/**
 * `AttachmentActions` — the trailing action row (remove, download, retry). Compose
 * {@link "@/components/ui/icon-button" IconButton} inside it — its type-level `aria-label`
 * requirement is exactly the "remove button needs an accessible name" contract this component
 * needs, so `Attachment` does not re-wrap it with a bespoke action component. On
 * `orientation="vertical"` the row floats over the top-right corner of the media instead of
 * sitting inline. **Ordering:** if the card also has an `AttachmentTrigger`, place
 * `AttachmentActions` *after* it in JSX — both share the `z-(--z-raised)` stacking band, and DOM
 * order (not extra z-index tiers) decides who wins the pointer, per the token system's two-band
 * contract.
 */
export function AttachmentActions({ className, ref, ...props }: AttachmentActionsProps) {
  return (
    <div
      ref={ref}
      data-slot="attachment-actions"
      className={cn(
        "relative z-(--z-raised) flex shrink-0 items-center gap-1 group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-1.5 group-data-[orientation=vertical]/attachment:right-1.5",
        className,
      )}
      {...props}
    />
  );
}

export interface AttachmentTriggerProps extends React.ComponentPropsWithRef<"button"> {
  /**
   * Render the trigger as a different element (e.g. an `a` to open/download the file) via Base UI
   * `render` composition. Pass a `ReactElement` or a render function.
   */
  render?: useRender.RenderProp;
}

/**
 * `AttachmentTrigger` — an invisible overlay covering the whole card, turning the entire
 * `Attachment` into one activation target (open a preview, download the file). Built on Base UI
 * `useRender`, so `render={<a href={url} download />}` swaps it to a real link. Optional — omit it
 * when the only interactive parts are the actions in `AttachmentActions`.
 */
export function AttachmentTrigger({ className, render, type, ref, ...props }: AttachmentTriggerProps) {
  return useRender({
    render: render ?? <button type={type ?? "button"} />,
    defaultTagName: "button",
    ref,
    props: {
      "data-slot": "attachment-trigger",
      className: cn(
        "absolute inset-0 z-(--z-raised) rounded-[inherit] outline-none focus-visible:border-ring/(--alpha-tint-border)",
        className,
      ),
      ...props,
    },
  });
}
