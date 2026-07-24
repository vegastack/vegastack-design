import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ActivityIcon } from "./icons/activity";

interface AnimationHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type GeneratedIcon = React.ComponentType<
  Omit<React.HTMLAttributes<HTMLDivElement>, "ref"> & {
    size?: number | string;
    ref?: React.Ref<AnimationHandle>;
  }
>;

type IconModule = { [exportName: string]: unknown };

declare global {
  interface ImportMeta {
    glob: <T>(pattern: string, options: { eager: true }) => Record<string, T>;
  }
}

const ICON_MODULES = import.meta.glob<IconModule>("./icons/*.tsx", {
  eager: true,
});

function exportedIcon(
  path: string,
  module: { [exportName: string]: unknown },
): GeneratedIcon {
  const candidates = Object.entries(module).filter(
    ([name, value]) => name.endsWith("Icon") && typeof value === "function",
  );
  if (candidates.length !== 1) {
    throw new Error(
      `${path}: expected one runtime *Icon export, found ${candidates.length}`,
    );
  }
  const candidate = candidates[0];
  if (!candidate) throw new Error(`${path}: missing runtime *Icon export`);
  return candidate[1] as GeneratedIcon;
}

function mockReducedMotion(matches: boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForMarkupChange(
  element: Element,
  initialMarkup: string,
  maximumFrames = 20,
) {
  for (let frame = 0; frame < maximumFrames; frame += 1) {
    await nextFrame();
    if (element.outerHTML !== initialMarkup) return;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

test("renders all 439 icons and exercises every reduced-motion imperative handle", async () => {
  mockReducedMotion(true);
  const entries = Object.entries(ICON_MODULES).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  expect(entries).toHaveLength(439);
  const refs = new Map(
    entries.map(([path]) => [path, React.createRef<AnimationHandle>()]),
  );

  const screen = await render(
    <div>
      {entries.map(([path, module]) => {
        const Icon = exportedIcon(path, module);
        return (
          <Icon
            key={path}
            ref={refs.get(path)}
            data-animated-icon-source={path}
          />
        );
      })}
    </div>,
  );

  await nextFrame();
  const roots = screen.container.querySelectorAll<HTMLElement>(
    "[data-animated-icon-source]",
  );
  expect(roots).toHaveLength(439);
  for (const root of roots) {
    const svg = root.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("height")).toBe("var(--icon-default)");
    expect(svg?.getAttribute("width")).toBe("var(--icon-default)");
    expect(svg?.getAttribute("stroke") ?? svg?.getAttribute("fill")).toBe(
      "currentColor",
    );
    expect(svg?.viewBox.baseVal.width).toBeGreaterThan(0);
    expect(svg?.viewBox.baseVal.height).toBeGreaterThan(0);
  }
  for (const [path] of entries) {
    const handle = refs.get(path)?.current;
    expect(handle, `${path} imperative handle`).toEqual({
      startAnimation: expect.any(Function),
      stopAnimation: expect.any(Function),
    });
    handle?.startAnimation();
    handle?.stopAnimation();
  }
  await nextFrame();
});

test("exposes the imperative start/stop handle through a React 19 ref prop", async () => {
  mockReducedMotion(false);
  const ref = React.createRef<AnimationHandle>();
  const screen = await render(
    <ActivityIcon ref={ref} data-testid="activity" />,
  );
  expect(ref.current).toEqual({
    startAnimation: expect.any(Function),
    stopAnimation: expect.any(Function),
  });

  const path = screen.getByTestId("activity").element().querySelector("path");
  expect(path).not.toBeNull();
  const restingMarkup = path?.outerHTML;
  ref.current?.startAnimation();
  if (path && restingMarkup) await waitForMarkupChange(path, restingMarkup);
  expect(path?.outerHTML).not.toBe(restingMarkup);

  ref.current?.stopAnimation();
  await nextFrame();
  expect(ref.current).not.toBeNull();
});

test("reduced motion keeps imperative playback in the immediate resting state", async () => {
  mockReducedMotion(true);
  const ref = React.createRef<AnimationHandle>();
  const screen = await render(
    <ActivityIcon ref={ref} data-testid="activity" />,
  );
  await nextFrame();
  await nextFrame();

  const path = screen.getByTestId("activity").element().querySelector("path");
  expect(path).not.toBeNull();
  const restingStyle = path?.getAttribute("style");
  ref.current?.startAnimation();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(path?.getAttribute("style")).toBe(restingStyle);
});

test("preserves consumer callbacks across pointer, touch, and keyboard-compatible triggers", async () => {
  mockReducedMotion(true);
  const onMouseEnter = vi.fn();
  const onMouseLeave = vi.fn();
  const onPointerEnter = vi.fn();
  const onPointerLeave = vi.fn();
  const onPointerDown = vi.fn();
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const screen = await render(
    <>
      <ActivityIcon
        data-testid="pointer-activity"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      />
      <ActivityIcon
        data-testid="touch-activity"
        onPointerDown={onPointerDown}
      />
      <ActivityIcon
        tabIndex={0}
        data-testid="keyboard-activity"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <ActivityIcon
        data-testid="mouse-activity"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </>,
  );
  // The browser pointer can already be resting over the test frame when these
  // roots mount (Firefox reports that native entry before our synthetic probe).
  // Clear incidental mount-time callbacks so exact counts below cover only the
  // events deliberately dispatched by this test.
  onMouseEnter.mockClear();
  onMouseLeave.mockClear();
  onPointerEnter.mockClear();
  onPointerLeave.mockClear();
  onPointerDown.mockClear();
  onFocus.mockClear();
  onBlur.mockClear();
  const pointerRoot = screen.getByTestId("pointer-activity").element();
  pointerRoot.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
  );
  pointerRoot.dispatchEvent(
    new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse" }),
  );

  screen
    .getByTestId("touch-activity")
    .element()
    .dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
    );

  const keyboardRoot = screen.getByTestId("keyboard-activity").element();
  keyboardRoot.focus();
  keyboardRoot.blur();

  const mouseRoot = screen.getByTestId("mouse-activity").element();
  mouseRoot.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  mouseRoot.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  await Promise.resolve();

  expect(onPointerEnter).toHaveBeenCalledOnce();
  expect(onPointerDown).toHaveBeenCalledOnce();
  expect(onFocus).toHaveBeenCalledOnce();
  expect(onBlur).toHaveBeenCalledOnce();
  expect(onPointerLeave).toHaveBeenCalledOnce();
  expect(onMouseEnter).toHaveBeenCalledOnce();
  expect(onMouseLeave).toHaveBeenCalledOnce();
});
