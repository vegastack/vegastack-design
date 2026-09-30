// @vegastack folder-tree@0.23.80 sha256-v2ZH8rcPfKk5pBRFmOQ+PPOV15AsWpX7kDunMGWlxwo=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@vegastack/design";
import {
  ChevronRightIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncer } from "@/components/ui/use-announcer";
import {
  useDragInto,
  type DragIntoFileEntry,
} from "@/components/ui/use-drag-reorder";
import { useListNav } from "@/components/ui/use-list-nav";
import { FileTypeIcon } from "@/lib/file-kind";

/* ---
`FolderTree` is the navigation tree of a file library, in the shape Notion's sidebar made
familiar: sections ("Shared", "Private") holding folders, pages and files, each folder a
disclosure whose children load when it first opens. It is a NAVIGATION pattern, not an ARIA
tree: a `<nav>` of nested lists, each row a link (`aria-current="page"` when it is the open
item) with a disclosure button beside it (`aria-expanded`), the structure `SidebarMenuSub` uses.
The system records a stance against `role="tree"` — editing controls inside tree items trap a
screen reader (see `filter-bar-managed`) — and a row here carries a ⋯ menu.

The keyboard model is still a tree's. The whole tree is ONE tab stop (a roving tab index over
the visible rows, `useListNav`); ↑/↓ move, → opens a folder and then enters it, ← closes it and
then climbs to its parent, Home/End jump, `*` opens every folder beside the current one, a
letter jumps to the next row starting with it, and Enter follows the link. The active row's ⋯
button is the only other tab stop (`FolderTreeRowAction`).

Everything the tree shows is the host's data: `rootItems` per section, children through
`loadChildren` (cached here) or a controlled `childrenOf`, the expanded ids (`expanded`, so the
host can persist them) and the moves (`onMove`, which may be async — the tree shows the new
place only once the host's data says so). A pointer drag moves an item INTO a folder or a
section (`useDragInto`: the middle half of a folder row, a 600 ms rest opens a closed one;
yourself, a descendant or the place it already is are refused, plus the host's `canDropInto`).
With a `dragScope` the tree shares drags with a `DataList` and `BreadcrumbDropTarget`s naming the
same scope: list rows drop onto tree folders and section headings, and tree rows onto list folders
and crumbs — every drag carries the host's own ids. A section heading with an `href` is a link to
the section's page, with its open/close on a chevron beside it. The keyboard path for a move is
the host's own "Move…" item in the row menu, typically opening a Move dialog with this same tree
in `mode="picker"` — folders only, one selected, no menus, no drag.

Deliberately NOT done here: fetching, renaming inline, multi-select, manual ordering (a tree
sorted by name has no order to drag into), and file uploads onto a row.
--- */

/** One item in the tree. */
export interface FolderTreeNode {
  /** Stable id — the key for `expanded`, `activeId`, `selected`, `childrenOf` and moves. */
  id: string;
  /** The row's name. */
  label: string;
  /** A folder opens to children; a page and a file are leaves. */
  kind: "folder" | "page" | "file";
  /**
   * Replaces the default icon — a page's emoji, say. Folders default to an open or closed
   * folder, pages to a document, files to their `FileTypeIcon`.
   */
  icon?: React.ReactNode;
  /** Where the row links. Without it the row is a button that calls `onOpen`. */
  href?: string;
  /**
   * `false` marks a folder known to be empty: it never calls `loadChildren`, shows a spacer in
   * place of its disclosure (the row carries `data-leaf`), and → does nothing on it.
   */
  hasChildren?: boolean;
  /** A file's MIME type, for its icon. */
  contentType?: string;
  /** A trailing count or badge (an unread count, "3"). */
  badge?: React.ReactNode;
}

/** A section heading ("Shared", "Private") and the root items under it. */
export interface FolderTreeSection {
  /** The key into `rootItems`. */
  id: string;
  /** The heading. */
  label: string;
  /** A trailing action on the heading — typically a `FolderTreeRowAction` "+" menu. */
  action?: React.ReactNode;
  /**
   * Make the heading a link to the section's own page ("Shared" → `/library`). It is marked
   * active (`aria-current="page"`) when `activeId` is the section's `id`, and its open/close
   * moves to a chevron button beside it. Ignored in picker mode.
   * @default undefined
   */
  href?: string;
}

/** A requested move — what `onMove` receives. */
export interface FolderTreeMove {
  /** The moved item ids. */
  ids: string[];
  /** The folder they move into, or `null` for the top of `targetSection`. */
  targetId: string | null;
  /** The section of the target. */
  targetSection: string;
}

/** Desktop files dropped on the tree — what `onDropFiles` receives. */
export interface FolderTreeFileDrop {
  /** The folder they drop into, or `null` for the top of `targetSection`. */
  targetId: string | null;
  /** The section of the target. */
  targetSection: string;
  /** Every dropped file, with its path inside the drop. */
  entries: DragIntoFileEntry[];
}

/** Every string the tree renders or announces. */
export interface FolderTreeLabels {
  /** Screen-reader text of a loading row. */
  loading: string;
  /** An opened folder with nothing in it. */
  empty: string;
  /** A folder whose children failed to load. */
  error: string;
  /** The retry control on that row. */
  retry: string;
  /** The last row of a long folder. */
  showAll: (hidden: number) => string;
  /** The disclosure button's name. */
  toggle: (label: string) => string;
  /** The chevron button of a section heading that is a link (`FolderTreeSection.href`). */
  toggleSection: (label: string) => string;
  /** Announced after a drop. */
  moved: (label: string, target: string) => string;
  /**
   * Names the moved items in `moved` and `moveFailed` when the tree cannot name them: several
   * rows, or a row dragged in from a list through `dragScope`.
   */
  itemCount: (count: number) => string;
  /** Announced when `onMove`'s promise rejects. */
  moveFailed: (label: string) => string;
}

const DEFAULT_LABELS: FolderTreeLabels = {
  loading: "Loading…",
  empty: "Empty",
  error: "Couldn't load",
  retry: "Retry",
  showAll: (hidden) => `Show all · ${hidden} more`,
  toggle: (label) => `${label} folder`,
  toggleSection: (label) => `${label} section`,
  moved: (label, target) => `Moved ${label} to ${target}`,
  itemCount: (count) => (count === 1 ? "1 item" : `${count} items`),
  moveFailed: (label) => `Couldn't move ${label}`,
};

/** Props accepted by `FolderTree`. */
export interface FolderTreeProps extends Omit<
  React.ComponentPropsWithRef<"nav">,
  "children" | "onSelect"
> {
  /** The tree's accessible name ("Library"). */
  "aria-label": string;
  /**
   * `nav` — links, menus and drag; `picker` — folders only, one `selected`, no menus, no drag,
   * for a Move dialog.
   * @default "nav"
   */
  mode?: "nav" | "picker";
  /**
   * Section headings, in order. Without them `rootItems`' keys render in order, headless.
   * @default undefined
   */
  sections?: FolderTreeSection[];
  /** The top-level items of each section, keyed by section id. */
  rootItems: Record<string, FolderTreeNode[]>;
  /**
   * Load a folder's children the first time it opens (and again on Retry). The result is cached
   * unless `childrenOf` holds the folder.
   * @default undefined
   */
  loadChildren?: (id: string) => Promise<FolderTreeNode[]>;
  /**
   * Children the host already holds, by folder id — they win over the cache. `undefined` for a
   * folder means "not loaded yet".
   * @default undefined
   */
  childrenOf?: Record<string, FolderTreeNode[] | undefined>;
  /** The open folders' ids. */
  expanded: string[];
  /** Called with the new list when a folder opens or closes. */
  onExpandedChange: (ids: string[]) => void;
  /**
   * Closed section ids. Uncontrolled (all open) unless set.
   * @default undefined
   */
  collapsedSections?: string[];
  /**
   * Called when a section heading opens or closes.
   * @default undefined
   */
  onCollapsedSectionsChange?: (ids: string[]) => void;
  /**
   * The item the page shows — `aria-current="page"` and the active tint.
   * @default undefined
   */
  activeId?: string;
  /**
   * Picker mode: the chosen folder.
   * @default undefined
   */
  selected?: string;
  /**
   * Picker mode: called when a folder is chosen.
   * @default undefined
   */
  onSelectedChange?: (id: string) => void;
  /**
   * Called when a row without an `href` is opened (click or Enter).
   * @default undefined
   */
  onOpen?: (node: FolderTreeNode) => void;
  /**
   * The row's trailing actions — a `FolderTreeRowAction` ⋯ menu trigger. Shown on hover, on
   * focus and on the active row. Not rendered in picker mode.
   * @default undefined
   */
  renderRowActions?: (node: FolderTreeNode) => React.ReactNode;
  /**
   * Move items by pointer drag. Omit it and nothing drags. May return a promise.
   * @default undefined
   */
  onMove?: (move: FolderTreeMove) => void | Promise<void>;
  /**
   * Whether a move is allowed, asked after the tree's own rules (an item into itself, its own
   * descendant, or the place it already sits is refused for every id the tree holds). It is the
   * only rule for ids the tree does not hold — rows dragged in from a list through `dragScope`,
   * whose place the tree cannot know. A refused target shows `data-drop-invalid` and takes
   * nothing.
   * @default undefined
   */
  canDropInto?: (move: FolderTreeMove) => boolean;
  /**
   * Share drags with other `useDragInto` users naming the same scope: folders and section
   * headings take rows and cards dragged from a `DataList` with this `dragScope`, and the tree's
   * own rows can be dropped on that list's folder rows and on `BreadcrumbDropTarget`s. Every drag
   * carries the host's node or row ids. Needs `onMove`.
   * @default undefined
   */
  dragScope?: string;
  /**
   * Desktop files dropped on a folder (its middle half) or a section heading (`targetId`
   * `null`, the top of `targetSection`): the target washes as for a move, a rest opens a closed
   * folder, and an outer `useFileDrop` surface does not take the drop. Folders dropped keep their
   * structure in each entry's `relativePath`. Works without `onMove`; not in picker mode.
   * @default undefined
   */
  onDropFiles?: (drop: FolderTreeFileDrop) => void;
  /**
   * Called with the folder desktop files are over (a section heading reports its section id), and
   * `null` when they leave it — to name the destination in the host's drop hint.
   * @default undefined
   */
  onFilesOver?: (id: string | null) => void;
  /**
   * The most children a folder lists before a "Show all" row.
   * @default 200
   */
  maxChildren?: number;
  /**
   * Called by the "Show all" row. Without it the row lists the rest in place.
   * @default undefined
   */
  onShowAll?: (id: string) => void;
  /**
   * The element a row's link renders — a framework `Link`. Receives `href` and the row's props.
   * @default undefined
   */
  linkRender?: useRender.RenderProp;
  /**
   * Override any rendered or announced string.
   * @default undefined
   */
  labels?: Partial<FolderTreeLabels>;
}

type SectionView = {
  id: string;
  label: string;
  action?: React.ReactNode;
  href?: string;
};

/** One focusable row, in visible order. */
type NavRow =
  | { type: "section"; key: string; section: SectionView }
  | {
      type: "node";
      key: string;
      node: FolderTreeNode;
      section: string;
      parentKey: string | null;
    }
  | { type: "retry"; key: string; folderId: string; parentKey: string }
  | { type: "show-all"; key: string; folderId: string; parentKey: string };

/** What a row part reads: its own tab index, for `FolderTreeRowAction`. */
const RowContext = React.createContext<{ tabIndex: number }>({ tabIndex: -1 });

const EMPTY: readonly string[] = [];

const nodeKey = (id: string) => `n:${id}`;
const sectionKey = (id: string) => `s:${id}`;

/**
 * `FolderTree` — a Notion-style navigation tree for a file library: sections of folders, pages
 * and files; folders that load their children on first open (with loading, error and empty
 * rows, and a "Show all" row past `maxChildren`); one tab stop with tree-style arrow keys; a ⋯
 * menu per row; pointer drag into a folder or section; and a folders-only `picker` mode for a
 * Move dialog.
 *
 * @example
 * <FolderTree
 *   aria-label="Library"
 *   sections={[{ id: "shared", label: "Shared" }, { id: "private", label: "Private" }]}
 *   rootItems={{ shared: sharedTop, private: privateTop }}
 *   loadChildren={(id) => fetchChildren(id)}
 *   expanded={expanded}
 *   onExpandedChange={setExpanded}
 *   activeId={openId}
 *   renderRowActions={(node) => <RowMenu node={node} />}
 *   onMove={(move) => moveItems(move)}
 * />
 */
function FolderTree({
  mode = "nav",
  sections,
  rootItems,
  loadChildren,
  childrenOf,
  expanded,
  onExpandedChange,
  collapsedSections: collapsedSectionsProp,
  onCollapsedSectionsChange,
  activeId,
  selected,
  onSelectedChange,
  onOpen,
  renderRowActions,
  onMove,
  canDropInto,
  dragScope,
  onDropFiles,
  onFilesOver,
  maxChildren = 200,
  onShowAll,
  linkRender,
  labels: labelsProp,
  className,
  onKeyDown,
  ...props
}: FolderTreeProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const picker = mode === "picker";
  const [cache, setCache] = React.useState<Record<string, FolderTreeNode[]>>(
    {},
  );
  const [status, setStatus] = React.useState<
    Record<string, "loading" | "error">
  >({});
  const [shownAll, setShownAll] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [collapsedLocal, setCollapsedLocal] =
    React.useState<readonly string[]>(EMPTY);
  const collapsedSections = collapsedSectionsProp ?? collapsedLocal;
  const expandedSet = React.useMemo(() => new Set(expanded), [expanded]);
  const { announce, Announcer } = useAnnouncer();
  const idBase = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const sectionList: SectionView[] = React.useMemo(
    () => sections ?? Object.keys(rootItems).map((id) => ({ id, label: "" })),
    [sections, rootItems],
  );
  const headed = sections !== undefined;

  /** A folder's children as far as the tree knows: host data, then the cache. */
  const childrenFor = React.useCallback(
    (node: FolderTreeNode): FolderTreeNode[] | undefined => {
      if (node.kind !== "folder") return undefined;
      if (node.hasChildren === false) return [];
      const list = childrenOf?.[node.id] ?? cache[node.id];
      if (!list) return undefined;
      return picker ? list.filter((child) => child.kind === "folder") : list;
    },
    [cache, childrenOf, picker],
  );

  const rootsFor = React.useCallback(
    (section: string) => {
      const list = rootItems[section] ?? [];
      return picker ? list.filter((node) => node.kind === "folder") : list;
    },
    [picker, rootItems],
  );

  // ---- lazy children -----------------------------------------------------------------------

  const loadRef = React.useRef(loadChildren);
  loadRef.current = loadChildren;
  const inFlight = React.useRef(new Set<string>());
  const load = React.useCallback((id: string) => {
    const loader = loadRef.current;
    if (!loader || inFlight.current.has(id)) return;
    inFlight.current.add(id);
    setStatus((prev) => ({ ...prev, [id]: "loading" }));
    loader(id).then(
      (children) => {
        inFlight.current.delete(id);
        setCache((prev) => ({ ...prev, [id]: children }));
        setStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      },
      () => {
        inFlight.current.delete(id);
        setStatus((prev) => ({ ...prev, [id]: "error" }));
      },
    );
  }, []);

  // ---- the visible rows, in order ----------------------------------------------------------

  const { rows, parentOf, sectionOf, byId } = React.useMemo(() => {
    const rows: NavRow[] = [];
    const parentOf = new Map<string, string | null>();
    const sectionOf = new Map<string, string>();
    const byId = new Map<string, FolderTreeNode>();
    const walk = (
      nodes: FolderTreeNode[],
      section: string,
      parentId: string | null,
      parentKey: string | null,
      visible: boolean,
    ) => {
      for (const node of nodes) {
        parentOf.set(node.id, parentId);
        sectionOf.set(node.id, section);
        byId.set(node.id, node);
        if (visible)
          rows.push({
            type: "node",
            key: nodeKey(node.id),
            node,
            section,
            parentKey,
          });
        const children = childrenFor(node);
        const open = visible && expandedSet.has(node.id);
        if (node.kind === "folder" && open && status[node.id] === "error")
          rows.push({
            type: "retry",
            key: `r:${node.id}`,
            folderId: node.id,
            parentKey: nodeKey(node.id),
          });
        if (!children) continue;
        const capped =
          open && !shownAll.has(node.id) && children.length > maxChildren;
        walk(
          capped ? children.slice(0, maxChildren) : children,
          section,
          node.id,
          nodeKey(node.id),
          open,
        );
        if (capped)
          rows.push({
            type: "show-all",
            key: `a:${node.id}`,
            folderId: node.id,
            parentKey: nodeKey(node.id),
          });
      }
    };
    for (const section of sectionList) {
      const open = !collapsedSections.includes(section.id);
      if (headed)
        rows.push({ type: "section", key: sectionKey(section.id), section });
      walk(
        rootsFor(section.id),
        section.id,
        null,
        headed ? sectionKey(section.id) : null,
        open,
      );
    }
    return { rows, parentOf, sectionOf, byId };
  }, [
    childrenFor,
    collapsedSections,
    expandedSet,
    headed,
    maxChildren,
    rootsFor,
    sectionList,
    shownAll,
    status,
  ]);

  // Open folders with nothing known yet load now — on first open, and for a persisted `expanded`.
  React.useEffect(() => {
    for (const row of rows) {
      if (row.type !== "node" || row.node.kind !== "folder") continue;
      const id = row.node.id;
      if (!expandedSet.has(id) || status[id]) continue;
      if (childrenFor(row.node) === undefined) load(id);
    }
  }, [childrenFor, expandedSet, load, rows, status]);

  const keys = React.useMemo(() => rows.map((row) => row.key), [rows]);
  const indexOf = React.useMemo(
    () => new Map(keys.map((key, index) => [key, index])),
    [keys],
  );

  // ---- roving focus ------------------------------------------------------------------------

  // The home row: the selected folder, the open item, or a linked section heading that is open.
  const homeId = picker ? selected : activeId;
  const homeKey =
    homeId === undefined
      ? undefined
      : !picker &&
          !indexOf.has(nodeKey(homeId)) &&
          sectionList.some((s) => s.id === homeId && s.href !== undefined)
        ? sectionKey(homeId)
        : nodeKey(homeId);
  const nav = useListNav({
    count: rows.length,
    defaultActiveIndex: homeKey ? (indexOf.get(homeKey) ?? 0) : 0,
  });
  const focusedKey = React.useRef<string | null>(null);
  // Rows come and go above the focused one as folders open: keep the tab stop on the same ROW.
  React.useLayoutEffect(() => {
    const key = focusedKey.current ?? homeKey;
    const index = key !== undefined ? indexOf.get(key) : undefined;
    if (index !== undefined && index !== nav.activeIndex)
      nav.setActiveIndex(index);
  }, [homeKey, indexOf, nav]);

  const focusKey = (key: string | null | undefined) => {
    if (!key) return;
    const index = indexOf.get(key);
    if (index !== undefined) nav.focusIndex(index);
  };

  const setExpanded = (id: string, open: boolean) => {
    if (open === expandedSet.has(id)) return;
    onExpandedChange(
      open ? [...expanded, id] : expanded.filter((value) => value !== id),
    );
  };

  const setSectionOpen = (id: string, open: boolean) => {
    const next = open
      ? collapsedSections.filter((value) => value !== id)
      : [...collapsedSections, id];
    if (collapsedSectionsProp === undefined) setCollapsedLocal(next);
    onCollapsedSectionsChange?.(next);
  };

  const typeahead = React.useRef({ text: "", at: 0 });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const target = event.target as HTMLElement;
    const key = target.getAttribute("data-folder-tree-key");
    if (!key) return; // a row action, or a host control inside a row
    const row = rows[indexOf.get(key) ?? -1];
    if (!row) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward) {
      event.preventDefault();
      if (row.type === "section") {
        if (collapsedSections.includes(row.section.id))
          setSectionOpen(row.section.id, true);
        else if (rows[indexOf.get(key)! + 1])
          nav.focusIndex(indexOf.get(key)! + 1);
      } else if (
        row.type === "node" &&
        row.node.kind === "folder" &&
        row.node.hasChildren !== false
      ) {
        if (!expandedSet.has(row.node.id)) setExpanded(row.node.id, true);
        else {
          const next = rows[indexOf.get(key)! + 1];
          if (next && "parentKey" in next && next.parentKey === key)
            focusKey(next.key);
        }
      }
      return;
    }
    if (event.key === back) {
      event.preventDefault();
      if (row.type === "section") {
        if (!collapsedSections.includes(row.section.id))
          setSectionOpen(row.section.id, false);
      } else if (
        row.type === "node" &&
        row.node.kind === "folder" &&
        row.node.hasChildren !== false &&
        expandedSet.has(row.node.id)
      )
        setExpanded(row.node.id, false);
      else focusKey(row.parentKey);
      return;
    }
    if (event.key === "*") {
      event.preventDefault();
      if (row.type !== "node") return;
      const siblings = rows.filter(
        (other): other is Extract<NavRow, { type: "node" }> =>
          other.type === "node" &&
          other.parentKey === row.parentKey &&
          other.section === row.section &&
          other.node.kind === "folder" &&
          other.node.hasChildren !== false &&
          !expandedSet.has(other.node.id),
      );
      if (siblings.length)
        onExpandedChange([...expanded, ...siblings.map((s) => s.node.id)]);
      return;
    }
    if (event.key.length === 1 && event.key !== " ") {
      const now = event.timeStamp;
      const buffer =
        now - typeahead.current.at < 500
          ? typeahead.current.text + event.key.toLowerCase()
          : event.key.toLowerCase();
      typeahead.current = { text: buffer, at: now };
      const start = indexOf.get(key)!;
      const labelOf = (candidate: NavRow) =>
        candidate.type === "node"
          ? candidate.node.label
          : candidate.type === "section"
            ? candidate.section.label
            : "";
      for (let step = buffer.length > 1 ? 0 : 1; step <= rows.length; step++) {
        const index = (start + step) % rows.length;
        if (labelOf(rows[index]!).toLowerCase().startsWith(buffer)) {
          event.preventDefault();
          nav.focusIndex(index);
          break;
        }
      }
      return;
    }
    // ↑/↓/Home/End: the roving list's own keys.
    nav.handleKeyDown(event);
  };

  // ---- drag into ---------------------------------------------------------------------------

  const draggable = !picker && onMove !== undefined;
  const isInside = (id: string, ancestor: string) => {
    for (
      let current = parentOf.get(id) ?? null;
      current !== null;
      current = parentOf.get(current) ?? null
    )
      if (current === ancestor) return true;
    return false;
  };
  // Drag keys are the host's own ids, so a drag carries ids every target in `dragScope`
  // understands. A section heading's key is private to this tree, so no node id can meet it.
  const sectionDropPrefix = `folder-tree:${idBase}:section:`;
  const describeTarget = (targetKey: string): Omit<FolderTreeMove, "ids"> =>
    targetKey.startsWith(sectionDropPrefix)
      ? {
          targetId: null,
          targetSection: targetKey.slice(sectionDropPrefix.length),
        }
      : { targetId: targetKey, targetSection: sectionOf.get(targetKey) ?? "" };
  const fileDrops = !picker && onDropFiles !== undefined;
  const dropTargets = draggable || fileDrops;
  const into = useDragInto({
    disabled: !dropTargets,
    scope: dragScope,
    canDrop: ({ ids, targetKey }) => {
      const target = describeTarget(targetKey);
      const ownRules = ids.every((id) => {
        // An id the tree does not hold (a row from a list) has no known place here.
        if (!byId.has(id)) return true;
        if (target.targetId !== null) {
          if (target.targetId === id || isInside(target.targetId, id))
            return false;
          return parentOf.get(id) !== target.targetId;
        }
        // The top of a section: refused only where the item already sits.
        return !(
          parentOf.get(id) === null &&
          sectionOf.get(id) === target.targetSection
        );
      });
      return ownRules && (canDropInto?.({ ids, ...target }) ?? true);
    },
    onHoverExpand: (targetKey) => {
      const target = describeTarget(targetKey);
      if (target.targetId === null) setSectionOpen(target.targetSection, true);
      else setExpanded(target.targetId, true);
    },
    onDrop: ({ ids, targetKey }) => {
      if (!onMove) return;
      const target = describeTarget(targetKey);
      const label =
        (ids.length === 1 ? byId.get(ids[0]!)?.label : undefined) ??
        labels.itemCount(ids.length);
      const targetLabel =
        target.targetId !== null
          ? (byId.get(target.targetId)?.label ?? "")
          : (sectionList.find((s) => s.id === target.targetSection)?.label ??
            target.targetSection);
      announce(labels.moved(label, targetLabel));
      const result = onMove({ ids, ...target });
      if (result && typeof result.then === "function")
        result.then(undefined, () => announce(labels.moveFailed(label)));
    },
    onDropFiles: fileDrops
      ? ({ targetKey, entries }) =>
          onDropFiles?.({ ...describeTarget(targetKey), entries })
      : undefined,
    onFilesOver: onFilesOver
      ? (targetKey) =>
          onFilesOver(
            targetKey === null
              ? null
              : (describeTarget(targetKey).targetId ??
                  describeTarget(targetKey).targetSection),
          )
      : undefined,
  });

  // ---- render ------------------------------------------------------------------------------

  const itemProps = (key: string) => {
    const index = indexOf.get(key) ?? -1;
    const base = nav.getItemProps(index);
    return {
      ...base,
      onFocus: () => {
        focusedKey.current = key;
        base.onFocus();
      },
      "data-folder-tree-key": key,
    };
  };
  const tabIndexOf = (key: string) =>
    (indexOf.get(key) ?? -2) === nav.activeIndex ? 0 : -1;

  const renderNodes = (
    nodes: FolderTreeNode[],
    depth: number,
    parent: FolderTreeNode | null,
  ): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    const capped =
      parent !== null && !shownAll.has(parent.id) && nodes.length > maxChildren;
    for (const node of capped ? nodes.slice(0, maxChildren) : nodes) {
      const key = nodeKey(node.id);
      const folder = node.kind === "folder";
      // A folder known to be empty has nothing to disclose.
      const leaf = folder && node.hasChildren === false;
      const open = folder && !leaf && expandedSet.has(node.id);
      const children = childrenFor(node);
      const listId = `folder-tree-${idBase}-${node.id}`;
      const rowTab = tabIndexOf(key);
      const active = picker ? selected === node.id : activeId === node.id;
      out.push(
        <li key={key} data-slot="folder-tree-item">
          <RowContext.Provider value={{ tabIndex: rowTab }}>
            <div
              {...(dropTargets
                ? into.getItemProps(node.id, {
                    drag: draggable,
                    drop: folder ? "middle" : false,
                  })
                : {})}
              data-slot="folder-tree-row"
              data-kind={node.kind}
              data-leaf={leaf ? "" : undefined}
              data-active={active ? "" : undefined}
              data-expanded={open ? "" : undefined}
              style={{ "--folder-tree-depth": depth } as React.CSSProperties}
              className={rowClasses}
            >
              {folder && !leaf ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  tabIndex={-1}
                  aria-label={labels.toggle(node.label)}
                  aria-expanded={open}
                  aria-controls={open ? listId : undefined}
                  data-slot="folder-tree-toggle"
                  onClick={() => setExpanded(node.id, !open)}
                  className="text-muted-foreground hover:bg-transparent aria-expanded:bg-transparent"
                >
                  <ChevronRightIcon className="transition-transform duration-100 group-data-expanded/folder-tree-row:rotate-90 rtl:-scale-x-100" />
                </Button>
              ) : (
                <span aria-hidden className="size-6 shrink-0" />
              )}
              <RowControl
                {...itemProps(key)}
                href={picker ? undefined : node.href}
                linkRender={linkRender}
                aria-current={!picker && active ? "page" : undefined}
                aria-pressed={picker ? active : undefined}
                onClick={
                  picker
                    ? () => onSelectedChange?.(node.id)
                    : node.href
                      ? undefined
                      : () => onOpen?.(node)
                }
              >
                <span
                  data-slot="folder-tree-icon"
                  className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4"
                >
                  {node.icon ??
                    (folder ? (
                      open ? (
                        <FolderOpenIcon aria-hidden />
                      ) : (
                        <FolderIcon aria-hidden />
                      )
                    ) : node.kind === "page" ? (
                      <FileTextIcon aria-hidden />
                    ) : (
                      <FileTypeIcon
                        contentType={node.contentType}
                        name={node.label}
                      />
                    ))}
                </span>
                <span
                  data-slot="folder-tree-label"
                  title={node.label}
                  className="min-w-0 flex-1 truncate"
                >
                  {node.label}
                </span>
              </RowControl>
              {node.badge != null ? (
                <span
                  data-slot="folder-tree-badge"
                  className="shrink-0 px-1 text-xs text-muted-foreground tabular-nums"
                >
                  {node.badge}
                </span>
              ) : null}
              {!picker && renderRowActions ? (
                <span
                  data-slot="folder-tree-row-actions"
                  className={actionsClasses}
                >
                  {renderRowActions(node)}
                </span>
              ) : null}
            </div>
          </RowContext.Provider>
          {open ? (
            <ul
              id={listId}
              data-slot="folder-tree-group"
              aria-busy={status[node.id] === "loading" || undefined}
              className="flex min-w-0 flex-col"
            >
              {status[node.id] === "loading" ? (
                <StatusRow depth={depth + 1} status="loading">
                  <Skeleton className="h-3 w-2/5" />
                  <span className="sr-only">{labels.loading}</span>
                </StatusRow>
              ) : status[node.id] === "error" ? (
                <StatusRow depth={depth + 1} status="error">
                  <span className="text-destructive-text">{labels.error}</span>
                  <span aria-hidden>·</span>
                  <Button
                    variant="link"
                    size="xs"
                    {...itemProps(`r:${node.id}`)}
                    onClick={() => load(node.id)}
                    className="px-0"
                  >
                    {labels.retry}
                  </Button>
                </StatusRow>
              ) : children && children.length === 0 ? (
                <StatusRow depth={depth + 1} status="empty">
                  {labels.empty}
                </StatusRow>
              ) : children ? (
                renderNodes(children, depth + 1, node)
              ) : null}
            </ul>
          ) : null}
        </li>,
      );
    }
    if (capped && parent) {
      const key = `a:${parent.id}`;
      out.push(
        <StatusRow key={key} depth={depth} status="more">
          <Button
            variant="ghost"
            size="xs"
            {...itemProps(key)}
            onClick={() =>
              onShowAll
                ? onShowAll(parent.id)
                : setShownAll((prev) => new Set(prev).add(parent.id))
            }
            className="-ms-2 text-muted-foreground"
          >
            {labels.showAll(nodes.length - maxChildren)}
          </Button>
        </StatusRow>,
      );
    }
    return out;
  };

  return (
    <nav
      data-slot="folder-tree"
      data-mode={mode}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex min-w-0 flex-col gap-2 text-sm [--folder-tree-indent:--spacing(3)] [--folder-tree-row-h:--spacing(7)]",
        className,
      )}
      {...props}
    >
      {sectionList.map((section) => {
        const key = sectionKey(section.id);
        const open = !collapsedSections.includes(section.id);
        const listId = `folder-tree-${idBase}-section-${section.id}`;
        const nodes = rootsFor(section.id);
        const linked = !picker && section.href !== undefined;
        return (
          <div
            key={section.id}
            data-slot="folder-tree-section"
            data-state={open ? "open" : "closed"}
            className="flex min-w-0 flex-col"
          >
            {headed ? (
              <RowContext.Provider value={{ tabIndex: tabIndexOf(key) }}>
                <div
                  {...(dropTargets
                    ? into.getItemProps(`${sectionDropPrefix}${section.id}`, {
                        drop: "whole",
                      })
                    : {})}
                  data-slot="folder-tree-section-heading"
                  data-expanded={open ? "" : undefined}
                  data-active={
                    linked && activeId === section.id ? "" : undefined
                  }
                  className={cn(rowClasses, "ps-1")}
                >
                  {linked ? (
                    <>
                      {/* A linked heading: the link goes to the section's page, and the chevron
                          beside it opens and closes the list (→/← from the keyboard). */}
                      <RowControl
                        {...itemProps(key)}
                        href={section.href}
                        linkRender={linkRender}
                        aria-current={
                          activeId === section.id ? "page" : undefined
                        }
                        className="flex-initial text-xs font-medium text-muted-foreground aria-[current=page]:text-foreground"
                      >
                        <span className="min-w-0 truncate">
                          {section.label}
                        </span>
                      </RowControl>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        tabIndex={-1}
                        aria-label={labels.toggleSection(section.label)}
                        aria-expanded={open}
                        aria-controls={open ? listId : undefined}
                        data-slot="folder-tree-section-toggle"
                        onClick={() => setSectionOpen(section.id, !open)}
                        className="me-auto text-muted-foreground opacity-0 group-hover/folder-tree-row:opacity-100 group-focus-within/folder-tree-row:opacity-100 hover:bg-transparent aria-expanded:bg-transparent pointer-coarse:opacity-100"
                      >
                        <ChevronRightIcon className="size-3 transition-transform duration-100 group-data-expanded/folder-tree-row:rotate-90 rtl:-scale-x-100" />
                      </Button>
                    </>
                  ) : (
                    <RowControl
                      {...itemProps(key)}
                      aria-expanded={open}
                      aria-controls={open ? listId : undefined}
                      onClick={() => setSectionOpen(section.id, !open)}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      <span className="min-w-0 truncate">{section.label}</span>
                      <ChevronRightIcon
                        aria-hidden
                        className="size-3 shrink-0 opacity-0 transition-[transform,opacity] duration-100 group-hover/folder-tree-row:opacity-100 group-focus-within/folder-tree-row:opacity-100 group-data-expanded/folder-tree-row:rotate-90 rtl:-scale-x-100"
                      />
                    </RowControl>
                  )}
                  {section.action && !picker ? (
                    <span
                      data-slot="folder-tree-row-actions"
                      className={actionsClasses}
                    >
                      {section.action}
                    </span>
                  ) : null}
                </div>
              </RowContext.Provider>
            ) : null}
            {open ? (
              <ul
                id={listId}
                data-slot="folder-tree-group"
                className="flex min-w-0 flex-col"
              >
                {nodes.length ? (
                  renderNodes(nodes, 0, null)
                ) : headed ? (
                  <StatusRow depth={0} status="empty">
                    {labels.empty}
                  </StatusRow>
                ) : null}
              </ul>
            ) : null}
          </div>
        );
      })}
      <Announcer />
    </nav>
  );
}

const rowClasses =
  "group/folder-tree-row relative flex h-(--folder-tree-row-h) min-w-0 items-center gap-0.5 rounded-md ps-[calc(var(--folder-tree-depth,0)*var(--folder-tree-indent))] pe-1 text-foreground hover:bg-accent/60 data-active:bg-accent data-active:font-medium data-dragging:opacity-50 data-drop-over:bg-primary/10 data-drop-invalid:bg-destructive/10";

const actionsClasses =
  "flex shrink-0 items-center opacity-0 group-hover/folder-tree-row:opacity-100 group-focus-within/folder-tree-row:opacity-100 group-data-active/folder-tree-row:opacity-100 pointer-coarse:opacity-100";

/** A non-interactive row under a folder: loading, error, empty, or the "Show all" control. */
function StatusRow({
  depth,
  status,
  children,
}: {
  depth: number;
  status: "loading" | "error" | "empty" | "more";
  children: React.ReactNode;
}) {
  return (
    <li
      data-slot="folder-tree-status"
      data-status={status}
      style={{ "--folder-tree-depth": depth } as React.CSSProperties}
      className="flex h-(--folder-tree-row-h) min-w-0 items-center gap-1.5 ps-[calc(var(--folder-tree-depth)*var(--folder-tree-indent)+--spacing(7.5))] pe-1 text-xs text-muted-foreground"
    >
      {children}
    </li>
  );
}

/** The row's own control: a link when it has an `href`, else a button. */
function RowControl({
  href,
  linkRender,
  className,
  ref,
  ...props
}: Omit<React.ComponentPropsWithRef<"a">, "ref"> & {
  ref?: React.Ref<HTMLElement>;
  linkRender?: useRender.RenderProp;
  "aria-pressed"?: boolean;
  "data-folder-tree-key": string;
}) {
  const link = href !== undefined;
  return useRender({
    defaultTagName: link ? "a" : "button",
    render: link ? linkRender : undefined,
    props: mergeProps<"a">(
      {
        ...(link
          ? { href, draggable: false }
          : ({ type: "button" } as Record<string, unknown>)),
        className: cn(
          "flex h-full min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-start",
          className,
        ),
      },
      props as React.ComponentProps<"a">,
    ),
    ref,
    state: { slot: "folder-tree-link" },
  });
}

/** Props accepted by `FolderTreeRowAction`. */
export type FolderTreeRowActionProps = React.ComponentProps<typeof Button>;

/**
 * `FolderTreeRowAction` — a row's trailing icon button (a ⋯ menu trigger, a section's "+").
 * It is a tab stop only on the active row, so the tree stays one stop plus the current row's
 * actions. Needs an `aria-label`.
 *
 * @example
 * renderRowActions={(node) => (
 *   <DropdownMenu>
 *     <DropdownMenuTrigger render={<FolderTreeRowAction aria-label={`More for ${node.label}`} />}>
 *       <EllipsisIcon />
 *     </DropdownMenuTrigger>
 *     …
 *   </DropdownMenu>
 * )}
 */
function FolderTreeRowAction({
  variant = "ghost",
  size = "icon-xs",
  className,
  ...props
}: FolderTreeRowActionProps) {
  const { tabIndex } = React.useContext(RowContext);
  return (
    <Button
      data-slot="folder-tree-row-action"
      data-row-action=""
      variant={variant}
      size={size}
      tabIndex={tabIndex}
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

export { FolderTree, FolderTreeRowAction };
