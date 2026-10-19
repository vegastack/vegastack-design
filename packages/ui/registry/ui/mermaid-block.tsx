// @vegastack mermaid-block@0.25.46 sha256-4cD2JpKbifwjQaEe28un09MTWEfs95CB7im7DqM6BCk=

"use client";

import * as React from "react";
import { Copy, Download } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { tokens as designTokens } from "@vegastack/design-tokens";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------------------------------------
 * MermaidBlock — a ```mermaid fence drawn as a diagram, in the browser, with `mermaid` loaded only
 * the first time a diagram nears the viewport. One renderer for every surface: `renderMermaid` is
 * the pure core (also usable on its own), `useMermaidSvg` the debounced hook, `MermaidBlock` the
 * figure, and `mermaidBlockView` the ready `blockViews` entry for `TextEdit` and `MarkdownView`.
 *
 * Security: every render pins the configuration below inside one promise-chain mutex (mermaid's
 * `initialize` is global, so two renders with different themes would otherwise race).
 * `securityLevel: "strict"` is one of mermaid's secure keys — a diagram's own `%%{init}%%` cannot
 * override it — and runs mermaid's DOMPurify pass over the SVG; labels are SVG text (no HTML
 * labels), so `click` stays disabled and the ELK layout engine is never downloaded. Nothing but
 * mermaid's own sanitised output is ever injected.
 * ----------------------------------------------------------------------------------------------*/

type MermaidApi = typeof import("mermaid").default;
type MermaidConfig = Parameters<MermaidApi["initialize"]>[0];

/** The colour scheme a diagram is drawn in. */
export type MermaidTheme = "light" | "dark";

/** What went wrong drawing a diagram: the source line when the parser names one. */
export interface MermaidRenderError {
  /** The 1-based source line the parser stopped at, when it names one. */
  line?: number;
  /** A short, plain sentence: "Expected '-->'." */
  message: string;
}

/** `renderMermaid`'s answer: the sanitised SVG, or why there is none. */
export type MermaidRenderResult =
  { svg: string } | { error: MermaidRenderError };

/** The pinned engine version: part of every cache key, so an upgrade never serves an old SVG. */
const MERMAID_VERSION = "12.1.0";
/** The longest source drawn (mermaid's own `maxTextSize`, pinned lower). */
const MAX_TEXT_SIZE = 20000;
/** How many SVGs the in-memory cache keeps (least recently used goes first). */
const CACHE_SIZE = 50;

/**
 * The configuration pinned on every render. `theme`/`look`/`layout` keep mermaid 12's classic
 * appearance and the bundled dagre layout (12's defaults would be ELK plus the redux/neo look);
 * `useMaxWidth: false` draws at natural width; `MermaidBlock` then scales a wider diagram down to
 * its column, and scrolls one sideways only below a legible size (`MIN_FIT_SCALE`).
 */
function pinnedConfig(theme: MermaidTheme, t: Tokens): MermaidConfig {
  return {
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    maxTextSize: MAX_TEXT_SIZE,
    maxEdges: 300,
    theme: "base",
    look: "classic",
    layout: "dagre",
    htmlLabels: false,
    fontFamily: "inherit",
    flowchart: { htmlLabels: false, useMaxWidth: false },
    sequence: { useMaxWidth: false },
    themeVariables: {
      darkMode: theme === "dark",
      background: t.background,
      fontFamily: "inherit",
      primaryColor: t.card,
      primaryBorderColor: t.border,
      primaryTextColor: t.foreground,
      secondaryColor: t.muted,
      tertiaryColor: t.background,
      mainBkg: t.card,
      nodeBorder: t.border,
      clusterBkg: t.muted,
      clusterBorder: t.border,
      lineColor: t.mutedForeground,
      textColor: t.foreground,
      edgeLabelBackground: t.background,
    },
  };
}

/* ------------------------------------------------------------------------------------------------
 * Tokens → mermaid colours
 * ----------------------------------------------------------------------------------------------*/

type Tokens = Record<
  | "background"
  | "foreground"
  | "card"
  | "border"
  | "muted"
  | "mutedForeground"
  | "primary"
  | "primaryForeground"
  | "info"
  | "success"
  | "successText"
  | "destructive"
  | "destructiveText",
  string
>;

const TOKEN_VARS: Record<keyof Tokens, keyof typeof designTokens.light> = {
  background: "background",
  foreground: "foreground",
  card: "card",
  border: "border",
  muted: "muted",
  mutedForeground: "muted-foreground",
  primary: "primary",
  primaryForeground: "primary-foreground",
  info: "info",
  success: "success",
  successText: "success-text",
  destructive: "destructive",
  destructiveText: "destructive-text",
};

/**
 * The tokens of `theme` as `#rrggbb` (mermaid's colour maths reads hex, not oklch): each CSS
 * variable is painted on a 1×1 canvas and read back. A probe element reads them — inside a `.dark`
 * probe for the dark scheme — so a host's own token overrides apply. The light scheme on a dark
 * page has no selector to read it from, and neither scheme can be read while printing, so those
 * come from the design tokens' own values.
 */
function readTokens(theme: MermaidTheme): Tokens {
  const probe = document.createElement("div");
  probe.hidden = true;
  if (theme === "dark") probe.className = "dark";
  document.body.append(probe);
  try {
    const pageDark = Boolean(probe.parentElement?.closest(".dark"));
    // While printing, `.dark` restates the light palette (paper): the CSS can't tell the schemes
    // apart then, so both come from the design tokens' own values.
    const printing = window.matchMedia?.("print").matches ?? false;
    const style = getComputedStyle(probe);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const out = {} as Tokens;
    for (const [name, token] of Object.entries(TOKEN_VARS) as [
      keyof Tokens,
      keyof typeof designTokens.light,
    ][]) {
      const value =
        printing || (theme === "light" && pageDark)
          ? designTokens[theme][token]
          : style.getPropertyValue(`--${token}`).trim() ||
            designTokens[theme][token];
      out[name] = toHex(ctx, value);
    }
    return out;
  } finally {
    probe.remove();
  }
}

function toHex(ctx: CanvasRenderingContext2D | null, colour: string): string {
  // No canvas (a locked-down browser): mermaid falls back to its own colours for a non-hex value.
  if (!ctx) return colour;
  ctx.clearRect(0, 0, 1, 1);
  // An unparseable colour leaves `fillStyle` as it was: reset it first.
  ctx.fillStyle = "transparent";
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((v) => (v ?? 0).toString(16).padStart(2, "0")).join("")}`;
}

/** `a` mixed into `b` by `amount` (0–1), both `#rrggbb`. */
function tint(a: string, b: string, amount: number): string {
  const ch = (hex: string, i: number) =>
    parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(ch(a, i) * amount + ch(b, i) * (1 - amount))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * The semantic node classes writers colour flowcharts and state diagrams with —
 * `class A start|step|decision|outcome|stop|muted` — appended as `classDef`s in token colours.
 */
function withClasses(source: string, t: Tokens): string {
  if (!/^\s*(?:%%.*\n\s*)*(flowchart|graph|stateDiagram)/.test(source))
    return source;
  const classes: Record<string, [fill: string, stroke: string, text: string]> =
    {
      start: [t.primary, t.primary, t.primaryForeground],
      step: [t.card, t.border, t.foreground],
      decision: [tint(t.info, t.background, 0.15), t.info, t.foreground],
      outcome: [tint(t.success, t.background, 0.15), t.success, t.successText],
      stop: [
        tint(t.destructive, t.background, 0.12),
        t.destructive,
        t.destructiveText,
      ],
      muted: [t.muted, t.border, t.mutedForeground],
    };
  const defs = Object.entries(classes).map(
    ([name, [fill, stroke, color]]) =>
      `classDef ${name} fill:${fill},stroke:${stroke},color:${color}`,
  );
  return `${source}\n${defs.join("\n")}\n`;
}

/* ------------------------------------------------------------------------------------------------
 * The engine: lazy import, mutex, cache
 * ----------------------------------------------------------------------------------------------*/

let mermaidPromise: Promise<MermaidApi> | null = null;
let mermaidLoaded: MermaidApi | null = null;

function loadMermaid(): Promise<MermaidApi> {
  mermaidPromise ??= import("mermaid").then((module) => {
    mermaidLoaded = module.default;
    return module.default;
  });
  // A failed import (an old browser, a lost chunk) is tried again next time.
  mermaidPromise.catch(() => {
    mermaidPromise = null;
  });
  return mermaidPromise;
}

/** One render at a time: `initialize` is global, so a render owns it until its SVG is out. */
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** cyrb53: a fast 53-bit string hash, as base 36. */
function hash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const cacheKey = (source: string, theme: MermaidTheme) =>
  hash(`${MERMAID_VERSION}|${theme}|classic|dagre|${source}`);

const svgCache = new Map<string, string>();
function cacheGet(key: string): string | undefined {
  const svg = svgCache.get(key);
  if (svg !== undefined) {
    svgCache.delete(key);
    svgCache.set(key, svg);
  }
  return svg;
}
function cacheSet(key: string, svg: string) {
  svgCache.set(key, svg);
  if (svgCache.size > CACHE_SIZE)
    svgCache.delete(svgCache.keys().next().value as string);
}

/** The cached SVG for `source` in `theme`, without drawing anything. */
function cachedSvg(source: string, theme: MermaidTheme): string | undefined {
  return mermaidLoaded ? cacheGet(cacheKey(source, theme)) : undefined;
}

const inflight = new Map<string, Promise<MermaidRenderResult>>();
let renderSeq = 0;

/** A parser's error as a line number and one plain sentence. */
function toRenderError(error: unknown): MermaidRenderError {
  const err = error as {
    message?: unknown;
    hash?: { line?: number; loc?: { first_line?: number } };
  } | null;
  const raw =
    typeof err?.message === "string"
      ? err.message
      : typeof error === "string"
        ? error
        : "";
  let line =
    err?.hash?.loc?.first_line ??
    (typeof err?.hash?.line === "number" ? err.hash.line + 1 : undefined);
  line ??= Number(/\bline (\d+)/i.exec(raw)?.[1]) || undefined;
  const expecting = /Expecting (.+?), got '([^']*)'/.exec(raw);
  let message: string;
  if (expecting) {
    const expected = expecting[1]!.split(/,\s*/).map((each) => each.trim());
    message =
      expected.length <= 3
        ? `Expected ${expected.join(" or ")}.`
        : `Unexpected '${expecting[2]}'.`;
  } else {
    const first = raw
      .split("\n")
      .map((each) => each.trim())
      .find(
        (each) =>
          each &&
          !/^parse error on line/i.test(each) &&
          !/^[-^.\s]+$/.test(each),
      );
    message = first
      ? first.replace(/^(?:Error:\s*)?/, "").replace(/\.?$/, ".")
      : "This isn't a diagram mermaid can read.";
  }
  return line ? { line, message } : { message };
}

/**
 * `renderMermaid` — draw `source` as a sanitised SVG string, with the configuration pinned and the
 * design tokens of `theme` as its colours. Loads `mermaid` on first use; cached (50 SVGs, keyed by
 * the engine version, theme, look, layout and source); identical renders in flight share one
 * promise. Never throws: a parse error, a source over 20,000 characters or an engine that cannot
 * load resolves to `{ error: { line?, message } }`. Browser only.
 *
 * @example
 * const result = await renderMermaid("flowchart LR\n  a --> b", { theme: "light" });
 * if ("svg" in result) container.innerHTML = result.svg;
 */
export function renderMermaid(
  source: string,
  { theme = "light" }: { theme?: MermaidTheme } = {},
): Promise<MermaidRenderResult> {
  if (typeof document === "undefined")
    return Promise.resolve({
      error: { message: "Diagrams are drawn in the browser." },
    });
  if (!source.trim())
    return Promise.resolve({ error: { message: "This diagram is empty." } });
  if (source.length > MAX_TEXT_SIZE)
    return Promise.resolve({
      error: {
        message: `This diagram is over ${MAX_TEXT_SIZE.toLocaleString("en-US")} characters.`,
      },
    });
  const key = cacheKey(source, theme);
  const hit = mermaidLoaded ? cacheGet(key) : undefined;
  if (hit !== undefined) return Promise.resolve({ svg: hit });
  let pending = inflight.get(key);
  if (!pending) {
    pending = draw(source, theme, key).finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}

/**
 * Where mermaid lays a diagram out while it measures its labels: off screen, invisible, but with
 * real layout and width. Mermaid's default (a box appended to `body`) measures nothing when the
 * page hides `body`'s other children — a print stylesheet that isolates the document — and then
 * draws every label at `translate(NaN, NaN)`. Inline `!important` outranks such a rule.
 */
const GEOMETRY = [
  "transform",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "d",
  "points",
  "viewBox",
] as const;

/**
 * Whether a drawing's geometry holds `NaN` — its labels were never measured. Read from the parsed
 * SVG's attributes, so a label's own words ("NaN", `x="NaN"`) never count.
 */
function unmeasured(svg: string): boolean {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  for (const element of doc.querySelectorAll("*"))
    for (const name of GEOMETRY)
      if (/\bNaN\b/.test(element.getAttribute(name) ?? "")) return true;
  return false;
}

function measuringBox(): HTMLElement {
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  box.dataset.slot = "mermaid-block-measure";
  for (const [name, value] of [
    ["display", "block"],
    ["position", "fixed"],
    ["top", "0"],
    ["left", "-10000px"],
    ["width", "1024px"],
    ["visibility", "hidden"],
    ["pointer-events", "none"],
    ["contain", "layout style"],
  ] as const)
    box.style.setProperty(name, value, "important");
  document.body.append(box);
  return box;
}

async function draw(
  source: string,
  theme: MermaidTheme,
  key: string,
): Promise<MermaidRenderResult> {
  let mermaid: MermaidApi;
  try {
    mermaid = await loadMermaid();
  } catch {
    return { error: { message: "Diagrams can't be drawn in this browser." } };
  }
  // Labels are measured as they are drawn: wait for the page's fonts.
  try {
    await document.fonts?.ready;
  } catch {
    // No font loading API: draw with what is there.
  }
  return exclusive(async () => {
    const hit = cacheGet(key);
    if (hit !== undefined) return { svg: hit };
    const tokens = readTokens(theme);
    mermaid.initialize(pinnedConfig(theme, tokens));
    const box = measuringBox();
    try {
      await mermaid.parse(source);
      const { svg } = await mermaid.render(
        `vs-mermaid-${++renderSeq}`,
        withClasses(source, tokens),
        box,
      );
      // A drawing whose labels could not be measured is never kept: the next render tries again.
      if (unmeasured(svg))
        return { error: { message: "The diagram couldn't be measured." } };
      cacheSet(key, svg);
      return { svg };
    } catch (error) {
      return { error: toRenderError(error) };
    } finally {
      box.remove();
    }
  });
}

/* ------------------------------------------------------------------------------------------------
 * The hook
 * ----------------------------------------------------------------------------------------------*/

/** Options for `useMermaidSvg`. */
export interface UseMermaidSvgOptions {
  /**
   * Milliseconds to wait after the source last changed before drawing it again (while typing).
   * The first drawing never waits.
   * @default 400
   */
  debounce?: number;
  /** The colour scheme to draw in. @default "light" */
  theme?: MermaidTheme;
  /** `false` holds off drawing (the block is far from the viewport). @default true */
  enabled?: boolean;
}

/** What `useMermaidSvg` returns. */
export interface UseMermaidSvgResult {
  /** The last SVG that drew — kept while a later source fails, so the diagram never flashes. */
  svg: string | null;
  /** Why the current source didn't draw, or `null`. */
  error: MermaidRenderError | null;
  /** A drawing is under way (or waiting for its debounce). */
  pending: boolean;
}

/**
 * `useMermaidSvg` — the current SVG for `source`, redrawn after `debounce` ms of quiet while it
 * changes. A result for a source that has since moved on is dropped; a failing source keeps the
 * last SVG that worked beside its error. A cached diagram shows on the first render.
 *
 * @example
 * const { svg, error, pending } = useMermaidSvg(source, { debounce: 400, theme: "dark" });
 */
export function useMermaidSvg(
  source: string,
  {
    debounce = 400,
    theme = "light",
    enabled = true,
  }: UseMermaidSvgOptions = {},
): UseMermaidSvgResult {
  const [state, setState] = React.useState<UseMermaidSvgResult>(() => {
    const hit = cachedSvg(source, theme);
    return { svg: hit ?? null, error: null, pending: hit === undefined };
  });
  const seq = React.useRef(0);
  const drawn = React.useRef(state.svg !== null);
  React.useEffect(() => {
    if (!enabled) return;
    const id = ++seq.current;
    const hit = cachedSvg(source, theme);
    if (hit !== undefined) {
      drawn.current = true;
      setState({ svg: hit, error: null, pending: false });
      return;
    }
    setState((s) => (s.pending ? s : { ...s, pending: true }));
    const timer = setTimeout(
      () => {
        void renderMermaid(source, { theme }).then((result) => {
          if (seq.current !== id) return;
          if ("svg" in result) {
            drawn.current = true;
            setState({ svg: result.svg, error: null, pending: false });
          } else
            setState((s) => ({
              svg: s.svg,
              error: result.error,
              pending: false,
            }));
        });
      },
      drawn.current ? debounce : 0,
    );
    return () => clearTimeout(timer);
  }, [source, theme, enabled, debounce]);
  return state;
}

/* ------------------------------------------------------------------------------------------------
 * The figure
 * ----------------------------------------------------------------------------------------------*/

/** The diagram's `accTitle`, when it has one. */
function accTitleOf(source: string): string | undefined {
  return /^\s*accTitle\s*:\s*(.+?)\s*$/m.exec(source)?.[1];
}

/** The page's colour scheme at `ref` (`.dark` on an ancestor), following class changes. */
function usePageTheme(ref: React.RefObject<HTMLElement | null>): MermaidTheme {
  const [theme, setTheme] = React.useState<MermaidTheme>("light");
  React.useEffect(() => {
    const read = () =>
      setTheme(ref.current?.closest(".dark") ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    for (const node of [document.documentElement, document.body])
      observer.observe(node, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [ref]);
  return theme;
}

/** True once `ref` has come within 200px of the viewport (and from then on). */
function useNearViewport(ref: React.RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = React.useState(false);
  React.useEffect(() => {
    const node = ref.current;
    if (near || !node) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, near]);
  return near;
}

/**
 * Keep `data-scroll-start` / `data-scroll-end` on a sideways-scrolling box while there is more
 * diagram toward that edge (the same cue `MarkdownView` tables wear), and report whether it
 * scrolls at all. A passive `scroll` listener and a `ResizeObserver` keep them current.
 */
function useScrollEdges(box: HTMLElement | null): boolean {
  const [scrollable, setScrollable] = React.useState(false);
  React.useEffect(() => {
    if (!box) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = box.scrollWidth - box.clientWidth;
      // RTL scrolls from 0 toward negative offsets; the magnitude is what moved from the start.
      const moved = Math.abs(box.scrollLeft);
      const overflowing = max > 1;
      box.toggleAttribute("data-scroll-start", overflowing && moved > 1);
      box.toggleAttribute("data-scroll-end", overflowing && moved < max - 1);
      setScrollable(overflowing);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    box.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    for (const child of box.children) observer.observe(child);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      box.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [box]);
  return scrollable;
}

/** The edge fade of a scrolling diagram: 24px of mask at each edge with more beyond it. */
const scrollEdgeFadeClassName =
  "[--scroll-edge-s:0%] [--scroll-edge-e:0%] data-scroll-start:[--scroll-edge-s:--spacing(6)] data-scroll-end:[--scroll-edge-e:--spacing(6)] [mask-image:linear-gradient(to_right,transparent,black_var(--scroll-edge-s),black_calc(100%-var(--scroll-edge-e)),transparent)] rtl:[mask-image:linear-gradient(to_left,transparent,black_var(--scroll-edge-s),black_calc(100%-var(--scroll-edge-e)),transparent)] print:overflow-visible print:[mask-image:none]";

/**
 * The smallest a diagram is scaled to fit its column: 0.6 of its drawn size keeps mermaid's 16px
 * labels at about 10px. A diagram that would need less scrolls sideways at this scale instead.
 */
const MIN_FIT_SCALE = 0.6;

/** A drawn SVG's natural width in px: its `width` attribute, else its `viewBox` width. */
function naturalWidth(svg: string): number | undefined {
  const tag = /<svg\b[^>]*>/i.exec(svg)?.[0];
  if (!tag) return undefined;
  const width = /\swidth="([\d.]+)(?:px)?"/i.exec(tag)?.[1];
  const viewBox = /\sviewBox="[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)/i.exec(
    tag,
  )?.[1];
  const value = Number(width ?? viewBox);
  return value > 0 ? value : undefined;
}

const HEIGHT_KEY = "vs:mermaid-height:";

function readHeight(sourceHash: string): number | undefined {
  try {
    const value = Number(localStorage.getItem(HEIGHT_KEY + sourceHash));
    return value > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}
function writeHeight(sourceHash: string, height: number) {
  try {
    localStorage.setItem(HEIGHT_KEY + sourceHash, String(Math.round(height)));
  } catch {
    // Storage full or blocked: the next visit reserves the default height.
  }
}

/** Props accepted by `MermaidBlock`. */
export interface MermaidBlockProps extends Omit<
  React.ComponentPropsWithRef<"figure">,
  "children"
> {
  /** The diagram's mermaid source — a ```mermaid fence's body. */
  source: string;
  /**
   * The colour scheme to draw in. Omitted, it follows the page (`.dark` on an ancestor) and
   * re-draws when that changes. A dark drawing prints its light copy, drawn while the page is idle.
   * @default undefined
   */
  theme?: MermaidTheme;
  /**
   * Milliseconds of quiet after `source` changes before re-drawing (live editing passes 400).
   * @default 0
   */
  debounce?: number;
}

/**
 * `MermaidBlock` — a mermaid diagram as a `<figure>` named by its `accTitle` (else "Diagram"),
 * drawn when it nears the viewport, at its natural size or scaled down to fit its column's width
 * (never up). One that would fall below a legible size (0.6 of its drawn size) stays at that size
 * and scrolls sideways instead, its overflowing edge faded, as a named region the keyboard can
 * scroll. The
 * space it takes is reserved from its last measured height while it draws. When the source stops
 * parsing, the last diagram that worked stays, dimmed, with a status line naming the line and the
 * problem; with none to keep, "Couldn't draw this diagram" and the source. The SVG keeps its own
 * `aria-labelledby`/`aria-describedby` (from `accTitle`/`accDescr`). Never splits across printed
 * pages.
 *
 * @example
 * <MermaidBlock source={"flowchart LR\n  accTitle: Release\n  draft --> live"} />
 */
export function MermaidBlock({
  source,
  theme: themeProp,
  debounce = 0,
  className,
  style,
  ref,
  ...props
}: MermaidBlockProps) {
  const figureRef = React.useRef<HTMLElement | null>(null);
  const setRef = React.useMemo(() => mergeRefs(figureRef, ref), [ref]);
  const pageTheme = usePageTheme(figureRef);
  const theme: MermaidTheme = themeProp ?? pageTheme;
  const near = useNearViewport(figureRef);
  const { svg, error, pending } = useMermaidSvg(source, {
    debounce,
    theme,
    enabled: near,
  });

  const sourceHash = React.useMemo(() => hash(source), [source]);
  const [reserved, setReserved] = React.useState<number | undefined>();
  React.useLayoutEffect(() => {
    setReserved(readHeight(sourceHash));
  }, [sourceHash]);
  const svgRef = React.useRef<HTMLDivElement>(null);
  const natural = React.useMemo(
    () => (svg ? naturalWidth(svg) : undefined),
    [svg],
  );
  const [scrollBox, setScrollBox] = React.useState<HTMLDivElement | null>(null);
  const scrollable = useScrollEdges(scrollBox);
  React.useLayoutEffect(() => {
    const box = svgRef.current;
    if (svg && !error && box && box.offsetHeight > 0)
      writeHeight(sourceHash, box.offsetHeight);
  }, [svg, error, sourceHash]);

  // Theme flips and print are instant: the other scheme is drawn while the page is idle. In dark
  // mode the light drawing is kept for paper (printing forces the light palette).
  const [printSvg, setPrintSvg] = React.useState<string | null>(null);
  React.useEffect(() => {
    // A changed diagram is never printed from its old drawing.
    setPrintSvg(null);
    if (!svg || error || pending) return;
    const other: MermaidTheme = theme === "dark" ? "light" : "dark";
    const run = () =>
      void renderMermaid(source, { theme: other }).then((result) =>
        setPrintSvg(other === "light" && "svg" in result ? result.svg : null),
      );
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = setTimeout(run, 1000);
    return () => clearTimeout(timer);
  }, [svg, error, pending, source, theme]);

  const failed = !svg && error !== null;
  const where = error?.line ? `Line ${error.line}: ` : "";
  const status = error
    ? svg
      ? `${where}${error.message} Showing the last diagram that worked.`
      : `Couldn't draw this diagram. ${where}${error.message}`
    : "";
  const state = svg
    ? error
      ? "error"
      : "ready"
    : failed
      ? "failed"
      : "loading";

  return (
    <figure
      ref={setRef}
      data-slot="mermaid-block"
      data-state={state}
      aria-label={accTitleOf(source) ?? "Diagram"}
      aria-busy={state === "loading" || undefined}
      className={cn(
        "m-0 flex min-w-0 max-w-full flex-col print:break-inside-avoid print:[print-color-adjust:exact]",
        className,
      )}
      style={
        state === "loading" && reserved
          ? { minHeight: reserved, ...style }
          : style
      }
      {...props}
    >
      {svg ? (
        <div
          ref={setScrollBox}
          data-slot="mermaid-block-scroll"
          role={scrollable ? "region" : undefined}
          aria-label={scrollable ? "Diagram, scrolls sideways" : undefined}
          tabIndex={scrollable ? 0 : undefined}
          className={cn(
            "min-w-0 max-w-full overflow-x-auto overscroll-x-contain focus-visible:-outline-offset-2",
            scrollEdgeFadeClassName,
          )}
        >
          <div
            ref={svgRef}
            data-slot="mermaid-block-svg"
            className={cn(
              "p-4 transition-opacity duration-150 [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-none print:max-w-full print:[&_svg]:max-w-full",
              // Fitted: the column's width, never above the drawn size nor below the legible floor
              // (the box grows to that floor, and the scroll box scrolls it).
              natural
                ? "w-full min-w-[calc(var(--mermaid-min-width)+--spacing(8))] print:min-w-0 [&_svg]:w-[clamp(var(--mermaid-min-width),100%,var(--mermaid-natural-width))]"
                : "mx-auto w-max max-w-none",
              error && "opacity-40",
              theme === "dark" && printSvg && !error && "print:hidden",
            )}
            style={
              natural
                ? ({
                    "--mermaid-natural-width": `${natural}px`,
                    "--mermaid-min-width": `${natural * MIN_FIT_SCALE}px`,
                  } as React.CSSProperties)
                : undefined
            }
            // Mermaid's own output, sanitised by its DOMPurify pass (`securityLevel: "strict"`).
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {theme === "dark" && printSvg && !error ? (
            <div
              aria-hidden
              data-slot="mermaid-block-print"
              className="mx-auto hidden w-max max-w-full p-4 print:block [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full"
              // The light drawing, for paper: Mermaid's own sanitised output, as above.
              dangerouslySetInnerHTML={{ __html: printSvg }}
            />
          ) : null}
        </div>
      ) : null}
      {svg ? null : failed ? (
        <pre
          data-slot="mermaid-block-source"
          className="m-0 overflow-x-auto px-4 pt-3 pb-1 font-mono text-xs text-muted-foreground"
        >
          <code>{source}</code>
        </pre>
      ) : (
        <Skeleton
          data-slot="mermaid-block-skeleton"
          className="m-4 h-40"
          style={reserved ? { height: Math.max(0, reserved - 32) } : undefined}
        />
      )}
      <p
        role="status"
        data-slot="mermaid-block-status"
        className={cn(
          "m-0 px-4 text-xs text-muted-foreground empty:hidden",
          failed ? "order-first pt-3 text-foreground" : "pb-3",
        )}
      >
        {status}
      </p>
    </figure>
  );
}

/* ------------------------------------------------------------------------------------------------
 * The ready `blockViews` entry
 * ----------------------------------------------------------------------------------------------*/

/** The SVG a block view shows, else a fresh drawing of `source`. */
async function svgFor(
  source: string,
  theme: MermaidTheme,
  preview: HTMLElement | null,
): Promise<string | null> {
  const shown = preview?.querySelector(
    "[data-slot=mermaid-block-svg] > svg",
  )?.outerHTML;
  if (shown) return shown;
  const result = await renderMermaid(source, { theme });
  return "svg" in result ? result.svg : null;
}

const STARTER = `flowchart LR
  accTitle: Draft to published
  accDescr: A draft is reviewed, then published or sent back.
  draft[Draft] --> review{Review}
  review -->|Approved| published([Published])
  review -->|Changes| draft
`;

/**
 * `mermaidBlockView` — the ready `blockViews` entry for ```mermaid fences:
 * `<TextEdit blockViews={{ mermaid: mermaidBlockView }} />` (and the same on `MarkdownView`).
 * Labelled "Diagram", split view on a wide block, a small flowchart starter, a Code-mode hint
 * while `accTitle`/`accDescr` are missing, and Copy SVG / Download SVG in the block's ⋯ menu.
 *
 * @example
 * <MarkdownView blockViews={{ mermaid: mermaidBlockView }}>{markdown}</MarkdownView>
 */
export const mermaidBlockView = {
  label: "Diagram",
  split: true,
  starter: STARTER,
  render: (source: string, ctx: { mode: "preview"; theme: MermaidTheme }) => (
    <MermaidBlock source={source} theme={ctx.theme} debounce={400} />
  ),
  hint: (source: string) =>
    /^\s*accTitle\s*:/m.test(source) && /^\s*accDescr\b/m.test(source)
      ? null
      : "Add accTitle and accDescr for screen readers",
  actions: [
    {
      label: "Copy SVG",
      icon: Copy,
      onSelect: async ({
        source,
        theme,
        preview,
      }: {
        source: string;
        theme: MermaidTheme;
        preview: HTMLElement | null;
      }) => {
        const svg = await svgFor(source, theme, preview);
        if (!svg) return "Couldn't copy the SVG";
        await navigator.clipboard.writeText(svg);
        return "SVG copied";
      },
    },
    {
      label: "Download SVG",
      icon: Download,
      onSelect: async ({
        source,
        theme,
        preview,
      }: {
        source: string;
        theme: MermaidTheme;
        preview: HTMLElement | null;
      }) => {
        const svg = await svgFor(source, theme, preview);
        if (!svg) return "Couldn't download the SVG";
        const url = URL.createObjectURL(
          new Blob([svg], { type: "image/svg+xml" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `${
          (accTitleOf(source) ?? "diagram")
            .replace(/[^\w\- ]+/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .toLowerCase() || "diagram"
        }.svg`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return undefined;
      },
    },
  ],
};
