// @vegastack coverage-banner@0.143.1 sha256-zKYufO9cvhByYOPx7QJ6bd+JWKb4ONFmJ3iE2X9b6UQ=

import * as React from "react";
import { cn } from "@vegastack/design";
import { TriangleAlert } from "lucide-react";

import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TruncatedText } from "@/components/ui/truncated-text";

/* ------------------------------------------------------------------------------------------------
 * CoverageBanner — someone is covering: "Rohan covers expense approvals until 30 Nov". As a banner
 * it is a quiet strip on a page with the delegate's avatar, the words and one action ("Change",
 * "End"); a warning tone marks an urgent covered step. Inline, it is one muted line under a name,
 * in a people picker or an approval step, cut with its full text on hover.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `CoverageBanner`. */
export interface CoverageBannerProps {
  /** The delegate who covers. */
  person: { name: string; avatar: React.ReactNode };
  /** The words, from the caller: "Rohan covers expense approvals until 30 Nov". */
  text: string;
  /** `banner` — a strip on a page. `inline` — one muted line under a name. @default "banner" */
  variant?: "banner" | "inline";
  /** `warning` when the covered step is urgent. @default "info" */
  tone?: "info" | "warning";
  /** One action, banner only: "Change", "End". @default undefined */
  action?: { label: string; onClick: () => void };
  /** Classes for the root. @default undefined */
  className?: string;
}

/**
 * `CoverageBanner` — who covers for whom, as a banner on a page or one line under a name.
 *
 * @example
 * <CoverageBanner
 *   person={{ name: "Rohan", avatar: <PersonAvatar person={rohan} size="xs" /> }}
 *   text="Rohan covers expense approvals until 30 Nov"
 *   action={{ label: "Change", onClick: edit }}
 * />
 */
export function CoverageBanner({
  person,
  text,
  variant = "banner",
  tone = "info",
  action,
  className,
}: CoverageBannerProps) {
  if (variant === "inline")
    return (
      <span
        data-slot="coverage-banner"
        data-variant="inline"
        data-tone={tone}
        className={cn(
          "flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground",
          className,
        )}
      >
        <span aria-hidden className="inline-flex shrink-0">
          {person.avatar}
        </span>
        <TruncatedText className="min-w-0 flex-1">{text}</TruncatedText>
      </span>
    );
  return (
    // Neutral in both tones: an urgent step shows the warning glyph, never a tinted strip (COL-25).
    <Alert
      variant="default"
      data-slot="coverage-banner"
      data-variant="banner"
      data-tone={tone}
      // One row that wraps: the words take the room, the action keeps the strip's end.
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
    >
      <AlertDescription className="flex min-w-0 flex-1 basis-60 items-center gap-2 text-sm text-current">
        <span aria-hidden className="inline-flex shrink-0">
          {person.avatar}
        </span>
        <span className="min-w-0 wrap-anywhere">{text}</span>
        {tone === "warning" ? (
          <TriangleAlert
            role="img"
            aria-label="Urgent"
            className="size-4 shrink-0 text-warning-text"
          />
        ) : null}
      </AlertDescription>
      {action ? (
        <AlertAction className="ms-auto mt-0">
          <Button size="sm" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
