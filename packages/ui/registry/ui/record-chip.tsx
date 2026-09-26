// @vegastack record-chip@0.23.40 sha256-jD1TGgWgaboHWik2X1TLeDmCBuAWM/XsAmPJL26NO9w=

import * as React from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@vegastack/design";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";

/** Props accepted by `RecordChip`. */
export interface RecordChipProps extends Omit<
  React.ComponentProps<"button">,
  "children" | "value"
> {
  /**
   * `default` — the bordered pill, for a record's links ("Linked to").
   * `ghost` — a property value that reads as plain body text: no border, no leading icon (a
   * status or priority icon stays), the standard tint on hover and keyboard focus, and a ▾ that
   * fades in then. Its padding hangs outside `PropertyValue`, so its text lines up with plain
   * values.
   * @default "default"
   */
  variant?: "default" | "ghost";
  /**
   * A person value: a 20px avatar (initials when there is no image) before the name, and a
   * `badge` such as "Inactive" after it. Sets the value to the person's name.
   * @default undefined
   */
  person?: RecordChipPerson | null;
  /**
   * The record type's icon (a building for a customer, a folder for a project).
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * The linked record's name. Empty shows `placeholder` in the muted ink.
   * @default undefined
   */
  value?: React.ReactNode;
  /**
   * Shown when there is no `value`, e.g. "Add customer". `null` shows the icon alone (no text, no
   * ▾) — an unset pill in a dense row; name the button with `aria-label`.
   * @default "Select"
   */
  placeholder?: React.ReactNode;
  /**
   * Opens the linked record. With a `value`, a ↗ link sits after the picker.
   * @default undefined
   */
  href?: string;
  /**
   * Accessible name of the ↗ link.
   * @default "Open"
   */
  linkLabel?: string;
  /**
   * Renders the ↗ link — pass your router's link for client navigation.
   * @default a plain `<a>`
   */
  renderLink?: (props: {
    href: string;
    className: string;
    "aria-label": string;
    children: React.ReactNode;
  }) => React.ReactNode;
}

/** A person shown by a RecordChip. */
export interface RecordChipPerson {
  /** The name shown, and the avatar's initials. */
  name: string;
  /** The avatar image. @default undefined */
  image?: string | null;
  /** A status after the name, such as "Inactive" — a string is a small muted outline badge. @default undefined */
  badge?: React.ReactNode;
}

/** The two initials of a name ("Asha Rao" → "AR"). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const defaultRenderLink: NonNullable<RecordChipProps["renderLink"]> = (
  props,
) => <a {...props} />;

/** Props accepted by `SplitChip`. */
export type SplitChipProps = React.ComponentProps<"span">;

/**
 * `SplitChip` — the pill shell behind RecordChip: a bordered, rounded-full container with one
 * shared `p-0.5` inset, so every segment inside it (a `SplitChipButton` main action, a
 * `SplitChipSeparator`, an icon link or button with `splitChipIconActionClassName`) shows its hover and open background with the
 * same gap from the border on every side. Use it for any "main action + icon action in one pill".
 *
 * @example
 * <SplitChip>
 *   <SplitChipButton>Acme <ChevronDown /></SplitChipButton>
 *   <SplitChipSeparator />
 *   <a href="/customers/acme" aria-label="Open Acme" className={splitChipIconActionClassName}>
 *     <ArrowUpRight />
 *   </a>
 * </SplitChip>
 */
export function SplitChip({ className, ...props }: SplitChipProps) {
  return (
    <span
      data-slot="split-chip"
      className={cn(
        "inline-flex max-w-full min-w-0 items-center rounded-full border border-border bg-background p-0.5 text-xs font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Classes of a SplitChip's main (text) segment: 24px tall, rounded-full, muted when open. It drops
 * the Button's transparent 1px border, so its hover and open background fills the whole 24px box
 * and sits the same 2px from the pill's border as the icon segment's circle does — at both ends,
 * top and bottom, and on either side of the separator. Before a separator its end padding drops to
 * 5px, so the chevron sits as far from the divider as the icon segment's glyph does on the other
 * side (2px margin + 5px of the 24px circle's inset). It never nudges on press.
 */
export const splitChipButtonClassName =
  "h-6 min-w-0 shrink border-0 justify-start gap-1.5 rounded-full px-2 text-xs text-inherit aria-expanded:bg-muted [&_svg:not([class*='size-'])]:size-3.5 active:not-aria-[haspopup]:translate-y-0 [&:has(+[data-slot=split-chip-separator])]:pe-1.25";

/** Classes of a SplitChip's icon segment: a 24px circle (the 24px hit area). */
export const splitChipIconActionClassName =
  "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5";

/**
 * A SplitChip's main segment — a ghost `Button` sized to the shared inset.
 *
 * @example
 * <SplitChipButton onClick={pick}>Acme <ChevronDown /></SplitChipButton>
 */
export function SplitChipButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="split-chip-button"
      variant="ghost"
      className={cn(splitChipButtonClassName, className)}
      {...props}
    />
  );
}

/**
 * The 1px divider between two SplitChip segments.
 *
 * @example
 * <SplitChipSeparator />
 */
export function SplitChipSeparator({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="split-chip-separator"
      className={cn("mx-0.5 h-4 w-px shrink-0 bg-border", className)}
      {...props}
    />
  );
}

/**
 * `RecordChip` — a pill that shows which record something belongs to and picks another: an icon,
 * the record's name and a ▾, plus a ↗ link to the record. Every other prop — and the ref — goes to
 * the picker button, so it drops into a trigger's `render`:
 * `<PopoverTrigger render={<RecordChip … />} />`.
 *
 * `variant="ghost"` is the quiet form for a `PropertyValue`: the value as plain body text, tinted on
 * hover and keyboard focus with a ▾ fading in at the end.
 *
 * @example
 * <PopoverTrigger
 *   render={
 *     <RecordChip icon={<Building2 />} value="Acme" placeholder="Add customer" href="/customers/acme" linkLabel="Open Acme" />
 *   }
 * />
 * <PopoverTrigger render={<RecordChip variant="ghost" person={{ name: "Asha Rao" }} placeholder="Unassigned" />} />
 */
export function RecordChip({
  variant = "default",
  person,
  icon,
  value: valueProp,
  placeholder = "Select",
  href,
  linkLabel = "Open",
  renderLink = defaultRenderLink,
  className,
  type = "button",
  ...props
}: RecordChipProps) {
  const value = person ? person.name : valueProp;
  const hasValue = value != null && value !== false && value !== "";
  const showLink = hasValue && href !== undefined;
  const ghost = variant === "ghost";
  const lead = person ? (
    <Avatar data-slot="record-chip-avatar" className="size-5">
      {person.image ? <AvatarImage src={person.image} alt="" /> : null}
      <AvatarFallback>{initials(person.name)}</AvatarFallback>
    </Avatar>
  ) : icon ? (
    <span
      aria-hidden
      data-slot="record-chip-icon"
      className={cn(
        "inline-flex",
        ghost
          ? // Ghost keeps only a semantic icon — a status circle or a priority flag, in its own
            // colour; any other record-type icon is dropped.
            "[&:not(:has([data-slot=status-icon],[data-slot=priority-icon]))]:hidden"
          : "text-muted-foreground",
      )}
    >
      {icon}
    </span>
  ) : null;
  const badge =
    person?.badge == null ||
    person.badge === false ? null : typeof person.badge === "string" ? (
      <Badge
        variant="outline"
        data-slot="record-chip-badge"
        className="shrink-0 text-xs font-normal text-muted-foreground"
      >
        {person.badge}
      </Badge>
    ) : (
      person.badge
    );
  return (
    <SplitChip
      data-slot="record-chip"
      data-variant={variant}
      data-empty={hasValue ? undefined : ""}
      className={cn(
        ghost
          ? // No border and no fill: the chip is the value's text; the button carries the tint.
            "gap-1 border-0 bg-transparent p-0 text-sm font-normal text-inherit data-empty:text-muted-foreground"
          : "data-empty:border-dashed data-empty:text-muted-foreground",
        className,
      )}
    >
      <SplitChipButton
        data-slot="record-chip-trigger"
        type={type}
        className={
          ghost
            ? // 28px tall and 8px of padding: `PropertyValue` hangs both outside the row, so the
              // text starts where plain values do and the row keeps its height. The ▾ is always
              // laid out (only its opacity changes), so nothing moves on hover or open.
              "h-7 gap-2 rounded-md px-2 text-sm font-normal [&:has(+[data-slot=split-chip-separator])]:pe-2 [&_svg:not([class*='size-'])]:size-3.5"
            : undefined
        }
        {...props}
      >
        {lead}
        {hasValue || placeholder !== null ? (
          <>
            <span className="min-w-0 truncate">
              {hasValue ? value : placeholder}
            </span>
            {badge}
            <ChevronDown
              aria-hidden
              data-slot="record-chip-chevron"
              className={cn(
                "text-muted-foreground",
                ghost &&
                  "-ms-1 opacity-0 transition-opacity group-hover/button:opacity-100 group-focus-visible/button:opacity-100 group-aria-expanded/button:opacity-100",
              )}
            />
          </>
        ) : null}
      </SplitChipButton>
      {showLink ? (
        <>
          {ghost ? null : <SplitChipSeparator />}
          {renderLink({
            href,
            "aria-label": linkLabel,
            className: ghost
              ? cn(splitChipIconActionClassName, "size-7 rounded-md")
              : splitChipIconActionClassName,
            children: <ArrowUpRight aria-hidden />,
          })}
        </>
      ) : null}
    </SplitChip>
  );
}

/** Props for `RecordChipMenu`: `PopoverContent`'s own, plus how wide it is. */
export type RecordChipMenuProps = React.ComponentProps<
  typeof PopoverContent
> & {
  /**
   * `list` — a 288px panel for a searchable `Command` list (room for a name and an email).
   * `fit` — as wide as its content, e.g. a `Calendar`.
   * @default "list"
   */
  width?: "list" | "fit";
};

/**
 * `RecordChipMenu` — the popover a RecordChip (or any pill) opens: start-aligned, no inner padding,
 * so a `Command` list or a `Calendar` sits flush.
 *
 * @example
 * <Popover><PopoverTrigger render={<RecordChip … />} /><RecordChipMenu><Command>…</Command></RecordChipMenu></Popover>
 */
export function RecordChipMenu({
  width = "list",
  align = "start",
  className,
  ...props
}: RecordChipMenuProps) {
  return (
    <PopoverContent
      data-slot="record-chip-menu"
      data-width={width}
      align={align}
      className={cn(width === "fit" ? "w-auto p-0" : "w-72 p-0", className)}
      {...props}
    />
  );
}
