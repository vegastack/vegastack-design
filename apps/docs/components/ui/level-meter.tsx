// @vegastack level-meter@0.25.1 sha256-guZp1UIkEsHrhVxnm8jHWH1MWru+3Bc2ApZw4Juqc50=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

/* ---
`level-meter.tsx` — the live input level of a recording: a row of segments that light up with the
microphone's loudness, so a person can see they are being heard before they say much.

MECHANISM — Web Audio. A `MediaStream` (from `getUserMedia`) feeds an `AnalyserNode`; each
animation frame reads the time-domain samples, takes their RMS, converts it to dBFS and maps
`floor` dB…0 dB onto 0…1. The level decays at a fixed rate so a short peak stays readable. React
re-renders only when the number of lit segments changes, not every frame.

Pass `level` instead of `stream` to drive it yourself (a native recorder, a server-side meter).
The meter is information, not decoration, so it keeps moving under reduced motion; it has no
transitions to remove.
--- */

/** Props accepted by `LevelMeter`. */
export interface LevelMeterProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * The live input to meter. While set, the meter listens to it; when it changes or unmounts the
   * audio graph is closed. The stream's tracks are never stopped — the recorder owns them.
   * @default undefined
   */
  stream?: MediaStream | null;
  /**
   * A level from 0 (silence) to 1 (full scale), for a host that measures itself. Ignored while
   * `stream` is set.
   * @default 0
   */
  level?: number;
  /**
   * How many segments the meter has.
   * @default 12
   */
  segments?: number;
  /**
   * The quietest level the meter shows, in dBFS; anything below it is silence.
   * @default -60
   */
  floor?: number;
  /**
   * Whether the meter is listening. A paused or muted recorder passes `false`: the segments go
   * dark and the analyser stops reading.
   * @default true
   */
  active?: boolean;
  /**
   * The meter's accessible name.
   * @default "Input level"
   */
  "aria-label"?: string;
}

function rmsToLevel(rms: number, floor: number): number {
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  return Math.min(1, Math.max(0, (db - floor) / -floor));
}

/** Read a stream's level every frame, decaying smoothly, and report it to `onLevel`. */
function useStreamLevel(
  stream: MediaStream | null | undefined,
  enabled: boolean,
  floor: number,
  onLevel: (level: number) => void,
) {
  const onLevelRef = React.useRef(onLevel);
  onLevelRef.current = onLevel;
  React.useEffect(() => {
    if (!stream || !enabled || typeof window === "undefined") return;
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor || stream.getAudioTracks().length === 0) return;
    const context = new AudioContextCtor();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let shown = 0;
    let frame = 0;
    const tick = () => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      const level = rmsToLevel(Math.sqrt(sum / samples.length), floor);
      // Rise at once, fall slowly: about a second from full scale to silence.
      shown = level >= shown ? level : Math.max(level, shown - 0.02);
      onLevelRef.current(shown);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      void context.close();
      onLevelRef.current(0);
    };
  }, [stream, enabled, floor]);
}

/**
 * `LevelMeter` — a segmented live level meter for a recording. Give it the recorder's
 * `MediaStream`, or drive `level` yourself. The top segments read as a warning, then as clipping.
 *
 * @example
 * const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 * <LevelMeter stream={stream} active={!paused} />
 */
export function LevelMeter({
  stream,
  level = 0,
  segments = 12,
  floor = -60,
  active = true,
  className,
  "aria-label": ariaLabel = "Input level",
  ...props
}: LevelMeterProps) {
  const count = Math.max(1, Math.round(segments));
  const [streamLit, setStreamLit] = React.useState(0);
  useStreamLevel(stream, active, floor, (next) => {
    const lit = Math.round(next * count);
    setStreamLit((current) => (current === lit ? current : lit));
  });
  const lit = !active
    ? 0
    : stream
      ? streamLit
      : Math.round(Math.min(1, Math.max(0, level)) * count);
  const percent = Math.round((lit / count) * 100);

  return (
    <div
      role="meter"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      data-slot="level-meter"
      data-state={active ? "active" : "inactive"}
      className={cn("flex h-4 items-center gap-0.5", className)}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => {
        const on = index < lit;
        // The last segment is clipping, the two before it are hot.
        const zone =
          index === count - 1 ? "clip" : index >= count - 3 ? "hot" : "ok";
        return (
          <span
            key={index}
            aria-hidden
            data-slot="level-meter-segment"
            data-on={on ? "" : undefined}
            data-zone={zone}
            className={cn(
              "h-full w-1 min-w-0.5 flex-1 rounded-full bg-muted",
              on && zone === "ok" && "bg-primary",
              on && zone === "hot" && "bg-warning",
              on && zone === "clip" && "bg-destructive",
            )}
          />
        );
      })}
    </div>
  );
}
