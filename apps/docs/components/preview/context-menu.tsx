'use client';

import { useState, type ReactNode } from 'react';
import {
  Cloud,
  Copy,
  CreditCard,
  Mail,
  MessageSquare,
  Plus,
  Scissors,
  Settings,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/context-menu` (dogfoods the registry) → auto-scanned.
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from '@/components/ui/context-menu';

export function contextMenu(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed border-border text-base text-muted-foreground select-none">
          Right-click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            <Copy />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Scissors />
            Cut
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            <Trash2 />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuRich(): ReactNode {
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [showFullUrls, setShowFullUrls] = useState(false);
  const [person, setPerson] = useState('pedro');

  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className="flex h-32 w-72 items-center justify-center rounded-lg border border-dashed border-border text-base text-muted-foreground select-none">
          Right-click here
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-56">
          <ContextMenuGroup>
            <ContextMenuLabel>My account</ContextMenuLabel>
            <ContextMenuItem>
              <User />
              Profile
              <ContextMenuShortcut>⇧⌘P</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <CreditCard />
              Billing
              <ContextMenuShortcut>⌘B</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <Settings />
              Settings
              <ContextMenuShortcut>⌘,</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>

          <ContextMenuSeparator />

          <ContextMenuGroup>
            <ContextMenuLabel>View</ContextMenuLabel>
            <ContextMenuCheckboxItem checked={showBookmarks} onCheckedChange={setShowBookmarks}>
              Show bookmarks
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem checked={showFullUrls} onCheckedChange={setShowFullUrls}>
              Show full URLs
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>

          <ContextMenuSeparator />

          <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
            <ContextMenuLabel>People</ContextMenuLabel>
            <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
            <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
          </ContextMenuRadioGroup>

          <ContextMenuSeparator />

          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <UserPlus />
              Invite users
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>
                <Mail />
                Email
              </ContextMenuItem>
              <ContextMenuItem>
                <MessageSquare />
                Message
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>
                <Plus />
                More…
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem disabled>
            <Cloud />
            API (coming soon)
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem variant="destructive">
            <Trash2 />
            Delete
            <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuInset(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed border-border text-base text-muted-foreground select-none">
          Right-click here
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-52">
          <ContextMenuLabel inset>Layout</ContextMenuLabel>
          {/* `inset` items align with the indicator column of checkbox / radio rows */}
          <ContextMenuItem inset>Back</ContextMenuItem>
          <ContextMenuItem inset disabled>
            Forward
          </ContextMenuItem>
          <ContextMenuItem inset>Reload</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger inset>More tools</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Save page as…</ContextMenuItem>
              <ContextMenuItem>Create shortcut…</ContextMenuItem>
              <ContextMenuItem>Developer tools</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}
