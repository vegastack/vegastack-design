import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { Package } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { RecordList, RecordListItem, RecordListMore } from "./record-list";

test("renders a numbered list with icon, title, new-tab link and more footer", async () => {
  const onShowMore = vi.fn();
  const screen = await render(
    <>
      <RecordList aria-label="Affected products">
        <RecordListItem
          icon={<Package />}
          title="Orbit Track 30W"
          description="Missing beam angle"
          href="/products/p1"
        />
        <RecordListItem title="Nova Pendant" />
      </RecordList>
      <RecordListMore remaining={12} onShowMore={onShowMore} />
    </>,
  );
  const list = screen.getByRole("list", { name: "Affected products" });
  expect(list.element().tagName).toBe("OL");
  expect(screen.container.querySelectorAll("li")).toHaveLength(2);
  const link = screen
    .getByRole("link", { name: "Open Orbit Track 30W in a new tab" })
    .element();
  expect(link.getAttribute("href")).toBe("/products/p1");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener");
  expect(
    screen.container.querySelectorAll('[data-slot="record-list-link"]'),
  ).toHaveLength(1);
  await expect.element(screen.getByText("and 12 more")).toBeVisible();
  await screen.getByRole("button", { name: "Show more" }).click();
  expect(onShowMore).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("the more footer renders nothing when every record is shown", async () => {
  const screen = await render(<RecordListMore remaining={0} />);
  expect(
    screen.container.querySelector('[data-slot="record-list-more"]'),
  ).toBeNull();
});
