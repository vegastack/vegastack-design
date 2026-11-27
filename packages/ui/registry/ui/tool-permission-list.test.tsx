import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import {
  ToolPermissionList,
  ToolPermissionListSkeleton,
  type ToolPermissionRow,
} from "./tool-permission-list";

const tool = (
  id: string,
  label: string,
  overrides: Partial<
    Extract<ToolPermissionRow, { kind: "tool" | "class" }>
  > = {},
): ToolPermissionRow => ({
  id: `tool:${id}`,
  label,
  kind: "tool",
  class: "write",
  answer: "ask",
  inherited: true,
  inheritedFrom: "workspace",
  answersAllowed: ["allow", "ask", "block"],
  ...overrides,
});

/** The example rows: All tools, then a class with its tools. */
const ROWS: ToolPermissionRow[] = [
  {
    id: "all",
    label: "All tools",
    kind: "all",
    answer: "ask",
    inherited: true,
    inheritedFrom: "Standard level",
    answersAllowed: ["allow", "ask", "block"],
  },
  {
    id: "class:write",
    label: "Write · 3",
    hint: "Changes inside the workspace",
    kind: "class",
    class: "write",
    answer: "allow",
    inherited: false,
    answersAllowed: ["allow", "ask", "block"],
    children: [
      tool("create_issue", "GitHub › Create issue", {
        defaultFrom: "workspace",
        rules: [
          {
            key: "r1",
            answer: "allow",
            condition: "Only when: in vegastack/web",
            editable: true,
          },
          {
            key: "r2",
            answer: "ask",
            condition: null,
            pending: true,
            editable: true,
          },
        ],
      }),
      tool("merge_pr", "GitHub › Merge pull request", {
        locked: { by: "your admin" },
        answer: "block",
      }),
      tool("comment", "GitHub › Comment", {
        lockable: true,
        answersAllowed: ["ask", "block"],
        warningOnAllow: "This lets Donna comment without asking. It's logged.",
      }),
    ],
  },
];

test("renders the example rows: a class with its tools, a locked row, an admin row and narrowed answers", async () => {
  const screen = await render(
    <ToolPermissionList
      title="GitHub"
      meta="Connected · company GitHub App"
      rows={ROWS}
      onChange={vi.fn()}
      onAddRule={vi.fn()}
      onEditRule={vi.fn()}
      onRemoveRule={vi.fn()}
      onUseInherited={vi.fn()}
    />,
  );
  await expect
    .element(page.getByRole("region", { name: "GitHub" }))
    .toBeVisible();
  const rows = screen.container.querySelectorAll(
    '[data-slot="tool-permission-row"]',
  );
  expect(rows).toHaveLength(5);
  expect(rows[0]!.getAttribute("data-kind")).toBe("all");
  expect(rows[0]!.textContent).toContain("From Standard level");
  expect(rows[1]!.getAttribute("data-kind")).toBe("class");
  expect(rows[3]!.hasAttribute("data-locked")).toBe(true);
  expect(rows[2]!.textContent).toContain("From workspace");
  expect(screen.container.textContent).not.toContain("Inherited from");
  expect(
    screen.container.querySelectorAll('[data-slot="tool-permission-rule"]'),
  ).toHaveLength(2);
  expect(rows[2]!.textContent).toContain("Waiting to be published");
  // The rule lines use the answer labels.
  expect(
    screen.container.querySelector('[data-slot="tool-permission-rule"]')!
      .textContent,
  ).toContain("Always allow");
  // An unconditional rule reads its answer label alone, with no condition word.
  const unconditional = screen.container.querySelectorAll(
    '[data-slot="tool-permission-rule"]',
  )[1]!;
  expect(unconditional.textContent).toContain("Needs approval");
  expect(unconditional.textContent).not.toContain("Always");
  await expect
    .element(
      page.getByRole("button", {
        name: "Lock GitHub › Comment for every agent",
      }),
    )
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("a row's menu offers only its answersAllowed, with the exact copy; a class answer goes to its class id", async () => {
  const onChange = vi.fn();
  await render(
    <ToolPermissionList title="GitHub" rows={ROWS} onChange={onChange} />,
  );
  await page
    .getByRole("button", { name: "All tools answer: Needs approval" })
    .click();
  for (const [label, description] of [
    ["Always allow", "Runs without asking."],
    ["Needs approval", "Asks a person each time."],
    ["Blocked", "Never runs. The agent isn't offered it."],
  ] as const) {
    await expect
      .element(page.getByRole("menuitemradio", { name: label }))
      .toHaveAccessibleDescription(description);
  }
  await page.getByRole("menuitemradio", { name: "Always allow" }).click();
  expect(onChange).toHaveBeenCalledWith("all", { answer: "allow" });
  await userEvent.keyboard("{Escape}");
  await page
    .getByRole("button", { name: "GitHub › Comment answer: Needs approval" })
    .click();
  await expect
    .element(page.getByRole("menuitemradio", { name: "Always allow" }))
    .not.toBeInTheDocument();
  await page.getByRole("menuitemradio", { name: "Blocked" }).click();
  expect(onChange).toHaveBeenCalledWith("tool:comment", { answer: "block" });
  await userEvent.keyboard("{Escape}");
  await page
    .getByRole("button", { name: "Write · 3 answer: Always allow" })
    .click();
  await page.getByRole("menuitemradio", { name: "Blocked" }).click();
  expect(onChange).toHaveBeenCalledWith("class:write", { answer: "block" });
});

test("All tools leads, above the classes, with no fold toggle, its label aligned with every class label", async () => {
  const screen = await render(
    <ToolPermissionList
      title="GitHub"
      rows={[
        {
          id: "class:read",
          label: "Read · 0",
          kind: "class",
          class: "read",
          answer: "allow",
          inherited: true,
          answersAllowed: ["allow", "ask", "block"],
        },
        ...ROWS.slice(1),
        ROWS[0]!,
      ]}
      onChange={vi.fn()}
    />,
  );
  const rows = screen.container.querySelectorAll(
    '[data-slot="tool-permission-row"]',
  );
  expect(rows[0]!.getAttribute("data-kind")).toBe("all");
  // One fold toggle: the class's. The All tools row has none.
  expect(
    screen.container.querySelectorAll(
      'button[aria-label^="Hide "], button[aria-label^="Show "]',
    ),
  ).toHaveLength(1);
  const label = (index: number) =>
    rows[index]!.querySelector(
      '[data-slot="tool-permission-label"]',
    )!.getBoundingClientRect().left;
  // All tools, an empty class (no ›) and a folding class: one label column.
  expect(rows[1]!.getAttribute("data-kind")).toBe("class");
  expect(Math.abs(label(0) - label(1))).toBeLessThan(1);
  expect(Math.abs(label(0) - label(2))).toBeLessThan(1);
});

test("the lock toggle reports the lock; Allow with a warning shows its line", async () => {
  const onChange = vi.fn();
  const rows = structuredClone(ROWS);
  rows[1]!.children![2]!.answer = "allow";
  rows[1]!.children![2]!.inherited = false;
  rows[1]!.children![2]!.answersAllowed = ["allow", "ask"];
  const screen = await render(
    <ToolPermissionList title="GitHub" rows={rows} onChange={onChange} />,
  );
  await page
    .getByRole("button", { name: "Lock GitHub › Comment for every agent" })
    .click();
  expect(onChange).toHaveBeenCalledWith("tool:comment", { locked: true });
  expect(
    screen.container.querySelector('[data-slot="tool-permission-warning"]')!
      .textContent,
  ).toBe("This lets Donna comment without asking. It's logged.");
});

test("rules: Use the default ends the answer menu only while the row holds its own rule; Add a condition, Edit and Remove reach the caller", async () => {
  const onAddRule = vi.fn();
  const onEditRule = vi.fn();
  const onRemoveRule = vi.fn();
  const onUseInherited = vi.fn();
  await render(
    <ToolPermissionList
      title="GitHub"
      rows={ROWS}
      onChange={vi.fn()}
      onAddRule={onAddRule}
      onEditRule={onEditRule}
      onRemoveRule={onRemoveRule}
      onUseInherited={onUseInherited}
    />,
  );
  await page
    .getByRole("button", {
      name: "GitHub › Create issue answer: Needs approval",
    })
    .click();
  const reset = page.getByRole("menuitem", { name: /^Use the default/ });
  await expect.element(reset).toHaveAccessibleDescription("Follows workspace.");
  await reset.click();
  expect(onUseInherited).toHaveBeenCalledWith("tool:create_issue");
  // A row with no rule of its own has no "Use the default".
  await page
    .getByRole("button", { name: "GitHub › Comment answer: Needs approval" })
    .click();
  await expect
    .element(page.getByRole("menuitemradio", { name: "Blocked" }))
    .toBeVisible();
  await expect
    .element(page.getByRole("menuitem", { name: /^Use the default/ }))
    .not.toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await page
    .getByRole("button", { name: "Add a condition: GitHub › Create issue" })
    .click();
  expect(onAddRule).toHaveBeenCalledWith("tool:create_issue");
  await page
    .getByRole("button", { name: /Rule options: Always allow Only when/ })
    .click();
  await page.getByRole("menuitem", { name: "Remove" }).click();
  expect(onRemoveRule).toHaveBeenCalledWith("tool:create_issue", "r1");
});

test("read-only shows every answer as text; a class folds with aria-expanded", async () => {
  const screen = await render(
    <ToolPermissionList
      title="GitHub"
      rows={ROWS}
      onChange={vi.fn()}
      readOnly
    />,
  );
  expect(
    screen.container.querySelectorAll('[data-readonly=""]').length,
  ).toBeGreaterThan(0);
  expect(
    screen.container.querySelector('[aria-label^="Add a condition"]'),
  ).toBeNull();
  const toggle = page.getByRole("button", { name: "Hide Write · 3" });
  await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect
    .element(page.getByRole("button", { name: "Show Write · 3" }))
    .toHaveAttribute("aria-expanded", "false");
  await expectNoA11yViolations(screen.container);
});

test("over 50 tools: search appears, a class shows 50 then Show all, and a miss says so", async () => {
  const many: ToolPermissionRow[] = [
    {
      id: "class:read",
      label: "Read · 88",
      kind: "class",
      class: "read",
      answer: "allow",
      inherited: true,
      answersAllowed: ["allow", "ask", "block"],
      children: Array.from({ length: 88 }, (_, index) =>
        tool(`t${index}`, `Read thing ${index}`, { class: "read" }),
      ),
    },
  ];
  const screen = await render(
    <ToolPermissionList title="Drive" rows={many} onChange={vi.fn()} />,
  );
  await page.getByRole("button", { name: "Show Read · 88" }).click();
  expect(
    screen.container.querySelectorAll(
      '[data-slot="tool-permission-tools"] [data-slot="tool-permission-row"]',
    ),
  ).toHaveLength(50);
  await page.getByRole("button", { name: "Show all 88" }).click();
  expect(
    screen.container.querySelectorAll(
      '[data-slot="tool-permission-tools"] [data-slot="tool-permission-row"]',
    ),
  ).toHaveLength(88);
  await userEvent.type(
    page.getByRole("searchbox", { name: "Search Drive tools" }),
    "zzz",
  );
  await expect.element(page.getByText("No tools match “zzz”")).toBeVisible();
});

test("the scope switch is a segmented group named Applies to; the note sits under the header", async () => {
  const onScope = vi.fn();
  const screen = await render(
    <ToolPermissionList
      title="Supadata"
      rows={ROWS}
      onChange={vi.fn()}
      note="New tools from Supadata follow All tools."
      scope={{
        value: "agent",
        options: [
          { value: "every", label: "Every agent" },
          { value: "agent", label: "This agent" },
        ],
        onChange: onScope,
      }}
    />,
  );
  const group = page.getByRole("group", { name: "Applies to" });
  await expect.element(group).toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "This agent" }))
    .toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Every agent" }).click();
  expect(onScope).toHaveBeenCalledWith("every");
  await page.getByRole("button", { name: "This agent" }).click();
  expect(onScope).toHaveBeenCalledTimes(1);
  expect(
    screen.container.querySelector('[data-slot="tool-permission-note"]')!
      .textContent,
  ).toBe("New tools from Supadata follow All tools.");
  await expectNoA11yViolations(screen.container);
});

test("empty and loading", async () => {
  const screen = await render(
    <>
      <ToolPermissionList title="Slack" rows={[]} onChange={vi.fn()} />
      <ToolPermissionListSkeleton rows={3} />
    </>,
  );
  expect(
    screen.container.querySelector('[data-slot="tool-permission-empty"]')!
      .textContent,
  ).toBe("No tools");
  expect(
    screen.container
      .querySelector('[data-slot="tool-permission-list-skeleton"]')!
      .getAttribute("aria-hidden"),
  ).toBe("true");
});

test("a locked row's rules can't be edited or removed", async () => {
  const screen = await render(
    <ToolPermissionList
      title="GitHub"
      rows={[
        tool("send", "GitHub › Send", {
          locked: { by: "your admin" },
          defaultFrom: "workspace",
          rules: [
            { key: "r1", answer: "block", condition: null, editable: true },
          ],
        }),
      ]}
      onChange={vi.fn()}
      onEditRule={vi.fn()}
      onRemoveRule={vi.fn()}
      onUseInherited={vi.fn()}
    />,
  );
  const rule = screen.container.querySelector(
    '[data-slot="tool-permission-rule"]',
  )!;
  expect(rule.querySelector("button")).toBeNull();
  expect(document.querySelector("[data-permission-menu-reset]")).toBeNull();
});
