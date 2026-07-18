// @vegastack logo-row@0.1.0 sha256-Svf9ZS4Te98u/xFH6fyCUcYOhuQbP1/eBfZI4111I1s=

// @vegastack logo-row@0.1.0 — new component; run `pnpm run registry:build` to stamp integrity +
// regenerate the copy-in/JSON.

'use client';

import * as React from 'react';
import { cn } from '@vegastack/design';

export interface LogoRowItem {
  /** The wordmark text — always TEXT, never an image/svg logo (see component note). */
  name: string;
  /** Optional link target; renders an `<a>` instead of a `<span>` when present. */
  href?: string;
}

export interface LogoRowProps extends React.ComponentPropsWithRef<'div'> {
  /**
   * The wordmarks to render. Intentionally TEXT-only — no image/SVG logo
   * assets, and never real third-party brand names (they'd imply an
   * unverified partnership). Use generic/placeholder names on marketing
   * pages until real, cleared logos exist.
   */
  items: LogoRowItem[];
  /** Small mono uppercase caption above the row (e.g. `"Trusted by"`). */
  label?: React.ReactNode;
}

/**
 * `LogoRow` — a muted logo/wordmark strip: alpha-dimmed at rest
 * (`text-foreground/(--opacity-dim)`), restoring to `text-foreground/(--opacity-hint)`
 * on hover for linked items. Renders wordmarks as plain text, never
 * image/SVG logos — see {@link LogoRowItem}.
 *
 * @example
 * <LogoRow
 *   label="Built with"
 *   items={[{ name: 'ACME' }, { name: 'NIMBUS' }, { name: 'COREBASE' }]}
 * />
 */
export function LogoRow({ items, label, className, ref, ...props }: LogoRowProps) {
  return (
    <div ref={ref} data-slot="logo-row" className={cn('flex flex-col gap-4', className)} {...props}>
      {label ? (
        <p
          data-slot="logo-row-label"
          className="font-mono text-mono-label text-muted-foreground uppercase"
        >
          {label}
        </p>
      ) : null}
      <ul data-slot="logo-row-list" className="flex flex-wrap items-center gap-x-8 gap-y-4">
        {items.map((item) => (
          <li key={item.name} data-slot="logo-row-item">
            {item.href ? (
              <a
                href={item.href}
                className="text-lg font-medium tracking-tight text-foreground/(--opacity-dim) transition-colors duration-fast ease-standard hover:text-foreground/(--opacity-hint)"
              >
                {item.name}
              </a>
            ) : (
              <span className="text-lg font-medium tracking-tight text-foreground/(--opacity-dim)">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
