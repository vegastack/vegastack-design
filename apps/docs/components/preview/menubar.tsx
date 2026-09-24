"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  FileIcon,
  FolderIcon,
  HelpCircleIcon,
  SaveIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import { DirectionProvider } from "@/components/ui/direction";
// Copied INTO apps/docs via `shadcn add @vegastack/menubar` (dogfoods the registry) → auto-scanned.
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";

/*
 * The bar itself is the resting state: every menu is CLOSED, which is what a menubar looks like in
 * the application it imitates, and what the geometry lane needs to measure the 8px bar and its
 * triggers rather than a portaled popup.
 */

export function menubar(): ReactNode {
  return (
    <Wrapper>
      <Menubar className="w-72">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem>
                New Tab <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                New Window <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>New Incognito Window</MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarSub>
                <MenubarSubTrigger>Share</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarGroup>
                    <MenubarItem>Email link</MenubarItem>
                    <MenubarItem>Messages</MenubarItem>
                    <MenubarItem>Notes</MenubarItem>
                  </MenubarGroup>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarItem>
                Print... <MenubarShortcut>⌘P</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem>
                Undo <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarSub>
                <MenubarSubTrigger>Find</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarGroup>
                    <MenubarItem>Search the web</MenubarItem>
                  </MenubarGroup>
                  <MenubarSeparator />
                  <MenubarGroup>
                    <MenubarItem>Find...</MenubarItem>
                    <MenubarItem>Find Next</MenubarItem>
                    <MenubarItem>Find Previous</MenubarItem>
                  </MenubarGroup>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarItem>Cut</MenubarItem>
              <MenubarItem>Copy</MenubarItem>
              <MenubarItem>Paste</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent className="w-44">
            <MenubarGroup>
              <MenubarCheckboxItem>Bookmarks Bar</MenubarCheckboxItem>
              <MenubarCheckboxItem checked>Full URLs</MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarItem inset>
                Reload <MenubarShortcut>⌘R</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled inset>
                Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarItem inset>Toggle Fullscreen</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Wrapper>
  );
}

export function menubarComposition(): ReactNode {
  const [profile, setProfile] = React.useState("benoit");
  const [fullUrls, setFullUrls] = React.useState(true);

  return (
    <Wrapper>
      <Menubar className="w-72">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Document</MenubarLabel>
              <MenubarItem>
                New Tab <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>New Window</MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>View</MenubarLabel>
              <MenubarCheckboxItem
                checked={fullUrls}
                onCheckedChange={setFullUrls}
              >
                Full URLs
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Profile</MenubarLabel>
              <MenubarRadioGroup value={profile} onValueChange={setProfile}>
                <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarGroup>
                  <MenubarLabel>Channels</MenubarLabel>
                  <MenubarItem>Email link</MenubarItem>
                  <MenubarItem>Messages</MenubarItem>
                </MenubarGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Support</MenubarLabel>
              <MenubarItem>Documentation</MenubarItem>
              <MenubarItem>Keyboard Shortcuts</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Wrapper>
  );
}

export function menubarCheckbox(): ReactNode {
  return (
    <Wrapper>
      <Menubar className="w-72">
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent className="w-64">
            <MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
            <MenubarCheckboxItem checked>
              Always Show Full URLs
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem inset>
              Reload <MenubarShortcut>⌘R</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled inset>
              Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Format</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked>Strikethrough</MenubarCheckboxItem>
            <MenubarCheckboxItem>Code</MenubarCheckboxItem>
            <MenubarCheckboxItem>Superscript</MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Wrapper>
  );
}

export function menubarRadio(): ReactNode {
  const [user, setUser] = React.useState("benoit");
  const [theme, setTheme] = React.useState("system");

  return (
    <Wrapper>
      <Menubar className="w-72">
        <MenubarMenu>
          <MenubarTrigger>Profiles</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup value={user} onValueChange={setUser}>
              <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
              <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
              <MenubarRadioItem value="luis">Luis</MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarSeparator />
            <MenubarItem inset>Edit...</MenubarItem>
            <MenubarItem inset>Add Profile...</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Theme</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup value={theme} onValueChange={setTheme}>
              <MenubarRadioItem value="light">Light</MenubarRadioItem>
              <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
              <MenubarRadioItem value="system">System</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Wrapper>
  );
}

export function menubarSubmenu(): ReactNode {
  return (
    <Wrapper>
      <Menubar className="w-72">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Email link</MenubarItem>
                <MenubarItem>Messages</MenubarItem>
                <MenubarItem>Notes</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem>
              Print... <MenubarShortcut>⌘P</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Find</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Find...</MenubarItem>
                <MenubarItem>Find Next</MenubarItem>
                <MenubarItem>Find Previous</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem>Cut</MenubarItem>
            <MenubarItem>Copy</MenubarItem>
            <MenubarItem>Paste</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Wrapper>
  );
}

export function menubarWithIcons(): ReactNode {
  return (
    <Wrapper>
      <Menubar className="w-72">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <FileIcon />
              New File <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <FolderIcon />
              Open Folder
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <SaveIcon />
              Save <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>More</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem>
                <SettingsIcon />
                Settings
              </MenubarItem>
              <MenubarItem>
                <HelpCircleIcon />
                Help
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem variant="destructive">
                <TrashIcon />
                Delete
              </MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Wrapper>
  );
}

export function menubarRtl(): ReactNode {
  const [profile, setProfile] = React.useState("benoit");

  return (
    <Wrapper className="flex-col gap-6">
      <DirectionProvider direction="ltr">
        <div dir="ltr">
          <Menubar className="w-72">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent align="start" dir="ltr">
                <MenubarGroup>
                  <MenubarItem>
                    New Tab <MenubarShortcut>⌘T</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem disabled>New Incognito Window</MenubarItem>
                </MenubarGroup>
                <MenubarSeparator />
                <MenubarGroup>
                  <MenubarSub>
                    <MenubarSubTrigger>Share</MenubarSubTrigger>
                    <MenubarSubContent dir="ltr">
                      <MenubarItem>Email link</MenubarItem>
                      <MenubarItem>Messages</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Profiles</MenubarTrigger>
              <MenubarContent align="start" dir="ltr">
                <MenubarRadioGroup value={profile} onValueChange={setProfile}>
                  <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                  <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </DirectionProvider>
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Menubar className="w-72">
            <MenubarMenu>
              <MenubarTrigger>ملف</MenubarTrigger>
              <MenubarContent align="end" dir="rtl">
                <MenubarGroup>
                  <MenubarItem>
                    علامة تبويب جديدة <MenubarShortcut>⌘T</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem disabled>نافذة التصفح المتخفي</MenubarItem>
                </MenubarGroup>
                <MenubarSeparator />
                <MenubarGroup>
                  <MenubarSub>
                    <MenubarSubTrigger>مشاركة</MenubarSubTrigger>
                    <MenubarSubContent dir="rtl">
                      <MenubarItem>رابط البريد الإلكتروني</MenubarItem>
                      <MenubarItem>الرسائل</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>الملفات الشخصية</MenubarTrigger>
              <MenubarContent align="end" dir="rtl">
                <MenubarRadioGroup value={profile} onValueChange={setProfile}>
                  <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                  <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </DirectionProvider>
    </Wrapper>
  );
}

/**
 * API-19: a two-line row composes `ItemContent` › `ItemTitle` + `ItemDescription`, and the row
 * links the description as its accessible description — on the item, the checkbox item and the
 * radio item alike. A disabled row keeps focus, so its reason travels as that description rather
 * than in a Tooltip.
 */
export function menubarDescriptionLine(): ReactNode {
  const [ruler, setRuler] = React.useState(true);
  return (
    <Wrapper>
      <Menubar className="w-72">
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent className="w-64">
            <MenubarCheckboxItem checked={ruler} onCheckedChange={setRuler}>
              <ItemContent>
                <ItemTitle>Show ruler</ItemTitle>
                <ItemDescription>Guides snap to its ticks</ItemDescription>
              </ItemContent>
            </MenubarCheckboxItem>
            <MenubarItem disabled>
              <ItemContent>
                <ItemTitle>Presenter view</ItemTitle>
                <ItemDescription>Connect a second display</ItemDescription>
              </ItemContent>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Wrapper>
  );
}
