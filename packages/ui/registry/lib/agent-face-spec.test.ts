import { expect, test } from "vitest";
import {
  FACE_PALETTE_IDS,
  FACE_PRESET_IDS,
  FACE_PRESETS,
  facePreset,
} from "./agent-face-spec";

test("18 presets and 9 palettes, each id once", () => {
  expect(FACE_PRESET_IDS).toHaveLength(18);
  expect(new Set(FACE_PRESET_IDS).size).toBe(18);
  expect(FACE_PALETTE_IDS).toEqual([
    "blue",
    "violet",
    "pink",
    "orange",
    "green",
    "teal",
    "ink",
    "mist",
    "glass",
  ]);
});

test("every preset draws a body (a path or layers) and a Dot silhouette (its own or the body refitted)", () => {
  for (const p of FACE_PRESETS) {
    expect(Boolean(p.pebble.d) || Boolean(p.pebble.layers?.length)).toBe(true);
    // A Dot is its own path, or the body's path refitted ([k, ox, oy]).
    if (p.dot.d) {
      expect(p.dot.d).toMatch(/^M[\d.]+ [\d.]+/);
      expect(p.dot.d.endsWith("Z")).toBe(true);
    } else {
      expect(p.dot.fit).toHaveLength(3);
      expect(p.pebble.d).toBeTruthy();
    }
  }
});

test("facePreset finds a preset by id, and falls back to the first", () => {
  expect(facePreset("nut").name).toBe("Nut");
  expect(facePreset("missing" as never).id).toBe(FACE_PRESETS[0]!.id);
});
