// @vegastack slider@0.4.1 sha256-2+K6hNWhKRKGP5YsHgbA5FwyaFSug9X22RHof6Ey728=

"use client";

import * as React from "react";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cn } from "@vegastack/design";

/**
 * Number of thumbs to render. Base UI registers one `<Slider.Thumb>` per draggable
 * handle via its composite list (it does not clone thumbs from the value array),
 * so we derive the count from `value` / `defaultValue`: an array → one thumb per
 * entry (range), a single number → one thumb.
 */
function getThumbCount(
  value: number | readonly number[] | undefined,
  defaultValue: number | readonly number[] | undefined,
): number {
  const v = value ?? defaultValue;
  return Array.isArray(v) ? Math.max(v.length, 1) : 1;
}

function getThumbValue(
  value: number | readonly number[] | undefined,
  defaultValue: number | readonly number[] | undefined,
  index: number,
): number | undefined {
  const v = value ?? defaultValue;
  if (Array.isArray(v)) return (v as readonly number[])[index];
  return typeof v === "number" && index === 0 ? v : undefined;
}

function getFallbackThumbAriaLabel(
  ariaLabel: string | undefined,
  index: number,
  thumbCount: number,
): string | undefined {
  if (ariaLabel == null) return undefined;
  if (thumbCount === 1) return ariaLabel;
  if (thumbCount === 2)
    return `${index === 0 ? "Minimum" : "Maximum"} ${ariaLabel}`;
  return `${ariaLabel} thumb ${index + 1}`;
}

/** Props accepted by `Slider`. */
export interface SliderProps extends React.ComponentProps<
  typeof BaseSlider.Root
> {
  /**
   * Replace the rendered root element via Base UI `render` composition. Pass a
   * `ReactElement` or a render function — Base UI merges this
   * wrapper's `className`, `data-slot`, and state `data-*` onto your element,
   * forwards the ref, and keeps the slider internals (`Control` → `Track` →
   * `Indicator` + `Thumb`) as children.

   * @default undefined
   */
  render?: React.ComponentProps<typeof BaseSlider.Root>["render"];
  /**
   * Slider value. A single `number` renders one thumb; an array (e.g. `[20, 80]`)
   * renders a range with one thumb per entry. Controlled — pair with `onValueChange`.

   * @default undefined
   */
  value?: number | readonly number[];
  /**
   * Initial value for an uncontrolled slider. Use an array for a range.

   * @default undefined
   */
  defaultValue?: number | readonly number[];
  /**
   * Lowest selectable value (the origin for `step`).
   * @default 0
   */
  min?: number;
  /**
   * Highest selectable value.
   * @default 100
   */
  max?: number;
  /**
   * Granularity the value snaps to when stepping. Decimals are supported.
   * @default 1
   */
  step?: number;
  /**
   * Called with the new value (and event details) on every change while dragging
   * or stepping via the keyboard.

   * @default undefined
   */
  onValueChange?: React.ComponentProps<typeof BaseSlider.Root>["onValueChange"];
  /**
   * Accessible names for each thumb. Required for a range when the default
   * generated labels are not specific enough (for example `Minimum price` /
   * `Maximum price`).

   * @default undefined
   */
  thumbAriaLabels?: readonly string[];
  /**
   * Builds an accessible name for a thumb from its index and current/default
   * value. Takes precedence over the slider-level `aria-label` fallback.

   * @default undefined
   */
  getThumbAriaLabel?: (
    index: number,
    value: number | undefined,
  ) => string | undefined;
  /**
   * Ignore user interaction, drop the thumb(s) from the tab order, and dim the control.
   * @default false
   */
  disabled?: boolean;
}

/**
 * `Slider` — pick a number (or a `[from, to]` range) from a continuous track by
 * dragging a thumb or stepping with the keyboard. Built on Base UI's `Slider`
 * (`Root` → `Control` → `Track` → `Indicator` + `Thumb`), so it's fully keyboard
 * accessible and renders a hidden `<input type="range">` per thumb for forms.
 *
 * Pass a single `number` for one thumb, or an array for a range — the component
 * renders the right number of thumbs automatically. Token-only styling: the rail
 * is `bg-muted`, the filled portion (the value indicator) is `bg-primary`, and each
 * thumb is a `bg-background` dot ringed in a 2px `border-primary` (flat, no shadow) that
 * grows slightly while dragging, with the centralized base.css `:focus-visible` outline (no ring of its own).
 *
 * @example
 * // Single value, uncontrolled
 * <Slider defaultValue={40} aria-label="Volume" />
 *
 * @example
 * // Range, controlled, with a step
 * <Slider
 *   value={range}
 *   onValueChange={setRange}
 *   min={0}
 *   max={1000}
 *   step={10}
 *   thumbAriaLabels={['Minimum price', 'Maximum price']}
 * />
 */
export function Slider({
  className,
  value,
  defaultValue,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  thumbAriaLabels,
  getThumbAriaLabel,
  ref,
  ...props
}: SliderProps) {
  const thumbCount = getThumbCount(value, defaultValue);
  return (
    <BaseSlider.Root
      ref={ref}
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-(--opacity-dim)",
        className,
      )}
      {...props}
    >
      <BaseSlider.Control
        data-slot="slider-control"
        className="relative flex w-full items-center py-1.5 data-disabled:cursor-not-allowed"
      >
        <BaseSlider.Track
          data-slot="slider-track"
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted"
        >
          <BaseSlider.Indicator
            data-slot="slider-indicator"
            className="absolute h-full rounded-full bg-primary"
          />
        </BaseSlider.Track>
        {/*
            Thumbs are siblings of the Track, NOT children of it: the Track is
            `overflow-hidden` (to clip the rounded Indicator) and only 6px tall,
            so a thumb nested inside would be clipped to a sliver. Base UI
            positions each thumb absolutely against the (now `relative`) Control
            via its composite `index`, so sibling placement renders the full dot.
          */}
        {Array.from({ length: thumbCount }, (_, index) => {
          const thumbValue = getThumbValue(value, defaultValue, index);
          const thumbAriaLabel =
            thumbAriaLabels?.[index] ??
            getThumbAriaLabel?.(index, thumbValue) ??
            getFallbackThumbAriaLabel(ariaLabel, index, thumbCount);

          return (
            <BaseSlider.Thumb
              key={index}
              index={index}
              data-slot="slider-thumb"
              disabled={disabled}
              // The accessible name lives on the thumb's hidden <input role="slider">,
              // not the Root <div> — forward one distinct name per handle.
              aria-label={thumbAriaLabel}
              aria-labelledby={
                thumbAriaLabel == null ? ariaLabelledBy : undefined
              }
              className={cn(
                // Hollow white dot with a 2px primary ring — stays visible on BOTH the
                // dark primary fill (white-on-ink) and the muted track (ring-on-grey);
                // flat (no shadow) to match the Switch thumb. Grows slightly while dragging.
                "size-4 rounded-full border-2 border-primary bg-background",
                // Invisible hit-area expansion (WCAG 2.5.8): the 16px visual dot is below the
                // 24×24 CSS px minimum. The 2px border leaves a 12px padding box for the
                // pseudo-element, so `before:-inset-1.5` (6px) brings the effective drag/tap
                // target to 24×24 without resizing the dot. No `relative` needed — Base UI
                // already renders the thumb with an inline
                // `position: absolute` (it's placed along the track by composite `index`), which
                // is itself a valid containing block for its own `::before`.
                "before:absolute before:-inset-1.5",
                "transition-transform duration-fast ease-standard data-dragging:scale-110 motion-reduce:transition-none",
                // The thumb is a `<div>` (Base UI nests the native input inside it), so the
                // native `disabled:` variant can never match — key off `data-disabled`.
                "data-disabled:pointer-events-none data-disabled:cursor-not-allowed",
              )}
            />
          );
        })}
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
