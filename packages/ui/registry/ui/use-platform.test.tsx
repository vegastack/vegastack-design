import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
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

test("first render reports the fallbacks; the real platform lands after the effect", async () => {
  const seen: PlatformInfo[] = [];
  const screen = await render(
    <Harness
      fallbackOs="windows"
      fallbackIsTouch
      onRender={(i) => seen.push(i)}
    />,
  );
  // Hydration-equivalent first render must be the fallback (SSR agreement).
  expect(seen[0]).toEqual({ os: "windows", isTouch: true });
  // This browser-mode environment is a desktop Chromium — a real, non-fallback value.
  await expect
    .element(screen.getByTestId("os"))
    .toHaveTextContent(/^(mac|windows|linux|other):false$/);
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
