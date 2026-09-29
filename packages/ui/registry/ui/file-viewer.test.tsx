import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  FileViewer,
  parseCsv,
  type FileViewerItem,
  type FileViewerProps,
} from "./file-viewer";

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

const MEDIA: FileViewerItem[] = [
  {
    id: "v",
    name: "walkthrough.mp4",
    contentType: "video/mp4",
    src: "/clip.mp4",
    downloadHref: "/download/v",
  },
  {
    id: "m",
    name: "voice-note.mp3",
    contentType: "audio/mpeg",
    src: "/note.mp3",
    size: 812_000,
    downloadHref: "/download/m",
  },
];

function MediaHarness() {
  const [index, setIndex] = React.useState<number | null>(null);
  return (
    <>
      <button type="button" onClick={() => setIndex(0)}>
        Open media
      </button>
      <FileViewer
        items={MEDIA}
        index={index}
        onIndexChange={setIndex}
        onOpenChange={(open) => !open && setIndex(null)}
      />
    </>
  );
}

test("video and audio play on the stage, and the arrows still page between them", async () => {
  const screen = await render(<MediaHarness />);
  await screen.getByRole("button", { name: "Open media" }).click();
  await expect
    .element(screen.getByRole("dialog", { name: "walkthrough.mp4" }))
    .toBeVisible();
  expect(
    document
      .querySelector('[data-slot="file-viewer"]')
      ?.getAttribute("data-kind"),
  ).toBe("video");
  await expect
    .element(
      screen.getByRole("group", { name: "walkthrough.mp4 video player" }),
    )
    .toBeInTheDocument();
  const video = document.querySelector("video")!;
  let paused = 0;
  video.pause = () => {
    paused++;
  };
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .element(screen.getByRole("dialog", { name: "voice-note.mp3" }))
    .toBeVisible();
  // Paging away pauses the video it unmounts.
  expect(paused).toBeGreaterThan(0);
  expect(
    document
      .querySelector('[data-slot="file-viewer"]')
      ?.getAttribute("data-kind"),
  ).toBe("audio");
  await expect.element(screen.getByText("Audio 2 of 2")).toBeInTheDocument();
  expect(document.querySelector("audio")).not.toBeNull();
  await userEvent.keyboard("{ArrowLeft}");
  await expect
    .element(screen.getByRole("dialog", { name: "walkthrough.mp4" }))
    .toBeVisible();
});

// ── Text, CSV, Markdown, cards and loadPreview ─────────────────────────────────────────────────

/** A blob URL, which answers `Range` requests the way R2 does (206 + Content-Range). */
function served(text: string, type = "text/plain") {
  return URL.createObjectURL(new Blob([text], { type }));
}

function Viewer({
  items,
  loadPreview,
  initial = 0,
}: {
  items: FileViewerItem[];
  loadPreview?: FileViewerProps["loadPreview"];
  initial?: number;
}) {
  const [index, setIndex] = React.useState<number | null>(initial);
  return (
    <FileViewer
      items={items}
      index={index}
      onIndexChange={setIndex}
      onOpenChange={(open) => !open && setIndex(null)}
      loadPreview={loadPreview}
    />
  );
}

/**
 * ← / → page from the viewer itself. Focus it first: a component test compiles no CSS, and in a
 * combined run another file's frame can hold focus, so a bare key press may land nowhere.
 */
async function pageNext() {
  document.querySelector<HTMLElement>('[data-slot="file-viewer"]')?.focus();
  await userEvent.keyboard("{ArrowRight}");
}

const kindShown = () =>
  document
    .querySelector('[data-slot="file-viewer"]')
    ?.getAttribute("data-kind");

describe("parseCsv", () => {
  test("reads quotes, escaped quotes, delimiters and line breaks inside quotes", () => {
    const text =
      '\ufeffname,notes,amount\r\n"Ada","said ""hi"", twice",3\r\n' +
      'Linus,"two\nlines",\n\n';
    expect(parseCsv(text)).toEqual({
      rows: [
        ["name", "notes", "amount"],
        ["Ada", 'said "hi", twice', "3"],
        ["Linus", "two\nlines", ""],
      ],
      truncated: false,
    });
  });
  test("sniffs a semicolon or tab delimiter, and takes one", () => {
    expect(parseCsv("a;b;c\n1;2;3").rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
    expect(parseCsv("a\tb\n1\t2").rows[1]).toEqual(["1", "2"]);
    expect(parseCsv("a|b", { delimiter: "|" }).rows[0]).toEqual(["a", "b"]);
  });
  test("stops at maxRows and reports that more followed", () => {
    expect(parseCsv("h\n1\n2\n3\n", { maxRows: 2 })).toEqual({
      rows: [["h"], ["1"]],
      truncated: true,
    });
    expect(parseCsv("h\n1\n", { maxRows: 2 }).truncated).toBe(false);
  });
});

test("a text or code file shows its text in a named, focusable sheet", async () => {
  const screen = await render(
    <Viewer
      items={[
        {
          id: "log",
          name: "server.log",
          contentType: "text/plain",
          src: served("line one\nline two"),
          downloadHref: "/download/log",
        },
      ]}
    />,
  );
  const sheet = screen.getByRole("region", { name: "server.log preview" });
  await expect.element(sheet).toHaveTextContent("line one line two");
  expect(sheet.element().querySelector("pre")).not.toBeNull();
  expect(sheet.element().tabIndex).toBe(0);
  await expect.poll(kindShown).toBe("text");
  expect(document.querySelector('[data-slot="file-viewer-note"]')).toBeNull();
  await expectNoA11yViolations(document.body);
});

test("a CSV shows as a table with a header, capped at 500 rows", async () => {
  const lines = ["name,city", '"Lovelace, Ada",London'];
  for (let i = 0; i < 600; i++) lines.push(`row ${i},Here`);
  const screen = await render(
    <Viewer
      items={[
        {
          id: "csv",
          name: "people.csv",
          contentType: "application/vnd.ms-excel",
          src: served(lines.join("\r\n"), "text/csv"),
          downloadHref: "/download/csv",
        },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("columnheader", { name: "city" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("cell", { name: "Lovelace, Ada" }))
    .toBeVisible();
  expect(document.querySelectorAll("tbody tr")).toHaveLength(500);
  await expect
    .element(screen.getByText("Showing first 500 rows"))
    .toBeVisible();
  await expect.poll(kindShown).toBe("table");
  await expectNoA11yViolations(document.body);
});

test("Markdown and MDX render through MarkdownView", async () => {
  const screen = await render(
    <Viewer
      items={[
        {
          id: "md",
          name: "notes.md",
          contentType: "",
          src: served("# Site visit\n\n- measure the *hall*"),
          downloadHref: "/download/md",
        },
        {
          id: "mdx",
          name: "guide.mdx",
          contentType: null,
          src: served("## Install\n\n<Callout>raw</Callout>"),
          downloadHref: "/download/mdx",
        },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("heading", { name: "Site visit" }))
    .toBeVisible();
  await expect.poll(kindShown).toBe("markdown");
  await expectNoA11yViolations(document.body);
  await pageNext();
  await expect
    .element(screen.getByRole("heading", { name: "Install" }))
    .toBeVisible();
  // JSX is never executed: it shows as text.
  expect(document.querySelector("callout")).toBeNull();
});

test("a text file past 1 MB shows its first megabyte and says so", async () => {
  const line = "x".repeat(99) + "\n";
  const big = line.repeat(11_000); // ~1.05 MB
  const screen = await render(
    <Viewer
      items={[
        {
          id: "big",
          name: "big.txt",
          contentType: "text/plain",
          size: big.length,
          src: served(big),
          downloadHref: "/download/big",
        },
      ]}
    />,
  );
  await expect
    .element(
      screen.getByText(
        "Showing the first 1 MB. Download the file to see all of it.",
      ),
    )
    .toBeVisible();
  const text = document.querySelector("pre")!.textContent!;
  expect(text.length).toBeLessThanOrEqual(1024 * 1024);
  expect(text.endsWith("x")).toBe(true);
});

test("an Office file is a card with its thumbnail, or its icon, and a primary Download", async () => {
  const screen = await render(
    <Viewer
      items={[
        {
          id: "deck",
          name: "q3-review.pptx",
          contentType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          size: 4_200_000,
          thumb: { src: PIXEL },
          downloadHref: "/download/deck",
        },
        {
          id: "sheet",
          name: "budget.xlsx",
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          size: 2048,
          downloadHref: "/download/sheet",
        },
      ]}
    />,
  );
  await expect.element(screen.getByText("4 MB")).toBeVisible();
  expect(
    document.querySelector('[data-slot="file-viewer-file-thumb"]'),
  ).not.toBeNull();
  const download = screen.getByRole("link", { name: "Download", exact: true });
  expect(download.element().getAttribute("href")).toBe("/download/deck");
  expect(download.element().className).toContain("bg-primary");
  await expect.poll(kindShown).toBe("card");
  await expectNoA11yViolations(document.body);
  await pageNext();
  await expect.element(screen.getByText("2 KB")).toBeVisible();
  expect(
    document.querySelector('[data-slot="file-viewer-file-thumb"]'),
  ).toBeNull();
  expect(
    document
      .querySelector('[data-slot="file-type-icon"]')
      ?.getAttribute("data-kind"),
  ).toBe("spreadsheet");
});

test("a file that cannot be read falls back to the card", async () => {
  const screen = await render(
    <Viewer
      items={[
        {
          id: "gone",
          name: "missing.txt",
          contentType: "text/plain",
          src: "/definitely-not-here.txt",
          downloadHref: "/download/gone",
        },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("link", { name: "Download", exact: true }))
    .toBeVisible();
  await expect.poll(kindShown).toBe("card");
});

test("loadPreview supplies HTML, tables and cards, and null keeps the built-in reading", async () => {
  const signals: AbortSignal[] = [];
  const loadPreview = vi.fn<NonNullable<FileViewerProps["loadPreview"]>>(
    async (item, { signal }) => {
      signals.push(signal);
      if (item.name.endsWith(".docx"))
        return {
          kind: "html",
          html: "<h2>Scope</h2><script>alert(1)</script>",
        };
      if (item.name.endsWith(".xlsx"))
        return {
          kind: "table",
          rows: [
            ["Item", "Cost"],
            ["Tiles", "120"],
          ],
          totalRows: 900,
        };
      if (item.name.endsWith(".pptx"))
        return { kind: "card", thumb: PIXEL, facts: ["12 slides"] };
      return null;
    },
  );
  const screen = await render(
    <Viewer
      loadPreview={loadPreview}
      items={[
        {
          id: "doc",
          name: "scope.docx",
          contentType: "application/msword",
          downloadHref: "/d/doc",
        },
        {
          id: "xls",
          name: "costs.xlsx",
          contentType: null,
          downloadHref: "/d/xls",
        },
        {
          id: "ppt",
          name: "pitch.pptx",
          contentType: null,
          size: 1024,
          downloadHref: "/d/ppt",
        },
        {
          id: "txt",
          name: "readme.txt",
          contentType: "text/plain",
          src: served("plain words"),
          downloadHref: "/d/txt",
        },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("heading", { name: "Scope" }))
    .toBeVisible();
  expect(
    document.querySelector('[data-slot="file-viewer-html"] script'),
  ).toBeNull();
  await expect.poll(kindShown).toBe("html");
  await pageNext();
  await expect
    .element(screen.getByText("Showing first 1 of 900 rows"))
    .toBeVisible();
  await expect.poll(kindShown).toBe("table");
  expect(signals[0]!.aborted).toBe(true);
  await pageNext();
  await expect.element(screen.getByText("1 KB · 12 slides")).toBeVisible();
  expect(
    document.querySelector('[data-slot="file-viewer-file-thumb"]'),
  ).not.toBeNull();
  await pageNext();
  await expect
    .element(screen.getByRole("region", { name: "readme.txt preview" }))
    .toHaveTextContent("plain words");
  expect(loadPreview).toHaveBeenCalledTimes(4);
});

test("an unplayable video shows the card with the item's download, and refreshSrc renews first", async () => {
  const refreshSrc = vi.fn(async () => "data:video/mp4;base64,AAAA");
  const screen = await render(
    <Viewer
      items={[
        {
          id: "mov",
          name: "site.mov",
          contentType: "video/quicktime",
          src: "data:video/mp4;base64,AAAA",
          downloadHref: "/download/mov",
          refreshSrc,
        },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Can’t play this video here");
  expect(refreshSrc).toHaveBeenCalledOnce();
  const download = screen.getByRole("link", { name: "Download", exact: true });
  expect(download.element().getAttribute("href")).toBe("/download/mov");
  const video = document.querySelector("video")!;
  expect(video.autoplay).toBe(false);
  expect(video.className).toContain("object-contain");
});

test("audio with stored peaks plays in the waveform player", async () => {
  await render(
    <Viewer
      items={[
        {
          id: "memo",
          name: "memo.m4a",
          contentType: "audio/mp4",
          src: "/memo.m4a",
          peaks: [0.2, 1, 0.5],
          downloadHref: "/download/memo",
        },
      ]}
    />,
  );
  await vi.waitFor(() =>
    expect(
      document
        .querySelector('[data-slot="audio-player"]')
        ?.getAttribute("data-variant"),
    ).toBe("waveform"),
  );
  expect(
    document.querySelector('[data-slot="media-player-waveform-bars"]')
      ?.childElementCount,
  ).toBe(3);
});
