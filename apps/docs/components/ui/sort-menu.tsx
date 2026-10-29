// @vegastack sort-menu@0.25.101 sha256-rDGcHS6hCOfysx6H95ZQBemCBWFB92tKvEVFU8U0450=

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
High → low". "Reset" shows only when the order is not the page's default. A table that sorts by
several keys uses `SortBuilder` instead.
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
  const words = labels[field.type ?? "text"];
  const direction = words[value.direction === "asc" ? 0 : 1];
  return `${field.label}, ${direction.charAt(0).toLowerCase()}${direction.slice(1)}`;
}

/** One option row: the label, and a check when chosen. */
function SortMenuOption({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <RadioPrimitive.Root
      value={value}
      data-slot="sort-menu-option"
      className="group/sort-option flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 text-sm text-foreground outline-none hover:bg-accent data-disabled:opacity-50"
    >
      <span className="min-w-0 truncate">{children}</span>
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
  const isDefault =
    defaultValue == null ||
    (defaultValue.key === value.key &&
      defaultValue.direction === value.direction);
  return (
    <div
      data-slot="sort-menu"
      data-default={isDefault ? "" : undefined}
      className={cn("flex min-w-0 flex-col gap-1", className)}
    >
      <div
        data-slot="sort-menu-header"
        className="flex h-8 items-center justify-between gap-2 ps-2"
      >
        <span id={headingId} className="text-xs text-muted-foreground">
          {labels.sortBy}
        </span>
        {!isDefault && defaultValue ? (
          <Button
            variant="ghost"
            size="sm"
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
          if (typeof key === "string" && key !== value.key)
            onValueChange({ key, direction: value.direction });
        }}
        className="flex flex-col"
      >
        {fields.map((f) => (
          <SortMenuOption key={f.key} value={f.key}>
            {f.label}
          </SortMenuOption>
        ))}
      </RadioGroupPrimitive>
      <div aria-hidden className="-mx-2 my-1 h-px bg-border" />
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
    </div>
  );
}
