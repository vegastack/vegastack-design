import { expect, test } from "vitest";
import {
  scrimClasses,
  tileColumnClasses,
  tileCornerClasses,
  tileGridClasses,
  tileGroupClass,
  tileOverlayButtonClasses,
  tileScrollRowClasses,
} from "./tile-overlay";

/* Class-string recipes: the contract is the literals a consumer's Tailwind scanner must find. The
   rendered behaviour is proven in attachment.test.tsx and sortable-list.test.tsx. */

test("the scrim is scrim-foreground ink on the scrim token, and the overlay button adds the blur", () => {
  expect(scrimClasses).toBe("bg-scrim/40 text-scrim-foreground");
  expect(tileOverlayButtonClasses).toContain("bg-scrim/40");
  expect(tileOverlayButtonClasses).toContain("backdrop-blur-sm");
  expect(tileOverlayButtonClasses).toContain(
    "[&_svg:not([class*='text-']):not([data-icon-tone])]:text-scrim-foreground",
  );
});

test("the corner slots sit inset from the corner and reveal on hover, focus and touch", () => {
  expect(tileGroupClass).toBe("group/tile");
  for (const side of ["start", "end"] as const) {
    const slot = tileCornerClasses[side];
    expect(slot).toContain(`${side}-3`);
    expect(slot).toContain("top-3");
    expect(slot).toContain("z-20");
    for (const reveal of [
      "opacity-0",
      "group-hover/tile:opacity-100",
      "group-focus-within/tile:opacity-100",
      "has-aria-expanded:opacity-100",
      "pointer-coarse:opacity-100",
    ])
      expect(slot).toContain(reveal);
  }
});

test("the grid caps a row at --tile-columns and never shrinks a tile below 8.5rem", () => {
  expect(tileColumnClasses[4]).toBe("[--tile-columns:4]");
  expect(tileGridClasses).toContain("var(--tile-columns)");
  expect(tileGridClasses).toContain("--spacing(34)");
  expect(tileGridClasses).toContain("gap-3");
  expect(tileScrollRowClasses).toContain("var(--tile-columns)");
});
