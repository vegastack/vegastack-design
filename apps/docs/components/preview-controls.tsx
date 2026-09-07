"use client";

import * as React from "react";
import { Maximize2, Monitor, Smartphone, Tablet } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { IconButton } from "@/components/ui/icon-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

export type FrameWidth = "mobile" | "tablet" | "full";

// Fixed test-viewport widths are behavioral fixture values, not design tokens. They route through
// one private CSS property so Tailwind never receives an unreviewed arbitrary literal.
const FRAME_WIDTH_VALUE: Record<FrameWidth, string> = {
  mobile: "375px",
  tablet: "768px",
  full: "none",
};

interface PreviewControlsContextValue {
  width: FrameWidth;
  setWidth: (width: FrameWidth) => void;
  fullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
}

const PreviewControlsContext =
  React.createContext<PreviewControlsContextValue | null>(null);

/**
 * `PreviewControlsProvider` — shares the responsive-frame width and the fullscreen state between
 * the toolbar (rendered in the `Tabs` `label` slot) and the frame container that wraps the live
 * demo (rendered inside the "Preview" tab) — two separate subtrees under the same `<Tabs>`, so
 * the state lives here instead of local to either one.
 *
 * Deterministic initial state (`'full'`, not fullscreen) — a fresh page load, and therefore the
 * pixel review, is visually unchanged until a reader touches a control.
 */
export function PreviewControlsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [width, setWidth] = React.useState<FrameWidth>("full");
  const [fullscreen, setFullscreen] = React.useState(false);
  const value = React.useMemo(
    () => ({ width, setWidth, fullscreen, setFullscreen }),
    [width, fullscreen],
  );
  return (
    <PreviewControlsContext.Provider value={value}>
      {children}
    </PreviewControlsContext.Provider>
  );
}

function usePreviewControls() {
  const ctx = React.useContext(PreviewControlsContext);
  if (!ctx)
    throw new Error("Must be rendered within <PreviewControlsProvider>");
  return ctx;
}

/**
 * `usePreviewFrameWidth` — read the toolbar's currently-selected frame preset from inside a live
 * demo. Non-throwing (returns `'full'` outside a provider) so a demo rendered without the preview
 * chrome degrades to its unconstrained layout.
 *
 * Because the frame toggle constrains a CONTAINER, not the viewport, a viewport-driven component
 * (e.g. `Sidebar`'s `useIsMobile` media query) can't see it. A demo that WANTS to follow the frame
 * — the app-shell/dashboard mobile-Sheet switch — reads this and forces the branch itself: pick
 * the `'mobile'` preset and the demo drives its `mobileBreakpoint` so the rail becomes the Sheet.
 */
export function usePreviewFrameWidth(): FrameWidth {
  return React.useContext(PreviewControlsContext)?.width ?? "full";
}

/**
 * `FrameWidthToggle` — viewport-width presets (mobile 375 / tablet 768 / desktop full) that
 * constrain the `PreviewFrameContainer`'s max-width.
 *
 * Honest limitation: this is a CONTAINER, not a viewport — media-query (`@media`) breakpoints
 * never fire from a narrowed container, only `@container` queries do. Demos built on this
 * design system's container-query shell layouts — `AppShellContent`
 * (`@container/app-shell-content`) and `SettingsRow` (`@container/settings-row`) — visibly
 * respond to this toggle. Everything else keeps its normal viewport-driven layout regardless of
 * the selected preset; previewing a viewport-media-query breakpoint still requires resizing the
 * real browser window.
 */
export function FrameWidthToggle() {
  const { width, setWidth } = usePreviewControls();
  return (
    <ToggleGroup
      value={[width]}
      onValueChange={(next) => {
        const nextWidth = next[0] as FrameWidth | undefined;
        if (nextWidth) setWidth(nextWidth);
      }}
      size="sm"
      aria-label="Preview frame width"
    >
      <ToggleGroupItem value="mobile" aria-label="Mobile width, 375 pixels">
        <Smartphone />
      </ToggleGroupItem>
      <ToggleGroupItem value="tablet" aria-label="Tablet width, 768 pixels">
        <Tablet />
      </ToggleGroupItem>
      <ToggleGroupItem value="full" aria-label="Full width">
        <Monitor />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/**
 * `FullscreenToggle` — opens the preview frame in the system `Dialog` (DC-03/DD-4) so a demo can
 * be inspected without the docs chrome and, combined with {@link FrameWidthToggle}, as a centered
 * device frame on a blank canvas. Focus is restored here on close by Base UI.
 */
export function FullscreenToggle() {
  const { fullscreen, setFullscreen } = usePreviewControls();
  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label="Fullscreen preview"
      aria-pressed={fullscreen}
      onClick={() => setFullscreen(true)}
    >
      <Maximize2 />
    </IconButton>
  );
}

/**
 * `PreviewFrameContainer` — wraps a live demo and applies the {@link FrameWidthToggle}'s
 * selected preset as a centered `max-width` constraint. `overflow-x-auto` keeps a demo wider
 * than the frame scrollable within its own bounds instead of breaking the page layout. Portaled
 * popups (Base UI renders them to `document.body`) are unaffected either way — they were never
 * inside this container.
 *
 * In fullscreen the same frame renders inside the system `Dialog` — the component being
 * dogfooded, and the one that already owns the focus trap, background isolation on the page behind
 * (`aria-hidden` + `data-base-ui-inert`; Base UI 1.6.0 does not set the `inert` attribute), scroll
 * lock, Esc, and portal ordering (`DialogContent` paints in the same `--z-overlay` band as the
 * demo popups, which append later to `body` and therefore above it). Deliberately NOT the native
 * `requestFullscreen()` API: a natively fullscreened element would hide every portaled Dialog/
 * Select/Tooltip demo.
 */
export function PreviewFrameContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width, fullscreen, setFullscreen } = usePreviewControls();

  const frame = (
    <div className="overflow-x-auto">
      <div
        data-frame-width={width}
        style={
          {
            "--preview-frame-max-width": FRAME_WIDTH_VALUE[width],
          } as React.CSSProperties
        }
        className={cn(
          "mx-auto max-w-(--preview-frame-max-width) transition-[max-width] duration-fast ease-standard",
          width !== "full" && "rounded-md border border-dashed border-border",
        )}
      >
        {children}
      </div>
    </div>
  );

  if (!fullscreen) return frame;

  return (
    <Dialog open onOpenChange={setFullscreen}>
      <DialogContent
        data-preview-fullscreen=""
        closeLabel="Exit fullscreen preview"
        // The popup fills the viewport: a preview canvas, not a modal card.
        className="h-dvh max-h-dvh w-dvw max-w-none rounded-none border-0 bg-background p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">
          Fullscreen component preview
        </DialogTitle>
        <DialogDescription className="sr-only">
          The live demo without the docs chrome. Press Escape to return.
        </DialogDescription>
        <div className="vs-type-product flex min-h-0 flex-1 flex-col justify-center overflow-auto p-6 pt-12">
          {frame}
        </div>
      </DialogContent>
    </Dialog>
  );
}
