import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import {
  useFileDrop,
  type FileDropRejection,
  type UseFileDropOptions,
} from "./use-file-drop";

/* ---------------------------------------------------------------------------------------------
 * `use-file-drop` had NO suite of its own: the paste path, `accept` matching, directory
 * traversal and `maxSize` rejections were only ever exercised through `dropzone`, so the hook's
 * contract was proved only in the one composition that happens to use it. This file exercises
 * the hook DIRECTLY, on a bare element with no shell — which is what a consumer composing it
 * into a chat composer or a settings avatar field actually gets.
 * ------------------------------------------------------------------------------------------- */

function makeFile(name: string, type = "image/png", size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

/**
 * Synthetic `ClipboardEvent`s carry no files in some engines (`clipboardData` arrives with 0
 * items), so the paste scenario cannot be EXPRESSED there. That is a harness capability, not a
 * product branch — the same guard `dropzone.test.tsx` uses.
 */
function syntheticClipboardFilesSupported(): boolean {
  const dt = new DataTransfer();
  try {
    dt.items.add(makeFile("probe.png"));
  } catch {
    return false;
  }
  return (
    (new ClipboardEvent("paste", { clipboardData: dt }).clipboardData?.files
      ?.length ?? 0) > 0
  );
}
const pasteTest = test.skipIf(!syntheticClipboardFilesSupported());

/** A bare surface — no Dropzone, no styling: just the hook's own props. */
function Probe(options: UseFileDropOptions) {
  const drop = useFileDrop(options);
  return (
    <div>
      <div data-testid="surface" {...drop.dropProps}>
        <input data-testid="picker" {...drop.inputProps} />
      </div>
      <span data-testid="dragging">{String(drop.isDragging)}</span>
      <drop.Announcer data-testid="live" />
    </div>
  );
}

function surface(screen: {
  getByTestId: (id: string) => { element: () => Element };
}) {
  return screen.getByTestId("surface").element() as HTMLElement;
}

function pasteFiles(target: HTMLElement, files: File[]) {
  const dt = new DataTransfer();
  for (const file of files) dt.items.add(file);
  target.dispatchEvent(
    new ClipboardEvent("paste", {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/* -------------------------------------------------------------------------------------------
 * The paste path — the hook's own addition. No drop library treats a pasted screenshot as
 * acquisition, even though a composer must.
 * ----------------------------------------------------------------------------------------- */

pasteTest("paste acquires files and announces the batch", async () => {
  const onFilesAccepted = vi.fn();
  const screen = await render(<Probe onFilesAccepted={onFilesAccepted} />);
  pasteFiles(surface(screen), [makeFile("shot.png")]);

  await vi.waitFor(() => expect(onFilesAccepted).toHaveBeenCalledTimes(1));
  expect(onFilesAccepted.mock.calls[0]![0].map((f: File) => f.name)).toEqual([
    "shot.png",
  ]);
  await expect
    .element(screen.getByTestId("live"))
    .toHaveTextContent("Added shot.png");
});

pasteTest(
  "paste enforces `accept` with the file-invalid-type reason",
  async () => {
    const onFilesAccepted = vi.fn();
    const onFilesRejected = vi.fn();
    const screen = await render(
      <Probe
        onFilesAccepted={onFilesAccepted}
        onFilesRejected={onFilesRejected}
        accept={{ "image/*": [".png", ".jpg"] }}
      />,
    );
    pasteFiles(surface(screen), [makeFile("notes.pdf", "application/pdf")]);

    await vi.waitFor(() => expect(onFilesRejected).toHaveBeenCalledTimes(1));
    expect(onFilesAccepted).not.toHaveBeenCalled();
    const rejections: FileDropRejection[] = onFilesRejected.mock.calls[0]![0];
    expect(rejections[0]!.file.name).toBe("notes.pdf");
    expect(rejections[0]!.reasons).toEqual(["file-invalid-type"]);
  },
);

pasteTest(
  "`accept` matches on EXTENSION as well as MIME, like the picker",
  async () => {
    const onFilesAccepted = vi.fn();
    const screen = await render(
      <Probe
        onFilesAccepted={onFilesAccepted}
        accept={{ "application/octet-stream": [".log"] }}
      />,
    );
    // Empty MIME is what a clipboard/OS often hands over — the extension has to carry it.
    pasteFiles(surface(screen), [makeFile("server.log", "")]);
    await vi.waitFor(() => expect(onFilesAccepted).toHaveBeenCalledTimes(1));
  },
);

pasteTest("paste enforces maxSize per file, not per batch", async () => {
  const onFilesAccepted = vi.fn();
  const onFilesRejected = vi.fn();
  const screen = await render(
    <Probe
      onFilesAccepted={onFilesAccepted}
      onFilesRejected={onFilesRejected}
      maxSize={2048}
    />,
  );
  pasteFiles(surface(screen), [
    makeFile("small.png", "image/png", 512),
    makeFile("huge.png", "image/png", 9000),
  ]);

  await vi.waitFor(() => expect(onFilesRejected).toHaveBeenCalledTimes(1));
  // The oversized file is refused; the acceptable one in the SAME batch still lands.
  expect(onFilesAccepted.mock.calls[0]![0].map((f: File) => f.name)).toEqual([
    "small.png",
  ]);
  const rejections: FileDropRejection[] = onFilesRejected.mock.calls[0]![0];
  expect(rejections.map((r) => r.file.name)).toEqual(["huge.png"]);
  expect(rejections[0]!.reasons).toEqual(["file-too-large"]);
});

pasteTest("paste enforces minSize with its own reason", async () => {
  const onFilesRejected = vi.fn();
  const screen = await render(
    <Probe
      onFilesAccepted={vi.fn()}
      onFilesRejected={onFilesRejected}
      minSize={4096}
    />,
  );
  pasteFiles(surface(screen), [makeFile("tiny.png", "image/png", 16)]);
  await vi.waitFor(() => expect(onFilesRejected).toHaveBeenCalledTimes(1));
  expect(onFilesRejected.mock.calls[0]![0][0].reasons).toEqual([
    "file-too-small",
  ]);
});

pasteTest("a file failing two constraints reports BOTH reasons", async () => {
  const onFilesRejected = vi.fn();
  const screen = await render(
    <Probe
      onFilesAccepted={vi.fn()}
      onFilesRejected={onFilesRejected}
      accept={{ "image/*": [".png"] }}
      maxSize={128}
    />,
  );
  pasteFiles(surface(screen), [makeFile("big.pdf", "application/pdf", 9000)]);
  await vi.waitFor(() => expect(onFilesRejected).toHaveBeenCalledTimes(1));
  expect(onFilesRejected.mock.calls[0]![0][0].reasons).toEqual([
    "file-invalid-type",
    "file-too-large",
  ]);
});

pasteTest(
  "the surplus past maxFiles is REFUSED, never silently dropped",
  async () => {
    const onFilesAccepted = vi.fn();
    const onFilesRejected = vi.fn();
    const screen = await render(
      <Probe
        onFilesAccepted={onFilesAccepted}
        onFilesRejected={onFilesRejected}
        maxFiles={2}
      />,
    );
    pasteFiles(surface(screen), [
      makeFile("a.png"),
      makeFile("b.png"),
      makeFile("c.png"),
    ]);

    await vi.waitFor(() => expect(onFilesRejected).toHaveBeenCalledTimes(1));
    expect(onFilesAccepted.mock.calls[0]![0].map((f: File) => f.name)).toEqual([
      "a.png",
      "b.png",
    ]);
    const rejections: FileDropRejection[] = onFilesRejected.mock.calls[0]![0];
    expect(rejections.map((r) => r.file.name)).toEqual(["c.png"]);
    expect(rejections[0]!.reasons).toEqual(["too-many-files"]);
  },
);

pasteTest("multiple={false} caps the paste at one file", async () => {
  const onFilesAccepted = vi.fn();
  const onFilesRejected = vi.fn();
  const screen = await render(
    <Probe
      onFilesAccepted={onFilesAccepted}
      onFilesRejected={onFilesRejected}
      multiple={false}
    />,
  );
  pasteFiles(surface(screen), [makeFile("a.png"), makeFile("b.png")]);

  await vi.waitFor(() => expect(onFilesAccepted).toHaveBeenCalledTimes(1));
  expect(onFilesAccepted.mock.calls[0]![0]).toHaveLength(1);
  expect(onFilesRejected.mock.calls[0]![0][0].reasons).toEqual([
    "too-many-files",
  ]);
});

pasteTest("paste={false} opts out without affecting drops", async () => {
  const onFilesAccepted = vi.fn();
  const screen = await render(
    <Probe onFilesAccepted={onFilesAccepted} paste={false} />,
  );
  pasteFiles(surface(screen), [makeFile("shot.png")]);
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(onFilesAccepted).not.toHaveBeenCalled();
});

pasteTest("disabled refuses the paste path too", async () => {
  const onFilesAccepted = vi.fn();
  const onFilesRejected = vi.fn();
  const screen = await render(
    <Probe
      onFilesAccepted={onFilesAccepted}
      onFilesRejected={onFilesRejected}
      disabled
    />,
  );
  pasteFiles(surface(screen), [makeFile("shot.png")]);
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(onFilesAccepted).not.toHaveBeenCalled();
  expect(onFilesRejected).not.toHaveBeenCalled();
});

/* -------------------------------------------------------------------------------------------
 * Directory traversal. A real `DataTransfer` cannot carry a synthetic `webkitGetAsEntry`, so
 * the drop event here is assembled by hand against the FileSystem entries API exactly as
 * `file-selector` (react-dropzone's acquisition layer, v4.0.2) consumes it: `dataTransfer.items`
 * filtered to `kind === "file"`, `webkitGetAsEntry()`, then `createReader().readEntries(cb)`
 * paged until it yields an empty batch, with each file entry resolved through `entry.file(cb)`.
 * ----------------------------------------------------------------------------------------- */

function fileEntry(file: File, fullPath: string) {
  return {
    isFile: true,
    isDirectory: false,
    name: file.name,
    fullPath,
    file: (onSuccess: (f: File) => void) => onSuccess(file),
  };
}

interface DirectoryEntry {
  isFile: false;
  isDirectory: true;
  name: string;
  fullPath: string;
  createReader(): {
    readEntries(onSuccess: (batch: unknown[]) => void): void;
  };
}

function directoryEntry(
  name: string,
  children: Array<ReturnType<typeof fileEntry> | DirectoryEntry>,
  fullPath = `/${name}`,
): DirectoryEntry {
  return {
    isFile: false,
    isDirectory: true,
    name,
    fullPath,
    createReader() {
      // `readEntries` pages: it must yield the batch once and then an empty array,
      // or file-selector loops forever.
      let done = false;
      return {
        readEntries(onSuccess: (batch: unknown[]) => void) {
          if (done) {
            onSuccess([]);
            return;
          }
          done = true;
          onSuccess(children);
        },
      };
    },
  };
}

function dropSynthetic(target: HTMLElement, items: unknown[], files: File[]) {
  const dataTransfer = {
    types: ["Files"],
    items,
    files,
    getData: () => "",
    setData: () => {},
    clearData: () => {},
    dropEffect: "copy",
    effectAllowed: "all",
  };
  for (const type of ["dragenter", "dragover", "drop"] as const) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: dataTransfer,
      configurable: true,
    });
    target.dispatchEvent(event);
  }
}

test("dropping a DIRECTORY acquires the files inside it, not the folder", async () => {
  const inner = makeFile("nested.png");
  const entry = directoryEntry("shots", [
    fileEntry(inner, "/shots/nested.png"),
  ]);
  const onFilesAccepted = vi.fn();
  const screen = await render(<Probe onFilesAccepted={onFilesAccepted} />);

  dropSynthetic(
    surface(screen),
    [
      {
        kind: "file",
        type: inner.type,
        webkitGetAsEntry: () => entry,
        getAsFile: () => inner,
      },
    ],
    [inner],
  );

  await vi.waitFor(() => expect(onFilesAccepted).toHaveBeenCalledTimes(1));
  const acquired: File[] = onFilesAccepted.mock.calls[0]![0];
  expect(acquired.map((f) => f.name)).toEqual(["nested.png"]);
  // A directory itself is never handed to the consumer as a file.
  expect(acquired.some((f) => f.name === "shots")).toBe(false);
});

test("a dropped directory's contents are still subject to accept", async () => {
  const inner = makeFile("notes.pdf", "application/pdf");
  const entry = directoryEntry("docs", [fileEntry(inner, "/docs/notes.pdf")]);
  const onFilesAccepted = vi.fn();
  const onFilesRejected = vi.fn();
  const screen = await render(
    <Probe
      onFilesAccepted={onFilesAccepted}
      onFilesRejected={onFilesRejected}
      accept={{ "image/*": [".png"] }}
    />,
  );

  dropSynthetic(
    surface(screen),
    [
      {
        kind: "file",
        type: inner.type,
        webkitGetAsEntry: () => entry,
        getAsFile: () => inner,
      },
    ],
    [inner],
  );

  await vi.waitFor(() => expect(onFilesRejected).toHaveBeenCalledTimes(1));
  expect(onFilesAccepted).not.toHaveBeenCalled();
  expect(onFilesRejected.mock.calls[0]![0][0].reasons).toEqual([
    "file-invalid-type",
  ]);
});

test("no a11y violations — bare hook surface with its live region", async () => {
  const { expectNoA11yViolations } = await import("../../test/a11y");
  const screen = await render(<Probe onFilesAccepted={vi.fn()} />);
  await expectNoA11yViolations(screen.container);
});

/* -------------------------------------------------------------------------------------------
 * Folder mode (`directories`): the relative path of every file, and a cap on the WHOLE drop.
 * ----------------------------------------------------------------------------------------- */

function twoLevelFolder() {
  const b = makeFile("b.txt", "text/plain");
  const d = makeFile("d.png");
  const entry = directoryEntry("a", [
    fileEntry(b, "/a/b.txt"),
    directoryEntry("c", [fileEntry(d, "/a/c/d.png")], "/a/c"),
  ]);
  return {
    items: [
      {
        kind: "file",
        type: "",
        webkitGetAsEntry: () => entry,
        getAsFile: () => null,
      },
    ],
    files: [b, d],
  };
}

test("a two-level folder drop yields relative paths for every file", async () => {
  const onEntriesAccepted = vi.fn();
  const screen = await render(
    <Probe directories onEntriesAccepted={onEntriesAccepted} />,
  );
  const folder = twoLevelFolder();
  dropSynthetic(surface(screen), folder.items, folder.files);

  await vi.waitFor(() => expect(onEntriesAccepted).toHaveBeenCalledTimes(1));
  expect(onEntriesAccepted).toHaveBeenCalledWith([
    expect.objectContaining({ relativePath: "a/b.txt" }),
    expect.objectContaining({ relativePath: "a/c/d.png" }),
  ]);
  await expect
    .element(screen.getByTestId("live"))
    .toHaveTextContent("Added 2 files");
});

test("in folder mode maxFiles refuses the whole drop, never the surplus", async () => {
  const onEntriesAccepted = vi.fn();
  const onFilesRejected = vi.fn();
  const screen = await render(
    <Probe
      directories
      maxFiles={1}
      onEntriesAccepted={onEntriesAccepted}
      onFilesRejected={onFilesRejected}
    />,
  );
  const folder = twoLevelFolder();
  dropSynthetic(surface(screen), folder.items, folder.files);

  await vi.waitFor(() => expect(onFilesRejected).toHaveBeenCalledTimes(1));
  expect(onEntriesAccepted).not.toHaveBeenCalled();
  const rejections: FileDropRejection[] = onFilesRejected.mock.calls[0]![0];
  expect(rejections.map((r) => r.file.name)).toEqual(["b.txt", "d.png"]);
  expect(rejections.every((r) => r.reasons.join() === "too-many-files")).toBe(
    true,
  );
});

test("openDirectory() picks through the engine input switched to webkitdirectory", async () => {
  function Opener() {
    const drop = useFileDrop({ directories: true, onEntriesAccepted: vi.fn() });
    return (
      <div>
        <input data-testid="picker" {...drop.inputProps} />
        <button type="button" onClick={() => drop.openDirectory()}>
          Upload folder
        </button>
      </div>
    );
  }
  const screen = await render(<Opener />);
  const input = screen.getByTestId("picker").element() as HTMLInputElement;
  let pickedAsFolder: boolean | null = null;
  input.click = () => {
    pickedAsFolder = input.hasAttribute("webkitdirectory");
  };
  (
    screen
      .getByRole("button", { name: "Upload folder" })
      .element() as HTMLButtonElement
  ).click();
  expect(pickedAsFolder).toBe(true);
  // The attribute comes off once the picker settles, so the next plain browse picks files.
  input.dispatchEvent(new Event("cancel"));
  expect(input.hasAttribute("webkitdirectory")).toBe(false);
});
