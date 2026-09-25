// @vegastack page-header@0.23.26 sha256-DO9XZyRYxYts1e2tMsRfM7jG3pD7rXN/Paf94qWYwT4=

"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { ChevronLeft, Star } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button, buttonVariants } from "@/components/ui/button";
import { TruncatedText } from "@/components/ui/truncated-text";

/**
 * Controls the optional favorite-star toggle next to the title. Supports both
 * controlled (`active` + `onToggle`) and uncontrolled (`defaultActive`) use.
 */
export interface PageHeaderFavorite {
  /**
   * Controlled active (starred) state. When provided, the host owns the state
   * and must update it from `onToggle`. Omit to run uncontrolled.
   */
  active?: boolean;
  /**
   * Initial active state when uncontrolled (no `active` prop).
   * @default false
   */
  defaultActive?: boolean;
  /**
   * Called with the next active state whenever the star is toggled.
   */
  onToggle?: (active: boolean) => void;
  /**
   * Accessible name for the toggle. The current state is announced via
   * `aria-pressed`, so pass the action label only.
   * @default 'Favorite'
   */
  label?: string;
  /**
   * Disables the toggle and removes it from the tab order.
   * @default false
   */
  disabled?: boolean;
}

/** Props accepted by `PageHeader`. */
export interface PageHeaderProps extends Omit<
  React.ComponentPropsWithRef<"header">,
  "title"
> {
  /**
   * The page title — rendered as the `<h1>`. Accepts a string or rich nodes.
   * Truncated via `TruncatedText` when it overflows the title row, revealing
   * the full title on hover/focus (tap on touch) — see the component doc.
   */
  title: React.ReactNode;
  /**
   * Optional supporting copy rendered under the title (muted).

   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * Optional breadcrumb trail (or section name) rendered above the title row.
   * Pass a `Breadcrumb` element or any node — the header is presentational and
   * does not build the trail for you.

   * @default undefined
   */
  breadcrumb?: React.ReactNode;
  /**
   * Renders a back button (`ChevronLeft`) before the title as a link to this
   * href. Use for declarative navigation; prefer over `onBack` when you have a
   * URL. Ignored when `onBack` is also set.

   * @default undefined
   */
  backHref?: string;
  /**
   * Renders the back link through your framework's link element — pass an element such as
   * `<Link href="/products" />` (Next.js) and it receives the back affordance's classes,
   * `aria-label`, `data-slot` and chevron, so navigation stays client-side instead of a full
   * page load. `backHref` is the shorthand for `backRender={<a href={backHref} />}`. Ignored when
   * `onBack` is set; wins over `backHref`.

   * @default undefined
   */
  backRender?: React.ReactElement;
  /**
   * Renders a back button (`ChevronLeft`) before the title that calls this
   * handler. Use for app-local imperative behavior, such as closing a picker
   * or returning to the previous in-app state. Prefer `backHref` for URL-backed
   * navigation.

   * @default undefined
   */
  onBack?: () => void;
  /**
   * Accessible name for the back button.
   * @default 'Go back'
   */
  backLabel?: string;
  /**
   * How many lines the title may take before it clips with an ellipsis (the full title then
   * shows in a Tooltip). `"none"` lets a long title wrap freely, with no truncation at all —
   * for record pages whose name is the content.
   * @default 1
   */
  titleLines?: number | "none";
  /**
   * Metadata under the title — status badges, owners, dates, or inline pickers. Unlike
   * `description` (a `<p>`), this is a `<div>` row, so it can hold buttons, selects and other
   * interactive controls without invalid HTML. Muted, `text-sm`, wrapping.

   * @default undefined
   */
  meta?: React.ReactNode;
  /**
   * Right-aligned action slot — typically one or more `Button`s. Rendered on the
   * title row, opposite the title block.

   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * Optional overflow / secondary menu slot, rendered after `actions` on the
   * right. Compose your own menu trigger (e.g. a `DropdownMenu` with an
   * icon `Button` trigger) — kept as a slot so the header stays presentational.

   * @default undefined
   */
  secondaryMenu?: React.ReactNode;
  /**
   * Optional favorite-star toggle rendered after the title. Omit to hide it.

   * @default undefined
   */
  favorite?: PageHeaderFavorite;
}

/**
 * `FavoriteStar` — the star toggle rendered next to the title. Controlled when
 * `active` is supplied, otherwise tracks its own state seeded by `defaultActive`.

 *
 * @example
 * <FavoriteStar />
 */
function FavoriteStar({
  active,
  defaultActive = false,
  onToggle,
  label = "Favorite",
  disabled = false,
}: PageHeaderFavorite) {
  const isControlled = active !== undefined;
  const [internal, setInternal] = React.useState(defaultActive);
  const isActive = isControlled ? active : internal;

  function handleToggle() {
    const next = !isActive;
    if (!isControlled) setInternal(next);
    onToggle?.(next);
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleToggle}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isActive}
      data-slot="page-header-favorite"
      data-active={isActive ? "" : undefined}
      className="shrink-0 text-muted-foreground"
    >
      {/* Neutral ink, not warning yellow (D21). Doctrine rations the status hues to actual
          status; a favourite is a user's own mark, not a caution — Linear and Vercel both fill
          the star with the foreground ink, and the FILL alone already carries the on/off read. */}
      <Star className={cn(isActive && "fill-current text-foreground")} />
    </Button>
  );
}

/**
 * `PageHeader` — the standardized header at the top of a page: an optional back
 * button, breadcrumb trail, the title (plus optional description and favorite
 * star), and a right-aligned actions row with an optional secondary menu.
 *
 * **Presentational only** — navigation and favorite persistence are owned by the
 * host. Pass `backHref`/`onBack` for back navigation, a `breadcrumb` node for the
 * trail, `actions`/`secondaryMenu` nodes for the right side, and a `favorite`
 * config for the star toggle.
 *
 * Renders a `<header>` — a banner landmark when `PageHeader` sits at the top of
 * the page (not nested inside `<article>`/`<aside>`/`<main>`/`<nav>`/`<section>`).
 * The title routes through `TruncatedText`, so an overlong tenant/workspace name
 * clips with an ellipsis instead of overflowing, and reveals in full via a
 * tooltip on hover/focus (a tap-to-toggle disclosure on touch) — see
 * `TruncatedText`'s doc for the full behavior.
 *
 * @example
 * // Simple
 * <PageHeader title="Profile" />
 *
 * @example
 * // A framework back link, a wrapping title and a metadata row with a picker
 * <PageHeader
 *   backRender={<Link href="/products" />}
 *   backLabel="Back to products"
 *   title={product.name}
 *   titleLines="none"
 *   meta={<><StatusBadge status="active" /><Select>…</Select></>}
 * />
 *
 * @example
 * // With breadcrumb, back button, actions, and a favorite star
 * <PageHeader
 *   breadcrumb={<Breadcrumb>…</Breadcrumb>}
 *   backHref="/settings"
 *   title="API Keys"
 *   description="Manage keys for this workspace."
 *   favorite={{ defaultActive: true, onToggle: (next) => persist(next) }}
 *   actions={<Button>New key</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  backHref,
  backRender,
  onBack,
  backLabel = "Go back",
  titleLines = 1,
  meta,
  actions,
  secondaryMenu,
  favorite,
  className,
  children,
  ...props
}: PageHeaderProps) {
  const hasBack = Boolean(onBack || backRender || backHref);
  const hasRight = Boolean(actions || secondaryMenu);
  // The link form of the back affordance. It is NAVIGATION, so it stays a real link wearing the
  // button's classes — routing a link through `Button` would put `role="button"` on it.
  // `backRender` lets the host pass its framework link (client-side navigation); `backHref` is
  // the plain-anchor shorthand. `buttonVariants({ size: "icon-sm" })` is the same square the
  // button form renders, so every back affordance is pixel-identical.
  const backLink = useRender({
    render: backRender ?? <a href={backHref} />,
    props: {
      "aria-label": backLabel,
      "data-slot": "page-header-back",
      className: cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "-ms-2 shrink-0",
      ),
      children: <ChevronLeft aria-hidden />,
    },
  });

  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {breadcrumb ? (
        <div data-slot="page-header-breadcrumb">{breadcrumb}</div>
      ) : null}

      {/* flex-wrap + the title block's basis-48 let the actions row wrap BELOW the title once
          the row can't give the h1 a readable minimum (~basis-48) — without it, the shrink-0
          actions crushed the title to a few characters at narrow widths. On its own wrapped
          line the actions row keeps the header's end alignment via ms-auto. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        {/* Title block */}
        <div className="flex min-w-0 grow basis-48 flex-col gap-1">
          <div className="flex items-center gap-1">
            {hasBack && onBack ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={backLabel}
                data-slot="page-header-back"
                // Logical, not physical: `-ml-2` pulled the back affordance the WRONG way in RTL
                // (B6-05). The anchor form beside it already used `-ms-2`.
                className="-ms-2 shrink-0"
                onClick={onBack}
              >
                <ChevronLeft />
              </Button>
            ) : null}
            {hasBack && !onBack ? backLink : null}
            {/* min-w-0 lets the h1 shrink below its content width inside the flex row above —
                without it, the flex item's default `min-width: auto` would stop TruncatedText's
                inner span from ever measuring an overflow. TruncatedText owns the actual
                truncate/line-clamp class; the h1 stays the accessible heading. */}
            <h1
              data-slot="page-header-title"
              data-title-lines={titleLines}
              className={cn(
                "min-w-0 font-heading text-2xl font-semibold text-foreground",
                // A wrapping title still never pushes the page sideways: an unbroken token breaks.
                titleLines === "none" && "wrap-break-word",
              )}
            >
              {titleLines === "none" ? (
                title
              ) : (
                <TruncatedText lines={titleLines}>{title}</TruncatedText>
              )}
            </h1>
            {favorite ? <FavoriteStar {...favorite} /> : null}
          </div>
          {description ? (
            <p
              data-slot="page-header-description"
              className="text-sm text-muted-foreground"
            >
              {description}
            </p>
          ) : null}
          {meta ? (
            <div
              data-slot="page-header-meta"
              className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
            >
              {meta}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {hasRight ? (
          <div
            data-slot="page-header-actions"
            className="ms-auto flex shrink-0 items-center gap-2"
          >
            {actions}
            {secondaryMenu}
          </div>
        ) : null}
      </div>

      {children}
    </header>
  );
}

/** Props accepted by `SectionHeading`. */
export interface SectionHeadingProps extends React.ComponentPropsWithRef<"h2"> {
  /**
   * `md` titles a page section (16px, medium); `sm` titles a card or panel section (14px,
   * medium).
   * @default "md"
   */
  size?: "sm" | "md";
  /**
   * `eyebrow` is the quiet label above a group — 12px, muted, medium — instead of a title.
   * @default "default"
   */
  variant?: "default" | "eyebrow";
  /**
   * Content at the end of the row — a "View all" link, a small action.
   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * The heading element, for the document outline.
   * @default "h2"
   */
  as?: "h2" | "h3" | "h4";
}

/**
 * `SectionHeading` — the title of an in-page section, below the `PageHeader`: `md` for a page
 * section, `sm` inside a card, and the muted `eyebrow` for a quiet group label. Optional trailing
 * `actions` sit on the same row.
 *
 * @example
 * <SectionHeading actions={<Button variant="ghost" size="sm">View all</Button>}>Recent activity</SectionHeading>
 * @example
 * <SectionHeading variant="eyebrow" as="h3">Pinned</SectionHeading>
 */
export function SectionHeading({
  size = "md",
  variant = "default",
  actions,
  as: Heading = "h2",
  className,
  children,
  ...props
}: SectionHeadingProps) {
  const heading = (
    <Heading
      data-slot="section-heading"
      data-size={size}
      data-variant={variant}
      className={cn(
        "min-w-0 truncate",
        variant === "eyebrow"
          ? "text-xs font-medium text-muted-foreground"
          : size === "sm"
            ? "text-sm font-medium text-foreground"
            : "text-base font-medium text-foreground",
        actions == null && className,
      )}
      {...(actions == null ? props : {})}
    >
      {children}
    </Heading>
  );
  if (actions == null) return heading;
  return (
    <div
      data-slot="section-heading-row"
      className={cn(
        "flex min-w-0 items-center justify-between gap-2",
        className,
      )}
    >
      {heading}
      <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
    </div>
  );
}

export { FavoriteStar };
