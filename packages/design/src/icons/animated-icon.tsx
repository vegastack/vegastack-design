import * as React from "react";

/** Runtime icon-role tokens — resolves in the consumer's active theme. */
const SIZES = {
  xs: "var(--icon-inline)",
  sm: "var(--icon-default)",
  md: "var(--icon-action)",
  lg: "var(--icon-feature)",
} as const;

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
 * Shape of a mirrored `lucide-animated` icon component: a React 19 function
 * component that accepts a runtime CSS length, spreads `span` props, and exposes
 * an {@link AnimatedIconHandle}. This is what `shadcn add @vegastack/<icon>`
 * copies in (e.g. `ActivityIcon`).
 *
 * The host is an `inline-flex` `<span>`: an icon sits inside a line of text, and
 * a block-level box there is a layout bug.
 */
export type AnimatedIconComponent = React.ComponentType<
  { size?: number | string; ref?: React.Ref<AnimatedIconHandle> } & Omit<
    React.HTMLAttributes<HTMLSpanElement>,
    "ref"
  >
>;

export interface AnimatedIconProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "ref"
> {
  /** A mirrored lucide-animated icon component, e.g. `import { ActivityIcon } from '@/components/ui/activity'`. */
  as: AnimatedIconComponent;
  /**
   * Size role — resolves through `--icon-inline/default/action/feature` at runtime.
   * @default 'md'
   */
  size?: AnimatedIconSize;
  /** Imperative animation handle forwarded to the mirrored icon. */
  ref?: React.Ref<AnimatedIconHandle>;
  /**
   * Accessible label. When provided the icon is exposed to assistive tech as an
   * image; otherwise it is `aria-hidden` (decorative).
   */
  "aria-label"?: string;
}

/**
 * `AnimatedIcon` — the one sanctioned wrapper for motion icons (`lucide-animated`,
 * mirrored into the VegaStack registry). It standardizes the size scale + a11y and
 * forwards the icon's {@link AnimatedIconHandle} ref, while the icon itself owns the
 * animation (pointer/focus/touch auto-trigger where provided upstream; or call
 * `ref.current.startAnimation()`).
 *
 * Deliberately imports no `motion` — the mirrored icon carries that dependency
 * through `@vegastack/design/create-animated-icon`, so this entry stays
 * lightweight for consumers who only use `Icon`/`BrandIcon`. Every mirrored icon
 * is gated on `prefers-reduced-motion` intrinsically (in the factory, once, as a
 * live subscription) and settles immediately at its static resting state when
 * the user requests reduced motion. No <MotionConfig> is required;
 * <MotionConfig reducedMotion="always"> can add reduction, but nothing can take
 * the OS preference away.
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
export function AnimatedIcon({
  as: Cmp,
  size = "md",
  ref,
  "aria-label": label,
  ...props
}: AnimatedIconProps) {
  return (
    <Cmp
      ref={ref}
      size={SIZES[size]}
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      {...props}
    />
  );
}
