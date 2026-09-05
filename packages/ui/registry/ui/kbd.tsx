// @vegastack kbd@0.6.0 sha256-dIg9TKDHncGdhlbtTg6dUWo7vR02KnjekM8N4f4AovE=

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

/**
 * Kbd size scale — token-only. Each key is a small, non-interactive code chip
 * styled with `bg-muted` / `text-muted-foreground` and the one `border`, at the
 * tight `rounded-sm` (6px) used for inline controls. Sizes mirror the lower end
 * of the shared scale (`xs` / `sm` / `default`); the default carries the spec
 * `px-1.5 py-0.5` and the dense tabular `text-code-sm` mono figure.
 */
export const kbdVariants = cva(
  "pointer-events-none inline-flex w-fit shrink-0 select-none items-center justify-center gap-1 rounded-sm border border-border bg-muted font-mono font-medium text-muted-foreground",
  {
    variants: {
      size: {
        xs: "h-4 min-w-4 px-1 py-0.5 text-code-sm leading-none",
        sm: "h-5 min-w-5 px-1 py-0.5 text-code-sm leading-none",
        default: "h-6 min-w-6 px-1.5 py-0.5 text-sm leading-none",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/**
 * Mac modifier glyphs mapped to their Windows/Linux text equivalents. When the
 * resolved OS is not mac, these glyphs are swapped for the words below so a
 * shortcut reads correctly on every platform (`⌘` → `Ctrl`, `⌥` → `Alt`, …).
 */
const MODIFIER_MAP: Record<string, string> = {
  "⌘": "Ctrl",
  "⇧": "Shift",
  "⌥": "Alt",
  "⌃": "Ctrl",
  "⏎": "Enter",
  "↵": "Enter",
  "⌫": "Bksp",
};

/**
 * Spoken names for the mac glyphs. Screen readers announce `⌘` as "place of
 * interest sign" (or skip it) — so on mac the glyph stays visual-only and this
 * word joins the accessible name via sr-only text.
 */
const GLYPH_SPOKEN_NAME: Record<string, string> = {
  "⌘": "Command",
  "⇧": "Shift",
  "⌥": "Option",
  "⌃": "Control",
  "⏎": "Return",
  "↵": "Return",
  "⌫": "Delete",
};

/** Map a single key token to its OS-appropriate label. */
function resolveKey(key: string, isMac: boolean): string {
  if (isMac) return key;
  return MODIFIER_MAP[key] ?? key;
}

/**
 * Render one key token: on mac, a modifier glyph is paired with sr-only spoken
 * text (the glyph itself goes `aria-hidden`); on other platforms the resolved
 * word is already readable text.
 */
function KeyContent({ token, isMac }: { token: string; isMac: boolean }) {
  const spoken = GLYPH_SPOKEN_NAME[token];
  if (isMac && spoken) {
    return (
      <>
        <span aria-hidden>{token}</span>
        <span className="sr-only">{spoken}</span>
      </>
    );
  }
  return <>{resolveKey(token, isMac)}</>;
}

/** Props accepted by `Kbd`. */
export interface KbdProps
  extends
    Omit<React.ComponentPropsWithRef<"kbd">, "children">,
    VariantProps<typeof kbdVariants> {
  /**
   * Size of the key chip — mirrors the lower end of the shared scale.
   * @default 'default'
   */
  size?: "xs" | "sm" | "default";
  /**
   * Explicit key tokens to render. Each token becomes its own `<kbd>`. Modifier
   * glyphs (`⌘`, `⇧`, `⌥`, `⌃`, `⏎`, `⌫`) are rewritten to words on non-mac
   * platforms. Takes precedence over `children`.

   * @default undefined
   */
  keys?: readonly string[];
  /**
   * Platform label mode. Defaults to mac glyphs; pass `'other'` to render
   * readable Windows/Linux modifier names.
   * @default 'mac'
   */
  os?: "mac" | "other";
  /** A single key label — used when `keys` is not provided.
   * @default undefined
   */
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
  size = "default",
  keys,
  os = "mac",
  children,
  ref,
  ...props
}: KbdProps) {
  const isMac = os === "mac";

  // Multi-key form — render each token as its own chip inside a group. The consumer ref + remaining
  // props belong on the single group root, NOT fanned onto every chip (which would duplicate the ref
  // across nodes and warn).
  if (keys && keys.length > 0) {
    return (
      <KbdGroup
        ref={ref as React.Ref<HTMLSpanElement>}
        className={className}
        {...props}
      >
        {keys.map((key, i) => (
          <kbd
            key={`${key}-${i}`}
            data-slot="kbd"
            data-size={size}
            className={cn(kbdVariants({ size }))}
          >
            <KeyContent token={key} isMac={isMac} />
          </kbd>
        ))}
      </KbdGroup>
    );
  }

  // Single-key form. If the lone child is a known modifier glyph string, it is
  // rewritten for the resolved OS (and, on mac, paired with sr-only spoken text).
  const content =
    typeof children === "string" ? (
      <KeyContent token={children} isMac={isMac} />
    ) : (
      children
    );

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

/** Props accepted by `KbdGroup`. */
export interface KbdGroupProps extends React.ComponentPropsWithRef<"span"> {}

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
      className={cn("inline-flex w-fit shrink-0 items-center gap-1", className)}
      {...props}
    />
  );
}
