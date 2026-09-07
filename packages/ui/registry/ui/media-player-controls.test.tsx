import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeEach, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  MediaPlayerControls,
  assignRef,
  clampTime,
  formatDefaultTime,
  getMediaDuration,
  useMediaShortcuts,
} from "./media-player-controls";

const SOURCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

// Park the harness pointer in a far corner before every test. The transport
// renders at the top-left origin, and the volume control opens on
// `pointerenter` — so a pointer resting where the mute button lands makes
// "closed at rest" non-deterministic by test order. Same treatment the video
// player's suite already applies to its overlay.
beforeEach(async () => {
  const corner = document.createElement("div");
  corner.style.cssText =
    "position:fixed;right:0;bottom:0;width:8px;height:8px;z-index:2147483647;";
  document.body.append(corner);
  try {
    await userEvent.hover(corner);
  } finally {
    corner.remove();
  }
});

function setMediaState(
  media: HTMLMediaElement,
  state: { currentTime?: number; duration?: number; paused?: boolean },
) {
  if (state.currentTime != null) media.currentTime = state.currentTime;
  if (state.duration != null) {
    Object.defineProperty(media, "duration", {
      configurable: true,
      value: state.duration,
    });
  }
  if (state.paused != null) {
    Object.defineProperty(media, "paused", {
      configurable: true,
      value: state.paused,
    });
  }
}

/**
 * A host that owns the media element, exactly as a consumer composing the
 * controls around their own `<audio>`/`<video>` would.
 */
function Host({
  mediaRef,
  ...props
}: Partial<React.ComponentProps<typeof MediaPlayerControls>> & {
  mediaRef?: React.RefObject<HTMLMediaElement | null>;
}) {
  const internalRef = React.useRef<HTMLMediaElement>(null);
  const ref = mediaRef ?? internalRef;
  return (
    <div>
      <audio
        ref={ref as React.Ref<HTMLAudioElement>}
        src={SOURCE}
        preload="metadata"
        className="hidden"
      />
      <MediaPlayerControls mediaRef={ref} label="Demo media" {...props} />
    </div>
  );
}

// Both audio layouts are always in the DOM; a container query shows exactly one.
// The unit-test CSS carries no container-query utilities, so both are visible
// here and every shared control appears twice. Scope queries to the narrow
// layout, which owns every control.
function compactLayout(container: Element): HTMLElement {
  const el = container.querySelector<HTMLElement>(
    '[data-slot="media-player-actions-compact"]',
  );
  if (!el) throw new Error("narrow (compact) layout not found");
  return el;
}

/**
 * Base UI's `thumbAlignment="edge"` keeps the thumb `visibility: hidden` until
 * it can measure the rail, and the unit environment carries no compiled CSS, so
 * an unsized volume rail has no focusable thumb at all. Mirror just the sizes
 * the compiled utilities give it. (The video player's suite does the same for
 * its overlay rail.)
 */
function injectVolumeRailStyleMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    [data-slot="media-player-volume-surface"] {
      box-sizing: border-box;
      height: 112px;
      padding: 8px;
      width: 40px;
    }
    [data-slot="media-player-volume-surface"] [data-slot="slider-control"] {
      box-sizing: border-box;
      height: 80px;
      width: 24px;
    }
    [data-slot="media-player-volume-surface"] [data-slot="slider-track"] {
      height: 100%;
      width: 6px;
    }
    [data-slot="media-player-volume-surface"] [data-slot="slider-thumb"] {
      height: 12px;
      width: 12px;
    }
  `;
  document.head.append(style);
  return () => style.remove();
}

function within(root: Element, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`element not found: ${selector}`);
  return el;
}

test("renders the transport as a labelled group", async () => {
  const screen = await render(<Host />);
  const group = screen.container.querySelector(
    '[data-slot="media-player-controls"]',
  );

  expect(group?.getAttribute("role")).toBe("group");
  expect(group?.getAttribute("aria-label")).toBe("Demo media media controls");
  expect(group?.getAttribute("data-variant")).toBe("default");
  expect(group?.getAttribute("data-state")).toBe("paused");
  // TD-4: the group is not itself a tab stop — every control inside it is
  // focusable, so a stop on the wrapper would only add an empty one.
  expect(group?.hasAttribute("tabindex")).toBe(false);
});

test("plays and pauses through the shared transport", async () => {
  const onPlayStateChange = vi.fn();
  const mediaRef = React.createRef<HTMLMediaElement>();
  const screen = await render(
    <Host mediaRef={mediaRef} onPlayStateChange={onPlayStateChange} />,
  );
  const compact = compactLayout(screen.container);
  const media = mediaRef.current!;

  const play = vi.spyOn(media, "play").mockImplementation(() => {
    setMediaState(media, { paused: false });
    media.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  const pause = vi.spyOn(media, "pause").mockImplementation(() => {
    setMediaState(media, { paused: true });
    media.dispatchEvent(new Event("pause"));
  });

  await userEvent.click(
    within(compact, 'button[aria-label="Play Demo media"]'),
  );
  expect(play).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(true);

  await userEvent.click(
    within(compact, 'button[aria-label="Pause Demo media"]'),
  );
  expect(pause).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(false);
});

test("exposes mute and a volume rail in both layouts (B4-04)", async () => {
  const mediaRef = React.createRef<HTMLMediaElement>();
  const screen = await render(<Host mediaRef={mediaRef} />);

  // Audio used to have no volume control at all and mute was keyboard-only.
  // The control now exists in the wide layout AND the narrow one.
  const wide = within(screen.container, '[data-slot="media-player-actions"]');
  const compact = compactLayout(screen.container);
  expect(
    wide.querySelector('[data-slot="media-player-volume"]'),
  ).not.toBeNull();
  expect(
    compact.querySelector('[data-slot="media-player-volume"]'),
  ).not.toBeNull();

  const mute = within(compact, 'button[aria-label="Mute Demo media"]');
  expect(mute.getAttribute("aria-pressed")).toBe("false");

  await userEvent.click(mute);
  expect(mediaRef.current?.muted).toBe(true);
  await vi.waitFor(() => {
    expect(
      within(compact, 'button[aria-label="Unmute Demo media"]').getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });
});

test("reveals the volume rail on focus and sets media volume", async () => {
  const cleanup = injectVolumeRailStyleMirror();
  try {
    const mediaRef = React.createRef<HTMLMediaElement>();
    const screen = await render(<Host mediaRef={mediaRef} />);
    const compact = compactLayout(screen.container);
    const volume = within(compact, '[data-slot="media-player-volume"]');

    // Closed at rest — a hidden panel is not a keyboard trap.
    expect(
      volume.querySelector('[data-slot="media-player-volume-panel"]'),
    ).toBeNull();

    within(volume, "button").focus();
    const rail = await vi.waitFor(() =>
      within(
        volume,
        '[data-slot="media-player-volume-panel"] input[type="range"]',
      ),
    );
    // Vertical rail — the audit's `orientation` prop, now a documented Slider
    // API rather than a descendant override.
    expect(rail.getAttribute("aria-orientation")).toBe("vertical");
    expect(rail.getAttribute("aria-label")).toBe("Demo media volume");

    // The rail is the next tab stop after mute, and driving it drives the media
    // element's volume — the whole point of B4-04 for audio.
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(rail);
    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => {
      expect(mediaRef.current!.volume).toBeLessThan(1);
    });
  } finally {
    cleanup();
  }
});

test("runs only the letter shortcuts in the controls scope", async () => {
  // Inside the group a focused button already owns Space and a focused seek
  // slider already owns the arrows, so a shortcut must never steal them.
  const mediaRef = React.createRef<HTMLMediaElement>();
  const onPlayStateChange = vi.fn();
  const screen = await render(
    <Host mediaRef={mediaRef} onPlayStateChange={onPlayStateChange} />,
  );
  const media = mediaRef.current!;
  setMediaState(media, { currentTime: 30, duration: 120, paused: true });
  vi.spyOn(media, "play").mockImplementation(() => {
    setMediaState(media, { paused: false });
    media.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  vi.spyOn(media, "pause").mockImplementation(() => {
    setMediaState(media, { paused: true });
    media.dispatchEvent(new Event("pause"));
  });

  const group = within(screen.container, '[data-slot="media-player-controls"]');
  const compact = compactLayout(screen.container);
  within(compact, 'button[aria-label="Play Demo media"]').focus();

  await userEvent.keyboard("k");
  expect(onPlayStateChange).toHaveBeenLastCalledWith(true);

  await userEvent.keyboard("l");
  expect(media.currentTime).toBe(45);
  await userEvent.keyboard("j");
  expect(media.currentTime).toBe(30);

  await userEvent.keyboard("m");
  expect(media.muted).toBe(true);

  // Space belongs to the focused button, not to the shortcut map: the group's
  // handler must leave it alone.
  const spaceEvent = new KeyboardEvent("keydown", {
    key: " ",
    bubbles: true,
    cancelable: true,
  });
  group.querySelector("button")!.dispatchEvent(spaceEvent);
  expect(spaceEvent.defaultPrevented).toBe(false);
});

test("cycles playback rate and reports it", async () => {
  const onPlaybackRateChange = vi.fn();
  const mediaRef = React.createRef<HTMLMediaElement>();
  const screen = await render(
    <Host
      mediaRef={mediaRef}
      playbackRates={[1, 1.5, 0.5]}
      onPlaybackRateChange={onPlaybackRateChange}
    />,
  );
  const compact = compactLayout(screen.container);
  const speed = () =>
    within(compact, 'button[aria-label^="Change playback speed"]');

  expect(speed().textContent).toBe("1x");
  await userEvent.click(speed());
  expect(mediaRef.current?.playbackRate).toBe(1.5);
  expect(onPlaybackRateChange).toHaveBeenLastCalledWith(1.5);
});

test("renders overlay chrome on the theme-invariant media tokens (B4-01, D16)", async () => {
  const screen = await render(
    <Host
      variant="overlay"
      isFullscreen={false}
      onFullscreenToggle={() => {}}
    />,
  );
  const group = within(screen.container, '[data-slot="media-player-controls"]');

  expect(group.getAttribute("data-variant")).toBe("overlay");
  // The ink is the theme-invariant token, never `primary-foreground`, which
  // flips with the theme and inverted the chrome in dark.
  expect(group.className).toContain("text-media-foreground");
  expect(group.className).not.toContain("primary-foreground");
  // D17: the centralised outline, pulled inside the `overflow-hidden` frame —
  // no `ring-2` glow and no forced-colours carve-out.
  expect(group.className).toContain("-outline-offset-2");
  expect(group.className).not.toContain("ring-2");
  expect(group.className).not.toContain("forced-colors");

  // The overlay volume pill sits on the strong scrim.
  within(group, 'button[aria-label="Mute Demo media"]').focus();
  const surface = await vi.waitFor(() =>
    within(group, '[data-slot="media-player-volume-surface"]'),
  );
  expect(surface.className).toContain("bg-media-scrim-strong");

  // Overlay-only chrome: fullscreen + the settings menu.
  expect(
    group.querySelector('button[aria-label="Fullscreen Demo media"]'),
  ).not.toBeNull();
  expect(
    group.querySelector('button[aria-label="Demo media settings"]'),
  ).not.toBeNull();
});

test("renders no fullscreen control without a handler", async () => {
  const screen = await render(<Host variant="overlay" />);
  expect(
    screen.container.querySelector('button[aria-label^="Fullscreen"]'),
  ).toBeNull();
});

test("the seek slider asks for a touch-visible thumb (B4-04)", async () => {
  const screen = await render(<Host />);
  const seek = within(
    screen.container,
    '[data-slot="media-player-progress"] [data-slot="slider"]',
  );
  // `thumb="hover"` is the Slider API; the component — not the player — owns
  // the "visible at rest under (hover: none)" rule.
  expect(seek.getAttribute("data-thumb")).toBe("hover");
  expect(seek.getAttribute("data-variant")).toBe("media");
});

test("has no accessibility violations", async () => {
  const screen = await render(<Host onTranscriptClick={() => {}} />);
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations in the overlay variant", async () => {
  const screen = await render(
    <Host variant="overlay" onFullscreenToggle={() => {}} />,
  );
  await expectNoA11yViolations(screen.container);
});

/* ---------------------------------------------------------------------------
 * The helpers that used to be duplicated in audio-player and video-player.
 * ------------------------------------------------------------------------- */

test("assignRef writes both callback and object refs", () => {
  const objectRef = React.createRef<string>();
  assignRef(objectRef, "value");
  expect(objectRef.current).toBe("value");

  const seen: (string | null)[] = [];
  // Braced body on purpose: React 19's `RefCallback` returns void or a cleanup
  // function, so a concise body returning `push`'s number does not type-check.
  assignRef((value: string | null) => {
    seen.push(value);
  }, "callback");
  expect(seen).toEqual(["callback"]);

  // A missing ref is a no-op, not a throw.
  expect(() => assignRef(undefined, "ignored")).not.toThrow();
});

test("getMediaDuration reports 0 until the duration is finite", () => {
  expect(getMediaDuration(null)).toBe(0);
  expect(getMediaDuration({ duration: NaN } as HTMLMediaElement)).toBe(0);
  expect(getMediaDuration({ duration: Infinity } as HTMLMediaElement)).toBe(0);
  expect(getMediaDuration({ duration: 42 } as HTMLMediaElement)).toBe(42);
});

test("clampTime bounds a seek target", () => {
  const media = { duration: 100 } as HTMLMediaElement;
  expect(clampTime(media, -5)).toBe(0);
  expect(clampTime(media, 50)).toBe(50);
  expect(clampTime(media, 500)).toBe(100);
  // Before the duration is known there is no upper bound to clamp against.
  expect(clampTime({ duration: NaN } as HTMLMediaElement, 500)).toBe(500);
});

test("formatDefaultTime promotes to h:mm:ss past an hour", () => {
  expect(formatDefaultTime(-1)).toBe("0:00");
  expect(formatDefaultTime(NaN)).toBe("0:00");
  expect(formatDefaultTime(5)).toBe("0:05");
  expect(formatDefaultTime(65)).toBe("1:05");
  expect(formatDefaultTime(3725)).toBe("1:02:05");
});

test("useMediaShortcuts is one map, scoped (B4-02)", async () => {
  const onFullscreenToggle = vi.fn();
  const media = document.createElement("audio");
  Object.defineProperty(media, "duration", { configurable: true, value: 120 });
  media.currentTime = 30;
  // A detached element with no loaded source reports `paused`, so a play/pause
  // toggle takes the play branch; spy it to keep the unhandled rejection out.
  const play = vi.spyOn(media, "play").mockResolvedValue(undefined);

  let api: ReturnType<typeof useMediaShortcuts> | null = null;
  function Probe() {
    const mediaRef = React.useRef<HTMLMediaElement | null>(media);
    api = useMediaShortcuts({
      mediaRef,
      skipSeconds: 10,
      onFullscreenToggle,
    });
    return null;
  }
  await render(<Probe />);
  const shortcuts = api!;

  // Surface scope owns Space and the arrows.
  expect(shortcuts.runShortcut(" ", "surface")).toBe(true);
  expect(shortcuts.runShortcut("ArrowRight", "surface")).toBe(true);
  expect(media.currentTime).toBe(40);
  expect(shortcuts.runShortcut("ArrowLeft", "surface")).toBe(true);
  expect(media.currentTime).toBe(30);

  // Controls scope does not — the focused control keeps them.
  expect(shortcuts.runShortcut(" ", "controls")).toBe(false);
  expect(shortcuts.runShortcut("ArrowRight", "controls")).toBe(false);
  expect(media.currentTime).toBe(30);

  // Letters run in both scopes, F included — the copy inside the controls used
  // to omit it, which is how the two implementations drifted apart.
  expect(shortcuts.runShortcut("L", "controls")).toBe(true);
  expect(media.currentTime).toBe(40);
  expect(shortcuts.runShortcut("m", "controls")).toBe(true);
  expect(media.muted).toBe(true);
  expect(shortcuts.runShortcut("f", "controls")).toBe(true);
  expect(onFullscreenToggle).toHaveBeenCalledOnce();

  // An unbound key is not handled, so the surface never swallows it.
  expect(shortcuts.runShortcut("q", "surface")).toBe(false);
  expect(play).toHaveBeenCalledOnce();
});

test("F is unhandled when no fullscreen handler is supplied", async () => {
  const media = document.createElement("audio");
  let api: ReturnType<typeof useMediaShortcuts> | null = null;
  function Probe() {
    const mediaRef = React.useRef<HTMLMediaElement | null>(media);
    api = useMediaShortcuts({ mediaRef });
    return null;
  }
  await render(<Probe />);
  expect(api!.runShortcut("f", "surface")).toBe(false);
});
