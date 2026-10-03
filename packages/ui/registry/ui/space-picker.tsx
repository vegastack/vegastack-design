// @vegastack space-picker@0.23.119 sha256-ZHOT5LjgvPjFJGMWtRmCC31SHelrg7K2Hm8vzSEN4dk=

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SpaceAvatar,
  SpaceHintIcon,
  SpaceIcon,
  SpaceOption,
  spaceHintLabel,
  type Space,
  type SpaceHint,
} from "@/components/ui/space-avatar";

/* ------------------------------------------------------------------------------------------------
 * SpaceChip and SpacePicker — which space a record lives in, and choosing it.
 *
 * `SpaceChip` is the quiet property chip: the space's tile, its name and a ▾, tinted on hover (the
 * RecordChip ghost look). `readOnly` is the same chip as plain text, for a card that only shows
 * where something lives — including a space the viewer cannot see (`hint`: "Priya's My space",
 * "Private space").
 *
 * `SpacePicker` is that chip opening a searchable list of the spaces given: "My space" first, then
 * "Spaces", a check on the current one, and a disabled row that says why ("You can't add here").
 * `placement="title"` sizes the chip for a dialog title — `[▣ General ▾] › New task` — and
 * `placement="field"` for a form or a property row.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `SpaceChip`. */
export interface SpaceChipProps extends Omit<
  React.ComponentPropsWithRef<"button">,
  "children"
> {
  /** The space shown; empty shows `hint`, else `placeholder` with the generic space glyph. @default undefined */
  space?: Space | null;
  /**
   * With no `space`: which kind of space the viewer cannot see holds the record — shows "Priya's
   * My space" or "Private space" with its glyph. @default undefined
   */
  hint?: SpaceHint | null;
  /** Shown while there is no space. @default "Choose a space" */
  placeholder?: React.ReactNode;
  /**
   * `xs` — 24px, small text and a 16px tile (a card or a dense row). `sm` — 28px, body text and a
   * 20px tile (a form or a property row). `title` — the dialog title's type size.
   * @default "sm"
   */
  size?: "xs" | "sm" | "title";
  /** Show where the record lives without offering a change: plain text, no ▾, no tab stop. @default false */
  readOnly?: boolean;
}

/**
 * `SpaceChip` — a space as a property chip: tile, name, ▾. Every other prop and the ref reach the
 * button, so it drops into a trigger's `render`.
 *
 * @example
 * <SpaceChip space={{ name: "General", access: "open", hue: "blue" }} />
 * <SpaceChip size="xs" readOnly space={task.space} hint={task.spaceHint} />
 */
export function SpaceChip({
  space,
  hint,
  placeholder = "Choose a space",
  size = "sm",
  readOnly = false,
  className,
  type = "button",
  ...props
}: SpaceChipProps) {
  const tile = space ? (
    <SpaceAvatar
      space={space}
      size={size === "xs" ? "2xs" : "xs"}
      showLock={false}
    />
  ) : hint ? (
    <SpaceHintIcon
      hint={hint}
      aria-hidden
      data-slot="space-chip-icon"
      className="text-muted-foreground"
    />
  ) : (
    <SpaceIcon
      aria-hidden
      data-slot="space-chip-icon"
      className="text-muted-foreground"
    />
  );
  const name = (
    <span className={cn("min-w-0 truncate", !space && "text-muted-foreground")}>
      {space ? space.name : hint ? spaceHintLabel(hint) : placeholder}
    </span>
  );

  if (readOnly) {
    return (
      <span
        data-slot="space-chip"
        data-size={size}
        data-readonly=""
        className={cn(
          "inline-flex max-w-full min-w-0 items-center gap-1.5 text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5",
          size === "xs" ? "text-xs" : "text-sm",
          className,
        )}
      >
        {tile}
        {name}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size === "xs" ? "xs" : size === "title" ? "default" : "sm"}
      type={type}
      data-slot="space-chip"
      data-size={size}
      data-empty={space ? undefined : ""}
      className={cn(
        "max-w-full min-w-0 justify-start gap-1.5 rounded-md px-1.5 font-normal text-foreground has-data-[icon=inline-end]:pe-1",
        size === "sm" && "text-sm",
        size === "title" && "-ms-1.5 font-heading text-base font-medium",
        className,
      )}
      {...props}
    >
      {tile}
      {name}
      <ChevronDown
        aria-hidden
        data-icon="inline-end"
        data-slot="space-chip-chevron"
        className="size-3.5 text-muted-foreground"
      />
    </Button>
  );
}

/** One space offered by `SpacePicker`. */
export interface SpacePickerItem {
  /** The space's id — what `value` and `onValueChange` carry. */
  id: string;
  /** The space, drawn with `SpaceAvatar`. `access: "personal"` lists it under "My space". */
  space: Space;
  /** A muted second line, such as "Private · 8 members". @default undefined */
  secondary?: React.ReactNode;
  /**
   * Shown but not choosable. A string says why, on the row: "You can view, not add, here".
   * @default false
   */
  disabled?: boolean | string;
}

/** Props for `SpacePicker`. */
export interface SpacePickerProps {
  /** The spaces to offer, in order; personal spaces are listed first, under "My space". */
  spaces: readonly SpacePickerItem[];
  /** The chosen space's id. @default undefined */
  value?: string | null;
  /** Called with the chosen space's id; the list then closes. @default undefined */
  onValueChange?: (id: string) => void;
  /**
   * `title` — the chip sized for a dialog title, beside "› New task". `field` — the chip sized
   * for a form or property row.
   * @default "field"
   */
  placement?: "title" | "field";
  /** Shown on the chip while nothing is chosen. @default "Choose a space" */
  placeholder?: React.ReactNode;
  /** Disable the chip. @default false */
  disabled?: boolean;
  /** Controlled open state of the list. @default undefined */
  open?: boolean;
  /** Called when the list opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** Classes for the chip. @default undefined */
  className?: string;
}

/**
 * `SpacePicker` — a `SpaceChip` that opens a searchable list of spaces: My space first, then the
 * rest, a check on the current one, and disabled rows that say why. Keyboard: Enter or Space opens
 * it, type to filter, arrows move, Enter picks, Escape closes.
 *
 * @example
 * <DialogTitle className="flex items-center gap-1">
 *   <SpacePicker placement="title" spaces={writable} value={spaceId} onValueChange={setSpaceId} />
 *   <span aria-hidden className="text-muted-foreground">›</span> New task
 * </DialogTitle>
 */
export function SpacePicker({
  spaces,
  value,
  onValueChange,
  placement = "field",
  placeholder,
  disabled = false,
  open: openProp,
  onOpenChange,
  className,
}: SpacePickerProps) {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const current = spaces.find((item) => item.id === value);
  const personal = spaces.filter((item) => item.space.access === "personal");
  const shared = spaces.filter((item) => item.space.access !== "personal");

  const row = (item: SpacePickerItem) => {
    const reason = typeof item.disabled === "string" ? item.disabled : null;
    return (
      <CommandItem
        key={item.id}
        value={`${item.space.name} ${item.id}`}
        disabled={Boolean(item.disabled)}
        data-checked={item.id === value ? "true" : undefined}
        data-slot="space-picker-item"
        onSelect={() => {
          onValueChange?.(item.id);
          setOpen(false);
        }}
      >
        <SpaceOption
          name={item.space.name}
          secondary={reason ?? item.secondary}
          avatar={<SpaceAvatar space={item.space} size="sm" />}
        />
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <SpaceChip
            space={current?.space}
            placeholder={placeholder}
            size={placement === "title" ? "title" : "sm"}
            aria-label={`Space: ${current?.space.name ?? "none chosen"}`}
            className={className}
          />
        }
      />
      <PopoverContent
        align="start"
        data-slot="space-picker"
        className="w-72 gap-0 p-0"
      >
        <Command>
          <CommandInput placeholder="Find a space…" aria-label="Find a space" />
          <CommandList>
            <CommandEmpty>
              <span className="flex flex-col items-center gap-2 text-muted-foreground">
                <SpaceIcon aria-hidden className="size-4" />
                No spaces found
              </span>
            </CommandEmpty>
            {personal.length > 0 ? (
              <CommandGroup heading="My space">
                {personal.map(row)}
              </CommandGroup>
            ) : null}
            {shared.length > 0 ? (
              <CommandGroup heading="Spaces">{shared.map(row)}</CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
