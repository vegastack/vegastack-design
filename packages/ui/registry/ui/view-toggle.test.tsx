import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ViewToggle } from "./view-toggle";

test("offers the given views and reports the one picked", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <ViewToggle
      value="list"
      onValueChange={onValueChange}
      views={["list", "grid", "board"]}
    />,
  );
  await expect
    .element(screen.getByRole("group", { name: "View" }))
    .toBeVisible();
  await screen.getByRole("button", { name: "Board" }).click();
  expect(onValueChange).toHaveBeenCalledWith("board");
  await expectNoA11yViolations(screen.container);
});
