// @vegastack markdown-view@0.25.63 sha256-oCeMPduxq5LGw8jyjmDyaGWgy+GTdeHd1sKsg0CONr8=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Hash,
  MessageSquarePlus,
  Play,
  SquarePlay,
  Video,
  X,
} from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAnnouncer } from "@/components/ui/use-announcer";
import {
  anchorFromRange,
  resolveAnchor,
  type TextAnchor,
} from "@/lib/text-anchor";
import {
  EMBED_FRAME_ATTRIBUTES,
  EMBED_PROVIDERS,
  matchEmbed,
  type EmbedProviders,
} from "@/lib/embed-providers";

/* ------------------------------------------------------------------------------------------------
 * The client leaves of `MarkdownView` — everything it does that needs the DOM after render: the
 * table scroll cue, the outline report, the find highlights and their match bar, opening toggles
 * for print, reporting where comment highlights sit, the selection's Comment button, and the
 * heading copy-link button. The view itself stays server-safe; each leaf renders only when its
 * prop asks for it.
 * ----------------------------------------------------------------------------------------------*/

/**
 * Keep `data-scroll-start` / `data-scroll-end` on a horizontally scrolling box: present while
 * there is more content toward that edge. A passive `scroll` listener and a `ResizeObserver` on the
 * box and its first child keep them current; the box's CSS turns them into an edge fade. Returns a
 * cleanup.
 */
function trackScrollEdges(box: HTMLElement): () => void {
  let frame = 0;
  const update = () => {
    frame = 0;
    const max = box.scrollWidth - box.clientWidth;
    // RTL scrolls from 0 toward negative offsets; the magnitude is what moved from the start.
    const moved = Math.abs(box.scrollLeft);
    const overflowing = max > 1;
    box.toggleAttribute("data-scroll-start", overflowing && moved > 1);
    box.toggleAttribute("data-scroll-end", overflowing && moved < max - 1);
    box.toggleAttribute("data-scrollable", overflowing);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  box.addEventListener("scroll", schedule, { passive: true });
  const observer = new ResizeObserver(schedule);
  observer.observe(box);
  if (box.firstElementChild) observer.observe(box.firstElementChild);
  return () => {
    if (frame) cancelAnimationFrame(frame);
    box.removeEventListener("scroll", schedule);
    observer.disconnect();
  };
}

/**
 * The edge fade a scrolling table box wears: 24px of mask at each edge with more content beyond
 * it, nothing while the table fits. Mirrors under RTL; dropped for print, where tables never clip.
 */
const scrollEdgeFadeClassName =
  "[--scroll-edge-s:0%] [--scroll-edge-e:0%] data-scroll-start:[--scroll-edge-s:--spacing(6)] data-scroll-end:[--scroll-edge-e:--spacing(6)] [mask-image:linear-gradient(to_right,transparent,black_var(--scroll-edge-s),black_calc(100%-var(--scroll-edge-e)),transparent)] rtl:[mask-image:linear-gradient(to_left,transparent,black_var(--scroll-edge-s),black_calc(100%-var(--scroll-edge-e)),transparent)] print:overflow-visible print:[mask-image:none]";

/** Props accepted by `MarkdownTableScroll`. */
export interface MarkdownTableScrollProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The box's accessible name while the table scrolls (it is a focusable region then, so a
   * keyboard can scroll it).
   * @default "Table, scrolls sideways"
   */
  label?: string;
}

/**
 * `MarkdownTableScroll` — the box a `MarkdownView` table scrolls in. A wide table scrolls inside
 * it rather than widening the page; while it does, the overflowing edge fades (`data-scroll-start`
 * / `data-scroll-end`) and the box is a named, focusable region so the keyboard can scroll it. A
 * table that fits adds no fade, no landmark and no tab stop.
 *
 * @example
 * <MarkdownTableScroll><table>…</table></MarkdownTableScroll>
 */
export function MarkdownTableScroll({
  label = "Table, scrolls sideways",
  className,
  ref,
  ...props
}: MarkdownTableScrollProps) {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const [scrollable, setScrollable] = React.useState(false);
  const setRefs = React.useMemo(() => mergeRefs(setNode, ref), [ref]);
  React.useEffect(() => {
    if (!node) return;
    const stop = trackScrollEdges(node);
    const sync = () => setScrollable(node.hasAttribute("data-scrollable"));
    const observer = new MutationObserver(sync);
    observer.observe(node, { attributeFilter: ["data-scrollable"] });
    sync();
    return () => {
      observer.disconnect();
      stop();
    };
  }, [node]);
  return (
    <div
      {...props}
      ref={setRefs}
      data-slot="markdown-table"
      role={scrollable ? "region" : undefined}
      aria-label={scrollable ? label : undefined}
      tabIndex={scrollable ? 0 : undefined}
      className={cn(
        "my-2 w-full overflow-x-auto focus-visible:-outline-offset-2",
        scrollEdgeFadeClassName,
        className,
      )}
    />
  );
}

/** One heading of a `MarkdownView`'s outline. */
export interface MarkdownOutlineItem {
  /** The heading's element id — its slug (`headingAnchors`) or its words, hyphenated. */
  id: string;
  /** `#` to `####`. */
  level: 1 | 2 | 3 | 4;
  /** The heading's text; a mention reads as `@label`. */
  text: string;
  /** The heading's block id (`headingAnchors`), when the host passed one. */
  anchorId?: string;
}

/** Where a comment highlight sits, for laying comments beside the text. */
export interface MarkdownAnnotationLayout {
  /** The annotation's id. */
  id: string;
  /** The highlight's top edge, in px from the view's top; null when it found no text. */
  top: number | null;
}

/** The find highlights' registry names: every match, and the one the bar is on. */
const FIND_HIGHLIGHT = "vs-find";
const FIND_CURRENT = "vs-find-current";

/**
 * Each view's own matches. The highlight registry is the document's, and the stylesheet names a
 * highlight statically, so every view's ranges are kept here by view and the two named highlights
 * are rebuilt from all of them: one view setting or clearing its find never touches another's.
 */
const findByView = new Map<string, { all: Range[]; current: Range | null }>();
function paintFind() {
  const registry = highlights();
  const Highlight = HighlightClass();
  if (!registry || !Highlight) return;
  const all = [...findByView.values()].flatMap((view) => view.all);
  const current = [...findByView.values()].flatMap((view) =>
    view.current ? [view.current] : [],
  );
  if (all.length) registry.set(FIND_HIGHLIGHT, new Highlight(...all));
  else registry.delete(FIND_HIGHLIGHT);
  if (current.length) {
    const highlight = new Highlight(...current) as { priority?: number };
    // Above the every-match highlight where they overlap.
    highlight.priority = 1;
    registry.set(FIND_CURRENT, highlight);
  } else registry.delete(FIND_CURRENT);
}

/**
 * `text` case-folded one code point at a time — upper-cased, then lower-cased, and that once more,
 * so every case form of a letter meets (`Σ`, `σ`, `ς` → `σ`; `ß`, `ẞ`, `SS` → `ss`; never a
 * whole-string fold, which depends on context) — with each folded unit's character in `text`:
 * `[from, to)`.
 */
function fold(text: string): { text: string; from: number[]; to: number[] } {
  let folded = "";
  const from: number[] = [];
  const to: number[] = [];
  let offset = 0;
  for (const char of text) {
    // Twice, so a fold's own result is folded too: `ẞ` → `ß` → `ss`, as `ß` → `ss`.
    const once = (each: string) => each.toLocaleUpperCase().toLocaleLowerCase();
    const lower = [...once(char)].map(once).join("");
    for (let unit = 0; unit < lower.length; unit++) {
      from.push(offset);
      to.push(offset + char.length);
    }
    folded += lower;
    offset += char.length;
  }
  return { text: folded, from, to };
}

/** Every case-insensitive match of `query` in the view's text, as DOM ranges. */
function findRanges(root: HTMLElement, query: string): Range[] {
  if (!query.trim()) return [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(
        "[data-slot=markdown-find-bar], [data-slot=text-edit-annotation-count], [data-slot=markdown-heading-link], .sr-only",
      )
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const nodes: Text[] = [];
  const starts: number[] = [];
  let text = "";
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push(node as Text);
    starts.push(text.length);
    text += (node as Text).data;
  }
  // Case-fold code point by code point — the query exactly as the text, so `Σ` folds alike in both
  // — and keep the character each folded unit came from: folding can change a string's length
  // (`İ` folds to two units), so folded offsets are not text offsets.
  const needle = fold(query.trim()).text;
  const { text: haystack, from, to } = fold(text);
  const at = (position: number): [Text, number] => {
    let low = 0;
    let high = nodes.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (starts[mid]! <= position) low = mid;
      else high = mid - 1;
    }
    return [nodes[low]!, position - starts[low]!];
  };
  const ranges: Range[] = [];
  let lastEnd = 0;
  for (
    let index = haystack.indexOf(needle);
    index !== -1 && ranges.length < 1000;
    index = haystack.indexOf(needle, index + needle.length)
  ) {
    // From the first matched unit's character to the end of the last one's (a match that ends
    // inside one character's folding covers that whole character).
    const start = from[index]!;
    const end = to[index + needle.length - 1]!;
    // Two matches inside one expanded character (`s` in `ß` → `ss`) are one place in the text.
    if (start < lastEnd) continue;
    lastEnd = end;
    const [startNode, startOffset] = at(start);
    const [endNode, endOffset] = at(end - 1);
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, Math.min(endOffset + 1, endNode.length));
    ranges.push(range);
  }
  return ranges;
}

/** Open every closed toggle around a node, so a match or a jump target is visible. */
function openAncestors(node: Node) {
  for (
    let el = node.parentElement?.closest("details");
    el;
    el = el.parentElement?.closest("details")
  )
    if (!el.open) el.open = true;
}

type HighlightRegistry = Map<string, unknown>;
type HighlightConstructor = new (...ranges: Range[]) => unknown;
const highlights = () =>
  (globalThis.CSS as unknown as { highlights?: HighlightRegistry } | undefined)
    ?.highlights;
const HighlightClass = () =>
  (globalThis as unknown as { Highlight?: HighlightConstructor }).Highlight;

/** Props accepted by `MarkdownViewEffects`. */
export interface MarkdownViewEffectsProps {
  /** The view's `data-view-id`, how the effects find it in the document. */
  viewId: string;
  /** The outline to report, computed by the view at render. @default undefined */
  outline?: readonly MarkdownOutlineItem[];
  /** Receives `outline` after each render that changes it. @default undefined */
  onOutlineChange?: (headings: MarkdownOutlineItem[]) => void;
  /** Receives where each comment highlight sits, after render and on every resize. @default undefined */
  onAnnotationsLayout?: (items: MarkdownAnnotationLayout[]) => void;
  /** The annotation ids, in order; one that drew nothing reports a null top. @default undefined */
  annotationIds?: readonly string[];
  /** Highlights every match and shows the match bar. @default undefined */
  findQuery?: string;
  /** The view's source text: when it changes, the matches are found again. @default undefined */
  content?: string;
  /** The match bar's close button. Without it the bar has none. @default undefined */
  onFindClose?: () => void;
  /** Open every toggle while the page prints, and restore them after. @default false */
  printToggles?: boolean;
  /**
   * The match bar's strings: `position` ("3 of 12"), `none`, `previous`, `next`, `close` and the
   * bar's own name, `label`.
   * @default { position: (n, total) => `${n} of ${total}`, none: "No matches", previous: "Previous match", next: "Next match", close: "Close find", label: "Find in page" }
   */
  findLabels?: {
    position?: (current: number, total: number) => string;
    none?: string;
    previous?: string;
    next?: string;
    close?: string;
    label?: string;
  };
  /**
   * Shows the selection's Comment button and receives the anchor it makes.
   * @default undefined
   */
  onCreateAnnotation?: (anchor: TextAnchor) => void;
  /**
   * The text anchors are offsets into, as the view built it from its tree — the selection's
   * offsets are mapped onto it.
   * @default undefined
   */
  anchorText?: string;
  /** The selection button's label. @default "Comment" */
  commentLabel?: string;
  /** Px the selection button keeps clear at the viewport's top and bottom. @default undefined */
  floatingSafeArea?: { top?: number; bottom?: number };
}

const defaultFindLabels = {
  position: (current: number, total: number) => `${current} of ${total}`,
  none: "No matches",
  previous: "Previous match",
  next: "Next match",
  close: "Close find",
  label: "Find in page",
};

/**
 * `MarkdownViewEffects` — `MarkdownView`'s one client leaf for behaviour after render. It finds the
 * view by its `data-view-id` and renders after it, never inside it (the find bar is `fixed`), so the
 * view needs no ref, stays server-safe, and its first and last blocks stay its own.
 * Rendered by `MarkdownView` only when one of these props is set.
 *
 * @example
 * <MarkdownViewEffects viewId={id} findQuery="pricing" onFindClose={close} />
 */
export function MarkdownViewEffects({
  viewId,
  outline,
  onOutlineChange,
  onAnnotationsLayout,
  annotationIds,
  findQuery,
  content,
  onFindClose,
  printToggles = false,
  findLabels,
  onCreateAnnotation,
  anchorText,
  commentLabel = "Comment",
  floatingSafeArea,
}: MarkdownViewEffectsProps) {
  // Mounted: the find bar renders from the first client effect on (its matches are the client's).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const root = () =>
    document.querySelector<HTMLElement>(
      `[data-view-id="${CSS.escape(viewId)}"]`,
    );

  // The outline: reported when its content changes, never per render.
  const outlineKey = JSON.stringify(outline ?? []);
  // The latest props, read by effects that must not re-run when only a callback's identity moved.
  const latest = React.useRef({
    outline,
    onOutlineChange,
    onAnnotationsLayout,
    annotationIds,
  });
  React.useLayoutEffect(() => {
    latest.current = {
      outline,
      onOutlineChange,
      onAnnotationsLayout,
      annotationIds,
    };
  });
  const hasOutline = onOutlineChange !== undefined;
  React.useEffect(() => {
    const { outline: items, onOutlineChange: report } = latest.current;
    report?.(items ? [...items] : []);
  }, [outlineKey, hasOutline]);

  // Toggles print open, and close again after.
  React.useEffect(() => {
    if (!printToggles) return;
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = [
        ...(root()?.querySelectorAll<HTMLDetailsElement>(
          "details:not([open])",
        ) ?? []),
      ];
      for (const el of opened) el.open = true;
    };
    const after = () => {
      for (const el of opened) el.open = false;
      opened = [];
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [printToggles]);

  // The view's rendered text changed shape — new text, or highlights cut into it (an annotation
  // added or moved, with the same source): find's ranges and the highlights' layout are stale.
  const query = findQuery?.trim() ?? "";
  const hasLayout = onAnnotationsLayout !== undefined;
  const watchDom = mounted && (query !== "" || hasLayout);
  const [domVersion, setDomVersion] = React.useState(0);
  React.useEffect(() => {
    if (!watchDom) return;
    const view = root();
    if (!view) return;
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setDomVersion((v) => v + 1));
    });
    observer.observe(view, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [watchDom, viewId]);

  // Where each comment highlight sits, once per frame when anything moved.
  const annotationsKey = (annotationIds ?? []).join("\u0000");
  const reportLayout = () => {
    const view = root();
    const { onAnnotationsLayout: report, annotationIds: ids } = latest.current;
    if (!view || !report) return;
    const top = view.getBoundingClientRect().top;
    report(
      (ids ?? []).map((id) => {
        const first = view.querySelector(
          `[data-annotation="${CSS.escape(id)}"]`,
        );
        return {
          id,
          top: first ? first.getBoundingClientRect().top - top : null,
        };
      }),
    );
  };
  React.useEffect(() => {
    if (!hasLayout) return;
    const view = root();
    if (!view) return;
    let frame = requestAnimationFrame(() => reportLayout());
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => reportLayout());
    });
    observer.observe(view);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [annotationsKey, hasLayout, domVersion]);

  // Find: every match highlighted (CSS Custom Highlight API, no DOM change), one current.
  const [matches, setMatches] = React.useState<Range[]>([]);
  const [current, setCurrent] = React.useState(0);
  const searched = React.useRef("");
  // Whether the current match is brought into view: on a new search or a step, never on a refresh.
  const reveal = React.useRef(false);
  const { announce, Announcer } = useAnnouncer();
  const labels = { ...defaultFindLabels, ...findLabels };
  React.useEffect(() => {
    const view = root();
    if (!mounted) return;
    if (!view || !query) {
      searched.current = "";
      setMatches([]);
      return;
    }
    const found = findRanges(view, query);
    setMatches(found);
    findByView.set(viewId, { all: found, current: null });
    paintFind();
    // A new search starts at its first match and says so; the same search over re-rendered text
    // (its old ranges point into replaced nodes) keeps its place.
    const search = `${viewId}\u0000${query}\u0000${content ?? ""}`;
    if (searched.current !== search) {
      searched.current = search;
      reveal.current = true;
      setCurrent(0);
      announce(found.length ? labels.position(1, found.length) : labels.none);
    } else setCurrent((at) => Math.min(at, Math.max(0, found.length - 1)));
    return () => {
      findByView.delete(viewId);
      paintFind();
    };
    // Labels are strings the host passes per render; the query, the view, its text and its
    // rendered shape are the inputs.
  }, [query, mounted, content, viewId, domVersion]);
  React.useEffect(() => {
    const range = matches[current];
    if (!range) return;
    const own = findByView.get(viewId);
    if (own) {
      own.current = range;
      paintFind();
    }
    if (!reveal.current) return;
    reveal.current = false;
    openAncestors(range.startContainer);
    const target = range.startContainer.parentElement;
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [matches, current]);

  const step = (by: number) => {
    if (!matches.length) return;
    const next = (current + by + matches.length) % matches.length;
    reveal.current = true;
    setCurrent(next);
    announce(labels.position(next + 1, matches.length));
  };

  // The bar docks at the window's bottom end (`fixed`), rendered after the view rather than inside
  // it — opening find moves nothing, and the recipe's first- and last-child rules still see the
  // document's own blocks. The live region sits beside it, mounted from the first render.
  return (
    <>
      {query && mounted ? (
        <div
          data-slot="markdown-find-bar"
          role="search"
          aria-label={labels.label}
          className="fixed end-4 bottom-[calc(var(--spacing)*4+env(safe-area-inset-bottom))] z-50 flex h-8 items-center gap-0.5 rounded-lg border border-border bg-popover ps-2.5 pe-0.5 font-sans text-sm text-popover-foreground shadow-md print:hidden"
          // Escape closes; Enter and Space stay the buttons' own (activate the focused one).
          onKeyDown={(event) => {
            if (event.key === "Escape" && onFindClose) {
              event.preventDefault();
              onFindClose();
            }
          }}
        >
          <span
            data-slot="markdown-find-count"
            className="me-1 text-muted-foreground tabular-nums"
          >
            {matches.length
              ? labels.position(current + 1, matches.length)
              : labels.none}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={labels.previous}
            disabled={matches.length < 2}
            onClick={() => step(-1)}
          >
            <ChevronUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={labels.next}
            disabled={matches.length < 2}
            onClick={() => step(1)}
          >
            <ChevronDown />
          </Button>
          {onFindClose ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={labels.close}
              onClick={onFindClose}
            >
              <X />
            </Button>
          ) : null}
        </div>
      ) : null}
      {onCreateAnnotation && mounted ? (
        <SelectionComment
          viewId={viewId}
          anchorText={anchorText}
          onCreateAnnotation={onCreateAnnotation}
          label={commentLabel}
          safeTop={floatingSafeArea?.top ?? 0}
          safeBottom={floatingSafeArea?.bottom ?? 0}
        />
      ) : null}
      <Announcer />
    </>
  );
}

/* --- comment on a selection -------------------------------------------------------------------*/

/** The text an image, a line break, a rule or a media block reads as in the anchor text. */
const LEAF_TEXT = "\uFFFC";

/** Inline elements of the rendered view — a mention or file chip is a `span` or an `a`. */
const DOM_INLINE = new Set([
  "STRONG",
  "EM",
  "DEL",
  "S",
  "U",
  "CODE",
  "A",
  "BR",
  "IMG",
  "SUP",
  "SUB",
  "MARK",
  "SPAN",
  "LABEL",
  "INPUT",
]);
/** Blocks whose children are text. */
const DOM_TEXT_BLOCKS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "SUMMARY",
  "TH",
  "TD",
]);
/** What the view renders that its text does not hold: controls, pills, icons, SR-only hints. */
const NOT_TEXT =
  "[data-slot=text-edit-annotation-count],[data-slot=markdown-heading-link],[data-slot=markdown-figure-caption],[data-slot=checkbox],[data-slot=markdown-find-bar],button,input,svg,.sr-only";

/** One run of the view's anchor text and the DOM it came from. */
interface AnchorSegment {
  node: Node;
  start: number;
  length: number;
  /** A mention, a chip, a citation or a leaf: selected whole or not at all. */
  atom: boolean;
  /** Fenced code: counted, but never highlighted. */
  code: boolean;
}

/**
 * The view's text the way `MarkdownView` builds the anchor text from its tree (and `TextEdit`
 * from its document): blocks joined by `"\n"`, a mention as `@label`, an image, a line break, a
 * rule or a media block as `"￼"` — read off the rendered DOM, with every run recorded so a
 * selection's boundary maps to an offset.
 */
function domAnchorText(root: HTMLElement): {
  text: string;
  segments: AnchorSegment[];
} {
  let text = "";
  let first = true;
  const segments: AnchorSegment[] = [];
  const block = () => {
    if (first) first = false;
    else text += "\n";
  };
  const push = (node: Node, value: string, atom: boolean, code = false) => {
    segments.push({
      node,
      start: text.length,
      length: value.length,
      atom,
      code,
    });
    text += value;
  };
  const skipped = (node: Element) => node.matches(NOT_TEXT);
  const inline = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const data = (node as Text).data;
      // A soft line break inside a paragraph is quoted as a space.
      if (data) push(node, data.replace(/\n/g, " "), false);
      return;
    }
    if (!(node instanceof Element) || skipped(node)) return;
    const own = node.getAttribute("data-anchor-text");
    if (own !== null) return push(node, own, true);
    if (node.matches("[data-slot=markdown-citation]"))
      return push(node, `[[${node.textContent?.trim() ?? ""}]]`, true);
    if (node.tagName === "IMG" || node.tagName === "BR")
      return push(node, LEAF_TEXT, true);
    node.childNodes.forEach(inline);
  };
  const blocks = (parent: Node) => {
    let run = false;
    parent.childNodes.forEach((child) => {
      const isText = child.nodeType === Node.TEXT_NODE;
      if (!isText && !(child instanceof Element)) return;
      if (child instanceof Element && skipped(child)) return;
      const element = child instanceof Element ? child : null;
      if (
        isText ||
        (element &&
          DOM_INLINE.has(element.tagName) &&
          !element.hasAttribute("data-anchor-block"))
      ) {
        // Whitespace between blocks (HTML source) is not text.
        if (!run && isText && !(child as Text).data.trim()) return;
        if (!run) block();
        run = true;
        inline(child);
        return;
      }
      run = false;
      if (!element) return;
      if (element.matches("[data-slot=code-block]")) {
        block();
        const code = element.querySelector("[data-slot=code-block-pre] code");
        if (!code) return;
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode())
          if ((node as Text).data) push(node, (node as Text).data, false, true);
      } else if (
        element.hasAttribute("data-anchor-block") ||
        ["HR", "VIDEO", "AUDIO"].includes(element.tagName)
      ) {
        block();
        push(
          element,
          element.getAttribute("data-anchor-text") ?? LEAF_TEXT,
          true,
        );
      } else if (DOM_TEXT_BLOCKS.has(element.tagName)) {
        block();
        element.childNodes.forEach(inline);
      } else blocks(element);
    });
  };
  blocks(root);
  return { text, segments };
}

/** Where a node's own content ends, as a boundary offset. */
const contentEnd = (node: Node) =>
  node.nodeType === Node.TEXT_NODE
    ? (node as Text).length
    : node.childNodes.length;

/**
 * The anchor-text offset of a selection boundary. A boundary inside a text run maps character for
 * character; one inside an atom takes the whole atom; one between runs moves to the next run's
 * start (`start`) or the previous run's end (`end`), so a selection ending at a block's edge never
 * quotes the line break after it.
 */
function boundaryOffset(
  segments: AnchorSegment[],
  container: Node,
  offset: number,
  side: "start" | "end",
  textLength: number,
): number {
  for (const segment of segments) {
    if (segment.node === container && !segment.atom)
      return segment.start + Math.min(Math.max(offset, 0), segment.length);
    if (segment.atom && segment.node.contains(container))
      return side === "start" ? segment.start : segment.start + segment.length;
  }
  const point = document.createRange();
  point.setStart(container, offset);
  if (side === "start") {
    for (const segment of segments)
      if (point.comparePoint(segment.node, 0) >= 0) return segment.start;
    return textLength;
  }
  for (let at = segments.length - 1; at >= 0; at--) {
    const segment = segments[at]!;
    if (point.comparePoint(segment.node, contentEnd(segment.node)) <= 0)
      return segment.start + segment.length;
  }
  return 0;
}

/**
 * The anchor for the selection `range` inside `root`, over `anchorText` (the view's own anchor
 * text) — or `null` when it holds nothing to comment on: only whitespace, atoms or code.
 */
function selectionAnchor(
  root: HTMLElement,
  range: Range,
  anchorText: string | undefined,
): TextAnchor | null {
  const { text, segments } = domAnchorText(root);
  const start = boundaryOffset(
    segments,
    range.startContainer,
    range.startOffset,
    "start",
    text.length,
  );
  const end = boundaryOffset(
    segments,
    range.endContainer,
    range.endOffset,
    "end",
    text.length,
  );
  if (end <= start) return null;
  // Something to comment on: words outside atoms and code.
  const words = segments.some(
    (segment) =>
      !segment.atom &&
      !segment.code &&
      text
        .slice(
          Math.max(start, segment.start),
          Math.min(end, segment.start + segment.length),
        )
        .trim() !== "",
  );
  if (!words) return null;
  const anchor = anchorFromRange(text, start, end);
  if (anchorText === undefined || anchorText === text) return anchor;
  // The DOM read differently from the view's tree (markup the tree does not hold): the quote and
  // its context find the same words in the view's own text.
  const resolved = resolveAnchor(anchorText, anchor);
  return resolved
    ? anchorFromRange(anchorText, resolved.start, resolved.end)
    : null;
}

/** Floating parts keep this far from the viewport's edges, and from the selection. */
const VIEWPORT_GAP = 8;
const SELECTION_GAP = 8;

/** `TextEdit`'s menu surface. */
const MENU_SURFACE =
  "z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md";

/** Every scrolling ancestor's visible box, intersected with the viewport inside its safe area. */
function visibleArea(root: HTMLElement, safeTop: number, safeBottom: number) {
  let top = safeTop;
  let bottom = window.innerHeight - safeBottom;
  let left = 0;
  let right = window.innerWidth;
  for (
    let node = root.parentElement;
    node && node !== document.body && node !== document.documentElement;
    node = node.parentElement
  ) {
    const style = getComputedStyle(node);
    if (style.overflowX === "visible" && style.overflowY === "visible")
      continue;
    const box = node.getBoundingClientRect();
    top = Math.max(top, box.top);
    bottom = Math.min(bottom, box.bottom);
    left = Math.max(left, box.left);
    right = Math.min(right, box.right);
  }
  return { top, bottom, left, right };
}

/**
 * Place the button by the selection's rect: above it (below on a coarse pointer), flipped to the
 * other side when it does not fit inside the safe area, slid along to stay on screen, and hidden
 * while the selection is scrolled out of view.
 */
function placeBubble(
  node: HTMLElement,
  root: HTMLElement,
  rect: DOMRect,
  safeTop: number,
  safeBottom: number,
) {
  const area = visibleArea(root, safeTop, safeBottom);
  const hidden =
    rect.bottom < area.top ||
    rect.top > area.bottom ||
    rect.right < area.left ||
    rect.left > area.right;
  node.style.visibility = hidden ? "hidden" : "";
  node.toggleAttribute("data-hidden", hidden);
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  const minTop = VIEWPORT_GAP + safeTop;
  const maxBottom = window.innerHeight - VIEWPORT_GAP - safeBottom;
  const above = rect.top - SELECTION_GAP - height;
  const below = rect.bottom + SELECTION_GAP;
  const fitsAbove = above >= minTop;
  const fitsBelow = below + height <= maxBottom;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  let side: "top" | "bottom" = coarse ? "bottom" : "top";
  if (side === "top" && !fitsAbove && fitsBelow) side = "bottom";
  else if (side === "bottom" && !fitsBelow && fitsAbove) side = "top";
  const top = Math.max(
    minTop,
    Math.min(side === "top" ? above : below, maxBottom - height),
  );
  const left = Math.max(
    VIEWPORT_GAP,
    Math.min(
      rect.left + rect.width / 2 - width / 2,
      window.innerWidth - VIEWPORT_GAP - width,
    ),
  );
  node.style.top = `${top}px`;
  node.style.left = `${left}px`;
  node.dataset.side = side;
}

/**
 * The Comment button over a selection in the view — `TextEdit`'s read-only selection bubble. It
 * shows once a selection inside the view holds words (never while the pointer is still selecting),
 * floats in a `<body>` portal, and makes the selection's anchor on press.
 */
function SelectionComment({
  viewId,
  anchorText,
  onCreateAnnotation,
  label,
  safeTop,
  safeBottom,
}: {
  viewId: string;
  anchorText?: string;
  onCreateAnnotation: (anchor: TextAnchor) => void;
  label: string;
  safeTop: number;
  safeBottom: number;
}) {
  const themeScope = useInternalThemeScope();
  const [open, setOpen] = React.useState(false);
  const bubbleRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const current = React.useRef<{ range: Range; anchor: TextAnchor } | null>(
    null,
  );
  // The selection the reader closed (Escape) or commented on: it stays closed until it changes.
  const dismissed = React.useRef<string | null>(null);
  // Where focus was before Tab moved it to the button, for Shift+Tab and Escape to go back to.
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const latest = React.useRef({
    anchorText,
    onCreateAnnotation,
    safeTop,
    safeBottom,
  });
  React.useLayoutEffect(() => {
    latest.current = { anchorText, onCreateAnnotation, safeTop, safeBottom };
  });
  const root = React.useCallback(
    () =>
      document.querySelector<HTMLElement>(
        `[data-view-id="${CSS.escape(viewId)}"]`,
      ),
    [viewId],
  );

  const position = React.useCallback(() => {
    const node = bubbleRef.current;
    const view = root();
    const selection = current.current;
    if (!node || !view || !selection) return;
    placeBubble(
      node,
      view,
      selection.range.getBoundingClientRect(),
      latest.current.safeTop,
      latest.current.safeBottom,
    );
  }, [root]);

  React.useLayoutEffect(() => {
    if (open) position();
  });

  React.useEffect(() => {
    let frame = 0;
    // A press is selecting (or tapping the button): nothing is evaluated until it ends.
    let selecting = false;
    let pressingBubble = false;
    const inBubble = (node: Node | null) =>
      Boolean(node && bubbleRef.current?.contains(node));
    const close = () => {
      current.current = null;
      setOpen(false);
    };
    const evaluate = () => {
      frame = 0;
      if (selecting || pressingBubble) return;
      // Focus on the button leaves the selection as it was.
      if (inBubble(document.activeElement)) return;
      const view = root();
      const selection = document.getSelection();
      if (!view || !selection || !selection.rangeCount || selection.isCollapsed)
        return close();
      const range = selection.getRangeAt(0);
      if (
        !view.contains(range.startContainer) ||
        !view.contains(range.endContainer)
      )
        return close();
      const anchor = selectionAnchor(view, range, latest.current.anchorText);
      if (!anchor) return close();
      const key = `${anchor.start}:${anchor.end}`;
      if (dismissed.current === key) return close();
      dismissed.current = null;
      current.current = { range: range.cloneRange(), anchor };
      setOpen(true);
      position();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(evaluate);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (inBubble(event.target as Node)) {
        pressingBubble = true;
        return;
      }
      selecting = true;
      if (current.current) close();
    };
    const onPointerUp = () => {
      selecting = false;
      // The button's own click lands after this; evaluate once it has.
      requestAnimationFrame(() => {
        pressingBubble = false;
      });
      schedule();
    };
    let reflow = 0;
    const onScroll = () => {
      if (reflow || !current.current) return;
      reflow = requestAnimationFrame(() => {
        reflow = 0;
        position();
      });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!current.current || event.defaultPrevented) return;
      const focusInBubble = inBubble(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        dismissed.current = `${current.current.anchor.start}:${current.current.anchor.end}`;
        if (focusInBubble) restoreFocus();
        close();
        return;
      }
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey)
        return;
      if (focusInBubble) {
        // Shift+Tab goes back to where Tab came from.
        if (event.shiftKey && returnFocus.current?.isConnected) {
          event.preventDefault();
          restoreFocus();
        }
        return;
      }
      if (event.shiftKey) return;
      const active = document.activeElement;
      const view = root();
      if (
        active &&
        active !== document.body &&
        !(view && view.contains(active))
      )
        return;
      event.preventDefault();
      returnFocus.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : null;
      buttonRef.current?.focus();
    };
    const restoreFocus = () => {
      const target = returnFocus.current;
      returnFocus.current = null;
      if (target?.isConnected) target.focus();
      else (document.activeElement as HTMLElement | null)?.blur?.();
    };
    document.addEventListener("selectionchange", schedule);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", onScroll);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(reflow);
      document.removeEventListener("selectionchange", schedule);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerUp, true);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [root, position]);

  const comment = () => {
    const selection = current.current;
    if (!selection) return;
    dismissed.current = `${selection.anchor.start}:${selection.anchor.end}`;
    latest.current.onCreateAnnotation(selection.anchor);
    // The host may have moved focus (a composer); otherwise it goes back where it came from.
    if (bubbleRef.current?.contains(document.activeElement)) {
      const target = returnFocus.current;
      returnFocus.current = null;
      if (target?.isConnected) target.focus();
      else buttonRef.current?.blur();
    }
    current.current = null;
    setOpen(false);
  };

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={bubbleRef}
      data-slot="markdown-selection-menu"
      role="toolbar"
      aria-label="Selection actions"
      // Fixed to the viewport, placed by `placeBubble` before the first paint.
      style={{ position: "fixed", top: 0, left: 0 }}
      className={cn(MENU_SURFACE, "flex items-center gap-0.5", themeScope)}
      // A press on the surface keeps the selection.
      onMouseDown={(event) => event.preventDefault()}
    >
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={comment}
        className="gap-1 px-2 text-xs"
      >
        <MessageSquarePlus />
        {label}
      </Button>
    </div>,
    document.body,
  );
}

/** Props accepted by `MarkdownHeadingLink`. */
export interface MarkdownHeadingLinkProps {
  /** Where the heading's link goes — a path or an absolute URL; a path copies as an absolute URL. */
  href: string;
  /** The heading's text, for the button's accessible name. */
  heading: string;
}

/**
 * Copy `text`, then say so in a toast ("Link copied"), or that it couldn't. Shared by the read
 * view's and the editor's heading links.
 */
export async function copyWithToast(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({ title: done });
  } catch {
    toast.add({ title: "Couldn't copy. Try again.", type: "error" });
  }
}

/**
 * The heading link's look — a muted `#` that darkens on hover — shared with `TextEdit`'s heading
 * link, so the read view and the editor show the same button in the same place: in the gutter
 * just before the heading's first line (a 24px box, 2px clear of the text), or after the text on
 * a coarse pointer, where a narrow screen has no gutter.
 */
export const headingLinkClassName =
  "font-sans text-muted-foreground hover:text-foreground print:hidden [&_svg]:size-3.5";

/**
 * `MarkdownHeadingLink` — the `#` copy-link button of a heading (`headingLinkHref`): in the
 * gutter before the text (after it on a coarse pointer), hidden until the heading is hovered,
 * focused or tapped. A press copies the section's absolute link and confirms in a toast.
 *
 * @example
 * <MarkdownHeadingLink href="#pricing~a1b2c3d4" heading="Pricing" />
 */
export function MarkdownHeadingLink({
  href,
  heading,
}: MarkdownHeadingLinkProps) {
  // The box is one heading line tall (it inherits the heading's line height), so the `#` sits on
  // the first line's middle whatever the heading's size.
  return (
    <span
      data-slot="markdown-heading-link"
      className={cn(
        "absolute -start-[26px] top-0 flex h-[1lh] items-center opacity-0 transition-opacity group-hover/heading:opacity-100 group-focus/heading:opacity-100 has-focus-visible:opacity-100 print:hidden",
        // A coarse pointer or a phone-width view has no gutter for it (and a section's marker
        // takes the 16px there is): after the text.
        "pointer-coarse:static pointer-coarse:ms-1 pointer-coarse:inline-flex pointer-coarse:h-auto pointer-coarse:align-middle",
        "max-sm:static max-sm:ms-1 max-sm:inline-flex max-sm:h-auto max-sm:align-middle",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Copy link to “${heading}”`}
        title="Copy link"
        onClick={() =>
          void copyWithToast(
            new URL(href, window.location.href).href,
            "Link copied",
          )
        }
        className={headingLinkClassName}
      >
        <Hash aria-hidden />
      </Button>
    </span>
  );
}

/** Props accepted by `MarkdownSectionMarker`. */
export interface MarkdownSectionMarkerProps {
  /** The mark's key, passed back to `onMark`. */
  markKey: string;
  /** The mark's tone. */
  tone: "warning" | "info";
  /** The marker's accessible name and tooltip. */
  label: string;
  /** Called with `markKey` on a click; without it the marker is a labelled dot. @default undefined */
  onMark?: (key: string) => void;
  /** The marker's classes (`sectionMarkClassNames.marker`, from the server-safe view). */
  className: string;
  /** The dot's classes (`sectionMarkClassNames.dot[tone]`). */
  dotClassName: string;
}

/**
 * `MarkdownSectionMarker` — a marked section's gutter marker (`sectionMarks`): a dot on the
 * section's bar beside its heading's first line, a button when the host listens for it.
 *
 * @example
 * <MarkdownSectionMarker
 *   markKey="b1"
 *   tone="warning"
 *   label="May be out of date"
 *   onMark={open}
 *   className={sectionMarkClassNames.marker}
 *   dotClassName={sectionMarkClassNames.dot.warning}
 * />
 */
export function MarkdownSectionMarker({
  markKey,
  tone,
  label,
  onMark,
  className,
  dotClassName,
}: MarkdownSectionMarkerProps) {
  const dot = <span aria-hidden className={dotClassName} />;
  if (!onMark)
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        data-slot="markdown-section-mark"
        data-tone={tone}
        className={cn(className, "cursor-default")}
      >
        {dot}
      </span>
    );
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      data-slot="markdown-section-mark"
      data-tone={tone}
      onClick={() => onMark(markKey)}
      className={className}
    >
      {dot}
    </Button>
  );
}

/** Props accepted by `MarkdownEmbed`. */
export interface MarkdownEmbedProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** The video's URL as written — a YouTube or Loom link (`embed-providers`). */
  url: string;
  /**
   * The providers shown as players: `EMBED_PROVIDERS`, or a subset. A video whose provider is not
   * here — or every video, without it — renders as a plain link, so nothing is framed until the
   * host allows the providers' origins (`EMBED_FRAME_ORIGINS`) in its `frame-src`.
   * @default undefined
   */
  providers?: EmbedProviders;
}

/**
 * `MarkdownEmbed` — a YouTube or Loom video as a facade: a 16:9 card with the provider's glyph,
 * its name and a Play button. Nothing loads from the provider until Play; then a lazy, sandboxed
 * player frame takes the card's place, its `src` rebuilt from the video id (never the URL as
 * written). Printed, it is the URL. A URL that is not an allowlisted video, or whose provider is
 * not in `providers`, renders as a link.
 *
 * @example
 * <MarkdownEmbed url="https://youtu.be/dQw4w9WgXcQ" providers={EMBED_PROVIDERS} />
 */
export function MarkdownEmbed({
  url,
  providers,
  className,
  ...props
}: MarkdownEmbedProps) {
  const match = React.useMemo(() => matchEmbed(url), [url]);
  const [playing, setPlaying] = React.useState(false);
  if (!match || !providers?.[match.provider])
    return (
      <p
        data-slot="markdown-embed-link"
        // Its anchor text is one leaf, as the embed it stands for.
        data-anchor-block=""
        data-anchor-text={LEAF_TEXT}
        className={className}
        {...props}
      >
        <a
          href={/^https:\/\//i.test(url) ? url : undefined}
          target="_blank"
          rel="noreferrer noopener"
        >
          {url}
        </a>
      </p>
    );
  const provider = EMBED_PROVIDERS[match.provider];
  const Glyph = match.provider === "youtube" ? SquarePlay : Video;
  return (
    <div
      data-slot="markdown-embed"
      data-provider={match.provider}
      data-playing={playing ? "" : undefined}
      // Its anchor text is one leaf (as in `TextEdit`'s document), never the URL it prints.
      data-anchor-block=""
      data-anchor-text={LEAF_TEXT}
      className={cn("my-2 max-w-full", className)}
      {...props}
    >
      <div
        data-slot="markdown-embed-frame"
        className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted print:hidden"
      >
        {playing ? (
          <iframe
            src={match.src}
            title={provider.label}
            loading={EMBED_FRAME_ATTRIBUTES.loading}
            referrerPolicy={EMBED_FRAME_ATTRIBUTES.referrerPolicy}
            allow={EMBED_FRAME_ATTRIBUTES.allow}
            sandbox={EMBED_FRAME_ATTRIBUTES.sandbox}
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <span className="flex min-w-0 max-w-full items-center gap-2 text-muted-foreground">
              <Glyph aria-hidden className="size-5 shrink-0" />
              <span className="truncate text-sm font-medium text-foreground">
                {provider.label}
              </span>
            </span>
            <Button
              type="button"
              aria-label={`Play ${provider.label}`}
              onClick={() => setPlaying(true)}
            >
              <Play aria-hidden data-icon="inline-start" />
              Play
            </Button>
          </div>
        )}
      </div>
      {/* Printed, the video is its address (text: a link would print it twice). */}
      <span
        data-slot="markdown-embed-url"
        className="hidden wrap-anywhere print:inline"
      >
        {url}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Block views (`blockViews`): a fence whose language maps to a renderer
 * ----------------------------------------------------------------------------------------------*/

/**
 * The server fallback's box, header and label — equal to `block-view`'s frame classes, so the
 * swap to the frame moves nothing.
 */
const blockViewClassName =
  "@container/block-view group/block-view relative w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border print:break-inside-avoid";
const blockViewHeaderClassName =
  "flex h-9 items-center gap-1 border-b border-border ps-3 pe-1.5 select-none print:hidden";
const blockViewLabelClassName =
  "min-w-0 flex-1 truncate text-xs text-muted-foreground";

const LazyBlockView = React.lazy(() =>
  import("@/components/ui/block-view").then((module) => ({
    default: module.StaticBlockView,
  })),
);

/** Props accepted by `MarkdownBlockView`. */
export interface MarkdownBlockViewProps {
  /** The `blockViews` entry for this fence's language. */
  view: import("@/components/ui/block-view").BlockView;
  /** The fence's language. */
  language: string;
  /** The fence's body. */
  source: string;
}

/**
 * `MarkdownBlockView` — a fence `MarkdownView` maps to a block view. On the server and until
 * hydration it is the source in the frame's shape, its body holding the preview's reserved height,
 * so nothing jumps when the preview takes over; then the frame loads (its own chunk) and the
 * view's `render` draws the preview.
 *
 * @example
 * <MarkdownBlockView view={mermaidBlockView} language="mermaid" source={source} />
 */
export function MarkdownBlockView({
  view,
  language,
  source,
}: MarkdownBlockViewProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const fallback = (
    <div
      data-slot="block-view"
      data-language={language}
      data-mode="source"
      className={cn(blockViewClassName, "my-2")}
    >
      <div className={blockViewHeaderClassName}>
        <span className={blockViewLabelClassName}>{view.label}</span>
      </div>
      <pre
        data-slot="block-view-fallback"
        // Inline: the prose recipe's `pre` margins (a root rule) would beat a class and pad the box.
        style={{ margin: 0 }}
        className="min-h-48 overflow-x-auto px-4 py-3 font-mono text-xs text-muted-foreground"
      >
        <code>{source}</code>
      </pre>
    </div>
  );
  if (!mounted) return fallback;
  return (
    <React.Suspense fallback={fallback}>
      <LazyBlockView view={view} language={language} source={source} />
    </React.Suspense>
  );
}
