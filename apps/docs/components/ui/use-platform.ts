// @vegastack use-platform@0.7.5 sha256-6zKHL5VXeTGZX0KuBdjywU26IlDU1qTJMs9c2E0WSJA=

"use client";

import * as React from "react";

import { useMediaQuery } from "@/components/ui/use-media-query";

/* ---
`usePlatform` exists because nothing in the system detects the platform: `Kbd`'s `os`
prop rewrites ⌘⇧⌥ to Ctrl/Shift/Alt but is manual, so every consumer either guesses,
hardcodes ⌘, or ships the wrong modifier to half its users. This hook is the missing
detector — caller-side only.

The two halves answer differently, so they are read differently:
- **OS** is a one-shot `navigator` read. It cannot change mid-session, so it is state
  corrected once after hydration — no subscription to leak.
- **Pointer** is `(pointer: coarse)` through `useMediaQuery`, the system's one matchMedia
  subscription. It CAN change mid-session (a 2-in-1 detaching its keyboard, a tablet
  gaining a stylus), and a component that gates a drag affordance on `isTouch` has to
  follow that, so this half stays live rather than frozen at the post-hydration value.

Deliberately NOT done here:
- No wiring into `Kbd`. `kbd.tsx` has no 'use client' and must keep none — calling a
  navigator-reading hook inside it would force the directive and break RSC import for
  every existing consumer. Callers run this hook and pass the result down:
  `<Kbd os={os === "mac" ? "mac" : "other"} />` (Kbd's prop is the two-value union).
- No user-agent sniffing beyond the platform string. Browser identity, versions, and
  feature detection are out of scope; this answers only "which modifier conventions and
  which pointer" — the two things UI copy actually branches on.
--- */

/** Operating-system family, as UI copy cares about it (modifier keys, shortcuts). */
export type PlatformOS = "mac" | "windows" | "linux" | "other";

/** What {@link usePlatform} returns. */
export interface PlatformInfo {
  /** OS family. Apple platforms (macOS, iOS, iPadOS) all report `"mac"` — they share ⌘ conventions. */
  os: PlatformOS;
  /** Whether the primary pointer is coarse (touch). */
  isTouch: boolean;
}

/** Options for {@link usePlatform}. */
export interface UsePlatformOptions {
  /**
   * OS reported on the server render and the client's hydration render, before
   * the real value lands. Pick the majority of your audience to minimise the
   * post-hydration swap.
   * @default "other"
   */
  fallbackOs?: PlatformOS;
  /**
   * Touch state reported on the server render and the client's hydration
   * render, before the real `(pointer: coarse)` query is read.
   * @default false
   */
  fallbackIsTouch?: boolean;
}

/**
 * Classify a raw platform string (`navigator.userAgentData.platform` or
 * `navigator.platform`) into a {@link PlatformOS}. Pure and exported for reuse
 * and testing; prefer the {@link usePlatform} hook in components.
 *
 * Apple mobile platforms map to `"mac"` deliberately: an iPad with a hardware
 * keyboard uses ⌘, and that rendering is what consumers branch on. Android maps
 * to `"other"` — it is Linux-derived but shares no desktop-Linux shortcut copy.
 * (The hook cross-checks `navigator.userAgent` for Android, because
 * `navigator.platform` reports "Linux armv8l" there.)
 */
export function detectPlatformOs(raw: string): PlatformOS {
  const platform = raw.toLowerCase();
  if (/mac|iphone|ipad|ipod/.test(platform)) return "mac";
  if (platform.includes("win")) return "windows";
  if (platform.includes("android")) return "other";
  if (platform.includes("linux")) return "linux";
  return "other";
}

/**
 * `usePlatform` — SSR-safe platform detection: `{ os, isTouch }`. The server
 * render and the client's hydration render both report the caller-supplied
 * fallbacks (so markup agrees on first paint and React never warns about a
 * hydration mismatch); the real values land immediately after hydration.
 *
 * The OS is read once from `navigator.userAgentData.platform` with a
 * `navigator.platform` fallback — it cannot change mid-session. Touch is the
 * live `(pointer: coarse)` media query through `useMediaQuery`, because the
 * primary pointer CAN change mid-session (a 2-in-1 detaching its keyboard), and
 * a drag affordance gated on `isTouch` has to follow it. Pair with `Kbd` on the
 * caller side:
 *
 * @example
 * const { os } = usePlatform();
 * <Kbd keys={["⌘", "K"]} os={os === "mac" ? "mac" : "other"} />
 *
 * @example
 * // Gate a drag affordance off touch
 * const { isTouch } = usePlatform();
 * return isTouch ? <MoveMenu /> : <DragHandle />;
 */
export function usePlatform({
  fallbackOs = "other",
  fallbackIsTouch = false,
}: UsePlatformOptions = {}): PlatformInfo {
  const [os, setOs] = React.useState<PlatformOS>(fallbackOs);

  React.useEffect(() => {
    if (typeof navigator === "undefined") return;
    const nav = navigator as Navigator & {
      userAgentData?: { platform?: string };
    };
    const raw = nav.userAgentData?.platform ?? nav.platform ?? "";
    let detected = detectPlatformOs(raw);
    // Engines without userAgentData (Firefox, Safari) report
    // navigator.platform "Linux armv8l" on Android — the string never says
    // "android". The user agent does, everywhere.
    if (detected === "linux" && /android/i.test(nav.userAgent ?? ""))
      detected = "other";
    setOs(detected);
  }, []);

  const isTouch = useMediaQuery("(pointer: coarse)", {
    serverFallback: fallbackIsTouch,
  });

  // A NEW object identity only when a field actually changed, so a consumer that
  // depends on the returned object (an effect dep, a memo key) is not woken every render.
  return React.useMemo(() => ({ os, isTouch }), [os, isTouch]);
}
