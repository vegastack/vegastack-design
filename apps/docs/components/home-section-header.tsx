import type { ReactNode } from "react";
import { cn } from "@vegastack/design";

const TITLE_SIZE = {
  sm: "text-3xl",
  md: "text-4xl",
  lg: "text-5xl",
} as const;

/**
 * The docs home page's section lead-in: an optional mono eyebrow, a headline,
 * and optional supporting copy.
 *
 * This lives in the docs app, not the registry. It used to be the
 * `section-header` REGISTRY component, which the shadcn reset removed with the
 * rest of the marketing layer (Batch 7a; `extras.md` REMOVE). The home page is
 * the only surface that ever composed it, so the markup moved here rather than
 * being re-shipped as a component nothing else installs.
 */
export function HomeSectionHeader({
  eyebrow,
  title,
  description,
  size = "md",
  align = "start",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  size?: keyof typeof TITLE_SIZE;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      data-slot="home-section-header"
      data-align={align}
      className={cn(
        "flex flex-col gap-3",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="font-sans text-xs text-muted-foreground">{eyebrow}</p>
      ) : null}
      <h2
        data-slot="home-section-header-title"
        className={cn(
          TITLE_SIZE[size],
          "font-semibold text-balance text-foreground",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-2xl text-base text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
