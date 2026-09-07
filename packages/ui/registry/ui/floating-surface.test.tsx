import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Popover } from "@base-ui/react/popover";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  createMenuParts,
  FloatingArrow,
  FloatingSurface,
  floatingPopupVariants,
  mergeStateClassName,
  menuItemVariants,
  PanelSearchFrame,
  PanelSearchInput,
} from "./floating-surface";

function SurfaceExample({ arrow = false }: { arrow?: boolean }) {
  return (
    <Popover.Root defaultOpen>
      <Popover.Trigger>Open</Popover.Trigger>
      <FloatingSurface
        parts={{
          Portal: Popover.Portal,
          Positioner: Popover.Positioner,
          Popup: Popover.Popup,
          Viewport: Popover.Viewport,
        }}
        slot="fixture"
        surface="panel"
        positioning={{ side: "bottom", sideOffset: 8 }}
        arrow={
          arrow ? (
            <FloatingArrow element={Popover.Arrow} slot="fixture-arrow" />
          ) : undefined
        }
      >
        <Popover.Title>Panel</Popover.Title>
      </FloatingSurface>
    </Popover.Root>
  );
}

test("composes Portal → Positioner → Popup and stamps the slot prefix", async () => {
  const screen = await render(<SurfaceExample />);
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  const positioner = document.querySelector('[data-slot="fixture-positioner"]');
  const popup = document.querySelector('[data-slot="fixture-content"]');
  expect(positioner).not.toBeNull();
  expect(popup).not.toBeNull();
  // The popup is the positioner's descendant, not a sibling.
  expect(positioner!.contains(popup!)).toBe(true);
  await expectNoA11yViolations(document.body);
});

test("renders the arrow as the popup's first child when one is passed", async () => {
  await render(<SurfaceExample arrow />);
  const popup = document.querySelector('[data-slot="fixture-content"]')!;
  expect(popup.firstElementChild?.getAttribute("data-slot")).toBe(
    "fixture-arrow",
  );
});

test("the popup carries the D11 floating motion pair", async () => {
  await render(<SurfaceExample />);
  const popup = document.querySelector('[data-slot="fixture-content"]')!;
  const styles = getComputedStyle(popup);
  expect(styles.transitionDuration).toBe("0.15s");
  expect(styles.transitionTimingFunction).not.toBe("linear");
});

test("mergeStateClassName preserves Base UI's state-function form", () => {
  const merged = mergeStateClassName("base", (state: { open: boolean }) =>
    state.open ? "open" : undefined,
  );
  expect(typeof merged).toBe("function");
  expect((merged as (s: { open: boolean }) => string)({ open: true })).toContain(
    "open",
  );
  expect(mergeStateClassName("base", "extra")).toContain("extra");
});

test("every popup recipe stays inside the overlay z-band", () => {
  for (const surface of ["panel", "menu", "tooltip", "navigation"] as const) {
    expect(floatingPopupVariants({ surface })).toContain("z-(--z-overlay)");
  }
});

test("the row recipe climbs the surface ladder rather than a literal", () => {
  const row = menuItemVariants();
  expect(row).toContain("data-[highlighted]:bg-surface-2");
  expect(row).toContain("active:bg-surface-3");
  // rounded-md inside the list's 4px padding keeps the wash off the popup hairline (SP-02).
  expect(row).toContain("rounded-md");
  expect(menuItemVariants({ tone: "destructive" })).toContain(
    "text-destructive-text",
  );
});

test("createMenuParts binds one implementation to a component's slot prefix", async () => {
  const first = createMenuParts("alpha");
  const second = createMenuParts("beta");
  const screen = await render(
    <div>
      <first.Shortcut>⌘K</first.Shortcut>
      <second.Shortcut>⌘J</second.Shortcut>
    </div>,
  );
  await expect.element(screen.getByText("⌘K")).toBeInTheDocument();
  expect(
    document.querySelector('[data-slot="alpha-shortcut"]')?.textContent,
  ).toBe("⌘K");
  expect(
    document.querySelector('[data-slot="beta-shortcut"]')?.textContent,
  ).toBe("⌘J");
});

test("the panel-search row is a hairline header, never a nested box", async () => {
  const screen = await render(
    <PanelSearchFrame>
      <PanelSearchInput aria-label="Search" placeholder="Search…" />
    </PanelSearchFrame>,
  );
  const field = screen.getByRole("searchbox", { name: "Search" }).element();
  const frame = document.querySelector('[data-slot="panel-search"]')!;

  // The frame draws exactly one hairline, at the bottom; the field draws none.
  expect(getComputedStyle(frame).borderBottomWidth).toBe("1px");
  expect(getComputedStyle(frame).borderTopWidth).toBe("0px");
  expect(getComputedStyle(field).borderBottomWidth).toBe("0px");
  await expectNoA11yViolations(document.body);
});
