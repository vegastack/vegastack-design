"use client";

import * as React from "react";
import {
  AnimatePresence,
  MotionConfigContext,
  motion,
  useAnimation,
} from "motion/react";
import type { Transition, Variants } from "motion/react";

import { cn } from "../index";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Motion does not ship a hook that tracks the OS preference over time. In
 * 13.2.0 `useReducedMotion()` is literally
 * `useState(prefersReducedMotion.current)` — a one-shot read of a module
 * singleton captured on first import, with a standing `TODO` in its source
 * about not updating — and `useReducedMotionConfig()` layers `<MotionConfig>`
 * on top of that same one-shot value. A mounted icon therefore never re-renders
 * when the preference is turned on, which is exactly when it matters most.
 *
 * So the media query is subscribed to directly, through
 * `useSyncExternalStore`: the store re-renders every mounted icon on a live
 * change, and the SSR snapshot is `false` (no preference is knowable on the
 * server).
 */
function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function readReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** No preference exists on the server; icons render at rest and hydrate. */
function readReducedMotionOnServer() {
  return false;
}

/**
 * The live preference, with `<MotionConfig reducedMotion="always">` able to
 * force reduction on top of it.
 *
 * The override is deliberately ONE-WAY, and that is forced by Motion's own
 * defaults. `MotionConfigContext`'s default value is
 * `{ …, reducedMotion: "never" }` — Motion does not reduce motion unless an
 * application opts in with `<MotionConfig reducedMotion="user">` — and
 * `MotionConfig` merges over its parent, so an explicit `reducedMotion="never"`
 * and *no `<MotionConfig>` at all* produce byte-identical context values. There
 * is no public way to tell them apart.
 *
 * Given that ambiguity, honouring `"never"` as an opt-out is not a neutral
 * choice: it silently disables reduced motion for every consumer who mounts no
 * `<MotionConfig>`, which is most of them, and the docs promise the opposite
 * ("no `MotionConfig` is required for VegaStack icon safety"). So the OS
 * preference always wins unless a consumer asks for MORE reduction. A consumer
 * who genuinely wants motion against the user's stated preference has to hold
 * that decision themselves rather than getting it by default.
 *
 * This is why neither Motion hook is used: `useReducedMotionConfig()` applies
 * exactly the `"never"` branch described above, so under Motion's default
 * context it returns `false` unconditionally and the preference is never read.
 */
function useLiveReducedMotion() {
  const preference = React.useSyncExternalStore(
    subscribeToReducedMotion,
    readReducedMotion,
    readReducedMotionOnServer,
  );
  const { reducedMotion } = React.useContext(MotionConfigContext);
  if (reducedMotion === "always") return true;
  return preference;
}

/**
 * Motion's imperative controls. `motion` does not export a public name for this
 * type (`LegacyAnimationControls` lives in `motion-dom` and is not re-exported),
 * so it is derived from the hook that produces it.
 */
export type AnimatedIconControls = ReturnType<typeof useAnimation>;

/** A variant label or an explicit target — whatever `controls.start()` accepts. */
export type AnimatedIconDefinition = Parameters<
  AnimatedIconControls["start"]
>[0];

/** The per-call transition override `controls.start()` accepts as its 2nd argument. */
export type AnimatedIconTransition = Parameters<
  AnimatedIconControls["start"]
>[1];

/**
 * Motion's own prop types, taken from a Motion element rather than restated, so
 * a spec can never declare something Motion would reject. (`initial` is
 * deliberately narrower than a start() definition: it takes no variant resolver.)
 */
type MotionElementProps = React.ComponentProps<typeof motion.svg>;
export type AnimatedIconInitial = MotionElementProps["initial"];
export type AnimatedIconTarget = MotionElementProps["animate"];
export type AnimatedIconExit = MotionElementProps["exit"];
/**
 * The root renders as either `svg` or `motion.svg`, so a style must satisfy
 * both: plain CSS plus Motion's transform-origin shorthands.
 */
export type AnimatedIconStyle = React.CSSProperties &
  NonNullable<MotionElementProps["style"]>;

/**
 * The imperative handle every animated icon exposes on its ref — drive the
 * animation programmatically instead of (or in addition to) hover/focus.
 */
export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/**
 * The choreography context handed to a spec's `start`/`stop`. Every timing
 * primitive an icon may need is here, so an icon module never touches React.
 */
export interface AnimatedIconChoreography {
  /**
   * Look up a control group by name; no argument gives the primary group. A
   * function rather than a record so a group is never `possibly undefined` at
   * the call site — the factory creates exactly the groups the spec declares.
   */
  control: (group?: string) => AnimatedIconControls;
  /**
   * The live `(prefers-reduced-motion: reduce)` preference, with an explicit
   * `<MotionConfig reducedMotion>` override applied.
   */
  shouldReduceMotion: boolean;
  /**
   * Play a definition. A no-op that also halts the control when reduced motion
   * is requested. Never rejects — an interrupted animation resolves.
   */
  run: (
    control: AnimatedIconControls,
    definition: AnimatedIconDefinition,
    transition?: AnimatedIconTransition,
  ) => Promise<void>;
  /**
   * Return to a resting definition. Under reduced motion the target is applied
   * instantly instead of being animated to.
   */
  reset: (
    control: AnimatedIconControls,
    definition: AnimatedIconDefinition,
    transition?: AnimatedIconTransition,
  ) => Promise<void>;
  /** Halt a control and snap it to a definition, with no animation, ever. */
  set: (
    control: AnimatedIconControls,
    definition: AnimatedIconDefinition,
  ) => void;
  /**
   * Schedule deferred work. Every pending task is cancelled when the animation
   * stops and when the icon unmounts, so an icon never leaks a timer.
   */
  after: (delayMs: number, task: () => void) => void;
  /**
   * Per-instance scratch for choreography that needs to remember something
   * between calls — a re-entrancy latch, say. Persists for the icon's lifetime.
   */
  flags: Record<string, unknown>;
}

/** Every SVG element an icon may draw, plus its Motion counterpart. */
const TAGS = {
  circle: "circle",
  defs: "defs",
  ellipse: "ellipse",
  g: "g",
  line: "line",
  path: "path",
  pattern: "pattern",
  polygon: "polygon",
  polyline: "polyline",
  rect: "rect",
  text: "text",
  "motion.circle": motion.circle,
  "motion.ellipse": motion.ellipse,
  "motion.g": motion.g,
  "motion.line": motion.line,
  "motion.path": motion.path,
  "motion.pattern": motion.pattern,
  "motion.polygon": motion.polygon,
  "motion.polyline": motion.polyline,
  "motion.rect": motion.rect,
  "motion.text": motion.text,
} as const;

export type AnimatedIconTag = keyof typeof TAGS;

/**
 * A single drawn node. Static SVG attributes sit flat alongside the spec keys,
 * so one element is one line; {@link ANIMATED_ICON_RESERVED_KEYS} is the set the
 * factory consumes rather than forwarding to the DOM.
 */
interface AnimatedIconNodeBase {
  tag: AnimatedIconTag;
  /** Motion's style type, which adds transform-origin shorthands to CSS. */
  style?: AnimatedIconStyle;
  className?: string;
  variants?: Variants;
  initial?: AnimatedIconInitial;
  /**
   * A literal animation target. When omitted, a `motion.*` node is driven by
   * its control group unless `inherit` says otherwise.
   */
  animate?: AnimatedIconTarget;
  exit?: AnimatedIconExit;
  transition?: Transition;
  /** Passed to a variant resolver — an index, a delay, or a small offset. */
  custom?: unknown;
  /** Control group driving this node. Defaults to `default`. */
  group?: string;
  /**
   * Bind no control: the node takes its state from Motion's variant propagation
   * down the tree, from a presence mount, or from nothing at all.
   */
  inherit?: boolean;
  children?: AnimatedIconChild[];
  /** Text content, for the one icon that draws a glyph. */
  text?: string;
}

/**
 * A node plus its flat static SVG attributes. The intersection (rather than an
 * index signature on the interface) keeps every declared key precisely typed.
 */
export type AnimatedIconNode = AnimatedIconNodeBase & {
  [attribute: string]: unknown;
};

/** A bare string is a static `<path d="…"/>` — the commonest node by far. */
export type AnimatedIconChild = string | AnimatedIconNode;

/** Spec keys the factory consumes; everything else is an SVG attribute. */
export const ANIMATED_ICON_RESERVED_KEYS = new Set([
  "animate",
  "children",
  "className",
  "custom",
  "exit",
  "group",
  "inherit",
  "initial",
  "style",
  "tag",
  "text",
  "transition",
  "variants",
]);

/**
 * A mount/unmount swap: `active` nodes are mounted while the animation runs,
 * `rest` nodes while it does not, with Motion's exit animations in between.
 */
export interface AnimatedIconPresence {
  tag: "presence";
  active: AnimatedIconChild[];
  rest: AnimatedIconChild[];
}

/** The root `<svg>`. Only deviations from the lucide defaults need stating. */
export interface AnimatedIconRoot extends Omit<
  AnimatedIconNodeBase,
  "tag" | "children"
> {
  tag?: "svg" | "motion.svg";
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string | number;
  strokeLinecap?: "round" | "butt" | "square";
  strokeLinejoin?: "round" | "miter" | "bevel";
  overflow?: string;
}

/** The complete description of one animated icon. */
export interface AnimatedIconSpec {
  /** The component's `displayName`, e.g. `BellIcon`. */
  name: string;
  /** Root `<svg>` overrides and, when the whole icon animates, its motion props. */
  svg?: AnimatedIconRoot;
  /** The drawn tree, in paint order. */
  elements: (AnimatedIconChild | AnimatedIconPresence)[];
  /** Extra control groups beyond `default`, in a stable order. */
  groups?: readonly string[];
  /** Non-default play choreography. Defaults to `run(default, "animate")`. */
  start?: (choreography: AnimatedIconChoreography) => void | Promise<void>;
  /** Non-default rest choreography. Defaults to `reset(default, "normal")`. */
  stop?: (choreography: AnimatedIconChoreography) => void | Promise<void>;
}

export interface AnimatedIconOwnProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "ref"
> {
  /** Any CSS length. Defaults to the `--icon-default` role token. */
  size?: number | string;
  ref?: React.Ref<AnimatedIconHandle>;
}

/** The component shape `createAnimatedIcon` returns. */
export type AnimatedIconComponentType = ((
  props: AnimatedIconOwnProps,
) => React.JSX.Element) & { displayName: string };

const ROOT_DEFAULTS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function isPresence(
  node: AnimatedIconChild | AnimatedIconPresence,
): node is AnimatedIconPresence {
  return typeof node === "object" && node.tag === "presence";
}

function isMotionTag(tag: string): boolean {
  return tag.startsWith("motion.");
}

/** Expand the bare-string shorthand into a real node. */
function asNode(child: AnimatedIconChild): AnimatedIconNode {
  return typeof child === "string" ? { tag: "path", d: child } : child;
}

/**
 * Does this spec drive anything through `useAnimation` controls? A purely
 * presence-driven icon has no controls to play, so it must not be handed the
 * default `run(default, "animate")` choreography.
 */
function specUsesControls(spec: AnimatedIconSpec): boolean {
  if (spec.start || spec.stop) return true;
  if (spec.svg?.tag === "motion.svg" && !spec.svg.inherit) return true;
  const walk = (nodes: (AnimatedIconChild | AnimatedIconPresence)[]): boolean =>
    nodes.some((child) => {
      if (isPresence(child)) return false;
      const node = asNode(child);
      if (isMotionTag(node.tag) && !node.inherit && !node.animate) return true;
      return node.children ? walk(node.children) : false;
    });
  return walk(spec.elements);
}

function hasPresenceNode(spec: AnimatedIconSpec): boolean {
  return spec.elements.some(isPresence);
}

/** Split a flat node into the DOM attributes and the props the factory owns. */
function svgAttributes(node: AnimatedIconNode): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (ANIMATED_ICON_RESERVED_KEYS.has(key)) continue;
    if (value !== undefined) attributes[key] = value;
  }
  return attributes;
}

function renderNode(
  child: AnimatedIconChild,
  key: React.Key,
  controls: Record<string, AnimatedIconControls>,
): React.JSX.Element {
  const node = asNode(child);
  const Tag = TAGS[node.tag] as React.ElementType;
  const motionProps = isMotionTag(node.tag)
    ? {
        animate:
          node.animate ??
          (node.inherit ? undefined : controls[node.group ?? "default"]),
        initial: node.initial,
        exit: node.exit,
        variants: node.variants,
        transition: node.transition,
        custom: node.custom,
      }
    : undefined;
  return (
    <Tag
      key={key}
      {...svgAttributes(node)}
      className={node.className}
      style={node.style}
      {...motionProps}
    >
      {node.text}
      {node.children?.map((grandchild, index) =>
        renderNode(grandchild, index, controls),
      )}
    </Tag>
  );
}

/**
 * `createAnimatedIcon` — the single controller behind every mirrored
 * `lucide-animated` icon. The factory owns the animation controls, the
 * reduced-motion contract, the multi-input trigger rules, the imperative
 * handle, and the host element; an icon module owns only its geometry and,
 * where upstream choreography is not the default play/rest pair, its
 * `start`/`stop`.
 *
 * Trigger rules, unchanged from the per-icon controllers they replace:
 * hover plays on fine pointers, a pointer-down plays on touch, focus plays and
 * blur rests, and every trigger is suppressed once a consumer attaches a ref
 * (the icon is then under imperative control).
 *
 * @example
 * export const BellIcon = createAnimatedIcon({
 *   name: "BellIcon",
 *   svg: { tag: "motion.svg", variants: SVG_VARIANTS },
 *   elements: [{ tag: "path", attrs: { d: "M6 8a6 6 0 0 1 12 0…" } }],
 * });
 */
export function createAnimatedIcon(
  spec: AnimatedIconSpec,
): AnimatedIconComponentType {
  const groupNames: readonly string[] = spec.groups ?? ["default"];
  const usesControls = specUsesControls(spec);
  const usesPresence = hasPresenceNode(spec);
  const root = spec.svg ?? {};
  const rootTag = root.tag ?? "svg";
  const RootTag = (rootTag === "motion.svg" ? motion.svg : "svg") as
    typeof motion.svg | "svg";

  function AnimatedIconComponent({
    className,
    size = "var(--icon-default)",
    ref,
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onFocus,
    onBlur,
    ...props
  }: AnimatedIconOwnProps) {
    // `groupNames` is fixed when the component type is created, so this loop
    // calls the same hooks in the same order on every render of this component.
    const controlList = groupNames.map(() => useAnimation()); // eslint-disable-line react-hooks/rules-of-hooks -- fixed-length list, see above
    // A live subscription to the media query, not either of Motion's one-shot
    // hooks — see `useLiveReducedMotion` above for why neither can be used.
    const shouldReduceMotion = useLiveReducedMotion();
    const [isActive, setIsActive] = React.useState(false);

    const reduceRef = React.useRef(shouldReduceMotion);
    reduceRef.current = shouldReduceMotion;
    const isControlledRef = React.useRef(false);
    const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

    const controls = React.useMemo(
      () =>
        Object.fromEntries(
          groupNames.map((name, index) => [name, controlList[index]]),
        ) as Record<string, AnimatedIconControls>,
      // Each entry is referentially stable for the life of the component.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      controlList,
    );

    const clearTimers = React.useCallback(() => {
      for (const timer of timersRef.current) clearTimeout(timer);
      timersRef.current = [];
    }, []);

    React.useEffect(() => clearTimers, [clearTimers]);

    const run = React.useCallback<AnimatedIconChoreography["run"]>(
      (control, definition, transition) => {
        if (reduceRef.current) {
          control.stop();
          return Promise.resolve();
        }
        return Promise.resolve(control.start(definition, transition)).then(
          () => undefined,
          () => undefined,
        );
      },
      [],
    );

    const reset = React.useCallback<AnimatedIconChoreography["reset"]>(
      (control, definition, transition) => {
        if (reduceRef.current) {
          control.stop();
          control.set(definition);
          return Promise.resolve();
        }
        return Promise.resolve(control.start(definition, transition)).then(
          () => undefined,
          () => undefined,
        );
      },
      [],
    );

    const set = React.useCallback<AnimatedIconChoreography["set"]>(
      (control, definition) => {
        control.stop();
        control.set(definition);
      },
      [],
    );

    const after = React.useCallback<AnimatedIconChoreography["after"]>(
      (delayMs, task) => {
        timersRef.current.push(setTimeout(task, delayMs));
      },
      [],
    );

    const flagsRef = React.useRef<Record<string, unknown>>({});

    // Index rather than key: `groupNames` is fixed when the component type is
    // created and the generator only ever names a group it declared, so the
    // lookup is total. An unknown name falls back to the primary control rather
    // than handing a hand-written spec an undefined.
    const control = React.useCallback(
      (group?: string) => {
        const index = group ? groupNames.indexOf(group) : 0;
        return controlList[index === -1 ? 0 : index] as AnimatedIconControls;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- stable entries
      controlList,
    );

    const choreography = React.useMemo<AnimatedIconChoreography>(
      () => ({
        control,
        shouldReduceMotion,
        run,
        reset,
        set,
        after,
        flags: flagsRef.current,
      }),
      [control, shouldReduceMotion, run, reset, set, after],
    );

    const primaryControl = control();

    const startAnimation = React.useCallback(() => {
      clearTimers();
      if (usesPresence) setIsActive(!reduceRef.current);
      if (spec.start) {
        void spec.start(choreography);
        return;
      }
      if (usesControls) void run(primaryControl, "animate");
    }, [choreography, clearTimers, run, primaryControl]);

    const stopAnimation = React.useCallback(() => {
      clearTimers();
      if (usesPresence) setIsActive(false);
      if (spec.stop) {
        void spec.stop(choreography);
        return;
      }
      if (usesControls) void reset(primaryControl, "normal");
    }, [choreography, clearTimers, reset, primaryControl]);

    React.useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return { startAnimation, stopAnimation };
    });

    // Settle at the resting state whenever the preference turns on — on mount
    // and on a live change, and never on an unrelated re-render.
    React.useEffect(() => {
      if (shouldReduceMotion) stopAnimation();
    }, [shouldReduceMotion, stopAnimation]);

    const handlePointerEnter = (event: React.PointerEvent<HTMLSpanElement>) => {
      onPointerEnter?.(event);
      if (!isControlledRef.current && event.pointerType !== "touch")
        startAnimation();
    };

    const handlePointerLeave = (event: React.PointerEvent<HTMLSpanElement>) => {
      onPointerLeave?.(event);
      if (!isControlledRef.current && event.pointerType !== "touch")
        stopAnimation();
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
      onPointerDown?.(event);
      if (!isControlledRef.current && event.pointerType === "touch")
        startAnimation();
    };

    const handleFocus = (event: React.FocusEvent<HTMLSpanElement>) => {
      onFocus?.(event);
      if (!isControlledRef.current) startAnimation();
    };

    const handleBlur = (event: React.FocusEvent<HTMLSpanElement>) => {
      onBlur?.(event);
      if (!isControlledRef.current) stopAnimation();
    };

    const rootMotionProps =
      rootTag === "motion.svg"
        ? {
            animate:
              root.animate ??
              (root.inherit ? undefined : controls[root.group ?? "default"]),
            initial: root.initial,
            variants: root.variants,
            transition: root.transition,
            custom: root.custom,
          }
        : undefined;

    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          className,
        )}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        <RootTag
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox={root.viewBox ?? ROOT_DEFAULTS.viewBox}
          fill={root.fill ?? ROOT_DEFAULTS.fill}
          stroke={root.stroke ?? ROOT_DEFAULTS.stroke}
          strokeWidth={root.strokeWidth ?? ROOT_DEFAULTS.strokeWidth}
          strokeLinecap={root.strokeLinecap ?? ROOT_DEFAULTS.strokeLinecap}
          strokeLinejoin={root.strokeLinejoin ?? ROOT_DEFAULTS.strokeLinejoin}
          overflow={root.overflow}
          className={root.className}
          style={root.style}
          {...rootMotionProps}
        >
          {spec.elements.map((node, index) => {
            if (!isPresence(node)) return renderNode(node, index, controls);
            return (
              <AnimatePresence initial={false} key={index} mode="wait">
                {isActive ? (
                  <React.Fragment key={`${spec.name}-active`}>
                    {node.active.map((child, childIndex) =>
                      renderNode(child, childIndex, controls),
                    )}
                  </React.Fragment>
                ) : (
                  <React.Fragment key={`${spec.name}-rest`}>
                    {node.rest.map((child, childIndex) =>
                      renderNode(child, childIndex, controls),
                    )}
                  </React.Fragment>
                )}
              </AnimatePresence>
            );
          })}
        </RootTag>
      </span>
    );
  }

  AnimatedIconComponent.displayName = spec.name;
  return AnimatedIconComponent;
}
