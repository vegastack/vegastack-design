// @vegastack slider@0.7.0 sha256-xJ6vG4Z+dMmfNn6mVSL24uzi+RR79yW9CYYuZLmQJis=

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

/** Hard ceiling on generated tick marks — past this a tick rail reads as a texture, not as steps. */
const MAX_DERIVED_MARKS = 24;

/**
 * Resolve `marks` to the values a tick is drawn at. `true` derives them from
 * `step` between `min` and `max` (inclusive) and bails out when that would
 * exceed `MAX_DERIVED_MARKS`; an array is taken literally, clamped to range.
 */
function getMarkValues(
  marks: boolean | readonly number[] | undefined,
  min: number,
  max: number,
  step: number,
): readonly number[] {
  if (!marks) return [];
  if (Array.isArray(marks))
    return (marks as readonly number[]).filter(
      (mark) => mark >= min && mark <= max,
    );
  if (!(step > 0) || !(max > min)) return [];
  const count = Math.round((max - min) / step);
  if (count < 1 || count > MAX_DERIVED_MARKS) return [];
  return Array.from({ length: count + 1 }, (_, index) => min + index * step);
}

/** The visual treatment of the rail, fill and thumb. */
export type SliderVariant = "default" | "media" | "overlay" | "bare";

/** Whether the thumb is drawn at rest, revealed on engagement, or never drawn. */
export type SliderThumbVisibility = "always" | "hover" | "none";

/**
 * Rail / fill / thumb recipes, one entry per `variant` (audit B4-05, 2026-09-07). Before this,
 * `audio-player.tsx` pushed ~70 `[&_[data-slot=slider-*]]:` utilities onto the component from the
 * call site to make it media-shaped; the styling now lives here, where the component owns it.
 *
 * - `default` — the form rail: `surface-1` track, `primary` fill, hollow ringed thumb.
 * - `media` — the audio card transport: subdued `muted-foreground` fill that brightens to
 *   `foreground` on hover/focus/drag, exactly matching how the ghost transport controls brighten.
 * - `overlay` — chrome drawn OVER video, on the theme-invariant `--media-*` tokens so it reads
 *   dark-scrim + light-ink in BOTH themes (audit B4-01). The rail also thickens on engagement.
 * - `bare` — an invisible hit/keyboard layer over custom-drawn media (the waveform seek): the
 *   track and fill are transparent and the control fills its box, so the drawn bars ARE the
 *   position cue while this slider keeps every pointer and keyboard seek semantic.
 */
const trackByVariant: Record<SliderVariant, string> = {
  default:
    "bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5",
  media:
    "bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5",
  // The resting thickness lives HERE and nowhere else. A base
  // `data-[orientation=horizontal]:h-1.5` alongside this `h-1` would carry the SAME specificity,
  // so which one applied would be decided by Tailwind's utility sort order (`h-1` before `h-1.5`)
  // rather than by this file — the rail would silently render at the default thickness and the
  // engagement rules below would be dead. The `group-*` variants DO outrank it: Tailwind compiles
  // them to `&:is(:where(.group\/slider):hover *)`, and the `:hover` inside `:is()` adds a class
  // to the count.
  overlay:
    "bg-media-foreground/(--alpha-wash-strong) transition-[height,width] duration-fast ease-standard data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1 group-hover/slider:data-[orientation=horizontal]:h-1.5 group-focus-within/slider:data-[orientation=horizontal]:h-1.5 group-hover/slider:data-[orientation=vertical]:w-1.5 group-focus-within/slider:data-[orientation=vertical]:w-1.5",
  bare: "bg-transparent",
};

const indicatorByVariant: Record<SliderVariant, string> = {
  default: "bg-primary",
  media:
    "bg-muted-foreground group-hover/slider:bg-foreground group-focus-within/slider:bg-foreground group-has-[[data-slot=slider-thumb][data-dragging]]/slider:bg-foreground",
  overlay: "bg-media-foreground",
  bare: "bg-transparent",
};

const thumbByVariant: Record<SliderVariant, string> = {
  default: "border-2 border-primary bg-background",
  // Solid and borderless — a hollow dot over a 1.5px media rail reads as a smudge.
  media:
    "bg-muted-foreground group-hover/slider:bg-foreground group-focus-within/slider:bg-foreground data-dragging:bg-foreground",
  overlay: "border-2 border-media-foreground bg-media-foreground",
  bare: "bg-transparent",
};

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
   * Track direction. `vertical` lays the rail out bottom-to-top and swaps the
   * arrow keys accordingly — used by the media volume control. Base UI writes
   * `data-orientation` onto every part, and each part's own layout keys off it.
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Where a thumb sits relative to the track ends. `center` lets the thumb
   * overhang the rail by half its width at either extreme; `edge` insets it so
   * it stays inside the rail — what a short media volume rail wants.
   * @default 'center'
   */
  thumbAlignment?: "center" | "edge" | "edge-client-only";
  /**
   * Visual treatment. `media` is the audio-card transport, `overlay` is chrome
   * drawn over video (theme-invariant `--media-*` ink), and `bare` is an
   * invisible hit/keyboard layer over custom-drawn media such as a waveform.
   * @default 'default'
   */
  variant?: SliderVariant;
  /**
   * Thumb visibility. `hover` hides the thumb at rest on hover-capable devices
   * only and reveals it on hover, focus or drag — on a touch device (`hover:
   * none`) it stays visible, because there is no hover to reveal it with (audit
   * B4-04). `none` draws no thumb at all (the `bare` waveform layer), while
   * keeping it focusable so arrow/Home/End still work.
   * @default 'always'
   */
  thumb?: SliderThumbVisibility;
  /**
   * Decorative tick marks (`aria-hidden`). `true` derives one tick per `step`
   * between `min` and `max`; an array places ticks at exactly those values.
   * @default false
   */
  marks?: boolean | readonly number[];
  /**
   * Show the formatted value in a small floating label above the thumb, on drag
   * and keyboard focus only (motion register M-05). Range sliders get one label
   * per thumb.
   * @default false
   */
  showValue?: boolean;
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
 * is `surface-1`, the filled portion (the value indicator) is `primary`, and each
 * thumb is a `background` dot ringed in a 2px `primary` border (flat, no shadow) that
 * grows slightly while dragging, with the centralized base.css `:focus-visible` outline (no ring of its own).
 *
 * `variant`, `orientation`, `thumb`, `marks` and `showValue` cover the shapes the
 * media players need, so no call site restyles the internals from outside.
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
 *
 * @example
 * // Stepped, with tick marks and a value readout on drag/focus
 * <Slider defaultValue={50} step={10} marks showValue aria-label="Quality" />
 */
export function Slider({
  className,
  value,
  defaultValue,
  disabled,
  min = 0,
  max = 100,
  step = 1,
  orientation = "horizontal",
  variant = "default",
  thumb = "always",
  marks = false,
  showValue = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  thumbAriaLabels,
  getThumbAriaLabel,
  ref,
  ...props
}: SliderProps) {
  const thumbCount = getThumbCount(value, defaultValue);
  const markValues = getMarkValues(marks, min, max, step);
  return (
    <BaseSlider.Root
      ref={ref}
      data-slot="slider"
      data-variant={variant}
      data-thumb={thumb}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      orientation={orientation}
      className={cn(
        // `group/slider` is how the parts react to engagement WITHOUT a call site
        // reaching in: the track thickens and the media fill brightens off
        // `group-hover`/`group-focus-within`, not off descendant overrides.
        "group/slider relative flex touch-none select-none data-disabled:opacity-(--opacity-dim)",
        "data-[orientation=horizontal]:w-full data-[orientation=horizontal]:items-center",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:flex-col data-[orientation=vertical]:justify-center",
        className,
      )}
      {...props}
    >
      <BaseSlider.Control
        data-slot="slider-control"
        className={cn(
          "relative flex data-disabled:cursor-not-allowed",
          "data-[orientation=horizontal]:w-full data-[orientation=horizontal]:items-center",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-center data-[orientation=vertical]:justify-center",
          // The bare layer is a hit target over custom-drawn media: it fills its
          // box and drops the padding a standalone rail needs. Declared as an EITHER/OR rather
          // than an override for the same reason the rail thickness is: `py-0` and `py-1.5` under
          // the same `data-[orientation]` variant tie on specificity, and the tie is broken by
          // Tailwind's sort order, not by this file.
          variant === "bare"
            ? "size-full"
            : "data-[orientation=horizontal]:py-1.5 data-[orientation=vertical]:px-1.5",
          variant !== "default" && "cursor-pointer",
        )}
      >
        <BaseSlider.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-full",
            // Length only — the rail's THICKNESS is owned by `trackByVariant`, so that a variant
            // asking for a thinner rail is not competing with an equal-specificity base rule.
            "data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full",
            variant === "bare" && "size-full rounded-none",
            trackByVariant[variant],
          )}
        >
          <BaseSlider.Indicator
            data-slot="slider-indicator"
            className={cn("rounded-full", indicatorByVariant[variant])}
          />
          {/*
            Decorative step ticks. Drawn INSIDE the (overflow-hidden) track so a
            tick can never escape the rail, `aria-hidden` because the thumb's
            native range input already carries min/max/step for assistive tech.
          */}
          {markValues.length > 0 ? (
            <span aria-hidden="true" data-slot="slider-marks">
              {markValues.map((mark) => (
                <span
                  key={mark}
                  data-slot="slider-mark"
                  className={cn(
                    "absolute size-0.5 rounded-full bg-background",
                    orientation === "vertical"
                      ? "start-1/2 bottom-[var(--slider-mark)] -translate-x-1/2 translate-y-1/2 rtl:translate-x-1/2"
                      : "top-1/2 start-[var(--slider-mark)] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2",
                  )}
                  style={
                    {
                      "--slider-mark": `${((mark - min) / (max - min)) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
          ) : null}
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
                "group/slider-thumb size-4 rounded-full",
                // Invisible hit-area expansion (WCAG 2.5.8): the 16px visual dot is below the
                // 24×24 CSS px minimum. The 2px border leaves a 12px padding box for the
                // pseudo-element, so `before:-inset-1.5` (6px) brings the effective drag/tap
                // target to 24×24 without resizing the dot. No `relative` needed — Base UI
                // already renders the thumb with an inline
                // `position: absolute` (it's placed along the track by composite `index`), which
                // is itself a valid containing block for its own `::before`.
                "before:absolute before:-inset-1.5",
                "transition-[transform,opacity] duration-fast ease-standard data-dragging:scale-110",
                // The thumb is a `<div>` (Base UI nests the native input inside it), so the
                // native `disabled:` variant can never match — key off `data-disabled`.
                "data-disabled:pointer-events-none data-disabled:cursor-not-allowed",
                thumbByVariant[variant],
                // `hover`: hidden at rest ONLY where a pointer can hover. Tailwind's `hover:`
                // variant is itself wrapped in `@media (hover: hover)`, so the reveal and the
                // hide have to agree — hence the explicit media query on the hide. On a touch
                // device the thumb simply stays visible, which is the whole point of B4-04:
                // without it there is no scrub affordance at all.
                thumb === "hover" &&
                  "[@media(hover:hover)]:opacity-0 group-hover/slider:opacity-100 group-focus-within/slider:opacity-100 data-dragging:opacity-100",
                thumb === "none" && "opacity-0",
              )}
            >
              {showValue ? (
                <BaseSlider.Value
                  data-slot="slider-value"
                  aria-hidden="true"
                  className={cn(
                    // `start-1/2` is logical but `-translate-x-1/2` is physical: in RTL the inset
                    // resolves to `right: 50%` and a negative X shift pushes the bubble further
                    // right, so it has to flip with the direction to stay centred on the thumb.
                    "pointer-events-none absolute bottom-full start-1/2 mb-1 -translate-x-1/2 rtl:translate-x-1/2 rounded-md border border-border bg-popover px-1.5 py-0.5 text-label-sm whitespace-nowrap text-popover-foreground tabular-nums",
                    "opacity-0 transition-opacity duration-fast ease-standard",
                    "group-data-dragging/slider-thumb:motion-pop-in group-data-dragging/slider-thumb:opacity-100",
                    "group-has-[:focus-visible]/slider-thumb:motion-pop-in group-has-[:focus-visible]/slider-thumb:opacity-100",
                  )}
                >
                  {(formatted) => formatted[index] ?? formatted[0]}
                </BaseSlider.Value>
              ) : null}
            </BaseSlider.Thumb>
          );
        })}
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
