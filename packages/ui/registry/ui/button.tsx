// @vegastack button@0.6.0 sha256-r1ujnTdEUU5qMUsoVLSRQg15JtVlVzE6IkzJ0FhYNMg=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button as BaseButton } from "@base-ui/react/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@vegastack/design";

/** The six shapes an action can take. `cta` is the one marketing recipe and ignores `tone`. */
export type ButtonVariant =
  "solid" | "soft" | "outline" | "ghost" | "link" | "cta";

/** The one control-height vocabulary — the same names the `--size-*` tokens carry. */
export type ButtonSize = "xs" | "sm" | "md" | "lg";

/** The five hues a shape can carry. Every non-`cta` variant reads them from the same recipe. */
export type ButtonTone =
  "neutral" | "destructive" | "success" | "warning" | "info";

/**
 * `tone` is a set of CSS custom properties, `variant` is a recipe that reads them (audit P2,
 * 2026-09-07). Thirty cells, ten class strings: every hue gets the same hover/pressed grammar
 * because there is exactly one place that spells it.
 *
 * The vars, and who reads them:
 *
 * | var                  | read by                | neutral                  |
 * | -------------------- | ---------------------- | ------------------------ |
 * | `--btn-fill/-hover/-active` | `solid`         | the `primary` ramp       |
 * | `--btn-ink`          | `solid`                | `primary-foreground`     |
 * | `--btn-soft`         | `soft`                 | `secondary` (= surface-1)|
 * | `--btn-soft-hover/-active` | `soft` `outline` `ghost` | surface ladder rungs 2/3 |
 * | `--btn-tint`         | `soft` `outline` `link` ink | `foreground`        |
 * | `--btn-ghost-ink`    | `ghost` rest ink       | `inherit` (ghost keeps its host's ink) |
 * | `--btn-face`         | `outline` rest fill    | `background`             |
 * | `--btn-line/-hover`  | `outline` border       | `border`                 |
 * | `--btn-link`         | `link` ink             | `info-text`              |
 *
 * A status tone's soft rungs are the PRECOMPOSED `<family>-subtle-hover` / `-subtle-active` tokens
 * (derived per-theme in `sd-hooks.mjs` and AA-gated against `<family>-text`), never a live wash —
 * a wash would replace the subtle fill instead of climbing off it.
 */
export const buttonVariants = cva(
  // `text-label` is the chrome-control voice (14/500, −1% tracking) — the same voice every
  // other control label uses, so buttons don't read fractionally looser than tabs/segments/
  // menu items sitting beside them. Size variants below layer `text-sm`, which overrides only
  // font-size + line-height; the weight and tracking from `text-label` persist, so the small
  // tiers land on the `text-label-sm` metrics (12/500, −1%) without restating them.
  //
  // `relative` anchors the loading spinner, which is absolutely positioned OVER the label so the
  // button's width does not move when `loading` flips (audit B1-08).
  //
  // Disabled styling hangs off Base UI's `data-disabled` (present for BOTH native `disabled` and
  // the `focusableWhenDisabled` aria-disabled form) and deliberately does NOT set
  // `pointer-events-none`: a disabled control has to be hoverable for a Tooltip to explain why it
  // is disabled (audit D7 / B1-09). `not-data-loading:` keeps the dim off the pending state, which
  // is disabled-but-not-unavailable.
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent bg-clip-padding text-label whitespace-nowrap select-none data-disabled:cursor-not-allowed data-disabled:not-data-loading:opacity-(--opacity-dim) aria-invalid:border-destructive-border/(--alpha-tint-border) [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
  {
    variants: {
      tone: {
        neutral: cn(
          "[--btn-fill:var(--color-primary)] [--btn-fill-hover:var(--color-primary-hover)] [--btn-fill-active:var(--color-primary-active)] [--btn-ink:var(--color-primary-foreground)]",
          "[--btn-soft:var(--color-secondary)] [--btn-soft-hover:var(--color-surface-2)] [--btn-soft-active:var(--color-surface-3)]",
          "[--btn-tint:var(--color-foreground)] [--btn-ghost-ink:inherit] [--btn-link:var(--color-info-text)]",
          "[--btn-face:var(--color-background)] [--btn-line:var(--color-border)] [--btn-line-hover:var(--color-border)]",
        ),
        destructive: cn(
          "[--btn-fill:var(--color-destructive)] [--btn-fill-hover:var(--color-destructive-hover)] [--btn-fill-active:var(--color-destructive-active)] [--btn-ink:var(--color-destructive-foreground)]",
          "[--btn-soft:var(--color-destructive-subtle)] [--btn-soft-hover:var(--color-destructive-subtle-hover)] [--btn-soft-active:var(--color-destructive-subtle-active)]",
          "[--btn-tint:var(--color-destructive-text)] [--btn-ghost-ink:var(--color-destructive-text)] [--btn-link:var(--color-destructive-text)]",
          "[--btn-face:color-mix(in_oklab,var(--color-destructive)_var(--alpha-surface-faint),transparent)] [--btn-line:color-mix(in_oklab,var(--color-destructive)_var(--alpha-outline-border),transparent)] [--btn-line-hover:var(--color-destructive)]",
        ),
        success: cn(
          "[--btn-fill:var(--color-success)] [--btn-fill-hover:var(--color-success-hover)] [--btn-fill-active:var(--color-success-active)] [--btn-ink:var(--color-success-foreground)]",
          "[--btn-soft:var(--color-success-subtle)] [--btn-soft-hover:var(--color-success-subtle-hover)] [--btn-soft-active:var(--color-success-subtle-active)]",
          "[--btn-tint:var(--color-success-text)] [--btn-ghost-ink:var(--color-success-text)] [--btn-link:var(--color-success-text)]",
          "[--btn-face:color-mix(in_oklab,var(--color-success)_var(--alpha-surface-faint),transparent)] [--btn-line:color-mix(in_oklab,var(--color-success)_var(--alpha-outline-border),transparent)] [--btn-line-hover:var(--color-success)]",
        ),
        warning: cn(
          "[--btn-fill:var(--color-warning)] [--btn-fill-hover:var(--color-warning-hover)] [--btn-fill-active:var(--color-warning-active)] [--btn-ink:var(--color-warning-foreground)]",
          "[--btn-soft:var(--color-warning-subtle)] [--btn-soft-hover:var(--color-warning-subtle-hover)] [--btn-soft-active:var(--color-warning-subtle-active)]",
          "[--btn-tint:var(--color-warning-text)] [--btn-ghost-ink:var(--color-warning-text)] [--btn-link:var(--color-warning-text)]",
          "[--btn-face:color-mix(in_oklab,var(--color-warning)_var(--alpha-surface-faint),transparent)] [--btn-line:color-mix(in_oklab,var(--color-warning)_var(--alpha-outline-border),transparent)] [--btn-line-hover:var(--color-warning)]",
        ),
        info: cn(
          "[--btn-fill:var(--color-info)] [--btn-fill-hover:var(--color-info-hover)] [--btn-fill-active:var(--color-info-active)] [--btn-ink:var(--color-info-foreground)]",
          "[--btn-soft:var(--color-info-subtle)] [--btn-soft-hover:var(--color-info-subtle-hover)] [--btn-soft-active:var(--color-info-subtle-active)]",
          "[--btn-tint:var(--color-info-text)] [--btn-ghost-ink:var(--color-info-text)] [--btn-link:var(--color-info-text)]",
          "[--btn-face:color-mix(in_oklab,var(--color-info)_var(--alpha-surface-faint),transparent)] [--btn-line:color-mix(in_oklab,var(--color-info)_var(--alpha-outline-border),transparent)] [--btn-line-hover:var(--color-info)]",
        ),
      },
      variant: {
        // A solid owns its own darker hover/pressed steps — an alpha wash over a solid only thins
        // it (F1's `fillInteractive` note).
        solid:
          "bg-(--btn-fill) text-(--btn-ink) hover:bg-(--btn-fill-hover) active:bg-(--btn-fill-active)",
        // Filled and bordered controls alike climb the same two rungs: hover = rung 2, pressed =
        // rung 3 (F1's surface ladder, expressed once through the tone vars).
        soft: "bg-(--btn-soft) text-(--btn-tint) hover:bg-(--btn-soft-hover) active:bg-(--btn-soft-active)",
        outline:
          "border-(--btn-line) bg-(--btn-face) text-(--btn-tint) hover:border-(--btn-line-hover) hover:bg-(--btn-soft-hover) focus-visible:border-ring/(--alpha-tint-border) active:bg-(--btn-soft-active)",
        // A ghost has no rest ink of its own in the neutral tone: `--btn-ghost-ink` is `inherit`,
        // so a ghost dismiss control inside muted chrome keeps the muted ink until it is hovered.
        ghost:
          "text-(--btn-ghost-ink) hover:text-(--btn-tint) hover:bg-(--btn-soft-hover) active:bg-(--btn-soft-active)",
        // A text link dims on hover and re-inks on press — the pressed step of a link is solid ink.
        link: "text-(--btn-link) underline underline-offset-4 hover:text-(--btn-link)/(--alpha-link-hover) active:text-(--btn-link)",
        // Marketing CTA (audit 17-brand-direction §Color & surface + §Shape): the ONE sanctioned
        // use of the `--brand` phosphor accent as a button — accent-outline, sharp corners
        // (rounded-(--radius-sharp), rationed per D18), mono-uppercase label (the brand voice
        // layer). `rounded-(--radius-sharp)` / `text-mono-label` win over the base string's
        // `rounded-md` / `text-label` via later-in-source-order cascade — the SAME mechanism the
        // `outline` variant above relies on. `cta` is brand-locked: it reads no tone var, and the
        // type forbids passing `tone` with it. Compose a trailing chevron as a CHILD (e.g.
        // `<ChevronRight />`) — this variant is style-only, it never bakes in an icon.
        cta: "rounded-(--radius-sharp) border-brand/(--alpha-outline-border) bg-brand/(--alpha-surface-faint) font-mono text-mono-label text-brand uppercase hover:border-brand hover:bg-brand/(--alpha-hover) active:bg-brand/(--alpha-pressed)",
      },
      size: {
        // One vocabulary, `xs · sm · md · lg`, the same names the `--size-*` tokens carry
        // (audit B1-05). Text-bearing sizes pair their composed icon with the TEXT —
        // `--icon-inline` (14px, matching the 14px label) — because a 16px stroke-2 lucide glyph
        // next to a 14px label reads disproportionately heavy. Icon-only geometry lives in
        // `IconButton`, which is the ONLY sanctioned icon-only path (it makes the missing
        // `aria-label` a type error).
        xs: "h-(--size-xs) gap-1 px-2 text-label-sm [&_svg:not([class*='size-'])]:size-(--icon-compact)",
        sm: "h-(--size-sm) gap-1 px-2.5 text-label-sm [&_svg:not([class*='size-'])]:size-(--icon-inline)",
        md: "h-(--size-md) gap-1.5 px-3 [&_svg:not([class*='size-'])]:size-(--icon-inline)",
        lg: "h-(--size-lg) gap-1.5 px-4 [&_svg:not([class*='size-'])]:size-(--icon-inline)",
      },
    },
    defaultVariants: { variant: "solid", tone: "neutral", size: "md" },
  },
);

type BaseButtonProps = React.ComponentPropsWithRef<typeof BaseButton>;

/**
 * The one cell the doctrine forbids: a destructive action is never a solid red button (`design.md`
 * §Components · Button). It is expressed as `variant="soft"` (the standard destructive action) or
 * `variant="outline"` / `"ghost"` / `"link"`. Encoding it in the type means the rule is enforced at
 * compile time on every consumer, including copied-in registry code — `tone="destructive"` without
 * an explicit non-solid `variant` does not type-check.
 *
 * `cta` is brand-locked and takes no `tone`.
 */
export type ButtonAppearance =
  | { variant?: "solid"; tone?: Exclude<ButtonTone, "destructive"> }
  | { variant: "soft" | "outline" | "ghost" | "link"; tone?: ButtonTone }
  | { variant: "cta"; tone?: never };

/**
 * Everything a Button accepts EXCEPT the `variant`/`tone` pair. Split out so `IconButton` can
 * re-apply {@link ButtonAppearance} itself — omitting keys from a union would flatten it and lose
 * the forbidden-cell constraint.
 */
export type ButtonOwnProps = Omit<BaseButtonProps, "className"> & {
  /**
   * Control height, from the one `xs · sm · md · lg` vocabulary the `--size-*` tokens carry.
   * @default 'md'
   */
  size?: ButtonSize;
  /** Classes or a Base UI state resolver merged with the button variants.
   * @default undefined
   */
  className?: BaseButtonProps["className"];
  /**
   * Slot marker for wrapper components that compose Button through Base UI
   * `render` and need their own generated registry slot.
   * @default 'button'
   */
  "data-slot"?: string;
  /**
   * Loading-state marker for wrapper components that reflect a host-owned pending
   * state onto a composed Button without its `loading` visuals (e.g. SplitButton's
   * chevron half). The Button's own `loading` prop always wins when set.
   * @default undefined
   */
  "data-loading"?: string;
  /**
   * Shows a spinner over the label, disables interaction, and sets `aria-busy`. The
   * label keeps its box (it only goes `invisible`), so the button's width does not
   * move across the flip.
   * @default false
   */
  loading?: boolean;
};

/** Props accepted by `Button`. */
export type ButtonProps = ButtonOwnProps & ButtonAppearance;

/**
 * `Button` — trigger an action. Built on Base UI Button, so `render`,
 * `nativeButton`, and `focusableWhenDisabled` follow the official primitive
 * contract. Use for primary/secondary/destructive actions, not URL navigation
 * (style an anchor with `buttonVariants` when the action is a link).
 *
 * Appearance is two axes: `variant` (`solid · soft · outline · ghost · link · cta`) is the shape,
 * `tone` (`neutral · destructive · success · warning · info`) is the hue. Icon-only actions are
 * `IconButton`, never a `Button` with one child.
 *
 * A `disabled` Button is `aria-disabled` and stays focusable and hoverable, so a Tooltip can
 * explain why it is unavailable (audit D7) — Base UI suppresses activation either way. Pass
 * `focusableWhenDisabled={false}` for the rare control that must leave the tab order entirely.
 *
 * @example
 * <Button type="submit" loading={isSaving}>Save changes</Button>
 * @example
 * <Button variant="soft" tone="destructive" onClick={remove}>Delete</Button>
 */
export function Button({
  className,
  variant = "solid",
  tone,
  size = "md",
  loading = false,
  disabled,
  children,
  type = "button",
  focusableWhenDisabled,
  "aria-busy": ariaBusy,
  "data-slot": dataSlot,
  "data-loading": dataLoading,
  ref,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  // `cta` is brand-locked: passing `null` (not `undefined`) tells cva to emit NO tone variant, so
  // the thirteen unread custom properties stay off the element.
  const resolvedTone = variant === "cta" ? null : (tone ?? "neutral");
  const variantClassName = buttonVariants({
    variant,
    tone: resolvedTone,
    size,
  });
  const resolvedClassName: BaseButtonProps["className"] =
    typeof className === "function"
      ? (state) => cn(variantClassName, className(state))
      : cn(variantClassName, className);

  return (
    <BaseButton
      {...props}
      ref={ref}
      type={type}
      data-slot={dataSlot ?? "button"}
      data-variant={variant}
      data-tone={resolvedTone ?? undefined}
      data-size={size}
      data-loading={loading ? "" : dataLoading}
      aria-busy={loading ? true : ariaBusy}
      disabled={isDisabled}
      // Disabled is ALWAYS the aria-disabled form (audit D7): a control that is unavailable has to
      // stay reachable and hoverable, or the Tooltip that explains why can never be read. Base UI
      // suppresses activation for both forms, so nothing becomes clickable.
      focusableWhenDisabled={focusableWhenDisabled ?? true}
      className={resolvedClassName}
    >
      {/* While loading the spinner is taken OUT of flow and centred over the label, and the label
          keeps its box behind `visibility: hidden` — an inherited property, so a `display: contents`
          wrapper still hides every child. Width is therefore identical loading and not (audit
          B1-08). The wrapper exists ONLY while loading: a permanent `display: contents` box changes
          how Chromium hit-tests a child SVG (measured — it starts returning the svg instead of the
          button from `elementFromPoint`), and the 24px pointer-target contract depends on that. */}
      {loading ? (
        <>
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
          >
            <Spinner size="inherit" label="" />
          </span>
          <span className="contents invisible">{children}</span>
        </>
      ) : (
        children
      )}
    </BaseButton>
  );
}
