import axe from "axe-core";
import { expect } from "vitest";

/**
 * Run axe-core (4.12.1, WCAG 2.2 AA while retaining every WCAG 2.0/2.1 tag)
 * against a rendered element and fail the test on any violation.
 *
 * Base UI's WebKit-only focus guards are excluded by their private marker. In
 * WebKit, Base UI intentionally gives these visually hidden sentinels
 * `role="button"` so VoiceOver's virtual cursor can activate the focus trap;
 * axe then reports `aria-command-name` even though the sentinel is framework
 * machinery rather than an application command. The selector is deliberately
 * narrow: every consumer-owned command remains in the scan.
 * Browser-mode compatible (vitest-axe 0.1.0's
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
 *
 * `target-size` is likewise disabled ONLY in this unstyled structural helper. Its
 * WCAG 2.2 result depends on compiled dimensions and pseudo-element hit areas that
 * are intentionally absent here; enabling it produced false failures on raw test
 * triggers. The compiled docs contract uses real `elementFromPoint` boundary probes
 * across every component route instead (`apps/docs/vrt/contracts.spec.ts`).
 */
export async function expectNoA11yViolations(
  el: Element,
  disableRules: string[] = [],
): Promise<void> {
  const results = await axe.run(
    {
      include: [el],
      exclude: ["[data-base-ui-focus-guard]"],
    },
    {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      rules: {
        "target-size": { enabled: false },
        ...Object.fromEntries(
          disableRules.map((id) => [id, { enabled: false }]),
        ),
      },
    },
  );
  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => {
        const nodes = v.nodes
          .slice(0, 4)
          .map(
            (node) =>
              `\n      target: ${node.target.join(" > ")}\n      html: ${node.html}\n      reason: ${node.failureSummary ?? "No failure summary provided."}`,
          )
          .join("");
        const omitted =
          v.nodes.length > 4
            ? `\n      … ${v.nodes.length - 4} more node(s)`
            : "";
        return `  • [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))${nodes}${omitted}`;
      })
      .join("\n");
    expect.fail(`${results.violations.length} a11y violation(s):\n${summary}`);
  }
  expect(results.violations.length).toBe(0);
}
