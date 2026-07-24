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
        // `vs-type-product`: demos render on the product type ladder (T1/CX-6 boundary) —
        // this wrapper is the scope for hero demos used directly in MDX, outside ComponentPreview.
        "vs-type-product not-prose flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-lg border border-fd-border bg-fd-card p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
