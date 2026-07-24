"use client";

import * as React from "react";
import {
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { IconButton } from "@/components/ui/icon-button";
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
 * `PreviewControlsProvider` — shares the responsive-frame width between the toolbar toggle
 * (rendered in the `Tabs` `label` slot) and the frame container that wraps the live demo
 * (rendered inside the "Preview" tab) — two separate subtrees under the same `<Tabs>`, so the
 * state lives here instead of local to either one.
 *
 * Deterministic initial state (`'full'`) — matches the pre-existing unconstrained layout, so a
 * fresh page load (and therefore VRT) is visually unchanged until a reader touches the toggle.
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
 * `FrameWidthToggle` — viewport-width presets (mobile 375 / tablet 768 / desktop full) that
 * constrain the `PreviewFrameContainer`'s max-width.
 *
 * Honest limitation: this is a CONTAINER, not a viewport — media-query (`@media`) breakpoints
 * never fire from a narrowed container, only `@container` queries do. Demos built on this
 * design system's container-query shell layouts (Phase R/S) — `AppShellContent`
 * (`@container/app-shell-content`) and `SettingsRow` (`@container/settings-row`) — visibly
 * respond to this toggle. Everything else (including `Field`'s `orientation="responsive"`,
 * which is container-query-capable but has no live ComponentPreview demo yet) keeps its normal
 * viewport-driven layout regardless of the selected preset; previewing a viewport-media-query
 * breakpoint still requires resizing the real browser window.
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
 * `FullscreenToggle` — expands the preview frame to a page-covering overlay so a demo can be
 * inspected without the docs chrome (and, combined with {@link FrameWidthToggle}, as a centered
 * device frame on a blank canvas). Deliberately a CSS overlay (`fixed inset-0`), NOT the native
 * `requestFullscreen()` API: Base UI portals popups to `document.body`, so a natively
 * fullscreened element would hide every Dialog/Select/Tooltip demo. Portals appended to `body`
 * paint above the overlay via DOM order within the same `--z-overlay` band.
 */
export function FullscreenToggle() {
  const { fullscreen, setFullscreen } = usePreviewControls();
  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={fullscreen ? "Exit fullscreen preview" : "Fullscreen preview"}
      aria-pressed={fullscreen}
      onClick={() => setFullscreen(!fullscreen)}
    >
      {fullscreen ? <Minimize2 key="min" /> : <Maximize2 key="max" />}
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
 * In fullscreen (see {@link FullscreenToggle}) the same frame renders inside a page-covering
 * overlay: Esc or the close button exits, the page behind is scroll-locked, and focus moves to
 * the close button on entry (returned to the toolbar toggle implicitly on exit re-render).
 */
export function PreviewFrameContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width, fullscreen, setFullscreen } = usePreviewControls();
  const closeRef = React.useRef<HTMLButtonElement>(null);

  // Scroll-lock + Esc-to-exit + initial focus, active only while the overlay is up.
  React.useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      // Ignore Esc that a demo popup (Dialog/Select/…) already handled — Base UI calls
      // preventDefault when it closes its own surface on Esc.
      if (event.key === "Escape" && !event.defaultPrevented)
        setFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen, setFullscreen]);

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
          "mx-auto max-w-[var(--preview-frame-max-width)] transition-[max-width] duration-fast ease-standard",
          width !== "full" && "rounded-md border border-dashed border-border",
        )}
      >
        {children}
      </div>
    </div>
  );

  if (!fullscreen) return frame;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen component preview"
      className="fixed inset-0 z-(--z-overlay) flex flex-col bg-background"
    >
      <div className="flex items-center justify-end border-b border-border px-4 py-2">
        <IconButton
          ref={closeRef}
          variant="ghost"
          size="sm"
          aria-label="Exit fullscreen preview"
          onClick={() => setFullscreen(false)}
        >
          <Minimize2 />
        </IconButton>
      </div>
      <div className="vs-type-product flex-1 overflow-auto p-6 [&>div]:flex [&>div]:min-h-full [&>div]:flex-col [&>div]:justify-center">
        {frame}
      </div>
    </div>
  );
}
