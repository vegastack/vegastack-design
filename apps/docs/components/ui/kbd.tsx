// @vegastack kbd@0.1.0 sha256-Rb0W1FS2s4TW2qXLB6U1Dn3H51aM5YympM914KTGP0Q=

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@vegastack/design';

/**
 * Kbd size scale — token-only. Each key is a small, non-interactive code chip
 * styled with `bg-muted` / `text-muted-foreground` and the one `border`, at the
 * tight `rounded-sm` (6px) used for inline controls. Sizes mirror the lower end
 * of the shared scale (`xs` / `sm` / `default`); the default carries the spec
 * `px-1.5 py-0.5` and the dense tabular `text-code-sm` mono figure.
 */
export const kbdVariants = cva(
  'pointer-events-none inline-flex w-fit shrink-0 select-none items-center justify-center gap-1 rounded-sm border border-border bg-muted font-mono font-medium text-muted-foreground',
  {
    variants: {
      size: {
        xs: 'h-4 min-w-4 px-1 py-0.5 text-code-sm leading-none',
        sm: 'h-5 min-w-5 px-1 py-0.5 text-code-sm leading-none',
        default: 'h-6 min-w-6 px-1.5 py-0.5 text-sm leading-none',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

/**
 * Mac modifier glyphs mapped to their Windows/Linux text equivalents. When the
 * resolved OS is not mac, these glyphs are swapped for the words below so a
 * shortcut reads correctly on every platform (`⌘` → `Ctrl`, `⌥` → `Alt`, …).
 */
const MODIFIER_MAP: Record<string, string> = {
  '⌘': 'Ctrl',
  '⇧': 'Shift',
  '⌥': 'Alt',
  '⌃': 'Ctrl',
  '⏎': 'Enter',
  '↵': 'Enter',
  '⌫': 'Bksp',
};

/** Map a single key token to its OS-appropriate label. */
function resolveKey(key: string, isMac: boolean): string {
  if (isMac) return key;
  return MODIFIER_MAP[key] ?? key;
}

export interface KbdProps
  extends Omit<React.ComponentPropsWithRef<'kbd'>, 'children'>,
    VariantProps<typeof kbdVariants> {
  /**
   * Size of the key chip — mirrors the lower end of the shared scale.
   * @default 'default'
   */
  size?: 'xs' | 'sm' | 'default';
  /**
   * Explicit key tokens to render. Each token becomes its own `<kbd>`. Modifier
   * glyphs (`⌘`, `⇧`, `⌥`, `⌃`, `⏎`, `⌫`) are rewritten to words on non-mac
   * platforms. Takes precedence over `children`.
   */
  keys?: readonly string[];
  /**
   * Platform label mode. Defaults to mac glyphs; pass `'other'` to render
   * readable Windows/Linux modifier names.
   * @default 'mac'
   */
  os?: 'mac' | 'other';
  /** A single key label — used when `keys` is not provided. */
  children?: React.ReactNode;
}

/**
 * `Kbd` — a styled `<kbd>` for a single keyboard key, or a row of keys via the
 * `keys` array. Pass `os="other"` to rewrite mac modifier glyphs (`⌘`, `⌥`,
 * …) to their word equivalents (`Ctrl`, `Alt`, …) on Windows/Linux. Purely
 * presentational, server-safe, and token-only (`bg-muted` /
 * `text-muted-foreground` / `border` / `rounded-sm` / `font-mono`).
 *
 * @example
 * // Single key
 * <Kbd>⌘</Kbd>
 *
 * @example
 * // A combo as an array (each token is its own chip, OS-aware)
 * <Kbd keys={['⌘', 'K']} />
 */
export function Kbd({
  className,
  size = 'default',
  keys,
  os = 'mac',
  children,
  ref,
  ...props
}: KbdProps) {
  const isMac = os === 'mac';

  // Multi-key form — render each token as its own chip inside a group. The consumer ref + remaining
  // props belong on the single group root, NOT fanned onto every chip (which would duplicate the ref
  // across nodes and warn).
  if (keys && keys.length > 0) {
    return (
      <KbdGroup ref={ref as React.Ref<HTMLSpanElement>} className={className} {...props}>
        {keys.map((key, i) => (
          <kbd
            key={`${key}-${i}`}
            data-slot="kbd"
            data-size={size}
            className={cn(kbdVariants({ size }))}
          >
            {resolveKey(key, isMac)}
          </kbd>
        ))}
      </KbdGroup>
    );
  }

  // Single-key form. If the lone child is a known modifier glyph string, it is
  // rewritten for the resolved OS too.
  const content =
    typeof children === 'string' ? resolveKey(children, isMac) : children;

  return (
    <kbd
      ref={ref}
      data-slot="kbd"
      data-size={size}
      className={cn(kbdVariants({ size }), className)}
      {...props}
    >
      {content}
    </kbd>
  );
}

export interface KbdGroupProps extends React.ComponentPropsWithRef<'span'> {}

/**
 * `KbdGroup` — a flex row that lays out multiple `Kbd` chips with consistent
 * spacing. Use it to compose a shortcut from individual `Kbd` children, or rely
 * on `Kbd`'s `keys` array, which wraps its chips in a `KbdGroup` for you.
 *
 * @example
 * <KbdGroup>
 *   <Kbd>⌘</Kbd>
 *   <Kbd>K</Kbd>
 * </KbdGroup>
 */
export function KbdGroup({ className, ...props }: KbdGroupProps) {
  return (
    <span
      data-slot="kbd-group"
      className={cn('inline-flex w-fit shrink-0 items-center gap-1', className)}
      {...props}
    />
  );
}
