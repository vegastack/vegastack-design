"use client";

import { Fragment, type ReactNode } from "react";
import {
  BadgeCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  InboxIcon,
  PlusIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/item` (dogfoods the registry) → auto-scanned.
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { StatusIcon } from "@/components/ui/status-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Local fixtures — upstream's examples fetch github.com and unsplash images; a demo must stay
// deterministic and offline.
const ADA = "/preview/avatar-1.svg";
const LINUS = "/preview/avatar-2.svg";
const GRACE = "/preview/avatar-3.svg";
const THUMBNAIL = "/preview/landscape.svg";

const PEOPLE = [
  { username: "ada", email: "ada@vegastack.com", avatar: ADA, initials: "AL" },
  {
    username: "linus",
    email: "linus@vegastack.com",
    avatar: LINUS,
    initials: "LT",
  },
  {
    username: "grace",
    email: "grace@vegastack.com",
    avatar: GRACE,
    initials: "GH",
  },
];

export function item(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Basic Item</ItemTitle>
            <ItemDescription>
              A simple item with title and description.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" size="sm">
              Action
            </Button>
          </ItemActions>
        </Item>
        <Item variant="outline" size="sm" render={<a href="#item-demo" />}>
          <ItemMedia>
            <BadgeCheckIcon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Your profile has been verified.</ItemTitle>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4" />
          </ItemActions>
        </Item>
      </div>
    </Wrapper>
  );
}

export function itemComposition(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ItemGroup className="mx-auto w-full max-w-md">
        <Item variant="outline" role="listitem">
          <ItemHeader>
            <span className="text-xs text-muted-foreground">
              ItemHeader — spans the row
            </span>
          </ItemHeader>
          <ItemMedia variant="icon">
            <InboxIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>ItemTitle</ItemTitle>
            <ItemDescription>
              ItemMedia, ItemContent and ItemActions share one flex row.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" size="sm">
              Action
            </Button>
          </ItemActions>
          <ItemFooter>
            <span className="text-xs text-muted-foreground">
              ItemFooter — spans the row
            </span>
          </ItemFooter>
        </Item>
      </ItemGroup>
    </Wrapper>
  );
}

export function itemItemVsField(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Item variant="outline">
          <ItemMedia variant="icon">
            <InboxIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Item — content</ItemTitle>
            <ItemDescription>
              A title, a description and actions. Nothing is submitted.
            </ItemDescription>
          </ItemContent>
        </Item>
        <Field>
          <FieldLabel htmlFor="item-vs-field">Field — input</FieldLabel>
          <Input id="item-vs-field" placeholder="ada@vegastack.com" />
          <FieldDescription>
            Reach for Field whenever a control has to be labelled and validated.
          </FieldDescription>
        </Field>
      </div>
    </Wrapper>
  );
}

export function itemVariant(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Item>
          <ItemMedia variant="icon">
            <InboxIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Default Variant</ItemTitle>
            <ItemDescription>
              Transparent background with no border.
            </ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <InboxIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Outline Variant</ItemTitle>
            <ItemDescription>
              Outlined style with a visible border.
            </ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="muted">
          <ItemMedia variant="icon">
            <InboxIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Muted Variant</ItemTitle>
            <ItemDescription>
              Muted background for secondary content.
            </ItemDescription>
          </ItemContent>
        </Item>
      </div>
    </Wrapper>
  );
}

export function itemSize(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Item variant="outline">
          <ItemMedia variant="icon">
            <InboxIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Default Size</ItemTitle>
            <ItemDescription>
              The standard size for most use cases.
            </ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="outline" size="sm">
          <ItemMedia variant="icon">
            <InboxIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Small Size</ItemTitle>
            <ItemDescription>A compact size for dense layouts.</ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="outline" size="xs">
          <ItemMedia variant="icon">
            <InboxIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Extra Small Size</ItemTitle>
            <ItemDescription>The most compact size available.</ItemDescription>
          </ItemContent>
        </Item>
      </div>
    </Wrapper>
  );
}

export function itemIcon(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <Item variant="outline">
          <ItemMedia variant="icon">
            <ShieldAlertIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Security Alert</ItemTitle>
            <ItemDescription>
              New login detected from unknown device.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">
              Review
            </Button>
          </ItemActions>
        </Item>
      </div>
    </Wrapper>
  );
}

export function itemAvatar(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <Item variant="outline">
          <ItemMedia>
            <Avatar className="size-10">
              <AvatarImage src={GRACE} alt="Grace Hopper" />
              <AvatarFallback>GH</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Grace Hopper</ItemTitle>
            <ItemDescription>Last seen 5 months ago</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              size="icon-sm"
              variant="outline"
              className="rounded-full"
              aria-label="Invite"
            >
              <PlusIcon />
            </Button>
          </ItemActions>
        </Item>
        <Item variant="outline">
          <ItemMedia>
            <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
              <Avatar className="hidden sm:flex">
                <AvatarImage src={ADA} alt="Ada Lovelace" />
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <Avatar className="hidden sm:flex">
                <AvatarImage src={LINUS} alt="Linus Torvalds" />
                <AvatarFallback>LT</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src={GRACE} alt="Grace Hopper" />
                <AvatarFallback>GH</AvatarFallback>
              </Avatar>
            </div>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>No Team Members</ItemTitle>
            <ItemDescription>
              Invite your team to collaborate on this project.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">
              Invite
            </Button>
          </ItemActions>
        </Item>
      </div>
    </Wrapper>
  );
}

const MUSIC = [
  {
    title: "Midnight City Lights",
    artist: "Neon Dreams",
    album: "Electric Nights",
    duration: "3:45",
  },
  {
    title: "Coffee Shop Conversations",
    artist: "The Morning Brew",
    album: "Urban Stories",
    duration: "4:05",
  },
  {
    title: "Digital Rain",
    artist: "Cyber Symphony",
    album: "Binary Beats",
    duration: "3:30",
  },
];

export function itemImage(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ItemGroup className="mx-auto max-w-md gap-4">
        {MUSIC.map((song) => (
          <Item
            key={song.title}
            variant="outline"
            render={<a href="#item-image" />}
            role="listitem"
          >
            <ItemMedia variant="image">
              <img src={THUMBNAIL} alt="" />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle className="w-full">
                <span className="truncate">
                  {song.title} — {song.album}
                </span>
              </ItemTitle>
              <ItemDescription>{song.artist}</ItemDescription>
            </ItemContent>
            <ItemContent className="flex-none text-center">
              <ItemDescription>{song.duration}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </Wrapper>
  );
}

export function itemGroup(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ItemGroup className="mx-auto w-full max-w-sm">
        {PEOPLE.map((person, index) => (
          <Fragment key={person.username}>
            <Item variant="outline" role="listitem">
              <ItemMedia>
                <Avatar>
                  <AvatarImage src={person.avatar} alt={person.username} />
                  <AvatarFallback>{person.initials}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent className="gap-1">
                <ItemTitle>{person.username}</ItemTitle>
                <ItemDescription>{person.email}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label={`Invite ${person.username}`}
                >
                  <PlusIcon />
                </Button>
              </ItemActions>
            </Item>
            {/* `role="list"` admits only `listitem` children, so the divider is hidden from the
                accessibility tree — the list already conveys the separation. */}
            {index < PEOPLE.length - 1 ? (
              <ItemSeparator aria-hidden="true" />
            ) : null}
          </Fragment>
        ))}
      </ItemGroup>
    </Wrapper>
  );
}

const MODELS = [
  { name: "vs-1.5-sm", description: "Everyday tasks and UI generation." },
  { name: "vs-1.5-lg", description: "Advanced thinking or reasoning." },
  { name: "vs-2.0-mini", description: "Open source model for everyone." },
];

export function itemHeader(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ItemGroup className="mx-auto grid max-w-xl grid-cols-3 gap-4">
        {MODELS.map((model) => (
          <Item key={model.name} variant="outline" role="listitem">
            <ItemHeader>
              <img
                src={THUMBNAIL}
                alt=""
                className="aspect-square w-full rounded-sm object-cover"
              />
            </ItemHeader>
            <ItemContent>
              <ItemTitle>{model.name}</ItemTitle>
              <ItemDescription>{model.description}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </Wrapper>
  );
}

export function itemLink(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Item render={<a href="#item-link" />}>
          <ItemContent>
            <ItemTitle>Visit our documentation</ItemTitle>
            <ItemDescription>
              Learn how to get started with our components.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4" />
          </ItemActions>
        </Item>
        <Item
          variant="outline"
          render={
            <a
              href="#item-link-external"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <ItemContent>
            <ItemTitle>External resource</ItemTitle>
            <ItemDescription>
              Opens in a new tab with security attributes.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <ExternalLinkIcon className="size-4" />
          </ItemActions>
        </Item>
      </div>
    </Wrapper>
  );
}

const CHECKLIST = [
  { id: "profile", title: "Complete your profile", done: true },
  { id: "invite", title: "Invite your team", done: true },
  { id: "connect", title: "Connect your calendar", done: false },
  { id: "report", title: "Create your first report", done: false },
];

export function itemChecklist(): ReactNode {
  const done = CHECKLIST.filter((step) => step.done).length;
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <Progress value={done} max={CHECKLIST.length}>
          <ProgressLabel>Getting started</ProgressLabel>
          <ProgressValue>
            {() => `${done} of ${CHECKLIST.length}`}
          </ProgressValue>
        </Progress>
        <ItemGroup>
          {CHECKLIST.map((step) => (
            <Item key={step.id} size="sm" role="listitem">
              <ItemMedia>
                <StatusIcon
                  status={step.done ? "done" : "todo"}
                  size="sm"
                  label={step.done ? "Done" : "To do"}
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle
                  className={step.done ? "text-muted-foreground" : undefined}
                >
                  {step.title}
                </ItemTitle>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </div>
    </Wrapper>
  );
}

export function itemDropdown(): ReactNode {
  return (
    <Wrapper>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          Select
          <ChevronDownIcon data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuGroup>
            {PEOPLE.map((person) => (
              <DropdownMenuItem key={person.username}>
                <Item size="xs" className="w-full p-2">
                  <ItemMedia>
                    <Avatar className="size-6">
                      <AvatarImage src={person.avatar} alt={person.username} />
                      <AvatarFallback>{person.initials}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className="gap-0">
                    <ItemTitle>{person.username}</ItemTitle>
                    <ItemDescription className="leading-none">
                      {person.email}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Wrapper>
  );
}

export function itemRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4" dir="ltr">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Basic Item</ItemTitle>
            <ItemDescription>
              A simple item with title and description.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" size="sm">
              Action
            </Button>
          </ItemActions>
        </Item>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-col gap-4" dir="rtl">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>عنصر أساسي</ItemTitle>
            <ItemDescription>عنصر بسيط يحتوي على عنوان ووصف.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" size="sm">
              إجراء
            </Button>
          </ItemActions>
        </Item>
        <Item variant="outline" size="sm" render={<a href="#item-rtl" />}>
          <ItemMedia>
            <BadgeCheckIcon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>تم التحقق من ملفك الشخصي.</ItemTitle>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4 rtl:rotate-180" />
          </ItemActions>
        </Item>
      </div>
    </Wrapper>
  );
}
