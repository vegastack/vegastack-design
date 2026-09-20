"use client";

import type { ReactNode } from "react";
import { PlusIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/avatar` (dogfoods the registry) → auto-scanned.
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Local fixtures (abstract portrait marks). Upstream's examples point at github.com avatars; a
// demo and the geometry lane must never depend on a live third-party image service.
const ADA = "/preview/avatar-1.svg";
const LINUS = "/preview/avatar-2.svg";
const GRACE = "/preview/avatar-3.svg";

export function avatar(): ReactNode {
  return (
    <Wrapper>
      <Avatar>
        <AvatarImage src={ADA} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src={LINUS} alt="Linus Torvalds" />
        <AvatarFallback>LT</AvatarFallback>
        <AvatarBadge className="bg-success" />
      </Avatar>
      <AvatarGroup>
        <Avatar>
          <AvatarImage src={ADA} alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={LINUS} alt="Linus Torvalds" />
          <AvatarFallback>LT</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={GRACE} alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>
    </Wrapper>
  );
}

export function avatarComposition(): ReactNode {
  return (
    <Wrapper>
      <Avatar>
        <AvatarImage src={GRACE} alt="Grace Hopper" />
        <AvatarFallback>GH</AvatarFallback>
        <AvatarBadge className="bg-success" />
      </Avatar>
      <AvatarGroup>
        <Avatar>
          <AvatarImage src={ADA} alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={LINUS} alt="Linus Torvalds" />
          <AvatarFallback>LT</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+8</AvatarGroupCount>
      </AvatarGroup>
    </Wrapper>
  );
}

export function avatarBasic(): ReactNode {
  return (
    <Wrapper>
      <Avatar>
        <AvatarImage src={ADA} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    </Wrapper>
  );
}

export function avatarBadge(): ReactNode {
  return (
    <Wrapper>
      <Avatar>
        <AvatarImage src={ADA} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
        <AvatarBadge className="bg-success" />
      </Avatar>
    </Wrapper>
  );
}

export function avatarBadgeWithIcon(): ReactNode {
  return (
    <Wrapper>
      <Avatar>
        <AvatarImage src={GRACE} alt="Grace Hopper" />
        <AvatarFallback>GH</AvatarFallback>
        <AvatarBadge>
          <PlusIcon />
        </AvatarBadge>
      </Avatar>
    </Wrapper>
  );
}

export function avatarAvatarGroup(): ReactNode {
  return (
    <Wrapper>
      <AvatarGroup>
        <Avatar>
          <AvatarImage src={ADA} alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={LINUS} alt="Linus Torvalds" />
          <AvatarFallback>LT</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={GRACE} alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    </Wrapper>
  );
}

export function avatarAvatarGroupCount(): ReactNode {
  return (
    <Wrapper>
      <AvatarGroup>
        <Avatar>
          <AvatarImage src={ADA} alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={LINUS} alt="Linus Torvalds" />
          <AvatarFallback>LT</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={GRACE} alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>
    </Wrapper>
  );
}

export function avatarAvatarGroupWithIcon(): ReactNode {
  return (
    <Wrapper>
      <AvatarGroup>
        <Avatar>
          <AvatarImage src={ADA} alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={LINUS} alt="Linus Torvalds" />
          <AvatarFallback>LT</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={GRACE} alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>
          <PlusIcon />
          <span className="sr-only">Add a teammate</span>
        </AvatarGroupCount>
      </AvatarGroup>
    </Wrapper>
  );
}

export function avatarSizes(): ReactNode {
  return (
    <Wrapper>
      <Avatar size="sm">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    </Wrapper>
  );
}

export function avatarDropdown(): ReactNode {
  return (
    <Wrapper>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Open account menu"
            />
          }
        >
          <Avatar>
            <AvatarImage src={ADA} alt="Ada Lovelace" />
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32">
          <DropdownMenuGroup>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Wrapper>
  );
}

export function avatarRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="flex flex-wrap items-center gap-6" dir="ltr">
        <Avatar>
          <AvatarImage src={ADA} alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge className="bg-success" />
        </Avatar>
        <AvatarGroup>
          <Avatar>
            <AvatarImage src={LINUS} alt="Linus Torvalds" />
            <AvatarFallback>LT</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src={GRACE} alt="Grace Hopper" />
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </div>
      <div className="flex flex-wrap items-center gap-6" dir="rtl">
        <Avatar>
          <AvatarImage src={ADA} alt="آدا لوفلايس" />
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge className="bg-success" />
        </Avatar>
        <AvatarGroup>
          <Avatar>
            <AvatarImage src={LINUS} alt="لينوس تورفالدس" />
            <AvatarFallback>LT</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src={GRACE} alt="غريس هوبر" />
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+٣</AvatarGroupCount>
        </AvatarGroup>
      </div>
    </Wrapper>
  );
}
