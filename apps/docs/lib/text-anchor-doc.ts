// @vegastack text-anchor-doc@0.23.96 sha256-qWWkgPbmwJO0eZ+J2KLNjqnBcVwl3qIkP18Lm0dHOpU=

import type { Node } from "@tiptap/pm/model";

/**
 * text-anchor-doc — the bridge between a ProseMirror document and the flat text comment anchors
 * are stored against (`@/lib/text-anchor`). Editor-side only: every function takes a ProseMirror
 * `Node`.
 *
 * Offsets and ProseMirror positions are different coordinates: a block boundary is one `"\n"` in
 * the text but two or more positions in the document, and a mention is one position but `@label`
 * in the text. `textIndex` walks the document once, in exactly `textBetween`'s order, and records
 * where every run of text sits in both; `offsetsToRange` and `rangeToOffsets` convert through it.
 */

/** The object replacement character: the text an image, a file chip or any other leaf reads as. */
export const LEAF_TEXT = "￼";

/** How a leaf node reads in the anchor text: a mention as `@label`, anything else as `"￼"`. */
export function leafText(node: Node): string {
  return node.type.name === "mention"
    ? `@${String(node.attrs.label ?? "")}`
    : LEAF_TEXT;
}

/** The flat text comment anchors are offsets into: blocks joined by `"\n"`, leaves per `leafText`. */
export function anchorText(doc: Node): string {
  let text = TEXT_CACHE.get(doc);
  if (text === undefined) {
    text = doc.textBetween(0, doc.content.size, "\n", leafText);
    TEXT_CACHE.set(doc, text);
  }
  return text;
}

/**
 * One run of the anchor text: `length` characters from `offset`, which sit in the document from
 * `pos` to `end`. A `text` run maps character for character; a `leaf` run is one atom (`end` is
 * past it); a `separator` is the `"\n"` between two blocks — `pos` is where the previous block's
 * text ends and `end` where the next one's begins.
 */
export interface TextRun {
  kind: "text" | "leaf" | "separator";
  offset: number;
  length: number;
  pos: number;
  end: number;
}

const TEXT_CACHE = new WeakMap<Node, string>();
const INDEX_CACHE = new WeakMap<Node, TextRun[]>();

/** Every run of `anchorText(doc)`, in order, with its place in the document. Cached per document. */
export function textIndex(doc: Node): TextRun[] {
  const cached = INDEX_CACHE.get(doc);
  if (cached) return cached;
  const runs: TextRun[] = [];
  let offset = 0;
  let first = true;
  let previousEnd = 0;
  // Mirrors `Fragment.textBetween`: a separator before every textblock (and every leaf block with
  // text) but the first, then the node's own text.
  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    const text = node.isText
      ? (node.text ?? "")
      : node.isLeaf
        ? leafText(node)
        : "";
    if (node.isBlock && ((node.isLeaf && text) || node.isTextblock)) {
      const start = node.isTextblock ? pos + 1 : pos;
      if (first) first = false;
      else {
        runs.push({
          kind: "separator",
          offset,
          length: 1,
          pos: previousEnd,
          end: start,
        });
        offset += 1;
      }
      previousEnd = start;
    }
    if (node.isText) {
      runs.push({
        kind: "text",
        offset,
        length: text.length,
        pos,
        end: pos + text.length,
      });
      offset += text.length;
      previousEnd = pos + text.length;
    } else if (node.isLeaf && text) {
      runs.push({
        kind: "leaf",
        offset,
        length: text.length,
        pos,
        end: pos + node.nodeSize,
      });
      offset += text.length;
      previousEnd = pos + node.nodeSize;
    }
  });
  INDEX_CACHE.set(doc, runs);
  return runs;
}

/** The run holding character `offset` (binary search), or undefined past the end. */
function runAtOffset(runs: TextRun[], offset: number): TextRun | undefined {
  let low = 0;
  let high = runs.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const run = runs[mid]!;
    if (offset < run.offset) high = mid - 1;
    else if (offset >= run.offset + run.length) low = mid + 1;
    else return run;
  }
  return undefined;
}

/**
 * The document range of `anchorText(doc).slice(start, end)`, or `null` when the offsets fall
 * outside the text. An edge inside a mention's `@label` snaps outward to the mention's edges.
 */
export function offsetsToRange(
  doc: Node,
  start: number,
  end: number,
): { from: number; to: number } | null {
  const runs = textIndex(doc);
  const last = runs[runs.length - 1];
  const total = last ? last.offset + last.length : 0;
  if (start < 0 || end < start || end > total || !last) return null;
  // Before character `start`.
  const startRun = runAtOffset(runs, start);
  const from = !startRun
    ? last.end
    : startRun.kind === "text"
      ? startRun.pos + (start - startRun.offset)
      : startRun.pos;
  if (end === start) return { from, to: from };
  // After character `end - 1`.
  const endRun = runAtOffset(runs, end - 1)!;
  const to =
    endRun.kind === "text" ? endRun.pos + (end - endRun.offset) : endRun.end;
  return { from, to };
}

/** The anchor-text offset of document position `pos`; `side` settles a position between runs. */
function offsetAtPos(runs: TextRun[], pos: number, side: "start" | "end") {
  // The last run starting at or before `pos`.
  let low = 0;
  let high = runs.length - 1;
  let at = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (runs[mid]!.pos <= pos) {
      at = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  const run = at === -1 ? undefined : runs[at];
  if (run) {
    if (run.kind === "text" && pos <= run.end)
      return run.offset + (pos - run.pos);
    if (pos === run.pos) return run.offset;
    if (pos === run.end) return run.offset + run.length;
    // Inside the boundary between two blocks: before its "\n" for an end, after it for a start.
    if (run.kind === "separator" && pos < run.end)
      return side === "start" ? run.offset + 1 : run.offset;
  }
  // Between runs (a block boundary, inside an atom): the next run's start for a range's start,
  // the previous run's end for its end.
  if (side === "start") {
    const next = runs[at + 1];
    if (next) return next.offset;
  }
  if (run) return run.offset + run.length;
  return 0;
}

/**
 * The anchor-text offsets of the document range `from`–`to` — the inverse of `offsetsToRange`
 * for every range whose ends fall outside a mention's label.
 */
export function rangeToOffsets(
  doc: Node,
  from: number,
  to: number,
): { start: number; end: number } {
  const runs = textIndex(doc);
  const start = offsetAtPos(runs, from, "start");
  const end = Math.max(start, offsetAtPos(runs, to, "end"));
  return { start, end };
}
