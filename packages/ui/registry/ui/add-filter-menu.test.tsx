import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
// Real layout: the toolbar and its tools measure and size themselves from the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AddFilterMenu } from "./add-filter-menu";

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

test("with AI: a field name never offers AI; a phrase or an unmatched word does, first", async () => {
  const screen = await render(
    <AddFilterMenu fields={FIELDS} ai={{ onSubmit: () => ({ added: 1 }) }} />,
  );
  await screen.getByRole("button", { name: "Filter" }).click();
  const input = screen.getByRole("combobox", { name: "Filter" });
  // The one input reads "Filter by…" with AI on too.
  await expect.element(input).toHaveAttribute("placeholder", "Filter by…");
  await userEvent.type(input, "prio");
  await expect
    .element(screen.getByRole("option", { name: "Priority" }))
    .toBeVisible();
  expect(document.querySelector('[data-slot="add-filter-menu-ai"]')).toBeNull();
  await userEvent.clear(input);
  await userEvent.type(input, "overdue");
  await expect
    .poll(() => document.querySelector('[data-slot="add-filter-menu-ai"]'))
    .not.toBeNull();
  await userEvent.clear(input);
  await userEvent.type(input, "status open");
  const options = document.querySelectorAll('[role="option"]');
  expect(options[0]?.getAttribute("data-slot")).toBe("add-filter-menu-ai");
  expect(options[0]?.getAttribute("aria-selected")).toBe("true");
});

test("menu rhythm: the DropdownMenu's 4px inset and 28px rows", async () => {
  await page.viewport(1024, 768);
  const screen = await render(<AddFilterMenu fields={FIELDS} />);
  await screen.getByRole("button", { name: "Filter" }).click();
  const surface = document.querySelector<HTMLElement>(
    '[data-slot="add-filter-menu-content"]',
  )!;
  expect(getComputedStyle(surface).paddingTop).toBe("4px");
  const option = document.querySelector<HTMLElement>(
    '[data-slot="add-filter-menu-field"]',
  )!;
  expect(option.offsetHeight).toBe(28);
  expect(getComputedStyle(option).paddingLeft).toBe("6px");
});

test("initialQuery reopens on the last prompt (Edit filters)", async () => {
  const screen = await render(
    <AddFilterMenu
      fields={FIELDS}
      ai={{ onSubmit: () => ({ added: 1 }) }}
      initialQuery="IP65 black"
    />,
  );
  await screen.getByRole("button", { name: "Filter" }).click();
  await expect
    .element(screen.getByRole("combobox", { name: "Filter" }))
    .toHaveValue("IP65 black");
});

test("Advanced filter drills into the page's builder inside the same, wider popover — no dialog", async () => {
  await page.viewport(1024, 768);
  const screen = await render(
    <AddFilterMenu fields={FIELDS} advanced={<div>Condition builder</div>} />,
  );
  await screen.getByRole("button", { name: "Filter" }).click();
  await screen.getByRole("button", { name: "Advanced filter" }).click();
  await expect.element(screen.getByText("Condition builder")).toBeVisible();
  expect(
    document.querySelector('[role="dialog"][data-slot="dialog-content"]'),
  ).toBeNull();
  const surface = document.querySelector<HTMLElement>(
    '[data-slot="add-filter-menu-content"]',
  )!;
  await expect.poll(() => surface.offsetWidth).toBeGreaterThan(400);
  await screen.getByRole("button", { name: "Back" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Status" }))
    .toBeVisible();
});

test("ai.onApplied fires after a run that added filters, once the popover has closed", async () => {
  const onApplied = vi.fn();
  const screen = await render(
    <AddFilterMenu
      fields={FIELDS}
      ai={{
        onSubmit: async () => ({ added: 2, unmatched: ["warehouse"] }),
        onApplied,
      }}
    />,
  );
  await screen.getByRole("button", { name: "Filter" }).click();
  await userEvent.type(
    screen.getByRole("combobox", { name: "Filter" }),
    "high priority warehouse",
  );
  await userEvent.keyboard("{Enter}");
  await expect.poll(() => onApplied.mock.calls.length).toBe(1);
  expect(onApplied).toHaveBeenCalledWith(
    { added: 2, unmatched: ["warehouse"] },
    "high priority warehouse",
  );
});
