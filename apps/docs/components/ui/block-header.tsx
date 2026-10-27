// @vegastack block-header@0.25.95 sha256-QT+IjivK8QI+Y8ln2GYLS2jFLPhAcZaGYC/2xe1FsF4=

import * as React from "react";
import { ArrowUpRight, Ellipsis } from "lucide-react";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn, mergeRefs } from "@vegastack/design";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ---
`BlockHeader` is the one header row of a live block inside a page — a table view, a task list,
any block that shows records from somewhere else: icon · title · its controls (View ▾, Filter)
· ⋯ · ↗ Open. A block that does not know its source yet shows the same row with a picker in
place of the title ("Pick a table…"), so a block inserts at once and is configured where it
sits, never in a dialog first.

It is a plain row, framed by its host: `DataGrid embedded` rules it off as the block's top, a
task list block puts it over its rows. The controls are the host's — `BlockHeaderButton`s that
open the host's popovers — so one header serves every kind of block.

Deliberately NOT done here:
- No source picking, filtering or view state: the picker, the popovers and what they change are
  the host's.
- No frame: the block that owns the header draws the border.
--- */

/** Props accepted by `BlockHeader`. */
export interface BlockHeaderProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "title"
> {
  /**
   * The block's kind, as an icon (a table, a task list). Decorative.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * What the block shows — the source's name ("QA fixtures", "Tasks · My open").
   * @default undefined
   */
  title?: React.ReactNode;
  /**
   * The empty state: a picker for the block's source ("Pick a table…"), shown in place of the
   * title and the controls. Pass it only while the block has no source.
   * @default undefined
   */
  picker?: React.ReactNode;
  /**
   * The block's controls after the title — `BlockHeaderButton`s such as View ▾ and Filter.
   * Hidden while `picker` shows.
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * Items for the ⋯ menu (`DropdownMenuItem`s) — Copy link, Remove block. No menu without it.
   * @default undefined
   */
  menu?: React.ReactNode;
  /**
   * The ⋯ trigger's accessible name.
   * @default "Block actions"
   */
  menuLabel?: string;
  /**
   * The ↗ Open link at the end — a `BlockHeaderOpen` to the source's own page.
   * @default undefined
   */
  open?: React.ReactNode;
}

/**
 * `BlockHeader` — a live block's header row: icon · title · controls · ⋯ · ↗ Open, or, before
 * the block has a source, its icon and a picker. The row wraps its controls under the title on
 * a narrow block, and the Open label folds to its icon.
 *
 * @example
 * <BlockHeader
 *   icon={<Table2 />}
 *   title="QA fixtures"
 *   menu={<DropdownMenuItem onClick={remove}>Remove block</DropdownMenuItem>}
 *   open={<BlockHeaderOpen href="/tables/qa" />}
 * >
 *   <BlockHeaderButton>Grid <ChevronDown /></BlockHeaderButton>
 *   <BlockHeaderButton>Filter (1)</BlockHeaderButton>
 * </BlockHeader>
 *
 * @example
 * // No source yet: the picker sits where the title will be.
 * <BlockHeader icon={<Table2 />} picker={<TablePicker placeholder="Pick a table…" />} />
 */
export function BlockHeader({
  icon,
  title,
  picker,
  children,
  menu,
  menuLabel = "Block actions",
  open,
  className,
  ...props
}: BlockHeaderProps) {
  const empty = picker != null;
  return (
    <div
      data-slot="block-header"
      data-state={empty ? "empty" : "ready"}
      className={cn(
        "@container/block-header flex min-h-10 w-full min-w-0 items-center gap-1 px-1.5 py-1",
        className,
      )}
      {...props}
    >
      {/* Below 24rem of the block's width the controls take a second line under the title (the
          title keeps the first), and ⋯ and Open stay at the top end. */}
      <div className="flex min-w-24 flex-1 items-center gap-x-1 gap-y-0.5 @max-sm/block-header:flex-wrap">
        <div
          className={cn(
            "flex max-w-full min-w-0 items-center gap-1",
            empty && "flex-1",
          )}
        >
          {icon != null ? (
            <span
              aria-hidden="true"
              data-slot="block-header-icon"
              className="flex size-7 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-4"
            >
              {icon}
            </span>
          ) : null}
          {empty ? (
            <div data-slot="block-header-picker" className="min-w-0 flex-1">
              {picker}
            </div>
          ) : (
            <span
              data-slot="block-header-title"
              className="min-w-0 truncate px-1 text-sm font-medium"
            >
              {title}
            </span>
          )}
        </div>
        {!empty && children != null ? (
          <div
            data-slot="block-header-controls"
            className="flex min-w-0 shrink-0 items-center gap-0.5 @max-sm/block-header:basis-full @max-sm/block-header:ps-7"
          >
            {children}
          </div>
        ) : null}
      </div>
      {menu != null || open != null ? (
        <div
          data-slot="block-header-actions"
          className="ms-auto flex shrink-0 items-center gap-0.5 @max-sm/block-header:self-start"
        >
          {menu != null ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={menuLabel}
                    data-slot="block-header-menu"
                    className="text-muted-foreground"
                  >
                    <Ellipsis />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                {menu}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {open}
        </div>
      ) : null}
    </div>
  );
}

/** Props accepted by `BlockHeaderButton`. */
export type BlockHeaderButtonProps = React.ComponentProps<typeof Button>;

/**
 * `BlockHeaderButton` — one of a block header's controls: a quiet small button (View ▾, Filter
 * (1)). Use it as the `render` of the host's popover or menu trigger.
 *
 * @example
 * <PopoverTrigger render={<BlockHeaderButton />}>
 *   <ListFilter /> Filter
 * </PopoverTrigger>
 */
export function BlockHeaderButton({
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: BlockHeaderButtonProps) {
  return (
    <Button
      data-slot="block-header-button"
      variant={variant}
      size={size}
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Props accepted by `BlockHeaderOpen`. */
export interface BlockHeaderOpenProps extends React.ComponentPropsWithRef<"a"> {
  /**
   * The visible label — and the accessible name when the block is too narrow to show it.
   * @default "Open"
   */
  label?: string;
  /**
   * The link element — a router link such as `<Link href="/tables/qa" />`. It receives the
   * classes, the icon and the label; this component's own `href` and handlers win over the
   * template's (handlers run both).
   * @default <a />
   */
  render?: React.ReactElement;
}

/**
 * `BlockHeaderOpen` — ↗ Open: a link to the block's source (the table, the tasks page). It is
 * navigation, so it stays a real link wearing a small quiet button's look; pass `href`, or a
 * router link as `render`. On a narrow block only its icon shows.
 *
 * @example
 * <BlockHeaderOpen href="/tables/qa" />
 * <BlockHeaderOpen render={<Link href="/tables/qa" />} label="Open table" />
 */
export function BlockHeaderOpen({
  label = "Open",
  render,
  className,
  children,
  ref,
  ...props
}: BlockHeaderOpenProps) {
  const element = render ?? <a />;
  const own = (element.props ?? {}) as {
    className?: string;
    ref?: React.Ref<HTMLAnchorElement>;
  };
  // The template's props first, then the caller's: the caller's `href` wins, handlers chain and
  // both refs attach (the system's merge contract, as `BoardCard`'s `linkRender`).
  const merged = mergeProps<"a">(
    element.props as React.ComponentProps<"a">,
    {
      ...props,
      "data-slot": "block-header-open",
    } as React.ComponentProps<"a">,
  );
  return React.cloneElement(element, {
    ...merged,
    ref: mergeRefs(own.ref, ref),
    className: cn(
      buttonVariants({ variant: "ghost", size: "sm" }),
      "text-muted-foreground @max-xs/block-header:px-1.5",
      own.className,
      className,
    ),
    children: (
      <>
        <ArrowUpRight aria-hidden />
        <span className="@max-xs/block-header:sr-only">{label}</span>
        {children}
      </>
    ),
  } as React.ComponentProps<"a">);
}
