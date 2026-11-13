import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { TextSpinner } from "./text-spinner";
import "../../test/geometry.css";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

test("braille is the default: ten frames on the frame strip, hidden from assistive technology", async () => {
  const screen = await render(<TextSpinner />);
  const root = slot(screen.container, "text-spinner");
  expect(root.dataset.variant).toBe("braille");
  const frames = slot(screen.container, "text-spinner-frames");
  expect(frames.getAttribute("aria-hidden")).toBe("true");
  expect([...frames.children].map((frame) => frame.textContent)).toEqual([
    "⠋",
    "⠙",
    "⠹",
    "⠸",
    "⠼",
    "⠴",
    "⠦",
    "⠧",
    "⠇",
    "⠏",
  ]);
  expect(frames.className).toContain("motion-frames");
  expect(frames.className).toContain("[--vs-frame-count:10]");
  expect(root.className).toContain("font-mono");
  expect(root.className).toContain("text-muted-foreground");
});

test("dots step three padded frames on the slower dots cadence", async () => {
  const screen = await render(<TextSpinner variant="dots" />);
  const frames = slot(screen.container, "text-spinner-frames");
  expect(frames.children).toHaveLength(3);
  // Every frame is three characters wide, so the words beside it never move.
  for (const frame of frames.children)
    expect(frame.textContent?.length).toBe(3);
  expect(frames.className).toContain(
    "[--vs-frame-duration:var(--duration-loader-dots)]",
  );
});

test("a screen reader hears the label, Working by default, and nothing when the label is empty", async () => {
  const named = await render(<TextSpinner />);
  expect(named.container.querySelector(".sr-only")?.textContent).toBe(
    "Working",
  );
  const custom = await render(<TextSpinner label="Reconnecting" />);
  expect(custom.container.querySelector(".sr-only")?.textContent).toBe(
    "Reconnecting",
  );
  const silent = await render(<TextSpinner label="" />);
  expect(silent.container.querySelector(".sr-only")).toBeNull();
});

test("reduced motion: the strip hides and a still ellipsis shows", async () => {
  const screen = await render(<TextSpinner />);
  const frames = slot(screen.container, "text-spinner-frames");
  expect(frames.className).toContain("motion-reduce:hidden");
  const still = [
    ...screen.container.querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
  ].find((element) => element.textContent === "…")!;
  expect(still.className).toContain("hidden");
  expect(still.className).toContain("motion-reduce:inline");
});

test("no a11y violations — braille and dots", async () => {
  const screen = await render(
    <p>
      <TextSpinner /> Searching <TextSpinner variant="dots" label="" />
    </p>,
  );
  await expectNoA11yViolations(screen.container);
});

test("compiled: the strip keeps every frame one line tall, so a step moves exactly one frame", async () => {
  const screen = await render(<TextSpinner />);
  const root = slot(screen.container, "text-spinner");
  const frames = slot(screen.container, "text-spinner-frames");
  const line = root.getBoundingClientRect().height;
  expect(line).toBeGreaterThan(0);
  // Ten frames stacked, not squeezed into the one-line clip: translate -100% then travels ten
  // lines in ten steps, one frame per step.
  expect(frames.getBoundingClientRect().height).toBeCloseTo(line * 10, 0);
  for (const frame of frames.children)
    expect(frame.getBoundingClientRect().height).toBeCloseTo(line, 0);
  expect(getComputedStyle(root).overflowY).toBe("clip");
});
