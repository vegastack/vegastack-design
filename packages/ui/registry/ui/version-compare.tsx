// @vegastack version-compare@0.116.0 sha256-3hgsZIKc2ccaNdMiePz3gfkYQUtTYIYtsc4pdFxRFAk=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiffView } from "@/components/ui/diff-view";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/components/ui/use-media-query";
import {
  VersionList,
  type VersionItem,
  type VersionListProps,
} from "@/components/ui/version-list";

/* ------------------------------------------------------------------------------------------------
 * VersionCompare — a document's history at full size: the selected version on the start side,
 * the versions beside it, and the actions on it (Restore this version, Copy) pinned at the foot.
 * ----------------------------------------------------------------------------------------------*/

/** Holds the 40rem probe out of the layout: no box, nothing seen, nothing hit. */
const PROBE_FRAME: React.CSSProperties = {
  position: "absolute",
  insetInline: 0,
  top: 0,
  height: 0,
  overflow: "hidden",
  visibility: "hidden",
  pointerEvents: "none",
};

/** Props accepted by `VersionCompare`. */
export interface VersionCompareProps
  extends
    Omit<React.ComponentPropsWithRef<"div">, "onSelect">,
    Pick<
      VersionListProps,
      | "currentId"
      | "namedOnly"
      | "onNamedOnlyChange"
      | "loadMore"
      | "loading"
      | "emptyState"
      | "heading"
      | "now"
    > {
  /** The versions, newest first — grouped by day in the list. */
  versions: readonly VersionItem[];
  /** The selected version, shown in the preview. @default null */
  selectedId?: string | null;
  /** Called when a version is picked (a click, or the arrow keys in the list). @default undefined */
  onSelect?: (id: string) => void;
  /** Show the selected version's changes (controlled). @default false */
  showChanges?: boolean;
  /** Called from the "Show changes" switch; the switch shows when set. @default undefined */
  onShowChangesChange?: (showChanges: boolean) => void;
  /**
   * The selected version as it reads — the host's renderer (`MarkdownView`, a read-only
   * `TextEdit`), or its own diff rendering while `showChanges` is on and no `diff` is given.
   * @default undefined
   */
  preview?: React.ReactNode;
  /**
   * The two texts to compare while `showChanges` is on: the preview shows them through
   * `DiffView` (added and removed words in reading order). @default undefined
   */
  diff?: { before: string; after: string } | null;
  /**
   * The actions on the selected version — Restore this version, Copy — in a footer that stays
   * put while the preview and the list scroll. @default undefined
   */
  actions?: React.ReactNode;
  /** More controls beside "Show changes" (a compare-with toggle, Name this version). @default undefined */
  toolbar?: React.ReactNode;
  /** The "Show changes" switch's label. @default "Show changes" */
  showChangesLabel?: string;
  /** The preview region's name. @default "Selected version" */
  previewLabel?: string;
  /** The phone's back button, from the preview to the list. @default "Versions" */
  backLabel?: string;
  /**
   * The side a phone shows (controlled) — `"preview"` opens straight on the selected version, as
   * a link to one checkpoint's changes does. Pair with `onPhoneViewChange`. Ignored at 640px and
   * up, where both sides show. @default undefined
   */
  phoneView?: "list" | "preview";
  /** The side a phone shows first (uncontrolled). @default "list" */
  defaultPhoneView?: "list" | "preview";
  /**
   * Called when the reader moves between the sides on a phone: `"preview"` on picking a version,
   * `"list"` from the back button. @default undefined
   */
  onPhoneViewChange?: (view: "list" | "preview") => void;
}

/**
 * `VersionCompare` — a document's version history at full size, for `DialogContent
 * size="fullscreen"`: the selected version's text on the start side (its changes through
 * `DiffView` while `showChanges` is on), the versions in a `VersionList` beside it — grouped by
 * day, an agent's versions under the agent avatar — on `ResizablePanels`, and `actions` (Restore
 * this version, Copy) in a footer that stays put while both sides scroll. Narrower than 640px (its
 * own width, so a side panel on a wide window counts as narrow) the list comes first and picking a
 * version pushes its preview in, with a back button to the list;
 * `phoneView` / `defaultPhoneView` open it on the preview instead.
 *
 * @example
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent size="fullscreen">
 *     <DialogHeader><DialogTitle>History · Pricing v2</DialogTitle></DialogHeader>
 *     <VersionCompare versions={versions} selectedId={selected} onSelect={setSelected}
 *       currentId={versions[0]?.id} showChanges={showChanges} onShowChangesChange={setShowChanges}
 *       preview={<MarkdownView typeScale="document">{text}</MarkdownView>}
 *       diff={showChanges ? { before: previous, after: text } : null}
 *       actions={<><Button variant="outline" onClick={copy}>Copy</Button>
 *         <Button onClick={restore}>Restore this version</Button></>} />
 *   </DialogContent>
 * </Dialog>
 */
export function VersionCompare({
  versions,
  selectedId = null,
  onSelect,
  currentId,
  namedOnly,
  onNamedOnlyChange,
  loadMore,
  loading,
  emptyState,
  heading,
  now,
  showChanges = false,
  onShowChangesChange,
  preview,
  diff,
  actions,
  toolbar,
  showChangesLabel = "Show changes",
  previewLabel = "Selected version",
  backLabel = "Versions",
  phoneView,
  defaultPhoneView = "list",
  onPhoneViewChange,
  className,
  ref,
  ...props
}: VersionCompareProps) {
  const switchId = React.useId();
  // Side by side only when the component itself has room: a 320px side panel on a wide window
  // gets the one-side-at-a-time layout. Until it is measured, the window's width stands in. The
  // layout widths (`offsetWidth`) ignore a dialog's opening zoom, and a hidden 40rem probe, watched
  // with the root, notices a root font-size change that leaves the root's own box as it was.
  const windowWide = useMediaQuery("(min-width: 40rem)");
  const [ownWide, setOwnWide] = React.useState<boolean | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const probeRef = React.useRef<HTMLDivElement>(null);
  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  /** Focus was inside when the layout flipped: the flip unmounts it, so it is put back. */
  const refocus = React.useRef(false);
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    const probe = probeRef.current;
    if (!root || !probe || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const next = root.offsetWidth >= probe.offsetWidth;
      setOwnWide((was) => {
        if (was !== null && was !== next)
          refocus.current = root.contains(document.activeElement);
        return next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(probe);
    return () => observer.disconnect();
  }, []);
  const wide = ownWide ?? windowWide;
  // On a phone one side shows at a time: the list first (unless the host opens the preview), a
  // picked version's preview pushed in.
  const [viewState, setViewState] = React.useState(defaultPhoneView);
  const view = phoneView ?? viewState;
  const phonePreview = !wide && view === "preview";
  // Moving between the sides unmounts the focused control: focus follows the reader — to Back on
  // the way in, to the selected version on the way out. A move the host makes on its own leaves
  // focus where it is, and so does a move the host declines: every request re-renders, so the
  // effect settles it in the same commit as the host's answer.
  const back = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const moving = React.useRef<"list" | "preview" | null>(null);
  const [requests, setRequests] = React.useState(0);
  const setView = (next: "list" | "preview") => {
    moving.current = next;
    setRequests((count) => count + 1);
    if (phoneView === undefined) setViewState(next);
    onPhoneViewChange?.(next);
  };
  React.useEffect(() => {
    const target = moving.current;
    moving.current = null;
    if (target === null || target !== view) return;
    if (view === "preview") back.current?.focus();
    else
      listRef.current
        ?.querySelector<HTMLElement>(
          "[data-slot=version-list-item][data-selected]",
        )
        ?.focus();
  }, [view, requests]);
  // A flip between the layouts (the box resized) keeps focus inside: on the selected version (else
  // the first), or on Back when only the preview shows.
  React.useLayoutEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const root = rootRef.current;
    if (!root || root.contains(document.activeElement)) return;
    (
      root.querySelector<HTMLElement>(
        "[data-slot=version-list-item][data-selected]",
      ) ??
      root.querySelector<HTMLElement>("[data-slot=version-list-item]") ??
      back.current
    )?.focus();
  }, [wide]);

  const list = (
    <VersionList
      versions={versions}
      selectedId={selectedId}
      onSelect={onSelect}
      currentId={currentId}
      namedOnly={namedOnly}
      onNamedOnlyChange={onNamedOnlyChange}
      loadMore={loadMore}
      loading={loading}
      emptyState={emptyState}
      heading={heading}
      now={now}
      groupBy="day"
    />
  );

  const previewPane = (
    <section
      aria-label={previewLabel}
      data-slot="version-compare-preview"
      className="flex h-full min-h-0 min-w-0 flex-col gap-3"
    >
      {!wide || onShowChangesChange || toolbar ? (
        <div
          data-slot="version-compare-toolbar"
          className="flex min-h-8 shrink-0 flex-wrap items-center gap-x-4 gap-y-2"
        >
          {!wide ? (
            <Button
              variant="ghost"
              size="sm"
              className="-ms-2"
              ref={back}
              onClick={() => setView("list")}
            >
              <ChevronLeft aria-hidden />
              {backLabel}
            </Button>
          ) : null}
          {onShowChangesChange ? (
            <span className="flex items-center gap-2">
              <Switch
                id={switchId}
                checked={showChanges}
                onCheckedChange={(checked) => onShowChangesChange(checked)}
              />
              <Label htmlFor={switchId}>{showChangesLabel}</Label>
            </span>
          ) : null}
          {toolbar}
        </div>
      ) : null}
      <div
        data-slot="version-compare-preview-body"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {showChanges && diff ? (
          <DiffView before={diff.before} after={diff.after} />
        ) : (
          preview
        )}
      </div>
    </section>
  );

  return (
    <div
      ref={setRootRef}
      data-slot="version-compare"
      data-view={wide ? undefined : view}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 flex-col gap-4",
        className,
      )}
      {...props}
    >
      <div aria-hidden style={PROBE_FRAME}>
        <div ref={probeRef} style={{ width: "40rem", height: 0 }} />
      </div>
      {wide ? (
        <ResizablePanelGroup
          orientation="horizontal"
          data-slot="version-compare-panels"
          className="min-h-0 flex-1"
        >
          <ResizablePanel defaultSize="68" minSize="40">
            <div className="h-full min-w-0 pe-4">{previewPane}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="32" minSize={240} maxSize="50">
            <div
              data-slot="version-compare-list"
              className="h-full min-w-0 overflow-y-auto overscroll-contain ps-4"
            >
              {list}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : phonePreview ? (
        <div
          key="preview"
          className="flex min-h-0 flex-1 flex-col motion-enter-up"
        >
          {previewPane}
        </div>
      ) : (
        <div
          key="list"
          ref={listRef}
          data-slot="version-compare-list"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          // A picked row (a tap, or Enter) pushes its preview in; the arrow keys only move.
          onClick={(event) => {
            if (
              (event.target as HTMLElement).closest(
                "[data-slot=version-list-item]",
              )
            )
              setView("preview");
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.target as HTMLElement).closest(
                "[data-slot=version-list-item]",
              )
            ) {
              // Focus moves to Back as the preview opens: the key must not press it as well.
              event.preventDefault();
              setView("preview");
            }
          }}
        >
          {list}
        </div>
      )}
      {actions && (wide || phonePreview) ? (
        <div
          data-slot="version-compare-actions"
          className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end"
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
