import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Run axe-core (4.12.1, WCAG 2.1 AA) against a rendered element and fail the
 * test on any violation. Browser-mode compatible (vitest-axe 0.1.0's
 * `createRequire` path breaks under @vitest/browser — we call axe-core directly).
 *
 * @param el - the element (or `document.body` for portaled overlays) to audit.
 * @param disableRules - axe rule ids to skip. Use ONLY for checks that can't be
 *   evaluated in THIS test environment (e.g. `color-contrast` — these fast unit
 *   tests run without compiled Tailwind, so semantic color tokens like
 *   `text-popover-foreground` don't resolve and axe would report FALSE contrast
 *   failures). Document why at the call site. Real rendered contrast is proven by
 *   the active compiled-CSS gate `test/contrast.browser.test.tsx` (which compiles
 *   the token theme and runs axe `color-contrast` for real, in both themes).
 */
export async function expectNoA11yViolations(
  el: Element,
  disableRules: string[] = [],
): Promise<void> {
  const results = await axe.run(el, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: Object.fromEntries(disableRules.map((id) => [id, { enabled: false }])),
  });
  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `  • [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join('\n');
    expect.fail(`${results.violations.length} a11y violation(s):\n${summary}`);
  }
  expect(results.violations.length).toBe(0);
}
