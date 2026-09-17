// @vegastack button@0.9.1 sha256-8cQQEmPCIb4PUnh1bbluynvZn87QI8A7SuEF9KLeqVw=

import * as React from "react";
import { cva } from "class-variance-authority";
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
 * | `--btn-soft`         | `soft`                 | `secondary` (= muted)|
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
 *
 * Every reference is to the RAW token variable (`var(--destructive)`), never Tailwind's
 * `--color-*` alias. The aliases are declared once on `:root`, so their value is computed there and
 * a NESTED theme scope (`<div class="dark">`, `MarketingSurface`) never re-resolves them — a button
 * inside one would paint light-theme ink on a dark ground. The raw tokens are redeclared in every
 * scope, so they resolve at the button. Measured by the dark half of the rendered-contrast gate.
 */
export const buttonVariants = cva(
  // `text-sm font-medium` is the chrome-control voice (14/500, −1% tracking) — the same voice every
  // other control label uses, so buttons don't read fractionally looser than tabs/segments/
  // menu items sitting beside them. Size variants below layer `text-xs`, which overrides only
  // font-size + line-height; the weight and tracking from `text-sm font-medium` persist, so the small
  // tiers land on the `text-xs font-medium` metrics (12/500, −1%) without restating them.
  //
  // `relative` anchors the loading spinner, which is absolutely positioned OVER the label so the
  // button's width does not move when `loading` flips (audit B1-08).
  //
  // Disabled styling hangs off Base UI's `data-disabled` (present for BOTH native `disabled` and
  // the `focusableWhenDisabled` aria-disabled form) and deliberately does NOT set
  // `pointer-events-none`: a disabled control has to be hoverable for a Tooltip to explain why it
  // is disabled (audit D7 / B1-09). `not-data-loading:` keeps the dim off the pending state, which
  // is disabled-but-not-unavailable.
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap select-none data-disabled:cursor-not-allowed data-disabled:not-data-loading:opacity-50 aria-invalid:border-destructive/70 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      tone: {
        neutral: cn(
          "[--btn-fill:var(--primary)] [--btn-fill-hover:color-mix(in_oklab,var(--primary)_80%,transparent)] [--btn-fill-active:color-mix(in_oklab,var(--primary)_70%,transparent)] [--btn-ink:var(--primary-foreground)]",
          "[--btn-soft:var(--secondary)] [--btn-soft-hover:color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] [--btn-soft-active:color-mix(in_oklch,var(--secondary),var(--foreground)_10%)]",
          "[--btn-tint:var(--foreground)] [--btn-ghost-ink:inherit] [--btn-link:var(--info-text)]",
          "[--btn-face:var(--background)] [--btn-line:var(--border)] [--btn-line-hover:var(--border)]",
        ),
        destructive: cn(
          "[--btn-fill:var(--destructive)] [--btn-fill-hover:color-mix(in_oklab,var(--destructive)_80%,transparent)] [--btn-fill-active:color-mix(in_oklab,var(--destructive)_70%,transparent)] [--btn-ink:var(--destructive-foreground)]",
          "[--btn-soft:color-mix(in_oklab,var(--destructive)_10%,transparent)] [--btn-soft-hover:color-mix(in_oklab,var(--destructive)_20%,transparent)] [--btn-soft-active:color-mix(in_oklab,var(--destructive)_30%,transparent)]",
          "[--btn-tint:var(--destructive-text)] [--btn-ghost-ink:var(--destructive-text)] [--btn-link:var(--destructive-text)]",
          "[--btn-face:color-mix(in_oklab,var(--destructive)_5%,transparent)] [--btn-line:color-mix(in_oklab,var(--destructive)_50%,transparent)] [--btn-line-hover:var(--destructive)]",
        ),
        success: cn(
          "[--btn-fill:var(--success)] [--btn-fill-hover:color-mix(in_oklab,var(--success)_80%,transparent)] [--btn-fill-active:color-mix(in_oklab,var(--success)_70%,transparent)] [--btn-ink:var(--success-foreground)]",
          "[--btn-soft:color-mix(in_oklab,var(--success)_10%,transparent)] [--btn-soft-hover:color-mix(in_oklab,var(--success)_20%,transparent)] [--btn-soft-active:color-mix(in_oklab,var(--success)_30%,transparent)]",
          "[--btn-tint:var(--success-text)] [--btn-ghost-ink:var(--success-text)] [--btn-link:var(--success-text)]",
          "[--btn-face:color-mix(in_oklab,var(--success)_5%,transparent)] [--btn-line:color-mix(in_oklab,var(--success)_50%,transparent)] [--btn-line-hover:var(--success)]",
        ),
        warning: cn(
          "[--btn-fill:var(--warning)] [--btn-fill-hover:color-mix(in_oklab,var(--warning)_80%,transparent)] [--btn-fill-active:color-mix(in_oklab,var(--warning)_70%,transparent)] [--btn-ink:var(--warning-foreground)]",
          "[--btn-soft:color-mix(in_oklab,var(--warning)_10%,transparent)] [--btn-soft-hover:color-mix(in_oklab,var(--warning)_20%,transparent)] [--btn-soft-active:color-mix(in_oklab,var(--warning)_30%,transparent)]",
          "[--btn-tint:var(--warning-text)] [--btn-ghost-ink:var(--warning-text)] [--btn-link:var(--warning-text)]",
          "[--btn-face:color-mix(in_oklab,var(--warning)_5%,transparent)] [--btn-line:color-mix(in_oklab,var(--warning)_50%,transparent)] [--btn-line-hover:var(--warning)]",
        ),
        info: cn(
          "[--btn-fill:var(--info)] [--btn-fill-hover:color-mix(in_oklab,var(--info)_80%,transparent)] [--btn-fill-active:color-mix(in_oklab,var(--info)_70%,transparent)] [--btn-ink:var(--info-foreground)]",
          "[--btn-soft:color-mix(in_oklab,var(--info)_10%,transparent)] [--btn-soft-hover:color-mix(in_oklab,var(--info)_20%,transparent)] [--btn-soft-active:color-mix(in_oklab,var(--info)_30%,transparent)]",
          "[--btn-tint:var(--info-text)] [--btn-ghost-ink:var(--info-text)] [--btn-link:var(--info-text)]",
          "[--btn-face:color-mix(in_oklab,var(--info)_5%,transparent)] [--btn-line:color-mix(in_oklab,var(--info)_50%,transparent)] [--btn-line-hover:var(--info)]",
        ),
      },
      variant: {
        // A solid owns its own darker hover/pressed steps — an alpha wash over a solid only thins
        // it (F1's the family's own hover wash note).
        solid:
          "bg-(--btn-fill) text-(--btn-ink) hover:bg-(--btn-fill-hover) active:bg-(--btn-fill-active)",
        // Filled and bordered controls alike climb the same two rungs: hover = rung 2, pressed =
        // rung 3 (F1's surface ladder, expressed once through the tone vars).
        soft: "bg-(--btn-soft) text-(--btn-tint) hover:bg-(--btn-soft-hover) active:bg-(--btn-soft-active)",
        outline:
          "border-(--btn-line) bg-(--btn-face) text-(--btn-tint) hover:border-(--btn-line-hover) hover:bg-(--btn-soft-hover) focus-visible:border-ring/70 active:bg-(--btn-soft-active)",
        // A ghost has no rest ink of its own in the neutral tone: `--btn-ghost-ink` is `inherit`,
        // so a ghost dismiss control inside muted chrome keeps the muted ink until it is hovered.
        ghost:
          "text-(--btn-ghost-ink) hover:text-(--btn-tint) hover:bg-(--btn-soft-hover) active:bg-(--btn-soft-active)",
        // A text link dims on hover and re-inks on press — the pressed step of a link is solid ink.
        link: "text-(--btn-link) underline underline-offset-4 hover:text-(--btn-link)/88 active:text-(--btn-link)",
        // Marketing CTA (audit 17-brand-direction §Color & surface + §Shape): the ONE sanctioned
        // use of the `--brand` phosphor accent as a button — accent-outline over a faint brand
        // wash, sharp corners (rounded-[2px], rationed per D18), mono-uppercase label
        // (the brand voice layer). `rounded-[2px]` / `font-mono text-xs` win over the base
        // string's `rounded-md` / `text-sm font-medium` via later-in-source-order cascade — the SAME
        // mechanism the `outline` variant above relies on. `cta` is brand-locked: it reads no tone
        // var, and the type forbids passing `tone` with it. Compose a trailing chevron as a CHILD
        // (e.g. `<ChevronRight />`) — this variant is style-only, it never bakes in an icon.
        //
        // The LABEL is `brand-text`, not `brand`. `--font-mono text-xs` is 0.75rem/400 — normal text
        // under WCAG 1.4.3, so 4.5:1 — and `brand` is a 3.5:1 MARKER value: `text-brand` over this
        // variant's own faint wash measured 3.41 rest / 3.33 hover / 3.21 pressed in light
        // (2026-09-09, HIGH-2), shipped live on the docs button playground. `brand-text` is the
        // page-readable half of the family, the same role every status family ships, and equals
        // `brand` on the dark and `.vs-marketing` grounds where the marker value already read at
        // 12.2:1. Re-measured over the cta's own faces: light 5.93 / 5.80 / 5.59, dark 11.41 /
        // 10.90 / 10.13. contrast-check gates it on every surface a CTA can be mounted on.
        //
        // NOT settled here: whether `cta` should be TYPE-BOUND to `MarketingSurface`. Nothing
        // scopes it today, and the doctrine calls it a marketing recipe — an open question for MK
        // (see the PR that introduced `brand-text`). The ink fix stands either way.
        cta: "rounded-[2px] border-brand/50 bg-brand/5 font-mono font-mono text-xs text-brand-text uppercase hover:border-brand hover:bg-brand/7 active:bg-brand/10",
      },
      size: {
        // One vocabulary, `xs · sm · md · lg`, the same names the `--size-*` tokens carry
        // (audit B1-05). Text-bearing sizes pair their composed icon with the TEXT —
        // `size-3.5` (14px, matching the 14px label) — because a 16px stroke-2 lucide glyph
        // next to a 14px label reads disproportionately heavy. Icon-only geometry lives in
        // `IconButton`, which is the ONLY sanctioned icon-only path (it makes the missing
        // `aria-label` a type error).
        xs: "h-6 gap-1 px-2 text-xs font-medium [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-xs font-medium [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-8 gap-1.5 px-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 [&_svg:not([class*='size-'])]:size-3.5",
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
   * label keeps its box at `opacity: 0`, so the button's width does not move across
   * the flip and its accessible name survives.
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
          keeps its box at `opacity: 0`, so the button's accessible name survives. Width is
          therefore identical loading and not (audit B1-08). The wrapper exists ONLY while loading:
          a permanent `display: contents` box changes how Chromium hit-tests a child SVG (measured —
          `elementFromPoint` starts returning the svg instead of the button), and the 24px
          pointer-target contract depends on that. */}
      {loading ? (
        <>
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
          >
            <Spinner size="inherit" label="" />
          </span>
          {/* `opacity-0`, NOT `invisible`: `visibility: hidden` would drop the label out of the
              accessibility tree, leaving a loading button with no discernible name (caught by axe
              on the Button route, 2026-09-07). Opacity hides it visually and keeps the name. */}
          <span className="contents opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </BaseButton>
  );
}
