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

// Structural, not computed: the unit lane renders WITHOUT compiled CSS (only `test/contrast.css`
// is compiled, for the contrast gate), so `getComputedStyle` here reports UA defaults — `0s` for
// any duration — and an assertion against it would be green for the wrong reason. The class pair
// is what this file owns; the COMPUTED 150ms/200ms values are measured in a real browser by
// `docs/audits/2026-09-07-system-audit/probe-overlays.mjs`, which is where D11 is actually proven.
test("the popup carries the D11 floating motion pair", () => {
  expect(floatingPopupVariants({ motion: "fast" })).toContain("duration-fast");
  expect(floatingPopupVariants({ motion: "fast" })).toContain("ease-standard");
  // NavigationMenu is the one floating surface D11 puts at the modal tier.
  expect(floatingPopupVariants({ motion: "base" })).toContain("duration-base");
});

test("mergeStateClassName preserves Base UI's state-function form", () => {
  const merged = mergeStateClassName("base", (state: { open: boolean }) =>
    state.open ? "open" : undefined,
  );
  expect(typeof merged).toBe("function");
  expect(
    (merged as (s: { open: boolean }) => string)({ open: true }),
  ).toContain("open");
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

  // The frame draws exactly one hairline, at the bottom; the field draws none. Asserted on the
  // class list rather than `getComputedStyle` for the same reason as the motion test above: this
  // lane renders without compiled CSS, so every computed border width would read `0px` and the
  // "field draws no border" half would pass even if the field DID draw one.
  expect(frame.className).toContain("border-b");
  expect(frame.className).toContain("border-border");
  expect(frame.className).not.toContain("border-t");
  expect(field.className).not.toContain("border");
  await expectNoA11yViolations(document.body);
});
