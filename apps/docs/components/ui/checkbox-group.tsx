// @vegastack checkbox-group@0.8.0 sha256-2YdROUKSlEp3fwVLELIlD/8zeKq56QuQl5F/P/Hp3uE=

"use client";

import * as React from "react";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { cn } from "@vegastack/design";

/* ---
`CheckboxGroup` exists because "select all" was being hand-rolled everywhere it appeared
(audit B1-16). DataGrid and DataList each derive a header checkbox's indeterminate state from
their own row selection, and every settings page with a permissions block did the arithmetic
again: count the ticked children, compare against the total, decide between checked, unchecked
and mixed, and remember to write the whole set on toggle. Base UI ships that machine —
`allValues` plus a `parent` Checkbox — and the system had no wrapper for it, so nobody used it.

This is a layout + semantics wrapper, nothing more. The parent/child arithmetic, the mixed
state, the shared `value` array and the disabled propagation are Base UI's; what is ours is the
vertical rhythm, the `data-slot` hooks, and the accessible-name contract below.

Naming: `CheckboxGroup` is the group; there is no `CheckboxGroupItem`. A child is a plain
`Checkbox` with a `value`, exactly as Base UI composes it — inventing a wrapper for the child
would add a component whose only job is to forward every prop.

Deliberately NOT done here:
- No `orientation="horizontal"` variant. A checkbox list reads vertically; a horizontal row of
  independent tick boxes is a toolbar or a ToggleGroup, not this.
- No built-in "Select all" label. The parent checkbox's label is copy, and copy is the app's.
- No nesting helper. Base UI supports nested groups by composition (a group inside a group,
  each with its own `allValues`); a helper would only hide which level owns which values.
--- */

/** Props accepted by `CheckboxGroup`. */
export interface CheckboxGroupProps extends React.ComponentProps<
  typeof BaseCheckboxGroup
> {
  /**
   * Values of the checkboxes that are ticked (controlled). Pair with `onValueChange`.
   * Required — along with `allValues` — for a parent checkbox to work.

   * @default undefined
   */
  value?: string[];
  /**
   * Values ticked initially (uncontrolled). Use `value` instead for a controlled group.

   * @default undefined
   */
  defaultValue?: string[];
  /**
   * Called with the next array of ticked values whenever a child is toggled, plus Base UI's
   * event details.

   * @default undefined
   */
  onValueChange?: (
    value: string[],
    eventDetails: BaseCheckboxGroup.ChangeEventDetails,
  ) => void;
  /**
   * Every value in the group. Set it to enable a parent checkbox: the parent ticks and unticks
   * the whole set and shows the mixed (indeterminate) state when only some children are on.
   * Without it a `parent` checkbox has nothing to compute against.

   * @default undefined
   */
  allValues?: string[];
  /**
   * Disables the whole group, every child included.
   * @default false
   */
  disabled?: boolean;
}

/**
 * `CheckboxGroup` — shared state for a set of `Checkbox`es, with first-class "select all"
 * support. Renders a `<div>` holding the checkboxes; each child is a `Checkbox` carrying a
 * `value`, and the group owns the array of ticked ones.
 *
 * Pass `allValues` and mark one child `parent` to get the select-all row: Base UI ticks and
 * unticks the whole set from it, and drives its `indeterminate` (mixed) state when only some
 * children are on — the arithmetic every consumer used to write by hand (audit B1-16).
 *
 * **The group must be named.** It renders no label of its own, so give it either
 * `aria-labelledby` pointing at a heading, or a wrapping `FieldSet` + `FieldLegend` — a
 * `<fieldset>`/`<legend>` pair is the strongest form and the one to prefer in a form. An unnamed
 * group announces as a bare list of checkboxes with no idea what they belong to.
 *
 * @example
 * // Select all, controlled
 * const ALL = ["read", "write", "admin"];
 * const [value, setValue] = React.useState<string[]>([]);
 *
 * <FieldSet>
 *   <FieldLegend>Permissions</FieldLegend>
 *   <CheckboxGroup value={value} onValueChange={setValue} allValues={ALL}>
 *     <Label><Checkbox parent /> All permissions</Label>
 *     <Label><Checkbox value="read" /> Read</Label>
 *     <Label><Checkbox value="write" /> Write</Label>
 *     <Label><Checkbox value="admin" /> Admin</Label>
 *   </CheckboxGroup>
 * </FieldSet>
 *
 * @example
 * // Uncontrolled, no parent
 * <CheckboxGroup defaultValue={["email"]} aria-labelledby="notify-heading">
 *   <Label><Checkbox value="email" /> Email</Label>
 *   <Label><Checkbox value="sms" /> SMS</Label>
 * </CheckboxGroup>
 */
export function CheckboxGroup({
  className,
  ref,
  ...props
}: CheckboxGroupProps) {
  return (
    <BaseCheckboxGroup
      ref={ref}
      data-slot="checkbox-group"
      className={cn(
        // 12px between rows, and the number is load-bearing rather than taste. `Checkbox` buys
        // its WCAG 2.5.8 target with an invisible `::before` inset 6px beyond a 16px box — a
        // 28px effective hit area. At `gap-2` the rows sit 24px centre to centre, so those hit
        // areas overlap by 4px and the LATER row wins the point 12px below its neighbour's
        // centre: the contract probe's `elementFromPoint` came back holding the wrong checkbox.
        // At `gap-3` the centres are 28px apart, the hit areas meet exactly and never overlap,
        // and every row owns a clean centred 24px target. `items-start` keeps a wrapped
        // two-line label aligned to its box instead of centred against it.
        "flex flex-col items-start gap-3",
        "group-has-disabled/field:opacity-(--opacity-dim)",
        className,
      )}
      {...props}
    />
  );
}
