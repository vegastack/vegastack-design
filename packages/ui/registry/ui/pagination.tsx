// @vegastack pagination@0.1.0 sha256-8DZ9gZrIme92IQeFon+XbJ2RN9NiovNi7leBDw0Iw40=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useRender } from "@base-ui/react/use-render";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@vegastack/design";

export type PaginationProps = React.ComponentPropsWithRef<"nav">;

/**
 * `Pagination` — the navigation landmark for paged content. Renders a
 * `<nav role="navigation" aria-label="pagination">`. Links use Base UI
 * `useRender` composition for router integration, so the module keeps a client
 * boundary even though the emitted DOM is presentational. Compose with
 * `PaginationContent`, `PaginationItem`, `PaginationLink`,
 * `PaginationPrevious`, `PaginationNext`, and `PaginationEllipsis`.
 *
 * @example
 * <Pagination>
 *   <PaginationContent>
 *     <PaginationItem>
 *       <PaginationPrevious href="?page=1" />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="?page=1" isActive>1</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="?page=2">2</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationEllipsis />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationNext href="?page=2" />
 *     </PaginationItem>
 *   </PaginationContent>
 * </Pagination>
 */
function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export type PaginationContentProps = React.ComponentPropsWithRef<"ul">;

/**
 * `PaginationContent` — the unordered list (`<ul>`) holding the page items.
 * Flex-aligned with a consistent gap between controls.
 */
function PaginationContent({ className, ...props }: PaginationContentProps) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row flex-wrap items-center gap-1", className)}
      {...props}
    />
  );
}

export type PaginationItemProps = React.ComponentPropsWithRef<"li">;

/** `PaginationItem` — a single list slot (`<li>`) wrapping a link or ellipsis. */
function PaginationItem({ className, ...props }: PaginationItemProps) {
  return <li data-slot="pagination-item" className={className} {...props} />;
}

/**
 * Pagination link variants — styled like a ghost button. The active (current)
 * page is the one selection in the control, so it carries the **primary** fill
 * (`bg-primary` + `primary-foreground`); inactive pages are ghost and lift to
 * the neutral `accent` on hover. Disabled prev/next dim to 50% opacity. Every
 * value is a semantic token (no hardcoded colors).
 */
export const paginationLinkVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent bg-clip-padding text-base font-medium whitespace-nowrap tabular-nums transition-all duration-fast ease-standard select-none hover:bg-accent hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-(--opacity-dim) [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
  {
    variants: {
      isActive: {
        true: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        false: "",
      },
      size: {
        default: "h-(--size-md) min-w-(--size-md) gap-1.5 px-2.5",
        sm: "h-(--size-sm) min-w-(--size-sm) gap-1 px-2.5 text-sm [&_svg:not([class*='size-'])]:size-(--icon-inline)",
        lg: "h-(--size-lg) min-w-(--size-lg) gap-1.5 px-3",
        icon: "size-(--size-md)",
      },
    },
    defaultVariants: { isActive: false, size: "icon" },
  },
);

export interface PaginationLinkProps
  extends
    React.ComponentPropsWithRef<"a">,
    Pick<VariantProps<typeof paginationLinkVariants>, "size"> {
  /**
   * Marks the link as the current page — applies the active **primary**-fill
   * styling and sets `aria-current="page"`.
   * @default false
   */
  isActive?: boolean;
  /**
   * Replace the rendered `<a>` element via Base UI `render` composition. Pass a
   * routing link element (e.g. `<NextLink href="/x" />`) or a render function to
   * integrate with a router while keeping pagination styling.
   */
  render?: useRender.RenderProp;
}

/**
 * `PaginationLink` — a navigable page link. Renders an `<a>` by default and
 * supports the Base UI `render` prop for client-side routing. Set `isActive` on
 * the current page. When `aria-disabled` is truthy, the link enforces its own
 * disabled state instead of relying on the consumer: it drops out of the tab
 * order (`tabIndex={-1}`) and swallows clicks (`preventDefault`, and the
 * consumer's `onClick` is never called) — pointer dismissal was already
 * handled by `aria-disabled:pointer-events-none`, this closes the remaining
 * keyboard-Enter/programmatic-click gap. No extra prop needed on the consumer
 * side (previously `tabIndex={-1}` had to be set by hand alongside
 * `aria-disabled`).
 */
function PaginationLink({
  className,
  isActive = false,
  size = "icon",
  render,
  ref,
  "aria-disabled": ariaDisabled,
  onClick,
  tabIndex,
  ...props
}: PaginationLinkProps) {
  const isDisabled = ariaDisabled === true || ariaDisabled === "true";

  return useRender({
    render: render ?? <a />,
    defaultTagName: "a",
    ref, // forward the consumer ref onto the rendered (or composed) element
    props: {
      "aria-current": isActive ? "page" : undefined,
      "aria-disabled": ariaDisabled,
      "data-slot": "pagination-link",
      "data-active": isActive ? "" : undefined,
      "data-size": size ?? "icon",
      tabIndex: isDisabled ? -1 : tabIndex,
      onClick: isDisabled
        ? (event: React.MouseEvent<HTMLAnchorElement>) => {
            // Disabled: block navigation and never call the consumer's onClick.
            event.preventDefault();
          }
        : onClick,
      className: cn(paginationLinkVariants({ isActive, size }), className),
      ...props,
    },
  });
}

export type PaginationPreviousProps = PaginationLinkProps;

/**
 * `PaginationPrevious` — a labelled "previous page" control. A
 * `PaginationLink` with a leading `lucide-react` chevron and an accessible
 * `aria-label`.
 */
function PaginationPrevious({
  className,
  children,
  ...props
}: PaginationPreviousProps) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5", className)}
      {...props}
    >
      <ChevronLeft />
      {/* Below sm the text collapses to icon-only (sr-only keeps the name audible) so the bar
          fits narrow viewports; the aria-label above already names the control regardless. */}
      <span className="max-sm:sr-only">{children ?? "Previous"}</span>
    </PaginationLink>
  );
}

export type PaginationNextProps = PaginationLinkProps;

/**
 * `PaginationNext` — a labelled "next page" control. A `PaginationLink` with a
 * trailing `lucide-react` chevron and an accessible `aria-label`.
 */
function PaginationNext({
  className,
  children,
  ...props
}: PaginationNextProps) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5", className)}
      {...props}
    >
      <span className="max-sm:sr-only">{children ?? "Next"}</span>
      <ChevronRight />
    </PaginationLink>
  );
}

export type PaginationEllipsisProps = React.ComponentPropsWithRef<"span">;

/**
 * `PaginationEllipsis` — a collapsed-pages indicator (`…`) for long ranges.
 * Decorative only; expose skipped pages through real links or a labelled menu
 * trigger when they need to be reachable. Place inside a `PaginationItem`.
 */
function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps) {
  return (
    <span
      data-slot="pagination-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-(--size-md) items-center justify-center [&>svg]:size-(--icon-default)",
        className,
      )}
      {...props}
    >
      <MoreHorizontal />
    </span>
  );
}


export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
