// @vegastack transcript@0.23.12 sha256-biNOI9JPVKG68TbxsGgx/l5nN+EQXgSunhAR+qyACP4=

"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, LocateFixed, Pencil } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { formatDefaultTime } from "@/components/ui/media-player-controls";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller";
import { PanelSearch, PanelSearchField } from "@/components/ui/panel-search";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { usePrefersReducedMotion } from "@/components/ui/use-media-query";

/* ---
Transcript (DS-49) is a THIN layer on MessageScroller's primitive, and it owns no scroll logic.

- Every scroll goes through the engine: `defaultScrollPosition="start"` places a fresh list, follow
  and search both call `scrollToMessage(id, { align: "center" })`, and `autoScroll` stays off, so
  appending segments (live captions) never pins the list to its end.
- The engine's own user-intent signal (wheel, touch, the scroll keys) is what pauses follow: the
  viewport forwards those events to our handlers after the engine has seen them.
- "Back to current line" reads the engine's `visibleMessageIds`; nothing here measures a rect.
- Lazy rendering is progressive MOUNTING, never render skipping: the first `batchSize` rows mount
  at once and the rest follow in idle-time batches; the current row and the current search match
  are always mounted before anything scrolls to them. Rows still opt OUT of MessageScrollerItem's
  `content-visibility: auto`. `scrollToMessage` measures the target against the heights laid out
  at that moment, and skipped rows report their intrinsic ESTIMATE; as soon as the rows near the
  target render, the real heights replace the estimate and a long jump lands hundreds of pixels
  past its row (measured: 270px on a 40-row list), with nothing to correct it short of scroll logic
  of our own. Laying every row out costs once, at mount; a `currentTime` tick still re-renders two
  rows at most, because the active id lives in a tiny store each row subscribes to with a boolean
  selector.

Two structural rulings, both recorded with the change (DS-49):
- The content is a `list` of `listitem` rows, not the engine's `log`. A recording's transcript is a
  document the reader moves through, not a feed; `log` + `aria-relevant="additions"` would also
  announce every `<mark>` a search inserts, and A11Y-4 allows one live region per component, which
  is our `useAnnouncer` (search positions).
- Each row IS an `Item` rendered through `MessageScrollerItem` (one element: the engine's
  `data-message-id` and Item's row classes). It takes `listitem` explicitly, because its list is
  the engine's content element, not an `ItemGroup` (A11Y-7 licenses the role by context; here the
  context is that list).
--- */

/** One timed line of speech. `start`/`end` are seconds from the start of the recording. */
export type TranscriptSegment = {
  /** Stable id; becomes the engine's `messageId`. */
  id: string;
  /** Start, in seconds. Segments are sorted by `start`. */
  start: number;
  /** End, in seconds. Past it (in a gap before the next start) no row is current. */
  end?: number;
  /** Speaker id; `speakerName` turns it into the displayed name. */
  speaker: string;
  /** What was said. */
  text: string;
};

/** Props accepted by `Transcript`. */
export interface TranscriptProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "aria-label"
> {
  /** The segments, sorted by `start`. */
  segments: TranscriptSegment[];
  /**
   * Called when a speaker chip in `TranscriptSpeakers` is renamed. Without it, the chips have no
   * rename button.
   * @default undefined
   */
  onSpeakerRename?: (id: string, name: string) => void;
  /**
   * Rows mounted in the first paint; the rest mount in idle-time batches of the same size. The
   * current row and the current search match are always mounted.
   * @default 100
   */
  batchSize?: number;
  /**
   * Maps a speaker id to the name shown on its rows. Keep it referentially stable (module level
   * or `useCallback`) on a long transcript — it is a render dependency of every row.
   * @default (id) => id
   */
  speakerName?: (id: string) => string;
  /**
   * The playback position in seconds; the row it falls in gets `aria-current="true"`.
   * @default undefined — no row is current
   */
  currentTime?: number;
  /**
   * Called with a segment's `start` when its timestamp is activated. Without it, timestamps are
   * plain text and no row has a button.
   * @default undefined
   */
  onSeek?: (seconds: number) => void;
  /**
   * Controlled follow: while true the current row is kept centred.
   * @default undefined — uncontrolled, starting at `defaultFollow`
   */
  follow?: boolean;
  /**
   * Initial follow state when uncontrolled.
   * @default true
   */
  defaultFollow?: boolean;
  /**
   * Called when follow pauses (a user scroll, a search jump) or resumes (the back button).
   * @default undefined
   */
  onFollowChange?: (follow: boolean) => void;
  /**
   * Controlled search query. Matches are wrapped in `<mark>`.
   * @default undefined — uncontrolled, starting empty
   */
  query?: string;
  /**
   * Called with the new query as the reader types in `TranscriptSearch`.
   * @default undefined
   */
  onQueryChange?: (query: string) => void;
  /**
   * Formats a segment's start for display. Keep it referentially stable on a long transcript.
   * @default m:ss, or h:mm:ss past an hour
   */
  formatTime?: (seconds: number) => string;
  /**
   * The seek button's accessible name, given the formatted time. Keep the visible time inside it
   * (WCAG 2.5.3).
   * @default (time) => `Play from ${time}`
   */
  seekLabel?: (time: string) => string;
  /**
   * Visually hidden text on the current row.
   * @default "Now playing"
   */
  nowPlayingLabel?: string;
  /**
   * Shows skeleton rows while there are no segments, and marks the list busy.
   * @default false
   */
  loading?: boolean;
  /**
   * Text for the loading state, read by screen readers.
   * @default "Loading transcript…"
   */
  loadingLabel?: string;
  /**
   * Shown when there are no segments and nothing is loading.
   * @default "No transcript yet"
   */
  emptyState?: React.ReactNode;
  /**
   * The button that brings a paused list back to the current row.
   * @default "Back to current line"
   */
  backLabel?: string;
  /** Names the scrollable transcript region. */
  "aria-label": string;
  /** `TranscriptSearch` (optional) and `TranscriptList`. */
  children: React.ReactNode;
}

/** Props accepted by `TranscriptList`. */
export interface TranscriptListProps {
  /**
   * Classes for the list's scroll frame (give it a height, or let it flex).
   * @default undefined
   */
  className?: string;
}

/** Props accepted by `TranscriptSpeakers`. */
export interface TranscriptSpeakersProps {
  /**
   * Accessible name of a chip's rename button, given the speaker's name.
   * @default (name) => `Rename ${name}`
   */
  renameLabel?: (name: string) => string;
  /**
   * Accessible name of the rename field.
   * @default "Speaker name"
   */
  inputLabel?: string;
  /**
   * Classes for the chip row.
   * @default undefined
   */
  className?: string;
}

/** Props accepted by `TranscriptSearch`. */
export interface TranscriptSearchProps {
  /**
   * The search field's accessible name.
   * @default "Search transcript"
   */
  label?: string;
  /**
   * Placeholder text in the empty field.
   * @default "Search…"
   */
  placeholder?: string;
  /**
   * The position text, shown and announced after each move.
   * @default (i, n) => `${i} of ${n}`
   */
  matchLabel?: (index: number, total: number) => string;
  /**
   * Shown and announced when the query matches nothing.
   * @default "No matches"
   */
  noMatchesLabel?: string;
  /**
   * Name of the button that moves to the previous match.
   * @default "Previous match"
   */
  previousLabel?: string;
  /**
   * Name of the button that moves to the next match.
   * @default "Next match"
   */
  nextLabel?: string;
  /**
   * Classes for the search row.
   * @default undefined
   */
  className?: string;
}

// ── internals ─────────────────────────────────────────────────────────────────────────────────

/** The last segment whose `start` is at or before `time`; -1 before the first or inside a gap. */
function findActiveIndex(segments: TranscriptSegment[], time?: number) {
  if (time === undefined || !Number.isFinite(time)) return -1;
  let lo = 0;
  let hi = segments.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid]!.start <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const end = found >= 0 ? segments[found]!.end : undefined;
  return end !== undefined && time >= end ? -1 : found;
}

/**
 * Every occurrence of `needle` in `text`, case-insensitively, as `[start, end)` ranges in `text`
 * itself. Matched on the original string: lower-casing first can change its length ("İ" becomes
 * two code units), which would shift every highlight after it.
 */
function occurrences(text: string, needle: string) {
  if (!needle) return [];
  const pattern = new RegExp(
    needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "giu",
  );
  return [...text.matchAll(pattern)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
}

type Match = { id: string; occurrence: number };

/** Speaker dot colours, assigned in order of first appearance and cycled past eight speakers. */
const SPEAKER_DOTS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
  "bg-chart-7",
  "bg-chart-8",
] as const;

function SpeakerDot({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      data-slot="transcript-speaker-dot"
      className={cn("size-2 shrink-0 rounded-full", className)}
    />
  );
}

/** A one-value store rows subscribe to, so a new active id re-renders two rows, not the list. */
function createActiveStore(initial: string | null) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    initial,
    get: () => value,
    set(next: string | null) {
      if (next === value) return;
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
type ActiveStore = ReturnType<typeof createActiveStore>;

function useIsActive(store: ActiveStore, id: string) {
  return React.useSyncExternalStore(
    store.subscribe,
    () => store.get() === id,
    () => store.initial === id,
  );
}

function useActiveId(store: ActiveStore) {
  return React.useSyncExternalStore(
    store.subscribe,
    store.get,
    () => store.initial,
  );
}

interface TranscriptContextValue {
  segments: TranscriptSegment[];
  activeStore: ActiveStore;
  following: boolean;
  setFollowing: (next: boolean) => void;
  /** The trimmed, lower-cased needle the matches were computed from. */
  query: string;
  /** What the reader typed. */
  rawQuery: string;
  setQuery: (next: string) => void;
  matches: Match[];
  matchIndex: number;
  setMatchIndex: (next: number) => void;
  seek: ((seconds: number) => void) | null;
  speakerName: (id: string) => string;
  /** Speaker ids in order of first appearance. */
  speakers: string[];
  speakerDot: (id: string) => string;
  onSpeakerRename: ((id: string, name: string) => void) | null;
  /** Rows mounted so far. */
  renderedCount: number;
  /** Make sure segment `index` is mounted. */
  ensureRendered: (index: number) => void;
  formatTime: (seconds: number) => string;
  seekLabel: (time: string) => string;
  nowPlayingLabel: string;
  loading: boolean;
  loadingLabel: string;
  emptyState: React.ReactNode;
  backLabel: string;
  label: string;
  announce: (text: string) => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

const TranscriptContext = React.createContext<TranscriptContextValue | null>(
  null,
);

function useTranscript(part: string) {
  const context = React.useContext(TranscriptContext);
  if (!context) throw new Error(`${part} must be used within a Transcript.`);
  return context;
}

const identity = (id: string) => id;
const defaultSeekLabel = (time: string) => `Play from ${time}`;
const defaultMatchLabel = (index: number, total: number) =>
  `${index} of ${total}`;

/** Scroll behaviour for a jump the reader asked for; instant under reduced motion (MOT-5). */
function useJumpBehavior(): ScrollBehavior {
  return usePrefersReducedMotion() ? "auto" : "smooth";
}

/** Keeps the current row centred while following. Renders nothing. */
function TranscriptFollow({
  activeId,
  following,
}: {
  activeId: string | null;
  following: boolean;
}) {
  const { scrollToMessage } = useMessageScroller();
  const behavior = useJumpBehavior();
  const placedRef = React.useRef(false);
  React.useEffect(() => {
    if (!following || activeId === null) return;
    // The first placement is instant: a mid-recording mount lands on the row, it does not glide.
    scrollToMessage(activeId, {
      align: "center",
      behavior: placedRef.current ? behavior : "auto",
    });
    placedRef.current = true;
  }, [activeId, following, scrollToMessage, behavior]);
  return null;
}

// ── Transcript ────────────────────────────────────────────────────────────────────────────────

/**
 * `Transcript` — a timestamped, speaker-labelled list of what was said in a recording, on
 * MessageScroller's primitive. It marks the row playing at `currentTime`, keeps it centred while
 * following, pauses when the reader scrolls, and offers "Back to current line". Compose
 * `TranscriptSearch` (optional) and `TranscriptList` inside it.
 *
 * @example
 * <Transcript
 *   aria-label="Meeting transcript"
 *   segments={segments}
 *   speakerName={(id) => people[id].name}
 *   currentTime={time}
 *   onSeek={(s) => player.current?.seek(s)}
 *   className="h-96"
 * >
 *   <TranscriptSearch />
 *   <TranscriptList />
 * </Transcript>
 */
export function Transcript({
  segments,
  onSpeakerRename,
  batchSize = 100,
  speakerName = identity,
  currentTime,
  onSeek,
  follow,
  defaultFollow = true,
  onFollowChange,
  query: queryProp,
  onQueryChange,
  formatTime = formatDefaultTime,
  seekLabel = defaultSeekLabel,
  nowPlayingLabel = "Now playing",
  loading = false,
  loadingLabel = "Loading transcript…",
  emptyState,
  backLabel = "Back to current line",
  "aria-label": label,
  className,
  children,
  ...props
}: TranscriptProps) {
  const activeIndex = findActiveIndex(segments, currentTime);
  const activeId = activeIndex >= 0 ? segments[activeIndex]!.id : null;

  const storeRef = React.useRef<ActiveStore | null>(null);
  storeRef.current ??= createActiveStore(activeId);
  const activeStore = storeRef.current;
  React.useLayoutEffect(() => {
    activeStore.set(activeId);
  }, [activeStore, activeId]);

  // Event callbacks are read through refs, so an inline handler never re-renders the list.
  const callbacks = React.useRef({ onSeek, onFollowChange, onQueryChange });
  React.useLayoutEffect(() => {
    callbacks.current = { onSeek, onFollowChange, onQueryChange };
  });

  const [followState, setFollowState] = React.useState(defaultFollow);
  const following = follow ?? followState;
  const followingRef = React.useRef(following);
  followingRef.current = following;
  const setFollowing = React.useCallback(
    (next: boolean) => {
      if (followingRef.current === next) return;
      followingRef.current = next;
      if (follow === undefined) setFollowState(next);
      callbacks.current.onFollowChange?.(next);
    },
    [follow],
  );

  const [queryState, setQueryState] = React.useState("");
  const query = queryProp ?? queryState;
  const setQuery = React.useCallback(
    (next: string) => {
      if (queryProp === undefined) setQueryState(next);
      callbacks.current.onQueryChange?.(next);
    },
    [queryProp],
  );

  const needle = query.trim().toLowerCase();
  const matches = React.useMemo(() => {
    const out: Match[] = [];
    if (!needle) return out;
    for (const segment of segments) {
      const found = occurrences(segment.text, needle);
      for (let occurrence = 0; occurrence < found.length; occurrence++) {
        out.push({ id: segment.id, occurrence });
      }
    }
    return out;
  }, [segments, needle]);

  // The position resets to the first match whenever the query changes.
  const [position, setPosition] = React.useState({ needle, index: 0 });
  const matchIndex =
    position.needle === needle && position.index < matches.length
      ? position.index
      : 0;
  const setMatchIndex = React.useCallback(
    (index: number) => setPosition({ needle, index }),
    [needle],
  );

  const speakers = React.useMemo(() => {
    const seen = new Set<string>();
    for (const segment of segments) seen.add(segment.speaker);
    return [...seen];
  }, [segments]);
  const speakerDot = React.useCallback(
    (id: string) =>
      SPEAKER_DOTS[Math.max(0, speakers.indexOf(id)) % SPEAKER_DOTS.length]!,
    [speakers],
  );
  const hasRename = onSpeakerRename !== undefined;
  const renameRef = React.useRef(onSpeakerRename);
  React.useLayoutEffect(() => {
    renameRef.current = onSpeakerRename;
  });
  const rename = React.useMemo(
    () =>
      hasRename
        ? (id: string, name: string) => renameRef.current?.(id, name)
        : null,
    [hasRename],
  );

  // ── Progressive mounting ──
  const [grown, setGrown] = React.useState(batchSize);
  const currentMatchSegment = matches[matchIndex]
    ? segments.findIndex((segment) => segment.id === matches[matchIndex]!.id)
    : -1;
  const renderedCount = Math.min(
    segments.length,
    Math.max(grown, activeIndex + 1, currentMatchSegment + 1),
  );
  React.useEffect(() => {
    if (grown >= segments.length) return;
    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(() => setGrown((n) => n + batchSize))
        : setTimeout(() => setGrown((n) => n + batchSize), 16);
    return () => {
      if (typeof window !== "undefined" && "cancelIdleCallback" in window)
        window.cancelIdleCallback(idle as number);
      clearTimeout(idle as ReturnType<typeof setTimeout>);
    };
  }, [grown, segments.length, batchSize]);
  const ensureRendered = React.useCallback(
    (index: number) => setGrown((n) => Math.max(n, index + 1)),
    [],
  );

  const hasSeek = onSeek !== undefined;
  const seek = React.useMemo(
    () =>
      hasSeek ? (seconds: number) => callbacks.current.onSeek?.(seconds) : null,
    [hasSeek],
  );

  const { announce, Announcer } = useAnnouncer();
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  const context = React.useMemo<TranscriptContextValue>(
    () => ({
      segments,
      activeStore,
      following,
      setFollowing,
      query: needle,
      rawQuery: query,
      setQuery,
      matches,
      matchIndex,
      setMatchIndex,
      seek,
      speakerName,
      speakers,
      speakerDot,
      onSpeakerRename: rename,
      renderedCount,
      ensureRendered,
      formatTime,
      seekLabel,
      nowPlayingLabel,
      loading,
      loadingLabel,
      emptyState,
      backLabel,
      label,
      announce,
      viewportRef,
    }),
    [
      segments,
      activeStore,
      following,
      setFollowing,
      needle,
      query,
      setQuery,
      matches,
      matchIndex,
      setMatchIndex,
      seek,
      speakerName,
      speakers,
      speakerDot,
      rename,
      renderedCount,
      ensureRendered,
      formatTime,
      seekLabel,
      nowPlayingLabel,
      loading,
      loadingLabel,
      emptyState,
      backLabel,
      label,
      announce,
    ],
  );

  return (
    <MessageScrollerProvider defaultScrollPosition="start">
      <TranscriptContext.Provider value={context}>
        <div
          data-slot="transcript"
          className={cn("flex min-h-0 flex-col", className)}
          {...props}
        >
          {children}
          <Announcer />
        </div>
        <TranscriptFollow activeId={activeId} following={following} />
      </TranscriptContext.Provider>
    </MessageScrollerProvider>
  );
}

// ── rows ──────────────────────────────────────────────────────────────────────────────────────

function Highlighted({
  text,
  needle,
  current,
}: {
  text: string;
  needle: string;
  current: number;
}) {
  const found = occurrences(text, needle);
  if (found.length === 0) return text;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  found.forEach(({ start, end }, index) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    const isCurrent = index === current;
    parts.push(
      <mark
        key={start}
        data-current={isCurrent ? "true" : undefined}
        className={cn(
          "rounded-sm px-0.5 text-foreground",
          isCurrent ? "bg-primary text-primary-foreground" : "bg-primary/15",
        )}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

interface RowProps {
  segment: TranscriptSegment;
  activeStore: ActiveStore;
  speaker: string;
  dot: string;
  time: string;
  seekName: string;
  seek: ((seconds: number) => void) | null;
  needle: string;
  currentOccurrence: number;
  nowPlayingLabel: string;
}

const TranscriptRow = React.memo(function TranscriptRow({
  segment,
  activeStore,
  speaker,
  dot,
  time,
  seekName,
  seek,
  needle,
  currentOccurrence,
  nowPlayingLabel,
}: RowProps) {
  const active = useIsActive(activeStore, segment.id);
  return (
    <Item
      size="sm"
      role="listitem"
      data-slot="transcript-segment"
      aria-current={active ? "true" : undefined}
      className="flex-nowrap items-start [content-visibility:visible] aria-[current=true]:bg-muted"
      render={<MessageScrollerItem messageId={segment.id} />}
    >
      <ItemContent className="min-w-0 gap-1">
        <div
          data-slot="transcript-turn-header"
          className="flex min-w-0 items-center gap-2"
        >
          {active ? (
            <span data-slot="transcript-now-playing" className="sr-only">
              {nowPlayingLabel}
            </span>
          ) : null}
          {seek ? (
            <Button
              variant="ghost"
              size="xs"
              aria-label={seekName}
              className="-ms-1.5 text-muted-foreground tabular-nums"
              onClick={() => seek(segment.start)}
            >
              {time}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground tabular-nums">
              {time}
            </span>
          )}
          <SpeakerDot className={dot} />
          <ItemTitle className="min-w-0">
            <span className="truncate">{speaker}</span>
          </ItemTitle>
        </div>
        <p data-slot="transcript-text" className="text-sm text-foreground">
          <Highlighted
            text={segment.text}
            needle={needle}
            current={currentOccurrence}
          />
        </p>
      </ItemContent>
    </Item>
  );
});

// ── back to current line ──────────────────────────────────────────────────────────────────────

function TranscriptBack() {
  const { activeStore, following, setFollowing, backLabel, viewportRef } =
    useTranscript("TranscriptList");
  const activeId = useActiveId(activeStore);
  const { visibleMessageIds } = useMessageScrollerVisibility();
  const hidden =
    following || activeId === null || visibleMessageIds.includes(activeId);
  if (hidden) return null;
  return (
    <Button
      data-slot="transcript-back"
      variant="secondary"
      size="sm"
      className="absolute bottom-3 inset-s-1/2 -translate-x-1/2 border-border shadow-md motion-enter-up rtl:translate-x-1/2"
      onClick={() => {
        // Focus moves to the list before this button unmounts, so it never falls to the body.
        viewportRef.current?.focus({ preventScroll: true });
        setFollowing(true);
      }}
    >
      <LocateFixed aria-hidden />
      {backLabel}
    </Button>
  );
}

// ── TranscriptList ────────────────────────────────────────────────────────────────────────────

/** The keys the engine treats as a user scroll. Space only counts on the viewport itself. */
const SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
]);

/**
 * `TranscriptList` — the scrollable list of segments inside a `Transcript`: one row per segment
 * with the speaker, the timestamp (a "Play from m:ss" button when the Transcript has `onSeek`)
 * and the text. Also renders the loading and empty states and the "Back to current line" button.
 *
 * @example
 * <Transcript aria-label="Transcript" segments={segments} className="h-96">
 *   <TranscriptList />
 * </Transcript>
 */
export function TranscriptList({ className }: TranscriptListProps) {
  const {
    segments,
    activeStore,
    setFollowing,
    matches,
    matchIndex,
    query,
    seek,
    speakerName,
    speakerDot,
    renderedCount,
    formatTime,
    seekLabel,
    nowPlayingLabel,
    loading,
    loadingLabel,
    emptyState,
    label,
    viewportRef,
  } = useTranscript("TranscriptList");

  // Memoised, so a parent re-render (every `currentTime` tick) hands React the same row elements
  // and the list costs nothing; only the two rows whose `aria-current` flips re-render.
  const current = matches[matchIndex];
  const rows = React.useMemo(
    () =>
      segments.slice(0, renderedCount).map((segment) => {
        const time = formatTime(segment.start);
        return (
          <TranscriptRow
            key={segment.id}
            segment={segment}
            activeStore={activeStore}
            speaker={speakerName(segment.speaker)}
            dot={speakerDot(segment.speaker)}
            time={time}
            seekName={seekLabel(time)}
            seek={seek}
            needle={query}
            currentOccurrence={
              current?.id === segment.id ? current.occurrence : -1
            }
            nowPlayingLabel={nowPlayingLabel}
          />
        );
      }),
    [
      segments,
      renderedCount,
      activeStore,
      formatTime,
      speakerName,
      speakerDot,
      seekLabel,
      seek,
      query,
      current,
      nowPlayingLabel,
    ],
  );

  if (segments.length === 0) {
    return (
      <div
        data-slot="transcript-list"
        data-state={loading ? "loading" : "empty"}
        aria-busy={loading || undefined}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          className,
        )}
      >
        {loading ? (
          <div className="flex flex-col gap-4 p-3">
            <span role="status" className="sr-only">
              {loadingLabel}
            </span>
            {[0, 1, 2].map((row) => (
              <div key={row} aria-hidden className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {emptyState ?? "No transcript yet"}
          </div>
        )}
      </div>
    );
  }

  const pause = () => setFollowing(false);

  return (
    <MessageScroller
      data-slot="transcript-list"
      className={cn("min-h-0 flex-1", className)}
    >
      <MessageScrollerViewport
        ref={viewportRef}
        aria-label={label}
        onWheel={pause}
        onTouchMove={pause}
        onPointerDown={(event) => {
          // A press on the viewport itself, not on a row, is its scrollbar: a drag is coming.
          if (event.target === event.currentTarget) pause();
        }}
        onKeyDown={(event) => {
          if (!SCROLL_KEYS.has(event.key)) return;
          if (event.key === " " && event.target !== event.currentTarget) return;
          pause();
        }}
      >
        <MessageScrollerContent
          role="list"
          aria-busy={loading || undefined}
          className="gap-0.5 p-1"
        >
          {rows}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <TranscriptBack />
    </MessageScroller>
  );
}

// ── TranscriptSearch ──────────────────────────────────────────────────────────────────────────

/**
 * `TranscriptSearch` — the search row for a `Transcript`. Matches are wrapped in `<mark>`; Enter
 * and Shift+Enter (or the arrow buttons) move between them, each move scrolls the match into view,
 * pauses follow, and announces "{i} of {n}" (or "No matches"). Focus stays in the field.
 *
 * @example
 * <Transcript aria-label="Transcript" segments={segments} className="h-96">
 *   <TranscriptSearch />
 *   <TranscriptList />
 * </Transcript>
 */
export function TranscriptSearch({
  label = "Search transcript",
  placeholder = "Search…",
  matchLabel = defaultMatchLabel,
  noMatchesLabel = "No matches",
  previousLabel = "Previous match",
  nextLabel = "Next match",
  className,
}: TranscriptSearchProps) {
  const {
    query,
    rawQuery,
    setQuery,
    matches,
    matchIndex,
    setMatchIndex,
    setFollowing,
    announce,
    segments,
    renderedCount,
    ensureRendered,
  } = useTranscript("TranscriptSearch");
  const { scrollToMessage } = useMessageScroller();
  const behavior = useJumpBehavior();
  const total = matches.length;

  const goTo = React.useCallback(
    (index: number) => {
      const match = matches[index];
      if (!match) return;
      setFollowing(false);
      const target = segments.findIndex((segment) => segment.id === match.id);
      if (target >= renderedCount) {
        // Mount the target first, then scroll once it is laid out.
        ensureRendered(target);
        requestAnimationFrame(() =>
          scrollToMessage(match.id, { align: "center", behavior }),
        );
        return;
      }
      scrollToMessage(match.id, { align: "center", behavior });
    },
    [
      matches,
      setFollowing,
      scrollToMessage,
      behavior,
      segments,
      renderedCount,
      ensureRendered,
    ],
  );

  // A new query (or a first match arriving for it) settles on its first match and says where the
  // reader is. Later segments that only add matches (live captions) leave the position alone: the
  // visible count updates, and nothing is announced, scrolled or paused under the reader.
  const labels = React.useRef({ matchLabel, noMatchesLabel });
  React.useLayoutEffect(() => {
    labels.current = { matchLabel, noMatchesLabel };
  });
  const settled = React.useRef({ query: "", total: 0 });
  React.useEffect(() => {
    const previous = settled.current;
    settled.current = { query, total };
    if (!query || (previous.query === query && previous.total > 0)) return;
    announce(
      total > 0
        ? labels.current.matchLabel(1, total)
        : labels.current.noMatchesLabel,
    );
    goTo(0);
    // `goTo` changes with `matches`, which `query` and `total` already track.
  }, [query, total, announce]);

  const step = (delta: number) => {
    if (total === 0) return;
    const next = (matchIndex + delta + total) % total;
    setMatchIndex(next);
    announce(matchLabel(next + 1, total));
    goTo(next);
  };

  const status = query
    ? total > 0
      ? matchLabel(matchIndex + 1, total)
      : noMatchesLabel
    : null;

  return (
    <PanelSearch
      data-slot="transcript-search"
      className={cn("static z-auto h-9 bg-transparent pe-1", className)}
    >
      <PanelSearchField
        aria-label={label}
        placeholder={placeholder}
        value={rawQuery}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          step(event.shiftKey ? -1 : 1);
        }}
      />
      {status !== null ? (
        <span
          aria-hidden
          className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
        >
          {status}
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={previousLabel}
        disabled={total === 0}
        onClick={() => step(-1)}
      >
        <ChevronUp aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={nextLabel}
        disabled={total === 0}
        onClick={() => step(1)}
      >
        <ChevronDown aria-hidden />
      </Button>
    </PanelSearch>
  );
}

// ── TranscriptSpeakers ────────────────────────────────────────────────────────────────────────

function SpeakerChip({
  id,
  name,
  dot,
  onRename,
  renameLabel,
  inputLabel,
}: {
  id: string;
  name: string;
  dot: string;
  onRename: ((id: string, name: string) => void) | null;
  renameLabel: (name: string) => string;
  inputLabel: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(name);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const finish = (commit: boolean) => {
    const next = draft.trim();
    if (commit && next && next !== name) onRename?.(id, next);
    setEditing(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  if (editing) {
    return (
      <span
        role="listitem"
        data-slot="transcript-speaker"
        data-editing=""
        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-ring ps-2.5 pe-1"
      >
        <SpeakerDot className={dot} />
        <Input
          autoFocus
          aria-label={inputLabel}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={() => finish(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              finish(true);
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              finish(false);
            }
          }}
          className="h-6 w-32 border-0 bg-transparent px-0 text-xs shadow-none dark:bg-transparent"
        />
      </span>
    );
  }

  return (
    <span
      role="listitem"
      data-slot="transcript-speaker"
      className={cn(
        "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-border ps-2.5 text-xs font-medium text-foreground",
        onRename ? "pe-0.5" : "pe-2.5",
      )}
    >
      <SpeakerDot className={dot} />
      <span className="min-w-0 truncate">{name}</span>
      {onRename ? (
        <Button
          ref={buttonRef}
          variant="ghost"
          size="icon-xs"
          aria-label={renameLabel(name)}
          className="rounded-full text-muted-foreground"
          onClick={() => {
            setDraft(name);
            setEditing(true);
          }}
        >
          <Pencil aria-hidden />
        </Button>
      ) : null}
    </span>
  );
}

const defaultRenameLabel = (name: string) => `Rename ${name}`;

/**
 * `TranscriptSpeakers` — one chip per speaker, in order of first appearance, with the speaker's
 * dot colour and name. When the Transcript has `onSpeakerRename`, each chip carries a rename
 * button that turns it into a field: Enter or leaving the field saves, Escape cancels.
 *
 * @example
 * <Transcript aria-label="Transcript" segments={segments} onSpeakerRename={rename}>
 *   <div className="flex flex-wrap items-center gap-2">
 *     <TranscriptSearch className="flex-1" />
 *     <TranscriptSpeakers />
 *   </div>
 *   <TranscriptList />
 * </Transcript>
 */
export function TranscriptSpeakers({
  renameLabel = defaultRenameLabel,
  inputLabel = "Speaker name",
  className,
}: TranscriptSpeakersProps) {
  const { speakers, speakerName, speakerDot, onSpeakerRename } =
    useTranscript("TranscriptSpeakers");
  if (speakers.length === 0) return null;
  return (
    <div
      role="list"
      aria-label="Speakers"
      data-slot="transcript-speakers"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {speakers.map((id) => (
        <SpeakerChip
          key={id}
          id={id}
          name={speakerName(id)}
          dot={speakerDot(id)}
          onRename={onSpeakerRename}
          renameLabel={renameLabel}
          inputLabel={inputLabel}
        />
      ))}
    </div>
  );
}
