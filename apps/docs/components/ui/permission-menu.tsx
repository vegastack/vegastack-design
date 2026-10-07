// @vegastack permission-menu@0.24.5 sha256-S3A3PQjf+rbAgVlkNhB1W87A/89kT7ZuNeilPo3YHHc=

import * as React from "react";
import { ChevronDownIcon, LockIcon } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * PermissionMenu — the access level on a sharing row ("Full access", "Can edit", "Can view"): a
 * trigger reading the current level, a menu of levels each with a description of up to two lines
 * and a check on the current one, and an optional destructive "Remove access" at the end.
 *
 * Three trigger looks: `ghost` (the original quiet button), `chip` (a 28px property chip for a
 * people row — the tint on hover and a ▾ that says it opens) and `outline` (a bordered 32px control
 * that lines up with `Input`, `PeopleInput` and `Button` in a form row). A built-in row (the
 * creator, an assignee) is `locked`: a lock and the level, still a tab stop, with a tooltip that
 * says why it cannot change ("Set by role: Creator"). `readOnly` is plain muted text, no menu.
 * ----------------------------------------------------------------------------------------------*/

/** One access level in a `PermissionMenu`. */
export interface PermissionMenuOption<Value extends string = string> {
  /** The level's value. */
  value: Value;
  /** The level's name, shown on the trigger and in the menu. */
  label: string;
  /** One muted line under the label in the menu, such as "Edit, comment and share". @default undefined */
  description?: string;
  /** Shown but not choosable. @default false */
  disabled?: boolean;
}

/** Props for `PermissionMenu`. */
export interface PermissionMenuProps<Value extends string = string> {
  /** The current level. */
  value: Value;
  /** The levels, in order — usually from most to least access. */
  options: readonly PermissionMenuOption<Value>[];
  /** Called with the chosen level. @default undefined */
  onValueChange?: (value: Value) => void;
  /** Adds a destructive last item that removes this row's access. Omit for no remove item. @default undefined */
  onRemove?: () => void;
  /** The remove item's label. @default "Remove access" */
  removeLabel?: string;
  /** Show the level as plain muted text, with no menu and no tab stop. @default false */
  readOnly?: boolean;
  /**
   * A level that cannot change here — a built-in row such as the creator: a small lock and the
   * level, reachable by keyboard, with `lockedReason` in a tooltip. Wins over `readOnly`.
   * @default false
   */
  locked?: boolean;
  /** Why a `locked` level cannot change, shown in its tooltip — e.g. "Set by role: Creator". @default undefined */
  lockedReason?: React.ReactNode;
  /** Disable the trigger — a change is saving, say. @default false */
  disabled?: boolean;
  /**
   * The trigger's look. `ghost` — the quiet text button. `chip` — a property chip for a people
   * row: 28px, the tint on hover and a ▾. `outline` — a bordered control that lines up with
   * `Input` and `Button` in a form row (32px).
   * @default "ghost"
   */
  variant?: "ghost" | "chip" | "outline";
  /** The trigger's height tier. @default "default" for `outline`, otherwise "sm" */
  size?: "sm" | "default";
  /** Which edge of the trigger the menu lines up with. @default "end" */
  align?: "start" | "center" | "end";
  /** The trigger's accessible name; include the visible level, e.g. "Priya's access: Can edit". @default the level's label */
  "aria-label"?: string;
  /** Classes for the trigger (or the read-only text). @default undefined */
  className?: string;
}

/**
 * `PermissionMenu` — pick an access level for one row of a sharing list, or remove the row's access.
 *
 * @example
 * <PermissionMenu variant="chip" value="full" options={LEVELS} locked lockedReason="Set by role: Creator" />
 * <PermissionMenu variant="outline" value={level} options={LEVELS} onValueChange={setLevel} />
 * <PermissionMenu
 *   value="edit"
 *   options={[
 *     { value: "full", label: "Full access", description: "Edit, share and delete" },
 *     { value: "edit", label: "Can edit", description: "Edit and comment" },
 *     { value: "view", label: "Can view", description: "View and comment" },
 *   ]}
 *   onValueChange={setLevel}
 *   onRemove={removeAccess}
 * />
 */
export function PermissionMenu<Value extends string = string>({
  value,
  options,
  onValueChange,
  onRemove,
  removeLabel = "Remove access",
  readOnly = false,
  locked = false,
  lockedReason,
  disabled = false,
  variant = "ghost",
  size: sizeProp,
  align = "end",
  "aria-label": ariaLabel,
  className,
}: PermissionMenuProps<Value>) {
  const current = options.find((option) => option.value === value);
  const label = current?.label ?? value;
  const size = sizeProp ?? (variant === "outline" ? "default" : "sm");
  const tier = size === "sm" ? "h-7" : "h-8";

  if (locked) {
    const reason = typeof lockedReason === "string" ? `, ${lockedReason}` : "";
    const trigger = (
      <Button
        variant={variant === "outline" ? "outline" : "ghost"}
        size={size}
        disabled
        data-slot="permission-menu"
        data-variant={variant}
        data-locked=""
        aria-label={`${ariaLabel ?? label}${reason}`}
        className={cn(
          // A locked level reads as muted text with a lock — not as a dimmed, broken control.
          "shrink-0 gap-1.5 text-sm font-normal text-muted-foreground data-disabled:not-data-loading:opacity-100",
          variant === "chip" && "rounded-md px-2",
          variant === "outline" && "justify-between",
          className,
        )}
      >
        <LockIcon
          aria-hidden
          data-slot="permission-menu-lock"
          data-icon="inline-start"
          className="size-3.5"
        />
        {label}
      </Button>
    );
    if (lockedReason == null) return trigger;
    return (
      <Tooltip>
        <TooltipTrigger render={trigger} />
        <TooltipContent>{lockedReason}</TooltipContent>
      </Tooltip>
    );
  }

  if (readOnly) {
    return (
      <span
        data-slot="permission-menu"
        data-variant={variant}
        data-readonly=""
        className={cn(
          "inline-flex shrink-0 items-center text-sm whitespace-nowrap text-muted-foreground",
          // The level's text lines up with a menu trigger's in the rows around it.
          tier,
          variant === "chip"
            ? "px-2"
            : size === "sm"
              ? "ps-2.5 pe-6"
              : "ps-2.5 pe-7",
          className,
        )}
      >
        {label}
      </span>
    );
  }

  const described = options.some((option) => option.description);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={variant === "outline" ? "outline" : "ghost"}
            size={size}
            disabled={disabled}
            aria-label={ariaLabel}
            data-permission-menu=""
            data-variant={variant}
            className={cn(
              "shrink-0 gap-1 text-sm font-normal",
              // The chip: the text in body ink, a compact tint just around it, a ▾ that is
              // always drawn, so the level reads as something you can change.
              variant === "chip" && "rounded-md px-2 text-foreground",
              variant === "outline" && "justify-between gap-1.5",
              className,
            )}
          />
        }
      >
        {label}
        <ChevronDownIcon
          aria-hidden
          data-slot="permission-menu-chevron"
          data-icon="inline-end"
          className="text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn(described && "w-72")}>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onValueChange?.(next as Value)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.description ? (
                <ItemContent className="gap-0">
                  <ItemTitle className="font-normal">{option.label}</ItemTitle>
                  {/* Up to two lines: a level's description is a sentence, never cut mid-word. */}
                  <ItemDescription className="line-clamp-2 text-xs">
                    {option.description}
                  </ItemDescription>
                </ItemContent>
              ) : (
                option.label
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {onRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              data-permission-menu-remove=""
              onClick={onRemove}
            >
              {removeLabel}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
