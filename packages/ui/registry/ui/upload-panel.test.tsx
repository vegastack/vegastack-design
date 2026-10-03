import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import {
  UploadPanel,
  type UploadEntry,
  type UploadPanelProps,
  type UploadSummary,
} from "./upload-panel";

const MB = 1024 * 1024;

/** The visible header (the sr-only announcer repeats its title). */
const header = () =>
  page.elementLocator(
    document.querySelector('[data-slot="upload-panel-header"]') as HTMLElement,
  );

beforeEach(async () => {
  await page.viewport(1280, 900);
});
afterEach(async () => {
  await page.viewport(414, 896);
  vi.useRealTimers();
});

const uploading: UploadEntry[] = [
  {
    id: "a",
    name: "quarterly-site-survey-final-2026.pdf",
    size: 4 * MB,
    bytesDone: 1 * MB,
    contentType: "application/pdf",
    status: "uploading",
    destination: { label: "Product › Specs", href: "/library/specs" },
  },
  { id: "b", name: "photo.jpg", size: MB, status: "queued" },
  { id: "c", name: "plan.dwg", size: MB, status: "finishing" },
];

const activeSummary: UploadSummary = {
  total: 3,
  done: 0,
  failed: 0,
  cancelled: 0,
  bytesDone: 2 * MB,
  bytesTotal: 6 * MB,
  timeLeftMs: 125_000,
  status: "uploading",
};

function Harness(props: Partial<UploadPanelProps>) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <UploadPanel
      items={uploading}
      summary={activeSummary}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      {...props}
    />
  );
}

test("names the batch, shows time left, rows with a labelled ring, and collapses", async () => {
  const onOpen = vi.fn();
  const screen = await render(<Harness onOpen={onOpen} onCancel={() => {}} />);
  const panel = screen.getByRole("region", { name: "Uploads" });
  await expect.element(header().getByText("Uploading 3 items")).toBeVisible();
  await expect
    .element(panel.getByText("About 2 minutes left · 2 MB of 6 MB"))
    .toBeVisible();
  const ring = panel.getByRole("progressbar", {
    name: "quarterly-site-survey-final-2026.pdf",
  });
  await expect.element(ring).toHaveAttribute("aria-valuenow", "25");
  await expect.element(panel.getByText("25% · 1 MB of 4 MB")).toBeVisible();
  // The middle truncation keeps the stem's tail and the extension in one unbroken span.
  await expect.element(panel.getByText("2026.pdf")).toBeInTheDocument();
  await panel.getByRole("link", { name: "Product › Specs" }).click();
  expect(onOpen).toHaveBeenCalledWith("/library/specs");
  await expectNoA11yViolations(document.body);

  await panel.getByRole("button", { name: "Collapse uploads" }).click();
  await expect
    .element(panel.getByRole("button", { name: "Expand uploads" }))
    .toHaveAttribute("aria-expanded", "false");
  expect(document.querySelector('[data-slot="upload-panel-list"]')).toBeNull();
  await expect
    .element(panel.getByRole("progressbar", { name: "Uploading 3 items" }))
    .toBeInTheDocument();
});

test("publishes --upload-panel-inset while on screen and clears it after", async () => {
  const screen = await render(<Harness />);
  const inset = () =>
    document.documentElement.style.getPropertyValue("--upload-panel-inset");
  await expect.poll(() => parseInt(inset(), 10)).toBeGreaterThan(40);
  await screen.unmount();
  expect(inset()).toBe("");
});

test("closing while active asks first; confirming cancels and dismisses", async () => {
  const onCancelAll = vi.fn();
  const onDismiss = vi.fn();
  const screen = await render(
    <Harness onCancelAll={onCancelAll} onDismiss={onDismiss} />,
  );
  await screen.getByRole("button", { name: "Close uploads" }).click();
  const dialog = screen.getByRole("alertdialog", { name: "Cancel 3 uploads?" });
  await expect.element(dialog).toBeVisible();
  await expectNoA11yViolations(document.body);
  (
    dialog
      .getByRole("button", { name: "Cancel uploads" })
      .element() as HTMLElement
  ).click();
  expect(onCancelAll).toHaveBeenCalledOnce();
  expect(onDismiss).toHaveBeenCalledOnce();
});

test("failures stay with Retry; interrupted rows offer Choose file", async () => {
  const onRetry = vi.fn();
  const onResume = vi.fn();
  const onRetryFailed = vi.fn();
  const screen = await render(
    <UploadPanel
      items={[
        { id: "a", name: "a.pdf", size: MB, status: "done" },
        {
          id: "b",
          name: "b.mov",
          size: MB,
          status: "failed",
          error: "Network connection lost",
        },
        { id: "c", name: "c.zip", size: MB, status: "interrupted" },
      ]}
      summary={{
        ...activeSummary,
        done: 1,
        failed: 1,
        status: "failed",
        timeLeftMs: null,
      }}
      onRetry={onRetry}
      onResume={onResume}
      onRetryFailed={onRetryFailed}
    />,
  );
  await expect
    .element(header().getByText("1 of 3 uploads failed"))
    .toBeVisible();
  await expect
    .element(screen.getByText("Network connection lost"))
    .toBeVisible();
  await screen.getByRole("button", { name: "Retry b.mov" }).click();
  expect(onRetry).toHaveBeenCalledWith("b");
  await screen.getByRole("button", { name: "Choose file: c.zip" }).click();
  expect(onResume).toHaveBeenCalledWith("c");
  await screen.getByRole("button", { name: "Retry failed" }).click();
  expect(onRetryFailed).toHaveBeenCalledOnce();
  await expectNoA11yViolations(document.body);
});

test("a folder is one row with aggregate progress that expands to its files", async () => {
  const screen = await render(
    <UploadPanel
      items={[
        {
          type: "folder",
          id: "f",
          name: "Site photos",
          files: [
            { id: "1", name: "1.jpg", size: MB, status: "done" },
            {
              id: "2",
              name: "2.jpg",
              size: MB,
              bytesDone: MB / 2,
              status: "uploading",
            },
          ],
        },
      ]}
      summary={{ ...activeSummary, total: 2, done: 1 }}
    />,
  );
  await expect.element(screen.getByText("1 of 2 uploaded · 75%")).toBeVisible();
  await expect
    .element(screen.getByRole("progressbar", { name: "Site photos" }))
    .toHaveAttribute("aria-valuenow", "75");
  const toggle = screen.getByRole("button", {
    name: "Show files in Site photos",
  });
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
  await expect.element(screen.getByText("2.jpg")).toBeVisible();
  await expectNoA11yViolations(document.body);
});

test("the done card dismisses itself after 8 s, paused while hovered", async () => {
  const onDismiss = vi.fn();
  const screen = await render(
    <UploadPanel
      items={[{ id: "a", name: "a.pdf", size: MB, status: "done" }]}
      summary={{ ...activeSummary, total: 1, done: 1, status: "done" }}
      onDismiss={onDismiss}
      autoDismissMs={300}
    />,
  );
  const panel = screen.getByRole("region", { name: "Uploads" });
  await expect.element(panel).toHaveAttribute("data-state", "done");
  await expect.element(header().getByText("1 upload complete")).toBeVisible();
  expect(document.querySelector('[data-slot="upload-panel-list"]')).toBeNull();
  panel
    .element()
    .dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 500));
  expect(onDismiss).not.toHaveBeenCalled();
  panel
    .element()
    .dispatchEvent(new PointerEvent("pointerout", { bubbles: true }));
  await expect.poll(() => onDismiss.mock.calls.length).toBe(1);
});

test("announces milestones only", async () => {
  const screen = await render(<Harness />);
  const region = () =>
    document.querySelector('[data-slot="announcer"]')?.textContent;
  await expect.poll(region).toBe("Uploading 3 items");
  await screen.rerender(
    <Harness
      summary={{ ...activeSummary, bytesDone: 3 * MB, timeLeftMs: 60_000 }}
    />,
  );
  expect(region()).toBe("Uploading 3 items");
  await screen.rerender(
    <Harness
      items={[{ id: "a", name: "a.pdf", size: MB, status: "done" }]}
      summary={{ ...activeSummary, done: 3, status: "done" }}
    />,
  );
  await expect.poll(region).toBe("3 uploads complete");
});

test("on a phone it is a bar that opens the list in a bottom sheet", async () => {
  await page.viewport(390, 844);
  const screen = await render(<Harness />);
  const panel = screen.getByRole("region", { name: "Uploads" });
  await expect.element(panel).toHaveAttribute("data-state", "collapsed");
  await panel.getByRole("button", { name: /Uploading 3 items/ }).click();
  const sheet = screen.getByRole("dialog", { name: "Uploading 3 items" });
  await expect.element(sheet).toBeVisible();
  await expect.element(sheet.getByText("photo.jpg")).toBeVisible();
  await expectNoA11yViolations(document.body);
});
