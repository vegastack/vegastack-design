// Shared colour predicates for the browser lanes.
//
// WHY THIS EXISTS
//   Chromium serialises the same computed colour several ways, and which one you get depends on the
//   colour space the value was authored or interpolated in — `rgba(0, 0, 0, 0)` for a plain sRGB
//   `transparent`, but `oklab(0 0 0 / 0)` once the value has been through an OKLCH/OKLab pipeline,
//   which this token system's colours routinely have. `media-chrome.browser.test.tsx` already
//   records that hazard for READING a colour out of a gradient; the same hazard applies to the much
//   commoner assertion "is this transparent?", and fourteen sites across six files answered it by
//   comparing against one literal string.
//
//   Two failure modes, and the second is the dangerous one:
//
//     expect(bg).toBe("rgba(0, 0, 0, 0)")        // breaks when Chromium says oklab — loud, annoying
//     expect(bg).not.toBe("rgba(0, 0, 0, 0)")    // PASSES on a transparent oklab element — silent
//
//   The second is fail-open: a control that lost its fill entirely still satisfies "not
//   rgba(0, 0, 0, 0)" as long as Chromium spells the nothing differently. So this is a correctness
//   fix, not a serialisation-compatibility shim.
//
//   Chromium upgrades inside the pinned Playwright image are enough to flip which spelling comes
//   back — `badge-tints` passed on one CI run and failed on the next against identical source
//   (`docs/ledger/bugs.md`, 2026-09-22). Asserting on the MEANING rather than the spelling is the
//   only form that is stable across that.

/**
 * The alpha channel of a computed colour, or `1` when it declares none.
 *
 * Handles both CSS colour syntaxes, because Chromium emits both:
 *   - legacy comma form — `rgba(0, 0, 0, 0)`, `rgb(0, 0, 0)`
 *   - modern slash form — `oklab(0 0 0 / 0)`, `oklch(0 0 0 / 0)`, `color(srgb 0 0 0 / 0)`
 */
/**
 * `0.5` from `0.5`, `50%` from `50%`.
 *
 * THROWS rather than guessing, because there is no safe default. Returning 1 would make an
 * unparseable value read as painted, which silently satisfies every `isTransparent(x) === false`
 * assertion; returning 0 would make it read as empty, which silently satisfies the other half.
 * Both are the fail-open shape this whole helper exists to remove, so an alpha we cannot read
 * becomes a loud failure instead. Only reachable if the caller's regex matched an alpha slot it
 * then could not parse — i.e. never, unless one of them is edited wrongly.
 */
function alphaFrom(raw: string | undefined, source: string): number {
  const parsed =
    raw === undefined
      ? Number.NaN
      : raw.endsWith("%")
        ? Number.parseFloat(raw) / 100
        : Number(raw);
  if (!Number.isFinite(parsed))
    throw new Error(
      `alphaOf: could not read an alpha out of ${JSON.stringify(source)}`,
    );
  return parsed;
}

export function alphaOf(computed: string): number {
  const value = computed.trim();
  if (value === "transparent") return 0;

  // Modern syntax puts alpha after a slash, inside the function's parentheses.
  const slash = /\/\s*([0-9.]+%?)\s*\)/.exec(value);
  if (slash) return alphaFrom(slash[1], value);

  // Legacy syntax: the fourth comma-separated argument, when there is one.
  const legacy = /^rgba?\(([^)]*)\)$/.exec(value);
  if (legacy) {
    const parts = (legacy[1] ?? "").split(",").map((part) => part.trim());
    if (parts.length < 4) return 1;
    return alphaFrom(parts[3], value);
  }

  // A keyword, a hex, or a form with no alpha component at all — opaque.
  return 1;
}

/**
 * Is a computed colour fully transparent, whatever Chromium chose to call it?
 *
 * Use this instead of comparing against `"rgba(0, 0, 0, 0)"`. An empty string counts as
 * transparent: `getComputedStyle` returns `""` for a property that is not set on a detached or
 * not-yet-laid-out element, and every caller here means "nothing is painted".
 */
export function isTransparent(computed: string | null | undefined): boolean {
  if (!computed) return true;
  return alphaOf(computed) === 0;
}
