import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  SearchableSelect,
  type SearchableSelectProps,
} from "./searchable-select";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

interface Project {
  id: string;
  name: string;
}

const PROJECTS: Project[] = [
  { id: "atlas", name: "Atlas" },
  { id: "borealis", name: "Borealis" },
  { id: "cinder", name: "Cinder" },
];

function Picker(props: Partial<SearchableSelectProps<Project>>) {
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

/* DS-22 — Field wiring, name/required, focus after clear · DS-17 — the inline tier */

test("DS-22: inside a Field the trigger is named by its label, not its value", async () => {
  const screen = await render(
    <Field>
      <FieldLabel>Project</FieldLabel>
      <Picker value={PROJECTS[0]} onValueChange={() => {}} />
    </Field>,
  );
  const trigger = screen.getByRole("combobox", { name: "Project" });
  await expect.element(trigger).toBeInTheDocument();
  await expect
    .poll(() => trigger.element().hasAttribute("aria-label"))
    .toBe(false);
});

test("DS-22: inside an invalid Field the trigger is described and invalid", async () => {
  const screen = await render(
    <Field data-invalid>
      <FieldLabel>Project</FieldLabel>
      <Picker />
      <FieldDescription>Where the work is billed.</FieldDescription>
      <FieldError>Pick a project.</FieldError>
    </Field>,
  );
  const trigger = screen.getByRole("combobox", { name: "Project" });
  await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
  await expect
    .element(trigger)
    .toHaveAccessibleDescription(/Where the work is billed/);
  await expect.element(trigger).toHaveAccessibleDescription(/Pick a project/);
});

test("DS-22: standalone with no label it still falls back to the value, then the placeholder", async () => {
  const screen = await render(<Picker value={PROJECTS[2]} />);
  await expect
    .element(screen.getByRole("combobox", { name: "Cinder" }))
    .toBeInTheDocument();
});

test("DS-22: the form posts the item's key under name", async () => {
  const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return new FormData(event.currentTarget).get("project");
  });
  const screen = await render(
    <form onSubmit={onSubmit}>
      <Picker name="project" value={PROJECTS[1]} onValueChange={() => {}} />
      <button type="submit">Save</button>
    </form>,
  );
  await screen.getByRole("button", { name: "Save" }).click();
  expect(onSubmit).toHaveBeenCalledOnce();
  expect(onSubmit.mock.results[0]!.value).toBe("borealis");
});

test("DS-22: required blocks the submit while nothing is selected", async () => {
  const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const screen = await render(
    <form onSubmit={onSubmit}>
      <Picker name="project" required />
      <button type="submit">Save</button>
    </form>,
  );
  await screen.getByRole("button", { name: "Save" }).click();
  expect(onSubmit).not.toHaveBeenCalled();
});

test("DS-22: clearing returns focus to the trigger", async () => {
  function Clearable() {
    const [value, setValue] = React.useState<Project | null>(PROJECTS[0]!);
    return (
      <Picker
        clearable
        value={value}
        onValueChange={(next) => setValue(next as Project | null)}
      />
    );
  }
  const screen = await render(<Clearable />);
  await screen.getByRole("button", { name: "Clear selection" }).click();
  const trigger = screen.getByRole("combobox", { name: "Select project" });
  await expect.element(trigger).toHaveFocus();
});

test("DS-17: size and variant reflect on the picker, and contentClassName reaches the panel", async () => {
  const screen = await render(
    <Picker size="sm" variant="ghost" contentClassName="min-w-64" />,
  );
  const root = screen.container.querySelector(
    '[data-slot="searchable-select"]',
  )!;
  expect(root.getAttribute("data-size")).toBe("sm");
  expect(root.getAttribute("data-variant")).toBe("ghost");
  await screen.getByRole("combobox").click();
  await expect
    .poll(() =>
      document
        .querySelector('[data-slot="combobox-content"]')
        ?.className.includes("min-w-64"),
    )
    .toBe(true);
});

test("no a11y violations — inside a Field, valid and invalid", async () => {
  const valid = await render(
    <Field>
      <FieldLabel>Project</FieldLabel>
      <Picker />
    </Field>,
  );
  await expectNoA11yViolations(valid.container);
  await valid.unmount();
  const invalid = await render(
    <Field data-invalid>
      <FieldLabel>Project</FieldLabel>
      <Picker />
      <FieldError>Pick a project.</FieldError>
    </Field>,
  );
  await expectNoA11yViolations(invalid.container);
});

test("no a11y violations — inline ghost trigger, open", async () => {
  const screen = await render(
    <Picker size="sm" variant="ghost" aria-label="Project" />,
  );
  await screen.getByRole("combobox", { name: "Project" }).click();
  await expectNoA11yViolations(document.body);
});

// ---- DS-38: server search, several values, option details -------------------------------------

test("remote mode never filters locally and announces loading once (DS-38)", async () => {
  const onSearchChange = vi.fn();
  const screen = await render(
    <Picker remote loading onSearchChange={onSearchChange} />,
  );
  await screen.getByRole("combobox").click();
  await screen.getByPlaceholder("Search projects…").fill("zzz");
  expect(onSearchChange).toHaveBeenLastCalledWith("zzz");
  await expect
    .element(screen.getByRole("option", { name: "Atlas" }))
    .toBeInTheDocument();
  const status = document.querySelector(
    '[data-slot="searchable-select-status"]',
  )!;
  expect(status.getAttribute("role")).toBe("status");
  expect(status.textContent).toContain("Searching…");
  expect(status.closest('[role="listbox"]')).toBeNull();
});

test("a search with no rows yet shows its loading line (DS-38)", async () => {
  const screen = await render(<Picker remote loading items={[]} />);
  await screen.getByRole("combobox").click();
  // Shown, not screen-reader-only (this lane compiles no CSS, so assert the switch itself).
  await expect
    .element(screen.getByRole("status").filter({ hasText: "Searching…" }))
    .toHaveAttribute("data-visible");
});

test("an error shows in the panel and Try again retries (DS-38)", async () => {
  const onRetry = vi.fn();
  const screen = await render(
    <Picker remote error="Couldn't load projects." onRetry={onRetry} />,
  );
  await screen.getByRole("combobox").click();
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Couldn't load projects.");
  await screen.getByRole("button", { name: "Try again" }).click();
  expect(onRetry).toHaveBeenCalledOnce();
});

test("loadMore renders the shared footer in the panel (DS-38)", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <Picker remote loadMore={{ hasMore: true, onLoadMore }} />,
  );
  await screen.getByRole("combobox").click();
  await screen.getByRole("button", { name: "Load more" }).click();
  expect(onLoadMore).toHaveBeenCalledOnce();
});

test("leading items come first and are never filtered out (DS-38)", async () => {
  const me = { id: "me", name: "Me" };
  const screen = await render(<Picker leadingItems={[me]} />);
  await screen.getByRole("combobox").click();
  await screen.getByPlaceholder("Search projects…").fill("Cin");
  const options = [...document.querySelectorAll('[role="option"]')].map(
    (o) => o.textContent,
  );
  expect(options).toEqual(["Me", "Cinder"]);
});

test("a description and a disabled reason are the option's description (DS-38)", async () => {
  const screen = await render(
    <Picker
      itemToDescription={(p: Project) =>
        p.id === "atlas" ? "Q3 launch" : undefined
      }
      itemToDisabledReason={(p: Project) =>
        p.id === "cinder" ? "Archived projects can't be picked" : undefined
      }
    />,
  );
  await screen.getByRole("combobox").click();
  await expect
    .element(screen.getByRole("option", { name: /Atlas/ }))
    .toHaveAccessibleDescription("Q3 launch");
  const cinder = screen.getByRole("option", { name: /Cinder/ });
  await expect.element(cinder).toHaveAttribute("aria-disabled", "true");
  await expect
    .element(cinder)
    .toHaveAccessibleDescription("Archived projects can't be picked");
  await expectNoA11yViolations(document.body);
});

test("multiple picks several values and the trigger reads them (DS-38)", async () => {
  function Multi() {
    const [value, setValue] = React.useState<Project[]>([PROJECTS[0]!]);
    return (
      <SearchableSelect<Project, true>
        multiple
        items={PROJECTS}
        value={value}
        onValueChange={setValue}
        itemToKey={(p) => p.id}
        itemToStringLabel={(p) => p.name}
        isItemEqualToValue={(a, b) => a.id === b.id}
        renderItem={(p) => p.name}
        searchLabel="Search projects"
        placeholder="Select projects"
        aria-label="Projects"
      />
    );
  }
  const screen = await render(<Multi />);
  const trigger = screen.getByRole("combobox", { name: "Projects" });
  await expect.element(trigger).toHaveTextContent("Atlas");
  await trigger.click();
  await screen.getByRole("option", { name: "Borealis" }).click();
  await expect.element(trigger).toHaveTextContent("Atlas, Borealis");
  await expect
    .element(screen.getByRole("option", { name: "Borealis" }))
    .toHaveAttribute("aria-selected", "true");
  await screen.getByRole("option", { name: "Cinder" }).click();
  await expect.element(trigger).toHaveTextContent("3 selected");
});

test("groupBy renders headings (DS-38)", async () => {
  const screen = await render(
    <Picker groupBy={(p: Project) => (p.id === "atlas" ? "Mine" : "Team")} />,
  );
  await screen.getByRole("combobox").click();
  await expect
    .element(screen.getByRole("group", { name: "Mine" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("group", { name: "Team" }))
    .toBeInTheDocument();
});
