// @vegastack audio-player@0.5.0 sha256-mDt5QFItICSFdnui7sbMM5SH1vt9NpLcvMMRD3LigLY=

"use client";

import * as React from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { TIMINGS, cn } from "@vegastack/design";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
const DEFAULT_SKIP_SECONDS = 15;
const MEDIA_ACTION_ICON_CLASS =
  "[&_svg:not([class*='size-'])]:size-(--icon-action)";
const MEDIA_PRIMARY_ICON_CLASS =
  "[&_svg:not([class*='size-'])]:size-(--icon-feature)";
const MEDIA_OVERLAY_ICON_BUTTON_CLASS =
  "text-primary-foreground hover:bg-primary-foreground/(--alpha-ink-tint-strong) hover:text-primary-foreground";
// Media settings submenu: left-align the option label and move the selected dot
// to the trailing edge (default radio items lead with the dot). Shared by the
// audio card and the video overlay so both settings menus read identically.
const MEDIA_SUBMENU_RADIO_ITEM_CLASS =
  "[&_[data-slot=dropdown-menu-radio-item]]:ps-2 [&_[data-slot=dropdown-menu-radio-item]]:pe-8 [&_[data-slot=dropdown-menu-radio-item]>span]:start-auto [&_[data-slot=dropdown-menu-radio-item]>span]:end-2";

// Soft, keyboard-only focus affordance for the player chrome. On `focus-visible`
// only (mouse clicks show nothing), applied to the group root and every focusable
// descendant (icon buttons, seek). In normal color mode the crisp global 2px
// outline is swapped for a low-alpha ring (box-shadow). Under forced-colors the
// outline-swap is NOT applied — forced-colors strips box-shadows, so the base.css
// Highlight outline must remain as the only affordance the forced palette keeps.
// That preserves the WCAG 2.4.7 focus-visible contract in both modes.
const MEDIA_SOFT_FOCUS_CLASS =
  "[@media(forced-colors:none)]:focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/(--alpha-outline-soft) [&_*:focus-visible]:[@media(forced-colors:none)]:outline-none [&_*:focus-visible]:ring-2 [&_*:focus-visible]:ring-ring/(--alpha-outline-soft)";
// On the solid audio card the ring gets a small background-colored offset so it
// reads as one crisp, detached ring (the standard tidy focus look). The video
// overlay omits this — a background-colored gap over media would show as a halo.
const MEDIA_FOCUS_OFFSET_CLASS =
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_*:focus-visible]:ring-offset-2 [&_*:focus-visible]:ring-offset-background";

// Number of amplitude bars sampled from decoded audio for the waveform seek.
// Denser bars read as thinner lines than a coarse count at the same width.
const WAVEFORM_BAR_COUNT = 128;
// Flat placeholder bars shown before decode completes or when decoding fails —
// the seek stays fully operable; only the visual amplitude is a level fallback.
const WAVEFORM_FLAT_BARS: readonly number[] = Array.from(
  { length: WAVEFORM_BAR_COUNT },
  () => 0.2,
);

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) ref.current = value;
}

function formatDefaultTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatPlaybackRate(value: number): string {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/0$/, "")}x`;
}

function parsePlaybackRate(value: string): number {
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

function getMediaDuration(media: HTMLMediaElement | null): number {
  if (!media || !Number.isFinite(media.duration)) return 0;
  return media.duration;
}

function clampTime(media: HTMLMediaElement, value: number): number {
  const duration = getMediaDuration(media);
  const upper = duration > 0 ? duration : Number.MAX_SAFE_INTEGER;
  return Math.min(Math.max(value, 0), upper);
}

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

function MediaControlTooltip({
  children,
  content,
}: {
  children: React.ReactElement;
  content: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}

function MediaProgressSlider({
  value,
  max,
  disabled,
  label,
  onValueChange,
  variant,
}: {
  value: number;
  max: number;
  disabled: boolean;
  label: string;
  onValueChange: (value: number | readonly number[]) => void;
  variant: "default" | "overlay";
}) {
  return (
    <div
      data-slot="media-player-progress"
      data-variant={variant}
      className={cn(
        "group/media-progress w-full min-w-0 [&_[data-slot=slider-control]]:cursor-pointer",
        // Solid track + solid, borderless thumb revealed on hover/focus/drag.
        variant === "default" &&
          "[&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]]:opacity-0 [&_[data-slot=slider-thumb]]:transition-opacity [&_[data-slot=slider-thumb]]:duration-fast [&_[data-slot=slider-thumb]]:ease-standard hover:[&_[data-slot=slider-thumb]]:opacity-100 focus-within:[&_[data-slot=slider-thumb]]:opacity-100 [&_[data-slot=slider-thumb][data-dragging]]:opacity-100 motion-reduce:[&_[data-slot=slider-thumb]]:transition-none",
        variant === "overlay" &&
          "[&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-primary-foreground/(--alpha-wash-strong) [&_[data-slot=slider-track]]:transition-[height] [&_[data-slot=slider-track]]:duration-fast [&_[data-slot=slider-track]]:ease-standard hover:[&_[data-slot=slider-track]]:h-1.5 focus-within:[&_[data-slot=slider-track]]:h-1.5 motion-reduce:[&_[data-slot=slider-track]]:transition-none [&_[data-slot=slider-indicator]]:bg-primary-foreground [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-primary-foreground [&_[data-slot=slider-thumb]]:bg-primary-foreground [&_[data-slot=slider-thumb]]:opacity-0 [&_[data-slot=slider-thumb]]:transition-opacity [&_[data-slot=slider-thumb]]:duration-fast [&_[data-slot=slider-thumb]]:ease-standard hover:[&_[data-slot=slider-thumb]]:opacity-100 focus-within:[&_[data-slot=slider-thumb]]:opacity-100 [&_[data-slot=slider-thumb][data-dragging]]:opacity-100 motion-reduce:[&_[data-slot=slider-thumb]]:transition-none",
      )}
    >
      <Slider
        value={value}
        min={0}
        max={max}
        step={1}
        disabled={disabled}
        aria-label={`${label} seek`}
        onValueChange={onValueChange}
      />
    </div>
  );
}

function MediaWaveformSeek({
  value,
  max,
  disabled,
  label,
  peaks,
  onValueChange,
}: {
  value: number;
  max: number;
  disabled: boolean;
  label: string;
  peaks: readonly number[];
  onValueChange: (value: number | readonly number[]) => void;
}) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const bars = peaks.length > 0 ? peaks : WAVEFORM_FLAT_BARS;
  return (
    <div
      data-slot="media-player-waveform"
      className="group/media-progress relative w-full min-w-0"
    >
      {/*
        Bars are decoration only (`aria-hidden`); the transparent Slider on top
        owns all keyboard/pointer/seek semantics and the hidden range input. No
        visible scrubber — the primary bar fill IS the position cue; the seek
        thumb stays invisible (opacity-0) but keyboard-focusable so arrow/Home/End
        seeking still works.
      */}
      <div
        aria-hidden="true"
        data-slot="media-player-waveform-bars"
        className="flex h-12 w-full items-center gap-px"
      >
        {bars.map((peak, index) => {
          const played = (index + 0.5) / bars.length <= ratio;
          return (
            <span
              key={index}
              className={cn(
                "h-[var(--wave-peak)] min-w-0 flex-1 rounded-full",
                played ? "bg-primary" : "bg-muted",
              )}
              style={
                {
                  "--wave-peak": `${Math.round(Math.max(peak, 0.06) * 100)}%`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
      <Slider
        value={value}
        min={0}
        max={max}
        step={1}
        disabled={disabled}
        aria-label={`${label} seek`}
        onValueChange={onValueChange}
        className="absolute inset-0 [&_[data-slot=slider-control]]:h-full [&_[data-slot=slider-control]]:cursor-pointer [&_[data-slot=slider-control]]:py-0 [&_[data-slot=slider-track]]:h-full [&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-indicator]]:bg-transparent [&_[data-slot=slider-thumb]]:opacity-0"
      />
    </div>
  );
}

/** Props accepted by `MediaPlayerControls`. */
export interface MediaPlayerControlsProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * Ref for the underlying `<audio>` or `<video>` element that these controls operate.
   */
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  /**
   * Accessible label prefix used for transport controls and the seek slider.
   * @default 'Media'
   */
  label?: string;
  /**
   * Seconds moved by the rewind and forward actions.
   * @default 15
   */
  skipSeconds?: number;
  /**
   * Playback rates cycled by the rate control.
   * @default [0.75, 1, 1.25, 1.5, 2]
   */
  playbackRates?: readonly number[];
  /**
   * Initial playback rate applied when the media element mounts.
   * @default 1
   */
  defaultPlaybackRate?: number;
  /**
   * Selectable video quality labels shown in the settings menu.
   * @default undefined
   */
  qualityOptions?: readonly string[];
  /**
   * Initial quality label selected in the settings menu.
   * @default undefined
   */
  defaultQuality?: string;
  /**
   * Format elapsed and duration labels.
   * @default mm:ss / h:mm:ss
   */
  formatTime?: (seconds: number) => string;
  /**
   * Called whenever playback starts or pauses.
   * @default undefined
   */
  onPlayStateChange?: (playing: boolean) => void;
  /**
   * Called whenever the current playback time changes.
   * @default undefined
   */
  onTimeChange?: (currentTime: number, duration: number) => void;
  /**
   * Called whenever the playback rate changes.
   * @default undefined
   */
  onPlaybackRateChange?: (playbackRate: number) => void;
  /**
   * Called whenever the selected quality label changes.
   * @default undefined
   */
  onQualityChange?: (quality: string) => void;
  /**
   * Whether the associated media frame currently owns document fullscreen.
   * Updates the fullscreen control's icon and accessible name.
   * @default false
   */
  isFullscreen?: boolean;
  /**
   * Called when the fullscreen control is pressed. When omitted, the
   * fullscreen control is not rendered.
   * @default undefined
   */
  onFullscreenToggle?: () => void;
  /**
   * Visual treatment for the controls surface. `overlay` is tuned for video
   * controls placed over media.
   * @default 'default'
   */
  variant?: "default" | "overlay";
  /**
   * Seek control rendering. `waveform` swaps the seek slider for a decoded-audio
   * waveform (amplitude bars supplied via `waveformPeaks`); the slider keeps all
   * keyboard and pointer seek semantics beneath the bars.
   * @default 'slider'
   */
  seekVariant?: "slider" | "waveform";
  /**
   * Normalized (0–1) waveform peak amplitudes rendered by the `waveform` seek
   * variant. Ignored unless `seekVariant` is `waveform`.
   * @default undefined
   */
  waveformPeaks?: readonly number[];
}

/**
 * `MediaPlayerControls` — shared VegaStack transport controls for audio and
 * video media: play/pause, seek, elapsed/duration labels, mute, keyboard
 * shortcuts for skip, and playback-rate cycling.
 *
 * @example
 * <MediaPlayerControls mediaRef={mediaRef} label="Demo audio" />
 */
export function MediaPlayerControls({
  className,
  mediaRef,
  label = "Media",
  skipSeconds = DEFAULT_SKIP_SECONDS,
  playbackRates = DEFAULT_PLAYBACK_RATES,
  defaultPlaybackRate = 1,
  qualityOptions,
  defaultQuality,
  formatTime = formatDefaultTime,
  onPlayStateChange,
  onTimeChange,
  onPlaybackRateChange,
  onQualityChange,
  isFullscreen = false,
  onFullscreenToggle,
  variant = "default",
  seekVariant = "slider",
  waveformPeaks,
  onKeyDown,
  ref,
  ...props
}: MediaPlayerControlsProps) {
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [volumeOpen, setVolumeOpen] = React.useState(false);
  const volumeCloseTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(defaultPlaybackRate);
  const [quality, setQuality] = React.useState(defaultQuality ?? "");

  const syncFromMedia = React.useCallback(() => {
    const media = mediaRef.current;
    const nextTime = media?.currentTime ?? 0;
    const nextDuration = getMediaDuration(media);
    setCurrentTime(nextTime);
    setDuration(nextDuration);
    onTimeChange?.(nextTime, nextDuration);
  }, [mediaRef, onTimeChange]);

  const syncPlaying = React.useCallback(
    (nextPlaying: boolean) => {
      setPlaying(nextPlaying);
      onPlayStateChange?.(nextPlaying);
    },
    [onPlayStateChange],
  );

  React.useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    media.playbackRate = defaultPlaybackRate;
    setPlaybackRate(media.playbackRate);
    syncFromMedia();
    syncPlaying(!media.paused);
    setMuted(media.muted);
    setVolume(media.volume);

    const handleTimeUpdate = () => syncFromMedia();
    const handleLoadedMetadata = () => syncFromMedia();
    const handleDurationChange = () => syncFromMedia();
    const handlePlay = () => syncPlaying(true);
    const handlePause = () => syncPlaying(false);
    const handleEnded = () => syncPlaying(false);
    const handleVolumeChange = () => {
      setMuted(media.muted);
      setVolume(media.volume);
    };
    const handleRateChange = () => {
      setPlaybackRate(media.playbackRate);
      onPlaybackRateChange?.(media.playbackRate);
    };

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("loadedmetadata", handleLoadedMetadata);
    media.addEventListener("durationchange", handleDurationChange);
    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);
    media.addEventListener("ended", handleEnded);
    media.addEventListener("volumechange", handleVolumeChange);
    media.addEventListener("ratechange", handleRateChange);

    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("loadedmetadata", handleLoadedMetadata);
      media.removeEventListener("durationchange", handleDurationChange);
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
      media.removeEventListener("ended", handleEnded);
      media.removeEventListener("volumechange", handleVolumeChange);
      media.removeEventListener("ratechange", handleRateChange);
    };
  }, [
    defaultPlaybackRate,
    mediaRef,
    onPlaybackRateChange,
    syncFromMedia,
    syncPlaying,
  ]);

  const togglePlayback = React.useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (media.paused) {
      void media.play().catch(() => syncPlaying(false));
      return;
    }

    media.pause();
  }, [mediaRef, syncPlaying]);

  const skipBy = React.useCallback(
    (offset: number) => {
      const media = mediaRef.current;
      if (!media) return;
      media.currentTime = clampTime(media, media.currentTime + offset);
      syncFromMedia();
    },
    [mediaRef, syncFromMedia],
  );

  const seekTo = React.useCallback(
    (value: number | readonly number[]) => {
      const media = mediaRef.current;
      if (!media) return;
      const next = Array.isArray(value) ? value[0] : value;
      media.currentTime = clampTime(media, next);
      syncFromMedia();
    },
    [mediaRef, syncFromMedia],
  );

  const setPlaybackRateValue = React.useCallback(
    (value: string) => {
      const media = mediaRef.current;
      if (!media) return;

      const nextRate = parsePlaybackRate(value);
      media.playbackRate = nextRate;
      setPlaybackRate(nextRate);
      onPlaybackRateChange?.(nextRate);
    },
    [mediaRef, onPlaybackRateChange],
  );

  const setQualityValue = React.useCallback(
    (value: string) => {
      setQuality(value);
      onQualityChange?.(value);
    },
    [onQualityChange],
  );

  const toggleMuted = React.useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
    setMuted(media.muted);
  }, [mediaRef]);

  const setVolumeValue = React.useCallback(
    (value: number | readonly number[]) => {
      const media = mediaRef.current;
      if (!media) return;
      const next = Array.isArray(value) ? value[0] : value;
      const normalized = Math.min(Math.max(next / 100, 0), 1);
      media.volume = normalized;
      media.muted = normalized === 0;
      setVolume(normalized);
      setMuted(media.muted);
    },
    [mediaRef],
  );

  const clearVolumeCloseTimer = React.useCallback(() => {
    if (!volumeCloseTimerRef.current) return;
    clearTimeout(volumeCloseTimerRef.current);
    volumeCloseTimerRef.current = null;
  }, []);

  const openVolumeControl = React.useCallback(() => {
    clearVolumeCloseTimer();
    setVolumeOpen(true);
  }, [clearVolumeCloseTimer]);

  const scheduleVolumeControlClose = React.useCallback(() => {
    clearVolumeCloseTimer();
    volumeCloseTimerRef.current = setTimeout(() => {
      setVolumeOpen(false);
      volumeCloseTimerRef.current = null;
    }, TIMINGS.hoverCloseDelayMs);
  }, [clearVolumeCloseTimer]);

  React.useEffect(() => () => clearVolumeCloseTimer(), [clearVolumeCloseTimer]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.target !== event.currentTarget) {
        const key = event.key.toLowerCase();

        if (key === "m") {
          event.preventDefault();
          toggleMuted();
          return;
        }

        if (key === "k") {
          event.preventDefault();
          togglePlayback();
          return;
        }

        if (key === "j") {
          event.preventDefault();
          skipBy(-skipSeconds);
          return;
        }

        if (key === "l") {
          event.preventDefault();
          skipBy(skipSeconds);
        }
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        togglePlayback();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        skipBy(-skipSeconds);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        skipBy(skipSeconds);
        return;
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePlayback();
        return;
      }

      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        skipBy(-skipSeconds);
        return;
      }

      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        skipBy(skipSeconds);
        return;
      }

      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleMuted();
      }
    },
    [onKeyDown, skipBy, skipSeconds, toggleMuted, togglePlayback],
  );

  const seekMax = Math.max(duration, 1);
  const canSeek = duration > 0;
  const displayedDuration = duration > 0 ? duration : 0;
  const rates =
    playbackRates.length > 0 ? playbackRates : DEFAULT_PLAYBACK_RATES;
  const qualities = qualityOptions?.length ? qualityOptions : [];
  const selectedQuality = quality || defaultQuality || qualities[0] || "";

  const settingsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            aria-label={`${label} settings`}
            size="default"
            variant="ghost"
            className={cn(
              "rounded-full",
              MEDIA_ACTION_ICON_CLASS,
              variant === "overlay" && MEDIA_OVERLAY_ICON_BUTTON_CLASS,
            )}
          >
            <Settings />
          </IconButton>
        }
      />
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="min-w-0 flex-1 truncate">Playback speed</span>
            <span className="font-mono text-code-sm text-muted-foreground">
              {playbackRate === 1 ? "Normal" : formatPlaybackRate(playbackRate)}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className={cn("min-w-40", MEDIA_SUBMENU_RADIO_ITEM_CLASS)}
          >
            <DropdownMenuRadioGroup
              value={String(playbackRate)}
              onValueChange={setPlaybackRateValue}
            >
              <DropdownMenuLabel>Playback speed</DropdownMenuLabel>
              {rates.map((rate) => (
                <DropdownMenuRadioItem key={rate} value={String(rate)}>
                  {rate === 1 ? "Normal" : formatPlaybackRate(rate)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {qualities.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="min-w-0 flex-1 truncate">Quality</span>
              <span className="font-mono text-code-sm text-muted-foreground">
                {selectedQuality}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              className={cn("min-w-40", MEDIA_SUBMENU_RADIO_ITEM_CLASS)}
            >
              <DropdownMenuRadioGroup
                value={selectedQuality}
                onValueChange={setQualityValue}
              >
                <DropdownMenuLabel>Quality</DropdownMenuLabel>
                {qualities.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const seekControl =
    seekVariant === "waveform" ? (
      <MediaWaveformSeek
        value={Math.min(currentTime, seekMax)}
        max={seekMax}
        disabled={!canSeek}
        label={label}
        peaks={waveformPeaks ?? []}
        onValueChange={seekTo}
      />
    ) : (
      <MediaProgressSlider
        value={Math.min(currentTime, seekMax)}
        max={seekMax}
        disabled={!canSeek}
        label={label}
        onValueChange={seekTo}
        variant={variant}
      />
    );

  const timeReadout = (
    <span
      data-slot="media-player-time"
      className={cn(
        "shrink-0 text-lg tabular-nums",
        variant === "default" && "text-muted-foreground",
        variant === "overlay" && "text-primary-foreground",
      )}
    >
      {formatTime(currentTime)} / {formatTime(displayedDuration)}
    </span>
  );

  const playButton = (
    <MediaControlTooltip
      content={playing ? "Pause (Space or K)" : "Play (Space or K)"}
    >
      <IconButton
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        aria-pressed={playing}
        size={variant === "overlay" ? "default" : "lg"}
        variant="ghost"
        onClick={togglePlayback}
        className={cn(
          "rounded-full",
          variant === "overlay"
            ? MEDIA_ACTION_ICON_CLASS
            : MEDIA_PRIMARY_ICON_CLASS,
          variant === "overlay"
            ? MEDIA_OVERLAY_ICON_BUTTON_CLASS
            : "text-primary hover:text-primary",
        )}
      >
        {playing ? (
          <Pause className="fill-current" />
        ) : (
          <Play className="fill-current" />
        )}
      </IconButton>
    </MediaControlTooltip>
  );

  const volumeControl = (
    <div
      data-slot="media-player-volume"
      className="relative flex"
      onPointerEnter={openVolumeControl}
      onPointerLeave={scheduleVolumeControlClose}
      onFocusCapture={openVolumeControl}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          scheduleVolumeControlClose();
        }
      }}
    >
      <MediaControlTooltip content={muted ? "Unmute (M)" : "Mute (M)"}>
        <IconButton
          aria-label={muted ? `Unmute ${label}` : `Mute ${label}`}
          aria-pressed={muted}
          size="default"
          variant="ghost"
          onClick={toggleMuted}
          className={cn(
            "rounded-full",
            MEDIA_ACTION_ICON_CLASS,
            variant === "overlay" && MEDIA_OVERLAY_ICON_BUTTON_CLASS,
          )}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </IconButton>
      </MediaControlTooltip>
      {volumeOpen ? (
        <div
          data-slot="media-player-volume-panel"
          className="absolute bottom-full start-1/2 z-(--z-raised) flex -translate-x-1/2 pb-2"
        >
          <div
            data-slot="media-player-volume-surface"
            data-variant={variant}
            className={cn(
              "flex items-center rounded-full bg-primary/(--alpha-backdrop-soft)",
              variant === "overlay"
                ? "h-20 px-1 py-1 text-primary-foreground"
                : "h-28 px-2 py-3",
            )}
          >
            <Slider
              orientation="vertical"
              thumbAlignment="edge"
              value={Math.round(volume * 100)}
              min={0}
              max={100}
              step={1}
              aria-label={`${label} volume`}
              onValueChange={setVolumeValue}
              className={cn(
                "[&_[data-slot=slider-control]]:w-6 [&_[data-slot=slider-control]]:flex-col [&_[data-slot=slider-control]]:justify-center [&_[data-slot=slider-track]]:h-full [&_[data-slot=slider-track]]:w-1.5 [&_[data-slot=slider-track]]:bg-primary-foreground/(--alpha-wash-strong) [&_[data-slot=slider-indicator]]:bg-primary-foreground [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-primary-foreground [&_[data-slot=slider-thumb]]:bg-primary-foreground",
                variant === "overlay"
                  ? "[&_[data-slot=slider-control]]:h-[calc(var(--size-lg)+var(--spacing)*4)]"
                  : "[&_[data-slot=slider-control]]:h-20",
              )}
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  const fullscreenControl = onFullscreenToggle ? (
    <MediaControlTooltip
      content={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
    >
      <IconButton
        aria-label={`${isFullscreen ? "Exit fullscreen" : "Fullscreen"} ${label}`}
        aria-pressed={isFullscreen}
        size="default"
        variant="ghost"
        onClick={onFullscreenToggle}
        className={cn(
          "rounded-full",
          MEDIA_ACTION_ICON_CLASS,
          variant === "overlay" && MEDIA_OVERLAY_ICON_BUTTON_CLASS,
        )}
      >
        {isFullscreen ? <Minimize /> : <Maximize />}
      </IconButton>
    </MediaControlTooltip>
  ) : null;

  if (variant === "overlay") {
    return (
      <div
        ref={ref}
        data-slot="media-player-controls"
        data-state={playing ? "playing" : "paused"}
        data-variant={variant}
        tabIndex={0}
        role="group"
        aria-label={`${label} media controls`}
        onKeyDown={handleKeyDown}
        className={cn(
          "@container/media-controls w-full min-w-0 border border-transparent p-2 text-primary-foreground",
          MEDIA_SOFT_FOCUS_CLASS,
          className,
        )}
        {...props}
      >
        <div
          data-slot="media-player-controls-layout"
          className="flex min-w-0 flex-col gap-2"
        >
          <div data-slot="media-player-seek" className="min-w-0 px-2">
            {seekControl}
          </div>

          <div
            data-slot="media-player-actions"
            className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              {playButton}
              {timeReadout}
            </div>

            <div aria-hidden="true" />

            <div className="flex justify-self-end">
              {volumeControl}
              {settingsMenu}
              {fullscreenControl}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-slot="media-player-controls"
      data-state={playing ? "playing" : "paused"}
      data-variant={variant}
      tabIndex={0}
      role="group"
      aria-label={`${label} media controls`}
      onKeyDown={handleKeyDown}
      className={cn(
        "@container/media-controls w-full min-w-0 rounded-lg border p-2",
        "border-border bg-background text-foreground",
        MEDIA_SOFT_FOCUS_CLASS,
        MEDIA_FOCUS_OFFSET_CLASS,
        className,
      )}
      {...props}
    >
      <div
        data-slot="media-player-controls-layout"
        className="flex min-w-0 flex-col gap-2"
      >
        <div data-slot="media-player-seek" className="min-w-0 px-2">
          {seekControl}
        </div>

        <div
          data-slot="media-player-actions"
          className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            {playButton}
            {timeReadout}
          </div>

          <div aria-hidden="true" />

          <div className="flex justify-self-end">
            {volumeControl}
            {settingsMenu}
            {fullscreenControl}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Props accepted by `AudioPlayer`. */
export interface AudioPlayerProps extends Omit<
  React.ComponentPropsWithRef<"audio">,
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
   * Audio source URL.
   */
  src: string;
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
   * Seconds moved by the rewind and forward actions.
   * @default 15
   */
  skipSeconds?: number;
  /**
   * Playback rates cycled by the rate control.
   * @default [0.75, 1, 1.25, 1.5, 2]
   */
  playbackRates?: readonly number[];
  /**
   * Initial playback rate applied when the audio element mounts.
   * @default 1
   */
  defaultPlaybackRate?: number;
  /**
   * Format elapsed and duration labels.
   * @default mm:ss / h:mm:ss
   */
  formatTime?: (seconds: number) => string;
  /**
   * Called whenever playback starts or pauses.
   * @default undefined
   */
  onPlayStateChange?: (playing: boolean) => void;
  /**
   * Called whenever the current playback time changes.
   * @default undefined
   */
  onTimeChange?: (currentTime: number, duration: number) => void;
  /**
   * Called whenever the playback rate changes.
   * @default undefined
   */
  onPlaybackRateChange?: (playbackRate: number) => void;
  /**
   * Seek presentation. `waveform` renders a decoded-audio waveform in place of
   * the seek slider; the slider's keyboard and pointer semantics are preserved
   * beneath the bars.
   * @default 'default'
   */
  variant?: "default" | "waveform";
}

/**
 * `AudioPlayer` — a compact, tokenized audio transport with play/pause,
 * seek, elapsed/duration labels, mute, playback speed, and keyboard skip
 * shortcuts. The native `<audio>` element supplies the media engine; VegaStack
 * renders the controls so audio and video players share the same surface.
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
  playbackRates,
  defaultPlaybackRate,
  formatTime,
  onPlayStateChange,
  onTimeChange,
  onPlaybackRateChange,
  variant = "default",
  preload = "metadata",
  ref,
  ...props
}: AudioPlayerProps) {
  const internalMediaRef = React.useRef<HTMLAudioElement | null>(null);
  const controlsMediaRef =
    internalMediaRef as React.RefObject<HTMLMediaElement | null>;
  const isWaveform = variant === "waveform";
  const waveformPeaks = useAudioPeaks(src, isWaveform);
  const setAudioRef = React.useCallback(
    (node: HTMLAudioElement | null) => {
      internalMediaRef.current = node;
      assignRef(mediaRef, node);
    },
    [mediaRef],
  );

  return (
    <div
      ref={ref}
      data-slot="audio-player"
      data-variant={variant}
      className={cn("flex w-full flex-col gap-2", className)}
    >
      {title || description ? (
        <div
          data-slot="audio-player-header"
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

      <audio
        {...props}
        ref={setAudioRef}
        src={src}
        preload={preload}
        aria-label={label}
        className="hidden"
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
        seekVariant={isWaveform ? "waveform" : "slider"}
        waveformPeaks={waveformPeaks}
      />
    </div>
  );
}
