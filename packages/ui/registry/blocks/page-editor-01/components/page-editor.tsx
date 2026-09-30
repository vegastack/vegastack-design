// @vegastack page-editor-01@0.23.97 sha256-O+yXGcu4R3ePjX/ED5oYzNna5wLDenECEEdTZE9zQiE=

"use client";

import * as React from "react";
import {
  Ellipsis,
  History,
  ListTree,
  MessageSquare,
  RotateCcw,
} from "lucide-react";

import { AvatarGroup } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CommentMargin, CommentPopover } from "@/components/ui/comment-margin";
import {
  CommentThread,
  type CommentThreadData,
} from "@/components/ui/comments";
import { DiffView } from "@/components/ui/diff-view";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonAvatar } from "@/components/ui/person-avatar";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TableOfContents } from "@/components/ui/table-of-contents";
import {
  TextEdit,
  type TextAnchor,
  type TextEditAnnotationLayout,
  type TextEditHandle,
  type TextEditOutlineItem,
} from "@/components/ui/text-edit";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { VersionList, type VersionItem } from "@/components/ui/version-list";

const ME = { name: "Asha Rao", email: "asha@acme.com" };
const BO = { name: "Bo Lindqvist", email: "bo@acme.com" };
const PRIYA = { name: "Priya Nair", email: "priya@acme.com" };
const HOUR = 3_600_000;

const BODY = `# Kitchen circuit

The kitchen runs on its own circuit. Use a 25 A breaker for the cooker and keep the panel labelled.

> [!WARNING]
> Isolate the supply before opening the panel.

## Wiring

Brown to L, blue to N, green-yellow to earth.

<details><summary>Cable sizes</summary>

- Cooker: 6 mm²
- Sockets: 2.5 mm²

</details>

## Sign-off

Ask Bo to check the RCD before the inspection.`;

const OLDER = BODY.replace("25 A breaker", "20 A breaker").replace(
  "\n\n## Sign-off\n\nAsk Bo to check the RCD before the inspection.",
  "",
);

/** The anchor for the first occurrence of `quote` in the page's text. */
function anchorFor(text: string, quote: string): TextAnchor {
  const start = text.indexOf(quote);
  return {
    start,
    end: start + quote.length,
    quote,
    prefix: text.slice(Math.max(0, start - 80), start),
    suffix: text.slice(start + quote.length, start + quote.length + 80),
  };
}

// The page's anchor text: blocks joined by a newline (`anchorText` in @/lib/text-anchor-doc).
const TEXT = [
  "Kitchen circuit",
  "The kitchen runs on its own circuit. Use a 25 A breaker for the cooker and keep the panel labelled.",
  "Isolate the supply before opening the panel.",
  "Wiring",
  "Brown to L, blue to N, green-yellow to earth.",
].join("\n");

function initialThreads(now: number): (CommentThreadData & {
  anchor: TextAnchor;
})[] {
  return [
    {
      id: "t1",
      anchor: anchorFor(TEXT, "25 A breaker"),
      quote: "25 A breaker",
      root: {
        id: "c1",
        author: BO,
        body: "Is 25 A right for a 7 kW cooker?",
        createdAt: now - 5 * HOUR,
      },
      replies: [
        {
          id: "c2",
          author: ME,
          body: "Yes — it's on its own radial, 6 mm² cable.",
          createdAt: now - 4 * HOUR,
          canEdit: true,
          canDelete: true,
        },
      ],
    },
    {
      id: "t2",
      anchor: anchorFor(TEXT, "green-yellow to earth"),
      quote: "green-yellow to earth",
      root: {
        id: "c3",
        author: PRIYA,
        body: "Add a photo of the earth bar.",
        createdAt: now - 2 * HOUR,
      },
      replies: [],
    },
  ];
}

function initialVersions(now: number): VersionItem[] {
  return [
    { id: "current", author: ME, at: now - 10 * 60_000, kind: "auto" },
    {
      id: "v2",
      author: BO,
      at: now - 26 * HOUR,
      kind: "named",
      name: "Before the inspection",
    },
    { id: "v1", author: ME, at: now - 50 * HOUR, kind: "auto" },
  ];
}

/**
 * The page editor: header, outline (a `TableOfContents` rail on wide screens, an "Outline" sheet
 * below), the page with its comment highlights, the threads beside it (a margin on wide screens, a
 * popover below), and the version history sheet. Sample state
 * only — wire each callback to your own data.
 *
 * @example
 * <AppShellPage size="full"><PageEditor /></AppShellPage>
 */
export function PageEditor() {
  const [now] = React.useState(() => Date.now());
  const handle = React.useRef<TextEditHandle>(null);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const wide = useMediaQuery("(min-width: 80rem)");
  const [body, setBody] = React.useState(BODY);
  const [saved, setSaved] = React.useState(true);
  const [outline, setOutline] = React.useState<TextEditOutlineItem[]>([]);
  const [threads, setThreads] = React.useState(() => initialThreads(now));
  const [layout, setLayout] = React.useState<TextEditAnnotationLayout[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [versions] = React.useState(() => initialVersions(now));
  const [selectedVersion, setSelectedVersion] = React.useState("v2");
  const [namedOnly, setNamedOnly] = React.useState(false);

  const annotations = React.useMemo(
    () =>
      threads
        .filter((thread) => !thread.resolved)
        // The count pill shows the thread's comments: the first one plus its replies.
        .map(({ id, anchor, replies }) => ({
          id,
          anchor,
          count: 1 + replies.length,
        })),
    [threads],
  );
  const open = threads.filter((thread) => !thread.resolved);

  const reply = (threadId: string, text: string) =>
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              replies: [
                ...thread.replies,
                {
                  id: `${threadId}-${thread.replies.length + 1}`,
                  author: ME,
                  body: text,
                  createdAt: Date.now(),
                  canEdit: true,
                  canDelete: true,
                },
              ],
            }
          : thread,
      ),
    );
  const resolve = (threadId: string) =>
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? { ...thread, resolved: { by: ME, at: Date.now() } }
          : thread,
      ),
    );
  const createThread = (anchor: TextAnchor) => {
    const id = `t${Date.now()}`;
    setThreads((current) => [
      ...current,
      {
        id,
        anchor,
        quote: anchor.quote,
        root: {
          id: `${id}-root`,
          author: ME,
          body: "New comment",
          createdAt: Date.now(),
          canEdit: true,
          canDelete: true,
        },
        replies: [],
      },
    ]);
    setActiveId(id);
  };

  const threadCard = (thread: (typeof threads)[number]) => (
    <CommentThread
      thread={thread}
      active={thread.id === activeId}
      onReply={(text) => reply(thread.id, text)}
      onResolve={() => resolve(thread.id)}
      onQuoteClick={() => {
        setActiveId(thread.id);
        handle.current?.pulseAnnotation(thread.id);
      }}
      now={now}
    />
  );
  const active = open.find((thread) => thread.id === activeId) ?? null;
  const activeRect =
    !wide && activeId && typeof document !== "undefined"
      ? (pageRef.current
          ?.querySelector(`[data-annotation="${activeId}"]`)
          ?.getBoundingClientRect() ?? null)
      : null;
  const version = versions.find((item) => item.id === selectedVersion);
  const scrollToHeading = (id: string) => handle.current?.scrollToHeading(id);

  return (
    <div data-slot="page-editor" className="flex min-w-0 flex-col gap-4">
      <header className="flex min-h-10 flex-wrap items-center gap-2">
        {/* `basis-48`: on a narrow page the trail keeps a readable width and the header's
            controls wrap to the next line, rather than the trail shrinking to one word a line. */}
        <Breadcrumb className="min-w-0 flex-1 basis-48">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Library</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Site notes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Kitchen circuit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <span
          role="status"
          className="text-xs text-muted-foreground tabular-nums"
        >
          {saved ? "Saved" : "Saving…"}
        </span>
        <TableOfContents
          items={outline}
          onNavigate={scrollToHeading}
          trigger={
            <Button variant="ghost" size="sm" className="lg:hidden">
              <ListTree aria-hidden />
              Outline
            </Button>
          }
        />
        <AvatarGroup aria-label="Also editing: Bo Lindqvist">
          <PersonAvatar person={BO} />
        </AvatarGroup>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Comments, ${open.length} open`}
          onClick={() => setActiveId(open[0]?.id ?? null)}
        >
          <MessageSquare aria-hidden />
          <span aria-hidden className="tabular-nums">
            {open.length}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Version history"
          onClick={() => setHistoryOpen(true)}
        >
          <History aria-hidden />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Page actions"
              />
            }
          >
            <Ellipsis aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Export Markdown</DropdownMenuItem>
            <DropdownMenuItem>Print</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex min-w-0 gap-8">
        <TableOfContents
          variant="rail"
          items={outline}
          onNavigate={scrollToHeading}
          className="hidden [--table-of-contents-top:--spacing(6)] lg:block"
        />

        <div ref={pageRef} className="min-w-0 max-w-3xl flex-1">
          <TextEdit
            format="markdown"
            variant="document"
            aria-label="Page"
            value={body}
            onValueChange={(next) => {
              setBody(next);
              setSaved(false);
            }}
            onCommit={() => setSaved(true)}
            autosave={800}
            handleRef={handle}
            onOutlineChange={setOutline}
            annotations={annotations}
            activeAnnotationId={activeId}
            onAnnotationClick={setActiveId}
            // No margin beside the page: a count pill after each highlight marks where the
            // threads are, and opens one on tap.
            annotationCounts={wide ? "never" : "always"}
            onCreateAnnotation={createThread}
            onAnnotationsLayout={setLayout}
          />
        </div>

        {wide ? (
          <CommentMargin
            className="w-80 shrink-0"
            activeId={activeId}
            items={layout.map((item) => {
              const thread = open.find((t) => t.id === item.id);
              return {
                id: item.id,
                top: thread ? item.top : null,
                node: thread ? threadCard(thread) : null,
              };
            })}
          />
        ) : null}
      </div>

      {!wide ? (
        <CommentPopover
          open={active !== null}
          anchorRect={activeRect}
          onOpenChange={(next) => {
            if (!next) setActiveId(null);
          }}
        >
          {active ? threadCard(active) : null}
        </CommentPopover>
      ) : null}

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent size="xl">
          <SheetHeader>
            <SheetTitle>Version history</SheetTitle>
            <SheetDescription>
              Compare a saved version with the page now.
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="grid min-h-0 gap-6 md:grid-cols-[16rem_1fr]">
            <VersionList
              versions={
                namedOnly ? versions.filter((item) => item.name) : versions
              }
              currentId="current"
              selectedId={selectedVersion}
              onSelect={setSelectedVersion}
              namedOnly={namedOnly}
              onNamedOnlyChange={setNamedOnly}
              now={now}
            />
            <DiffView
              before={selectedVersion === "current" ? body : OLDER}
              after={body}
            />
          </SheetBody>
          <SheetFooter>
            <Button
              disabled={!version || version.id === "current"}
              onClick={() => {
                setBody(OLDER);
                setHistoryOpen(false);
              }}
            >
              <RotateCcw aria-hidden />
              Restore this version
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
