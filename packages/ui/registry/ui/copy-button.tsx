// @vegastack copy-button@0.2.0 sha256-b+ZnhQ/CfZFmMvQskWQQcs3r7rYQvUR++E7Lv0UtdDg=

"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn, TIMINGS } from "@vegastack/design";
// `Button` is owned by the sibling Button component; shadcn rewrites this alias on
// `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { Button, type ButtonProps } from "@/components/ui/button";

/** Props accepted by `CopyButton`. */
export interface CopyButtonProps extends Omit<
  ButtonProps,
  "aria-label" | "children" | "onClick" | "type" | "value"
> {
  /**
   * The text written to the clipboard when the button is pressed.
   */
  value: string;
  /**
   * Fired after `value` is successfully copied to the clipboard. Use it to show a
   * toast or analytics event — the transient check feedback is handled internally.

   * @default undefined
   */
  onCopied?: (value: string) => void;
  /**
   * How long (in milliseconds) the check icon stays visible before reverting to
   * the copy icon.
   * @default 1500
   */
  timeout?: number;
  /**
   * Accessible label before the value has been copied.
   * @default 'Copy'
   */
  copyLabel?: string;
  /**
   * Accessible label while the copied confirmation is visible.
   * @default 'Copied'
   */
  copiedLabel?: string;
  /**
   * Show the current copy status as visible text beside the icon. When enabled,
   * the default control size becomes `sm`; an explicit `size` still wins.
   * @default false
   */
  showLabel?: boolean;
  /**
   * Called when the copy button is pressed before the clipboard write runs.
   * Calling `event.preventDefault()` cancels the write.

   * @default undefined
   */
  onPress?: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * `CopyButton` — copy a string to the clipboard with transient check feedback.
 *
 * Wraps {@link Button} (default `ghost` / `icon-sm`) and swaps the `lucide-react`
 * `Copy` icon for a `Check` for ~1.5s after a successful copy, tinting it
 * `text-primary` for that window. Copying is neutral action feedback rather than a
 * semantic success status. The accessible label switches from `"Copy"` to
 * `"Copied"` so screen readers announce the result; the icon itself is decorative
 * (`aria-hidden`). A visually-hidden `role="status"` live region also renders the
 * `copiedLabel` text while `copied` is true (empty otherwise) — `aria-label` changes on
 * the button itself are not reliably announced by screen readers, so the live region is
 * what actually speaks the confirmation. Client-only — it uses `useState` +
 * `navigator.clipboard`.
 *
 * @example
 * <CopyButton value={apiKey} onCopied={() => toast.success('Copied')} />
 */
export function CopyButton({
  value,
  onCopied,
  timeout = TIMINGS.feedbackRevertMs,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  showLabel = false,
  variant = "ghost",
  size,
  className,
  onPress,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Clear any pending reset on unmount so we never set state on a gone component.
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = React.useCallback(
    async (event: React.MouseEvent<HTMLElement>) => {
      onPress?.(event);
      if (event.defaultPrevented) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        onCopied?.(value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), timeout);
      } catch {
        // Clipboard write can reject (denied permission, insecure context) —
        // leave the button in its default state rather than show a false success.
      }
    },
    [onCopied, onPress, timeout, value],
  );

  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      size={size ?? (showLabel ? "sm" : "icon-sm")}
      data-slot="copy-button"
      data-copied={copied ? "" : undefined}
      data-label-visible={showLabel ? "" : undefined}
      aria-label={copied ? copiedLabel : copyLabel}
      onClick={handleClick}
      className={cn(copied && "text-primary hover:text-primary", className)}
    >
      {/*
       * Keyed presence (CX-13): the key ties each icon to the copied boundary so
       * it remounts and its pop-in mount animation replays on every swap. A
       * stroke-draw treatment was the intended arrival for the success check, but
       * it's not reachable here: lucide-react's icon factory spreads consumer
       * props only onto the root svg element — the generated path is built
       * straight from the icon's fixed node array with no prop merge — so a
       * path-length attribute can never land on the path itself through the
       * public Check component's API. A hand-rolled svg reproducing the check
       * glyph would work around that, but it's barred by the icon house rule
       * (only lucide-react via the sanctioned wrappers; no hand-authored icon
       * markup). Both icons fall back to the pop-in utility instead (documented
       * deviation — see docs/plans/.m-swap-summary.md).
       */}
      {copied ? (
        <Check key="check" aria-hidden className="motion-pop-in" />
      ) : (
        <Copy key="copy" aria-hidden className="motion-pop-in" />
      )}
      {showLabel ? (
        <span data-slot="copy-button-label">
          {copied ? copiedLabel : copyLabel}
        </span>
      ) : null}
      {/* Visually-hidden live region — announces the copy confirmation to screen readers.
          The button's `aria-label` swap alone isn't reliably announced, so this is the actual
          announcement mechanism. Empty (and un-announced) until `copied` flips true. */}
      <span className="sr-only" role="status">
        {copied ? copiedLabel : ""}
      </span>
    </Button>
  );
}
