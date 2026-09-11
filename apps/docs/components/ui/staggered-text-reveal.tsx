// @vegastack staggered-text-reveal@0.8.1 sha256-iSPVnOinvPXHXqsF/7ZyqkINi1NXddEGLcpr1iLYcPE=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server — the standard isomorphic
 * shim, picked ONCE at module scope (it is constant per environment, so this is not a
 * conditional hook). Calling `useLayoutEffect` during a server render warns; calling it on
 * the client is the whole point, because the visibility gate below has to hide off-screen
 * words BEFORE the browser paints, and a plain `useEffect` runs after.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/** Props accepted by `StaggeredTextReveal`. */
export interface StaggeredTextRevealProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** Text to reveal, split on whitespace into individually-staggered words. */
  text: string;
  /**
   * Per-word delay step, expressed as a MULTIPLE of the `--duration-fast`
   * motion token (never a raw ms value) — word `i` starts its
   * `motion-enter-up` animation at `i * stepMultiplier * --duration-fast`.
   * @default 1
   */
  stepMultiplier?: number;
  /**
   * Hold the words at the animation's FROM state until the element first
   * scrolls into view, then play the reveal once.
   *
   * On by default, because the alternative is worse in the common case: a
   * reveal below the fold that starts on mount has already finished by the time
   * anyone scrolls to it, so the reader sees static text and the animation was
   * pure cost. Pass `false` for text that is definitely above the fold (a hero)
   * and should play immediately, or when the component renders inside a
   * scroll container an `IntersectionObserver` cannot observe usefully.
   *
   * The gate is one-shot: once revealed, scrolling away and back does not
   * replay it.
   *
   * @default true
   */
  whenVisible?: boolean;
}

/**
 * `StaggeredTextReveal` — display text whose words rise in, staggered one
 * `motion-enter-up` step apart. Each word is an `inline-block` span carrying the
 * shared `motion-enter-up` utility with a per-word `animation-delay` derived
 * from `--duration-fast` via `calc()`, and `animation-fill-mode: backwards`
 * so a not-yet-started word sits at the animation's FROM state (invisible,
 * offset) instead of flashing visible-then-hidden-then-in.
 *
 * The ANIMATION is CSS — there is no JS animation driver, and the timeline is
 * purely `word index × stepMultiplier × --duration-fast`, so no randomness and
 * no measured layout: the same `text` always produces the same timeline
 * (VRT-stable once animations settle). The only JavaScript is the
 * {@link StaggeredTextRevealProps.whenVisible} gate, a single one-shot
 * `IntersectionObserver` that decides WHEN the CSS starts — the same gate
 * `particle-field.tsx` already uses.
 *
 * `'use client'` is the cost of that gate. It is the lowest interactive leaf:
 * the component renders a `<span>` and nothing below it needs the directive.
 * Pass `whenVisible={false}` and it still runs the gate hook — the directive is
 * on the file, not the prop — so a truly server-only reveal is a different
 * component, not a prop.
 *
 * The gate only ever REMOVES the reveal: the server-rendered markup animates, and the
 * client pulls off-screen words back to the FROM state before the first paint. A page
 * whose JavaScript never runs therefore still shows its text.
 *
 * Reduced motion: entirely the global `prefers-reduced-motion: reduce` reset in
 * `packages/design-tokens/src/base.css`, which zeros animation DURATION *and*
 * DELAY — so every word lands on its end state at once. The component states
 * nothing about reduced motion itself; that rule lives in one place (audit Di1).
 *
 * Compose it inside a heading — it renders a `<span>`, not a heading element,
 * so it never changes the semantic structure of its container.
 *
 * @example
 * <h1><StaggeredTextReveal text="Ship agentic UI, fast." /></h1>
 *
 * @example
 * // Above the fold: play immediately rather than waiting for an intersection.
 * <h1><StaggeredTextReveal text="Ship agentic UI, fast." whenVisible={false} /></h1>
 */
export function StaggeredTextReveal({
  text,
  stepMultiplier = 1,
  whenVisible = true,
  className,
  ref,
  ...props
}: StaggeredTextRevealProps) {
  const words = text.split(/\s+/).filter(Boolean);

  // Track the node as STATE (not a plain ref) so the gate effect re-runs when the element
  // actually exists — a deps-gated ref effect would miss a late mount.
  const [node, setNode] = React.useState<HTMLSpanElement | null>(null);
  const mergedRef = React.useMemo(() => mergeRefs(setNode, ref), [ref]);

  // `revealed` starts TRUE, including in the server-rendered markup, and the gate below
  // takes it away. That direction matters: the reveal is a pure-CSS mount animation, so a
  // page whose JS never runs (or fails) still shows the text. Starting `false` — the
  // obvious spelling — would leave `opacity-0` on real content forever in that case.
  const [revealed, setRevealed] = React.useState(true);

  useIsomorphicLayoutEffect(() => {
    if (!whenVisible || !node) return;
    // No IntersectionObserver (an old engine, a non-browser harness): leave the words
    // revealed. The gate fails OPEN, always — invisible content is never the safe default.
    if (typeof IntersectionObserver === "undefined") return;

    // Synchronous first check, BEFORE paint: an IntersectionObserver callback is async, so
    // waiting for it would paint one frame of already-visible text and then hide it. Text
    // that is on screen at mount keeps the animation it has already started; only text that
    // is genuinely off screen gets pulled back to the FROM state.
    const rect = node.getBoundingClientRect();
    const onScreen =
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top <
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth);
    if (onScreen) return;

    setRevealed(false);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setRevealed(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [whenVisible, node]);

  return (
    <span
      ref={mergedRef}
      data-slot="staggered-text-reveal"
      data-revealed={revealed ? "" : undefined}
      className={cn("inline", className)}
      {...props}
    >
      {words.map((word, index) => (
        <React.Fragment key={index}>
          <span
            data-slot="staggered-text-reveal-word"
            className={cn(
              "inline-block",
              // Before the gate opens the word carries no animation at all, so
              // `animation-fill-mode: backwards` cannot hold it at the FROM state — hence the
              // explicit `opacity-0`, which IS the FROM state, applied with the same
              // whole-element opacity token vocabulary the rest of the system uses.
              revealed
                ? "motion-enter-up [animation-delay:calc(var(--stagger-i)*var(--stagger-step))] [animation-fill-mode:backwards]"
                : "opacity-0",
            )}
            style={
              {
                "--stagger-i": index,
                "--stagger-step": `calc(var(--duration-fast) * ${stepMultiplier})`,
              } as React.CSSProperties
            }
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  );
}
