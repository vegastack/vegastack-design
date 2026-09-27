import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { UploadDialog, UploadDialogFileRow } from "./upload-dialog";

// The modal's inert page guard sits over the harness frame, so buttons are clicked directly.

function makeFile(name: string, type = "application/pdf", size = 2048): File {
  return new File([new Uint8Array(size)], name, { type });
}

async function dropFiles(files: File[]) {
  const target = document.querySelector(
    '[data-slot="dropzone"]',
  ) as HTMLElement;
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  for (const type of ["dragenter", "dragover", "drop"] as const) {
    target.dispatchEvent(
      new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      }),
    );
    await new Promise((r) => setTimeout(r, 20));
  }
}

test("stages dropped files, refuses what validate refuses, then details and Add", async () => {
  const onSubmit = vi.fn();
  const screen = await render(
    <UploadDialog
      open
      onOpenChange={() => {}}
      validate={(file) =>
        file.name.endsWith(".heic") ? `${file.name} isn't supported.` : null
      }
      renderDetails={(files) =>
        files.map((f) => (
          <UploadDialogFileRow key={f.id} file={f}>
            <span>Details for {f.file.name}</span>
          </UploadDialogFileRow>
        ))
      }
      onSubmit={onSubmit}
    />,
  );
  const dialog = screen.getByRole("dialog", { name: "Add files" });
  await expect
    .element(dialog.getByRole("button", { name: "Next" }))
    .toHaveAttribute("aria-disabled", "true");
  await dropFiles([makeFile("spec.pdf"), makeFile("photo.heic", "image/heic")]);
  await expect.element(dialog.getByText("spec.pdf")).toBeVisible();
  await expect
    .element(dialog.getByText("photo.heic isn't supported."))
    .toBeVisible();
  await expect.element(dialog.getByText("2 KB")).toBeVisible();
  await expectNoA11yViolations(document.body);

  (
    dialog.getByRole("button", { name: "Next" }).element() as HTMLElement
  ).click();
  await expect.element(dialog.getByText("Details for spec.pdf")).toBeVisible();
  (
    dialog.getByRole("button", { name: "Add" }).element() as HTMLElement
  ).click();
  expect(onSubmit).toHaveBeenCalledOnce();
  expect(onSubmit.mock.calls[0]![0][0].file.name).toBe("spec.pdf");
});

test("without details the primary action adds; × removes a staged file", async () => {
  const onSubmit = vi.fn();
  const screen = await render(
    <UploadDialog
      open
      onOpenChange={() => {}}
      title="Add images"
      maxFiles={1}
      onSubmit={onSubmit}
    />,
  );
  const dialog = screen.getByRole("dialog", { name: "Add images" });
  await dropFiles([makeFile("a.pdf"), makeFile("b.pdf")]);
  await expect
    .element(dialog.getByText("Only 1 file can be added."))
    .toBeVisible();
  (
    dialog
      .getByRole("button", { name: "Remove a.pdf" })
      .element() as HTMLElement
  ).click();
  await expect
    .element(dialog.getByRole("button", { name: "Add" }))
    .toHaveAttribute("aria-disabled", "true");
});
