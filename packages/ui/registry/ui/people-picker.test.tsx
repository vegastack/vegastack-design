import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeAll, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import {
  PeoplePicker,
  PeoplePickerContent,
  PeoplePickerMenu,
  type PeoplePickerOption,
  type PeoplePickerSearch,
} from "./people-picker";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const DIRECTORY: PeoplePickerOption[] = [
  { id: "u1", name: "Asha Rao", email: "asha@acme.com", hue: "blue" },
  { id: "u2", name: "Dev Menon", email: "dev@acme.com" },
  { id: "u3", name: "Ravi Kumar", email: "ravi@acme.com", active: false },
  { id: "t1", name: "Sales", kind: "team", memberCount: 8, hue: "green" },
];

const search: PeoplePickerSearch = (query) =>
  Promise.resolve({
    items: DIRECTORY.filter((o) =>
      o.name.toLowerCase().includes(query.toLowerCase()),
    ),
  });

function Single({
  onChange,
  searchFn = search,
}: {
  onChange?: (value: PeoplePickerOption | null) => void;
  searchFn?: PeoplePickerSearch;
}) {
  const [value, setValue] = React.useState<PeoplePickerOption | null>(null);
  return (
    <PeoplePicker
      aria-label="Owner"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      search={searchFn}
      viewerId="u2"
      actions={[{ label: "Unassign", onSelect: () => setValue(null) }]}
    />
  );
}

function Multiple({ includeInactive }: { includeInactive?: boolean }) {
  const [value, setValue] = React.useState<PeoplePickerOption[]>([]);
  return (
    <PeoplePicker
      multiple
      aria-label="Add people"
      value={value}
      onValueChange={setValue}
      search={search}
      includeInactive={includeInactive}
    />
  );
}

/** The element's text contains `text` (waits for it). */
const hasText = (locator: { element: () => Element }, text: string) =>
  vi.waitFor(() => expect(locator.element().textContent).toContain(text));

/** Let the popup finish opening, so the compiled-CSS contrast check reads its settled colours. */
const settle = () =>
  vi.waitFor(() =>
    expect(
      document.getAnimations().filter((a) => a.playState === "running"),
    ).toHaveLength(0),
  );

beforeAll(async () => {
  await page.viewport(900, 800);
});

test("single: lists active people and teams with avatars, (you) first, and picks one", async () => {
  const onChange = vi.fn();
  const screen = await render(<Single onChange={onChange} />);
  await screen.getByRole("button", { name: "Owner" }).click();
  const team = screen.getByRole("option", { name: /Sales/ });
  await expect.element(team).toBeVisible();
  await hasText(team, "Team · 8 people");
  expect(
    team.element().querySelector('[data-slot="avatar"][data-kind="team"]'),
  ).not.toBeNull();
  // The viewer leads, marked "(you)"; the deactivated person is not offered.
  const rows = Array.from(
    document.querySelectorAll('[data-slot="people-picker-item"]'),
  ).map((row) => row.textContent);
  expect(rows[0]).toContain("Dev Menon (you)");
  expect(rows.join()).not.toContain("Ravi Kumar");
  await settle();
  await expectNoA11yViolations(document.body);
  await screen.getByRole("option", { name: /Asha Rao/ }).click();
  expect(onChange).toHaveBeenLastCalledWith(DIRECTORY[0]);
  await hasText(screen.getByRole("button", { name: "Owner" }), "Asha Rao");
});

test("loading shows skeleton rows in the list, never a spinner", async () => {
  let resolve: (value: { items: PeoplePickerOption[] }) => void = () => {};
  const slow: PeoplePickerSearch = () =>
    new Promise((done) => {
      resolve = done;
    });
  const screen = await render(<Single searchFn={slow} />);
  await screen.getByRole("button", { name: "Owner" }).click();
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="people-picker-skeleton"]'),
    ).not.toBeNull(),
  );
  expect(document.querySelector('[data-slot="spinner"]')).toBeNull();
  resolve({ items: DIRECTORY });
  await expect
    .element(screen.getByRole("option", { name: /Asha Rao/ }))
    .toBeVisible();
  expect(
    document.querySelector('[data-slot="people-picker-skeleton"]'),
  ).toBeNull();
});

test("footer actions run and close the picker", async () => {
  const screen = await render(<Single />);
  await screen.getByRole("button", { name: "Owner" }).click();
  await screen.getByRole("option", { name: "Unassign" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Unassign" }))
    .not.toBeInTheDocument();
});

test("multiple: rows toggle, the popover stays open, the trigger reads the names", async () => {
  const screen = await render(<Multiple />);
  const trigger = screen.getByRole("button", { name: "Add people" });
  await hasText(trigger, "Add people…");
  await trigger.click();
  await screen.getByRole("option", { name: /Asha Rao/ }).click();
  await screen.getByRole("option", { name: /Sales/ }).click();
  await hasText(trigger, "Asha Rao, Sales");
  await expect
    .element(screen.getByRole("option", { name: /Asha Rao/ }))
    .toHaveAttribute("data-checked", "true");
  await screen.getByRole("option", { name: /Asha Rao/ }).click();
  await hasText(trigger, "Sales");
  await userEvent.keyboard("{Escape}");
});

test("includeInactive lists inactive people with a badge", async () => {
  const screen = await render(<Multiple includeInactive />);
  await screen.getByRole("button", { name: "Add people" }).click();
  const ravi = screen.getByRole("option", { name: /Ravi Kumar/ });
  await hasText(ravi, "Inactive");
});

test("the trigger is as tall as Select and Button at every size", async () => {
  const screen = await render(
    <div className="flex flex-col gap-2">
      {(["sm", "default", "lg"] as const).map((size) => (
        <div key={size} className="flex items-start gap-2">
          <PeoplePicker
            multiple
            size={size}
            aria-label={`Add people ${size}`}
            value={[]}
            onValueChange={() => {}}
            options={DIRECTORY}
          />
          {size === "lg" ? null : (
            <Select defaultValue="edit">
              <SelectTrigger size={size} aria-label={`Level ${size}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edit">Can edit</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button size={size}>{`Add ${size}`}</Button>
        </div>
      ))}
    </div>,
  );
  const height = (role: "button" | "combobox", name: string) =>
    screen.getByRole(role, { name }).element().getBoundingClientRect().height;
  for (const size of ["sm", "default", "lg"] as const) {
    expect(height("button", `Add people ${size}`)).toBe(
      height("button", `Add ${size}`),
    );
    if (size !== "lg")
      expect(height("button", `Add people ${size}`)).toBe(
        height("combobox", `Level ${size}`),
      );
  }
});

test("content: a host-owned popover body with a local option list", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <div className="w-72 rounded-lg border">
      <PeoplePickerContent
        options={DIRECTORY}
        selected={["u1"]}
        onSelect={onSelect}
      />
    </div>,
  );
  await expect
    .element(screen.getByRole("option", { name: /Asha Rao/ }))
    .toHaveAttribute("data-checked", "true");
  await screen.getByRole("combobox", { name: "Search people" }).fill("dev");
  await expect
    .element(screen.getByRole("option", { name: /Asha Rao/ }))
    .not.toBeInTheDocument();
  await screen.getByRole("option", { name: /Dev Menon/ }).click();
  expect(onSelect).toHaveBeenCalledWith(DIRECTORY[1]);
  await expectNoA11yViolations(document.body);
});

test("menu: the same rows inside a dropdown submenu", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button>Actions</Button>} />
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Assign</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-72">
            <PeoplePickerMenu search={search} onSelect={onSelect} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  await screen.getByRole("button", { name: "Actions" }).click();
  await screen.getByRole("menuitem", { name: "Assign" }).click();
  await screen.getByRole("menuitem", { name: /Asha Rao/ }).click();
  expect(onSelect).toHaveBeenCalledWith(DIRECTORY[0]);
});

test("a failed search shows Try again, which retries without picking a row", async () => {
  let fail = true;
  const flaky: PeoplePickerSearch = (query, context) =>
    fail ? Promise.reject(new Error("down")) : search(query, context);
  const onChange = vi.fn();
  const screen = await render(<Single searchFn={flaky} onChange={onChange} />);
  await screen.getByRole("button", { name: "Owner" }).click();
  const retry = screen.getByRole("button", { name: "Try again" });
  await expect.element(retry).toBeVisible();
  fail = false;
  (retry.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  await expect
    .element(screen.getByRole("option", { name: /Asha Rao/ }))
    .toBeVisible();
  expect(onChange).not.toHaveBeenCalled();
});
