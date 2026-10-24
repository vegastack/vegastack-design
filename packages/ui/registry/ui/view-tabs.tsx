// @vegastack view-tabs@0.25.73 sha256-wxY3iWGSsV2yfNEZQMFDNj6nL5viavGu63x7HIkWOO4=

"use client";

import * as React from "react";
import { Ellipsis, Kanban, Lock, Plus, Table2 } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ---
`ViewTabs` is the row of saved views over a table: the shared views first, a divider, then the
reader's own ("Mine"). A view is a grid or a board, and shared, personal or locked; the
component shows the kind's icon and a lock on a locked view, and offers a `+` menu to create a
grid or a board, shared or personal. Below a narrow container (`@3xl`) the row becomes one
`Select` with the same two groups.

It is built on `Tabs variant="line"`, which already scrolls and keeps the active tab in view. It
is NOT `ViewToggle`: there "Grid" means a card grid, here it means a table.

Deliberately NOT done here:
- No persistence, no "View changed · Save for everyone" logic: the host owns views (G7).
- No rename or delete UI of its own: `getViewActions` hands the host's menu items to the active
  view's ⋯ menu.
--- */

/** One saved view. */
export interface ViewTabsView {
  /** Stable id — the `value`. */
  id: string;
  /** The view's name. */
  name: string;
  /** A table (`grid`) or a board. */
  kind: "grid" | "board";
  /** `shared` and `locked` views are everyone's; `personal` ones are the reader's alone. */
  scope: "shared" | "personal" | "locked";
}

/** The words `ViewTabs` shows. */
export interface ViewTabsLabels {
  /** The personal group's heading. */
  mine: string;
  /** The shared group's heading (the narrow select). */
  shared: string;
  /** The `+` button's name. */
  create: string;
  /** The ⋯ button's name, given the view's name. */
  actions: (name: string) => string;
  /** A grid view, in the create menu. */
  grid: string;
  /** A board view, in the create menu. */
  board: string;
  /** The create menu's shared group. */
  createShared: string;
  /** The create menu's personal group. */
  createPersonal: string;
  /** Read after a locked view's name. */
  locked: string;
}

const DEFAULT_LABELS: ViewTabsLabels = {
  mine: "Mine",
  shared: "Shared",
  create: "New view",
  actions: (name) => `${name} options`,
  grid: "Grid view",
  board: "Board view",
  createShared: "Shared",
  createPersonal: "Personal",
  locked: "locked",
};

/** Props accepted by `ViewTabs`. */
export interface ViewTabsProps {
  /** Every view the reader can open, in the host's order within each group. */
  views: readonly ViewTabsView[];
  /** The open view's id. */
  value: string;
  /** Called with the id of the view the reader opens. */
  onValueChange: (id: string) => void;
  /**
   * Offer the `+` menu: a grid or a board, shared or personal. Omit it when the reader can't
   * create views.
   * @default undefined
   */
  onCreate?: (kind: ViewTabsView["kind"], scope: "shared" | "personal") => void;
  /**
   * Hide the shared choices in the create menu (a reader who can't change shared views).
   * @default true
   */
  canCreateShared?: boolean;
  /**
   * The open view's menu items (`DropdownMenuItem`s: rename, duplicate, delete…), shown in a ⋯
   * menu after the tabs. Return `null` for none.
   * @default undefined
   */
  getViewActions?: (view: ViewTabsView) => React.ReactNode;
  /**
   * The component's words.
   * @default English
   */
  labels?: Partial<ViewTabsLabels>;
  /**
   * Accessible name of the tab row.
   * @default "Views"
   */
  "aria-label"?: string;
  /** Extra classes for the root.
   * @default undefined
   */
  className?: string;
  /** Ref to the root.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

const KIND_ICON: Record<
  ViewTabsView["kind"],
  React.ComponentType<{ className?: string }>
> = {
  grid: Table2,
  board: Kanban,
};

function ViewLabel({
  view,
  lockedLabel,
}: {
  view: ViewTabsView;
  lockedLabel: string;
}) {
  const Icon = KIND_ICON[view.kind];
  return (
    <>
      <Icon aria-hidden className="text-muted-foreground" />
      <span className="max-w-48 truncate">{view.name}</span>
      {view.scope === "locked" ? (
        <>
          <Lock
            aria-hidden
            data-slot="view-tabs-lock"
            className="size-3 text-muted-foreground"
          />
          <span className="sr-only">, {lockedLabel}</span>
        </>
      ) : null}
    </>
  );
}

/**
 * `ViewTabs` — a table's saved views: shared ones, a divider, then the reader's own; a lock on a
 * locked view; a `+` menu to create a grid or board view, shared or personal; the open view's ⋯
 * menu. Below `@3xl` (the component's own width) the row is one `Select` with the same groups.
 *
 * @example
 * <ViewTabs
 *   views={[
 *     { id: "all", name: "All requests", kind: "grid", scope: "shared" },
 *     { id: "board", name: "By status", kind: "board", scope: "locked" },
 *     { id: "mine", name: "My follow-ups", kind: "grid", scope: "personal" },
 *   ]}
 *   value={view}
 *   onValueChange={setView}
 *   onCreate={(kind, scope) => createView(kind, scope)}
 *   getViewActions={(v) => <DropdownMenuItem onClick={() => rename(v)}>Rename</DropdownMenuItem>}
 * />
 */
export function ViewTabs({
  views,
  value,
  onValueChange,
  onCreate,
  canCreateShared = true,
  getViewActions,
  labels: labelOverrides,
  "aria-label": ariaLabel = "Views",
  className,
  ref,
}: ViewTabsProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const shared = views.filter((view) => view.scope !== "personal");
  const personal = views.filter((view) => view.scope === "personal");
  const active = views.find((view) => view.id === value) ?? null;
  const actions = active && getViewActions ? getViewActions(active) : null;

  const tab = (view: ViewTabsView) => (
    <TabsTrigger
      key={view.id}
      value={view.id}
      data-slot="view-tabs-tab"
      data-scope={view.scope}
      data-kind={view.kind}
      className="flex-none"
    >
      <ViewLabel view={view} lockedLabel={labels.locked} />
    </TabsTrigger>
  );

  const createMenu = onCreate ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={labels.create}
            data-slot="view-tabs-create"
          >
            <Plus />
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        {canCreateShared ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{labels.createShared}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onCreate("grid", "shared")}>
              <Table2 /> {labels.grid}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreate("board", "shared")}>
              <Kanban /> {labels.board}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}
        {canCreateShared ? <DropdownMenuSeparator /> : null}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.createPersonal}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCreate("grid", "personal")}>
            <Table2 /> {labels.grid}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCreate("board", "personal")}>
            <Kanban /> {labels.board}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const actionsMenu =
    actions != null && active ? (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={labels.actions(active.name)}
              data-slot="view-tabs-actions"
            >
              <Ellipsis />
            </Button>
          }
        />
        <DropdownMenuContent align="start">{actions}</DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  return (
    <div
      ref={ref}
      data-slot="view-tabs"
      className={cn(
        "@container/view-tabs flex min-w-0 items-center gap-1",
        className,
      )}
    >
      {/* Wide: the tab row. */}
      <Tabs
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        className="hidden min-w-0 @3xl/view-tabs:flex"
      >
        <TabsList
          variant="line"
          aria-label={ariaLabel}
          data-slot="view-tabs-list"
        >
          {shared.map(tab)}
          {shared.length > 0 && personal.length > 0 ? (
            <span
              aria-hidden
              data-slot="view-tabs-divider"
              className="mx-1 h-4 w-px shrink-0 self-center bg-border"
            />
          ) : null}
          {personal.length > 0 ? (
            <span
              aria-hidden
              data-slot="view-tabs-mine"
              className="shrink-0 self-center ps-1 text-xs text-muted-foreground"
            >
              {labels.mine}
            </span>
          ) : null}
          {personal.map(tab)}
        </TabsList>
      </Tabs>
      {/* Narrow: one select with the same groups. */}
      <div className="min-w-0 flex-1 @3xl/view-tabs:hidden">
        <Select
          value={value}
          onValueChange={(next) => {
            if (next != null) onValueChange(String(next));
          }}
          items={Object.fromEntries(views.map((view) => [view.id, view.name]))}
        >
          <SelectTrigger
            size="sm"
            variant="ghost"
            aria-label={ariaLabel}
            data-slot="view-tabs-select"
            className="max-w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {shared.length > 0 ? (
              <SelectGroup>
                <SelectLabel>{labels.shared}</SelectLabel>
                {shared.map((view) => (
                  <SelectItem key={view.id} value={view.id}>
                    <ViewLabel view={view} lockedLabel={labels.locked} />
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
            {shared.length > 0 && personal.length > 0 ? (
              <SelectSeparator />
            ) : null}
            {personal.length > 0 ? (
              <SelectGroup>
                <SelectLabel>{labels.mine}</SelectLabel>
                {personal.map((view) => (
                  <SelectItem key={view.id} value={view.id}>
                    <ViewLabel view={view} lockedLabel={labels.locked} />
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
          </SelectContent>
        </Select>
      </div>
      {createMenu}
      {actionsMenu}
    </div>
  );
}
