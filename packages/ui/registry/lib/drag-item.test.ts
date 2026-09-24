import { expect, test } from "vitest";
import { dragItemClasses } from "./drag-item";

/* The recipe is a class string, so its contract is the literals a consumer's Tailwind scanner must
   find. The behaviour behind each selector (the hook writing the attributes) is proven in
   use-drag-reorder.test.tsx and sortable-list.test.tsx. */

test("every drop edge the hook can write has a hairline: top, bottom, left and right", () => {
  for (const edge of ["top", "bottom", "left", "right"]) {
    expect(dragItemClasses).toContain(
      `data-[drop-edge=${edge}]:before:absolute`,
    );
    expect(dragItemClasses).toContain(
      `data-[drop-edge=${edge}]:before:bg-primary`,
    );
  }
  // Horizontal edges are vertical lines in the gap beside the item.
  expect(dragItemClasses).toContain("data-[drop-edge=left]:before:-left-1");
  expect(dragItemClasses).toContain("data-[drop-edge=left]:before:w-0.5");
  expect(dragItemClasses).toContain("data-[drop-edge=right]:before:-right-1");
  expect(dragItemClasses).toContain("data-[drop-edge=right]:before:inset-y-0");
});

test("the containing block, lift dim and pending shimmer stay in the recipe", () => {
  const classes = dragItemClasses.split(" ");
  expect(classes).toContain("relative");
  expect(classes).toContain("data-dragging:opacity-50");
  expect(classes).toContain("data-drag-pending:animate-pulse");
});
