import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { CodeBlock } from "./code-block";

const SQL = "SELECT country, COUNT(*) FROM companies GROUP BY country;";

test("renders the header with the mono language label and a copy button", async () => {
  const screen = await render(
    <CodeBlock language="sql" copyValue={SQL}>
      {SQL}
    </CodeBlock>,
  );
  await expect.element(screen.getByText("sql")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Copy sql" }))
    .toBeInTheDocument();
  const fig = document.querySelector('[data-slot="code-block"]') as HTMLElement;
  expect(fig.dataset.language).toBe("sql");
  expect(fig.querySelector("pre code")!.textContent).toContain(
    "SELECT country",
  );
});

test("renders headerless when neither language nor copyValue is given", async () => {
  await render(<CodeBlock>{SQL}</CodeBlock>);
  expect(document.querySelector('[data-slot="code-block-header"]')).toBeNull();
});

test("has no accessibility violations", async () => {
  const screen = await render(
    <CodeBlock language="ts" copyValue="const a = 1;">
      const a = 1;
    </CodeBlock>,
  );
  await expectNoA11yViolations(screen.container);
});
