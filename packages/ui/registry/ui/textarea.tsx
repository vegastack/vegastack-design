// @vegastack textarea@0.25.90 sha256-Ur/lbzImgiK8f10TVayQ9dpW0PuItn+yukikvLn9KEQ=

"use client";

import * as React from "react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, mergeRefs } from "@vegastack/design";

const textareaVariants = cva(
  "flex field-sizing-content w-full transition-[color,background-color,border-color] duration-150 ease-out outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "min-h-16 rounded-lg border border-input bg-transparent px-2.5 py-2 focus:not-aria-invalid:border-ring/50 disabled:bg-input/50 aria-invalid:border-destructive dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
        // A borderless, transparent field that grows with its text: a title typed straight onto
        // the page that may wrap (a task's title). No box and no fill in any state; the caret is
        // the focus cue. An invalid title turns its placeholder destructive.
        ghost:
          "min-h-0 resize-none rounded-md border-0 bg-transparent px-0 py-0 aria-invalid:placeholder:text-destructive/70",
      },
      size: {
        default: "text-base md:text-sm",
        lg: "font-heading text-xl font-semibold md:text-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type TextareaProps = React.ComponentProps<"textarea"> &
  VariantProps<typeof textareaVariants> & {
    /**
     * Enter submits the textarea's form (`form.requestSubmit()`) instead of adding a line; Shift+
     * Enter still adds one, and Enter while an IME is composing is left alone. For a title that
     * wraps but is one paragraph.
     * @default false
     */
    submitOnEnter?: boolean;
  };

/** Grows a ghost textarea with its text where the browser has no `field-sizing: content`. */
function useAutoHeight(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  enabled: boolean,
  value: unknown,
) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (
      !enabled ||
      !el ||
      typeof CSS === "undefined" ||
      CSS.supports("field-sizing", "content")
    )
      return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    el.addEventListener("input", fit);
    return () => el.removeEventListener("input", fit);
  }, [ref, enabled, value]);
}

/**
 * `Textarea` — a multi-line text field that grows with its text (`field-sizing: content`).
 *
 * - `variant="default"`: the bordered field; focus darkens the border subtly (`border-ring/50`,
 *   150ms ease-out) and paints no fill; an invalid field keeps its destructive border.
 * - `variant="ghost"`: borderless and transparent, one row to start, for a title typed straight
 *   onto the page that may wrap.
 * - `size`: `default`, or `lg` (heading size — pair with `ghost` for a big title).
 * - `submitOnEnter`: Enter submits the form; Shift+Enter adds a line.
 *
 * @example
 * <Textarea variant="ghost" size="lg" rows={1} submitOnEnter placeholder="Task title" aria-label="Title" />
 */
function Textarea({
  className,
  variant,
  size,
  submitOnEnter = false,
  onKeyDown,
  ref,
  ...props
}: TextareaProps) {
  const inner = React.useRef<HTMLTextAreaElement | null>(null);
  useAutoHeight(inner, variant === "ghost", props.value);
  const setRef = React.useMemo(() => mergeRefs(inner, ref), [ref]);
  return (
    <FieldPrimitive.Control
      render={<textarea />}
      ref={setRef}
      data-slot="textarea"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(textareaVariants({ variant, size }), className)}
      onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
        const keyEvent =
          event as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
        onKeyDown?.(keyEvent);
        if (
          !submitOnEnter ||
          event.defaultPrevented ||
          event.key !== "Enter" ||
          event.shiftKey ||
          event.nativeEvent.isComposing
        )
          return;
        event.preventDefault();
        keyEvent.currentTarget.form?.requestSubmit();
      }}
      {...({
        rows: variant === "ghost" ? 1 : undefined,
        ...props,
      } as FieldPrimitive.Control.Props)}
    />
  );
}

export { Textarea };
