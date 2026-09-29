import { render } from "vitest-browser-react";
import { beforeAll, expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { preloadTextEdit } from "../../ui/text-edit";
import PageEditor01Page from "./page";

beforeAll(() => preloadTextEdit());

test("page-editor-01 shows the page, its outline and its comment highlights", async () => {
  const screen = await render(<PageEditor01Page />);
  await expect
    .element(screen.getByRole("textbox", { name: "Page" }))
    .toBeInTheDocument();
  const outline = screen.getByRole("navigation", { name: "On this page" });
  await expect.element(outline).toHaveAttribute("data-variant", "rail");
  await expect
    .element(outline.getByRole("link", { name: "Wiring" }))
    .toHaveAttribute("href", "#wiring");
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

test("page-editor-01's Outline button opens the outline in a sheet and jumps to the heading", async () => {
  const screen = await render(<PageEditor01Page />);
  await expect
    .element(screen.getByRole("navigation", { name: "On this page" }))
    .toBeInTheDocument();
  await screen.getByRole("button", { name: "Outline" }).click();
  const sheet = screen.getByRole("dialog", { name: "On this page" });
  await expect.element(sheet).toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  const heading = document.getElementById("sign-off")!;
  const scrollIntoView = vi
    .spyOn(heading, "scrollIntoView")
    .mockImplementation(() => {});
  (
    sheet.getByRole("link", { name: "Sign-off" }).element() as HTMLElement
  ).click();
  await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
  await vi.waitFor(() =>
    expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull(),
  );
});
