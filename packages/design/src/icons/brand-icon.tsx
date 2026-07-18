import * as React from 'react';
import { cn } from '../index';

/** Structural shape of a `thesvg` icon module (its default export). */
export interface BrandIconModule {
  slug: string;
  title: string;
  hex: string;
  svg: string;
  variants: Record<string, string>;
}

/** Brand-icon size scale → Tailwind size utilities (14/16/20/24px). */
const SIZE_CLASS = { xs: 'size-3.5', sm: 'size-4', md: 'size-5', lg: 'size-6' } as const;

export type BrandIconSize = keyof typeof SIZE_CLASS;

export interface BrandIconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** A `thesvg` icon module (default export), e.g. `import github from 'thesvg/github'`. */
  icon: BrandIconModule;
  /**
   * Which `thesvg` variant to render:
   * - `color` — the brand's official colors (the module `default` variant).
   * - `mono` — single-color, inherits `currentColor`.
   * - `light` / `dark` — variants tuned for light/dark surfaces.
   * - `wordmark` — the brand's logotype/wordmark lockup.
   *
   * Falls back to the icon's base `svg` when a brand doesn't ship the variant.
   * @default 'color'
   */
  variant?: 'color' | 'mono' | 'light' | 'dark' | 'wordmark';
  /**
   * Size token — maps to 14/16/20/24px.
   * @default 'md'
   */
  size?: BrandIconSize;
  /**
   * Accessible label. Defaults to the brand title; pass `''` to hide from
   * assistive tech (decorative).
   */
  'aria-label'?: string;
}

/**
 * `BrandIcon` — the one sanctioned wrapper for brand/logo icons (`thesvg`).
 *
 * @example
 * import github from 'thesvg/github';
 * <BrandIcon icon={github} size="md" />          // brand colors
 * <BrandIcon icon={github} variant="mono" />     // inherits currentColor
 */
export function BrandIcon({
  icon,
  variant = 'color',
  size = 'md',
  'aria-label': label,
  className,
  ...props
}: BrandIconProps) {
  // `color` maps to the module's `default` variant; every other value is a variant key 1:1.
  const variantKey = variant === 'color' ? 'default' : variant;
  const svg = icon.variants?.[variantKey] ?? icon.svg;
  const accessibleLabel = label === undefined ? icon.title : label;
  return (
    <span
      role={accessibleLabel ? 'img' : undefined}
      aria-label={accessibleLabel || undefined}
      aria-hidden={accessibleLabel ? undefined : true}
      className={cn('inline-flex shrink-0 [&>svg]:block [&>svg]:size-full', SIZE_CLASS[size], className)}
      // Trusted package asset (thesvg ships static SVG strings, not user input).
      dangerouslySetInnerHTML={{ __html: svg }}
      {...props}
    />
  );
}
