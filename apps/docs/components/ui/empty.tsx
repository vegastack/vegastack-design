// @vegastack empty@0.1.0 sha256-ZsroL+QywzDRoTWsVQPH2mqvzTH5u2J7jcCGot2Zlt0=

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@vegastack/design';

/**
 * Empty root variants — `size` (vertical density) × `bordered` (dashed
 * outline) × `surface` (card vs. transparent background). Every value is a
 * semantic Tailwind token (no hardcoded colors, no inline styles).
 */
export const emptyVariants = cva(
  'flex min-w-0 flex-col items-center justify-center gap-4 rounded-lg p-6 text-center text-balance',
  {
    variants: {
      size: {
        sm: 'py-8',
        default: 'py-12',
        lg: 'py-16',
      },
      bordered: {
        true: 'border border-dashed border-border',
        false: '',
      },
      surface: {
        // A border (borders-only canon — no shadows) keeps the block self-contained
        // even on card-colored canvases where `bg-card` alone is invisible. Combined
        // with `bordered` (dashed), the dashed style wins via tw-merge.
        card: 'border border-border bg-card',
        transparent: 'bg-transparent',
      },
    },
    defaultVariants: { size: 'default', bordered: false, surface: 'transparent' },
  },
);

/**
 * Media variants — `variant` follows the shadcn Empty anatomy (`default` bare /
 * `icon` chip) and `intent` drives the tinted chip color. `default` renders
 * children as-is (an illustration, an avatar); `icon` wraps a `lucide-react`
 * icon in a tinted circular chip at the `--icon-feature` size.
 */
export const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "rounded-full p-3 [&_svg:not([class*='size-'])]:size-(--icon-feature)",
      },
      intent: {
        default: '',
        info: '',
        destructive: '',
      },
    },
    compoundVariants: [
      { variant: 'icon', intent: 'default', class: 'bg-muted text-muted-foreground' },
      { variant: 'icon', intent: 'info', class: 'bg-info-subtle text-info-text' },
      { variant: 'icon', intent: 'destructive', class: 'bg-destructive-subtle text-destructive-text' },
    ],
    defaultVariants: { variant: 'icon', intent: 'default' },
  },
);

/** The intent tints the icon chip supports. */
export type EmptyIntent = NonNullable<VariantProps<typeof emptyMediaVariants>['intent']>;

export interface EmptyProps
  extends React.ComponentPropsWithRef<'div'>,
    VariantProps<typeof emptyVariants> {
  /**
   * Vertical density — `sm` for inside cards, `default` standalone, `lg` for
   * full-page empties.
   * @default "default"
   */
  size?: VariantProps<typeof emptyVariants>['size'];
  /**
   * Draw a dashed border around the container (the classic "drop zone" look).
   * @default false
   */
  bordered?: boolean;
  /**
   * Background surface — `card` for a filled panel, `transparent` to inherit the
   * parent surface.
   * @default "transparent"
   */
  surface?: VariantProps<typeof emptyVariants>['surface'];
}

/**
 * `Empty` — a presentational container shown when a list, table, or panel has
 * no content. Follows the shadcn Empty anatomy: compose `EmptyHeader`
 * (wrapping `EmptyMedia`, `EmptyTitle`, `EmptyDescription`) and `EmptyContent`
 * (call-to-action row). Server-safe (no hooks / no `'use client'`).
 *
 * @example
 * <Empty bordered>
 *   <EmptyHeader>
 *     <EmptyMedia variant="icon">
 *       <Inbox />
 *     </EmptyMedia>
 *     <EmptyTitle>No messages</EmptyTitle>
 *     <EmptyDescription>Your inbox is empty.</EmptyDescription>
 *   </EmptyHeader>
 *   <EmptyContent>
 *     <Button>Compose</Button>
 *   </EmptyContent>
 * </Empty>
 */
function Empty({
  className,
  size = 'default',
  bordered = false,
  surface = 'transparent',
  ...props
}: EmptyProps) {
  return (
    <div
      data-slot="empty"
      data-bordered={bordered ? '' : undefined}
      data-surface={surface}
      className={cn(emptyVariants({ size, bordered, surface }), className)}
      {...props}
    />
  );
}

export type EmptyHeaderProps = React.ComponentPropsWithRef<'div'>;

/**
 * `EmptyHeader` — groups the media, title, and description with tight spacing
 * (shadcn Empty anatomy).
 */
function EmptyHeader({ className, ...props }: EmptyHeaderProps) {
  return (
    <div
      data-slot="empty-header"
      className={cn('flex max-w-sm flex-col items-center gap-2 text-center', className)}
      {...props}
    />
  );
}

export interface EmptyMediaProps
  extends React.ComponentPropsWithRef<'div'>,
    VariantProps<typeof emptyMediaVariants> {
  /**
   * `icon` wraps children in the tinted circular chip; `default` renders them
   * bare (illustration, avatar, screenshot).
   * @default "icon"
   */
  variant?: VariantProps<typeof emptyMediaVariants>['variant'];
  /**
   * Color intent of the icon chip — neutral `default`, `info`, or `destructive`.
   * @default "default"
   */
  intent?: EmptyIntent;
}

/**
 * `EmptyMedia` — the visual slot above the title: a tinted icon chip
 * (`variant="icon"`) or bare media (`variant="default"`). Decorative by
 * default; the title carries the meaning.
 */
function EmptyMedia({
  className,
  variant = 'icon',
  intent = 'default',
  children,
  ...props
}: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      data-intent={intent}
      aria-hidden
      className={cn(emptyMediaVariants({ variant, intent }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export type EmptyTitleProps = React.ComponentPropsWithRef<'h3'>;

/** `EmptyTitle` — the primary heading of the empty state. */
function EmptyTitle({ className, ...props }: EmptyTitleProps) {
  return (
    <h3
      data-slot="empty-title"
      className={cn('text-base font-medium text-foreground', className)}
      {...props}
    />
  );
}

export type EmptyDescriptionProps = React.ComponentPropsWithRef<'p'>;

/** `EmptyDescription` — supporting body text under the title. */
function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return (
    <p
      data-slot="empty-description"
      className={cn('max-w-sm text-sm leading-normal text-muted-foreground', className)}
      {...props}
    />
  );
}

export type EmptyContentProps = React.ComponentPropsWithRef<'div'>;

/** `EmptyContent` — a centered row of call-to-action controls. */
function EmptyContent({ className, ...props }: EmptyContentProps) {
  return (
    <div
      data-slot="empty-content"
      className={cn('mt-2 flex flex-wrap items-center justify-center gap-2', className)}
      {...props}
    />
  );
}

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent };
