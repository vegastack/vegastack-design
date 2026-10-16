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
  parseDirectiveAttrs,
  parseMentionLink,
  parseTaskListRows,
  readTasksDirective,
  tasksDirectiveMarkdown,
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
    "product",
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
  // Alt text that merely ends like a width keeps it as text, both ways — its pipe a character
  // reference, so a table cell (which reads `\|` as `|`) cannot turn it into a width.
  expect(imageMarkdown({ src: "/a.png", alt: "hello|123" })).toBe(
    "![hello&#x7C;123](/a.png)",
  );
  expect(imageMarkdown({ src: "/a.png", alt: "a &amp; b" })).toBe(
    "![a &amp;amp; b](/a.png)",
  );
  expect(parseImageAlt("hello&#x7C;123")).toEqual({ alt: "hello&#x7C;123" });
  expect(parseImageAlt("hello\\|123")).toEqual({ alt: "hello|123" });
  expect(parseImageAlt("end\\\\|64")).toEqual({ alt: "end\\", width: 64 });
  expect(markdownDestination("https://a.b/c")).toBe("https://a.b/c");
  expect(markdownDestination("/a\\_b?x=&amp;")).toBe("/a\\\\_b?x=&amp;amp;");
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

test('parseDirectiveAttrs reads key="value" pairs, escapes and unknown keys; refuses anything else', () => {
  expect(
    parseDirectiveAttrs(
      'id="lb_1" v="1" note="say \\"hi\\" C:\\\\x" x-new="k"',
    ),
  ).toEqual({ id: "lb_1", v: "1", note: 'say "hi" C:\\x', "x-new": "k" });
  expect(parseDirectiveAttrs("")).toEqual({});
  expect(parseDirectiveAttrs("id=lb_1")).toBeNull();
  expect(parseDirectiveAttrs('id="a"v="1"')).toBeNull();
  expect(parseDirectiveAttrs('id="a" id="b"')).toBeNull();
  expect(parseDirectiveAttrs('Id="a"')).toBeNull();
});

test("readTasksDirective reads a whole live task list, or nothing", () => {
  const rows =
    "- [ ] [@Order glass](mention://task/t1) — To do\n- [x] [@Fix](mention://task/t2) — Done";
  const md = `:::tasks{id="lb_9f2c" v="1" status="open"}\n${rows}\n:::`;
  expect(readTasksDirective(`${md}\n\nafter`)).toEqual({
    raw: `${md}\n`,
    id: "lb_9f2c",
    query: { v: "1", status: "open" },
    snapshot: rows,
  });
  expect(readTasksDirective(':::tasks{v="1"}\n:::')).toEqual({
    raw: ':::tasks{v="1"}\n:::',
    id: null,
    query: { v: "1" },
    snapshot: "",
  });
  // No closing line, a line that is not a row, or attributes that do not parse: text.
  expect(readTasksDirective(`:::tasks{id="a"}\n${rows}`)).toBeNull();
  expect(readTasksDirective(':::tasks{id="a"}\nprose\n:::')).toBeNull();
  expect(readTasksDirective(":::tasks{id=a}\n:::")).toBeNull();
  expect(readTasksDirective(' :::tasks{id="a"}\n:::')).toBeNull();
});

test("tasksDirectiveMarkdown writes what readTasksDirective reads: id first, rows only", () => {
  const md = tasksDirectiveMarkdown({
    id: "lb_1",
    query: { v: "1", note: 'a "b" \\ c', id: "ignored" },
    snapshot: "- [ ] [@A](mention://task/t1) — To do\nnot a row\n:::",
  });
  expect(md).toBe(
    ':::tasks{id="lb_1" v="1" note="a \\"b\\" \\\\ c"}\n- [ ] [@A](mention://task/t1) — To do\n:::',
  );
  expect(readTasksDirective(md)).toMatchObject({
    id: "lb_1",
    query: { v: "1", note: 'a "b" \\ c' },
  });
  expect(tasksDirectiveMarkdown({ query: {}, snapshot: "" })).toBe(
    ":::tasks{}\n:::",
  );
});

test("parseTaskListRows reads each row's box, task, label and status", () => {
  expect(
    parseTaskListRows(
      [
        "- [ ] [@Order \\[glass\\]](mention://task/t1) — To do",
        "- [x] [@Hidden](mention://task/restricted:t2) — Done",
        "- [X] [@No status](mention://task/t3)",
        "- [ ] [@A page](mention://page/p1) — Draft",
      ].join("\n"),
    ),
  ).toEqual([
    { checked: false, id: "t1", label: "Order [glass]", status: "To do" },
    { checked: true, id: "restricted:t2", label: "Hidden", status: "Done" },
    { checked: true, id: "t3", label: "No status", status: "" },
    {
      checked: false,
      id: null,
      label: "[@A page](mention://page/p1) — Draft",
      status: "",
    },
  ]);
  expect(parseTaskListRows("")).toEqual([]);
  // Text after the mention that is not ` — <status>` is kept: the line reads as text.
  expect(
    parseTaskListRows("- [ ] [@A](mention://task/t1) important details"),
  ).toEqual([
    {
      checked: false,
      id: null,
      label: "[@A](mention://task/t1) important details",
      status: "",
    },
  ]);
});
