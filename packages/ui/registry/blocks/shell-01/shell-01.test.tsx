/**
 * `shell-01.test.tsx` — the block's browser contract: one h1, the landmarks and skip link, the
 * current module and view marked, counts inside the names, no `href="#"`, a task opening in the
 * panel, and axe-clean.
 */

import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
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
  expect(document.querySelector('nav[aria-label="Tasks"]')).not.toBeNull();
  expect(document.querySelector("main#shell-main")).not.toBeNull();
  expect(document.querySelector('a[href="#shell-main"]')).not.toBeNull();
  expect(document.querySelector('a[href="#"]')).toBeNull();
  const current = [...document.querySelectorAll('[aria-current="page"]')];
  expect(
    current.map((a) => a.getAttribute("aria-label") ?? a.textContent),
  ).toEqual(expect.arrayContaining(["Tasks, 17", "My tasks12"]));
  await expectNoA11yViolations(screen.container);
});

test("a task opens in the panel, and its close button closes it", async () => {
  const screen = await render(<Frame />);
  const shell = () =>
    document.querySelector<HTMLElement>('[data-slot="shell"]')!;
  expect(shell().dataset.panel).toBe("closed");
  (
    screen
      .getByRole("button", { name: /Send the Q3 pricing review/ })
      .element() as HTMLElement
  ).click();
  await expect.poll(() => shell().dataset.panel).toBe("open");
  (
    screen
      .getByRole("button", { name: "Close the panel" })
      .element() as HTMLElement
  ).click();
  await expect.poll(() => shell().dataset.panel).toBe("closed");
});
