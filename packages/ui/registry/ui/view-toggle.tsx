// @vegastack view-toggle@0.23.19 sha256-PAGTAJXbdqMinXjgdObpt6z+696jjQB22UoWtdX0W9M=

"use client";

import * as React from "react";
import { Kanban, LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** A view a list can switch to. */
export type ListView = "list" | "grid" | "board";

const VIEW_META: Record<ListView, { label: string; icon: React.ReactNode }> = {
  grid: { label: "Grid", icon: <LayoutGrid aria-hidden /> },
  list: { label: "List", icon: <List aria-hidden /> },
  board: { label: "Board", icon: <Kanban aria-hidden /> },
};

/** Props accepted by `ViewToggle`. */
export interface ViewToggleProps<V extends ListView = ListView> {
  /** The current view. */
  value: V;
  /** Called with the view the user picks. */
  onValueChange: (view: V) => void;
  /**
   * The views offered, in order.
   * @default ["grid", "list"]
   */
  views?: readonly V[];
  /**
   * Relabel a view ("Cards" for "Grid").
   * @default undefined
   */
  labels?: Partial<Record<ListView, string>>;
  /**
   * The group's accessible name.
   * @default "View"
   */
  "aria-label"?: string;
  /**
   * Extra classes for the group.
   * @default undefined
   */
  className?: string;
}

/**
 * `ViewToggle` — the Grid | List (| Board) switch for a list page, an outline icon group whose
 * labels hide on a phone. `DataList` mounts it in the `FilterBar`'s `view` slot for you when it
 * is given `onViewChange`.
 *
 * @example
 * <ViewToggle value={view} onValueChange={setView} views={["list", "board"]} />
 */
export function ViewToggle<V extends ListView = ListView>({
  value,
  onValueChange,
  views = ["grid", "list"] as unknown as readonly V[],
  labels,
  "aria-label": ariaLabel = "View",
  className,
}: ViewToggleProps<V>) {
  return (
    <ToggleGroup
      data-slot="view-toggle"
      aria-label={ariaLabel}
      spacing={0}
      variant="outline"
      deselectable={false}
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0] as V | undefined;
        if (picked && views.includes(picked)) onValueChange(picked);
      }}
      className={className}
    >
      {views.map((view) => {
        const label = labels?.[view] ?? VIEW_META[view].label;
        return (
          <ToggleGroupItem key={view} value={view} data-view={view}>
            {VIEW_META[view].icon}
            <span className="max-sm:sr-only">{label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
