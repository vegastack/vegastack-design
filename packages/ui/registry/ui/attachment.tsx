// @vegastack attachment@0.23.87 sha256-e0hcRMwrsWIc2ZeZyJTOyRyNzCKcLzH6E7cQYCJjixg=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, mergeRefs } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import type { FileViewerItem } from "@/components/ui/file-viewer";
import { ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import {
  tileColumnClasses,
  tileCornerClasses,
  tileGridClasses,
  tileGroupClass,
  tileOverlayButtonClasses,
  tileScrollRowClasses,
} from "@/lib/tile-overlay";

// The full-screen viewer is its own chunk, loaded the first time a tile opens it.
const LazyFileViewer = React.lazy(() =>
  import("@/components/ui/file-viewer").then((module) => ({
    default: module.FileViewer,
  })),
);

/** What a part inside an `Attachment` needs to know about its tile. */
const AttachmentTileContext = React.createContext<{
  orientation: "horizontal" | "vertical";
}>({ orientation: "horizontal" });

type PreviewEntry = () => { file: FileViewerItem; node: HTMLElement | null };

/** The nearest preview scope: the tiles that register with it page through one viewer. */
const AttachmentPreviewContext = React.createContext<{
  enabled: boolean;
  register: (key: string, entry: PreviewEntry) => () => void;
  open: (key: string) => void;
} | null>(null);

/** Document order, so the viewer pages through the tiles the way they read. */
function byDocumentOrder(a: HTMLElement | null, b: HTMLElement | null) {
  if (!a || !b || a === b) return 0;
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
}

/**
 * `AttachmentPreview` — a preview scope. Every `Attachment` with a `file` inside it opens ONE
 * `FileViewer` that pages through all of them in document order: images, PDFs, and a download
 * card for anything else. `AttachmentGroup` is a scope of its own unless one wraps it, so wrap
 * several groups (a record's file sections) or a `SortableList` of tiles in one to page across
 * them. `disabled` turns the tiles back into plain cards.
 *
 * @example
 * <AttachmentPreview>
 *   <AttachmentGroup layout="tiles">{drawings.map(tile)}</AttachmentGroup>
 *   <AttachmentGroup layout="tiles">{photos.map(tile)}</AttachmentGroup>
 * </AttachmentPreview>
 */
function AttachmentPreview({
  children,
  disabled = false,
}: {
  children?: React.ReactNode;
  /**
   * Leave the tiles inside as plain cards: no whole-tile open, no viewer.
   * @default false
   */
  disabled?: boolean;
}) {
  const entries = React.useRef(new Map<string, PreviewEntry>());
  const [viewer, setViewer] = React.useState<{
    items: FileViewerItem[];
    index: number | null;
  } | null>(null);
  const value = React.useMemo(
    () => ({
      enabled: !disabled,
      register: (key: string, entry: PreviewEntry) => {
        entries.current.set(key, entry);
        return () => {
          entries.current.delete(key);
        };
      },
      open: (key: string) => {
        const tiles = [...entries.current.entries()]
          .map(([k, entry]) => ({ key: k, ...entry() }))
          .sort((a, b) => byDocumentOrder(a.node, b.node));
        const index = tiles.findIndex((tile) => tile.key === key);
        if (index === -1) return;
        setViewer({ items: tiles.map((tile) => tile.file), index });
      },
    }),
    [disabled],
  );
  return (
    <AttachmentPreviewContext.Provider value={value}>
      {children}
      {viewer ? (
        // Stays mounted once used, so closing plays the viewer's own exit.
        <React.Suspense fallback={null}>
          <LazyFileViewer
            items={viewer.items}
            index={viewer.index}
            onIndexChange={(index) =>
              setViewer((current) => current && { ...current, index })
            }
            onOpenChange={(open) => {
              if (!open)
                setViewer((current) => current && { ...current, index: null });
            }}
          />
        </React.Suspense>
      ) : null}
    </AttachmentPreviewContext.Provider>
  );
}

const attachmentVariants = cva(
  // FOC-1 / FOC-6: upstream carries `focus-within:ring-1 focus-within:ring-ring/50` here — the
  // card wearing a ring on behalf of the invisible `AttachmentTrigger` inside it, which upstream
  // silences with `outline-none`. This system has one focus affordance and it belongs on the
  // control that has focus, so the ring is gone and the trigger paints `base.css`'s outline.
  "group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border bg-card text-card-foreground transition-colors has-[>a,>button]:hover:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed",
  {
    variants: {
      size: {
        default:
          "gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2",
        sm: "gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
        xs: "gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
        lg: "gap-2.5 text-sm has-data-[slot=attachment-content]:px-3 has-data-[slot=attachment-content]:py-2.5 has-data-[slot=attachment-media]:p-2",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",
      },
    },
    compoundVariants: [
      {
        size: "lg",
        orientation: "vertical",
        className: "w-40 has-data-[slot=attachment-content]:w-40",
      },
    ],
  },
);

type AttachmentProps = React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & {
    state?: "idle" | "uploading" | "processing" | "error" | "done";
    muted?: boolean;
    /**
     * The file this tile stands for. With it, the whole tile is one button ("Open {name}") that
     * opens the `FileViewer` — an image to zoom, a PDF to read, a download card for anything
     * else — paging through every tile in the same `AttachmentGroup` or `AttachmentPreview`.
     * @default undefined
     */
    file?: FileViewerItem;
    /**
     * Open the viewer when the tile is clicked, or Enter or Space is pressed on it. `false` keeps
     * the tile a plain card (its actions still work).
     * @default true
     */
    preview?: boolean;
    /**
     * Called instead of the built-in viewer when the tile is opened — for a host that shows the
     * file its own way. Needs `file`, which names the tile's open button.
     * @default undefined
     */
    onOpen?: (file: FileViewerItem) => void;
  };

function Attachment(props: AttachmentProps) {
  const scope = React.useContext(AttachmentPreviewContext);
  // A tile with a file and no scope around it is its own one-file scope.
  return props.file !== undefined &&
    props.preview !== false &&
    !props.onOpen &&
    scope === null ? (
    <AttachmentPreview>
      <AttachmentTile {...props} />
    </AttachmentPreview>
  ) : (
    <AttachmentTile {...props} />
  );
}

function AttachmentTile({
  className,
  state = "done",
  size = "default",
  orientation = "horizontal",
  muted = false,
  file,
  preview = true,
  onOpen,
  ref,
  children,
  ...props
}: AttachmentProps) {
  const scope = React.useContext(AttachmentPreviewContext);
  const node = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useMemo(() => mergeRefs(node, ref), [ref]);
  const key = React.useId();
  const fileRef = React.useRef(file);
  fileRef.current = file;
  const opens =
    file !== undefined && preview && (onOpen !== undefined || scope?.enabled);
  const register = scope?.register;
  const registered = file !== undefined && preview && scope?.enabled;
  React.useEffect(() => {
    if (!registered || !register) return;
    return register(key, () => ({
      file: fileRef.current!,
      node: node.current,
    }));
  }, [key, register, registered]);
  const tileContext = React.useMemo(
    () => ({ orientation: orientation ?? "horizontal" }),
    [orientation],
  );

  const tile = (
    <div
      ref={setRef}
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      data-muted={muted || undefined}
      className={cn(
        attachmentVariants({ size, orientation }),
        tileGroupClass,
        "data-muted:[&_[data-slot=attachment-media]]:opacity-50",
        className,
      )}
      {...props}
    >
      <AttachmentTileContext.Provider value={tileContext}>
        {opens && file ? (
          <AttachmentTrigger
            aria-label={`Open ${file.name}`}
            onClick={() => (onOpen ? onOpen(file) : scope?.open(key))}
          />
        ) : null}
        {children}
      </AttachmentTileContext.Provider>
    </div>
  );
  return tile;
}

const attachmentMediaVariants = cva(
  "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=lg]/attachment:group-data-[orientation=horizontal]/attachment:w-12 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 [&_[data-slot=image]]:size-full [&_img]:aspect-square [&_img]:w-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  },
);

function AttachmentMedia({
  className,
  variant = "icon",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants>) {
  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(attachmentMediaVariants({ variant }), className)}
      {...props}
    />
  );
}

function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentTitle({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      // A long name truncates; the whole of it is still one hover away.
      title={title ?? (typeof children === "string" ? children : undefined)}
      data-slot="attachment-title"
      className={cn(
        "block max-w-full min-w-0 truncate font-medium group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function AttachmentDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-description"
      className={cn(
        // A11Y-13: upstream inks the error line with `text-destructive/80` — the status FILL,
        // alpha-composited. Rasterised on `card` in this repository's tokens it measures 4.113:1
        // at 12px (axe agrees: 4.11), a live WCAG 1.4.3 failure and squarely inside the
        // 3.98–4.35 band `--destructive-text` exists for. Same pair, same rule, as Alert, Badge,
        // Toast and the soft Button: a tinted status surface reads through the family's `-text`
        // ink, never through its fill.
        "mt-0.5 block min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive-text",
        "max-w-full",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentProgress({
  value,
  max = 100,
  className,
  "aria-label": ariaLabel = "Upload progress",
  ...props
}: Omit<
  ProgressPrimitive.Root.Props,
  "value" | "max" | "children" | "getAriaValueText"
> & {
  value: number | null;
  max?: number;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="attachment-progress"
      value={value}
      max={max}
      aria-label={ariaLabel}
      getAriaValueText={
        value === null || !Number.isFinite(value)
          ? undefined
          : // Base UI hands over the raw value; the spoken percent is clamped like the bar.
            (_formatted, current) =>
              `${Math.round((Math.min(Math.max(current ?? 0, 0), max) / max) * 100)}%`
      }
      className={cn(
        "w-full basis-full group-data-[orientation=vertical]/attachment:px-1",
        className,
      )}
      {...props}
    >
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function AttachmentActions({
  className,
  side = "end",
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * A vertical tile's overlay slot: `end` is the top-right corner (remove, a ⋯ menu, download —
   * two icon actions at most), `start` the top-left (a drag handle). Both show on hover or focus
   * within the tile and always on a touch screen. A horizontal chip keeps its actions inline.
   * @default "end"
   */
  side?: "start" | "end";
}) {
  const { orientation } = React.useContext(AttachmentTileContext);
  return (
    <div
      data-slot="attachment-actions"
      data-side={side}
      className={cn(
        orientation === "vertical"
          ? tileCornerClasses[side]
          : "relative z-20 flex shrink-0 items-center",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentAction({
  className,
  variant,
  size = "icon-xs",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation } = React.useContext(AttachmentTileContext);
  return (
    <Button
      data-slot="attachment-action"
      variant={variant ?? "ghost"}
      size={size}
      // Over a tile's image the button wears the scrim, white on a blurred dark wash.
      className={cn(
        orientation === "vertical" && !variant && tileOverlayButtonClasses,
        className,
      )}
      {...props}
    />
  );
}

function AttachmentTrigger({
  className,
  render,
  type,
  ...props
}: useRender.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type: render ? type : (type ?? "button"),
        // FOC-1: upstream writes `outline-none` here, which is what made the card's
        // `focus-within` ring necessary. The trigger is the control, so the trigger takes the
        // one outline; `rounded-[inherit]` makes that outline follow the card's own corner
        // instead of cutting a rectangle across it.
        className: cn("absolute inset-0 z-10 rounded-[inherit]", className),
      },
      props,
    ),
    render,
    state: {
      slot: "attachment-trigger",
    },
  });
}

function AttachmentGroup({
  className,
  layout = "scroll",
  columns,
  preview,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * `scroll` — one row that scrolls sideways; `grid` — listing-size tiles, up to three per row
   * with 16:9 media; `tiles` — square tiles, `columns` per row at most (four by default), fewer
   * as the container narrows: three on a tablet, two on a phone; `list` — dense full-width rows
   * (a 32px icon or thumbnail, the name, a description line, trailing actions) for a folder's
   * files or an upload queue. In a row, put `AttachmentProgress` inside `AttachmentContent`, under
   * the title.
   * @default "scroll"
   */
  layout?: "scroll" | "grid" | "tiles" | "list";
  /**
   * The most tiles a row shows. `tiles`: the grid's column count on a wide container (default
   * 4). `scroll`: sizes each tile so this many fit the row and the rest scroll (without it, tiles
   * keep their own width). Never below 8.5rem a tile, so a phone shows two.
   * @default undefined
   */
  columns?: 2 | 3 | 4 | 5 | 6;
  /**
   * Whether tiles given a `file` open the `FileViewer` — one viewer paging through this group's
   * tiles, or through the enclosing `AttachmentPreview`'s. `false` keeps them plain cards.
   * @default true
   */
  preview?: boolean;
}) {
  const outer = React.useContext(AttachmentPreviewContext);
  const count =
    layout === "list"
      ? undefined
      : (columns ?? (layout === "tiles" ? 4 : undefined));
  const group = (
    <div
      data-slot="attachment-group"
      data-layout={layout}
      data-columns={count}
      className={cn(
        count ? tileColumnClasses[count] : undefined,
        layout === "list"
          ? "flex min-w-0 flex-col gap-0.5 py-1 *:data-[slot=attachment]:w-full *:data-[slot=attachment]:min-w-0 *:data-[slot=attachment]:flex-nowrap *:data-[slot=attachment]:rounded-lg *:data-[slot=attachment]:not-data-[state=error]:border-transparent *:data-[slot=attachment]:bg-transparent **:data-[slot=attachment-media]:w-8 **:data-[slot=attachment-media]:rounded-md [&_[data-slot=attachment-content]_[data-slot=attachment-progress]]:mt-1.5"
          : layout === "grid"
            ? "grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,max(--spacing(72),calc((100%_-_var(--spacing)*6)/3))),1fr))] gap-3 py-1 *:data-[slot=attachment]:w-full *:data-[slot=attachment]:min-w-0 *:data-[slot=attachment]:data-[orientation=vertical]:flex-nowrap **:data-[slot=attachment-media]:aspect-video [&_[data-slot=attachment-media]_img]:aspect-video"
            : layout === "tiles"
              ? cn(
                  tileGridClasses,
                  "min-w-0 py-1 *:data-[slot=attachment]:w-full *:data-[slot=attachment]:min-w-0 *:data-[slot=attachment]:data-[orientation=vertical]:flex-nowrap",
                )
              : cn(
                  "flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
                  // Sized to the row: `columns` tiles fit, the rest scroll.
                  count && tileScrollRowClasses,
                ),
        className,
      )}
      {...props}
    />
  );
  // The group is a preview scope of its own unless one encloses it; `preview={false}` switches it off.
  if (preview === false)
    return <AttachmentPreview disabled>{group}</AttachmentPreview>;
  // An enclosing scope decides, unless `preview` is set here explicitly.
  if (outer && (preview === undefined || outer.enabled)) return group;
  return <AttachmentPreview>{group}</AttachmentPreview>;
}

export {
  Attachment,
  AttachmentGroup,
  AttachmentPreview,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentProgress,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
};
