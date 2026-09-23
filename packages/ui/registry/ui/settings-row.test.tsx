import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { SettingsCard, SettingsRow, SettingsSection } from "./settings-row";

test("renders the row label and its control slot", async () => {
  const screen = await render(
    <SettingsRow label="Workspace name" description="Shown across the product.">
      <button type="button">Edit</button>
    </SettingsRow>,
  );
  await expect.element(screen.getByText("Workspace name")).toBeInTheDocument();
  await expect
    .element(screen.getByText("Shown across the product."))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Edit" }))
    .toBeInTheDocument();
});

test("row carries its data-slot and divider parts", async () => {
  const screen = await render(
    <SettingsRow label="Email">
      <span>on</span>
    </SettingsRow>,
  );
  const { container } = screen;
  const row = container.querySelector('[data-slot="settings-row"]');
  expect(row).not.toBeNull();
  expect(
    container.querySelector('[data-slot="settings-row-label"]'),
  ).not.toBeNull();
  expect(
    container.querySelector('[data-slot="settings-row-control"]'),
  ).not.toBeNull();
});

test("renders a real label when controlId is provided", async () => {
  const screen = await render(
    <SettingsRow label="Workspace name" controlId="workspace-name">
      <input id="workspace-name" defaultValue="Acme" />
    </SettingsRow>,
  );
  const input = screen.getByLabelText("Workspace name");
  await expect.element(input).toBeInTheDocument();
});

test("row is its own named @container and its inner layout row responds to container width, not viewport", async () => {
  const screen = await render(
    <SettingsRow label="Long setting">
      <button type="button">Edit</button>
    </SettingsRow>,
  );
  const row = screen.container.querySelector('[data-slot="settings-row"]');
  // The row establishes the container itself — works standalone, no SettingsCard required.
  expect(row?.className).toContain("@container/settings-row");
  // The inner layout row (the row's direct child) stacks by default and queries the
  // `settings-row` container — a `sm:` viewport breakpoint would ignore a narrow ancestor
  // (e.g. a settings row in a narrow card on a wide screen); a container query doesn't.
  const layout = row?.firstElementChild;
  expect(layout?.className).toContain("flex-col");
  expect(layout?.className).toContain("@sm/settings-row:flex-row");
});

// Note: this suite compiles no CSS (see vitest.config.ts / the note in
// truncated-text.test.tsx), so the `@container`/`@sm:` utilities above are inert class
// strings here — real container-query engagement (the row measuring its OWN ancestor width
// vs. the viewport) is proven visually by the VRT layer, not this fast structural suite.

test("section renders its title and description", async () => {
  const screen = await render(
    <SettingsSection
      title="Notifications"
      description="Choose what you hear about."
    >
      <div>body</div>
    </SettingsSection>,
  );
  await expect.element(screen.getByText("Notifications")).toBeInTheDocument();
  await expect
    .element(screen.getByText("Choose what you hear about."))
    .toBeInTheDocument();
  await expect.element(screen.getByText("body")).toBeInTheDocument();
});

test("titleAs picks the heading level so a page keeps a valid outline", async () => {
  // A settings page nests sections at different depths; a hard-coded <h3> everywhere
  // breaks heading navigation for a screen-reader user.
  const screen = await render(
    <SettingsSection titleAs="h2" title="Notifications" />,
  );
  const title = screen.container.querySelector(
    '[data-slot="settings-section-title"]',
  );
  expect(title?.tagName).toBe("H2");
  // The visual role is unchanged — only the document structure moves.
  // One token per `classList.contains` call: the section-title role is two utilities now.
  expect(title?.classList.contains("text-base")).toBe(true);
  expect(title?.classList.contains("font-medium")).toBe(true);
});

test("compound parts each expose their data-slot", async () => {
  const screen = await render(
    <SettingsSection title="Account">
      <SettingsCard>
        <SettingsRow label="Name">
          <span>Ada</span>
        </SettingsRow>
        <SettingsRow label="Plan">
          <span>Pro</span>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>,
  );
  const { container } = screen;
  expect(
    container.querySelector('[data-slot="settings-section"]'),
  ).not.toBeNull();
  expect(
    container.querySelector('[data-slot="settings-section-title"]'),
  ).not.toBeNull();
  expect(container.querySelector('[data-slot="settings-card"]')).not.toBeNull();
  // Default level is unchanged (h3) — titleAs only makes it choosable.
  expect(
    container.querySelector('[data-slot="settings-section-title"]')?.tagName,
  ).toBe("H3");
  expect(container.querySelectorAll('[data-slot="settings-row"]')).toHaveLength(
    2,
  );
});

test("forwards ref to the underlying row element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <SettingsRow ref={ref} label="Ref">
      <span>x</span>
    </SettingsRow>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("settings-row");
});

test("no a11y violations", async () => {
  const screen = await render(
    <SettingsSection
      title="Notifications"
      description="Choose what you hear about."
    >
      <SettingsCard>
        <SettingsRow label="Email" description="Product updates and tips.">
          <button type="button" aria-label="Toggle email notifications">
            Toggle
          </button>
        </SettingsRow>
        <SettingsRow label="SMS" description="Critical alerts only.">
          <button type="button" aria-label="Toggle SMS notifications">
            Toggle
          </button>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>,
  );
  await expectNoA11yViolations(screen.container);
});

test("SettingsCard IS upstream's Card, flattened for a divided list", async () => {
  // Batch 7c of the shadcn reset stopped re-deriving the card box here. What this asserts is
  // that the surface comes from `card.tsx` — the same radius, ground and hairline every other
  // card on the page has — and that the only thing this file adds is the flush geometry a
  // divided row list needs.
  const screen = await render(
    <SettingsCard data-testid="card">
      <SettingsRow label="A">
        <span>1</span>
      </SettingsRow>
      <SettingsRow label="B">
        <span>2</span>
      </SettingsRow>
    </SettingsCard>,
  );
  const card = screen.getByTestId("card").element() as HTMLElement;
  // Upstream's own card contract, not a copy of its values.
  expect(card.className).toContain("rounded-xl");
  expect(card.className).toContain("bg-card");
  // BRD-1: the hairline is a real border, not upstream's ring outline.
  expect(card.className.split(/\s+/)).toContain("border");
  expect(card.className.split(/\s+/)).toContain("border-border");
  expect(card.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
  expect(card.className).toContain("overflow-hidden");
  // …flattened: no card padding, no inter-section gap, so rows sit edge to edge.
  expect(card.className).toContain("py-0");
  expect(card.className).toContain("gap-0");
  // The re-stamped slot still wins over `Card`'s own, because it is spread after it.
  expect(card.getAttribute("data-slot")).toBe("settings-card");

  // The last row's divider is collapsed so the list ends on the card edge.
  expect(card.className).toContain(
    "[&>[data-slot=settings-row]:last-child]:border-b-0",
  );
});
