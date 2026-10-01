// @vegastack video-player@0.23.101 sha256-4RU7ikp9+Wpd1iAKeilfq8I+/UXsUuHjtCOuQASppRo=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";
import { DownloadIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useMediaQuery } from "@/components/ui/use-media-query";
import {
  MediaPlayerControls,
  clampTime,
  type MediaPlayerControlsProps,
  useExclusivePlayback,
  useMediaShortcuts,
} from "@/components/ui/media-player-controls";

const VIDEO_CONTROLS_HIDE_DELAY_MS = 1000;
const VIDEO_CONTROLS_FADE_MS = 150;
// No quality menu unless the caller has renditions to switch between: a single stored file has one.
const NO_QUALITIES: readonly string[] = [];

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
   * One media at a time: starting this player pauses any other DS player that is playing
   * (`AudioPlayer`, `VideoPlayer`, `GlobalAudioPlayer`, the `FileViewer` stages), and starting one
   * of those pauses this one. `false` opts out both ways. Nothing resumes by itself.
   * @default true
   */
  exclusive?: boolean;
  /**
   * An image shown in the frame until playback starts — a poster frame stored with the upload
   * (`probeVideo` grabs one). It also sits behind the "can't play" card.
   * @default undefined
   */
  poster?: string;
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
   * Selectable quality labels shown in the settings menu. Empty hides the Quality entry: pass
   * labels only when `onQualityChange` really switches renditions.
   * @default []
   */
  qualityOptions?: MediaPlayerControlsProps["qualityOptions"];
  /**
   * Initial quality label selected in the settings menu (the first option when omitted).
   * @default undefined
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
   * leaves; on a coarse pointer (a touch screen, which has no hover) they stay
   * shown, so the play button is always there. Use `true` for a kiosk/always-on player — and for a static docs or
   * test fixture, which is what lets the contract lane see the chrome at all.
   * @default undefined
   */
  controlsVisible?: boolean;
  /**
   * Renew an expired source. When the video fails to load after it had a URL — a signed URL that
   * has expired — the player calls this once, loads the URL it resolves, and resumes at the same
   * position (playing, if it was). A second failure, or a rejection, shows the "can't play" card;
   * a new `src` re-arms it. The same contract as `AudioPlayer`'s `onSourceExpired`.
   * @default undefined
   */
  onSourceExpired?: () => Promise<string>;
  /**
   * The file's download URL. When the browser cannot play the video (an HEVC `.mov`, an `.mkv`
   * or `.avi`), the frame shows `loadErrorLabel` with a Download button to this URL.
   * @default undefined
   */
  downloadHref?: string;
  /**
   * The message the frame shows when the video cannot play.
   * @default "Can’t play this video here"
   */
  loadErrorLabel?: string;
  /**
   * The label of the Download button beside `loadErrorLabel`.
   * @default "Download"
   */
  downloadLabel?: string;
}

/**
 * `VideoPlayer` — a tokenized video frame with the same VegaStack transport
 * controls as `AudioPlayer`: play/pause, seek, elapsed/duration labels, mute,
 * playback speed, and keyboard skip shortcuts. It never autoplays. A video the
 * browser cannot play shows "Can’t play this video here" with a Download
 * button (`downloadHref`), and `onSourceExpired` renews an expired signed URL
 * and resumes where playback stopped.
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
  qualityOptions = NO_QUALITIES,
  defaultQuality,
  formatTime,
  onPlayStateChange,
  onTimeChange,
  onPlaybackRateChange,
  onQualityChange,
  controlsVisible: controlsVisibleProp,
  onSourceExpired,
  downloadHref,
  loadErrorLabel = "Can’t play this video here",
  downloadLabel = "Download",
  poster,
  preload = "metadata",
  playsInline = true,
  exclusive = true,
  ref,
  ...props
}: VideoPlayerProps) {
  const exclusiveProps = useExclusivePlayback(exclusive);
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
  // A touch screen has no hover to reveal the controls, so a coarse pointer keeps them (and the
  // play button) on screen. A `controlsVisible` prop takes the auto hide/reveal out of the loop
  // entirely.
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const controlsPinned = controlsVisibleProp != null || coarsePointer;
  const controlsVisible =
    controlsVisibleProp ?? (coarsePointer || autoControlsVisible);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const controlsMediaRef =
    internalMediaRef as React.RefObject<HTMLMediaElement | null>;
  const setVideoRef = React.useMemo(
    () => mergeRefs(internalMediaRef, mediaRef),
    [mediaRef],
  );

  // ── Expired source and load failure ──────────────────────────────────────
  // The same mechanism as AudioPlayer's: a URL `onSourceExpired` renewed stands in for `src`
  // until `src` changes; the renewal runs once per `src`, and a stale one never lands.
  const [renewed, setRenewed] = React.useState<{ from: string; url: string }>();
  const videoSrc = renewed && renewed.from === src ? renewed.url : src;
  const [loadFailed, setLoadFailed] = React.useState(false);
  const renewalArmedRef = React.useRef(true);
  const renewalSeqRef = React.useRef(0);
  const pendingSeekRef = React.useRef<{
    seconds: number;
    play: boolean;
  } | null>(null);
  React.useEffect(() => {
    renewalArmedRef.current = true;
    renewalSeqRef.current += 1;
    setLoadFailed(false);
  }, [src]);
  const onSourceExpiredRef = React.useRef(onSourceExpired);
  React.useLayoutEffect(() => {
    onSourceExpiredRef.current = onSourceExpired;
  });
  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (!media) return;
    const resume = () => {
      const queued = pendingSeekRef.current;
      if (!queued) return;
      pendingSeekRef.current = null;
      media.currentTime = clampTime(media, queued.seconds);
      if (queued.play) void media.play().catch(() => {});
    };
    media.addEventListener("loadedmetadata", resume);
    return () => media.removeEventListener("loadedmetadata", resume);
  }, []);

  const handleMediaError = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const media = event.currentTarget;
    if (!media.getAttribute("src")) return props.onError?.(event);
    const renew = onSourceExpiredRef.current;
    if (renew && renewalArmedRef.current) {
      renewalArmedRef.current = false;
      const from = src;
      const resumeAt =
        media.currentTime > 0 || !media.paused
          ? { seconds: media.currentTime, play: !media.paused }
          : null;
      const seq = renewalSeqRef.current;
      void Promise.resolve()
        .then(() => renew())
        .then(
          (url) => {
            if (seq !== renewalSeqRef.current) return;
            pendingSeekRef.current = resumeAt;
            // The same URL again (a route that re-signs on every request): reload it.
            if (media.getAttribute("src") === url) media.load();
            else setRenewed({ from, url });
          },
          () => {
            if (seq === renewalSeqRef.current) setLoadFailed(true);
          },
        );
      return;
    }
    setLoadFailed(true);
    props.onError?.(event);
  };

  // A server-rendered <video> starts loading before hydration, so a source that fails fast (an
  // unsupported format) can fire `error` before React listens. Pick that failure up on mount.
  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (media?.error && media.getAttribute("src")) {
      media.dispatchEvent(new Event("error"));
    }
  }, []);

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
    if (
      controlsVisibleProp === true ||
      (controlsVisibleProp == null && coarsePointer)
    )
      setControlsRendered(true);
  }, [controlsVisibleProp, coarsePointer]);

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
      data-state={loadFailed ? "error" : undefined}
      className={cn("flex w-full flex-col gap-2", className)}
    >
      {title || description ? (
        <div
          data-slot="video-player-header"
          className="flex min-w-0 flex-col gap-1"
        >
          {title ? (
            <div className="min-w-0 text-sm font-medium text-foreground">
              <span className="block truncate">{title}</span>
            </div>
          ) : null}
          {description ? (
            <div className="min-w-0 text-xs text-muted-foreground">
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
          {...exclusiveProps}
          ref={setVideoRef}
          src={videoSrc}
          poster={poster}
          preload={preload}
          playsInline={playsInline}
          aria-label={label}
          data-slot="video-player-media"
          className={cn(
            "w-full object-cover",
            aspectRatio === "auto" ? "h-auto" : "h-full",
            videoClassName,
          )}
          onError={handleMediaError}
        />

        {loadFailed ? (
          <div
            data-slot="video-player-error"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-media-scrim-strong p-4 text-center text-scrim-foreground"
          >
            <p role="alert" className="text-sm font-medium">
              {loadErrorLabel}
            </p>
            {downloadHref ? (
              <a
                href={downloadHref}
                download
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "pointer-coarse:h-11 pointer-coarse:px-4",
                )}
              >
                <DownloadIcon data-icon="inline-start" />
                {downloadLabel}
              </a>
            ) : null}
          </div>
        ) : null}

        <div
          data-slot="video-player-controls-scrim"
          data-state={controlsVisible ? "visible" : "hidden"}
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-media-scrim to-transparent transition-opacity duration-fast ease-standard",
            controlsVisible ? "opacity-100" : "opacity-0",
          )}
        />

        {controlsRendered && !loadFailed ? (
          <div
            data-slot="video-player-controls-overlay"
            data-state={controlsVisible ? "visible" : "hidden"}
            className={cn(
              "absolute inset-x-2 bottom-2 z-10 transition-opacity duration-fast ease-standard",
              controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <MediaPlayerControls
              mediaRef={controlsMediaRef}
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
