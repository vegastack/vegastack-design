// @vegastack block-view@0.25.93 sha256-kQJLMmPoXVeLRtBttqEGeK3koaGPVl7tXaObdE8CgWY=

"use client";

import * as React from "react";
import { Copy, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { codeBlockPreClassName } from "@/components/ui/code-block";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  BlockToolbar,
  BlockToolbarButton,
  BlockToolbarMenu,
} from "@/components/ui/block-toolbar";
import { toast } from "@/components/ui/toast";

/* ------------------------------------------------------------------------------------------------
 * Block views — a fenced block whose language a host maps to a renderer (```mermaid → a diagram).
 * One frame for both hosts: `MarkdownView` shows it in read mode, `TextEdit`'s code block node view
 * in the editor, so the read view and the editor that swaps in for it are the same box.
 *
 * Header: the view's label, [Preview | Code], Expand (a full-screen dialog with pan and pinch) and
 * a ⋯ menu (Copy source, then the view's own actions). Body: the preview, or the source; with
 * `split`, an editable block at least 45rem (720px) wide shows Code as source and live preview
 * side by side. The mode is per viewer and never written to the document.
 * ----------------------------------------------------------------------------------------------*/

/**
 * The frame: a bordered box that never splits across printed pages. `MarkdownView`'s server
 * fallback (`markdown-view-client`) draws the same box, header and label — keep the three equal.
 */
const blockViewClassName =
  "@container/block-view group/block-view relative w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border print:break-inside-avoid";
/** The header row: the label, then the controls at the end. */
const blockViewHeaderClassName =
  "flex h-9 items-center gap-1 border-b border-border ps-3 pe-1.5 select-none print:hidden";
/** The label in the header. */
const blockViewLabelClassName =
  "min-w-0 flex-1 truncate text-xs text-muted-foreground";

/** What a block view's `render` is told. */
export interface BlockViewRenderContext {
  /** Always "preview": a block view renders only its preview; the host owns the source. */
  mode: "preview";
  /** The colour scheme around the block (`.dark` on an ancestor). */
  theme: "light" | "dark";
}

/** What a block view's menu action acts on. */
export interface BlockViewActionTarget {
  /** The block's source (the fence's body). */
  source: string;
  /** The colour scheme around the block. */
  theme: "light" | "dark";
  /** The rendered preview's element when it is on screen, else `null`. */
  preview: HTMLElement | null;
}

/** An extra item in a block view's ⋯ menu, after Copy source. */
export interface BlockViewAction {
  /** The item's label: "Copy SVG". */
  label: string;
  /** A lucide icon component shown before the label. */
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /**
   * Runs when picked. A returned string is shown as a toast ("SVG copied"); a rejection shows
   * "Something went wrong".
   */
  onSelect: (
    target: BlockViewActionTarget,
  ) => void | string | undefined | Promise<void | string | undefined>;
}

/** How one fenced language renders: `blockViews={{ mermaid: mermaidBlockView }}`. */
export interface BlockView {
  /** The block's name, shown in its header: "Diagram". */
  label: string;
  /** The preview for `source`. Called on the client only; the server renders the source. */
  render: (source: string, ctx: BlockViewRenderContext) => React.ReactNode;
  /**
   * What a block opens in. A new empty block (or one still holding `starter`) always opens in
   * Code while it is being edited.
   * @default "preview"
   */
  defaultView?: "preview" | "source";
  /**
   * In the editor, Code shows source and live preview side by side when the block is at least
   * 45rem (720px) wide.
   * @default false
   */
  split?: boolean;
  /** What a new block of this kind starts with (the slash menu's and Turn into's insert). */
  starter?: string;
  /** A one-line hint shown under the source in Code mode; `null` hides it. */
  hint?: (source: string) => string | null | undefined;
  /** Extra ⋯ menu items, after Copy source. */
  actions?: readonly BlockViewAction[];
}

/** Fenced languages mapped to their block views: `{ mermaid: mermaidBlockView }`. */
export type BlockViews = Readonly<Record<string, BlockView>>;

/** A block view's mode: its preview, or its source (beside a live preview when split). */
export type BlockViewMode = "preview" | "code";

/**
 * The mode a block opens in: its view's `defaultView`, except that an editable block that is
 * empty, or still holds the view's `starter`, opens in Code.
 *
 * @example
 * const [mode, setMode] = React.useState(() => initialBlockViewMode(view, source, editable));
 */
export function initialBlockViewMode(
  view: BlockView,
  source: string,
  editable: boolean,
): BlockViewMode {
  if (
    editable &&
    (!source.trim() ||
      (view.starter != null && source.trim() === view.starter.trim()))
  )
    return "code";
  return view.defaultView === "source" ? "code" : "preview";
}

/** The colour scheme at `ref` (`.dark` on an ancestor), following class changes on the page. */
function useBlockTheme(
  ref: React.RefObject<HTMLElement | null>,
): "light" | "dark" {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
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

/** Props accepted by `BlockViewFrame`. */
export interface BlockViewFrameProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** The view drawing this block. */
  view: BlockView;
  /** The block's source. */
  source: string;
  /** The fence's language (the `blockViews` key). */
  language: string;
  /** The shown mode. */
  mode: BlockViewMode;
  /** Called when the reader picks Preview or Code (the buttons, ⌘Enter, Escape). */
  onModeChange: (mode: BlockViewMode) => void;
  /** The source pane: the editor's live code, or a read-only code block. */
  code: React.ReactNode;
  /**
   * The source is being edited: Code may split beside a live preview (`view.split`), the hint
   * shows, and a double-click on the preview opens Code.
   * @default false
   */
  editable?: boolean;
}

/**
 * `BlockViewFrame` — the shared frame of a block view (see `BlockView`): the editor's code block
 * node view and `StaticBlockView` both draw it. Hosts pass `blockViews` to `TextEdit` or
 * `MarkdownView` rather than mounting it.
 *
 * @example
 * <BlockViewFrame view={view} source={source} language="mermaid" mode={mode} onModeChange={setMode} code={<pre>{source}</pre>} />
 */
export function BlockViewFrame({
  view,
  source,
  language,
  mode,
  onModeChange,
  code,
  editable = false,
  className,
  ref,
  onKeyDown,
  ...props
}: BlockViewFrameProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const theme = useBlockTheme(rootRef);
  const [expanded, setExpanded] = React.useState(false);
  const split = editable && Boolean(view.split);
  const ctx: BlockViewRenderContext = { mode: "preview", theme };
  const hint = mode === "code" && editable ? view.hint?.(source) : null;
  const label = view.label;

  const run = async (action: BlockViewAction) => {
    try {
      const message = await action.onSelect({
        source,
        theme,
        preview: previewRef.current,
      });
      if (message) toast.add({ title: message });
    } catch {
      toast.add({ title: "Something went wrong" });
    }
  };

  return (
    <div
      ref={setRootRef}
      data-slot="block-view"
      data-language={language}
      data-mode={mode}
      data-split={split ? "" : undefined}
      className={cn(blockViewClassName, className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        // From the block's own controls: ⌘Enter toggles, Escape goes back to the preview.
        const mod = event.metaKey || event.ctrlKey;
        if (
          event.key === "Enter" &&
          mod &&
          !event.nativeEvent.isComposing &&
          event.keyCode !== 229
        ) {
          event.preventDefault();
          onModeChange(mode === "preview" ? "code" : "preview");
        } else if (event.key === "Escape" && mode === "code") {
          event.preventDefault();
          onModeChange("preview");
        }
      }}
      {...props}
    >
      <div
        data-slot="block-view-header"
        data-block-view-chrome=""
        contentEditable={false}
        className={blockViewHeaderClassName}
      >
        <span className={blockViewLabelClassName}>{label}</span>
        <div
          role="group"
          aria-label={`${label} view`}
          className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
        >
          {(["preview", "code"] as const).map((each) => (
            <Button
              key={each}
              type="button"
              variant="ghost"
              size="xs"
              aria-pressed={mode === each}
              data-slot="block-view-mode"
              // The editor keeps its focus and caret: the mode change places the caret itself.
              onMouseDown={
                editable ? (event) => event.preventDefault() : undefined
              }
              onClick={() => onModeChange(each)}
              className="h-6 px-2 font-normal text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs"
            >
              {each === "preview" ? "Preview" : "Code"}
            </Button>
          ))}
        </div>
        <BlockToolbar aria-label={`${label} actions`} placement="inline">
          <BlockToolbarButton
            label={`Expand ${label.toLowerCase()}`}
            data-slot="block-view-expand"
            onClick={() => setExpanded(true)}
          >
            <Maximize2 aria-hidden />
          </BlockToolbarButton>
          <BlockToolbarMenu label={`${label} actions`}>
            <DropdownMenuItem
              onClick={() =>
                void run({
                  label: "Copy source",
                  onSelect: async () => {
                    await navigator.clipboard.writeText(source);
                    return "Source copied";
                  },
                })
              }
            >
              <Copy aria-hidden />
              Copy source
            </DropdownMenuItem>
            {view.actions?.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.label}
                  onClick={() => void run(action)}
                >
                  {Icon ? <Icon aria-hidden /> : null}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </BlockToolbarMenu>
        </BlockToolbar>
      </div>
      <div
        data-slot="block-view-body"
        className={cn(
          "grid min-w-0 grid-cols-1",
          split &&
            mode === "code" &&
            "@min-[45rem]/block-view:grid-cols-2 @min-[45rem]/block-view:divide-x @min-[45rem]/block-view:divide-border",
        )}
      >
        <div
          data-slot="block-view-code"
          className={cn(
            "min-w-0",
            mode === "preview" && "hidden",
            // Paper gets the preview; with none mounted (Code chosen, no split) the source prints.
            (mode === "preview" || split) && "print:hidden",
          )}
        >
          {code}
          {hint ? (
            <p
              data-slot="block-view-hint"
              contentEditable={false}
              className="m-0 px-4 pb-2 text-xs text-muted-foreground select-none print:hidden"
            >
              {hint}
            </p>
          ) : null}
        </div>
        {mode === "preview" || split ? (
          <div
            ref={previewRef}
            data-slot="block-view-preview"
            data-block-view-chrome=""
            contentEditable={false}
            onMouseDown={(event) => {
              // A press on the diagram never moves the editor's caret into the hidden source.
              if (editable) event.preventDefault();
            }}
            onDoubleClick={editable ? () => onModeChange("code") : undefined}
            className={cn(
              "min-w-0",
              mode === "code" && "hidden @min-[45rem]/block-view:block",
              "print:block",
            )}
          >
            {view.render(source, ctx)}
          </div>
        ) : null}
      </div>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          data-slot="block-view-dialog"
          className="h-[calc(100dvh-2rem)] max-h-none grid-rows-[auto_minmax(0,1fr)] sm:max-w-[calc(100%-4rem)]"
        >
          <DialogTitle>{label}</DialogTitle>
          {expanded ? (
            <PanZoom label={label}>{view.render(source, ctx)}</PanZoom>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * A viewport that pans (drag, arrow keys) and zooms (pinch, ⌘/Ctrl + wheel, + / −, 0 resets) its
 * content with a CSS transform. The content starts fitted and centred.
 */
function PanZoom({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [view, setView] = React.useState({ x: 0, y: 0, scale: 1 });
  const touched = React.useRef(false);
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());

  const fit = React.useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const cw = content.offsetWidth;
    const ch = content.offsetHeight;
    if (!cw || !ch) return;
    const scale = Math.min(1, vw / cw, vh / ch);
    setView({ scale, x: (vw - cw * scale) / 2, y: (vh - ch * scale) / 2 });
  }, []);
  // Fitted until the reader moves it (the content may still be drawing).
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (!touched.current) fit();
    });
    observer.observe(content);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [fit]);

  const zoomAt = React.useCallback(
    (factor: number, cx?: number, cy?: number) => {
      touched.current = true;
      setView((v) => {
        const viewport = viewportRef.current;
        const px = cx ?? (viewport ? viewport.clientWidth / 2 : 0);
        const py = cy ?? (viewport ? viewport.clientHeight / 2 : 0);
        const scale = Math.min(8, Math.max(0.1, v.scale * factor));
        const k = scale / v.scale;
        return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    },
    [],
  );
  const pan = (dx: number, dy: number) => {
    touched.current = true;
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  // ⌘/Ctrl + wheel (and a trackpad pinch, which arrives as one) zooms at the pointer; a plain
  // wheel pans. Non-passive, so the page itself never zooms or scrolls.
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey)
        zoomAt(
          Math.exp(-event.deltaY / 200),
          event.clientX - rect.left,
          event.clientY - rect.top,
        );
      else {
        touched.current = true;
        setView((v) => ({
          ...v,
          x: v.x - event.deltaX,
          y: v.y - event.deltaY,
        }));
      }
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  return (
    <div className="relative min-h-0">
      <div
        ref={viewportRef}
        role="group"
        aria-roledescription="zoomable view"
        aria-label={`${label}. Drag or use the arrow keys to move, plus and minus to zoom.`}
        tabIndex={0}
        data-slot="block-view-pan-zoom"
        className="relative size-full cursor-grab touch-none overflow-hidden rounded-lg border border-border bg-background select-none active:cursor-grabbing"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
          });
        }}
        onPointerMove={(event) => {
          const previous = pointers.current.get(event.pointerId);
          if (!previous) return;
          const before = distance();
          pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
          });
          if (pointers.current.size >= 2) {
            const after = distance();
            const rect = event.currentTarget.getBoundingClientRect();
            const points = [...pointers.current.values()];
            const cx = (points[0]!.x + points[1]!.x) / 2 - rect.left;
            const cy = (points[0]!.y + points[1]!.y) / 2 - rect.top;
            if (before > 0 && after > 0) zoomAt(after / before, cx, cy);
          } else pan(event.clientX - previous.x, event.clientY - previous.y);
        }}
        onPointerUp={(event) => pointers.current.delete(event.pointerId)}
        onPointerCancel={(event) => pointers.current.delete(event.pointerId)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 120 : 40;
          const moves: Record<string, () => void> = {
            ArrowLeft: () => pan(step, 0),
            ArrowRight: () => pan(-step, 0),
            ArrowUp: () => pan(0, step),
            ArrowDown: () => pan(0, -step),
            "+": () => zoomAt(1.25),
            "=": () => zoomAt(1.25),
            "-": () => zoomAt(0.8),
            "0": () => {
              touched.current = false;
              fit();
            },
          };
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          move();
        }}
      >
        <div
          ref={contentRef}
          // Physical `left-0`, in RTL too: the pan and fit maths measure from the left edge.
          className="absolute top-0 left-0 w-max origin-top-left"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        >
          {children}
        </div>
      </div>
      <div
        role="group"
        aria-label="Zoom"
        className="absolute end-2 bottom-2 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-0.5 shadow-sm"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out"
          onClick={() => zoomAt(0.8)}
        >
          <Minus aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fit to screen"
          onClick={() => {
            touched.current = false;
            fit();
          }}
        >
          <RotateCcw aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom in"
          onClick={() => zoomAt(1.25)}
        >
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/** Props accepted by `StaticBlockView`. */
export interface StaticBlockViewProps {
  /** The view drawing this block. */
  view: BlockView;
  /** The fence's language. */
  language: string;
  /** The fence's body. */
  source: string;
}

/**
 * `StaticBlockView` — a read-only block view (`MarkdownView`'s): the frame with its own mode, and
 * the source in Code. `MarkdownView` loads it lazily, after hydration.
 *
 * @example
 * <StaticBlockView view={mermaidBlockView} language="mermaid" source={source} />
 */
export function StaticBlockView({
  view,
  language,
  source,
}: StaticBlockViewProps) {
  const [mode, setMode] = React.useState<BlockViewMode>(() =>
    initialBlockViewMode(view, source, false),
  );
  return (
    <BlockViewFrame
      view={view}
      source={source}
      language={language}
      mode={mode}
      onModeChange={setMode}
      className="my-2"
      code={
        <pre data-slot="code-block-pre" className={codeBlockPreClassName}>
          <code className="font-mono">{source}</code>
        </pre>
      }
    />
  );
}
