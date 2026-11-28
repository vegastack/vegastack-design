// @vegastack video-player@0.143.0 sha256-cswIZKvoWimtRijsYUueS+7wqTdEvnu7dW2LfNeRFR0=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";
import { DownloadIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TextSpinner } from "@/components/ui/text-spinner";
import { useMediaQuery } from "@/components/ui/use-media-query";
import {
  MediaPlayerControls,
  clampTime,
  type MediaChapter,
  type MediaMarker,
  type MediaPlayerControlsProps,
  type MediaTimeline,
  useExclusivePlayback,
  useMediaShortcuts,
} from "@/components/ui/media-player-controls";
import { attachHls, playsHlsNatively } from "@/components/ui/video-player-hls";

const VIDEO_CONTROLS_HIDE_DELAY_MS = 1000;
// While the video plays, the controls step aside after this long without the pointer moving.
const VIDEO_CONTROLS_IDLE_MS = 2500;
const VIDEO_CONTROLS_FADE_MS = 150;
// The loading bolt appears only when a wait outlasts this, so a quick seek never flashes it.
const VIDEO_LOADING_REVEAL_MS = 400;
// An `hls` source is renewed this long before its `expiresAt`.
const HLS_RENEW_AHEAD_MS = 60_000;
const VIDEO_PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
// No quality menu unless the caller has renditions to switch between: a single stored file has one.
const NO_QUALITIES: readonly string[] = [];
const CAPTIONS_STORAGE_KEY = "vegastack:video-player:captions";

/** Merge skip ranges (milliseconds) into sorted, non-overlapping second ranges. */
function normalizeSkipRanges(
  ranges: ReadonlyArray<readonly [number, number]> | undefined,
): Array<[number, number]> {
  if (!ranges?.length) return [];
  const sorted = ranges
    .map(([from, to]) => [from / 1000, to / 1000] as [number, number])
    .filter(([from, to]) => Number.isFinite(from) && to > from)
    .sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([Math.max(range[0], 0), range[1]]);
  }
  return merged;
}

/** The displayed timeline of a source with `ranges` skipped. */
function skipTimeline(ranges: ReadonlyArray<[number, number]>): MediaTimeline {
  return {
    toDisplay: (seconds) =>
      ranges.reduce(
        (shown, [from, to]) =>
          seconds > from ? shown - (Math.min(seconds, to) - from) : shown,
        seconds,
      ),
    toMedia: (seconds) =>
      ranges.reduce(
        (media, [from, to]) => (media >= from ? media + (to - from) : media),
        seconds,
      ),
  };
}

type WebkitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitSetPresentationMode?: (mode: string) => void;
  webkitPresentationMode?: string;
};
type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => void };

function fullscreenElement(): Element | null {
  return (
    document.fullscreenElement ??
    (document as WebkitDocument).webkitFullscreenElement ??
    null
  );
}

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

/** An HLS playlist source for `VideoPlayer` (a recording served as segments). */
export interface VideoPlayerHlsSource {
  /** The playlist (`.m3u8`) URL. Safari and iOS play it natively; elsewhere hls.js loads lazily. */
  playlistUrl: string;
  /**
   * When `playlistUrl` stops working (ISO 8601). `onExpired` runs 60 s before it; re-render with
   * the new expiry after a renewal.
   * @default undefined
   */
  expiresAt?: string;
  /**
   * Resolve a fresh playlist URL. Called 60 s before `expiresAt`, and when the playlist or a segment
   * answers 403; the player reloads the new playlist at the same position, playing if it was. A
   * second 403 before the new playlist has loaded, or a rejection, shows the "can't play" card.
   * Pass the returned URL back as `playlistUrl` (with its new `expiresAt`) after the promise
   * resolves; that re-render reloads nothing. A different `playlistUrl` is a new source.
   */
  onExpired: () => Promise<string>;
}

/** What `controllerRef` exposes. Milliseconds on the media's own clock. */
export interface VideoPlayerController {
  seekTo: (ms: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  currentMs: () => number;
}

/** Captions for `VideoPlayer`: one WebVTT track. */
export interface VideoPlayerCaptions {
  src: string;
  label: string;
  srclang: string;
}

/** The two ways to give `VideoPlayer` a source: exactly one of them. */
export type VideoPlayerSource =
  | {
      /**
       * Video source URL (a single file).
       */
      src: string;
      hls?: undefined;
    }
  | {
      src?: undefined;
      /**
       * An HLS playlist instead of a file, with renewal of its signed URL.
       */
      hls: VideoPlayerHlsSource;
    };

/** Props accepted by `VideoPlayer`, apart from the source. */
export interface VideoPlayerBaseProps extends Omit<
  React.ComponentPropsWithRef<"video">,
  | "children"
  | "className"
  | "controls"
  | "ref"
  | "src"
  | "title"
  | "onTimeUpdate"
  | "onRateChange"
  | "onPlay"
  | "onPause"
> {
  /**
   * Same-origin URL of hls.js's `hls.worker.js` for an `hls` source (keeps `worker-src 'self'`).
   * @default undefined
   */
  hlsWorkerPath?: string;
  /**
   * When an `hls` source attaches: once half the player is on screen (`visible`), or on the first
   * pointer or keyboard interaction (`interaction`). The poster shows until then.
   * @default 'visible'
   */
  attach?: "visible" | "interaction";
  /**
   * Ranges of the media to skip, `[from, to]` in milliseconds of the media's own clock — an edit
   * previewed before it is rendered. Playback jumps past each range, and the scrubber and readout
   * show the edited time.
   * @default undefined
   */
  skipRanges?: ReadonlyArray<readonly [number, number]>;
  /**
   * Chapters, `start_ms` on the media's own clock: ticks on the scrubber, the title over the rail on
   * hover, and a Chapters menu.
   * @default undefined
   */
  chapters?: readonly MediaChapter[];
  /**
   * Marked moments (comments at a time), `at_ms` on the media's own clock: dots above the scrubber
   * and the moment's label over the rail on hover.
   * @default undefined
   */
  markers?: readonly MediaMarker[];
  /**
   * A WebVTT captions track and a CC control (C). The viewer's choice is remembered on the device.
   * The video loads with `crossOrigin="anonymous"`, so the track's host must send CORS headers.
   * @default undefined
   */
  captions?: VideoPlayerCaptions;
  /**
   * Called as playback moves, with the current time in milliseconds of the media's own clock.
   * @default undefined
   */
  onTimeUpdate?: (ms: number) => void;
  /**
   * Imperative control: `seekTo(ms)`, `play()`, `pause()`, `currentMs()`.
   * @default undefined
   */
  controllerRef?: React.Ref<VideoPlayerController>;
  /**
   * Seconds moved by ← and → when they should move less than J/L (a recording: 5, with
   * `skipSeconds` 10).
   * @default skipSeconds
   */
  arrowSkipSeconds?: number;
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
   * Playback rates in the speed menu; `<` and `>` step through them.
   * @default [0.75, 1, 1.25, 1.5, 1.75, 2]
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

/** Props accepted by `VideoPlayer`. */
export type VideoPlayerProps = VideoPlayerBaseProps & VideoPlayerSource;

/**
 * `VideoPlayer` — a tokenized video frame with the same VegaStack transport
 * controls as `AudioPlayer`: play/pause, seek, elapsed/duration labels, mute,
 * playback speed, captions, chapters, picture in picture, fullscreen and the
 * keyboard map. It never autoplays. It plays a file (`src`) or an HLS playlist
 * (`hls`, hls.js loaded only where the browser lacks native HLS). A video the
 * browser cannot play shows "Can’t play this video here" with a Download
 * button (`downloadHref`); `onSourceExpired` (file) and `hls.onExpired`
 * (playlist) renew an expired signed URL and resume where playback stopped.
 *
 * @example
 * <VideoPlayer src="/media/demo.mp4" poster="/media/poster.webp" label="Product demo video" />
 *
 * @example
 * <VideoPlayer
 *   hls={{ playlistUrl, expiresAt, onExpired: refetchPlaylist }}
 *   hlsWorkerPath="/vendor/hls.worker.js"
 *   poster={posterUrl}
 *   chapters={[{ start_ms: 0, title: "Intro" }, { start_ms: 42_000, title: "The fix" }]}
 *   captions={{ src: captionsUrl, label: "English", srclang: "en" }}
 *   label="Walkthrough"
 * />
 */
export function VideoPlayer({
  className,
  videoClassName,
  src,
  hls,
  hlsWorkerPath,
  attach = "visible",
  skipRanges,
  chapters,
  markers,
  captions,
  onTimeUpdate,
  controllerRef,
  arrowSkipSeconds,
  label = "Video",
  title,
  description,
  aspectRatio = "video",
  mediaRef,
  skipSeconds,
  playbackRates = VIDEO_PLAYBACK_RATES,
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
  // Paused after it has played, the controls stay up (the viewer is deciding what to do next).
  // Before the first play the frame is the clean poster, as it always was.
  const [pausedPinned, setPausedPinned] = React.useState(false);
  const pausedPinnedRef = React.useRef(false);
  const controlsVisible =
    controlsVisibleProp ??
    (coarsePointer || pausedPinned || autoControlsVisible);
  const autoVisibleRef = React.useRef(false);
  // Pinned by the caller or a touch screen (paused-pinned is `pausedPinnedRef`, which the play
  // and pause listeners write synchronously).
  const externallyPinnedRef = React.useRef(
    controlsVisibleProp != null || coarsePointer,
  );
  React.useLayoutEffect(() => {
    autoVisibleRef.current = autoControlsVisible;
    pausedPinnedRef.current = pausedPinned;
    externallyPinnedRef.current = controlsVisibleProp != null || coarsePointer;
  });
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
  const videoSrc =
    src == null
      ? undefined
      : renewed && renewed.from === src
        ? renewed.url
        : src;
  const sourceKey = hls ? `hls:${hls.playlistUrl}` : src;
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
  }, [sourceKey]);
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

  // ── HLS source ───────────────────────────────────────────────────────────
  // A playlist `hls.onExpired` renewed stands in for `hls.playlistUrl`, and stays in force when the
  // caller re-renders with the URL it returned (the usual pattern: refetch the manifest, pass its
  // playlist and expiry), so that re-render reloads nothing. `nonce` reloads a renewal that
  // returned the same URL.
  const [hlsRenewed, setHlsRenewed] = React.useState<{
    from: string;
    url: string;
    nonce: number;
  }>();
  const hlsRenewal =
    hls &&
    hlsRenewed &&
    (hlsRenewed.from === hls.playlistUrl || hlsRenewed.url === hls.playlistUrl)
      ? hlsRenewed
      : undefined;
  const playlistUrl = hls ? (hlsRenewal?.url ?? hls.playlistUrl) : undefined;
  const renewalNonce = hlsRenewal?.nonce ?? 0;
  const hlsOnExpiredRef = React.useRef(hls?.onExpired);
  const hlsPropUrlRef = React.useRef(hls?.playlistUrl);
  const hlsRenewedUrlRef = React.useRef(hlsRenewed?.url);
  React.useLayoutEffect(() => {
    hlsOnExpiredRef.current = hls?.onExpired;
    hlsPropUrlRef.current = hls?.playlistUrl;
    hlsRenewedUrlRef.current = hlsRenewed?.url;
  });
  // hls.js reports its own errors; the <video> error event is then not ours to act on.
  const hlsJsActiveRef = React.useRef(false);
  // Media from the current playlist has played: a later 403 is an expiry, not a URL that never
  // worked. Re-armed only by loaded media (`loadeddata`), never by a parsed playlist alone, so a
  // playlist whose segments always answer 403 ends at the card instead of renewing forever.
  const hlsArmedRef = React.useRef(true);
  // Which source generation a renewal is in flight for (`null`: none). A new source (the caller
  // passing a different playlist) starts a new generation, so a stale renewal never lands on it.
  const hlsGenRef = React.useRef(0);
  const renewingGenRef = React.useRef<number | null>(null);
  // The position and play state to restore after a reload, taken when the old source is detached
  // (the latest moment, so a slow renewal neither rewinds nor undoes a pause), and kept until the
  // new source has loaded.
  const detachSnapshotRef = React.useRef<{
    seconds: number;
    play: boolean;
  } | null>(null);
  const pendingResumeRef = React.useRef<{
    seconds: number;
    play: boolean;
  } | null>(null);
  const consumedNonceRef = React.useRef(0);
  const renewalCounterRef = React.useRef(0);
  // A play asked for before the playlist is attached and loaded (attaching a source resets the
  // element's paused state); `pause()` clears it.
  const wantPlayRef = React.useRef(false);
  const sourceReadyRef = React.useRef(false);
  const [attached, setAttached] = React.useState(false);
  const isHls = hls != null;

  // A different playlist from the caller is a new source — unless it is the URL a renewal
  // returned (the caller handing it back). A new source starts a new generation: an earlier
  // renewal, finished or in flight, never applies to it, and it starts armed with no resume.
  const propPlaylistUrl = hls?.playlistUrl;
  const firstPropRef = React.useRef(true);
  React.useLayoutEffect(() => {
    if (firstPropRef.current) {
      firstPropRef.current = false;
      return;
    }
    if (propPlaylistUrl != null && propPlaylistUrl === hlsRenewedUrlRef.current)
      return;
    hlsGenRef.current += 1;
    hlsArmedRef.current = true;
    pendingResumeRef.current = null;
    detachSnapshotRef.current = null;
    setHlsRenewed(undefined);
  }, [propPlaylistUrl]);

  const renewHls = React.useCallback((reason: "ahead" | "forbidden") => {
    const renew = hlsOnExpiredRef.current;
    const from = hlsPropUrlRef.current;
    if (!renew || from == null) return;
    const gen = hlsGenRef.current;
    // Coalesce: every 403 while one renewal is in flight belongs to it.
    if (renewingGenRef.current === gen) return;
    if (reason === "forbidden") {
      if (!hlsArmedRef.current) {
        setLoadFailed(true);
        return;
      }
      hlsArmedRef.current = false;
    }
    renewingGenRef.current = gen;
    void Promise.resolve()
      .then(() => renew())
      .then(
        (url) => {
          if (renewingGenRef.current === gen) renewingGenRef.current = null;
          // Only for the source it was asked for: the caller still passes that playlist. (A
          // caller that already moved on — to another recording, or to this URL ahead of the
          // promise — gets nothing from a late result.)
          if (hlsGenRef.current !== gen || hlsPropUrlRef.current !== from)
            return;
          // Nonces only ever grow (across sources too), so one is never mistaken for consumed.
          renewalCounterRef.current += 1;
          setHlsRenewed({ from, url, nonce: renewalCounterRef.current });
        },
        () => {
          if (renewingGenRef.current === gen) renewingGenRef.current = null;
          if (reason === "forbidden" && hlsGenRef.current === gen)
            setLoadFailed(true);
        },
      );
  }, []);

  // Attach on visibility (default) or on the first interaction: the poster is all a page of
  // recordings loads until someone is about to watch.
  React.useEffect(() => {
    if (!isHls || attached || attach !== "visible") return;
    const frame = frameRef.current;
    if (!frame || typeof IntersectionObserver === "undefined") {
      setAttached(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.intersectionRatio >= 0.5))
          setAttached(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [attach, attached, isHls]);
  const attachOnInteraction = React.useCallback(() => {
    if (isHls) setAttached(true);
  }, [isHls]);

  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (!media || !playlistUrl || !attached) return;
    // A reload for a renewal (a nonce not yet consumed) resumes where the old source was
    // detached; any other attach (a new source, a remount) starts fresh.
    if (renewalNonce !== 0 && renewalNonce !== consumedNonceRef.current) {
      consumedNonceRef.current = renewalNonce;
      pendingResumeRef.current =
        detachSnapshotRef.current ?? pendingResumeRef.current;
    }
    detachSnapshotRef.current = null;
    const resume = pendingResumeRef.current;
    if (resume?.play) wantPlayRef.current = true;
    sourceReadyRef.current = false;

    const snapshot = () => {
      detachSnapshotRef.current =
        pendingResumeRef.current ??
        (media.currentTime > 0 || !media.paused || wantPlayRef.current
          ? {
              seconds: media.currentTime,
              play: !media.paused || wantPlayRef.current,
            }
          : null);
    };

    if (playsHlsNatively(media)) {
      pendingSeekRef.current =
        resume || wantPlayRef.current
          ? { seconds: resume?.seconds ?? 0, play: wantPlayRef.current }
          : null;
      wantPlayRef.current = false;
      media.src = playlistUrl;
      return () => {
        snapshot();
        media.removeAttribute("src");
        media.load();
      };
    }

    const controller = new AbortController();
    let detach: (() => void) | null = null;
    hlsJsActiveRef.current = true;
    void attachHls(
      media,
      playlistUrl,
      {
        workerPath: hlsWorkerPath,
        startPosition: resume?.seconds ?? -1,
        onForbidden: () => renewHls("forbidden"),
        onFatal: () => setLoadFailed(true),
        onReady: () => {
          sourceReadyRef.current = true;
          if (wantPlayRef.current) {
            wantPlayRef.current = false;
            void media.play().catch(() => {});
          }
        },
      },
      controller.signal,
    ).then(
      (release) => {
        if (controller.signal.aborted) return release?.();
        if (!release) setLoadFailed(true);
        else detach = release;
      },
      () => {
        if (!controller.signal.aborted) setLoadFailed(true);
      },
    );
    return () => {
      snapshot();
      controller.abort();
      detach?.();
      hlsJsActiveRef.current = false;
    };
  }, [attached, hlsWorkerPath, playlistUrl, renewHls, renewalNonce]);

  // Renew ahead of expiry, once per `expiresAt`, only while attached (an unattached player renews
  // on its first 403 instead).
  const hlsExpiresAt = hls?.expiresAt;
  const renewedAheadForRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!hlsExpiresAt || !attached) return;
    if (renewedAheadForRef.current === hlsExpiresAt) return;
    const at = Date.parse(hlsExpiresAt) - HLS_RENEW_AHEAD_MS;
    if (!Number.isFinite(at)) return;
    const delay = Math.max(0, at - Date.now());
    if (delay > 2_147_483_647) return;
    const timer = setTimeout(() => {
      renewedAheadForRef.current = hlsExpiresAt;
      renewHls("ahead");
    }, delay);
    return () => clearTimeout(timer);
  }, [attached, hlsExpiresAt, renewHls]);

  // Loaded media re-arms the 403 renewal and ends a pending resume (both paths). Natively, the
  // playlist's metadata is the source being ready; a play pressed before then is remembered.
  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (!media || !isHls) return;
    const loaded = () => {
      hlsArmedRef.current = true;
      pendingResumeRef.current = null;
    };
    const ready = () => {
      if (!hlsJsActiveRef.current) sourceReadyRef.current = true;
    };
    const play = () => {
      if (!sourceReadyRef.current) wantPlayRef.current = true;
    };
    const pause = () => {
      // A pause the viewer asked for (not the element resetting for a new source).
      if (sourceReadyRef.current) wantPlayRef.current = false;
    };
    media.addEventListener("loadeddata", loaded);
    media.addEventListener("loadedmetadata", ready);
    media.addEventListener("play", play);
    media.addEventListener("pause", pause);
    return () => {
      media.removeEventListener("loadeddata", loaded);
      media.removeEventListener("loadedmetadata", ready);
      media.removeEventListener("play", play);
      media.removeEventListener("pause", pause);
    };
  }, [isHls]);

  const handleMediaError = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const media = event.currentTarget;
    if (hlsJsActiveRef.current) return props.onError?.(event);
    if (!media.getAttribute("src")) return props.onError?.(event);
    if (isHls) {
      // Native HLS hides the status code: a failure after the playlist loaded is treated as an
      // expiry once; `renewHls` shows the card when it isn't armed.
      renewHls("forbidden");
      props.onError?.(event);
      return;
    }
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

  /*
    `preserveFocus`: `true` keeps the controls while focus is anywhere in the frame (a blur moving
    between controls); `"keyboard"` keeps them only for a keyboard user's visible focus (the idle
    hide while playing — a clicked button keeps focus in Chromium and must not hold them forever);
    `false` hides regardless (the pointer left).
  */
  const scheduleControlsHide = React.useCallback(
    (
      preserveFocus: boolean | "keyboard" = true,
      delay = VIDEO_CONTROLS_HIDE_DELAY_MS,
    ) => {
      // Read through refs at call time, so the scheduler stays stable across pause/resume and
      // a listener holding it never sees a stale "pinned".
      if (externallyPinnedRef.current || pausedPinnedRef.current) return;
      clearHideTimer();

      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        if (pausedPinnedRef.current) return;
        const active = document.activeElement;
        const focusInside = Boolean(frameRef.current?.contains(active));
        if (
          focusInside &&
          (preserveFocus === true ||
            (preserveFocus === "keyboard" &&
              active instanceof HTMLElement &&
              active.matches(":focus-visible")))
        ) {
          return;
        }
        if (focusInside) frameRef.current?.focus();
        setAutoControlsVisible(false);
        unmountTimerRef.current = setTimeout(() => {
          unmountTimerRef.current = null;
          if (!pausedPinnedRef.current) setControlsRendered(false);
        }, VIDEO_CONTROLS_FADE_MS);
      }, delay);
    },
    [clearHideTimer],
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

  // The pointer moving over a playing video brings the controls back and restarts the idle timer.
  const handlePointerMove = React.useCallback(() => {
    if (!autoVisibleRef.current) showControls();
    const media = internalMediaRef.current;
    if (media && !media.paused)
      scheduleControlsHide("keyboard", VIDEO_CONTROLS_IDLE_MS);
  }, [scheduleControlsHide, showControls]);

  // Play: the controls step aside after the idle delay. Pause after playing (or the end): they
  // stay up until playback resumes.
  const hasPlayedRef = React.useRef(false);
  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (!media) return;
    const onPlay = () => {
      hasPlayedRef.current = true;
      setPausedPinned(false);
      pausedPinnedRef.current = false;
      if (autoVisibleRef.current)
        scheduleControlsHide("keyboard", VIDEO_CONTROLS_IDLE_MS);
    };
    const onPause = () => {
      if (!hasPlayedRef.current) return;
      clearHideTimer();
      clearUnmountTimer();
      pausedPinnedRef.current = true;
      setPausedPinned(true);
      setControlsRendered(true);
    };
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);
    media.addEventListener("ended", onPause);
    return () => {
      media.removeEventListener("play", onPlay);
      media.removeEventListener("pause", onPause);
      media.removeEventListener("ended", onPause);
    };
  }, [clearHideTimer, clearUnmountTimer, scheduleControlsHide]);

  const handleControlsFocus = React.useCallback(() => {
    clearHideTimer();
    setAutoControlsVisible(true);
  }, [clearHideTimer]);

  // Pinned open: mount the overlay up front so it is in the DOM on first paint
  // (a static fixture never receives a pointer or focus event to reveal it).
  React.useEffect(() => {
    if (
      controlsVisibleProp === true ||
      (controlsVisibleProp == null && (coarsePointer || pausedPinned))
    )
      setControlsRendered(true);
  }, [controlsVisibleProp, coarsePointer, pausedPinned]);

  const handleControlsBlur = React.useCallback(() => {
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  // The frame goes fullscreen (so the controls come with it); Safari's prefixed API next; iOS
  // Safari can only fullscreen the <video> itself, in its system player.
  const toggleFullscreen = React.useCallback(() => {
    const frame = frameRef.current as WebkitElement | null;
    if (!frame) return;
    const doc = document as WebkitDocument;

    if (fullscreenElement() === frame) {
      if (typeof doc.exitFullscreen === "function")
        void doc.exitFullscreen().catch(() => {});
      else doc.webkitExitFullscreen?.();
      return;
    }

    if (typeof frame.requestFullscreen === "function") {
      void Promise.resolve(frame.requestFullscreen()).catch(() => {});
    } else if (typeof frame.webkitRequestFullscreen === "function") {
      frame.webkitRequestFullscreen();
    } else {
      (
        internalMediaRef.current as WebkitVideo | null
      )?.webkitEnterFullscreen?.();
    }
  }, []);

  // ── Picture in picture ───────────────────────────────────────────────────
  const [pipSupported, setPipSupported] = React.useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = React.useState(false);
  React.useEffect(() => {
    const media = internalMediaRef.current as WebkitVideo | null;
    if (!media) return;
    const standard =
      document.pictureInPictureEnabled === true &&
      typeof media.requestPictureInPicture === "function";
    const webkit =
      typeof media.webkitSupportsPresentationMode === "function" &&
      media.webkitSupportsPresentationMode("picture-in-picture");
    setPipSupported(standard || webkit);
    const sync = () =>
      setIsPictureInPicture(
        document.pictureInPictureElement === media ||
          media.webkitPresentationMode === "picture-in-picture",
      );
    media.addEventListener("enterpictureinpicture", sync);
    media.addEventListener("leavepictureinpicture", sync);
    media.addEventListener("webkitpresentationmodechanged", sync);
    return () => {
      media.removeEventListener("enterpictureinpicture", sync);
      media.removeEventListener("leavepictureinpicture", sync);
      media.removeEventListener("webkitpresentationmodechanged", sync);
    };
  }, []);
  const togglePictureInPicture = React.useCallback(() => {
    const media = internalMediaRef.current as WebkitVideo | null;
    if (!media) return;
    if (document.pictureInPictureElement === media) {
      void document.exitPictureInPicture().catch(() => {});
    } else if (typeof media.requestPictureInPicture === "function") {
      void media.requestPictureInPicture().catch(() => {});
    } else if (media.webkitSetPresentationMode) {
      media.webkitSetPresentationMode(
        media.webkitPresentationMode === "picture-in-picture"
          ? "inline"
          : "picture-in-picture",
      );
    }
  }, []);

  // ── Captions ─────────────────────────────────────────────────────────────
  // Off until the viewer turns them on; the choice is remembered on this device.
  const [captionsOn, setCaptionsOn] = React.useState(false);
  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(CAPTIONS_STORAGE_KEY) === "on")
        setCaptionsOn(true);
    } catch {
      // Storage blocked (a private window): captions start off.
    }
  }, []);
  const captionsOnRef = React.useRef(captionsOn);
  React.useLayoutEffect(() => {
    captionsOnRef.current = captionsOn;
  });
  const toggleCaptions = React.useCallback(() => {
    const next = !captionsOnRef.current;
    captionsOnRef.current = next;
    setCaptionsOn(next);
    try {
      window.localStorage.setItem(CAPTIONS_STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Storage blocked: the choice lasts for this page.
    }
  }, []);
  const captionsSrc = captions?.src;
  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (!media || !captionsSrc) return;
    const apply = () => {
      for (const track of Array.from(media.textTracks)) {
        if (track.kind === "captions" || track.kind === "subtitles")
          track.mode = captionsOn ? "showing" : "hidden";
      }
    };
    apply();
    media.textTracks.addEventListener?.("addtrack", apply);
    media.addEventListener("loadedmetadata", apply);
    return () => {
      media.textTracks.removeEventListener?.("addtrack", apply);
      media.removeEventListener("loadedmetadata", apply);
    };
  }, [captionsOn, captionsSrc]);

  // ── Skip ranges ──────────────────────────────────────────────────────────
  const skipKey = skipRanges ? JSON.stringify(skipRanges) : "";
  const ranges = React.useMemo(
    () => normalizeSkipRanges(skipRanges),
    // Keyed on the values, so an inline array doesn't rebuild the timeline every render.
    [skipKey],
  );
  const timeline = React.useMemo(
    () => (ranges.length ? skipTimeline(ranges) : undefined),
    [ranges],
  );
  React.useEffect(() => {
    const media = internalMediaRef.current as WebkitVideo | null;
    if (!media || !ranges.length) return;
    const skip = () => {
      const t = media.currentTime;
      const range = ranges.find(([from, to]) => t >= from && t < to - 0.01);
      if (range) media.currentTime = clampTime(media, range[1]);
    };
    // `timeupdate` fires about four times a second; a frame callback catches a range within a
    // frame where the browser has one. One chain at a time: paused stops it, play restarts it.
    const frames = typeof media.requestVideoFrameCallback === "function";
    let frameHandle: number | null = null;
    let disposed = false;
    const stopFrames = () => {
      if (frameHandle !== null) media.cancelVideoFrameCallback(frameHandle);
      frameHandle = null;
    };
    const onFrame = () => {
      frameHandle = null;
      if (disposed) return;
      skip();
      if (!media.paused) frameHandle = media.requestVideoFrameCallback(onFrame);
    };
    const startFrames = () => {
      if (frames && frameHandle === null && !disposed)
        frameHandle = media.requestVideoFrameCallback(onFrame);
    };
    media.addEventListener("timeupdate", skip);
    media.addEventListener("seeked", skip);
    media.addEventListener("play", startFrames);
    media.addEventListener("pause", stopFrames);
    if (!media.paused) startFrames();
    return () => {
      disposed = true;
      media.removeEventListener("timeupdate", skip);
      media.removeEventListener("seeked", skip);
      media.removeEventListener("play", startFrames);
      media.removeEventListener("pause", stopFrames);
      stopFrames();
    };
  }, [ranges]);

  // ── Loading ──────────────────────────────────────────────────────────────
  const [waiting, setWaiting] = React.useState(false);
  const [showLoading, setShowLoading] = React.useState(false);
  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (!media) return;
    const start = () => setWaiting(true);
    const stop = () => setWaiting(false);
    media.addEventListener("waiting", start);
    for (const name of ["playing", "pause", "canplay", "error", "emptied"])
      media.addEventListener(name, stop);
    return () => {
      media.removeEventListener("waiting", start);
      for (const name of ["playing", "pause", "canplay", "error", "emptied"])
        media.removeEventListener(name, stop);
    };
  }, []);
  React.useEffect(() => {
    if (!waiting) {
      setShowLoading(false);
      return;
    }
    const timer = setTimeout(
      () => setShowLoading(true),
      VIDEO_LOADING_REVEAL_MS,
    );
    return () => clearTimeout(timer);
  }, [waiting]);

  // ── Time and imperative control ──────────────────────────────────────────
  const onTimeUpdateRef = React.useRef(onTimeUpdate);
  React.useLayoutEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  });
  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (!media) return;
    const report = () =>
      onTimeUpdateRef.current?.(Math.round(media.currentTime * 1000));
    media.addEventListener("timeupdate", report);
    return () => media.removeEventListener("timeupdate", report);
  }, []);
  React.useImperativeHandle(
    controllerRef,
    () => ({
      seekTo: (ms: number) => {
        const media = internalMediaRef.current;
        if (media) media.currentTime = clampTime(media, ms / 1000);
      },
      play: () => {
        const media = internalMediaRef.current;
        if (!media) return Promise.resolve();
        if (isHls && !sourceReadyRef.current) {
          wantPlayRef.current = true;
          setAttached(true);
          return Promise.resolve();
        }
        return media.play();
      },
      pause: () => {
        wantPlayRef.current = false;
        if (pendingSeekRef.current) pendingSeekRef.current.play = false;
        if (pendingResumeRef.current) pendingResumeRef.current.play = false;
        internalMediaRef.current?.pause();
      },
      currentMs: () =>
        Math.round((internalMediaRef.current?.currentTime ?? 0) * 1000),
    }),
    [isHls],
  );

  /*
    ONE shortcut map, shared with the controls group (audit B4-02). Space/K
    play, J/L and the arrows skip, M mutes, F toggles fullscreen. It used to be
    implemented twice — here and inside the controls — and the two had already
    drifted: the controls copy never handled F.
  */
  const { runShortcut } = useMediaShortcuts({
    mediaRef: controlsMediaRef,
    skipSeconds,
    arrowSkipSeconds,
    onFullscreenToggle: toggleFullscreen,
    onCaptionsToggle: captions ? toggleCaptions : undefined,
    onPictureInPictureToggle: pipSupported ? togglePictureInPicture : undefined,
    rateSteps: playbackRates,
    videoKeys: true,
    timeline,
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
      setIsFullscreen(fullscreenElement() === frameRef.current);
    };

    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
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
        onPointerEnter={() => {
          if (attach === "interaction") attachOnInteraction();
          showControls();
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onFocusCapture={() => {
          if (attach === "interaction") attachOnInteraction();
          handleControlsFocus();
        }}
        onBlurCapture={handleControlsBlur}
        onPointerDown={attachOnInteraction}
        onKeyDownCapture={() => {
          attachOnInteraction();
          showControls();
        }}
        onKeyDown={handleFrameKeyDown}
        tabIndex={0}
        role="group"
        aria-label={`${label} video player`}
        className={cn(
          "relative overflow-hidden rounded-block bg-muted",
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
          crossOrigin={
            props.crossOrigin ?? (captions ? "anonymous" : undefined)
          }
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
        >
          {captions ? (
            <track
              kind="captions"
              src={captions.src}
              label={captions.label}
              srcLang={captions.srclang}
            />
          ) : null}
        </video>

        {showLoading && !loadFailed ? (
          <div
            data-slot="video-player-loading"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="flex size-12 items-center justify-center rounded-capsule bg-media-scrim-strong text-2xl">
              <TextSpinner label="Loading" className="text-media-foreground" />
            </span>
          </div>
        ) : null}

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
              timeline={timeline}
              chapters={chapters}
              markers={markers}
              arrowSkipSeconds={arrowSkipSeconds}
              captionsEnabled={captionsOn}
              onCaptionsToggle={captions ? toggleCaptions : undefined}
              isPictureInPicture={isPictureInPicture}
              onPictureInPictureToggle={
                pipSupported ? togglePictureInPicture : undefined
              }
              variant="overlay"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
