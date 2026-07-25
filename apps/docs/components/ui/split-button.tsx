// @vegastack split-button@0.3.0 sha256-+a5/HrpphMzG7spamkmOBJVYM9RykzspDqQCggyfK2E=

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  type DropdownMenuContentProps,
} from "@/components/ui/dropdown-menu";

/**
 * A single secondary action rendered inside the {@link SplitButton} dropdown.
 * Pass these via the `actions` prop for the declarative API, or compose
 * {@link DropdownMenuItem} children directly via `menu` for full control.
 */
export interface SplitButtonAction {
  /** The visible label for the action. */
  label: React.ReactNode;
  /** Invoked when the action is selected. */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Optional leading icon — a single `lucide-react` / `@vegastack/design/icons` element. */
  icon?: React.ReactNode;
  /** Styles the item as a destructive (delete/remove) action. @default false */
  destructive?: boolean;
  /** Disables the action and removes it from keyboard navigation. @default false */
  disabled?: boolean;
}

/**
 * `render` is intentionally not exposed. `SplitButton` is a multi-element
 * composite, so there is no single root element a `render` prop could replace.
 * Compose it via its declarative `actions` array or composed `menu` children.
 */
export type SplitButtonProps = Omit<ButtonProps, "render"> & {
  /** The primary action's label. */
  children: React.ReactNode;
  /**
   * Accessible name for the dropdown trigger (the chevron has no visible text).
   * @default 'More options'
   */
  menuLabel?: string;
  /**
   * Alignment of the dropdown relative to the trigger.
   * @default 'end'
   */
  menuAlign?: DropdownMenuContentProps["align"];
  /** Props forwarded to the {@link DropdownMenuContent}. */
  menuContentProps?: Omit<DropdownMenuContentProps, "align" | "children">;
} & (
    | {
        /**
         * Secondary actions shown in the dropdown.
         */
        actions: [SplitButtonAction, ...SplitButtonAction[]];
        menu?: never;
      }
    | {
        /**
         * Compose {@link DropdownMenuItem} (and labels, separators, submenus)
         * directly instead of using the declarative `actions` array.
         */
        menu: React.ReactNode;
        actions?: never;
      }
  );

/** The chevron trigger's width per size, mirroring `Button`'s horizontal padding scale. */
const triggerSizeClassName: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "px-1",
  sm: "px-1.5",
  default: "px-1.5",
  lg: "px-2",
  icon: "px-1.5",
  "icon-xs": "px-1",
  "icon-sm": "px-1.5",
  "icon-lg": "px-2",
};

/**
 * `SplitButton` — a primary action button joined to a dropdown trigger. The left
 * half runs the default action on click; the chevron on the right opens a menu of
 * related secondary actions. Built by composing {@link Button} and
 * {@link DropdownMenu}, so every `variant` / `size` / `loading` / `disabled` prop
 * passes straight through to both halves and the seam stays visually joined.
 *
 * @example
 * // Declarative actions
 * <SplitButton
 *   onClick={save}
 *   actions={[
 *     { label: 'Save and continue', icon: <ArrowRight />, onClick: saveAndContinue },
 *     { label: 'Discard', icon: <Trash2 />, destructive: true, onClick: discard },
 *   ]}
 * >
 *   Save
 * </SplitButton>
 *
 * @example
 * // Composed menu children
 * <SplitButton onClick={publish} menu={<DropdownMenuItem onClick={schedule}>Schedule…</DropdownMenuItem>}>
 *   Publish
 * </SplitButton>
 */
export function SplitButton({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  onClick,
  actions,
  menu,
  menuLabel = "More options",
  menuAlign = "end",
  menuContentProps,
  ...props
}: SplitButtonProps) {
  const isDisabled = disabled || loading;
  const hasMenu = actions ? actions.length > 0 : Boolean(menu);
  const menuContent = actions
    ? actions.map((action, index) => (
        <DropdownMenuItem
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          variant={action.destructive ? "destructive" : "default"}
        >
          {action.icon}
          {action.label}
        </DropdownMenuItem>
      ))
    : menu;

  return (
    <div
      data-slot="split-button"
      data-variant={variant}
      data-size={size}
      className={cn("inline-flex items-stretch", className)}
    >
      {/* Primary action — joined on the right (square corner + shared seam). */}
      <Button
        variant={variant}
        size={size}
        loading={loading}
        disabled={disabled}
        onClick={onClick}
        data-slot="split-button-primary"
        className="rounded-e-none"
        {...props}
      >
        {children}
      </Button>

      {hasMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant={variant}
                size={size}
                disabled={isDisabled}
                // Loading CUE on the menu half (register P2-39): announced busy + styleable via
                // data-loading. Deliberately NO second spinner — the primary half already shows
                // one. While loading (but NOT truly disabled) the chevron stays focusable
                // (`focusableWhenDisabled`, matching Button's own loading contract) so keyboard
                // focus isn't dropped mid-action — Base UI renders `aria-disabled` instead of the
                // native attribute, which also skips the `disabled:` opacity dim: the pending
                // state must read as ONE joined control (the primary half doesn't dim while
                // loading either), with `data-loading:pointer-events-none` keeping the half
                // non-interactive. A true `disabled` prop still renders native disabled and dims
                // both halves.
                focusableWhenDisabled={loading && !disabled ? true : undefined}
                aria-busy={loading || undefined}
                data-loading={loading ? "" : undefined}
                aria-label={menuLabel}
                data-slot="split-button-trigger"
                className={cn(
                  "-ms-px rounded-s-none data-loading:pointer-events-none",
                  triggerSizeClassName[size ?? "default"],
                )}
              >
                <ChevronDown aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align={menuAlign} {...menuContentProps}>
            {menuContent}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
