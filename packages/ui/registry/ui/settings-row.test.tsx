import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { afterEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
// Real Tailwind + tokens for the geometry tests below (control widths, the matrix's columns and
// its container query); the structural tests above read class strings and are unaffected.
import "../../test/stacking.css";
import { Input } from "./input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";
import { Switch } from "./switch";
import {
  SettingsCard,
  SettingsMatrix,
  SettingsRow,
  SettingsSection,
  type SettingsMatrixRow,
} from "./settings-row";

afterEach(async () => {
  await page.viewport(414, 896);
});

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

// The structural tests read class strings; the `controlSize` and matrix tests at the end of the
// file measure real geometry against the compiled CSS imported above.

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

test("actions stay on the title row beside a long description", async () => {
  const screen = await render(
    <SettingsSection
      title="What you hear about"
      description="In-app: always. Push goes to the mobile app."
      actions={<span>saved</span>}
    >
      <div>body</div>
    </SettingsSection>,
  );
  // This harness compiles no CSS: pin the recipe. With a description the text column grows from a
  // 16rem basis (so a
  // long description never claims the whole row and pushes the actions under it), and with a
  // description the actions top-align with the title.
  const header = screen.container.querySelector(
    '[data-slot="settings-section-header"]',
  );
  expect(header).toHaveClass(
    "has-data-[slot=settings-section-description]:items-start",
  );
  expect(header?.firstElementChild).toHaveClass(
    "has-data-[slot=settings-section-description]:flex-[1_1_16rem]",
    "min-w-0",
  );
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

const controlBox = (row: Element) =>
  row
    .querySelector<HTMLElement>('[data-slot="settings-row-control"]')!
    .getBoundingClientRect();

test("controlSize: sm, md and lg are 160, 256 and 320px, and every control ends on one right edge", async () => {
  await page.viewport(1280, 900);
  const screen = await render(
    <SettingsCard style={{ width: 720 }}>
      <SettingsRow label="Short code" controlSize="sm">
        <Input aria-label="Short code" className="w-48" />
      </SettingsRow>
      <SettingsRow label="Name">
        <Input aria-label="Name" />
      </SettingsRow>
      <SettingsRow label="Languages" controlSize="lg">
        <Input aria-label="Languages" />
      </SettingsRow>
      <SettingsRow label="Digest">
        <Switch aria-label="Digest" />
      </SettingsRow>
      <SettingsRow label="Country">
        <div data-slot="country-select">
          <button type="button">India</button>
        </div>
      </SettingsRow>
    </SettingsCard>,
  );
  const rows = [
    ...screen.container.querySelectorAll('[data-slot="settings-row"]'),
  ];
  const [sm, md, lg, auto, country] = rows.map(controlBox);
  // The searchable selects (country, region) count as field controls too.
  expect(Math.round(country!.width)).toBe(256);
  expect(Math.round(sm!.width)).toBe(160);
  // No controlSize: a field control takes md.
  expect(Math.round(md!.width)).toBe(256);
  expect(Math.round(lg!.width)).toBe(320);
  // A switch keeps its own width…
  expect(Math.round(auto!.width)).toBe(32);
  // …and every control ends on the same right edge.
  for (const box of [md, lg, auto]) {
    expect(Math.round(box!.right)).toBe(Math.round(sm!.right));
  }
  // The control fills its slot whatever width class it carries (the slot sets the measure).
  const input = screen.getByRole("textbox", { name: "Short code" }).element();
  expect(Math.round(input.getBoundingClientRect().width)).toBe(160);
  expect(
    rows[0]!.querySelector('[data-slot="settings-row-control"]'),
  ).toHaveAttribute("data-control-size", "sm");
  await expectNoA11yViolations(screen.container);
});

test("controlSize: a trailing status keeps its size beside the control; auto opts a field out", async () => {
  await page.viewport(1280, 900);
  const screen = await render(
    <SettingsCard style={{ width: 720 }}>
      <SettingsRow label="Zone">
        <InputGroup>
          <InputGroupInput aria-label="Zone" />
          <InputGroupAddon align="inline-end">
            <span data-testid="tick" className="size-4" />
          </InputGroupAddon>
        </InputGroup>
      </SettingsRow>
      <SettingsRow label="Slug" controlSize="md">
        <Input aria-label="Slug" />
        <span data-testid="status" className="size-4 shrink-0" />
      </SettingsRow>
      <SettingsRow label="Code" controlSize="auto">
        <Input aria-label="Code" className="w-24" />
      </SettingsRow>
    </SettingsCard>,
  );
  const rows = [
    ...screen.container.querySelectorAll('[data-slot="settings-row"]'),
  ];
  expect(Math.round(controlBox(rows[0]!).width)).toBe(256);
  const slug = screen.getByRole("textbox", { name: "Slug" }).element();
  const status = screen.getByTestId("status").element();
  expect(Math.round(status.getBoundingClientRect().width)).toBe(16);
  // 256 = the input, the 8px gap and the 16px status.
  expect(Math.round(slug.getBoundingClientRect().width)).toBe(232);
  expect(Math.round(controlBox(rows[2]!).width)).toBe(96);
});

test("controlSize: a stacked (narrow) row's control spans the row", async () => {
  await page.viewport(390, 844);
  const screen = await render(
    <SettingsCard style={{ width: 320 }}>
      <SettingsRow label="Name" controlSize="sm">
        <Input aria-label="Name" />
      </SettingsRow>
    </SettingsCard>,
  );
  const row = screen.container.querySelector('[data-slot="settings-row"]')!;
  // The card is 320 wide: a 1px border and 16px of row padding each side.
  expect(Math.round(controlBox(row).width)).toBe(286);
});

const ROWS = (
  onChange?: SettingsMatrixRow["onChange"],
): SettingsMatrixRow[] => [
  { label: "Assigned to me", values: [true, true], onChange },
  {
    label: "Mentions",
    description: "When someone @mentions you.",
    values: [true, false],
    onChange,
  },
  {
    label: "Weekly summary",
    values: [false, true],
    onChange,
    disabled: [true, false],
  },
];

test("SettingsMatrix: the column names once, each switch under its column and named by row and column", async () => {
  await page.viewport(1280, 900);
  const onChange = vi.fn();
  const screen = await render(
    <SettingsMatrix
      style={{ width: 720 }}
      label="What you hear about"
      columns={["Push", "Email"]}
      rows={ROWS(onChange)}
    />,
  );
  const header = screen.container.querySelector<HTMLElement>(
    '[data-slot="settings-matrix-header"]',
  )!;
  expect(getComputedStyle(header).display).toBe("grid");
  expect(getComputedStyle(header).position).toBe("sticky");
  const [, push, email] = [...header.children].map((cell) =>
    cell.getBoundingClientRect(),
  );
  const center = (r: DOMRect) => Math.round(r.left + r.width / 2);
  const mentionsEmail = screen.getByRole("switch", { name: "Mentions Email" });
  await expect.element(mentionsEmail).not.toBeChecked();
  expect(center(mentionsEmail.element().getBoundingClientRect())).toBe(
    center(email!),
  );
  const assignedPush = screen.getByRole("switch", {
    name: "Assigned to me Push",
  });
  expect(center(assignedPush.element().getBoundingClientRect())).toBe(
    center(push!),
  );
  // The column name beside each switch is for screen readers only here.
  const cellLabel = mentionsEmail
    .element()
    .closest("label")!
    .querySelector('[data-slot="settings-matrix-cell-label"]')!;
  expect(getComputedStyle(cellLabel).position).toBe("absolute");

  await mentionsEmail.click();
  expect(onChange).toHaveBeenCalledWith(1, true);
  await expect
    .element(screen.getByRole("switch", { name: "Weekly summary Push" }))
    .toBeDisabled();
  await expectNoA11yViolations(screen.container);
});

test("SettingsMatrix narrow: no header, each switch with its column name beside it", async () => {
  await page.viewport(390, 844);
  const onChange = vi.fn();
  const screen = await render(
    <SettingsMatrix
      style={{ width: 358 }}
      columns={["Push", "Email"]}
      rows={ROWS(onChange)}
    />,
  );
  const header = screen.container.querySelector<HTMLElement>(
    '[data-slot="settings-matrix-header"]',
  )!;
  expect(getComputedStyle(header).display).toBe("none");
  const toggle = screen.getByRole("switch", { name: "Mentions Push" });
  await expect.element(toggle).not.toHaveAttribute("aria-readonly", "true");
  const cellLabel = toggle
    .element()
    .closest("label")!
    .querySelector<HTMLElement>('[data-slot="settings-matrix-cell-label"]')!;
  expect(getComputedStyle(cellLabel).position).not.toBe("absolute");
  expect(cellLabel.getBoundingClientRect().width).toBeGreaterThan(0);
  // The switches sit under the label, not beside it.
  const label = screen.getByText("Mentions").element().getBoundingClientRect();
  expect(toggle.element().getBoundingClientRect().top).toBeGreaterThan(
    label.bottom,
  );
  // On a phone the column name is part of the tap target.
  await expect.element(toggle).toBeChecked();
  await userEvent.click(cellLabel);
  expect(onChange).toHaveBeenCalledWith(0, false);
  await expectNoA11yViolations(screen.container);
});

test("SettingsMatrix: a row without onChange is read-only, not a switch that never moves", async () => {
  const screen = await render(
    <SettingsMatrix
      columns={["Push"]}
      rows={[{ label: "Security alerts", values: [true] }]}
    />,
  );
  await expect
    .element(screen.getByRole("switch", { name: "Security alerts Push" }))
    .toHaveAttribute("aria-readonly", "true");
});
