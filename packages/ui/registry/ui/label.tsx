// @vegastack label@0.6.0 sha256-4FUFA5WvUImfNXs7A5vFkQdQnSd++/v5zBzsdq/CeuA=

import * as React from "react";
import { cn } from "@vegastack/design";

/** Props accepted by `Label`. */
export interface LabelProps extends React.ComponentProps<"label"> {
  /**
   * Marks the labelled control as required by setting `data-required` on the
   * `<label>` (a styling/automation hook — no visual asterisk). Enforce
   * requiredness on the control itself (`required`) and surface it with an
   * inline `FieldError` on submit, not with a decorative mark.
   * @default false
   */
  required?: boolean;
}

/**
 * `Label` — a styled native `<label>` for form controls. Associate it with a
 * control via `htmlFor` (matching the control's `id`) or by wrapping the control
 * as a child. Dims to 50% opacity when the labelled/peer control is disabled
 * (`peer-disabled:opacity-(--opacity-dim)`) or sits inside a disabled group
 * (`group-data-[disabled=true]:opacity-(--opacity-dim)`). Pass `required` to set a
 * `data-required` hook (no visual asterisk).
 *
 * Pure presentational and server-safe — no hooks, no `'use client'`. Forwards
 * its ref to the underlying `<label>`.
 *
 * @example
 * // Associated by htmlFor / id
 * <Label htmlFor="email" required>Email</Label>
 * <Input id="email" type="email" required />
 *
 * @example
 * // Wrapping the control
 * <Label>
 *   <Checkbox />
 *   Remember me
 * </Label>
 */
export function Label({
  className,
  required = false,
  children,
  ref,
  ...props
}: LabelProps) {
  return (
    <label
      ref={ref}
      data-slot="label"
      data-required={required ? "" : undefined}
      className={cn(
        "flex items-center gap-2 text-label-sm text-foreground select-none",
        "peer-disabled:opacity-(--opacity-dim) peer-disabled:cursor-not-allowed",
        "group-data-[disabled=true]:opacity-(--opacity-dim) group-data-[disabled=true]:pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}
