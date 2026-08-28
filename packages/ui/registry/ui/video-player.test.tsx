import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { TIMINGS } from "@vegastack/design";
import { expectNoA11yViolations } from "../../test/a11y";
import { VideoPlayer } from "./video-player";

const SOURCE = "data:video/mp4;base64,";

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
    [data-slot="media-player-volume-surface"][data-variant="overlay"] [data-slot="slider-control"] {
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
  expect(
    screen.container
      .querySelector('[data-slot="media-player-progress"]')
      ?.classList.contains("[&_[data-slot=slider-thumb]]:opacity-0"),
  ).toBe(true);
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
    expect(progress?.classList.contains("group/media-progress")).toBe(true);
    expect(
      progress?.classList.contains(
        "[&_[data-slot=slider-track]]:transition-[height]",
      ),
    ).toBe(true);
    expect(
      progress?.classList.contains(
        "[&_[data-slot=slider-thumb]]:transition-opacity",
      ),
    ).toBe(true);
    expect(
      progress?.classList.contains("hover:[&_[data-slot=slider-track]]:h-1.5"),
    ).toBe(true);
    expect(
      progress?.classList.contains(
        "hover:[&_[data-slot=slider-thumb]]:opacity-100",
      ),
    ).toBe(true);

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

  for (const name of [
    "Play Demo video",
    "Mute Demo video",
    "Demo video settings",
    "Fullscreen Demo video",
  ]) {
    await expect
      .element(screen.getByRole("button", { name }))
      .toHaveAttribute("data-size", "icon");
  }

  const time = screen.container.querySelector(
    '[data-slot="media-player-time"]',
  );
  expect(time?.classList.contains("text-lg")).toBe(true);
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
  const group = screen.getByRole("group", {
    name: "Demo video media controls",
  });
  group.element().focus();
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

    await userEvent.unhover(frame!);
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
    await userEvent.unhover(frame);
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

test("selects video quality from the settings submenu", async () => {
  const onQualityChange = vi.fn();
  const screen = await render(
    <VideoPlayer
      src={SOURCE}
      label="Demo video"
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
    await expect
      .element(screen.getByRole("slider", { name: "Demo video volume" }))
      .toBeInTheDocument();

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
    expect(
      volumePanel
        ?.querySelector('[data-slot="slider"]')
        ?.classList.contains("[&_[data-slot=slider-control]]:flex-col"),
    ).toBe(true);
    expect(
      volumePanel
        ?.querySelector('[data-slot="slider"]')
        ?.classList.contains("[&_[data-slot=slider-thumb]]:size-3"),
    ).toBe(true);
    expect(
      volumePanel
        ?.querySelector('[data-slot="slider"]')
        ?.classList.contains(
          "[&_[data-slot=slider-control]]:h-[calc(var(--size-lg)+var(--spacing)*4)]",
        ),
    ).toBe(true);

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
    await expect
      .element(screen.getByRole("slider", { name: "Demo video volume" }))
      .toBeInTheDocument();
    volumePanel!.dispatchEvent(
      new PointerEvent("pointerover", {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
    await new Promise((resolve) =>
      setTimeout(resolve, TIMINGS.hoverCloseDelayMs + 50),
    );
    await expect
      .element(screen.getByRole("slider", { name: "Demo video volume" }))
      .toBeInTheDocument();

    screen.getByRole("button", { name: "Mute Demo video" }).element().focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(
      screen.getByRole("slider", { name: "Demo video volume" }).element(),
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(mediaRef.current?.volume).toBeLessThan(1);
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
