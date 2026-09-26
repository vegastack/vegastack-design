// @vegastack audio-player@0.23.40 sha256-mbcdYVYnZ7mNUuMNwYEAK0Be7sWc9Jqbk/3Yrfip5O0=

"use client";

import * as React from "react";
import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
  XIcon,
} from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  MediaPlayerControls,
  clampTime,
  formatDefaultTime,
  getMediaDuration,
  type MediaPlayerControlsProps,
} from "@/components/ui/media-player-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
   * Presentation. `waveform` renders a decoded-audio waveform in place of the
   * seek slider (its keyboard and pointer semantics are preserved beneath the
   * bars). `floating` sits at the bottom of its flex column (`mt-auto`) and
   * centres on the main column: set `--audio-player-inset-end` on an ancestor to
   * the width an end rail takes (inside AppShell a RecordLayout rail sets 22rem
   * for you). It is a one-line pill — transport, seek, speed, volume, close; `title` is not shown — centred in
   * its container and sticky 16px above the bottom of its scroll column; below
   * the `sm` breakpoint it spans the full width on the bottom edge. A floating
   * player is a `region` named by `label`.
   * @default 'default'
   */
  variant?: "default" | "waveform" | "floating";
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
  const isFloating = variant === "floating";
  const isRegion = docked || isFloating;

  const closeButton = showClose ? (
    <Button
      data-slot="audio-player-close"
      variant="ghost"
      size="icon-sm"
      aria-label={closeLabel}
      className={cn("shrink-0", !isFloating && "-me-1 -mt-1")}
      onClick={handleClose}
    >
      <XIcon aria-hidden="true" />
    </Button>
  ) : null;

  return (
    <div
      ref={setRootRef}
      data-slot="audio-player"
      data-variant={variant}
      data-docked={docked ? "" : undefined}
      data-active={isOpen ? "true" : "false"}
      data-state={hasError ? "error" : isLoading ? "loading" : "idle"}
      role={isRegion ? "region" : undefined}
      aria-label={isRegion ? label : undefined}
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
        isFloating && [
          // Always at the bottom of its flex column (`mt-auto`), centred on the main
          // column: `--audio-player-inset-end` narrows and shifts it clear of an end
          // rail. Inside AppShell it is set for a RecordLayout rail automatically.
          "@5xl/app-shell-content:[:has([data-slot=record-layout-rail])_&]:[--audio-player-inset-end:22rem]",
          "w-[calc(100%-2rem-var(--audio-player-inset-end,0px))] -translate-x-[calc(var(--audio-player-inset-end,0px)/2)] rtl:translate-x-[calc(var(--audio-player-inset-end,0px)/2)]",
          "sticky bottom-4 z-20 mx-auto mt-auto max-w-3xl flex-row flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-border bg-popover p-1.5 text-popover-foreground shadow-md",
          // Phone: full width on the bottom edge, clear of the safe-area inset.
          "max-sm:bottom-0 max-sm:w-full max-sm:translate-x-0 max-sm:rounded-none max-sm:border-x-0 max-sm:border-b-0 max-sm:px-1 max-sm:pb-[calc(var(--spacing)*1+env(safe-area-inset-bottom))]",
          "data-[active=true]:motion-dock-in data-[active=true]:translate-y-0 data-[active=false]:motion-dock-out data-[active=false]:translate-y-[calc(100%+var(--spacing)*4+env(safe-area-inset-bottom))]",
        ],
        !docked && !isFloating && !isOpen && "hidden",
        className,
      )}
    >
      {!isFloating && (title || description || showClose) ? (
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
          {closeButton}
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

      {isFloating ? (
        <FloatingTransport
          mediaRef={internalMediaRef}
          label={label}
          skipSeconds={skipSeconds}
          playbackRates={playbackRates}
          defaultPlaybackRate={defaultPlaybackRate}
          formatTime={formatTime}
          onPlayStateChange={onPlayStateChange}
          onTimeChange={onTimeChange}
          onPlaybackRateChange={onPlaybackRateChange}
          closeButton={closeButton}
        />
      ) : (
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
      )}

      {isLoading ? (
        <div
          data-slot="audio-player-status"
          className="flex basis-full min-w-0 items-center gap-2 text-xs text-muted-foreground"
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
          className="flex basis-full min-w-0 flex-wrap items-center gap-2"
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

// ── Floating transport ───────────────────────────────────────────────────────
// The floating pill's own one-line transport: skip back · play · skip forward ·
// elapsed · seek · total · speed · volume. Every icon button is `size-8` ghost
// with `size-4` glyphs; play is the `size-9` filled primary. Space plays or
// pauses and ←/→ move 5s anywhere on the pill except a slider, which owns them.

const FLOATING_ICON_BUTTON = "size-8 shrink-0 rounded-full [&_svg]:size-4";
const FLOATING_KEY_SEEK = 5;

function FloatingTip({
  content,
  children,
}: {
  content: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}

function useMediaState(
  mediaRef: React.RefObject<HTMLAudioElement | null>,
  {
    onPlayStateChange,
    onTimeChange,
    onPlaybackRateChange,
    defaultPlaybackRate,
  }: Pick<
    AudioPlayerProps,
    | "onPlayStateChange"
    | "onTimeChange"
    | "onPlaybackRateChange"
    | "defaultPlaybackRate"
  >,
) {
  const [state, setState] = React.useState({
    playing: false,
    time: 0,
    duration: 0,
    buffered: 0,
    rate: defaultPlaybackRate ?? 1,
    volume: 1,
    muted: false,
  });
  const callbacksRef = React.useRef({
    onPlayStateChange,
    onTimeChange,
    onPlaybackRateChange,
  });
  React.useLayoutEffect(() => {
    callbacksRef.current = {
      onPlayStateChange,
      onTimeChange,
      onPlaybackRateChange,
    };
  });

  React.useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (defaultPlaybackRate) media.playbackRate = defaultPlaybackRate;
    const read = () => {
      const duration = getMediaDuration(media);
      const ranges = media.buffered;
      const buffered = ranges.length > 0 ? ranges.end(ranges.length - 1) : 0;
      setState({
        playing: !media.paused,
        time: media.currentTime,
        duration,
        buffered,
        rate: media.playbackRate,
        volume: media.volume,
        muted: media.muted,
      });
    };
    const onPlay = () => {
      read();
      callbacksRef.current.onPlayStateChange?.(!media.paused);
    };
    const onTime = () => {
      read();
      callbacksRef.current.onTimeChange?.(
        media.currentTime,
        getMediaDuration(media),
      );
    };
    const onRate = () => {
      read();
      callbacksRef.current.onPlaybackRateChange?.(media.playbackRate);
    };
    const events: [string, () => void][] = [
      ["play", onPlay],
      ["pause", onPlay],
      ["ended", onPlay],
      ["timeupdate", onTime],
      ["seeked", onTime],
      ["ratechange", onRate],
      ["durationchange", read],
      ["loadedmetadata", read],
      ["progress", read],
      ["volumechange", read],
    ];
    for (const [name, fn] of events) media.addEventListener(name, fn);
    read();
    return () => {
      for (const [name, fn] of events) media.removeEventListener(name, fn);
    };
  }, [mediaRef, defaultPlaybackRate]);

  return state;
}

function FloatingSeek({
  label,
  time,
  duration,
  buffered,
  formatTime,
  onSeek,
}: {
  label: string;
  time: number;
  duration: number;
  buffered: number;
  formatTime: (seconds: number) => string;
  onSeek: (seconds: number) => void;
}) {
  const [hover, setHover] = React.useState<{ x: number; at: number } | null>(
    null,
  );
  const pct = (value: number) =>
    duration > 0 ? `${Math.min(100, (value / duration) * 100)}%` : "0%";

  return (
    <div
      data-slot="audio-player-seek"
      className="group/seek relative flex h-8 min-w-0 flex-1 items-center"
      onPointerMove={(event) => {
        if (duration <= 0) return;
        const box = event.currentTarget.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - box.left, 0), box.width);
        setHover({ x, at: (x / box.width) * duration });
      }}
      onPointerLeave={() => setHover(null)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-muted"
      >
        <div
          data-slot="audio-player-buffered"
          className="h-full bg-muted-foreground/25"
          style={{ width: pct(buffered) }}
        />
      </div>
      <Slider
        value={[Math.min(time, duration)]}
        min={0}
        max={duration || 1}
        step={0.1}
        disabled={duration <= 0}
        aria-label={`${label} seek`}
        aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
        onValueChange={(value) =>
          onSeek(Array.isArray(value) ? (value[0] ?? 0) : (value as number))
        }
        className={cn(
          "relative",
          "[&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-range]]:bg-foreground",
          "[&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-foreground [&_[data-slot=slider-thumb]]:bg-foreground",
          "[&_[data-slot=slider-thumb]]:opacity-0 [&_[data-slot=slider-thumb]]:transition-opacity",
          "group-hover/seek:[&_[data-slot=slider-thumb]]:opacity-100 focus-within:[&_[data-slot=slider-thumb]]:opacity-100 [&_[data-slot=slider-thumb][data-dragging]]:opacity-100",
          "pointer-coarse:[&_[data-slot=slider-thumb]]:opacity-100",
        )}
      />
      {hover ? (
        <span
          aria-hidden
          data-slot="audio-player-seek-tooltip"
          className="pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium tabular-nums text-background"
          style={{ left: hover.x }}
        >
          {formatTime(hover.at)}
        </span>
      ) : null}
    </div>
  );
}

function FloatingTransport({
  mediaRef,
  label,
  skipSeconds = 10,
  playbackRates,
  defaultPlaybackRate,
  formatTime = formatDefaultTime,
  onPlayStateChange,
  onTimeChange,
  onPlaybackRateChange,
  closeButton,
}: Pick<
  AudioPlayerProps,
  | "skipSeconds"
  | "defaultPlaybackRate"
  | "onPlayStateChange"
  | "onTimeChange"
  | "onPlaybackRateChange"
> & {
  mediaRef: React.RefObject<HTMLAudioElement | null>;
  label: string;
  playbackRates: readonly number[];
  formatTime?: (seconds: number) => string;
  closeButton: React.ReactNode;
}) {
  const media = useMediaState(mediaRef, {
    onPlayStateChange,
    onTimeChange,
    onPlaybackRateChange,
    defaultPlaybackRate,
  });

  const toggle = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };
  const seekTo = (seconds: number) => {
    const el = mediaRef.current;
    if (el) el.currentTime = clampTime(el, seconds);
  };
  const skip = (delta: number) =>
    seekTo((mediaRef.current?.currentTime ?? 0) + delta);
  const sortedRates = [...playbackRates].sort((a, b) => a - b);
  const volume = media.muted ? 0 : media.volume;

  return (
    <div
      role="group"
      aria-label={`${label} controls`}
      data-slot="audio-player-transport"
      className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        const onSlider = target.closest("[data-slot=slider]") != null;
        if (event.key === " " && !target.closest("button")) {
          event.preventDefault();
          toggle();
        } else if (!onSlider && event.key === "ArrowLeft") {
          event.preventDefault();
          skip(-FLOATING_KEY_SEEK);
        } else if (!onSlider && event.key === "ArrowRight") {
          event.preventDefault();
          skip(FLOATING_KEY_SEEK);
        }
      }}
    >
      <div className="flex shrink-0 items-center gap-0.5">
        <FloatingTip content={`Back ${skipSeconds}s`}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Back ${skipSeconds} seconds`}
            className={FLOATING_ICON_BUTTON}
            onClick={() => skip(-skipSeconds)}
          >
            <RotateCcw aria-hidden />
          </Button>
        </FloatingTip>
        <FloatingTip content={media.playing ? "Pause" : "Play"}>
          <Button
            size="icon"
            aria-label={media.playing ? `Pause ${label}` : `Play ${label}`}
            className="size-9 shrink-0 rounded-full [&_svg]:size-4"
            onClick={toggle}
          >
            {media.playing ? (
              <Pause className="fill-current" aria-hidden />
            ) : (
              <Play className="fill-current" aria-hidden />
            )}
          </Button>
        </FloatingTip>
        <FloatingTip content={`Forward ${skipSeconds}s`}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Forward ${skipSeconds} seconds`}
            className={FLOATING_ICON_BUTTON}
            onClick={() => skip(skipSeconds)}
          >
            <RotateCw aria-hidden />
          </Button>
        </FloatingTip>
      </div>

      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatTime(media.time)}
      </span>
      <FloatingSeek
        label={label}
        time={media.time}
        duration={media.duration}
        buffered={media.buffered}
        formatTime={formatTime}
        onSeek={seekTo}
      />
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatTime(media.duration)}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        <DropdownMenu>
          <FloatingTip content="Playback speed">
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  aria-label={`Playback speed, ${media.rate}x`}
                  className="h-8 min-w-11 shrink-0 rounded-full px-2 text-xs font-medium tabular-nums"
                />
              }
            >
              {media.rate}x
            </DropdownMenuTrigger>
          </FloatingTip>
          <DropdownMenuContent align="end" side="top" className="min-w-24">
            <DropdownMenuRadioGroup
              value={String(media.rate)}
              onValueChange={(value) => {
                const el = mediaRef.current;
                if (el) el.playbackRate = Number(value);
              }}
            >
              {sortedRates.map((rate) => (
                <DropdownMenuRadioItem key={rate} value={String(rate)}>
                  {rate}x
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover>
          <PopoverTrigger
            openOnHover
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${label} volume`}
                className={cn(FLOATING_ICON_BUTTON, "max-sm:hidden")}
              />
            }
          >
            {volume === 0 ? (
              <VolumeX aria-hidden />
            ) : volume < 0.5 ? (
              <Volume1 aria-hidden />
            ) : (
              <Volume2 aria-hidden />
            )}
          </PopoverTrigger>
          <PopoverContent
            side="top"
            className="flex w-40 items-center gap-2 p-2"
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label={media.muted ? `Unmute ${label}` : `Mute ${label}`}
              className={FLOATING_ICON_BUTTON}
              onClick={() => {
                const el = mediaRef.current;
                if (el) el.muted = !el.muted;
              }}
            >
              {volume === 0 ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
            </Button>
            <Slider
              value={[Math.round(volume * 100)]}
              min={0}
              max={100}
              step={1}
              aria-label={`${label} volume level`}
              onValueChange={(value) => {
                const el = mediaRef.current;
                if (!el) return;
                const next =
                  (Array.isArray(value) ? (value[0] ?? 0) : (value as number)) /
                  100;
                el.volume = next;
                el.muted = next === 0;
              }}
            />
          </PopoverContent>
        </Popover>
        {closeButton}
      </div>
    </div>
  );
}

// ── Global player ────────────────────────────────────────────────────────────
// One recording that keeps playing while the reader moves between routes. The
// provider sits in the app shell ABOVE the routes; `GlobalAudioPlayer` renders
// the floating pill wherever the shell puts it (inside the main content column,
// so the pill centres on the content, not across a sidebar).

/** The recording the global player is holding. */
export interface GlobalPlayerTrack {
  /** Stable id of the recording; opening the same id again seeks instead of reloading. */
  id: string;
  /** A URL, or a function resolving a (signed) URL on first play. */
  src: AudioPlayerProps["src"];
  /** Visible title in the pill; a link back to `href` when one is given. */
  title?: string;
  /** Where the title links — the page the recording belongs to. */
  href?: string;
  /** Accessible label of the player. Defaults to `title`, then "Recording". */
  label?: string;
  /** Renews an expired signed URL; see `AudioPlayerProps.onSourceExpired`. */
  onSourceExpired?: () => Promise<string>;
}

/** Options for `useGlobalPlayer().open` and `.seek`. */
export interface GlobalPlayerSeekOptions {
  /** Start (or jump) at this many seconds. */
  at?: number;
  /**
   * Start playing.
   * @default true
   */
  play?: boolean;
}

/** What `useGlobalPlayer()` returns. */
export interface GlobalPlayerValue {
  /** The recording in the player, or `null` when it is closed. */
  track: GlobalPlayerTrack | null;
  /** Whether it is playing. */
  playing: boolean;
  /** Load `track` into the player (or reuse it when the id matches) and play from `at`. */
  open(track: GlobalPlayerTrack, opts?: GlobalPlayerSeekOptions): void;
  /** Jump the open recording to `seconds`; `play` defaults to true. */
  seek(seconds: number, opts?: { play?: boolean }): void;
  /** Resume playback. */
  play(): void;
  /** Pause playback. */
  pause(): void;
  /** Stop and close the player. */
  close(): void;
}

/** Props accepted by `AudioPlayerProvider`. */
export interface AudioPlayerProviderProps {
  /**
   * The app shell.
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * Renders the title link — pass your router's link (for example
   * `(props) => <Link {...props} />`) so the jump back is a client navigation.
   * @default a plain `<a>`
   */
  renderLink?: (props: {
    href: string;
    className: string;
    children: React.ReactNode;
  }) => React.ReactNode;
}

interface GlobalPlayerInternals {
  actionsRef: React.RefObject<AudioPlayerActions | null>;
  pendingRef: React.RefObject<GlobalPlayerSeekOptions | null>;
  setPlaying: (playing: boolean) => void;
  setTime: (seconds: number) => void;
  renderLink: NonNullable<AudioPlayerProviderProps["renderLink"]>;
}

const GlobalPlayerContext = React.createContext<GlobalPlayerValue | null>(null);
const GlobalPlayerTimeContext = React.createContext(0);
const GlobalPlayerInternalsContext =
  React.createContext<GlobalPlayerInternals | null>(null);

const defaultRenderLink: NonNullable<AudioPlayerProviderProps["renderLink"]> = (
  props,
) => <a {...props} />;

/**
 * `AudioPlayerProvider` — holds one global recording for the whole app. Mount
 * it in the app shell above the routes, render `GlobalAudioPlayer` inside the
 * main content column, and call `useGlobalPlayer().open(track)` from any page.
 * Playback survives route changes because the player lives in the shell.
 *
 * @example
 * <AudioPlayerProvider renderLink={(props) => <Link {...props} />}>
 *   <main className="flex min-h-0 flex-1 flex-col overflow-auto">
 *     {children}
 *     <GlobalAudioPlayer />
 *   </main>
 * </AudioPlayerProvider>
 */
export function AudioPlayerProvider({
  children,
  renderLink = defaultRenderLink,
}: AudioPlayerProviderProps) {
  const [track, setTrack] = React.useState<GlobalPlayerTrack | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const actionsRef = React.useRef<AudioPlayerActions | null>(null);
  const pendingRef = React.useRef<GlobalPlayerSeekOptions | null>(null);
  const trackRef = React.useRef(track);
  trackRef.current = track;

  const value = React.useMemo<GlobalPlayerValue>(
    () => ({
      track,
      playing,
      open(next, opts) {
        const play = opts?.play ?? true;
        const current = trackRef.current;
        if (current && current.id === next.id && actionsRef.current) {
          if (opts?.at !== undefined)
            actionsRef.current.seek(opts.at, { play });
          else if (play) actionsRef.current.play();
          return;
        }
        pendingRef.current = { at: opts?.at, play };
        setTime(opts?.at ?? 0);
        setTrack(next);
      },
      seek(seconds, opts) {
        actionsRef.current?.seek(seconds, { play: opts?.play ?? true });
      },
      play() {
        actionsRef.current?.play();
      },
      pause() {
        actionsRef.current?.pause();
      },
      close() {
        actionsRef.current?.pause();
        setTrack(null);
        setPlaying(false);
        setTime(0);
      },
    }),
    [track, playing],
  );

  const internals = React.useMemo<GlobalPlayerInternals>(
    () => ({ actionsRef, pendingRef, setPlaying, setTime, renderLink }),
    [renderLink],
  );

  return (
    <GlobalPlayerInternalsContext.Provider value={internals}>
      <GlobalPlayerContext.Provider value={value}>
        <GlobalPlayerTimeContext.Provider value={time}>
          {children}
        </GlobalPlayerTimeContext.Provider>
      </GlobalPlayerContext.Provider>
    </GlobalPlayerInternalsContext.Provider>
  );
}

/**
 * `useGlobalPlayer` — open, seek, play, pause and close the app's global
 * recording. Must be called inside `AudioPlayerProvider`.
 *
 * @example
 * const player = useGlobalPlayer();
 * player.open({ id: meeting.id, src: mintUrl, title: meeting.title, href: `/meetings/${meeting.id}` }, { at: 42 });
 */
export function useGlobalPlayer(): GlobalPlayerValue {
  const context = React.useContext(GlobalPlayerContext);
  if (!context)
    throw new Error("useGlobalPlayer must be used within AudioPlayerProvider.");
  return context;
}

/**
 * `useGlobalPlayerTime` — the global player's current position in seconds, in
 * its own context so only the components that follow time re-render on a tick.
 * Feed it to `Transcript`'s `currentTime`.
 *
 * @example
 * const time = useGlobalPlayerTime();
 */
export function useGlobalPlayerTime(): number {
  return React.useContext(GlobalPlayerTimeContext);
}

/** Props accepted by `GlobalAudioPlayer`. */
export interface GlobalAudioPlayerProps {
  /**
   * Classes for the floating pill.
   * @default undefined
   */
  className?: string;
  /**
   * Seconds moved by rewind and forward.
   * @default 10
   */
  skipSeconds?: number;
}

/**
 * `GlobalAudioPlayer` — the floating pill for the provider's recording. Render
 * it once, at the end of the main content column; it renders nothing while no
 * recording is open.
 *
 * @example
 * <GlobalAudioPlayer />
 */
export function GlobalAudioPlayer({
  className,
  skipSeconds = 10,
}: GlobalAudioPlayerProps) {
  const internals = React.useContext(GlobalPlayerInternalsContext);
  const player = React.useContext(GlobalPlayerContext);
  if (!internals || !player)
    throw new Error(
      "GlobalAudioPlayer must be used within AudioPlayerProvider.",
    );
  const { track, close } = player;
  const { actionsRef, pendingRef, setPlaying, setTime, renderLink } = internals;

  // A newly opened recording starts where `open` asked, once the player has mounted.
  React.useEffect(() => {
    if (!track) return;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!pending || !actionsRef.current) return;
    if (pending.at !== undefined)
      actionsRef.current.seek(pending.at, { play: pending.play });
    else if (pending.play) actionsRef.current.play();
  }, [track, actionsRef, pendingRef]);

  if (!track) return null;
  const title = track.title
    ? track.href
      ? renderLink({
          href: track.href,
          className: "rounded-sm underline-offset-4 hover:underline",
          children: track.title,
        })
      : track.title
    : undefined;

  return (
    <AudioPlayer
      key={track.id}
      variant="floating"
      src={track.src}
      label={track.label ?? track.title ?? "Recording"}
      title={title}
      skipSeconds={skipSeconds}
      onSourceExpired={track.onSourceExpired}
      actionsRef={actionsRef}
      onPlayStateChange={setPlaying}
      onTimeChange={(seconds) => setTime(seconds)}
      open
      onOpenChange={(next) => {
        if (!next) close();
      }}
      className={className}
    />
  );
}
