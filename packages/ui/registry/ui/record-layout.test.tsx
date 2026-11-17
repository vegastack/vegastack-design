import "../../test/geometry.css";
import * as React from "react";
import { Info, Paperclip } from "lucide-react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  RecordLayout,
  RecordLayoutMain,
  RecordLayoutPanel,
  RecordLayoutSide,
  RecordLayoutStrip,
  RecordLayoutStripItem,
  RecordLayoutStripSlot,
} from "./record-layout";

test("the main column takes the whole width of the layout", async () => {
  const screen = await render(
    <div style={{ width: 900 }}>
      <RecordLayout>
        <RecordLayoutMain>
          <h1>Weekly sync</h1>
        </RecordLayoutMain>
      </RecordLayout>
    </div>,
  );
  const main = screen.container.querySelector<HTMLElement>(
    "[data-slot=record-layout-main]",
  )!;
  expect(Math.round(main.getBoundingClientRect().width)).toBe(900);
  await expectNoA11yViolations(screen.container);
});

function RecordWithPanels({
  width,
  defaultPanel = null,
  onPanel,
}: {
  width: number;
  defaultPanel?: string | null;
  onPanel?: (panel: string | null) => void;
}) {
  const [panelWidth, setPanelWidth] = React.useState(380);
  return (
    <div style={{ width }}>
      <RecordLayout>
        <RecordLayoutMain>
          <h1>Weekly sync</h1>
          <RecordLayoutStripSlot />
          <p>Description</p>
        </RecordLayoutMain>
        <RecordLayoutSide
          defaultPanel={defaultPanel}
          onPanelChange={onPanel}
          panelWidth={panelWidth}
          onPanelWidthChange={setPanelWidth}
        >
          <RecordLayoutPanel value="details" title="Details">
            <p>Owner</p>
          </RecordLayoutPanel>
          <RecordLayoutPanel value="files" title="Files">
            <input aria-label="Find a file" />
          </RecordLayoutPanel>
          <RecordLayoutStrip>
            <RecordLayoutStripItem
              value="details"
              label="Details"
              icon={<Info />}
            />
            <RecordLayoutStripItem
              value="files"
              label="Files"
              icon={<Paperclip />}
              count={3}
            />
          </RecordLayoutStrip>
        </RecordLayoutSide>
      </RecordLayout>
    </div>
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot='${name}']`);

test("the strip opens one panel at a time, a second click closes it, and each change is reported", async () => {
  await page.viewport(1440, 900);
  const changes: (string | null)[] = [];
  const screen = await render(
    <RecordWithPanels width={1300} onPanel={(p) => changes.push(p)} />,
  );
  expect(slot("record-layout-panel")).toBeNull();
  await screen.getByRole("button", { name: "Details" }).click();
  expect(
    slot("record-layout-panel")!.getAttribute("aria-labelledby"),
  ).toBeTruthy();
  await screen.getByRole("button", { name: "Files, 3" }).click();
  expect(
    document.querySelectorAll("[data-slot='record-layout-panel']").length,
  ).toBe(1);
  expect(
    screen
      .getByRole("button", { name: "Files, 3" })
      .element()
      .getAttribute("aria-expanded"),
  ).toBe("true");
  await screen.getByRole("button", { name: "Files, 3" }).click();
  expect(slot("record-layout-panel")).toBeNull();
  expect(changes).toEqual(["details", "files", null]);
  await expectNoA11yViolations(screen.container);
});

test("from 1200px the panel docks beside the main column, which narrows; the default plays no motion", async () => {
  await page.viewport(1440, 900);
  await render(<RecordWithPanels width={1300} defaultPanel="details" />);
  const panel = slot("record-layout-panel")!;
  expect(panel.hasAttribute("data-motion")).toBe(false);
  expect(getComputedStyle(panel).position).not.toBe("absolute");
  const main = slot("record-layout-main")!.getBoundingClientRect();
  expect(Math.round(main.width)).toBe(1300 - 380 - 44);
  expect(Math.round(panel.getBoundingClientRect().left)).toBe(
    Math.round(main.right),
  );
});

test("below 1200px the panel floats over the main column, and Escape closes it", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<RecordWithPanels width={1100} />);
  await screen.getByRole("button", { name: "Details" }).click();
  const panel = slot("record-layout-panel")!;
  expect(panel.getAttribute("data-motion")).toBe("enter");
  expect(getComputedStyle(panel).position).toBe("absolute");
  expect(
    Math.round(slot("record-layout-main")!.getBoundingClientRect().width),
  ).toBe(1100 - 44);
  await userEvent.keyboard("{Escape}");
  expect(slot("record-layout-panel")).toBeNull();
});

test("docked beside the page, Escape leaves the panel open", async () => {
  await page.viewport(1440, 900);
  await render(<RecordWithPanels width={1300} defaultPanel="details" />);
  await userEvent.keyboard("{Escape}");
  expect(slot("record-layout-panel")).not.toBeNull();
});

test("the panel resizes by keys from 320px", async () => {
  await page.viewport(1440, 900);
  await render(<RecordWithPanels width={1300} defaultPanel="details" />);
  const handle = slot("peek-resize-handle")!;
  handle.focus();
  await userEvent.keyboard("{Home}");
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  );
  expect(
    Math.round(slot("record-layout-panel")!.getBoundingClientRect().width),
  ).toBe(320);
});

test("on a phone the strip is a row under the header, and each button opens its panel as a sheet", async () => {
  await page.viewport(390, 844);
  const changes: (string | null)[] = [];
  const screen = await render(
    <RecordWithPanels
      width={390}
      defaultPanel="files"
      onPanel={(p) => changes.push(p)}
    />,
  );
  // A type's default never pops a sheet over the page on load.
  expect(slot("peek-sheet")).toBeNull();
  const row = slot("record-layout-strip")!;
  expect(row.getAttribute("data-orientation")).toBe("horizontal");
  expect(row.parentElement!.getAttribute("data-slot")).toBe(
    "record-layout-strip-slot",
  );
  await screen.getByRole("button", { name: /Details/ }).click();
  const sheet = slot("peek-sheet")!;
  expect(sheet.textContent).toContain("Owner");
  // A tap inside never closes it.
  await screen.getByText("Owner").click();
  expect(slot("peek-sheet")).not.toBeNull();
  // A phone sheet never changes the remembered panel.
  expect(changes).toEqual([]);
  await expectNoA11yViolations(document.body);
  await page.viewport(1440, 900);
});
