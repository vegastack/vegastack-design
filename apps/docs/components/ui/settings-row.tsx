// @vegastack settings-row@0.21.2 sha256-t3VkwxAiAPTCVxKiEGkiPE6aiOViMFhknn6HRqie3v8=

import * as React from "react";
import { cn } from "@vegastack/design";
import { Card } from "@/components/ui/card";

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
   * The visual size never changes (it is the `text-base font-medium` role either way); only the
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
              className="font-heading text-base font-medium text-foreground"
            >
              {title}
            </TitleTag>
          )}
          {description != null && (
            <p
              data-slot="settings-section-description"
              className="text-xs leading-normal text-muted-foreground"
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
export type SettingsCardProps = React.ComponentProps<typeof Card>;

/**
 * `SettingsCard` — the container that groups `SettingsRow`s into one surface.
 *
 * **It IS upstream's `Card`**, not a second card recipe: the radius, the `bg-card` ground and the
 * 1px `border border-border` hairline (BRD-1) all come from `card.tsx`, so a settings card and every
 * other card on the page are the same object. This file only removes the two things a
 * flush divided list cannot use — the card's own vertical padding and its inter-section gap
 * (`py-0 gap-0`) — so each `SettingsRow` sits edge to edge and its own `border-b` is the only
 * divider. The last row's border is collapsed, so the list ends on the card edge rather than on a
 * stray rule.
 *
 * Pure presentational and server-safe — no hooks, no `'use client'` (`Card` has none either).
 *
 * @example
 * <SettingsCard>
 *   <SettingsRow label="Email notifications"><Switch /></SettingsRow>
 * </SettingsCard>
 */
export function SettingsCard({ className, ref, ...props }: SettingsCardProps) {
  return (
    <Card
      ref={ref}
      data-slot="settings-card"
      className={cn(
        "gap-0 py-0",
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
            className={cn(
              "text-sm font-medium text-foreground",
              labelProps?.className,
            )}
          >
            {label}
          </LabelTag>
          {description != null && (
            <span
              data-slot="settings-row-description"
              className="text-xs leading-normal text-muted-foreground"
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
