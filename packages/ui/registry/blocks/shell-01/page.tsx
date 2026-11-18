// @vegastack shell-01@0.113.0 sha256-AZmmsMAgDvgiG+s/L4a2WU8I/V6SajRlu7cs2Zrem3Q=

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
  Bell,
  MoreHorizontal,
  Plus,
  Settings2,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MembersStack } from "@/components/ui/members-stack";
import {
  GlobalBar,
  GlobalBarAsk,
  GlobalBarCenter,
  GlobalBarLeading,
  GlobalBarSearch,
  GlobalBarTrailing,
} from "@/components/ui/global-bar";
import { NavTree, NavTreeItem, NavTreeSection } from "@/components/ui/nav-tree";
import {
  Peek,
  PeekActions,
  PeekBody,
  PeekClose,
  PeekHeader,
  PeekNav,
  PeekOpen,
  PeekPath,
  PeekTitle,
} from "@/components/ui/peek";
import { Rail, RailBottom, RailItem } from "@/components/ui/rail";
import {
  Shell,
  ShellBottomBar,
  ShellBottomBarItem,
  ShellColumn,
  ShellColumnHeader,
  ShellColumnSwitch,
  ShellColumnToggle,
  ShellMain,
  ShellPage,
  ShellTopBar,
  ShellTopBarAccount,
  ShellTopBarFavorite,
  ShellTopBarLabel,
  ShellTopBarMore,
  ShellTopBarMembers,
  ShellTopBarShare,
  ShellTopBarTitle,
  ShellTopBarWatch,
} from "@/components/ui/shell";
import { TASKS, type Task } from "./components/tasks";

const people = [
  { name: "Asha Chen", hue: "blue" as const, active: true },
  { name: "Manoj Kumar", hue: "green" as const, you: true },
  { name: "Ravi Shah", hue: "orange" as const },
];

/** A phone's bar is one row: Share, Watch and ☆ fold into the page's ⋯ there. */
const PHONE_FOLDS = "@max-[40rem]/shell:hidden";

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
 * task opening in a `Peek` over the page's right side: ↑ ↓ walk the list, ⤢ opens its page, Esc
 * closes it. On a phone the peek is a bottom sheet.
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
  const [peekWidth, setPeekWidth] = React.useState(520);
  const index = TASKS.findIndex((t) => t.id === openId);
  const task = index >= 0 ? TASKS[index] : null;

  return (
    <Shell
      fill={fill}
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
        {/* A phone's top bar: the workspace's logo, the module and ⌄ open its places. */}
        <ShellColumnSwitch
          media={
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-tile bg-primary text-sm font-semibold text-primary-foreground"
            >
              A
            </span>
          }
        >
          Home
        </ShellColumnSwitch>
        <ShellTopBarTitle
          parents={<a href="#home">Home</a>}
          // A phone's bar names the module, not the page: the page keeps its own title.
          className="@max-[40rem]/shell:[&>nav]:hidden @max-[40rem]/shell:[&>[data-slot=shell-topbar-heading]]:sr-only"
        >
          My tasks
        </ShellTopBarTitle>
        <ShellTopBarMembers>
          <MembersStack people={people} total={5} />
        </ShellTopBarMembers>
        <ShellTopBarMore>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            <MoreHorizontal />
          </Button>
        </ShellTopBarMore>
        <ShellTopBarFavorite className={PHONE_FOLDS}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Favourite"
            aria-pressed={false}
          >
            <Star />
          </Button>
        </ShellTopBarFavorite>
        <ShellTopBarWatch className={PHONE_FOLDS}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Watch"
            aria-pressed={false}
          >
            <Bell />
          </Button>
        </ShellTopBarWatch>
        <ShellTopBarShare className={PHONE_FOLDS}>
          <Button variant="ghost" size="sm">
            <Share2 />
            <ShellTopBarLabel>Share</ShellTopBarLabel>
          </Button>
        </ShellTopBarShare>
        {/* A phone has no global bar: Help and the avatar end its top bar. */}
        <ShellTopBarAccount>
          <Button variant="ghost" size="icon-lg" aria-label="Help">
            <CircleHelp />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full"
            aria-label="Manoj Kumar, account"
          >
            <Avatar className="size-7.5">
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
          </Button>
        </ShellTopBarAccount>
      </ShellTopBar>
      <ShellMain>
        <ShellPage>
          <ul role="list" aria-label="My tasks" className="-mx-2 flex flex-col">
            {TASKS.map((t) => (
              <li key={t.id}>
                <Button
                  variant="ghost"
                  aria-current={t.id === openId ? "true" : undefined}
                  onClick={() => setOpenId(t.id)}
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
        <Peek
          open={task !== null}
          onOpenChange={(open) => !open && setOpenId(null)}
          width={peekWidth}
          onWidthChange={setPeekWidth}
          label="Task"
        >
          {task ? (
            <>
              <PeekHeader>
                <PeekNav
                  onPrevious={
                    index > 0
                      ? () => setOpenId(TASKS[index - 1]!.id)
                      : undefined
                  }
                  onNext={
                    index < TASKS.length - 1
                      ? () => setOpenId(TASKS[index + 1]!.id)
                      : undefined
                  }
                />
                <PeekPath>
                  <span className="truncate">Tasks › {task.space}</span>
                </PeekPath>
                <PeekActions>
                  <PeekOpen href={`#task-${task.id}`} />
                  <PeekClose />
                </PeekActions>
              </PeekHeader>
              <PeekBody>
                <PeekTitle className="flex items-start gap-2">
                  <span className="mt-1.5">
                    <StatusIcon status={task.status} />
                  </span>
                  {task.title}
                </PeekTitle>
                <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Assignee</dt>
                  <dd>{task.assignee}</dd>
                  <dt className="text-muted-foreground">Due</dt>
                  <dd>{task.due}</dd>
                  <dt className="text-muted-foreground">Space</dt>
                  <dd>{task.space}</dd>
                </dl>
                <p className="text-sm text-muted-foreground">{task.note}</p>
              </PeekBody>
            </>
          ) : null}
        </Peek>
      </ShellMain>
    </Shell>
  );
}
