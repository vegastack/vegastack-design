// @vegastack use-platform@0.23.27 sha256-WUYpwVmf9/70hHSmW+WQILvPQvM3T4j0GDvz8S+OG6k=

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

/** A key's label on a Mac, and everywhere else. */
interface KeyLabel {
  mac: string;
  other: string;
}

const MOD: KeyLabel = { mac: "\u2318", other: "Ctrl" };
const SHIFT: KeyLabel = { mac: "\u21e7", other: "Shift" };
const ALT: KeyLabel = { mac: "\u2325", other: "Alt" };
const CTRL: KeyLabel = { mac: "\u2303", other: "Ctrl" };
const ENTER: KeyLabel = { mac: "\u21b5", other: "Enter" };
const BACKSPACE: KeyLabel = { mac: "\u232b", other: "Bksp" };

/**
 * Lower-case named tokens, and the Mac glyphs a mac-first declaration uses. A glyph keeps itself on
 * a Mac, so `⏎` and `↵` both stay as written there and both read "Enter" elsewhere. The tokens are
 * case-sensitive on purpose: a key already written as a word (`"Enter"`, `"Shift"`) is a label,
 * and it renders as written on every platform.
 */
const NAMED_KEYS = new Map<string, KeyLabel>([
  ["mod", MOD],
  ["cmd", MOD],
  ["command", MOD],
  ["shift", SHIFT],
  ["alt", ALT],
  ["option", ALT],
  ["ctrl", CTRL],
  ["control", CTRL],
  ["enter", ENTER],
  ["return", ENTER],
  ["backspace", BACKSPACE],
]);
const GLYPH_KEYS = new Map<string, string>([
  ["\u2318", "Ctrl"],
  ["\u21e7", "Shift"],
  ["\u2325", "Alt"],
  ["\u2303", "Ctrl"],
  ["\u23ce", "Enter"],
  ["\u21b5", "Enter"],
  ["\u232b", "Bksp"],
]);

/**
 * One key token in the label `os` uses: `⌘` on a Mac and `Ctrl` elsewhere for `"mod"`, and the
 * same for the other modifiers. Takes a lower-case named token (`"mod"`, `"shift"`, `"alt"`,
 * `"ctrl"`, `"enter"`, `"backspace"`) or a Mac glyph (`"⌘"`, `"⇧"`, `"⌥"`, `"⌃"`, `"⏎"`, `"↵"`,
 * `"⌫"`); any other key (`"K"`, `"Esc"`, `"Enter"`) comes back unchanged.
 *
 * @example
 * formatShortcutKey("mod", os); // "⌘" on macOS, "Ctrl" elsewhere
 */
export function formatShortcutKey(key: string, os: PlatformOS): string {
  const mac = os === "mac";
  const named = NAMED_KEYS.get(key);
  if (named) return mac ? named.mac : named.other;
  if (mac) return key;
  return GLYPH_KEYS.get(key) ?? key;
}

/**
 * One chord as a single string: glyphs run together on a Mac (`⌘K`), words joined with `+`
 * elsewhere (`Ctrl+K`). For a sequence of chords, format each one.
 *
 * @example
 * const { os } = usePlatform();
 * formatShortcut(["mod", "K"], os); // "⌘K" or "Ctrl+K"
 */
export function formatShortcut(
  keys: readonly string[],
  os: PlatformOS,
): string {
  return keys
    .map((key) => formatShortcutKey(key, os))
    .join(os === "mac" ? "" : "+");
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

/**
 * `isEditableTarget` — whether a keyboard event started in a place that takes
 * typing: an `<input>`, a `<textarea>`, a `<select>`, or a `contenteditable`
 * element. A global shortcut must ignore these (INT-11), or a chord such as
 * Mod+B fires while the user is formatting text. It reads the event's
 * composed path, so a field inside an open shadow root still counts.
 *
 * Pair it with `event.defaultPrevented`, so a shortcut also yields to a
 * handler nearer the target that has already claimed the key.
 *
 * @example
 * React.useEffect(() => {
 *   const onKeyDown = (event: KeyboardEvent) => {
 *     if (event.defaultPrevented || isEditableTarget(event)) return;
 *     if (event.key === "?") openShortcuts();
 *   };
 *   window.addEventListener("keydown", onKeyDown);
 *   return () => window.removeEventListener("keydown", onKeyDown);
 * }, []);
 */
export function isEditableTarget(event: Event): boolean {
  const target = event.composedPath?.()[0] ?? event.target;
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}
