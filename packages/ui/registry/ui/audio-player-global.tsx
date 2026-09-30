// @vegastack audio-player@0.23.90 sha256-cZMr1U4fcCqwVN9N+x0nQBILCEOh/OMDe58fFSYkmTU=

"use client";

import * as React from "react";
import type {
  AudioPlayerActions,
  AudioPlayerProps,
} from "@/components/ui/audio-player";

/* ---
The global player: one recording that keeps playing while the reader moves between routes. The
provider sits in the app shell ABOVE the routes; `GlobalAudioPlayer` renders the floating pill
wherever the shell puts it (inside the main content column, so the pill centres on the content,
not across a sidebar).

This file is apart from `audio-player` so the app frame does not ship the player UI on every
route: the provider and hooks are small, and `GlobalAudioPlayer` loads `AudioPlayer` only once a
recording is open (`open()` starts the load at once). Import them from here in an app shell;
`audio-player` re-exports them unchanged.
--- */

/** Load the player UI (once); `open()` starts it so the pill appears without a wait. */
let playerLoad: Promise<typeof import("@/components/ui/audio-player")> | null =
  null;
function loadPlayer() {
  playerLoad ??= import("@/components/ui/audio-player");
  return playerLoad;
}
const LazyAudioPlayer = React.lazy(() =>
  loadPlayer().then((module) => ({ default: module.AudioPlayer })),
);

/** The recording the global player is holding. */
export interface GlobalPlayerTrack {
  /** Stable id of the recording; opening the same id again seeks instead of reloading. */
  id: string;
  /** A URL, or a function resolving a (signed) URL on first play. */
  src: AudioPlayerProps["src"];
  /** Visible title in the pill; a link back to `href` when one is given. */
  title?: string;
  /** Where the title links — the page the recording belongs to. */
  href?: string;
  /** Accessible label of the player. Defaults to `title`, then "Recording". */
  label?: string;
  /** Renews an expired signed URL; see `AudioPlayerProps.onSourceExpired`. */
  onSourceExpired?: () => Promise<string>;
}

/** Options for `useGlobalPlayer().open` and `.seek`. */
export interface GlobalPlayerSeekOptions {
  /** Start (or jump) at this many seconds. */
  at?: number;
  /**
   * Start playing.
   * @default true
   */
  play?: boolean;
}

/** What `useGlobalPlayer()` returns. */
export interface GlobalPlayerValue {
  /** The recording in the player, or `null` when it is closed. */
  track: GlobalPlayerTrack | null;
  /** Whether it is playing. */
  playing: boolean;
  /** Load `track` into the player (or reuse it when the id matches) and play from `at`. */
  open(track: GlobalPlayerTrack, opts?: GlobalPlayerSeekOptions): void;
  /** Jump the open recording to `seconds`; `play` defaults to true. */
  seek(seconds: number, opts?: { play?: boolean }): void;
  /** Resume playback. */
  play(): void;
  /** Pause playback. */
  pause(): void;
  /** Stop and close the player. */
  close(): void;
}

/** Props accepted by `AudioPlayerProvider`. */
export interface AudioPlayerProviderProps {
  /**
   * The app shell.
   * @default undefined
   */
  children?: React.ReactNode;
  /**
   * Renders the title link — pass your router's link (for example
   * `(props) => <Link {...props} />`) so the jump back is a client navigation.
   * @default a plain `<a>`
   */
  renderLink?: (props: {
    href: string;
    className: string;
    children: React.ReactNode;
  }) => React.ReactNode;
}

interface GlobalPlayerInternals {
  actionsRef: React.RefObject<AudioPlayerActions | null>;
  pendingRef: React.RefObject<GlobalPlayerSeekOptions | null>;
  setPlaying: (playing: boolean) => void;
  setTime: (seconds: number) => void;
  renderLink: NonNullable<AudioPlayerProviderProps["renderLink"]>;
}

const GlobalPlayerContext = React.createContext<GlobalPlayerValue | null>(null);
const GlobalPlayerTimeContext = React.createContext(0);
const GlobalPlayerInternalsContext =
  React.createContext<GlobalPlayerInternals | null>(null);

const defaultRenderLink: NonNullable<AudioPlayerProviderProps["renderLink"]> = (
  props,
) => <a {...props} />;

/**
 * `AudioPlayerProvider` — holds one global recording for the whole app. Mount
 * it in the app shell above the routes, render `GlobalAudioPlayer` inside the
 * main content column, and call `useGlobalPlayer().open(track)` from any page.
 * Playback survives route changes because the player lives in the shell.
 *
 * @example
 * <AudioPlayerProvider renderLink={(props) => <Link {...props} />}>
 *   <main className="flex min-h-0 flex-1 flex-col overflow-auto">
 *     {children}
 *     <GlobalAudioPlayer />
 *   </main>
 * </AudioPlayerProvider>
 */
export function AudioPlayerProvider({
  children,
  renderLink = defaultRenderLink,
}: AudioPlayerProviderProps) {
  const [track, setTrack] = React.useState<GlobalPlayerTrack | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const actionsRef = React.useRef<AudioPlayerActions | null>(null);
  const pendingRef = React.useRef<GlobalPlayerSeekOptions | null>(null);
  const trackRef = React.useRef(track);
  trackRef.current = track;

  const value = React.useMemo<GlobalPlayerValue>(
    () => ({
      track,
      playing,
      open(next, opts) {
        void loadPlayer();
        const play = opts?.play ?? true;
        const current = trackRef.current;
        if (current && current.id === next.id && actionsRef.current) {
          if (opts?.at !== undefined)
            actionsRef.current.seek(opts.at, { play });
          else if (play) actionsRef.current.play();
          return;
        }
        pendingRef.current = { at: opts?.at, play };
        setTime(opts?.at ?? 0);
        setTrack(next);
      },
      seek(seconds, opts) {
        actionsRef.current?.seek(seconds, { play: opts?.play ?? true });
      },
      play() {
        actionsRef.current?.play();
      },
      pause() {
        actionsRef.current?.pause();
      },
      close() {
        actionsRef.current?.pause();
        setTrack(null);
        setPlaying(false);
        setTime(0);
      },
    }),
    [track, playing],
  );

  const internals = React.useMemo<GlobalPlayerInternals>(
    () => ({ actionsRef, pendingRef, setPlaying, setTime, renderLink }),
    [renderLink],
  );

  return (
    <GlobalPlayerInternalsContext.Provider value={internals}>
      <GlobalPlayerContext.Provider value={value}>
        <GlobalPlayerTimeContext.Provider value={time}>
          {children}
        </GlobalPlayerTimeContext.Provider>
      </GlobalPlayerContext.Provider>
    </GlobalPlayerInternalsContext.Provider>
  );
}

/**
 * `useGlobalPlayer` — open, seek, play, pause and close the app's global
 * recording. Must be called inside `AudioPlayerProvider`.
 *
 * @example
 * const player = useGlobalPlayer();
 * player.open({ id: meeting.id, src: mintUrl, title: meeting.title, href: `/meetings/${meeting.id}` }, { at: 42 });
 */
export function useGlobalPlayer(): GlobalPlayerValue {
  const context = React.useContext(GlobalPlayerContext);
  if (!context)
    throw new Error("useGlobalPlayer must be used within AudioPlayerProvider.");
  return context;
}

/**
 * `useGlobalPlayerTime` — the global player's current position in seconds, in
 * its own context so only the components that follow time re-render on a tick.
 * Feed it to `Transcript`'s `currentTime`.
 *
 * @example
 * const time = useGlobalPlayerTime();
 */
export function useGlobalPlayerTime(): number {
  return React.useContext(GlobalPlayerTimeContext);
}

/** Props accepted by `GlobalAudioPlayer`. */
export interface GlobalAudioPlayerProps {
  /**
   * Classes for the floating pill.
   * @default undefined
   */
  className?: string;
  /**
   * Seconds moved by rewind and forward.
   * @default 10
   */
  skipSeconds?: number;
}

/**
 * `GlobalAudioPlayer` — the floating pill for the provider's recording. Render
 * it once, at the end of the main content column; it renders nothing while no
 * recording is open.
 *
 * It loads the player UI only once a recording is open, so an app shell that
 * imports it from `audio-player-global` ships no player code on routes that
 * never play one.
 *
 * While it is open it sets `--dock-inset-bottom` (its height plus 8px) on the
 * enclosing `AppShell` root (the document root outside one), so what else docks
 * at the bottom stacks above it: `ActionBar` floats 8px over the pill, and a
 * selecting `DataList` keeps its last row and Load more clear of both.
 *
 * @example
 * <GlobalAudioPlayer />
 */
export function GlobalAudioPlayer({
  className,
  skipSeconds = 10,
}: GlobalAudioPlayerProps) {
  const internals = React.useContext(GlobalPlayerInternalsContext);
  const player = React.useContext(GlobalPlayerContext);
  if (!internals || !player)
    throw new Error(
      "GlobalAudioPlayer must be used within AudioPlayerProvider.",
    );
  const { track, close } = player;
  const { actionsRef, pendingRef, setPlaying, setTime, renderLink } = internals;

  // The pill's root, once the lazily loaded player has mounted it.
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null);

  // Tell the other bottom-docked surfaces how much room the pill takes.
  React.useLayoutEffect(() => {
    const element = root;
    if (!track || !element) return;
    const host =
      element.closest<HTMLElement>('[data-slot="app-shell"]') ??
      document.documentElement;
    const measure = () =>
      host.style.setProperty(
        "--dock-inset-bottom",
        `${element.offsetHeight + 8}px`,
      );
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      host.style.removeProperty("--dock-inset-bottom");
    };
  }, [track, root]);

  // A newly opened recording starts where `open` asked, once the player has mounted.
  React.useEffect(() => {
    if (!track || !root) return;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!pending || !actionsRef.current) return;
    if (pending.at !== undefined)
      actionsRef.current.seek(pending.at, { play: pending.play });
    else if (pending.play) actionsRef.current.play();
  }, [track, root, actionsRef, pendingRef]);

  if (!track) return null;
  const title = track.title
    ? track.href
      ? renderLink({
          href: track.href,
          className: "rounded-sm underline-offset-4 hover:underline",
          children: track.title,
        })
      : track.title
    : undefined;

  return (
    <React.Suspense fallback={null}>
      <LazyAudioPlayer
        key={track.id}
        ref={setRoot}
        variant="floating"
        src={track.src}
        label={track.label ?? track.title ?? "Recording"}
        title={title}
        skipSeconds={skipSeconds}
        onSourceExpired={track.onSourceExpired}
        actionsRef={actionsRef}
        onPlayStateChange={setPlaying}
        onTimeChange={(seconds) => setTime(seconds)}
        open
        onOpenChange={(next) => {
          if (!next) close();
        }}
        className={className}
      />
    </React.Suspense>
  );
}
