import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Dropzone } from "./dropzone";
import { useFileDrop, type FileDropRejection } from "./use-file-drop";

function makeFile(name: string, type = "image/png", size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

function surface(): HTMLElement {
  return document.querySelector('[data-slot="dropzone"]') as HTMLElement;
}

async function dropFiles(target: HTMLElement, files: File[]) {
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

test("renders the drop surface with a REAL named file input as the control", async () => {
  const screen = await render(
    <Dropzone aria-label="Upload images" onFilesAccepted={() => {}}>
      <p>Drop images here</p>
    </Dropzone>,
  );
  const input = document.querySelector(
    '[data-slot="dropzone"] input[type="file"]',
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  expect(input.getAttribute("aria-label")).toBe("Upload images");
  await expect
    .element(screen.getByText("Drop images here"))
    .toBeInTheDocument();
});

test("dropping files calls onFilesAccepted and announces", async () => {
  const onFilesAccepted = vi.fn();
  await render(
    <Dropzone onFilesAccepted={onFilesAccepted}>
      <p>Drop here</p>
    </Dropzone>,
  );
  await dropFiles(surface(), [makeFile("shot.png")]);
  await expect.poll(() => onFilesAccepted.mock.calls.length).toBe(1);
  expect(onFilesAccepted.mock.calls[0]![0][0].name).toBe("shot.png");
  const live = document.querySelector('[role="status"]')!;
  await expect.poll(() => live.textContent).toContain("Added shot.png");
});

test("rejections carry typed reasons (file-too-large) and announce", async () => {
  const onFilesRejected = vi.fn();
  await render(
    <Dropzone
      maxSize={100}
      onFilesAccepted={() => {}}
      onFilesRejected={onFilesRejected}
    >
      <p>Drop here</p>
    </Dropzone>,
  );
  await dropFiles(surface(), [makeFile("huge.png", "image/png", 10_000)]);
  await expect.poll(() => onFilesRejected.mock.calls.length).toBe(1);
  const rejections = onFilesRejected.mock.calls[0]![0] as FileDropRejection[];
  expect(rejections[0]!.reasons).toContain("file-too-large");
  const live = document.querySelector('[role="status"]')!;
  await expect.poll(() => live.textContent).toContain("was refused");
});

test("browsing via the input change path accepts files", async () => {
  const onFilesAccepted = vi.fn();
  await render(
    <Dropzone onFilesAccepted={onFilesAccepted}>
      <p>Drop here</p>
    </Dropzone>,
  );
  const input = document.querySelector(
    '[data-slot="dropzone"] input[type="file"]',
  ) as HTMLInputElement;
  const dt = new DataTransfer();
  dt.items.add(makeFile("chosen.png"));
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await expect.poll(() => onFilesAccepted.mock.calls.length).toBe(1);
  expect(onFilesAccepted.mock.calls[0]![0][0].name).toBe("chosen.png");
});

test("pasting files inside the surface acquires them (the composer path)", async () => {
  const onFilesAccepted = vi.fn();
  await render(
    <Dropzone onFilesAccepted={onFilesAccepted}>
      <p>Drop here</p>
    </Dropzone>,
  );
  const dt = new DataTransfer();
  dt.items.add(makeFile("pasted.png"));
  surface().dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
    }),
  );
  await expect.poll(() => onFilesAccepted.mock.calls.length).toBe(1);
  expect(onFilesAccepted.mock.calls[0]![0][0].name).toBe("pasted.png");
});

test("data-dragging flips while a drag is over the surface", async () => {
  await render(
    <Dropzone onFilesAccepted={() => {}}>
      <p>Drop here</p>
    </Dropzone>,
  );
  const dt = new DataTransfer();
  dt.items.add(makeFile("x.png"));
  surface().dispatchEvent(
    new DragEvent("dragenter", {
      bubbles: true,
      cancelable: true,
      dataTransfer: dt,
    }),
  );
  await expect.poll(() => surface().hasAttribute("data-dragging")).toBe(true);
  surface().dispatchEvent(
    new DragEvent("dragleave", {
      bubbles: true,
      cancelable: true,
      dataTransfer: dt,
    }),
  );
  await expect.poll(() => surface().hasAttribute("data-dragging")).toBe(false);
});

test("disabled ignores drops and dims the surface", async () => {
  const onFilesAccepted = vi.fn();
  await render(
    <Dropzone disabled onFilesAccepted={onFilesAccepted}>
      <p>Drop here</p>
    </Dropzone>,
  );
  expect(surface().hasAttribute("data-disabled")).toBe(true);
  await dropFiles(surface(), [makeFile("x.png")]);
  await new Promise((r) => setTimeout(r, 40));
  expect(onFilesAccepted).not.toHaveBeenCalled();
});

test("the hook alone powers a chrome-less consumer (rich-text composer path)", async () => {
  const onFilesAccepted = vi.fn();
  function Composer() {
    const drop = useFileDrop({ onFilesAccepted });
    return (
      <div>
        <div data-testid="composer" {...drop.dropProps}>
          <input {...drop.inputProps} aria-label="Attach" />
          <p>Write something…</p>
        </div>
        <span {...drop.getLiveRegionProps()} />
      </div>
    );
  }
  const screen = await render(<Composer />);
  const composer = screen.getByTestId("composer").element() as HTMLElement;
  await dropFiles(composer, [makeFile("inline.png")]);
  await expect.poll(() => onFilesAccepted.mock.calls.length).toBe(1);
});

test("ref forwards to the drop surface", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Dropzone ref={ref} onFilesAccepted={() => {}}>
      <p>x</p>
    </Dropzone>,
  );
  expect(ref.current?.dataset.slot).toBe("dropzone");
});

test("focus indicator: the input is focusable and nothing strips the outline", async () => {
  await render(
    <Dropzone onFilesAccepted={() => {}}>
      <p>Drop here</p>
    </Dropzone>,
  );
  const offenders = Array.from(document.querySelectorAll("*")).filter(
    (el) =>
      (el.getAttribute("class") ?? "").includes("outline-none") &&
      !["INPUT", "TEXTAREA"].includes(el.tagName),
  );
  const focusable = offenders.filter((el) =>
    el.matches("button, a, [tabindex]"),
  );
  expect(focusable).toEqual([]);
});

test("no a11y violations — idle and disabled", async () => {
  const screen = await render(
    <div>
      <Dropzone onFilesAccepted={() => {}} aria-label="Upload files">
        <p>Drop files here or click to browse</p>
      </Dropzone>
      <Dropzone disabled onFilesAccepted={() => {}} aria-label="Upload locked">
        <p>Uploads locked</p>
      </Dropzone>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
