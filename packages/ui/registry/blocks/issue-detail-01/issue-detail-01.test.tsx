import { render } from "vitest-browser-react";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import IssueDetail01Page from "./page";

test("issue-detail-01 shows the title, description, comments and properties", async () => {
  const screen = await render(<IssueDetail01Page />);
  await expect
    .element(screen.getByRole("heading", { level: 1 }))
    .toHaveTextContent("Send the revised quote to Northwind");
  await expect
    .element(screen.getByRole("heading", { level: 2, name: /Comments/ }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Send comment" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
