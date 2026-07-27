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

test("the surface is the named focusable control; the input is the hidden bridge", async () => {
  const screen = await render(
    <Dropzone aria-label="Upload images" onFilesAccepted={() => {}}>
      <p>Drop images here</p>
    </Dropzone>,
  );
  const root = surface();
  expect(root.getAttribute("role")).toBe("button");
  expect(root.getAttribute("aria-label")).toBe("Upload images");
  expect(root.getAttribute("tabindex")).toBe("0");
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  expect(input.tabIndex).toBe(-1);
  await expect
    .element(screen.getByText("Drop images here"))
    .toBeInTheDocument();
});

test("Enter and Space on the focused surface open the file browser", async () => {
  await render(
    <Dropzone onFilesAccepted={() => {}}>
      <p>Drop here</p>
    </Dropzone>,
  );
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const clicks = vi.fn();
  input.addEventListener("click", (event) => {
    event.preventDefault();
    clicks();
  });
  surface().focus();
  expect(document.activeElement).toBe(surface());
  surface().dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
  await expect.poll(() => clicks.mock.calls.length).toBe(1);
  surface().dispatchEvent(
    new KeyboardEvent("keydown", { key: " ", bubbles: true }),
  );
  await expect.poll(() => clicks.mock.calls.length).toBe(2);
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
    'input[type="file"]',
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

test("data-dragging survives crossing a CHILD (drag-depth counting) and ends on a root leave", async () => {
  const screen = await render(
    <Dropzone onFilesAccepted={() => {}}>
      <p>Drop here</p>
    </Dropzone>,
  );
  const child = screen.getByText("Drop here").element() as HTMLElement;
  const dt = new DataTransfer();
  dt.items.add(makeFile("x.png"));
  const drag = (target: HTMLElement, type: string) =>
    target.dispatchEvent(
      new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      }),
    );
  drag(surface(), "dragenter");
  await expect.poll(() => surface().hasAttribute("data-dragging")).toBe(true);
  // Entering a child fires dragleave on the root — the engine's depth
  // counting (gated on its root ref) must keep the state ON.
  drag(child, "dragenter");
  drag(surface(), "dragleave");
  await new Promise((r) => setTimeout(r, 30));
  expect(surface().hasAttribute("data-dragging")).toBe(true);
  // Leaving the child, then the root, ends the drag.
  drag(child, "dragleave");
  drag(surface(), "dragleave");
  await expect.poll(() => surface().hasAttribute("data-dragging")).toBe(false);
});

test("paste enforces accept: a PDF pasted into an image-only dropzone is refused with the reason", async () => {
  const onFilesAccepted = vi.fn();
  const onFilesRejected = vi.fn();
  await render(
    <Dropzone
      accept={{ "image/*": [".png", ".jpg"] }}
      onFilesAccepted={onFilesAccepted}
      onFilesRejected={onFilesRejected}
    >
      <p>Drop here</p>
    </Dropzone>,
  );
  const dt = new DataTransfer();
  dt.items.add(makeFile("secret.pdf", "application/pdf"));
  surface().dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
    }),
  );
  await expect.poll(() => onFilesRejected.mock.calls.length).toBe(1);
  const rejections = onFilesRejected.mock.calls[0]![0] as FileDropRejection[];
  expect(rejections[0]!.reasons).toContain("file-invalid-type");
  expect(onFilesAccepted).not.toHaveBeenCalled();
  const live = document.querySelector('[role="status"]')!;
  await expect.poll(() => live.textContent).toContain("wrong type");
});

test("single-file paste refuses the surplus as too-many-files instead of dropping it silently", async () => {
  const onFilesAccepted = vi.fn();
  const onFilesRejected = vi.fn();
  await render(
    <Dropzone
      multiple={false}
      onFilesAccepted={onFilesAccepted}
      onFilesRejected={onFilesRejected}
    >
      <p>Drop here</p>
    </Dropzone>,
  );
  const dt = new DataTransfer();
  dt.items.add(makeFile("a.png"));
  dt.items.add(makeFile("b.png"));
  dt.items.add(makeFile("c.png"));
  surface().dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
    }),
  );
  await expect.poll(() => onFilesAccepted.mock.calls.length).toBe(1);
  expect(onFilesAccepted.mock.calls[0]![0]).toHaveLength(1);
  expect(onFilesRejected).toHaveBeenCalledTimes(1);
  const rejections = onFilesRejected.mock.calls[0]![0] as FileDropRejection[];
  expect(rejections).toHaveLength(2);
  expect(rejections.every((r) => r.reasons.includes("too-many-files"))).toBe(
    true,
  );
});

test("preventWindowDrop={false} actually opts out of the document-level cancellation", async () => {
  await render(
    <Dropzone preventWindowDrop={false} onFilesAccepted={() => {}}>
      <p>Drop here</p>
    </Dropzone>,
  );
  await new Promise((r) => setTimeout(r, 20));
  const dt = new DataTransfer();
  dt.items.add(makeFile("x.png"));
  const outside = new DragEvent("dragover", {
    bubbles: true,
    cancelable: true,
    dataTransfer: dt,
  });
  document.body.dispatchEvent(outside);
  expect(outside.defaultPrevented).toBe(false);
});

test("open() is a safe no-op while disabled", async () => {
  function Probe() {
    const drop = useFileDrop({ onFilesAccepted: () => {}, disabled: true });
    return (
      <button type="button" onClick={() => drop.open()}>
        browse
      </button>
    );
  }
  const screen = await render(<Probe />);
  await screen.getByRole("button", { name: "browse" }).click();
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

test("focus lands on the surface via keyboard and nothing strips its outline", async () => {
  await render(
    <Dropzone onFilesAccepted={() => {}}>
      <p>Drop here</p>
    </Dropzone>,
  );
  surface().focus();
  expect(document.activeElement).toBe(surface());
  // The global :focus-visible outline must be able to reach the surface.
  expect((surface().getAttribute("class") ?? "").includes("outline-none")).toBe(
    false,
  );
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
