import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { FileViewer, type FileViewerItem } from "./file-viewer";

const PIXEL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="gray"/></svg>',
  );

const ITEMS: FileViewerItem[] = [
  {
    id: "a",
    name: "kitchen.jpg",
    contentType: "image/svg+xml",
    src: PIXEL,
    thumb: { src: PIXEL, blur: PIXEL },
    downloadHref: "/download/a",
  },
  {
    id: "b",
    name: "spec-sheet.docx",
    contentType: "application/msword",
    size: 2_516_582,
    downloadHref: "/download/b",
  },
];

function Harness({ initial = null }: { initial?: number | null }) {
  const [index, setIndex] = React.useState<number | null>(initial);
  return (
    <>
      <button type="button" onClick={() => setIndex(0)}>
        Open gallery
      </button>
      <FileViewer
        items={ITEMS}
        index={index}
        onIndexChange={setIndex}
        onOpenChange={(open) => !open && setIndex(null)}
      />
    </>
  );
}

test("renders a dialog named by the file, with the count, download and close", async () => {
  const screen = await render(<Harness initial={0} />);
  const dialog = screen.getByRole("dialog", { name: "kitchen.jpg" });
  await expect.element(dialog).toBeVisible();
  await expect.element(screen.getByText("1 of 2")).toBeVisible();
  const download = screen
    .getByRole("link", { name: "Download kitchen.jpg" })
    .element();
  expect(download.getAttribute("href")).toBe("/download/a");
  expect(download.hasAttribute("download")).toBe(true);
  await expect
    .element(screen.getByRole("button", { name: "Close" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body);
});

test("arrow keys page, the file card shows the size, Escape closes and focus returns", async () => {
  const screen = await render(<Harness />);
  const opener = screen.getByRole("button", { name: "Open gallery" });
  await opener.click();
  await expect
    .element(screen.getByRole("dialog", { name: "kitchen.jpg" }))
    .toBeVisible();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .element(screen.getByRole("dialog", { name: "spec-sheet.docx" }))
    .toBeVisible();
  await expect.element(screen.getByText("2.4 MB")).toBeVisible();
  await expect.element(screen.getByText("File 2 of 2")).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.querySelector("[role=dialog]")).toBeNull();
  expect(document.activeElement).toBe(opener.element());
});
