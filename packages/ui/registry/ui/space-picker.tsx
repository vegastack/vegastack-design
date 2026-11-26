// @vegastack space-picker@0.136.4 sha256-6AlKZQ+kCPGBECe4bPaaxI0lDMVHxqHpviUFU8PO1do=

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
   * 20px tile (a form or a property row). `title` — an outlined 28px pill for a create
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
  /**
   * `ghost` — the space as a `PropertyValue`, the `RecordChip variant="ghost"` look: the name in
   * the value's ink and size, a 24px capsule tint just around it on hover, the ▾ laid out but
   * shown only on hover, focus or while its picker is open. `PropertyValue` hangs it into the
   * gutter, so its tile starts where every other value's text or icon does. Read-only, it is the
   * same box without a ▾; give it an `href` and it is a link with the same hover. @default "default"
   */
  variant?: "default" | "ghost";
  /** Read-only only: where the space opens; the chip renders as a link. @default undefined */
  href?: string;
}

/**
 * `SpaceChip` — a space as a property chip: tile, name, ▾. Every other prop and the ref reach the
 * button, so it drops into a trigger's `render`.
 *
 * @example
 * <SpaceChip space={{ name: "General", access: "open", hue: "blue" }} />
 * <SpaceChip size="xs" readOnly space={task.space} hint={task.spaceHint} />
 * <PropertyValue><SpaceChip variant="ghost" readOnly href="/spaces/general" space={space} /></PropertyValue>
 */
export function SpaceChip({
  space,
  hint,
  placeholder = "Choose a space",
  size = "sm",
  readOnly = false,
  variant = "default",
  href,
  className,
  type = "button",
  ...props
}: SpaceChipProps) {
  const ghost = variant === "ghost";
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
  ) : ghost ? null : (
    // A ghost chip's empty state is the dashed pill alone, like every other empty property.
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
    const readOnlyClassName = cn(
      "inline-flex max-w-full min-w-0 items-center gap-1.5 text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5",
      size === "xs" ? "text-xs" : "text-sm",
      // `title`: the outlined chip's shape without its ▾ — the same chip a create dialog's
      // header leads with, shown where the record cannot be moved.
      size === "title" &&
        "h-7 rounded-chip border border-border bg-background ps-1.5 pe-2.5 font-medium text-foreground dark:border-input dark:bg-input/30",
      // Ghost: a value like any other — the text colour at the value's size, in the ghost chip's
      // 24px capsule (a tint on hover only where it is a link or a tooltip's trigger).
      ghost &&
        "h-6 rounded-chip px-1.5 text-sm text-foreground no-underline outline-none",
      ghost &&
        (href !== undefined || spanProps.tabIndex !== undefined) &&
        "state-layer",
      className,
    );
    const content = (
      <>
        {tile}
        {name}
        {space?.access === "private" ? (
          <LockIcon
            role="img"
            aria-label="Private space"
            className="size-3 shrink-0 text-muted-foreground"
          />
        ) : null}
      </>
    );
    if (href !== undefined)
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(spanProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          href={href}
          data-slot="space-chip"
          data-size={size}
          data-chip={variant}
          data-readonly=""
          className={readOnlyClassName}
        >
          {content}
        </a>
      );
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        {...(spanProps as React.HTMLAttributes<HTMLSpanElement>)}
        data-slot="space-chip"
        data-size={size}
        data-chip={variant}
        data-readonly=""
        className={readOnlyClassName}
      >
        {content}
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
      data-chip={variant}
      data-empty={space ? undefined : ""}
      className={cn(
        "max-w-full min-w-0 justify-start gap-1.5 px-1.5 font-normal text-foreground has-data-[icon=inline-end]:pe-1",
        size === "sm" && "text-sm",
        // The outlined chip a create dialog leads with: the read-only chip's pill shape.
        size === "title" && "rounded-chip ps-1.5 pe-2 text-sm font-medium",
        // Ghost: `RecordChip variant="ghost"`'s 24px capsule and 6px padding; its ▾ is laid out
        // at rest (so nothing moves) and shows on hover, focus or while the picker is open.
        ghost &&
          "group/space-chip h-6 rounded-chip border-0 px-1.5 has-data-[icon=inline-end]:pe-1.5",
        // Ghost with nothing chosen: the dashed empty pill every property picker shares, its 5px
        // padding plus the 1px border keeping the prompt where values start.
        ghost &&
          !space &&
          !hint &&
          "border border-dashed border-border px-1.25 text-muted-foreground has-data-[icon=inline-end]:pe-1.25",
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
        className={cn(
          "size-3.5 text-muted-foreground",
          ghost &&
            "opacity-0 transition-opacity duration-state group-hover/space-chip:opacity-100 group-focus-visible/space-chip:opacity-100 group-aria-expanded/space-chip:opacity-100 group-data-popup-open/space-chip:opacity-100 pointer-coarse:opacity-100",
        )}
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
   * for a form. `property` — a side panel's property value: `SpaceChip variant="ghost"`, and
   * the dashed empty pill while nothing is chosen.
   * @default "field"
   */
  placement?: "title" | "field" | "property";
  /**
   * Offer "no space" as the list's last row (its label `clearLabel`); called when it is picked.
   * Omit for a record that must live in a space. @default undefined
   */
  onClear?: () => void;
  /** The "no space" row's label. @default "No space" */
  clearLabel?: string;
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
  onClear,
  clearLabel = "No space",
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
            variant={placement === "property" ? "ghost" : "default"}
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
            {onClear ? (
              <CommandGroup>
                <CommandItem
                  value={clearLabel}
                  data-checked={value == null ? "true" : undefined}
                  data-slot="space-picker-clear"
                  onSelect={() => {
                    onClear();
                    setOpen(false);
                  }}
                >
                  <Layers aria-hidden className="text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{clearLabel}</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
