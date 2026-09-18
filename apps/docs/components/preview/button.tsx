"use client";

import type { ReactNode } from "react";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  CircleFadingArrowUpIcon,
  GitBranchIcon,
  GitForkIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
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
      <Button className="rounded-full">Get Started</Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Submit"
        className="rounded-full"
      >
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
