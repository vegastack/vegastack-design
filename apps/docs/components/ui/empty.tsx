// @vegastack empty@0.23.33 sha256-dwAoYkj2MOIL+Dxk/HfpJ3D0We8NYqLWnGGUChR8+Jo=

"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { Inbox } from "lucide-react";
import { cn } from "@vegastack/design";

function Empty({
  className,
  icon,
  size = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode;
  size?: "default" | "sm";
}) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border-dashed p-6 text-center text-balance",
        // An empty state always shows an icon: the default one stands down when the
        // composition brings its own `EmptyMedia`.
        "has-[[data-slot=empty-icon]:not([data-default])]:[&>[data-default]]:hidden",
        // The compact size for a small inline empty — "No tasks yet" inside a card.
        "data-[size=sm]:gap-2 data-[size=sm]:p-4 data-[size=sm]:[&_[data-slot=empty-icon]]:mb-0 data-[size=sm]:[&_[data-slot=empty-icon][data-variant=icon]]:size-8 data-[size=sm]:[&_[data-slot=empty-icon][data-variant=icon]_svg]:size-4",
        className,
      )}
      {...props}
    >
      <EmptyMedia variant="icon" data-default="" className="mb-0">
        {icon ?? <Inbox aria-hidden />}
      </EmptyMedia>
      {children}
    </div>
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        // A 40px tile with a 20px icon; the tile sizes ANY icon passed in, so a consumer's own
        // `size-*` on the svg cannot shrink it (the compact `sm` Empty takes 32px / 16px).
        icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn("font-heading text-sm font-medium", className),
      },
      props,
    ),
    render,
    state: {
      slot: "empty-title",
    },
  });
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-sm text-balance",
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};
