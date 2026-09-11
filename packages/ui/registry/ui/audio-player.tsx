// @vegastack audio-player@0.7.2 sha256-aL06PZ92Jo50kxbCF/d53jRG0qvLrgjNMXFwATWhb20=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";
import {
  MediaPlayerControls,
  type MediaPlayerControlsProps,
} from "@/components/ui/media-player-controls";

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
  ref,
  ...props
}: AudioPlayerProps) {
  const internalMediaRef = React.useRef<HTMLAudioElement | null>(null);
  const controlsMediaRef =
    internalMediaRef as React.RefObject<HTMLMediaElement | null>;
  const isWaveform = variant === "waveform";
  const waveformPeaks = useAudioPeaks(src, isWaveform);
  const setAudioRef = React.useMemo(
    () => mergeRefs(internalMediaRef, mediaRef),
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
        onTranscriptClick={onTranscriptClick}
        seekVariant={isWaveform ? "waveform" : "slider"}
        waveformPeaks={waveformPeaks}
        waveformFlatPeaks={WAVEFORM_FLAT_BARS}
      />
    </div>
  );
}
