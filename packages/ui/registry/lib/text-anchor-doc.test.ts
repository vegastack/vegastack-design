import { describe, expect, test } from "vitest";
import { Schema, type Node } from "@tiptap/pm/model";
import {
  LEAF_TEXT,
  anchorText,
  leafText,
  offsetsToRange,
  rangeToOffsets,
  textIndex,
} from "./text-anchor-doc";

// The shape of TextEdit's schema that matters here: textblocks, containers of blocks (a toggle
// with its summary, a callout), an inline atom that reads as text (a mention) and one that does
// not (an image).
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    heading: { group: "block", content: "inline*" },
    toggle: { group: "block", content: "toggleSummary block+" },
    toggleSummary: { content: "inline*" },
    callout: { group: "block", content: "block+" },
    text: { group: "inline" },
    mention: {
      group: "inline",
      inline: true,
      atom: true,
      attrs: { label: { default: "" } },
    },
    image: { group: "inline", inline: true, atom: true },
  },
});

const t = (text: string) => schema.text(text);
const p = (...content: Node[]) => schema.node("paragraph", null, content);
const doc = schema.node("doc", null, [
  schema.node("heading", null, [t("Setup")]),
  p(t("Ask "), schema.node("mention", { label: "Asha Rao" }), t(" first.")),
  p(t("See "), schema.node("image"), t(" here")),
  schema.node("toggle", null, [
    schema.node("toggleSummary", null, [t("Wiring")]),
    p(t("red and black")),
  ]),
  schema.node("callout", null, [p(t("Use a 25 A breaker"))]),
]);

const text = anchorText(doc);
const mentionStart = text.indexOf("@Asha Rao");
const mentionEnd = mentionStart + "@Asha Rao".length;
const insideMention = (offset: number) =>
  offset > mentionStart && offset < mentionEnd;

describe("anchorText", () => {
  test("joins blocks with a newline; a mention reads as @label and an image as ￼", () => {
    expect(text).toBe(
      `Setup\nAsk @Asha Rao first.\nSee ${LEAF_TEXT} here\nWiring\nred and black\nUse a 25 A breaker`,
    );
    expect(leafText(schema.node("mention", { label: "Q3" }))).toBe("@Q3");
  });

  test("the index covers the text exactly, in order", () => {
    const runs = textIndex(doc);
    expect(runs.reduce((sum, run) => sum + run.length, 0)).toBe(text.length);
    runs.forEach((run, index) => {
      if (index > 0) {
        const previous = runs[index - 1]!;
        expect(run.offset).toBe(previous.offset + previous.length);
      }
    });
  });
});

describe("offsetsToRange / rangeToOffsets", () => {
  test("every range whose ends fall outside a mention label round-trips, and maps onto the same text", () => {
    let checked = 0;
    for (let start = 0; start < text.length; start++) {
      if (insideMention(start)) continue;
      for (let end = start + 1; end <= text.length; end++) {
        if (insideMention(end)) continue;
        const range = offsetsToRange(doc, start, end);
        expect(range, `${start}–${end}`).not.toBeNull();
        expect(rangeToOffsets(doc, range!.from, range!.to)).toEqual({
          start,
          end,
        });
        expect(doc.textBetween(range!.from, range!.to, "\n", leafText)).toBe(
          text.slice(start, end),
        );
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(2000);
  });

  test("a range starting or ending inside @label snaps outward to the mention's edges", () => {
    const range = offsetsToRange(doc, mentionStart + 2, mentionEnd - 2)!;
    expect(rangeToOffsets(doc, range.from, range.to)).toEqual({
      start: mentionStart,
      end: mentionEnd,
    });
    expect(doc.nodeAt(range.from)?.type.name).toBe("mention");
  });

  test("an offset after each block boundary lands at the start of that block's text", () => {
    const starts = ["Ask", "See", "Wiring", "red", "Use"];
    for (const word of starts) {
      const range = offsetsToRange(
        doc,
        text.indexOf(word),
        text.indexOf(word) + 1,
      )!;
      const $from = doc.resolve(range.from);
      expect($from.parentOffset, word).toBe(0);
      expect($from.parent.textContent.startsWith(word), word).toBe(true);
    }
  });

  test("an offset after the image lands just past the image", () => {
    const after = text.indexOf(LEAF_TEXT) + 1;
    const range = offsetsToRange(doc, after, after + 1)!;
    expect(doc.resolve(range.from).nodeBefore?.type.name).toBe("image");
  });

  test("offsets outside the text resolve to null", () => {
    expect(offsetsToRange(doc, 0, text.length + 1)).toBeNull();
    expect(offsetsToRange(doc, 5, 4)).toBeNull();
  });
});
