// @vegastack rail@0.116.0 sha256-qQpiKhOLOAH0o5vdXDKFoZUE3MZwsc4/durme8I2Wf8=

"use client";

import * as React from "react";
import type {
  AnimatedIconComponentType,
  AnimatedIconHandle,
  AnimatedIconOwnProps,
} from "@vegastack/design/create-animated-icon";

/* ---
The rail's one client leaf: a rail item's icon that upgrades itself to its animated twin once the
browser is idle, and `lazyAnimatedIcon`, which keeps that twin out of the first bundle.
--- */

/**
 * A DS animated icon (`@/components/ui/icons/*`) that loads only when it first renders, for a
 * rail item's `animatedIcon`: its module and Motion stay out of the first bundle. Call it at the
 * top level of a client module.
 *
 * @example
 * "use client";
 * export const HomeIconLazy = lazyAnimatedIcon(() =>
 *   import("@/components/ui/icons/home").then((m) => m.HomeIcon),
 * );
 * // in the rail: <RailItem icon={<Home />} animatedIcon={<HomeIconLazy />} label="Home" … />
 */
export function lazyAnimatedIcon(
  load: () => Promise<AnimatedIconComponentType>,
): React.LazyExoticComponent<AnimatedIconComponentType> {
  return React.lazy(() => load().then((Icon) => ({ default: Icon })));
}

/** Waits for the browser to be idle (or a second, whichever is first). */
function whenIdle(task: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout: 1000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 200);
  return () => window.clearTimeout(id);
}

/** Props accepted by `RailIcon`. */
export interface RailIconProps {
  /** The static icon, painted first and kept until the animated one has loaded. */
  icon: React.ReactNode;
  /** The animated icon's element (`lazyAnimatedIcon`), swapped in once the browser is idle. */
  animated: React.ReactElement;
}

/**
 * A rail item's icon that upgrades itself (L23): the static icon paints with the page; once the
 * browser is idle the animated one loads and takes its place at the same 18px, then plays when
 * the item is hovered or becomes the current module. The animation itself honours reduced
 * motion. Rendered by `RailItem` when it has an `animatedIcon`.
 *
 * @example
 * <RailIcon icon={<Home />} animated={<HomeIconLazy />} />
 */
export function RailIcon({ icon, animated }: RailIconProps) {
  const [ready, setReady] = React.useState(false);
  const anchor = React.useRef<HTMLSpanElement>(null);
  const handle = React.useRef<AnimatedIconHandle | null>(null);
  // A play asked for while the icon was still loading; honoured when it attaches.
  const pending = React.useRef(false);

  const play = React.useCallback(() => {
    if (!handle.current) {
      pending.current = true;
      return;
    }
    handle.current.stopAnimation();
    handle.current.startAnimation();
  }, []);
  const rest = React.useCallback(() => {
    pending.current = false;
    handle.current?.stopAnimation();
  }, []);
  const attach = React.useCallback((next: AnimatedIconHandle | null) => {
    handle.current = next;
    if (next && pending.current) {
      pending.current = false;
      next.startAnimation();
    }
  }, []);

  React.useEffect(() => whenIdle(() => setReady(true)), []);

  React.useEffect(() => {
    const item = anchor.current?.closest<HTMLElement>(
      '[data-slot="rail-item"]',
    );
    if (!ready || !item) return;
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") play();
    };
    // Becoming the current module plays it once; leaving it rearms it.
    const active = new MutationObserver(() => {
      if (item.hasAttribute("data-active")) play();
      else rest();
    });
    active.observe(item, {
      attributes: true,
      attributeFilter: ["data-active"],
    });
    item.addEventListener("pointerenter", onEnter);
    item.addEventListener("pointerleave", rest);
    item.addEventListener("focus", play);
    item.addEventListener("blur", rest);
    return () => {
      active.disconnect();
      item.removeEventListener("pointerenter", onEnter);
      item.removeEventListener("pointerleave", rest);
      item.removeEventListener("focus", play);
      item.removeEventListener("blur", rest);
    };
  }, [ready, play, rest]);

  return (
    <span
      ref={anchor}
      data-slot="rail-icon"
      className="grid size-4.5 place-items-center [&>*]:col-start-1 [&>*]:row-start-1"
    >
      {ready ? (
        <IconFallback fallback={icon}>
          <React.Suspense fallback={icon}>
            {React.cloneElement(animated, {
              ref: attach,
              size: "1.125rem",
              "aria-hidden": true,
            } as AnimatedIconOwnProps & {
              ref: React.Ref<AnimatedIconHandle>;
            })}
          </React.Suspense>
        </IconFallback>
      ) : (
        icon
      )}
    </span>
  );
}

/** Keeps the static icon if the animated one's chunk fails to load: it is only an upgrade. */
class IconFallback extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
