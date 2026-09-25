// @vegastack status-pages-01@0.23.27 sha256-bHKGcyA0ORCWmRAku4E+/6foTSyNJRKER2iyLKQ6WFs=

import { Lock } from "lucide-react";

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

/** Props for {@link ForbiddenPage}. */
export interface ForbiddenPageProps {
  /**
   * Fill the viewport (`min-h-svh`) for a page with no shell around it. Inside the app shell leave
   * it off: the page takes `min-h-[60svh]`.
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
 * The 403 page: an `Empty` whose title is the page's one `h1`, a decorative `Lock`, the one thing
 * the reader can do about it, and a way out.
 *
 * @example
 * // app/(app)/forbidden.tsx
 * export default function Forbidden() {
 *   return <ForbiddenPage />;
 * }
 */
export function ForbiddenPage({
  standalone = false,
  homeHref = "/",
}: ForbiddenPageProps) {
  return (
    <Empty className={cn(standalone ? "min-h-svh" : "min-h-[60svh]")}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock aria-hidden />
        </EmptyMedia>
        <EmptyTitle render={<h1 />}>
          You don’t have access to this page
        </EmptyTitle>
        <EmptyDescription>Ask your admin if you need it.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <a href={homeHref} className={buttonVariants()}>
          Go to Home
        </a>
      </EmptyContent>
    </Empty>
  );
}
