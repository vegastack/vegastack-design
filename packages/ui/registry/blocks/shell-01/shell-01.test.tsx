/**
 * `shell-01.test.tsx` — the block's browser contract: one h1, the landmarks and skip link, the
 * current module and view marked, counts inside the names, no `href="#"`, a task opening in a
 * peek, and axe-clean.
 */

import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { expectNoA11yViolations } from "../../../test/a11y";
import Shell01Page from "./page";

function Frame() {
  return (
    <div style={{ width: 1440, height: 800 }}>
      <Shell01Page fill="parent" />
    </div>
  );
}

test("shell-01 has landmarks, a skip link and one h1", async () => {
  const screen = await render(<Frame />);
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "My tasks" }))
    .toBeInTheDocument();
  expect(document.querySelectorAll("h1")).toHaveLength(1);
  expect(document.querySelector('nav[aria-label="Modules"]')).not.toBeNull();
  expect(document.querySelector('nav[aria-label="Home"]')).not.toBeNull();
  expect(document.querySelector("main#shell-main")).not.toBeNull();
  expect(document.querySelector('a[href="#shell-main"]')).not.toBeNull();
  expect(document.querySelector('a[href="#"]')).toBeNull();
  const current = [...document.querySelectorAll('[aria-current="page"]')];
  expect(
    current.map((a) => a.getAttribute("aria-label") ?? a.textContent),
  ).toEqual(expect.arrayContaining(["Home", "My tasks12"]));
  await expectNoA11yViolations(screen.container);
});

test("a task opens in a peek, ↓ moves to the next one, and ✕ closes it", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Frame />);
  const peek = () => document.querySelector<HTMLElement>('[data-slot="peek"]');
  expect(peek()).toBeNull();
  // The block's test page has no stylesheet, so its parts overlap: click the elements directly.
  (
    screen
      .getByRole("button", { name: /Send the Q3 pricing review/ })
      .element() as HTMLElement
  ).click();
  await expect.poll(() => peek()).not.toBeNull();
  const first = document.querySelector('[data-slot="peek-title"]')!.textContent;
  (
    screen.getByRole("button", { name: "Next" }).element() as HTMLElement
  ).click();
  await expect
    .poll(() => document.querySelector('[data-slot="peek-title"]')!.textContent)
    .not.toBe(first);
  expect(
    document.querySelector('[data-slot="peek-title"]')!.textContent,
  ).not.toBe(first);
  (
    screen.getByRole("button", { name: "Close" }).element() as HTMLElement
  ).click();
  await expect.poll(() => peek()).toBeNull();
});
