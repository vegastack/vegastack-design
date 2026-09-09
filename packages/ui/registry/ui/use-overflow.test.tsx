import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { useOverflow, type OverflowAxis } from "./use-overflow";

/**
 * A real clipping box with real content, so the hook measures actual layout
 * rather than a mocked `scrollWidth`. The harness compiles no Tailwind, so every
 * dimension here is an inline style on purpose.
 */
function Probe({
  axis,
  width,
  height,
  content,
  paused = false,
}: {
  axis?: OverflowAxis;
  width: number;
  height: number;
  content: string;
  paused?: boolean;
}) {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const overflowing = useOverflow(node, { axis, paused, deps: [content] });
  return (
    <div>
      <div
        ref={setNode}
        data-testid="box"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          overflow: "auto",
          whiteSpace: axis === "block" ? "normal" : "nowrap",
        }}
      >
        <span data-testid="content">{content}</span>
      </div>
      <output data-testid="verdict">{overflowing ? "yes" : "no"}</output>
    </div>
  );
}

const SHORT = "ab";
const LONG = "the quick brown fox jumps over the lazy dog ".repeat(8);

test("reports no overflow when the content fits", async () => {
  const screen = await render(
    <Probe width={400} height={60} content={SHORT} />,
  );
  await expect.element(screen.getByTestId("verdict")).toHaveTextContent("no");
});

test("reports inline overflow when the content is wider than the box", async () => {
  const screen = await render(<Probe width={60} height={40} content={LONG} />);
  await expect.element(screen.getByTestId("verdict")).toHaveTextContent("yes");
});

test("the block axis measures height, not width", async () => {
  // Wide enough that nothing is clipped horizontally, short enough that the
  // wrapped text runs past the bottom edge.
  const screen = await render(
    <Probe axis="block" width={200} height={16} content={LONG} />,
  );
  await expect.element(screen.getByTestId("verdict")).toHaveTextContent("yes");
});

test("`either` catches an overflow on the block axis alone", async () => {
  const screen = await render(
    <Probe axis="either" width={200} height={16} content={LONG} />,
  );
  await expect.element(screen.getByTestId("verdict")).toHaveTextContent("yes");
});

test("re-measures when the CONTENT grows without the box moving", async () => {
  // The regression this exists for: observing only the container misses a table
  // that gets wider inside a fixed-width viewport, so a scroll region would
  // never become focusable.
  function Growing() {
    const [long, setLong] = React.useState(false);
    return (
      <div>
        <button type="button" onClick={() => setLong(true)}>
          grow
        </button>
        <Probe width={60} height={40} content={long ? LONG : SHORT} />
      </div>
    );
  }
  const screen = await render(<Growing />);
  await expect.element(screen.getByTestId("verdict")).toHaveTextContent("no");
  (screen.getByRole("button").element() as HTMLElement).click();
  await expect.element(screen.getByTestId("verdict")).toHaveTextContent("yes");
});

test("`paused` freezes the last measured value", async () => {
  // The disclosure case: while expanded the clamp is REMOVED, so a live
  // measurement would report "not clipped" and immediately re-collapse it.
  const screen = await render(
    <Probe width={400} height={60} content={SHORT} paused />,
  );
  await expect.element(screen.getByTestId("verdict")).toHaveTextContent("no");
  screen.unmount();

  const stillFalse = await render(
    <Probe width={60} height={40} content={LONG} paused />,
  );
  await expect
    .element(stillFalse.getByTestId("verdict"))
    .toHaveTextContent("no");
});

test("is SSR-safe: the first paint claims nothing is clipped", async () => {
  // The hook must never assert clipping before it has measured — a server render
  // that reported "truncated" would ship a reveal affordance with nothing behind it.
  function FirstPaint() {
    const [node, setNode] = React.useState<HTMLDivElement | null>(null);
    const overflowing = useOverflow(node);
    const seen = React.useRef<boolean[]>([]);
    seen.current.push(overflowing);
    return (
      <div>
        <div ref={setNode} style={{ width: "10px", overflow: "hidden" }}>
          <span style={{ whiteSpace: "nowrap" }}>{LONG}</span>
        </div>
        <output data-testid="first">{String(seen.current[0])}</output>
      </div>
    );
  }
  const screen = await render(<FirstPaint />);
  await expect.element(screen.getByTestId("first")).toHaveTextContent("false");
});
