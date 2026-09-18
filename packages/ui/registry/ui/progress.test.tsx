import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "./progress";
import { DirectionProvider } from "./direction";

const slot = (root: Element, name: string) =>
  root.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;

/**
 * Index a collection and prove the element is there. The package runs with
 * `noUncheckedIndexedAccess`, so `list[i]` is `T | undefined`; this narrows it by ASSERTING the
 * element exists rather than by asserting it away, so a missing element fails the test it is in.
 */
function at<T extends Element>(list: ArrayLike<T>, index: number): T {
  const element = list[index];
  expect(element, `element at index ${index} must be present`).toBeDefined();
  return element as T;
}

test("renders a named progressbar carrying its data-slot (Usage)", async () => {
  const screen = await render(
    <Progress value={33} aria-label="Upload progress" />,
  );
  const root = slot(screen.container, "progress")!;
  expect(root.getAttribute("role")).toBe("progressbar");
  expect(root.getAttribute("aria-valuenow")).toBe("33");
  expect(root.getAttribute("aria-valuemin")).toBe("0");
  expect(root.getAttribute("aria-valuemax")).toBe("100");
});

test("the root renders its own track and indicator from no children at all (Usage)", async () => {
  const screen = await render(
    <Progress value={40} aria-label="Upload progress" />,
  );
  const track = slot(screen.container, "progress-track")!;
  const indicator = slot(screen.container, "progress-indicator")!;
  expect(track).not.toBeNull();
  expect(indicator.parentElement).toBe(track);
  expect(track.className).toContain("bg-muted");
  expect(indicator.className).toContain("bg-primary");
});

test("every exported part renders and carries its data-slot (Composition)", async () => {
  const screen = await render(
    <Progress value={56}>
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>,
  );
  for (const name of [
    "progress",
    "progress-label",
    "progress-value",
    "progress-track",
    "progress-indicator",
  ]) {
    expect(slot(screen.container, name), name).not.toBeNull();
  }
  // Children come first, then the track/indicator pair the root adds itself. Base UI also appends
  // a visually hidden `role="presentation"` sentinel of its own, which carries no slot.
  const root = slot(screen.container, "progress")!;
  const order = [...root.children]
    .map((child) => child.getAttribute("data-slot"))
    .filter((name): name is string => name !== null);
  expect(order).toEqual(["progress-label", "progress-value", "progress-track"]);
});

test("ProgressTrack and ProgressIndicator can be composed explicitly (Composition)", async () => {
  const screen = await render(
    <Progress value={40} aria-label="Upload progress">
      <ProgressTrack className="h-2">
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>,
  );
  // Two tracks: the one this call site wrote, and the one the root always appends.
  const tracks = screen.container.querySelectorAll(
    '[data-slot="progress-track"]',
  );
  expect(tracks).toHaveLength(2);
  expect(at(tracks, 0).className).toContain("h-2");
});

test("ProgressLabel names the bar and ProgressValue formats it (Label)", async () => {
  const screen = await render(
    <Progress value={56}>
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>,
  );
  const root = slot(screen.container, "progress")!;
  const label = slot(screen.container, "progress-label")!;
  expect(root.getAttribute("aria-labelledby")).toBe(label.id);
  expect(slot(screen.container, "progress-value")!.textContent).toBe("56%");
});

test("the root's format and locale reach ProgressValue (Label)", async () => {
  const screen = await render(
    <Progress
      value={0.42}
      min={0}
      max={1}
      format={{ style: "percent" }}
      locale="en-US"
      aria-label="Upload progress"
    >
      <ProgressValue />
    </Progress>,
  );
  expect(slot(screen.container, "progress-value")!.textContent).toBe("42%");
});

test("value is controlled: a new value moves aria-valuenow (Controlled)", async () => {
  function Controlled() {
    const [value, setValue] = React.useState(50);
    return (
      <div>
        <Progress value={value} aria-label="Upload progress" />
        <button type="button" onClick={() => setValue(80)}>
          Advance
        </button>
      </div>
    );
  }
  const screen = await render(<Controlled />);
  expect(
    slot(screen.container, "progress")!.getAttribute("aria-valuenow"),
  ).toBe("50");
  await screen.getByRole("button", { name: "Advance" }).click();
  await expect
    .poll(() =>
      slot(screen.container, "progress")!.getAttribute("aria-valuenow"),
    )
    .toBe("80");
});

test("value={null} is the indeterminate state (Controlled)", async () => {
  const screen = await render(
    <Progress value={null} aria-label="Upload progress" />,
  );
  const root = slot(screen.container, "progress")!;
  expect(root.getAttribute("data-indeterminate")).not.toBeNull();
  expect(root.getAttribute("aria-valuenow")).toBeNull();
});

test("value at max reports the complete status (Controlled)", async () => {
  const screen = await render(
    <Progress value={100} aria-label="Upload progress" />,
  );
  expect(
    slot(screen.container, "progress")!.getAttribute("data-complete"),
  ).not.toBeNull();
});

test("RTL: a render function replaces the formatted value (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Progress value={56}>
          <ProgressLabel>تقدم الرفع</ProgressLabel>
          <ProgressValue>
            {(value) => <span>{`${value ?? ""} ✓`}</span>}
          </ProgressValue>
        </Progress>
      </div>
    </DirectionProvider>,
  );
  const value = slot(screen.container, "progress-value")!;
  expect(value.textContent).toBe("56% ✓");
  expect(getComputedStyle(value).direction).toBe("rtl");
});

test("the label and the value sit on the logical axis, so RTL needs no override (RTL)", async () => {
  const screen = await render(
    <Progress value={56}>
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>,
  );
  // `ms-auto`, not `ml-auto`: the read-out pushes to the inline end in both directions.
  expect(slot(screen.container, "progress-value")!.className).toContain(
    "ms-auto",
  );
});

test("DOC-1/DOC-2: no styling hunk — nothing here carries a focus glow or a focus suppressor", async () => {
  const screen = await render(
    <Progress value={56}>
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>,
  );
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toContain("outline-none");
    expect(classes).not.toContain("outline-hidden");
  }
  // A progress bar owns no control: nothing in the tree is focusable, which is why no focus or
  // pointer exception reaches this component and its patch has no styling hunk.
  expect(
    screen.container.querySelectorAll(
      'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ),
  ).toHaveLength(0);
});

test("no a11y violations — determinate", async () => {
  const screen = await render(
    <Progress value={56}>
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — indeterminate", async () => {
  const screen = await render(
    <Progress value={null} aria-label="Upload progress" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — complete", async () => {
  const screen = await render(
    <Progress value={100}>
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — RTL", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Progress value={56}>
          <ProgressLabel>تقدم الرفع</ProgressLabel>
          <ProgressValue />
        </Progress>
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});
