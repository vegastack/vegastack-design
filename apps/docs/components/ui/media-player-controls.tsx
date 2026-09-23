// @vegastack media-player-controls@0.14.0 sha256-qxX2kGlZC7i81Hn0dBflKZGmJBZyb3umVuhd303/CkU=

"use client";

import * as React from "react";
import {
  AudioLines,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { TIMINGS, cn, mergeRefs } from "@vegastack/design";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

/* ------------------------------------------------------------------------------------------------
 * Media Slider looks
 *
 * Batch 3 of the shadcn reset put `Slider` back on upstream's file, which has exactly ONE look: a
 * `muted` track, a `primary` indicator and an always-drawn thumb. The three looks the media
 * surfaces need used to be `variant`/`thumb` props on our fork (`media`, `overlay`, `bare`/`none`).
 * They are call-site class strings now — the player asks for its look, the component owns none of
 * it. Batch 7 rebuilds this component; these are what keep it looking right until then.
 * ----------------------------------------------------------------------------------------------*/

/**
 * The in-page player: a rail whose fill brightens on hover, focus and drag.
 *
 * It owns the INK only. The two track-thickness declarations that used to open this string were
 * silently dropped by `tailwind-merge` wherever it is combined with `GROWING_RAIL` — identical
 * modifier set, and `GROWING_RAIL` comes later in the `cn()` — so the "slightly thicker rail" the
 * old doc line promised was true for the volume rail and false for the seek rail it was written
 * about. Thickness is `GROWING_RAIL`'s job; Batch 7c of the shadcn reset removed the duplicate.
 */
const MEDIA_SLIDER =
  "[&_[data-slot=slider-range]]:bg-muted-foreground [&_[data-slot=slider-thumb]]:border-muted-foreground " +
  "[&_[data-slot=slider-thumb]]:bg-muted-foreground " +
  "hover:[&_[data-slot=slider-range]]:bg-foreground focus-within:[&_[data-slot=slider-range]]:bg-foreground " +
  "hover:[&_[data-slot=slider-thumb]]:border-foreground hover:[&_[data-slot=slider-thumb]]:bg-foreground " +
  "focus-within:[&_[data-slot=slider-thumb]]:border-foreground focus-within:[&_[data-slot=slider-thumb]]:bg-foreground";

/** The overlay player, drawn over video: media ink on a translucent rail. */
const OVERLAY_SLIDER =
  "[&_[data-slot=slider-track]]:bg-media-foreground/60 [&_[data-slot=slider-range]]:bg-media-foreground " +
  "[&_[data-slot=slider-thumb]]:border-media-foreground [&_[data-slot=slider-thumb]]:bg-media-foreground";

/* The seek rail grows under the pointer and on focus, so the target is thin at rest and easy to
 * hit while it is being used. `transition-[height,width]` covers both orientations. */
const GROWING_RAIL =
  "[&_[data-slot=slider-track]]:transition-[height,width] " +
  "[&_[data-slot=slider-track]]:data-horizontal:h-1 [&_[data-slot=slider-track]]:data-vertical:w-1 " +
  "hover:[&_[data-slot=slider-track]]:data-horizontal:h-1.5 hover:[&_[data-slot=slider-track]]:data-vertical:w-1.5 " +
  "focus-within:[&_[data-slot=slider-track]]:data-horizontal:h-1.5 focus-within:[&_[data-slot=slider-track]]:data-vertical:w-1.5";

/* The seek thumb is hidden at rest on hover-capable devices and shown on hover, focus or drag — it
 * stays VISIBLE on touch, where there is no hover to reveal it with and a hidden thumb means no
 * scrub affordance at all (audit B4-04). Tailwind's own `hover:` variant is wrapped in
 * `@media (hover: hover)`, so the hide has to name the same query or the two would disagree. */
const HOVER_THUMB =
  "[&_[data-slot=slider-thumb]]:transition-opacity " +
  "[@media(hover:hover)]:[&_[data-slot=slider-thumb]]:opacity-0 " +
  "hover:[&_[data-slot=slider-thumb]]:opacity-100 focus-within:[&_[data-slot=slider-thumb]]:opacity-100 " +
  "[&_[data-slot=slider-thumb][data-dragging]]:opacity-100";

/* The waveform layer is a transparent hit target over custom-drawn bars: the bars ARE the position
 * cue, so nothing of the slider is painted, and the thumb stays focusable so arrow/Home/End seek. */
const BARE_SLIDER =
  "[&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-range]]:bg-transparent " +
  "[&_[data-slot=slider-thumb]]:border-transparent [&_[data-slot=slider-thumb]]:bg-transparent";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * MediaPlayerControls — the shared transport surface for AudioPlayer and VideoPlayer (audit B4-02,
 * 2026-09-07). It used to live inside `audio-player.tsx` (1,431 lines) and be imported from there
 * by `video-player.tsx`, with `getMediaDuration`/`clampTime` duplicated in both files
 * and the keyboard shortcuts implemented TWICE. This module is now the single home for all three:
 * the controls, the media helpers, and `useMediaShortcuts` — one shortcut map, two scopes.
 * ----------------------------------------------------------------------------------------------*/

const DEFAULT_PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
const DEFAULT_SKIP_SECONDS = 15;
const MEDIA_ACTION_ICON_CLASS = "[&_svg:not([class*='size-'])]:size-5";
// One icon step up (`size-5` 20px → `size-6` 24px) for the
// play/pause glyph on the narrow, two-line audio layout only, so the primary
// control reads larger than the flanking skip buttons on a phone.
const MEDIA_PLAY_ICON_LG_CLASS = "[&_svg:not([class*='size-'])]:size-6";
// Media settings submenu: half a step more lead padding than upstream's `ps-1.5`, so the option
// label clears the submenu's own edge. Shared by the audio card and the video overlay so both
// settings menus read identically.
//
// It used to carry three more declarations — `pe-8` and two on the indicator span (`start-auto`,
// `end-2`) — under a comment claiming "default radio items lead with the dot". Read against
// `dropdown-menu.tsx`, upstream's own radio item is already `pe-8` with its indicator `absolute
// end-2`, so the dot already trails and all three were restating upstream to itself. Batch 7c of
// the shadcn reset dropped them.
const MEDIA_SUBMENU_RADIO_ITEM_CLASS =
  "[&_[data-slot=dropdown-menu-radio-item]]:ps-2";

/**
 * The theme-invariant media chrome (audit B4-01, D16). The overlay used to be built on
 * `primary`/`primary-foreground`, which FLIP with the theme: in dark the scrim measured oklab 0.92
 * (near-white) with near-black icons. `--media-scrim` / `--media-scrim-strong` / `--media-foreground`
 * are authored once and never overridden per theme, so chrome over video always reads dark-scrim +
 * light-ink.
 *
 * The buttons are plain `Button variant="ghost" size="icon-*"` in a `rounded-full` (D16 — there is
 * no `glass` variant). Their REST ink is inherited: upstream's `ghost` sets no colour of its own, so
 * it picks up the container's `text-media-foreground`. Their HOVER and PRESSED steps have to be
 * named here, because upstream's `ghost` hovers to `bg-muted`/`text-foreground` — theme tokens that
 * flip with the page and put near-black ink on a light wash over a video in light theme, which is
 * exactly the D16 / B4-01 defect `--media-*` exists to prevent.
 *
 * Batch 7c of the shadcn reset replaced three declarations here — `[--btn-tint]`,
 * `[--btn-soft-hover]` and `[--btn-soft-active]` — with the classes below. Those were the
 * pre-reset Button's tone vars; since Batch 2 put `button.tsx` back on upstream, `button.tsx` reads
 * no custom property at all, so all three resolved to nothing and every overlay control had been
 * hovering to page ink over video ever since.
 */
const MEDIA_OVERLAY_CHROME_CLASS = cn(
  "text-media-foreground",
  "[&_button]:hover:bg-media-foreground/10 [&_button]:hover:text-media-foreground",
  "[&_button]:active:bg-media-foreground/15 [&_button]:active:text-media-foreground",
  "[&_button]:aria-expanded:bg-media-foreground/15 [&_button]:aria-expanded:text-media-foreground",
);

/**
 * The video frame is `overflow-hidden`, so the centralized 2px `:focus-visible` outline would be
 * clipped along the frame edge. `design.md` § Accessibility permits exactly one component-local
 * deviation for that case — the OFFSET, pulled inside — and nothing else. This replaces the
 * `ring-2 ring-ring/50` box-shadow "glow" the players used to invent (audit B4-03, D17), which was
 * a second focus grammar and needed its own forced-colours carve-out to stay legal.
 */
const MEDIA_INSET_FOCUS_CLASS =
  "focus-visible:-outline-offset-2 [&_*:focus-visible]:-outline-offset-2";

/** Duration in seconds, or `0` while the media element has not reported a finite one. */
export function getMediaDuration(media: HTMLMediaElement | null): number {
  if (!media || !Number.isFinite(media.duration)) return 0;
  return media.duration;
}

/** Clamp a seek target into `[0, duration]` (or `[0, ∞)` before the duration is known). */
export function clampTime(media: HTMLMediaElement, value: number): number {
  const duration = getMediaDuration(media);
  const upper = duration > 0 ? duration : Number.MAX_SAFE_INTEGER;
  return Math.min(Math.max(value, 0), upper);
}

export function formatDefaultTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatPlaybackRate(value: number): string {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/0$/, "")}x`;
}

function parsePlaybackRate(value: string): number {
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

/**
 * Where a key press arrived, which decides how much of the map applies.
 *
 * - `surface` — the player frame or the document while the frame owns keyboard attention. Nothing
 *   else claims Space or the arrows there, so the full map applies.
 * - `controls` — inside the controls group, where a focused button already owns Space/Enter and a
 *   focused seek slider already owns the arrows. Only the letter shortcuts apply, so a shortcut can
 *   never steal a key from the control the user is actually on.
 */
export type MediaShortcutScope = "surface" | "controls";

/** Options for `useMediaShortcuts`. */
export interface UseMediaShortcutsOptions {
  /** The `<audio>`/`<video>` element the shortcuts operate. */
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  /** Seconds moved by J/L and the arrow keys. @default 15 */
  skipSeconds?: number;
  /** Fullscreen toggle for F. When omitted, F is not handled. @default undefined */
  onFullscreenToggle?: () => void;
  /** Called after a play/pause attempt that could not start playback. @default undefined */
  onPlayStateChange?: (playing: boolean) => void;
  /** Called after a shortcut changed the current time. @default undefined */
  onTimeChange?: (currentTime: number, duration: number) => void;
}

/** The transport actions plus the single key map, shared by every media surface. */
export interface UseMediaShortcutsResult {
  togglePlayback: () => void;
  skipBy: (offset: number) => void;
  toggleMuted: () => void;
  /** Run the shortcut bound to `key` in `scope`; returns whether one was handled. */
  runShortcut: (key: string, scope: MediaShortcutScope) => boolean;
}

/**
 * `useMediaShortcuts` — THE media keyboard map (audit B4-02). Space/K play, J/L skip, ←/→ skip,
 * M mute, F fullscreen. It used to exist twice — once inside the controls and once in the video
 * frame plus a document-level listener — which is how the two drifted apart (the controls copy
 * never handled F).
 *
 * @example
 * const media = useMediaShortcuts({ mediaRef, skipSeconds: 15, onFullscreenToggle });
 * onKeyDown={(event) => { if (media.runShortcut(event.key, "surface")) event.preventDefault(); }}
 */
export function useMediaShortcuts({
  mediaRef,
  skipSeconds = DEFAULT_SKIP_SECONDS,
  onFullscreenToggle,
  onPlayStateChange,
  onTimeChange,
}: UseMediaShortcutsOptions): UseMediaShortcutsResult {
  const togglePlayback = React.useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (media.paused) {
      void media.play().catch(() => onPlayStateChange?.(false));
      return;
    }

    media.pause();
  }, [mediaRef, onPlayStateChange]);

  const skipBy = React.useCallback(
    (offset: number) => {
      const media = mediaRef.current;
      if (!media) return;
      media.currentTime = clampTime(media, media.currentTime + offset);
      onTimeChange?.(media.currentTime, getMediaDuration(media));
    },
    [mediaRef, onTimeChange],
  );

  const toggleMuted = React.useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
  }, [mediaRef]);

  const runShortcut = React.useCallback(
    (key: string, scope: MediaShortcutScope) => {
      // Space and the arrows belong to whatever control has focus inside the
      // controls group; only the surface scope may claim them.
      if (scope === "surface") {
        if (key === " ") {
          togglePlayback();
          return true;
        }
        if (key === "ArrowLeft") {
          skipBy(-skipSeconds);
          return true;
        }
        if (key === "ArrowRight") {
          skipBy(skipSeconds);
          return true;
        }
      }

      switch (key.toLowerCase()) {
        case "k":
          togglePlayback();
          return true;
        case "j":
          skipBy(-skipSeconds);
          return true;
        case "l":
          skipBy(skipSeconds);
          return true;
        case "m":
          toggleMuted();
          return true;
        case "f":
          if (!onFullscreenToggle) return false;
          onFullscreenToggle();
          return true;
        default:
          return false;
      }
    },
    [onFullscreenToggle, skipBy, skipSeconds, toggleMuted, togglePlayback],
  );

  return { togglePlayback, skipBy, toggleMuted, runShortcut };
}

/**
 * **Fullscreen and portals (OVL-14).** A portal to `<body>` is invisible in fullscreen: the element
 * passed to `requestFullscreen()` is the video FRAME, and the browser paints that subtree only. The
 * volume panel is inline for exactly this reason and never had the problem.
 *
 * The tooltips and the settings menu did: both open a Base UI portal, and upstream's
 * `TooltipContent`/`DropdownMenuContent` forwarded no `container`, so a fullscreen player showed no
 * control labels and no settings menu. Decision **OVL-14** (MK, 2026-09-18) adds that one
 * pass-through to both upstream files; this context carries the element to every control in the
 * transport, so nothing has to be threaded through eleven call sites.
 *
 * The container is `document.fullscreenElement` and only while it CONTAINS this transport — a page
 * that fullscreens something else must not capture these portals. Everywhere else the value is
 * `undefined`, which is upstream's default. `undefined` and not `null`: Base UI reads an explicit
 * `null` as "the container has not resolved yet" and renders no portal at all, so a `null` here
 * would swallow the very chrome this decision restores.
 */
const MediaPortalContainerContext = React.createContext<
  HTMLElement | undefined
>(undefined);

/**
 * Track the fullscreen element that owns `rootRef`, or `undefined`. `fullscreenchange` is the only
 * source: a consumer's `isFullscreen` prop describes THEIR state machine, and this needs the
 * browser's.
 */
function useFullscreenPortalContainer(
  rootRef: React.RefObject<HTMLElement | null>,
) {
  const [container, setContainer] = React.useState<HTMLElement | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const sync = () => {
      const active = document.fullscreenElement;
      const root = rootRef.current;
      setContainer(
        active instanceof HTMLElement && root !== null && active.contains(root)
          ? active
          : undefined,
      );
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [rootRef]);

  return container;
}

function MediaControlTooltip({
  children,
  content,
}: {
  children: React.ReactElement;
  content: React.ReactNode;
}) {
  const container = React.useContext(MediaPortalContainerContext);

  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent container={container}>{content}</TooltipContent>
    </Tooltip>
  );
}

function MediaProgressSlider({
  value,
  max,
  disabled,
  label,
  onValueChange,
  variant,
}: {
  value: number;
  max: number;
  disabled: boolean;
  label: string;
  onValueChange: (value: number | readonly number[]) => void;
  variant: "default" | "overlay";
}) {
  return (
    <div data-slot="media-player-progress" data-variant={variant}>
      <Slider
        // The seek thumb is hidden at rest on hover-capable devices and shown on
        // hover/focus/drag — but it stays VISIBLE on touch, where there is no
        // hover to reveal it with and a hidden thumb means no scrub affordance
        // at all (audit B4-04). `Slider` owns that rule; the player just asks.
        className={cn(
          variant === "overlay" ? OVERLAY_SLIDER : MEDIA_SLIDER,
          GROWING_RAIL,
          HOVER_THUMB,
        )}
        /*
         * `[value]`, not `value`: upstream's Slider counts thumbs from the ARRAY form
         * (`Array.isArray(value) ? value : … : [min, max]`), so a scalar falls through to the
         * two-element fallback and renders TWO thumbs. Batch 3 of the shadcn reset.
         */
        value={[value]}
        min={0}
        max={max}
        step={1}
        disabled={disabled}
        aria-label={`${label} seek`}
        onValueChange={onValueChange}
      />
    </div>
  );
}

function MediaWaveformSeek({
  value,
  max,
  disabled,
  label,
  peaks,
  flatPeaks,
  onValueChange,
}: {
  value: number;
  max: number;
  disabled: boolean;
  label: string;
  peaks: readonly number[];
  flatPeaks: readonly number[];
  onValueChange: (value: number | readonly number[]) => void;
}) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const bars = peaks.length > 0 ? peaks : flatPeaks;
  // Both layers render the identical bar set so they overlay pixel-for-pixel; the
  // colour class is all that differs. `data-slot` is carried by the base layer
  // only so it stays the single queryable bars node.
  const renderBars = (colorClass: string, slot?: string) => (
    <div
      aria-hidden="true"
      data-slot={slot}
      className="absolute inset-0 flex items-center gap-px"
    >
      {bars.map((peak, index) => (
        <span
          key={index}
          className={cn(
            "h-[var(--wave-peak)] min-w-0 flex-1 rounded-full",
            colorClass,
          )}
          style={
            {
              "--wave-peak": `${Math.round(Math.max(peak, 0.06) * 100)}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
  return (
    <div
      data-slot="media-player-waveform"
      className="relative h-12 w-full min-w-0 hover:[&_[data-slot=media-player-waveform-played]_span]:bg-foreground focus-within:[&_[data-slot=media-player-waveform-played]_span]:bg-foreground has-[[data-slot=slider-thumb][data-dragging]]:[&_[data-slot=media-player-waveform-played]_span]:bg-foreground"
    >
      {/*
        Bars are decoration only (`aria-hidden`); the transparent Slider on top
        owns all keyboard/pointer/seek semantics and the hidden range input. No
        visible scrubber — the fill IS the position cue, which is exactly what
        `BARE_SLIDER` above describes: a transparent rail and no painted thumb,
        still focusable so arrow/Home/End seeking works.

        Two aligned layers make the progress edge smooth: a muted base under a
        `muted-foreground` played copy clipped to the exact played ratio. The clip
        boundary moves continuously (sub-bar), so the fill glides instead of
        flipping a whole bar at a time.
      */}
      {renderBars("bg-muted", "media-player-waveform-bars")}
      <div
        data-slot="media-player-waveform-played"
        className="absolute inset-0 [clip-path:inset(0_calc(100%_-_var(--played))_0_0)]"
        style={{ "--played": `${ratio * 100}%` } as React.CSSProperties}
      >
        {renderBars("bg-muted-foreground")}
      </div>
      <Slider
        /*
         * `[value]`, not `value`: upstream's Slider counts thumbs from the ARRAY form
         * (`Array.isArray(value) ? value : … : [min, max]`), so a scalar falls through to the
         * two-element fallback and renders TWO thumbs. Batch 3 of the shadcn reset.
         */
        value={[value]}
        min={0}
        max={max}
        step={1}
        disabled={disabled}
        aria-label={`${label} seek`}
        onValueChange={onValueChange}
        className={cn("absolute inset-0", BARE_SLIDER)}
      />
    </div>
  );
}

/** Props accepted by `MediaPlayerControls`. */
export interface MediaPlayerControlsProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * Ref for the underlying `<audio>` or `<video>` element that these controls operate.
   */
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  /**
   * Accessible label prefix used for transport controls and the seek slider.
   * @default 'Media'
   */
  label?: string;
  /**
   * Seconds moved by the rewind and forward actions.
   * @default 15
   */
  skipSeconds?: number;
  /**
   * Playback rates cycled by the rate control.
   * @default [0.75, 1, 1.25, 1.5, 2]
   */
  playbackRates?: readonly number[];
  /**
   * Initial playback rate applied when the media element mounts.
   * @default 1
   */
  defaultPlaybackRate?: number;
  /**
   * Selectable video quality labels shown in the settings menu.
   * @default undefined
   */
  qualityOptions?: readonly string[];
  /**
   * Initial quality label selected in the settings menu.
   * @default undefined
   */
  defaultQuality?: string;
  /**
   * Format elapsed and duration labels.
   * @default mm:ss / h:mm:ss
   */
  formatTime?: (seconds: number) => string;
  /**
   * Called whenever playback starts or pauses.
   * @default undefined
   */
  onPlayStateChange?: (playing: boolean) => void;
  /**
   * Called whenever the current playback time changes.
   * @default undefined
   */
  onTimeChange?: (currentTime: number, duration: number) => void;
  /**
   * Called whenever the playback rate changes.
   * @default undefined
   */
  onPlaybackRateChange?: (playbackRate: number) => void;
  /**
   * Called whenever the selected quality label changes.
   * @default undefined
   */
  onQualityChange?: (quality: string) => void;
  /**
   * Called when the narrow-layout transcript control is pressed. When omitted,
   * the transcript control is not rendered. Audio (`default` variant) only; the
   * button appears only on a narrow, mobile-width player.
   * @default undefined
   */
  onTranscriptClick?: () => void;
  /**
   * Whether the associated media frame currently owns document fullscreen.
   * Updates the fullscreen control's icon and accessible name.
   * @default false
   */
  isFullscreen?: boolean;
  /**
   * Called when the fullscreen control is pressed. When omitted, the
   * fullscreen control is not rendered.
   * @default undefined
   */
  onFullscreenToggle?: () => void;
  /**
   * Visual treatment for the controls surface. `overlay` is tuned for video
   * controls placed over media: theme-invariant `--media-*` chrome on a scrim.
   * @default 'default'
   */
  variant?: "default" | "overlay";
  /**
   * Seek control rendering. `waveform` swaps the seek slider for a decoded-audio
   * waveform (amplitude bars supplied via `waveformPeaks`); the slider keeps all
   * keyboard and pointer seek semantics beneath the bars.
   * @default 'slider'
   */
  seekVariant?: "slider" | "waveform";
  /**
   * Normalized (0–1) waveform peak amplitudes rendered by the `waveform` seek
   * variant. Ignored unless `seekVariant` is `waveform`.
   * @default undefined
   */
  waveformPeaks?: readonly number[];
  /**
   * Flat placeholder amplitudes drawn while `waveformPeaks` is still empty (the
   * decode is in flight, or it failed). Ignored unless `seekVariant` is
   * `waveform`.
   * @default undefined
   */
  waveformFlatPeaks?: readonly number[];
}

/**
 * `MediaPlayerControls` — shared VegaStack transport controls for audio and
 * video media: play/pause, seek, elapsed/duration labels, mute + volume,
 * keyboard shortcuts for skip, and playback-rate cycling. Audio (`default`
 * variant) is a single line on a wide player and reflows to two lines on a
 * narrow, mobile-width player.
 *
 * Install it directly when you are building a player around your own media
 * element; `AudioPlayer` and `VideoPlayer` both compose it.
 *
 * @example
 * const mediaRef = React.useRef<HTMLMediaElement>(null);
 * <audio ref={mediaRef} src="/demo.mp3" />
 * <MediaPlayerControls mediaRef={mediaRef} label="Demo audio" />
 */
export function MediaPlayerControls({
  className,
  mediaRef,
  label = "Media",
  skipSeconds = DEFAULT_SKIP_SECONDS,
  playbackRates = DEFAULT_PLAYBACK_RATES,
  defaultPlaybackRate = 1,
  qualityOptions,
  defaultQuality,
  formatTime = formatDefaultTime,
  onPlayStateChange,
  onTimeChange,
  onPlaybackRateChange,
  onQualityChange,
  onTranscriptClick,
  isFullscreen = false,
  onFullscreenToggle,
  variant = "default",
  seekVariant = "slider",
  waveformPeaks,
  waveformFlatPeaks,
  onKeyDown,
  ref,
  ...props
}: MediaPlayerControlsProps) {
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [volumeOpen, setVolumeOpen] = React.useState(false);
  const volumeCloseTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(defaultPlaybackRate);
  const [quality, setQuality] = React.useState(defaultQuality ?? "");

  /**
   * The consumer's callbacks, held in a ref so their identity never reaches an effect's dep array.
   * An inline `onTimeChange` gets a new identity on every render, `timeupdate` re-renders ~4×/s,
   * and the media-element effect below would then tear down and re-run several times a second —
   * re-applying `defaultPlaybackRate` each time, so a viewer's chosen speed snapped back to 1×
   * while the media played.
   */
  const callbacksRef = React.useRef({
    onTimeChange,
    onPlayStateChange,
    onPlaybackRateChange,
  });
  React.useLayoutEffect(() => {
    callbacksRef.current = {
      onTimeChange,
      onPlayStateChange,
      onPlaybackRateChange,
    };
  });

  const syncFromMedia = React.useCallback(() => {
    const media = mediaRef.current;
    const nextTime = media?.currentTime ?? 0;
    const nextDuration = getMediaDuration(media);
    setCurrentTime(nextTime);
    setDuration(nextDuration);
    callbacksRef.current.onTimeChange?.(nextTime, nextDuration);
  }, [mediaRef]);

  const syncPlaying = React.useCallback((nextPlaying: boolean) => {
    setPlaying(nextPlaying);
    callbacksRef.current.onPlayStateChange?.(nextPlaying);
  }, []);

  React.useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    syncFromMedia();
    syncPlaying(!media.paused);
    setMuted(media.muted);
    setVolume(media.volume);

    const handleTimeUpdate = () => syncFromMedia();
    const handleLoadedMetadata = () => syncFromMedia();
    const handleDurationChange = () => syncFromMedia();
    const handlePlay = () => syncPlaying(true);
    const handlePause = () => syncPlaying(false);
    const handleEnded = () => syncPlaying(false);
    const handleVolumeChange = () => {
      setMuted(media.muted);
      setVolume(media.volume);
    };
    const handleRateChange = () => {
      setPlaybackRate(media.playbackRate);
      callbacksRef.current.onPlaybackRateChange?.(media.playbackRate);
    };

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("loadedmetadata", handleLoadedMetadata);
    media.addEventListener("durationchange", handleDurationChange);
    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);
    media.addEventListener("ended", handleEnded);
    media.addEventListener("volumechange", handleVolumeChange);
    media.addEventListener("ratechange", handleRateChange);

    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("loadedmetadata", handleLoadedMetadata);
      media.removeEventListener("durationchange", handleDurationChange);
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
      media.removeEventListener("ended", handleEnded);
      media.removeEventListener("volumechange", handleVolumeChange);
      media.removeEventListener("ratechange", handleRateChange);
    };
  }, [mediaRef, syncFromMedia, syncPlaying]);

  // Applying the default rate is a SEPARATE effect keyed on the default itself, so it runs on
  // mount and when the prop genuinely changes — never as a side effect of a listener rebind.
  React.useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.playbackRate = defaultPlaybackRate;
    setPlaybackRate(media.playbackRate);
  }, [defaultPlaybackRate, mediaRef]);

  // ONE shortcut map — the same hook the video frame and its document listener
  // use, so a key can never mean two things depending on where focus sits.
  const shortcuts = useMediaShortcuts({
    mediaRef,
    skipSeconds,
    onFullscreenToggle,
    onPlayStateChange: syncPlaying,
    onTimeChange: () => syncFromMedia(),
  });
  const { togglePlayback, skipBy, toggleMuted } = shortcuts;

  const seekTo = React.useCallback(
    (value: number | readonly number[]) => {
      const media = mediaRef.current;
      if (!media) return;
      const next = Array.isArray(value) ? value[0] : value;
      media.currentTime = clampTime(media, next);
      syncFromMedia();
    },
    [mediaRef, syncFromMedia],
  );

  const setPlaybackRateValue = React.useCallback(
    (value: string) => {
      const media = mediaRef.current;
      if (!media) return;

      const nextRate = parsePlaybackRate(value);
      media.playbackRate = nextRate;
      setPlaybackRate(nextRate);
      onPlaybackRateChange?.(nextRate);
    },
    [mediaRef, onPlaybackRateChange],
  );

  // Tappable speed control (audio): advance to the next rate in `playbackRates`
  // order, wrapping past the end. If the current rate is not in the list (idx
  // -1), start at the first entry.
  const cyclePlaybackRate = React.useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    const list =
      playbackRates.length > 0 ? playbackRates : DEFAULT_PLAYBACK_RATES;
    const idx = list.findIndex(
      (rate) => Math.abs(rate - media.playbackRate) < 1e-6,
    );
    const nextRate = list[(idx + 1) % list.length] ?? list[0] ?? 1;
    media.playbackRate = nextRate;
    setPlaybackRate(nextRate);
    onPlaybackRateChange?.(nextRate);
  }, [mediaRef, playbackRates, onPlaybackRateChange]);

  const setQualityValue = React.useCallback(
    (value: string) => {
      setQuality(value);
      onQualityChange?.(value);
    },
    [onQualityChange],
  );

  const setVolumeValue = React.useCallback(
    (value: number | readonly number[]) => {
      const media = mediaRef.current;
      if (!media) return;
      const next = Array.isArray(value) ? value[0] : value;
      const normalized = Math.min(Math.max(next / 100, 0), 1);
      media.volume = normalized;
      media.muted = normalized === 0;
      setVolume(normalized);
      setMuted(media.muted);
    },
    [mediaRef],
  );

  const clearVolumeCloseTimer = React.useCallback(() => {
    if (!volumeCloseTimerRef.current) return;
    clearTimeout(volumeCloseTimerRef.current);
    volumeCloseTimerRef.current = null;
  }, []);

  const openVolumeControl = React.useCallback(() => {
    clearVolumeCloseTimer();
    setVolumeOpen(true);
  }, [clearVolumeCloseTimer]);

  const scheduleVolumeControlClose = React.useCallback(() => {
    clearVolumeCloseTimer();
    volumeCloseTimerRef.current = setTimeout(() => {
      setVolumeOpen(false);
      volumeCloseTimerRef.current = null;
    }, TIMINGS.hoverCloseDelayMs);
  }, [clearVolumeCloseTimer]);

  React.useEffect(() => () => clearVolumeCloseTimer(), [clearVolumeCloseTimer]);

  /*
    Inside the controls group a focused button already owns Space/Enter and a
    focused seek slider already owns the arrows, so only the LETTER shortcuts
    run here (`scope: "controls"`). The group itself is not a tab stop — every
    control in it is focusable, so a stop on the wrapper only added an empty
    one (audit TD-4: keep `tabIndex` for genuinely scrollable regions, drop it
    everywhere else).
  */
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (shortcuts.runShortcut(event.key, "controls")) event.preventDefault();
    },
    [onKeyDown, shortcuts],
  );

  const seekMax = Math.max(duration, 1);
  const canSeek = duration > 0;
  const displayedDuration = duration > 0 ? duration : 0;
  const rates =
    playbackRates.length > 0 ? playbackRates : DEFAULT_PLAYBACK_RATES;
  const qualities = qualityOptions?.length ? qualityOptions : [];
  const selectedQuality = quality || defaultQuality || qualities[0] || "";
  const isOverlay = variant === "overlay";

  /*
    OVL-14: the transport's own root, so `useFullscreenPortalContainer` can ask whether the
    element the browser is painting fullscreen actually contains these controls. `ref` is the
    consumer's; both land on the same node.
  */
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = React.useMemo(() => mergeRefs(ref, rootRef), [ref]);
  const portalContainer = useFullscreenPortalContainer(rootRef);

  const settingsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`${label} settings`}
            size="icon"
            variant="ghost"
            className={cn("rounded-full", MEDIA_ACTION_ICON_CLASS)}
          >
            <Settings />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="min-w-52"
        container={portalContainer}
      >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="min-w-0 flex-1 truncate">Playback speed</span>
            <span className="font-mono text-xs text-muted-foreground">
              {playbackRate === 1 ? "Normal" : formatPlaybackRate(playbackRate)}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className={cn("min-w-40", MEDIA_SUBMENU_RADIO_ITEM_CLASS)}
            container={portalContainer}
          >
            <DropdownMenuRadioGroup
              value={String(playbackRate)}
              onValueChange={setPlaybackRateValue}
            >
              <DropdownMenuLabel>Playback speed</DropdownMenuLabel>
              {rates.map((rate) => (
                <DropdownMenuRadioItem key={rate} value={String(rate)}>
                  {rate === 1 ? "Normal" : formatPlaybackRate(rate)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {qualities.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="min-w-0 flex-1 truncate">Quality</span>
              <span className="font-mono text-xs text-muted-foreground">
                {selectedQuality}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              className={cn("min-w-40", MEDIA_SUBMENU_RADIO_ITEM_CLASS)}
              container={portalContainer}
            >
              <DropdownMenuRadioGroup
                value={selectedQuality}
                onValueChange={setQualityValue}
              >
                <DropdownMenuLabel>Quality</DropdownMenuLabel>
                {qualities.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const seekControl =
    seekVariant === "waveform" ? (
      <MediaWaveformSeek
        value={Math.min(currentTime, seekMax)}
        max={seekMax}
        disabled={!canSeek}
        label={label}
        peaks={waveformPeaks ?? []}
        flatPeaks={waveformFlatPeaks ?? []}
        onValueChange={seekTo}
      />
    ) : (
      <MediaProgressSlider
        value={Math.min(currentTime, seekMax)}
        max={seekMax}
        disabled={!canSeek}
        label={label}
        onValueChange={seekTo}
        variant={variant}
      />
    );

  const timeReadout = (
    <span
      data-slot="media-player-time"
      className={cn(
        "shrink-0 tabular-nums",
        isOverlay ? "text-base" : "text-xs",
      )}
    >
      {formatTime(currentTime)} / {formatTime(displayedDuration)}
    </span>
  );

  // `iconClass` overrides the glyph size — the narrow audio layout passes the
  // larger step; the shared wide/overlay play button keeps the standard action size.
  const renderPlayButton = (iconClass: string = MEDIA_ACTION_ICON_CLASS) => (
    <MediaControlTooltip
      content={playing ? "Pause (Space or K)" : "Play (Space or K)"}
    >
      <Button
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        aria-pressed={playing}
        size="icon"
        variant="ghost"
        onClick={togglePlayback}
        className={cn("rounded-full", iconClass)}
      >
        {playing ? (
          <Pause className="fill-current" />
        ) : (
          <Play className="fill-current" />
        )}
      </Button>
    </MediaControlTooltip>
  );
  const playButton = renderPlayButton();
  const playButtonCompact = renderPlayButton(MEDIA_PLAY_ICON_LG_CLASS);

  // Visible rewind/forward transport — audio (default variant) only. Video keeps
  // skip on the keyboard (J/L/←/→); its overlay chrome stays uncluttered. On a
  // wide player they sit inline after play; on a narrow player they flank the
  // centred play/pause on the second line. Skip stays on the keyboard either way.
  const rewindButton = (
    <MediaControlTooltip content={`Rewind ${skipSeconds}s (J)`}>
      <Button
        aria-label={`Rewind ${skipSeconds} seconds`}
        size="icon"
        variant="ghost"
        onClick={() => skipBy(-skipSeconds)}
        className={cn("rounded-full", MEDIA_ACTION_ICON_CLASS)}
      >
        <RotateCcw />
      </Button>
    </MediaControlTooltip>
  );

  const forwardButton = (
    <MediaControlTooltip content={`Forward ${skipSeconds}s (L)`}>
      <Button
        aria-label={`Forward ${skipSeconds} seconds`}
        size="icon"
        variant="ghost"
        onClick={() => skipBy(skipSeconds)}
        className={cn("rounded-full", MEDIA_ACTION_ICON_CLASS)}
      >
        <RotateCw />
      </Button>
    </MediaControlTooltip>
  );

  // Transcript — audio (default variant), narrow layout only. Opens whatever the
  // consumer wires to `onTranscriptClick`; rendered only when that handler is
  // supplied, mirroring the fullscreen control's conditional-on-handler pattern.
  const transcriptButton = onTranscriptClick ? (
    <MediaControlTooltip content="Transcript">
      <Button
        aria-label={`${label} transcript`}
        size="icon"
        variant="ghost"
        onClick={onTranscriptClick}
        className={cn("rounded-full", MEDIA_ACTION_ICON_CLASS)}
      >
        <AudioLines />
      </Button>
    </MediaControlTooltip>
  ) : null;

  // Tappable playback-speed control — audio (default variant) only. One setting,
  // so no menu: each tap advances to the next rate. Video keeps the settings
  // dropdown because it also owns quality. `sizeClass` is where the single-line
  // wide layout pins a fixed width (so the row never shifts as the label changes
  // between `1x` → `1.25x` → `1.5x`); the two-line narrow layout drops it and
  // lets the pill size to its label in its own grid cell.
  const renderSpeedButton = (sizeClass: string) => (
    <MediaControlTooltip content="Playback speed">
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Change playback speed (currently ${formatPlaybackRate(playbackRate)})`}
        onClick={cyclePlaybackRate}
        className={cn(
          "shrink-0 justify-center rounded-full font-mono text-xs tabular-nums",
          sizeClass,
        )}
      >
        {formatPlaybackRate(playbackRate)}
      </Button>
    </MediaControlTooltip>
  );
  const speedButton = renderSpeedButton("w-14 px-0");
  const speedButtonCompact = renderSpeedButton("");

  /*
    Mute + volume, now in BOTH variants and BOTH audio layouts (audit B4-04 —
    audio previously had no volume control at all and mute was keyboard-only).
    The panel is positioned inline rather than portaled on purpose: the video
    frame is the fullscreen element, and a portal to `<body>` would put the
    volume rail outside it and make it invisible in fullscreen.
  */
  const volumeControl = (
    <div
      data-slot="media-player-volume"
      className="relative flex"
      onPointerEnter={openVolumeControl}
      onPointerLeave={scheduleVolumeControlClose}
      onFocusCapture={openVolumeControl}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          scheduleVolumeControlClose();
        }
      }}
    >
      <MediaControlTooltip content={muted ? "Unmute (M)" : "Mute (M)"}>
        <Button
          aria-label={muted ? `Unmute ${label}` : `Mute ${label}`}
          aria-pressed={muted}
          size="icon"
          variant="ghost"
          onClick={toggleMuted}
          className={cn("rounded-full", MEDIA_ACTION_ICON_CLASS)}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
      </MediaControlTooltip>
      {volumeOpen ? (
        <div
          data-slot="media-player-volume-panel"
          className="absolute bottom-full start-1/2 z-10 flex -translate-x-1/2 rtl:translate-x-1/2 pb-2"
        >
          <div
            data-slot="media-player-volume-surface"
            data-variant={variant}
            className={cn(
              "flex items-center rounded-full",
              isOverlay
                ? "h-20 bg-media-scrim-strong px-1 py-1 text-media-foreground"
                : "h-28 border border-border bg-popover px-2 py-3 text-popover-foreground",
            )}
          >
            <Slider
              orientation="vertical"
              value={[Math.round(volume * 100)]}
              min={0}
              max={100}
              step={1}
              aria-label={`${label} volume`}
              onValueChange={setVolumeValue}
              className={cn(
                isOverlay ? OVERLAY_SLIDER : MEDIA_SLIDER,
                "w-6",
                // Upstream's vertical `Slider` floors its Control at `min-h-40` — 160px — which is
                // 48px taller than this pill in the card variant and 80px taller in the overlay,
                // and the pill does not clip. MEASURED, not inferred: before Batch 7c of the
                // shadcn reset the rail's box ran from 21178 to 21338 inside a pill that ended at
                // 21277, so the track hung out of the bottom of its own surface. The floor is
                // released here rather than patched into `slider.tsx`, which has no decision row
                // behind it; `!` is upstream's own vocabulary for exactly this (see `badge.tsx`'s
                // `[&>svg]:size-3!`), and it is needed because upstream's declaration carries the
                // same specificity. The height then comes from the pill, which is what sizes it.
                //
                // The root's own `h-20` / `h-[calc(…)]` went with this: upstream's root already
                // carries `data-vertical:h-full` at a higher specificity, so both were dead.
                "*:min-h-0!",
              )}
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  const fullscreenControl = onFullscreenToggle ? (
    <MediaControlTooltip
      content={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
    >
      <Button
        aria-label={`${isFullscreen ? "Exit fullscreen" : "Fullscreen"} ${label}`}
        aria-pressed={isFullscreen}
        size="icon"
        variant="ghost"
        onClick={onFullscreenToggle}
        className={cn("rounded-full", MEDIA_ACTION_ICON_CLASS)}
      >
        {isFullscreen ? <Minimize /> : <Maximize />}
      </Button>
    </MediaControlTooltip>
  ) : null;

  if (isOverlay) {
    return (
      <MediaPortalContainerContext.Provider value={portalContainer}>
        <div
          ref={mergedRef}
          data-slot="media-player-controls"
          data-state={playing ? "playing" : "paused"}
          data-variant={variant}
          role="group"
          aria-label={`${label} media controls`}
          onKeyDown={handleKeyDown}
          className={cn(
            "@container/media-controls w-full min-w-0 p-2",
            MEDIA_OVERLAY_CHROME_CLASS,
            MEDIA_INSET_FOCUS_CLASS,
            className,
          )}
          {...props}
        >
          <div
            data-slot="media-player-controls-layout"
            className="flex min-w-0 flex-col gap-2"
          >
            <div data-slot="media-player-seek" className="min-w-0 px-2">
              {seekControl}
            </div>

            <div
              data-slot="media-player-actions"
              className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                {playButton}
                {timeReadout}
              </div>

              <div aria-hidden="true" />

              <div className="flex justify-self-end">
                {volumeControl}
                {settingsMenu}
                {fullscreenControl}
              </div>
            </div>
          </div>
        </div>
      </MediaPortalContainerContext.Provider>
    );
  }

  return (
    <MediaPortalContainerContext.Provider value={portalContainer}>
      <div
        ref={mergedRef}
        data-slot="media-player-controls"
        data-state={playing ? "playing" : "paused"}
        data-variant={variant}
        role="group"
        aria-label={`${label} media controls`}
        onKeyDown={handleKeyDown}
        className={cn(
          "@container/media-controls w-full min-w-0 rounded-lg border p-2",
          // The transport reads one emphasis step below the page. Upstream's `ghost` button
          // sets no rest ink of its own, so naming the container's ink once makes every control
          // subdued at rest, and the variant's own `hover:text-foreground` brightens each one
          // under the pointer.
          "border-border bg-background text-muted-foreground",
          className,
        )}
        {...props}
      >
        {/*
      Audio transport has two layouts, switched by the `@sm` container width.
      Both are always in the DOM; the container query shows exactly one, so a
      screen reader (and the tab order) only ever sees the visible layout.

      WIDE (`@sm` and up) — a single line. Sequence, left to right:
      play/pause → rewind/forward → elapsed·duration → seek (the only flex-1
      child, so the bar absorbs the slack) → mute/volume → tappable speed.
      `px-2` + the row `gap-2` keep ≥16px between the seek track's ends and the
      flanking controls, so the seek thumb's 24px hit area at either extreme
      never falls under the speed button — the 320px effective-target contract
      probes exactly this.
    */}
        <div
          data-slot="media-player-actions"
          className="hidden w-full min-w-0 items-center gap-2 @sm/media-controls:flex"
        >
          {playButton}
          <div
            data-slot="media-player-skip-controls"
            className="flex shrink-0 items-center"
          >
            {rewindButton}
            {forwardButton}
          </div>
          {timeReadout}
          <div data-slot="media-player-seek" className="min-w-0 flex-1 px-2">
            {seekControl}
          </div>
          {volumeControl}
          {speedButton}
        </div>

        {/*
      NARROW (below `@sm`) — two lines, for a mobile-width player. Top line:
      elapsed · seek · duration, the seek flexing between the two edge-pinned
      readouts in a smaller font (`formatTime` still promotes to h:mm:ss past
      an hour). Bottom line: a symmetric `1fr auto 1fr` grid so play/pause sits
      dead-centre with rewind/forward flanking it, the transcript and volume
      controls pinned to the leading edge, and the tappable speed to the
      trailing edge.
    */}
        <div
          data-slot="media-player-actions-compact"
          className="flex w-full min-w-0 flex-col gap-1.5 @sm/media-controls:hidden"
        >
          <div
            data-slot="media-player-seek"
            className="flex min-w-0 items-center gap-2"
          >
            <span
              data-slot="media-player-time-elapsed"
              className="shrink-0 text-xs tabular-nums"
            >
              {formatTime(currentTime)}
            </span>
            {/*
          `px-1` insets the seek track from the flanking timers so the seek
          thumb at either extreme (it overhangs the track end by half its
          width) does not crowd the elapsed/duration labels.
        */}
            <div className="min-w-0 flex-1 px-1">{seekControl}</div>
            <span
              data-slot="media-player-time-duration"
              className="shrink-0 text-xs tabular-nums"
            >
              {formatTime(displayedDuration)}
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex items-center justify-self-start">
              {transcriptButton}
              {volumeControl}
            </div>
            <div
              data-slot="media-player-transport"
              className="flex items-center gap-1 justify-self-center"
            >
              {rewindButton}
              {playButtonCompact}
              {forwardButton}
            </div>
            <div className="flex justify-self-end">{speedButtonCompact}</div>
          </div>
        </div>
      </div>
    </MediaPortalContainerContext.Provider>
  );
}
