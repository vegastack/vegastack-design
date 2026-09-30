import "./geometry.css"; // compiled Tailwind + @vegastack token theme
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { ActionBar, ActionBarButton } from "../registry/ui/action-bar";
import { BreadcrumbTrail } from "../registry/ui/breadcrumb-cascade";
import { DataList } from "../registry/ui/data-list";

// Measured on compiled CSS: the breadcrumb trail's folding, the ActionBar at a phone's width, and
// DataList's keyboard-focus cue.

const STEPS = [
  { label: "Library", href: "/library" },
  { label: "Shared with the whole team", href: "/library/shared" },
  { label: "Clients and partners", href: "/library/f/1" },
  { label: "Quarterly reviews", href: "/library/f/2" },
  { label: "Q3 kitchen refit — final scope.docx" },
];

const trail = () =>
  document.querySelector<HTMLElement>('[data-slot="breadcrumb-trail"]')!;
const current = () =>
  trail().querySelector<HTMLElement>('[data-slot="breadcrumb-page"]')!;
const truncated = (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1;

test("BreadcrumbTrail shows every step when it fits", async () => {
  await render(
    <div style={{ width: 1000 }}>
      <BreadcrumbTrail steps={STEPS} />
    </div>,
  );
  await expect.poll(() => trail().dataset.folded).toBeUndefined();
  expect(
    trail().querySelectorAll('[data-slot="breadcrumb-link"]'),
  ).toHaveLength(4);
  expect(truncated(current())).toBe(false);
});

test("BreadcrumbTrail folds the middle steps before it shortens the current step", async () => {
  await render(
    <div style={{ width: 600 }}>
      <BreadcrumbTrail steps={STEPS} />
    </div>,
  );
  await expect
    .poll(() => Number(trail().dataset.folded ?? 0))
    .toBeGreaterThan(0);
  // The root and the parent stay; the current step is whole.
  const links = [...trail().querySelectorAll('[data-slot="breadcrumb-link"]')];
  expect(links.map((a) => a.textContent)).toContain("Library");
  expect(links.map((a) => a.textContent)).toContain("Quarterly reviews");
  expect(truncated(current())).toBe(false);
  expect(trail().scrollWidth).toBeLessThanOrEqual(trail().clientWidth + 1);
  await userEvent.click(
    trail().querySelector<HTMLElement>('[aria-label="Show path"]')!,
  );
  await expect
    .poll(() => document.querySelector('[role="menuitem"]')?.textContent)
    .toBe("Shared with the whole team");
  await userEvent.keyboard("{Escape}");
});

test("BreadcrumbTrail shortens the current step only when nothing is left to fold", async () => {
  await render(
    <div style={{ width: 260 }}>
      <BreadcrumbTrail steps={STEPS} />
    </div>,
  );
  await expect.poll(() => Number(trail().dataset.folded ?? 0)).toBe(2);
  expect(truncated(current())).toBe(true);
  expect(trail().scrollWidth).toBeLessThanOrEqual(trail().clientWidth + 1);
});

test("ActionBar at 390px: primary actions and the ⋯ fit, with no horizontal scroll", async () => {
  // The fold follows the viewport, so this measures the bar's own width budget at a phone's size.
  await render(
    <div style={{ width: 390 }}>
      <ActionBar status="12 selected" className="max-w-[358px]">
        <ActionBarButton>Share</ActionBarButton>
        <ActionBarButton>Move</ActionBarButton>
        <ActionBarButton aria-label="More actions">⋯</ActionBarButton>
      </ActionBar>
    </div>,
  );
  const actions = document.querySelector<HTMLElement>(
    '[data-slot="action-bar-actions"]',
  )!;
  expect(actions.scrollWidth).toBeLessThanOrEqual(actions.clientWidth + 1);
});

interface Person {
  id: string;
  name: string;
  email: string;
}

for (const theme of ["light", "dark"] as const) {
  test(`DataList: keyboard focus in a row paints the wash and a foreground start bar — ${theme}`, async () => {
    const screen = await render(
      <div className={theme === "dark" ? "dark" : undefined}>
        <div className="bg-background p-4 text-foreground">
          <button type="button">before</button>
          <DataList<Person>
            aria-label="People"
            columns={[
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
            ]}
            data={[{ id: "1", name: "Ada", email: "ada@vega.dev" }]}
            getRowId={(p) => p.id}
            onRowClick={() => {}}
          />
        </div>
      </div>,
    );
    screen.getByRole("button", { name: "before" }).element().focus();
    await userEvent.tab();
    const row = document.querySelector<HTMLElement>(
      '[data-slot="data-list-row"]',
    )!;
    await expect.poll(() => row.matches(":has(:focus-visible)")).toBe(true);
    const cell = row.firstElementChild as HTMLElement;
    const image = getComputedStyle(cell).backgroundImage;
    expect(image).toContain("gradient");
    expect(getComputedStyle(cell).backgroundSize).toBe("2px 100%");
    expect(getComputedStyle(row).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });
}
