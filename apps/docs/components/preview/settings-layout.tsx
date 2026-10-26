"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/settings-layout` (dogfoods the registry) → auto-scanned.
import {
  SettingsLayout,
  SettingsLayoutContent,
  SettingsNav,
  type SettingsNavSection,
} from "@/components/ui/settings-layout";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "@/components/ui/settings-row";
import { MemberList } from "@/components/ui/member-list";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const SECTIONS: SettingsNavSection[] = [
  {
    label: "Account",
    items: [
      { href: "/settings/profile", label: "Profile" },
      { href: "/settings/notifications", label: "Notifications" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/settings/general", label: "General" },
      { href: "/settings/members", label: "Members", badge: 4 },
      { href: "/settings/teams", label: "Teams" },
    ],
  },
];

const ROLES = [
  { value: "admin", label: "Admin", description: "Manage the workspace" },
  { value: "member", label: "Member", description: "Use every module" },
];

/** In the docs a link only changes the demo's page; in an app it is your router's `<Link />`. */
const NavigateContext = React.createContext<(href: string) => void>(() => {});

function DemoLink({ href = "", onClick, ...props }: React.ComponentProps<"a">) {
  const navigate = React.useContext(NavigateContext);
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
        navigate(href);
      }}
      {...props}
    />
  );
}

function Page({ href }: { href: string }) {
  if (href === "/settings/members") {
    return (
      <SettingsLayoutContent kind="list">
        <h2 className="font-heading text-lg font-medium">Members</h2>
        <MemberList
          roles={ROLES}
          onRoleChange={() => {}}
          onRemove={() => {}}
          members={[
            {
              id: "u1",
              person: { name: "Manoj Kumar", hue: "blue" },
              role: "admin",
              you: true,
            },
            {
              id: "u2",
              person: { name: "Priya Shah", hue: "green" },
              role: "member",
            },
            {
              id: "u3",
              person: { name: "Rahul Verma", hue: "orange" },
              role: "member",
            },
            {
              id: "u4",
              person: { name: "Anand Iyer", hue: "purple" },
              role: "member",
            },
          ]}
        />
      </SettingsLayoutContent>
    );
  }
  const title =
    SECTIONS.flatMap((section) => section.items).find(
      (item) => item.href === href,
    )?.label ?? "Profile";
  return (
    <SettingsLayoutContent kind="form">
      <h2 className="font-heading text-lg font-medium">{title}</h2>
      <SettingsSection>
        <SettingsCard>
          <SettingsRow label="Name" controlId={`${href}-name`}>
            <Input id={`${href}-name`} defaultValue="Manoj Kumar" />
          </SettingsRow>
          <SettingsRow label="Daily digest" description="Unread items at 9:00.">
            <Switch defaultChecked aria-label="Daily digest" />
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>
    </SettingsLayoutContent>
  );
}

function Demo({ initial = "/settings/profile" }: { initial?: string }) {
  // `/settings` is the index: on a narrow layout it is the nav screen.
  const [href, setHref] = React.useState(initial);
  const page = href === "/settings" ? "/settings/profile" : href;
  return (
    <NavigateContext.Provider value={setHref}>
      <SettingsLayout
        view={href === "/settings" ? "nav" : "content"}
        backHref="/settings"
        linkRender={<DemoLink />}
        nav={
          <SettingsNav
            sections={SECTIONS}
            activeHref={page}
            linkRender={<DemoLink />}
          />
        }
      >
        <Page href={page} />
      </SettingsLayout>
    </NavigateContext.Provider>
  );
}

/** Both panes: the nav sticks, every page starts at the same x — a form at 720, a list at 960. */
export function settingsLayout(): ReactNode {
  return (
    <Wrapper className="block p-4">
      <Demo />
    </Wrapper>
  );
}

/** A phone's width: the nav is the first screen; a page pushes in with "‹ Settings". */
export function settingsLayoutNarrow(): ReactNode {
  return (
    <Wrapper className="block p-4">
      <div className="mx-auto w-full max-w-sm">
        <Demo initial="/settings" />
      </div>
    </Wrapper>
  );
}
