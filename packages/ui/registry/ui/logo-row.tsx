// @vegastack logo-row@0.8.1 sha256-qHQ/zUQuETaaPphnWFCtjvn4mDXf8An3UGmkQMMKjys=

import * as React from "react";
import { cn } from "@vegastack/design";

export interface LogoRowItem {
  /** The wordmark text — always TEXT, never an image/svg logo (see component note). */
  name: string;
  /** Optional link target; renders an `<a>` instead of a `<span>` when present. @default undefined */
  href?: string;
}

/** Props accepted by `LogoRow`. */
export interface LogoRowProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The wordmarks to render. Intentionally TEXT-only — no image/SVG logo
   * assets, and never real third-party brand names (they'd imply an
   * unverified partnership). Use generic/placeholder names on marketing
   * pages until real, cleared logos exist.
   */
  items: LogoRowItem[];
  /** Small mono uppercase caption above the row (e.g. `"Trusted by"`). @default undefined */
  label?: React.ReactNode;
  /**
   * Layout. `row` is the inline wordmark strip; `wall` (Wave 4 — the teardown's
   * logo-wall) is a hairline-CELL grid: the borders form the grid, no gaps.
   * @default 'row'
   */
  variant?: "row" | "wall";
  /**
   * The MAXIMUM number of columns the `wall` variant will fit. The grid is
   * `auto-fill` over a minimum cell width, so it drops to fewer columns on its
   * own when the row is too narrow — a 4-column wall at 320px would otherwise
   * give 80px cells and clip every wordmark. Follows the ROW's own width (a
   * container-relative `min()`), so a wall inside a sidebar or a split pane
   * reflows correctly too, not just at viewport breakpoints.
   * @default 3
   */
  wallColumns?: 2 | 3 | 4;
}

/**
 * `LogoRow` — a muted logo/wordmark strip using the contrast-safe muted text role at rest,
 * restoring to `text-foreground` on hover for linked items. Renders wordmarks as plain text, never
 * image/SVG logos — see {@link LogoRowItem}.
 *
 * @example
 * <LogoRow
 *   label="Built with"
 *   items={[{ name: 'ACME' }, { name: 'NIMBUS' }, { name: 'COREBASE' }]}
 * />
 */
export function LogoRow({
  items,
  label,
  variant = "row",
  wallColumns = 3,
  className,
  ref,
  ...props
}: LogoRowProps) {
  // `auto-fill` with a `max(floor, 100%/N)` track instead of a fixed `grid-cols-N`.
  // Wide: `100%/N` wins, so the wall is exactly `wallColumns` across. Narrow: the 8rem
  // cell floor wins and auto-fill simply fits fewer columns — which is the whole point,
  // because `grid-cols-4` at 320px gave 80px cells and clipped every wordmark. There are
  // no gaps in the wall (the hairlines ARE the grid), so `100%/N` needs no gap subtraction.
  // Each value is a whole class string: Tailwind's scanner reads source text and never
  // evaluates an expression, so a built-up class name would not compile.
  const wallCols = {
    2: "grid-cols-[repeat(auto-fill,minmax(max(calc(var(--spacing)*32),100%/2),1fr))]",
    3: "grid-cols-[repeat(auto-fill,minmax(max(calc(var(--spacing)*32),100%/3),1fr))]",
    4: "grid-cols-[repeat(auto-fill,minmax(max(calc(var(--spacing)*32),100%/4),1fr))]",
  }[wallColumns];
  return (
    <div
      ref={ref}
      data-slot="logo-row"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {label ? (
        <p
          data-slot="logo-row-label"
          className="font-mono text-mono-label text-muted-foreground uppercase"
        >
          {label}
        </p>
      ) : null}
      <ul
        data-slot="logo-row-list"
        data-variant={variant}
        className={cn(
          variant === "wall"
            ? // The wall: cell hairlines FORM the grid — every cell draws its top+left
              // edge, the container clips the outer ring to a rounded hairline frame.
              cn(
                "grid overflow-hidden rounded-lg border border-border",
                wallCols,
              )
            : "flex flex-wrap items-center gap-x-8 gap-y-4",
        )}
      >
        {items.map((item) => (
          <li
            key={item.name}
            data-slot="logo-row-item"
            className={cn(
              variant === "wall" &&
                // LOGICAL, not physical: `-ms-px`/`border-s` follow the writing direction,
                // so in RTL the seams stay between cells. The physical `-ml-px`/`border-l`
                // this replaces put every cell's border on the LEFT regardless, which in
                // RTL doubled the outer edge and erased the inner seams.
                "-mt-px -ms-px flex h-16 items-center justify-center border-t border-s border-border",
            )}
          >
            {item.href ? (
              <a
                href={item.href}
                // A wall of underlined text reads as a paragraph of links, not as marks.
                // Marks rest in the muted role and LIFT to full ink on hover; the hover
                // change is the affordance, so no underline is needed to signal the link.
                className="text-lg font-medium text-muted-foreground no-underline hover:text-foreground"
              >
                {item.name}
              </a>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
