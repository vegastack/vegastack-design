import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { DigestGroup } from "./digest-group";
import { Item, ItemContent, ItemTitle } from "./item";

const rows = (n: number) =>
  Array.from({ length: n }, (_, index) => (
    <Item key={index} size="sm">
      <ItemContent>
        <ItemTitle>Task {index + 1}</ItemTitle>
      </ItemContent>
    </Item>
  ));

test("a group names its rows by its title, shows its count and the group action", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <DigestGroup
      title="Overdue"
      count={87}
      urgent
      headerExtra={<span>Blocked by Bay 3</span>}
      groupAction={{ label: "Update all…", onClick }}
      footer={{ hasMore: true, remaining: 75, onLoadMore: vi.fn() }}
    >
      {rows(3)}
    </DigestGroup>,
  );
  await expect
    .element(page.getByRole("region", { name: /Overdue/ }))
    .toBeVisible();
  const list = page.getByRole("list", { name: /Overdue/ });
  await expect.element(list).toBeVisible();
  expect(screen.container.querySelectorAll('[role="listitem"]')).toHaveLength(
    3,
  );
  expect(
    screen.container.querySelector('[data-slot="digest-group-count"]')!
      .textContent,
  ).toBe("87");
  await page.getByRole("button", { name: "Update all…" }).click();
  expect(onClick).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("the footer is controlled: Show N more, loading, and none without more", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <>
      <DigestGroup
        title="Due this week"
        count={20}
        footer={{ hasMore: true, remaining: 5, onLoadMore }}
      >
        {rows(2)}
      </DigestGroup>
      <DigestGroup
        title="Waiting"
        count={9}
        footer={{ hasMore: true, loading: true, onLoadMore: vi.fn() }}
      >
        {rows(1)}
      </DigestGroup>
      <DigestGroup
        title="Done"
        count={1}
        footer={{ hasMore: false, onLoadMore: vi.fn() }}
      >
        {rows(1)}
      </DigestGroup>
    </>,
  );
  await page.getByRole("button", { name: "Show 5 more" }).click();
  expect(onLoadMore).toHaveBeenCalled();
  const footers = screen.container.querySelectorAll(
    '[data-slot="digest-group-footer"]',
  );
  expect(footers).toHaveLength(2);
  expect(footers[1]!.querySelector("button")!.getAttribute("aria-busy")).toBe(
    "true",
  );
  await expectNoA11yViolations(screen.container);
});
