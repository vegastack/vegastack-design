// @vegastack shell-01@0.106.0 sha256-rg2DrSq5hrVkFK8qE1f12uMmnLjqOrBR1sXjQg+ZxrI=

"use client";

import * as React from "react";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronsUpDown,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  Clock,
  Hexagon,
  Home,
  Inbox,
  LayoutDashboard,
  Library,
  ListChecks,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings2,
  Share2,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  GlobalBar,
  GlobalBarAsk,
  GlobalBarCenter,
  GlobalBarLeading,
  GlobalBarSearch,
  GlobalBarTrailing,
} from "@/components/ui/global-bar";
import { NavTree, NavTreeItem, NavTreeSection } from "@/components/ui/nav-tree";
import { Rail, RailBottom, RailItem } from "@/components/ui/rail";
import {
  Shell,
  ShellBottomBar,
  ShellBottomBarItem,
  ShellColumn,
  ShellColumnHeader,
  ShellColumnToggle,
  ShellMain,
  ShellPage,
  ShellPanelToggle,
  ShellTopBar,
  ShellTopBarFavorite,
  ShellTopBarLabel,
  ShellTopBarMore,
  ShellTopBarPresence,
  ShellTopBarPrimary,
  ShellTopBarShare,
  ShellTopBarTitle,
  ShellTopBarTools,
} from "@/components/ui/shell";
import { TASKS, type Task } from "./components/tasks";

const people = [
  { initials: "AC", name: "Asha Chen" },
  { initials: "MK", name: "Manoj Kumar" },
  { initials: "RS", name: "Ravi Shah" },
];

function StatusIcon({ status }: { status: Task["status"] }) {
  if (status === "done")
    return <CircleCheck aria-hidden="true" className="size-4 text-primary" />;
  if (status === "doing")
    return (
      <CircleDashed
        aria-hidden="true"
        className="size-4 text-muted-foreground"
      />
    );
  return <Circle aria-hidden="true" className="size-4 text-muted-foreground" />;
}

/**
 * `shell-01` — the shell reference: the global bar, the module rail, Home's column with Tasks,
 * Meetings and Library nested under Work, the top bar in its fixed order, a task list, and a
 * record opening in the panel beside it. Click a task: it opens on the
 * right, and the column folds by itself when the page would get narrower than a list may.
 *
 * @example
 * <Shell01Page fill="parent" />
 */
export default function Shell01Page({
  fill = "viewport",
}: {
  /** `parent` fills a preview frame instead of the window. */
  fill?: "viewport" | "parent";
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const task = TASKS.find((t) => t.id === openId) ?? null;

  const openTask = (id: string) => {
    setOpenId(id);
    setPanelOpen(true);
  };

  return (
    <Shell
      fill={fill}
      pageMin={640}
      panelOpen={panelOpen}
      globalBar={
        <GlobalBar>
          <GlobalBarLeading>
            <ShellColumnToggle />
            <Button variant="ghost" size="sm" className="gap-2 font-semibold">
              <span
                aria-hidden="true"
                className="grid size-5 place-items-center rounded-tile bg-primary text-xs font-semibold text-primary-foreground"
              >
                A
              </span>
              Acme
              <ChevronsUpDown className="text-muted-foreground" />
            </Button>
          </GlobalBarLeading>
          <GlobalBarCenter>
            <GlobalBarSearch />
          </GlobalBarCenter>
          <GlobalBarTrailing>
            <GlobalBarAsk />
            <Button variant="ghost" size="icon-sm" aria-label="Help">
              <CircleHelp />
            </Button>
            <Avatar size="sm">
              <AvatarFallback aria-label="Manoj Kumar">MK</AvatarFallback>
            </Avatar>
          </GlobalBarTrailing>
        </GlobalBar>
      }
      rail={
        <Rail>
          <RailItem icon={<Home />} label="Home" href="#home" active />
          <RailItem icon={<Inbox />} label="Inbox" href="#inbox" badge={120} />
          <RailItem icon={<Hexagon />} label="Spaces" href="#spaces" />
          <RailItem icon={<Sparkles />} label="Agents" href="#agents" />
          <RailItem icon={<Boxes />} label="Products" href="#products" />
          <RailItem icon={<BarChart3 />} label="Sales" href="#sales" />
          <RailBottom>
            <RailItem icon={<Settings2 />} label="Settings" href="#settings" />
          </RailBottom>
        </Rail>
      }
      column={
        <ShellColumn label="Home">
          <ShellColumnHeader
            title="Home"
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="New task">
                <Plus />
              </Button>
            }
          />
          <NavTree>
            <NavTreeSection>
              <NavTreeItem
                label="Overview"
                icon={<LayoutDashboard />}
                href="#overview"
              />
            </NavTreeSection>
            <NavTreeSection label="Favourites">
              <NavTreeItem label="Launch plan" icon={<Star />} href="#launch" />
            </NavTreeSection>
            <NavTreeSection label="Work">
              <NavTreeItem
                label="Tasks"
                icon={<ListChecks />}
                count={17}
                href="#tasks"
                defaultOpen
              >
                <NavTreeItem label="My tasks" count={12} href="#mine" active />
                <NavTreeItem label="Created by me" count={5} href="#created" />
                <NavTreeItem label="Overdue" count={3} href="#overdue" />
              </NavTreeItem>
              <NavTreeItem
                label="Meetings"
                icon={<CalendarDays />}
                href="#meetings"
              >
                <NavTreeItem label="Upcoming" href="#upcoming" />
                <NavTreeItem label="Recordings" href="#recordings" />
              </NavTreeItem>
              <NavTreeItem label="Library" icon={<Library />} href="#library" />
            </NavTreeSection>
            <NavTreeSection label="Recent">
              <NavTreeItem
                label="Pricing review"
                icon={<Clock />}
                href="#pricing"
              />
            </NavTreeSection>
          </NavTree>
        </ShellColumn>
      }
      panel={
        <div className="flex h-full min-h-0 flex-col">
          <div
            data-slot="shell-panel-head"
            className="flex h-(--shell-topbar-height) flex-none items-center gap-1 border-b border-border ps-2 pe-2"
          >
            <span className="min-w-0 flex-1 truncate ps-2 text-sm font-medium">
              {task ? task.title : "Nothing open"}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close the panel"
              onClick={() => setPanelOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            {task ? (
              <>
                <h2 className="flex items-start gap-2 text-lg font-semibold">
                  <span className="mt-1.5">
                    <StatusIcon status={task.status} />
                  </span>
                  {task.title}
                </h2>
                <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Assignee</dt>
                  <dd>{task.assignee}</dd>
                  <dt className="text-muted-foreground">Due</dt>
                  <dd>{task.due}</dd>
                  <dt className="text-muted-foreground">Space</dt>
                  <dd>{task.space}</dd>
                </dl>
                <p className="text-sm text-muted-foreground">{task.note}</p>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Open a task and it shows here.
              </p>
            )}
          </div>
        </div>
      }
      bottomBar={
        <ShellBottomBar>
          <ShellBottomBarItem
            icon={<Home />}
            label="Home"
            href="#home"
            active
          />
          <ShellBottomBarItem
            icon={<Inbox />}
            label="Inbox"
            href="#inbox"
            badge={120}
          />
          <ShellBottomBarItem
            icon={<Sparkles />}
            label="Agents"
            href="#agents"
          />
          <ShellBottomBarItem
            icon={<Hexagon />}
            label="Spaces"
            href="#spaces"
          />
          <ShellBottomBarItem
            icon={<MoreHorizontal />}
            label="More"
            href="#more"
          />
        </ShellBottomBar>
      }
    >
      <ShellTopBar>
        <ShellTopBarTitle parents={<a href="#home">Home</a>}>
          My tasks
        </ShellTopBarTitle>
        <ShellTopBarPresence>
          <AvatarGroup>
            {people.map((p) => (
              <Avatar key={p.initials} size="sm">
                <AvatarFallback aria-label={p.name}>
                  {p.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        </ShellTopBarPresence>
        <ShellTopBarMore>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            <MoreHorizontal />
          </Button>
        </ShellTopBarMore>
        <ShellTopBarFavorite>
          <Button variant="ghost" size="icon-sm" aria-label="Favourite">
            <Star />
          </Button>
        </ShellTopBarFavorite>
        <ShellTopBarShare>
          <Button variant="outline" size="sm">
            <Share2 />
            <ShellTopBarLabel>Share</ShellTopBarLabel>
          </Button>
        </ShellTopBarShare>
        <ShellTopBarPrimary>
          <Button size="sm">
            <Plus />
            <ShellTopBarLabel>New task</ShellTopBarLabel>
          </Button>
        </ShellTopBarPrimary>
        <ShellTopBarTools>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Comments"
            data-shell-fold
          >
            <MessageSquare />
          </Button>
        </ShellTopBarTools>
        <ShellPanelToggle
          pressed={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
        />
      </ShellTopBar>
      <ShellMain>
        <ShellPage>
          <ul role="list" aria-label="My tasks" className="-mx-2 flex flex-col">
            {TASKS.map((t) => (
              <li key={t.id}>
                <Button
                  variant="ghost"
                  aria-current={
                    t.id === openId && panelOpen ? "true" : undefined
                  }
                  onClick={() => openTask(t.id)}
                  className="h-auto w-full justify-start gap-3 rounded-item px-2 py-2 text-start font-normal aria-current:bg-state-selected"
                >
                  <StatusIcon status={t.status} />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  <span className="hidden flex-none text-muted-foreground @min-[36rem]/shell-content:inline">
                    {t.space}
                  </span>
                  <span className="w-16 flex-none text-end text-muted-foreground tabular-nums">
                    {t.due}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </ShellPage>
      </ShellMain>
    </Shell>
  );
}
