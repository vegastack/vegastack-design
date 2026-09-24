import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { AudioPlayer, type AudioPlayerActions } from "./audio-player";

const SOURCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

function setMediaState(
  media: HTMLMediaElement,
  state: { currentTime?: number; duration?: number; paused?: boolean },
) {
  if (state.currentTime != null) {
    // WebKit clamps the native setter to zero until it owns a real media timeline. These tests
    // exercise our transport state machine, so provide the same writable clock stub used by the
    // adjacent multi-hour cases rather than depending on an engine decoder accepting the data URI.
    Object.defineProperty(media, "currentTime", {
      configurable: true,
      writable: true,
      value: state.currentTime,
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
  // Audio now carries mute + a volume rail, in BOTH layouts (audit B4-04 — it
  // previously had neither and mute was keyboard-only).
  expect(within(compact, '[data-slot="media-player-volume"]')).not.toBeNull();
  expect(
    within(compact, 'button[aria-label="Mute Demo audio"]'),
  ).not.toBeNull();
  expect(
    within(
      screen.container.querySelector<HTMLElement>(
        '[data-slot="media-player-actions"]',
      )!,
      '[data-slot="media-player-volume"]',
    ),
  ).not.toBeNull();
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
  const compact = compactLayout(screen.container);
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

  // The controls group is NOT a tab stop (audit TD-4) — every control inside it
  // is focusable, so a stop on the wrapper only added an empty one. Shortcuts
  // are therefore exercised from a focused control, in the `controls` scope:
  // the letter map applies, and Space and the arrows stay with the control the
  // user is actually on (the play button's own Space, the seek's own arrows).
  const group = screen.getByRole("group", {
    name: "Demo audio media controls",
  });
  expect(group.element().hasAttribute("tabindex")).toBe(false);

  within(compact, 'button[aria-label="Rewind 15 seconds"]').focus();

  await userEvent.keyboard("k");
  expect(play).toHaveBeenCalledOnce();
  expect(onPlayStateChange).toHaveBeenLastCalledWith(true);

  await userEvent.keyboard("k");
  expect(onPlayStateChange).toHaveBeenLastCalledWith(false);

  await userEvent.keyboard("l");
  expect(media.currentTime).toBe(45);

  await userEvent.keyboard("j");
  expect(media.currentTime).toBe(30);

  // Mute now has a visible control too, but the M shortcut still toggles it.
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

// ── Dock options (DS-77) ──────────────────────────────────────────────────────────────────────

test("a lazy src resolves once on first play and a queued seek applies on metadata", async () => {
  const src = vi.fn(async () => "/a.mp3");
  const actions = React.createRef<AudioPlayerActions>();
  const screen = await render(
    <AudioPlayer
      label="Meeting recording"
      docked
      open
      src={src}
      actionsRef={actions}
    />,
  );
  const audio = screen.container.querySelector("audio")!;
  expect(audio.hasAttribute("src")).toBe(false);
  expect(src).not.toHaveBeenCalled();

  actions.current!.seek(42, { play: true });
  // The same tick: the transport's play joins the one resolution in flight.
  within(
    compactLayout(screen.container),
    'button[aria-label="Play Meeting recording"]',
  ).click();
  await vi.waitFor(() => expect(audio.getAttribute("src")).toBe("/a.mp3"));
  expect(src).toHaveBeenCalledOnce();

  audio.dispatchEvent(new Event("loadedmetadata"));
  expect(audio.currentTime).toBe(42);
  expect(screen.container.querySelector('[role="toolbar"]')).toBeNull();
});

test("a lazy src is not resolved again by a later play", async () => {
  const src = vi.fn(async () => SOURCE);
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer label="Call" src={src} mediaRef={mediaRef} />,
  );
  const play = within(
    compactLayout(screen.container),
    'button[aria-label="Play Call"]',
  );
  play.click();
  await vi.waitFor(() =>
    expect(mediaRef.current!.getAttribute("src")).toBe(SOURCE),
  );
  mediaRef.current!.pause();
  await mediaRef.current!.play().catch(() => {});
  expect(src).toHaveBeenCalledOnce();
});

test("docked: a labelled region at the bottom of its column, not a toolbar", async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const screen = await render(
    <AudioPlayer ref={rootRef} src={SOURCE} label="Meeting recording" docked />,
  );
  const region = screen.getByRole("region", { name: "Meeting recording" });
  await expect.element(region).toBeInTheDocument();
  // `ref` is still the root, and the root IS the region.
  expect(rootRef.current).toBe(region.element());
  expect(rootRef.current!.dataset.slot).toBe("audio-player");
  expect(rootRef.current).toHaveAttribute("data-docked", "");
  for (const cls of [
    "sticky",
    "bottom-0",
    "border",
    "bg-popover",
    "shadow-md",
    "pb-[calc(var(--spacing)*3+env(safe-area-inset-bottom))]",
  ]) {
    expect(rootRef.current!.classList.contains(cls), cls).toBe(true);
  }
  expect(screen.container.querySelector('[role="toolbar"]')).toBeNull();
});

test("an undocked player is not a region", async () => {
  const screen = await render(<AudioPlayer src={SOURCE} label="Clip" />);
  expect(screen.container.querySelector('[role="region"]')).toBeNull();
});

function ClosableDock({
  onOpenChange,
  mediaRef,
}: {
  onOpenChange?: (open: boolean) => void;
  mediaRef?: React.Ref<HTMLAudioElement>;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Play recording
      </button>
      <AudioPlayer
        src={SOURCE}
        label="Meeting recording"
        docked
        open={open}
        mediaRef={mediaRef}
        onOpenChange={(next) => {
          onOpenChange?.(next);
          setOpen(next);
        }}
      />
    </div>
  );
}

test("hidden: inert, parked, and out of the tab order", async () => {
  const screen = await render(<ClosableDock />);
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="audio-player"]',
  )!;
  expect(root).toHaveAttribute("inert");
  expect(root).toHaveAttribute("data-active", "false");
  expect(root.className).toContain("data-[active=false]:motion-dock-out");
  expect(root.className).toContain("data-[active=true]:motion-dock-in");
});

test("close pauses, reports closed, and returns focus to the opener", async () => {
  const onOpenChange = vi.fn();
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <ClosableDock onOpenChange={onOpenChange} mediaRef={mediaRef} />,
  );
  const opener = screen.getByRole("button", { name: "Play recording" });
  await userEvent.click(opener);
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="audio-player"]',
  )!;
  await vi.waitFor(() => expect(root).toHaveAttribute("data-active", "true"));
  expect(root.hasAttribute("inert")).toBe(false);

  const pause = vi.spyOn(mediaRef.current!, "pause");
  await userEvent.click(screen.getByRole("button", { name: "Close player" }));
  expect(pause).toHaveBeenCalled();
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  await vi.waitFor(() => expect(root).toHaveAttribute("inert"));
  expect(document.activeElement).toBe(opener.element());
});

test("Escape does not close the dock", async () => {
  const onOpenChange = vi.fn();
  const screen = await render(<ClosableDock onOpenChange={onOpenChange} />);
  await userEvent.click(screen.getByRole("button", { name: "Play recording" }));
  const close = screen.getByRole("button", { name: "Close player" });
  (close.element() as HTMLElement).focus();
  await userEvent.keyboard("{Escape}");
  expect(onOpenChange).not.toHaveBeenCalled();
  expect(
    screen.container.querySelector('[data-slot="audio-player"]'),
  ).toHaveAttribute("data-active", "true");
});

test("the close button renders only when onOpenChange is wired, with an overridable label", async () => {
  const bare = await render(<AudioPlayer src={SOURCE} label="Clip" docked />);
  expect(
    bare.container.querySelector('[data-slot="audio-player-close"]'),
  ).toBeNull();

  const screen = await render(
    <AudioPlayer
      src={SOURCE}
      label="Clip"
      docked
      onOpenChange={() => {}}
      closeLabel="Hide recording"
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Hide recording" }))
    .toBeInTheDocument();
});

test("Tab reaches every control in the dock and then leaves it", async () => {
  const screen = await render(
    <div>
      <button type="button">Before</button>
      <AudioPlayer
        src={SOURCE}
        label="Meeting recording"
        docked
        onOpenChange={() => {}}
      />
      <button type="button">After</button>
    </div>,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="audio-player"]',
  )!;
  const expected = Array.from(
    root.querySelectorAll<HTMLElement>("button, input"),
  ).filter(
    // The seek rail is disabled until the metadata reports a duration.
    (el) => el.tabIndex >= 0 && !el.matches(":disabled"),
  );
  expect(expected.length).toBeGreaterThan(0);

  (
    screen.getByRole("button", { name: "Before" }).element() as HTMLElement
  ).focus();
  const reached = new Set<Element>();
  for (let step = 0; step < expected.length + 5; step += 1) {
    await userEvent.keyboard("{Tab}");
    const active = document.activeElement;
    if (!active || !root.contains(active)) break;
    reached.add(active);
  }
  expect(document.activeElement?.textContent).toBe("After");
  for (const control of expected) {
    expect(
      reached.has(control),
      control.getAttribute("aria-label") ?? control.outerHTML,
    ).toBe(true);
  }
});

test("loading shows a status line and is announced once", async () => {
  const screen = await render(
    <AudioPlayer src={SOURCE} label="Clip" docked loading />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="audio-player"]',
  )!;
  expect(root).toHaveAttribute("aria-busy", "true");
  expect(root).toHaveAttribute("data-state", "loading");
  const announcer = root.querySelector<HTMLElement>('[data-slot="announcer"]')!;
  await vi.waitFor(() => expect(announcer.textContent).toBe("Loading audio…"));
  const spoken = announcer.firstElementChild;

  await screen.rerender(
    <AudioPlayer src={SOURCE} label="Clip" docked loading title="Standup" />,
  );
  await screen.rerender(
    <AudioPlayer src={SOURCE} label="Clip" docked loading title="Standup 2" />,
  );
  await expect.element(screen.getByText("Standup 2")).toBeInTheDocument();
  // Same node: re-renders while loading never re-announce.
  expect(announcer.firstElementChild).toBe(spoken);
  expect(
    root.querySelector('[data-slot="audio-player-status"]')?.textContent,
  ).toBe("Loading audio…");

  await screen.rerender(<AudioPlayer src={SOURCE} label="Clip" docked />);
  await vi.waitFor(() =>
    expect(root.querySelector('[data-slot="audio-player-status"]')).toBeNull(),
  );
  expect(root.hasAttribute("aria-busy")).toBe(false);
});

test("loadingLabel overrides the announced and visible copy", async () => {
  const screen = await render(
    <AudioPlayer
      src={SOURCE}
      label="Clip"
      loading
      loadingLabel="Fetching recording…"
    />,
  );
  const announcer = screen.container.querySelector('[data-slot="announcer"]')!;
  await vi.waitFor(() =>
    expect(announcer.textContent).toBe("Fetching recording…"),
  );
});

test("error renders an alert in the -text ink with a retry", async () => {
  const onRetry = vi.fn();
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer
      src={SOURCE}
      label="Clip"
      docked
      mediaRef={mediaRef}
      error="Couldn't load the recording."
      onRetry={onRetry}
    />,
  );
  const alert = screen.getByRole("alert");
  await expect.element(alert).toHaveTextContent("Couldn't load the recording.");
  await expect.element(alert).toHaveClass("text-destructive-text");
  expect(
    screen.container.querySelector('[data-slot="audio-player"]'),
  ).toHaveAttribute("data-state", "error");

  const load = vi.spyOn(mediaRef.current!, "load");
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(onRetry).toHaveBeenCalledOnce();
  expect(load).toHaveBeenCalledOnce();
});

test("retry re-resolves a lazy source", async () => {
  const src = vi.fn(async () => SOURCE);
  const mediaRef = React.createRef<HTMLAudioElement>();
  const screen = await render(
    <AudioPlayer
      src={src}
      label="Clip"
      mediaRef={mediaRef}
      error="Couldn't load the recording."
      retryLabel="Reload"
    />,
  );
  within(
    compactLayout(screen.container),
    'button[aria-label="Play Clip"]',
  ).click();
  await vi.waitFor(() => expect(src).toHaveBeenCalledOnce());
  await userEvent.click(screen.getByRole("button", { name: "Reload" }));
  await vi.waitFor(() => expect(src).toHaveBeenCalledTimes(2));
});

test("a lazy src that rejects shows the player's own error line (DS-77)", async () => {
  const screen = await render(
    <AudioPlayer src={() => Promise.reject(new Error("gone"))} label="Clip" />,
  );
  within(
    compactLayout(screen.container),
    'button[aria-label="Play Clip"]',
  ).click();
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Couldn’t load the recording");
});

test("actionsRef seeks a loaded player at once and plays and pauses it", async () => {
  const actions = React.createRef<AudioPlayerActions>();
  const mediaRef = React.createRef<HTMLAudioElement>();
  await render(
    <AudioPlayer
      src={SOURCE}
      label="Clip"
      mediaRef={mediaRef}
      actionsRef={actions}
    />,
  );
  const media = mediaRef.current!;
  Object.defineProperty(media, "readyState", { configurable: true, value: 1 });
  setMediaState(media, { currentTime: 0, duration: 120 });
  const play = vi.spyOn(media, "play").mockResolvedValue(undefined);
  const pause = vi.spyOn(media, "pause").mockImplementation(() => {});

  actions.current!.seek(30);
  expect(media.currentTime).toBe(30);
  expect(play).not.toHaveBeenCalled();
  actions.current!.seek(500, { play: true });
  expect(media.currentTime).toBe(120);
  expect(play).toHaveBeenCalledOnce();
  actions.current!.pause();
  expect(pause).toHaveBeenCalledOnce();
  actions.current!.play();
  expect(play).toHaveBeenCalledTimes(2);
});

test("has no accessibility violations when docked and open", async () => {
  const screen = await render(
    <AudioPlayer
      src={SOURCE}
      label="Meeting recording"
      title="Weekly sync"
      docked
      onOpenChange={() => {}}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations while loading", async () => {
  const screen = await render(
    <AudioPlayer src={SOURCE} label="Meeting recording" docked loading />,
  );
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations with an error", async () => {
  const screen = await render(
    <AudioPlayer
      src={SOURCE}
      label="Meeting recording"
      docked
      error="Couldn't load the recording."
    />,
  );
  await expectNoA11yViolations(screen.container);
});
