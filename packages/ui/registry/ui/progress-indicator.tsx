// @vegastack progress-indicator@0.1.0 sha256-Hzc2gQ3iFRSAkFICF4Ul8wDKJJe6dHB+aL/fvNMloL4=

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@vegastack/design';

/**
 * ProgressIndicator size scale — mirrors the system scale (`xs`/`sm`/`default`/`lg`)
 * and maps to the `size-*` token utilities. The SVG inherits `currentColor`, so
 * the track (the same colour at reduced opacity) and the fill come from `text-*`
 * utilities on the root — no hardcoded color is baked in. The default is
 * `text-primary`: a radial progress arc is a value/selection indicator, so it reads
 * in the neutral primary ink (matching the linear `Progress` bar). Override with a
 * status `text-*` utility (e.g. `text-success-text`) when the value carries a state.
 */
export const progressIndicatorVariants = cva('inline-flex shrink-0 text-primary', {
  variants: {
    size: {
      xs: 'size-3.5',
      sm: 'size-4',
      default: 'size-5',
      lg: 'size-6',
    },
  },
  defaultVariants: { size: 'default' },
});

/** Size variant union — kept in sync with `progressIndicatorVariants` for JSDoc. */
export type ProgressIndicatorSize = NonNullable<
  VariantProps<typeof progressIndicatorVariants>['size']
>;

/** Shape of the indicator outline — a true circle or a rounded-square "squircle". */
export type ProgressIndicatorShape = 'circle' | 'squircle';

export interface ProgressIndicatorProps
  extends Omit<React.ComponentProps<'span'>, 'role'>,
    VariantProps<typeof progressIndicatorVariants> {
  /**
   * Fill percentage between `0` and `max`. `0` renders an empty track, `max`
   * renders a fully filled pie. Values are clamped into range.
   * @default 0
   */
  value?: number;
  /**
   * Upper bound of the scale — the fill is reported as `value / max`. The
   * percentage announced to assistive tech is `Math.round(value / max * 100)`.
   * @default 100
   */
  max?: number;
  /**
   * Outline shape: a circular ring (`circle`) or a rounded square (`squircle`).
   * @default 'circle'
   */
  shape?: ProgressIndicatorShape;
  /**
   * Size variant — mirrors the system scale and maps to the `size-*` tokens.
   * `xs` (14px), `sm` (16px), `default` (20px), `lg` (24px).
   * @default 'default'
   */
  size?: ProgressIndicatorSize;
  /**
   * Accessible label announced by assistive tech. Defaults to a percentage
   * string (e.g. `"60% complete"`). The element always exposes
   * `role="progressbar"` with `aria-valuenow` / `aria-valuemin` /
   * `aria-valuemax`, so a custom label is optional.
   */
  'aria-label'?: string;
}

/**
 * `ProgressIndicator` — a compact **circular / radial** progress indicator that
 * fills like a pie chart (0–100%). Distinct from the linear `Progress` bar: use
 * it inline next to a label, in a list row, or anywhere a tiny determinate
 * percentage glyph is more appropriate than a full-width bar.
 *
 * Pure presentational and **server-safe** — no hooks, no `'use client'`, no DOM
 * measurement. The arc is drawn entirely from the `value` prop via SVG
 * `stroke-dasharray`, so it renders identically on the server and the client.
 * The fill wedge transitions `stroke-dasharray` on `duration-base`/`ease-standard`,
 * so a `value` change sweeps the arc instead of jumping — matching the linear
 * `Progress` bar's `transition-[width]`.
 *
 * Token-only color: the SVG inherits `currentColor` from the root's text color
 * (`text-primary` by default — a radial value indicator reads in the neutral
 * primary ink). The track uses the same current color at reduced opacity, the fill uses
 * it at full strength — set a different hue by passing a semantic `text-*` utility
 * via `className` (e.g. `text-success-text` when the value carries a state).
 *
 * Renders `role="progressbar"` with `aria-valuenow` / `aria-valuemin` /
 * `aria-valuemax` and a percentage `aria-label`, so the state is announced
 * without any extra wiring. Forwards its ref to the root `<span>`.
 *
 * @example
 * // default circle at 25%
 * <ProgressIndicator value={25} />
 *
 * @example
 * // squircle outline, large, custom hue
 * <ProgressIndicator value={60} shape="squircle" size="lg" className="text-success-text" />
 *
 * @example
 * // custom scale + explicit label
 * <ProgressIndicator value={3} max={5} aria-label="Step 3 of 5" />
 */
export function ProgressIndicator(
    {
      className,
      size = 'default',
      shape = 'circle',
      value = 0,
      max = 100,
      'aria-label': ariaLabel,
      ref,
      ...props
    }: ProgressIndicatorProps,
  ) {
    // Clamp into [0, max] and derive the announced percentage.
    const safeMax = max > 0 ? max : 100;
    const clamped = Math.min(Math.max(value, 0), safeMax);
    const percent = Math.round((clamped / safeMax) * 100);

    // 24-unit viewBox keeps the geometry crisp at every size. The arc is a
    // stroke whose width equals the radius, so the dashed stroke fills the disc
    // from the center outward — producing a pie-fill rather than a thin ring.
    const VIEWBOX = 24;
    const center = VIEWBOX / 2;
    // Inset by 1 unit so the outline ring (strokeWidth 2) is never clipped.
    const outlineInset = 1;
    const pieRadius = center / 2; // stroke of width = radius => fully filled disc
    const circumference = 2 * Math.PI * pieRadius;
    const dash = (percent / 100) * circumference;

    const isCircle = shape === 'circle';
    // Squircle corner radius (in viewBox units) — rounded square, not a circle.
    const squircleRadius = 6;

    return (
      <span
        ref={ref}
        data-slot="progress-indicator"
        data-size={size}
        data-shape={shape}
        data-value={percent}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? `${percent}% complete`}
        className={cn(progressIndicatorVariants({ size }), className)}
        {...props}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="size-full"
        >
          {/* Track outline — current color at reduced opacity. */}
          {isCircle ? (
            <circle
              cx={center}
              cy={center}
              r={center - outlineInset}
              stroke="currentColor"
              strokeWidth={2}
              className="opacity-(--opacity-track)"
            />
          ) : (
            <rect
              x={outlineInset}
              y={outlineInset}
              width={VIEWBOX - outlineInset * 2}
              height={VIEWBOX - outlineInset * 2}
              rx={squircleRadius}
              ry={squircleRadius}
              stroke="currentColor"
              strokeWidth={2}
              className="opacity-(--opacity-track)"
            />
          )}

          {/* Pie fill — a thick stroke (width = radius) dashed to `value`, so
              the disc fills from the center outward. Rotated -90° so it grows
              clockwise from 12 o'clock. The fill disc sits inside the outline
              (circle or squircle), so the outline shape reads as the indicator
              shape while the fill stays a clean pie wedge. `circumference` is
              constant per size, so transitioning stroke-dasharray on
              duration-base/ease-standard sweeps the wedge to the new `value`
              instead of jumping — the same value-sweep the linear `Progress`
              bar gets from its own width transition. */}
          {percent > 0 && (
            <circle
              cx={center}
              cy={center}
              r={pieRadius}
              stroke="currentColor"
              strokeWidth={pieRadius * 2}
              strokeDasharray={`${dash} ${circumference}`}
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-[stroke-dasharray] duration-base ease-standard motion-reduce:transition-none"
            />
          )}
        </svg>
      </span>
    );
}
