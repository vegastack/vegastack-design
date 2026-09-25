// @vegastack use-tabs-swipe@0.23.10 sha256-XsuoBa9Ej7cVg1jQHOCaowFH183VqhPfkBGhxfV32fg=

"use client";

import * as React from "react";

/** Options for `useTabsSwipe`. */
export interface UseTabsSwipeOptions<Value extends string = string> {
  /** The tab values, in visual order. */
  values: readonly Value[];
  /** The selected tab. */
  value: Value;
  /** Called with the neighbouring value after a swipe. */
  onValueChange: (value: Value) => void;
  /** Minimum horizontal travel in CSS pixels. Defaults to 48. */
  threshold?: number;
  /** Turn the gesture off. Defaults to false. */
  disabled?: boolean;
}

/** Props to spread on the element that holds the tab panels. */
export interface UseTabsSwipeResult {
  onPointerDown: React.PointerEventHandler<HTMLElement>;
  onPointerUp: React.PointerEventHandler<HTMLElement>;
  onPointerCancel: React.PointerEventHandler<HTMLElement>;
  style: React.CSSProperties;
}

/**
 * `useTabsSwipe` — switch controlled `Tabs` with a horizontal swipe on touch. Spread the result on
 * the element wrapping the `TabsContent` panels. Only touch pointers count; a mostly vertical
 * gesture stays a scroll (`touch-action: pan-y`), and the direction follows the element's
 * writing direction, so a swipe towards the start edge always moves to the next tab. Mouse and
 * keyboard keep the tab list's own behaviour.
 *
 * @example
 * const swipe = useTabsSwipe({ values: ["summary", "actions", "transcript"], value, onValueChange: setValue });
 * <Tabs value={value} onValueChange={setValue}>
 *   <TabsList>…</TabsList>
 *   <div {...swipe}>
 *     <TabsContent value="summary">…</TabsContent>
 *   </div>
 * </Tabs>
 */
export function useTabsSwipe<Value extends string = string>({
  values,
  value,
  onValueChange,
  threshold = 48,
  disabled = false,
}: UseTabsSwipeOptions<Value>): UseTabsSwipeResult {
  const start = React.useRef<{ x: number; y: number; id: number } | null>(null);
  const latest = React.useRef({
    values,
    value,
    onValueChange,
    threshold,
    disabled,
  });
  React.useLayoutEffect(() => {
    latest.current = { values, value, onValueChange, threshold, disabled };
  });

  return React.useMemo<UseTabsSwipeResult>(
    () => ({
      style: { touchAction: "pan-y" },
      onPointerDown(event) {
        if (latest.current.disabled || event.pointerType !== "touch") return;
        start.current = {
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
        };
      },
      onPointerCancel() {
        start.current = null;
      },
      onPointerUp(event) {
        const from = start.current;
        start.current = null;
        if (!from || from.id !== event.pointerId) return;
        const {
          values: list,
          value: current,
          onValueChange: change,
          threshold: min,
        } = latest.current;
        const dx = event.clientX - from.x;
        const dy = event.clientY - from.y;
        if (Math.abs(dx) < min || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const step = (dx < 0 ? 1 : -1) * (rtl ? -1 : 1);
        const next = list[list.indexOf(current) + step];
        if (next !== undefined) change(next);
      },
    }),
    [],
  );
}
