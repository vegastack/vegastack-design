import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeEach, expect, onTestFinished, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { TIMINGS } from "@vegastack/design";
import { expectNoA11yViolations } from "../../test/a11y";
import { VideoPlayer } from "./video-player";

// A real, playable 10-minute VP8 WebM of one grey 16×16 frame a minute (846 bytes, ffmpeg lavfi).
// It must really load: an unplayable source now shows the "can't play" card in place of the
// controls, which is its own test below; and it must be long, because the element clamps seeks.
const SOURCE =
  "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAMeEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEmTbuMU6uEHFO7a1OsggMI7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjIuMTIuMTAwV0GNTGF2ZjYyLjEyLjEwMESJiEEiT4AAAAAAFlSua8muAQAAAAAAAEDXgQFzxYgomqey49nGeJyBACK1nIN1bmSIgQCGhVZfVlA4g4EBI+ODhQ34R1gA4JCwgRC6gRCagQJVsIRVuYEBElTDZ/xzc6BjwIBnyJpFo4dFTkNPREVSRIeNTGF2ZjYyLjEyLjEwMHNz1mPAi2PFiCiap7Lj2cZ4Z8ihRaOHRU5DT0RFUkSHlExhdmM2Mi4yOC4xMDAgbGlidnB4Z8ihRaOIRFVSQVRJT05Eh5MwMDoxMDowMC4wMDAwMDAwMDAAH0O2dafngQCjooEAAIAQAgCdASoQABAAAEcIhYWImYSIAgIADA1gAP7D4AAfQ7Z1nueC6mCjmIEAAACxAQABEBAAGAAwP/QMAAAA/sPgAB9DtnWd54MB1MCjloEAAACxAQAMEYgAGAAwP/QMAAAA5EAfQ7Z1n+eDAr8go5iBAAAAsQEADBAQABgAMD/0DAAAAP7D4AAfQ7Z1nOeDA6mAo5WBAAAAsQEADxHkABgAGG/0DAAEAAAfQ7Z1n+eDBJPgo5iBAAAAsQEADxAQABgAMD/0DAAAAP7D4AAfQ7Z1nOeDBX5Ao5WBAAAAsQEADxH8ABgAGG/0DAAEAAAfQ7Z1nueDBmigo5eBAAAAkQEADxAQFGAAwP/QMAAA/sPgAB9DtnWc54MHUwCjlYEAAACxAQAPEfwAGAAYb/QMAAQAAB9DtnWd54MIPWCjloEAAACxAQAPEWgAGAAwP/QMAAAA5EAcU7trkbuPs4EAt4r3gQHxggGn8IED";
// Bytes no browser decodes — the "can't play" path.
const BROKEN = "data:video/mp4;base64,AAAA";

// Park the harness pointer in a far corner before every test. The player renders at the top-left
// origin, and Firefox dispatches a pointerenter when the frame appears under the resting pointer
// (Chromium does not) — which auto-shows the overlay and makes "controls hidden at rest" assertions
// flake by engine and test order. Parking the pointer away makes the at-rest state deterministic.
/**
 * Move the harness pointer to the far bottom-right, well clear of the player.
 *
 * `userEvent.unhover(frame)` is NOT equivalent: it parks the pointer at the viewport origin, and
 * the player renders at the top-left — so in WebKit the pointer lands back INSIDE the frame, no
 * `pointerleave` fires, and the overlay never hides. (Chromium happened to dispatch the leave
 * anyway, which is why this only ever failed on the cross-engine lane.) Hovering a real corner
 * element states where the pointer should go instead of relying on an engine's idea of "nowhere".
 */
async function parkPointer() {
  const corner = document.createElement("div");
  corner.style.cssText =
    "position:fixed;right:0;bottom:0;width:8px;height:8px;z-index:2147483647;";
  document.body.append(corner);
  try {
    await userEvent.hover(corner);
  } finally {
    corner.remove();
  }
}

// Park the harness pointer in a far corner before every test. The player renders at the top-left
// origin, and Firefox dispatches a pointerenter when the frame appears under the resting pointer
// (Chromium does not) — which auto-shows the overlay and makes "controls hidden at rest" assertions
// flake by engine and test order. Parking the pointer away makes the at-rest state deterministic.
beforeEach(parkPointer);

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

function injectVideoControlStyleMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    [data-slot="media-player-progress"] {
      display: block;
      height: 24px;
      width: 200px;
    }
    [data-slot="media-player-progress"] [data-slot="slider-track"] {
      height: 4px;
      transition-duration: 150ms;
      transition-property: height;
      transition-timing-function: ease;
    }
    [data-slot="media-player-progress"]:hover [data-slot="slider-track"],
    [data-slot="media-player-progress"]:focus-within [data-slot="slider-track"] {
      height: 6px;
    }
    [data-slot="media-player-progress"] [data-slot="slider-thumb"] {
      height: 16px;
      opacity: 0;
      transition-duration: 150ms;
      transition-property: opacity;
      transition-timing-function: ease;
      width: 16px;
    }
    [data-slot="media-player-progress"]:hover [data-slot="slider-thumb"],
    [data-slot="media-player-progress"]:focus-within [data-slot="slider-thumb"] {
      opacity: 1;
    }
    [data-slot="media-player-volume-surface"][data-variant="overlay"] {
      box-sizing: border-box;
      height: 80px;
      padding: 4px;
      width: 32px;
    }
    [data-slot="media-player-volume-surface"][data-variant="overlay"] [data-slot="slider"] > * {
      box-sizing: border-box;
      height: 56px;
      width: 24px;
    }
    [data-slot="media-player-volume-surface"][data-variant="overlay"] [data-slot="slider-track"] {
      height: 100%;
      width: 6px;
    }
    [data-slot="media-player-volume-surface"][data-variant="overlay"] [data-slot="slider-thumb"] {
      height: 12px;
      width: 12px;
    }
  `;
  document.head.append(style);
  return () => style.remove();
}

async function showVideoControls(container: HTMLElement) {
  const frame = container.querySelector('[data-slot="video-player-frame"]');
  expect(frame).not.toBeNull();
  await userEvent.hover(frame!);
  await vi.waitFor(() =>
    expect(
      container.querySelector('[data-slot="video-player-controls-overlay"]'),
    ).not.toBeNull(),
  );
  await vi.waitFor(() =>
    expect(
      (
        container.querySelector(
          '[data-slot="video-player-controls-overlay"]',
        ) as HTMLElement | null
      )?.dataset.state,
    ).toBe("visible"),
  );
}

test("renders the video frame with shared controls", async () => {
  const screen = await render(<VideoPlayer src={SOURCE} label="Demo video" />);

  const video = screen.container.querySelector(
    '[data-slot="video-player-media"]',
  );
  expect(video).toBeInstanceOf(HTMLVideoElement);
  expect(
    screen.container.querySelector(
      '[data-slot="video-player-controls-overlay"]',
    ),
  ).toBeNull();
  await showVideoControls(screen.container);
  await expect
    .element(screen.getByRole("button", { name: "Play Demo video" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Mute Demo video" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="media-player-skip-controls"]'),
  ).toBeNull();
  await expect
    .element(screen.getByRole("button", { name: "Fullscreen Demo video" }))
    .toBeInTheDocument();
  const playButton = screen
    .getByRole("button", { name: "Play Demo video" })
    .element();
  expect(playButton.classList.contains("bg-primary")).toBe(false);
  expect(
    playButton.querySelector("svg")?.classList.contains("fill-current"),
  ).toBe(true);
  // The seek's hidden-until-hover thumb and its overlay ink are call-site class strings on the
  // Slider ROOT since Batch 3 of the shadcn reset (upstream's Slider has one look and no
  // `variant`/`thumb` axis). What stays true: ONE owner writes them, and it is the controls
  // component — the PLAYER still reaches into nothing (audit B4-05).
  const seek = screen.container.querySelector(
    '[data-slot="media-player-progress"] [data-slot="slider"]',
  ) as HTMLElement;
  expect(seek.className).toContain(
    "[@media(hover:hover)]:[&_[data-slot=slider-thumb]]:opacity-0",
  );
  expect(seek.className).toContain(
    "[&_[data-slot=slider-range]]:bg-media-foreground",
  );
  expect(
    screen.container
      .querySelector('[data-slot="media-player-progress"]')
      ?.className.includes("[&_[data-slot=slider"),
  ).toBe(false);
});

test("uses a named, smoothly expanding video progress control", async () => {
  const cleanup = injectVideoControlStyleMirror();

  try {
    const mediaRef = React.createRef<HTMLVideoElement>();
    const screen = await render(
      <VideoPlayer mediaRef={mediaRef} src={SOURCE} label="Demo video" />,
    );
    setMediaState(mediaRef.current!, { currentTime: 30, duration: 90 });
    mediaRef.current!.dispatchEvent(new Event("loadedmetadata"));
    await showVideoControls(screen.container);

    const progress = screen.container.querySelector(
      '[data-slot="media-player-progress"]',
    ) as HTMLElement | null;
    const track = progress?.querySelector(
      '[data-slot="slider-track"]',
    ) as HTMLElement | null;
    const thumb = progress?.querySelector(
      '[data-slot="slider-thumb"]',
    ) as HTMLElement | null;
    expect(progress).not.toBeNull();
    expect(track).not.toBeNull();
    expect(thumb).not.toBeNull();
    expect(progress?.dataset.variant).toBe("overlay");
    // The growing track and the revealed thumb are written on the Slider ROOT now
    // (`GROWING_RAIL` / `HOVER_THUMB` in media-player-controls.tsx), because upstream's Slider has
    // no `variant`/`thumb` axis to hang them on. One owner still writes them, and it is still not
    // the player (audit B4-05).
    const seekRoot = progress?.querySelector(
      '[data-slot="slider"]',
    ) as HTMLElement;
    expect(seekRoot.className).toContain(
      "[&_[data-slot=slider-track]]:transition-[height,width]",
    );
    expect(seekRoot.className).toContain(
      "hover:[&_[data-slot=slider-track]]:data-horizontal:h-1.5",
    );
    expect(seekRoot.className).toContain(
      "[&_[data-slot=slider-thumb]]:transition-opacity",
    );
    expect(progress?.className.includes("[&_[data-slot=slider")).toBe(false);

    expect(getComputedStyle(track!).height).toBe("4px");
    expect(getComputedStyle(track!).transitionProperty).toBe("height");
    expect(getComputedStyle(thumb!).height).toBe("16px");
    expect(getComputedStyle(thumb!).opacity).toBe("0");
    expect(getComputedStyle(thumb!).transitionProperty).toBe("opacity");

    screen.getByRole("slider", { name: "Demo video seek" }).element().focus();
    await vi.waitFor(() => expect(getComputedStyle(track!).height).toBe("6px"));
    await vi.waitFor(() => expect(getComputedStyle(thumb!).opacity).toBe("1"));
  } finally {
    cleanup();
  }
});

test("uses larger video actions and a sans time readout", async () => {
  const screen = await render(<VideoPlayer src={SOURCE} label="Demo video" />);
  await showVideoControls(screen.container);

  // Since Batch 2 of the shadcn reset `Button` is upstream's and mirrors no `data-size`; the
  // square tier it resolves to IS the assertion. `size-8` is upstream's `icon`, the default
  // square tier — upstream has no `md`.
  for (const name of [
    "Play Demo video",
    "Mute Demo video",
    "Demo video settings",
    "Fullscreen Demo video",
  ]) {
    await expect
      .element(screen.getByRole("button", { name }))
      .toHaveClass("size-8");
  }

  const time = screen.container.querySelector(
    '[data-slot="media-player-time"]',
  );
  expect(time?.classList.contains("text-base")).toBe(true);
  expect(time?.classList.contains("font-mono")).toBe(false);
  expect(time?.classList.contains("tabular-nums")).toBe(true);
});

test("reflects aspect ratio and optional copy", async () => {
  const screen = await render(
    <VideoPlayer
      src={SOURCE}
      label="Demo video"
      title="Launch walkthrough"
      description="Interface tour"
      aspectRatio="square"
    />,
  );

  expect(
    screen.container.querySelector('[data-aspect-ratio="square"]'),
  ).not.toBeNull();
  await expect
    .element(screen.getByText("Launch walkthrough"))
    .toBeInTheDocument();
  await expect.element(screen.getByText("Interface tour")).toBeInTheDocument();
});

test("plays and pauses through the custom transport", async () => {
  const onPlayStateChange = vi.fn();
  const mediaRef = React.createRef<HTMLVideoElement>();
  const screen = await render(
    <VideoPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo video"
      onPlayStateChange={onPlayStateChange}
    />,
  );

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

  await showVideoControls(screen.container);
  await screen.getByRole("button", { name: "Play Demo video" }).click();
  expect(play).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(true);

  await screen.getByRole("button", { name: "Pause Demo video" }).click();
  expect(pause).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(false);
});

test("seeks against media time", async () => {
  const onTimeChange = vi.fn();
  const mediaRef = React.createRef<HTMLVideoElement>();
  const screen = await render(
    <VideoPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo video"
      onTimeChange={onTimeChange}
    />,
  );
  const media = mediaRef.current!;
  setMediaState(media, { currentTime: 30, duration: 120 });
  media.dispatchEvent(new Event("loadedmetadata"));

  await showVideoControls(screen.container);
  screen.getByRole("slider", { name: "Demo video seek" }).element().focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(media.currentTime).toBe(31);
  expect(onTimeChange).toHaveBeenLastCalledWith(31, 120);
});

test("supports keyboard playback, skip, and mute from the controls group", async () => {
  const onPlayStateChange = vi.fn();
  const mediaRef = React.createRef<HTMLVideoElement>();
  const screen = await render(
    <VideoPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo video"
      onPlayStateChange={onPlayStateChange}
    />,
  );
  const media = mediaRef.current!;
  setMediaState(media, { currentTime: 30, duration: 120, paused: true });
  const play = vi.spyOn(media, "play").mockImplementation(() => {
    setMediaState(media, { paused: false });
    media.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  vi.spyOn(media, "pause").mockImplementation(() => {
    setMediaState(media, { paused: true });
    media.dispatchEvent(new Event("pause"));
  });

  await showVideoControls(screen.container);
  // The controls group is no longer a tab stop (audit TD-4) — the FRAME is the
  // player's surface, and the `surface` scope is what owns Space and the
  // arrows. Inside the group those keys stay with the focused control.
  const group = screen.getByRole("group", {
    name: "Demo video media controls",
  });
  expect(group.element().hasAttribute("tabindex")).toBe(false);
  (
    screen.container.querySelector(
      '[data-slot="video-player-frame"]',
    ) as HTMLElement
  ).focus();
  await userEvent.keyboard(" ");
  expect(play).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(true);

  await userEvent.keyboard("k");
  expect(onPlayStateChange).toHaveBeenLastCalledWith(false);

  await userEvent.keyboard("{ArrowRight}");
  expect(media.currentTime).toBe(45);

  await userEvent.keyboard("{ArrowLeft}");
  expect(media.currentTime).toBe(30);

  await userEvent.keyboard("l");
  expect(media.currentTime).toBe(45);

  await userEvent.keyboard("j");
  expect(media.currentTime).toBe(30);

  await userEvent.keyboard("m");
  expect(media.muted).toBe(true);
  await expect
    .element(screen.getByRole("button", { name: "Unmute Demo video" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("supports keyboard transport from the video frame when controls are hidden", async () => {
  const onTimeChange = vi.fn();
  const onPlayStateChange = vi.fn();
  const mediaRef = React.createRef<HTMLVideoElement>();
  const screen = await render(
    <VideoPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo video"
      onPlayStateChange={onPlayStateChange}
      onTimeChange={onTimeChange}
    />,
  );
  const media = mediaRef.current!;
  const frame = screen.container.querySelector(
    '[data-slot="video-player-frame"]',
  ) as HTMLDivElement;
  setMediaState(media, { currentTime: 30, duration: 120, paused: true });
  const play = vi.spyOn(media, "play").mockImplementation(() => {
    setMediaState(media, { paused: false });
    media.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  vi.spyOn(media, "pause").mockImplementation(() => {
    setMediaState(media, { paused: true });
    media.dispatchEvent(new Event("pause"));
  });

  expect(
    screen.container.querySelector(
      '[data-slot="video-player-controls-overlay"]',
    ),
  ).toBeNull();

  frame.focus();
  await userEvent.keyboard(" ");
  expect(play).toHaveBeenCalledOnce();

  await userEvent.keyboard("{ArrowRight}");
  expect(media.currentTime).toBe(45);
  expect(onTimeChange).toHaveBeenLastCalledWith(45, 120);

  await userEvent.keyboard("{ArrowLeft}");
  expect(media.currentTime).toBe(30);

  await userEvent.keyboard("k");
  expect(onPlayStateChange).toHaveBeenLastCalledWith(false);

  await userEvent.keyboard("m");
  expect(media.muted).toBe(true);
});

test("shows overlay controls on hover and hides them after pointer leave", async () => {
  vi.useFakeTimers();

  try {
    const mediaRef = React.createRef<HTMLVideoElement>();
    const screen = await render(
      <VideoPlayer mediaRef={mediaRef} src={SOURCE} label="Demo video" />,
    );
    const media = mediaRef.current!;
    const frame = screen.container.querySelector(
      '[data-slot="video-player-frame"]',
    );
    expect(frame).not.toBeNull();
    expect(
      screen.container.querySelector(
        '[data-slot="video-player-controls-overlay"]',
      ),
    ).toBeNull();

    await userEvent.hover(frame!);
    await vi.waitFor(() =>
      expect(
        screen.container.querySelector(
          '[data-slot="video-player-controls-overlay"]',
        ),
      ).not.toBeNull(),
    );

    vi.spyOn(media, "play").mockImplementation(() => {
      setMediaState(media, { paused: false });
      media.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    await screen.getByRole("button", { name: "Play Demo video" }).click();

    // Focus retention and pointer-leave hiding are separate contracts. WebKit focuses the Play
    // button it clicks, so move focus out before asking this test to measure pointer-only hiding;
    // the adjacent fade/unmount test carries the same precondition.
    (document.activeElement as HTMLElement | null)?.blur();
    await parkPointer();
    await vi.advanceTimersByTimeAsync(999);
    expect(
      screen.container.querySelector(
        '[data-slot="video-player-controls-overlay"]',
      ),
    ).not.toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() =>
      expect(
        (
          screen.container.querySelector(
            '[data-slot="video-player-controls-overlay"]',
          ) as HTMLElement | null
        )?.dataset.state,
      ).toBe("hidden"),
    );
    expect(
      screen.container.querySelector(
        '[data-slot="video-player-controls-overlay"]',
      ),
    ).not.toBeNull();

    await vi.advanceTimersByTimeAsync(150);
    await vi.waitFor(() =>
      expect(
        screen.container.querySelector(
          '[data-slot="video-player-controls-overlay"]',
        ),
      ).toBeNull(),
    );

    await userEvent.hover(frame!);
    await vi.waitFor(() =>
      expect(
        screen.container.querySelector(
          '[data-slot="video-player-controls-overlay"]',
        ),
      ).not.toBeNull(),
    );
  } finally {
    vi.useRealTimers();
  }
});

test("keeps shortcuts active after the controls fade and unmount", async () => {
  vi.useFakeTimers();

  try {
    const mediaRef = React.createRef<HTMLVideoElement>();
    const screen = await render(
      <VideoPlayer mediaRef={mediaRef} src={SOURCE} label="Demo video" />,
    );
    const media = mediaRef.current!;
    const frame = screen.container.querySelector(
      '[data-slot="video-player-frame"]',
    ) as HTMLDivElement;
    setMediaState(media, { currentTime: 30, duration: 120, paused: true });
    vi.spyOn(media, "play").mockImplementation(() => {
      setMediaState(media, { paused: false });
      media.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    const pause = vi.spyOn(media, "pause").mockImplementation(() => {
      setMediaState(media, { paused: true });
      media.dispatchEvent(new Event("pause"));
    });

    await showVideoControls(screen.container);
    await screen.getByRole("button", { name: "Play Demo video" }).click();
    // The player deliberately holds the overlay open while focus is inside the frame, and engines
    // disagree on whether a click focuses the button it hit. Move focus out explicitly, so this
    // test measures the pointer-driven fade-and-unmount it is named for rather than an engine's
    // click-focus convention. (Without this it passed in Chromium and hung visible in WebKit.)
    (document.activeElement as HTMLElement | null)?.blur();
    await parkPointer();
    await vi.advanceTimersByTimeAsync(1150);
    await vi.waitFor(() =>
      expect(
        screen.container.querySelector(
          '[data-slot="video-player-controls-overlay"]',
        ),
      ).toBeNull(),
    );

    frame.blur();
    await userEvent.keyboard(" ");
    expect(pause).toHaveBeenCalledOnce();

    await userEvent.keyboard("{ArrowRight}");
    expect(media.currentTime).toBe(45);

    await userEvent.keyboard("{ArrowLeft}");
    expect(media.currentTime).toBe(30);
  } finally {
    vi.useRealTimers();
  }
});

test("cycles playback speed", async () => {
  const onPlaybackRateChange = vi.fn();
  const mediaRef = React.createRef<HTMLVideoElement>();
  const screen = await render(
    <VideoPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo video"
      playbackRates={[1, 1.5]}
      onPlaybackRateChange={onPlaybackRateChange}
    />,
  );

  await showVideoControls(screen.container);
  await screen.getByRole("button", { name: "Demo video settings" }).click();
  await page.getByRole("menuitem", { name: /Playback speed/ }).hover();
  await page.getByRole("menuitemradio", { name: "1.5x" }).click();
  expect(mediaRef.current?.playbackRate).toBe(1.5);
  expect(onPlaybackRateChange).toHaveBeenLastCalledWith(1.5);
});

test("has no quality entry unless qualities are passed", async () => {
  const screen = await render(<VideoPlayer src={SOURCE} label="Demo video" />);
  await showVideoControls(screen.container);
  await screen.getByRole("button", { name: "Demo video settings" }).click();
  await expect
    .element(page.getByRole("menuitem", { name: /Playback speed/ }))
    .toBeVisible();
  expect(document.body.textContent).not.toMatch(/Quality/);
  await userEvent.keyboard("{Escape}");
});

test("selects video quality from the settings submenu", async () => {
  const onQualityChange = vi.fn();
  const screen = await render(
    <VideoPlayer
      src={SOURCE}
      label="Demo video"
      qualityOptions={["720p", "1080p"]}
      onQualityChange={onQualityChange}
    />,
  );

  await showVideoControls(screen.container);
  await screen.getByRole("button", { name: "Demo video settings" }).click();
  await page.getByRole("menuitem", { name: /Quality/ }).hover();
  await page.getByRole("menuitemradio", { name: "1080p" }).click();
  expect(onQualityChange).toHaveBeenLastCalledWith("1080p");
});

test("keeps the volume slider reachable from the mute control", async () => {
  const cleanup = injectVideoControlStyleMirror();
  const mediaRef = React.createRef<HTMLVideoElement>();
  try {
    const screen = await render(
      <VideoPlayer mediaRef={mediaRef} src={SOURCE} label="Demo video" />,
    );

    await showVideoControls(screen.container);
    await userEvent.hover(
      screen.getByRole("button", { name: "Mute Demo video" }).element(),
    );
    /*
     * `querySelector`, not `getByRole("slider")`. Since Batch 3 of the shadcn reset the control
     * that holds the role is Base UI's visually hidden `<input type="range">` inside the thumb,
     * clipped to a 1px box — Playwright's role engine does not resolve it, and the a11y NAME is
     * asserted directly below instead.
     */
    const volumeRail = await vi.waitFor(() => {
      const input = screen.container.querySelector<HTMLInputElement>(
        '[data-slot="media-player-volume-panel"] input[type="range"]',
      );
      if (!input) throw new Error("volume rail not mounted");
      return input;
    });
    expect(volumeRail.getAttribute("aria-label")).toBe("Demo video volume");

    const volumeControl = screen.container.querySelector(
      '[data-slot="media-player-volume"]',
    );
    const volumePanel = screen.container.querySelector(
      '[data-slot="media-player-volume-panel"]',
    );
    const volumeSurface = volumePanel?.querySelector(
      '[data-slot="media-player-volume-surface"]',
    ) as HTMLElement | null;
    expect(volumeControl).not.toBeNull();
    expect(volumePanel).not.toBeNull();
    expect(volumeSurface?.dataset.variant).toBe("overlay");
    expect(volumeSurface?.classList.contains("h-20")).toBe(true);
    expect(volumeSurface?.classList.contains("px-1")).toBe(true);
    expect(volumeSurface?.classList.contains("py-1")).toBe(true);
    expect(getComputedStyle(volumeSurface!).width).toBe("32px");
    expect(getComputedStyle(volumeSurface!).padding).toBe("4px");
    // Vertical layout and overlay ink are Slider props now; the player passes
    // them instead of restyling Slider's internals from outside (audit B4-05).
    const volumeSlider = volumePanel?.querySelector(
      '[data-slot="slider"]',
    ) as HTMLElement;
    expect(volumeSlider.getAttribute("data-orientation")).toBe("vertical");
    // The overlay ink is a call-site class string on the Slider ROOT since Batch 3 of the shadcn
    // reset (upstream's Slider has no `variant` axis). The PLAYER still restyles nothing: the
    // controls component owns it, and the surface below carries the variant marker.
    expect(volumeSlider.className).toContain(
      "[&_[data-slot=slider-range]]:bg-media-foreground",
    );

    // The volume slider uses Base UI `thumbAlignment="edge"` so the thumb stays
    // inset within the surface at the 0% and 100% extremes instead of letting its
    // half overflow the rounded surface. Edge alignment positions the thumb via an
    // inline `--position` custom property; the default `center` alignment does not
    // set it, so its presence is a deterministic guard against a regression.
    const volumeThumb = volumePanel?.querySelector(
      '[data-slot="slider-thumb"]',
    ) as HTMLElement | null;
    expect(volumeThumb).not.toBeNull();
    expect(volumeThumb!.style.getPropertyValue("--position")).not.toBe("");

    await userEvent.unhover(volumeControl!);
    expect(volumeRail.isConnected).toBe(true);
    volumePanel!.dispatchEvent(
      new PointerEvent("pointerover", {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
    await new Promise((resolve) =>
      setTimeout(resolve, TIMINGS.hoverCloseDelayMs + 50),
    );
    expect(
      screen.container.querySelector(
        '[data-slot="media-player-volume-panel"] input[type="range"]',
      ),
    ).not.toBeNull();

    // The rail is the next tab stop after mute, asserted on DOCUMENT ORDER: Base UI moves focus
    // into the panel as it opens, so a literal Tab from mute lands one stop further on.
    const mute = screen
      .getByRole("button", { name: "Mute Demo video" })
      .element() as HTMLElement;
    const focusables = [
      ...screen.container.querySelectorAll<HTMLElement>("button, input"),
    ];
    expect(focusables[focusables.indexOf(mute) + 1]).toBe(volumeRail);

    // Driving the rail drives the media element. The control is clipped to a 1px box, so the
    // native value setter plus `input`/`change` is the event pair a keypress produces.
    const setRangeValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    setRangeValue.call(volumeRail, "40");
    volumeRail.dispatchEvent(new Event("input", { bubbles: true }));
    volumeRail.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(mediaRef.current?.volume).toBeLessThan(1));
  } finally {
    cleanup();
  }
});

test("reflects fullscreen entry and exit in the overlay control", async () => {
  const screen = await render(<VideoPlayer src={SOURCE} label="Demo video" />);
  const frame = screen.container.querySelector(
    '[data-slot="video-player-frame"]',
  ) as HTMLDivElement;
  let fullscreenElement: Element | null = null;
  const originalFullscreenElement = Object.getOwnPropertyDescriptor(
    document,
    "fullscreenElement",
  );
  const originalExitFullscreen = Object.getOwnPropertyDescriptor(
    document,
    "exitFullscreen",
  );
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  });
  const requestFullscreen = vi.fn(async () => {
    fullscreenElement = frame;
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  const exitFullscreen = vi.fn(async () => {
    fullscreenElement = null;
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  Object.defineProperty(frame, "requestFullscreen", {
    configurable: true,
    value: requestFullscreen,
  });
  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    value: exitFullscreen,
  });

  try {
    await showVideoControls(screen.container);
    const enter = screen.getByRole("button", {
      name: "Fullscreen Demo video",
    });
    await expect.element(enter).toHaveAttribute("aria-pressed", "false");
    await enter.click();
    expect(requestFullscreen).toHaveBeenCalledOnce();
    const exit = screen.getByRole("button", {
      name: "Exit fullscreen Demo video",
    });
    await expect.element(exit).toHaveAttribute("aria-pressed", "true");
    expect(exit.element().querySelector("svg")?.classList).toContain(
      "lucide-minimize",
    );

    await exit.click();
    expect(exitFullscreen).toHaveBeenCalledOnce();
    await expect
      .element(screen.getByRole("button", { name: "Fullscreen Demo video" }))
      .toHaveAttribute("aria-pressed", "false");

    frame.focus();
    await userEvent.keyboard("f");
    expect(requestFullscreen).toHaveBeenCalledTimes(2);
  } finally {
    if (originalFullscreenElement) {
      Object.defineProperty(
        document,
        "fullscreenElement",
        originalFullscreenElement,
      );
    } else {
      Reflect.deleteProperty(document, "fullscreenElement");
    }
    if (originalExitFullscreen) {
      Object.defineProperty(document, "exitFullscreen", originalExitFullscreen);
    } else {
      Reflect.deleteProperty(document, "exitFullscreen");
    }
  }
});

test("forwards refs to the root and media element", async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const mediaRef = React.createRef<HTMLVideoElement>();
  await render(<VideoPlayer ref={rootRef} mediaRef={mediaRef} src={SOURCE} />);

  expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
  expect(rootRef.current?.dataset.slot).toBe("video-player");
  expect(mediaRef.current).toBeInstanceOf(HTMLVideoElement);
});

test("has no accessibility violations", async () => {
  const screen = await render(<VideoPlayer src={SOURCE} label="Demo video" />);
  await expectNoA11yViolations(screen.container);
});

test("never autoplays, and shows the poster until playback starts", async () => {
  const mediaRef = React.createRef<HTMLVideoElement>();
  await render(
    <VideoPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      poster="/poster.jpg"
      label="Demo video"
    />,
  );
  const media = mediaRef.current!;
  expect(media.autoplay).toBe(false);
  expect(media.getAttribute("poster")).toBe("/poster.jpg");
  expect(media.getAttribute("preload")).toBe("metadata");
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(media.paused).toBe(true);
});

test("a video the browser cannot play shows the card with a Download button", async () => {
  const onError = vi.fn();
  const screen = await render(
    <VideoPlayer
      src={BROKEN}
      label="Clip"
      poster="/poster.jpg"
      downloadHref="/download/clip.mov"
      onError={onError}
    />,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Can’t play this video here");
  const download = screen.getByRole("link", { name: "Download" }).element();
  expect(download.getAttribute("href")).toBe("/download/clip.mov");
  expect(download.hasAttribute("download")).toBe(true);
  expect(
    screen.container
      .querySelector('[data-slot="video-player"]')
      ?.getAttribute("data-state"),
  ).toBe("error");
  expect(onError).toHaveBeenCalled();
  // The transport is gone: there is nothing to play.
  await userEvent.hover(
    screen.container.querySelector('[data-slot="video-player-frame"]')!,
  );
  expect(
    screen.container.querySelector('[data-slot="media-player-controls"]'),
  ).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("the card takes its own copy, and shows no button without a download URL", async () => {
  const screen = await render(
    <VideoPlayer
      src={BROKEN}
      label="Clip"
      loadErrorLabel="This format can’t play in the browser"
    />,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("This format can’t play in the browser");
  expect(screen.container.querySelector("a")).toBeNull();
});

test("onSourceExpired renews an expired URL once and resumes where playback stopped", async () => {
  let settle!: (url: string) => void;
  const renew = vi.fn(
    () => new Promise<string>((resolve) => (settle = resolve)),
  );
  const mediaRef = React.createRef<HTMLVideoElement>();
  const screen = await render(
    <VideoPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Clip"
      onSourceExpired={renew}
    />,
  );
  const video = mediaRef.current!;
  await vi.waitFor(() => expect(video.readyState).toBeGreaterThan(0));
  video.currentTime = 30;
  Object.defineProperty(video, "paused", { configurable: true, value: false });
  video.dispatchEvent(new Event("error"));
  await vi.waitFor(() => expect(renew).toHaveBeenCalledOnce());
  // No card while the renewal is in hand.
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.container.querySelector('[role="alert"]')).toBeNull();
  const play = vi.spyOn(video, "play").mockResolvedValue();
  const fresh = `${SOURCE}#fresh`;
  settle(fresh);
  await vi.waitFor(() => expect(video.getAttribute("src")).toBe(fresh));
  video.dispatchEvent(new Event("loadedmetadata"));
  expect(video.currentTime).toBe(30);
  expect(play).toHaveBeenCalled();

  // Once: a second failure is the card, not another renewal.
  video.dispatchEvent(new Event("error"));
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Can’t play this video here");
  expect(renew).toHaveBeenCalledOnce();
});

test("a rejected renewal shows the card", async () => {
  const screen = await render(
    <VideoPlayer
      src={BROKEN}
      label="Clip"
      onSourceExpired={() => Promise.reject(new Error("gone"))}
    />,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Can’t play this video here");
});

test("a renewal that returns the same URL (a route that re-signs) reloads it", async () => {
  const mediaRef = React.createRef<HTMLVideoElement>();
  await render(
    <VideoPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Clip"
      onSourceExpired={async () => SOURCE}
    />,
  );
  const video = mediaRef.current!;
  const load = vi.spyOn(video, "load");
  video.dispatchEvent(new Event("error"));
  await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
});

/** Answer every media query as `matches(query)` for the rest of the test. */
function stubMediaQueries(matches: (query: string) => boolean) {
  const spy = vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: matches(query),
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
  onTestFinished(() => spy.mockRestore());
}

test("on a coarse pointer (touch) the controls, and the play button, are always shown", async () => {
  stubMediaQueries((query) => query === "(pointer: coarse)");
  const screen = await render(<VideoPlayer src={SOURCE} label="Walkthrough" />);
  const overlay = () =>
    screen.container.querySelector<HTMLElement>(
      '[data-slot="video-player-controls-overlay"]',
    );
  await expect.poll(() => overlay()?.dataset.state).toBe("visible");
  await expect
    .element(screen.getByRole("button", { name: /^Play/ }))
    .toBeInTheDocument();
});
