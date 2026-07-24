import * as React from "react";
import { cn } from "../index";

/** Structural shape of a `thesvg` icon module (its default export). */
export interface BrandIconModule {
  slug: string;
  title: string;
  hex: string;
  svg: string;
  variants: Record<string, string>;
}

/** Brand-icon size scale → Tailwind size utilities (14/16/20/24px). */
const SIZE_CLASS = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

export type BrandIconSize = keyof typeof SIZE_CLASS;

/**
 * `thesvg` ships raw SVG strings that carry INTRINSIC `width`/`height` attributes
 * (Figma, for one, is `width="54" height="80"`). A percentage height on a flex
 * child doesn't always resolve, so the intrinsic attribute wins and a portrait
 * logo renders at its full natural height — overflowing the icon slot (measured:
 * a 24px Figma slot painted an 80px tall SVG, spilling 56px over the label).
 *
 * Strip those two attributes from the ROOT `<svg>` tag only — inner `<rect>` /
 * `<use>` / `<clipPath>` geometry MUST keep its own width/height — and pin
 * `preserveAspectRatio` so the artwork scales to FIT its box and stays centred.
 * The `viewBox` (which every `thesvg` asset carries) then drives the geometry,
 * and CSS alone owns the rendered size.
 */
function fitToBox(svg: string): string {
  return svg.replace(/<svg\b[^>]*>/i, (openTag) => {
    const cleaned = openTag
      .replace(/\s(?:width|height)\s*=\s*"[^"]*"/gi, "")
      .replace(/\s(?:width|height)\s*=\s*'[^']*'/gi, "")
      .replace(/\spreserveAspectRatio\s*=\s*"[^"]*"/gi, "");
    // Re-attach preserveAspectRatio just before the tag's closing bracket.
    return cleaned.replace(
      /\s*\/?>$/,
      (end) => ` preserveAspectRatio="xMidYMid meet"${end.trimStart()}`,
    );
  });
}

export interface BrandIconProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** A `thesvg` icon module (default export), e.g. `import github from 'thesvg/github'`. */
  icon: BrandIconModule;
  /**
   * Which `thesvg` variant to render:
   * - `auto` — theme-aware brand colors: the brand's `light` artwork on light
   *   surfaces and its `dark` artwork on dark ones, swapped in pure CSS (no JS,
   *   no hydration flash). **Use this on any surface that flips theme** —
   *   `color` renders the literal brand palette, and single-colour brands like
   *   GitHub (`#181717`) disappear against a dark background.
   * - `color` — the brand's official colors (the module `default` variant).
   * - `mono` — single-color, inherits `currentColor` (always theme-safe).
   * - `light` / `dark` — pin one surface-tuned variant explicitly.
   * - `wordmark` — the brand's logotype/wordmark lockup.
   *
   * Falls back to the icon's base `svg` when a brand doesn't ship the variant.
   * @default 'color'
   */
  variant?: "auto" | "color" | "mono" | "light" | "dark" | "wordmark";
  /**
   * Size token — maps to 14/16/20/24px.
   * @default 'md'
   */
  size?: BrandIconSize;
  /**
   * Accessible label. Defaults to the brand title; pass `''` to hide from
   * assistive tech (decorative).
   */
  "aria-label"?: string;
}

/**
 * `BrandIcon` — the one sanctioned wrapper for brand/logo icons (`thesvg`).
 *
 * @example
 * import github from 'thesvg/github';
 * <BrandIcon icon={github} size="md" />            // literal brand colors
 * <BrandIcon icon={github} variant="auto" />       // theme-aware (light/dark artwork)
 * <BrandIcon icon={github} variant="mono" />       // inherits currentColor
 */
export function BrandIcon({
  icon,
  variant = "color",
  size = "md",
  "aria-label": label,
  className,
  ...props
}: BrandIconProps) {
  const accessibleLabel = label === undefined ? icon.title : label;
  // The SVG is sized entirely by CSS; `[&>svg]:size-full` + the stripped intrinsic
  // attributes keep non-square logos INSIDE their slot instead of overflowing it.
  // NOTE: a DESCENDANT selector (`[&_svg]`), not a direct-child one — the `auto`
  // path nests each artwork inside a `display:contents` span, so `> svg` would
  // stop matching and the logo would fall back to its intrinsic size.
  const boxClassName = cn(
    "inline-flex shrink-0 [&_svg]:block [&_svg]:size-full",
    SIZE_CLASS[size],
    className,
  );
  const pick = (key: string) =>
    icon.variants?.[key] ?? icon.variants?.default ?? icon.svg;

  // `auto` — swap the surface-tuned artwork in pure CSS. Only duplicates the markup
  // when the brand actually ships two DIFFERENT variants; otherwise it collapses to
  // the single-render path below (a multi-colour brand needs no swap).
  if (variant === "auto") {
    const lightSvg = pick("light");
    const darkSvg = pick("dark");
    if (lightSvg !== darkSvg) {
      return (
        <span
          role={accessibleLabel ? "img" : undefined}
          aria-label={accessibleLabel || undefined}
          aria-hidden={accessibleLabel ? undefined : true}
          className={boxClassName}
          {...props}
        >
          {/* Reveal/hide is driven by `[data-brand-artwork]` rules that ship in
              `@vegastack/design/utilities.css` — NOT Tailwind `dark:` utilities,
              which a consumer's build would never generate from our package src. */}
          <span
            data-brand-artwork="light"
            // Trusted package asset (thesvg ships static SVG strings, not user input).
            dangerouslySetInnerHTML={{ __html: fitToBox(lightSvg) }}
          />
          <span
            data-brand-artwork="dark"
            dangerouslySetInnerHTML={{ __html: fitToBox(darkSvg) }}
          />
        </span>
      );
    }
  }

  // `color` maps to the module's `default` variant; every other value is a variant key 1:1.
  const variantKey =
    variant === "color" || variant === "auto" ? "default" : variant;
  const svg = icon.variants?.[variantKey] ?? icon.svg;
  return (
    <span
      role={accessibleLabel ? "img" : undefined}
      aria-label={accessibleLabel || undefined}
      aria-hidden={accessibleLabel ? undefined : true}
      className={boxClassName}
      // Trusted package asset (thesvg ships static SVG strings, not user input).
      dangerouslySetInnerHTML={{ __html: fitToBox(svg) }}
      {...props}
    />
  );
}
