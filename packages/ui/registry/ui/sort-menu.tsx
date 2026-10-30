// @vegastack sort-menu@0.26.3 sha256-Jm+OTMnZIFYJLGioT30KLZ5SiMMrcEqQOf0czCBA4+g=

"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";

/* ---
`SortMenu` is the one-key sort of a list: which field, then which direction, as two groups of
options with a check on the chosen one. It has no handles, no selects and no "Add sort": a list
that sorts by one key never shows an affordance it cannot use. The direction reads in the field's
own words — dates "Oldest first / Newest first", text "A → Z / Z → A", numbers "Low → high /
High → low". A field the list can sort only one way (`fixedDirection`) shows that way beside its
name and no direction group while it is chosen; a manual order ("Custom order", `"none"`) shows
neither. "Reset" shows only when the order is not the page's default. A table that sorts by several
keys uses `SortBuilder` instead.
--- */

/** A field a list can sort by. */
export interface SortMenuField {
  /** Stable key. */
  key: string;
  /** The field's name ("Due date"). */
  label: string;
  /**
   * What the field holds — it words the directions.
   * @default "text"
   */
  type?: "date" | "text" | "number" | "enum";
  /**
   * The one way this field sorts, when the list cannot sort it both ways: its direction shows
   * beside the name and the direction group hides while it is chosen. `"none"` is a manual order
   * (no direction to show at all).
   * @default undefined (both ways)
   */
  fixedDirection?: "asc" | "desc" | "none";
}

/** A one-key order. */
export interface SortMenuValue {
  /** The field's key. */
  key: string;
  /** Ascending or descending. */
  direction: "asc" | "desc";
}

/** The words `SortMenu` shows. */
export interface SortMenuLabels {
  /** The first group's heading. */
  sortBy: string;
  /** The second group's heading (screen readers only). */
  direction: string;
  /** The reset action. */
  reset: string;
  /** The two directions for each field type, ascending first. */
  directions: Record<NonNullable<SortMenuField["type"]>, [string, string]>;
}

const DEFAULT_LABELS: SortMenuLabels = {
  sortBy: "Sort by",
  direction: "Direction",
  reset: "Reset",
  directions: {
    date: ["Oldest first", "Newest first"],
    text: ["A → Z", "Z → A"],
    number: ["Low → high", "High → low"],
    enum: ["First to last", "Last to first"],
  },
};

/** Props accepted by `SortMenu`. */
export interface SortMenuProps {
  /** The fields, in the order offered. */
  fields: readonly SortMenuField[];
  /** The current order. */
  value: SortMenuValue;
  /** Called with the next order. */
  onValueChange: (value: SortMenuValue) => void;
  /**
   * The page's default order. While `value` differs from it, "Reset" shows.
   * @default undefined
   */
  defaultValue?: SortMenuValue;
  /**
   * The component's words.
   * @default English
   */
  labels?: Partial<Omit<SortMenuLabels, "directions">> & {
    directions?: Partial<SortMenuLabels["directions"]>;
  };
  /**
   * Extra classes for the root.
   * @default undefined
   */
  className?: string;
}

/**
 * `sortSummary` — one line that says an order in the field's own words ("Due date, oldest first"),
 * for the Sort row Display shows once Sort has folded into it.
 *
 * @example
 * sortSummary(fields, { key: "due", direction: "asc" }) // "Due date, oldest first"
 */
export function sortSummary(
  fields: readonly SortMenuField[],
  value: SortMenuValue,
  labels: SortMenuLabels["directions"] = DEFAULT_LABELS.directions,
): string {
  const field = fields.find((f) => f.key === value.key);
  if (!field) return value.key;
  if (field.fixedDirection === "none") return field.label;
  const words = labels[field.type ?? "text"];
  const direction =
    words[(field.fixedDirection ?? value.direction) === "asc" ? 0 : 1];
  return `${field.label}, ${direction.charAt(0).toLowerCase()}${direction.slice(1)}`;
}

/** One option row: the label, and a check when chosen. */
function SortMenuOption({
  value,
  hint,
  children,
}: {
  value: string;
  /** Muted words after the label (a one-way field's direction). */
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <RadioPrimitive.Root
      value={value}
      data-slot="sort-menu-option"
      className="group/sort-option flex h-7 w-full cursor-pointer items-center justify-between gap-1.5 rounded-md px-1.5 text-sm text-foreground outline-none hover:bg-accent data-disabled:opacity-50"
    >
      <span className="min-w-0 truncate">
        {children}
        {hint ? " " : null}
        {hint ? (
          <span
            data-slot="sort-menu-hint"
            className="ms-1 text-muted-foreground"
          >
            {hint}
          </span>
        ) : null}
      </span>
      <RadioPrimitive.Indicator
        data-slot="sort-menu-check"
        className="flex size-4 shrink-0 items-center justify-center"
      >
        <Check aria-hidden className="size-4" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

/**
 * `SortMenu` — the one-key sort: the fields, then the two directions in the field's own words,
 * each a group of options with a check on the chosen one (arrow keys move, Space picks). "Reset"
 * sits in the header while the order differs from `defaultValue`. Put it in a `ListToolbar`'s
 * `sort.content`; the column header writes the same value.
 *
 * @example
 * <SortMenu
 *   fields={[{ key: "due", label: "Due date", type: "date" }, { key: "title", label: "Title" }]}
 *   value={sort}
 *   defaultValue={{ key: "due", direction: "asc" }}
 *   onValueChange={setSort}
 * />
 */
export function SortMenu({
  fields,
  value,
  onValueChange,
  defaultValue,
  labels: labelsProp,
  className,
}: SortMenuProps) {
  const labels: SortMenuLabels = {
    ...DEFAULT_LABELS,
    ...labelsProp,
    directions: { ...DEFAULT_LABELS.directions, ...labelsProp?.directions },
  };
  const headingId = React.useId();
  const field = fields.find((f) => f.key === value.key);
  const [asc, desc] = labels.directions[field?.type ?? "text"];
  const fixed = field?.fixedDirection;
  const isDefault =
    defaultValue == null ||
    (defaultValue.key === value.key &&
      (fixed != null || defaultValue.direction === value.direction));
  const hintOf = (f: SortMenuField) =>
    f.fixedDirection === "asc" || f.fixedDirection === "desc"
      ? labels.directions[f.type ?? "text"][f.fixedDirection === "asc" ? 0 : 1]
      : undefined;
  return (
    <div
      data-slot="sort-menu"
      data-default={isDefault ? "" : undefined}
      className={cn("flex min-w-0 flex-col", className)}
    >
      <div
        data-slot="sort-menu-header"
        className="flex h-6 items-center justify-between gap-2 ps-1.5"
      >
        <span id={headingId} className="text-xs text-muted-foreground">
          {labels.sortBy}
        </span>
        {!isDefault && defaultValue ? (
          <Button
            variant="ghost"
            size="xs"
            data-slot="sort-menu-reset"
            className="font-normal text-muted-foreground"
            onClick={() => onValueChange(defaultValue)}
          >
            {labels.reset}
          </Button>
        ) : null}
      </div>
      <RadioGroupPrimitive
        aria-labelledby={headingId}
        data-slot="sort-menu-fields"
        value={value.key}
        onValueChange={(key) => {
          if (typeof key !== "string" || key === value.key) return;
          const next = fields.find((f) => f.key === key)?.fixedDirection;
          onValueChange({
            key,
            direction:
              next === "asc" || next === "desc" ? next : value.direction,
          });
        }}
        className="flex flex-col"
      >
        {fields.map((f) => (
          <SortMenuOption key={f.key} value={f.key} hint={hintOf(f)}>
            {f.label}
          </SortMenuOption>
        ))}
      </RadioGroupPrimitive>
      {fixed != null ? null : (
        <>
          <div
            aria-hidden
            data-slot="sort-menu-divider"
            className="-mx-1 my-1 h-px bg-border"
          />
          <RadioGroupPrimitive
            aria-label={labels.direction}
            data-slot="sort-menu-direction"
            value={value.direction}
            onValueChange={(direction) => {
              if (direction === "asc" || direction === "desc")
                onValueChange({ key: value.key, direction });
            }}
            className="flex flex-col"
          >
            <SortMenuOption value="asc">{asc}</SortMenuOption>
            <SortMenuOption value="desc">{desc}</SortMenuOption>
          </RadioGroupPrimitive>
        </>
      )}
    </div>
  );
}
