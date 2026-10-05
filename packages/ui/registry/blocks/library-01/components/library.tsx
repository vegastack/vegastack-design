// @vegastack library-01@0.23.125 sha256-hin0EroZ2z9Q+RARYMzKW/vy30FP9ORU9PWxEHulMjY=

"use client";

import * as React from "react";
import {
  EllipsisIcon,
  FileTextIcon,
  FolderIcon,
  FolderInputIcon,
  FolderPlusIcon,
  FolderTreeIcon,
  FolderUpIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentProgress,
  AttachmentTitle,
} from "@/components/ui/attachment";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DataList, type DataListColumn } from "@/components/ui/data-list";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileViewer, type FileViewerItem } from "@/components/ui/file-viewer";
import {
  FolderTree,
  FolderTreeRowAction,
  type FolderTreeMove,
  type FolderTreeNode,
} from "@/components/ui/folder-tree";
import { useContainerWidth } from "@/components/ui/data-table-parts";
import { PageHeader } from "@/components/ui/page-header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { RelativeTime } from "@/components/ui/relative-time";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FileTypeIcon, formatBytes } from "@/lib/file-kind";

import {
  LIBRARY,
  SECTIONS,
  UPLOADS,
  type LibraryItem,
  type LibraryUpload,
} from "./sample-library";

const ORDER = { folder: 0, page: 1, file: 2 } as const;
const byKindThenName = (a: LibraryItem, b: LibraryItem) =>
  ORDER[a.kind] - ORDER[b.kind] || a.name.localeCompare(b.name);

const itemHref = (item: LibraryItem) =>
  item.kind === "page" ? `/library/pages/${item.id}` : `/library/${item.id}`;

/** Props for {@link Library}. */
export interface LibraryProps {
  /**
   * Every item the library holds. Replace with your API.
   * @default the sample library
   */
  items?: LibraryItem[];
  /**
   * Files uploading into the open folder.
   * @default the sample uploads
   */
  uploads?: LibraryUpload[];
  /**
   * The folder open at first.
   * @default "nova"
   */
  defaultFolder?: string;
}

/**
 * `Library` — a file library page: a resizable `FolderTree` pane (Shared and Private, row menus,
 * drag to move) beside the open folder — its breadcrumb and `PageHeader`, the uploads in flight
 * as `AttachmentGroup` list rows, and its contents in a `DataList` that switches between a list
 * and a grid of `MediaCard`s. A file opens in the `FileViewer`; "Move…" opens a Move dialog with
 * a picker-mode tree; an empty folder shows an `Empty` pointing at Upload.
 *
 * @example
 * <Library items={items} uploads={uploads} defaultFolder={folderId} />
 */
export function Library({
  items: initialItems = LIBRARY,
  uploads = UPLOADS,
  defaultFolder = "nova",
}: LibraryProps) {
  const [items, setItems] = React.useState(initialItems);
  const [folderId, setFolderId] = React.useState<string | null>(defaultFolder);
  const [expanded, setExpanded] = React.useState<string[]>(() => [
    ...ancestorsOf(initialItems, defaultFolder),
    defaultFolder,
  ]);
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);
  const [moving, setMoving] = React.useState<LibraryItem | null>(null);
  const [moveTarget, setMoveTarget] = React.useState<string | undefined>();
  const [pickerExpanded, setPickerExpanded] = React.useState<string[]>([]);
  const [measureRef, width] = useContainerWidth();
  // The layout follows the block's OWN width: two resizable panes from 48rem, else the folder
  // alone with the tree in a sheet. Before the first measurement it renders narrow, which is
  // also the server's answer.
  const wide = width !== null && width >= 768;
  const [foldersOpen, setFoldersOpen] = React.useState(false);

  const byId = React.useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const folder = folderId ? byId.get(folderId) : undefined;
  const childrenOf = (parent: string | null, section?: string) =>
    items
      .filter(
        (item) =>
          item.parent === parent &&
          (section === undefined || item.section === section),
      )
      .sort(byKindThenName);
  const contents = childrenOf(folderId, folder ? undefined : "shared");
  const files = contents.filter((item) => item.kind === "file");

  const toNode = (item: LibraryItem): FolderTreeNode => ({
    id: item.id,
    label: item.name,
    kind: item.kind,
    href: itemHref(item),
    icon: item.icon,
    contentType: item.contentType,
    hasChildren: item.kind === "folder" ? undefined : false,
  });

  const openFolder = (id: string) => {
    setFolderId(id);
    setExpanded((prev) => [
      ...new Set([...prev, ...ancestorsOf(items, id), id]),
    ]);
  };

  const move = ({ ids, targetId, targetSection }: FolderTreeMove) =>
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id)
          ? {
              ...item,
              parent: targetId,
              section: targetSection as LibraryItem["section"],
            }
          : item,
      ),
    );

  const viewerItems: FileViewerItem[] = files.map((file) => ({
    id: file.id,
    name: file.name,
    contentType: file.contentType ?? null,
    size: file.size,
    downloadHref: `/library/${file.id}/download`,
  }));

  const open = (item: LibraryItem) => {
    setFoldersOpen(false);
    if (item.kind === "folder") openFolder(item.id);
    else if (item.kind === "file")
      setViewerIndex(files.findIndex((file) => file.id === item.id));
  };

  const rowMenu = (item: LibraryItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<FolderTreeRowAction aria-label={`More for ${item.name}`} />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => startMove(item)}>
          <FolderInputIcon />
          Move…
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <Trash2Icon />
          Move to trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const startMove = (item: LibraryItem) => {
    setMoveTarget(undefined);
    setPickerExpanded(ancestorsOf(items, item.parent));
    setMoving(item);
  };

  const columns: DataListColumn<LibraryItem>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => (
        <span className="flex min-w-0 items-center gap-2">
          <ItemIcon item={item} />
          <span className="truncate">{item.name}</span>
        </span>
      ),
    },
    {
      key: "size",
      header: "Size",
      align: "end",
      nowrap: true,
      render: (item) =>
        item.size != null ? (
          <span className="tabular-nums">{formatBytes(item.size)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "updated",
      header: "Updated",
      nowrap: true,
      render: (item) => (
        <span className="text-muted-foreground">
          <RelativeTime date={item.updatedAt} /> · {item.updatedBy}
        </span>
      ),
    },
  ];

  const trail = folder
    ? ancestorsOf(items, folder.id).map((id) => byId.get(id)!)
    : [];

  const treePane = (
    <div className="flex h-full min-h-0 flex-col gap-2 bg-sidebar p-2">
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <span className="text-sm font-medium">Library</span>
        <Button variant="ghost" size="icon-xs" aria-label="New page">
          <PlusIcon />
        </Button>
      </div>
      <FolderTree
        aria-label="Library"
        className="min-h-0 flex-1 overflow-y-auto"
        sections={SECTIONS.map((section) => ({
          id: section.id,
          label: section.label,
          action: (
            <FolderTreeRowAction aria-label={`Add to ${section.label}`}>
              <PlusIcon />
            </FolderTreeRowAction>
          ),
        }))}
        rootItems={Object.fromEntries(
          SECTIONS.map((section) => [
            section.id,
            childrenOf(null, section.id).map(toNode),
          ]),
        )}
        childrenOf={Object.fromEntries(
          items
            .filter((item) => item.kind === "folder")
            .map((item) => [item.id, childrenOf(item.id).map(toNode)]),
        )}
        expanded={expanded}
        onExpandedChange={setExpanded}
        activeId={folderId ?? undefined}
        linkRender={(props) => (
          <a
            {...props}
            onClick={(event) => {
              event.preventDefault();
              const id = (props as { href?: string }).href?.split("/").pop();
              const item = id ? byId.get(id) : undefined;
              if (item) open(item);
            }}
          />
        )}
        renderRowActions={(node) => {
          const item = byId.get(node.id);
          return item ? rowMenu(item) : null;
        }}
        onMove={move}
      />
    </div>
  );

  const mainPane = (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 @3xl/library:p-6">
      <PageHeader
        title={folder?.name ?? "Shared"}
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/library"
                  onClick={(event) => {
                    event.preventDefault();
                    setFolderId(null);
                  }}
                >
                  {folder?.section === "private" ? "Private" : "Shared"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {trail.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={itemHref(crumb)}
                      onClick={(event) => {
                        event.preventDefault();
                        openFolder(crumb.id);
                      }}
                    >
                      {crumb.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
              {folder ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
        }
        actions={
          <>
            {wide ? null : (
              <Button
                variant="outline"
                size="icon"
                aria-label="Folders"
                onClick={() => setFoldersOpen(true)}
              >
                <FolderTreeIcon />
              </Button>
            )}
            {wide ? (
              <Button variant="outline">
                <FolderPlusIcon />
                New folder
              </Button>
            ) : (
              <Button variant="outline" size="icon" aria-label="New folder">
                <FolderPlusIcon />
              </Button>
            )}
            <Button>
              <UploadIcon />
              Upload
            </Button>
          </>
        }
      />

      {folderId === defaultFolder && uploads.length ? (
        <section aria-label="Uploads" className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-medium">
            Uploading {uploads.length} files
          </h2>
          <AttachmentGroup layout="list" preview={false} role="list">
            {uploads.map((upload) => (
              <UploadRow key={upload.id} upload={upload} />
            ))}
          </AttachmentGroup>
        </section>
      ) : null}

      <DataList<LibraryItem>
        aria-label={`${folder?.name ?? "Shared"} contents`}
        columns={columns}
        data={contents}
        view={view}
        onViewChange={(next) => setView(next as "list" | "grid")}
        getRowId={(item) => item.id}
        getRowLabel={(item) => item.name}
        onRowClick={open}
        rowActions={(item) => [
          ...(item.kind === "file"
            ? [
                {
                  label: "Download",
                  render: <a href={`/library/${item.id}/download`} download />,
                },
              ]
            : []),
          { label: "Move…", onSelect: () => startMove(item) },
          { type: "separator" as const },
          {
            label: "Move to trash",
            destructive: true,
            onSelect: () => {},
          },
        ]}
        thumbnailFallback={<FolderIcon aria-hidden />}
        emptyState={
          <Empty className="border" icon={<FolderUpIcon aria-hidden />}>
            <EmptyHeader>
              <EmptyTitle>This folder is empty</EmptyTitle>
              <EmptyDescription>
                Drop files here, or upload a file or a whole folder.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline">
              <UploadIcon />
              Upload
            </Button>
          </Empty>
        }
      />
    </div>
  );

  return (
    <div
      ref={measureRef}
      data-slot="library"
      data-mode={wide ? "wide" : "narrow"}
      className="@container/library flex h-full min-h-0 w-full overflow-hidden rounded-xl border bg-background"
    >
      {wide ? (
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="28%" minSize="200px" maxSize="45%">
            {treePane}
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="72%">{mainPane}</ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          <div className="min-w-0 flex-1">{mainPane}</div>
          <Sheet open={foldersOpen} onOpenChange={setFoldersOpen}>
            <SheetContent side="left" size="sm" className="p-0">
              <SheetTitle className="sr-only">Folders</SheetTitle>
              {treePane}
            </SheetContent>
          </Sheet>
        </>
      )}

      <FileViewer
        items={viewerItems}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        onOpenChange={(isOpen) => {
          if (!isOpen) setViewerIndex(null);
        }}
      />

      <Dialog
        open={moving !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setMoving(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move {moving?.name}</DialogTitle>
          </DialogHeader>
          <FolderTree
            aria-label="Folders"
            mode="picker"
            className="max-h-72 overflow-y-auto"
            sections={SECTIONS.map((section) => ({ ...section }))}
            rootItems={Object.fromEntries(
              SECTIONS.map((section) => [
                section.id,
                childrenOf(null, section.id)
                  .filter((item) => item.id !== moving?.id)
                  .map(toNode),
              ]),
            )}
            childrenOf={Object.fromEntries(
              items
                .filter((item) => item.kind === "folder")
                .map((item) => [
                  item.id,
                  childrenOf(item.id)
                    .filter((child) => child.id !== moving?.id)
                    .map(toNode),
                ]),
            )}
            expanded={pickerExpanded}
            onExpandedChange={setPickerExpanded}
            selected={moveTarget}
            onSelectedChange={setMoveTarget}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={!moveTarget}
              onClick={() => {
                const target = moveTarget ? byId.get(moveTarget) : undefined;
                if (!moving || !target) return;
                move({
                  ids: [moving.id],
                  targetId: target.id,
                  targetSection: target.section,
                });
                setMoving(null);
              }}
            >
              Move here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** The ids from the top of the tree down to `id`'s parent — the folders to expand to show it. */
function ancestorsOf(items: LibraryItem[], id: string | null): string[] {
  const out: string[] = [];
  let current = id ? items.find((item) => item.id === id) : undefined;
  while (current?.parent) {
    out.unshift(current.parent);
    current = items.find((item) => item.id === current!.parent);
  }
  return out;
}

function ItemIcon({ item }: { item: LibraryItem }) {
  if (item.kind === "folder")
    return (
      <FolderIcon
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />
    );
  if (item.kind === "page")
    return item.icon ? (
      <span
        aria-hidden
        className="flex size-4 shrink-0 items-center justify-center text-sm"
      >
        {item.icon}
      </span>
    ) : (
      <FileTextIcon
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />
    );
  return (
    <FileTypeIcon
      contentType={item.contentType}
      name={item.name}
      className="size-4"
    />
  );
}

function UploadRow({ upload }: { upload: LibraryUpload }) {
  const state = upload.error
    ? "error"
    : upload.progress === null
      ? "processing"
      : "uploading";
  return (
    <Attachment state={state} role="listitem">
      <AttachmentMedia>
        <FileTypeIcon
          contentType={upload.contentType}
          name={upload.name}
          className="text-current"
        />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{upload.name}</AttachmentTitle>
        {state === "error" ? (
          <AttachmentDescription>{upload.error}</AttachmentDescription>
        ) : (
          <AttachmentProgress
            value={upload.progress}
            aria-label={
              state === "processing"
                ? `Processing ${upload.name}`
                : `Uploading ${upload.name}`
            }
          />
        )}
      </AttachmentContent>
      <AttachmentActions className="gap-1">
        {state === "error" ? (
          <AttachmentAction aria-label={`Retry ${upload.name}`}>
            <RefreshCwIcon />
          </AttachmentAction>
        ) : null}
        <AttachmentAction aria-label={`Cancel ${upload.name}`}>
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}
