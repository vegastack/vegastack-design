// @vegastack staggered-text-reveal@0.2.0 sha256-XrxNVT9Copb6/RYAedrVzrcNcq1rlzxB2n9/md+drWY=

// @vegastack staggered-text-reveal@0.1.0 — new component; run `pnpm run registry:build` to
// stamp integrity + regenerate the copy-in/JSON.

'use client';

import * as React from 'react';
import { cn } from '@vegastack/design';

export interface StaggeredTextRevealProps
  extends Omit<React.ComponentPropsWithRef<'span'>, 'children'> {
  /** Text to reveal, split on whitespace into individually-staggered words. */
  text: string;
  /**
   * Per-word delay step, expressed as a MULTIPLE of the `--duration-fast`
   * motion token (never a raw ms value) — word `i` starts its
   * `motion-enter-up` animation at `i * stepMultiplier * --duration-fast`.
   * @default 1
   */
  stepMultiplier?: number;
}

/**
 * `StaggeredTextReveal` — display text whose words rise in on mount, staggered
 * one `motion-enter-up` step apart. CSS-only (no JS animation driver, no
 * `IntersectionObserver`): each word is an `inline-block` span carrying the
 * shared `motion-enter-up` utility with a per-word `animation-delay` derived
 * from `--duration-fast` via `calc()`, and `animation-fill-mode: backwards`
 * so a not-yet-started word sits at the animation's FROM state (invisible,
 * offset) instead of flashing visible-then-hidden-then-in.
 *
 * Deterministic: the delay is purely `word index × stepMultiplier ×
 * --duration-fast` — no randomness, no measured layout — so the same `text`
 * always produces the same timeline (VRT-stable once animations settle).
 *
 * Reduced motion: the global `prefers-reduced-motion: reduce` reset in
 * `packages/design-tokens/src/base.css` collapses `motion-enter-up`'s duration to
 * ~0, and this component ALSO zeros the delay itself
 * (`motion-reduce:[animation-delay:0s]`) — without that, words would still
 * visibly stagger in over real time (just with an instant pop each), which
 * is not the "static end state" reduced motion requires.
 *
 * Compose it inside a heading — it renders a `<span>`, not a heading element,
 * so it never changes the semantic structure of its container.
 *
 * @example
 * <h1><StaggeredTextReveal text="Ship agentic UI, fast." /></h1>
 */
export function StaggeredTextReveal({
  text,
  stepMultiplier = 1,
  className,
  ref,
  ...props
}: StaggeredTextRevealProps) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <span ref={ref} data-slot="staggered-text-reveal" className={cn('inline', className)} {...props}>
      {words.map((word, index) => (
        <React.Fragment key={index}>
          <span
            data-slot="staggered-text-reveal-word"
            className={cn(
              'motion-enter-up inline-block',
              '[animation-delay:calc(var(--stagger-i)*var(--stagger-step))]',
              '[animation-fill-mode:backwards]',
              'motion-reduce:[animation-delay:0s]',
            )}
            style={
              {
                '--stagger-i': index,
                '--stagger-step': `calc(var(--duration-fast) * ${stepMultiplier})`,
              } as React.CSSProperties
            }
          >
            {word}
          </span>
          {index < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </span>
  );
}
