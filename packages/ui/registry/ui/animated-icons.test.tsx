import * as React from "react";
import { MotionConfig } from "motion/react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoA11yViolations } from "../../test/a11y";
// The docs gallery tile, tested as the real component rather than as a hand
// re-typed copy of its markup. It lives in `apps/docs` because it is docs
// chrome, and `apps/docs` has no browser test runner of its own — this suite is
// the only place its behaviour can actually be exercised, and the ONE thing it
// gets uniquely wrong (a ref-controlled icon has no touch driver unless the
// host re-provides it) is invisible to any assertion about markup.
import { AnimatedIconCard } from "../../../../apps/docs/components/animated-icon-card";
import { ActivityIcon } from "./icons/activity";

interface AnimationHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type GeneratedIcon = React.ComponentType<
  Omit<React.HTMLAttributes<HTMLSpanElement>, "ref"> & {
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

/**
 * A `matchMedia` stub whose listeners can actually be fired, so a test can move
 * the OS preference WHILE an icon is mounted. Motion's own hooks read a module
 * singleton once at first import and never update — the factory therefore
 * subscribes to the query itself, and this is what proves it.
 */
function controllableReducedMotion(initial: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initial;
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const reduce = query === "(prefers-reduced-motion: reduce)";
    return {
      get matches() {
        return reduce ? matches : false;
      },
      media: query,
      onchange: null,
      addEventListener: (
        type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (reduce && type === "change") listeners.add(listener);
      },
      removeEventListener: (
        type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (reduce && type === "change") listeners.delete(listener);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
  return {
    set(next: boolean) {
      matches = next;
      for (const listener of listeners)
        listener({ matches: next } as MediaQueryListEvent);
    },
    get listenerCount() {
      return listeners.size;
    },
  };
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

// A 439-icon render sweep legitimately outlives the 15s default in the slowest
// engine (measured 20s in Firefox under load), so it carries its own timeout.
test(
  "renders all 439 icons and exercises every reduced-motion imperative handle",
  { timeout: 60_000 },
  async () => {
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
      // An icon sits inside a line of text: the host must be an inline box, not
      // the block-level <div> the per-icon controllers used to render. This
      // suite renders without the compiled stylesheet, so the class is what can
      // be asserted here; the rendered box is covered by the docs pixel lane.
      expect(root.tagName).toBe("SPAN");
      expect(root.classList.contains("inline-flex")).toBe(true);
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
  },
);

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

// ---------------------------------------------------------------------------
// The factory's controller contract.
//
// These behaviours used to be copy-pasted into all 439 mirrors, so testing one
// icon tested one copy. They now live in `createAnimatedIcon`, which means a
// single assertion here covers the whole corpus — and a regression in any of
// them breaks every icon at once, so each is pinned explicitly.
// ---------------------------------------------------------------------------

/** Play the icon and report whether its geometry actually moved. */
async function didAnimate(element: Element) {
  const path = element.querySelector("path");
  if (!path) throw new Error("icon drew no path");
  const resting = path.outerHTML;
  await waitForMarkupChange(path, resting);
  return path.outerHTML !== resting;
}

test("hover plays on a fine pointer", async () => {
  mockReducedMotion(false);
  const screen = await render(<ActivityIcon data-testid="icon" />);
  const root = screen.getByTestId("icon").element();
  root.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
  );
  expect(await didAnimate(root)).toBe(true);
});

test("hover does not play on a touch pointer; pointer-down does", async () => {
  mockReducedMotion(false);
  const screen = await render(
    <>
      <ActivityIcon data-testid="hovered" />
      <ActivityIcon data-testid="tapped" />
    </>,
  );
  const hovered = screen.getByTestId("hovered").element();
  hovered.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "touch" }),
  );
  expect(await didAnimate(hovered)).toBe(false);

  const tapped = screen.getByTestId("tapped").element();
  tapped.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
  );
  expect(await didAnimate(tapped)).toBe(true);
});

test("focus plays", async () => {
  mockReducedMotion(false);
  const screen = await render(<ActivityIcon tabIndex={0} data-testid="icon" />);
  const root = screen.getByTestId("icon").element() as HTMLElement;
  root.focus();
  expect(await didAnimate(root)).toBe(true);
});

test("attaching a ref suppresses the icon's own hover trigger", async () => {
  mockReducedMotion(false);
  const ref = React.createRef<AnimationHandle>();
  const screen = await render(<ActivityIcon ref={ref} data-testid="icon" />);
  await nextFrame();
  const root = screen.getByTestId("icon").element();
  root.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
  );
  expect(await didAnimate(root)).toBe(false);

  // …but the handle still drives it.
  ref.current?.startAnimation();
  expect(await didAnimate(root)).toBe(true);
});

// `<MotionConfig reducedMotion="always">` is the consumer-facing half of the
// gate: it adds reduction on top of the OS preference. The OS-preference half is
// covered separately by the live-transition test below, which drives a
// dispatchable `matchMedia` stub — something that only works because the factory
// subscribes to the query itself rather than reading Motion's import-time
// singleton. (See docs/ledger/bugs.md, 2026-09-07: the pre-existing
// matchMedia-based assertion could not fail, for exactly that reason.)
test("reduced motion suppresses the hover trigger, not just the handle", async () => {
  const screen = await render(
    <MotionConfig reducedMotion="always">
      <ActivityIcon data-testid="icon" />
    </MotionConfig>,
  );
  await nextFrame();
  const root = screen.getByTestId("icon").element();
  root.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
  );
  expect(await didAnimate(root)).toBe(false);
});

test("reduced motion suppresses the imperative handle too", async () => {
  const ref = React.createRef<AnimationHandle>();
  const screen = await render(
    <MotionConfig reducedMotion="always">
      <ActivityIcon ref={ref} data-testid="icon" />
    </MotionConfig>,
  );
  await nextFrame();
  const root = screen.getByTestId("icon").element();
  ref.current?.startAnimation();
  expect(await didAnimate(root)).toBe(false);
});

test("playback resumes when the preference is not set", async () => {
  // The negative control for the two tests above: same icon, same trigger, no
  // reduced-motion config — so a green pair cannot come from a broken probe.
  // Deliberately NO <MotionConfig>: the un-configured tree is the one almost
  // every consumer actually has, so it is the one the control must exercise.
  mockReducedMotion(false);
  const screen = await render(<ActivityIcon data-testid="icon" />);
  await nextFrame();
  const root = screen.getByTestId("icon").element();
  root.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
  );
  expect(await didAnimate(root)).toBe(true);
});

// The case every other reduced-motion test here missed, and the one almost
// every consumer is actually in: the OS preference set, and NO <MotionConfig>
// anywhere in the tree. Motion's `MotionConfigContext` defaults to
// `reducedMotion: "never"`, so a factory that treats that value as an opt-out
// returns false for everyone and never reads the preference at all — which is
// what both `useReducedMotionConfig()` and the first fix for it did. The docs
// promise the opposite ("no MotionConfig is required for VegaStack icon
// safety"), so this is the assertion that holds them to it.
test("the OS preference is honoured with no <MotionConfig> in the tree", async () => {
  mockReducedMotion(true);
  const screen = await render(<ActivityIcon data-testid="icon" />);
  await nextFrame();
  const root = screen.getByTestId("icon").element();
  root.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
  );
  expect(await didAnimate(root)).toBe(false);
});

// …and a consumer cannot take reduced motion away from the user by asking for
// Motion's default value explicitly. `<MotionConfig reducedMotion="never">`
// produces a context byte-identical to no provider at all, so it cannot mean
// "animate anyway" without meaning it for everyone who configured nothing.
test('<MotionConfig reducedMotion="never"> cannot defeat the OS preference', async () => {
  mockReducedMotion(true);
  const screen = await render(
    <MotionConfig reducedMotion="never">
      <ActivityIcon data-testid="icon" />
    </MotionConfig>,
  );
  await nextFrame();
  const root = screen.getByTestId("icon").element();
  root.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
  );
  expect(await didAnimate(root)).toBe(false);
});

test("size resolves through the --icon-default role token by default", async () => {
  mockReducedMotion(true);
  const screen = await render(
    <>
      <ActivityIcon data-testid="default-size" />
      <ActivityIcon data-testid="explicit-size" size="var(--icon-feature)" />
    </>,
  );
  const svg = (testId: string) =>
    screen.getByTestId(testId).element().querySelector("svg");
  expect(svg("default-size")?.getAttribute("width")).toBe(
    "var(--icon-default)",
  );
  expect(svg("explicit-size")?.getAttribute("width")).toBe(
    "var(--icon-feature)",
  );
});

// ---------------------------------------------------------------------------
// The docs gallery tile (`AnimatedIconCard`).
//
// Attaching a ref latches the icon into controlled mode, which disables ALL of
// its own triggers — so every input the tile supports is one the tile itself
// has to re-provide. Asserting on its markup cannot see that; only playing the
// icon through each input can.
// ---------------------------------------------------------------------------

function tileButton(container: Element, label: string) {
  // The tile's accessible name is the icon name plus what activating it does
  // (DC-12), so match on the label rather than assuming the whole string.
  const button = container.querySelector<HTMLButtonElement>(
    `button[aria-label^="${label} icon"]`,
  );
  if (!button) throw new Error(`no gallery tile labelled ${label}`);
  return button;
}

const hover = (element: Element) =>
  element.dispatchEvent(
    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
  );
const unhover = (element: Element) =>
  element.dispatchEvent(
    new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse" }),
  );
const tap = (element: Element) =>
  element.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
  );

test("an icon tile is a named control, not a focusable div", async () => {
  mockReducedMotion(true);
  // The gallery used to render 439 focusable <div>s with no role — reachable by
  // keyboard and announced as nothing.
  const screen = await render(
    <div data-testid="tile">
      <AnimatedIconCard as={ActivityIcon} label="Activity" />
    </div>,
  );
  const tile = screen.getByTestId("tile").element();
  expect(tile.querySelectorAll("div[tabindex]")).toHaveLength(0);
  expect(tileButton(tile, "Activity").type).toBe("button");
  // color-contrast/target-size need compiled CSS, which this suite does not load
  // — both are proven on the real page by the compiled-CSS and contract lanes.
  await expectNoA11yViolations(tile, ["color-contrast", "target-size"]);
});

test("an icon tile plays from hover, focus, and touch", async () => {
  mockReducedMotion(false);
  const screen = await render(
    <div data-testid="tiles">
      <AnimatedIconCard as={ActivityIcon} label="Hovered" />
      <AnimatedIconCard as={ActivityIcon} label="Focused" />
      <AnimatedIconCard as={ActivityIcon} label="Tapped" />
      <AnimatedIconCard as={ActivityIcon} label="Idle" />
    </div>,
  );
  const tiles = screen.getByTestId("tiles").element();

  hover(tileButton(tiles, "Hovered"));
  expect(await didAnimate(tileButton(tiles, "Hovered"))).toBe(true);

  tileButton(tiles, "Focused").focus();
  expect(await didAnimate(tileButton(tiles, "Focused"))).toBe(true);

  // The regression this test exists for: on a touch device no hover and no
  // focus ever arrives, so without a pointerdown driver the whole gallery is
  // inert — and the icon's own tap handler is suppressed by the tile's ref.
  tap(tileButton(tiles, "Tapped"));
  expect(await didAnimate(tileButton(tiles, "Tapped"))).toBe(true);

  // The negative control: an untouched tile stays at rest, so the three
  // assertions above cannot be passing on a probe that always reports movement.
  expect(await didAnimate(tileButton(tiles, "Idle"))).toBe(false);
});

test("an icon tile honours reduced motion, and plays again without it", async () => {
  mockReducedMotion(false);
  const screen = await render(
    <>
      <MotionConfig reducedMotion="always">
        <div data-testid="reduced">
          <AnimatedIconCard as={ActivityIcon} label="Reduced" />
        </div>
      </MotionConfig>
      {/* No <MotionConfig>: the preference is off, so the tile plays. Using
          reducedMotion="never" here would assert nothing, because that value is
          Motion's default and the factory deliberately ignores it. */}
      <div data-testid="full">
        <AnimatedIconCard as={ActivityIcon} label="Full" />
      </div>
    </>,
  );
  await nextFrame();

  const reduced = tileButton(
    screen.getByTestId("reduced").element(),
    "Reduced",
  );
  hover(reduced);
  expect(await didAnimate(reduced)).toBe(false);

  // The negative control for the assertion above: same tile, same trigger.
  const full = tileButton(screen.getByTestId("full").element(), "Full");
  hover(full);
  expect(await didAnimate(full)).toBe(true);
});

test("a mounted icon follows a live reduced-motion change in both directions", async () => {
  // Motion 12.42.2's useReducedMotion() is `useState(prefersReducedMotion.current)`
  // with no subscription (its own source carries a TODO about this), so an icon
  // built on it would keep the value captured at first import forever. The
  // factory subscribes to the media query instead; this is the proof.
  const media = controllableReducedMotion(true);
  const screen = await render(<ActivityIcon data-testid="icon" />);
  await nextFrame();
  const root = screen.getByTestId("icon").element();
  expect(media.listenerCount).toBeGreaterThan(0);

  hover(root);
  expect(await didAnimate(root)).toBe(false);
  unhover(root);

  // Preference switched OFF while mounted.
  media.set(false);
  await nextFrame();
  hover(root);
  expect(await didAnimate(root)).toBe(true);
  unhover(root);
  await new Promise((resolve) => setTimeout(resolve, 150));

  // …and back ON, which must settle the icon and re-gate playback.
  media.set(true);
  await nextFrame();
  await new Promise((resolve) => setTimeout(resolve, 150));
  hover(root);
  expect(await didAnimate(root)).toBe(false);

  // The subscription is torn down with the icon.
  await screen.unmount();
  expect(media.listenerCount).toBe(0);
});

test("a timer-driven icon cancels its deferred work on unmount", async () => {
  mockReducedMotion(false);
  // `wifi-low` is the one icon whose choreography schedules deferred work; the
  // factory owns that timer, so unmounting mid-flight must not throw.
  const { WifiLowIcon } = await import("./icons/wifi-low");
  const ref = React.createRef<AnimationHandle>();
  const screen = await render(<WifiLowIcon ref={ref} data-testid="icon" />);
  ref.current?.startAnimation();
  await nextFrame();
  await screen.unmount();
  await new Promise((resolve) => setTimeout(resolve, 60));
});
