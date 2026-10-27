/**
 * `block-toolbar.test.tsx` — a block's controls in its top-right corner: a named group of 28px
 * buttons (each named and tipped by its label), a ⋯ menu for the rest, and a hover reveal.
 */

import "../../test/geometry.css"; // compiled Tailwind + @vegastack token theme
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { Copy, Download } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { DropdownMenuItem } from "./dropdown-menu";
import {
  BlockToolbar,
  BlockToolbarButton,
  BlockToolbarMenu,
} from "./block-toolbar";

test("a named group of 28px buttons in the block's top-right corner, and a ⋯ menu", async () => {
  const onCopy = vi.fn();
  const onDownload = vi.fn();
  const screen = await render(
    <figure className="group/block relative h-40 w-80 border">
      <BlockToolbar aria-label="Code block actions">
        <BlockToolbarButton label="Copy code" onClick={onCopy}>
          <Copy />
        </BlockToolbarButton>
        <BlockToolbarMenu label="More code actions">
          <DropdownMenuItem onClick={onDownload}>
            <Download />
            Download
          </DropdownMenuItem>
        </BlockToolbarMenu>
      </BlockToolbar>
    </figure>,
  );
  const group = screen.getByRole("group", { name: "Code block actions" });
  await expect.element(group).toBeInTheDocument();
  const copy = screen.getByRole("button", { name: "Copy code" });
  const box = copy.element().getBoundingClientRect();
  expect(box.width).toBe(28);
  expect(box.height).toBe(28);
  const frame = screen.container
    .querySelector("figure")!
    .getBoundingClientRect();
  const bar = group.element().getBoundingClientRect();
  // Top-right corner, 6px in.
  expect(Math.round(frame.right - bar.right)).toBe(7);
  expect(Math.round(bar.top - frame.top)).toBe(7);
  await copy.click();
  expect(onCopy).toHaveBeenCalledOnce();
  await screen.getByRole("button", { name: "More code actions" }).click();
  await screen.getByRole("menuitem", { name: "Download" }).click();
  expect(onDownload).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test('reveal="hover": hidden until the block is hovered or holds focus; placement="inline" sits in a row', async () => {
  const screen = await render(
    <div>
      <figure data-testid="block" className="group/block relative h-20 w-60">
        <BlockToolbar aria-label="Image actions" reveal="hover">
          <BlockToolbarButton label="Open">
            <Copy />
          </BlockToolbarButton>
        </BlockToolbar>
      </figure>
      <div className="flex">
        <BlockToolbar aria-label="Diagram actions" placement="inline">
          <BlockToolbarButton label="Expand">
            <Copy />
          </BlockToolbarButton>
        </BlockToolbar>
      </div>
    </div>,
  );
  const hover = screen.getByRole("group", { name: "Image actions" }).element();
  expect(getComputedStyle(hover).opacity).toBe("0");
  await userEvent.hover(screen.getByTestId("block"));
  await vi.waitFor(() => expect(getComputedStyle(hover).opacity).toBe("1"));
  const inline = screen
    .getByRole("group", { name: "Diagram actions" })
    .element();
  expect(getComputedStyle(inline).position).toBe("static");
  expect(inline.getAttribute("data-placement")).toBe("inline");
});
