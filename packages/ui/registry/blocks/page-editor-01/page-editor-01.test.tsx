import { render } from "vitest-browser-react";
import { beforeAll, expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { preloadTextEdit } from "../../ui/text-edit";
import PageEditor01Page from "./page";

beforeAll(() => preloadTextEdit());

test("page-editor-01 shows the page, its outline and its comment highlights", async () => {
  const screen = await render(<PageEditor01Page />);
  await expect
    .element(screen.getByRole("textbox", { name: "Page" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("navigation", { name: "On this page" }))
    .toBeInTheDocument();
  await expect
    .poll(
      () => document.querySelector('[data-annotation="t1"]')?.textContent ?? "",
    )
    .toBe("25 A breaker");
  await expect
    .element(screen.getByRole("button", { name: "Version history" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
