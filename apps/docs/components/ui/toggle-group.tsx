// @vegastack toggle-group@0.4.0 sha256-vrbrDy3yahJeu1Cn0Cq9swe8IGJSFxWZW3xLRAYEijk=

"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cn } from "@vegastack/design";
// `toggleVariants` is owned by the sibling Toggle component; shadcn rewrites this
// alias on `add`, and vitest/tsconfig map `@/components/ui/*` → `registry/ui/*`.
import { toggleVariants } from "@/components/ui/toggle";

/* ------------------------------------------------------------------------------------------------
 * ToggleGroupContext — carries the group `size` down to each item so a consumer sets
 * it once on the root instead of repeating it per button.
 * ----------------------------------------------------------------------------------------------*/

type ToggleGroupContextValue = VariantProps<typeof toggleVariants>;

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: "default",
});

/* ------------------------------------------------------------------------------------------------
 * ToggleGroup (Root) — a set of joined toggle buttons sharing one selection.
 * Single-select by default; pass `multiple` for multi-select. Selection is an
 * array of item values (Base UI's model), controlled via `value`/`onValueChange`
 * or uncontrolled via `defaultValue`.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ToggleGroup`. */
export interface ToggleGroupProps
  extends
    Omit<
      React.ComponentProps<typeof BaseToggleGroup>,
      "value" | "defaultValue"
    >,
    VariantProps<typeof toggleVariants> {
  /**
   * The pressed items as an array of their `value`s. Controlled counterpart of
   * `defaultValue` — pair with `onValueChange`. In single-select mode the array
   * holds at most one value.

   * @default undefined
   */
  value?: readonly string[];
  /**
   * The initially pressed items as an array of their `value`s. Uncontrolled
   * counterpart of `value`.

   * @default undefined
   */
  defaultValue?: readonly string[];
  /**
   * Fired when the pressed items change, with the next array of pressed `value`s.

   * @default undefined
   */
  onValueChange?: (value: string[]) => void;
  /**
   * Allow multiple items to be pressed at once. When `false`, pressing an item
   * unpresses the others (single-select, radio-like).
   * @default false
   */
  multiple?: boolean;
  /**
   * Control height/density applied to every item — mirrors the Button scale.
   * @default 'default'
   */
  size?: VariantProps<typeof toggleVariants>["size"];
  /**
   * Layout flow. `horizontal` joins items left-to-right; `vertical` stacks them.
   * Also drives the arrow-key axis for keyboard navigation.
   * @default 'horizontal'
   */
  orientation?: "horizontal" | "vertical";
}

/**
 * `ToggleGroup` — a set of joined toggle buttons that share one selection, built
 * on Base UI Toggle Group. Flat, shadcn-style API: `ToggleGroup` →
 * `ToggleGroupItem`. Single-select by default (radio-like); pass `multiple`
 * for multi-select (checkbox-like). `size` set once on the root flows to every item
 * via context. Items render flush with shared rounded ends so the group reads as one
 * control; the pressed item takes the same evident neutral fill as a standalone Toggle.
 *
 * @example
 * <ToggleGroup defaultValue={['bold']} aria-label="Text formatting">
 *   <ToggleGroupItem value="bold"><Bold /></ToggleGroupItem>
 *   <ToggleGroupItem value="italic"><Italic /></ToggleGroupItem>
 *   <ToggleGroupItem value="underline"><Underline /></ToggleGroupItem>
 * </ToggleGroup>
 */
export function ToggleGroup({
  className,
  size = "default",
  multiple,
  orientation = "horizontal",
  onValueChange,
  children,
  ref,
  ...props
}: ToggleGroupProps) {
  const contextValue = React.useMemo<ToggleGroupContextValue>(
    () => ({ size }),
    [size],
  );
  const rootClassName =
    "group/toggle-group flex w-fit items-center rounded-md data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch";
  const resolvedClassName: React.ComponentProps<
    typeof BaseToggleGroup
  >["className"] =
    typeof className === "function"
      ? (state) => cn(rootClassName, className(state))
      : cn(rootClassName, className);

  // Adapt Base UI's `(groupValue, eventDetails)` callback to our clean
  // `(value: string[])` public signature — consumers never see event details.
  const handleValueChange = React.useCallback(
    (groupValue: string[]) => onValueChange?.(groupValue),
    [onValueChange],
  );
  return (
    <BaseToggleGroup
      ref={ref}
      data-slot="toggle-group"
      data-size={size ?? "default"}
      multiple={multiple}
      orientation={orientation}
      onValueChange={handleValueChange}
      className={resolvedClassName}
      {...props}
    >
      <ToggleGroupContext.Provider value={contextValue}>
        {children}
      </ToggleGroupContext.Provider>
    </BaseToggleGroup>
  );
}

/* ------------------------------------------------------------------------------------------------
 * ToggleGroupItem — one button in the group (Base UI Toggle). Inherits the group's
 * `size` from context (falling back to its own prop), then layers the joined-group
 * geometry: square inner corners, rounded outer ends on the first/last item.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `ToggleGroupItem`. */
export interface ToggleGroupItemProps
  extends
    React.ComponentProps<typeof BaseToggle>,
    VariantProps<typeof toggleVariants> {
  /**
   * Control height/density. Defaults to the group's `size` (set via context); set
   * here only to override a single item.
   * @default 'default'
   */
  size?: VariantProps<typeof toggleVariants>["size"];
}

/**
 * `ToggleGroupItem` — a single button within a `ToggleGroup` (Base UI Toggle).
 * Identify it with `value`; pressed state is exposed as `data-pressed` and takes the
 * shared evident neutral fill. Styling comes from `toggleVariants` with `size`
 * inherited from the group's context unless overridden. The first and last items round
 * the group's outer corners while inner corners stay square, so the buttons read as one
 * joined control.
 *
 * @example
 * <ToggleGroupItem value="bold" aria-label="Bold"><Bold /></ToggleGroupItem>
 */
export function ToggleGroupItem({
  className,
  size,
  children,
  ref,
  ...props
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);
  const resolvedSize = size ?? context.size ?? "default";
  const variantClassName = cn(
    // Inherits the shared `toggleVariants` — same evident neutral pressed fill as a
    // standalone Toggle (a group item is a genuine radio-/checkbox-like selection).
    toggleVariants({ size: resolvedSize }),
    // Joined geometry: square the inner corners, keep the group's outer ends
    // rounded at `md`. Horizontal rounds the left of the first / right of the last;
    // vertical rounds the top of the first / bottom of the last.
    "min-w-0 shrink-0 rounded-none focus:z-(--z-raised) focus-visible:z-(--z-raised)",
    "group-data-[orientation=horizontal]/toggle-group:first:rounded-s-md group-data-[orientation=horizontal]/toggle-group:last:rounded-e-md",
    "group-data-[orientation=vertical]/toggle-group:first:rounded-t-md group-data-[orientation=vertical]/toggle-group:last:rounded-b-md",
  );
  const resolvedClassName: React.ComponentProps<
    typeof BaseToggle
  >["className"] =
    typeof className === "function"
      ? (state) => cn(variantClassName, className(state))
      : cn(variantClassName, className);

  return (
    <BaseToggle
      ref={ref}
      data-slot="toggle-group-item"
      data-size={resolvedSize}
      className={resolvedClassName}
      {...props}
    >
      {children}
    </BaseToggle>
  );
}
