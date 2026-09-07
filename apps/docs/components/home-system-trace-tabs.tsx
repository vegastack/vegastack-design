"use client";

import * as React from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StatusIcon } from "@/components/ui/status-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The two client leaves of the home "system trace" (DC-07, DC-13). Everything else in the trace
 * — the data tables, prose, links and the static button/message layers — is server-rendered by
 * `home-system-trace.tsx` and passed in as children.
 */
export interface TraceTab {
  value: string;
  label: string;
  panel: React.ReactNode;
}

/** The system `Tabs` (pill variant) instead of a hand-rolled tablist built from `Button`s. */
export function TraceTabs({ items }: { items: TraceTab[] }) {
  return (
    <Tabs defaultValue={items[0]?.value} className="gap-0">
      <div className="border-b border-border p-3">
        <TabsList
          variant="pill"
          className="grid w-full grid-cols-3"
          aria-label="Choose a component to trace through the system"
        >
          {items.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className="motion-enter-up"
        >
          {item.panel}
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * The "Input" trace's component + pattern layers share one piece of state (the typed project
 * name), so they are the one client leaf among the layer columns. Renders two grid cells.
 */
export function TraceInputLayers({
  componentHeader,
  patternHeader,
  componentCaption,
  patternCaption,
}: {
  componentHeader: React.ReactNode;
  patternHeader: React.ReactNode;
  componentCaption: React.ReactNode;
  patternCaption: React.ReactNode;
}) {
  const [projectName, setProjectName] = React.useState("VegaStack Design");
  const normalizedName = projectName.trim() || "Untitled project";
  const slug = normalizedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <>
      <div className="flex h-full min-w-0 flex-col gap-5 p-5">
        {componentHeader}
        <div className="flex min-h-44 flex-1 items-center justify-center rounded-lg border border-border bg-background p-5">
          <Field
            label="Project name"
            description="The composed pattern updates while you type."
          >
            <Input
              name="trace-project-name"
              autoComplete="off"
              value={projectName}
              onValueChange={setProjectName}
              placeholder="VegaStack Design…"
            />
          </Field>
        </div>
        {componentCaption}
      </div>
      <div className="flex h-full min-w-0 flex-col gap-5 p-5">
        {patternHeader}
        <div className="flex min-h-44 flex-1 items-center justify-center rounded-lg border border-border bg-background p-5">
          <div className="w-full max-w-sm">
            <p className="text-label text-foreground">Project identity</p>
            <p className="mt-1 truncate text-h3 text-foreground">
              {normalizedName}
            </p>
            <p className="mt-1 truncate font-mono text-sm text-muted-foreground">
              /projects/{slug || "untitled-project"}
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <StatusIcon status="done" size="sm" label="Valid project name" />
              <span>Ready to create</span>
            </div>
          </div>
        </div>
        {patternCaption}
      </div>
    </>
  );
}
