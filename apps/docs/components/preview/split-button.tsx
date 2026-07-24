"use client";

import type { ReactNode } from "react";
import { ArrowRight, Copy, Send, Star, Trash2 } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/split-button` (dogfoods the registry) → auto-scanned.
import {
  SplitButton,
  type SplitButtonAction,
} from "@/components/ui/split-button";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type SplitButtonActions = [SplitButtonAction, ...SplitButtonAction[]];

const saveActions: SplitButtonActions = [
  { label: "Save and continue", icon: <ArrowRight /> },
  { label: "Save as draft", icon: <Copy /> },
];

const publishActions: SplitButtonActions = [
  { label: "Send now", icon: <Send /> },
  { label: "Discard", icon: <Trash2 />, destructive: true },
];

// Includes a disabled entry so the dimmed, keyboard-skipped item is visible at rest.
const shareActions: SplitButtonActions = [
  { label: "Copy link", icon: <Copy /> },
  { label: "Add to favorites", icon: <Star /> },
  { label: "Send to channel", icon: <Send />, disabled: true },
];

export function splitButton(): ReactNode {
  return (
    <Wrapper>
      <SplitButton actions={saveActions}>Save changes</SplitButton>
    </Wrapper>
  );
}

export function splitButtonVariants(): ReactNode {
  return (
    <Wrapper>
      <SplitButton variant="default" actions={saveActions}>
        Default
      </SplitButton>
      <SplitButton variant="secondary" actions={saveActions}>
        Secondary
      </SplitButton>
      <SplitButton variant="outline" actions={saveActions}>
        Outline
      </SplitButton>
      <SplitButton variant="ghost" actions={saveActions}>
        Ghost
      </SplitButton>
      <SplitButton variant="link" actions={saveActions}>
        Link
      </SplitButton>
      <SplitButton variant="glass" actions={saveActions}>
        Glass
      </SplitButton>
      <SplitButton variant="destructive" actions={saveActions}>
        Destructive
      </SplitButton>
      <SplitButton variant="success" actions={saveActions}>
        Success
      </SplitButton>
      <SplitButton variant="warning" actions={saveActions}>
        Warning
      </SplitButton>
      <SplitButton variant="info" actions={saveActions}>
        Info
      </SplitButton>
      <SplitButton variant="destructive-outline" actions={saveActions}>
        Destructive outline
      </SplitButton>
      <SplitButton variant="success-outline" actions={saveActions}>
        Success outline
      </SplitButton>
      <SplitButton variant="warning-outline" actions={saveActions}>
        Warning outline
      </SplitButton>
      <SplitButton variant="info-outline" actions={saveActions}>
        Info outline
      </SplitButton>
    </Wrapper>
  );
}

export function splitButtonDisabledAction(): ReactNode {
  return (
    <Wrapper>
      <SplitButton variant="outline" actions={shareActions}>
        Share
      </SplitButton>
    </Wrapper>
  );
}

export function splitButtonSizes(): ReactNode {
  return (
    <Wrapper>
      <SplitButton size="xs" actions={saveActions}>
        Extra small
      </SplitButton>
      <SplitButton size="sm" actions={saveActions}>
        Small
      </SplitButton>
      <SplitButton size="default" actions={saveActions}>
        Default
      </SplitButton>
      <SplitButton size="lg" actions={saveActions}>
        Large
      </SplitButton>
    </Wrapper>
  );
}

export function splitButtonStates(): ReactNode {
  return (
    <Wrapper>
      {/* Declarative actions, with a destructive entry */}
      <SplitButton variant="default" actions={publishActions}>
        Publish
      </SplitButton>

      {/* Composed menu children via the `menu` slot */}
      <SplitButton
        variant="outline"
        menu={
          <>
            <DropdownMenuItem>
              <Send />
              Send now
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </>
        }
      >
        Compose
      </SplitButton>

      {/* Loading + disabled */}
      <SplitButton loading actions={saveActions}>
        Saving
      </SplitButton>
      <SplitButton disabled actions={saveActions}>
        Disabled
      </SplitButton>
    </Wrapper>
  );
}
