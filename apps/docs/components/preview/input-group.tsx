"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  CornerDownLeftIcon,
  CreditCardIcon,
  EyeOffIcon,
  FileCodeIcon,
  InfoIcon,
  MailIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  SearchIcon,
  StarIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/input-group` (dogfoods the registry) → auto-scanned.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";

export function inputGroup(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <InputGroup className="mx-auto max-w-sm">
        <InputGroupInput placeholder="Search..." aria-label="Search" />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
    </Wrapper>
  );
}

export function inputGroupComposition(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <InputGroup className="mx-auto max-w-sm">
        <InputGroupInput placeholder="Amount" aria-label="Amount" />
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="secondary">Convert</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Wrapper>
  );
}

export function inputGroupAlign(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto max-w-sm">
        <Field>
          <FieldLabel htmlFor="inline-start-input">inline-start</FieldLabel>
          <InputGroup>
            <InputGroupInput id="inline-start-input" placeholder="Search..." />
            <InputGroupAddon align="inline-start">
              <SearchIcon className="text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            The addon sits before the control.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="inline-end-input">inline-end</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="inline-end-input"
              type="password"
              placeholder="Enter password"
            />
            <InputGroupAddon align="inline-end">
              <EyeOffIcon />
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>The addon sits after the control.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="block-start-textarea">block-start</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id="block-start-textarea"
              placeholder="console.log('Hello, world!');"
              className="font-mono text-sm"
            />
            <InputGroupAddon align="block-start">
              <FileCodeIcon className="text-muted-foreground" />
              <InputGroupText className="font-mono">script.js</InputGroupText>
              <InputGroupButton size="icon-xs" className="ms-auto">
                <CopyIcon />
                <span className="sr-only">Copy</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>A header above the control.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="block-end-textarea">block-end</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id="block-end-textarea"
              placeholder="Write a comment..."
            />
            <InputGroupAddon align="block-end">
              <InputGroupText>0/280</InputGroupText>
              <InputGroupButton variant="default" size="sm" className="ms-auto">
                Post
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>A footer below the control.</FieldDescription>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function inputGroupIcon(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-sm gap-6">
        <InputGroup>
          <InputGroupInput placeholder="Search..." aria-label="Search" />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            type="email"
            placeholder="Enter your email"
            aria-label="Email"
          />
          <InputGroupAddon>
            <MailIcon />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput placeholder="Card number" aria-label="Card number" />
          <InputGroupAddon>
            <CreditCardIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <CheckIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Wrapper>
  );
}

export function inputGroupText(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-sm gap-6">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="0.00" aria-label="Amount" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>USD</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="example.com" aria-label="Domain" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>.com</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupTextarea
            placeholder="Enter your message"
            aria-label="Message"
          />
          <InputGroupAddon align="block-end">
            <InputGroupText className="text-xs text-muted-foreground">
              120 characters left
            </InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Wrapper>
  );
}

export function inputGroupButton(): ReactNode {
  const [copied, setCopied] = React.useState(false);
  const [favorite, setFavorite] = React.useState(false);

  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-sm gap-6">
        <InputGroup>
          <InputGroupInput
            defaultValue="https://design.vegastack.com"
            aria-label="Share link"
            readOnly
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Copy"
              size="icon-xs"
              onClick={() => setCopied(true)}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            defaultValue="vegastack.com"
            aria-label="Site address"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Favourite"
              aria-pressed={favorite}
              size="icon-xs"
              onClick={() => setFavorite((value) => !value)}
            >
              <StarIcon
                data-favorite={favorite}
                className="data-[favorite=true]:fill-current"
              />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            placeholder="Type to search..."
            aria-label="Search"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton variant="secondary">Search</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Wrapper>
  );
}

export function inputGroupKbd(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <InputGroup className="mx-auto max-w-sm">
        <InputGroupInput placeholder="Search..." aria-label="Search" />
        <InputGroupAddon>
          <SearchIcon className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <Kbd>⌘K</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </Wrapper>
  );
}

export function inputGroupDropdown(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-sm gap-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Enter file name"
            aria-label="File name"
          />
          <InputGroupAddon align="inline-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <InputGroupButton
                    variant="ghost"
                    aria-label="More"
                    size="icon-xs"
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuGroup>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Copy path</DropdownMenuItem>
                  <DropdownMenuItem>Open location</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            placeholder="Enter search query"
            aria-label="Search query"
          />
          <InputGroupAddon align="inline-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <InputGroupButton variant="ghost" className="text-xs" />
                }
              >
                Search In… <ChevronDownIcon className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuGroup>
                  <DropdownMenuItem>Documentation</DropdownMenuItem>
                  <DropdownMenuItem>Blog Posts</DropdownMenuItem>
                  <DropdownMenuItem>Changelog</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Wrapper>
  );
}

export function inputGroupSpinner(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-sm gap-4">
        <InputGroup>
          <InputGroupInput placeholder="Searching..." aria-label="Search" />
          <InputGroupAddon align="inline-end">
            <Spinner />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput placeholder="Processing..." aria-label="Process" />
          <InputGroupAddon>
            <Spinner />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput placeholder="Saving changes..." aria-label="Save" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>Saving…</InputGroupText>
            <Spinner />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Wrapper>
  );
}

export function inputGroupTextarea(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-md gap-4">
        <InputGroup>
          <InputGroupTextarea
            id="textarea-code-32"
            placeholder="console.log('Hello, world!');"
            aria-label="Script"
            className="min-h-[200px]"
          />
          <InputGroupAddon align="block-start" className="border-b">
            <InputGroupText className="font-mono font-medium">
              <FileCodeIcon />
              script.js
            </InputGroupText>
            <InputGroupButton className="ms-auto" size="icon-xs">
              <RefreshCwIcon />
              <span className="sr-only">Refresh</span>
            </InputGroupButton>
            <InputGroupButton variant="ghost" size="icon-xs">
              <CopyIcon />
              <span className="sr-only">Copy</span>
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupAddon align="block-end" className="border-t">
            <InputGroupText>Line 1, Column 1</InputGroupText>
            <InputGroupButton size="sm" className="ms-auto" variant="default">
              Run <CornerDownLeftIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Wrapper>
  );
}

export function inputGroupCustomInput(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-sm gap-6">
        <InputGroup>
          <textarea
            data-slot="input-group-control"
            aria-label="Autoresize textarea"
            className="flex field-sizing-content min-h-16 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base outline-hidden md:text-sm"
            placeholder="Autoresize textarea…"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton className="ms-auto" size="sm" variant="default">
              Submit
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Wrapper>
  );
}

export function inputGroupRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <InputGroup className="mx-auto max-w-xs" dir="ltr">
        <InputGroupInput placeholder="Search…" aria-label="Search" />
        <InputGroupAddon>
          <SearchIcon className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InfoIcon className="text-muted-foreground" />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="mx-auto max-w-xs" dir="rtl">
        <InputGroupInput placeholder="ابحث…" aria-label="ابحث" />
        <InputGroupAddon>
          <SearchIcon className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InfoIcon className="text-muted-foreground" />
        </InputGroupAddon>
      </InputGroup>
    </Wrapper>
  );
}

/** Ours: rest, invalid and disabled chrome on the group itself. */
export function inputGroupStates(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-sm gap-4">
        <InputGroup>
          <InputGroupInput placeholder="Rest" aria-label="Rest" />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            placeholder="Invalid"
            aria-label="Invalid"
            aria-invalid
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            placeholder="Disabled"
            aria-label="Disabled"
            disabled
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Wrapper>
  );
}
