// @vegastack icon-button@0.9.1 sha256-CrHd9OwrWhAds978rfvKt11BcV0ki1dzxiKLoO87uSM=

import * as React from "react";
import { cn } from "@vegastack/design";
import { Button, buttonVariants } from "@/components/ui/button";

/** Every prop `Button` accepts, including `variant`, `loading` and Base UI's `render`. */
type ButtonProps = React.ComponentProps<typeof Button>;

/** The four square icon-only sizes — the same `xs · sm · md · lg` vocabulary every control uses. */
export type IconButtonSize = "xs" | "sm" | "md" | "lg";

/** `square` is the default chrome shape; `round` is for avatars, media transports and pills. */
export type IconButtonShape = "square" | "round";

/**
 * The square tier each `IconButtonSize` maps onto. Since the shadcn reset (Batch 2) `Button` ships
 * upstream's four icon sizes outright, so this wrapper picks one instead of re-deriving the
 * geometry from a text tier. `icon-button` is retired in Batch 7 in favour of
 * `<Button size="icon" />`; the mapping is what keeps every existing call site working until then.
 */
const buttonSizeBySize: Record<
  IconButtonSize,
  "icon-xs" | "icon-sm" | "icon" | "icon-lg"
> = {
  xs: "icon-xs",
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
};

/**
 * `iconButtonGeometry` — the square (or round) icon-only geometry as a class string, to pair with
 * `buttonVariants()` on an **anchor**. `Button` and `IconButton` are for actions; navigation is a
 * real `<a>`, styled to match (`design.md` §Components · Button). Rendering an anchor through
 * `IconButton` would force `role="button"` onto a link, which is why this is a helper and not a
 * `render` prop.
 *
 * @example
 * <a href={backHref} aria-label="Go back"
 *    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), iconButtonGeometry("sm"))}>
 *   <ChevronLeft aria-hidden />
 * </a>
 */
export function iconButtonGeometry(
  size: IconButtonSize = "md",
  shape: IconButtonShape = "square",
): string {
  return cn(
    buttonVariants({ size: buttonSizeBySize[size] }),
    shape === "round" && "rounded-full",
  );
}

/**
 * Props for `IconButton`. Inherits every `Button` prop except `size` (remapped to the square
 * `IconButtonSize` scale) and requires an accessible `aria-label` because the icon child carries
 * no text.
 */
export type IconButtonOwnProps = Omit<ButtonProps, "size" | "aria-label"> & {
  /**
   * The icon to render. Pass a single `lucide-react` (or `@vegastack/design/icons`)
   * element — it is sized automatically by the chosen `size`. Optional only so the control can be
   * composed through Base UI `render`, where the host supplies the children.
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * Square size, from the one `--size-*` vocabulary.
   * @default 'md'
   */
  size?: IconButtonSize;
  /**
   * Outline shape. `round` is the sanctioned way to get a circular control — a `rounded-full`
   * override on a Button is not.
   * @default 'square'
   */
  shape?: IconButtonShape;
  /**
   * Accessible name announced to assistive tech (required — the icon has no
   * visible text).
   */
  "aria-label": string;
  /** Overridable slot marker, so a wrapper can rename the control it composes. */
  "data-slot"?: string;
};

/** Props accepted by `IconButton`. */
export type IconButtonProps = IconButtonOwnProps;

/**
 * `IconButton` — a square (or round) icon-only action button. A thin wrapper over `Button` that
 * forces icon-only geometry and **requires** an accessible `aria-label`, since there is no visible
 * text to name it. `variant`, `tone`, `loading`, `disabled`, and `render` pass straight through.
 *
 * **Why this exists (RETAINED by decision — register P1-21 reversed):** the whole job of the
 * wrapper is the **compile-time accessible-name guarantee**. A bare `Button` with a single icon
 * child accepts an unnamed control silently; `IconButton` makes the missing `aria-label` a TYPE
 * ERROR. It is the ONLY sanctioned icon-only path — `Button` has no icon size tier at all, and a
 * hand-rolled `<button>` with an icon in it is a design-lint violation.
 *
 * @example
 * <IconButton aria-label="Add item" variant="outline" size="sm">
 *   <Plus />
 * </IconButton>
 * @example
 * <IconButton aria-label="Dismiss" variant="ghost" size="xs" shape="round" onClick={close}>
 *   <X />
 * </IconButton>
 */
export function IconButton({
  size = "md",
  shape = "square",
  className,
  children,
  "data-slot": dataSlot,
  ...props
}: IconButtonProps) {
  const resolvedClassName: ButtonProps["className"] =
    typeof className === "function"
      ? (
          state: Parameters<
            Exclude<ButtonProps["className"], string | undefined>
          >[0],
        ) => cn(shape === "round" && "rounded-full", className(state))
      : cn(shape === "round" && "rounded-full", className);

  return (
    <Button
      {...(props as ButtonProps)}
      size={buttonSizeBySize[size]}
      data-slot={dataSlot ?? "icon-button"}
      data-shape={shape}
      className={resolvedClassName}
    >
      {children}
    </Button>
  );
}
