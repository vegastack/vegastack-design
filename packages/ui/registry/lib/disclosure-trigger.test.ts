import { expect, test } from "vitest";
import { disclosureTriggerClasses } from "./disclosure-trigger";

/* A class-string recipe: the contract is the literal a consumer's Tailwind scanner must find. The
   rendered behaviour is proven in record-aside.test.tsx and data-table-parts.test.tsx. */

test("an expanded disclosure clears the ghost popup-open fill but keeps hover", () => {
  expect(disclosureTriggerClasses).toBe(
    "aria-expanded:not-hover:bg-transparent",
  );
});
