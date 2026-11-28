// @vegastack agent-directory-card@0.143.1 sha256-PHYg0YiKfO5SY3NGiFEw7IfXytqL+kfLZG1ky6cfHiU=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * AgentDirectoryCard — one agent in the directory, drawn as the app's directory cards are (Browse
 * spaces, Settings › Teams): the agent's avatar as the tile, its name (the card's one link) with
 * its status and the verified mark on that line, where it lives as the muted line, its job in up
 * to two lines, two example asks, the apps it uses, then its maintainers and the Chat button. The
 * Chat button, the examples, the verified mark and the ⋯ sit above the link, so nothing
 * interactive nests inside it. A paused agent mutes. `layout="row"` is the list form.
 * ----------------------------------------------------------------------------------------------*/

/** Where an agent stands. `live` draws no badge. */
export type AgentDirectoryStatus = "live" | "draft" | "paused";

/** Props accepted by `AgentDirectoryCard`. */
export interface AgentDirectoryCardProps {
  /** The agent's name; the card's one link. */
  name: string;
  /** Where the card goes. */
  href: string;
  /**
   * The link element to render instead of `<a>` (a router `Link`); it receives `href`,
   * `className` and children. @default undefined
   */
  linkRender?: React.ReactElement<Record<string, unknown>>;
  /** The agent's avatar, drawn as the tile. */
  avatar: React.ReactNode;
  /** What it does, up to two lines. */
  job: string;
  /** Example asks; the first two show, one line each, each a button when `onExample` is set. @default undefined */
  examples?: string[];
  /** An example was picked: start a chat with its words. @default undefined */
  onExample?: (text: string) => void;
  /** Where it lives: "Workspace · Finance team", "Space · Bay 3", "Private". @default undefined */
  place?: string;
  /** The apps it uses; four show, then "+n". @default undefined */
  apps?: { icon: React.ReactNode; label: string }[];
  /** Who verified it, when, at which version, and whether it changed since. @default undefined */
  verified?: {
    by: string;
    at: string;
    version?: number;
    changedSince?: boolean;
  };
  /** A badge for `draft` and `paused`; paused mutes the card. @default "live" */
  status?: AgentDirectoryStatus;
  /** The Chat button: a link or a handler. @default undefined */
  chat?: { href: string } | { onClick: () => void };
  /** The maintainers, as a `MembersStack`. @default undefined */
  people?: React.ReactNode;
  /** The ⋯ menu, at the top end. @default undefined */
  actions?: React.ReactNode;
  /** `grid` — a card in a grid. `row` — a list row. @default "grid" */
  layout?: "grid" | "row";
  /** Classes for the root. @default undefined */
  className?: string;
}

const STATUS_BADGE: Partial<
  Record<
    AgentDirectoryStatus,
    { label: string; variant: "outline" | "secondary" }
  >
> = {
  draft: { label: "Draft", variant: "outline" },
  paused: { label: "Paused", variant: "secondary" },
};

/** "Verified by Asha · v4 · 12 Nov · changed since". */
function verifiedWords(
  verified: NonNullable<AgentDirectoryCardProps["verified"]>,
) {
  return [
    `Verified by ${verified.by}`,
    verified.version != null ? `v${verified.version}` : null,
    verified.at,
    verified.changedSince ? "changed since" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The name's tags: the status badge and the verified mark with its tooltip. */
function NameTags({
  status,
  verified,
}: Pick<AgentDirectoryCardProps, "status" | "verified">) {
  const badge = status ? STATUS_BADGE[status] : undefined;
  if (!badge && !verified) return null;
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {verified ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                tabIndex={0}
                role="img"
                data-slot="agent-directory-card-verified"
                data-changed={verified.changedSince ? "" : undefined}
                aria-label={verifiedWords(verified)}
                className="relative z-10 inline-flex rounded-mark before:absolute before:-inset-1 before:content-['']"
              />
            }
          >
            <BadgeCheck
              aria-hidden
              className={cn(
                "size-4",
                verified.changedSince ? "text-muted-foreground" : "text-check",
              )}
            />
          </TooltipTrigger>
          <TooltipContent>{verifiedWords(verified)}</TooltipContent>
        </Tooltip>
      ) : null}
      {badge ? (
        <Badge variant={badge.variant} data-slot="agent-directory-card-status">
          {badge.label}
        </Badge>
      ) : null}
    </span>
  );
}

/** The apps it uses: four icons, then "+n"; their names in one label. */
function Apps({
  apps,
}: {
  apps: NonNullable<AgentDirectoryCardProps["apps"]>;
}) {
  const shown = apps.slice(0, 4);
  const rest = apps.length - shown.length;
  return (
    <span
      data-slot="agent-directory-card-apps"
      role="img"
      aria-label={`Uses ${apps.map((app) => app.label).join(", ")}`}
      className="flex shrink-0 items-center gap-1 text-muted-foreground [&_svg]:size-4"
    >
      {shown.map((app, index) => (
        <span key={`${app.label}-${index}`} aria-hidden className="inline-flex">
          {app.icon}
        </span>
      ))}
      {rest > 0 ? (
        <span aria-hidden className="text-xs tabular-nums">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

/** The Chat button, the card's one main action: secondary, never filled. */
function ChatButton({
  chat,
  name,
}: {
  chat: NonNullable<AgentDirectoryCardProps["chat"]>;
  name: string;
}) {
  return "href" in chat ? (
    <a
      href={chat.href}
      aria-label={`Chat with ${name}`}
      data-slot="agent-directory-card-chat"
      data-variant="secondary"
      className={cn(
        buttonVariants({ variant: "secondary", size: "sm" }),
        "z-10 no-underline",
      )}
    >
      Chat
    </a>
  ) : (
    <Button
      size="sm"
      variant="secondary"
      onClick={chat.onClick}
      aria-label={`Chat with ${name}`}
      data-slot="agent-directory-card-chat"
      className="relative z-10"
    >
      Chat
    </Button>
  );
}

/** The card's link: the name, stretched over the whole card. */
function NameLink({
  name,
  href,
  linkRender,
}: Pick<AgentDirectoryCardProps, "name" | "href" | "linkRender">) {
  const props = {
    href,
    "data-slot": "agent-directory-card-link",
    className:
      "min-w-0 truncate py-0.5 font-medium text-foreground no-underline after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
    children: name,
  };
  return linkRender ? React.cloneElement(linkRender, props) : <a {...props} />;
}

/**
 * `AgentDirectoryCard` — one agent in the directory: tile, name (the card's one link), status and
 * verified mark, where it lives, its job, example asks, its apps, its maintainers and Chat.
 *
 * @example
 * <AgentDirectoryCard
 *   name="Expense checker"
 *   href="/agents/expense-checker"
 *   avatar={<PersonAvatar person={{ name: "Expense checker", kind: "agent" }} size="lg" />}
 *   job="Checks expense claims against the travel policy and flags what needs a receipt."
 *   examples={["Check this week's claims", "Which claims lack a receipt?"]}
 *   onExample={startChat}
 *   place="Workspace · Finance team"
 *   verified={{ by: "Asha", at: "12 Nov", version: 4 }}
 *   chat={{ href: "/agents/expense-checker/chat" }}
 *   people={<MembersStack people={maintainers} label="Maintainers" />}
 *   actions={<AgentMenu />}
 * />
 */
export function AgentDirectoryCard({
  name,
  href,
  linkRender,
  avatar,
  job,
  examples,
  onExample,
  place,
  apps,
  verified,
  status = "live",
  chat,
  people,
  actions,
  layout = "grid",
  className,
}: AgentDirectoryCardProps) {
  const paused = status === "paused";
  const shownExamples = (examples ?? []).slice(0, 2);
  const examplesBlock = shownExamples.length ? (
    <ul
      data-slot="agent-directory-card-examples"
      aria-label={`Try asking ${name}`}
      className="flex w-full min-w-0 flex-col gap-0.5"
    >
      {shownExamples.map((example) => (
        <li key={example} className="flex min-w-0">
          {onExample ? (
            <Button
              size="xs"
              variant="ghost"
              title={example}
              className="relative z-10 -ms-2 max-w-[calc(100%+--spacing(2))] min-w-0 justify-start font-normal text-muted-foreground"
              onClick={() => onExample(example)}
            >
              <span className="truncate">“{example}”</span>
            </Button>
          ) : (
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              “{example}”
            </span>
          )}
        </li>
      ))}
    </ul>
  ) : null;

  const root = cn(
    "relative state-layer has-[[data-slot=agent-directory-card-link]:focus-visible]:layer-focus",
    className,
  );

  if (layout === "row")
    return (
      <div
        data-slot="agent-directory-card"
        data-layout="row"
        data-status={status}
        className={cn(
          "flex min-h-14 min-w-0 items-center gap-3 rounded-item px-2 py-2",
          root,
        )}
      >
        <span
          data-slot="agent-directory-card-avatar"
          className={cn("inline-flex shrink-0", paused && "opacity-60")}
        >
          {avatar}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <NameLink name={name} href={href} linkRender={linkRender} />
            <NameTags status={status} verified={verified} />
          </span>
          <span
            data-slot="agent-directory-card-job"
            className="min-w-0 truncate text-xs text-muted-foreground"
          >
            {place ? `${place} · ${job}` : job}
          </span>
        </div>
        {apps?.length ? (
          <span className="max-sm:hidden">
            <Apps apps={apps} />
          </span>
        ) : null}
        {people ? (
          <span className="relative z-10 shrink-0 max-sm:hidden">{people}</span>
        ) : null}
        {chat ? <ChatButton chat={chat} name={name} /> : null}
        {actions ? (
          <span className="relative z-10 shrink-0">{actions}</span>
        ) : null}
      </div>
    );

  return (
    <Card
      size="sm"
      data-slot="agent-directory-card"
      data-layout="grid"
      data-status={status}
      className={cn("h-full gap-3", root)}
    >
      <div className="flex min-w-0 items-center gap-3 px-3">
        <span
          data-slot="agent-directory-card-avatar"
          className={cn("inline-flex shrink-0", paused && "opacity-60")}
        >
          {avatar}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <NameLink name={name} href={href} linkRender={linkRender} />
            <NameTags status={status} verified={verified} />
          </span>
          {place ? (
            <span
              data-slot="agent-directory-card-place"
              className="truncate text-xs text-muted-foreground"
            >
              {place}
            </span>
          ) : null}
        </div>
        {actions ? (
          <span className="relative z-10 -my-1 shrink-0">{actions}</span>
        ) : null}
      </div>
      <p
        data-slot="agent-directory-card-job"
        className={cn(
          "line-clamp-2 px-3 text-sm",
          paused ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {job}
      </p>
      {examplesBlock ? (
        <div className="min-w-0 px-3">{examplesBlock}</div>
      ) : null}
      <div className="mt-auto flex min-w-0 items-center gap-2 px-3">
        {people ? (
          <span className="relative z-10 inline-flex min-w-0 items-center">
            {people}
          </span>
        ) : null}
        {apps?.length ? <Apps apps={apps} /> : null}
        <span className="flex-1" />
        {chat ? <ChatButton chat={chat} name={name} /> : null}
      </div>
    </Card>
  );
}

/** Props accepted by `AgentDirectoryCardSkeleton`. */
export interface AgentDirectoryCardSkeletonProps {
  /** Match the cards it stands in for. @default "grid" */
  layout?: "grid" | "row";
}

/**
 * `AgentDirectoryCardSkeleton` — a directory card's shape while it loads.
 *
 * @example
 * <AgentDirectoryCardSkeleton layout="grid" />
 */
export function AgentDirectoryCardSkeleton({
  layout = "grid",
}: AgentDirectoryCardSkeletonProps) {
  if (layout === "row")
    return (
      <div
        data-slot="agent-directory-card-skeleton"
        data-layout="row"
        aria-hidden
        className="flex min-h-14 items-center gap-3 px-2 py-2"
      >
        <Skeleton className="size-8 shrink-0 rounded-tile" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-7 w-14" />
      </div>
    );
  return (
    <Card
      size="sm"
      data-slot="agent-directory-card-skeleton"
      data-layout="grid"
      aria-hidden
      className="h-full gap-3"
    >
      <div className="flex min-w-0 items-center gap-3 px-3">
        <Skeleton className="size-10 shrink-0 rounded-tile" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="mt-auto flex items-center justify-between px-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-7 w-14" />
      </div>
    </Card>
  );
}
