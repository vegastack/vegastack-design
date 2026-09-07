import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * `<DoDont do="..." dont="..." />` — paired correct/incorrect guidance on the system's own
 * surface tokens (`card` + the one `border`); the markdown export renders the same pair as
 * `**Do** — … / **Don't** — …`.
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
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-success-text">
          <Check className="size-(--icon-default)" aria-hidden /> Do
        </div>
        <div className="text-sm text-muted-foreground">{doText}</div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive-text">
          <X className="size-(--icon-default)" aria-hidden /> Don&apos;t
        </div>
        <div className="text-sm text-muted-foreground">{dont}</div>
      </div>
    </div>
  );
}
