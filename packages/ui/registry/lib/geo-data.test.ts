import { expect, test } from "vitest";
import { COUNTRIES, REGIONS, getCountryByCode, getRegions } from "./geo-data";

/* The dataset assertions used to live inside country-select.test.tsx and region-select.test.tsx,
   which is where the data itself lived. Both moved here with the data (audit B8-02 / D27): the
   component tests now assert component behaviour, this file asserts the shipped facts. */

test("getCountryByCode is case-insensitive and tolerates undefined", () => {
  expect(getCountryByCode("us")?.name).toBe("United States");
  expect(getCountryByCode("GB")?.name).toBe("United Kingdom");
  expect(getCountryByCode(undefined)).toBeUndefined();
  expect(getCountryByCode("ZZ")).toBeUndefined();
});

test("ships the full ISO 3166-1 dataset (198 countries, unique codes)", () => {
  expect(COUNTRIES).toHaveLength(198);
  // No duplicate ISO codes (would break React keys + Base UI Combobox filtering).
  expect(new Set(COUNTRIES.map((country) => country.code)).size).toBe(198);
  for (const country of COUNTRIES) {
    expect(country.code).toMatch(/^[A-Z]{2}$/);
    expect(country.name.length).toBeGreaterThan(0);
    expect(country.flag.length).toBeGreaterThan(0);
  }
});

test("resolves countries that were missing from the original compact list", () => {
  // These were absent from the prior 103-country dataset — a real billing/address regression.
  expect(getCountryByCode("RU")?.name).toBe("Russia");
  expect(getCountryByCode("SA")?.name).toBe("Saudi Arabia");
  expect(getCountryByCode("YE")?.name).toBe("Yemen");
  expect(getCountryByCode("UZ")?.name).toBe("Uzbekistan");
  expect(getCountryByCode("mc")?.name).toBe("Monaco");
  expect(getCountryByCode("VA")?.name).toBe("Vatican City");
  expect(getCountryByCode("VE")?.name).toBe("Venezuela");
});

test("every flag is the regional-indicator pair of its ISO code", () => {
  for (const country of COUNTRIES) {
    const codepoints = [...country.flag];
    expect(codepoints).toHaveLength(2);
    for (const codepoint of codepoints) {
      const point = codepoint.codePointAt(0)!;
      expect(point).toBeGreaterThanOrEqual(0x1f1e6);
      expect(point).toBeLessThanOrEqual(0x1f1ff);
    }
  }
});

test("getRegions resolves case-insensitively and returns the shared array", () => {
  expect(getRegions("ca")).toBe(REGIONS.CA);
  expect(getRegions("US").length).toBeGreaterThan(0);
  // A country with no predefined subdivisions gets an empty array, never undefined — the
  // free-text fallback in RegionSelect is driven by `length === 0`.
  expect(getRegions("SG")).toEqual([]);
  expect(getRegions("ZZ")).toEqual([]);
});

test("ships the full subdivision dataset (45 countries, 1187 subdivisions)", () => {
  expect(Object.keys(REGIONS)).toHaveLength(45);
  const total = Object.values(REGIONS).reduce(
    (count, regions) => count + regions.length,
    0,
  );
  expect(total).toBe(1187);
  for (const [country, regions] of Object.entries(REGIONS)) {
    expect(country).toMatch(/^[A-Z]{2}$/);
    expect(regions.length).toBeGreaterThan(0);
    // No duplicate codes within a country.
    expect(new Set(regions.map((region) => region.code)).size).toBe(
      regions.length,
    );
    for (const region of regions) {
      expect(region.code.length).toBeGreaterThan(0);
      expect(region.name.length).toBeGreaterThan(0);
    }
  }
});

test("resolves subdivisions for countries the compact dataset lacked", () => {
  expect(getRegions("RU").find((r) => r.code === "MOW")?.name).toBe("Moscow");
  expect(getRegions("TR").find((r) => r.code === "34")?.name).toBe("İstanbul");
  expect(getRegions("ng").find((r) => r.code === "LA")?.name).toBe("Lagos");
  expect(getRegions("JP").find((r) => r.code === "13")?.name).toBe("Tokyo");
});
