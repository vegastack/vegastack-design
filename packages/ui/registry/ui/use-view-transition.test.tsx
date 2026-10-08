import { expect, test, vi } from "vitest";
import { startViewTransition } from "./use-view-transition";

test("runs the update directly under reduced motion", async () => {
  const spy = vi
    .spyOn(window, "matchMedia")
    .mockReturnValue({ matches: true } as MediaQueryList);
  const update = vi.fn();
  await startViewTransition(update);
  expect(update).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});
