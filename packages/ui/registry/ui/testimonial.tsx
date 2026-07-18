// @vegastack testimonial@0.1.0 sha256-Pl5TFvBe/k05z3mfGdjaWQwXXc7bjUoEQhXwvK/x76c=

// @vegastack testimonial@0.1.0 — new component; run `pnpm run registry:build` to stamp
// integrity + regenerate the copy-in/JSON.

'use client';

import * as React from 'react';
import { cn } from '@vegastack/design';

export interface TestimonialProps extends Omit<React.ComponentPropsWithRef<'figure'>, 'role'> {
  /**
   * The quote text, WITHOUT its own quotation marks — the component wraps it
   * in curly quotes. Rendered serif italic (`font-serif italic`, the
   * Newsreader display-emphasis accent) at `text-display-sm` — the sanctioned
   * pull-quote use of the serif accent (audit 17-brand-direction §Typography
   * roles: display emphasis + pull-quotes ONLY, never running body text).
   */
  quote: React.ReactNode;
  /** Attributed name. */
  name: React.ReactNode;
  /** Optional role/affiliation (e.g. `"CTO, Acme"`). */
  role?: React.ReactNode;
}

/**
 * `Testimonial` — a pull-quote: a serif-italic quote over a mono uppercase
 * attribution line (name · role). Purely presentational.
 *
 * @example
 * <Testimonial
 *   quote="VegaStack cut our design-to-ship time in half."
 *   name="A. Rivera"
 *   role="CTO, Example Co."
 * />
 */
export function Testimonial({ quote, name, role, className, ref, ...props }: TestimonialProps) {
  return (
    <figure ref={ref} data-slot="testimonial" className={cn('flex flex-col gap-4', className)} {...props}>
      <blockquote
        data-slot="testimonial-quote"
        className="text-balance font-serif text-display-sm text-foreground italic"
      >
        “{quote}”
      </blockquote>
      <figcaption
        data-slot="testimonial-attribution"
        className="flex items-center gap-2 font-mono text-mono-label text-muted-foreground uppercase"
      >
        <span data-slot="testimonial-name" className="text-foreground">
          {name}
        </span>
        {role ? (
          <>
            <span aria-hidden="true">·</span>
            <span data-slot="testimonial-role">{role}</span>
          </>
        ) : null}
      </figcaption>
    </figure>
  );
}
