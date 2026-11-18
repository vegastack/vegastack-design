import type { HTMLAttributes, ReactNode } from "react";
import { Check, X } from "lucide-react";
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
        "not-prose flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-card border border-border bg-card p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A labelled half of a right-and-wrong pair: the system's own check and cross, never colour alone. */
export function Verdict({
  good,
  label,
  children,
}: {
  good: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-3 rounded-block border border-border p-4">
      <figcaption
        className={
          good
            ? "flex items-center gap-1.5 text-sm font-medium text-success-text"
            : "flex items-center gap-1.5 text-sm font-medium text-destructive-text"
        }
      >
        {good ? (
          <Check aria-hidden className="size-4" />
        ) : (
          <X aria-hidden className="size-4" />
        )}
        {good ? "Do" : "Don't"} — {label}
      </figcaption>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </figure>
  );
}
