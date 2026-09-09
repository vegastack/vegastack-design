# Test conventions

Vitest browser mode (real Chromium), `vitest-browser-react`, `axe-core` via `vitest-axe`.

## Contents

- [Rendering and querying](#rendering-and-querying)
- [Locators and text match EXACTLY](#locators-and-text-match-exactly)
- [The CSS-less harness](#the-css-less-harness)
- [Style-mirror technique](#style-mirror-technique)
- [elementFromPoint boundary probes](#elementfrompoint-boundary-probes)
- [Compiled-CSS exception files](#compiled-css-exception-files)
- [Accessibility assertions](#accessibility-assertions)
- [Running tests](#running-tests)
- [Cross-browser](#cross-browser)

## Rendering and querying

`render` is ASYNC — always `await` it:

```tsx
const screen = await render(<Foo />);
await expect.element(screen.getByRole("button")).toBeInTheDocument();
```

Query via `screen.getByRole(...)`; assert via `await expect.element(locator)` with
`.toBeInTheDocument()` / `.toHaveAttribute(...)` / `.toHaveClass(...)`.

`userEvent` comes from `vitest/browser`, **not** `@testing-library/user-event`.

## Locators and text match EXACTLY

Vitest 5 matches locator text and accessible names **whole-string** by default
(`browser.locators.exact`, previously a substring match), and `toHaveTextContent` is whole-string
equality that no longer accepts a RegExp. This is not a detail — it changes what a passing query
proves, and it caught real sloppiness on the way in (`getByRole('tab', { name: 'A' })` was silently
resolving a tab whose accessible name is `Activity3`).

So write the WHOLE name, including the parts a component appends for assistive technology:

```tsx
// a trailing count badge is part of the trigger's accessible name
screen.getByRole("tab", { name: "Activity3" });
// an sr-only external-link affordance is part of the link's
screen.getByRole("link", { name: "link (opens in new tab)" });
// an sr-only state prefix is part of the row's text
screen.getByText("Met: At least 8 characters");
```

That is a feature: the query now asserts the accessible name a screen-reader user hears, so a
component that changes its sr-only text fails the test instead of sliding past a substring.

Reach for a partial match only when the omitted part is genuinely not the component's contract —
a host-dependent time of day, say. Then say so locally, never globally:

| want                                | use                                            |
| ----------------------------------- | ---------------------------------------------- |
| partial / RegExp text on an element | `toMatchTextContent(...)` (the old `toHave…`)  |
| partial locator text                | `getByText("…", { exact: false })` or a RegExp |

**Never** set `browser.locators.exact: false` in `vitest.config.ts` to make a query pass — that
turns the strictness off for the whole suite to hide one loose assertion.

When the name changes with the state under test — `AutoSaveInput`'s polite status text lives inside
its `<label>`, so the field is `Display name` at rest and `Display name Saving` mid-save — query by
role instead of restating a moving target.

## The CSS-less harness

This harness compiles NO Tailwind CSS for most files (only `test/contrast.css` is compiled, for the
real-color contrast gate). Layout classes like `size-4` therefore collapse to zero size.

Consequence: prefer a native `.click()`/`dispatchEvent` on `element()` over a Playwright-style
pointer click that depends on real visible geometry.

## Style-mirror technique

For anything that needs a REAL computed-style or hit-area assertion, inject a literal `<style>` tag
that is a 1:1 hand-transcription of what the exact Tailwind utility values you shipped compile to.
Key it off `data-slot`/`data-size`, which are real regardless of compiled CSS. Then assert against
`getComputedStyle` for real.

Canonical example: `injectCheckboxHitAreaMirror` in `packages/ui/registry/ui/checkbox.test.tsx`.
Also used by `radio-group`, `slider`, `sidebar`, `filter-bar`, `data-list`, `password-input`, and
`auto-save-input` tests.

## elementFromPoint boundary probes

Combine the style mirror with `document.elementFromPoint(x, y)` to verify an expanded hit-area for
real: sample a point just inside vs. just outside the claimed boundary (computed from
`getBoundingClientRect()`) and assert which element resolves.

This is what caught the real Chromium-only bug where a native `<button>`'s `appearance: button`
Preflight clips an overflowing `::before` — `getComputedStyle` alone reported the right box, but the
real hit-test did not match it. `getComputedStyle` can lie; a boundary probe cannot.

## Compiled-CSS exception files

Color-contrast and cross-overlay z-stacking assertions live in the small set of `*.browser.test.tsx`
files that DO import compiled CSS: `test/contrast.browser.test.tsx`, `test/stacking.browser.test.tsx`.

Do not duplicate that setup per-component. If you introduce a new overlay/portal interaction, add a
case to those files rather than creating a new one.

## Accessibility assertions

`expectNoA11yViolations(el, disableRules?)` from `../../test/a11y` runs real `axe-core` (WCAG 2.1 AA
rule tags).

Write one assertion per meaningfully-different UI STATE the component implements — default, open,
loading, disabled, checked/selected, error/invalid, collapsed — not a single smoke test at rest.

Pass `disableRules` only for checks that literally cannot evaluate in the CSS-less harness (e.g.
`color-contrast`, since semantic tokens do not resolve to real colors here) and document why at the
call site. The compiled-CSS contrast gate covers real contrast separately.

## Running tests

```bash
cd packages/ui && pnpm exec vitest run registry/ui/<name>.test.tsx   # scoped, while iterating
pnpm test                                                            # full suite, before the gate
```

## Cross-browser

```bash
pnpm --filter @vegastack/ui test:all-browsers # complete suite in all three engines
```

There is **no smoke subset any more**. The risk-selected WebKit/Firefox lane
(`vitest.smoke.config.ts`, `test:smoke`, and the `coverage.crossBrowserSmoke` selection that
generated its file list) was removed on 2026-09-08 with the attestation stack: it existed to keep a
local pre-commit-time hook cheap, and no hook runs a browser now. `pnpm verify` runs the complete
suite in Chromium on every push and pull request; `pnpm verify:release` runs the complete suite in all three engines before a
deploy. Nothing to opt a new component into — the release run already covers everything the subset
sampled.
