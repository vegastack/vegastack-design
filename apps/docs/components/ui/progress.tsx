// @vegastack progress@0.81.0 sha256-JJiFCaf8iK7Bk5oQOBF4OQcdZcHsjxiK6a+pWq9MulI=

"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

const progressIndicatorVariants = cva("h-full transition-all", {
  variants: {
    tone: {
      default: "bg-primary",
      // API-42: a meter that is fine says so too (a limit well within reach).
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-destructive",
    },
  },
  defaultVariants: { tone: "default" },
});

type ProgressTone = NonNullable<
  VariantProps<typeof progressIndicatorVariants>["tone"]
>;

function Progress({
  className,
  children,
  value,
  tone = "default",
  size = "default",
  ...props
}: ProgressPrimitive.Root.Props & {
  tone?: ProgressTone;
  /** API-42: `lg` is the thicker meter a page's headline limit wears. */
  size?: ProgressSize;
}) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      data-tone={tone}
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack size={size}>
        <ProgressIndicator tone={tone} />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

type ProgressSize = "default" | "lg";

function ProgressTrack({
  className,
  size = "default",
  ...props
}: ProgressPrimitive.Track.Props & { size?: ProgressSize }) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted data-[size=lg]:h-2",
        className,
      )}
      data-slot="progress-track"
      data-size={size}
      {...props}
    />
  );
}

function ProgressIndicator({
  className,
  tone = "default",
  ...props
}: ProgressPrimitive.Indicator.Props & { tone?: ProgressTone }) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      data-tone={tone}
      className={cn(progressIndicatorVariants({ tone }), className)}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ms-auto text-sm text-muted-foreground tabular-nums",
        className,
      )}
      data-slot="progress-value"
      {...props}
    />
  );
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
};
