import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

/** Functional icon size scale (px). */
const SIZES = { xs: 14, sm: 16, md: 20, lg: 24 } as const;

export type IconSize = keyof typeof SIZES;

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  /** The lucide icon component to render. */
  as: LucideIcon;
  /**
   * Size token — maps to 14/16/20/24px.
   * @default 'md'
   */
  size?: IconSize;
  /**
   * Accessible label. When provided the icon is exposed to assistive tech;
   * otherwise it is `aria-hidden`.
   */
  'aria-label'?: string;
}

/**
 * `Icon` — the one sanctioned wrapper for functional UI icons (lucide-react).
 *
 * Color inherits `currentColor` (themes automatically); stroke width is fixed
 * to the design-system standard. `aria-hidden` unless an `aria-label` is given.
 *
 * @example
 * import { Check } from 'lucide-react';
 * <Icon as={Check} size="sm" aria-label="Done" />
 */
export function Icon({ as: Cmp, size = 'md', 'aria-label': label, ...props }: IconProps) {
  return (
    <Cmp
      width={SIZES[size]}
      height={SIZES[size]}
      strokeWidth={1.75}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      {...props}
    />
  );
}
