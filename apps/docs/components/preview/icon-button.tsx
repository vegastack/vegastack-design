"use client";

import type { ReactNode } from "react";
import {
  Bell,
  Check,
  Heart,
  Info,
  Link,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/icon-button` (dogfoods the registry) → auto-scanned.
import { IconButton } from "@/components/ui/icon-button";

export function iconButton(): ReactNode {
  return (
    <Wrapper>
      <IconButton aria-label="Add item">
        <Plus />
      </IconButton>
    </Wrapper>
  );
}

export function iconButtonVariants(): ReactNode {
  return (
    <Wrapper>
      <IconButton aria-label="Settings" variant="solid">
        <Settings />
      </IconButton>
      <IconButton aria-label="Notifications" variant="soft">
        <Bell />
      </IconButton>
      <IconButton aria-label="Edit" variant="outline">
        <Pencil />
      </IconButton>
      <IconButton aria-label="Search" variant="ghost">
        <Search />
      </IconButton>
      <IconButton aria-label="Copy link" variant="link">
        <Link />
      </IconButton>
    </Wrapper>
  );
}

export function iconButtonTones(): ReactNode {
  return (
    <Wrapper>
      <IconButton aria-label="Ask AI" variant="soft">
        <Sparkles />
      </IconButton>
      <IconButton aria-label="Delete" variant="soft" tone="destructive">
        <Trash2 />
      </IconButton>
      <IconButton aria-label="Confirm" variant="soft" tone="success">
        <Check />
      </IconButton>
      <IconButton aria-label="Warning" variant="soft" tone="warning">
        <TriangleAlert />
      </IconButton>
      <IconButton aria-label="Information" variant="soft" tone="info">
        <Info />
      </IconButton>
      <IconButton aria-label="Approve" variant="outline" tone="success">
        <Check />
      </IconButton>
      <IconButton aria-label="Remove" variant="outline" tone="destructive">
        <Trash2 />
      </IconButton>
    </Wrapper>
  );
}

export function iconButtonShapes(): ReactNode {
  return (
    <Wrapper>
      <IconButton aria-label="Favorite" variant="outline" shape="square">
        <Heart />
      </IconButton>
      <IconButton aria-label="Favorite" variant="outline" shape="round">
        <Heart />
      </IconButton>
      <IconButton aria-label="Favorite" variant="soft" shape="round">
        <Heart />
      </IconButton>
      <IconButton aria-label="Favorite" variant="solid" shape="round">
        <Heart />
      </IconButton>
    </Wrapper>
  );
}

export function iconButtonSizes(): ReactNode {
  return (
    <Wrapper>
      <IconButton aria-label="Add item" size="xs">
        <Plus />
      </IconButton>
      <IconButton aria-label="Add item" size="sm">
        <Plus />
      </IconButton>
      <IconButton aria-label="Add item" size="md">
        <Plus />
      </IconButton>
      <IconButton aria-label="Add item" size="lg">
        <Plus />
      </IconButton>
    </Wrapper>
  );
}

export function iconButtonStates(): ReactNode {
  return (
    <Wrapper>
      {/* idle */}
      <IconButton aria-label="Edit">
        <Pencil />
      </IconButton>
      {/* disabled — removed from the tab order */}
      <IconButton aria-label="Edit" disabled>
        <Pencil />
      </IconButton>
      {/* loading — spinner + aria-busy, kept focusable */}
      <IconButton aria-label="Saving" loading>
        <Pencil />
      </IconButton>
    </Wrapper>
  );
}
