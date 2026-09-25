// @vegastack status-pages-01@0.23.8 sha256-+IVYFw5WZIyZlrXdsir3TCu1awSGMZ0xKsRp9XXTsWc=

import { SearchX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@vegastack/design";

/** Props for {@link NotFoundPage}. */
export interface NotFoundPageProps {
  /**
   * Fill the viewport (`min-h-svh`) for a page with no shell around it, e.g. a root
   * `not-found.tsx`. Inside the app shell leave it off: the page takes `min-h-[60svh]`.
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
 * The 404 page: an `Empty` whose title is the page's one `h1`, a decorative `SearchX`, and one way
 * out. The copy does not say whether the page exists, because a page the reader can't access
 * answers 404 too.
 *
 * @example
 * // app/not-found.tsx
 * export default function NotFound() {
 *   return <NotFoundPage standalone />;
 * }
 */
export function NotFoundPage({
  standalone = false,
  homeHref = "/",
}: NotFoundPageProps) {
  return (
    <Empty className={cn(standalone ? "min-h-svh" : "min-h-[60svh]")}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX aria-hidden />
        </EmptyMedia>
        <EmptyTitle render={<h1 />}>Page not found</EmptyTitle>
        <EmptyDescription>
          This page doesn’t exist, or you don’t have access to it.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <a href={homeHref} className={buttonVariants()}>
          Go to Home
        </a>
      </EmptyContent>
    </Empty>
  );
}
