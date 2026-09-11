// @vegastack split-button@0.8.2 sha256-7oxnimu3jEc9JcXMWuJSwYINZwTNWMv9XtImuWvEFAM=

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@vegastack/design";
import {
  Button,
  type ButtonAppearance,
  type ButtonOwnProps,
} from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
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
export type SplitButtonProps = Omit<ButtonOwnProps, "render"> &
  ButtonAppearance & {
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
  variant = "solid",
  tone,
  size = "md",
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
          tone={action.destructive ? "destructive" : "default"}
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
      data-tone={tone}
      data-size={size}
      className={cn("inline-flex items-stretch", className)}
    >
      {/* Primary action — joined on the right (square corner + shared seam). It is a plain Button,
          so it keeps the matrix's own hover and pressed steps (audit SP-04). */}
      <Button
        {...({ variant, tone } as ButtonAppearance)}
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
              <IconButton
                {...({ variant, tone } as ButtonAppearance)}
                size={size}
                disabled={isDisabled}
                // Loading CUE on the menu half (register P2-39): announced busy + styleable via
                // data-loading. Deliberately NO second spinner — the primary half already shows
                // one. The half stays focusable and is marked `aria-disabled` (Button's uniform
                // disabled form, audit D7), so keyboard focus isn't dropped mid-action and the
                // pending state reads as ONE joined control — the primary half doesn't dim while
                // loading either, and `data-loading` suppresses the dim on this half the same way.
                // `data-loading:pointer-events-none` keeps it non-interactive.
                aria-busy={loading || undefined}
                data-loading={loading ? "" : undefined}
                aria-label={menuLabel}
                data-slot="split-button-trigger"
                className="-ms-px rounded-s-none data-loading:pointer-events-none"
              >
                <ChevronDown aria-hidden />
              </IconButton>
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
