// @vegastack copy-button@0.23.9 sha256-zM/1x8c5qfWleE2TW3+MQai2/v6+n2PepfKaBzR3cDg=

"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn, TIMINGS } from "@vegastack/design";
// `Button` is owned by the sibling Button component; shadcn rewrites this alias on
// `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { Button } from "@/components/ui/button";
import { useAnnouncer } from "@/components/ui/use-announcer";

/**
 * `Button`'s own props, derived from the component. Batch 2 of the shadcn reset replaced the
 * hand-written `ButtonOwnProps` / `ButtonAppearance` pair with upstream's flat `variant` + `size`
 * API, so these two aliases are what a wrapper reads now. Batch 7 rebuilds this component on the
 * reset primitives and they go away with it.
 */
type ButtonOwnProps = React.ComponentProps<typeof Button>;
type ButtonAppearance = Pick<ButtonOwnProps, "variant">;

/** Props accepted by `CopyButton`. */
export type CopyButtonProps = Omit<
  ButtonOwnProps,
  "aria-label" | "children" | "onClick" | "type" | "value"
> &
  ButtonAppearance & {
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
     * Show the current copy status as visible text beside the icon. With a label the control is a
     * text `Button`; without one it is the same `Button` at an icon size. An explicit `size` still
     * wins.
     * @default false
     */
    showLabel?: boolean;
    /**
   * Called when the copy button is pressed before the clipboard write runs.
   * Calling `event.preventDefault()` cancels the write.

   * @default undefined
   */
    onPress?: (event: React.MouseEvent<HTMLElement>) => void;
  };

/**
 * `CopyButton` — copy a string to the clipboard with transient check feedback.
 *
 * Wraps `Button` — `size="icon-sm"` by default, `size="sm"` when `showLabel` is set — and swaps the
 * `lucide-react`
 * `Copy` icon for a `Check` for ~1.5s after a successful copy, tinting it
 * `text-primary` for that window. Copying is neutral action feedback rather than a
 * semantic success status. The accessible label switches from `"Copy"` to
 * `"Copied"` so screen readers announce the result; the icon itself is decorative
 * (`aria-hidden`). The confirmation is spoken by the shared `useAnnouncer` live region —
 * `aria-label` changes on the button itself are not reliably announced by screen readers.
 * Client-only — it uses `useState` + `navigator.clipboard`.
 *
 * @example
 * <CopyButton value={apiKey} onCopied={() => toast.add({ type: 'success', title: 'Copied' })} />
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
  const { announce, Announcer } = useAnnouncer();
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
        announce(copiedLabel);
        onCopied?.(value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), timeout);
      } catch {
        // Clipboard write can reject (denied permission, insecure context) —
        // leave the button in its default state rather than show a false success.
      }
    },
    [announce, copiedLabel, onCopied, onPress, timeout, value],
  );

  // A label-less CopyButton is icon-only, so it takes an icon size and the `aria-label` below is
  // its whole accessible name. With a visible label it is a normal text Button. Since Batch 7a
  // retired `IconButton` there is ONE host either way — the size is the only thing that moves.
  const controlProps = {
    ...props,
    type: "button",
    variant,
    size: size ?? (showLabel ? "sm" : "icon-sm"),
    "data-slot": "copy-button",
    "data-copied": copied ? "" : undefined,
    "data-label-visible": showLabel ? "" : undefined,
    "aria-label": copied ? copiedLabel : copyLabel,
    onClick: handleClick,
    className: cn(copied && "text-primary hover:text-primary", className),
  } as unknown as ButtonOwnProps;

  return (
    <Button {...controlProps}>
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
      {/* The live region IS the announcement mechanism — the button's `aria-label` swap
          alone is not reliably announced. `use-announcer` mounts it empty from first paint
          (a region inserted at the moment it gains content is frequently missed) and
          re-keys it per call, so copying twice in a row speaks twice. */}
      <Announcer />
    </Button>
  );
}
