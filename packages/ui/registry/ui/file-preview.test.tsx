import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, onTestFinished, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import geometryCss from "../../test/geometry.css?inline";
import { FilePreview } from "./file-preview";

const dataUrl = (text: string, type: string) =>
  `data:${type};charset=utf-8,${encodeURIComponent(text)}`;

const card = () =>
  document.querySelector<HTMLElement>('[data-slot="file-preview"]')!;

const MARKDOWN = `# Open tasks\n\n- **P9 skip test** — To do\n- [Q3 review](https://example.org/q3) — overdue\n`;

test("Markdown renders with its formatting; the header names it with its size, Download and Open", async () => {
  const onOpen = vi.fn();
  const screen = await render(
    <FilePreview
      url={dataUrl(MARKDOWN, "text/markdown")}
      mediaType="text/markdown"
      filename="open-tasks.md"
      size={1180}
      onOpen={onOpen}
    />,
  );
  await expect.poll(() => card().dataset.state).toBe("text");
  expect(card().querySelector("h1")?.textContent).toBe("Open tasks");
  expect(card().querySelector("strong")?.textContent).toBe("P9 skip test");
  expect(
    card().querySelector('[data-slot="file-preview-meta"]')?.textContent,
  ).toBe("1.2 KB");
  const download = screen
    .getByRole("link", { name: "Download open-tasks.md" })
    .element();
  expect(download.getAttribute("download")).toBe("open-tasks.md");
  // The name is the one open target in the header: no second Open button beside Download.
  expect(
    screen.getByRole("button", { name: "Open open-tasks.md" }).query(),
  ).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "open-tasks.md" }));
  expect(onOpen).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("the preview is a picture of the file: inert, and a click on it opens the viewer", async () => {
  const onOpen = vi.fn();
  await render(
    <FilePreview
      url={dataUrl(MARKDOWN, "text/markdown")}
      mediaType="text/markdown"
      filename="open-tasks.md"
      onOpen={onOpen}
    />,
  );
  await expect.poll(() => card().dataset.state).toBe("text");
  const link = card().querySelector<HTMLAnchorElement>(
    '[data-slot="markdown-view"] a',
  )!;
  expect(link.getAttribute("href")).toBe("https://example.org/q3");
  expect(link.closest("[inert]")).not.toBeNull();
  (
    card().querySelector('[data-slot="file-preview-body"] > div') as HTMLElement
  ).click();
  expect(onOpen).toHaveBeenCalledOnce();
});

test("a long file is cut with a fade and Open full", async () => {
  // The cut is a max height: it needs the real utilities.
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const long = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`).join(
    "\n\n",
  );
  const onOpen = vi.fn();
  const screen = await render(
    <FilePreview
      url={dataUrl(long, "text/markdown")}
      mediaType="text/markdown"
      filename="long.md"
      onOpen={onOpen}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Open full" }))
    .toBeVisible();
  await expect
    .poll(() => card().querySelector("[inert]")?.hasAttribute("data-clipped"))
    .toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Open full" }));
  expect(onOpen).toHaveBeenCalledOnce();
});

test("a CSV shows its header and first five rows, and offers Open full when there are more", async () => {
  const csv = [
    "Fixture,Lux",
    ...Array.from({ length: 8 }, (_, i) => `F${i},${i}`),
  ].join("\n");
  const screen = await render(
    <FilePreview
      url={dataUrl(csv, "text/csv")}
      mediaType="text/csv"
      filename="schedule.csv"
      onOpen={() => {}}
    />,
  );
  await expect.poll(() => card().dataset.state).toBe("table");
  expect(
    [...card().querySelectorAll("th")].map((cell) => cell.textContent),
  ).toEqual(["Fixture", "Lux"]);
  expect(card().querySelectorAll("tbody tr")).toHaveLength(5);
  await expect
    .element(screen.getByRole("button", { name: "Open full" }))
    .toBeVisible();
});

test("a file with nothing to preview is the header alone", async () => {
  const screen = await render(
    <FilePreview
      url="/never-fetched.zip"
      mediaType="application/zip"
      filename="drawings.zip"
      size={4_212_000}
      onOpen={() => {}}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "drawings.zip" }))
    .toBeVisible();
  expect(card().dataset.kind).toBe("none");
  expect(card().querySelector('[data-slot="file-preview-body"]')).toBeNull();
});

test("a preview that can't load says why, and Retry reads again", async () => {
  const fetchSpy = vi.spyOn(window, "fetch");
  onTestFinished(() => fetchSpy.mockRestore());
  const screen = await render(
    <FilePreview
      url="/definitely-not-here.md"
      mediaType="text/markdown"
      filename="notes.md"
      onOpen={() => {}}
    />,
  );
  await expect.poll(() => card().dataset.state).toBe("failed");
  expect(
    card().querySelector('[data-slot="file-preview-error"]')?.textContent,
  ).toMatch(/^Couldn.t load the preview: the file is no longer there\./);
  await expectNoA11yViolations(screen.container);
  const reads = () =>
    fetchSpy.mock.calls.filter(([url]) => String(url).includes("not-here"))
      .length;
  const before = reads();
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  await expect.poll(reads).toBe(before + 1);
});

test("menu and actions land in the header's end and under the preview", async () => {
  const screen = await render(
    <FilePreview
      url="/never-fetched.zip"
      mediaType="application/zip"
      filename="drawings.zip"
      onOpen={() => {}}
      menu={<button type="button">More</button>}
      actions={<button type="button">Attach to #sales</button>}
    />,
  );
  const more = screen.getByRole("button", { name: "More" }).element();
  expect(more.closest('[data-slot="chat-card-aside"]')).not.toBeNull();
  const attach = screen
    .getByRole("button", { name: "Attach to #sales" })
    .element();
  expect(attach.closest('[data-slot="chat-card-actions"]')).not.toBeNull();
});

test("a new file starts fresh: a failed preview given a readable file shows it", async () => {
  const props = {
    mediaType: "text/markdown",
    filename: "notes.md",
    onOpen: () => {},
  };
  const screen = await render(
    <FilePreview url="/definitely-not-here.md" {...props} />,
  );
  await expect.poll(() => card().dataset.state).toBe("failed");
  await screen.rerender(
    <FilePreview url={dataUrl("# Fresh", "text/markdown")} {...props} />,
  );
  await expect.poll(() => card().dataset.state).toBe("text");
  expect(card().querySelector("h1")?.textContent).toBe("Fresh");
});

test("a streamed file part passes as-is: its name comes from provider metadata", async () => {
  const part = {
    type: "file",
    url: "/never-fetched.zip",
    mediaType: "application/zip",
    providerMetadata: { vegastack: { filename: "drawings.zip" } },
  };
  const screen = await render(<FilePreview {...part} onOpen={() => {}} />);
  await expect
    .element(screen.getByRole("button", { name: "drawings.zip" }))
    .toBeVisible();
});
