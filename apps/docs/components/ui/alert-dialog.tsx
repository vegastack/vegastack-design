// @vegastack alert-dialog@0.2.0 sha256-g6PtOun0oYjTKVtyo/xqtVJHPiv2sm+62+22ITkCaIs=

"use client";

import * as React from "react";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------------------------------------
 * AlertDialog — a modal confirmation dialog built on Base UI's AlertDialog. Exported FLAT
 * (shadcn-style): `AlertDialog` (=Root), `AlertDialogTrigger`, `AlertDialogContent` (composes
 * Portal+Backdrop+Viewport+Popup with enter/exit transitions), `AlertDialogHeader`,
 * `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction` (the
 * confirm button), and `AlertDialogCancel` (the cancel button).
 *
 * Unlike `Dialog`, an AlertDialog is intentionally NOT dismissable by clicking the backdrop — Base
 * UI's AlertDialog disables pointer dismissal so the user must pick Cancel, press Escape (cancel),
 * or choose the confirm Action. Reach for it for destructive/irreversible confirmations ("Delete
 * project", "Discard changes"); for everything else use `Dialog`.
 *
 * Enter/exit animate via Base UI's `data-starting-style`/`data-ending-style` data attributes +
 * token-duration transitions.
 * ----------------------------------------------------------------------------------------------*/

/**
 * `AlertDialog` — the root, controls open/close state. Doesn't render an element itself;
 * compose `AlertDialogTrigger` + `AlertDialogContent` inside it. Always modal (focus trapped,
 * page scroll locked), disables pointer/backdrop dismissal, and treats Escape as a cancel request.
 *
 * @example
 * <AlertDialog>
 *   <AlertDialogTrigger render={<Button variant="destructive-outline">Delete</Button>} />
 *   <AlertDialogContent intent="destructive">
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Delete project</AlertDialogTitle>
 *       <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancel</AlertDialogCancel>
 *       <AlertDialogAction intent="destructive" onClick={handleDelete}>Delete</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 */
export type AlertDialogProps = React.ComponentProps<
  typeof BaseAlertDialog.Root
>;

export function AlertDialog(props: AlertDialogProps) {
  return <BaseAlertDialog.Root {...props} />;
}

export type AlertDialogTriggerProps = React.ComponentProps<
  typeof BaseAlertDialog.Trigger
>;

/**
 * `AlertDialogTrigger` — the control that opens the dialog. Renders a `<button>`;
 * pass `render` to compose it with a `Button` or any other action element.
 */
export function AlertDialogTrigger({
  className,
  ...props
}: AlertDialogTriggerProps) {
  return (
    <BaseAlertDialog.Trigger
      data-slot="alert-dialog-trigger"
      className={className}
      {...props}
    />
  );
}

/**
 * Intent of the confirmation — sets the tone of the dialog (carried onto `AlertDialogAction`
 * for its confirm-button tint). Mirrors the semantic-button intents.
 * - `default` — neutral, primary confirmation.
 * - `destructive` — dangerous/irreversible (delete, remove).
 * - `success` — positive confirmation (keep, confirm).
 * - `warning` — cautionary action.
 */
export type AlertDialogIntent =
  | "default"
  | "destructive"
  | "success"
  | "warning";

export interface AlertDialogContentProps extends React.ComponentProps<
  typeof BaseAlertDialog.Popup
> {
  /**
   * Semantic intent of the confirmation. Provided here for documentation/grouping; it does not
   * style the popup itself — set the matching `intent` on `AlertDialogAction` to tint the confirm
   * button.
   * @default "default"
   */
  intent?: AlertDialogIntent;
}

/**
 * `AlertDialogContent` — the centered popup. Composes Base UI's `Portal` + `Backdrop` + `Viewport`
 * + `Popup`, animates enter/exit, and traps focus. Drop `AlertDialogHeader`/`AlertDialogFooter`
 * and the title/description inside it. There is no top-right close button — the user must choose
 * `AlertDialogCancel`, press Escape, or choose `AlertDialogAction`.
 */
export function AlertDialogContent({
  className,
  children,
  // `intent` is consumed for the `data-intent` hint only; it does not restyle the popup.
  intent = "default",
  ...props
}: AlertDialogContentProps) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop
        data-slot="alert-dialog-backdrop"
        className={cn(
          "fixed inset-0 z-(--z-overlay) bg-overlay",
          "transition-opacity duration-fast ease-standard",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        )}
      />
      <BaseAlertDialog.Viewport
        data-slot="alert-dialog-viewport"
        className={cn(
          "fixed inset-0 z-(--z-overlay) flex items-center justify-center overflow-y-auto p-4 outline-none",
        )}
      >
        <BaseAlertDialog.Popup
          data-slot="alert-dialog-content"
          data-intent={intent}
          className={cn(
            "relative z-(--z-overlay) flex max-h-[calc(100dvh-var(--spacing)*8)] w-full flex-col gap-4",
            // No `outline-none`: Base UI focuses the popup on open, so the centralized base.css
            // `:focus-visible` outline stays as the keyboard-focus indicator (register P0-02).
            "rounded-lg border border-border bg-popover p-5 text-base text-popover-foreground shadow-overlay",
            "sm:max-w-sm",
            // Enter/exit — scale + fade, token durations + standard easing.
            "origin-center transition-all duration-fast ease-standard",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Viewport>
    </BaseAlertDialog.Portal>
  );
}

export type AlertDialogHeaderProps = React.ComponentProps<"div">;

/**
 * `AlertDialogHeader` — groups the title and description at the top of the content.
 */
export function AlertDialogHeader({
  className,
  ...props
}: AlertDialogHeaderProps) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex shrink-0 flex-col gap-1.5", className)}
      {...props}
    />
  );
}

export type AlertDialogFooterProps = React.ComponentProps<"div">;

/**
 * `AlertDialogFooter` — the action row at the bottom of the content. Stacks (reversed) on
 * narrow screens, becomes an end-aligned row from the `sm` breakpoint up. Place
 * `AlertDialogCancel` then `AlertDialogAction` inside it.
 */
export function AlertDialogFooter({
  className,
  ...props
}: AlertDialogFooterProps) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export type AlertDialogTitleProps = React.ComponentProps<
  typeof BaseAlertDialog.Title
>;

/**
 * `AlertDialogTitle` — the dialog's accessible name. Renders an `<h2>`; Base UI wires it to the
 * popup via `aria-labelledby`. Always include one.
 */
export function AlertDialogTitle({
  className,
  ...props
}: AlertDialogTitleProps) {
  return (
    <BaseAlertDialog.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-h4 text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type AlertDialogDescriptionProps = React.ComponentProps<
  typeof BaseAlertDialog.Description
>;

/**
 * `AlertDialogDescription` — supporting text under the title. Renders a `<p>`; Base UI wires it
 * to the popup via `aria-describedby`.
 */
export function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <BaseAlertDialog.Description
      data-slot="alert-dialog-description"
      className={cn("text-base leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Maps the confirm-button `intent` to a semantic {@link Button} variant, so `AlertDialogAction`
 * stays in lockstep with the shared button styling (focus, sizing, hover) instead of duplicating it.
 */
const ACTION_INTENT_VARIANT: Record<
  AlertDialogIntent,
  React.ComponentProps<typeof Button>["variant"]
> = {
  default: "default",
  destructive: "destructive-outline",
  success: "success-outline",
  warning: "warning-outline",
};

export interface AlertDialogActionProps
  extends React.ComponentProps<typeof BaseAlertDialog.Close> {
  /**
   * Semantic tint of the confirm button — match it to the dialog's `intent`.
   * @default "default"
   */
  intent?: AlertDialogIntent;
  /**
   * Shows a spinner and marks the confirm button busy while an async confirm is pending — wired
   * straight through to the underlying {@link Button}'s `loading` prop (spinner, `aria-busy`, and a
   * real `disabled` control). Because the rendered button becomes genuinely `disabled`, a click
   * while `loading` never reaches Base UI's `Close` click handler, so the dialog stays open until
   * you flip `loading` back to `false` (typically in the `onClick` handler's `finally`).
   * @default false
   */
  loading?: boolean;
}

/**
 * `AlertDialogAction` — the confirm button. Closes the dialog when clicked (Base UI `Close`), so
 * wire your confirm work through `onClick`. Composes the shared {@link Button} with the `intent`
 * tint (default/destructive/success/warning) and, when `loading` is set, its spinner/busy/disabled
 * state — use it for async confirms (e.g. `onClick={async () => { setLoading(true); await
 * doDelete(); setLoading(false); }}`). Pass `render` to swap the element.
 */
export function AlertDialogAction({
  className,
  intent = "default",
  loading = false,
  ...props
}: AlertDialogActionProps) {
  return (
    <BaseAlertDialog.Close
      className={className}
      render={
        <Button
          variant={ACTION_INTENT_VARIANT[intent]}
          data-slot="alert-dialog-action"
          data-intent={intent}
          loading={loading}
        />
      }
      {...props}
    />
  );
}

export type AlertDialogCancelProps = React.ComponentProps<
  typeof BaseAlertDialog.Close
>;

/**
 * `AlertDialogCancel` — the cancel button. Closes the dialog without confirming (Base UI
 * `Close`). Composes the shared {@link Button} `outline` variant. Pass `render` to swap the element.
 */
export function AlertDialogCancel({
  className,
  ...props
}: AlertDialogCancelProps) {
  return (
    <BaseAlertDialog.Close
      className={className}
      render={<Button variant="outline" data-slot="alert-dialog-cancel" />}
      {...props}
    />
  );
}
