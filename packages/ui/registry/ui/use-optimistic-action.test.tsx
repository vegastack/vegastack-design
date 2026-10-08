import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useOptimisticAction } from "./use-optimistic-action";

// Data-loss invariant: a commit runs exactly once after the window, never after Undo, and a
// failed commit puts the UI back.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(commit: (n: number) => Promise<unknown> | unknown) {
  const log: string[] = [];
  let api!: ReturnType<typeof useOptimisticAction<number>>;
  function Host() {
    api = useOptimisticAction<number>({
      apply: (n) => log.push(`apply ${n}`),
      revert: (n) => log.push(`revert ${n}`),
      commit,
      message: "Archived",
      undoWindowMs: 1000,
    });
    return null;
  }
  return {
    log,
    get api() {
      return api;
    },
    Host,
  };
}

test("commits once when the window closes", async () => {
  const commit = vi.fn();
  const s = setup(commit);
  await render(<s.Host />);
  s.api.run(1);
  expect(s.log).toEqual(["apply 1"]);
  expect(commit).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1000);
  expect(commit).toHaveBeenCalledTimes(1);
});

test("undo reverts and never commits", async () => {
  const commit = vi.fn();
  const s = setup(commit);
  await render(<s.Host />);
  const id = s.api.run(2);
  expect(s.api.undo(id)).toBe(true);
  await vi.advanceTimersByTimeAsync(2000);
  expect(commit).not.toHaveBeenCalled();
  expect(s.log).toEqual(["apply 2", "revert 2"]);
  expect(s.api.undo(id)).toBe(false);
});

test("a rejected commit reverts", async () => {
  const s = setup(() => Promise.reject(new Error("nope")));
  await render(<s.Host />);
  s.api.run(3);
  await vi.advanceTimersByTimeAsync(1000);
  expect(s.log).toEqual(["apply 3", "revert 3"]);
});

test("unmount flushes a pending commit", async () => {
  const commit = vi.fn();
  const s = setup(commit);
  const screen = await render(<s.Host />);
  s.api.run(4);
  screen.unmount();
  await vi.advanceTimersByTimeAsync(0);
  expect(commit).toHaveBeenCalledTimes(1);
});
