import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { FileText, X } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { IconButton } from "./icon-button";
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentProgress,
  AttachmentTitle,
  AttachmentTrigger,
  type AttachmentState,
} from "./attachment";

const LONG_NAME =
  "q4-2026-board-deck-final-final-v3-actually-final-reviewed-by-legal.pptx";

function Chip({
  state,
  onRemove,
}: {
  state: AttachmentState;
  onRemove?: () => void;
}) {
  return (
    <Attachment state={state}>
      <AttachmentMedia>
        <FileText />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{LONG_NAME}</AttachmentTitle>
        <AttachmentDescription
          live={state === "uploading" || state === "error"}
        >
          {state === "uploading"
            ? "Uploading — 42%"
            : state === "error"
              ? "Upload failed — try again"
              : "1.2 MB"}
        </AttachmentDescription>
        {state === "uploading" ? (
          <AttachmentProgress
            value={42}
            aria-label={`${LONG_NAME} upload progress`}
          />
        ) : null}
      </AttachmentContent>
      <AttachmentActions>
        <IconButton
          aria-label={`Remove ${LONG_NAME}`}
          variant="ghost"
          size="xs"
          onClick={onRemove}
        >
          <X />
        </IconButton>
      </AttachmentActions>
    </Attachment>
  );
}

test("renders the full anatomy with every data-slot", async () => {
  const screen = await render(<Chip state="complete" />);
  const root = screen.container.querySelector('[data-slot="attachment"]');
  expect(root).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="attachment-media"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="attachment-content"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="attachment-title"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="attachment-description"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="attachment-actions"]'),
  ).not.toBeNull();
});

test("AttachmentGroup exposes its slot and wraps multiple chips", async () => {
  const screen = await render(
    <AttachmentGroup>
      <Chip state="complete" />
      <Chip state="idle" />
    </AttachmentGroup>,
  );
  expect(
    screen.container.querySelector('[data-slot="attachment-group"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelectorAll('[data-slot="attachment"]'),
  ).toHaveLength(2);
});

test.each<AttachmentState>([
  "idle",
  "uploading",
  "error",
  "complete",
  "disabled",
])("reflects state=%s on the root data-state attribute", async (state) => {
  const screen = await render(<Chip state={state} />);
  const root = screen.container.querySelector('[data-slot="attachment"]');
  expect(root).toHaveAttribute("data-state", state);
});

test("disabled state marks the root aria-disabled and dims it", async () => {
  const screen = await render(<Chip state="disabled" />);
  const root = screen.container.querySelector('[data-slot="attachment"]')!;
  expect(root).toHaveAttribute("aria-disabled", "true");
  expect(root.className).toContain(
    "data-[state=disabled]:opacity-(--opacity-dim)",
  );
});

test("idle/complete are not aria-disabled", async () => {
  const idle = await render(<Chip state="idle" />);
  expect(
    idle.container.querySelector('[data-slot="attachment"]'),
  ).not.toHaveAttribute("aria-disabled");
});

test("uploading state reveals the AttachmentMedia spinner overlay and progress bar", async () => {
  const screen = await render(<Chip state="uploading" />);
  const overlay = screen.container.querySelector(
    '[data-slot="attachment-media-overlay"]',
  )!;
  expect(overlay.className).toContain(
    "group-data-[state=uploading]/attachment:flex",
  );
  const progress = screen.getByRole("progressbar", {
    name: `${LONG_NAME} upload progress`,
  });
  await expect.element(progress).toBeInTheDocument();
  await expect.element(progress).toHaveAttribute("aria-valuenow", "42");
});

test("error state tints title/description via destructive data-state selectors", async () => {
  const screen = await render(<Chip state="error" />);
  const title = screen.container.querySelector(
    '[data-slot="attachment-title"]',
  )!;
  const description = screen.container.querySelector(
    '[data-slot="attachment-description"]',
  )!;
  expect(title.className).toContain(
    "group-data-[state=error]/attachment:text-destructive-text",
  );
  expect(description.className).toContain(
    "group-data-[state=error]/attachment:text-destructive-text",
  );
  expect(
    screen.container.querySelector('[data-slot="attachment"]'),
  ).toHaveAttribute("data-state", "error");
});

test("the remove action fires its callback and exposes an accessible name with the file name", async () => {
  const onRemove = vi.fn();
  const screen = await render(<Chip state="complete" onRemove={onRemove} />);
  const button = screen.getByRole("button", { name: `Remove ${LONG_NAME}` });
  await expect.element(button).toBeInTheDocument();
  await button.click();
  expect(onRemove).toHaveBeenCalledOnce();
});

test("AttachmentTitle truncates a long file name instead of wrapping/overflowing", async () => {
  const screen = await render(<Chip state="idle" />);
  const title = screen.container.querySelector(
    '[data-slot="attachment-title"]',
  )!;
  expect(title.className).toContain("truncate");
  expect(title.textContent).toBe(LONG_NAME);
});

test("AttachmentDescription is a live region only when `live` is set", async () => {
  const live = await render(
    <AttachmentDescription live>Uploading — 42%</AttachmentDescription>,
  );
  const liveEl = live.getByText("Uploading — 42%");
  await expect.element(liveEl).toHaveAttribute("role", "status");
  await expect.element(liveEl).toHaveAttribute("aria-live", "polite");
  await expect.element(liveEl).toHaveAttribute("aria-atomic", "true");

  const passive = await render(
    <AttachmentDescription>1.2 MB</AttachmentDescription>,
  );
  const passiveEl = passive.getByText("1.2 MB");
  await expect.element(passiveEl).not.toHaveAttribute("role");
  await expect.element(passiveEl).not.toHaveAttribute("aria-live");
});

test("AttachmentTrigger renders as a button by default and supports render composition", async () => {
  const screen = await render(
    <Attachment>
      <AttachmentTrigger aria-label="Open release-notes.pdf" />
      <AttachmentContent>
        <AttachmentTitle>release-notes.pdf</AttachmentTitle>
      </AttachmentContent>
    </Attachment>,
  );
  const trigger = screen.getByRole("button", {
    name: "Open release-notes.pdf",
  });
  await expect
    .element(trigger)
    .toHaveAttribute("data-slot", "attachment-trigger");

  const linked = await render(
    <Attachment>
      <AttachmentTrigger
        aria-label="Download release-notes.pdf"
        render={<a href="https://example.com/release-notes.pdf" />}
      />
    </Attachment>,
  );
  const link = linked.getByRole("link", { name: "Download release-notes.pdf" });
  await expect
    .element(link)
    .toHaveAttribute("href", "https://example.com/release-notes.pdf");
});

test("forwards ref to the root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Attachment ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("attachment");
});

test.each<AttachmentState>([
  "idle",
  "uploading",
  "error",
  "complete",
  "disabled",
])("no a11y violations — state=%s", async (state) => {
  const screen = await render(<Chip state={state} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — AttachmentGroup with multiple attachments", async () => {
  const screen = await render(
    <AttachmentGroup>
      <Chip state="complete" />
      <Chip state="error" />
      <Chip state="uploading" />
    </AttachmentGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("vertical orientation: media releases its fixed height so aspect-square can apply", async () => {
  // The base class sets `size-(--size-lg)` (definite width AND height). With both dimensions
  // definite, CSS ignores `aspect-ratio` — the vertical thumbnail rendered 110×40 instead of
  // square (audit finding). The vertical override must therefore carry `h-auto` alongside
  // `aspect-square w-full`. Class-contract assertion (this suite loads no compiled CSS).
  const screen = await render(
    <Attachment orientation="vertical">
      <AttachmentMedia variant="image">
        <FileText aria-hidden />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>cover-photo.png</AttachmentTitle>
      </AttachmentContent>
    </Attachment>,
  );
  const media = screen.container.querySelector(
    '[data-slot="attachment-media"]',
  );
  expect(media?.className).toContain(
    "group-data-[orientation=vertical]/attachment:h-auto",
  );
  expect(media?.className).toContain(
    "group-data-[orientation=vertical]/attachment:aspect-square",
  );
});
