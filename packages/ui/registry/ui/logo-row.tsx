// @vegastack logo-row@0.4.1 sha256-CkxfSBuGZW7pt3yKKz8YPYApRL3ADx25WiYKlMv2LU0=

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
   * Columns for the `wall` variant.
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
  const wallCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[
    wallColumns
  ];
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
                "-mt-px -ml-px flex h-16 items-center justify-center border-t border-l border-border",
            )}
          >
            {item.href ? (
              <a
                href={item.href}
                className="text-lg font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
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
