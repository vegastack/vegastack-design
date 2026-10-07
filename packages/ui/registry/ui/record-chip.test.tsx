import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { Building2 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { RecordChip, RecordChipMenu } from "./record-chip";
import { Popover, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";

test("the picker is a button and a linked value adds the open link", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <RecordChip
      icon={<Building2 />}
      value="Acme"
      href="/customers/acme"
      linkLabel="Open Acme"
      aria-label="Customer: Acme"
      onClick={onClick}
    />,
  );
  await screen.getByRole("button", { name: "Customer: Acme" }).click();
  expect(onClick).toHaveBeenCalledOnce();
  await expect
    .element(screen.getByRole("link", { name: "Open Acme" }))
    .toHaveAttribute("href", "/customers/acme");
  await expectNoA11yViolations(screen.container);
});

test("an empty chip shows the placeholder and no link", async () => {
  const screen = await render(
    <RecordChip placeholder="Add customer" href="/customers" />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Add customer" }))
    .toBeVisible();
  expect(screen.container.querySelector("a")).toBeNull();
});

test("RecordChipMenu: a calendar inside it is transparent, so it never paints over the rounded border", async () => {
  const screen = await render(
    <Popover defaultOpen>
      <PopoverTrigger
        render={<RecordChip placeholder="Due date" aria-label="Set due date" />}
      />
      <RecordChipMenu width="fit">
        <Calendar mode="single" />
      </RecordChipMenu>
    </Popover>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Set due date" }))
    .toBeInTheDocument();
  await expect
    .poll(() => document.querySelector('[data-slot="calendar"]'))
    .not.toBeNull();
  const menu = document.querySelector<HTMLElement>(
    '[data-slot="record-chip-menu"]',
  )!;
  expect(menu.className).toContain("**:data-[slot=calendar]:bg-transparent");
});
