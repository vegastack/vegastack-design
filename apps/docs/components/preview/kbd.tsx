"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/kbd` (dogfoods the registry) → auto-scanned.
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function kbd(): ReactNode {
  return (
    <Wrapper className="flex-col gap-4">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>⌥</Kbd>
        <Kbd>⌃</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>B</Kbd>
      </KbdGroup>
    </Wrapper>
  );
}

/** Both parts at once — the tree the Anatomy section lists, rendered. */
export function kbdComposition(): ReactNode {
  return (
    <Wrapper className="flex-col gap-4">
      <Kbd>Esc</Kbd>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </Wrapper>
  );
}

export function kbdGroup(): ReactNode {
  return (
    <Wrapper>
      <p className="text-sm text-muted-foreground">
        Use{" "}
        <KbdGroup>
          <Kbd>Ctrl + B</Kbd>
          <Kbd>Ctrl + K</Kbd>
        </KbdGroup>{" "}
        to open the command palette
      </p>
    </Wrapper>
  );
}

export function kbdButton(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline">
        Accept{" "}
        <Kbd data-icon="inline-end" className="translate-x-0.5">
          ⏎
        </Kbd>
      </Button>
    </Wrapper>
  );
}

export function kbdTooltip(): ReactNode {
  return (
    <Wrapper className="min-h-40">
      <TooltipProvider>
        <ButtonGroup>
          <Tooltip defaultOpen>
            <TooltipTrigger render={<Button variant="outline" />}>
              Save
            </TooltipTrigger>
            <TooltipContent>
              Save Changes <Kbd>S</Kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>
              Print
            </TooltipTrigger>
            <TooltipContent>
              Print Document{" "}
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>P</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </TooltipProvider>
    </Wrapper>
  );
}

/**
 * Ours: the registry has no `InputGroup` item yet, so the addon slot is `Input`'s own `suffix`,
 * which renders the same trailing chip inside the field chrome.
 */
export function kbdInputGroup(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-xs flex-col gap-6">
        <Input
          aria-label="Search"
          placeholder="Search..."
          prefix={<SearchIcon className="size-4" />}
          suffix={
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          }
        />
      </div>
    </Wrapper>
  );
}

export function kbdRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="flex flex-col items-center gap-4" dir="ltr">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>⌥</Kbd>
          <Kbd>⌃</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>B</Kbd>
        </KbdGroup>
      </div>
      <div className="flex flex-col items-center gap-4" dir="rtl">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>⌥</Kbd>
          <Kbd>⌃</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>B</Kbd>
        </KbdGroup>
      </div>
    </Wrapper>
  );
}
