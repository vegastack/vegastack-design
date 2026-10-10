// @vegastack view-toggle@0.25.13 sha256-rO0buOGYQAz0x/Abs9xrPzw3ZhH+fsYSRYN0dj6zM7o=

"use client";

import * as React from "react";
import { Columns3, LayoutGrid, List, Rows3, Rows4 } from "lucide-react";
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

/** A row density a list or table can show. */
export type Density = "comfortable" | "compact";

const DENSITY_META: Record<Density, { label: string; icon: React.ReactNode }> =
  {
    comfortable: { label: "Comfortable", icon: <Rows3 aria-hidden /> },
    compact: { label: "Compact", icon: <Rows4 aria-hidden /> },
  };

/** Props accepted by `DensityToggle`. */
export interface DensityToggleProps {
  /** The current density. */
  value: Density;
  /** Called with the density the user picks. */
  onValueChange: (density: Density) => void;
  /**
   * Relabel a density.
   * @default undefined
   */
  labels?: Partial<Record<Density, string>>;
  /**
   * The group's accessible name.
   * @default "Density"
   */
  "aria-label"?: string;
  /**
   * Extra classes for the group.
   * @default undefined
   */
  className?: string;
}

/**
 * `DensityToggle` — the Comfortable | Compact row-density switch for a table or list, the same
 * pill `Tabs` as `ViewToggle` with icon-only triggers (the label is the accessible name and the
 * tooltip-free `title`). `DataList` mounts it for you when given `onDensityChange`.
 *
 * @example
 * <DensityToggle value={density} onValueChange={setDensity} />
 */
export function DensityToggle({
  value,
  onValueChange,
  labels,
  "aria-label": ariaLabel = "Density",
  className,
}: DensityToggleProps) {
  return (
    <Tabs
      data-slot="density-toggle"
      value={value}
      onValueChange={(next) => {
        if (next === "comfortable" || next === "compact") onValueChange(next);
      }}
      className={className}
    >
      <TabsList aria-label={ariaLabel}>
        {(Object.keys(DENSITY_META) as Density[]).map((density) => {
          const label = labels?.[density] ?? DENSITY_META[density].label;
          return (
            <TabsTrigger
              key={density}
              value={density}
              data-density={density}
              title={label}
            >
              {DENSITY_META[density].icon}
              <span className="sr-only">{label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
