// @vegastack record-chip@0.23.18 sha256-w6byvTgTAZY3bYzuF1f0iOpP7TFoqSpbA2Z5XMDWLoI=

import * as React from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";

/** Props accepted by `RecordChip`. */
export interface RecordChipProps extends Omit<
  React.ComponentProps<"button">,
  "children" | "value"
> {
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
   * Shown when there is no `value`, e.g. "Add customer".
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

/** Classes of a SplitChip's main (text) segment: 24px tall, rounded-full, muted when open. */
export const splitChipButtonClassName =
  "h-6 min-w-0 shrink justify-start gap-1.5 rounded-full px-2 text-xs text-inherit aria-expanded:bg-muted [&_svg:not([class*='size-'])]:size-3.5";

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
 * @example
 * <PopoverTrigger
 *   render={
 *     <RecordChip icon={<Building2 />} value="Acme" placeholder="Add customer" href="/customers/acme" linkLabel="Open Acme" />
 *   }
 * />
 */
export function RecordChip({
  icon,
  value,
  placeholder = "Select",
  href,
  linkLabel = "Open",
  renderLink = defaultRenderLink,
  className,
  type = "button",
  ...props
}: RecordChipProps) {
  const hasValue = value != null && value !== false && value !== "";
  const showLink = hasValue && href !== undefined;
  return (
    <SplitChip
      data-slot="record-chip"
      data-empty={hasValue ? undefined : ""}
      className={cn(
        "data-empty:border-dashed data-empty:text-muted-foreground",
        className,
      )}
    >
      <SplitChipButton data-slot="record-chip-trigger" type={type} {...props}>
        {icon ? (
          <span aria-hidden className="inline-flex text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 truncate">
          {hasValue ? value : placeholder}
        </span>
        <ChevronDown aria-hidden className="text-muted-foreground" />
      </SplitChipButton>
      {showLink ? (
        <>
          <SplitChipSeparator />
          {renderLink({
            href,
            "aria-label": linkLabel,
            className: splitChipIconActionClassName,
            children: <ArrowUpRight aria-hidden />,
          })}
        </>
      ) : null}
    </SplitChip>
  );
}
