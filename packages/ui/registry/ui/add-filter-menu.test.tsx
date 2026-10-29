import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
// Real layout: the toolbar and its tools measure and size themselves from the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AddFilterMenu, AiFilterInput } from "./add-filter-menu";

const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

const FIELDS = [
  { key: "status", label: "Status" },
  {
    key: "priority",
    label: "Priority",
    editor: <div>High · Medium · Low</div>,
  },
  { key: "assignee", label: "Assignee", keywords: ["owner"] },
];

test("without AI: one input narrows the fields; Enter picks; no ✦ anywhere", async () => {
  const onPick = vi.fn();
  const screen = await render(
    <AddFilterMenu fields={FIELDS} onPick={onPick} />,
  );
  await screen.getByRole("button", { name: "Filter" }).click();
  const input = screen.getByRole("combobox", { name: "Filter" });
  await expect.element(input).toHaveAttribute("placeholder", "Filter by…");
  expect(
    document
      .querySelector('[data-slot="ai-filter-input"]')
      ?.hasAttribute("data-ai"),
  ).toBe(false);
  await userEvent.type(input, "own");
  await expect
    .element(screen.getByRole("option", { name: "Assignee" }))
    .toBeVisible();
  await userEvent.keyboard("{Enter}");
  expect(onPick).toHaveBeenCalledWith("assignee");
});

test("a field with an editor drills in within the same popover, and back", async () => {
  const screen = await render(<AddFilterMenu fields={FIELDS} />);
  await screen.getByRole("button", { name: "Filter" }).click();
  await screen.getByRole("option", { name: "Priority" }).click();
  await expect.element(screen.getByText("High · Medium · Low")).toBeVisible();
  await screen.getByRole("button", { name: "Back" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Status" }))
    .toBeVisible();
});

test("with AI: the first item sends the text; success closes, a failure keeps the fields", async () => {
  const onSubmit = vi
    .fn()
    .mockResolvedValueOnce({ added: 2, unmatched: [] })
    .mockRejectedValueOnce(new Error("cap"));
  const screen = await render(
    <AddFilterMenu fields={FIELDS} ai={{ onSubmit }} />,
  );
  await screen.getByRole("button", { name: "Filter" }).click();
  const input = screen.getByRole("combobox", { name: "Filter" });
  await userEvent.type(input, "high priority due friday");
  await expect
    .element(
      screen.getByRole("option", {
        name: "Filter with AI: “high priority due friday”",
      }),
    )
    .toBeVisible();
  await expectNoA11yViolations(
    document.querySelector('[data-slot="add-filter-menu-content"]')!,
  );
  await userEvent.keyboard("{Enter}");
  expect(onSubmit).toHaveBeenCalledWith("high priority due friday");
  await expect
    .poll(() => document.querySelector('[data-slot="add-filter-menu-content"]'))
    .toBeNull();
  await screen.getByRole("button", { name: "Filter" }).click();
  await userEvent.type(
    screen.getByRole("combobox", { name: "Filter" }),
    "warehouse",
  );
  await userEvent.keyboard("{Enter}");
  await expect
    .element(
      screen.getByText(
        "AI filters aren't available right now; pick a field instead.",
      ),
    )
    .toBeVisible();
});

test("AiFilterInput: ✦ lead, Enter submits the trimmed text, a spinner while pending", async () => {
  const onSubmit = vi.fn();
  function Harness() {
    const [value, setValue] = React.useState("");
    return (
      <AiFilterInput
        aria-label="Describe"
        value={value}
        onValueChange={setValue}
        onSubmit={onSubmit}
        pending
      />
    );
  }
  const screen = await render(<Harness />);
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Describe" }),
    " IP65 black {Enter}",
  );
  expect(onSubmit).toHaveBeenCalledWith("IP65 black");
  expect(
    document.querySelector(
      '[data-slot="ai-filter-input"] [data-slot="spinner"], [data-slot="ai-filter-input"] svg.animate-spin',
    ),
  ).not.toBeNull();
});
