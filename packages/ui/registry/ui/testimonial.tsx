// @vegastack testimonial@0.7.0 sha256-baAUrSdbMH9sQf79KbTrWrCBfx9Y2KADbo/FnJbc+Xc=

import * as React from "react";
import { cn } from "@vegastack/design";

/** Props accepted by `Testimonial`. */
export interface TestimonialProps extends Omit<
  React.ComponentPropsWithRef<"figure">,
  "role"
> {
  /**
   * The quote text, WITHOUT its own quotation marks — it renders inside a `<q>`,
   * so the browser inserts the pair the ACTIVE LANGUAGE uses (`„…“`, `« … »`,
   * `「…」`) rather than English curly quotes everywhere. Set `lang` on this
   * element or an ancestor to pick the pair. Rendered serif italic (`font-serif italic`, the
   * Newsreader display-emphasis accent) at `text-display-sm` — the sanctioned
   * pull-quote use of the serif accent (audit 17-brand-direction §Typography
   * roles: display emphasis + pull-quotes ONLY, never running body text).
   */
  quote: React.ReactNode;
  /** Attributed name. */
  name: React.ReactNode;
  /** Optional role/affiliation (e.g. `"CTO, Acme"`). @default undefined */
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
export function Testimonial({
  quote,
  name,
  role,
  className,
  ref,
  ...props
}: TestimonialProps) {
  return (
    <figure
      ref={ref}
      data-slot="testimonial"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {/* The quotation marks come from CSS `quotes`, not from characters in the markup.
          `<q>` makes the browser insert the pair for the ACTIVE language — „…“ in German,
          « … » in French, 「…」 in Japanese — where a hard-coded “…” shipped English
          punctuation to every locale. `quotes: auto` is the explicit opt-in to that
          language-driven behaviour. */}
      <blockquote
        data-slot="testimonial-quote"
        className="text-balance font-serif text-display-sm text-foreground italic"
      >
        <q className="[quotes:auto]">{quote}</q>
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
