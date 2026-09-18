import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeEach, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  MediaPlayerControls,
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
  if (state.currentTime != null) {
    // `currentTime` is instrumented rather than assigned. A media element in a unit test never
    // actually loads: with `readyState === HAVE_NOTHING` WebKit IGNORES a write to `currentTime`
    // (the spec's seek algorithm has nothing to seek), so the assertion below measured the engine's
    // media pipeline instead of the component's shortcut map, and read 0 in WebKit while passing in
    // Chromium. Backing the property with a plain value makes both engines report what the
    // component actually did, which is the contract under test.
    let time = state.currentTime;
    Object.defineProperty(media, "currentTime", {
      configurable: true,
      get: () => time,
      set: (next: number) => {
        time = next;
      },
    });
  }
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
    [data-slot="media-player-volume-surface"] [data-slot="slider"] > * {
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

    const mute = within(volume, "button");
    mute.focus();
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

    // The rail is the next tab stop after mute, and driving it drives the media element's volume —
    // the whole point of B4-04 for audio. Asserted on DOCUMENT ORDER rather than by pressing Tab:
    // since Batch 3 of the shadcn reset the real control is Base UI's hidden `<input type="range">`
    // inside the thumb, and it takes focus as the panel opens, so a literal Tab from mute now lands
    // one stop FURTHER on. Document order is the fact the claim was always about.
    const focusables = [
      ...compact.querySelectorAll<HTMLElement>("button, input"),
    ];
    expect(focusables[focusables.indexOf(mute) + 1]).toBe(rail);

    rail.focus();
    // `Home`, not an arrow: a vertical slider's real control is a native range input in
    // `writing-mode: vertical-lr`, where the platform decides which arrow walks which way — and the
    // rail starts at max, so half the mappings are a no-op. `Home` is min in every mapping, which
    // is what makes this assert the WIRING rather than a key map.
    // Drive the rail the way its own control is driven. Since Batch 3 of the shadcn reset the
    // control is Base UI's visually hidden `<input type="range">`: it is clipped to a 1px box, so
    // neither a hit test nor `userEvent.keyboard` reaches it in this CSS-free lane, and the
    // vertical rail additionally runs in `writing-mode: vertical-lr`, where the platform decides
    // which arrow walks which way. Setting the value through the native setter and dispatching
    // `input`/`change` is exactly the event pair a keypress produces, so the WIRING is what is
    // asserted rather than a key map.
    const setRangeValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    setRangeValue.call(rail, "40");
    rail.dispatchEvent(new Event("input", { bubbles: true }));
    rail.dispatchEvent(new Event("change", { bubbles: true }));
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
  // Batch 3 of the shadcn reset put Slider back on upstream's file, which has ONE look and no
  // `variant`/`thumb` axis, so the three media looks are call-site class strings on the Slider
  // root (`MEDIA_SLIDER` / `OVERLAY_SLIDER` / `HOVER_THUMB` in media-player-controls.tsx). The
  // rule this test exists for is unchanged and still asserted: the thumb is hidden at rest ONLY
  // where a pointer can hover, so a touch device keeps its scrub handle.
  const classes = seek.className;
  expect(classes).toContain(
    "[@media(hover:hover)]:[&_[data-slot=slider-thumb]]:opacity-0",
  );
  expect(classes).toContain("hover:[&_[data-slot=slider-thumb]]:opacity-100");
  expect(classes).toContain(
    "focus-within:[&_[data-slot=slider-thumb]]:opacity-100",
  );
  // The in-page player wears the muted media ink, not the overlay's.
  expect(classes).toContain("[&_[data-slot=slider-range]]:bg-muted-foreground");
  expect(classes).not.toContain("bg-media-foreground");
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

/**
 * A viewer's chosen playback speed must survive the consumer re-rendering. `timeupdate` fires
 * roughly four times a second while media plays, and a consumer passing an inline `onTimeChange`
 * (the shape every docs example uses) hands the controls a new callback identity on each of those
 * renders. While that identity sat in the media-element effect's dep array, the effect tore down
 * and re-ran at the same rate — and its first act was `media.playbackRate = defaultPlaybackRate`,
 * so a selected 2× snapped back to 1× within a quarter of a second of pressing play. Applying the
 * default is now its own effect, keyed on the default itself.
 */
test("a re-render with a fresh callback identity does not reset the playback rate", async () => {
  const mediaRef = React.createRef<HTMLMediaElement>();

  function Consumer() {
    const [, setTick] = React.useState(0);
    return (
      <div>
        <button type="button" onClick={() => setTick((n) => n + 1)}>
          re-render
        </button>
        <Host
          mediaRef={mediaRef as React.RefObject<HTMLMediaElement | null>}
          // Deliberately inline: a new identity on every render, which is the defect's trigger.
          onTimeChange={() => {}}
          defaultPlaybackRate={1}
        />
      </div>
    );
  }

  const screen = await render(<Consumer />);
  await expect.poll(() => mediaRef.current).not.toBeNull();

  const media = mediaRef.current as HTMLMediaElement;
  media.playbackRate = 2;

  await userEvent.click(screen.getByRole("button", { name: "re-render" }));
  await userEvent.click(screen.getByRole("button", { name: "re-render" }));

  expect(media.playbackRate).toBe(2);
});

/**
 * A frame that really enters document fullscreen, the way `video-player` does: the element passed
 * to `requestFullscreen()` is the one wrapping the media AND its transport. `requestFullscreen`
 * needs transient user activation, so the entry point is a real click.
 */
function FullscreenHost(
  props: Partial<React.ComponentProps<typeof MediaPlayerControls>>,
) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  return (
    <div ref={frameRef} data-testid="frame">
      <button
        type="button"
        onClick={() => frameRef.current?.requestFullscreen()}
      >
        enter fullscreen
      </button>
      <Host variant="overlay" onFullscreenToggle={() => {}} {...props} />
    </div>
  );
}

test("control chrome portals into the fullscreen element (OVL-14)", async () => {
  // The Fullscreen API paints the fullscreen subtree ONLY, so a portal to `<body>` is invisible:
  // before decision OVL-14 a fullscreen player showed no control labels and no settings menu.
  // OVL-14 gives upstream's `TooltipContent` and `DropdownMenuContent` a `container`
  // pass-through, and this component hands them `document.fullscreenElement` while it contains
  // the transport. What is asserted is the DOM position of the real chrome under real fullscreen.
  const screen = await render(<FullscreenHost qualityOptions={["1080p"]} />);
  const frame = screen.container.querySelector(
    '[data-testid="frame"]',
  ) as HTMLElement;

  await userEvent.click(
    screen.getByRole("button", { name: "enter fullscreen" }),
  );
  await vi.waitFor(() => {
    if (document.fullscreenElement !== frame) {
      throw new Error("not fullscreen yet");
    }
  });

  try {
    // A tooltip: hover the fullscreen control and find its popup inside the frame.
    const fullscreen = frame.querySelector(
      'button[aria-label="Fullscreen Demo media"]',
    ) as HTMLElement;
    await userEvent.hover(fullscreen);
    const tip = await vi.waitFor(() => {
      const node = document.querySelector('[data-slot="tooltip-content"]');
      if (!node) throw new Error("no tooltip yet");
      return node as HTMLElement;
    });
    expect(tip.textContent).toContain("Fullscreen (F)");
    expect(frame.contains(tip)).toBe(true);

    // The settings menu, which is the other portaled surface the gap swallowed.
    await userEvent.click(
      frame.querySelector(
        'button[aria-label="Demo media settings"]',
      ) as HTMLElement,
    );
    const menu = await vi.waitFor(() => {
      const node = document.querySelector(
        '[data-slot="dropdown-menu-content"]',
      );
      if (!node) throw new Error("no menu yet");
      return node as HTMLElement;
    });
    expect(menu.textContent).toContain("Playback speed");
    expect(frame.contains(menu)).toBe(true);
  } finally {
    // An open Base UI menu keeps a backdrop over the document, which would swallow the next
    // test's pointer. Close it before leaving.
    await userEvent.keyboard("{Escape}");
    await document.exitFullscreen();
    await vi.waitFor(() => {
      if (document.fullscreenElement) throw new Error("still fullscreen");
    });
  }
});

test("control chrome portals to <body> when nothing is fullscreen (OVL-14)", async () => {
  // The other half of OVL-14: the container is `null` unless the browser is painting a fullscreen
  // element that CONTAINS this transport, so an ordinary in-page player keeps upstream's default
  // and a page that fullscreens something else never captures these portals.
  const screen = await render(
    <Host variant="overlay" onFullscreenToggle={() => {}} />,
  );
  const frame = screen.container.firstElementChild as HTMLElement;
  const fullscreen = screen.container.querySelector(
    'button[aria-label="Fullscreen Demo media"]',
  ) as HTMLElement;
  await userEvent.hover(fullscreen);
  const tip = await vi.waitFor(() => {
    const node = document.querySelector('[data-slot="tooltip-content"]');
    if (!node) throw new Error("no tooltip yet");
    return node as HTMLElement;
  });
  expect(tip.textContent).toContain("Fullscreen (F)");
  expect(frame.contains(tip)).toBe(false);
  expect(document.body.contains(tip)).toBe(true);
});

test("the vertical volume rail releases upstream's 160px floor", async () => {
  // Upstream's `Slider` floors its vertical Control at `min-h-40` (160px), which is 48px taller
  // than this pill in the card variant and 80px taller in the overlay — and the pill does not
  // clip, so before Batch 7c of the shadcn reset the rail hung out of the bottom of its own
  // surface. Measured in the browser at the time: the control ran to 21338 inside a pill that
  // ended at 21277.
  //
  // What is asserted HERE is the class contract, because this lane injects its own stylesheet
  // (top of file) and would measure the mirror rather than the cascade. The PAINTED box is
  // measured in `test/media-chrome.browser.test.tsx`, which compiles the real theme.
  const screen = await render(<Host />);
  const group = compactLayout(screen.container);
  within(group, 'button[aria-label="Mute Demo media"]').focus();
  const surface = await vi.waitFor(() =>
    within(group, '[data-slot="media-player-volume-surface"]'),
  );
  const root = surface.querySelector('[data-slot="slider"]') as HTMLElement;
  expect(root.className).toContain("*:min-h-0!");
  // …and the two dead height classes that used to sit beside it are gone: upstream's root already
  // carries `data-vertical:h-full` at a higher specificity, so the pill is what sizes the rail.
  expect(root.className).not.toMatch(/(^|\s)h-20(\s|$)/);
  expect(root.className).not.toContain("h-[calc(2.5rem");
});
