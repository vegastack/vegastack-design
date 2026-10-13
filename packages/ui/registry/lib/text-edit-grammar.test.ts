import { expect, test } from "vitest";
import {
  MENTION_KINDS,
  MENTION_LINK_SOURCE,
  codeFenceInfo,
  escapeMentionLabel,
  headingIds,
  imageMarkdown,
  isRecordMentionKind,
  markdownDestination,
  mediaMarkdown,
  mentionMarkdown,
  parseCodeFenceInfo,
  parseImageAlt,
  parseMentionLink,
} from "./text-edit-grammar";

test("mentionMarkdown writes what parseMentionLink reads, escapes and all", () => {
  for (const kind of MENTION_KINDS) {
    const md = mentionMarkdown(kind, "x1", "Plan [draft] \\ v2\nnext");
    expect(md).toBe(`[@Plan \\[draft\\] \\\\ v2 next](mention://${kind}/x1)`);
    expect(parseMentionLink(`${md} tail`)).toEqual({
      raw: md,
      kind,
      id: "x1",
      label: "Plan [draft] \\ v2 next",
    });
  }
  expect(parseMentionLink("[@a](mention://robot/1)")).toBeNull();
  expect(parseMentionLink("see [@a](mention://user/1)")).toBeNull();
});

test("MENTION_LINK_SOURCE scans a whole text", () => {
  const found = [
    ..."[@A](mention://user/u1) and [@B](mention://page/p1)".matchAll(
      new RegExp(MENTION_LINK_SOURCE, "g"),
    ),
  ].map((match) => match[3]);
  expect(found).toEqual(["u1", "p1"]);
  expect(escapeMentionLabel("a[b]\\")).toBe("a\\[b\\]\\\\");
});

test("a record mention is anything but a person", () => {
  expect(isRecordMentionKind("user")).toBe(false);
  expect(MENTION_KINDS.filter(isRecordMentionKind)).toEqual([
    "page",
    "file",
    "task",
    "meeting",
    "customer",
    "project",
  ]);
});

test("headingIds gives every heading a stable id, a repeat suffixed", () => {
  expect(headingIds(["Setup", "Wiring plan", "Setup", "Setup", "!!"])).toEqual([
    "setup",
    "wiring-plan",
    "setup-1",
    "setup-2",
    "heading",
  ]);
});

test("image alt widths, destinations and media lines", () => {
  expect(parseImageAlt("Diagram|320")).toEqual({ alt: "Diagram", width: 320 });
  expect(parseImageAlt("a|b")).toEqual({ alt: "a|b" });
  expect(imageMarkdown({ src: "/a.png", alt: "Diagram", width: 320 })).toBe(
    "![Diagram|320](/a.png)",
  );
  expect(
    imageMarkdown({ src: "/a b.png", alt: "x [y]", title: 'say "hi"' }),
  ).toBe('![x \\[y\\]](</a b.png> "say \\"hi\\"")');
  expect(markdownDestination("https://a.b/c")).toBe("https://a.b/c");
  expect(markdownDestination("/w/Foo_(bar)")).toBe("</w/Foo_(bar)>");
  expect(mediaMarkdown("video", '/v"1.mp4')).toBe(
    '<video src="/v%221.mp4"></video>',
  );
});

test("code fence info: language and wrap", () => {
  expect(parseCodeFenceInfo("ts wrap")).toEqual({ language: "ts", wrap: true });
  expect(parseCodeFenceInfo("")).toEqual({ language: undefined, wrap: false });
  expect(codeFenceInfo("ts", true)).toBe("ts wrap");
  expect(codeFenceInfo(null, true)).toBe("text wrap");
  expect(codeFenceInfo("ts", false)).toBe("ts");
});
