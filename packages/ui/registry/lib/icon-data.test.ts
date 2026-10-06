import { expect, test, vi } from "vitest";
import { ICON_CATALOGUE, isIconName } from "./icon-data";
import { ICON_COMPONENTS } from "./icon-components";
import { filterPickerEntries } from "./picker-search";

test("catalogue contains 160 unique, renderable canonical names", () => {
  expect(ICON_CATALOGUE).toHaveLength(160);
  expect(new Set(ICON_CATALOGUE.map((entry) => entry.name)).size).toBe(160);
  for (const entry of ICON_CATALOGUE)
    expect(ICON_COMPONENTS[entry.name]).toBeDefined();
  expect(isIconName("not-an-icon")).toBe(false);
});
test("search matches product aliases, all words and spelling variants", () => {
  const entries = ICON_CATALOGUE.map((entry) => ({
    ...entry,
    keywords: [entry.name, ...entry.tags, ...entry.aliases],
  }));
  expect(
    filterPickerEntries(entries, "sales").some(
      (entry) => entry.name === "briefcase-business",
    ),
  ).toBe(true);
  expect(
    filterPickerEntries(entries, "COLOR").map((entry) => entry.name),
  ).toEqual(filterPickerEntries(entries, "colour").map((entry) => entry.name));
  expect(
    filterPickerEntries(entries, "sales office").some(
      (entry) => entry.name === "briefcase-business",
    ),
  ).toBe(true);
  expect(filterPickerEntries(entries, "sales nonexistentword")).toEqual([]);
});

test("failed storage writes retain successive in-memory recent choices", async () => {
  const { rememberPickerRecent, readPickerRecents } =
    await import("./picker-preferences");
  const key = "picker-storage-failure-test";
  localStorage.removeItem(key);
  const write = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
  try {
    rememberPickerRecent(key, "target");
    rememberPickerRecent(key, "briefcase-business");
    expect(readPickerRecents(key)).toEqual(["briefcase-business", "target"]);
  } finally {
    write.mockRestore();
  }
});
