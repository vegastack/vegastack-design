import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { VersionList, type VersionItem } from "./version-list";

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

test('"Named only" toggles onNamedOnlyChange and a conflict item shows "Unsaved copy"', async () => {
  const onNamedOnlyChange = vi.fn();
  const screen = await render(
    <VersionList
      versions={[
        {
          id: "v1",
          author: asha,
          at: "2026-09-29T10:00:00Z",
          kind: "conflict",
        },
      ]}
      namedOnly={false}
      onNamedOnlyChange={onNamedOnlyChange}
    />,
  );
  await expect.element(screen.getByText("Unsaved copy")).toBeVisible();
  // The unstyled harness gives the switch no size, so click it through the DOM.
  (
    screen.getByRole("switch", { name: "Named only" }).element() as HTMLElement
  ).click();
  expect(onNamedOnlyChange).toHaveBeenCalledWith(true);
});

test("badges: Current, Restored; a named version leads with its name", async () => {
  const screen = await render(
    <VersionList versions={versions} currentId="v3" selectedId="v3" />,
  );
  await expect.element(screen.getByText("Before review")).toBeVisible();
  const rows = [
    ...screen.container.querySelectorAll<HTMLElement>('[role="option"]'),
  ];
  expect(rows[0]!.textContent).toContain("Current");
  expect(rows[1]!.textContent).toContain("Before review");
  expect(rows[2]!.textContent).toContain("Restored");
  expect(rows[0]).toHaveAttribute("aria-selected", "true");
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

test("Load more, the empty state and the skeleton", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <VersionList
      versions={versions}
      loadMore={{ hasMore: true, onLoadMore }}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Load more" }));
  expect(onLoadMore).toHaveBeenCalled();
  const empty = await render(<VersionList versions={[]} />);
  await expect.element(empty.getByText("No versions yet")).toBeVisible();
  const loading = await render(<VersionList versions={[]} loading />);
  expect(
    loading.container.querySelector('[data-slot="version-list-skeleton"]'),
  ).not.toBeNull();
});
