// @vegastack markdown-view@0.25.34 sha256-DB/4xf9EYJcwYd1Dlg0oREze4nC2Cy8rdTr7Mwl25iY=

"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * The client leaves of `MarkdownView` — everything it does that needs the DOM after render: the
 * table scroll cue, the outline report, the find highlights and their match bar, opening toggles
 * for print, reporting where comment highlights sit, and the heading copy-link button. The view
 * itself stays server-safe; each leaf renders only when its prop asks for it.
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

/** Every case-insensitive match of `query` in the view's text, as DOM ranges. */
function findRanges(root: HTMLElement, query: string): Range[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
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
  const haystack = text.toLocaleLowerCase();
  const at = (offset: number): [Text, number] => {
    let low = 0;
    let high = nodes.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (starts[mid]! <= offset) low = mid;
      else high = mid - 1;
    }
    return [nodes[low]!, offset - starts[low]!];
  };
  const ranges: Range[] = [];
  for (
    let index = haystack.indexOf(needle);
    index !== -1 && ranges.length < 1000;
    index = haystack.indexOf(needle, index + needle.length)
  ) {
    const range = document.createRange();
    const [startNode, startOffset] = at(index);
    const [endNode, endOffset] = at(index + needle.length - 1);
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset + 1);
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
 * view from a hidden marker it renders inside it, so the view needs no ref and stays server-safe.
 * Rendered by `MarkdownView` only when one of these props is set.
 *
 * @example
 * <MarkdownViewEffects findQuery="pricing" onFindClose={close} />
 */
export function MarkdownViewEffects({
  outline,
  onOutlineChange,
  onAnnotationsLayout,
  annotationIds,
  findQuery,
  onFindClose,
  printToggles = false,
  findLabels,
}: MarkdownViewEffectsProps) {
  const markerRef = React.useRef<HTMLSpanElement>(null);
  const root = () =>
    markerRef.current?.closest<HTMLElement>("[data-slot=markdown-view]") ??
    null;

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
  const hasLayout = onAnnotationsLayout !== undefined;
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
  }, [annotationsKey, hasLayout]);

  // Find: every match highlighted (CSS Custom Highlight API, no DOM change), one current.
  const query = findQuery?.trim() ?? "";
  const [matches, setMatches] = React.useState<Range[]>([]);
  const [current, setCurrent] = React.useState(0);
  const { announce, Announcer } = useAnnouncer();
  const labels = { ...defaultFindLabels, ...findLabels };
  React.useEffect(() => {
    const view = root();
    if (!view || !query) {
      setMatches([]);
      return;
    }
    const found = findRanges(view, query);
    setMatches(found);
    setCurrent(0);
    const registry = highlights();
    const Highlight = HighlightClass();
    if (registry && Highlight)
      registry.set(FIND_HIGHLIGHT, new Highlight(...found));
    announce(found.length ? labels.position(1, found.length) : labels.none);
    return () => {
      registry?.delete(FIND_HIGHLIGHT);
      registry?.delete(FIND_CURRENT);
    };
    // Labels are strings the host passes per render; the query and view are the inputs.
  }, [query]);
  React.useEffect(() => {
    const range = matches[current];
    if (!range) return;
    openAncestors(range.startContainer);
    const registry = highlights();
    const Highlight = HighlightClass();
    if (registry && Highlight) registry.set(FIND_CURRENT, new Highlight(range));
    const target = range.startContainer.parentElement;
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [matches, current]);

  const step = (by: number) => {
    if (!matches.length) return;
    const next = (current + by + matches.length) % matches.length;
    setCurrent(next);
    announce(labels.position(next + 1, matches.length));
  };

  return (
    <>
      <span ref={markerRef} hidden data-slot="markdown-view-marker" />
      {query ? (
        // A zero-height sticky row: the bar floats over the text's top end and never moves it.
        <div className="pointer-events-none sticky top-2 z-10 flex h-0 justify-end print:hidden">
          <div
            data-slot="markdown-find-bar"
            role="search"
            aria-label={labels.label}
            className="pointer-events-auto flex h-8 items-center gap-0.5 rounded-lg border border-border bg-popover ps-2.5 pe-0.5 font-sans text-sm text-popover-foreground shadow-md"
            onKeyDown={(event) => {
              if (event.key === "Escape" && onFindClose) {
                event.preventDefault();
                onFindClose();
              } else if (event.key === "Enter") {
                event.preventDefault();
                step(event.shiftKey ? -1 : 1);
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
            <Announcer />
          </div>
        </div>
      ) : null}
    </>
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
 * `MarkdownHeadingLink` — the copy-link button after a heading (`headingLinkHref`): hidden until
 * the heading is hovered or the button focused, always shown on a coarse pointer. A press copies
 * the section's absolute link.
 *
 * @example
 * <MarkdownHeadingLink href="#pricing~a1b2c3d4" heading="Pricing" />
 */
export function MarkdownHeadingLink({
  href,
  heading,
}: MarkdownHeadingLinkProps) {
  const [absolute, setAbsolute] = React.useState(href);
  React.useEffect(() => {
    setAbsolute(new URL(href, window.location.href).href);
  }, [href]);
  return (
    <CopyButton
      data-slot="markdown-heading-link"
      value={absolute}
      size="icon-xs"
      copyLabel={`Copy link to “${heading}”`}
      copiedLabel="Link copied"
      className="ms-1 align-middle font-sans text-muted-foreground opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 print:hidden"
    />
  );
}
