import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * `<DoDont do="..." dont="..." />` — paired correct/incorrect guidance.
 * Uses fumadocs `--color-fd-*` so it themes with the docs.
 */
export function DoDont({
  do: doText,
  dont,
}: {
  do: ReactNode;
  dont: ReactNode;
}) {
  return (
    <div className="not-prose my-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-fd-border bg-fd-card p-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-success-text">
          <Check className="size-(--icon-default)" /> Do
        </div>
        <div className="text-sm text-fd-muted-foreground">{doText}</div>
      </div>
      <div className="rounded-lg border border-fd-border bg-fd-card p-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive-text">
          <X className="size-(--icon-default)" /> Don&apos;t
        </div>
        <div className="text-sm text-fd-muted-foreground">{dont}</div>
      </div>
    </div>
  );
}
