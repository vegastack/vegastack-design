import { expect, test } from "vitest";
import { EMOJI, EMOJI_CATEGORIES, getEmoji, matchesEmoji } from "./emoji-data";

test("nine categories, unique characters", () => {
  expect(EMOJI_CATEGORIES).toHaveLength(9);
  const chars = EMOJI_CATEGORIES.flatMap((c) => EMOJI[c].map((e) => e.char));
  expect(new Set(chars).size).toBe(chars.length);
});

test("getEmoji resolves the quick reactions", () => {
  for (const c of ["👍", "❤️", "😄", "🎉", "👀", "🙏"])
    expect(getEmoji(c)).toBeDefined();
  expect(getEmoji("nope")).toBeUndefined();
});

test("matchesEmoji checks names and keywords", () => {
  const up = getEmoji("👍")!;
  expect(matchesEmoji(up, "thumbs")).toBe(true);
  expect(matchesEmoji(up, "approve")).toBe(true);
  expect(matchesEmoji(up, "pizza")).toBe(false);
});
