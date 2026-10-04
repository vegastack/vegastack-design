// @vegastack text-anchor@0.23.122 sha256-IdXQunVjQwpyzwFCKPFpj3nvXOLHxNY6pabT7txCpno=

/**
 * text-anchor — where a comment sits in a text, stored so it survives edits. Pure strings: no DOM,
 * no editor, safe on a server (a save route re-anchoring comments, a test).
 *
 * An anchor is a pair of offsets into a flat text plus the quoted words and up to 80 characters
 * of context on each side. `TextEdit` builds the flat text of its document with `anchorText`
 * (`@/lib/text-anchor-doc`) and hands anchors out through `onCreateAnnotation` /
 * `onAnnotationsLayout`; `resolveAnchor` finds an anchor again after the text changed.
 *
 * ```ts
 * const anchor = anchorFromRange(text, 17, 21);        // store it with the comment
 * const range = resolveAnchor(nextText, anchor);       // { start, end } | null (orphaned)
 * ```
 */

/** A stored place in a text: offsets, the quoted words, and their context. */
export type TextAnchor = {
  /** Offset of the first quoted character. */
  start: number;
  /** Offset just past the last quoted character. */
  end: number;
  /** The quoted words — `text.slice(start, end)` when the anchor was made. */
  quote: string;
  /** Up to 80 characters before the quote. */
  prefix: string;
  /** Up to 80 characters after the quote. */
  suffix: string;
};

/** How much context an anchor keeps on each side of its quote. */
export const TEXT_ANCHOR_CONTEXT = 80;

/**
 * The anchor for `text.slice(start, end)`: the offsets, the quote and up to 80 characters of
 * context on each side. Offsets are clamped into the text.
 *
 * @example
 * anchorFromRange("Use a 25 A breaker", 6, 10);
 * // { start: 6, end: 10, quote: "25 A", prefix: "Use a ", suffix: " breaker" }
 */
export function anchorFromRange(
  text: string,
  start: number,
  end: number,
): TextAnchor {
  const from = Math.max(0, Math.min(start, text.length));
  const to = Math.max(from, Math.min(end, text.length));
  return {
    start: from,
    end: to,
    quote: text.slice(from, to),
    prefix: text.slice(Math.max(0, from - TEXT_ANCHOR_CONTEXT), from),
    suffix: text.slice(to, to + TEXT_ANCHOR_CONTEXT),
  };
}

const squash = (value: string) => value.replace(/\s+/g, " ").trim();

/** Every index `needle` starts at in `haystack` (overlapping matches included). */
function occurrences(haystack: string, needle: string, limit = Infinity) {
  const found: number[] = [];
  if (!needle) return found;
  for (
    let at = haystack.indexOf(needle);
    at !== -1 && found.length < limit;
    at = haystack.indexOf(needle, at + 1)
  )
    found.push(at);
  return found;
}

/** Characters `a` and `b` share at their ends (`fromEnd`) or at their starts. */
function shared(a: string, b: string, fromEnd: boolean) {
  let n = 0;
  const max = Math.min(a.length, b.length);
  while (
    n < max &&
    (fromEnd ? a[a.length - 1 - n] === b[b.length - 1 - n] : a[n] === b[n])
  )
    n++;
  return n;
}

/**
 * Find an anchor again in a text that may have changed since it was made. In order:
 *
 * 1. the stored offsets, when the text there still reads as the quote (whitespace-insensitive);
 * 2. the one place `prefix + quote + suffix` occurs;
 * 3. the one place the quote occurs;
 * 4. of several places the quote occurs, the one whose surroundings share the most characters
 *    with the stored context — when exactly one wins.
 *
 * Returns `null` when none holds: the quoted text is gone (the comment is orphaned).
 *
 * @example
 * const anchor = anchorFromRange("alpha beta gamma beta", 17, 21);
 * resolveAnchor("x alpha beta gamma beta", anchor); // { start: 19, end: 23 }
 * resolveAnchor("alpha gamma", anchor); // null
 */
export function resolveAnchor(
  text: string,
  anchor: TextAnchor,
): { start: number; end: number } | null {
  const { start, end, quote, prefix, suffix } = anchor;
  if (!quote) return null;
  if (
    start >= 0 &&
    end <= text.length &&
    start < end &&
    squash(text.slice(start, end)) === squash(quote)
  )
    return { start, end };

  const whole = occurrences(text, prefix + quote + suffix, 2);
  if (whole.length === 1) {
    const at = whole[0]! + prefix.length;
    return { start: at, end: at + quote.length };
  }

  const bare = occurrences(text, quote);
  if (bare.length === 0) return null;
  if (bare.length === 1)
    return { start: bare[0]!, end: bare[0]! + quote.length };

  let best = -1;
  let bestScore = 0;
  let tie = false;
  for (const at of bare) {
    const score =
      shared(text.slice(Math.max(0, at - prefix.length), at), prefix, true) +
      shared(
        text.slice(at + quote.length, at + quote.length + suffix.length),
        suffix,
        false,
      );
    if (score > bestScore) {
      best = at;
      bestScore = score;
      tie = false;
    } else if (score === bestScore && score > 0) tie = true;
  }
  if (best === -1 || tie) return null;
  return { start: best, end: best + quote.length };
}
