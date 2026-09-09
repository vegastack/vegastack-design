import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import {
  detectPlatformOs,
  usePlatform,
  type PlatformInfo,
  type UsePlatformOptions,
} from "./use-platform";

test("detectPlatformOs classifies every family UI copy branches on", () => {
  expect(detectPlatformOs("MacIntel")).toBe("mac");
  expect(detectPlatformOs("macOS")).toBe("mac");
  // Apple mobile shares ⌘ conventions (hardware keyboards) — deliberate.
  expect(detectPlatformOs("iPhone")).toBe("mac");
  expect(detectPlatformOs("iPad")).toBe("mac");
  expect(detectPlatformOs("Win32")).toBe("windows");
  expect(detectPlatformOs("Windows")).toBe("windows");
  expect(detectPlatformOs("Linux x86_64")).toBe("linux");
  // Android is Linux-derived but shares no desktop-Linux shortcut copy.
  expect(detectPlatformOs("Android")).toBe("other");
  expect(detectPlatformOs("")).toBe("other");
  expect(detectPlatformOs("FreeBSD amd64")).toBe("other");
});

function Harness({
  onRender,
  ...options
}: UsePlatformOptions & { onRender: (info: PlatformInfo) => void }) {
  const info = usePlatform(options);
  onRender(info);
  return (
    <span data-testid="os">
      {info.os}:{String(info.isTouch)}
    </span>
  );
}

test("fallbackOs holds the first render; the real platform lands after the effect", async () => {
  const seen: PlatformInfo[] = [];
  const screen = await render(
    <Harness
      fallbackOs="windows"
      fallbackIsTouch
      onRender={(i) => seen.push(i)}
    />,
  );
  // The OS half is state corrected in an effect, so the first render IS the fallback.
  expect(seen[0]!.os).toBe("windows");
  // The TOUCH half is `useSyncExternalStore`. `fallbackIsTouch` is the SERVER snapshot — React
  // uses it for the server render and for hydration, NOT for a client-only mount like this one,
  // where `getSnapshot` reads the real query on the very first render. That is the point of the
  // rewrite: on the client there is no wasted frame reporting a value nobody asked for.
  expect(seen[0]!.isTouch).toBe(false);
  // This browser-mode environment is a desktop Chromium — a real, non-fallback value.
  await expect
    .element(screen.getByTestId("os"))
    .toMatchTextContent(/^(mac|windows|linux|other):false$/);
  const last = seen[seen.length - 1]!;
  expect(last.os).toBe(
    detectPlatformOs(
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ?? navigator.platform,
    ),
  );
  expect(last.isTouch).toBe(false);
});

test("defaults are os:other, isTouch:false before correction", async () => {
  const seen: PlatformInfo[] = [];
  await render(<Harness onRender={(i) => seen.push(i)} />);
  expect(seen[0]).toEqual({ os: "other", isTouch: false });
});

test("the returned object keeps its identity while nothing changes", async () => {
  // Consumers put `{ os, isTouch }` in effect deps; a new object every render would wake them.
  const seen: PlatformInfo[] = [];
  const screen = await render(<Harness onRender={(i) => seen.push(i)} />);
  await expect
    .element(screen.getByTestId("os"))
    .toMatchTextContent(/^(mac|windows|linux|other):false$/);
  const settled = seen[seen.length - 1]!;
  expect(seen.filter((info) => info === settled).length).toBeGreaterThan(0);
  // Every DISTINCT object seen must differ in a field — no identity churn.
  const distinct = [...new Set(seen)];
  const serialized = new Set(
    distinct.map((info) => `${info.os}:${info.isTouch}`),
  );
  expect(serialized.size).toBe(distinct.length);
});

test("isTouch follows a live (pointer: coarse) change", async () => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let coarse = false;
  const spy = vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return query === "(pointer: coarse)" ? coarse : false;
        },
        media: query,
        onchange: null,
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners.add(listener);
        },
        removeEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners.delete(listener);
        },
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
  try {
    const screen = await render(<Harness onRender={() => {}} />);
    await expect
      .element(screen.getByTestId("os"))
      .toMatchTextContent(/:false$/);

    // A 2-in-1 detaching its keyboard: the pointer really does change mid-session.
    coarse = true;
    for (const listener of listeners) {
      listener({
        matches: true,
        media: "(pointer: coarse)",
      } as MediaQueryListEvent);
    }
    await expect.element(screen.getByTestId("os")).toMatchTextContent(/:true$/);
  } finally {
    spy.mockRestore();
  }
});

test("no a11y violations — hook harness", async () => {
  const { expectNoA11yViolations } = await import("../../test/a11y");
  const screen = await render(<Harness onRender={() => {}} />);
  await expectNoA11yViolations(screen.container);
});
