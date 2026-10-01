import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeAll, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import { PeopleInput, type PeopleInputOption } from "./people-input";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { Sheet, SheetContent, SheetTitle } from "./sheet";

const DIRECTORY: PeopleInputOption[] = [
  { id: "u1", name: "Asha Rao", email: "asha@acme.com", hue: "blue" },
  { id: "u2", name: "Dev Menon", email: "dev@acme.com" },
  { id: "t1", name: "Sales", email: "8 members", kind: "team", hue: "green" },
];

const search = (query: string) =>
  Promise.resolve(
    DIRECTORY.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())),
  );

function Harness({
  initial = [],
  onChange,
  searchFn = search,
}: {
  initial?: PeopleInputOption[];
  onChange?: (value: PeopleInputOption[]) => void;
  searchFn?: (q: string) => Promise<PeopleInputOption[]>;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <PeopleInput
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      search={searchFn}
    />
  );
}

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

const chips = () =>
  Array.from(document.querySelectorAll('[data-slot="combobox-chip"]')).map(
    (chip) => chip.textContent,
  );

test("searches as you type and lists people and teams with their avatars", async () => {
  const searchFn = vi.fn(search);
  const screen = await render(<Harness searchFn={searchFn} />);
  const input = screen.getByRole("combobox", { name: "Add people or teams" });
  await expect
    .element(input)
    .toHaveAttribute("placeholder", "Add people or teams…");
  await input.fill("sa");
  const team = screen.getByRole("option", { name: /Sales/ });
  await expect.element(team).toBeVisible();
  expect(searchFn).toHaveBeenLastCalledWith("sa", expect.anything());
  expect(
    team.element().querySelector('[data-slot="avatar"][data-kind="team"]'),
  ).not.toBeNull();
  await settle();
  await expectNoA11yViolations(document.body);
});

test("a pick becomes a removable chip; Escape keeps the chips; Backspace in the empty field removes the last", async () => {
  const onChange = vi.fn();
  const screen = await render(<Harness onChange={onChange} />);
  const input = screen.getByRole("combobox", { name: "Add people or teams" });
  await input.fill("as");
  await screen.getByRole("option", { name: /Asha Rao/ }).click();
  await input.fill("sal");
  await screen.getByRole("option", { name: /Sales/ }).click();
  await vi.waitFor(() => expect(chips()).toEqual(["Asha Rao", "Sales"]));
  const team = document.querySelector(
    '[data-slot="combobox-chip"][data-kind="team"]',
  );
  expect(team?.querySelector("svg.lucide-users-round")).not.toBeNull();
  await settle();
  await expectNoA11yViolations(document.body);

  // Escape closes the list and never clears the chips (Base UI would, with the list closed).
  (input.element() as HTMLInputElement).focus();
  await userEvent.keyboard("{Escape}");
  await userEvent.keyboard("{Escape}");
  expect(chips()).toEqual(["Asha Rao", "Sales"]);
  await userEvent.keyboard("{Backspace}");
  await vi.waitFor(() => expect(chips()).toEqual(["Asha Rao"]));

  await screen.getByRole("button", { name: "Remove Asha Rao" }).click();
  await vi.waitFor(() => expect(chips()).toEqual([]));
  expect(onChange).toHaveBeenLastCalledWith([]);
});

test("loading and empty states", async () => {
  let resolve: (items: PeopleInputOption[]) => void = () => {};
  const screen = await render(
    <Harness
      searchFn={() => new Promise<PeopleInputOption[]>((r) => (resolve = r))}
    />,
  );
  await screen.getByRole("combobox").fill("zz");
  await expect.element(screen.getByText("Searching…")).toBeVisible();
  resolve([]);
  await expect
    .element(screen.getByText("No people or teams found"))
    .toBeVisible();
});

/** The option's centre hit-tests to the option itself: the popup is above the overlay, unclipped. */
async function expectReachable(name: RegExp) {
  const option = page.getByRole("option", { name });
  await expect.element(option).toBeVisible();
  const el = option.element();
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(
    r.left + r.width / 2,
    r.top + r.height / 2,
  );
  expect(el.contains(hit)).toBe(true);
  await option.click();
  await vi.waitFor(() => expect(chips()).toContain("Dev Menon"));
}

test("inside a Dialog the popup sits above it and is clickable", async () => {
  const screen = await render(
    <Dialog open>
      <DialogContent>
        <DialogTitle>Share</DialogTitle>
        <Harness />
      </DialogContent>
    </Dialog>,
  );
  await screen
    .getByRole("combobox", { name: "Add people or teams" })
    .fill("dev");
  await expectReachable(/Dev Menon/);
});

test("inside a bottom Sheet the popup is not clipped and is clickable", async () => {
  await page.viewport(390, 844);
  const screen = await render(
    <Sheet open>
      <SheetContent side="bottom">
        <SheetTitle>Share</SheetTitle>
        <div className="px-4">
          <Harness />
        </div>
      </SheetContent>
    </Sheet>,
  );
  await screen
    .getByRole("combobox", { name: "Add people or teams" })
    .fill("dev");
  await expectReachable(/Dev Menon/);
  await page.viewport(900, 800);
});
