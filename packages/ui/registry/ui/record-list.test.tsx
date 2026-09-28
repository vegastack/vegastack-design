import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { Package } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  RecordDiff,
  RecordList,
  RecordListGroup,
  RecordListItem,
  RecordListMore,
} from "./record-list";

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

/* ------------------------------------------------------ conflict companions */

test("RecordListGroup names its list by its heading", async () => {
  const screen = await render(
    <RecordListGroup title="Group 1 · 2 products">
      <RecordList aria-label="Group 1">
        <RecordListItem title="Alpha 86mm · 10W" href="/p/1" />
        <RecordListItem title="Alpha 86mm · 10W (copy)" href="/p/2" />
      </RecordList>
    </RecordListGroup>,
  );
  await expect
    .element(screen.getByRole("group", { name: "Group 1 · 2 products" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("RecordDiff marks the rows whose values differ", async () => {
  const screen = await render(
    <RecordDiff
      columns={["This product", "Existing product"]}
      rows={[
        { label: "Colour temperature", values: ["3000K", "3000K"] },
        { label: "Lens", values: ["Clear", "Frosted"] },
        { label: "Cable length", values: ["", "2 m"] },
        { label: "Finish", values: [<b key="a">Black</b>, "Black"] },
      ]}
    />,
  );
  const rows = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="record-diff-row"]',
    ),
  ];
  expect(rows.map((row) => row.hasAttribute("data-differs"))).toEqual([
    false,
    true,
    true,
    false,
  ]);
  expect(rows[1]!.textContent).toContain(", differs");
  expect(rows[2]!.textContent).toContain("—");
  await expectNoA11yViolations(screen.container);
});

test("RecordDiff takes an explicit differs for rich values", async () => {
  const screen = await render(
    <RecordDiff
      columns={["A", "B"]}
      rows={[
        {
          label: "Finish",
          values: [<b key="a">Black</b>, "White"],
          differs: true,
        },
      ]}
    />,
  );
  expect(
    screen.container
      .querySelector('[data-slot="record-diff-row"]')!
      .hasAttribute("data-differs"),
  ).toBe(true);
});
