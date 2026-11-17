// @vegastack shell-01@0.100.0 sha256-u0JWW/g0PBA5OHjwSwtp0DmW/ffDo+g0mVW6j1KtXnk=

"use client";

import * as React from "react";
import {
  Bell,
  CalendarDays,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  Home,
  Inbox,
  Library,
  ListChecks,
  MessageSquare,
  Plus,
  Search,
  Share2,
  Sparkles,
  SquarePen,
  Hexagon,
  MoreHorizontal,
  Settings2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Shell,
  ShellBottomBar,
  ShellBottomBarItem,
  ShellColumn,
  ShellColumnHeader,
  ShellColumnItem,
  ShellColumnSection,
  ShellMain,
  ShellPage,
  ShellPanelToggle,
  ShellRail,
  ShellRailFooter,
  ShellRailItem,
  ShellRailMore,
  ShellTitleBarControls,
  ShellTopBar,
  ShellTopBarActions,
  ShellTopBarLabel,
  ShellTopBarPresence,
  ShellTopBarPrimary,
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
 * `shell-01` — the shell reference: the module rail, the Tasks column, the top bar in its fixed
 * order, a task list, and a record opening in the panel beside it. Click a task: it opens on the
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
      railHeader={
        <span
          aria-label="Acme"
          role="img"
          className="grid size-8 place-items-center rounded-tile bg-primary text-sm font-semibold text-primary-foreground"
        >
          A
        </span>
      }
      columnHead={
        <span className="truncate px-2 text-sm font-semibold">Acme</span>
      }
      titleBarControls={<ShellTitleBarControls />}
      rail={
        <ShellRail>
          <ShellRailItem icon={<SquarePen />} label="New" href="#new" />
          <ShellRailItem icon={<Search />} label="Search" href="#search" />
          <span
            aria-hidden="true"
            className="my-1 h-px w-7 flex-none bg-border"
          />
          <ShellRailItem icon={<Home />} label="Home" href="#home" />
          <ShellRailItem
            icon={<Inbox />}
            label="Inbox"
            href="#inbox"
            badge={4}
          />
          <ShellRailItem icon={<Sparkles />} label="Agents" href="#agents" />
          <ShellRailItem
            icon={<ListChecks />}
            label="Tasks"
            href="#tasks"
            badge={17}
            active
          />
          <ShellRailItem
            icon={<CalendarDays />}
            label="Meetings"
            href="#meetings"
          />
          <ShellRailItem icon={<Library />} label="Library" href="#library" />
          <ShellRailItem icon={<Hexagon />} label="Spaces" href="#spaces" />
          <ShellRailMore>
            <DropdownMenuItem>Products</DropdownMenuItem>
            <DropdownMenuItem>Customers</DropdownMenuItem>
            <DropdownMenuItem>Projects</DropdownMenuItem>
          </ShellRailMore>
          <ShellRailFooter>
            <ShellRailItem icon={<CircleHelp />} label="Help" href="#help" />
            <ShellRailItem
              icon={<Settings2 />}
              label="Settings"
              href="#settings"
            />
            <Avatar size="sm" className="mt-1">
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
          </ShellRailFooter>
        </ShellRail>
      }
      column={
        <ShellColumn label="Tasks">
          <ShellColumnHeader
            title="Tasks"
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="New task">
                <Plus />
              </Button>
            }
          />
          <ShellColumnSection>
            <ShellColumnItem
              label="My tasks"
              icon={<ListChecks />}
              count={12}
              href="#mine"
              active
            />
            <ShellColumnItem
              label="Created by me"
              icon={<SquarePen />}
              count={5}
              href="#created"
            />
            <ShellColumnItem
              label="Shared with me"
              icon={<Share2 />}
              href="#shared"
            />
            <ShellColumnItem
              label="Overdue"
              icon={<Bell />}
              count={3}
              href="#overdue"
            />
          </ShellColumnSection>
          <ShellColumnSection label="Spaces">
            <ShellColumnItem label="General" icon={<Hexagon />} defaultOpen>
              <ShellColumnItem label="Launch plan" depth={1} href="#launch" />
              <ShellColumnItem
                label="Pricing review"
                depth={1}
                href="#pricing"
              />
            </ShellColumnItem>
            <ShellColumnItem label="Design" icon={<Hexagon />}>
              <ShellColumnItem label="Shell layout" depth={1} href="#shell" />
            </ShellColumnItem>
          </ShellColumnSection>
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
          <ShellBottomBarItem icon={<Home />} label="Home" href="#home" />
          <ShellBottomBarItem
            icon={<Sparkles />}
            label="Agents"
            href="#agents"
          />
          <ShellBottomBarItem
            icon={<ListChecks />}
            label="Tasks"
            href="#tasks"
            active
          />
          <ShellBottomBarItem
            icon={<Inbox />}
            label="Inbox"
            href="#inbox"
            badge={4}
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
        <ShellTopBarTitle parents={<a href="#tasks">Tasks</a>}>
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
        <ShellTopBarActions>
          <Button variant="outline" size="sm">
            <Share2 />
            <ShellTopBarLabel>Share</ShellTopBarLabel>
          </Button>
        </ShellTopBarActions>
        <ShellTopBarPrimary>
          <Button size="sm">
            <Plus />
            <ShellTopBarLabel>New task</ShellTopBarLabel>
          </Button>
        </ShellTopBarPrimary>
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
