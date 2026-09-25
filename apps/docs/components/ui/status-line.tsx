// @vegastack status-line@0.23.35 sha256-a2yycnpf8S63xCOwnWsPlpfpPgTFRXJzQ5aJHyVwrLI=

import * as React from "react";
import { CircleAlert, Info } from "lucide-react";
import { cn } from "@vegastack/design";

import { Spinner } from "@/components/ui/spinner";

/** The three states a `StatusLine` reports. */
export type StatusLineStatus = "info" | "progress" | "error";

/** Props accepted by `StatusLine`. */
export interface StatusLineProps extends Omit<
  React.ComponentProps<"div">,
  "role"
> {
  /**
   * `progress` shows a spinner ("Transcribing…"), `info` an info icon, and `error` an alert icon
   * with the text in the destructive ink. `error` is `role="alert"`; the others are
   * `role="status"`.
   * @default "info"
   */
  status?: StatusLineStatus;
  /**
   * Replaces the status icon.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * Inline actions after the text — a small `Button` such as Retry.
   * @default undefined
   */
  action?: React.ReactNode;
}

/**
 * `StatusLine` — a slim, inline status for one record: an icon, one line of text and an optional
 * action. No box, no border: it reads as part of the header it sits in. Use it for "Transcribing…
 * updates on its own", a failure with its reason and a Retry, or a quiet notice.
 *
 * @example
 * <StatusLine status="error" action={<Button size="xs" variant="outline" onClick={retry}>Retry</Button>}>
 *   Transcription failed: the recording is empty.
 * </StatusLine>
 */
export function StatusLine({
  status = "info",
  icon,
  action,
  className,
  children,
  ...props
}: StatusLineProps) {
  const glyph =
    icon ??
    (status === "progress" ? (
      <Spinner aria-hidden role={undefined} aria-label={undefined} />
    ) : status === "error" ? (
      <CircleAlert />
    ) : (
      <Info />
    ));
  return (
    <div
      data-slot="status-line"
      data-status={status}
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground data-[status=error]:text-destructive-text",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="inline-flex shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5"
      >
        {glyph}
      </span>
      <span className="min-w-0">{children}</span>
      {action ? (
        <span
          data-slot="status-line-action"
          className="inline-flex items-center gap-1.5"
        >
          {action}
        </span>
      ) : null}
    </div>
  );
}
