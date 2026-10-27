// The OG image fonts and the one question asked of them: can they draw this text? Shared by
// `verify-metadata.mjs` (the built export, at deploy) and `verify-og-glyphs.mjs` (page
// frontmatter, in PR lint), so a glyph the OG fonts lack fails a pull request, not a release.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

/** The fonts `lib/og.tsx` draws with, pinned by hash. */
export const OG_FONTS = {
  "Geist-Regular.ttf":
    "5c8968eafb98a4c4f47033daf29e38e284a6f2a82eb017d171ab040fe7c4b615",
  "Geist-Bold.ttf":
    "e866b423b755233cae8bce6a37519f6fe630be9772fa08fc3114bff15bc8580f",
  "NotoSansSymbols2-Regular.woff":
    "037f0debac96bfbae0376e70a419ddef2c0b17b12655396c89ac6d950ee2bca0",
};

/** Reads the OG fonts from `<appDir>/assets/fonts`, failing on a font that drifted. */
export async function loadOgFonts(appDir) {
  const fonts = new Map();
  for (const [font, expectedHash] of Object.entries(OG_FONTS)) {
    const bytes = await readFile(path.join(appDir, "assets/fonts", font));
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== expectedHash) throw new Error(`${font} drifted`);
    fonts.set(font, bytes);
  }
  return fonts;
}

/** The distinct non-space characters of `text` that no OG font can draw. */
export function unsupportedOgCharacters(text, fonts) {
  const missing = [];
  for (const character of new Set(text)) {
    if (/\s/u.test(character)) continue;
    const codePoint = character.codePointAt(0);
    if (
      ![...fonts].some(([font, bytes]) => fontSupports(bytes, codePoint, font))
    )
      missing.push(character);
  }
  return missing;
}

/** `⋯ (U+22EF)`. */
export function describeCharacter(character) {
  const codePoint = character.codePointAt(0);
  return `${character} (U+${codePoint.toString(16).toUpperCase().padStart(4, "0")})`;
}

function getFontTable(bytes, tag, label) {
  if (bytes.subarray(0, 4).toString("ascii") === "wOFF") {
    const tableCount = bytes.readUInt16BE(12);
    for (let index = 0; index < tableCount; index++) {
      const entry = 44 + index * 20;
      if (bytes.subarray(entry, entry + 4).toString("ascii") !== tag) continue;
      const offset = bytes.readUInt32BE(entry + 4);
      const compressedLength = bytes.readUInt32BE(entry + 8);
      const originalLength = bytes.readUInt32BE(entry + 12);
      const table = bytes.subarray(offset, offset + compressedLength);
      return compressedLength === originalLength ? table : inflateSync(table);
    }
  } else {
    const tableCount = bytes.readUInt16BE(4);
    for (let index = 0; index < tableCount; index++) {
      const entry = 12 + index * 16;
      if (bytes.subarray(entry, entry + 4).toString("ascii") !== tag) continue;
      const offset = bytes.readUInt32BE(entry + 8);
      const length = bytes.readUInt32BE(entry + 12);
      return bytes.subarray(offset, offset + length);
    }
  }
  throw new Error(`${label}: missing ${tag} font table`);
}

function fontSupports(bytes, codePoint, label) {
  const cmap = getFontTable(bytes, "cmap", label);
  const subtableCount = cmap.readUInt16BE(2);
  for (let index = 0; index < subtableCount; index++) {
    const subtableOffset = cmap.readUInt32BE(4 + index * 8 + 4);
    const format = cmap.readUInt16BE(subtableOffset);
    if (format === 12) {
      const groupCount = cmap.readUInt32BE(subtableOffset + 12);
      for (let group = 0; group < groupCount; group++) {
        const groupOffset = subtableOffset + 16 + group * 12;
        const start = cmap.readUInt32BE(groupOffset);
        const end = cmap.readUInt32BE(groupOffset + 4);
        if (codePoint >= start && codePoint <= end) {
          return cmap.readUInt32BE(groupOffset + 8) + codePoint - start !== 0;
        }
      }
    }
    if (format === 4 && codePoint <= 0xffff) {
      const segmentCount = cmap.readUInt16BE(subtableOffset + 6) / 2;
      const endCodes = subtableOffset + 14;
      const startCodes = endCodes + segmentCount * 2 + 2;
      const idDeltas = startCodes + segmentCount * 2;
      const idRangeOffsets = idDeltas + segmentCount * 2;
      for (let segment = 0; segment < segmentCount; segment++) {
        const end = cmap.readUInt16BE(endCodes + segment * 2);
        const start = cmap.readUInt16BE(startCodes + segment * 2);
        if (codePoint < start || codePoint > end) continue;
        const delta = cmap.readInt16BE(idDeltas + segment * 2);
        const rangeOffsetAddress = idRangeOffsets + segment * 2;
        const rangeOffset = cmap.readUInt16BE(rangeOffsetAddress);
        if (rangeOffset === 0) return ((codePoint + delta) & 0xffff) !== 0;
        const glyphAddress =
          rangeOffsetAddress + rangeOffset + (codePoint - start) * 2;
        if (glyphAddress + 2 > cmap.length) return false;
        const glyph = cmap.readUInt16BE(glyphAddress);
        return glyph !== 0 && ((glyph + delta) & 0xffff) !== 0;
      }
    }
  }
  return false;
}
