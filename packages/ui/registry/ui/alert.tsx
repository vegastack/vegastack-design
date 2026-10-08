// @vegastack alert@0.25.0 sha256-l/r13e9xAPgRpMtgxb8Vl4oGyheNIpsyDM4YgiMLJtU=

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

const alertVariants = cva(
  "group/alert @container/alert relative outline-none grid w-full gap-0.5 rounded-lg border px-3 py-2.5 text-start text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 @md/alert:has-data-[slot=alert-action]:grid-cols-[1fr_auto] @md/alert:has-data-[slot=alert-action]:gap-x-3 @md/alert:has-[>svg]:has-data-[slot=alert-action]:grid-cols-[auto_1fr_auto] *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current @md/alert:has-data-[slot=alert-action]:not-has-data-[slot=alert-title]:*:data-[slot=alert-description]:min-h-8 @md/alert:has-data-[slot=alert-action]:not-has-data-[slot=alert-title]:*:data-[slot=alert-description]:content-center @md/alert:has-data-[slot=alert-action]:not-has-data-[slot=alert-title]:*:[svg]:translate-y-2 *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "border-destructive/30 bg-destructive/5 dark:bg-destructive/10 text-destructive-text [&_[data-slot=button][data-variant=outline]]:border-destructive/40 [&_[data-slot=button][data-variant=outline]]:text-destructive-text *:data-[slot=alert-description]:text-destructive-text/90 *:[svg]:text-current [&_[data-slot=button]:not([data-variant=default]):hover]:bg-destructive/10 [&_[data-slot=button]:not([data-variant=default]):hover]:text-destructive-text [&_[data-slot=button]:not([data-variant=default]):hover]:**:[svg]:text-destructive-text [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:bg-destructive/10 [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:text-destructive-text",
        success:
          "border-success/30 bg-success/5 dark:bg-success/10 text-success-text [&_[data-slot=button][data-variant=outline]]:border-success/40 [&_[data-slot=button][data-variant=outline]]:text-success-text *:data-[slot=alert-description]:text-success-text/90 *:[svg]:text-current [&_[data-slot=button]:not([data-variant=default]):hover]:bg-success/10 [&_[data-slot=button]:not([data-variant=default]):hover]:text-success-text [&_[data-slot=button]:not([data-variant=default]):hover]:**:[svg]:text-success-text [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:bg-success/10 [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:text-success-text",
        warning:
          "border-warning/30 bg-warning/5 dark:bg-warning/10 text-warning-text [&_[data-slot=button][data-variant=outline]]:border-warning/40 [&_[data-slot=button][data-variant=outline]]:text-warning-text *:data-[slot=alert-description]:text-warning-text/90 *:[svg]:text-current [&_[data-slot=button]:not([data-variant=default]):hover]:bg-warning/10 [&_[data-slot=button]:not([data-variant=default]):hover]:text-warning-text [&_[data-slot=button]:not([data-variant=default]):hover]:**:[svg]:text-warning-text [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:bg-warning/10 [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:text-warning-text",
        info: "border-info/30 bg-info/5 dark:bg-info/10 text-info-text [&_[data-slot=button][data-variant=outline]]:border-info/40 [&_[data-slot=button][data-variant=outline]]:text-info-text *:data-[slot=alert-description]:text-info-text/90 *:[svg]:text-current [&_[data-slot=button]:not([data-variant=default]):hover]:bg-info/10 [&_[data-slot=button]:not([data-variant=default]):hover]:text-info-text [&_[data-slot=button]:not([data-variant=default]):hover]:**:[svg]:text-info-text [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:bg-info/10 [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:text-info-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  live = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    live?: boolean;
  }) {
  return (
    <div
      data-slot="alert"
      role={
        live && (variant === "destructive" || variant === "warning")
          ? "alert"
          : "status"
      }
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-1 font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-1 text-sm text-balance text-muted-foreground group-has-[>svg]/alert:col-start-2 md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "col-start-1 mt-1.5 flex flex-wrap items-center gap-2 group-has-[>svg]/alert:col-start-2 @md/alert:col-start-2 @md/alert:row-span-2 @md/alert:row-start-1 @md/alert:mt-0 @md/alert:self-start @md/alert:group-has-[>svg]/alert:col-start-3",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
