import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, onTestFinished, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { VersionCompare } from "./version-compare";
import type { VersionItem } from "./version-list";

const now = Date.parse("2026-09-29T12:00:00Z");
const asha = { name: "Asha Rao" };
const versions: VersionItem[] = [
  { id: "v3", author: asha, at: "2026-09-29T11:00:00Z", kind: "auto" },
  {
    id: "v2",
    author: { name: "Claude", kind: "agent", via: "Asha Rao" },
    at: "2026-09-29T10:00:00Z",
    kind: "agent_checkpoint",
  },
  {
    id: "v1",
    author: asha,
    at: "2026-09-27T10:00:00Z",
    kind: "named",
    name: "Before review",
  },
];

/** Answer `(min-width: 40rem)` as a wide screen or a phone. */
function mockWide(wide: boolean) {
  const spy = vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: wide && query.includes("min-width: 40rem"),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
  onTestFinished(() => spy.mockRestore());
}

function Harness({
  diff,
  preview = <p>Text of the selected version</p>,
}: {
  diff?: { before: string; after: string };
  preview?: React.ReactNode;
}) {
  const [selected, setSelected] = React.useState("v3");
  const [showChanges, setShowChanges] = React.useState(false);
  return (
    <div style={{ height: 600, display: "flex" }}>
      <VersionCompare
        versions={versions}
        selectedId={selected}
        onSelect={setSelected}
        currentId="v3"
        now={now}
        showChanges={showChanges}
        onShowChangesChange={setShowChanges}
        preview={
          <>
            {preview}
            <span data-testid="selected">{selected}</span>
          </>
        }
        diff={diff}
        actions={
          <>
            <Button variant="outline">Copy</Button>
            <Button>Restore this version</Button>
          </>
        }
      />
    </div>
  );
}

test("wide: the preview and the day-grouped list side by side on resizable panels, the actions pinned below", async () => {
  mockWide(true);
  const screen = await render(<Harness />);
  const root = screen.container.querySelector<HTMLElement>(
    "[data-slot=version-compare]",
  )!;
  expect(
    root.querySelector("[data-slot=version-compare-panels]"),
  ).not.toBeNull();
  expect(root.querySelector("[data-slot=resizable-handle]")).not.toBeNull();
  await expect
    .element(screen.getByRole("region", { name: "Selected version" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("group", { name: "Today" }))
    .toBeInTheDocument();
  // The actions sit after the panels, outside both scrollers.
  const actions = root.querySelector("[data-slot=version-compare-actions]")!;
  expect(actions.parentElement).toBe(root);
  await expect
    .element(screen.getByRole("button", { name: "Restore this version" }))
    .toBeInTheDocument();
  // Picking a version selects it.
  await screen.getByRole("option", { name: /Before review/ }).click();
  await expect.element(screen.getByTestId("selected")).toHaveTextContent("v1");
  await expectNoA11yViolations(screen.container);
});

test("Show changes: the switch toggles it; with a diff the preview is a DiffView, without one the host's preview stays", async () => {
  mockWide(true);
  const screen = await render(
    <Harness
      diff={{
        before: "Seats are billed yearly.",
        after: "Seats are billed monthly.",
      }}
    />,
  );
  const toggle = screen.getByRole("switch", { name: "Show changes" });
  await expect.element(toggle).toHaveAttribute("aria-checked", "false");
  (toggle.element() as HTMLElement).click();
  await expect.element(toggle).toHaveAttribute("aria-checked", "true");
  await vi.waitFor(() =>
    expect(
      screen.container.querySelector("[data-slot=diff-view] ins"),
    ).not.toBeNull(),
  );
  expect(screen.container.textContent).not.toContain(
    "Text of the selected version",
  );
  await expectNoA11yViolations(screen.container);
  await screen.unmount();

  const host = await render(<Harness />);
  const hostToggle = host.getByRole("switch", { name: "Show changes" });
  (hostToggle.element() as HTMLElement).click();
  await expect.element(hostToggle).toHaveAttribute("aria-checked", "true");
  expect(host.container.textContent).toContain("Text of the selected version");
});

test("phone: the list first; a picked version pushes its preview in, with the actions; Back returns to the list", async () => {
  mockWide(false);
  const screen = await render(<Harness />);
  const root = () =>
    screen.container.querySelector<HTMLElement>("[data-slot=version-compare]")!;
  expect(root().dataset.view).toBe("list");
  expect(root().querySelector("[data-slot=version-compare-panels]")).toBeNull();
  expect(
    root().querySelector("[data-slot=version-compare-preview]"),
  ).toBeNull();
  // No actions on the list: they act on the version being read.
  expect(
    root().querySelector("[data-slot=version-compare-actions]"),
  ).toBeNull();
  await expectNoA11yViolations(screen.container);

  await screen.getByRole("option", { name: /Before review/ }).click();
  await expect.element(screen.getByTestId("selected")).toHaveTextContent("v1");
  expect(root().dataset.view).toBe("preview");
  await expect
    .element(screen.getByRole("button", { name: "Restore this version" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);

  // Focus follows: to Back on the way in, to the selected version on the way out.
  await vi.waitFor(() =>
    expect(document.activeElement?.textContent).toContain("Versions"),
  );
  await screen.getByRole("button", { name: "Versions" }).click();
  expect(root().dataset.view).toBe("list");
  await vi.waitFor(() =>
    expect((document.activeElement as HTMLElement | null)?.dataset.slot).toBe(
      "version-list-item",
    ),
  );
  expect(document.activeElement?.textContent).toContain("Before review");

  // Enter on a row pushes it in too; the arrows only move the selection.
  const row = screen.container.querySelector<HTMLElement>(
    "[data-slot=version-list-item][data-selected]",
  )!;
  row.focus();
  await userEvent.keyboard("{ArrowUp}");
  expect(root().dataset.view).toBe("list");
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() => expect(root().dataset.view).toBe("preview"));
});

test('phone, defaultPhoneView="preview": opens straight on the selected version; Back returns to the list and reports it', async () => {
  mockWide(false);
  const onPhoneViewChange = vi.fn();
  const screen = await render(
    <div style={{ height: 600, display: "flex" }}>
      <VersionCompare
        versions={versions}
        selectedId="v2"
        currentId="v3"
        now={now}
        showChanges
        diff={{
          before: "Seats are billed yearly.",
          after: "Seats are billed monthly.",
        }}
        defaultPhoneView="preview"
        onPhoneViewChange={onPhoneViewChange}
        preview={<p>Text of the selected version</p>}
        actions={<Button>Restore this version</Button>}
      />
    </div>,
  );
  const root = () =>
    screen.container.querySelector<HTMLElement>("[data-slot=version-compare]")!;
  expect(root().dataset.view).toBe("preview");
  expect(root().querySelector("[data-slot=diff-view]")).not.toBeNull();
  await expect
    .element(screen.getByRole("button", { name: "Restore this version" }))
    .toBeInTheDocument();
  // Opening on the preview moves no focus on its own.
  expect(root().contains(document.activeElement)).toBe(false);
  expect(onPhoneViewChange).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);

  await screen.getByRole("button", { name: "Versions" }).click();
  expect(onPhoneViewChange).toHaveBeenLastCalledWith("list");
  expect(root().dataset.view).toBe("list");
  await vi.waitFor(() =>
    expect((document.activeElement as HTMLElement | null)?.dataset.slot).toBe(
      "version-list-item",
    ),
  );
});

test("phone, controlled phoneView: the host decides the side; a pick and Back report it", async () => {
  mockWide(false);
  const onPhoneViewChange = vi.fn();
  function Controlled() {
    const [view, setView] = React.useState<"list" | "preview">("preview");
    return (
      <div style={{ height: 600, display: "flex" }}>
        <Button onClick={() => setView("preview")}>View changes</Button>
        <VersionCompare
          versions={versions}
          selectedId="v2"
          currentId="v3"
          now={now}
          phoneView={view}
          onPhoneViewChange={(next) => {
            onPhoneViewChange(next);
            setView(next);
          }}
          preview={<p>Text of the selected version</p>}
        />
      </div>
    );
  }
  const screen = await render(<Controlled />);
  const root = () =>
    screen.container.querySelector<HTMLElement>("[data-slot=version-compare]")!;
  expect(root().dataset.view).toBe("preview");
  await screen.getByRole("button", { name: "Versions" }).click();
  expect(onPhoneViewChange).toHaveBeenLastCalledWith("list");
  expect(root().dataset.view).toBe("list");
  await expectNoA11yViolations(screen.container);

  // The host pushes the preview in on its own: focus stays on the host's control.
  await screen.getByRole("button", { name: "View changes" }).click();
  expect(root().dataset.view).toBe("preview");
  expect(document.activeElement?.textContent).toBe("View changes");

  // A pick reports "preview".
  await screen.getByRole("button", { name: "Versions" }).click();
  await screen.getByRole("option", { name: /Before review/ }).click();
  expect(onPhoneViewChange).toHaveBeenLastCalledWith("preview");
  expect(root().dataset.view).toBe("preview");
  await screen.unmount();

  // A host that declines Back, then moves to the list on its own: focus stays on its control.
  function Declining() {
    const [view, setView] = React.useState<"list" | "preview">("preview");
    return (
      <div style={{ height: 600, display: "flex" }}>
        <Button onClick={() => setView("list")}>Show all</Button>
        <VersionCompare
          versions={versions}
          selectedId="v2"
          now={now}
          phoneView={view}
          onPhoneViewChange={() => {}}
          preview={<p>Text of the selected version</p>}
        />
      </div>
    );
  }
  const declining = await render(<Declining />);
  await declining.getByRole("button", { name: "Versions" }).click();
  expect(
    declining.container.querySelector<HTMLElement>(
      "[data-slot=version-compare]",
    )!.dataset.view,
  ).toBe("preview");
  await declining.getByRole("button", { name: "Show all" }).click();
  await vi.waitFor(() =>
    expect(
      declining.container.querySelector<HTMLElement>(
        "[data-slot=version-compare]",
      )!.dataset.view,
    ).toBe("list"),
  );
  expect(document.activeElement?.textContent).toBe("Show all");
  await declining.unmount();

  // A host that holds the list keeps it: the pick is only reported.
  const held = vi.fn();
  const fixed = await render(
    <div style={{ height: 600, display: "flex" }}>
      <VersionCompare
        versions={versions}
        selectedId="v2"
        now={now}
        phoneView="list"
        onPhoneViewChange={held}
      />
    </div>,
  );
  await fixed.getByRole("option", { name: /Before review/ }).click();
  expect(held).toHaveBeenLastCalledWith("preview");
  expect(
    fixed.container.querySelector<HTMLElement>("[data-slot=version-compare]")!
      .dataset.view,
  ).toBe("list");
});
