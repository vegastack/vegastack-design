// @vegastack shell-01@0.138.0 sha256-Le8DgPjkt301abHKmmIIN6oBlgL/5ElcaJgHLFH1q/U=

"use client";

import * as React from "react";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  Clock,
  History,
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
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MembersStack } from "@/components/ui/members-stack";
import {
  GlobalBar,
  GlobalBarCenter,
  GlobalBarHelp,
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
import {
  Rail,
  RailBottom,
  RailItem,
  RailTile,
  RailTop,
} from "@/components/ui/rail";
import { AssistantCard } from "@/components/ui/shell-assistant";
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
    return <CircleCheck aria-hidden="true" className="size-4 text-check" />;
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
 * `shell-01` — the shell reference: the rounded-card frame (LAY-26) — the global bar and the rail
 * on the window's canvas, with the workspace's tile and the person's avatar at the rail's ends,
 * one search-or-ask box and "? Help" — then Home's column and the page in one card: Tasks,
 * Meetings and Library nested under Work, the top bar in its fixed order, a task list, and a
 * task opening in a `Peek` over the page's right side (↑ ↓ walk the list, ⤢ opens its page, Esc
 * closes it). The box's Ask chip opens the assistant docked beside the page. On a phone the peek is
 * a bottom sheet.
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
  const [askOpen, setAskOpen] = React.useState(false);
  const index = TASKS.findIndex((t) => t.id === openId);
  const task = index >= 0 ? TASKS[index] : null;

  return (
    <Shell
      fill={fill}
      globalBar={
        <GlobalBar>
          <GlobalBarLeading>
            <ShellColumnToggle />
          </GlobalBarLeading>
          <GlobalBarCenter>
            <Button variant="ghost" size="icon-sm" aria-label="Recent">
              <History />
            </Button>
            <GlobalBarSearch
              label="Search or ask anything…"
              ask={{
                label: "Ask William",
                onClick: () => setAskOpen((open) => !open),
                controls: "shell-01-assistant",
                expanded: askOpen,
              }}
            />
          </GlobalBarCenter>
          <GlobalBarTrailing>
            <GlobalBarHelp dot="new updates" />
          </GlobalBarTrailing>
        </GlobalBar>
      }
      rail={
        <Rail>
          <RailTop>
            <RailTile label="Workspace: Acme. Switch workspace">A</RailTile>
          </RailTop>
          <RailItem icon={<Home />} label="Home" href="#home" active />
          <RailItem icon={<Inbox />} label="Inbox" href="#inbox" badge={120} />
          <RailItem icon={<Hexagon />} label="Spaces" href="#spaces" />
          <RailItem icon={<Sparkles />} label="Agents" href="#agents" />
          <RailItem icon={<Boxes />} label="Products" href="#products" />
          <RailItem icon={<BarChart3 />} label="Sales" href="#sales" />
          <RailBottom>
            <RailItem icon={<Settings2 />} label="Settings" href="#settings" />
            <RailTile shape="avatar" label="Manoj Kumar, account">
              <Avatar>
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
            </RailTile>
          </RailBottom>
        </Rail>
      }
      assistant={<Assistant open={askOpen} onOpenChange={setAskOpen} />}
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
              className="grid size-7 place-items-center rounded-tile bg-ink text-sm font-semibold text-ink-foreground"
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

/** The assistant's card, docked beside the page. */
function Assistant({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AssistantCard
      id="shell-01-assistant"
      aria-labelledby="shell-01-assistant-title"
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* The chat draws its own header and thread; the card is the frame. */}
      <div className="flex h-11 shrink-0 items-center gap-2 ps-4 pe-2">
        <h2
          id="shell-01-assistant-title"
          className="min-w-0 flex-1 truncate text-sm font-semibold"
        >
          William
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
        >
          <X />
        </Button>
      </div>
      <p className="px-4 py-2 text-sm text-muted-foreground">
        Ask anything about your workspace.
      </p>
    </AssistantCard>
  );
}
