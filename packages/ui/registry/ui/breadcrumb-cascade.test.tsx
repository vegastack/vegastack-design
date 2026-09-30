import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import {
  BreadcrumbDropTarget,
  BreadcrumbSiblings,
  BreadcrumbTrail,
  type BreadcrumbSibling,
} from "./breadcrumb-cascade";
import { DataList, type DataListColumn } from "./data-list";

const siblings: BreadcrumbSibling[] = [
  { id: "clients", label: "Clients", href: "#clients" },
  { id: "projects", label: "Projects", href: "#projects", current: true },
  { id: "archive", label: "Archive" },
];

function Trail(
  props: Partial<React.ComponentProps<typeof BreadcrumbSiblings>>,
) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#library">Library</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
          <BreadcrumbSiblings label="Projects" items={siblings} {...props} />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Q3</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

test("BreadcrumbSiblings opens a menu of the segment's siblings, the current one marked", async () => {
  const onSelect = vi.fn();
  const onOpenChange = vi.fn();
  const screen = await render(
    <Trail onSelect={onSelect} onOpenChange={onOpenChange} />,
  );
  const trigger = screen.getByRole("button", {
    name: "Items next to Projects",
  });
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "breadcrumb-siblings-trigger");
  await expectNoA11yViolations(document.body);

  await trigger.click();
  expect(onOpenChange).toHaveBeenLastCalledWith(true);
  const menu = screen.getByRole("menu");
  await expect.element(menu).toBeInTheDocument();
  const items = screen.getByRole("menuitem");
  expect(items.elements().map((el) => el.textContent)).toEqual([
    "Clients",
    "Projects",
    "Archive",
  ]);
  await expect
    .element(screen.getByRole("menuitem", { name: "Clients" }))
    .toHaveAttribute("href", "#clients");
  const current = screen.getByRole("menuitem", { name: "Projects" });
  await expect.element(current).toHaveAttribute("aria-current", "page");
  await expect.element(current).toHaveAttribute("data-current", "");
  await expectNoA11yViolations(document.body);

  await screen.getByRole("menuitem", { name: "Archive" }).click();
  expect(onSelect).toHaveBeenCalledWith("archive");
});

test("BreadcrumbSiblings is keyboard-operable: Enter opens, arrows move", async () => {
  const onSelect = vi.fn();
  const screen = await render(<Trail onSelect={onSelect} />);
  (
    screen
      .getByRole("button", { name: "Items next to Projects" })
      .element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByRole("menu")).toBeInTheDocument();
  // Opening from the keyboard highlights the first entry.
  await expect.poll(() => document.activeElement?.textContent).toBe("Clients");
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowDown}");
  await expect.poll(() => document.activeElement?.textContent).toBe("Archive");
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledWith("archive");
});

test("BreadcrumbSiblings shows loading and empty states", async () => {
  const screen = await render(<Trail loading />);
  await screen.getByRole("button", { name: "Items next to Projects" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Loading…" }))
    .toHaveAttribute("aria-disabled", "true");
  await expect
    .element(screen.getByRole("menu"))
    .toHaveAttribute("aria-busy", "true");
  await expectNoA11yViolations(document.body);
  await userEvent.keyboard("{Escape}");
});

test("BreadcrumbSiblings says when there is nothing to list", async () => {
  const screen = await render(<Trail items={[]} />);
  await screen.getByRole("button", { name: "Items next to Projects" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Nothing else here" }))
    .toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
});

test("BreadcrumbSiblings renders a router link element for each entry", async () => {
  function RouterLink(props: React.ComponentProps<"a">) {
    return <a data-router="" {...props} />;
  }
  const screen = await render(<Trail linkRender={<RouterLink />} />);
  await screen.getByRole("button", { name: "Items next to Projects" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Clients" }))
    .toHaveAttribute("data-router", "");
  await userEvent.keyboard("{Escape}");
});

interface FileRow {
  id: string;
  name: string;
}
const files: FileRow[] = [
  { id: "d1", name: "brief.pdf" },
  { id: "d2", name: "notes.md" },
];
const columns: DataListColumn<FileRow>[] = [{ key: "name", header: "Name" }];

function Browser({
  scope = "library",
  onDropInto,
  canDropInto,
}: {
  scope?: string;
  onDropInto: (move: { ids: string[]; targetId: string }) => void;
  canDropInto?: (move: { ids: string[]; targetId: string }) => boolean;
}) {
  const [selected, setSelected] = React.useState(() => new Set<string>());
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbDropTarget
              href="#root"
              targetId="root"
              dragScope="library"
              onDropInto={onDropInto}
              canDropInto={canDropInto}
            >
              Library
            </BreadcrumbDropTarget>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Projects</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DataList<FileRow>
        aria-label="Files"
        columns={columns}
        data={files}
        getRowId={(r) => r.id}
        getRowLabel={(r) => r.name}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        dragScope={scope}
        onDropInto={() => {}}
      />
    </>
  );
}

/** Drive a Pragmatic drag from `source` to the middle of `target`. */
async function dragTo(source: HTMLElement, target: HTMLElement) {
  const dt = new DataTransfer();
  const s = source.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const at = {
    bubbles: true,
    cancelable: true,
    dataTransfer: dt,
    clientX: t.left + t.width / 2,
    clientY: t.top + t.height / 2,
  };
  source.dispatchEvent(
    new DragEvent("dragstart", {
      ...at,
      clientX: s.left + s.width / 2,
      clientY: s.top + s.height / 2,
    }),
  );
  await new Promise((r) => setTimeout(r, 60));
  for (const type of ["dragenter", "dragover"] as const) {
    target.dispatchEvent(new DragEvent(type, at));
    await new Promise((r) => setTimeout(r, 60));
  }
  target.dispatchEvent(new DragEvent("drop", at));
  source.dispatchEvent(new DragEvent("dragend", at));
  await new Promise((r) => setTimeout(r, 60));
}

const rowOf = (id: string) =>
  document.querySelector<HTMLElement>(`[data-row-id="${id}"]`)!;
const crumb = () => document.querySelector<HTMLElement>("[data-drop-target]")!;

test("BreadcrumbDropTarget takes rows dragged from a DataList in the same scope", async () => {
  const onDropInto = vi.fn();
  const screen = await render(<Browser onDropInto={onDropInto} />);
  await expect
    .element(screen.getByRole("link", { name: "Library" }))
    .toHaveAttribute("href", "#root");
  await expectNoA11yViolations(document.body);

  await dragTo(rowOf("d1"), crumb());
  expect(onDropInto).toHaveBeenCalledWith({ ids: ["d1"], targetId: "root" });

  // A selected row carries the whole selection.
  onDropInto.mockClear();
  for (const name of ["brief.pdf", "notes.md"])
    document
      .querySelector<HTMLElement>(`[aria-label="Select ${name}"]`)!
      .click();
  await expect
    .poll(() =>
      document
        .querySelector(`[aria-label="Select notes.md"]`)
        ?.getAttribute("aria-checked"),
    )
    .toBe("true");
  await dragTo(rowOf("d2"), crumb());
  expect(onDropInto).toHaveBeenCalledWith({
    ids: ["d1", "d2"],
    targetId: "root",
  });
});

test("BreadcrumbDropTarget refuses what canDropInto refuses", async () => {
  const onDropInto = vi.fn();
  await render(<Browser onDropInto={onDropInto} canDropInto={() => false} />);
  await dragTo(rowOf("d1"), crumb());
  expect(onDropInto).not.toHaveBeenCalled();
});

test("BreadcrumbDropTarget ignores drags from another scope", async () => {
  const onDropInto = vi.fn();
  await render(<Browser scope="tasks" onDropInto={onDropInto} />);
  await dragTo(rowOf("d1"), crumb());
  expect(onDropInto).not.toHaveBeenCalled();
});

test("BreadcrumbDropTarget shows the drop state while a drag is over it", async () => {
  await render(<Browser onDropInto={() => {}} canDropInto={() => false} />);
  const dt = new DataTransfer();
  const t = crumb().getBoundingClientRect();
  const at = {
    bubbles: true,
    cancelable: true,
    dataTransfer: dt,
    clientX: t.left + t.width / 2,
    clientY: t.top + t.height / 2,
  };
  rowOf("d1").dispatchEvent(new DragEvent("dragstart", at));
  await new Promise((r) => setTimeout(r, 60));
  crumb().dispatchEvent(new DragEvent("dragenter", at));
  crumb().dispatchEvent(new DragEvent("dragover", at));
  await expect.poll(() => crumb().hasAttribute("data-drop-invalid")).toBe(true);
  rowOf("d1").dispatchEvent(new DragEvent("dragend", at));
});

test("BreadcrumbTrail spreads a step's itemProps and renders the current step with renderCurrent", async () => {
  const onDrop = vi.fn();
  await render(
    <BreadcrumbTrail
      steps={[
        { label: "Library", href: "/library" },
        {
          label: "Clients",
          href: "/library/f/1",
          itemProps: { "data-drop-id": "1", onDrop, className: "x-step" },
        },
        { label: "Brief.docx" },
      ]}
      renderCurrent={(step) => <span data-testid="current">{step.label}!</span>}
    />,
  );
  const item = document.querySelector<HTMLElement>('[data-drop-id="1"]')!;
  expect(item.className).toContain("x-step");
  expect(item.className).toContain("whitespace-nowrap");
  item.dispatchEvent(new Event("drop", { bubbles: true }));
  expect(onDrop).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[data-testid="current"]')?.textContent).toBe(
    "Brief.docx!",
  );
  expect(
    document.querySelector('[data-current] [data-testid="current"]'),
  ).not.toBeNull();
});
