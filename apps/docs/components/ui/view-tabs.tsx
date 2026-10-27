// @vegastack view-tabs@0.25.91 sha256-wNKbYLZu0L7tH3cgKNqfJYD/oJTToIoNScXtiDoa0DY=

"use client";

import * as React from "react";
import { Ellipsis, Kanban, Lock, Plus, Table2 } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOverflow } from "@/components/ui/use-overflow";

/* ---
`ViewTabs` is the row of saved views over a table: the shared views first, a divider, then the
reader's own ("Mine"). A view is a grid or a board, and shared, personal or locked; the
component shows the kind's icon and a lock on a locked view, and offers a `+` menu to create a
grid or a board. When the tabs don't fit the room they are given — measured, not a fixed
breakpoint — the row becomes one `Select` with the same two groups, and goes back to tabs as soon as
they fit again. The root is not a size container, so a host can size it to its tabs.

It is built on `Tabs variant="line"`, which already scrolls and keeps the active tab in view. It
is NOT `ViewToggle`: there "Grid" means a card grid, here it means a table.

Deliberately NOT done here:
- No persistence, no "View changed · Save for everyone" logic: the host owns views (G7).
- No rename or delete UI of its own: `getViewActions` hands the host's menu items to the active
  view's ⋯ menu.
- No shared-or-personal choice in the `+` menu: it offers the two kinds only, and the host's own
  create step (a name, "Only visible to me") decides who sees the new view.

A long name (a view name runs to 100 characters) ends in an ellipsis on its tab and in the narrow
select's trigger; when it is actually cut, the full name shows in a tooltip on hover and keyboard
focus — `TruncatedText`'s measurement and tooltip, laid on the tab itself so the tab stays the one
tab stop. CSS truncation never shortens the accessible name: the tab and the trigger read the whole
name. The narrow select's list wraps a long name instead of cutting it.
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
   * Offer the `+` menu: a grid view or a board view. Called with the kind picked; the host's own
   * create step names the view and decides whether it is shared or the reader's alone. Omit it
   * when the reader can't create views.
   * @default undefined
   */
  onCreate?: (kind: ViewTabsView["kind"]) => void;
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
  wrap = false,
  nameRef,
}: {
  view: ViewTabsView;
  lockedLabel: string;
  /** Wrap a long name instead of cutting it (the select's list). */
  wrap?: boolean;
  /** The name's box, measured for truncation. */
  nameRef?: React.Ref<HTMLSpanElement>;
}) {
  const Icon = KIND_ICON[view.kind];
  return (
    <>
      <Icon aria-hidden className="text-muted-foreground" />
      <span
        ref={nameRef}
        data-slot="view-tabs-name"
        className={wrap ? "min-w-0 wrap-anywhere" : "max-w-48 truncate"}
      >
        {view.name}
      </span>
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
 * A control whose text may be cut: the full text in a tooltip, only while it actually is. The
 * tooltip stays mounted (disabled while the text fits) so the trigger never remounts and keeps
 * focus.
 */
function useCutName(name: string) {
  const [node, setNode] = React.useState<HTMLSpanElement | null>(null);
  const cut = useOverflow(node, { deps: [name] });
  return { cut, nameRef: setNode };
}

function ViewTab({
  view,
  lockedLabel,
}: {
  view: ViewTabsView;
  lockedLabel: string;
}) {
  const { cut, nameRef } = useCutName(view.name);
  return (
    <Tooltip disabled={!cut}>
      <TooltipTrigger
        render={
          <TabsTrigger
            value={view.id}
            data-slot="view-tabs-tab"
            data-scope={view.scope}
            data-kind={view.kind}
            className="flex-none"
          />
        }
        data-truncated={cut ? "" : undefined}
      >
        <ViewLabel view={view} lockedLabel={lockedLabel} nameRef={nameRef} />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-words">
        {view.name}
      </TooltipContent>
    </Tooltip>
  );
}

/** The narrow select's trigger, with the open view's full name in a tooltip when it is cut. */
function ViewSelectTrigger({
  active,
  "aria-label": ariaLabel,
}: {
  active: ViewTabsView | null;
  "aria-label": string;
}) {
  const { cut, nameRef } = useCutName(active?.name ?? "");
  return (
    <Tooltip disabled={!cut}>
      <TooltipTrigger
        render={
          <SelectTrigger
            size="sm"
            variant="ghost"
            aria-label={ariaLabel}
            data-slot="view-tabs-select"
            className="max-w-full"
          />
        }
        data-truncated={cut ? "" : undefined}
      >
        <SelectValue>
          {() => (
            <span ref={nameRef} className="min-w-0 truncate">
              {active?.name}
            </span>
          )}
        </SelectValue>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-words">
        {active?.name}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * `ViewTabs` — a table's saved views: shared ones, a divider, then the reader's own; a lock on a
 * locked view; a `+` menu to create a grid or board view; the open view's ⋯
 * menu. When the tabs don't fit the width it is given (measured), the row is one `Select` with the
 * same groups; it fills its container, so it can measure the room it has.
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
 *   onCreate={(kind) => openCreateViewDialog(kind)}
 *   getViewActions={(v) => <DropdownMenuItem onClick={() => rename(v)}>Rename</DropdownMenuItem>}
 * />
 */
export function ViewTabs({
  views,
  value,
  onValueChange,
  onCreate,
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

  // Tabs while they fit, else one select: the tab row's own width (it stays mounted, out of flow
  // and inert while collapsed, so it can still be measured) plus the trailing buttons, against the
  // root's width. Re-measured whenever either changes size.
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = React.useState(false);
  const measure = React.useCallback(() => {
    const root = rootRef.current;
    const list = listRef.current;
    if (!root || !list) return;
    let trailing = 0;
    for (const button of root.querySelectorAll<HTMLElement>(
      ":scope > [data-slot=view-tabs-create], :scope > [data-slot=view-tabs-actions]",
    ))
      trailing += button.getBoundingClientRect().width + 4;
    setNarrow(list.scrollWidth + trailing > root.clientWidth + 0.5);
  }, []);
  React.useLayoutEffect(() => {
    measure();
    const root = rootRef.current;
    const list = listRef.current;
    if (!root || !list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure, views.length, onCreate != null, actions != null]);
  const mergedRef = React.useMemo(
    () => (ref ? mergeRefs(rootRef, ref) : rootRef),
    [ref],
  );

  const tab = (view: ViewTabsView) => (
    <ViewTab key={view.id} view={view} lockedLabel={labels.locked} />
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
        <DropdownMenuItem onClick={() => onCreate("grid")}>
          <Table2 /> {labels.grid}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCreate("board")}>
          <Kanban /> {labels.board}
        </DropdownMenuItem>
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
      ref={mergedRef}
      data-slot="view-tabs"
      data-narrow={narrow ? "" : undefined}
      // `w-full`: it fills the room its host gives it (as the size container it used to be), so a
      // collapsed row — whose tabs are out of flow — still measures the whole room, never just the
      // select, and expands again when the host widens.
      className={cn(
        "relative flex w-full min-w-0 items-center gap-1",
        // Collapsed, the measuring tab row is wider than the room: clipped sideways, it never
        // widens the page (vertically the select's focus and popup stay unclipped).
        narrow && "overflow-x-clip",
        className,
      )}
    >
      {/* Wide: the tab row. Collapsed, it stays mounted out of flow, hidden and inert, to be
          measured. */}
      <Tabs
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        aria-hidden={narrow || undefined}
        inert={narrow || undefined}
        className={cn(
          "flex min-w-0",
          narrow &&
            "invisible pointer-events-none absolute start-0 top-0 max-w-none",
        )}
      >
        <TabsList
          ref={listRef}
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
      {/* Narrow: one select with the same groups, its buttons right beside it. */}
      {narrow ? (
        <div data-slot="view-tabs-narrow" className="min-w-0 flex-initial">
          <Select
            value={value}
            onValueChange={(next) => {
              if (next != null) onValueChange(String(next));
            }}
            items={Object.fromEntries(
              views.map((view) => [view.id, view.name]),
            )}
          >
            <ViewSelectTrigger active={active} aria-label={ariaLabel} />
            <SelectContent align="start" alignItemWithTrigger={false} wrap>
              {shared.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>{labels.shared}</SelectLabel>
                  {shared.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      <ViewLabel view={view} lockedLabel={labels.locked} wrap />
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
                      <ViewLabel view={view} lockedLabel={labels.locked} wrap />
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {createMenu}
      {actionsMenu}
    </div>
  );
}
