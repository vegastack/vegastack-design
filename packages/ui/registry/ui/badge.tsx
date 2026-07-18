// @vegastack badge@0.2.0 sha256-vFkcmdwCOXYT2F8NllyHyy6FVXc+uylcGWLjjWfIMwQ=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useRender } from "@base-ui/react/use-render";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@vegastack/design";

/**
 * Badge variants — `variant` (subtle / solid / minimal) × `intent` (semantic
 * family) × `size`. Per the v2 spec, badges are `rounded-full` pills: the
 * default `subtle` treatment uses a soft `{family}-subtle` tint + `{family}-text`,
 * `solid` uses the family fill + on-color foreground, and the neutral badge
 * resolves to `muted`. Every value is a semantic Tailwind token (no hardcoded
 * colors, no `color-mix`, no inline styles); tinting per family is expressed via
 * compound variants.
 */
export const badgeVariants = cva(
  // text-ellipsis makes a consumer-supplied max-w-* cap elide instead of hard-clipping —
  // costless at the default w-fit (content never overflows itself).
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-medium text-ellipsis whitespace-nowrap transition-colors duration-fast ease-standard [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        subtle: "border-transparent",
        solid: "border-transparent",
        minimal: "border-transparent bg-transparent",
      },
      intent: {
        default: "",
        success: "",
        warning: "",
        destructive: "",
        info: "",
      },
      size: {
        sm: "h-5 gap-1 px-1.5 py-0.5 text-sm [&_svg:not([class*='size-'])]:size-(--icon-compact)",
        default:
          "h-5 gap-1 px-2 py-0.5 text-sm [&_svg:not([class*='size-'])]:size-(--icon-compact)",
        lg: "h-6 gap-1 px-2.5 py-0.5 text-sm [&_svg:not([class*='size-'])]:size-(--icon-inline)",
      },
    },
    compoundVariants: [
      // ── subtle: soft {family}-subtle tint + {family}-text (v2 default) ────
      {
        variant: "subtle",
        intent: "default",
        class: "bg-muted text-muted-foreground",
      },
      {
        variant: "subtle",
        intent: "success",
        class: "bg-success-subtle text-success-text",
      },
      {
        variant: "subtle",
        intent: "warning",
        class: "bg-warning-subtle text-warning-text",
      },
      {
        variant: "subtle",
        intent: "destructive",
        class: "bg-destructive-subtle text-destructive-text",
      },
      { variant: "subtle", intent: "info", class: "bg-info-subtle text-info-text" },

      // ── solid: family fill + on-color foreground ──────────────────────────
      {
        variant: "solid",
        intent: "default",
        class: "bg-foreground text-background",
      },
      {
        variant: "solid",
        intent: "success",
        class: "bg-success text-success-foreground",
      },
      {
        variant: "solid",
        intent: "warning",
        class: "bg-warning text-warning-foreground",
      },
      {
        variant: "solid",
        intent: "destructive",
        class: "bg-destructive text-destructive-foreground",
      },
      {
        variant: "solid",
        intent: "info",
        class: "bg-info text-info-foreground",
      },

      // ── minimal: borderless, no bg, colored text only ─────────────────────
      { variant: "minimal", intent: "default", class: "text-muted-foreground" },
      { variant: "minimal", intent: "success", class: "text-success-text" },
      { variant: "minimal", intent: "warning", class: "text-warning-text" },
      {
        variant: "minimal",
        intent: "destructive",
        class: "text-destructive-text",
      },
      { variant: "minimal", intent: "info", class: "text-info-text" },
    ],
    defaultVariants: { variant: "subtle", intent: "default", size: "default" },
  },
);

/** Dot size per badge size — the indicator scales with the badge. */
const dotSize: Record<
  NonNullable<VariantProps<typeof badgeVariants>["size"]>,
  string
> = {
  sm: "size-1.5",
  default: "size-1.5",
  lg: "size-2",
};

/** Dot color per `intent` family. `solid` uses the on-color foreground instead. */
const dotColor: Record<
  NonNullable<VariantProps<typeof badgeVariants>["intent"]>,
  string
> = {
  default: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
};

export interface BadgeProps
  extends
    React.ComponentPropsWithRef<"span">,
    VariantProps<typeof badgeVariants> {
  /**
   * Visual treatment.
   * - `subtle`: soft `{family}-subtle` tint + `{family}-text` (default).
   * - `solid`: family fill with on-color text.
   * - `minimal`: borderless, no background — colored text only.
   * @default 'subtle'
   */
  variant?: "subtle" | "solid" | "minimal";
  /**
   * Semantic intent family. Maps to design-system tokens only — never an
   * arbitrary hex or `color-mix` value. `default` is the neutral `muted` badge.
   * @default 'default'
   */
  intent?: "default" | "success" | "warning" | "destructive" | "info";
  /**
   * Size variant — pills sit at the `h-5` badge height (`lg` roomier `h-6`).
   * @default 'default'
   */
  size?: "sm" | "default" | "lg";
  /**
   * Show a small leading dot indicator colored by `intent`. Ignored while
   * `loading`. Mutually exclusive with a leading icon.
   * @default false
   */
  dot?: boolean;
  /**
   * Replace the leading content with a spinner and set `aria-busy`. Takes
   * precedence over `dot` and any leading icon.
   * @default false
   */
  loading?: boolean;
  /**
   * Opt-in mount animation (`motion-pop-in`, a scale + fade "arrival") for a
   * badge that appears in response to a real event — e.g. a status that just
   * flipped to `"Verified"`, a freshly-applied label, or a badge toggled on by
   * a user action. **Default off**: a badge rendered as part of a static list
   * (a table column, a filter chip row) must not pop every time its parent
   * re-renders or mounts. Set it only where the badge's own appearance IS the
   * signal.
   * @default false
   */
  animateIn?: boolean;
  /**
   * Replace the rendered element via Base UI `render` composition. Pass a
   * `ReactElement` or a render function.
   */
  render?: useRender.RenderProp;
}

/**
 * `Badge` — a compact `rounded-full` status / label chip. Three variants
 * (`subtle`, `solid`, `minimal`) × six semantic families × three sizes, with an
 * optional leading `dot`, a `loading` spinner, and leading icons composed as
 * `children`. Purely presentational; use Base UI `render` to compose with a link.
 * Pass `animateIn` to pop the badge in on mount — off by default so static lists
 * of badges stay still.
 */
export function Badge({
  className,
  variant = "subtle",
  intent = "default",
  size = "default",
  dot = false,
  loading = false,
  animateIn = false,
  render,
  children,
  ref,
  ...props
}: BadgeProps) {
  const showDot = dot && !loading;
  const dotClass =
    variant === "solid" ? "bg-current" : dotColor[intent ?? "default"];

  return useRender({
    render: render ?? <span />,
    defaultTagName: "span",
    ref, // forward the consumer ref onto the rendered (or composed) element
    props: {
      "data-slot": "badge",
      "data-variant": variant,
      "data-intent": intent,
      "data-size": size,
      "data-loading": loading ? "" : undefined,
      "aria-busy": loading || undefined,
      className: cn(
        badgeVariants({ variant, intent, size }),
        animateIn && "motion-pop-in",
        className,
      ),
      children: (
        <>
          {loading ? (
            <Spinner size="inherit" label="" className="size-(--icon-compact)" />
          ) : showDot ? (
            <span
              className={cn(
                "shrink-0 rounded-full",
                dotSize[size ?? "default"],
                dotClass,
              )}
              aria-hidden
            />
          ) : null}
          {children}
        </>
      ),
      ...props,
    },
  });
}
