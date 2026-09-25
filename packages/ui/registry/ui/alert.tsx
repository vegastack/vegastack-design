// @vegastack alert@0.23.12 sha256-QbXD8Ttp2wopkBUJ9WRrb3bzuvFc/Q8CKwMn6sV7zro=

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

const alertVariants = cva(
  "group/alert @container/alert relative outline-none grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-start text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 @md/alert:has-data-[slot=alert-action]:grid-cols-[1fr_auto] @md/alert:has-data-[slot=alert-action]:gap-x-3 @md/alert:has-[>svg]:has-data-[slot=alert-action]:grid-cols-[auto_1fr_auto] *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive-text *:data-[slot=alert-description]:text-destructive-text/90 *:[svg]:text-current [&_[data-slot=button]:not([data-variant=default]):hover]:bg-destructive/10 [&_[data-slot=button]:not([data-variant=default]):hover]:text-destructive-text [&_[data-slot=button]:not([data-variant=default]):hover]:**:[svg]:text-destructive-text [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:bg-destructive/10 [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:text-destructive-text",
        success:
          "bg-card text-success-text *:data-[slot=alert-description]:text-success-text/90 *:[svg]:text-current [&_[data-slot=button]:not([data-variant=default]):hover]:bg-success/10 [&_[data-slot=button]:not([data-variant=default]):hover]:text-success-text [&_[data-slot=button]:not([data-variant=default]):hover]:**:[svg]:text-success-text [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:bg-success/10 [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:text-success-text",
        warning:
          "bg-card text-warning-text *:data-[slot=alert-description]:text-warning-text/90 *:[svg]:text-current [&_[data-slot=button]:not([data-variant=default]):hover]:bg-warning/10 [&_[data-slot=button]:not([data-variant=default]):hover]:text-warning-text [&_[data-slot=button]:not([data-variant=default]):hover]:**:[svg]:text-warning-text [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:bg-warning/10 [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:text-warning-text",
        info: "bg-card text-info-text *:data-[slot=alert-description]:text-info-text/90 *:[svg]:text-current [&_[data-slot=button]:not([data-variant=default]):hover]:bg-info/10 [&_[data-slot=button]:not([data-variant=default]):hover]:text-info-text [&_[data-slot=button]:not([data-variant=default]):hover]:**:[svg]:text-info-text [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:bg-info/10 [&_[data-slot=button]:not([data-variant=default])[aria-expanded=true]]:text-info-text",
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
        "col-start-1 mt-1.5 group-has-[>svg]/alert:col-start-2 @md/alert:col-start-2 @md/alert:row-span-2 @md/alert:row-start-1 @md/alert:mt-0 @md/alert:self-start @md/alert:group-has-[>svg]/alert:col-start-3",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
