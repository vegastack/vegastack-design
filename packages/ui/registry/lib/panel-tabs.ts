// @vegastack panel-tabs@0.89.1 sha256-dC/XuDmpyILebEyTgimirGS4f3QopIlAXKjxLX884Fk=

/**
 * panel-tabs — the rules of the shell panel's tabs as one pure reducer, the tab reference and its
 * canonical key, the saved shape, and the URL codec for `?panel=task:<id>,~page:<id>&tab=<i>`.
 * No React and no clock: every action that "sees" a tab carries `now` (epoch ms), so a state
 * replays the same on the server, in a test and after a reload. `ShellPanelTabs` renders it;
 * `usePanelTabs` (in `shell-panel`) binds it to React.
 *
 * The rules (VegaStack shell decisions L17–L20, R3–R6, contract §5 #4–#7):
 * - **References.** A tab shows a `PanelTabRef`: a record (live or in the trash; an agent run is
 *   `type: "run"` with its `agentId`; record types are an open `snake_case` set the app checks), a view of a
 *   record (details, comments, versions, files, activity — optionally at a thread or version), or
 *   an assistant chat. Its canonical key is `panelTabKey(ref)`; tabs dedupe by key. Each tab keeps
 *   its own back-stack (`navigate` / `back`).
 * - **Right after the current tab (L17)**, never among pinned tabs; tabs opened in the background
 *   from the same tab line up in click order.
 * - **Preview tabs (L18).** At most one. A preview open replaces it in place; a kept open, `keep`,
 *   `pin`, `navigate` or `protect` makes it permanent. A background open is always kept.
 * - **Soft cap (L19).** Past `PANEL_TAB_CAP` tabs, the tab seen longest ago closes, never a pinned
 *   or `protected` one (a draft or an upload, #5) or the current one; `undo` brings it back beyond
 *   the cap. With nothing closable the cap is exceeded and `event` says `overCap`.
 * - **Auto-close (L20).** `expire` closes tabs unseen past the person's choice, with the same
 *   exceptions. Everything closed goes to Recently closed (`closed`, newest first, bounded).
 * - **Changed dots (R4).** `markChanged` flags a tab other than the current one; seeing it clears.
 */

/** The soft cap on open tabs (L19), and the most refs a URL carries (#7). */
export const PANEL_TAB_CAP = 10;

/** How many tabs Recently closed remembers. */
export const PANEL_CLOSED_LIMIT = 20;

/** How deep a tab's own back-stack goes. */
const BACK_LIMIT = 30;

/** The most tabs the saved state keeps. */
const SAVED_LIMIT = 50;

/** The longest id, thread, version, agent or chat id, measured percent-escaped. */
const MAX_ID_ESCAPED = 600;

/** The longest canonical key: a type, three escaped ids and the separators always fit. */
const MAX_KEY_LENGTH = 2048;

/** The search params the panel lives in: `?panel=…&tab=…` (contract §2). */
export const PANEL_PARAM = "panel";
/** The current tab's index param. */
export const PANEL_TAB_PARAM = "tab";

/** The person's auto-close choice (L20); a missing choice means `"1d"`. */
export type TabAutoClose = "never" | "12h" | "1d" | "1w";

/** The default auto-close choice (L20). */
export const DEFAULT_TAB_AUTO_CLOSE: TabAutoClose = "1d";

const HOUR = 3_600_000;

/** Each auto-close choice as the `maxAgeMs` of `expire`; `null` never closes. */
export const TAB_AUTO_CLOSE_MS: Readonly<Record<TabAutoClose, number | null>> =
  Object.freeze({
    never: null,
    "12h": 12 * HOUR,
    "1d": 24 * HOUR,
    "1w": 7 * 24 * HOUR,
  });

/* ---------------------------------------------------------------------------------------------
 * References and canonical keys (#4)
 * -------------------------------------------------------------------------------------------*/

/** The views of a record that open as their own tab. */
export const PANEL_VIEWS = [
  "details",
  "comments",
  "versions",
  "files",
  "activity",
] as const;

/** A record view's name. */
export type PanelViewName = (typeof PANEL_VIEWS)[number];

/** A record, live or in the trash (read-only there, with Restore). */
export interface PanelRecordRef {
  readonly kind: "record";
  /** The record type, `snake_case` (`task`, `table_row`). */
  readonly type: string;
  readonly id: string;
  readonly scope: "live" | "trash";
  /**
   * The agent a run belongs to (`type: "run"`, the id is its session id; contract §6, R7). Part of
   * the key, so a link carries it.
   */
  readonly agentId?: string;
}

/** One view of a record, optionally at a comment thread or a version. */
export interface PanelViewRef {
  readonly kind: "view";
  readonly view: PanelViewName;
  readonly subject: { readonly type: string; readonly id: string };
  /** A thread id (comments) or a version id (versions). */
  readonly at?: string;
}

/** An assistant chat; `chatId: null` is a new chat that has no id yet (key `assistant`). */
export interface PanelAssistantRef {
  readonly kind: "assistant";
  readonly chatId: string | null;
}

/** What a tab shows. Plain data: it saves, travels in URLs and compares by `panelTabKey`. */
export type PanelTabRef = PanelRecordRef | PanelViewRef | PanelAssistantRef;

const TYPE_RE = /^[a-z][a-z0-9_]{0,63}$/;
const RESERVED = new Set<string>(["trash", "assistant", ...PANEL_VIEWS]);
const isView = (s: string): s is PanelViewName =>
  (PANEL_VIEWS as readonly string[]).includes(s);
const validType = (t: unknown): t is string =>
  typeof t === "string" && TYPE_RE.test(t) && !RESERVED.has(t);
/** A non-empty, well-formed id with no control characters that escapes to ≤ 600 characters. */
function validId(s: unknown): s is string {
  if (typeof s !== "string" || s.length === 0 || s.length > MAX_ID_ESCAPED)
    return false;
  if (/[\u0000-\u001f\u007f]/.test(s)) return false;
  try {
    // Throws on a lone surrogate, which no key could carry.
    return encodeURIComponent(s).length <= MAX_ID_ESCAPED;
  } catch {
    return false;
  }
}

function dec(s: string): string | null {
  try {
    const out = decodeURIComponent(s);
    return validId(out) ? out : null;
  } catch {
    return null;
  }
}

/**
 * The canonical key of a reference — `task:42`, `trash:task:42`, `comments:task:42@thread-9`,
 * `assistant:c-1`. Ids are percent-escaped, so a key never holds `,` and parses back exactly.
 * Throws on a record type that is not `snake_case` or takes a reserved name.
 *
 * @example
 * panelTabKey({ kind: "record", type: "task", id: "42", scope: "live" }) // "task:42"
 */
export function panelTabKey(ref: PanelTabRef): string {
  const e = encodeURIComponent;
  switch (ref.kind) {
    case "record":
      if (!validType(ref.type))
        throw new Error(`Invalid panel record type "${ref.type}"`);
      if (ref.type === "run" && ref.agentId === undefined)
        throw new Error("A run ref needs its agentId");
      return `${ref.scope === "trash" ? "trash:" : ""}${ref.type}:${e(ref.id)}${
        ref.agentId !== undefined ? `@${e(ref.agentId)}` : ""
      }`;
    case "view":
      if (!validType(ref.subject.type))
        throw new Error(`Invalid panel record type "${ref.subject.type}"`);
      return `${ref.view}:${ref.subject.type}:${e(ref.subject.id)}${
        ref.at !== undefined ? `@${e(ref.at)}` : ""
      }`;
    case "assistant":
      return ref.chatId === null ? "assistant" : `assistant:${e(ref.chatId)}`;
  }
}

/**
 * A key back to its reference, or `null` for anything malformed (an unknown shape, a bad type, a
 * broken escape). Lenient about escaping: `panelTabKey` of the result is the canonical spelling.
 *
 * @example
 * parsePanelTabKey("trash:task:42") // { kind: "record", type: "task", id: "42", scope: "trash" }
 */
export function parsePanelTabKey(key: string): PanelTabRef | null {
  if (!key || key.length > MAX_KEY_LENGTH) return null;
  const parts = key.split(":");
  const head = parts[0]!;
  if (head === "trash") {
    if (parts.length !== 3 || !validType(parts[1])) return null;
    return readRecord(parts[1]!, parts[2]!, "trash");
  }
  if (head === "assistant") {
    if (parts.length === 1) return { kind: "assistant", chatId: null };
    if (parts.length !== 2) return null;
    const chatId = dec(parts[1]!);
    return chatId === null ? null : { kind: "assistant", chatId };
  }
  if (isView(head)) {
    if (parts.length !== 3 || !validType(parts[1])) return null;
    const [rawId, rawAt, ...extra] = parts[2]!.split("@");
    if (extra.length > 0) return null;
    const id = dec(rawId!);
    if (id === null) return null;
    if (rawAt === undefined)
      return { kind: "view", view: head, subject: { type: parts[1]!, id } };
    const at = dec(rawAt);
    return at === null
      ? null
      : { kind: "view", view: head, subject: { type: parts[1]!, id }, at };
  }
  if (parts.length !== 2 || !validType(head)) return null;
  return readRecord(head, parts[1]!, "live");
}

/** `<id>[@<agentId>]` of a record key. */
function readRecord(
  type: string,
  rest: string,
  scope: "live" | "trash",
): PanelRecordRef | null {
  const [rawId, rawAgent, ...extra] = rest.split("@");
  if (extra.length > 0) return null;
  const id = dec(rawId!);
  if (id === null) return null;
  if (rawAgent === undefined)
    return type === "run" ? null : { kind: "record", type, id, scope };
  const agentId = dec(rawAgent);
  return agentId === null ? null : { kind: "record", type, id, scope, agentId };
}

/** A reference from untrusted data (saved state), normalised, or `null`. */
function readRef(raw: unknown): PanelTabRef | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  let ref: PanelTabRef | null = null;
  if (r.kind === "record" && validType(r.type) && validId(r.id))
    ref =
      r.agentId === undefined
        ? r.type === "run"
          ? null
          : {
              kind: "record",
              type: r.type,
              id: r.id,
              scope: r.scope === "trash" ? "trash" : "live",
            }
        : validId(r.agentId)
          ? {
              kind: "record",
              type: r.type,
              id: r.id,
              scope: r.scope === "trash" ? "trash" : "live",
              agentId: r.agentId,
            }
          : null;
  else if (
    r.kind === "view" &&
    typeof r.view === "string" &&
    isView(r.view) &&
    r.subject &&
    typeof r.subject === "object"
  ) {
    const s = r.subject as Record<string, unknown>;
    if (validType(s.type) && validId(s.id))
      ref =
        r.at === undefined
          ? { kind: "view", view: r.view, subject: { type: s.type, id: s.id } }
          : validId(r.at)
            ? {
                kind: "view",
                view: r.view,
                subject: { type: s.type, id: s.id },
                at: r.at,
              }
            : null;
  } else if (r.kind === "assistant" && (r.chatId === null || validId(r.chatId)))
    ref = { kind: "assistant", chatId: r.chatId };
  return ref;
}

/* ---------------------------------------------------------------------------------------------
 * State
 * -------------------------------------------------------------------------------------------*/

/** One open tab. */
export interface PanelTab {
  /** `panelTabKey(ref)`. */
  readonly key: string;
  readonly ref: PanelTabRef;
  /** Where this tab was before, newest last (`navigate` pushes, `back` pops). */
  readonly back: readonly PanelTabRef[];
  /** An italic preview tab the next preview open replaces (L18). Not saved. */
  readonly preview: boolean;
  /** Pinned: an icon at the start, never closed by the cap or auto-close. */
  readonly pinned: boolean;
  /** The record changed since the tab was last seen (R4). Not saved. */
  readonly changed: boolean;
  /** Holds a draft or an upload (#5): never closed by the cap or auto-close. */
  readonly protected: boolean;
  /** When the tab was last seen (epoch ms): what the cap and auto-close measure. */
  readonly seenAt: number;
  /** Order of last sight, a tie-break for `seenAt`. */
  readonly seenSeq: number;
  /** The tab it was opened from in the background, so siblings line up in click order. */
  readonly opener: string | null;
}

/** What `undo` restores: the tabs one action closed, at their places. */
export interface PanelTabsUndo {
  /** Which action closed them — `cap` is the eviction toast's Undo. */
  readonly reason: "cap" | "close" | "bulk" | "expire";
  readonly entries: readonly {
    readonly tab: PanelTab;
    readonly index: number;
  }[];
  /** The current tab before the action, restored when it was among the closed. */
  readonly activeKey: string | null;
}

/** Something the app shows a toast for; `seq` rises with each new one. */
export type PanelTabsEvent =
  | { readonly type: "evicted"; readonly key: string; readonly seq: number }
  | { readonly type: "overCap"; readonly seq: number };

/** The panel's tab state. */
export interface PanelTabsState {
  readonly tabs: readonly PanelTab[];
  readonly activeKey: string | null;
  /** Recently closed, newest first, one entry per key. */
  readonly closed: readonly PanelTab[];
  /** The last closing action, for an Undo; `null` when there is nothing to undo. */
  readonly undo: PanelTabsUndo | null;
  /** The last cap event, for a toast. */
  readonly event: PanelTabsEvent | null;
  /**
   * The last tab opened in the foreground as a kept tab — the one whose body should take focus.
   * Preview and background opens never set it, so they never move focus (#31).
   */
  readonly focus: { readonly key: string; readonly seq: number } | null;
  /** The sight counter behind `seenSeq`. */
  readonly seq: number;
}

/** A tab as the URL carries it. */
export interface PanelParamTab {
  readonly key: string;
  readonly ref: PanelTabRef;
  readonly preview: boolean;
}

/** Every action `panelTabsReducer` takes. */
export type PanelTabsAction =
  | {
      type: "open";
      ref: PanelTabRef;
      now: number;
      /** Open as the preview tab (a single click, J/K). @default false */
      preview?: boolean;
      /** Open without leaving the current tab (⌘-click, middle-click); always kept. @default false */
      background?: boolean;
    }
  | { type: "activate"; key: string; now: number }
  | { type: "navigate"; key: string; ref: PanelTabRef; now: number }
  | { type: "back"; key: string; now: number }
  | {
      /**
       * Give a tab a new key in place, with no back-stack entry — a new chat that got its id
       * (`assistant` → `assistant:<id>`). Position, pin, protection, preview and sight stay; if
       * the new key is already open, the two merge into that tab and it becomes current.
       */
      type: "rekey";
      key: string;
      ref: PanelTabRef;
      now: number;
    }
  | { type: "close"; key: string; now?: number }
  | { type: "closeOthers"; key: string; now?: number }
  | { type: "closeRight"; key: string; now?: number }
  | { type: "closeAll"; now?: number }
  | { type: "keep"; key: string }
  | { type: "pin"; key: string }
  | { type: "unpin"; key: string }
  | { type: "reorder"; key: string; index: number }
  | { type: "reopen"; now: number; key?: string }
  | { type: "undo"; now: number }
  | { type: "expire"; now: number; maxAgeMs: number | null }
  | { type: "markChanged"; key: string }
  | { type: "protect"; key: string; protected: boolean }
  | {
      /** Adopt the URL's tabs (Back/Forward, a shared link), keeping what is known about each. */
      type: "restore";
      now: number;
      tabs: readonly { ref: PanelTabRef; preview: boolean }[];
      activeKey: string | null;
      /**
       * Keep open tabs the URL doesn't list (after the listed ones, in their order) instead of
       * moving them to Recently closed — for seeding from saved tabs, since a URL carries at most
       * 10. Back/Forward leave it off. @default false
       */
      keepUnlisted?: boolean;
    };

/** An empty panel. */
export function createPanelTabs(): PanelTabsState {
  return {
    tabs: [],
    activeKey: null,
    closed: [],
    undo: null,
    event: null,
    focus: null,
    seq: 0,
  };
}

function makeTab(
  ref: PanelTabRef,
  now: number,
  seq: number,
  extra: Partial<Omit<PanelTab, "key" | "ref">> = {},
): PanelTab {
  return {
    key: panelTabKey(ref),
    ref,
    back: [],
    preview: false,
    pinned: false,
    changed: false,
    protected: false,
    seenAt: now,
    seenSeq: seq,
    opener: null,
    ...extra,
  };
}

/** The current tab's index, or -1. */
export function activeIndexOf(state: PanelTabsState): number {
  return state.activeKey === null
    ? -1
    : state.tabs.findIndex((t) => t.key === state.activeKey);
}

const pinnedCount = (tabs: readonly PanelTab[]) =>
  tabs.filter((t) => t.pinned).length;

/** Seen longer ago first. */
const bySight = (a: PanelTab, b: PanelTab) =>
  a.seenAt - b.seenAt || a.seenSeq - b.seenSeq;

function rememberClosed(
  closed: readonly PanelTab[],
  gone: readonly PanelTab[],
): PanelTab[] {
  const fresh = gone.map((t) => ({ ...t, preview: false, opener: null }));
  const keys = new Set(fresh.map((t) => t.key));
  return [...fresh, ...closed.filter((t) => !keys.has(t.key))].slice(
    0,
    PANEL_CLOSED_LIMIT,
  );
}

const see = (tab: PanelTab, now: number, seq: number): PanelTab => ({
  ...tab,
  seenAt: now,
  seenSeq: seq,
  changed: false,
});

function insertIndex(
  tabs: readonly PanelTab[],
  activeKey: string | null,
  background: boolean,
): number {
  const floor = pinnedCount(tabs);
  const at =
    activeKey === null ? -1 : tabs.findIndex((t) => t.key === activeKey);
  if (at < 0) return tabs.length;
  let i = at + 1;
  if (background) while (i < tabs.length && tabs[i]!.opener === activeKey) i++;
  return Math.max(i, floor);
}

function closeWhere(
  state: PanelTabsState,
  gone: (tab: PanelTab, index: number) => boolean,
  reason: PanelTabsUndo["reason"],
  now?: number,
): PanelTabsState {
  const entries: { tab: PanelTab; index: number }[] = [];
  const kept: PanelTab[] = [];
  state.tabs.forEach((tab, index) => {
    if (gone(tab, index)) entries.push({ tab, index });
    else kept.push(tab);
  });
  if (entries.length === 0) return state;
  let activeKey = state.activeKey;
  if (activeKey !== null && !kept.some((t) => t.key === activeKey)) {
    // The right-hand neighbour of the closed current tab, else the nearest on its left.
    const at = state.tabs.findIndex((t) => t.key === activeKey);
    const right = state.tabs.slice(at + 1).find((t) => kept.includes(t));
    const left = state.tabs
      .slice(0, at)
      .reverse()
      .find((t) => kept.includes(t));
    activeKey = (right ?? left)?.key ?? null;
  }
  const keys = new Set(entries.map((e) => e.tab.key));
  // A tab that becomes current because its neighbour closed is now seen.
  const arriving = activeKey !== state.activeKey ? activeKey : null;
  const seq = arriving !== null ? state.seq + 1 : state.seq;
  return {
    ...state,
    seq,
    tabs: kept.map((t) => {
      const u =
        t.opener !== null && keys.has(t.opener) ? { ...t, opener: null } : t;
      return u.key === arriving
        ? now === undefined
          ? { ...u, changed: false, seenSeq: seq }
          : see(u, now, seq)
        : u;
    }),
    activeKey,
    closed: rememberClosed(
      state.closed,
      entries.map((e) => e.tab),
    ),
    undo: { reason, entries, activeKey: state.activeKey },
    // A focus request for a closed tab must not replay if the record opens again.
    focus: state.focus && keys.has(state.focus.key) ? null : state.focus,
  };
}

const nextEventSeq = (state: PanelTabsState) => (state.event?.seq ?? 0) + 1;

function applyCap(state: PanelTabsState, keepKey: string): PanelTabsState {
  if (state.tabs.length <= PANEL_TAB_CAP) return state;
  const candidates = state.tabs
    .filter(
      (t) =>
        !t.pinned &&
        !t.protected &&
        t.key !== keepKey &&
        t.key !== state.activeKey,
    )
    .sort(bySight);
  const victim = candidates[0];
  const seq = nextEventSeq(state);
  if (!victim) return { ...state, event: { type: "overCap", seq } };
  const next = closeWhere(state, (t) => t === victim, "cap");
  return { ...next, event: { type: "evicted", key: victim.key, seq } };
}

function mapTab(
  state: PanelTabsState,
  key: string,
  fn: (tab: PanelTab) => PanelTab,
): PanelTabsState {
  const i = state.tabs.findIndex((t) => t.key === key);
  if (i < 0) return state;
  const next = fn(state.tabs[i]!);
  if (next === state.tabs[i]) return state;
  const tabs = state.tabs.slice();
  tabs[i] = next;
  return { ...state, tabs };
}

/** Make `key` current: it is seen now, and the tab it replaces was seen until now. */
function activate(state: PanelTabsState, key: string, now: number) {
  const seq = state.seq + 1;
  let next = state;
  if (state.activeKey !== null && state.activeKey !== key)
    next = mapTab(next, state.activeKey, (t) => ({ ...t, seenAt: now }));
  next = mapTab(next, key, (t) => see(t, now, seq));
  return { ...next, activeKey: key, seq };
}

/** Ask for focus on `key`'s body (a kept tab opened in the foreground). */
const withFocus = (state: PanelTabsState, key: string): PanelTabsState => ({
  ...state,
  focus: { key, seq: state.seq },
});

function open(
  state: PanelTabsState,
  ref: PanelTabRef,
  now: number,
  preview: boolean,
  background: boolean,
): PanelTabsState {
  const key = panelTabKey(ref);
  const asPreview = preview && !background;
  if (state.tabs.some((t) => t.key === key)) {
    const next = mapTab(state, key, (t) =>
      asPreview || !t.preview ? t : { ...t, preview: false },
    );
    if (background) return next;
    const active = activate(next, key, now);
    return asPreview ? active : withFocus(active, key);
  }
  const seq = state.seq + 1;
  if (!background && state.activeKey !== null)
    state = mapTab(state, state.activeKey, (t) => ({ ...t, seenAt: now }));
  const tab = makeTab(ref, now, seq, {
    preview: asPreview,
    opener: background && state.activeKey !== null ? state.activeKey : null,
  });
  const tabs = state.tabs.slice();
  const previewAt = asPreview ? tabs.findIndex((t) => t.preview) : -1;
  // The preview tab is replaced in place (L18); a replaced preview is not "closed".
  if (previewAt >= 0) tabs[previewAt] = tab;
  else
    tabs.splice(insertIndex(state.tabs, state.activeKey, background), 0, tab);
  const capped = applyCap(
    {
      ...state,
      tabs,
      closed: state.closed.filter((t) => t.key !== key),
      seq,
      activeKey:
        !background || state.activeKey === null ? key : state.activeKey,
    },
    key,
  );
  return background || asPreview ? capped : withFocus(capped, key);
}

/** Move the tab at `key` to show `ref`, keeping its place; `push` adds the old ref to its stack. */
function retarget(
  state: PanelTabsState,
  key: string,
  ref: PanelTabRef,
  back: readonly PanelTabRef[],
  now: number,
): PanelTabsState {
  const newKey = panelTabKey(ref);
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    activeKey: newKey,
    // The record is open again, so it is no longer "recently closed".
    closed: state.closed.filter((t) => t.key !== newKey),
    tabs: state.tabs
      .map((t) =>
        t.key === state.activeKey && t.key !== key ? { ...t, seenAt: now } : t,
      )
      .map((t) =>
        t.key === key
          ? { ...see(t, now, seq), key: newKey, ref, back, preview: false }
          : t.opener === key
            ? { ...t, opener: newKey }
            : t,
      ),
  };
}

/**
 * The panel tabs reducer. Pure; an action that changes nothing (an unknown key, nothing to undo)
 * returns the same state object, so React skips the render.
 *
 * @example
 * const [state, dispatch] = React.useReducer(panelTabsReducer, undefined, createPanelTabs);
 * dispatch({ type: "open", ref: { kind: "record", type: "task", id, scope: "live" }, preview: true, now: Date.now() });
 */
export function panelTabsReducer(
  state: PanelTabsState,
  action: PanelTabsAction,
): PanelTabsState {
  switch (action.type) {
    case "open":
      return open(
        state,
        action.ref,
        action.now,
        action.preview ?? false,
        action.background ?? false,
      );
    case "activate":
      if (!state.tabs.some((t) => t.key === action.key)) return state;
      return activate(state, action.key, action.now);
    case "navigate": {
      const tab = state.tabs.find((t) => t.key === action.key);
      if (!tab) return state;
      const newKey = panelTabKey(action.ref);
      if (newKey === tab.key) return state;
      // One tab per record: going to a record open in another tab goes to that tab.
      if (state.tabs.some((t) => t.key === newKey))
        return activate(state, newKey, action.now);
      return retarget(
        state,
        tab.key,
        action.ref,
        [...tab.back, tab.ref].slice(-BACK_LIMIT),
        action.now,
      );
    }
    case "rekey": {
      const at = state.tabs.findIndex((t) => t.key === action.key);
      if (at < 0) return state;
      const newKey = panelTabKey(action.ref);
      if (newKey === action.key) return state;
      const old = state.tabs[at]!;
      const other = state.tabs.findIndex((t) => t.key === newKey);
      if (other >= 0) {
        // Already open under the new key: fold the old tab into it.
        const into = state.tabs[other]!;
        const merged: PanelTab = {
          ...into,
          pinned: into.pinned || old.pinned,
          protected: into.protected || old.protected,
          preview: into.preview && old.preview,
        };
        const tabs = state.tabs
          .map((t, i) => (i === other ? merged : t))
          .filter((_, i) => i !== at)
          .map((t) => (t.opener === action.key ? { ...t, opener: newKey } : t));
        return activate({ ...state, tabs }, newKey, action.now);
      }
      return {
        ...state,
        activeKey: state.activeKey === action.key ? newKey : state.activeKey,
        focus:
          state.focus?.key === action.key
            ? { ...state.focus, key: newKey }
            : state.focus,
        tabs: state.tabs.map((t, i) =>
          i === at
            ? { ...t, key: newKey, ref: action.ref }
            : t.opener === action.key
              ? { ...t, opener: newKey }
              : t,
        ),
      };
    }
    case "back": {
      const tab = state.tabs.find((t) => t.key === action.key);
      const prev = tab?.back[tab.back.length - 1];
      if (!tab || !prev) return state;
      const prevKey = panelTabKey(prev);
      if (state.tabs.some((t) => t.key === prevKey))
        return activate(state, prevKey, action.now);
      return retarget(state, tab.key, prev, tab.back.slice(0, -1), action.now);
    }
    case "close":
      return closeWhere(
        state,
        (t) => t.key === action.key,
        "close",
        action.now,
      );
    case "closeOthers":
      if (!state.tabs.some((t) => t.key === action.key)) return state;
      return closeWhere(
        state,
        (t) => t.key !== action.key && !t.pinned,
        "bulk",
        action.now,
      );
    case "closeRight": {
      const at = state.tabs.findIndex((t) => t.key === action.key);
      if (at < 0) return state;
      return closeWhere(
        state,
        (t, i) => i > at && !t.pinned,
        "bulk",
        action.now,
      );
    }
    case "closeAll":
      return closeWhere(state, (t) => !t.pinned, "bulk", action.now);
    case "keep":
      return mapTab(state, action.key, (t) =>
        t.preview ? { ...t, preview: false } : t,
      );
    case "pin":
    case "unpin": {
      const pin = action.type === "pin";
      const at = state.tabs.findIndex((t) => t.key === action.key);
      if (at < 0 || state.tabs[at]!.pinned === pin) return state;
      const tab = { ...state.tabs[at]!, pinned: pin, preview: false };
      const rest = state.tabs.filter((_, i) => i !== at);
      const to = pinnedCount(rest);
      return {
        ...state,
        tabs: [...rest.slice(0, to), tab, ...rest.slice(to)],
      };
    }
    case "reorder": {
      const from = state.tabs.findIndex((t) => t.key === action.key);
      if (from < 0 || !Number.isFinite(action.index)) return state;
      // A tab moves only inside its own group: pinned tabs stay first.
      const pins = pinnedCount(state.tabs);
      const [lo, hi] = state.tabs[from]!.pinned
        ? [0, pins - 1]
        : [pins, state.tabs.length - 1];
      const to = Math.min(hi, Math.max(lo, Math.trunc(action.index)));
      if (to === from) return state;
      const tabs = state.tabs.slice();
      const [tab] = tabs.splice(from, 1);
      tabs.splice(to, 0, tab!);
      return { ...state, tabs };
    }
    case "reopen": {
      const tab =
        action.key === undefined
          ? state.closed[0]
          : state.closed.find((t) => t.key === action.key);
      if (!tab) return state;
      const closed = state.closed.filter((t) => t !== tab);
      // Already open again (navigated to): go there; the live tab wins over the snapshot.
      if (state.tabs.some((t) => t.key === tab.key))
        return withFocus(
          activate({ ...state, closed }, tab.key, action.now),
          tab.key,
        );
      const next = open(state, tab.ref, action.now, false, false);
      // The tab's own back-stack, and a draft it still holds, come back with it.
      return mapTab(next, tab.key, (t) => ({
        ...t,
        back: tab.back,
        protected: tab.protected,
      }));
    }
    case "undo": {
      const undo = state.undo;
      if (!undo) return state;
      const tabs = state.tabs.slice();
      const restored = new Set<string>();
      for (const entry of [...undo.entries].sort((a, b) => a.index - b.index)) {
        let tab = entry.tab;
        const index = entry.index;
        if (tabs.some((t) => t.key === tab.key)) continue;
        // One preview at most: a preview coming back beside another one returns kept.
        if (tab.preview && tabs.some((t) => t.preview))
          tab = { ...tab, preview: false };
        const pins = pinnedCount(tabs);
        const at = tab.pinned
          ? Math.min(index, pins)
          : Math.max(pins, Math.min(index, tabs.length));
        tabs.splice(at, 0, tab);
        restored.add(tab.key);
      }
      // Bring back the current tab the action took away; an eviction keeps the newly opened one.
      const activeKey =
        undo.reason !== "cap" &&
        undo.activeKey !== null &&
        restored.has(undo.activeKey)
          ? undo.activeKey
          : state.activeKey;
      return {
        ...state,
        tabs,
        activeKey: activeKey ?? tabs[0]?.key ?? null,
        closed: state.closed.filter((t) => !restored.has(t.key)),
        undo: null,
      };
    }
    case "expire": {
      const { maxAgeMs, now } = action;
      if (maxAgeMs === null) return state;
      return closeWhere(
        state,
        (t) =>
          !t.pinned &&
          !t.protected &&
          t.key !== state.activeKey &&
          now - t.seenAt > maxAgeMs,
        "expire",
      );
    }
    case "markChanged":
      if (action.key === state.activeKey) return state;
      return mapTab(state, action.key, (t) =>
        t.changed ? t : { ...t, changed: true },
      );
    case "protect":
      return mapTab(state, action.key, (t) =>
        t.protected === action.protected && (!action.protected || !t.preview)
          ? t
          : {
              ...t,
              protected: action.protected,
              // A draft or an upload makes a preview tab permanent.
              preview: action.protected ? false : t.preview,
            },
      );
    case "restore": {
      const known = new Map(state.tabs.map((t) => [t.key, t]));
      let seq = state.seq;
      const seenKeys = new Set<string>();
      const tabs: PanelTab[] = [];
      for (const p of action.tabs) {
        const key = panelTabKey(p.ref);
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        const had = known.get(key);
        if (had)
          tabs.push({
            ...had,
            preview: p.preview && !had.pinned && !had.protected,
          });
        else {
          seq += 1;
          tabs.push(makeTab(p.ref, action.now, seq, { preview: p.preview }));
        }
      }
      const unlisted = state.tabs.filter((t) => !seenKeys.has(t.key));
      if (action.keepUnlisted)
        for (const t of unlisted) {
          tabs.push(t);
          seenKeys.add(t.key);
        }
      tabs.sort((a, b) => Number(b.pinned) - Number(a.pinned));
      const dropped = action.keepUnlisted ? [] : unlisted;
      const activeKey =
        action.activeKey !== null && seenKeys.has(action.activeKey)
          ? action.activeKey
          : (tabs[0]?.key ?? null);
      seq += 1;
      return {
        ...state,
        tabs: tabs.map((t) =>
          t.key === activeKey ? see(t, action.now, seq) : t,
        ),
        activeKey,
        seq,
        closed: rememberClosed(
          state.closed.filter((t) => !seenKeys.has(t.key)),
          dropped,
        ),
      };
    }
  }
}

/* ---------------------------------------------------------------------------------------------
 * Saved tabs (#6) — `{ v: 1, active, tabs: [{ ref, pinned, lastSeenAt }] }`. Preview tabs and
 * dots are transient; a draft's protection comes back from the app's draft store.
 * -------------------------------------------------------------------------------------------*/

/** The saved shape of a person's tabs in one workspace. */
export interface SavedPanelTabs {
  readonly v: 1;
  readonly active: string | null;
  readonly tabs: readonly {
    readonly ref: PanelTabRef;
    readonly pinned: boolean;
    readonly lastSeenAt: number;
  }[];
}

/**
 * The state to save: kept tabs only, in order.
 *
 * @example
 * savePrefs({ tabs: { [workspaceId]: serializePanelTabs(state) } })
 */
export function serializePanelTabs(state: PanelTabsState): SavedPanelTabs {
  const kept = state.tabs.filter((t) => !t.preview).slice(0, SAVED_LIMIT);
  const active = kept.some((t) => t.key === state.activeKey)
    ? state.activeKey
    : (kept[0]?.key ?? null);
  return {
    v: 1,
    active,
    tabs: kept.map((t) => ({
      ref: t.ref,
      pinned: t.pinned,
      lastSeenAt: t.seenAt,
    })),
  };
}

/**
 * Saved tabs back to a state. Never throws: another version, or any malformed entry, is dropped.
 *
 * @example
 * const state = deserializePanelTabs(prefs.tabs?.[workspaceId]);
 */
export function deserializePanelTabs(raw: unknown): PanelTabsState {
  const empty = createPanelTabs();
  if (!raw || typeof raw !== "object") return empty;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1 || !Array.isArray(r.tabs)) return empty;
  const tabs: PanelTab[] = [];
  const seen = new Set<string>();
  for (const entry of r.tabs.slice(0, SAVED_LIMIT * 2)) {
    if (tabs.length >= SAVED_LIMIT) break;
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const ref = readRef(e.ref);
    if (!ref) continue;
    let key: string;
    try {
      key = panelTabKey(ref);
    } catch {
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    const at =
      typeof e.lastSeenAt === "number" && Number.isFinite(e.lastSeenAt)
        ? e.lastSeenAt
        : 0;
    tabs.push(makeTab(ref, at, tabs.length + 1, { pinned: e.pinned === true }));
  }
  tabs.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const activeKey =
    typeof r.active === "string" && seen.has(r.active)
      ? r.active
      : (tabs[0]?.key ?? null);
  return { ...empty, tabs, activeKey, seq: tabs.length };
}

/* ---------------------------------------------------------------------------------------------
 * URL codec — `?panel=task:<id>,~page:<id>&tab=<i>` (§2, #7). Keys are canonical and never hold
 * `,`; a leading `~` marks the preview tab. At most `PANEL_TAB_CAP` refs: past that, the URL
 * keeps the current tab and those seen most recently, and the saved state holds the rest.
 * -------------------------------------------------------------------------------------------*/

/**
 * The search-param values for the panel, or `null` when no tab is open (drop both params).
 *
 * @example
 * encodePanelParam(state) // { panel: "task:1,~page:2", tab: "0" }
 */
export function encodePanelParam(
  state: Pick<PanelTabsState, "tabs" | "activeKey">,
): { panel: string; tab: string } | null {
  if (state.tabs.length === 0) return null;
  let tabs = state.tabs;
  if (tabs.length > PANEL_TAB_CAP) {
    const keep = new Set(
      [...tabs]
        .sort((a, b) =>
          a.key === state.activeKey
            ? -1
            : b.key === state.activeKey
              ? 1
              : bySight(b, a),
        )
        .slice(0, PANEL_TAB_CAP),
    );
    tabs = tabs.filter((t) => keep.has(t));
  }
  const panel = tabs.map((t) => (t.preview ? "~" : "") + t.key).join(",");
  const at = tabs.findIndex((t) => t.key === state.activeKey);
  return { panel, tab: String(Math.max(0, at)) };
}

/**
 * Read `?panel=` and `?tab=` back. Forgiving, because links are shared and hand-edited: malformed
 * entries are dropped silently, duplicates collapse to the first, only the first preview stays a
 * preview, at most 10 refs are read, and a missing or out-of-range `tab` picks the nearest tab.
 * Feed the result to the `restore` action.
 *
 * @example
 * decodePanelParam("task:1,~page:2", "1").activeKey // "page:2"
 */
export function decodePanelParam(
  panel: string | null | undefined,
  tab: string | null | undefined,
): { tabs: PanelParamTab[]; activeKey: string | null } {
  const tabs: PanelParamTab[] = [];
  if (panel) {
    const seen = new Set<string>();
    let previewTaken = false;
    for (const raw of panel.split(",")) {
      if (tabs.length >= PANEL_TAB_CAP) break;
      let entry = raw.trim();
      const preview = entry.startsWith("~");
      if (preview) entry = entry.slice(1);
      const ref = parsePanelTabKey(entry);
      if (!ref) continue;
      const key = panelTabKey(ref);
      if (seen.has(key)) continue;
      seen.add(key);
      tabs.push({ key, ref, preview: preview && !previewTaken });
      if (preview) previewTaken = true;
    }
  }
  if (tabs.length === 0) return { tabs, activeKey: null };
  const n = Number(tab);
  const index = Number.isInteger(n)
    ? Math.min(tabs.length - 1, Math.max(0, n))
    : 0;
  return { tabs, activeKey: tabs[index]!.key };
}
