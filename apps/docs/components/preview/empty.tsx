"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRightIcon,
  BellIcon,
  CloudIcon,
  FolderCodeIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/empty` (dogfoods the registry) → auto-scanned.
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

/** Deterministic local fixtures (apps/docs/public/preview) — no network dependency. */
const ADA = {
  src: "/preview/avatar-1.svg",
  alt: "Ada Lovelace",
  fallback: "AL",
};
const AVATARS = [
  ADA,
  { src: "/preview/avatar-2.svg", alt: "Grace Hopper", fallback: "GH" },
  { src: "/preview/avatar-3.svg", alt: "Alan Turing", fallback: "AT" },
];

export function empty(): ReactNode {
  return (
    <Wrapper>
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCodeIcon />
          </EmptyMedia>
          <EmptyTitle>No Projects Yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any projects yet. Get started by creating
            your first project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button>Create Project</Button>
          <Button variant="outline">Import Project</Button>
        </EmptyContent>
        <a
          href="#empty-learn-more"
          className={buttonVariants({
            variant: "link",
            size: "sm",
            className: "text-muted-foreground",
          })}
        >
          Learn More
          <ArrowUpRightIcon data-icon="inline-end" />
        </a>
      </Empty>
    </Wrapper>
  );
}

/**
 * Every part of the composition tree, in the order upstream documents it:
 * `Empty › EmptyHeader › (EmptyMedia, EmptyTitle, EmptyDescription)` then `EmptyContent`.
 */
export function emptyComposition(): ReactNode {
  return (
    <Wrapper>
      <Empty className="max-w-md border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCodeIcon />
          </EmptyMedia>
          <EmptyTitle>No data</EmptyTitle>
          <EmptyDescription>
            EmptyHeader holds the media, the title and the description;
            EmptyContent holds whatever the reader does next.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">Add data</Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyOutline(): ReactNode {
  return (
    <Wrapper>
      <Empty className="max-w-md border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CloudIcon />
          </EmptyMedia>
          <EmptyTitle>Cloud Storage Empty</EmptyTitle>
          <EmptyDescription>
            Upload files to your cloud storage to access them anywhere.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm">
            Upload Files
          </Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyBackground(): ReactNode {
  return (
    <Wrapper>
      <Empty className="max-w-md bg-muted/30">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BellIcon />
          </EmptyMedia>
          <EmptyTitle>No Notifications</EmptyTitle>
          <EmptyDescription className="max-w-xs text-pretty">
            You&apos;re all caught up. New notifications will appear here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">
            <RefreshCcwIcon data-icon="inline-start" />
            Refresh
          </Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyAvatar(): ReactNode {
  return (
    <Wrapper>
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Avatar className="size-12">
              <AvatarImage src={ADA.src} alt={ADA.alt} />
              <AvatarFallback>{ADA.fallback}</AvatarFallback>
            </Avatar>
          </EmptyMedia>
          <EmptyTitle>User Offline</EmptyTitle>
          <EmptyDescription>
            This user is currently offline. You can leave a message to notify
            them or try again later.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">Leave Message</Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyAvatarGroup(): ReactNode {
  return (
    <Wrapper>
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia>
            <div className="flex -space-x-2 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
              {AVATARS.map((person) => (
                <Avatar key={person.src}>
                  <AvatarImage src={person.src} alt={person.alt} />
                  <AvatarFallback>{person.fallback}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </EmptyMedia>
          <EmptyTitle>No Team Members</EmptyTitle>
          <EmptyDescription>
            Invite your team to collaborate on this project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">
            <PlusIcon data-icon="inline-start" />
            Invite Members
          </Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

/**
 * Upstream drops an `InputGroup` into `EmptyContent`. VegaStack has no `InputGroup` item; the
 * same affordance is `Input`'s own `prefix`/`suffix` addon mode, which renders the bordered
 * field group and keeps the search icon and the `/` hint outside the editable box.
 */
export function emptyInputGroup(): ReactNode {
  return (
    <Wrapper>
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            The page you&apos;re looking for doesn&apos;t exist. Try searching
            for what you need below.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <InputGroup>
            <InputGroupInput
              aria-label="Search pages"
              placeholder="Try searching for pages..."
            />
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <EmptyDescription>
            Need help? <a href="#empty-support">Contact support</a>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Empty dir="ltr" className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCodeIcon />
          </EmptyMedia>
          <EmptyTitle>No Projects Yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any projects yet.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button size="sm">Create Project</Button>
          <Button variant="outline" size="sm">
            Import Project
          </Button>
        </EmptyContent>
      </Empty>
      <Empty dir="rtl" className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCodeIcon />
          </EmptyMedia>
          <EmptyTitle>لا توجد مشاريع بعد</EmptyTitle>
          <EmptyDescription>لم تقم بإنشاء أي مشاريع بعد.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button size="sm">إنشاء مشروع</Button>
          <Button variant="outline" size="sm">
            استيراد مشروع
          </Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyAsHeading(): ReactNode {
  return (
    <Wrapper>
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCodeIcon />
          </EmptyMedia>
          <EmptyTitle render={<h3 />}>No projects yet</EmptyTitle>
          <EmptyDescription>
            Create a project to see it listed here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Create project</Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}
