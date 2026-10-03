import { describe, expect, it } from "vitest";
import {
  createRateEstimator,
  formatBytesProgress,
  formatTimeLeft,
} from "./upload-progress";

const MB = 1024 * 1024;

/** Feed `seconds` one-second ticks at `bytesPerSecond`, starting from `t0`/`bytes0`. */
function feed(
  estimator: ReturnType<typeof createRateEstimator>,
  seconds: number,
  bytesPerSecond: number,
  t0 = 0,
  bytes0 = 0,
) {
  for (let s = 0; s <= seconds; s++)
    estimator.sample(bytes0 + s * bytesPerSecond, t0 + s * 1000);
  return { t: t0 + seconds * 1000, bytes: bytes0 + seconds * bytesPerSecond };
}

describe("createRateEstimator", () => {
  it("ignores the first 3 s, takes a baseline after it, then averages the per-tick speed", () => {
    const estimator = createRateEstimator();
    feed(estimator, 3, 10 * MB);
    expect(estimator.speed()).toBeNull();
    // Irregular warm-up samples: the 30 MB sent by 3.5 s never reaches the rate.
    estimator.sample(35 * MB, 3500); // first sample past warm-up: the baseline
    expect(estimator.speed()).toBeNull();
    estimator.sample(36 * MB, 4500); // 1 MB in the first counted second
    expect(estimator.speed()).toBe(MB);
  });

  it("smooths with alpha 0.15 over 1 s ticks and folds faster samples into the tick", () => {
    const estimator = createRateEstimator();
    const { t, bytes } = feed(estimator, 5, MB); // baseline at 4 s, first tick 4-5 s: 1 MB/s
    expect(estimator.speed()).toBe(MB);
    estimator.sample(bytes + 0.5 * MB, t + 500); // inside the tick: folded in
    estimator.sample(bytes + 3 * MB, t + 1000); // 3 MB in this tick
    expect(estimator.speed()).toBeCloseTo(0.15 * 3 * MB + 0.85 * MB);
  });

  it("reports no time left before 5 s or at 2% done, then a held estimate", () => {
    const estimator = createRateEstimator();
    let { t } = feed(estimator, 4, MB);
    expect(estimator.timeLeftMs(100 * MB, 0.5, t)).toBeNull(); // 4 s, no rate yet
    ({ t } = feed(estimator, 2, MB, t, 4 * MB));
    expect(estimator.timeLeftMs(100 * MB, 0.02, t)).toBeNull(); // 2% exactly
    expect(estimator.timeLeftMs(100 * MB, 0.06, t)).toBeCloseTo(100_000);
    // A 10% change keeps the shown value; a 20% change moves it.
    expect(estimator.timeLeftMs(90 * MB, 0.1, t)).toBeCloseTo(100_000);
    expect(estimator.timeLeftMs(80 * MB, 0.2, t)).toBeCloseTo(80_000);
    expect(estimator.timeLeftMs(0, 1, t)).toBe(0);
  });

  it("drops the held estimate when it is no longer eligible", () => {
    const estimator = createRateEstimator();
    const { t } = feed(estimator, 8, MB);
    expect(estimator.timeLeftMs(50 * MB, 0.1, t)).toBeCloseTo(50_000);
    // Files added: the batch is now under 2% done.
    expect(estimator.timeLeftMs(5000 * MB, 0.01, t)).toBeNull();
    // Eligible again: a fresh estimate, not the stale hold.
    expect(estimator.timeLeftMs(45 * MB, 0.1, t)).toBeCloseTo(45_000);
  });

  it("resets", () => {
    const estimator = createRateEstimator();
    const { t } = feed(estimator, 8, MB);
    expect(estimator.speed()).not.toBeNull();
    estimator.reset();
    expect(estimator.speed()).toBeNull();
    expect(estimator.timeLeftMs(MB, 0.5, t)).toBeNull();
  });
});

describe("formatTimeLeft", () => {
  it("rounds to the wording a person reads", () => {
    expect(formatTimeLeft(5_000)).toBe("A few seconds left");
    expect(formatTimeLeft(45_000)).toBe("Less than a minute left");
    expect(formatTimeLeft(75_000)).toBe("About a minute left");
    expect(formatTimeLeft(125_000)).toBe("About 2 minutes left");
    expect(formatTimeLeft(89 * 60_000)).toBe("About 89 minutes left");
    // The unit comes from the unrounded duration: 89.5–90 minutes stays in minutes.
    expect(formatTimeLeft(89.5 * 60_000)).toBe("About 90 minutes left");
    expect(formatTimeLeft(89.99 * 60_000)).toBe("About 90 minutes left");
    expect(formatTimeLeft(90 * 60_000)).toBe("About 2 hours left");
    expect(formatTimeLeft(3 * 3_600_000)).toBe("About 3 hours left");
    expect(formatTimeLeft(Number.NaN)).toBe("A few seconds left");
  });
});

describe("formatBytesProgress", () => {
  it("prints done of total, clamped", () => {
    expect(formatBytesProgress(2_202_010, 3_565_158)).toBe("2.1 MB of 3.4 MB");
    expect(formatBytesProgress(-1, 1024)).toBe("0 B of 1 KB");
    expect(formatBytesProgress(4096, 1024)).toBe("1 KB of 1 KB");
  });
});
