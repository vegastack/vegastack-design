/**
 * Transcript — a timestamped speaker list on MessageScroller's primitive (DS-49).
 *
 * COMPILED CSS IS LOAD-BEARING HERE, as it is for `message-scroller.test.tsx`: follow, pause and
 * "Back to current line" are claims about what is SCROLLED INTO VIEW, which only means something
 * when `h-48` is really 192px and a row really has height. `../../test/geometry.css` compiles the
 * token theme, so axe's `color-contrast` rule is live too.
 */
import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Transcript,
  TranscriptList,
  TranscriptSearch,
  type TranscriptProps,
  type TranscriptSegment,
} from "./transcript";

const TEXTS = [
  "Thanks for joining. Let's start with the budget review.",
  "The marketing budget came in under plan this quarter.",
  "Good. What drove the savings on events?",
  "We moved two conferences online, which cut travel.",
  "Can we carry that into next quarter?",
  "Probably, if the regional teams agree.",
];

/** `count` segments, starting at 0, 12, 35, 58, … seconds; speakers alternate. */
function makeSegments(count = 6): TranscriptSegment[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i}`,
    start: i === 0 ? 0 : i === 1 ? 12 : 12 + (i - 1) * 23,
    speaker: i % 2 === 0 ? "ana" : "raj",
    text: TEXTS[i % TEXTS.length]!,
  }));
}

const segs = makeSegments();
const NAMES: Record<string, string> = { ana: "Ana Ruiz", raj: "Raj Patel" };
const speakerName = (id: string) => NAMES[id] ?? id;

type HarnessProps = Partial<Omit<TranscriptProps, "children">> & {
  search?: boolean;
};

function Harness({
  search = false,
  segments = segs,
  className = "h-48 w-80",
  ...props
}: HarnessProps) {
  return (
    <Transcript
      aria-label="Transcript"
      segments={segments}
      speakerName={speakerName}
      className={className}
      {...props}
    >
      {search ? <TranscriptSearch /> : null}
      <TranscriptList />
    </Transcript>
  );
}

const viewportOf = (root: Element) =>
  root.querySelector<HTMLElement>('[data-slot="message-scroller-viewport"]')!;

const rowOf = (root: Element, id: string) =>
  root.querySelector<HTMLElement>(`[data-message-id="${id}"]`)!;

/** True when the row's box lies inside the viewport's box. */
function inView(root: Element, id: string) {
  const v = viewportOf(root).getBoundingClientRect();
  const r = rowOf(root, id).getBoundingClientRect();
  return r.bottom > v.top + 1 && r.top < v.bottom - 1;
}

const frames = (n = 3) =>
  new Promise<void>((resolve) => {
    let left = n;
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  });

const announcerText = () =>
  document.querySelector('[data-slot="announcer"]')?.textContent ?? "";

// ── structure ─────────────────────────────────────────────────────────────────────────────────

test("renders every part's slot, one row per segment, in a labelled list", async () => {
  const screen = await render(<Harness search />);
  for (const slot of [
    "transcript",
    "transcript-search",
    "transcript-list",
    "message-scroller-viewport",
  ]) {
    expect(
      screen.container.querySelector(`[data-slot="${slot}"]`),
      `missing [data-slot="${slot}"]`,
    ).not.toBeNull();
  }
  await expect
    .element(screen.getByRole("region", { name: "Transcript" }))
    .toBeInTheDocument();
  const list = screen.getByRole("list");
  await expect.element(list).toBeInTheDocument();
  expect(screen.getByRole("listitem").all()).toHaveLength(segs.length);
  // Each row is an Item carrying the engine's messageId.
  const row = rowOf(screen.container, "s0");
  expect(row.getAttribute("data-slot")).toBe("transcript-segment");
  expect(row.classList.contains("group/item")).toBe(true);
  await expect
    .element(screen.getByText("Ana Ruiz").first())
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

// ── the plan's own test ───────────────────────────────────────────────────────────────────────

test("seek fires with the segment start and focus stays put on time updates", async () => {
  const onSeek = vi.fn();
  const screen = await render(
    <Transcript
      aria-label="Transcript"
      segments={segs}
      currentTime={0}
      onSeek={onSeek}
    >
      <TranscriptList />
    </Transcript>,
  );
  await screen.getByRole("button", { name: "Play from 0:12" }).click();
  expect(onSeek).toHaveBeenCalledWith(12);
  const focused = document.activeElement;
  await screen.rerender(
    <Transcript
      aria-label="Transcript"
      segments={segs}
      currentTime={40}
      onSeek={onSeek}
    >
      <TranscriptList />
    </Transcript>,
  );
  expect(document.activeElement).toBe(focused);
  await expect.element(screen.getByText(segs[2]!.text)).toBeInTheDocument();
  const row = screen
    .getByText(segs[2]!.text)
    .element()
    .closest('[data-slot="transcript-segment"]');
  expect(row?.getAttribute("aria-current")).toBe("true");
  expect(
    screen.container.querySelectorAll('[aria-current="true"]'),
  ).toHaveLength(1);
});

test("the visible time is inside the seek button's name (label in name)", async () => {
  const screen = await render(<Harness onSeek={() => {}} />);
  const button = screen.getByRole("button", { name: "Play from 0:35" });
  await expect.element(button).toBeInTheDocument();
  expect(button.element().textContent).toContain("0:35");
});

test("the active row is the last one started, by start time, and none before the first start", async () => {
  const late = makeSegments().map((s) => ({ ...s, start: s.start + 5 }));
  const screen = await render(<Harness segments={late} currentTime={2} />);
  expect(screen.container.querySelector('[aria-current="true"]')).toBeNull();
  await screen.rerender(<Harness segments={late} currentTime={17} />);
  expect(rowOf(screen.container, "s1").getAttribute("aria-current")).toBe(
    "true",
  );
  // Exactly on a boundary, the new segment wins.
  await screen.rerender(<Harness segments={late} currentTime={40} />);
  expect(rowOf(screen.container, "s2").getAttribute("aria-current")).toBe(
    "true",
  );
  // A segment with an `end` stops being current in the gap after it.
  const gapped = late.map((s, i) => (i === 2 ? { ...s, end: 45 } : s));
  await screen.rerender(<Harness segments={gapped} currentTime={50} />);
  expect(screen.container.querySelector('[aria-current="true"]')).toBeNull();
});

test("no onSeek means no buttons: the timestamp is plain text", async () => {
  const screen = await render(<Harness currentTime={0} />);
  expect(screen.container.querySelector("button")).toBeNull();
  await expect.element(screen.getByText("0:12")).toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("formatTime and speakerName shape the row text", async () => {
  const screen = await render(
    <Harness onSeek={() => {}} formatTime={(s) => `${s}s`} />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Play from 12s" }))
    .toBeInTheDocument();
  expect(screen.getByText("Raj Patel").all().length).toBeGreaterThan(0);
});

test("'Now playing' marks the current row once and moves once per segment", async () => {
  const screen = await render(<Harness currentTime={13} />);
  const marks = () =>
    screen.container.querySelectorAll('[data-slot="transcript-now-playing"]');
  expect(marks()).toHaveLength(1);
  const first = marks()[0]!;
  expect(first.textContent).toBe("Now playing");
  expect(first.closest('[data-message-id="s1"]')).not.toBeNull();
  // Time moves inside the same segment: the same node stays, nothing re-renders into it.
  for (const t of [14, 20, 30, 34]) {
    await screen.rerender(<Harness currentTime={t} />);
    expect(marks()).toHaveLength(1);
    expect(marks()[0]).toBe(first);
  }
  await screen.rerender(<Harness currentTime={36} />);
  expect(marks()).toHaveLength(1);
  expect(marks()[0]!.closest('[data-message-id="s2"]')).not.toBeNull();
});

// ── follow, pause, back ───────────────────────────────────────────────────────────────────────

const long = makeSegments(40);

test("follow centres the active row as time moves, starting from the top", async () => {
  const screen = await render(<Harness segments={long} currentTime={0} />);
  await frames();
  expect(viewportOf(screen.container).scrollTop).toBe(0);
  await screen.rerender(
    <Harness segments={long} currentTime={long[30]!.start} />,
  );
  await expect.poll(() => inView(screen.container, "s30")).toBe(true);
  expect(viewportOf(screen.container).scrollTop).toBeGreaterThan(0);
});

test("start positioning does not fight follow: a mid-recording mount lands on the active row", async () => {
  const screen = await render(
    <Harness segments={long} currentTime={long[25]!.start + 1} />,
  );
  await expect.poll(() => inView(screen.container, "s25")).toBe(true);
  await frames(6);
  // Centred, and still centred once layout has settled. With the engine's default
  // `content-visibility: auto` rows this landed ~270px past the row: the jump was computed from
  // estimated row heights that changed as soon as the rows rendered.
  const v = viewportOf(screen.container).getBoundingClientRect();
  const r = rowOf(screen.container, "s25").getBoundingClientRect();
  expect(Math.abs(r.top + r.height / 2 - (v.top + v.height / 2))).toBeLessThan(
    2,
  );
});

test("appending segments does not pin the list to the end (autoScroll off)", async () => {
  const screen = await render(
    <Harness segments={long.slice(0, 20)} currentTime={0} />,
  );
  await frames();
  expect(viewportOf(screen.container).scrollTop).toBe(0);
  await screen.rerender(<Harness segments={long} currentTime={0} />);
  await frames(6);
  expect(viewportOf(screen.container).scrollTop).toBe(0);
  expect(inView(screen.container, "s0")).toBe(true);
});

for (const [how, act] of [
  [
    "wheel",
    (v: HTMLElement) =>
      v.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true })),
  ],
  [
    "touch",
    (v: HTMLElement) =>
      v.dispatchEvent(new Event("touchmove", { bubbles: true })),
  ],
  [
    "keyboard",
    (v: HTMLElement) =>
      v.dispatchEvent(
        new KeyboardEvent("keydown", { key: "PageDown", bubbles: true }),
      ),
  ],
] as const) {
  test(`a ${how} scroll pauses follow, and "Back to current line" resumes it`, async () => {
    const onFollowChange = vi.fn();
    const screen = await render(
      <Harness
        segments={long}
        currentTime={0}
        onFollowChange={onFollowChange}
      />,
    );
    await frames();
    act(viewportOf(screen.container));
    expect(onFollowChange).toHaveBeenLastCalledWith(false);
    // The active row is still on screen: nothing to go back to.
    await frames();
    expect(
      screen.container.querySelector('[data-slot="transcript-back"]'),
    ).toBeNull();

    await screen.rerender(
      <Harness
        segments={long}
        currentTime={long[30]!.start}
        onFollowChange={onFollowChange}
      />,
    );
    await frames(4);
    // Paused: the list stayed where the reader left it.
    expect(inView(screen.container, "s30")).toBe(false);
    const back = screen.getByRole("button", { name: "Back to current line" });
    await expect.element(back).toBeInTheDocument();
    await expectNoA11yViolations(screen.container);

    await back.click();
    expect(onFollowChange).toHaveBeenLastCalledWith(true);
    await expect.poll(() => inView(screen.container, "s30")).toBe(true);
    await expect
      .poll(() =>
        screen.container.querySelector('[data-slot="transcript-back"]'),
      )
      .toBeNull();
    // The button's focus lands on the list, never on the body.
    expect(document.activeElement).toBe(viewportOf(screen.container));
  });
}

test("Space on a seek button inside the list is activation, not a scroll: follow stays on", async () => {
  const onFollowChange = vi.fn();
  const screen = await render(
    <Harness
      segments={long}
      currentTime={0}
      onSeek={() => {}}
      onFollowChange={onFollowChange}
    />,
  );
  const button = screen
    .getByRole("button", { name: "Play from 0:12" })
    .element() as HTMLElement;
  button.dispatchEvent(
    new KeyboardEvent("keydown", { key: " ", bubbles: true }),
  );
  expect(onFollowChange).not.toHaveBeenCalled();
});

test("controlled follow={false} never scrolls on time updates", async () => {
  const screen = await render(
    <Harness segments={long} currentTime={0} follow={false} />,
  );
  await frames();
  await screen.rerender(
    <Harness segments={long} currentTime={long[30]!.start} follow={false} />,
  );
  await frames(6);
  expect(viewportOf(screen.container).scrollTop).toBe(0);
  await expect
    .element(screen.getByRole("button", { name: "Back to current line" }))
    .toBeInTheDocument();
});

test("backLabel renames the back button", async () => {
  const screen = await render(
    <Harness
      segments={long}
      currentTime={long[30]!.start}
      defaultFollow={false}
      backLabel="Jump to now"
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Jump to now" }))
    .toBeInTheDocument();
});

// ── search ────────────────────────────────────────────────────────────────────────────────────

test("search wraps matches in <mark>, announces the position, and Enter/Shift+Enter move", async () => {
  const onQueryChange = vi.fn();
  const screen = await render(
    <Harness search segments={long} onQueryChange={onQueryChange} />,
  );
  const input = screen.getByRole("searchbox", { name: "Search transcript" });
  await userEvent.type(input, "budget");
  expect(onQueryChange).toHaveBeenLastCalledWith("budget");
  // "budget" appears in TEXTS[0] and TEXTS[1]; 40 segments cycle 6 texts → 7 + 7 = 14.
  const marks = () => screen.container.querySelectorAll("mark");
  await expect.poll(() => marks().length).toBe(14);
  await expect.poll(announcerText).toBe("1 of 14");
  const current = () =>
    screen.container.querySelector('mark[data-current="true"]');
  expect(current()?.closest('[data-message-id="s0"]')).not.toBeNull();
  await expectNoA11yViolations(screen.container);

  await userEvent.keyboard("{Enter}");
  await expect.poll(announcerText).toBe("2 of 14");
  expect(current()?.closest('[data-message-id="s1"]')).not.toBeNull();

  await userEvent.keyboard("{Enter}{Enter}");
  await expect.poll(announcerText).toBe("4 of 14");
  await expect.poll(() => inView(screen.container, "s7")).toBe(true);

  await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
  await expect.poll(announcerText).toBe("3 of 14");
  // Focus never left the field.
  expect(document.activeElement).toBe(input.element());
});

test("search wraps around both ends", async () => {
  const screen = await render(<Harness search />);
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search transcript" }),
    "quarter",
  );
  await expect.poll(announcerText).toBe("1 of 2");
  await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
  await expect.poll(announcerText).toBe("2 of 2");
  await userEvent.keyboard("{Enter}");
  await expect.poll(announcerText).toBe("1 of 2");
});

test("the previous and next buttons step through matches", async () => {
  const screen = await render(<Harness search />);
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search transcript" }),
    "quarter",
  );
  await screen.getByRole("button", { name: "Next match" }).click();
  await expect.poll(announcerText).toBe("2 of 2");
  await screen.getByRole("button", { name: "Previous match" }).click();
  await expect.poll(announcerText).toBe("1 of 2");
});

test("a query with no hits announces 'No matches' and marks nothing", async () => {
  const screen = await render(<Harness search />);
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search transcript" }),
    "zebra",
  );
  await expect.poll(announcerText).toBe("No matches");
  expect(screen.container.querySelectorAll("mark")).toHaveLength(0);
  await expectNoA11yViolations(screen.container);
});

test("search moves the list and pauses follow so the match stays put", async () => {
  const onFollowChange = vi.fn();
  const screen = await render(
    <Harness
      search
      segments={long}
      currentTime={0}
      onFollowChange={onFollowChange}
    />,
  );
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search transcript" }),
    "regional",
  );
  expect(onFollowChange).toHaveBeenLastCalledWith(false);
  await userEvent.keyboard("{Enter}{Enter}{Enter}");
  await expect.poll(announcerText).toBe("4 of 6");
  await expect.poll(() => inView(screen.container, "s23")).toBe(true);
});

test("segments that add matches keep the reader's position and say nothing", async () => {
  const screen = await render(<Harness search segments={long.slice(0, 30)} />);
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search transcript" }),
    "regional",
  );
  await userEvent.keyboard("{Enter}{Enter}");
  await expect.poll(announcerText).toBe("3 of 5");
  await screen.rerender(<Harness search segments={long} />);
  await expect
    .element(screen.getByText("3 of 6", { exact: true }))
    .toBeInTheDocument();
  expect(announcerText()).toBe("3 of 5");
});

test("a controlled query renders its marks without the search field", async () => {
  const screen = await render(<Harness query="travel" />);
  expect(screen.container.querySelectorAll("mark")).toHaveLength(1);
  expect(screen.container.querySelector("mark")?.textContent).toBe("travel");
});

test("a match after a character whose lower case is longer is highlighted exactly", async () => {
  const screen = await render(
    <Harness
      query="meeting"
      segments={[
        { id: "t", start: 0, speaker: "ana", text: "İstanbul meeting notes" },
      ]}
    />,
  );
  expect(screen.container.querySelector("mark")?.textContent).toBe("meeting");
});

test("match labels are overridable", async () => {
  const screen = await render(
    <Transcript aria-label="Transcript" segments={segs}>
      <TranscriptSearch
        label="Find"
        matchLabel={(i, n) => `Match ${i}/${n}`}
        noMatchesLabel="Nothing found"
      />
      <TranscriptList />
    </Transcript>,
  );
  const input = screen.getByRole("searchbox", { name: "Find" });
  await userEvent.type(input, "budget");
  await expect.poll(announcerText).toBe("Match 1/2");
  await userEvent.clear(input);
  await userEvent.type(input, "zebra");
  await expect.poll(announcerText).toBe("Nothing found");
});

// ── empty, loading ────────────────────────────────────────────────────────────────────────────

test("empty: the default copy, then a custom emptyState", async () => {
  const screen = await render(<Harness segments={[]} />);
  await expect
    .element(screen.getByText("No transcript yet"))
    .toBeInTheDocument();
  expect(screen.container.querySelector('[role="list"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <Harness segments={[]} emptyState={<p>Recording has no speech</p>} />,
  );
  await expect
    .element(screen.getByText("Recording has no speech"))
    .toBeInTheDocument();
});

test("loading: skeleton rows, a busy list and one loading line", async () => {
  const screen = await render(<Harness segments={[]} loading />);
  const busy = screen.container.querySelector('[aria-busy="true"]');
  expect(busy).not.toBeNull();
  expect(
    screen.container.querySelectorAll('[data-slot="skeleton"]').length,
  ).toBeGreaterThan(0);
  await expect
    .element(screen.getByText("Loading transcript…"))
    .toBeInTheDocument();
  expect(screen.container.textContent).not.toContain("No transcript yet");
  await expectNoA11yViolations(screen.container);
});

// ── performance ──────────────────────────────────────────────────────────────────────────────

test("2,000 segments: a currentTime update costs under 16 ms", async () => {
  const many = makeSegments(2000);
  const onSeek = () => {};
  const screen = await render(
    <Harness segments={many} currentTime={0} onSeek={onSeek} />,
  );
  await frames();
  const samples: number[] = [];
  // Ticks at 4 Hz, the rate a media element reports `timeupdate`, crossing many segments.
  for (let t = 0.25; t < 200; t += 3.3) {
    const t0 = performance.now();
    await screen.rerender(
      <Harness segments={many} currentTime={t} onSeek={onSeek} />,
    );
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)]!;
  expect(median, `median ${median.toFixed(2)} ms`).toBeLessThan(16);
});
