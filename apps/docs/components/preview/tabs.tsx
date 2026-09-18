"use client";

import type { ReactNode } from "react";
import { AppWindowIcon, CodeIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/tabs` (dogfoods the registry) → auto-scanned.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DirectionProvider } from "@/components/ui/direction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/*
 * Every fixture is upstream's own example from `vendor/shadcn/4.21.0/docs/tabs.md`, adapted only
 * for our import paths and — for RTL — for the fact that upstream's `language-selector` helper is
 * a docs-site fixture we do not have. Nothing here restyles the component.
 */

export function tabs(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="overview" className="w-[400px] max-w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                View your key metrics and recent project activity. Track
                progress across all your active projects.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              You have 12 active projects and 3 pending tasks.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Track performance and user engagement metrics. Monitor trends
                and identify growth opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Page views are up 25% compared to last month.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Generate and download your detailed reports. Export data in
                multiple formats for analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              You have 5 reports ready and available to export.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and options. Customize your
                experience to fit your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Configure notifications, security, and themes.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Wrapper>
  );
}

/** Upstream's Composition tree, rendered: a list of triggers above one panel per value. */
export function tabsComposition(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="account" className="w-[400px] max-w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          Make changes to your account here.
        </TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
      </Tabs>
    </Wrapper>
  );
}

export function tabsLine(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
      </Tabs>
    </Wrapper>
  );
}

export function tabsVertical(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="account" orientation="vertical">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
      </Tabs>
    </Wrapper>
  );
}

export function tabsDisabled(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="home">
        <TabsList>
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="settings" disabled>
            Disabled
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </Wrapper>
  );
}

export function tabsIcons(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">
            <AppWindowIcon />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <CodeIcon />
            Code
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </Wrapper>
  );
}

/**
 * Upstream drives its RTL example through a `language-selector` fixture we do not ship, so the
 * Arabic strings are inline and the subtree is wrapped in `DirectionProvider` — the same shape
 * every other RTL fixture in this repository uses.
 */
const arabic = {
  overview: "نظرة عامة",
  analytics: "التحليلات",
  reports: "التقارير",
  settings: "الإعدادات",
  overviewDesc:
    "عرض مقاييسك الرئيسية وأنشطة المشروع الأخيرة. تتبع التقدم عبر جميع مشاريعك النشطة.",
  overviewContent: "لديك ١٢ مشروعًا نشطًا و٣ مهام معلقة.",
  analyticsDesc:
    "تتبع مقاييس الأداء ومشاركة المستخدمين. راقب الاتجاهات وحدد فرص النمو.",
  reportsDesc:
    "إنشاء وتنزيل تقاريرك التفصيلية. تصدير البيانات بتنسيقات متعددة للتحليل.",
  settingsDesc: "إدارة تفضيلات حسابك وخياراته. تخصيص تجربتك لتناسب احتياجاتك.",
};

export function tabsRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper dir="rtl">
        <Tabs defaultValue="overview" className="w-full max-w-sm">
          <TabsList>
            <TabsTrigger value="overview">{arabic.overview}</TabsTrigger>
            <TabsTrigger value="analytics">{arabic.analytics}</TabsTrigger>
            <TabsTrigger value="reports">{arabic.reports}</TabsTrigger>
            <TabsTrigger value="settings">{arabic.settings}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>{arabic.overview}</CardTitle>
                <CardDescription>{arabic.overviewDesc}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {arabic.overviewContent}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>{arabic.analytics}</CardTitle>
                <CardDescription>{arabic.analyticsDesc}</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>{arabic.reports}</CardTitle>
                <CardDescription>{arabic.reportsDesc}</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{arabic.settings}</CardTitle>
                <CardDescription>{arabic.settingsDesc}</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </Wrapper>
    </DirectionProvider>
  );
}
