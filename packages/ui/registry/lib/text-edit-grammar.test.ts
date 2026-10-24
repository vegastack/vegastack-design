import { expect, test } from "vitest";
import {
  MENTION_KIND_PATTERN,
  MENTION_LINK_SOURCE,
  MENTION_LINK_SQL,
  codeFenceInfo,
  escapeMentionLabel,
  headingIds,
  imageMarkdown,
  isMentionKind,
  isRecordMentionKind,
  liveBlockMarkdown,
  markdownDestination,
  mediaMarkdown,
  mentionMarkdown,
  parseCodeFenceInfo,
  parseImageAlt,
  parseDirectiveAttrs,
  parseMentionLink,
  parseLiveBlockRows,
  readLiveBlock,
  DEFAULT_LIVE_BLOCK_KINDS,
  liveBlockNames,
} from "./text-edit-grammar";

test("mentionMarkdown writes what parseMentionLink reads, escapes and all", () => {
  for (const kind of ["user", "agent", "page", "family", "sub_family2"]) {
    const md = mentionMarkdown(kind, "x1", "Plan [draft] \\ v2\nnext");
    expect(md).toBe(`[@Plan \\[draft\\] \\\\ v2 next](mention://${kind}/x1)`);
    expect(parseMentionLink(`${md} tail`)).toEqual({
      raw: md,
      kind,
      id: "x1",
      label: "Plan [draft] \\ v2 next",
    });
  }
  expect(parseMentionLink("see [@a](mention://user/1)")).toBeNull();
});

test("any well-formed kind is a mention; an uppercase, empty or one-letter kind is not", () => {
  // A kind the design system has never heard of reads and round-trips: the host names it.
  const md = "[@Linear 2](mention://subfamily/sf1)";
  expect(parseMentionLink(md)).toEqual({
    raw: md,
    kind: "subfamily",
    id: "sf1",
    label: "Linear 2",
  });
  expect(mentionMarkdown("subfamily", "sf1", "Linear 2")).toBe(md);
  expect(isMentionKind("subfamily")).toBe(true);
  for (const bad of [
    "Family",
    "",
    "a",
    "9lives",
    "sub-family",
    "x".repeat(33),
  ]) {
    expect(parseMentionLink(`[@a](mention://${bad}/1)`)).toBeNull();
    expect(isMentionKind(bad)).toBe(false);
  }
  // The SQL pattern has the same groups: label (escapes kept), kind, id.
  for (const link of [
    "[@Alice](mention://subfamily/s1)",
    "[@Q3 \\[draft\\]](mention://page/p1)",
  ]) {
    const js = new RegExp(`^${MENTION_LINK_SOURCE}$`).exec(link)!;
    const sql = new RegExp(`^${MENTION_LINK_SQL}$`).exec(link)!;
    expect(sql.slice(1)).toEqual(js.slice(1));
  }
  // The pattern is the one a database CHECK and `MENTION_LINK_SQL` use.
  expect(MENTION_KIND_PATTERN).toBe("[a-z][a-z0-9_]{1,31}");
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

test("a record mention is anything but a person or an agent", () => {
  expect(isRecordMentionKind("user")).toBe(false);
  expect(isRecordMentionKind("agent")).toBe(false);
  expect(isRecordMentionKind("page")).toBe(true);
  expect(isRecordMentionKind("subfamily")).toBe(true);
});

test("headingIds gives every heading a stable id, a repeat suffixed", () => {
  expect(headingIds(["Setup", "Wiring plan", "Setup", "Setup", "!!"])).toEqual([
    "setup",
    "wiring-plan",
    "setup-1",
    "setup-2",
    "heading",
  ]);
  // A suffix never collides with another heading's own id, whichever comes first.
  expect(headingIds(["A", "A", "A-1"])).toEqual(["a", "a-1", "a-1-1"]);
  expect(headingIds(["A-1", "A", "A"])).toEqual(["a-1", "a", "a-2"]);
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
  // A stored size: the height rides with the width, both ways; a height alone is no size.
  expect(parseImageAlt("Diagram|320x180")).toEqual({
    alt: "Diagram",
    width: 320,
    height: 180,
  });
  expect(
    imageMarkdown({ src: "/a.png", alt: "Diagram", width: 320, height: 180 }),
  ).toBe("![Diagram|320x180](/a.png)");
  expect(imageMarkdown({ src: "/a.png", alt: "D", height: 180 })).toBe(
    "![D](/a.png)",
  );
  // Out of the parser's range, a size is left out rather than read back as alt text.
  expect(
    imageMarkdown({ src: "/a.png", alt: "T", width: 320, height: 100_000 }),
  ).toBe("![T|320](/a.png)");
  expect(imageMarkdown({ src: "/a.png", alt: "hello|12x34" })).toBe(
    "![hello&#x7C;12x34](/a.png)",
  );
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

test("readLiveBlock reads a whole live task list, or nothing", () => {
  const rows =
    "- [ ] [@Order glass](mention://task/t1) — To do\n- [x] [@Fix](mention://task/t2) — Done";
  const md = `:::tasks{id="lb_9f2c" v="1" status="open"}\n${rows}\n:::`;
  expect(readLiveBlock(`${md}\n\nafter`)).toEqual({
    raw: `${md}\n`,
    kind: "tasks",
    id: "lb_9f2c",
    query: { v: "1", status: "open" },
    snapshot: rows,
  });
  expect(readLiveBlock(':::tasks{v="1"}\n:::')).toEqual({
    raw: ':::tasks{v="1"}\n:::',
    kind: "tasks",
    id: null,
    query: { v: "1" },
    snapshot: "",
  });
  // No closing line, a line that is not a row, or attributes that do not parse: text.
  expect(readLiveBlock(`:::tasks{id="a"}\n${rows}`)).toBeNull();
  expect(readLiveBlock(':::tasks{id="a"}\nprose\n:::')).toBeNull();
  expect(readLiveBlock(":::tasks{id=a}\n:::")).toBeNull();
  expect(readLiveBlock(' :::tasks{id="a"}\n:::')).toBeNull();
});

test("readLiveBlock reads only the names the host reads; others stay text", () => {
  const table = ':::table{id="b1" view="v1"}\n:::';
  expect(readLiveBlock(table)).toBeNull();
  expect(readLiveBlock(table, { names: ["tasks", "table"] })).toMatchObject({
    kind: "table",
    id: "b1",
    query: { view: "v1" },
  });
  expect(
    readLiveBlock(':::tasks{id="a"}\n:::', { names: ["table"] }),
  ).toBeNull();
  // A name outside `[a-z][a-z0-9_]*` is never a block, listed or not.
  expect(
    readLiveBlock(':::Table{id="b1"}\n:::', { names: ["Table"] }),
  ).toBeNull();
});

test("liveBlockMarkdown writes what readLiveBlock reads: id first, rows only; `:::tasks` byte for byte", () => {
  const md = liveBlockMarkdown({
    kind: "tasks",
    id: "lb_1",
    query: { v: "1", note: 'a "b" \\ c', id: "ignored" },
    snapshot: "- [ ] [@A](mention://task/t1) — To do\nnot a row\n:::",
  });
  expect(md).toBe(
    ':::tasks{id="lb_1" v="1" note="a \\"b\\" \\\\ c"}\n- [ ] [@A](mention://task/t1) — To do\n:::',
  );
  expect(readLiveBlock(md)).toMatchObject({
    kind: "tasks",
    id: "lb_1",
    query: { v: "1", note: 'a "b" \\ c' },
  });
  expect(liveBlockMarkdown({ query: {}, snapshot: "" })).toBe(
    ":::tasks{}\n:::",
  );
  // Every stored `:::tasks` block reads and writes back unchanged.
  const stored =
    ':::tasks{id="lb_9f2c" v="1" status="open"}\n- [ ] [@Order glass](mention://task/t1) — To do\n- [x] [@Fix](mention://task/t2) — Done\n:::';
  const read = readLiveBlock(stored)!;
  expect(
    liveBlockMarkdown({
      kind: read.kind,
      id: read.id,
      query: read.query,
      snapshot: read.snapshot,
    }),
  ).toBe(stored);
  expect(
    liveBlockMarkdown({ kind: "table", id: "b1", query: { view: "v1" } }),
  ).toBe(':::table{id="b1" view="v1"}\n:::');
  expect(liveBlockMarkdown({ kind: "Bad-Name", query: {} })).toBe(
    ":::tasks{}\n:::",
  );
});

test("parseLiveBlockRows reads each row's box, record, label and status", () => {
  expect(
    parseLiveBlockRows(
      [
        "- [ ] [@Order \\[glass\\]](mention://task/t1) — To do",
        "- [x] [@Hidden](mention://task/restricted:t2) — Done",
        "- [X] [@No status](mention://task/t3)",
        "- [ ] [@A page](mention://page/p1) — Draft",
      ].join("\n"),
      "task",
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
  expect(parseLiveBlockRows("", "task")).toEqual([]);
  // Text after the mention that is not ` — <status>` is kept: the line reads as text.
  expect(
    parseLiveBlockRows(
      "- [ ] [@A](mention://task/t1) important details",
      "task",
    ),
  ).toEqual([
    {
      checked: false,
      id: null,
      label: "[@A](mention://task/t1) important details",
      status: "",
    },
  ]);
});

test("a live block's rows may have no box: they read, round-trip and parse with `checked: null`", () => {
  const table =
    ':::table{id="b1"}\n- [@Row](mention://row/r1)\n- [@Row](mention://row/r2)\n:::';
  const read = readLiveBlock(table, { names: ["table"] })!;
  expect(read.snapshot).toBe(
    "- [@Row](mention://row/r1)\n- [@Row](mention://row/r2)",
  );
  expect(
    liveBlockMarkdown({
      kind: "table",
      id: "b1",
      query: read.query,
      snapshot: read.snapshot,
    }),
  ).toBe(table);
  expect(parseLiveBlockRows(read.snapshot, "row")).toEqual([
    { checked: null, id: "r1", label: "Row", status: "" },
    { checked: null, id: "r2", label: "Row", status: "" },
  ]);
  // Still a line that is not a list item stops the block (it stays text).
  expect(
    readLiveBlock(':::table{id="b1"}\nRow\n:::', { names: ["table"] }),
  ).toBeNull();
  expect(
    liveBlockNames([
      ...DEFAULT_LIVE_BLOCK_KINDS,
      { name: "Bad", rowKind: "x", label: "X" },
    ]),
  ).toEqual(["tasks"]);
});
