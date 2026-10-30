import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Input } from "./input";
import {
  FloatingCellEditor,
  floatingCellEditorSize,
  type FloatingCellEditorProps,
} from "./floating-cell-editor";

function Cell(props: Partial<FloatingCellEditorProps> & { width?: number }) {
  const { width = 120, ...rest } = props;
  return (
    <table>
      <tbody>
        <tr>
          <td
            data-slot="data-grid-cell"
            style={{ width, minWidth: width, height: 32, padding: 0 }}
          >
            <FloatingCellEditor face={<span>Resting face</span>} {...rest}>
              <Input aria-label="Name" defaultValue="Acme" />
            </FloatingCellEditor>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const var_ = (name: string) =>
  document
    .querySelector<HTMLElement>(`[data-slot="popover-content"]`)
    ?.style.getPropertyValue(name);

test("the cell keeps its face; the editor floats at the cell's rect, 2px past it, at least as tall", async () => {
  const screen = await render(<Cell width={120} />);
  await expect.element(screen.getByText("Resting face")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("textbox", { name: "Name" }))
    .toBeInTheDocument();
  const cell = document.querySelector("td")!.getBoundingClientRect();
  const anchor = document.querySelector<HTMLElement>(
    '[class*="--anchor-top"]',
  )!;
  expect(
    Number.parseFloat(anchor.style.getPropertyValue("--anchor-left")),
  ).toBe(cell.left - 2);
  expect(Number.parseFloat(anchor.style.getPropertyValue("--anchor-top"))).toBe(
    cell.top - 2,
  );
  expect(var_("--editor-min-height")).toBe(`${cell.height + 4}px`);
  expect(var_("--editor-width")).toBe(`${cell.width + 4}px`);
  await expectNoA11yViolations(document.body);
});

test("width follows the size — text 280, wide 340, picker 184, never past 480 — and the type picks the size", async () => {
  const screen = await render(<Cell size="text" width={100} />);
  await expect.poll(() => var_("--editor-width")).toBe("280px");
  await screen.rerender(<Cell size="wide" width={100} />);
  await expect.poll(() => var_("--editor-width")).toBe("340px");
  await screen.rerender(<Cell size="picker" width={100} />);
  await expect.poll(() => var_("--editor-width")).toBe("184px");
  await screen.rerender(<Cell size="text" width={700} />);
  window.dispatchEvent(new Event("resize"));
  await expect.poll(() => var_("--editor-width")).toBe("480px");
  expect(floatingCellEditorSize("text")).toBe("text");
  expect(floatingCellEditorSize("datetime")).toBe("wide");
  expect(floatingCellEditorSize("file")).toBe("wide");
  expect(floatingCellEditorSize("person")).toBe("text");
  expect(floatingCellEditorSize("long_text")).toBe("wide");
  expect(floatingCellEditorSize("single_choice")).toBe("picker");
  expect(floatingCellEditorSize("number")).toBe("cell");
});

test("the lock takes the wheel but lets a pinch through, and a press ends it only after it has settled", async () => {
  const onDismiss = vi.fn();
  await render(<Cell onDismiss={onDismiss} />);
  const lock = await vi.waitUntil(() =>
    document.querySelector<HTMLElement>(
      '[data-slot="floating-cell-editor-lock"]',
    ),
  );
  const wheel = new WheelEvent("wheel", { cancelable: true, bubbles: true });
  lock.dispatchEvent(wheel);
  expect(wheel.defaultPrevented).toBe(true);
  const pinch = new WheelEvent("wheel", {
    cancelable: true,
    bubbles: true,
    ctrlKey: true,
  });
  lock.dispatchEvent(pinch);
  expect(pinch.defaultPrevented).toBe(false);
  const press = () =>
    lock.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  // The second press of the double-click that opened the editor is not a dismissal.
  press();
  expect(onDismiss).not.toHaveBeenCalled();
  await new Promise((resolve) => setTimeout(resolve, 400));
  press();
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test("the editor follows its cell when the window is resized", async () => {
  const screen = await render(<Cell width={100} />);
  await expect.poll(() => var_("--editor-width")).toBe("104px");
  screen.container.querySelector("td")!.style.width = "200px";
  window.dispatchEvent(new Event("resize"));
  await expect.poll(() => var_("--editor-width")).toBe("204px");
});
