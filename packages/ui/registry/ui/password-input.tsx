// @vegastack password-input@0.7.2 sha256-X0H/R2B67HsColVkaU75AsI1l2BYTe5Nrd4pw6RCHoE=

"use client";

import * as React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { IconButton } from "@/components/ui/icon-button";
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
const requirementClasses = "flex items-center gap-1.5 text-sm";

/**
 * `PasswordInput` — a password field with a show/hide eye toggle and an optional
 * requirements checklist. Wraps {@link Input} with a trailing {@link IconButton}
 * (lucide `Eye`/`EyeOff`) that flips the field between `type="password"` and
 * `type="text"`; visibility is local component state. Pass `requirements` to
 * render a live checklist (lucide `Check`/`X`, `text-success-text`/`text-muted-foreground`)
 * for signup and password-reset flows. Token-only and accessible — the toggle
 * is an `IconButton`, which makes its `aria-label` a type error to omit, and the field
 * forwards its ref to the underlying `<input>`.
 *
 * The eye swap has **no motion** (audit B8-08). It used to replay `motion-pop-in` on every
 * toggle behind a `hasToggledRef` guard; a visibility toggle is not an arrival and not a
 * success, Geist and Linear both swap the glyph instantly, and the guard existed only to stop
 * the animation firing on first paint — a tell that the animation did not belong there.
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
          // `IconButton` rather than a hand-rolled `<button>` (audit B8-08): it already owns
          // the 24px pointer target, the focus grammar and the ghost hover/pressed pair, and
          // it makes the accessible name a compile-time requirement. `xs` is 24px, which
          // leaves the wash inset 4px inside a 32px field — clear of the hairline, so the
          // ghost fill satisfies the hover-geometry rule that forced the old ink-only hover.
          // No `data-slot` of our own: `IconButton` writes `data-slot="icon-button"` AFTER its
          // prop spread, so a caller's value never reaches the DOM. The toggle is addressed by
          // role + accessible name, which is what assistive tech and tests both use anyway.
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
            aria-label={toggleAriaLabel}
            aria-pressed={visible}
          >
            {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </IconButton>
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
