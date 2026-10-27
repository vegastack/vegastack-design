// @vegastack skeleton@0.25.95 sha256-jmKCm3++Y66vhfJvFCyN8aWsgh5VK2VVFAnlakoGcTU=

import { cn } from "@vegastack/design";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** Line widths for `SkeletonText`'s `text` variant, cycled: a paragraph never reads as a block. */
const TEXT_WIDTHS = ["w-48", "w-full", "w-3/4"];

/**
 * `SkeletonText` — placeholder lines while text loads: `text`, 16px bars of varied widths 12px
 * apart (a few lines of a panel); `rows`, full-width 20px bars 8px apart (a list's rows). Hidden
 * from assistive technology; name the loading region around it.
 *
 * @example
 * <SkeletonText lines={3} />
 */
function SkeletonText({
  lines = 3,
  variant = "text",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** How many lines. @default 3 */
  lines?: number;
  /** `text` lines of varied width, or full-width `rows`. @default "text" */
  variant?: "text" | "rows";
}) {
  return (
    <div
      aria-hidden
      data-slot="skeleton-text"
      data-variant={variant}
      className={cn(
        "flex flex-col",
        variant === "text" ? "gap-3" : "gap-2",
        className,
      )}
      {...props}
    >
      {Array.from({ length: Math.max(0, lines) }, (_, index) => (
        <Skeleton
          key={index}
          className={
            variant === "text"
              ? cn("h-4", TEXT_WIDTHS[index % TEXT_WIDTHS.length])
              : "h-5 w-full"
          }
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText };
