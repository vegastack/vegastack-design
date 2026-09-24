/**
 * `status-pages-01.test.tsx` — the block's browser contract: each of the three pages has exactly one
 * `h1` and a way out, the error page's icon wears the `-text` destructive ink, the reference
 * footnote appears only with a digest, and every page is axe-clean in both modes. Compiled
 * contrast is proven in `test/contrast.browser.test.tsx` (D6).
 */

import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { ErrorPage } from "./components/error-page";
import { ForbiddenPage } from "./components/forbidden-page";
import { NotFoundPage } from "./components/not-found-page";
import StatusPages01Page from "./page";

const PAGES = {
  "404": {
    node: (standalone: boolean) => <NotFoundPage standalone={standalone} />,
    title: "Page not found",
  },
  "403": {
    node: (standalone: boolean) => <ForbiddenPage standalone={standalone} />,
    title: "You don’t have access to this page",
  },
  error: {
    node: (standalone: boolean) => (
      <ErrorPage standalone={standalone} digest="3f9a1c07" onRetry={() => {}} />
    ),
    title: "This page didn’t load",
  },
} as const;

for (const [name, page] of Object.entries(PAGES)) {
  for (const standalone of [false, true]) {
    const mode = standalone ? "standalone" : "in-shell";
    test(`${name} (${mode}) has one h1, a way home, and is axe-clean`, async () => {
      const screen = await render(page.node(standalone));
      await expect
        .element(screen.getByRole("heading", { level: 1, name: page.title }))
        .toBeInTheDocument();
      expect(document.querySelectorAll("h1")).toHaveLength(1);
      await expect
        .element(screen.getByRole("link", { name: "Go to Home" }))
        .toHaveAttribute("href", "/");
      const root = document.querySelector('[data-slot="empty"]')!;
      expect(root.className).toContain(
        standalone ? "min-h-svh" : "min-h-[60svh]",
      );
      await expectNoA11yViolations(document.body, ["color-contrast"]);
    });
  }
}

test("the page renders the standalone 404", async () => {
  const screen = await render(<StatusPages01Page />);
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Page not found" }))
    .toBeInTheDocument();
});

test("the error page omits the reference without a digest", async () => {
  const screen = await render(<ErrorPage onRetry={() => {}} />);
  await expect
    .element(
      screen.getByRole("heading", { level: 1, name: "This page didn’t load" }),
    )
    .toBeInTheDocument();
  expect(screen.container.textContent).not.toContain("Reference:");
  expect(
    document
      .querySelector('[data-slot="empty-icon"] svg')!
      .getAttribute("class"),
  ).toContain("text-destructive-text");
});

test("the error page retries and offers its reference to copy", async () => {
  const onRetry = vi.fn();
  const screen = await render(
    <ErrorPage digest="3f9a1c07" onRetry={onRetry} />,
  );
  await screen.getByRole("button", { name: "Try again" }).click();
  expect(onRetry).toHaveBeenCalledOnce();
  await expect.element(screen.getByText("3f9a1c07")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Copy reference" }))
    .toBeInTheDocument();
});
