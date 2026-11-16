"use client";

import type * as React from "react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { FileText, MessageSquare, SquareCheck, Video } from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  ShellPanel,
  ShellPanelBody,
  ShellPanelClose,
  ShellPanelEmpty,
  ShellPanelHeader,
  ShellPanelOverflow,
  ShellPanelTab,
  ShellPanelTabs,
  ShellPanelView,
  usePanelTabs,
  type ShellPanelMode,
} from "@/components/ui/shell-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import {
  createPanelTabs,
  panelTabKey,
  panelTabsReducer,
  type PanelTabRef,
} from "@/lib/panel-tabs";

const RECORDS: Record<
  string,
  { title: string; icon: ReactNode; ref: PanelTabRef; body: string }
> = {};
function rec(
  type: string,
  id: string,
  title: string,
  icon: ReactNode,
  body: string,
) {
  const ref: PanelTabRef = { kind: "record", type, id, scope: "live" };
  RECORDS[panelTabKey(ref)] = { title, icon, ref, body };
  return panelTabKey(ref);
}
const ROWS = [
  rec(
    "task",
    "3",
    "Review Q3 pricing for Crescent Retail",
    <SquareCheck />,
    "Blocked on the finance sign-off for the Orchid quote.",
  ),
  rec(
    "task",
    "7",
    "Orchid quote sign-off",
    <SquareCheck />,
    "Waiting on two approvals.",
  ),
  rec(
    "meeting",
    "12",
    "Weekly ops sync",
    <Video />,
    "Decisions: ship the new price list on Monday.",
  ),
  rec(
    "page",
    "q3",
    "Q3 pricing notes",
    <FileText />,
    "The margin table for every customer above 10%.",
  ),
  rec(
    "task",
    "9",
    "Collect photometry files for the new range with a very long title that truncates",
    <SquareCheck />,
    "Three of eleven files are in.",
  ),
];
const COMMENTS: PanelTabRef = {
  kind: "view",
  view: "comments",
  subject: { type: "task", id: "3" },
};
RECORDS[panelTabKey(COMMENTS)] = {
  title: "Comments · Review Q3 pricing",
  icon: <MessageSquare />,
  ref: COMMENTS,
  body: "Priya Raman: I've pinged finance again.",
};

const titleOf = (key: string) => RECORDS[key]?.title ?? key;

function Demo({
  mode = "dock",
  start = [],
}: {
  mode?: ShellPanelMode;
  start?: { key: string; preview?: boolean; pinned?: boolean }[];
}) {
  const [width, setWidth] = useState(420);
  // Stand-in for Shell's own layout rule, so the preview behaves at every width: the whole
  // screen below the phone tier, over the page while the page would drop under 520px, else beside.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setRoom(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const autoMode: ShellPanelMode =
    room === null || room >= 520 + width
      ? "dock"
      : room < 640
        ? "full"
        : "overlay";
  const [open, setOpen] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const tabs = usePanelTabs({
    initial: () =>
      start.reduce((state, t) => {
        let next = panelTabsReducer(state, {
          type: "open",
          ref: RECORDS[t.key]!.ref,
          preview: t.preview,
          now: Date.now(),
        });
        if (t.pinned)
          next = panelTabsReducer(next, { type: "pin", key: t.key });
        return next;
      }, createPanelTabs()),
    onEvicted: (key) => setNote(`Closed ${titleOf(key)}`),
    onOverCap: () =>
      setNote("Every tab has a draft — close one you're done with."),
  });
  const { state } = tabs;
  const shown = open ? (mode === "dock" ? autoMode : mode) : "closed";
  const items = state.tabs.map((t) => ({
    value: t.key,
    title: titleOf(t.key),
    icon: RECORDS[t.key]?.icon,
    preview: t.preview,
  }));
  const closed = state.closed.map((t) => ({
    value: t.key,
    title: titleOf(t.key),
    icon: RECORDS[t.key]?.icon,
  }));
  return (
    <div
      ref={frameRef}
      data-slot="shell"
      data-panel-mode={shown}
      className="group/shell relative flex h-[30rem] w-full overflow-hidden rounded-card border border-border bg-background"
      style={
        { "--shell-panel-current-width": `${width}px` } as React.CSSProperties
      }
    >
      <main
        data-slot="shell-content"
        className="flex min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">My tasks</span>
          {!open ? (
            <Button
              size="sm"
              variant="outline"
              className="ms-auto"
              onClick={() => setOpen(true)}
            >
              Show panel
            </Button>
          ) : null}
        </div>
        <ItemGroup>
          {ROWS.map((key) => (
            <Item
              key={key}
              size="sm"
              className="min-w-0"
              render={<button type="button" />}
              data-peek-active={state.activeKey === key || undefined}
              onClick={(e) => {
                setOpen(true);
                tabs.open(RECORDS[key]!.ref, {
                  preview: !(e.metaKey || e.ctrlKey),
                  background: e.metaKey || e.ctrlKey,
                });
              }}
              onDoubleClick={() => tabs.open(RECORDS[key]!.ref)}
            >
              <ItemContent>
                <ItemTitle className="truncate">{titleOf(key)}</ItemTitle>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
        <p className="text-xs text-muted-foreground">
          Click a row for a preview tab, double-click to keep it, ⌘-click to
          open in the background. Right-click a tab for its menu.
        </p>
        {note ? (
          <div className="flex items-center gap-2 text-sm" role="status">
            {note}
            {state.undo?.reason === "cap" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  tabs.undo();
                  setNote(null);
                }}
              >
                Undo
              </Button>
            ) : null}
          </div>
        ) : null}
      </main>
      <div
        className={
          shown === "closed"
            ? "hidden"
            : shown === "dock"
              ? "h-full w-(--shell-panel-current-width) shrink-0 border-s border-border"
              : shown === "overlay"
                ? "absolute inset-y-0 end-0 z-50 w-(--shell-panel-current-width) border-s border-border shadow-lg"
                : "absolute inset-0 z-50"
        }
      >
        <ShellPanel
          mode={shown}
          width={width}
          onWidthChange={setWidth}
          onRequestClose={() => setOpen(false)}
        >
          <ShellPanelHeader>
            <ShellPanelTabs
              value={state.activeKey}
              onValueChange={tabs.activate}
              onClose={tabs.close}
              onReorder={tabs.reorder}
              onAction={(key, action) => {
                if (!tabs.act(key, action))
                  setNote(
                    action === "copyLink"
                      ? "Link copied"
                      : `${action} · ${titleOf(key)}`,
                  );
              }}
            >
              {state.tabs.map((t) => (
                <ShellPanelTab
                  key={t.key}
                  value={t.key}
                  title={titleOf(t.key)}
                  icon={RECORDS[t.key]?.icon}
                  preview={t.preview}
                  pinned={t.pinned}
                  changed={t.changed}
                  href={`/${t.key.replace(":", "/")}`}
                />
              ))}
            </ShellPanelTabs>
            {state.tabs.length > 0 ? (
              <ShellPanelOverflow
                tabs={items}
                closed={closed}
                value={state.activeKey}
                onSelect={tabs.activate}
                onReopen={tabs.reopen}
                footer="Tabs unseen for 1 day close by themselves."
              />
            ) : null}
            <ShellPanelClose onClick={() => setOpen(false)} />
          </ShellPanelHeader>
          {state.tabs.length === 0 ? (
            <ShellPanelEmpty
              recent={closed.slice(0, 5)}
              onReopen={tabs.reopen}
            />
          ) : (
            <ShellPanelBody>
              {state.tabs.map((t) => (
                <ShellPanelView
                  key={t.key}
                  value={t.key}
                  activeValue={state.activeKey}
                  focusRequest={
                    state.focus?.key === t.key ? state.focus.seq : undefined
                  }
                >
                  <div className="flex flex-col gap-3 px-4 pt-4 pb-6">
                    <h2 className="text-lg font-semibold">{titleOf(t.key)}</h2>
                    <div className="flex gap-2">
                      <Badge variant="secondary">In progress</Badge>
                      {t.back.length > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => tabs.back(t.key)}
                        >
                          Back
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {RECORDS[t.key]?.body}
                    </p>
                    {t.ref.kind === "record" && t.ref.type === "task" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="self-start"
                        onClick={() =>
                          tabs.navigate(t.key, {
                            kind: "view",
                            view: "comments",
                            subject: { type: "task", id: t.key.slice(5) },
                          })
                        }
                      >
                        Comments
                      </Button>
                    ) : null}
                    <Textarea
                      // A draft keeps the tab and guards it from the cap and auto-close.
                      onInput={(e) =>
                        tabs.protect(t.key, e.currentTarget.value.trim() !== "")
                      }
                      aria-label="Comment"
                      placeholder="Write a comment — it stays here when you switch tabs"
                    />
                  </div>
                </ShellPanelView>
              ))}
            </ShellPanelBody>
          )}
        </ShellPanel>
      </div>
    </div>
  );
}

/** Beside the page, with a preview tab, a pinned tab and the overflow menu. */
export function shellPanel(): ReactNode {
  return (
    <Wrapper className="block">
      <Demo
        start={[
          { key: "page:q3", pinned: true },
          { key: "task:7" },
          { key: "task:3", preview: true },
        ]}
      />
    </Wrapper>
  );
}

/** Nothing open: Recently closed comes back from here. */
export function shellPanelEmpty(): ReactNode {
  return (
    <Wrapper className="block">
      <Demo />
    </Wrapper>
  );
}

/** Over the page: Escape closes it; it never closes a docked one. */
export function shellPanelOverlay(): ReactNode {
  return (
    <Wrapper className="block">
      <Demo mode="overlay" start={[{ key: "task:3" }, { key: "meeting:12" }]} />
    </Wrapper>
  );
}
