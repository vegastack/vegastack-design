// @vegastack settings-row@0.8.0 sha256-42RpB1A+uH3tJBfIY4tF66LHSDT96OlovrXvDAPypJU=

import * as React from "react";
import { cn } from "@vegastack/design";

/**
 * Heading levels `SettingsSection` will render its `title` as. A settings page nests
 * sections at different depths, and a heading level is a DOCUMENT-STRUCTURE fact the page
 * owns, not something the component can infer — a screen-reader user navigating by heading
 * gets a broken outline when every section hard-codes `<h3>`.
 */
export type SettingsSectionTitleTag = "h2" | "h3" | "h4" | "h5" | "h6";

/** Props accepted by `SettingsSection`. */
export interface SettingsSectionProps extends Omit<
  React.ComponentProps<"section">,
  "title"
> {
  /**
   * Section heading rendered above the grouped content.

   * @default undefined
   */
  title?: React.ReactNode;
  /**
   * Heading element the `title` renders as. Pick the level that continues the page's
   * outline — `h2` directly under the page `h1`, `h3` inside an `h2` group, and so on.
   * The visual size never changes (it is the `text-h4` role either way); only the
   * document structure does.
   *
   * `as` rather than Base UI `render` on purpose: `useRender` calls `React.useRef`
   * internally, which would force `'use client'` onto this file and cost the whole
   * settings family its server-safe status for a prop that only picks a tag name.
   *
   * @default 'h3'
   */
  titleAs?: SettingsSectionTitleTag;
  /**
   * Supporting description rendered under the title (muted).

   * @default undefined
   */
  description?: React.ReactNode;
}

/**
 * `SettingsSection` — a titled group of settings. Renders an optional `title`
 * and `description` above its `children` (typically a `SettingsCard`).
 *
 * Pure presentational and server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <SettingsSection titleAs="h2" title="Notifications" description="Choose what you hear about.">
 *   <SettingsCard>
 *     <SettingsRow label="Email" description="Product updates and tips.">
 *       <Switch defaultChecked />
 *     </SettingsRow>
 *   </SettingsCard>
 * </SettingsSection>
 */
export function SettingsSection({
  className,
  title,
  titleAs: TitleTag = "h3",
  description,
  children,
  ref,
  ...props
}: SettingsSectionProps) {
  return (
    <section
      ref={ref}
      data-slot="settings-section"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {(title != null || description != null) && (
        <div
          data-slot="settings-section-header"
          className="flex flex-col gap-1"
        >
          {title != null && (
            <TitleTag
              data-slot="settings-section-title"
              className="text-h4 text-foreground"
            >
              {title}
            </TitleTag>
          )}
          {description != null && (
            <p
              data-slot="settings-section-description"
              className="text-sm leading-normal text-muted-foreground"
            >
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/** Props accepted by `SettingsCard`. */
export type SettingsCardProps = React.ComponentProps<"div">;

/**
 * `SettingsCard` — a borders-only container that groups `SettingsRow`s. Each
 * child row draws its own `border-b`; the last row's border is hidden so the
 * card reads as a single bordered surface (no shadow, per the design system).
 *
 * Pure presentational and server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <SettingsCard>
 *   <SettingsRow label="Email notifications"><Switch /></SettingsRow>
 * </SettingsCard>
 */
export function SettingsCard({ className, ref, ...props }: SettingsCardProps) {
  return (
    <div
      ref={ref}
      data-slot="settings-card"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
        // Collapse the trailing row divider so only inter-row borders show.
        "[&>[data-slot=settings-row]:last-child]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `SettingsRow`. */
export interface SettingsRowProps extends React.ComponentProps<"div"> {
  /**
   * The row label rendered on the left (heading line of the row).
   */
  label: React.ReactNode;
  /**
   * Optional supporting description rendered under the label (muted).

   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * The control rendered on the right — a `Switch`, `Input`, `Button`, badge,
   * or read-only value.

   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * ID of the form control rendered in `children`. When provided, the visual
   * row label renders as a real `<label htmlFor={controlId}>`.

   * @default undefined
   */
  controlId?: string;
  /**
   * Props merged onto the generated label element when `controlId` is provided.

   * @default undefined
   */
  labelProps?: React.ComponentProps<"label">;
}

/**
 * `SettingsRow` — one setting: a `label` (plus optional `description`) on the
 * left and a control slot (`children`) on the right. Carries a bottom border so
 * stacked rows inside a `SettingsCard` read as a divided list.
 *
 * The row is its OWN named `@container` (`@container/settings-row`) — its
 * label/control layout stacks or goes horizontal based on the row's own measured
 * width, not the viewport. That means a row placed in a narrow card on a wide
 * screen still stacks (e.g. a settings panel in a split view or a dialog), while
 * the same row in a full-width page goes horizontal — something a `sm:` viewport
 * breakpoint can't express. Works standalone (no `SettingsCard` required): the
 * outer element establishes the container, the inner layout row queries it.
 *
 * Pure presentational and server-safe — no hooks, no `'use client'`.
 *
 * @example
 * <SettingsRow label="Workspace name" description="Shown across the product.">
 *   <Input defaultValue="Acme" />
 * </SettingsRow>
 */
export function SettingsRow({
  className,
  label,
  description,
  children,
  controlId,
  labelProps,
  ref,
  ...props
}: SettingsRowProps) {
  const LabelTag = controlId ? "label" : "span";
  return (
    <div
      ref={ref}
      data-slot="settings-row"
      className={cn(
        "@container/settings-row border-b border-border px-4 py-3",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 @sm/settings-row:flex-row @sm/settings-row:items-center @sm/settings-row:justify-between @sm/settings-row:gap-4">
        <div
          data-slot="settings-row-label"
          className="flex min-w-0 flex-1 flex-col gap-0.5"
        >
          <LabelTag
            {...(controlId ? { htmlFor: controlId } : {})}
            {...(controlId ? labelProps : undefined)}
            className={cn("text-label text-foreground", labelProps?.className)}
          >
            {label}
          </LabelTag>
          {description != null && (
            <span
              data-slot="settings-row-description"
              className="text-sm leading-normal text-muted-foreground"
            >
              {description}
            </span>
          )}
        </div>
        {children != null && (
          <div
            data-slot="settings-row-control"
            className="flex shrink-0 items-center gap-2 @sm/settings-row:justify-end"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
