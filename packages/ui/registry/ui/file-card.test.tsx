import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { TrashIcon } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { AttachmentGroup } from "./attachment";
import { FileCard, UploadCard } from "./file-card";
import type { FileViewerItem } from "./file-viewer";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const List = ({ children }: { children: React.ReactNode }) => (
  <div role="list">{children}</div>
);

const PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const fileOf = (name: string): FileViewerItem => ({
  id: name,
  name,
  contentType: "image/png",
  src: PIXEL,
  downloadHref: `/files/${name}`,
});

test("renders a listitem with the name, the type icon and the description lines", async () => {
  const screen = await render(
    <AttachmentGroup role="list" aria-label="Files">
      <FileCard
        name="spec.pdf"
        contentType="application/pdf"
        descriptions={["2.4 MB", null, "Asha · today"]}
      />
    </AttachmentGroup>,
  );
  const card = screen.getByRole("listitem").element();
  expect(slot(card, "attachment-title")!.textContent).toBe("spec.pdf");
  expect(slot(card, "file-type-icon")!.getAttribute("data-kind")).toBe("pdf");
  const lines = [
    ...card.querySelectorAll('[data-slot="attachment-description"]'),
  ];
  expect(lines.map((l) => l.textContent)).toEqual(["2.4 MB", "Asha · today"]);
  // Every line reads in tabular figures (AttachmentDescription's own).
  for (const line of lines) expect(line.className).toContain("tabular-nums");
  await expectNoA11yViolations(screen.container);
});

test("a thumbnail replaces the type icon and is loaded eagerly", async () => {
  const screen = await render(
    <FileCard
      name="photo.png"
      contentType="image/png"
      thumb={{ src: PIXEL, blur: PIXEL }}
    />,
  );
  const media = slot(screen.container, "attachment-media")!;
  expect(media.dataset.variant).toBe("image");
  expect(slot(media, "file-type-icon")).toBeNull();
  expect(media.querySelector("img")!.getAttribute("loading")).toBe("eager");
});

test("a local preview shows until a thumbnail exists, then sits under it", async () => {
  const screen = await render(<FileCard name="photo.png" preview={PIXEL} />);
  const media = slot(screen.container, "attachment-media")!;
  expect(media.dataset.variant).toBe("image");
  expect(media.querySelector("img")).not.toBeNull();
  expect(slot(media, "image-placeholder")).toBeNull();
});

test("icon takes the media in place of the thumbnail and the type icon", async () => {
  const screen = await render(
    <FileCard
      name="locked"
      icon={<span data-testid="lock">L</span>}
      thumb={{ src: PIXEL }}
    />,
  );
  const media = slot(screen.container, "attachment-media")!;
  expect(media.dataset.variant).toBe("icon");
  expect(media.querySelector('[data-testid="lock"]')).not.toBeNull();
  expect(media.querySelector("img")).toBeNull();
});

test("muted and size reach the attachment", async () => {
  const screen = await render(<FileCard name="old.pdf" muted size="lg" />);
  const tile = slot(screen.container, "attachment")!;
  expect(tile.dataset.muted).toBe("true");
  expect(tile.dataset.size).toBe("lg");
});

test("actions are a named ⋯ menu; extra controls sit before it", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <FileCard
      name="spec.pdf"
      extra={<button type="button">Go to comment</button>}
      actions={[
        {
          label: "Remove",
          icon: <TrashIcon />,
          destructive: true,
          onSelect,
        },
      ]}
    />,
  );
  const actions = slot(screen.container, "attachment-actions")!;
  const controls = [...actions.querySelectorAll("button")].map(
    (b) => b.getAttribute("aria-label") ?? b.textContent,
  );
  expect(controls).toEqual(["Go to comment", "Actions for spec.pdf"]);
  await screen.getByRole("button", { name: "Actions for spec.pdf" }).click();
  await screen.getByRole("menuitem", { name: "Remove" }).click();
  expect(onSelect).toHaveBeenCalledTimes(1);
});

test("no actions and no extra draws no actions slot", async () => {
  const screen = await render(<FileCard name="spec.pdf" />);
  expect(slot(screen.container, "attachment-actions")).toBeNull();
});

test("a file makes the whole card open the viewer", async () => {
  const screen = await render(
    <AttachmentGroup role="list">
      <FileCard name="a.png" file={fileOf("a.png")} />
      <FileCard name="b.png" file={fileOf("b.png")} />
    </AttachmentGroup>,
  );
  await screen.getByRole("button", { name: "Open b.png" }).click();
  await expect.element(screen.getByRole("dialog")).toBeVisible();
  await expect
    .poll(
      () => document.querySelector('[data-slot="file-viewer"]')?.textContent,
    )
    .toContain("2 of 2");
});

test("onOpen replaces the viewer and gets the file", async () => {
  const onOpen = vi.fn();
  const file = fileOf("a.png");
  const screen = await render(
    <FileCard name="a.png" file={file} onOpen={onOpen} />,
  );
  await screen.getByRole("button", { name: "Open a.png" }).click();
  expect(onOpen).toHaveBeenCalledWith(file);
  expect(document.querySelector('[data-slot="file-viewer"]')).toBeNull();
});

test("href makes the whole card one link that covers the card", async () => {
  const screen = await render(
    <List>
      <FileCard
        name="Spec sheet"
        href="/accessories/1"
        descriptions={["Accessory"]}
        actions={[{ label: "Remove", onSelect: () => {} }]}
      />
    </List>,
  );
  const link = screen.getByRole("link", { name: "Open Spec sheet" }).element();
  expect(link.getAttribute("href")).toBe("/accessories/1");
  expect(link.getAttribute("download")).toBeNull();
  expect(link.getAttribute("target")).toBeNull();
  expect(
    slot(link.closest("[data-slot=attachment]")!, "attachment-trigger"),
  ).toBe(link);
  // A click on the description lands on the link; the ⋯ menu stays above it.
  const text = screen.getByText("Accessory").element().getBoundingClientRect();
  expect(
    document.elementFromPoint(text.left + 2, text.top + text.height / 2),
  ).toBe(link);
  const menu = screen
    .getByRole("button", { name: "Actions for Spec sheet" })
    .element();
  const box = menu.getBoundingClientRect();
  expect(
    document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    ),
  ).toBe(menu);
  await expectNoA11yViolations(screen.container);
});

test("href with download downloads, and target _blank opens safely in a new tab", async () => {
  const screen = await render(
    <>
      <FileCard name="a.zip" href="/files/a.zip" download />
      <FileCard name="b" href="https://example.com" target="_blank" />
    </>,
  );
  const download = screen
    .getByRole("link", { name: "Download a.zip" })
    .element();
  expect(download.hasAttribute("download")).toBe(true);
  const blank = screen
    .getByRole("link", { name: "Open b in a new tab" })
    .element();
  expect(blank.getAttribute("target")).toBe("_blank");
  expect(blank.getAttribute("rel")).toBe("noopener");
});

test("file wins over href: the card is an open button, not a link", async () => {
  const screen = await render(
    <FileCard name="a.png" file={fileOf("a.png")} href="/elsewhere" />,
  );
  expect(screen.getByRole("link").elements()).toHaveLength(0);
  expect(
    screen.getByRole("button", { name: "Open a.png" }).elements(),
  ).toHaveLength(1);
});

test("without file or href the card is inert", async () => {
  const screen = await render(<FileCard name="a.png" />);
  expect(slot(screen.container, "attachment-trigger")).toBeNull();
});

test("the card is keyboard reachable: Tab lands on it", async () => {
  const screen = await render(<FileCard name="a" href="#target" />);
  await userEvent.tab();
  expect(document.activeElement).toBe(screen.getByRole("link").element());
});

test("UploadCard shows a named progress bar and a Cancel that calls back", async () => {
  const onCancel = vi.fn();
  const screen = await render(
    <List>
      <UploadCard
        name="photo.jpg"
        type="image/jpeg"
        progress={40}
        error={null}
        onCancel={onCancel}
        onRetry={() => {}}
      />
    </List>,
  );
  expect(slot(screen.container, "attachment")!.dataset.state).toBe("uploading");
  const bar = screen.getByRole("progressbar", { name: "Uploading photo.jpg" });
  expect(bar.element().getAttribute("aria-valuetext")).toBe("40%");
  await screen.getByRole("button", { name: "Cancel photo.jpg" }).click();
  expect(onCancel).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("UploadCard with no progress yet is preparing", async () => {
  const screen = await render(
    <UploadCard
      name="photo.jpg"
      type="image/jpeg"
      progress={null}
      error={null}
      onCancel={() => {}}
      onRetry={() => {}}
    />,
  );
  expect(slot(screen.container, "attachment")!.dataset.state).toBe(
    "processing",
  );
  expect(
    screen.getByRole("progressbar", { name: "Preparing photo.jpg" }).elements(),
  ).toHaveLength(1);
});

test("UploadCard error shows the reason and Retry, and no bar", async () => {
  const onRetry = vi.fn();
  const screen = await render(
    <List>
      <UploadCard
        name="photo.jpg"
        type="image/jpeg"
        progress={10}
        error="Upload failed"
        onCancel={() => {}}
        onRetry={onRetry}
      />
    </List>,
  );
  expect(slot(screen.container, "attachment")!.dataset.state).toBe("error");
  expect(slot(screen.container, "attachment-progress")).toBeNull();
  await expect.element(screen.getByText("Upload failed")).toBeVisible();
  await screen.getByRole("button", { name: "Retry photo.jpg" }).click();
  expect(onRetry).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("UploadCard finishing swaps the bar for text and disables Cancel; cancellable=false does too", async () => {
  const screen = await render(
    <>
      <UploadCard
        name="a.jpg"
        type="image/jpeg"
        progress={100}
        error={null}
        finishing
        onCancel={() => {}}
        onRetry={() => {}}
      />
      <UploadCard
        name="b.jpg"
        type="image/jpeg"
        progress={5}
        error={null}
        cancellable={false}
        onCancel={() => {}}
        onRetry={() => {}}
      />
    </>,
  );
  await expect.element(screen.getByText("Finishing upload")).toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Cancel a.jpg" }))
    .toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "Cancel b.jpg" }))
    .toBeDisabled();
});

test("UploadCard shows the picked image while uploading, and the type icon on error", async () => {
  const props = {
    name: "p.png",
    type: "image/png",
    preview: PIXEL,
    onCancel: () => {},
    onRetry: () => {},
  };
  const screen = await render(
    <>
      <UploadCard {...props} progress={5} error={null} />
      <UploadCard {...props} progress={5} error="bad" />
    </>,
  );
  const [uploading, failed] = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="attachment-media"]',
    ),
  ];
  expect(uploading!.dataset.variant).toBe("image");
  expect(failed!.dataset.variant).toBe("icon");
});

test("labels override the built-in names and text", async () => {
  const screen = await render(
    <List>
      <FileCard
        name="a.zip"
        href="/a.zip"
        download
        actions={[{ label: "Remove", onSelect: () => {} }]}
        labels={{
          download: (n) => `Télécharger ${n}`,
          actions: (n) => `Actions pour ${n}`,
        }}
      />
      <UploadCard
        name="b.zip"
        type="application/zip"
        progress={null}
        error="bad"
        onCancel={() => {}}
        onRetry={() => {}}
        labels={{
          retry: (n) => `Réessayer ${n}`,
          cancel: (n) => `Annuler ${n}`,
        }}
      />
      <UploadCard
        name="c.zip"
        type="application/zip"
        progress={100}
        error={null}
        finishing
        onCancel={() => {}}
        onRetry={() => {}}
        labels={{ finishing: "Terminé" }}
      />
    </List>,
  );
  await expect
    .element(screen.getByRole("link", { name: "Télécharger a.zip" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Actions pour a.zip" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Réessayer b.zip" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Annuler b.zip" }))
    .toBeVisible();
  await expect.element(screen.getByText("Terminé")).toBeVisible();
});

test("a menu action's shortcut key picks it", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <List>
      <FileCard
        name="a.zip"
        actions={[{ label: "Remove", shortcut: "R", onSelect }]}
      />
    </List>,
  );
  screen.getByRole("button", { name: "Actions for a.zip" }).element().focus();
  await userEvent.keyboard("{Enter}");
  await expect
    .element(screen.getByRole("menuitem", { name: /Remove/ }))
    .toBeVisible();
  await userEvent.keyboard("r");
  expect(onSelect).toHaveBeenCalledTimes(1);
});
