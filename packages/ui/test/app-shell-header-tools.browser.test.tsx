import "./geometry.css"; // compiled Tailwind + @vegastack token theme
import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test } from "vitest";
import {
  AppShellHeader,
  AppShellHeaderShow,
  AppShellHeaderSlot,
} from "../registry/ui/app-shell";
import { AutoSaveIndicator } from "../registry/ui/auto-save-input";
import { SidebarProvider } from "../registry/ui/sidebar";

/**
 * The top bar's tools by the bar's own width, in compiled CSS: `AppShellHeaderShow` swaps at
 * 40rem, `AutoSaveIndicator compact="narrow"` shows its words only in a wide bar (they stay in the
 * accessible name), and `AppShellHeaderSlot` holds a 32px place empty or not.
 */
function Bar({ width }: { width: number }) {
  return (
    <SidebarProvider>
      <div style={{ width, minWidth: 0, flex: "none" }}>
        <AppShellHeader
          actions={
            <>
              <AppShellHeaderShow when="narrow" data-testid="narrow">
                N
              </AppShellHeaderShow>
              <AppShellHeaderShow when="wide" data-testid="wide">
                W
              </AppShellHeaderShow>
              <AppShellHeaderSlot data-testid="slot" />
              <AutoSaveIndicator
                status="connecting"
                compact="narrow"
                labels={{ connecting: "Reconnecting…" }}
              />
            </>
          }
        >
          Title
        </AppShellHeader>
      </div>
    </SidebarProvider>
  );
}

const shown = (id: string) =>
  getComputedStyle(document.querySelector(`[data-testid=${id}]`)!).display !==
  "none";
const words = () =>
  document.querySelector<HTMLElement>("[data-slot=auto-save-indicator-text]")!;

test("by the bar's own width: narrow-only and wide-only content, the save status's words, a fixed slot", async () => {
  await page.viewport(1440, 900);
  const screen = await render(<Bar width={900} />);
  const header = () =>
    document.querySelector<HTMLElement>("[data-slot=app-shell-header]")!;
  expect(header().getBoundingClientRect().width).toBeGreaterThan(640);
  expect(shown("narrow")).toBe(false);
  expect(shown("wide")).toBe(true);
  expect(words().getBoundingClientRect().width).toBeGreaterThan(20);
  const slot = document
    .querySelector("[data-testid=slot]")!
    .getBoundingClientRect();
  expect(slot.width).toBe(32);
  expect(slot.height).toBe(32);
  await screen.unmount();
  await render(<Bar width={500} />);
  expect(header().getBoundingClientRect().width).toBeLessThan(640);
  expect(shown("narrow")).toBe(true);
  expect(shown("wide")).toBe(false);
  // The words leave the screen but not the accessible name (sr-only: a 1px clipped box).
  expect(words().getBoundingClientRect().width).toBeLessThanOrEqual(1);
  expect(words().textContent).toBe("Reconnecting…");
});
