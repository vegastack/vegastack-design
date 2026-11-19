// @vegastack request-status-chip@0.122.0 sha256-jMp4uuBkx7xuatKN4MOoeKNJaF224Z6HFZJ9ZofjCyA=

import * as React from "react";
import { cn } from "@vegastack/design";

import { Badge, type BadgeVariant } from "@/components/ui/badge";

/* ------------------------------------------------------------------------------------------------
 * RequestStatusChip — where a request stands, as one chip. Its tone always follows the lifecycle
 * `state`; its words are the state's own, or the table's renamed Status label, or the name of a
 * stage inside In progress ("Awaiting receipt"). The chip shows the status only: the request's ID
 * sits beside it in the caller's row.
 * ----------------------------------------------------------------------------------------------*/

/**
 * A request's lifecycle state: exactly P3.1's `REQUEST_STATES`; P3.1's two-way type check keeps
 * the lists equal.
 */
export type RequestState =
  | "draft"
  | "open"
  | "in_progress"
  | "awaiting_approval"
  | "approved"
  | "declined"
  | "completed"
  | "cancelled";

/** Props accepted by `RequestStatusChip`. */
export interface RequestStatusChipProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The lifecycle state; it decides the tone. */
  state: RequestState;
  /** Words in place of the state's own: a renamed Status label, or a stage name. @default the state's name */
  label?: string;
  /** `sm` for a dense table row. @default "default" */
  size?: "sm" | "default";
}

/** The default words for each state. */
export const REQUEST_STATE_LABEL: Record<RequestState, string> = {
  draft: "Draft",
  open: "Open",
  in_progress: "In progress",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Each state's tone: a status family's ink on its tint (A11Y-13), or a neutral chip. */
const TONE: Record<RequestState, BadgeVariant> = {
  draft: "outline",
  open: "secondary",
  in_progress: "info",
  awaiting_approval: "warning",
  approved: "success",
  declined: "destructive",
  completed: "success",
  cancelled: "outline",
};

/**
 * `RequestStatusChip` — a request's status as one chip: the tone from `state`, the words from
 * `label` or the state.
 *
 * @example
 * <RequestStatusChip state="in_progress" label="Awaiting receipt" />
 */
export function RequestStatusChip({
  state,
  label,
  size = "default",
  className,
  ...props
}: RequestStatusChipProps) {
  return (
    <Badge
      variant={TONE[state]}
      data-slot="request-status-chip"
      data-state={state}
      data-size={size}
      className={cn(
        "max-w-full min-w-0",
        size === "sm" && "h-4 px-1.5",
        state === "cancelled" && "text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span className="truncate">{label ?? REQUEST_STATE_LABEL[state]}</span>
    </Badge>
  );
}
