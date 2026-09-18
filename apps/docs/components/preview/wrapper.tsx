import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Wrapper({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        // The scope for hero demos used directly in MDX, outside ComponentPreview. It carried a
        // `vs-type-product` class until the shadcn reset collapsed the two type ladders into one
        // (TYP-1 = shadcn), so there is no longer a scale to re-enter.
        "not-prose flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-lg border border-border bg-card p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
