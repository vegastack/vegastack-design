// @vegastack video-player@0.7.0 sha256-AyEx6XSuStZLkNVAdA+4Wli0i9P2I9SKQs4t9ovzpMM=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  MediaPlayerControls,
  type MediaPlayerControlsProps,
  assignRef,
  useMediaShortcuts,
} from "@/components/ui/media-player-controls";

const VIDEO_CONTROLS_HIDE_DELAY_MS = 1000;
const VIDEO_CONTROLS_FADE_MS = 150;
const DEFAULT_VIDEO_QUALITIES = [
  "144p",
  "240p",
  "360p",
  "480p",
  "720p",
  "1080p",
] as const;

function isTextEntryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        "input, textarea, select, [contenteditable='true'], [role='textbox']",
      ),
    )
  );
}

/** Props accepted by `VideoPlayer`. */
export interface VideoPlayerProps extends Omit<
  React.ComponentPropsWithRef<"video">,
  | "children"
  | "className"
  | "controls"
  | "ref"
  | "title"
  | "onTimeUpdate"
  | "onRateChange"
  | "onPlay"
  | "onPause"
> {
  /**
   * Video source URL.
   */
  src: string;
  /**
   * Accessible label used by the video element and custom controls.
   * @default 'Video'
   */
  label?: string;
  /**
   * Optional visible title shown above the video frame.
   * @default undefined
   */
  title?: React.ReactNode;
  /**
   * Optional visible description shown below the title.
   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * Reserved frame aspect ratio.
   * @default 'video'
   */
  aspectRatio?: "video" | "square" | "auto";
  /**
   * Classes applied to the outer player container.
   * @default undefined
   */
  className?: string;
  /**
   * Classes applied to the native `<video>` frame.
   * @default undefined
   */
  videoClassName?: string;
  /**
   * Ref for the native `<video>` media engine.
   * @default undefined
   */
  mediaRef?: React.Ref<HTMLVideoElement>;
  /**
   * Ref for the outer player container.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
  /**
   * Seconds moved by the rewind and forward actions.
   * @default 15
   */
  skipSeconds?: MediaPlayerControlsProps["skipSeconds"];
  /**
   * Playback rates cycled by the rate control.
   * @default [0.75, 1, 1.25, 1.5, 2]
   */
  playbackRates?: MediaPlayerControlsProps["playbackRates"];
  /**
   * Initial playback rate applied when the video element mounts.
   * @default 1
   */
  defaultPlaybackRate?: MediaPlayerControlsProps["defaultPlaybackRate"];
  /**
   * Selectable quality labels shown in the settings menu.
   * @default ['144p', '240p', '360p', '480p', '720p', '1080p']
   */
  qualityOptions?: MediaPlayerControlsProps["qualityOptions"];
  /**
   * Initial quality label selected in the settings menu.
   * @default '720p'
   */
  defaultQuality?: MediaPlayerControlsProps["defaultQuality"];
  /**
   * Format elapsed and duration labels.
   * @default mm:ss / h:mm:ss
   */
  formatTime?: MediaPlayerControlsProps["formatTime"];
  /**
   * Called whenever playback starts or pauses.
   * @default undefined
   */
  onPlayStateChange?: MediaPlayerControlsProps["onPlayStateChange"];
  /**
   * Called whenever the current playback time changes.
   * @default undefined
   */
  onTimeChange?: MediaPlayerControlsProps["onTimeChange"];
  /**
   * Called whenever the playback rate changes.
   * @default undefined
   */
  onPlaybackRateChange?: MediaPlayerControlsProps["onPlaybackRateChange"];
  /**
   * Called whenever the selected quality label changes.
   * @default undefined
   */
  onQualityChange?: MediaPlayerControlsProps["onQualityChange"];
  /**
   * Force the overlay controls open (`true`) or closed (`false`), taking the
   * auto hide/reveal out of the loop. Leave it undefined for the default
   * behaviour: reveal on pointer or focus, fade out a second after the pointer
   * leaves. Use `true` for a kiosk/always-on player — and for a static docs or
   * test fixture, which is what lets the contract lane see the chrome at all.
   * @default undefined
   */
  controlsVisible?: boolean;
}

/**
 * `VideoPlayer` — a tokenized video frame with the same VegaStack transport
 * controls as `AudioPlayer`: play/pause, seek, elapsed/duration labels, mute,
 * playback speed, and keyboard skip shortcuts.
 *
 * @example
 * <VideoPlayer src="/media/demo.mp4" poster="/media/poster.webp" label="Product demo video" />
 */
export function VideoPlayer({
  className,
  videoClassName,
  src,
  label = "Video",
  title,
  description,
  aspectRatio = "video",
  mediaRef,
  skipSeconds,
  playbackRates,
  defaultPlaybackRate,
  qualityOptions = DEFAULT_VIDEO_QUALITIES,
  defaultQuality = "720p",
  formatTime,
  onPlayStateChange,
  onTimeChange,
  onPlaybackRateChange,
  onQualityChange,
  controlsVisible: controlsVisibleProp,
  preload = "metadata",
  playsInline = true,
  ref,
  ...props
}: VideoPlayerProps) {
  const internalMediaRef = React.useRef<HTMLVideoElement | null>(null);
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const keyboardActiveRef = React.useRef(false);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const revealFrameRef = React.useRef<number | null>(null);
  const [controlsRendered, setControlsRendered] = React.useState(false);
  const [autoControlsVisible, setAutoControlsVisible] = React.useState(false);
  // A `controlsVisible` prop takes the auto hide/reveal out of the loop entirely.
  const controlsPinned = controlsVisibleProp != null;
  const controlsVisible = controlsVisibleProp ?? autoControlsVisible;
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const controlsMediaRef =
    internalMediaRef as React.RefObject<HTMLMediaElement | null>;
  const setVideoRef = React.useCallback(
    (node: HTMLVideoElement | null) => {
      internalMediaRef.current = node;
      assignRef(mediaRef, node);
    },
    [mediaRef],
  );

  const clearHideTimer = React.useCallback(() => {
    if (!hideTimerRef.current) return;
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const clearUnmountTimer = React.useCallback(() => {
    if (!unmountTimerRef.current) return;
    clearTimeout(unmountTimerRef.current);
    unmountTimerRef.current = null;
  }, []);

  const clearRevealFrame = React.useCallback(() => {
    if (!revealFrameRef.current) return;
    cancelAnimationFrame(revealFrameRef.current);
    revealFrameRef.current = null;
  }, []);

  const scheduleControlsHide = React.useCallback(
    (preserveFocus = true) => {
      if (controlsPinned) return;
      clearHideTimer();

      hideTimerRef.current = setTimeout(() => {
        if (
          preserveFocus &&
          frameRef.current?.contains(document.activeElement)
        ) {
          return;
        }
        if (frameRef.current?.contains(document.activeElement)) {
          frameRef.current.focus();
        }
        setAutoControlsVisible(false);
        unmountTimerRef.current = setTimeout(() => {
          setControlsRendered(false);
          unmountTimerRef.current = null;
        }, VIDEO_CONTROLS_FADE_MS);
        hideTimerRef.current = null;
      }, VIDEO_CONTROLS_HIDE_DELAY_MS);
    },
    [clearHideTimer, controlsPinned],
  );

  const handlePointerLeave = React.useCallback(() => {
    scheduleControlsHide(false);
  }, [scheduleControlsHide]);

  const showControls = React.useCallback(() => {
    clearHideTimer();
    clearUnmountTimer();
    clearRevealFrame();
    setControlsRendered(true);
    revealFrameRef.current = requestAnimationFrame(() => {
      setAutoControlsVisible(true);
      revealFrameRef.current = null;
    });
  }, [clearHideTimer, clearRevealFrame, clearUnmountTimer]);

  const handleControlsFocus = React.useCallback(() => {
    clearHideTimer();
    setAutoControlsVisible(true);
  }, [clearHideTimer]);

  // Pinned open: mount the overlay up front so it is in the DOM on first paint
  // (a static fixture never receives a pointer or focus event to reveal it).
  React.useEffect(() => {
    if (controlsVisibleProp === true) setControlsRendered(true);
  }, [controlsVisibleProp]);

  const handleControlsBlur = React.useCallback(() => {
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const toggleFullscreen = React.useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;

    if (document.fullscreenElement === frame) {
      void document.exitFullscreen();
      return;
    }

    void frame.requestFullscreen();
  }, []);

  /*
    ONE shortcut map, shared with the controls group (audit B4-02). Space/K
    play, J/L and the arrows skip, M mutes, F toggles fullscreen. It used to be
    implemented twice — here and inside the controls — and the two had already
    drifted: the controls copy never handled F.
  */
  const { runShortcut } = useMediaShortcuts({
    mediaRef: controlsMediaRef,
    skipSeconds,
    onFullscreenToggle: toggleFullscreen,
    onPlayStateChange,
    onTimeChange,
  });

  const handleFrameKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const frame = frameRef.current;
      if (
        !frame ||
        (event.target instanceof Node && !frame.contains(event.target)) ||
        (event.target !== event.currentTarget &&
          event.target instanceof HTMLElement &&
          event.target.closest('[data-slot="media-player-controls"]'))
      ) {
        return;
      }

      if (runShortcut(event.key, "surface")) event.preventDefault();
    },
    [runShortcut],
  );

  React.useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };

    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const frame = frameRef.current;
      keyboardActiveRef.current = Boolean(
        frame && event.target instanceof Node && frame.contains(event.target),
      );
    };
    const handleFocusIn = (event: FocusEvent) => {
      const frame = frameRef.current;
      keyboardActiveRef.current = Boolean(
        frame && event.target instanceof Node && frame.contains(event.target),
      );
    };
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      const frame = frameRef.current;
      if (
        !keyboardActiveRef.current ||
        !frame ||
        event.defaultPrevented ||
        isTextEntryTarget(event.target) ||
        (event.target instanceof Node && frame.contains(event.target))
      ) {
        return;
      }

      if (!runShortcut(event.key, "surface")) return;
      event.preventDefault();
      showControls();
      scheduleControlsHide(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [runShortcut, scheduleControlsHide, showControls]);

  React.useEffect(() => {
    return () => {
      clearHideTimer();
      clearUnmountTimer();
      clearRevealFrame();
    };
  }, [clearHideTimer, clearRevealFrame, clearUnmountTimer]);

  return (
    <div
      ref={ref}
      data-slot="video-player"
      data-aspect-ratio={aspectRatio}
      className={cn("flex w-full flex-col gap-2", className)}
    >
      {title || description ? (
        <div
          data-slot="video-player-header"
          className="flex min-w-0 flex-col gap-1"
        >
          {title ? (
            <div className="min-w-0 text-label text-foreground">
              <span className="block truncate">{title}</span>
            </div>
          ) : null}
          {description ? (
            <div className="min-w-0 text-sm text-muted-foreground">
              <span className="block truncate">{description}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        ref={frameRef}
        data-slot="video-player-frame"
        onPointerEnter={showControls}
        onPointerLeave={handlePointerLeave}
        onFocusCapture={handleControlsFocus}
        onBlurCapture={handleControlsBlur}
        onKeyDownCapture={showControls}
        onKeyDown={handleFrameKeyDown}
        tabIndex={0}
        role="group"
        aria-label={`${label} video player`}
        className={cn(
          "relative overflow-hidden rounded-lg bg-muted",
          // The centralized 2px `:focus-visible` outline, pulled INSIDE because
          // the frame is `overflow-hidden` and would clip it — the one focus
          // deviation `design.md` permits (audit B4-03, D17). What was here
          // before was a `ring-2 ring-ring/50` box-shadow glow with a
          // forced-colours carve-out to keep it legal; both are gone.
          "focus-visible:-outline-offset-2",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "square" && "aspect-square",
        )}
      >
        <video
          {...props}
          ref={setVideoRef}
          src={src}
          preload={preload}
          playsInline={playsInline}
          aria-label={label}
          data-slot="video-player-media"
          className={cn(
            "w-full object-cover",
            aspectRatio === "auto" ? "h-auto" : "h-full",
            videoClassName,
          )}
        />

        <div
          data-slot="video-player-controls-scrim"
          data-state={controlsVisible ? "visible" : "hidden"}
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-(--z-raised) h-24 bg-gradient-to-t from-media-scrim to-transparent transition-opacity duration-fast ease-standard",
            controlsVisible ? "opacity-100" : "opacity-0",
          )}
        />

        {controlsRendered ? (
          <div
            data-slot="video-player-controls-overlay"
            data-state={controlsVisible ? "visible" : "hidden"}
            className={cn(
              "absolute inset-x-2 bottom-2 z-(--z-raised) transition-opacity duration-fast ease-standard",
              controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <MediaPlayerControls
              mediaRef={controlsMediaRef}
              // The frame IS the fullscreen element, so the tooltips and the settings menu have
              // to portal into it — the browser paints only the fullscreen subtree, and a popup
              // left on `<body>` simply does not appear.
              portalContainer={frameRef}
              label={label}
              skipSeconds={skipSeconds}
              playbackRates={playbackRates}
              defaultPlaybackRate={defaultPlaybackRate}
              qualityOptions={qualityOptions}
              defaultQuality={defaultQuality}
              formatTime={formatTime}
              onPlayStateChange={onPlayStateChange}
              onTimeChange={onTimeChange}
              onPlaybackRateChange={onPlaybackRateChange}
              onQualityChange={onQualityChange}
              isFullscreen={isFullscreen}
              onFullscreenToggle={toggleFullscreen}
              variant="overlay"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
