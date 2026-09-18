"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  AudioLinesIcon,
  BoldIcon,
  BotIcon,
  CalendarPlusIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardPasteIcon,
  ClockIcon,
  CopyIcon,
  ItalicIcon,
  ListFilterIcon,
  MailCheckIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  TagIcon,
  Trash2Icon,
  TrashIcon,
  UnderlineIcon,
  UserRoundXIcon,
  VolumeOffIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/button-group` (dogfoods the registry) → auto-scanned.
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = {
  $: "US Dollar",
  "€": "Euro",
  "£": "British Pound",
};

export function buttonGroup(): ReactNode {
  const [label, setLabel] = React.useState("personal");

  return (
    <Wrapper>
      <ButtonGroup>
        <ButtonGroup className="hidden sm:flex">
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
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <MailCheckIcon />
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArchiveIcon />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <ClockIcon />
                  Snooze
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CalendarPlusIcon />
                  Add to Calendar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ListFilterIcon />
                  Add to List
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <TagIcon />
                    Label As...
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={label}
                      onValueChange={(value) => setLabel(value as string)}
                    >
                      <DropdownMenuRadioItem value="personal">
                        Personal
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="work">
                        Work
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="other">
                        Other
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem tone="destructive">
                  <Trash2Icon />
                  Trash
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </ButtonGroup>
    </Wrapper>
  );
}

/**
 * The three things a group can hold, in the order upstream's composition tree lists them:
 * a `Button` or an `Input`, a `ButtonGroupSeparator`, and a `ButtonGroupText`.
 */
export function buttonGroupComposition(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup>
        <ButtonGroupText>https://</ButtonGroupText>
        <Input aria-label="Domain" defaultValue="design.vegastack.com" />
        <ButtonGroupSeparator />
        <Button variant="outline">Copy</Button>
      </ButtonGroup>
    </Wrapper>
  );
}

/** The group carries `role="group"`; name it with `aria-label`, and Tab walks the members. */
export function buttonGroupAccessibility(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup aria-label="Text formatting">
        <Button variant="outline">Button 1</Button>
        <Button variant="outline">Button 2</Button>
      </ButtonGroup>
    </Wrapper>
  );
}

/** Actions on the left, state on the right — the whole distinction in one frame. */
export function buttonGroupVsToggleGroup(): ReactNode {
  return (
    <Wrapper className="gap-8">
      <div className="flex flex-col items-center gap-2">
        <ButtonGroup aria-label="Clipboard actions">
          <Button variant="outline">
            <CopyIcon data-icon="inline-start" />
            Copy
          </Button>
          <Button variant="outline">
            <ClipboardPasteIcon data-icon="inline-start" />
            Paste
          </Button>
        </ButtonGroup>
        <span className="text-xs text-muted-foreground">
          ButtonGroup — each button performs an action
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ToggleGroup
          spacing={0}
          defaultValue={["bold"]}
          aria-label="Text formatting"
        >
          <ToggleGroupItem value="bold" variant="outline" aria-label="Bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" variant="outline" aria-label="Italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            variant="outline"
            aria-label="Underline"
          >
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        <span className="text-xs text-muted-foreground">
          ToggleGroup — each button toggles a state
        </span>
      </div>
    </Wrapper>
  );
}

export function buttonGroupOrientation(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup
        orientation="vertical"
        aria-label="Media controls"
        className="h-fit"
      >
        <Button variant="outline" size="icon" aria-label="Increase">
          <PlusIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="Decrease">
          <MinusIcon />
        </Button>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonGroupSize(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-8">
      <ButtonGroup>
        <Button variant="outline" size="sm">
          Small
        </Button>
        <Button variant="outline" size="sm">
          Button
        </Button>
        <Button variant="outline" size="sm">
          Group
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Add">
          <PlusIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Default</Button>
        <Button variant="outline">Button</Button>
        <Button variant="outline">Group</Button>
        <Button variant="outline" size="icon" aria-label="Add">
          <PlusIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="lg">
          Large
        </Button>
        <Button variant="outline" size="lg">
          Button
        </Button>
        <Button variant="outline" size="lg">
          Group
        </Button>
        <Button variant="outline" size="icon-lg" aria-label="Add">
          <PlusIcon />
        </Button>
      </ButtonGroup>
    </Wrapper>
  );
}

/**
 * Nesting is what buys the spacing: a group whose children are groups gets `gap-2`, so the seams
 * stay welded inside each inner group and open up between them.
 */
export function buttonGroupNested(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup className="w-full max-w-sm">
        <ButtonGroup>
          <Button variant="outline" size="icon" aria-label="Add attachment">
            <PlusIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup className="flex-1">
          <InputGroup>
            <InputGroupInput
              aria-label="Message"
              placeholder="Send a message..."
            />
            <InputGroupAddon align="inline-end">
              <AudioLinesIcon className="size-4" />
            </InputGroupAddon>
          </InputGroup>
        </ButtonGroup>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonGroupSeparator(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup>
        <Button variant="secondary" size="sm">
          Copy
        </Button>
        <ButtonGroupSeparator />
        <Button variant="secondary" size="sm">
          Paste
        </Button>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonGroupSplit(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup>
        <Button variant="secondary">Button</Button>
        <ButtonGroupSeparator />
        <Button size="icon" variant="secondary" aria-label="Add">
          <PlusIcon />
        </Button>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonGroupInput(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup className="w-full max-w-sm">
        <Input aria-label="Search" placeholder="Search..." />
        <Button variant="outline" aria-label="Search">
          <SearchIcon />
        </Button>
      </ButtonGroup>
    </Wrapper>
  );
}

/**
 * Upstream wraps an `InputGroup`. VegaStack has no such item — `Input`'s `prefix`/`suffix`
 * addon mode is the equivalent, rendering the bordered field group the group then welds to.
 */
export function buttonGroupInputGroup(): ReactNode {
  const [voiceEnabled, setVoiceEnabled] = React.useState(false);

  return (
    <Wrapper>
      <ButtonGroup className="w-full max-w-sm">
        <ButtonGroup>
          <Button variant="outline" size="icon" aria-label="Add attachment">
            <PlusIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup className="flex-1">
          <InputGroup>
            <InputGroupInput
              aria-label="Message"
              placeholder={
                voiceEnabled ? "Record and send audio..." : "Send a message..."
              }
              disabled={voiceEnabled}
            />
            <InputGroupAddon align="inline-end">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Voice Mode"
                aria-pressed={voiceEnabled}
                onClick={() => setVoiceEnabled(!voiceEnabled)}
              >
                <AudioLinesIcon />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </ButtonGroup>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonGroupDropdownMenu(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup>
        <Button variant="outline">Follow</Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="More follow options"
              />
            }
          >
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <VolumeOffIcon />
                Mute Conversation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CheckIcon />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem>
                <AlertTriangleIcon />
                Report Conversation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserRoundXIcon />
                Block User
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon />
                Share Conversation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CopyIcon />
                Copy Conversation
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem tone="destructive">
                <TrashIcon />
                Delete Conversation
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonGroupSelect(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup>
        <ButtonGroup>
          <Select items={CURRENCIES} defaultValue="$">
            <SelectTrigger className="font-mono" aria-label="Currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              <SelectGroup>
                {Object.entries(CURRENCIES).map(([value, name]) => (
                  <SelectItem key={value} value={value}>
                    {value}{" "}
                    <span className="text-muted-foreground">{name}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Input aria-label="Amount" placeholder="10.00" pattern="[0-9]*" />
        </ButtonGroup>
        <ButtonGroup>
          <Button aria-label="Send" size="icon" variant="outline">
            <ArrowRightIcon />
          </Button>
        </ButtonGroup>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonGroupPopover(): ReactNode {
  return (
    <Wrapper>
      <ButtonGroup>
        <Button variant="outline">
          <BotIcon data-icon="inline-start" /> Copilot
        </Button>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="icon" aria-label="Open Popover" />
            }
          >
            <ChevronDownIcon />
          </PopoverTrigger>
          <PopoverContent align="end" className="text-sm">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <PopoverTitle>Start a new task with Copilot</PopoverTitle>
                <PopoverDescription>
                  Describe your task in natural language.
                </PopoverDescription>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="button-group-task" className="sr-only">
                  Task Description
                </Label>
                <Textarea
                  id="button-group-task"
                  placeholder="I need to..."
                  className="resize-none"
                />
                <span className="text-xs text-muted-foreground">
                  Copilot will open a pull request for review.
                </span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </ButtonGroup>
    </Wrapper>
  );
}

export function buttonGroupRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-4">
      <div dir="ltr">
        <ButtonGroup aria-label="Message actions">
          <Button variant="outline">Archive</Button>
          <Button variant="outline">Report</Button>
          <Button variant="outline" size="icon" aria-label="More Options">
            <MoreHorizontalIcon />
          </Button>
        </ButtonGroup>
      </div>
      <div dir="rtl">
        <ButtonGroup aria-label="إجراءات الرسالة">
          <Button variant="outline">أرشفة</Button>
          <Button variant="outline">تقرير</Button>
          <Button variant="outline" size="icon" aria-label="خيارات أخرى">
            <MoreHorizontalIcon />
          </Button>
        </ButtonGroup>
      </div>
    </Wrapper>
  );
}
