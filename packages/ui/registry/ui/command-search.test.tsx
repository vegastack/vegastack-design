import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import { CommandItem, CommandGroup } from "./command";
import {
  CommandSearch,
  CommandSearchInput,
  CommandSearchResults,
  CommandSearchScopes,
  CommandSearchSections,
  type CommandSearchScope,
} from "./command-search";

const SCOPES: CommandSearchScope[] = [
  { value: "all", label: "All" },
  { value: "pages", label: "Pages" },
  { value: "tables", label: "Tables" },
  { value: "rows", label: "Rows" },
  { value: "files", label: "Files" },
  { value: "tasks", label: "Tasks" },
  { value: "meetings", label: "Meetings" },
  { value: "customers", label: "Customers" },
  { value: "products", label: "Products" },
];

function Palette({
  pending = false,
  preview,
  scope: initialScope = "all",
  maxVisible,
  onScope,
  onArchived,
  children,
}: {
  pending?: boolean;
  preview?: React.ReactNode;
  scope?: string;
  maxVisible?: number;
  onScope?: (value: string) => void;
  onArchived?: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  const [scope, setScope] = React.useState(initialScope);
  const [archived, setArchived] = React.useState(false);
  return (
    <CommandSearch open pending={pending} preview={preview}>
      <CommandSearchInput />
      <CommandSearchScopes
        scopes={SCOPES}
        value={scope}
        maxVisible={maxVisible}
        onValueChange={(value) => {
          setScope(value);
          onScope?.(value);
        }}
        includeArchived={archived}
        onIncludeArchivedChange={(value) => {
          setArchived(value);
          onArchived?.(value);
        }}
      />
      <CommandSearchResults>
        {children ?? (
          <CommandGroup heading="Pages">
            <CommandItem value="spec">Spec v2</CommandItem>
            <CommandItem value="notes">Meeting notes</CommandItem>
          </CommandGroup>
        )}
      </CommandSearchResults>
    </CommandSearch>
  );
}

const q = (slot: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);

/** The dialog mounts its popup after the first commit: wait for the results list. */
const opened = () => expect.poll(() => q("command-list")).not.toBeNull();

test("renders the palette: input, one chip row with More, and the results", async () => {
  const screen = await render(<Palette maxVisible={7} />);
  await expect
    .element(screen.getByRole("dialog", { name: "Search" }))
    .toBeInTheDocument();
  await expect.element(screen.getByRole("combobox")).toBeInTheDocument();
  const chips = Array.from(
    q("command-search-scopes")!.querySelectorAll(
      '[data-slot="toggle-group-item"]',
    ),
  ).map((c) => c.textContent);
  expect(chips).toEqual(SCOPES.slice(0, 7).map((s) => s.label));
  expect(q("command-search-more")?.textContent).toBe("More");
  await expect
    .element(screen.getByRole("option", { name: "Spec v2" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("More lists the overflow scopes and Include archived; a picked scope names and presses the trigger", async () => {
  const onScope = vi.fn();
  const onArchived = vi.fn();
  const screen = await render(
    <Palette maxVisible={7} onScope={onScope} onArchived={onArchived} />,
  );
  q("command-search-more")!.click();
  await expect
    .element(screen.getByRole("menuitemradio", { name: "Customers" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("menuitemcheckbox", { name: "Include archived" }))
    .not.toBeChecked();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  (
    screen
      .getByRole("menuitemradio", { name: "Products" })
      .element() as HTMLElement
  ).click();
  expect(onScope).toHaveBeenCalledWith("products");
  await expect
    .poll(() => q("command-search-more")?.textContent)
    .toBe("Products");
  expect(q("command-search-more")?.getAttribute("data-state")).toBe("on");
  // No visible chip is pressed while the scope sits in More.
  expect(
    q("command-search-scopes")!.querySelector('[aria-pressed="true"]'),
  ).toBeNull();

  q("command-search-more")!.click();
  const archived = screen.getByRole("menuitemcheckbox", {
    name: "Include archived",
  });
  (archived.element() as HTMLElement).click();
  expect(onArchived).toHaveBeenCalledWith(true);
  await expect.poll(() => q("command-search-archived-dot")).not.toBeNull();
});

test("a visible chip picks its scope", async () => {
  const onScope = vi.fn();
  const screen = await render(<Palette maxVisible={7} onScope={onScope} />);
  (
    screen.getByRole("button", { name: "Tables" }).element() as HTMLElement
  ).click();
  expect(onScope).toHaveBeenCalledWith("tables");
  await expect
    .element(screen.getByRole("button", { name: "Tables" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("pending dims the stale results, marks them busy and runs a bar under the input", async () => {
  await render(<Palette pending />);
  await opened();
  const list = q("command-list")!;
  expect(list.hasAttribute("data-stale")).toBe(true);
  expect(list.getAttribute("aria-busy")).toBe("true");
  expect(q("command-search-progress")).not.toBeNull();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("settled results are neither dimmed nor busy, and no bar runs", async () => {
  await render(<Palette />);
  await opened();
  expect(q("command-list")!.hasAttribute("data-stale")).toBe(false);
  expect(q("command-list")!.hasAttribute("aria-busy")).toBe(false);
  expect(q("command-search-progress")).toBeNull();
});

test("sections render Recent, Create, Places in that order and skip empty ones", async () => {
  await render(
    <Palette>
      <CommandSearchSections
        places={<CommandItem value="home">Home</CommandItem>}
        recent={[]}
        create={<CommandItem value="new-page">New page</CommandItem>}
      />
    </Palette>,
  );
  await opened();
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="command-search-section"]',
    ),
  ).map((s) => s.dataset.section);
  expect(sections).toEqual(["create", "places"]);
});

test("the preview pane renders beside the results only when given", async () => {
  await render(<Palette preview={<p>Spec v2 preview</p>} />);
  await opened();
  expect(q("command-search-preview")?.textContent).toBe("Spec v2 preview");
});

test("results are capped at min(60dvh, 520px) and More fits what the row holds (compiled CSS)", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  try {
    await render(<Palette />);
    await opened();
    const list = q("command-list")!;
    const cap = Math.min(window.innerHeight * 0.6, 520);
    expect(Number.parseFloat(getComputedStyle(list).maxHeight)).toBeCloseTo(
      cap,
      0,
    );
    const row = q("command-search-scopes")!;
    // Nothing in the row spills past its edge.
    const edge = row.getBoundingClientRect().right;
    for (const el of row.querySelectorAll<HTMLElement>(
      '[data-slot="toggle-group-item"], [data-slot="command-search-more"]',
    ))
      expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(edge + 0.5);
  } finally {
    sheet.remove();
  }
});
