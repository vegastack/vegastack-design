// @vegastack slider@0.23.35 sha256-7fcBV/CF1rQBBMzVyUCDAVPjIBh/DZaFF6xKnMiNpB4=

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@vegastack/design";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  /*
   * A11Y-16 — Base UI's Slider keeps the real control in a visually hidden `<input type="range">`
   * INSIDE each thumb, and an `aria-label` on the root lands on a `<div>` with no role. Upstream's
   * file forwards neither, so every slider it ships is a nameless `role="slider"`: axe reports
   * `label` (critical) and a screen reader announces "slider" with no subject. `getAriaLabel` is
   * the only prop Base UI forwards to that input, so the root's label travels through it.
   */
  const thumbLabel = props["aria-label"];

  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            getAriaLabel={thumbLabel ? () => thumbLabel : undefined}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white transition-[color,box-shadow] select-none after:absolute after:-inset-2 disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
