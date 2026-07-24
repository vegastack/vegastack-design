// @vegastack alert@0.2.0 sha256-lFfVijWsG2NZJFDDFNww41aPPzFZavqVoFLh2bKTpsQ=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertTriangle,
  CircleCheck,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@vegastack/design";

/**
 * Alert variants — `default` (neutral) plus four semantic statuses. Per the
 * v2 spec each status uses its `{family}` subtle
 * tint (`bg-X-subtle text-X-text border-X/20`), radius `md`, and is always paired
 * with a leading icon. Every value is a semantic token, never a hardcoded color.
 */
export const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-md border p-4 text-base [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
  {
    variants: {
      /**
       * Layout. `default` is the block alert; `strip` (Wave 2 — the settings
       * info-banner) is a compact single-line ribbon: centered icon + copy,
       * tighter padding, inline-sized icon.
       */
      variant: {
        default: "",
        strip:
          "items-center gap-2 px-3 py-2 [&_svg:not([class*='size-'])]:size-(--icon-inline)",
      },
      intent: {
        default: "border-border bg-card text-card-foreground",
        info: "border-info/(--alpha-border-subtle) bg-info-subtle text-info-text",
        success:
          "border-success/(--alpha-border-subtle) bg-success-subtle text-success-text",
        warning:
          "border-warning/(--alpha-border-subtle) bg-warning-subtle text-warning-text",
        destructive:
          "border-destructive/(--alpha-border-subtle) bg-destructive-subtle text-destructive-text",
      },
    },
    defaultVariants: { variant: "default", intent: "default" },
  },
);

/** The status intents Alert supports. */
export type AlertIntent = NonNullable<
  VariantProps<typeof alertVariants>["intent"]
>;

/** Default leading icon per status intent (overridable via `icon` / `hideIcon`). */
const VARIANT_ICON: Record<AlertIntent, LucideIcon> = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: AlertTriangle,
  destructive: XCircle,
};

/** Props accepted by `Alert`. */
export interface AlertProps
  extends
    React.ComponentPropsWithRef<"div">,
    VariantProps<typeof alertVariants> {
  /**
   * Layout — `default` block alert, or `strip`: the compact single-line info
   * ribbon (settings banners, inline notices).
   * @default "default"
   */
  variant?: "default" | "strip";
  /**
   * Status intent — drives the color tokens and the default leading icon.
   * @default "default"
   */
  intent?: AlertIntent;
  /**
   * Custom leading icon. Falls back to the intent's default icon.
   * Pass a `lucide-react` icon element (e.g. `<Bell />`).

   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * Hide the leading icon entirely (overrides `icon`).
   * @default false
   */
  hideIcon?: boolean;
  /**
   * Render a dismiss (close) button in the top-right corner.
   * @default false
   */
  dismissable?: boolean;
  /**
   * Called when the dismiss button is clicked. When `dismissable` is set and no
   * handler is provided, the alert removes itself from the DOM internally.

   * @default undefined
   */
  onDismiss?: () => void;
  /**
   * Accessible label for the dismiss button.
   * @default "Dismiss"
   */
  dismissLabel?: string;
}

/**
 * `Alert` — a presentational status banner with `role="alert"`. Compose with
 * `AlertTitle`, `AlertDescription`, and `AlertActions`. Supports five status
 * variants, an optional leading icon, and an optional self-managing dismiss
 * button. Client-only because the dismiss button can manage local visibility.
 *
 * @example
 * <Alert intent="success">
 *   <AlertTitle>Saved</AlertTitle>
 *   <AlertDescription>Your changes have been saved.</AlertDescription>
 * </Alert>
 *
 * @example
 * <Alert intent="warning" dismissable onDismiss={() => setOpen(false)}>
 *   <AlertTitle>Subscription expiring</AlertTitle>
 *   <AlertDescription>Renew within 3 days to avoid interruption.</AlertDescription>
 *   <AlertActions>
 *     <Button variant="warning-outline" size="sm">Renew now</Button>
 *   </AlertActions>
 * </Alert>
 */
function Alert({
  className,
  variant = "default",
  intent = "default",
  icon,
  hideIcon = false,
  dismissable = false,
  onDismiss,
  dismissLabel = "Dismiss",
  children,
  ...props
}: AlertProps) {
  const [open, setOpen] = React.useState(true);

  const handleDismiss = React.useCallback(() => {
    if (onDismiss) onDismiss();
    else setOpen(false);
  }, [onDismiss]);

  if (!open) return null;

  const DefaultIcon = VARIANT_ICON[intent];
  const leadingIcon = hideIcon ? null : (icon ?? <DefaultIcon aria-hidden />);

  return (
    <div
      role="alert"
      data-slot="alert"
      data-variant={variant}
      data-intent={intent}
      className={cn(
        alertVariants({ variant, intent }),
        dismissable && "pr-10",
        className,
      )}
      {...props}
    >
      {leadingIcon ? (
        <span
          data-slot="alert-icon"
          className={cn("shrink-0", variant === "strip" ? undefined : "mt-0.5")}
        >
          {leadingIcon}
        </span>
      ) : null}
      <div
        data-slot="alert-content"
        className="flex min-w-0 flex-1 flex-col gap-1"
      >
        {children}
      </div>
      {dismissable ? (
        <button
          type="button"
          data-slot="alert-dismiss"
          onClick={handleDismiss}
          aria-label={dismissLabel}
          className="absolute top-3 right-3 inline-flex shrink-0 rounded-md p-1 text-current opacity-(--opacity-hint) transition-opacity duration-fast ease-standard hover:opacity-100"
        >
          <X />
        </button>
      ) : null}
    </div>
  );
}

/** Props accepted by `AlertTitle`. */
export type AlertTitleProps = React.ComponentPropsWithRef<"div">;

/** `AlertTitle` — the emphasized leading line of an alert.
 *
 * @example
 * <AlertTitle />
 */
function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium leading-tight", className)}
      {...props}
    />
  );
}

/** Props accepted by `AlertDescription`. */
export type AlertDescriptionProps = React.ComponentPropsWithRef<"div">;

/** `AlertDescription` — the supporting body text under the title.
 *
 * @example
 * <AlertDescription />
 */
function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-base leading-relaxed [&_p:not(:last-child)]:mb-2",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `AlertActions`. */
export type AlertActionsProps = React.ComponentPropsWithRef<"div">;

/** `AlertActions` — a row of action controls below the description.
 *
 * @example
 * <AlertActions />
 */
function AlertActions({ className, ...props }: AlertActionsProps) {
  return (
    <div
      data-slot="alert-actions"
      className={cn("mt-2 flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertActions };
