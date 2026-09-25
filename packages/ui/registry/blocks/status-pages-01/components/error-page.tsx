// @vegastack status-pages-01@0.23.18 sha256-bPOtAXCCGpzJNBUw8KNiOdvbcfGTnSV5Ni45eI07u44=

"use client";

import { TriangleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@vegastack/design";

/** Props for {@link ErrorPage}. */
export interface ErrorPageProps {
  /**
   * The error's reference, e.g. Next.js's `error.digest`. It is shown with a copy button so the
   * reader can send it to their admin; without one the footnote is left out.
   * @default undefined
   */
  digest?: string;
  /** Called by "Try again", e.g. Next.js's `reset`. */
  onRetry: () => void;
  /**
   * Fill the viewport (`min-h-svh`) for a page with no shell around it, e.g. `global-error.tsx`.
   * Inside the app shell leave it off: the page takes `min-h-[60svh]`.
   * @default false
   */
  standalone?: boolean;
  /**
   * Where "Go to Home" goes.
   * @default "/"
   */
  homeHref?: string;
}

/**
 * The error page: an `Empty` whose title is the page's one `h1` and says what failed (never a bare
 * "Something went wrong"), a `TriangleAlert` in the destructive ink, "Try again" and a way out,
 * and — when there is one — the error's reference with a copy button.
 *
 * @example
 * // app/(app)/error.tsx
 * "use client";
 * export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
 *   return <ErrorPage digest={error.digest} onRetry={reset} />;
 * }
 */
export function ErrorPage({
  digest,
  onRetry,
  standalone = false,
  homeHref = "/",
}: ErrorPageProps) {
  return (
    <Empty className={cn(standalone ? "min-h-svh" : "min-h-[60svh]")}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlert aria-hidden className="text-destructive-text" />
        </EmptyMedia>
        <EmptyTitle render={<h1 />}>This page didn’t load</EmptyTitle>
        <EmptyDescription>
          {digest
            ? "Try again. If it keeps happening, send your admin the reference below."
            : "Try again. If it keeps happening, tell your admin what you were doing."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onRetry}>Try again</Button>
          <a href={homeHref} className={buttonVariants({ variant: "outline" })}>
            Go to Home
          </a>
        </div>
        {digest ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Reference: <span className="font-mono">{digest}</span>
            <CopyButton
              value={digest}
              variant="ghost"
              copyLabel="Copy reference"
              copiedLabel="Reference copied"
            />
          </p>
        ) : null}
      </EmptyContent>
    </Empty>
  );
}
