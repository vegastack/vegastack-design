// @vegastack textarea@0.7.0 sha256-hJOKfslC3ryewrMyQ/j6MxhhLD7+HG5R5nOu3CPo2Yk=

"use client";

import * as React from "react";
import { Field as BaseField } from "@base-ui/react/field";
import { cn, fieldControl } from "@vegastack/design";

/** Props accepted by `Textarea`. */
export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /**
   * Base UI's polymorphic render prop (§7.6). Defaults to a native `<textarea>`; pass an element
   * to swap the rendered node while keeping the Field wiring and the token chrome.
   * @default <textarea />
   */
  render?: React.ComponentProps<typeof BaseField.Control>["render"];
  /**
   * Density tier — `sm` compact, `default`, `lg` roomy. Multiline fields scale by
   * min-height + padding (register P1-04).
   * @default 'md'
   */
  size?: keyof typeof sizeClasses;
  /**
   * When `true`, the field grows to fit its content instead of scrolling,
   * using native CSS `field-sizing: content`. Combine with `rows` for a
   * starting height and the `max-h-*` utility (via `className`) for a cap.
   * Falls back to a fixed, scrollable height in browsers without support.
   * @default false
   */
  autoGrow?: boolean;
}

/**
 * Density scale (register P1-04) — multiline fields size by minimum height and
 * padding rather than the fixed control heights; `sm` steps the type down a tier.
 */
const sizeClasses = {
  sm: "min-h-12 px-2.5 py-1.5 text-sm",
  md: "min-h-16 px-3 py-2",
  lg: "min-h-24 px-3 py-2.5",
} as const;

/**
 * Layout only — the border/focus/invalid/disabled chrome is `fieldControl`, the one recipe
 * every text-entry control in the system shares (audit B1-11), so `Input` and `Textarea` can
 * no longer drift apart. `outline-hidden` rather than the outline-REMOVING utility: it compiles to a
 * transparent 2px outline that `forced-colors: active` repaints, which is what keeps a focused
 * textarea locatable once the forced palette has erased the border tint (audit B1-01).
 */
const layoutClasses = "w-full min-w-0 text-base outline-hidden";

/**
 * `Textarea` — a styled `<textarea>` for multi-line text entry, with `error` (`aria-invalid`) and
 * `disabled` states and a darkened focus border (no ring, matching `Input`). Resizes vertically by
 * default; pass `autoGrow` to size to content via CSS `field-sizing`. Shares its border/token
 * styling with `Input`. Forwards its ref to the underlying `<textarea>` for focus management and
 * form libraries.
 *
 * **It renders through Base UI's `Field.Control`, and that is load-bearing** (2026-09-09). It used
 * to render a raw `<textarea>`, so a `<Field label="…"><Textarea /></Field>` — the composition the
 * docs preview ships — produced an element Base UI's Field context wired NOTHING to: measured
 * `id: null`, `aria-labelledby: null`, `aria-describedby: null`, `aria-invalid: null`, the
 * `<label for>` pointing at an id that existed on no element, and axe reporting `label` at
 * CRITICAL. An invalid field showed the neutral border because the tint keys off `aria-invalid`.
 * Every sibling control (`Input`, `FieldControl`, `ChipInput`, `OTPInput`) was already a Base UI
 * control and already wired; this is the one that was not. Standalone use is unchanged — Base UI's
 * Field parts fall back to a default context outside a `Field.Root`.
 *
 * @example
 * <Textarea aria-label="Description" autoGrow />
 *
 * @example
 * // Inside a Field, the label/description/error are wired automatically — no aria-label needed.
 * <Field label="Notes" error="Required"><Textarea /></Field>
 */
export function Textarea({
  className,
  autoGrow = false,
  size = "md",
  ref,
  render,
  ...props
}: TextareaProps) {
  return (
    <BaseField.Control
      // Base UI types `Field.Control` against `<input>` because that is what it renders by
      // DEFAULT; `render` is the sanctioned way to swap the element, and the remaining props are
      // textarea attributes the rendered DOM node accepts. The cast narrows nothing at runtime —
      // it only tells TypeScript that this Control's element is a `<textarea>`.
      render={render ?? <textarea />}
      ref={ref as React.Ref<HTMLElement>}
      data-slot="textarea"
      data-size={size}
      className={cn(
        fieldControl,
        layoutClasses,
        sizeClasses[size],
        autoGrow ? "resize-none field-sizing-content" : "resize-y",
        className,
      )}
      {...(props as React.ComponentProps<typeof BaseField.Control>)}
    />
  );
}
