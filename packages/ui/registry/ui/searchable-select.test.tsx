import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { SearchableSelect } from "./searchable-select";

interface Project {
  id: string;
  name: string;
}

const PROJECTS: Project[] = [
  { id: "atlas", name: "Atlas" },
  { id: "borealis", name: "Borealis" },
  { id: "cinder", name: "Cinder" },
];

function Picker(props: Partial<React.ComponentProps<typeof SearchableSelect>>) {
  return (
    <SearchableSelect<Project>
      items={PROJECTS}
      itemToKey={(project) => project.id}
      itemToStringLabel={(project) => project.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      renderItem={(project) => project.name}
      searchLabel="Search projects"
      searchPlaceholder="Search projects…"
      placeholder="Select project"
      emptyMessage="No project found."
      {...(props as Record<string, unknown>)}
    />
  );
}

test("shows the placeholder and marks the trigger as empty", async () => {
  const screen = await render(<Picker />);
  const trigger = screen.getByRole("combobox", { name: "Select project" });
  await expect.element(trigger).toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute("data-placeholder");
});

test("shows the selected value and drops the placeholder marker", async () => {
  const screen = await render(<Picker value={PROJECTS[1]} />);
  const trigger = screen.getByRole("combobox", { name: "Borealis" });
  await expect.element(trigger).toBeInTheDocument();
  await expect.element(trigger).not.toHaveAttribute("data-placeholder");
});

test("filters through the in-panel search field", async () => {
  const screen = await render(<Picker />);
  await screen.getByRole("combobox").click();
  await screen.getByPlaceholder("Search projects…").fill("Cin");
  await expect.element(screen.getByText("Cinder")).toBeInTheDocument();
  await expect.poll(() => document.body.textContent).not.toContain("Atlas");
});

test("shows the empty message when nothing matches", async () => {
  const screen = await render(<Picker />);
  await screen.getByRole("combobox").click();
  await screen.getByPlaceholder("Search projects…").fill("zzzznope");
  await expect
    .element(screen.getByText("No project found."))
    .toBeInTheDocument();
});

// The single-code-path guarantee this preset exists to enforce (audit B8-02): both modalities
// go through the Combobox root's `onValueChange` and nowhere else.
test("pointer click and keyboard Enter report the same value", async () => {
  const onPointer = vi.fn();
  const onKeyboard = vi.fn();
  // Two live instances rather than a render/unmount pair: unmounting mid-test tears down the
  // shared container and every later render in the file lands in a detached node.
  const screen = await render(
    <>
      <Picker aria-label="Pointer picker" onValueChange={onPointer} />
      <Picker aria-label="Keyboard picker" onValueChange={onKeyboard} />
    </>,
  );

  await screen.getByRole("combobox", { name: "Pointer picker" }).click();
  await screen.getByRole("option", { name: "Borealis" }).click();

  await screen.getByRole("combobox", { name: "Keyboard picker" }).click();
  await screen.getByPlaceholder("Search projects…").fill("Borealis");
  await userEvent.keyboard("{Enter}");

  expect(onPointer).toHaveBeenCalledWith(PROJECTS[1]);
  expect(onKeyboard.mock.calls).toEqual(onPointer.mock.calls);
});

test("the clear control appears only when clearable AND a value is set", async () => {
  const screen = await render(
    <>
      <Picker aria-label="Clearable, empty" clearable />
      <Picker aria-label="Not clearable, set" value={PROJECTS[0]} />
    </>,
  );
  expect(
    screen.container.querySelectorAll('[data-slot="searchable-select-clear"]'),
  ).toHaveLength(0);
});

test("the clear control reports null", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Picker value={PROJECTS[0]} clearable onValueChange={onValueChange} />,
  );
  await screen.getByRole("button", { name: "Clear selection" }).click();
  expect(onValueChange).toHaveBeenCalledWith(null);
});

test("the clear control is a sibling of the trigger, never nested inside it", async () => {
  const screen = await render(<Picker value={PROJECTS[0]} clearable />);
  const trigger = screen.container.querySelector(
    '[data-slot="searchable-select-trigger"]',
  );
  const clear = screen.container.querySelector(
    '[data-slot="searchable-select-clear"]',
  );
  expect(trigger).not.toBeNull();
  expect(clear).not.toBeNull();
  expect(trigger!.contains(clear!)).toBe(false);
});

test("the trigger is full-width — no fixed width of its own", async () => {
  const screen = await render(<Picker />);
  await expect.element(screen.getByRole("combobox")).toHaveClass("w-full");
});

test("disabled disables the trigger", async () => {
  const screen = await render(<Picker disabled />);
  await expect.element(screen.getByRole("combobox")).toBeDisabled();
});

test("no a11y violations (closed)", async () => {
  const screen = await render(<Picker value={PROJECTS[0]} clearable />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (open)", async () => {
  const screen = await render(<Picker />);
  await screen.getByRole("combobox").click();
  await expect
    .element(screen.getByPlaceholder("Search projects…"))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});

test("forwards ref to the trigger and rootRef to the wrapper", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  // Directly, not through the `Picker` helper: a ref forwarded through a spread is exactly the
  // indirection this assertion exists to rule out.
  await render(
    <SearchableSelect<Project>
      ref={ref}
      rootRef={rootRef}
      items={PROJECTS}
      itemToKey={(project) => project.id}
      itemToStringLabel={(project) => project.name}
      renderItem={(project) => project.name}
      searchLabel="Search projects"
      placeholder="Select project"
    />,
  );
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("searchable-select-trigger");
  expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
  expect(rootRef.current?.dataset.slot).toBe("searchable-select");
});
