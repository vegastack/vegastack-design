"use client";

import { type ReactNode, useState } from "react";
import {
  EllipsisIcon,
  FolderInputIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/folder-tree` (dogfoods the registry) → auto-scanned.
import {
  FolderTree,
  FolderTreeRowAction,
  type FolderTreeMove,
  type FolderTreeNode,
} from "@/components/ui/folder-tree";
import { Button } from "@/components/ui/button";
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

/** A small library: the whole tree, flat, by parent. `null` parents are the section roots. */
type Item = FolderTreeNode & { parent: string | null; section: string };

const LIBRARY: Item[] = [
  {
    id: "specs",
    label: "Product specs",
    kind: "folder",
    parent: null,
    section: "shared",
  },
  {
    id: "brand",
    label: "Brand",
    kind: "folder",
    parent: null,
    section: "shared",
  },
  {
    id: "install",
    label: "Install guides",
    kind: "folder",
    parent: null,
    section: "shared",
  },
  {
    id: "handbook",
    label: "Team handbook",
    kind: "page",
    icon: "📘",
    parent: null,
    section: "shared",
  },
  {
    id: "nova",
    label: "Nova pendant",
    kind: "folder",
    parent: "specs",
    section: "shared",
  },
  {
    id: "nova-sheet",
    label: "nova-spec-sheet.pdf",
    kind: "file",
    contentType: "application/pdf",
    parent: "nova",
    section: "shared",
  },
  {
    id: "nova-ies",
    label: "nova-30deg.ies",
    kind: "file",
    contentType: "application/octet-stream",
    parent: "nova",
    section: "shared",
  },
  {
    id: "price",
    label: "Price list 2026.xlsx",
    kind: "file",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    parent: "specs",
    section: "shared",
  },
  {
    id: "logo",
    label: "logo-mark.svg",
    kind: "file",
    contentType: "image/svg+xml",
    parent: "brand",
    section: "shared",
  },
  {
    id: "tone",
    label: "Voice and tone",
    kind: "page",
    parent: "brand",
    section: "shared",
  },
  {
    id: "drafts",
    label: "Drafts",
    kind: "folder",
    parent: null,
    section: "private",
  },
  {
    id: "ideas",
    label: "Ideas",
    kind: "page",
    icon: "💡",
    parent: null,
    section: "private",
  },
];

const withHref = (item: Item): FolderTreeNode => ({
  ...item,
  href: `#${item.id}`,
  hasChildren: item.kind === "folder" ? undefined : false,
});

function useLibrary() {
  const [items, setItems] = useState(LIBRARY);
  const children = (parent: string | null, section?: string) =>
    items
      .filter(
        (item) =>
          item.parent === parent &&
          (section === undefined || item.section === section),
      )
      .sort((a, b) =>
        a.kind === b.kind
          ? a.label.localeCompare(b.label)
          : a.kind === "folder"
            ? -1
            : 1,
      )
      .map(withHref);
  const move = ({ ids, targetId, targetSection }: FolderTreeMove) =>
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id)
          ? { ...item, parent: targetId, section: targetSection }
          : item,
      ),
    );
  return { items, children, move };
}

function RowMenu({
  node,
  onMove,
}: {
  node: FolderTreeNode;
  onMove?: (node: FolderTreeNode) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<FolderTreeRowAction aria-label={`More for ${node.label}`} />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove?.(node)}>
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
}

/**
 * The library tree: Shared and Private sections, a ⋯ menu per row, the open page marked, and a
 * drag into a folder or onto a section heading to move an item there.
 */
export function folderTree(): ReactNode {
  const library = useLibrary();
  const [expanded, setExpanded] = useState<string[]>(["specs"]);
  const [active, setActive] = useState("handbook");
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-64">
        <FolderTree
          aria-label="Library"
          sections={[
            {
              id: "shared",
              label: "Shared",
              action: (
                <FolderTreeRowAction aria-label="Add to Shared">
                  <PlusIcon />
                </FolderTreeRowAction>
              ),
            },
            { id: "private", label: "Private" },
          ]}
          rootItems={{
            shared: library.children(null, "shared"),
            private: library.children(null, "private"),
          }}
          // The host holds this library in memory, so it passes every folder's children;
          // `loadChildren` is for a host that fetches them (see Row states).
          childrenOf={Object.fromEntries(
            library.items
              .filter((item) => item.kind === "folder")
              .map((item) => [item.id, library.children(item.id)]),
          )}
          expanded={expanded}
          onExpandedChange={setExpanded}
          activeId={active}
          linkRender={(props) => (
            <a
              {...props}
              onClick={(event) => {
                event.preventDefault();
                const href = (props as { href?: string }).href ?? "";
                setActive(href.slice(1));
              }}
            />
          )}
          renderRowActions={(node) => <RowMenu node={node} />}
          onMove={library.move}
        />
      </div>
    </Wrapper>
  );
}

/**
 * Every row state at once: a folder loading its children, one that failed (with Retry), an empty
 * one, and a long one cut off by `maxChildren` with a "Show all" row.
 */
export function folderTreeStates(): ReactNode {
  const [expanded, setExpanded] = useState([
    "loading",
    "failed",
    "empty",
    "long",
  ]);
  const roots: FolderTreeNode[] = [
    { id: "loading", label: "Loading folder", kind: "folder" },
    { id: "failed", label: "Offline folder", kind: "folder" },
    { id: "empty", label: "Empty folder", kind: "folder", hasChildren: false },
    { id: "long", label: "Photos", kind: "folder", badge: 240 },
  ];
  const photos = Array.from({ length: 8 }, (_, i) => ({
    id: `photo-${i}`,
    label: `site-visit-${String(i + 1).padStart(2, "0")}.jpg`,
    kind: "file" as const,
    contentType: "image/jpeg",
    href: `#photo-${i}`,
  }));
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-64">
        <FolderTree
          aria-label="Row states"
          rootItems={{ root: roots }}
          childrenOf={{ long: photos }}
          loadChildren={(id) =>
            id === "failed"
              ? Promise.reject(new Error("offline"))
              : new Promise<FolderTreeNode[]>(() => {})
          }
          expanded={expanded}
          onExpandedChange={setExpanded}
          maxChildren={3}
        />
      </div>
    </Wrapper>
  );
}

/**
 * The Move dialog: the same tree in `mode="picker"` — folders only, one selected, no menus and no
 * drag. The row menu's "Move…" opens it, the keyboard path for every drag.
 */
export function folderTreePicker(): ReactNode {
  const library = useLibrary();
  const [moving, setMoving] = useState<FolderTreeNode | null>(null);
  const [target, setTarget] = useState<string | undefined>(undefined);
  const [expanded, setExpanded] = useState<string[]>(["specs"]);
  const [treeExpanded, setTreeExpanded] = useState<string[]>([]);
  const folders = (parent: string | null, section?: string) =>
    library.children(parent, section).filter((node) => node.kind === "folder");
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-64">
        <FolderTree
          aria-label="Library"
          sections={[
            { id: "shared", label: "Shared" },
            { id: "private", label: "Private" },
          ]}
          rootItems={{
            shared: library.children(null, "shared"),
            private: library.children(null, "private"),
          }}
          loadChildren={(id) => Promise.resolve(library.children(id))}
          expanded={treeExpanded}
          onExpandedChange={setTreeExpanded}
          renderRowActions={(node) => (
            <RowMenu
              node={node}
              onMove={(item) => {
                setTarget(undefined);
                setMoving(item);
              }}
            />
          )}
        />
      </div>
      <Dialog
        open={moving !== null}
        onOpenChange={(open) => !open && setMoving(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move {moving?.label}</DialogTitle>
          </DialogHeader>
          <FolderTree
            aria-label="Folders"
            mode="picker"
            sections={[
              { id: "shared", label: "Shared" },
              { id: "private", label: "Private" },
            ]}
            rootItems={{
              shared: folders(null, "shared"),
              private: folders(null, "private"),
            }}
            loadChildren={(id) => Promise.resolve(folders(id))}
            expanded={expanded}
            onExpandedChange={setExpanded}
            selected={target}
            onSelectedChange={setTarget}
            className="max-h-72 overflow-y-auto"
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={!target || !moving}
              onClick={() => {
                if (!moving || !target) return;
                const section =
                  library.items.find((item) => item.id === target)?.section ??
                  "shared";
                library.move({
                  ids: [moving.id],
                  targetId: target,
                  targetSection: section,
                });
                setMoving(null);
              }}
            >
              Move here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}
