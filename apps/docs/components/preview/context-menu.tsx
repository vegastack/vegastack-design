"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardPasteIcon,
  CopyIcon,
  PencilIcon,
  RotateCwIcon,
  ScissorsIcon,
  ShareIcon,
  TrashIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import { DirectionProvider } from "@/components/ui/direction";
// Copied INTO apps/docs via `shadcn add @vegastack/context-menu` (dogfoods the registry) → auto-scanned.
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

/*
 * Upstream's trigger surface, with one change: upstream's `pointer-fine:`/`pointer-coarse:` pair of
 * labels is collapsed to a single one, so the fixture reads the same on every input device the
 * geometry lane measures. Every menu is CLOSED at rest — a context menu opens at the pointer, so
 * there is nothing for an always-open popup to anchor to.
 */
const TRIGGER_SURFACE =
  "flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground";

export function contextMenu(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Profile</ContextMenuItem>
          <ContextMenuItem>Billing</ContextMenuItem>
          <ContextMenuItem>Team</ContextMenuItem>
          <ContextMenuItem>Subscription</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuComposition(): ReactNode {
  const [showBookmarks, setShowBookmarks] = React.useState(true);
  const [theme, setTheme] = React.useState("light");

  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuGroup>
            <ContextMenuLabel>Navigation</ContextMenuLabel>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>View</ContextMenuLabel>
            <ContextMenuCheckboxItem
              checked={showBookmarks}
              onCheckedChange={setShowBookmarks}
            >
              Show Bookmarks Bar
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Theme</ContextMenuLabel>
            <ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
              <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
              <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuGroup>
                <ContextMenuItem>Save Page...</ContextMenuItem>
                <ContextMenuItem>Developer Tools</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuBasic(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem disabled>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuSubmenu(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Cut
              <ContextMenuShortcut>⌘X</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuGroup>
                <ContextMenuItem>Save Page...</ContextMenuItem>
                <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                <ContextMenuItem>Name Window...</ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem>Developer Tools</ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuShortcuts(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuItem>
              Back
              <ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled>
              Forward
              <ContextMenuShortcut>⌘]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Reload
              <ContextMenuShortcut>⌘R</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              Save
              <ContextMenuShortcut>⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Save As...
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuGroups(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>File</ContextMenuLabel>
            <ContextMenuItem>
              New File
              <ContextMenuShortcut>⌘N</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Open File
              <ContextMenuShortcut>⌘O</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Save
              <ContextMenuShortcut>⌘S</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Edit</ContextMenuLabel>
            <ContextMenuItem>
              Undo
              <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Redo
              <ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              Cut
              <ContextMenuShortcut>⌘X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Paste
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem variant="destructive">
              Delete
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuIcons(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuItem>
              <CopyIcon />
              Copy
            </ContextMenuItem>
            <ContextMenuItem>
              <ScissorsIcon />
              Cut
            </ContextMenuItem>
            <ContextMenuItem>
              <ClipboardPasteIcon />
              Paste
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem variant="destructive">
              <TrashIcon />
              Delete
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuCheckboxes(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuCheckboxItem defaultChecked>
              Show Bookmarks Bar
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem defaultChecked>
              Show Developer Tools
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuRadio(): ReactNode {
  const [user, setUser] = React.useState("pedro");
  const [theme, setTheme] = React.useState("light");

  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>People</ContextMenuLabel>
            <ContextMenuRadioGroup value={user} onValueChange={setUser}>
              <ContextMenuRadioItem value="pedro">
                Pedro Duarte
              </ContextMenuRadioItem>
              <ContextMenuRadioItem value="colm">
                Colm Tuite
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Theme</ContextMenuLabel>
            <ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
              <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
              <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
              <ContextMenuRadioItem value="system">System</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuDestructive(): ReactNode {
  return (
    <Wrapper>
      <ContextMenu>
        <ContextMenuTrigger className={TRIGGER_SURFACE}>
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuItem>
              <PencilIcon />
              Edit
            </ContextMenuItem>
            <ContextMenuItem>
              <ShareIcon />
              Share
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem variant="destructive">
              <TrashIcon />
              Delete
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </Wrapper>
  );
}

export function contextMenuSides(): ReactNode {
  const sides = ["top", "right", "bottom", "left"] as const;

  return (
    <Wrapper>
      <div className="grid w-full max-w-sm grid-cols-2 gap-4">
        {sides.map((side) => (
          <ContextMenu key={side}>
            <ContextMenuTrigger className={TRIGGER_SURFACE}>
              Right click ({side})
            </ContextMenuTrigger>
            <ContextMenuContent side={side}>
              <ContextMenuGroup>
                <ContextMenuItem>Back</ContextMenuItem>
                <ContextMenuItem>Forward</ContextMenuItem>
                <ContextMenuItem>Reload</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </Wrapper>
  );
}

export function contextMenuRtl(): ReactNode {
  const [people, setPeople] = React.useState("pedro");

  return (
    <Wrapper className="gap-6">
      <DirectionProvider direction="ltr">
        <div dir="ltr" className="w-full max-w-xs">
          <ContextMenu>
            <ContextMenuTrigger className={TRIGGER_SURFACE}>
              Right click here
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48" dir="ltr">
              <ContextMenuGroup>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>Navigation</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-44" dir="ltr">
                    <ContextMenuGroup>
                      <ContextMenuItem>
                        <ArrowLeftIcon />
                        Back
                        <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuItem disabled>
                        <ArrowRightIcon />
                        Forward
                        <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <RotateCwIcon />
                        Reload
                        <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                      </ContextMenuItem>
                    </ContextMenuGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuCheckboxItem defaultChecked>
                  Show Bookmarks
                </ContextMenuCheckboxItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </DirectionProvider>
      <DirectionProvider direction="rtl">
        <div dir="rtl" className="w-full max-w-xs">
          <ContextMenu>
            <ContextMenuTrigger className={TRIGGER_SURFACE}>
              انقر بزر الماوس الأيمن هنا
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48" dir="rtl">
              <ContextMenuGroup>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>التنقل</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-44" dir="rtl">
                    <ContextMenuGroup>
                      <ContextMenuItem>
                        <ArrowRightIcon />
                        رجوع
                        <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuItem disabled>
                        <ArrowLeftIcon />
                        تقدم
                        <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <RotateCwIcon />
                        إعادة تحميل
                        <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                      </ContextMenuItem>
                    </ContextMenuGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuCheckboxItem defaultChecked>
                  إظهار الإشارات المرجعية
                </ContextMenuCheckboxItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuRadioGroup value={people} onValueChange={setPeople}>
                  <ContextMenuLabel>الأشخاص</ContextMenuLabel>
                  <ContextMenuRadioItem value="pedro">
                    Pedro Duarte
                  </ContextMenuRadioItem>
                  <ContextMenuRadioItem value="colm">
                    Colm Tuite
                  </ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </DirectionProvider>
    </Wrapper>
  );
}
