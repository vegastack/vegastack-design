import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  VERSION_KIND_LABELS,
  VersionList,
  type VersionItem,
} from "./version-list";

const asha = { name: "Asha Rao" };
const versions: VersionItem[] = [
  { id: "v3", author: asha, at: "2026-09-29T10:00:00Z", kind: "auto" },
  {
    id: "v2",
    author: asha,
    at: "2026-09-28T10:00:00Z",
    kind: "named",
    name: "Before review",
  },
  { id: "v1", author: asha, at: "2026-09-27T10:00:00Z", kind: "restore" },
];

test('"Named only" toggles onNamedOnlyChange', async () => {
  const onNamedOnlyChange = vi.fn();
  const screen = await render(
    <VersionList
      versions={versions}
      namedOnly={false}
      onNamedOnlyChange={onNamedOnlyChange}
    />,
  );
  // The unstyled harness gives the switch no size, so click it through the DOM.
  (
    screen.getByRole("switch", { name: "Named only" }).element() as HTMLElement
  ).click();
  expect(onNamedOnlyChange).toHaveBeenCalledWith(true);
});

test("badges: Current, each kind's label, a row's own label; a name replaces the kind's badge but never Approved", async () => {
  const at = "2026-09-29T10:00:00Z";
  const rows: VersionItem[] = [
    { id: "a", author: asha, at, kind: "auto" },
    { id: "s", author: asha, at, kind: "safety" },
    { id: "r", author: asha, at, kind: "restore" },
    {
      id: "rn",
      author: asha,
      at,
      kind: "restore",
      name: "Before restoring 26 Sep",
    },
    { id: "i", author: asha, at, kind: "import", name: "Before live editing" },
    { id: "g", author: asha, at, kind: "agent_checkpoint" },
    {
      id: "gl",
      author: asha,
      at,
      kind: "agent_checkpoint",
      label: "Before Claude's edits",
    },
    { id: "n", author: asha, at, kind: "named", name: "Before review" },
    { id: "p", author: asha, at, kind: "approved", name: "Signed off" },
  ];
  const screen = await render(
    <VersionList versions={rows} currentId="a" selectedId="a" />,
  );
  await expect.element(screen.getByText("Before review")).toBeVisible();
  const badges = (id: string) =>
    [
      ...screen.container.querySelectorAll(
        `[role="option"]:nth-child(${rows.findIndex((row) => row.id === id) + 1}) [data-slot="badge"]`,
      ),
    ].map((badge) => badge.textContent);
  expect(badges("a")).toEqual(["Current"]);
  expect(badges("s")).toEqual([VERSION_KIND_LABELS.safety]);
  expect(badges("r")).toEqual(["Before a restore"]);
  expect(badges("rn")).toEqual([]);
  expect(badges("i")).toEqual([]);
  expect(badges("g")).toEqual(["Before an agent's edits"]);
  expect(badges("gl")).toEqual(["Before Claude's edits"]);
  expect(badges("n")).toEqual([]);
  expect(badges("p")).toEqual(["Approved"]);
  expect(
    screen.container.querySelector('[data-kind="approved"]')?.textContent,
  ).toContain("Signed off");
  await expectNoA11yViolations(screen.container);
});

test("an author's badge follows their name", async () => {
  const screen = await render(
    <VersionList
      versions={[
        {
          id: "v1",
          author: { ...asha, badge: "Inactive" },
          at: "2026-09-29T10:00:00Z",
          kind: "auto",
        },
      ]}
    />,
  );
  const badge = screen.container.querySelector("[data-slot=person-badge]");
  expect(badge?.textContent).toBe("Inactive");
  expect(badge?.previousElementSibling?.textContent).toBe("Asha Rao");
});

test("an agent's row: the purple bot, its name with via and the Agent label, a free title and a summary", async () => {
  const screen = await render(
    <VersionList
      now={Date.parse("2026-09-29T12:00:00Z")}
      versions={[
        {
          id: "g",
          // As a host maps it: a person-style `badge: "Agent"` is not drawn twice.
          author: {
            name: "Claude",
            kind: "agent",
            via: "Manoj",
            badge: "Agent",
          },
          at: "2026-09-29T10:00:00Z",
          kind: "agent_checkpoint",
          name: "Before Claude (via Manoj)'s edits",
          summary: "Claude edited 3 blocks",
        },
        {
          id: "u",
          author: asha,
          at: "2026-09-29T11:00:00Z",
          kind: "restore",
          name: "Before undoing Claude (via Manoj)'s changes",
        },
      ]}
    />,
  );
  const [agentRow, personRow] = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=version-list-item]",
  );
  expect(
    agentRow!.querySelector("[data-slot=avatar][data-kind=agent]"),
  ).not.toBeNull();
  expect(agentRow!.textContent).toContain("Before Claude (via Manoj)'s edits");
  expect(
    agentRow!.querySelector("[data-slot=person-name-via]")?.textContent,
  ).toBe(" via Manoj");
  expect(
    agentRow!.querySelector("[data-slot=person-agent-label]")?.textContent,
  ).toBe("Agent");
  expect(agentRow!.querySelector("[data-slot=person-badge]")).toBeNull();
  expect(agentRow!.textContent).toContain("Claude edited 3 blocks");
  // A named row shows no kind badge: the title says it.
  expect(agentRow!.querySelector("[data-slot=badge]")).toBeNull();
  // A person's row is unchanged: no agent label.
  expect(personRow!.querySelector("[data-slot=person-agent-label]")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("arrow keys move the selection through the list", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <VersionList versions={versions} selectedId="v3" onSelect={onSelect} />,
  );
  await userEvent.click(screen.getByRole("option").nth(0));
  await userEvent.keyboard("{ArrowDown}");
  expect(onSelect).toHaveBeenLastCalledWith("v2");
  await userEvent.keyboard("{End}");
  expect(onSelect).toHaveBeenLastCalledWith("v1");
});

test("paging on scroll, the empty state and the skeleton", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <VersionList
      versions={versions}
      loadMore={{ hasMore: true, onLoadMore }}
    />,
  );
  await expect.poll(() => onLoadMore.mock.calls.length).toBe(1);
  expect(
    screen.container.querySelector('[data-slot="load-more"] button'),
  ).toBeNull();
  const empty = await render(<VersionList versions={[]} />);
  await expect.element(empty.getByText("No versions yet")).toBeVisible();
  const loading = await render(<VersionList versions={[]} loading />);
  expect(
    loading.container.querySelector('[data-slot="version-list-skeleton"]'),
  ).not.toBeNull();
});

test("a version the system kept names no one: no avatar, no placeholder person", async () => {
  const screen = await render(
    <VersionList
      versions={[
        {
          id: "s",
          author: null,
          at: "2026-09-29T10:00:00Z",
          kind: "import",
          name: "Before live editing",
        },
        { id: "u", author: null, at: "2026-09-28T10:00:00Z", kind: "auto" },
        { id: "p", author: asha, at: "2026-09-27T10:00:00Z", kind: "auto" },
      ]}
    />,
  );
  await expect.element(screen.getByText("Before live editing")).toBeVisible();
  const [named, plain] = screen.container.querySelectorAll('[role="option"]');
  expect(
    named!.querySelector('[data-slot="person-avatar"], [data-slot="avatar"]'),
  ).toBeNull();
  // The named row still says when; the unnamed one is its time alone.
  expect(named!.querySelectorAll("time").length).toBe(1);
  // Alone on its line, the time starts it: capitalized.
  expect(named!.querySelectorAll("time")[0]!.textContent).toMatch(/^[A-Z0-9]/u);
  expect(plain!.querySelectorAll("time").length).toBe(1);
  await expectNoA11yViolations(screen.container);
});

test("headingHidden keeps the list's heading for assistive technology only", async () => {
  const screen = await render(<VersionList versions={[]} headingHidden />);
  const heading = screen.getByRole("heading", { name: "Version history" });
  await expect.element(heading).toBeInTheDocument();
  expect(heading.element().className).toContain("sr-only");
});

test('groupBy="day" puts the rows under a heading per day; an unnamed row shows its time; arrows walk across days', async () => {
  const now = Date.parse("2026-09-29T12:00:00Z");
  const claude = {
    name: "Claude",
    kind: "agent" as const,
    via: "Asha Rao",
  };
  const rows: VersionItem[] = [
    { id: "d1", author: asha, at: "2026-09-29T10:00:00Z", kind: "auto" },
    {
      id: "d2",
      author: claude,
      at: "2026-09-29T09:00:00Z",
      kind: "agent_checkpoint",
    },
    {
      id: "d3",
      author: asha,
      at: "2026-09-28T10:00:00Z",
      kind: "named",
      name: "Before review",
    },
  ];
  const onSelect = vi.fn();
  const screen = await render(
    <VersionList
      versions={rows}
      groupBy="day"
      now={now}
      selectedId="d1"
      onSelect={onSelect}
    />,
  );
  const groups = screen.container.querySelectorAll(
    "[data-slot=version-list-group]",
  );
  expect(groups).toHaveLength(2);
  await expect
    .element(screen.getByRole("group", { name: "Today" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("group", { name: "Yesterday" }))
    .toBeInTheDocument();
  expect(groups[0]!.querySelectorAll("[role=option]")).toHaveLength(2);
  // The day is the heading: an unnamed row reads its time of day only.
  const first = screen.container.querySelector<HTMLElement>(
    "[data-slot=version-list-item]",
  )!;
  expect(first.querySelector("[data-slot=date-time]")).not.toBeNull();
  expect(first.textContent).not.toMatch(/today/i);
  // An agent's version carries the agent avatar.
  const agentRow = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=version-list-item]",
  )[1]!;
  expect(agentRow.textContent).toContain("Claude");
  expect(agentRow.querySelector("[data-kind=agent]")).not.toBeNull();
  // One listbox: the arrows cross the day boundary.
  first.focus();
  await userEvent.keyboard("{ArrowDown}{ArrowDown}");
  expect(onSelect).toHaveBeenLastCalledWith("d3");
  await expectNoA11yViolations(screen.container);
});

test("without groupBy the rows stay one flat list, as before", async () => {
  const screen = await render(<VersionList versions={versions} />);
  expect(
    screen.container.querySelector("[data-slot=version-list-group]"),
  ).toBeNull();
  expect(
    screen.container.querySelectorAll(
      "[data-slot=version-list-items] > [role=option]",
    ),
  ).toHaveLength(3);
});
