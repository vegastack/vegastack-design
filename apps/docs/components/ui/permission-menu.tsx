// @vegastack permission-menu@0.23.112 sha256-xV2A9h6ZaCZbiVNCIHUedaC2nEQtjE58ituGJRIarmg=

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
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

/* ------------------------------------------------------------------------------------------------
 * PermissionMenu — the access level on a sharing row ("Full access", "Can edit", "Can view"): a
 * ghost trigger reading the current level, a menu of levels each with a one-line description and a
 * check on the current one, and an optional destructive "Remove access" at the end. A built-in row
 * (the creator, an assignee) is `readOnly`: the level as plain muted text, no menu.
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
  /** Show the level as plain muted text, with no menu — for a built-in row such as the creator. @default false */
  readOnly?: boolean;
  /** Disable the trigger — a change is saving, say. @default false */
  disabled?: boolean;
  /** The trigger's height tier. @default "sm" */
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
  disabled = false,
  size = "sm",
  align = "end",
  "aria-label": ariaLabel,
  className,
}: PermissionMenuProps<Value>) {
  const current = options.find((option) => option.value === value);
  const label = current?.label ?? value;

  if (readOnly) {
    return (
      <span
        data-slot="permission-menu"
        data-readonly=""
        className={cn(
          "inline-flex shrink-0 items-center text-sm whitespace-nowrap text-muted-foreground",
          // The level's text lines up with a menu trigger's in the rows around it.
          size === "sm" ? "h-7 ps-2.5 pe-6" : "h-8 ps-2.5 pe-7",
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
            variant="ghost"
            size={size}
            disabled={disabled}
            aria-label={ariaLabel}
            data-permission-menu=""
            className={cn("shrink-0 gap-1 text-sm font-normal", className)}
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
      <DropdownMenuContent align={align} className={cn(described && "w-64")}>
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
                  <ItemDescription className="line-clamp-1 text-xs">
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
