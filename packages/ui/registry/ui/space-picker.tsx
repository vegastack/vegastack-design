// @vegastack space-picker@0.25.14 sha256-biOxmPymJLDdRzHFznrIV9pmR8cyY2/gKruhOhardU0=

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
import { Layers, LockIcon, UserLock } from "lucide-react";
import { IconGlyph } from "@/components/ui/icon-glyph";
import type { AvatarHue } from "@/components/ui/avatar";
/** A space presentation supplied to existing space controls. */
export interface Space {
  /** Name shown beside the glyph. */ name: string;
  /** Resolved glyph content. */ icon?: React.ReactNode;
  /** Identity hue. */ hue?: AvatarHue | null;
  /** Existing access kind. */ access: "open" | "private" | "personal";
}
/** Privacy-safe information about an undiscoverable space. */
export type SpaceHint =
  { kind: "personal"; ownerName: string } | { kind: "private" };
/** Describe an undiscoverable space without revealing its identity. */
export function spaceHintLabel(hint: SpaceHint): string {
  return hint.kind === "personal"
    ? `${hint.ownerName}'s My space`
    : "Private space";
}

/* ------------------------------------------------------------------------------------------------
 * SpaceChip and SpacePicker — which space a record lives in, and choosing it.
 *
 * `SpaceChip` is the quiet property chip: the space's tile, its name and a ▾, tinted on hover (the
 * RecordChip ghost look). `readOnly` is the same chip as plain text, for a card that only shows
 * where something lives — including a space the viewer cannot see (`hint`: "Priya's My space",
 * "Private space").
 *
 * `SpacePicker` is that chip opening a searchable list of the spaces given: "My space" first, then
 * "Spaces", one line per space (its tile and name), a check on the current one, and a disabled row
 * that says why at its end ("You can't add here"). `placement="title"` is the outlined chip a
 * create dialog's header leads with — `[▣ General ▾]` — and `placement="field"` the quiet chip for
 * a form or a property row.
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
   * 20px tile (a form or a property row). `title` — an outlined, rounded 28px chip for a create
   * dialog's header (the property pills' shape, so it reads as a control rather than a heading).
   * @default "sm"
   */
  size?: "xs" | "sm" | "title";
  /**
   * Show where the record lives without offering a change: plain text, no ▾, no tab stop (pass
   * `tabIndex={0}` to make it a tooltip trigger). With `size="title"` it keeps the outlined chip's
   * shape, without the ▾. @default false
   */
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
    <IconGlyph
      fallback={
        space.access === "personal" ? (
          <UserLock aria-hidden />
        ) : (
          (space.icon ?? Array.from(space.name.trim())[0]?.toUpperCase())
        )
      }
      hue={space.hue}
      size="xs"
    />
  ) : hint ? (
    <IconGlyph
      fallback={hint.kind === "personal" ? <UserLock /> : <LockIcon />}
      aria-hidden
      data-slot="space-chip-icon"
      className="text-muted-foreground"
    />
  ) : (
    <Layers
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
    // The rest of the props (a tooltip trigger's handlers, `tabIndex`, `aria-*`) reach the span,
    // so a read-only chip can carry a tooltip that explains where the record lives.
    const { ref, ...spanProps } = props;
    void type;
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        {...(spanProps as React.HTMLAttributes<HTMLSpanElement>)}
        data-slot="space-chip"
        data-size={size}
        data-readonly=""
        className={cn(
          "inline-flex max-w-full min-w-0 items-center gap-1.5 text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5",
          size === "xs" ? "text-xs" : "text-sm",
          // `title`: the outlined chip's shape without its ▾ — the same chip a create dialog's
          // header leads with, shown where the record cannot be moved.
          size === "title" &&
            "h-7 rounded-full border border-border bg-background ps-1.5 pe-2.5 font-medium text-foreground dark:border-input dark:bg-input/30",
          className,
        )}
      >
        {tile}
        {name}
        {space?.access === "private" ? (
          <LockIcon
            role="img"
            aria-label="Private space"
            className="size-3 shrink-0 text-muted-foreground"
          />
        ) : null}
      </span>
    );
  }

  return (
    <Button
      variant={size === "title" ? "outline" : "ghost"}
      size={size === "xs" ? "xs" : "sm"}
      type={type}
      data-slot="space-chip"
      data-size={size}
      data-empty={space ? undefined : ""}
      className={cn(
        "max-w-full min-w-0 justify-start gap-1.5 rounded-md px-1.5 font-normal text-foreground has-data-[icon=inline-end]:pe-1",
        size === "sm" && "text-sm",
        size === "title" && "rounded-full ps-1.5 pe-2 text-sm font-medium",
        className,
      )}
      {...props}
    >
      {tile}
      {name}
      {space?.access === "private" ? (
        <LockIcon
          role="img"
          aria-label="Private space"
          className="size-3 shrink-0 text-muted-foreground"
        />
      ) : null}
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
  /** The space, drawn with `IconGlyph`. `access: "personal"` lists it under "My space". */
  space: Space;
  /**
   * @deprecated Rows are one line — the tile and the name; this is no longer shown.
   * @default undefined
   */
  secondary?: React.ReactNode;
  /**
   * Shown but not choosable. A string says why, muted at the row's end: "You can't add here".
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
   * `title` — the outlined chip that leads a create dialog's header. `field` — the quiet chip
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
 * `SpacePicker` — a `SpaceChip` that opens a searchable list of spaces, one line each: My space
 * first, then the rest, a check on the current one, and disabled rows that say why. Keyboard: Enter
 * or Space opens it, type to filter, arrows move, Enter picks, Escape closes.
 *
 * @example
 * <DialogHeader>
 *   <DialogTitle className="sr-only">New task</DialogTitle>
 *   <SpacePicker placement="title" spaces={writable} value={spaceId} onValueChange={setSpaceId} />
 * </DialogHeader>
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
        <IconGlyph
          fallback={
            item.space.access === "personal" ? (
              <UserLock />
            ) : (
              (item.space.icon ??
              Array.from(item.space.name.trim())[0]?.toUpperCase())
            )
          }
          hue={item.space.hue}
        />
        <span className="min-w-0 flex-1 truncate">{item.space.name}</span>
        {reason ? (
          <span
            title={reason}
            className="max-w-1/2 shrink-0 truncate text-xs text-muted-foreground"
          >
            {reason}
          </span>
        ) : null}
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
                <Layers aria-hidden className="size-4" />
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
