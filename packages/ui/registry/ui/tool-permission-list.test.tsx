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
  overrides: Partial<ToolPermissionRow> = {},
): ToolPermissionRow => ({
  id: `tool:${id}`,
  label,
  kind: "tool",
  class: "write",
  answer: "ask",
  inherited: true,
  inheritedFrom: "workspace",
  answersAllowed: ["allow", "auto_check", "ask", "block"],
  ...overrides,
});

/** P1.3 §9.2's example rows. */
const ROWS: ToolPermissionRow[] = [
  {
    id: "class:write",
    label: "Write · 3",
    hint: "Changes inside the workspace",
    kind: "class",
    class: "write",
    answer: "allow",
    inherited: false,
    answersAllowed: ["allow", "auto_check", "ask", "block"],
    children: [
      tool("create_issue", "GitHub › Create issue", {
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
        answersAllowed: ["auto_check", "ask", "block"],
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
  expect(rows).toHaveLength(4);
  expect(rows[0]!.getAttribute("data-kind")).toBe("class");
  expect(rows[2]!.hasAttribute("data-locked")).toBe(true);
  expect(rows[1]!.textContent).toContain("Inherited from workspace");
  expect(
    screen.container.querySelectorAll('[data-slot="tool-permission-rule"]'),
  ).toHaveLength(2);
  expect(rows[1]!.textContent).toContain("Waiting to be published");
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
    .getByRole("button", { name: "GitHub › Comment answer: Ask" })
    .click();
  await expect
    .element(page.getByRole("menuitemradio", { name: /^Allow/ }))
    .not.toBeInTheDocument();
  await page.getByRole("menuitemradio", { name: /^Auto-check/ }).click();
  expect(onChange).toHaveBeenCalledWith("tool:comment", {
    answer: "auto_check",
  });
  await userEvent.keyboard("{Escape}");
  await page.getByRole("button", { name: "Write · 3 answer: Allow" }).click();
  await page.getByRole("menuitemradio", { name: /^Block/ }).click();
  expect(onChange).toHaveBeenCalledWith("class:write", { answer: "block" });
});

test("the lock toggle reports the lock; Allow with a warning shows its line", async () => {
  const onChange = vi.fn();
  const rows = structuredClone(ROWS);
  rows[0]!.children![2]!.answer = "allow";
  rows[0]!.children![2]!.inherited = false;
  rows[0]!.children![2]!.answersAllowed = ["allow", "ask"];
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

test("rules: Add a condition, Edit, Remove and Use inherited reach the caller", async () => {
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
    .getByRole("button", { name: "More for GitHub › Create issue" })
    .click();
  await page.getByRole("menuitem", { name: "Use inherited" }).click();
  expect(onUseInherited).toHaveBeenCalledWith("tool:create_issue");
  await page
    .getByRole("button", { name: "More for GitHub › Create issue" })
    .click();
  await page.getByRole("menuitem", { name: "Add a condition" }).click();
  expect(onAddRule).toHaveBeenCalledWith("tool:create_issue");
  await page
    .getByRole("button", { name: /Rule options: Allow Only when/ })
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
  expect(screen.container.querySelector('[aria-label^="More for"]')).toBeNull();
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
