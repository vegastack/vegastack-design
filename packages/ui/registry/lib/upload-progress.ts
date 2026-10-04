// @vegastack upload-progress@0.23.121 sha256-TpB1Uz3Xagu3hd8vYPzondQphMKDiFmVPuJ7HHojuY8=

/* ---
`upload-progress` is the arithmetic behind an upload's "About 2 minutes left": a rate estimator
that smooths acknowledged bytes into a speed and a time left that does not jitter, and the two
sentences an upload surface prints ("2.1 MB of 3.4 MB", "About 2 minutes left"). Pure functions
with no React and no clock of their own — the caller passes `nowMs` — so the web engine, a worker
and the mobile app's port all compute the same answer from the same samples.

Deliberately NOT done here: timers, uploading, or localising the wording. A surface that needs
another language formats `timeLeftMs` itself.
--- */

import { formatBytes } from "@/lib/file-kind";

/** Tuning for {@link createRateEstimator}; every field has the house default. */
export interface RateEstimatorOptions {
  /**
   * EWMA weight of the newest one-tick speed.
   * @default 0.15
   */
  alpha?: number;
  /**
   * The sampling tick: samples closer together than this are folded into the next tick.
   * @default 1000
   */
  tickMs?: number;
  /**
   * Ticks inside the first `warmupMs` after the first sample are ignored (connection setup,
   * TCP slow start and the first part's signing skew them).
   * @default 3000
   */
  warmupMs?: number;
  /**
   * No time left until this long after the first sample.
   * @default 5000
   */
  minElapsedMs?: number;
  /**
   * No time left until at least this fraction is done.
   * @default 0.02
   */
  minFraction?: number;
  /**
   * The shown time left moves only when the new estimate differs from it by more than this
   * fraction, so the sentence does not flicker between neighbouring values.
   * @default 0.15
   */
  holdThreshold?: number;
}

/** A rate estimator: feed it acknowledged bytes, read a smoothed speed and time left. */
export interface RateEstimator {
  /** Record the total bytes acknowledged so far (monotonic) at `nowMs`. */
  sample(ackedBytes: number, nowMs: number): void;
  /** The smoothed speed in bytes per second, or `null` before the first counted tick. */
  speed(): number | null;
  /**
   * The time left in milliseconds for `remainingBytes`, or `null` while there is too little data
   * (under `minElapsedMs` since the first sample, or `fractionDone` at or under `minFraction`).
   * Held until a new estimate differs by more than `holdThreshold`; `0` once nothing remains.
   */
  timeLeftMs(
    remainingBytes: number,
    fractionDone: number,
    nowMs: number,
  ): number | null;
  /** Forget everything (a new batch, or a resume after a long pause). */
  reset(): void;
}

/**
 * `createRateEstimator` — an exponentially weighted moving average of acknowledged bytes per
 * second, over 1 s ticks, that ignores the first 3 s (counting only from the first sample after it), reports a time left only after 5 s and 2%,
 * and moves the time left only on a change above 15%.
 *
 * @example
 * const estimator = createRateEstimator();
 * estimator.sample(bytesAcked, performance.now());
 * const left = estimator.timeLeftMs(total - bytesAcked, bytesAcked / total, performance.now());
 * label = left === null ? "" : formatTimeLeft(left);
 */
export function createRateEstimator({
  alpha = 0.15,
  tickMs = 1000,
  warmupMs = 3000,
  minElapsedMs = 5000,
  minFraction = 0.02,
  holdThreshold = 0.15,
}: RateEstimatorOptions = {}): RateEstimator {
  let startMs: number | null = null;
  let warm = false;
  let tickStartMs = 0;
  let tickStartBytes = 0;
  let rate: number | null = null;
  let held: number | null = null;

  return {
    sample(ackedBytes, nowMs) {
      if (startMs === null) {
        startMs = nowMs;
        return;
      }
      if (!warm) {
        // Warm-up bytes never count: the first sample past it is the baseline.
        if (nowMs - startMs <= warmupMs) return;
        warm = true;
        tickStartMs = nowMs;
        tickStartBytes = ackedBytes;
        return;
      }
      const elapsed = nowMs - tickStartMs;
      if (elapsed < tickMs) return;
      const instant =
        (Math.max(0, ackedBytes - tickStartBytes) * 1000) / elapsed;
      tickStartMs = nowMs;
      tickStartBytes = ackedBytes;
      rate = rate === null ? instant : alpha * instant + (1 - alpha) * rate;
    },
    speed: () => rate,
    timeLeftMs(remainingBytes, fractionDone, nowMs) {
      if (remainingBytes <= 0) return (held = 0);
      if (
        startMs === null ||
        rate === null ||
        rate <= 0 ||
        nowMs - startMs < minElapsedMs ||
        fractionDone <= minFraction
      )
        // Not enough data (again — a batch that grew drops back under the floor): no estimate.
        return (held = null);
      const next = (remainingBytes / rate) * 1000;
      if (
        held === null ||
        held === 0 ||
        Math.abs(next - held) / held > holdThreshold
      )
        held = next;
      return held;
    },
    reset() {
      startMs = null;
      warm = false;
      rate = null;
      held = null;
    },
  };
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * A time left as a person says it, rounded: "A few seconds left" (under 20 s), "Less than a
 * minute left", "About a minute left" (under 90 s), "About N minutes left" (under 90 minutes),
 * then "About N hours left". An invalid or negative input reads as a few seconds.
 *
 * @example
 * formatTimeLeft(125_000); // "About 2 minutes left"
 */
export function formatTimeLeft(ms: number): string {
  if (!Number.isFinite(ms) || ms < 20 * SECOND) return "A few seconds left";
  if (ms < MINUTE) return "Less than a minute left";
  if (ms < 90 * SECOND) return "About a minute left";
  // The unit follows the unrounded duration, so 89.5 minutes reads as minutes, never "1 hours".
  if (ms < 90 * MINUTE) return `About ${Math.round(ms / MINUTE)} minutes left`;
  // From 90 minutes up the rounded hours are always 2 or more, so the plural is always right.
  return `About ${Math.round(ms / (60 * MINUTE))} hours left`;
}

/**
 * Bytes done of a total, both in `formatBytes` units: "2.1 MB of 3.4 MB". `done` is clamped to
 * `0…total`.
 *
 * @example
 * formatBytesProgress(2_202_010, 3_565_158); // "2.1 MB of 3.4 MB"
 */
export function formatBytesProgress(done: number, total: number): string {
  const clamped = Math.min(Math.max(0, done || 0), Math.max(0, total || 0));
  return `${formatBytes(clamped)} of ${formatBytes(total)}`;
}
