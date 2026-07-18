import * as React from 'react';

/** Functional icon size scale (px) — matches `Icon`/`BrandIcon`. */
const SIZES = { xs: 14, sm: 16, md: 20, lg: 24 } as const;

export type AnimatedIconSize = keyof typeof SIZES;

/**
 * The imperative handle every `lucide-animated` icon exposes on its ref —
 * drive the animation programmatically instead of (or in addition to) hover.
 */
export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/**
 * Shape of a mirrored `lucide-animated` icon component: a `forwardRef` that
 * accepts a numeric `size`, spreads `div` props, and exposes an
 * {@link AnimatedIconHandle}. This is what `shadcn add @vegastack/<icon>`
 * copies in (e.g. `ActivityIcon`).
 */
export type AnimatedIconComponent = React.ForwardRefExoticComponent<
  { size?: number } & Omit<React.HTMLAttributes<HTMLDivElement>, 'ref'> &
    React.RefAttributes<AnimatedIconHandle>
>;

export interface AnimatedIconProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'ref'> {
  /** A mirrored lucide-animated icon component, e.g. `import { ActivityIcon } from '@/components/ui/activity'`. */
  as: AnimatedIconComponent;
  /**
   * Size token — maps to 14/16/20/24px (overrides the icon's default 28px).
   * @default 'md'
   */
  size?: AnimatedIconSize;
  /**
   * Accessible label. When provided the icon is exposed to assistive tech as an
   * image; otherwise it is `aria-hidden` (decorative).
   */
  'aria-label'?: string;
}

/**
 * `AnimatedIcon` — the one sanctioned wrapper for motion icons (`lucide-animated`,
 * mirrored into the VegaStack registry). It standardizes the size scale + a11y and
 * forwards the icon's {@link AnimatedIconHandle} ref, while the icon itself owns the
 * animation (animates on hover; or call `ref.current.startAnimation()`).
 *
 * Deliberately imports no `motion` — the mirrored icon component carries that
 * dependency, so the base package stays lightweight. For app-wide
 * reduced-motion, wrap your tree once in Motion's
 * `<MotionConfig reducedMotion="user">`.
 *
 * @example
 * 'use client';
 * import { AnimatedIcon } from '@vegastack/design/icons';
 * import { ActivityIcon } from '@/components/ui/activity';
 *
 * <AnimatedIcon as={ActivityIcon} size="sm" aria-label="Activity" />
 *
 * @example
 * // Programmatic control via the forwarded handle
 * const ref = React.useRef<AnimatedIconHandle>(null);
 * <AnimatedIcon as={ActivityIcon} ref={ref} />
 * <button onClick={() => ref.current?.startAnimation()}>Play</button>
 */
export const AnimatedIcon = React.forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ as: Cmp, size = 'md', 'aria-label': label, ...props }, ref) => (
    <Cmp
      ref={ref}
      size={SIZES[size]}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      {...props}
    />
  ),
);
AnimatedIcon.displayName = 'AnimatedIcon';
