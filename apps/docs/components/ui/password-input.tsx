// @vegastack password-input@0.4.1 sha256-voPXHbULFGWHeAY27NmiQfnOk1W7A6KQOmBxj+Ws3vc=

"use client";

import * as React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Input } from "@/components/ui/input";

/** A single password rule shown in the optional requirements checklist. */
export interface PasswordRequirement {
  /** Human-readable description of the rule (e.g. `"At least 8 characters"`). */
  label: string;
  /** Whether the current value satisfies this rule. */
  met: boolean;
}

/** Props accepted by `PasswordInput`. */
export interface PasswordInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "type" | "prefix" | "suffix"
> {
  /**
   * Optional checklist of rules rendered below the field. Each entry shows a
   * success check (met) or a muted cross (unmet); the styling never relies on
   * color alone. Omit to render a bare password field.

   * @default undefined
   */
  requirements?: PasswordRequirement[];
  /**
   * Accessible label for the show/hide toggle button.
   * @default "Toggle password visibility"
   */
  toggleAriaLabel?: string;
}

/** Checklist-row classes — small, muted by default, success when the rule is met. */
const requirementClasses = "flex items-center gap-1.5 text-sm ";

/**
 * `PasswordInput` — a password field with a show/hide eye toggle and an optional
 * requirements checklist. Wraps {@link Input} with a trailing icon button
 * (lucide `Eye`/`EyeOff`) that flips the field between `type="password"` and
 * `type="text"`; visibility is local component state. Pass `requirements` to
 * render a live checklist (lucide `Check`/`X`, `text-success-text`/`text-muted-foreground`)
 * for signup and password-reset flows. Token-only and accessible — the toggle
 * is a real `<button>` with an `aria-label` and `aria-pressed`, and forwards its
 * ref to the underlying `<input>`.
 *
 * @example
 * <PasswordInput
 *   aria-label="Password"
 *   autoComplete="new-password"
 *   requirements={[
 *     { label: 'At least 8 characters', met: value.length >= 8 },
 *     { label: 'Contains a number', met: /\d/.test(value) },
 *   ]}
 * />
 */
export function PasswordInput({
  className,
  requirements,
  toggleAriaLabel = "Toggle password visibility",
  disabled,
  "aria-describedby": ariaDescribedBy,
  ref,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  const requirementsId = React.useId();
  const requirementsStatusId = React.useId();
  const hasToggledRef = React.useRef(false);
  const requirementItems = requirements ?? [];
  const hasRequirements = requirementItems.length > 0;
  const metCount = requirementItems.filter((req) => req.met).length;
  const describedBy =
    [ariaDescribedBy, hasRequirements ? requirementsId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div data-slot="password-input" className={cn("w-full", className)}>
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        disabled={disabled}
        aria-describedby={describedBy}
        suffix={
          <button
            type="button"
            data-slot="password-input-toggle"
            onClick={() => {
              hasToggledRef.current = true;
              setVisible((v) => !v);
            }}
            disabled={disabled}
            aria-label={toggleAriaLabel}
            aria-pressed={visible}
            className={cn(
              "flex size-(--size-xs) items-center justify-center rounded-md text-muted-foreground ",
              "hover:text-foreground",
              "focus-visible:text-foreground",
              "disabled:pointer-events-none disabled:opacity-(--opacity-dim)",
            )}
          >
            {/*
             * Keyed presence (CX-13): keying to visible remounts the icon so its
             * mount animation replays on every toggle. Deliberately reused the
             * same pop-in utility rather than inventing a bespoke fade — a
             * toggle is not a success event, but (a) the spring easing's
             * overshoot is genuinely tiny (scale 0.9 to 1, peaking around 1.05 —
             * see the spring token definition in packages/design-tokens/src/base.css),
             * so in practice it doesn't read as celebratory, and (b) the
             * sanctioned motion vocabulary has no plain fade/scale alternative
             * that can animate a value on the very frame a keyed element
             * remounts (there's no prior computed style to interpolate from
             * without a starting-style mechanism, which isn't part of this
             * phase's utilities) — and one-off arbitrary motion values outside
             * the sanctioned utilities are lint-banned. The rise-on-enter
             * utility was also considered and rejected — it's documented for
             * content arrival (chat messages, skeleton reveal), and the rise
             * reads oddly on a 16px inline icon. Full reasoning:
             * docs/plans/.m-swap-summary.md.
             */}
            {visible ? (
              <EyeOff
                key="eye-off"
                className={cn(
                  "size-(--icon-default)",
                  hasToggledRef.current && "motion-pop-in",
                )}
                aria-hidden
              />
            ) : (
              <Eye
                key="eye"
                className={cn(
                  "size-(--icon-default)",
                  hasToggledRef.current && "motion-pop-in",
                )}
                aria-hidden
              />
            )}
          </button>
        }
        {...props}
      />
      {hasRequirements ? (
        <>
          <p
            id={requirementsStatusId}
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {metCount} of {requirementItems.length} password requirements met
          </p>
          <ul
            id={requirementsId}
            data-slot="password-input-requirements"
            className="mt-2 flex flex-col gap-1"
          >
            {requirementItems.map((req) => (
              <li
                key={req.label}
                data-met={req.met ? "" : undefined}
                className={cn(
                  requirementClasses,
                  req.met ? "text-success-text" : "text-muted-foreground",
                )}
              >
                {req.met ? (
                  <Check
                    className="size-(--icon-inline) shrink-0"
                    aria-hidden
                  />
                ) : (
                  <X className="size-(--icon-inline) shrink-0" aria-hidden />
                )}
                <span className="sr-only">
                  {req.met ? "Met: " : "Not met: "}
                </span>
                {req.label}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
