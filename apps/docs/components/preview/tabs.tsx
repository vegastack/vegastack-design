"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Activity, BarChart3, Bell, Settings, User } from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/tabs` (dogfoods the registry) → auto-scanned.
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function tabs(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="overview" className="w-full max-w-md">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity" count={3}>
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4 text-muted-foreground">
          A high-level summary of your workspace.
        </TabsContent>
        <TabsContent value="activity" className="pt-4 text-muted-foreground">
          3 new events since you last checked in.
        </TabsContent>
        <TabsContent value="settings" className="pt-4 text-muted-foreground">
          Manage preferences and integrations.
        </TabsContent>
      </Tabs>
    </Wrapper>
  );
}

export function tabsVariants(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-8">
      <Tabs defaultValue="overview" className="w-full max-w-md">
        <TabsList variant="line">
          <TabsTrigger value="overview">
            <BarChart3 />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" count={3}>
            <Activity />
            Activity
          </TabsTrigger>
          <TabsTrigger value="account">
            <User />
            Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4 text-muted-foreground">
          Line variant — a moving underline tracks the active tab.
        </TabsContent>
        <TabsContent value="activity" className="pt-4 text-muted-foreground">
          Compose a leading icon as the first child and pass `count` for a
          badge.
        </TabsContent>
        <TabsContent value="account" className="pt-4 text-muted-foreground">
          Account details and security.
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="overview" className="w-full max-w-md">
        <TabsList variant="pill">
          <TabsTrigger value="overview">
            <BarChart3 />
            Overview
          </TabsTrigger>
          <TabsTrigger value="notifications" count={12}>
            <Bell />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4 text-muted-foreground">
          Pill variant — the active tab becomes a raised chip on a muted track.
        </TabsContent>
        <TabsContent
          value="notifications"
          className="pt-4 text-muted-foreground"
        >
          12 unread notifications.
        </TabsContent>
        <TabsContent value="settings" className="pt-4 text-muted-foreground">
          Manage preferences and integrations.
        </TabsContent>
      </Tabs>
    </Wrapper>
  );
}

export function tabsVerticalLine(): ReactNode {
  return (
    <Wrapper>
      <Tabs
        defaultValue="profile"
        orientation="vertical"
        className="w-full max-w-md"
      >
        <TabsList variant="line">
          <TabsTrigger value="profile">
            <User />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" count={5}>
            <Bell />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="text-muted-foreground">
          Vertical + line — the moving underline indicator rides the left rail.
        </TabsContent>
        <TabsContent value="notifications" className="text-muted-foreground">
          5 notification preferences to review.
        </TabsContent>
        <TabsContent value="settings" className="text-muted-foreground">
          Workspace and billing settings.
        </TabsContent>
      </Tabs>
    </Wrapper>
  );
}

export function tabsDisabled(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="overview" className="w-full max-w-md">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity" count={3}>
            Activity
          </TabsTrigger>
          <TabsTrigger value="billing" disabled>
            Billing
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4 text-muted-foreground">
          A high-level summary of your workspace.
        </TabsContent>
        <TabsContent value="activity" className="pt-4 text-muted-foreground">
          3 new events since you last checked in.
        </TabsContent>
        <TabsContent value="billing" className="pt-4 text-muted-foreground">
          Billing is unavailable on your current plan.
        </TabsContent>
      </Tabs>
    </Wrapper>
  );
}

export function tabsVertical(): ReactNode {
  return (
    <Wrapper>
      <Tabs
        defaultValue="profile"
        orientation="vertical"
        className="w-full max-w-md"
      >
        <TabsList variant="pill">
          <TabsTrigger value="profile">
            <User />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" count={5}>
            <Bell />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="text-muted-foreground">
          Your public profile and avatar.
        </TabsContent>
        <TabsContent value="notifications" className="text-muted-foreground">
          5 notification preferences to review.
        </TabsContent>
        <TabsContent value="settings" className="text-muted-foreground">
          Workspace and billing settings.
        </TabsContent>
      </Tabs>
    </Wrapper>
  );
}

export function tabsChip(): ReactNode {
  // Wave 2 `chip` variant: free-standing tabs on the 28px scale; the active tab
  // raises to a hairline-ringed secondary chip (the dense record-page treatment).
  return (
    <Wrapper className="flex-col items-start gap-4">
      <Tabs defaultValue="overview">
        <TabsList variant="chip">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity" count={12}>
            Activity
          </TabsTrigger>
          <TabsTrigger value="files" count={4}>
            Files
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="overview"
          className="text-base text-muted-foreground"
        >
          Record overview panel.
        </TabsContent>
        <TabsContent
          value="activity"
          className="text-base text-muted-foreground"
        >
          Activity timeline panel.
        </TabsContent>
        <TabsContent value="files" className="text-base text-muted-foreground">
          Files panel.
        </TabsContent>
      </Tabs>
    </Wrapper>
  );
}
