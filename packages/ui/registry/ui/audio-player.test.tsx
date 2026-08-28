import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { AudioPlayer } from "./audio-player";

const SOURCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

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

test("renders the audio player with shared controls", async () => {
  const screen = await render(<AudioPlayer src={SOURCE} label="Demo audio" />);

  await expect
    .element(screen.getByRole("button", { name: "Play Demo audio" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("slider", { name: "Demo audio seek" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Mute Demo audio" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="media-player-skip-controls"]'),
  ).toBeNull();
});

test("renders optional title and description", async () => {
  const screen = await render(
    <AudioPlayer
      src={SOURCE}
      label="Demo audio"
      title="Launch briefing"
      description="Two minute product overview"
    />,
  );

  await expect.element(screen.getByText("Launch briefing")).toBeInTheDocument();
  await expect
    .element(screen.getByText("Two minute product overview"))
    .toBeInTheDocument();
});

test("plays and pauses through the custom transport", async () => {
  const onPlayStateChange = vi.fn();
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer
      ref={React.createRef<HTMLDivElement>()}
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo audio"
      onPlayStateChange={onPlayStateChange}
    />,
  );

  const media = mediaRef.current;
  expect(media).toBeInstanceOf(HTMLAudioElement);
  const play = vi.spyOn(media!, "play").mockImplementation(() => {
    setMediaState(media!, { paused: false });
    media!.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  const pause = vi.spyOn(media!, "pause").mockImplementation(() => {
    setMediaState(media!, { paused: true });
    media!.dispatchEvent(new Event("pause"));
  });

  await screen.getByRole("button", { name: "Play Demo audio" }).click();
  expect(play).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(true);

  await screen.getByRole("button", { name: "Pause Demo audio" }).click();
  expect(pause).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(false);
});

test("seeks against media time", async () => {
  const onTimeChange = vi.fn();
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo audio"
      onTimeChange={onTimeChange}
    />,
  );
  const media = mediaRef.current!;
  setMediaState(media, { currentTime: 30, duration: 120 });
  media.dispatchEvent(new Event("loadedmetadata"));

  await expect
    .element(screen.getByRole("slider", { name: "Demo audio seek" }))
    .toHaveAttribute("aria-valuenow", "30");

  screen.getByRole("slider", { name: "Demo audio seek" }).element().focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(media.currentTime).toBe(31);
  expect(onTimeChange).toHaveBeenLastCalledWith(31, 120);
});

test("supports keyboard playback, skip, and mute from the controls group", async () => {
  const onPlayStateChange = vi.fn();
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo audio"
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

  const group = screen.getByRole("group", {
    name: "Demo audio media controls",
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
    .element(screen.getByRole("button", { name: "Unmute Demo audio" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("supports the M shortcut while a child control is focused", async () => {
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer mediaRef={mediaRef} src={SOURCE} label="Demo audio" />,
  );

  screen.getByRole("button", { name: "Mute Demo audio" }).element().focus();
  await userEvent.keyboard("m");
  expect(mediaRef.current?.muted).toBe(true);
});

test("cycles playback speed", async () => {
  const onPlaybackRateChange = vi.fn();
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo audio"
      playbackRates={[1, 1.5]}
      onPlaybackRateChange={onPlaybackRateChange}
    />,
  );

  await screen.getByRole("button", { name: "Demo audio settings" }).click();
  await page.getByRole("menuitem", { name: /Playback speed/ }).hover();
  await page.getByRole("menuitemradio", { name: "1.5x" }).click();
  expect(mediaRef.current?.playbackRate).toBe(1.5);
  expect(onPlaybackRateChange).toHaveBeenLastCalledWith(1.5);
});

test("renders the waveform seek variant and seeks against media time", async () => {
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo audio"
      variant="waveform"
    />,
  );

  // The decorative bars render regardless of decode outcome (flat placeholder
  // bars are shown before/if decoding does not produce peaks).
  const bars = screen.container.querySelector(
    '[data-slot="media-player-waveform-bars"]',
  );
  expect(bars).not.toBeNull();
  expect(bars?.getAttribute("aria-hidden")).toBe("true");
  expect(bars?.childElementCount).toBeGreaterThan(0);

  // The transparent slider over the bars keeps full seek semantics.
  const media = mediaRef.current!;
  setMediaState(media, { currentTime: 30, duration: 120 });
  media.dispatchEvent(new Event("loadedmetadata"));

  await expect
    .element(screen.getByRole("slider", { name: "Demo audio seek" }))
    .toHaveAttribute("aria-valuenow", "30");

  screen.getByRole("slider", { name: "Demo audio seek" }).element().focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(media.currentTime).toBe(31);
});

test("forwards refs to the root and media element", async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const mediaRef = React.createRef<HTMLAudioElement>();
  await render(<AudioPlayer ref={rootRef} mediaRef={mediaRef} src={SOURCE} />);

  expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
  expect(rootRef.current?.dataset.slot).toBe("audio-player");
  expect(mediaRef.current).toBeInstanceOf(HTMLAudioElement);
});

test("has no accessibility violations", async () => {
  const screen = await render(<AudioPlayer src={SOURCE} label="Demo audio" />);
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations in the waveform variant", async () => {
  const screen = await render(
    <AudioPlayer src={SOURCE} label="Demo audio" variant="waveform" />,
  );
  await expectNoA11yViolations(screen.container);
});
