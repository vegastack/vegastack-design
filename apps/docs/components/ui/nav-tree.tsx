// @vegastack nav-tree@0.107.0 sha256-1RbPjBh6YV0/YDOWMlW+ochGFgHBXRK3Y5zA9xLTyw8=

"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@vegastack/design";
import { ChevronRight } from "lucide-react";

/* ---
WHY THIS SHAPE — one tree for every column (Layout v2, D9).

Every module column (Home, Spaces, Library, Settings, Tasks…) lists its places the same way:
sections with a title, items left-aligned with that title, and children indented by one step of
the spacing scale (12px). There is no chevron gutter at the start of a row: a parent's fold
control sits at its END, so a parent and its siblings keep their labels on one line. The small
indent alone shows what belongs to what: no thread lines (operator, 17-11-2026: keep the
indentation close, without the lines).

Rows are 32px, and 44px (`size="touch"`, or by themselves in a shell narrower than 40rem, where
the column is a phone sheet). The height is one variable (`--nav-tree-row`).

Keyboard (on top of Tab, which reaches every row): ↑ ↓ move between visible rows, Home and End
jump to the ends, → opens a folded parent or moves into it, ← folds an open parent or moves to
its parent. Enter follows the row's link or presses its button.
--- */

type NavTreeSize = "default" | "touch";

const DepthContext = React.createContext(0);

const ROW = '[data-slot="nav-tree-item"]';

/** Rows not inside a folded parent, in order. */
function visibleRows(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(ROW)).filter(
    (row) => !row.closest("[hidden]"),
  );
}

/** A row the keyboard can land on: not a disabled button or link. */
function enabled(row: HTMLElement): boolean {
  return !row.matches(":disabled, [aria-disabled='true']");
}

/** The first enabled row from `from`, stepping by `step` (the current row itself never counts). */
function step(rows: HTMLElement[], from: number, by: 1 | -1) {
  for (let i = from + by; i >= 0 && i < rows.length; i += by)
    if (enabled(rows[i]!)) return rows[i];
  return undefined;
}

function rowOf(el: Element | null): HTMLElement | null {
  const li = el?.closest<HTMLElement>('[data-slot="nav-tree-row"]');
  return li?.querySelector<HTMLElement>(`:scope > div > ${ROW}`) ?? null;
}

/** Props accepted by `NavTree`. */
export interface NavTreeProps extends React.ComponentProps<"div"> {
  /**
   * Row height: `default` is 32px (44px inside a shell narrower than 40rem, where the column is a
   * phone sheet); `touch` is always 44px, for a list in a phone sheet of its own.
   * @default 'default'
   */
  size?: NavTreeSize;
}

/**
 * `NavTree` — a column's navigation: `NavTreeSection`s of `NavTreeItem`s, with the arrow keys
 * moving between rows and folding parents. Put it inside the shell's `ShellColumn` (the
 * navigation landmark) or any `nav`.
 *
 * @example
 * <NavTree>
 *   <NavTreeSection label="Views">
 *     <NavTreeItem icon={<ListChecks />} label="My tasks" count={12} href="/tasks" active />
 *   </NavTreeSection>
 * </NavTree>
 */
export function NavTree({
  size = "default",
  className,
  onKeyDown,
  ...props
}: NavTreeProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.metaKey) return;
    const root = event.currentTarget;
    const target = event.target as HTMLElement;
    // Keys typed into a field inside the tree (a rename box) are the field's.
    if (target.matches("input, textarea, select, [contenteditable='true']"))
      return;
    const current = rowOf(target);
    if (!current) return;
    const rows = visibleRows(root);
    const at = rows.indexOf(current);
    const rtl = getComputedStyle(root).direction === "rtl";
    const into = rtl ? "ArrowLeft" : "ArrowRight";
    const out = rtl ? "ArrowRight" : "ArrowLeft";
    const li = current.closest<HTMLElement>('[data-slot="nav-tree-row"]')!;
    const fold = li.querySelector<HTMLElement>(
      ':scope > div > [data-slot="nav-tree-fold"]',
    );
    const open = fold?.getAttribute("aria-expanded") === "true";
    let next: HTMLElement | null | undefined;
    if (event.key === "ArrowDown") next = step(rows, at, 1);
    else if (event.key === "ArrowUp") next = step(rows, at, -1);
    else if (event.key === "Home") next = step(rows, -1, 1);
    else if (event.key === "End") next = step(rows, rows.length, -1);
    else if (event.key === into && fold) {
      if (!open) fold.click();
      else
        next = Array.from(
          li.querySelectorAll<HTMLElement>(
            `:scope > [data-slot="nav-tree-group"] > li > div > ${ROW}`,
          ),
        ).find(enabled);
    } else if (event.key === out) {
      if (fold && open) fold.click();
      else next = rowOf(li.parentElement);
    } else return;
    event.preventDefault();
    next?.focus();
  };
  return (
    <div
      data-slot="nav-tree"
      data-size={size}
      className={cn("group/nav-tree flex flex-col gap-1", className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

/** Props accepted by `NavTreeSection`. */
export interface NavTreeSectionProps extends Omit<
  React.ComponentProps<"section">,
  "title"
> {
  /** The section's title, above its items, left-aligned with them. @default undefined */
  label?: React.ReactNode;
  /** An action beside the title (a + button). @default undefined */
  action?: React.ReactNode;
}

/**
 * `NavTreeSection` — a titled group of items. Without a `label` it is a plain list (the column's
 * first group of views).
 *
 * @example
 * <NavTreeSection label="Spaces" action={<Button size="icon-xs" variant="ghost" aria-label="New space"><Plus /></Button>}>…</NavTreeSection>
 */
export function NavTreeSection({
  label,
  action,
  className,
  children,
  ...props
}: NavTreeSectionProps) {
  const id = React.useId();
  return (
    <section
      data-slot="nav-tree-section"
      aria-labelledby={label ? id : undefined}
      className={cn(
        // The row height lives here, so a section works inside a NavTree or on its own.
        "flex flex-col [--nav-tree-row:--spacing(8)] group-data-[size=touch]/nav-tree:[--nav-tree-row:--spacing(11)] @max-[40rem]/shell:[--nav-tree-row:--spacing(11)]",
        className,
      )}
      {...props}
    >
      {label ? (
        <div className="flex h-9 items-center justify-between gap-2 ps-2 pe-1 pt-2">
          <h3
            id={id}
            className="min-w-0 truncate text-xs font-medium text-muted-foreground"
          >
            {label}
          </h3>
          {action}
        </div>
      ) : null}
      <ul role="list" className="flex flex-col gap-px">
        {children}
      </ul>
    </section>
  );
}

/** Props accepted by `NavTreeItem`. */
export interface NavTreeItemProps extends Omit<
  React.ComponentProps<"a">,
  "children"
> {
  /** The item's name. */
  label: React.ReactNode;
  /** Its icon, 16px. @default undefined */
  icon?: React.ReactNode;
  /** A count at the end, muted and tabular. Zero or empty shows nothing. @default undefined */
  count?: number | string;
  /** Whether this is the current place. @default false */
  active?: boolean;
  /** An action shown on hover and focus in the count's place (a ⋯ menu). @default undefined */
  action?: React.ReactNode;
  /** Child items: the item becomes a parent that folds, its children one step in under it. @default undefined */
  children?: React.ReactNode;
  /** Whether a parent starts open (uncontrolled). @default true when `active`, else false */
  defaultOpen?: boolean;
  /** Whether a parent is open (controlled). @default undefined */
  open?: boolean;
  /** Called when a parent opens or folds. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** The app's own link or button element (`<Link href="/tasks" />`); its props win. @default undefined */
  render?: React.ReactElement;
}

type ElementProps = Record<string, unknown> & {
  className?: string;
  children?: React.ReactNode;
};

function rowElement(
  render: React.ReactElement | undefined,
  href: string | undefined,
): React.ReactElement {
  if (render) return render;
  if (href) return <a href={href} />;
  return <ButtonPrimitive />;
}

function hasCount(count: number | string | undefined): boolean {
  return count !== undefined && count !== "" && count !== 0;
}

/**
 * `NavTreeItem` — one row: icon, name and count, on an inset rounded fill. With children it is a
 * parent: its fold control sits at the row's end (never before the label), and its children are
 * indented one 12px step under it. A parent with no link of its own folds on a click.
 *
 * @example
 * <NavTreeItem icon={<Hexagon />} label="General" defaultOpen>
 *   <NavTreeItem label="Launch plan" href="/spaces/general/launch" />
 * </NavTreeItem>
 */
export function NavTreeItem({
  label,
  icon,
  count,
  active = false,
  action,
  children,
  defaultOpen,
  open: openProp,
  onOpenChange,
  render,
  href,
  className,
  onClick,
  ...props
}: NavTreeItemProps) {
  const depth = React.useContext(DepthContext);
  const groupId = React.useId();
  const parent = React.Children.count(children) > 0;
  const [openState, setOpenState] = React.useState(defaultOpen ?? active);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };
  const own = (render?.props ?? {}) as ElementProps;
  // A parent that goes nowhere folds on a click.
  const folds =
    parent && !render && !href && !onClick && !own.onClick && !own.href;
  const shown = hasCount(count);
  const element = rowElement(render, href);
  const row = React.cloneElement(element, {
    ...props,
    ...own,
    "data-slot": "nav-tree-item",
    "data-active": active ? "" : undefined,
    "data-depth": depth,
    "aria-current": active ? "page" : undefined,
    ...(folds
      ? {
          "aria-expanded": open,
          "aria-controls": groupId,
          onClick: () => setOpen(!open),
        }
      : { onClick: onClick ?? own.onClick }),
    className: cn(
      "state-layer relative flex h-(--nav-tree-row) w-full min-w-0 items-center gap-2 rounded-item px-2 text-start text-sm text-foreground no-underline outline-none data-active:bg-state-selected data-active:font-medium [&_svg:not([class*='size-'])]:size-4 [&>svg]:flex-none [&>svg]:text-muted-foreground",
      parent && "pe-8",
      // On touch the action always shows at the row's end: the label keeps clear of it.
      action && (parent ? "pointer-coarse:pe-14" : "pointer-coarse:pe-8"),
      className,
      own.className,
    ),
    children: (
      <>
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {shown ? (
          <span
            data-slot="nav-tree-count"
            className={cn(
              "flex-none text-xs font-normal text-muted-foreground tabular-nums",
              action &&
                "group-focus-within/nav-tree-row:invisible group-hover/nav-tree-row:invisible pointer-coarse:invisible",
            )}
          >
            {count}
          </span>
        ) : null}
      </>
    ),
  } as ElementProps);

  return (
    <li
      data-slot="nav-tree-row"
      data-parent={parent ? "" : undefined}
      className="relative"
    >
      <div className="group/nav-tree-row relative flex items-center">
        {row}
        {action ? (
          <span
            data-slot="nav-tree-action"
            className={cn(
              // Shown on hover and focus; always on touch, where there is no hover to reveal it.
              "absolute top-1/2 hidden -translate-y-1/2 items-center group-focus-within/nav-tree-row:flex group-hover/nav-tree-row:flex pointer-coarse:flex",
              parent ? "end-7" : "end-1",
            )}
          >
            {action}
          </span>
        ) : null}
        {parent ? (
          <ButtonPrimitive
            data-slot="nav-tree-fold"
            aria-label={`Show or hide ${typeof label === "string" ? label : "items"}`}
            aria-expanded={open}
            aria-controls={groupId}
            tabIndex={-1}
            onClick={() => setOpen(!open)}
            className="absolute end-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-icon text-muted-foreground outline-none state-layer after:absolute after:inset-0 after:-inset-y-1 after:-end-1 pointer-coarse:after:-inset-y-2.5 pointer-coarse:after:-end-2.5"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-3.5 transition-transform duration-state rtl:-scale-x-100",
                // Mirrored in RTL, so it turns the other way to point down.
                open && "rotate-90 rtl:-rotate-90",
              )}
            />
          </ButtonPrimitive>
        ) : null}
      </div>
      {parent ? (
        <ul
          id={groupId}
          role="list"
          data-slot="nav-tree-group"
          hidden={!open}
          className="ms-3 flex flex-col gap-px pt-px"
        >
          <DepthContext value={depth + 1}>{children}</DepthContext>
        </ul>
      ) : null}
    </li>
  );
}
