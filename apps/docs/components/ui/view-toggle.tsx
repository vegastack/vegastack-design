// @vegastack view-toggle@0.23.25 sha256-rb46H1oydHOiHnqApbzaa/P7/pJoB2l/xXxYSbyb8SA=

"use client";

import * as React from "react";
import { Columns3, LayoutGrid, List } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** A view a list can switch to. */
export type ListView = "list" | "grid" | "board";

const VIEW_META: Record<ListView, { label: string; icon: React.ReactNode }> = {
  grid: { label: "Grid", icon: <LayoutGrid aria-hidden /> },
  list: { label: "List", icon: <List aria-hidden /> },
  board: { label: "Board", icon: <Columns3 aria-hidden /> },
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
 * `ViewToggle` — the Grid | List (| Board) switch for a list page, a default (pill) `Tabs` at
 * the bar's h-8 tier, whose labels hide on a phone. `DataList` mounts it in the `FilterBar`'s `view` slot for you when it
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
    <Tabs
      data-slot="view-toggle"
      value={value}
      onValueChange={(next) => {
        if (views.includes(next as V)) onValueChange(next as V);
      }}
      className={className}
    >
      <TabsList aria-label={ariaLabel}>
        {views.map((view) => {
          const label = labels?.[view] ?? VIEW_META[view].label;
          return (
            <TabsTrigger key={view} value={view} data-view={view}>
              {VIEW_META[view].icon}
              <span className="max-sm:sr-only">{label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
