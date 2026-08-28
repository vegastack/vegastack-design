// @vegastack progress-indicator@0.4.1 sha256-LeGRI60ngvg271rN0uAfc3FUJiwAcfNGxYCBET33uBA=

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

/**
 * ProgressIndicator size scale — mirrors the system scale (`xs`/`sm`/`default`/`lg`)
 * and maps to the `size-*` token utilities. The SVG inherits `currentColor`, so
 * the track (the same colour at reduced opacity) and the fill come from `text-*`
 * utilities on the root — no hardcoded color is baked in. The default is
 * `text-primary`: a radial progress arc is a value/selection indicator, so it reads
 * in the neutral primary ink (matching the linear `Progress` bar). Override with a
 * status `text-*` utility (e.g. `text-success-text`) when the value carries a state.
 */
export const progressIndicatorVariants = cva(
  "inline-flex shrink-0 text-primary",
  {
    variants: {
      variant: {
        default: "",
        "inline-value": "items-center gap-2",
        "contained-value": "relative items-center justify-center",
      },
      size: {
        xs: "",
        sm: "",
        default: "",
        lg: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        size: "xs",
        className: "size-3.5",
      },
      {
        variant: "default",
        size: "sm",
        className: "size-4",
      },
      {
        variant: "default",
        size: "default",
        className: "size-5",
      },
      {
        variant: "default",
        size: "lg",
        className: "size-6",
      },
      {
        variant: "contained-value",
        size: "xs",
        className: "size-12",
      },
      {
        variant: "contained-value",
        size: "sm",
        className: "size-14",
      },
      {
        variant: "contained-value",
        size: "default",
        className: "size-16",
      },
      {
        variant: "contained-value",
        size: "lg",
        className: "size-20",
      },
    ],
    defaultVariants: { size: "default", variant: "default" },
  },
);

/** Size variant union — kept in sync with `progressIndicatorVariants` for JSDoc. */
export type ProgressIndicatorSize = NonNullable<
  VariantProps<typeof progressIndicatorVariants>["size"]
>;

/** Display variant for the visible percentage affordance. */
export type ProgressIndicatorVariant =
  "default" | "inline-value" | "contained-value";

/** Shape of the indicator outline — a true circle or a rounded-square "squircle". */
export type ProgressIndicatorShape = "circle" | "squircle";

/** Props accepted by `ProgressIndicator`. */
export interface ProgressIndicatorProps
  extends
    Omit<React.ComponentProps<"span">, "role">,
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
   * Display style. `default` renders only the compact pie-fill glyph,
   * `inline-value` adds the percentage beside the glyph, and
   * `contained-value` renders a larger bordered circle with the percentage
   * centered inside and progress drawn on the ring only.
   * @default 'default'
   */
  variant?: ProgressIndicatorVariant;
  /**
   * Outline shape: a circular ring (`circle`) or a rounded square (`squircle`).
   * @default 'circle'
   */
  shape?: ProgressIndicatorShape;
  /**
   * Dash-segment mode (Wave 2 — the checklist/steps progress voice): render a
   * row of `segments` bars instead of the radial glyph, with
   * `round(value / max × segments)` of them filled in `currentColor` and the
   * rest on the track opacity. Use for step counts ("2 of 6 steps"), not for
   * smooth percentages — the radial glyph stays the default. Takes precedence
   * over `shape` when set; minimum 2.

   * @default undefined
   */
  segments?: number;
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

   * @default undefined
   */
  "aria-label"?: string;
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
export function ProgressIndicator({
  className,
  size = "default",
  variant = "default",
  shape = "circle",
  segments,
  value = 0,
  max = 100,
  "aria-label": ariaLabel,
  ref,
  ...props
}: ProgressIndicatorProps) {
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

  const isCircle = shape === "circle";
  const isContainedValue = variant === "contained-value";
  // Squircle corner radius (in viewBox units) — rounded square, not a circle.
  const squircleRadius = 6;
  const progressRadius = isContainedValue ? center - outlineInset : pieRadius;
  const progressStrokeWidth = isContainedValue ? 2 : pieRadius * 2;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressDash = (percent / 100) * progressCircumference;
  const valueLabel = `${percent}%`;
  const glyphSizeClassName = {
    xs: "size-3.5",
    sm: "size-4",
    default: "size-5",
    lg: "size-6",
  }[size ?? "default"];
  const valueLabelClassName = {
    xs: "text-sm",
    sm: "text-base",
    default: "text-xl",
    lg: "text-2xl",
  }[size ?? "default"];
  const containedValueLabelClassName = {
    xs: "text-xs",
    sm: "text-sm",
    default: "text-base",
    lg: "text-xl",
  }[size ?? "default"];
  const rootClassName = progressIndicatorVariants({
    size,
    variant,
  });

  // Dash-segment mode: a row of bars, filled count derived from the same
  // clamped percentage. Server-safe like the radial glyph (pure markup).
  if (segments != null && segments >= 2) {
    const count = Math.floor(segments);
    const filled = Math.round((percent / 100) * count);
    const barSize = {
      xs: "h-0.5 w-2",
      sm: "h-0.5 w-2.5",
      default: "h-1 w-3",
      lg: "h-1 w-4",
    }[size ?? "default"];
    return (
      <span
        ref={ref}
        data-slot="progress-indicator"
        data-variant={variant}
        data-size={size}
        data-shape="segments"
        data-value={percent}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? `${percent}% complete`}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 text-primary",
          variant === "inline-value" && "gap-2",
          className,
        )}
        {...props}
      >
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "rounded-full bg-current transition-opacity duration-base ease-standard",
              barSize,
              i < filled ? undefined : "opacity-(--opacity-track)",
            )}
          />
        ))}
        {variant === "inline-value" && (
          <span
            aria-hidden="true"
            className={cn(
              "shrink-0 font-medium tabular-nums text-foreground",
              valueLabelClassName,
            )}
          >
            {valueLabel}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      data-slot="progress-indicator"
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      data-value={percent}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? `${percent}% complete`}
      className={cn(rootClassName, className)}
      {...props}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={cn(
          "size-full",
          variant === "inline-value" && glyphSizeClassName,
        )}
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
              clockwise from 12 o'clock. The default fill disc sits inside the
              outline (circle or squircle), so the outline shape reads as the
              indicator shape while the fill stays a clean pie wedge. The
              contained-value variant keeps the center clear by using the same
              outer radius as the track with a thin progress stroke. The chosen
              circumference is constant per render mode, so transitioning
              stroke-dasharray on
              duration-base/ease-standard sweeps the wedge to the new `value`
              instead of jumping — the same value-sweep the linear `Progress`
              bar gets from its own width transition. */}
        {percent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={progressRadius}
            stroke="currentColor"
            strokeWidth={progressStrokeWidth}
            strokeDasharray={`${progressDash} ${progressCircumference}`}
            strokeLinecap={isContainedValue ? "round" : undefined}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-[stroke-dasharray] duration-base ease-standard motion-reduce:transition-none"
          />
        )}
      </svg>
      {variant === "inline-value" && (
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 font-medium tabular-nums text-foreground",
            valueLabelClassName,
          )}
        >
          {valueLabel}
        </span>
      )}
      {variant === "contained-value" && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center justify-center font-medium tabular-nums text-foreground",
            containedValueLabelClassName,
          )}
        >
          {valueLabel}
        </span>
      )}
    </span>
  );
}
