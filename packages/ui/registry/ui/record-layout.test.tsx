import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "./property-list";
import {
  RecordLayout,
  RecordLayoutMain,
  RecordPanel,
  RecordPanelAction,
  RecordPanelItem,
  RecordPanelList,
  RecordPanelProvider,
  RecordPanelSection,
  RecordPanelToggle,
  RecordPanelTrigger,
  useRecordPanel,
} from "./record-layout";

function Reveal() {
  const panel = useRecordPanel();
  return (
    <button type="button" onClick={() => panel?.reveal("files")}>
      Show files
    </button>
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot='${name}']`);
const frames = () =>
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

function Record({
  width,
  open,
  defaultOpen,
  onOpenChange,
  sections,
  onSectionOpenChange,
}: {
  width: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  sections?: Record<string, boolean>;
  onSectionOpenChange?: (value: string, open: boolean) => void;
}) {
  return (
    <RecordPanelProvider
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      sections={sections}
      onSectionOpenChange={onSectionOpenChange}
    >
      <header>
        <RecordPanelToggle />
        <Reveal />
      </header>
      <div style={{ width, height: 600, display: "flex" }}>
        <RecordLayout>
          <RecordLayoutMain>
            <h1>Weekly sync</h1>
            <RecordPanelTrigger />
            <p>Description</p>
          </RecordLayoutMain>
          <RecordPanel>
            <RecordPanelSection value="details" title="Details">
              <PropertyList variant="panel" aria-label="Details">
                <PropertyRow>
                  <PropertyLabel>Owner</PropertyLabel>
                  <PropertyValue>Asha Rao</PropertyValue>
                </PropertyRow>
              </PropertyList>
            </RecordPanelSection>
            <RecordPanelSection
              value="files"
              title="Files"
              count={1}
              action={<RecordPanelAction label="Add file" />}
            >
              <RecordPanelList>
                <RecordPanelItem detail="1.2 MB">
                  rollout-plan.pdf
                </RecordPanelItem>
              </RecordPanelList>
            </RecordPanelSection>
          </RecordPanel>
        </RecordLayout>
      </div>
    </RecordPanelProvider>
  );
}

test("from 68rem the panel docks, 320px wide, open on first render, and the main column takes the rest", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Record width={1300} />);
  const panel = slot("record-panel")!;
  // Open on the first render (the server's): no motion, nothing moves on hydration.
  expect(panel.hasAttribute("data-motion")).toBe(false);
  expect(getComputedStyle(panel).position).not.toBe("absolute");
  expect(Math.round(panel.getBoundingClientRect().width)).toBe(320);
  const main = slot("record-layout-main")!.getBoundingClientRect();
  expect(Math.round(main.width)).toBe(1300 - 320);
  // One full-height divider: the panel runs the layout's height.
  expect(Math.round(panel.getBoundingClientRect().height)).toBe(600);
  expect(
    screen.getByRole("button", { name: "Hide details" }).element(),
  ).toHaveAttribute("aria-expanded", "true");
  await expectNoA11yViolations(screen.container);
});

test("▥ hides and shows the docked panel, reporting each choice, and ⌘. does the same", async () => {
  await page.viewport(1440, 900);
  const changes: boolean[] = [];
  const screen = await render(
    <Record width={1300} onOpenChange={(o) => changes.push(o)} />,
  );
  await screen.getByRole("button", { name: "Hide details" }).click();
  expect(getComputedStyle(slot("record-panel")!).display).toBe("none");
  await screen.getByRole("button", { name: "Show details" }).click();
  const panel = slot("record-panel")!;
  expect(getComputedStyle(panel).display).toBe("flex");
  // A person's open plays the motion.
  expect(panel.getAttribute("data-motion")).toBe("enter");
  await userEvent.keyboard("{Control>}.{/Control}");
  expect(getComputedStyle(slot("record-panel")!).display).toBe("none");
  expect(changes).toEqual([false, true, false]);
});

test("below 68rem it starts closed even when remembered open, ▥ floats it over the page, and Escape closes it with focus back on ▥", async () => {
  await page.viewport(1440, 900);
  const changes: boolean[] = [];
  const screen = await render(
    <Record width={1000} open onOpenChange={(o) => changes.push(o)} />,
  );
  await frames();
  expect(getComputedStyle(slot("record-panel")!).display).toBe("none");
  const toggle = screen.getByRole("button", { name: "Show details" });
  await toggle.click();
  const panel = slot("record-panel")!;
  // The slide in has played.
  await new Promise((r) => setTimeout(r, 400));
  expect(getComputedStyle(panel).position).toBe("absolute");
  expect(Math.round(panel.getBoundingClientRect().right)).toBe(
    Math.round(slot("record-layout")!.getBoundingClientRect().right),
  );
  // It floats: the main column keeps the whole width.
  expect(
    Math.round(slot("record-layout-main")!.getBoundingClientRect().width),
  ).toBe(1000);
  expect(document.activeElement).toBe(panel);
  await userEvent.keyboard("{Escape}");
  await frames();
  expect(getComputedStyle(slot("record-panel")!).display).toBe("none");
  expect(document.activeElement?.getAttribute("data-slot")).toBe(
    "record-panel-toggle",
  );
  // A floating panel is never remembered.
  expect(changes).toEqual([]);
});

test("a floating panel closes on a click in the page", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Record width={1000} defaultOpen={false} />);
  await screen.getByRole("button", { name: "Show details" }).click();
  await screen.getByText("Description").click();
  expect(getComputedStyle(slot("record-panel")!).display).toBe("none");
});

test("docked, Escape leaves the panel open", async () => {
  await page.viewport(1440, 900);
  await render(<Record width={1300} />);
  await userEvent.keyboard("{Escape}");
  expect(getComputedStyle(slot("record-panel")!).display).toBe("flex");
});

test("sections fold on their header and report each fold; an app's fold state wins over defaultOpen", async () => {
  await page.viewport(1440, 900);
  const folds: [string, boolean][] = [];
  function Folding() {
    const [sections, setSections] = React.useState<Record<string, boolean>>({
      files: false,
    });
    return (
      <Record
        width={1300}
        sections={sections}
        onSectionOpenChange={(value, open) => {
          folds.push([value, open]);
          setSections((s) => ({ ...s, [value]: open }));
        }}
      />
    );
  }
  const screen = await render(<Folding />);
  const files = screen.getByRole("button", { name: "Files 1", exact: true });
  expect(files.element()).toHaveAttribute("aria-expanded", "false");
  await files.click();
  expect(files.element()).toHaveAttribute("aria-expanded", "true");
  await screen.getByRole("button", { name: "Details", exact: true }).click();
  expect(folds).toEqual([
    ["files", true],
    ["details", false],
  ]);
});

test("a section is 40px tall at rest, its key column 92px and its rows at least 30px", async () => {
  await page.viewport(1440, 900);
  await render(<Record width={1300} />);
  expect(
    Math.round(
      slot("record-panel-section-header")!.getBoundingClientRect().height,
    ),
  ).toBe(40);
  const label = slot("property-label")!.getBoundingClientRect();
  expect(Math.round(label.width)).toBe(92);
  const row = slot("property-row")!.getBoundingClientRect();
  expect(Math.round(row.height)).toBeGreaterThanOrEqual(30);
  // The section's rows sit 16px in from the panel's edge.
  const panel = slot("record-panel")!.getBoundingClientRect();
  expect(Math.round(label.left - panel.left)).toBe(16 + 1);
});

test("on a phone the Details button opens the sections as a sheet; the remembered choice never pops one", async () => {
  await page.viewport(390, 844);
  const changes: boolean[] = [];
  const screen = await render(
    <Record width={390} open onOpenChange={(o) => changes.push(o)} />,
  );
  expect(slot("peek-sheet")).toBeNull();
  await screen.getByRole("button", { name: "Details", exact: true }).click();
  const sheet = slot("peek-sheet")!;
  expect(sheet.textContent).toContain("Asha Rao");
  await screen.getByText("Asha Rao").click();
  expect(slot("peek-sheet")).not.toBeNull();
  expect(changes).toEqual([]);
  await expectNoA11yViolations(document.body);
  await page.viewport(1440, 900);
});

test("a page's reveal shows a hidden panel and opens a folded section, remembering both", async () => {
  await page.viewport(1440, 900);
  const opens: boolean[] = [];
  const folds: [string, boolean][] = [];
  const screen = await render(
    <Record
      width={1300}
      defaultOpen={false}
      sections={{ files: false }}
      onOpenChange={(o) => opens.push(o)}
      onSectionOpenChange={(v, o) => folds.push([v, o])}
    />,
  );
  expect(getComputedStyle(slot("record-panel")!).display).toBe("none");
  await screen.getByRole("button", { name: "Show files" }).click();
  expect(getComputedStyle(slot("record-panel")!).display).toBe("flex");
  expect(opens).toEqual([true]);
  expect(folds).toEqual([["files", true]]);
});

test("focus in a floating panel goes back to ▥ when the record grows wide enough to dock", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Record width={1000} defaultOpen={false} />);
  await screen.getByRole("button", { name: "Show details" }).click();
  expect(document.activeElement?.getAttribute("data-slot")).toBe(
    "record-panel",
  );
  await screen.rerender(<Record width={1300} defaultOpen={false} />);
  await frames();
  await frames();
  expect(getComputedStyle(slot("record-panel")!).display).toBe("none");
  expect(document.activeElement?.getAttribute("data-slot")).toBe(
    "record-panel-toggle",
  );
});
