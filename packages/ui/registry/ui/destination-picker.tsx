// @vegastack destination-picker@0.25.97 sha256-UpFsvbC4n/l9fr0tcGAp6cP2npQjwH5gDINNNjdtvuQ=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { FolderIcon } from "lucide-react";
import { FolderTree, type FolderTreeNode } from "@/components/ui/folder-tree";
import { Button } from "@/components/ui/button";
import { PanelSearch, PanelSearchField } from "@/components/ui/panel-search";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { useAsyncSearch } from "@/components/ui/use-async-search";

/* ------------------------------------------------------------------------------------------------
 * DestinationPicker — where something goes: a space, or a folder inside one. Spaces are the top
 * of a folders-only `FolderTree` (picker mode), each space's folders load as it opens, recent
 * destinations sit above, a search finds a folder anywhere, and a destination that can't take the
 * move says why. The host owns the dialog and its Move button; it knows no record kinds.
 * ----------------------------------------------------------------------------------------------*/

/** A place something can go: the top of a space (`folderId: null`) or a folder in it. */
export interface Destination {
  /** The space. */
  spaceId: string;
  /** The folder, or `null` for the top of the space. */
  folderId: string | null;
}

/** A space at the top of the tree. */
export interface DestinationSpace {
  /** The space's id. */
  id: string;
  /** Its name. */
  label: string;
  /** Its glyph (an `IconGlyph`). @default undefined */
  icon?: React.ReactNode;
}

/** A folder, as `loadFolders` returns it. */
export interface DestinationFolder {
  /** The folder's id. */
  id: string;
  /** Its name. */
  label: string;
  /** `false` when it is known to hold no folders. @default undefined */
  hasChildren?: boolean;
  /** Its glyph. @default undefined */
  icon?: React.ReactNode;
}

/** A destination with its name and path, for recents and search results. */
export interface DestinationEntry extends Destination {
  /** The folder's (or the space's) name. */
  label: string;
  /** Where it is ("Sales › Contracts"). @default undefined */
  path?: string;
  /** Its glyph. @default undefined */
  icon?: React.ReactNode;
}

/** Props accepted by `DestinationPicker`. */
export interface DestinationPickerProps {
  /** The spaces, in order. */
  spaces: readonly DestinationSpace[];
  /** Loads the folders directly inside a space's top (`parentId: null`) or a folder. */
  loadFolders: (
    spaceId: string,
    parentId: string | null,
  ) => Promise<DestinationFolder[]>;
  /** The chosen destination. @default undefined */
  value?: Destination | null;
  /** Called when a destination is chosen. */
  onValueChange: (value: Destination) => void;
  /**
   * Why a destination can't take this move (it is where the item already is, inside the item
   * itself, or the reader can't add there) — the row stays visible, the pick is refused and the
   * reason is shown and announced. `undefined` means it can.
   * @default undefined
   */
  disabledReason?: (destination: Destination) => string | undefined;
  /**
   * Recent destinations, above the tree.
   * @default undefined
   */
  recents?: readonly DestinationEntry[];
  /**
   * Find folders by name anywhere; omit to hide the search box.
   * @default undefined
   */
  search?: (query: string, signal: AbortSignal) => Promise<DestinationEntry[]>;
  /** @default "Search folders" */
  searchPlaceholder?: string;
  /** @default "Recent" */
  recentLabel?: string;
  /** @default "No folders match." */
  emptyLabel?: string;
  /** The tree's accessible name. @default "Destinations" */
  label?: string;
  /** Classes on the root. @default undefined */
  className?: string;
}

const SPACE = "space:";
const FOLDER = "folder:";
const enc = encodeURIComponent;
const nodeId = (d: Destination) =>
  d.folderId === null
    ? `${SPACE}${enc(d.spaceId)}`
    : `${FOLDER}${enc(d.spaceId)}|${enc(d.folderId)}`;
/** The inverse of `nodeId`: each part is URI-encoded, so neither can hold the `|` between them. */
function destinationOf(id: string): Destination {
  if (id.startsWith(SPACE))
    return {
      spaceId: decodeURIComponent(id.slice(SPACE.length)),
      folderId: null,
    };
  const [space = "", folder = ""] = id.slice(FOLDER.length).split("|");
  return {
    spaceId: decodeURIComponent(space),
    folderId: decodeURIComponent(folder),
  };
}

/**
 * `DestinationPicker` — choose where something goes. The spaces are the top of a folders-only
 * tree; each opens to its folders (loaded once, through `loadFolders`), and picking a space means
 * its top level. `recents` sit above the tree, `search` finds a folder anywhere, and
 * `disabledReason` keeps a destination visible while refusing it with the reason. Put it in a
 * dialog with the host's own "Move" button, enabled once `value` is set.
 *
 * @example
 * <DialogBody>
 *   <DestinationPicker
 *     spaces={spaces}
 *     loadFolders={(space, parent) => api.folders(space, parent)}
 *     value={target}
 *     onValueChange={setTarget}
 *     disabledReason={(d) => (d.folderId === item.parentId ? "It's already here" : undefined)}
 *     recents={recentPlaces}
 *     search={(q, signal) => api.searchFolders(q, { signal })}
 *   />
 * </DialogBody>
 */
export function DestinationPicker({
  spaces,
  loadFolders,
  value,
  onValueChange,
  disabledReason,
  recents,
  search,
  searchPlaceholder = "Search folders",
  recentLabel = "Recent",
  emptyLabel = "No folders match.",
  label = "Destinations",
  className,
}: DestinationPickerProps) {
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const [refused, setRefused] = React.useState<string | null>(null);
  const { announce, Announcer } = useAnnouncer();
  const results = useAsyncSearch<DestinationEntry>(
    async (query, { signal }) =>
      query.trim() && search
        ? { items: await search(query, signal) }
        : { items: [] },
    { enabled: search !== undefined },
  );
  const querying = results.query.trim() !== "";

  const reasonOf = (d: Destination) => disabledReason?.(d);
  const choose = (d: Destination) => {
    const reason = reasonOf(d);
    if (reason) {
      setRefused(reason);
      announce(reason);
      return;
    }
    setRefused(null);
    onValueChange(d);
  };

  const withReason = React.useCallback(
    (d: Destination, node: FolderTreeNode): FolderTreeNode => {
      const reason = disabledReason?.(d);
      return reason ? { ...node, disabledReason: reason } : node;
    },
    [disabledReason],
  );

  const rootItems = React.useMemo(
    () => ({
      spaces: spaces.map((space) =>
        withReason(
          { spaceId: space.id, folderId: null },
          {
            id: nodeId({ spaceId: space.id, folderId: null }),
            label: space.label,
            kind: "folder",
            icon: space.icon,
          },
        ),
      ),
    }),
    [spaces, withReason],
  );

  const loadChildren = React.useCallback(
    async (id: string) => {
      const at = destinationOf(id);
      const folders = await loadFolders(at.spaceId, at.folderId);
      return folders.map((folder) =>
        withReason(
          { spaceId: at.spaceId, folderId: folder.id },
          {
            id: nodeId({ spaceId: at.spaceId, folderId: folder.id }),
            label: folder.label,
            kind: "folder" as const,
            hasChildren: folder.hasChildren,
            icon: folder.icon,
          },
        ),
      );
    },
    [loadFolders, withReason],
  );

  const entryRow = (entry: DestinationEntry) => {
    const reason = reasonOf(entry);
    const selected =
      value != null &&
      value.spaceId === entry.spaceId &&
      value.folderId === entry.folderId;
    return (
      <Button
        key={nodeId(entry)}
        type="button"
        variant="ghost"
        aria-pressed={selected}
        aria-disabled={reason ? true : undefined}
        data-slot="destination-picker-entry"
        className={cn(
          "h-auto w-full justify-start gap-2 px-2 py-1.5 text-start font-normal whitespace-normal",
          selected && "bg-accent",
          reason && "opacity-60",
        )}
        onClick={() => choose(entry)}
      >
        <span
          aria-hidden
          className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
        >
          {entry.icon ?? <FolderIcon />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{entry.label}</span>
          {reason || entry.path ? (
            <span className="truncate text-xs text-muted-foreground">
              {reason ?? entry.path}
            </span>
          ) : null}
        </span>
      </Button>
    );
  };

  return (
    <div
      data-slot="destination-picker"
      className={cn("flex min-h-0 flex-col gap-2", className)}
    >
      {search ? (
        <PanelSearch className="static rounded-lg border">
          <PanelSearchField
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={results.query}
            onChange={(event) =>
              results.onSearchChange(event.currentTarget.value)
            }
          />
        </PanelSearch>
      ) : null}
      {querying ? (
        <div
          data-slot="destination-picker-results"
          className="flex min-h-0 flex-col overflow-y-auto"
        >
          {results.loading && results.items.length === 0 ? (
            <div aria-hidden className="flex flex-col gap-2 p-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : results.error ? (
            <p role="status" className="p-2 text-sm text-muted-foreground">
              {results.error}
            </p>
          ) : results.items.length === 0 ? (
            <p role="status" className="p-2 text-sm text-muted-foreground">
              {emptyLabel}
            </p>
          ) : (
            <div className="flex flex-col">{results.items.map(entryRow)}</div>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          {recents && recents.length > 0 ? (
            <section
              data-slot="destination-picker-recents"
              aria-label={recentLabel}
              className="flex flex-col"
            >
              <h3 className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                {recentLabel}
              </h3>
              {recents.map(entryRow)}
            </section>
          ) : null}
          <FolderTree
            aria-label={label}
            mode="picker"
            rootItems={rootItems}
            loadChildren={loadChildren}
            expanded={expanded}
            onExpandedChange={setExpanded}
            selected={value ? nodeId(value) : undefined}
            onSelectedChange={(id) => choose(destinationOf(id))}
          />
        </div>
      )}
      <p
        data-slot="destination-picker-refused"
        aria-hidden
        className={cn(
          "min-h-5 text-sm text-muted-foreground",
          refused === null && "invisible",
        )}
      >
        {refused}
      </p>
      <Announcer />
    </div>
  );
}
