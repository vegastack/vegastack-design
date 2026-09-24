"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsListVariants,
  tabsTriggerVariants,
} from "@/components/ui/tabs";

/*
 * Every fixture down to `tabsRtl` is upstream's own example from `vendor/shadcn/4.21.0/docs/tabs.md`,
 * adapted only for our import paths and — for RTL — for the fact that upstream's
 * `language-selector` helper is a docs-site fixture we do not have. The fixtures after it
 * (`tabsCounts`, `tabsMany`, `tabsRoute`) demonstrate this system's own sections. Nothing here
 * restyles the component.
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

/**
 * A count rides inside the trigger, so it is part of the tab's accessible name: the visible number
 * is `aria-hidden` and an `sr-only` suffix says what it counts — the tab reads "Open 12 tasks".
 */
export function tabsCounts(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="open">
        <TabsList variant="line">
          <TabsTrigger value="open">
            Open
            <span aria-hidden className="text-muted-foreground tabular-nums">
              12
            </span>
            <span className="sr-only">12 tasks</span>
          </TabsTrigger>
          <TabsTrigger value="review">
            In review
            <span aria-hidden className="text-muted-foreground tabular-nums">
              3
            </span>
            <span className="sr-only">3 tasks</span>
          </TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>
    </Wrapper>
  );
}

const MANY_TABS = [
  "Overview",
  "Activity",
  "Members",
  "Billing",
  "Integrations",
  "Security",
  "Notifications",
  "Advanced",
] as const;

/**
 * Eight line tabs: `overflow="scroll"` is the line default, so the row scrolls inside itself with
 * edge fades, and the selected tab — the last one here — starts scrolled into view.
 */
export function tabsMany(): ReactNode {
  return (
    <Wrapper>
      <Tabs defaultValue="advanced" className="w-full min-w-0">
        <TabsList variant="line">
          {MANY_TABS.map((label) => (
            <TabsTrigger key={label} value={label.toLowerCase()}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </Wrapper>
  );
}

const ROUTES = ["Overview", "Activity", "Settings"] as const;

/**
 * Route tabs: each tab is a page, so this is a named `nav` of links drawn from the two exported
 * recipes — not a tablist. `aria-current="page"` marks the current route and `data-active` paints
 * it. In an app the links are the router's `Link` and `current` comes from the pathname.
 */
export function tabsRoute(): ReactNode {
  return <RouteTabs />;
}

function RouteTabs(): ReactNode {
  const [current, setCurrent] = useState<string>("Overview");
  return (
    <Wrapper>
      <nav
        aria-label="Project"
        data-orientation="horizontal"
        className="group/tabs w-full min-w-0"
      >
        <div
          data-orientation="horizontal"
          data-variant="line"
          className={tabsListVariants({ variant: "line", overflow: "scroll" })}
        >
          {ROUTES.map((route) => (
            <a
              key={route}
              href={`#${route.toLowerCase()}`}
              aria-current={route === current ? "page" : undefined}
              data-active={route === current ? "" : undefined}
              className={tabsTriggerVariants()}
              onClick={(event) => {
                event.preventDefault();
                setCurrent(route);
              }}
            >
              {route}
            </a>
          ))}
        </div>
      </nav>
    </Wrapper>
  );
}

/**
 * Whether the element is at least `min` px wide, or `null` until it has been measured (on the
 * server and in the static page), so the caller can keep the layout hidden rather than paint one
 * orientation and jump to the other.
 */
function useWiderThan(min: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState<boolean | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setWide((entry?.contentRect.width ?? 0) >= min),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [min]);
  return [ref, wide] as const;
}

const SECTIONS = ["General", "Specifications", "Pricing", "Media", "History"];

/** DS-62: vertical in-page sections that become a horizontal line list in a narrow container. */
export function tabsVerticalResponsive(): ReactNode {
  // 448px is the `@md` container width.
  const [ref, wide] = useWiderThan(448);
  return (
    <Wrapper className="block">
      {/* Hidden (not removed, so it keeps its box and can be measured) until the width is known:
          the first paint is already the right orientation, for the eye, the keys and ARIA. */}
      <div
        ref={ref}
        className="w-full min-w-0"
        style={{ visibility: wide === null ? "hidden" : undefined }}
      >
        <Tabs
          defaultValue="General"
          orientation={wide ? "vertical" : "horizontal"}
          className="w-full gap-4"
        >
          <TabsList variant="line" aria-label="Family settings">
            {SECTIONS.map((section) => (
              <TabsTrigger key={section} value={section}>
                {section}
              </TabsTrigger>
            ))}
          </TabsList>
          {SECTIONS.map((section) => (
            <TabsContent
              key={section}
              value={section}
              className="text-sm text-muted-foreground"
            >
              The {section.toLowerCase()} settings for this family.
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Wrapper>
  );
}

const LISTS = [
  { href: "#colours", label: "Colours", count: 12 },
  { href: "#finishes", label: "Finishes", count: 8 },
  { href: "#materials", label: "Materials", count: 23 },
  { href: "#mounting", label: "Mounting types", count: 4 },
];

/** DS-62: vertical route tabs with counts, and a `NativeSelect` jump in a narrow container. */
export function tabsRouteResponsive(): ReactNode {
  const [current, setCurrent] = useState(LISTS[0]!.href);
  return (
    <Wrapper className="block">
      <div className="@container w-full min-w-0">
        <NativeSelect
          aria-label="Picklist"
          className="@md:hidden"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        >
          {LISTS.map((list) => (
            <NativeSelectOption key={list.href} value={list.href}>
              {`${list.label} (${list.count})`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <nav
          aria-label="Picklists"
          data-orientation="vertical"
          className="group/tabs hidden w-56 @md:block"
        >
          <div
            data-orientation="vertical"
            data-variant="line"
            // Full width, so every link spans the column and the counts line up at its end.
            className={`${tabsListVariants({ variant: "line" })} w-full`}
          >
            {LISTS.map((list) => (
              <a
                key={list.href}
                href={list.href}
                aria-current={list.href === current ? "page" : undefined}
                data-active={list.href === current ? "" : undefined}
                className={tabsTriggerVariants()}
                onClick={(event) => {
                  event.preventDefault();
                  setCurrent(list.href);
                }}
              >
                {list.label}
                <span
                  aria-hidden="true"
                  className="ms-auto text-muted-foreground tabular-nums"
                >
                  {list.count}
                </span>
                <span className="sr-only">{list.count} values</span>
              </a>
            ))}
          </div>
        </nav>
      </div>
    </Wrapper>
  );
}
