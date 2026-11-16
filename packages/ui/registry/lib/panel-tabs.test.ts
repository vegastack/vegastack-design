import { describe, expect, test } from "vitest";
import {
  activeIndexOf,
  createPanelTabs,
  decodePanelParam,
  deserializePanelTabs,
  encodePanelParam,
  PANEL_PARAM,
  PANEL_TAB_CAP,
  PANEL_TAB_PARAM,
  panelTabKey,
  panelTabsReducer,
  parsePanelTabKey,
  serializePanelTabs,
  TAB_AUTO_CLOSE_MS,
  type PanelTabRef,
  type PanelTabsAction,
  type PanelTabsState,
} from "./panel-tabs";

const HOUR = 3_600_000;

/** `task:1` → a live task ref; `trash:task:1`, `comments:task:1@t9`, `assistant:c1` likewise. */
const ref = (key: string): PanelTabRef => {
  const r = parsePanelTabKey(key);
  if (!r) throw new Error(`bad key ${key}`);
  return r;
};
function run(actions: PanelTabsAction[], from = createPanelTabs()) {
  return actions.reduce(panelTabsReducer, from);
}
const keys = (s: PanelTabsState) =>
  s.tabs.map((t) => (t.preview ? `~${t.key}` : t.key));
const open = (
  key: string,
  now: number,
  extra: { preview?: boolean; background?: boolean } = {},
): PanelTabsAction => ({ type: "open", ref: ref(key), now, ...extra });

describe("tab refs and canonical keys (contract §5 #4)", () => {
  test("each ref kind has one canonical key that parses back to it", () => {
    const refs: PanelTabRef[] = [
      { kind: "record", type: "task", id: "42", scope: "live" },
      { kind: "record", type: "page", id: "a:b,c@d%", scope: "trash" },
      {
        kind: "view",
        view: "comments",
        subject: { type: "task", id: "42" },
        at: "thread-9",
      },
      { kind: "view", view: "details", subject: { type: "skill", id: "s1" } },
      { kind: "assistant", chatId: "c-1" },
      {
        kind: "record",
        type: "run",
        id: "sess-1",
        scope: "live",
        agentId: "ag@1",
      },
    ];
    const ks = refs.map(panelTabKey);
    expect(ks[0]).toBe("task:42");
    expect(ks[2]).toBe("comments:task:42@thread-9");
    expect(ks[3]).toBe("details:skill:s1");
    expect(ks[4]).toBe("assistant:c-1");
    expect(ks[5]).toBe("run:sess-1@ag%401");
    for (const k of ks) expect(k).not.toContain(",");
    expect(ks.map(parsePanelTabKey)).toEqual(refs);
  });

  test("malformed keys don't parse", () => {
    for (const k of [
      "",
      "task",
      "task:",
      "Task:1",
      "1x:2",
      "trash:task",
      "trash:assistant:1",
      "comments:task",
      "assistant",
      "details:trash:1",
      "task:%E0%A4%A",
      "<script>:1",
    ])
      expect(parsePanelTabKey(k), k).toBeNull();
  });

  test("a record type can't take a reserved name", () => {
    expect(() =>
      panelTabKey({ kind: "record", type: "comments", id: "1", scope: "live" }),
    ).toThrow();
  });
});

describe("open (L17, L18, L6)", () => {
  test("a new tab goes right after the current one; older tabs keep their places", () => {
    const s = run([
      open("task:a", 1),
      open("task:b", 2),
      open("task:c", 3),
      { type: "activate", key: "task:a", now: 4 },
      open("page:d", 5),
    ]);
    expect(keys(s)).toEqual(["task:a", "page:d", "task:b", "task:c"]);
    expect(s.activeKey).toBe("page:d");
  });

  test("reopening a record focuses its tab instead of a duplicate", () => {
    const s = run([open("task:a", 1), open("task:b", 2), open("task:a", 3)]);
    expect(keys(s)).toEqual(["task:a", "task:b"]);
    expect(s.activeKey).toBe("task:a");
  });

  test("one preview tab: the next preview replaces it in place", () => {
    const s = run([
      open("task:a", 1),
      open("task:b", 2, { preview: true }),
      open("task:c", 3, { preview: true }),
    ]);
    expect(keys(s)).toEqual(["task:a", "~task:c"]);
    expect(s.closed).toEqual([]);
  });

  test("a kept open of a previewed record keeps it; a preview open never demotes a kept tab", () => {
    let s = run([open("task:a", 1, { preview: true }), open("task:a", 2)]);
    expect(keys(s)).toEqual(["task:a"]);
    s = run(
      [
        open("task:b", 3, { preview: true }),
        open("task:a", 4, { preview: true }),
      ],
      s,
    );
    expect(keys(s)).toEqual(["task:a", "~task:b"]);
    expect(s.activeKey).toBe("task:a");
  });

  test("background opens are kept, leave the current tab, and line up in click order", () => {
    const s = run([
      open("task:a", 1),
      open("task:x", 2),
      { type: "activate", key: "task:a", now: 3 },
      open("page:1", 4, { background: true, preview: true }),
      open("page:2", 5, { background: true }),
      open("page:3", 6, { background: true }),
    ]);
    expect(keys(s)).toEqual(["task:a", "page:1", "page:2", "page:3", "task:x"]);
    expect(s.activeKey).toBe("task:a");
  });

  test("a background open into an empty panel becomes the current tab", () => {
    expect(run([open("task:a", 1, { background: true })]).activeKey).toBe(
      "task:a",
    );
  });

  test("new tabs never land among pinned tabs", () => {
    const s = run([
      open("task:a", 1),
      { type: "pin", key: "task:a" },
      open("task:b", 2),
    ]);
    expect(keys(s)).toEqual(["task:a", "task:b"]);
  });
});

describe("back-stack inside a tab (#4)", () => {
  test("navigate pushes onto the tab's own stack; back pops it", () => {
    let s = run([
      open("task:1", 1),
      open("page:9", 2),
      { type: "activate", key: "task:1", now: 3 },
      {
        type: "navigate",
        key: "task:1",
        ref: ref("comments:task:1@t1"),
        now: 4,
      },
    ]);
    expect(keys(s)).toEqual(["comments:task:1@t1", "page:9"]);
    expect(s.activeKey).toBe("comments:task:1@t1");
    expect(s.tabs[0]!.back.map(panelTabKey)).toEqual(["task:1"]);
    s = run([{ type: "back", key: "comments:task:1@t1", now: 5 }], s);
    expect(keys(s)).toEqual(["task:1", "page:9"]);
    expect(s.tabs[0]!.back).toEqual([]);
    expect(s.activeKey).toBe("task:1");
  });

  test("navigating to a record open in another tab focuses that tab", () => {
    const s = run([
      open("task:1", 1),
      open("page:9", 2),
      { type: "navigate", key: "page:9", ref: ref("task:1"), now: 3 },
    ]);
    expect(keys(s)).toEqual(["task:1", "page:9"]);
    expect(s.activeKey).toBe("task:1");
  });

  test("back with an empty stack changes nothing", () => {
    const s = run([open("task:1", 1)]);
    expect(panelTabsReducer(s, { type: "back", key: "task:1", now: 2 })).toBe(
      s,
    );
  });
});

describe("cap and protected tabs (L19, #5)", () => {
  const ten = Array.from({ length: PANEL_TAB_CAP }, (_, i) =>
    open(`task:${i}`, i + 1),
  );

  test("the 11th tab closes the one unseen longest, with undo", () => {
    let s = run([...ten, { type: "activate", key: "task:0", now: 50 }]);
    s = run([open("task:new", 60)], s);
    expect(s.tabs).toHaveLength(PANEL_TAB_CAP);
    expect(keys(s)).not.toContain("task:1");
    expect(s.closed[0]!.key).toBe("task:1");
    expect(s.event).toMatchObject({ type: "evicted", key: "task:1" });
    expect(s.undo?.reason).toBe("cap");
    s = run([{ type: "undo", now: 61 }], s);
    // Soft cap: undo brings it back at its place, beyond the cap.
    expect(keys(s).slice(0, 3)).toEqual(["task:0", "task:new", "task:1"]);
    expect(s.tabs).toHaveLength(PANEL_TAB_CAP + 1);
    expect(s.activeKey).toBe("task:new");
    expect(s.closed.map((t) => t.key)).not.toContain("task:1");
    expect(s.undo).toBeNull();
  });

  test("never closes a pinned, protected or current tab", () => {
    let s = run([
      ...ten,
      { type: "pin", key: "task:0" },
      { type: "protect", key: "task:1", protected: true },
    ]);
    s = run([open("task:new", 60)], s);
    expect(keys(s)).toEqual(expect.arrayContaining(["task:0", "task:1"]));
    expect(s.closed[0]!.key).toBe("task:2");
  });

  test("with nothing closable the cap is exceeded and says so", () => {
    let s = run(ten);
    for (const t of s.tabs)
      s = run([{ type: "protect", key: t.key, protected: true }], s);
    const seq = s.event?.seq ?? 0;
    s = run([open("task:new", 60)], s);
    expect(s.tabs).toHaveLength(PANEL_TAB_CAP + 1);
    expect(s.event).toEqual({ type: "overCap", seq: seq + 1 });
    expect(s.undo).toBeNull();
  });

  test("protecting a preview keeps it from being replaced", () => {
    const s = run([
      open("task:a", 1, { preview: true }),
      { type: "protect", key: "task:a", protected: true },
      open("task:b", 2, { preview: true }),
    ]);
    expect(keys(s)).toEqual(["task:a", "~task:b"]);
  });
});

describe("close, close others, close right, close all (R3)", () => {
  const base = () =>
    run([
      open("a:1", 1),
      open("a:2", 2),
      open("a:3", 3),
      open("a:4", 4),
      { type: "activate", key: "a:2", now: 5 },
    ]);

  test("closing the current tab moves to its right-hand neighbour, else the left", () => {
    let s = run([{ type: "close", key: "a:2" }], base());
    expect(s.activeKey).toBe("a:3");
    s = run(
      [
        { type: "close", key: "a:4" },
        { type: "close", key: "a:3" },
      ],
      s,
    );
    expect(s.activeKey).toBe("a:1");
    expect(s.closed.map((t) => t.key)).toEqual(["a:3", "a:4", "a:2"]);
  });

  test("closing the last tab leaves nothing current", () => {
    const s = run([open("a:1", 1), { type: "close", key: "a:1" }]);
    expect(s.tabs).toEqual([]);
    expect(s.activeKey).toBeNull();
  });

  test("bulk closes keep pinned tabs and can be undone", () => {
    let s = run([{ type: "pin", key: "a:4" }], base());
    expect(keys(s)).toEqual(["a:4", "a:1", "a:2", "a:3"]);
    s = run([{ type: "closeOthers", key: "a:2" }], s);
    expect(keys(s)).toEqual(["a:4", "a:2"]);
    s = run([{ type: "undo", now: 9 }], s);
    expect(keys(s)).toEqual(["a:4", "a:1", "a:2", "a:3"]);
    s = run([{ type: "closeRight", key: "a:1" }], s);
    expect(keys(s)).toEqual(["a:4", "a:1"]);
    s = run([{ type: "closeAll" }], s);
    expect(keys(s)).toEqual(["a:4"]);
    expect(s.activeKey).toBe("a:4");
  });
});

describe("keep, pin, reorder, activate, changed", () => {
  test("keep makes the preview permanent", () => {
    const s = run([
      open("a:1", 1, { preview: true }),
      { type: "keep", key: "a:1" },
    ]);
    expect(s.tabs[0]!.preview).toBe(false);
  });

  test("pin goes to the end of the pinned group and keeps; unpin goes just after it", () => {
    let s = run([
      open("a:1", 1),
      open("a:2", 2),
      open("a:3", 3, { preview: true }),
      { type: "pin", key: "a:2" },
      { type: "pin", key: "a:3" },
    ]);
    expect(keys(s)).toEqual(["a:2", "a:3", "a:1"]);
    s = run([{ type: "unpin", key: "a:2" }], s);
    expect(keys(s)).toEqual(["a:3", "a:2", "a:1"]);
  });

  test("reorder stays inside the tab's own group", () => {
    let s = run([
      open("a:1", 1),
      open("a:2", 2),
      open("a:3", 3),
      { type: "pin", key: "a:3" },
    ]);
    s = run([{ type: "reorder", key: "a:1", index: 0 }], s);
    expect(keys(s)).toEqual(["a:3", "a:1", "a:2"]);
    s = run([{ type: "reorder", key: "a:1", index: 9 }], s);
    expect(keys(s)).toEqual(["a:3", "a:2", "a:1"]);
  });

  test("a change shows a dot until seen; the current tab never gets one", () => {
    let s = run([
      open("a:1", 1),
      open("a:2", 2),
      { type: "markChanged", key: "a:1" },
      { type: "markChanged", key: "a:2" },
    ]);
    expect(s.tabs.map((t) => t.changed)).toEqual([true, false]);
    s = run([{ type: "activate", key: "a:1", now: 3 }], s);
    expect(s.tabs[0]!.changed).toBe(false);
  });

  test("unknown keys are a no-op that keeps the same state object", () => {
    const s = run([open("a:1", 1)]);
    for (const action of [
      { type: "close", key: "x" },
      { type: "activate", key: "x", now: 2 },
      { type: "keep", key: "x" },
      { type: "pin", key: "x" },
      { type: "markChanged", key: "x" },
      { type: "protect", key: "x", protected: true },
      { type: "undo", now: 3 },
      { type: "reopen", now: 3 },
    ] as PanelTabsAction[])
      expect(panelTabsReducer(s, action)).toBe(s);
  });
});

describe("reopen and Recently closed", () => {
  test("reopen brings back the last closed tab, kept, after the current one", () => {
    let s = run([
      open("a:1", 1),
      open("a:2", 2, { preview: true }),
      { type: "close", key: "a:2" },
      { type: "reopen", now: 3 },
    ]);
    expect(keys(s)).toEqual(["a:1", "a:2"]);
    expect(s.activeKey).toBe("a:2");
    expect(s.closed).toEqual([]);
    s = run(
      [
        { type: "close", key: "a:1" },
        { type: "close", key: "a:2" },
      ],
      s,
    );
    s = run([{ type: "reopen", key: "a:1", now: 4 }], s);
    expect(keys(s)).toEqual(["a:1"]);
    expect(s.closed.map((t) => t.key)).toEqual(["a:2"]);
  });

  test("Recently closed holds each record once, newest first, bounded", () => {
    let s = createPanelTabs();
    for (let i = 0; i < 40; i++)
      s = run(
        [open(`a:${i % 30}`, i), { type: "close", key: `a:${i % 30}` }],
        s,
      );
    expect(s.closed.length).toBeLessThanOrEqual(20);
    expect(s.closed[0]!.key).toBe("a:9");
    expect(new Set(s.closed.map((t) => t.key)).size).toBe(s.closed.length);
  });
});

describe("expire (L20)", () => {
  test("closes tabs unseen past the age; keeps pinned, protected and the current tab", () => {
    let s = run([
      open("a:1", 0),
      open("a:2", 0),
      open("a:3", 0),
      open("a:4", 0),
      { type: "pin", key: "a:1" },
      { type: "protect", key: "a:2", protected: true },
      { type: "activate", key: "a:3", now: 0 },
      open("a:5", 30 * HOUR, { background: true }),
    ]);
    s = run(
      [{ type: "expire", now: 48 * HOUR, maxAgeMs: TAB_AUTO_CLOSE_MS["1d"] }],
      s,
    );
    expect(keys(s)).toEqual(["a:1", "a:2", "a:3", "a:5"]);
    expect(s.closed.map((t) => t.key)).toEqual(["a:4"]);
  });

  test("never closes nothing and returns the same state", () => {
    const s = run([open("a:1", 0), open("a:2", 0)]);
    expect(
      panelTabsReducer(s, {
        type: "expire",
        now: 1e12,
        maxAgeMs: TAB_AUTO_CLOSE_MS.never,
      }),
    ).toBe(s);
  });

  test("the choices are the four of L20", () => {
    expect(TAB_AUTO_CLOSE_MS).toEqual({
      never: null,
      "12h": 12 * HOUR,
      "1d": 24 * HOUR,
      "1w": 7 * 24 * HOUR,
    });
  });
});

describe("saved tabs (#6: { v: 1, active, tabs: [{ ref, pinned, lastSeenAt }] })", () => {
  test("saves kept tabs only, without dots or previews, and loads them back", () => {
    const s = run([
      open("task:1", 10),
      { type: "pin", key: "task:1" },
      open("page:2", 20),
      open("task:3", 30, { preview: true }),
      { type: "markChanged", key: "page:2" },
      { type: "activate", key: "page:2", now: 40 },
    ]);
    const saved = serializePanelTabs(s);
    expect(saved).toEqual({
      v: 1,
      active: "page:2",
      tabs: [
        { ref: ref("task:1"), pinned: true, lastSeenAt: 20 },
        { ref: ref("page:2"), pinned: false, lastSeenAt: 40 },
      ],
    });
    const back = deserializePanelTabs(JSON.parse(JSON.stringify(saved)));
    expect(keys(back)).toEqual(["task:1", "page:2"]);
    expect(back.activeKey).toBe("page:2");
    expect(back.tabs[0]!.pinned).toBe(true);
    expect(back.tabs[1]!.seenAt).toBe(40);
    expect(back.tabs.every((t) => !t.changed && !t.preview)).toBe(true);
  });

  test("an unknown version or malformed entries are dropped, not thrown", () => {
    expect(deserializePanelTabs({ v: 2, tabs: [] }).tabs).toEqual([]);
    expect(deserializePanelTabs(null).tabs).toEqual([]);
    expect(deserializePanelTabs("x").tabs).toEqual([]);
    const s = deserializePanelTabs({
      v: 1,
      active: "nope",
      tabs: [
        {
          ref: { kind: "record", type: "task", id: "1", scope: "live" },
          pinned: false,
          lastSeenAt: 5,
        },
        {
          ref: { kind: "record", type: "Bad", id: "1", scope: "live" },
          pinned: false,
          lastSeenAt: 5,
        },
        { ref: { kind: "nope" }, pinned: false, lastSeenAt: 5 },
        {
          ref: { kind: "record", type: "task", id: "1", scope: "live" },
          pinned: true,
          lastSeenAt: 9,
        },
        {
          ref: { kind: "assistant", chatId: "c" },
          pinned: "yes",
          lastSeenAt: "x",
        },
      ],
    });
    expect(keys(s)).toEqual(["task:1", "assistant:c"]);
    expect(s.tabs[1]!.pinned).toBe(false);
    expect(s.tabs[1]!.seenAt).toBe(0);
    expect(s.activeKey).toBe("task:1");
  });
});

describe("restore (URL → state)", () => {
  test("adopts the URL's tabs and current tab, keeping what it knows about each", () => {
    let s = run([
      open("a:1", 1),
      { type: "pin", key: "a:1" },
      open("a:2", 2),
      { type: "markChanged", key: "a:1" },
    ]);
    s = run(
      [{ type: "restore", now: 5, ...decodePanelParam("a:1,~b:9", "1") }],
      s,
    );
    expect(keys(s)).toEqual(["a:1", "~b:9"]);
    expect(s.tabs[0]!.pinned).toBe(true);
    expect(s.activeKey).toBe("b:9");
    expect(s.closed.map((t) => t.key)).toEqual(["a:2"]);
  });
});

describe("URL codec (contract §2, §5 #7)", () => {
  test("encodes keys in order with ~ on the preview and the current index", () => {
    const s = run([
      open("task:1", 1),
      open("page:2", 2, { preview: true }),
      { type: "activate", key: "task:1", now: 3 },
    ]);
    expect(encodePanelParam(s)).toEqual({ panel: "task:1,~page:2", tab: "0" });
    expect(activeIndexOf(s)).toBe(0);
    expect([PANEL_PARAM, PANEL_TAB_PARAM]).toEqual(["panel", "tab"]);
  });

  test("no tabs is no param", () => {
    expect(encodePanelParam(createPanelTabs())).toBeNull();
  });

  test("round-trips every ref kind, including ids with reserved characters", () => {
    const s = run([
      open(
        panelTabKey({
          kind: "record",
          type: "file",
          id: "a,b~c:d%e@f",
          scope: "live",
        }),
        1,
      ),
      open("trash:task:7", 2),
      open("versions:page:p1@v3", 3),
      open("assistant:c1", 4, { preview: true }),
    ]);
    const enc = encodePanelParam(s)!;
    expect(enc.panel.split(",")).toHaveLength(4);
    const dec = decodePanelParam(enc.panel, enc.tab);
    expect(dec.tabs.map((t) => [t.key, t.preview])).toEqual(
      s.tabs.map((t) => [t.key, t.preview]),
    );
    expect(dec.tabs[0]!.ref).toEqual({
      kind: "record",
      type: "file",
      id: "a,b~c:d%e@f",
      scope: "live",
    });
    expect(dec.activeKey).toBe("assistant:c1");
  });

  test("the URL carries at most 10 refs, always the current one, in tab order", () => {
    let s = createPanelTabs();
    for (let i = 0; i < 12; i++) {
      s = run([open(`task:${i}`, i)], s);
      s = run([{ type: "protect", key: `task:${i}`, protected: true }], s);
    }
    s = run([{ type: "activate", key: "task:0", now: 100 }], s);
    const enc = encodePanelParam(s)!;
    const dec = decodePanelParam(enc.panel, enc.tab);
    expect(dec.tabs).toHaveLength(PANEL_TAB_CAP);
    expect(dec.activeKey).toBe("task:0");
    // The two seen longest ago are the ones left to the saved state.
    expect(dec.tabs.map((t) => t.key)).not.toContain("task:1");
    expect(dec.tabs.map((t) => t.key)).not.toContain("task:2");
  });

  test("decoding a shared or hand-edited link is forgiving and bounded", () => {
    expect(decodePanelParam(null, null)).toEqual({ tabs: [], activeKey: null });
    expect(decodePanelParam("", "3")).toEqual({ tabs: [], activeKey: null });
    const d = decodePanelParam(
      " task:1 ,,~,BAD:1,task:%E0%A4%A,~page:2,~page:3,task:1,<script>",
      "99",
    );
    expect(d.tabs.map((t) => [t.key, t.preview])).toEqual([
      ["task:1", false],
      ["page:2", true],
      ["page:3", false],
    ]);
    expect(d.activeKey).toBe("page:3");
    expect(decodePanelParam("task:1,task:2", "x").activeKey).toBe("task:1");
    expect(decodePanelParam(`task:${"x".repeat(700)}`, "0").tabs).toEqual([]);
    const many = Array.from({ length: 100 }, (_, i) => `task:${i}`).join(",");
    expect(decodePanelParam(many, "0").tabs).toHaveLength(PANEL_TAB_CAP);
  });
});

describe("review round 1 regressions", () => {
  test("a lone surrogate or an over-long id in saved state is dropped, never thrown", () => {
    const s = deserializePanelTabs({
      v: 1,
      active: null,
      tabs: [
        {
          ref: { kind: "record", type: "task", id: "\ud800", scope: "live" },
          pinned: false,
          lastSeenAt: 1,
        },
        {
          ref: {
            kind: "record",
            type: "task",
            id: "😀".repeat(100),
            scope: "live",
          },
          pinned: false,
          lastSeenAt: 1,
        },
        {
          ref: { kind: "record", type: "task", id: "ok", scope: "live" },
          pinned: false,
          lastSeenAt: 1,
        },
      ],
    });
    expect(keys(s)).toEqual(["task:ok"]);
  });

  test("every id the validator accepts round-trips through the URL", () => {
    const id = "😀".repeat(50);
    const s = run([
      open(panelTabKey({ kind: "record", type: "task", id, scope: "live" }), 1),
    ]);
    const enc = encodePanelParam(s)!;
    expect(decodePanelParam(enc.panel, enc.tab).tabs).toHaveLength(1);
  });

  test("reopening a closed snapshot never overwrites the live tab", () => {
    let s = run([
      open("task:a", 1),
      { type: "close", key: "task:a" },
      open("task:b", 2),
      { type: "navigate", key: "task:b", ref: ref("task:a"), now: 3 },
    ]);
    expect(s.closed.map((t) => t.key)).not.toContain("task:a");
    s = run(
      [
        { type: "protect", key: "task:a", protected: true },
        { type: "reopen", key: "task:a", now: 4 },
      ],
      s,
    );
    expect(s.tabs.find((t) => t.key === "task:a")!.protected).toBe(true);
  });

  test("undo never leaves two preview tabs", () => {
    const s = run([
      open("task:a", 1, { preview: true }),
      { type: "close", key: "task:a" },
      open("task:b", 2, { preview: true }),
      { type: "undo", now: 3 },
    ]);
    expect(s.tabs.filter((t) => t.preview)).toHaveLength(1);
  });

  test("a tab that becomes current by a close is seen; a tab left behind was seen until then", () => {
    let s = run([
      open("task:a", 0),
      open("task:b", 0),
      { type: "activate", key: "task:a", now: 0 },
      { type: "markChanged", key: "task:b" },
      { type: "close", key: "task:a", now: 5 },
    ]);
    expect(s.tabs[0]).toMatchObject({
      key: "task:b",
      changed: false,
      seenAt: 5,
    });
    // Viewed for 25 hours, then left: the 1-day expiry counts from leaving, not arriving.
    s = run([open("task:c", 25 * HOUR)], s);
    s = run(
      [{ type: "expire", now: 26 * HOUR, maxAgeMs: TAB_AUTO_CLOSE_MS["1d"] }],
      s,
    );
    expect(keys(s)).toContain("task:b");
  });

  test("a run ref needs its agent", () => {
    expect(parsePanelTabKey("run:sess-1")).toBeNull();
    expect(() =>
      panelTabKey({ kind: "record", type: "run", id: "s", scope: "live" }),
    ).toThrow();
    expect(parsePanelTabKey("run:sess-1@agent-2")).toEqual({
      kind: "record",
      type: "run",
      id: "sess-1",
      scope: "live",
      agentId: "agent-2",
    });
  });

  test("focus goes to kept foreground opens only", () => {
    let s = run([open("task:a", 1, { preview: true })]);
    expect(s.focus).toBeNull();
    s = run([open("task:a", 2, { background: true })], s);
    expect(s.focus).toBeNull();
    s = run([open("task:b", 3, { background: true })], s);
    expect(s.focus).toBeNull();
    s = run([open("task:c", 4)], s);
    expect(s.focus?.key).toBe("task:c");
  });
});

test("a focus request dies with its tab, so reopening as a preview doesn't steal focus", () => {
  const s = run([
    open("task:a", 1),
    { type: "close", key: "task:a" },
    open("task:b", 2, { background: true }),
    open("task:a", 3, { preview: true }),
  ]);
  expect(s.focus).toBeNull();
});
