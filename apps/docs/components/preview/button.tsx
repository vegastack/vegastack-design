"use client";

import type { ReactNode } from "react";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  CircleFadingArrowUpIcon,
  Copy,
  GitBranchIcon,
  GitForkIcon,
  MoreHorizontal,
  MoreHorizontalIcon,
  Plus,
  PlusIcon,
  Share,
  Trash2,
} from "lucide-react";
import { Verdict, Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/button` (dogfoods the registry) → auto-scanned.
import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function button(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </Wrapper>
  );
}

export function buttonCursor(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline">Hover me</Button>
      <Button variant="outline" disabled>
        Disabled
      </Button>
    </Wrapper>
  );
}

export function buttonSize(): ReactNode {
  return (
    <Wrapper className="flex-col items-start sm:flex-row sm:gap-8">
      <div className="flex items-start gap-2">
        <Button size="xs" variant="outline">
          Extra Small
        </Button>
        <Button size="icon-xs" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <Button size="sm" variant="outline">
          Small
        </Button>
        <Button size="icon-sm" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <Button variant="outline">Default</Button>
        <Button size="icon" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
      <div className="flex items-start gap-2">
        <Button variant="outline" size="lg">
          Large
        </Button>
        <Button size="icon-lg" aria-label="Submit" variant="outline">
          <ArrowUpRightIcon />
        </Button>
      </div>
    </Wrapper>
  );
}

export function buttonDefault(): ReactNode {
  return (
    <Wrapper>
      <Button>Button</Button>
    </Wrapper>
  );
}

export function buttonOutline(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline">Outline</Button>
    </Wrapper>
  );
}

export function buttonSecondary(): ReactNode {
  return (
    <Wrapper>
      <Button variant="secondary">Secondary</Button>
    </Wrapper>
  );
}

export function buttonGhost(): ReactNode {
  return (
    <Wrapper>
      <Button variant="ghost">Ghost</Button>
    </Wrapper>
  );
}

export function buttonDestructive(): ReactNode {
  return (
    <Wrapper>
      <Button variant="destructive">Destructive</Button>
    </Wrapper>
  );
}

export function buttonLink(): ReactNode {
  return (
    <Wrapper>
      <Button variant="link">Link</Button>
    </Wrapper>
  );
}

export function buttonIcon(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline" size="icon" aria-label="Upgrade">
        <CircleFadingArrowUpIcon />
      </Button>
    </Wrapper>
  );
}

export function buttonWithIcon(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline">
        <GitBranchIcon data-icon="inline-start" /> New Branch
      </Button>
      <Button variant="outline">
        Fork
        <GitForkIcon data-icon="inline-end" />
      </Button>
    </Wrapper>
  );
}

export function buttonRounded(): ReactNode {
  return (
    <Wrapper>
      <Button>Get Started</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </Wrapper>
  );
}

export function buttonSpinner(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline" disabled>
        <Spinner data-icon="inline-start" />
        Generating
      </Button>
      <Button variant="secondary" disabled>
        Downloading
        <Spinner data-icon="inline-end" />
      </Button>
    </Wrapper>
  );
}

export function buttonButtonGroup(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup>
        <ButtonGroup>
          <Button variant="outline" size="icon" aria-label="Go Back">
            <ArrowLeftIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">Archive</Button>
          <Button variant="outline">Report</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">Snooze</Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="More Options"
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <ArchiveIcon />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonAsLink(): ReactNode {
  return (
    <Wrapper>
      <a
        href="#button-as-link"
        className={buttonVariants({ variant: "secondary", size: "sm" })}
      >
        Login
      </a>
    </Wrapper>
  );
}

export function buttonRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="flex flex-wrap items-center gap-2" dir="ltr">
        <Button variant="outline">Button</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="outline">
          Submit
          <ArrowRightIcon className="rtl:rotate-180" data-icon="inline-end" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Add">
          <PlusIcon />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2" dir="rtl">
        <Button variant="outline">زر</Button>
        <Button variant="destructive">حذف</Button>
        <Button variant="outline">
          إرسال
          <ArrowRightIcon className="rtl:rotate-180" data-icon="inline-end" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Add">
          <PlusIcon />
        </Button>
      </div>
    </Wrapper>
  );
}

/** Ours: the `loading` prop (API-5) and the stable-width label underneath it (A11Y-12). */
export function buttonLoading(): ReactNode {
  return (
    <Wrapper>
      <Button loading>Save changes</Button>
      <Button variant="outline" loading>
        Generating
      </Button>
      <Button variant="secondary" disabled>
        Disabled
      </Button>
    </Wrapper>
  );
}

/** One shape per row: the button that adds a chip is a pill too. */
export function shapeOneRow(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch sm:flex-row">
      <Verdict good label="the add button takes the row's shape">
        <Chip>Status: Open</Chip>
        <Chip>Assignee: Me</Chip>
        <Button variant="outline" size="sm" shape="pill">
          <Plus aria-hidden />
          Filter
        </Button>
      </Verdict>
      <Verdict good={false} label="a rectangle beside pills">
        <Chip>Status: Open</Chip>
        <Chip>Assignee: Me</Chip>
        <Button variant="outline">
          <Plus aria-hidden />
          Filter
        </Button>
      </Verdict>
    </Wrapper>
  );
}

/** Actions and inputs in the page are rounded rectangles: 10px, and 8px at 24px. */
export function shapeInPage(): ReactNode {
  return (
    <Wrapper className="flex-col items-start">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search tasks"
          placeholder="Search tasks"
          className="w-56"
        />
        <Button variant="outline">
          <Share aria-hidden />
          Share
        </Button>
        <Button>
          <Plus aria-hidden />
          New task
        </Button>
        <Button variant="outline" size="icon" aria-label="More actions">
          <MoreHorizontal aria-hidden />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">My meetings</TabsTrigger>
            <TabsTrigger value="shared">Shared with me</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="xs">
          <Copy aria-hidden />
          Copy
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label="Remove">
          <Trash2 aria-hidden />
        </Button>
      </div>
    </Wrapper>
  );
}
