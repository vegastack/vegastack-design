// @vegastack toast@0.23.17 sha256-gWpl5hd8fyGH8ixitbvanz5oPXYdmkARmKLEX1ZpeVo=

"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

import { Button } from "@/components/ui/button";
import {
  XIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  LoaderIcon,
} from "lucide-react";

const toast = ToastPrimitive.createToastManager();

// A11Y-9: what is hidden from assistive technology must not be reachable by keyboard. Base UI keeps
// a `priority: "high"` toast `aria-hidden` for as long as the viewport is unfocused — it announces a
// visually hidden `role="alert"` clone instead — while leaving the visible root and its buttons in
// the tab order. The root reads the flag off the props the engine hands it, rather than recomputing
// `priority === "high" && !focused`, and publishes it here so the toast's own focusable parts leave
// the tab order with it. Base UI clears `aria-hidden` the moment the viewport takes focus (F6), so
// the toast becomes tabbable exactly when it becomes visible to assistive technology.
const ToastHiddenFromAtContext = React.createContext(false);

// OVL-15: true inside a `ToastPositioner`. An anchored toast is placed by the positioner, so the
// root must not also emit the corner stack's absolute placement and transform — they would fight.
// Reading it from context rather than asking the caller for a prop means an anchored composition
// cannot be built wrong: there is no magic className to remember.
const ToastAnchoredContext = React.createContext(false);

/**
 * OVL-15: where the stack pins itself. Names are LOGICAL on the inline axis (`start`/`end` rather
 * than left/right), so an RTL document mirrors the stack without a second position vocabulary.
 */
type ToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";

/**
 * OVL-15: the viewport recipe. `--toast-dir` is the stack's growth sign, read by every vertical
 * term in `toastVariants`: `-1` pins the stack to the bottom (toasts behind peek ABOVE the
 * frontmost), `1` pins it to the top. The mobile layout is upstream's — full width inside a 16px
 * gutter — and the inline corner only applies from `sm` up.
 *
 * OVL-15: `z-60` puts the stack one band above the single `z-50` overlay band, so a toast fired
 * while a Dialog is open is visible instead of behind its scrim. Nothing else leaves `z-50`.
 */
const toastViewportVariants = cva(
  "pointer-events-none fixed inset-x-4 z-60 mx-auto w-auto max-w-sm outline-none sm:mx-0 sm:w-full",
  {
    variants: {
      position: {
        "top-start": "top-4 [--toast-dir:1] sm:start-4 sm:end-auto",
        "top-center": "top-4 [--toast-dir:1] sm:inset-x-0 sm:mx-auto",
        "top-end": "top-4 [--toast-dir:1] sm:end-4 sm:start-auto",
        "bottom-start": "bottom-4 [--toast-dir:-1] sm:start-4 sm:end-auto",
        "bottom-center": "bottom-4 [--toast-dir:-1] sm:inset-x-0 sm:mx-auto",
        "bottom-end": "bottom-4 [--toast-dir:-1] sm:end-4 sm:start-auto",
      },
    },
    defaultVariants: { position: "bottom-end" },
  },
);

/**
 * The toast surface and its stacking behaviour. Base UI publishes `--toast-index`,
 * `--toast-offset-y`, `--toast-height`/`--toast-frontmost-height` and the two swipe-movement vars;
 * the transforms below are the collapsed stack (each toast behind scaled down and peeking by
 * `--peek`), the expanded stack (`data-expanded`, when the viewport is hovered or focused), and the
 * swipe/dismiss exits.
 *
 * OVL-15: every vertical term is multiplied by `--toast-dir` so one expression serves a top- and a
 * bottom-pinned stack. The fallback `-1` keeps a hand-composed root that is not inside one of our
 * viewports behaving exactly as upstream's did.
 */
/**
 * OVL-15: the classes that make a toast part of the CORNER STACK — absolute placement inside the
 * viewport, the published stacking vars, the collapsed/expanded transforms, the enter/exit travel
 * and the pointer-bridging gap. An ANCHORED toast is not in that stack: it is placed by
 * `ToastPositioner`, so emitting any of this would fight the positioner's own transform. Hence a
 * variant rather than a base, and `anchor: "none"` simply does not emit it.
 */
const TOAST_STACK = [
  "absolute end-0 z-[calc(1000-var(--toast-index))] will-change-transform",
  "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-swipe-movement-y)+var(--toast-dir,-1)*(var(--toast-offset-y)+var(--toast-index)*var(--gap)))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
  "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+var(--toast-dir,-1)*(var(--toast-index)*var(--peek)+var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
  "after:absolute after:start-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
  "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
  "data-limited:opacity-0 data-starting-style:[transform:translateY(calc(var(--toast-dir,-1)*-150%))]",
  "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(calc(var(--toast-dir,-1)*-150%))]",
  "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
  "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
  "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
  "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
  "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
  "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
  "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
  "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
];

const toastVariants = cva(
  "group/toast pointer-events-auto w-full rounded-2xl border bg-popover text-popover-foreground shadow-lg select-none",
  {
    variants: {
      // Which edge the stack grows from — sets `origin` so the collapsed scale reads right, and
      // moves the pointer-bridging `::after` to the side the next toast is on. `none` is an
      // anchored toast: no stack, no transform, nothing for the positioner to fight.
      anchor: {
        top: [...TOAST_STACK, "top-0 origin-top after:bottom-full"].join(" "),
        bottom: [...TOAST_STACK, "bottom-0 origin-bottom after:top-full"].join(
          " ",
        ),
        none: "",
      },
    },
    defaultVariants: { anchor: "bottom" },
  },
);

/**
 * OVL-15: the custom body a toast carries in `data.render`. Passing one keeps the toast a real
 * toast — stacking, swipe-to-dismiss, `Escape` and the viewport's live region all still apply —
 * instead of opting out of them.
 */
type ToastCustomData = {
  render?: (toast: ToastPrimitive.Root.ToastObject) => React.ReactNode;
};

// OVL-17: the manager of the `ToastProvider` mounted above, if any. A `Toaster` given the same
// manager reuses that provider rather than mounting a second one, so `toast()` and
// `useToastManager()` write to the one store the viewport renders.
const ToastProviderScope = React.createContext<
  ToastPrimitive.Provider.Props["toastManager"] | null
>(null);

function ToastProvider({ children, ...props }: ToastPrimitive.Provider.Props) {
  return (
    <ToastPrimitive.Provider {...props}>
      <ToastProviderScope.Provider value={props.toastManager ?? null}>
        {children}
      </ToastProviderScope.Provider>
    </ToastPrimitive.Provider>
  );
}

function ToastPortal({ children, ...props }: ToastPrimitive.Portal.Props) {
  const themeScope = useInternalThemeScope();

  return (
    <ToastPrimitive.Portal data-slot="toast-portal" {...props}>
      <div className={cn("contents", themeScope)}>{children}</div>
    </ToastPrimitive.Portal>
  );
}

function ToastViewport({
  className,
  position,
  ...props
}: ToastPrimitive.Viewport.Props & VariantProps<typeof toastViewportVariants>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      data-position={position ?? "bottom-end"}
      className={cn(toastViewportVariants({ position }), className)}
      {...props}
    />
  );
}

/**
 * OVL-15: `ToastPositioner` — the anchored-toast wrapper. Base UI can position a toast against an
 * element instead of stacking it in the corner; pass `positionerProps` on the `add()` call and
 * compose the toast inside one of these. It shares the viewport's `z-60` band.
 */
function ToastPositioner({
  className,
  ...props
}: ToastPrimitive.Positioner.Props) {
  return (
    <ToastAnchoredContext.Provider value={true}>
      <ToastPrimitive.Positioner
        data-slot="toast-positioner"
        className={cn("z-60", className)}
        {...props}
      />
    </ToastAnchoredContext.Provider>
  );
}

/** OVL-15: the anchored toast's pointer, inheriting the surface it grows from. */
function ToastArrow({ className, ...props }: ToastPrimitive.Arrow.Props) {
  return (
    <ToastPrimitive.Arrow
      data-slot="toast-arrow"
      className={cn("text-current", className)}
      {...props}
    />
  );
}

function Toast({
  className,
  render,
  anchor,
  ...props
}: ToastPrimitive.Root.Props & VariantProps<typeof toastVariants>) {
  // OVL-15: inside a positioner the default is `none`, not the corner stack. An explicit `anchor`
  // still wins, so a caller can compose a stacked toast inside a positioner if they really mean to.
  const anchored = React.useContext(ToastAnchoredContext);
  const resolvedAnchor = anchor ?? (anchored ? ("none" as const) : undefined);

  return (
    <ToastPrimitive.Root
      data-slot="toast"
      // A11Y-9: `tabIndex` follows `aria-hidden` — see `ToastHiddenFromAtContext`.
      render={
        render ??
        (({ children, ...elementProps }) => {
          const hiddenFromAt =
            elementProps["aria-hidden"] === true ||
            elementProps["aria-hidden"] === "true";
          return (
            <div {...elementProps} tabIndex={hiddenFromAt ? -1 : 0}>
              <ToastHiddenFromAtContext.Provider value={hiddenFromAt}>
                {children}
              </ToastHiddenFromAtContext.Provider>
            </div>
          );
        })
      }
      className={cn(toastVariants({ anchor: resolvedAnchor }), className)}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      // COL-23: Base UI renders `Toast.Title` as `null` when a toast has no title, so a
      // description-only toast's ONLY line is this one — its primary message. `first:` gives it the
      // default ink exactly then; a description that follows a title stays the secondary ink.
      className={cn(
        "text-sm text-muted-foreground first:text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  const hiddenFromAt = React.useContext(ToastHiddenFromAtContext);

  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      // A11Y-9: out of the tab order while the toast around it is `aria-hidden`.
      tabIndex={hiddenFromAt ? -1 : 0}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  const hiddenFromAt = React.useContext(ToastHiddenFromAtContext);

  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      // A11Y-9: out of the tab order while the toast around it is `aria-hidden`.
      tabIndex={hiddenFromAt ? -1 : 0}
      className={cn(
        "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null;

  if (type === "success") {
    icon = <CircleCheckIcon className="text-success-text" aria-hidden="true" />;
  }

  if (type === "info") {
    icon = <InfoIcon className="text-info-text" aria-hidden="true" />;
  }

  if (type === "warning") {
    icon = (
      <TriangleAlertIcon className="text-warning-text" aria-hidden="true" />
    );
  }

  if (type === "error") {
    icon = (
      <OctagonXIcon className="text-destructive-text" aria-hidden="true" />
    );
  }

  if (type === "loading") {
    icon = <LoaderIcon className="animate-spin" aria-hidden="true" />;
  }

  if (!icon) {
    return null;
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  );
}

function ToastList({
  anchor,
  swipeDirection,
}: VariantProps<typeof toastVariants> &
  Pick<ToastPrimitive.Root.Props, "swipeDirection">) {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => {
    // OVL-15: a toast carrying `data.render` owns its own body; everything around it — the surface,
    // the stack, the swipe and the live region — is unchanged.
    const custom = (toastItem.data as ToastCustomData | undefined)?.render;

    return (
      <Toast
        key={toastItem.id}
        toast={toastItem}
        anchor={anchor}
        swipeDirection={swipeDirection}
      >
        <ToastContent>
          {custom ? (
            custom(toastItem)
          ) : (
            <>
              <ToastIcon type={toastItem.type} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <ToastTitle />
                <ToastDescription />
              </div>
              <ToastAction />
              <ToastClose />
            </>
          )}
        </ToastContent>
      </Toast>
    );
  });
}

function Toaster({
  children,
  toastManager = toast,
  position = "bottom-end",
  swipeDirection,
  ...props
}: ToastPrimitive.Provider.Props & {
  /**
   * OVL-15: which corner the stack pins to. Inline names are logical, so `bottom-end` is
   * bottom-right in an LTR document and bottom-left in an RTL one.
   * @default 'bottom-end'
   */
  position?: ToastPosition;
  /**
   * Direction(s) a toast can be swiped to dismiss. Defaults to the stack's own block direction
   * plus both inline directions, so a toast always swipes away from the edge it entered from.
   */
  swipeDirection?: ToastPrimitive.Root.Props["swipeDirection"];
}) {
  const anchor = position.startsWith("top") ? "top" : "bottom";
  const swipe: ToastPrimitive.Root.Props["swipeDirection"] =
    swipeDirection ??
    (anchor === "top" ? ["up", "left", "right"] : ["down", "left", "right"]);
  const providerManager = React.useContext(ToastProviderScope);

  const viewport = (
    <ToastPortal>
      <ToastViewport position={position}>
        <ToastList anchor={anchor} swipeDirection={swipe} />
      </ToastViewport>
    </ToastPortal>
  );
  // OVL-17: under a provider on the same manager (VegaStackProvider mounts one with the module
  // `toast` manager) the Toaster renders only its viewport, into that provider's one store, and
  // the provider's `limit`/`timeout` apply. A Toaster on another manager brings its own provider.
  if (providerManager === toastManager) {
    return (
      <>
        {children}
        {viewport}
      </>
    );
  }
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      {viewport}
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastArrow,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastPositioner,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
  type ToastPosition,
};
