'use client';

import type { ReactNode } from 'react';
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
} from 'lucide-react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/icon-button` (dogfoods the registry) → auto-scanned.
import { IconButton } from '@/components/ui/icon-button';

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
      <IconButton aria-label="Settings" variant="default">
        <Settings />
      </IconButton>
      <IconButton aria-label="Ask AI" variant="default">
        <Sparkles />
      </IconButton>
      <IconButton aria-label="Notifications" variant="secondary">
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
      <IconButton aria-label="Assistant" variant="glass">
        <Sparkles />
      </IconButton>
      <IconButton aria-label="Confirm" variant="success">
        <Check />
      </IconButton>
      <IconButton aria-label="Favorite" variant="warning">
        <Heart />
      </IconButton>
      <IconButton aria-label="Delete" variant="destructive">
        <Trash2 />
      </IconButton>
      <IconButton aria-label="Information" variant="info">
        <Info />
      </IconButton>
      <IconButton aria-label="Approve" variant="success-outline">
        <Check />
      </IconButton>
      <IconButton aria-label="Warning" variant="warning-outline">
        <TriangleAlert />
      </IconButton>
      <IconButton aria-label="Delete" variant="destructive-outline">
        <Trash2 />
      </IconButton>
      <IconButton aria-label="Details" variant="info-outline">
        <Bell />
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
      <IconButton aria-label="Add item" size="default">
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
