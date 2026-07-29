# Test conventions

Vitest browser mode (real Chromium), `vitest-browser-react`, `axe-core` via `vitest-axe`.

## Contents

- [Rendering and querying](#rendering-and-querying)
- [The CSS-less harness](#the-css-less-harness)
- [Style-mirror technique](#style-mirror-technique)
- [elementFromPoint boundary probes](#elementfrompoint-boundary-probes)
- [Compiled-CSS exception files](#compiled-css-exception-files)
- [Accessibility assertions](#accessibility-assertions)
- [Running tests](#running-tests)
- [Cross-browser smoke lane](#cross-browser-smoke-lane)

## Rendering and querying

`render` is ASYNC — always `await` it:

```tsx
const screen = await render(<Foo />);
await expect.element(screen.getByRole("button")).toBeInTheDocument();
```

Query via `screen.getByRole(...)`; assert via `await expect.element(locator)` with
`.toBeInTheDocument()` / `.toHaveAttribute(...)` / `.toHaveClass(...)`.

`userEvent` comes from `vitest/browser`, **not** `@testing-library/user-event`.

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
pnpm gates:component <name> # common planner: changed item plus reachable dependent tests/routes
pnpm gates:push               # current pre-push oracle after the component is ready
```

## Cross-browser smoke lane

```bash
pnpm --filter @vegastack/ui test:smoke        # Chromium + WebKit + Firefox, selected subset
pnpm --filter @vegastack/ui test:all-browsers # complete suite in all three engines (local /ship or diagnostics)
```

`test:smoke` is a deliberate SUBSET run against real Chromium, WebKit, and Firefox via
`vitest.smoke.config.ts`.
Add a file to its `include` list ONLY if it exercises a motion mechanism (replay APIs, keyed
presence, `AnimatedNumber`) or another evidenced cross-engine risk. Not every new component needs
this — the current local push/ship ladders provide the broader Chromium coverage when required. CI
does not execute a browser.
