// @vegastack record-chip@0.23.14 sha256-FN7dQuFze+R0SAJpBVzqDKMcz+Jgs2u3b2iszE9+XTk=

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
    <span
      data-slot="record-chip"
      data-empty={hasValue ? undefined : ""}
      className={cn(
        "inline-flex h-7 max-w-full min-w-0 items-center rounded-full border border-border bg-background text-xs font-medium text-foreground data-empty:border-dashed data-empty:text-muted-foreground",
        className,
      )}
    >
      <Button
        data-slot="record-chip-trigger"
        variant="ghost"
        type={type}
        className={cn(
          "h-full min-w-0 shrink justify-start gap-1.5 rounded-full ps-2.5 text-xs text-inherit aria-expanded:bg-muted [&_svg:not([class*='size-'])]:size-3.5",
          showLink ? "pe-1.5" : "pe-2",
        )}
        {...props}
      >
        {icon ? (
          <span aria-hidden className="inline-flex text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 truncate">
          {hasValue ? value : placeholder}
        </span>
        <ChevronDown aria-hidden className="text-muted-foreground" />
      </Button>
      {showLink ? (
        <>
          <span aria-hidden className="h-4 w-px bg-border" />
          {renderLink({
            href,
            "aria-label": linkLabel,
            className:
              "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5",
            children: <ArrowUpRight aria-hidden />,
          })}
        </>
      ) : null}
    </span>
  );
}
