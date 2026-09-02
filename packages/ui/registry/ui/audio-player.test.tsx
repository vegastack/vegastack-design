import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
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

// Audio renders two layouts — a single-line wide layout and a two-line narrow
// (mobile) layout — both always in the DOM, with a container query showing one.
// The unit-test CSS carries no container-query utilities (containerType reads
// `normal`), so BOTH layouts are visible here and each shared control appears
// twice. Scope control queries to the narrow layout, which owns every control
// (transcript, rewind, play, forward, seek, speed); the responsive swap itself
// is a docs-build behaviour covered by the contract suite.
function compactLayout(container: Element): HTMLElement {
  const el = container.querySelector<HTMLElement>(
    '[data-slot="media-player-actions-compact"]',
  );
  if (!el) throw new Error("narrow (compact) layout not found");
  return el;
}

function within(root: Element, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`element not found: ${selector}`);
  return el;
}

test("renders the audio player with shared controls", async () => {
  const screen = await render(<AudioPlayer src={SOURCE} label="Demo audio" />);
  const compact = compactLayout(screen.container);

  expect(
    within(compact, 'button[aria-label="Play Demo audio"]'),
  ).not.toBeNull();
  expect(within(compact, 'input[type="range"]')).not.toBeNull();
  // Audio carries no volume control — no mute button on the transport.
  expect(
    screen.container.querySelector('[data-slot="media-player-volume"]'),
  ).toBeNull();
  // Visible rewind/forward transport buttons.
  expect(
    within(compact, 'button[aria-label="Rewind 15 seconds"]'),
  ).not.toBeNull();
  expect(
    within(compact, 'button[aria-label="Forward 15 seconds"]'),
  ).not.toBeNull();
  // The wide layout keeps its inline skip-controls group.
  expect(
    screen.container.querySelector('[data-slot="media-player-skip-controls"]'),
  ).not.toBeNull();
  // No transcript control unless the consumer wires `onTranscriptClick`.
  expect(
    compact.querySelector('button[aria-label="Demo audio transcript"]'),
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
  const compact = compactLayout(screen.container);

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

  await userEvent.click(
    within(compact, 'button[aria-label="Play Demo audio"]'),
  );
  expect(play).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(true);

  await userEvent.click(
    within(compact, 'button[aria-label="Pause Demo audio"]'),
  );
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
  const compact = compactLayout(screen.container);
  const media = mediaRef.current!;
  setMediaState(media, { currentTime: 30, duration: 120 });
  media.dispatchEvent(new Event("loadedmetadata"));

  const slider = within(compact, 'input[type="range"]');
  await vi.waitFor(() => {
    expect(slider.getAttribute("aria-valuenow")).toBe("30");
  });

  slider.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(media.currentTime).toBe(31);
  expect(onTimeChange).toHaveBeenLastCalledWith(31, 120);
});

test("shows hours in the readout and seeks across a multi-hour track", async () => {
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer mediaRef={mediaRef} src={SOURCE} label="Demo audio" />,
  );
  const compact = compactLayout(screen.container);
  const media = mediaRef.current!;
  // A 3-hour track, one hour and change into playback. Define both properties
  // directly — a media element with no loaded timeline clamps an assigned
  // currentTime, and this exercises the readout/seek logic, not the engine.
  Object.defineProperty(media, "duration", {
    configurable: true,
    value: 10800,
  });
  Object.defineProperty(media, "currentTime", {
    configurable: true,
    value: 3725,
  });
  media.dispatchEvent(new Event("loadedmetadata"));

  // The seek tracks a multi-hour position — the range is bound to the real
  // duration, not capped.
  const slider = within(compact, 'input[type="range"]');
  await vi.waitFor(() => {
    expect(slider.getAttribute("aria-valuenow")).toBe("3725");
  });

  // The narrow split readout switches to h:mm:ss on both edges once past an hour.
  await vi.waitFor(() => {
    expect(
      within(compact, '[data-slot="media-player-time-elapsed"]').textContent,
    ).toBe("1:02:05");
    expect(
      within(compact, '[data-slot="media-player-time-duration"]').textContent,
    ).toBe("3:00:00");
  });
});

test("renders the wide inline readout and the narrow split timers", async () => {
  // The wide layout's combined inline readout and the narrow layout's split
  // elapsed/duration timers are both in the DOM; a container query picks which
  // layout is visible. The container-query CSS is only exercised in the full
  // docs build, so the responsive swap itself is covered by the contract suite —
  // here we lock the markup and that both carry the same, correctly formatted
  // times.
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer mediaRef={mediaRef} src={SOURCE} label="Demo audio" />,
  );
  const compact = compactLayout(screen.container);
  const media = mediaRef.current!;
  Object.defineProperty(media, "duration", { configurable: true, value: 130 });
  Object.defineProperty(media, "currentTime", {
    configurable: true,
    value: 65,
  });
  media.dispatchEvent(new Event("loadedmetadata"));

  const inline = screen.container.querySelector(
    '[data-slot="media-player-time"]',
  );
  const elapsed = within(compact, '[data-slot="media-player-time-elapsed"]');
  const duration = within(compact, '[data-slot="media-player-time-duration"]');

  await vi.waitFor(() => {
    // Wide: combined. Narrow: two edges — elapsed then duration, each formatted
    // independently.
    expect(inline?.textContent).toBe("1:05 / 2:10");
    expect(elapsed.textContent).toBe("1:05");
    expect(duration.textContent).toBe("2:10");
  });
});

test("renders and fires the transcript control on a narrow player", async () => {
  const onTranscriptClick = vi.fn();
  const screen = await render(
    <AudioPlayer
      src={SOURCE}
      label="Demo audio"
      onTranscriptClick={onTranscriptClick}
    />,
  );
  const compact = compactLayout(screen.container);

  const transcript = within(
    compact,
    'button[aria-label="Demo audio transcript"]',
  );
  await userEvent.click(transcript);
  expect(onTranscriptClick).toHaveBeenCalledOnce();
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

  // Mute has no visible control on audio, but the M shortcut still toggles it.
  await userEvent.keyboard("m");
  expect(media.muted).toBe(true);
});

test("supports the M shortcut while a child control is focused", async () => {
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer mediaRef={mediaRef} src={SOURCE} label="Demo audio" />,
  );
  const compact = compactLayout(screen.container);

  within(compact, 'button[aria-label="Play Demo audio"]').focus();
  await userEvent.keyboard("m");
  expect(mediaRef.current?.muted).toBe(true);
});

test("cycles playback speed through the tappable control", async () => {
  const onPlaybackRateChange = vi.fn();
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer
      mediaRef={mediaRef}
      src={SOURCE}
      label="Demo audio"
      playbackRates={[1, 1.5, 0.5]}
      onPlaybackRateChange={onPlaybackRateChange}
    />,
  );
  const compact = compactLayout(screen.container);

  const speed = () =>
    within(compact, 'button[aria-label^="Change playback speed"]');
  // Starts at 1x.
  expect(speed().textContent).toBe("1x");

  // Each tap advances to the next rate in order, wrapping past the end.
  await userEvent.click(speed());
  expect(mediaRef.current?.playbackRate).toBe(1.5);
  expect(onPlaybackRateChange).toHaveBeenLastCalledWith(1.5);
  await vi.waitFor(() => expect(speed().textContent).toBe("1.5x"));

  await userEvent.click(speed());
  expect(mediaRef.current?.playbackRate).toBe(0.5);
  await vi.waitFor(() => expect(speed().textContent).toBe("0.5x"));

  await userEvent.click(speed());
  expect(mediaRef.current?.playbackRate).toBe(1);
  await vi.waitFor(() => expect(speed().textContent).toBe("1x"));
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
  const compact = compactLayout(screen.container);

  // The decorative bars render regardless of decode outcome (flat placeholder
  // bars are shown before/if decoding does not produce peaks).
  const bars = compact.querySelector(
    '[data-slot="media-player-waveform-bars"]',
  );
  expect(bars).not.toBeNull();
  expect(bars?.getAttribute("aria-hidden")).toBe("true");
  expect(bars?.childElementCount).toBeGreaterThan(0);

  // The transparent slider over the bars keeps full seek semantics.
  const media = mediaRef.current!;
  setMediaState(media, { currentTime: 30, duration: 120 });
  media.dispatchEvent(new Event("loadedmetadata"));

  const slider = within(compact, 'input[type="range"]');
  await vi.waitFor(() => {
    expect(slider.getAttribute("aria-valuenow")).toBe("30");
  });

  slider.focus();
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
  const screen = await render(
    <AudioPlayer
      src={SOURCE}
      label="Demo audio"
      onTranscriptClick={() => {}}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations in the waveform variant", async () => {
  const screen = await render(
    <AudioPlayer src={SOURCE} label="Demo audio" variant="waveform" />,
  );
  await expectNoA11yViolations(screen.container);
});
