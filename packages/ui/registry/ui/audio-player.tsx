// @vegastack audio-player@0.23.2 sha256-+xUDL0OifdF20zaTpIgBmhedtaU9zOESP0YXPCCBknw=

"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  MediaPlayerControls,
  clampTime,
  type MediaPlayerControlsProps,
} from "@/components/ui/media-player-controls";
import { Spinner } from "@/components/ui/spinner";
import { useAnnouncer } from "@/components/ui/use-announcer";

// Audio's tappable speed control cycles these in order, starting at 1x:
// 1 → 1.25 → 1.5 → 2 → 0.5 → back to 1. Deliberately not sorted — the cycle
// follows array order, and 0.5 sits last so a tap from 1x speeds up first.
const DEFAULT_AUDIO_PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.5] as const;

// Number of amplitude bars sampled from decoded audio for the waveform seek.
// Denser bars read as thinner lines than a coarse count at the same width.
const WAVEFORM_BAR_COUNT = 128;
// Flat placeholder bars shown before decode completes or when decoding fails —
// the seek stays fully operable; only the visual amplitude is a level fallback.
const WAVEFORM_FLAT_BARS: readonly number[] = Array.from(
  { length: WAVEFORM_BAR_COUNT },
  () => 0.2,
);

/**
 * Reduce a decoded `AudioBuffer` to `barCount` normalized (0–1) RMS amplitudes,
 * one per waveform bar. Uses the first channel; peaks are scaled to the loudest
 * bucket so quiet tracks still fill the height.
 */
function samplePeaks(buffer: AudioBuffer, barCount: number): number[] {
  const channel = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channel.length / barCount));
  const peaks: number[] = [];
  let max = 0;
  for (let bar = 0; bar < barCount; bar += 1) {
    const start = bar * blockSize;
    let sum = 0;
    for (let offset = 0; offset < blockSize; offset += 1) {
      const sample = channel[start + offset] ?? 0;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / blockSize);
    peaks.push(rms);
    if (rms > max) max = rms;
  }
  return max > 0 ? peaks.map((peak) => peak / max) : peaks;
}

/**
 * Fetch and decode `src` via Web Audio, returning normalized waveform peaks.
 * Runs only while `enabled`; aborts the fetch and closes the `AudioContext` on
 * unmount or `src` change. Returns `[]` before decode completes or on failure —
 * the waveform seek falls back to flat placeholder bars and stays operable.
 */
function useAudioPeaks(src: string, enabled: boolean): readonly number[] {
  const [peaks, setPeaks] = React.useState<readonly number[]>([]);

  React.useEffect(() => {
    if (!enabled || !src || typeof window === "undefined") {
      setPeaks([]);
      return;
    }

    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;

    const controller = new AbortController();
    let context: AudioContext | null = null;
    let cancelled = false;

    const closeContext = () => {
      const pending = context;
      context = null;
      if (pending) void pending.close().catch(() => {});
    };

    void (async () => {
      try {
        const response = await fetch(src, { signal: controller.signal });
        const bytes = await response.arrayBuffer();
        if (cancelled) return;
        context = new AudioContextCtor();
        const audioBuffer = await context.decodeAudioData(bytes);
        if (cancelled) return;
        setPeaks(samplePeaks(audioBuffer, WAVEFORM_BAR_COUNT));
      } catch {
        if (!cancelled) setPeaks([]);
      } finally {
        closeContext();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      closeContext();
    };
  }, [src, enabled]);

  return peaks;
}

/**
 * Imperative handle for driving a player from outside it — a transcript line,
 * a chapter list, a "jump to" link. Attach it through `actionsRef`.
 */
export type AudioPlayerActions = {
  /**
   * Move playback to `seconds` (clamped to the track). Before the metadata has
   * loaded the seek is queued and applied on `loadedmetadata`; a lazy `src` is
   * resolved so the metadata can load. Pass `{ play: true }` to start playback
   * too.
   */
  seek(seconds: number, opts?: { play?: boolean }): void;
  /** Start playback (resolving a lazy `src` first). */
  play(): void;
  /** Pause playback. */
  pause(): void;
};

/** A play() caller waiting on a lazy source. */
interface PendingPlay {
  resolve: () => void;
  reject: (reason: unknown) => void;
}

/** Props accepted by `AudioPlayer`. */
export interface AudioPlayerProps extends Omit<
  React.ComponentPropsWithRef<"audio">,
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
   * Audio source URL, or a function that resolves one — a signed URL fetched
   * only when someone listens. The function is called once, on the first play
   * (or the first `actionsRef` seek), and its result is kept; "Try again"
   * calls it afresh. To load a different recording, remount the player with a
   * new `key`.
   */
  src: string | (() => Promise<string>);
  /**
   * Accessible label used by the audio element and custom controls.
   * @default 'Audio'
   */
  label?: string;
  /**
   * Optional visible title shown above the transport.
   * @default undefined
   */
  title?: React.ReactNode;
  /**
   * Optional visible description shown below the title.
   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * Classes applied to the outer player container.
   * @default undefined
   */
  className?: string;
  /**
   * Ref for the hidden native `<audio>` media engine.
   * @default undefined
   */
  mediaRef?: React.Ref<HTMLAudioElement>;
  /**
   * Ref for the outer player container.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
  /**
   * Seconds moved by the visible rewind/forward buttons and the keyboard skip.
   * @default 15
   */
  skipSeconds?: MediaPlayerControlsProps["skipSeconds"];
  /**
   * Playback rates cycled by the tappable speed control, in tap order. Each tap
   * advances to the next entry and wraps past the end.
   * @default [1, 1.25, 1.5, 2, 0.5]
   */
  playbackRates?: MediaPlayerControlsProps["playbackRates"];
  /**
   * Initial playback rate applied when the audio element mounts.
   * @default 1
   */
  defaultPlaybackRate?: MediaPlayerControlsProps["defaultPlaybackRate"];
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
   * Called when the transcript control is pressed on a narrow, mobile-width
   * player — wire it to open the consumer app's transcript. When omitted, the
   * transcript control is not rendered.
   * @default undefined
   */
  onTranscriptClick?: MediaPlayerControlsProps["onTranscriptClick"];
  /**
   * Seek presentation. `waveform` renders a decoded-audio waveform in place of
   * the seek slider; the slider's keyboard and pointer semantics are preserved
   * beneath the bars.
   * @default 'default'
   */
  variant?: "default" | "waveform";
  /**
   * Dock the player to the bottom of its scroll column: `position: sticky`
   * with a border, the popover surface and a shadow, padded clear of the
   * bottom safe-area inset. A docked player is a `region` named by `label`.
   * @default false
   */
  docked?: boolean;
  /**
   * Whether the player is shown. It stays mounted while hidden (`inert`,
   * `data-active="false"`, and a docked player slides out with the
   * docked-control pair), so playback state survives a hide.
   * @default true
   */
  open?: boolean;
  /**
   * Called when the close button asks to hide the player. Passing it renders
   * the close button. Escape does not close the player.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Accessible name of the close button. The close pauses playback, calls
   * `onOpenChange(false)` and returns focus to the element that opened the
   * player.
   * @default "Close player"
   */
  closeLabel?: string;
  /**
   * The source is loading. Shows a status line with `loadingLabel` and
   * announces it once. A lazy `src` that is resolving counts as loading too.
   * @default false
   */
  loading?: boolean;
  /**
   * Text shown and announced while loading.
   * @default "Loading audio…"
   */
  loadingLabel?: string;
  /**
   * A load failure. Renders a `role="alert"` line with a retry button. The player also shows
   * `loadErrorLabel` on its own when a lazy `src` rejects or the media fails to load.
   * @default undefined
   */
  error?: React.ReactNode;
  /**
   * The error line when the player's own load fails and no `error` is given.
   * @default "Couldn’t load the recording"
   */
  loadErrorLabel?: string;
  /**
   * Label of the retry button shown with `error`.
   * @default "Try again"
   */
  retryLabel?: string;
  /**
   * Called when the retry button is pressed, after the player reloads its
   * source (a lazy `src` is resolved again). Clear `error` here.
   * @default undefined
   */
  onRetry?: () => void;
  /**
   * Renew an expired source. When the media fails to load after it had a URL — a signed URL
   * that has expired — the player calls this once, loads the URL it resolves, and resumes at the
   * same position (playing, if it was). A second failure, or a rejection, shows the error line;
   * "Try again" and a new `src` re-arm it. Without it, a media error goes straight to the error.
   * @default undefined
   */
  onSourceExpired?: () => Promise<string>;
  /**
   * Imperative `seek` / `play` / `pause` for driving the player from outside.
   * @default undefined
   */
  actionsRef?: React.Ref<AudioPlayerActions>;
}

/**
 * `AudioPlayer` — a compact, tokenized audio transport with play/pause,
 * seek, elapsed/duration labels, mute + volume, playback speed, and keyboard
 * skip/mute shortcuts. A single line on a wide player; on a narrow, mobile-width
 * player it reflows to two lines (seek and timers on top; centred transport with
 * an optional transcript control below). The native `<audio>` element supplies
 * the media engine; the transport itself is `MediaPlayerControls`, the same item
 * `VideoPlayer` composes, so audio and video share one surface and one keyboard
 * map.
 *
 * Pass `docked` to pin it to the bottom of a scroll column, `open` and
 * `onOpenChange` to hide it with a close button, a function `src` to resolve a
 * signed URL on first play, and `actionsRef` to seek it from a transcript.
 *
 * @example
 * <AudioPlayer src="/media/demo.mp3" label="Product demo audio" />
 */
export function AudioPlayer({
  className,
  src,
  label = "Audio",
  title,
  description,
  mediaRef,
  skipSeconds,
  playbackRates = DEFAULT_AUDIO_PLAYBACK_RATES,
  defaultPlaybackRate,
  formatTime,
  onPlayStateChange,
  onTimeChange,
  onPlaybackRateChange,
  onTranscriptClick,
  variant = "default",
  preload = "metadata",
  docked = false,
  open,
  onOpenChange,
  closeLabel = "Close player",
  loading = false,
  loadingLabel = "Loading audio…",
  error,
  loadErrorLabel = "Couldn’t load the recording",
  retryLabel = "Try again",
  onRetry,
  onSourceExpired,
  actionsRef,
  ref,
  ...props
}: AudioPlayerProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const internalMediaRef = React.useRef<HTMLAudioElement | null>(null);
  const controlsMediaRef =
    internalMediaRef as React.RefObject<HTMLMediaElement | null>;
  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const setAudioRef = React.useMemo(
    () => mergeRefs(internalMediaRef, mediaRef),
    [mediaRef],
  );

  // ── Lazy source ──────────────────────────────────────────────────────────
  // The function is read through a ref, so an inline arrow (a new identity on
  // every render) never re-resolves or drops the loaded URL.
  const srcRef = React.useRef(src);
  React.useLayoutEffect(() => {
    srcRef.current = src;
  });
  const isLazy = typeof src === "function";
  const [resolvedUrl, setResolvedUrl] = React.useState<string>();
  const [resolving, setResolving] = React.useState(false);
  const baseSrc = typeof src === "string" ? src : resolvedUrl;
  // A URL `onSourceExpired` renewed stands in for the base one until the base changes. The
  // renewal runs once per base URL; "Try again" re-arms it.
  const [renewed, setRenewed] = React.useState<{
    from: string | undefined;
    url: string;
  }>();
  const audioSrc = renewed && renewed.from === baseSrc ? renewed.url : baseSrc;
  const renewalArmedRef = React.useRef(true);
  // Bumped when the base URL changes or "Try again" starts, so a renewal still in flight from
  // before can neither swap the URL nor queue its old position onto the new source.
  const renewalSeqRef = React.useRef(0);
  React.useEffect(() => {
    renewalArmedRef.current = true;
    renewalSeqRef.current += 1;
  }, [baseSrc]);
  const onSourceExpiredRef = React.useRef(onSourceExpired);
  React.useLayoutEffect(() => {
    onSourceExpiredRef.current = onSourceExpired;
  });
  const resolutionRef = React.useRef<Promise<void> | null>(null);
  const pendingPlaysRef = React.useRef<PendingPlay[]>([]);

  // DS-77: the player's own load failure (a rejected lazy `src`, a media `error` event).
  const [loadFailed, setLoadFailed] = React.useState(false);
  // A new URL starts clean; a lazy function is often an inline arrow, so only retry clears it.
  const urlSrc = typeof src === "function" ? null : src;
  React.useEffect(() => setLoadFailed(false), [urlSrc]);
  const ensureSource = React.useCallback((): Promise<void> => {
    const current = srcRef.current;
    if (typeof current !== "function") return Promise.resolve();
    if (resolutionRef.current) return resolutionRef.current;
    setResolving(true);
    const attempt: Promise<void> = new Promise<string>((resolve) =>
      resolve(current()),
    )
      .then(
        (url) => {
          if (resolutionRef.current === attempt) setResolvedUrl(url);
        },
        (reason: unknown) => {
          // A failed resolution is forgotten, so the next play tries again.
          if (resolutionRef.current === attempt) {
            resolutionRef.current = null;
            setLoadFailed(true);
          }
          throw reason;
        },
      )
      .finally(() => setResolving(false));
    resolutionRef.current = attempt;
    return attempt;
  }, []);

  // Until a lazy source has a URL, `play()` on the media element — from the
  // transport, a shortcut, `mediaRef` or `actionsRef` — resolves it first and
  // then plays once the URL is committed. The native method is never reached
  // with no source, so the transport never sees a spurious rejection.
  React.useLayoutEffect(() => {
    const media = internalMediaRef.current;
    if (!media) return;
    if (isLazy && audioSrc === undefined) {
      Object.defineProperty(media, "play", {
        configurable: true,
        writable: true,
        value: () =>
          new Promise<void>((resolve, reject) => {
            pendingPlaysRef.current.push({ resolve, reject });
            ensureSource().catch((reason: unknown) => {
              for (const waiting of pendingPlaysRef.current.splice(0)) {
                waiting.reject(reason);
              }
            });
          }),
      });
      return () => {
        delete (media as { play?: unknown }).play;
      };
    }
    const waiting = pendingPlaysRef.current.splice(0);
    if (waiting.length === 0) return;
    const started = media.play();
    for (const caller of waiting) started.then(caller.resolve, caller.reject);
  }, [audioSrc, ensureSource, isLazy]);

  const isWaveform = variant === "waveform";
  const waveformPeaks = useAudioPeaks(audioSrc ?? "", isWaveform);

  // ── Imperative seek ──────────────────────────────────────────────────────
  const pendingSeekRef = React.useRef<{
    seconds: number;
    play: boolean;
  } | null>(null);

  React.useEffect(() => {
    const media = internalMediaRef.current;
    if (!media) return;
    const applyQueuedSeek = () => {
      const queued = pendingSeekRef.current;
      if (!queued) return;
      pendingSeekRef.current = null;
      media.currentTime = clampTime(media, queued.seconds);
      if (queued.play) void media.play().catch(() => {});
    };
    media.addEventListener("loadedmetadata", applyQueuedSeek);
    return () => media.removeEventListener("loadedmetadata", applyQueuedSeek);
  }, []);

  React.useImperativeHandle(
    actionsRef,
    (): AudioPlayerActions => ({
      seek(seconds, opts) {
        const media = internalMediaRef.current;
        if (!media) return;
        const play = opts?.play === true;
        if (media.readyState >= HTMLMediaElement.HAVE_METADATA) {
          media.currentTime = clampTime(media, seconds);
          if (play) void media.play().catch(() => {});
          return;
        }
        pendingSeekRef.current = { seconds, play };
        if (play) void media.play().catch(() => {});
        else void ensureSource().catch(() => {});
      },
      play() {
        void internalMediaRef.current?.play().catch(() => {});
      },
      pause() {
        internalMediaRef.current?.pause();
      },
    }),
    [ensureSource],
  );

  // ── Open / close ─────────────────────────────────────────────────────────
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(true);
  const isOpen = open ?? uncontrolledOpen;
  const openerRef = React.useRef<HTMLElement | null>(null);

  // Remember what had focus when the player opened, to hand focus back on close.
  React.useLayoutEffect(() => {
    if (!isOpen) return;
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      !rootRef.current?.contains(active)
    ) {
      openerRef.current = active;
    }
  }, [isOpen]);

  const handleClose = () => {
    internalMediaRef.current?.pause();
    setUncontrolledOpen(false);
    onOpenChange?.(false);
    const opener = openerRef.current;
    if (opener?.isConnected) opener.focus();
  };

  // ── Loading and error ────────────────────────────────────────────────────
  const hasError = (error != null && error !== false) || loadFailed;
  const isLoading = (loading || resolving) && !hasError;
  const { announce, Announcer } = useAnnouncer();
  const announcedLoadingRef = React.useRef(false);
  React.useEffect(() => {
    // Announce the transition into loading once — never on a re-render while
    // it lasts.
    if (isLoading && !announcedLoadingRef.current) announce(loadingLabel);
    announcedLoadingRef.current = isLoading;
  }, [announce, isLoading, loadingLabel]);

  const handleRetry = () => {
    setLoadFailed(false);
    renewalArmedRef.current = true;
    renewalSeqRef.current += 1;
    setRenewed(undefined);
    if (typeof srcRef.current === "function") {
      resolutionRef.current = null;
      setResolvedUrl(undefined);
      void ensureSource().catch(() => {});
    } else {
      internalMediaRef.current?.load();
    }
    onRetry?.();
  };

  const showClose = onOpenChange != null;

  return (
    <div
      ref={setRootRef}
      data-slot="audio-player"
      data-variant={variant}
      data-docked={docked ? "" : undefined}
      data-active={isOpen ? "true" : "false"}
      data-state={hasError ? "error" : isLoading ? "loading" : "idle"}
      role={docked ? "region" : undefined}
      aria-label={docked ? label : undefined}
      aria-busy={isLoading || undefined}
      // A hidden player keeps no focusable, activatable controls; it stays
      // mounted so the exit transition and the playback state survive.
      inert={!isOpen || undefined}
      className={cn(
        "flex w-full flex-col gap-2",
        docked && [
          "sticky bottom-0 z-10 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md",
          // Pinned to the bottom edge → clear the safe-area inset.
          "pb-[calc(var(--spacing)*3+env(safe-area-inset-bottom))]",
          // The shared docked-control pair; only the travel distance is ours.
          "data-[active=true]:motion-dock-in data-[active=true]:translate-y-0 data-[active=false]:motion-dock-out data-[active=false]:translate-y-[calc(100%+env(safe-area-inset-bottom))]",
        ],
        !docked && !isOpen && "hidden",
        className,
      )}
    >
      {title || description || showClose ? (
        <div data-slot="audio-player-header" className="flex min-w-0 gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
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
          {showClose ? (
            <Button
              data-slot="audio-player-close"
              variant="ghost"
              size="icon-sm"
              aria-label={closeLabel}
              className="-me-1 -mt-1 shrink-0"
              onClick={handleClose}
            >
              <XIcon aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ) : null}

      <audio
        {...props}
        ref={setAudioRef}
        src={audioSrc}
        preload={preload}
        aria-label={label}
        className="hidden"
        onError={(event) => {
          const media = event.currentTarget;
          if (!media.getAttribute("src")) return props.onError?.(event);
          const renew = onSourceExpiredRef.current;
          if (renew && renewalArmedRef.current) {
            // An expired signed URL: renew it once and pick up where playback stopped. The
            // queued seek lands on the new URL's `loadedmetadata`.
            renewalArmedRef.current = false;
            const from = baseSrc;
            const resumeAt =
              pendingSeekRef.current ??
              (media.currentTime > 0 || !media.paused
                ? { seconds: media.currentTime, play: !media.paused }
                : null);
            const seq = renewalSeqRef.current;
            // Through a promise chain, so a synchronous throw lands in the error state too.
            void Promise.resolve()
              .then(() => renew())
              .then(
                (url) => {
                  if (seq !== renewalSeqRef.current) return;
                  pendingSeekRef.current = resumeAt;
                  setRenewed({ from, url });
                },
                () => {
                  if (seq === renewalSeqRef.current) setLoadFailed(true);
                },
              );
            return;
          }
          setLoadFailed(true);
          props.onError?.(event);
        }}
      />

      <MediaPlayerControls
        mediaRef={controlsMediaRef}
        label={label}
        skipSeconds={skipSeconds}
        playbackRates={playbackRates}
        defaultPlaybackRate={defaultPlaybackRate}
        formatTime={formatTime}
        onPlayStateChange={onPlayStateChange}
        onTimeChange={onTimeChange}
        onPlaybackRateChange={onPlaybackRateChange}
        onTranscriptClick={onTranscriptClick}
        seekVariant={isWaveform ? "waveform" : "slider"}
        waveformPeaks={waveformPeaks}
        waveformFlatPeaks={WAVEFORM_FLAT_BARS}
      />

      {isLoading ? (
        <div
          data-slot="audio-player-status"
          className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
        >
          <Spinner
            className="size-3.5"
            aria-hidden
            role={undefined}
            aria-label={undefined}
          />
          <span className="truncate">{loadingLabel}</span>
        </div>
      ) : null}

      {hasError ? (
        <div
          data-slot="audio-player-error"
          className="flex min-w-0 flex-wrap items-center gap-2"
        >
          <p
            role="alert"
            className="min-w-0 flex-1 text-sm text-destructive-text"
          >
            {error != null && error !== false ? error : loadErrorLabel}
          </p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}

      <Announcer />
    </div>
  );
}
