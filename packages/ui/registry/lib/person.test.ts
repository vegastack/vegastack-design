import { expect, test } from "vitest";
import { personInitials } from "./person";

test("first letter of the first and last word", () => {
  expect(personInitials("Asha Rao")).toBe("AR");
  expect(personInitials("  asha k  rao ")).toBe("AR");
});

test("a single word gives its first two letters", () => {
  expect(personInitials("asha")).toBe("AS");
});

test("an empty name falls back to the email's first two characters", () => {
  expect(personInitials("", "ops@acme.com")).toBe("OP");
  expect(personInitials("   ")).toBe("");
});
