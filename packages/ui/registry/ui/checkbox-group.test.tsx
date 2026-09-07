import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Checkbox } from "./checkbox";
import { CheckboxGroup } from "./checkbox-group";
import { FieldSet, FieldLegend } from "./field";

const ALL = ["read", "write", "admin"];

function click(element: Element) {
  // Tailwind layout utilities are not compiled in the vitest browser run, so the
  // size-4 box collapses to zero and Playwright's visibility hit-test fails. The
  // element's own click handler still toggles the checkbox.
  (element as HTMLElement).click();
}

function Permissions({
  onValueChange,
  disabled = false,
}: {
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState<string[]>([]);
  return (
    <FieldSet>
      <FieldLegend>Permissions</FieldLegend>
      <CheckboxGroup
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange?.(next);
        }}
        allValues={ALL}
        disabled={disabled}
      >
        <Checkbox parent aria-label="All permissions" />
        <Checkbox value="read" aria-label="Read" />
        <Checkbox value="write" aria-label="Write" />
        <Checkbox value="admin" aria-label="Admin" />
      </CheckboxGroup>
    </FieldSet>
  );
}

test("renders a group with its children and the data-slot hook", async () => {
  const screen = await render(<Permissions />);
  const group = screen.container.querySelector(
    '[data-slot="checkbox-group"]',
  ) as HTMLElement;
  expect(group).not.toBeNull();
  expect(group.querySelectorAll('[role="checkbox"]')).toHaveLength(4);
});

test("the parent ticks and unticks the whole set", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Permissions onValueChange={onValueChange} />);
  const parent = screen.getByRole("checkbox", { name: "All permissions" });

  click(parent.element());
  expect(onValueChange).toHaveBeenLastCalledWith(ALL);
  await expect
    .element(screen.getByRole("checkbox", { name: "Read" }))
    .toHaveAttribute("aria-checked", "true");
  await expect.element(parent).toHaveAttribute("aria-checked", "true");

  click(parent.element());
  expect(onValueChange).toHaveBeenLastCalledWith([]);
  await expect.element(parent).toHaveAttribute("aria-checked", "false");
});

test("the parent reads mixed when only some children are ticked", async () => {
  const screen = await render(<Permissions />);
  click(screen.getByRole("checkbox", { name: "Read" }).element());

  const parent = screen.getByRole("checkbox", { name: "All permissions" });
  await expect.element(parent).toHaveAttribute("aria-checked", "mixed");
  await expect.element(parent).toHaveAttribute("data-indeterminate");
});

test("uncontrolled defaultValue ticks the named children", async () => {
  const screen = await render(
    <CheckboxGroup defaultValue={["sms"]} aria-label="Notifications">
      <Checkbox value="email" aria-label="Email" />
      <Checkbox value="sms" aria-label="SMS" />
    </CheckboxGroup>,
  );
  await expect
    .element(screen.getByRole("checkbox", { name: "SMS" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByRole("checkbox", { name: "Email" }))
    .toHaveAttribute("aria-checked", "false");
});

test("disabling the group disables every child", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Permissions disabled onValueChange={onValueChange} />,
  );
  const read = screen.getByRole("checkbox", { name: "Read" });
  await expect.element(read).toBeDisabled();

  read.element().dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onValueChange).not.toHaveBeenCalled();
});

test("forwards the ref to the group element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <CheckboxGroup ref={ref} aria-label="Notifications">
      <Checkbox value="email" aria-label="Email" />
    </CheckboxGroup>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("checkbox-group");
});

test("accepts a className without dropping the layout classes", async () => {
  const screen = await render(
    <CheckboxGroup className="gap-4" aria-label="Notifications">
      <Checkbox value="email" aria-label="Email" />
    </CheckboxGroup>,
  );
  const group = screen.container.querySelector(
    '[data-slot="checkbox-group"]',
  ) as HTMLElement;
  expect(group.className).toContain("gap-4");
  expect(group.className).toContain("flex-col");
});

test("keyboard: each child is its own tab stop and Space toggles it", async () => {
  const screen = await render(<Permissions />);
  const read = screen.getByRole("checkbox", { name: "Read" });
  const write = screen.getByRole("checkbox", { name: "Write" });

  (read.element() as HTMLElement).focus();
  expect(document.activeElement).toBe(read.element());

  // A checkbox group is NOT a roving-tabindex collection — every box is
  // independently reachable, unlike a radio group.
  (write.element() as HTMLElement).focus();
  expect(document.activeElement).toBe(write.element());
  await expect.element(write).toHaveAttribute("tabindex", "0");
});

test("no a11y violations — named group, rest state", async () => {
  const screen = await render(<Permissions />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — mixed parent", async () => {
  const screen = await render(<Permissions />);
  click(screen.getByRole("checkbox", { name: "Read" }).element());
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled group", async () => {
  const screen = await render(<Permissions disabled />);
  await expectNoA11yViolations(screen.container);
});
