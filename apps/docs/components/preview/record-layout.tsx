"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { FileText, Link2 } from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import {
  RecordLayout,
  RecordLayoutMain,
  RecordPanel,
  RecordPanelAction,
  RecordPanelItem,
  RecordPanelList,
  RecordPanelProvider,
  RecordPanelSection,
  RecordPanelToggle,
  RecordPanelTrigger,
} from "@/components/ui/record-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** The task's sections, in the order R4 fixes: Details · Related · Files · Watching. */
function TaskSections() {
  return (
    <>
      <RecordPanelSection value="details" title="Details">
        <PropertyList variant="panel" aria-label="Task details">
          <PropertyRow>
            <PropertyLabel>Status</PropertyLabel>
            <PropertyValue>Todo</PropertyValue>
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Assignee</PropertyLabel>
            <PropertyValue>Amol Adlakha</PropertyValue>
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Due</PropertyLabel>
            <PropertyValue className="text-destructive-text">
              Overdue 2w
            </PropertyValue>
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Priority</PropertyLabel>
            <PropertyValue>Medium</PropertyValue>
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Space</PropertyLabel>
            <PropertyValue>Dev Ops for App</PropertyValue>
          </PropertyRow>
        </PropertyList>
      </RecordPanelSection>
      <RecordPanelSection
        value="related"
        title="Related"
        count={2}
        action={<RecordPanelAction label="Link a task" />}
      >
        <RecordPanelList>
          <RecordPanelItem
            render={<a href="#related" />}
            icon={<Link2 />}
            detail="Blocks"
          >
            {`#${131}`} Product master export
          </RecordPanelItem>
          <RecordPanelItem
            render={<a href="#related" />}
            icon={<Link2 />}
            detail="Relates"
          >
            {`#${88}`} Datasheet template
          </RecordPanelItem>
        </RecordPanelList>
      </RecordPanelSection>
      <RecordPanelSection
        value="files"
        title="Files"
        count={1}
        action={<RecordPanelAction label="Add file" />}
      >
        <RecordPanelList>
          <RecordPanelItem
            render={<a href="#files" />}
            icon={<FileText />}
            detail="1.2 MB"
          >
            Strada-Urban-Road-90W.pdf
          </RecordPanelItem>
        </RecordPanelList>
      </RecordPanelSection>
      <RecordPanelSection value="watching" title="Watching" count={3}>
        <RecordPanelList>
          <RecordPanelItem>You, Amol and Simran</RecordPanelItem>
        </RecordPanelList>
      </RecordPanelSection>
    </>
  );
}

/** A 48px page bar with ▥ as its last control, after a divider. */
function Bar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b ps-6 pe-2">
      <span className="truncate text-sm text-muted-foreground">
        {`Tasks › Dev Ops for App › #${129}`}
      </span>
      <div className="flex items-center gap-1">
        {children}
        <span aria-hidden className="mx-1 h-4.5 w-px bg-border" />
        <RecordPanelToggle />
      </div>
    </div>
  );
}

/** The work, in reading order, centred in the room the panel leaves. */
function Work() {
  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-3">
      <span className="text-xs text-muted-foreground">
        {`Dev Ops for App · #${129}`}
      </span>
      <h2 className="text-2xl font-semibold">
        Technical Datasheet design format
      </h2>
      <RecordPanelTrigger />
      <p className="text-sm">
        Create a sample TDS PDF and share it for reference. Review the LightUp
        Black DALI-2 family for what Product Master captures today.
      </p>
      <h3 className="pt-3 text-base font-semibold">Activity</h3>
      <p className="text-sm text-muted-foreground">
        Manoj attached a sample PDF for your reference.
      </p>
    </div>
  );
}

/** One record page in a frame: the bar, then the layout filling the rest. */
function RecordFrame({
  width,
  height = 520,
  defaultOpen = true,
}: {
  width?: number;
  height?: number;
  defaultOpen?: boolean;
}) {
  return (
    <RecordPanelProvider defaultOpen={defaultOpen} shortcut={false}>
      <div
        className="flex flex-col overflow-hidden rounded-card border bg-background"
        style={{ width: width ?? "100%", height }}
      >
        <Bar />
        <div className="flex min-h-0 flex-1 flex-col [--page-gutter:--spacing(8)]">
          <div className="flex min-h-0 flex-1 flex-col p-(--page-gutter)">
            <RecordLayout>
              <RecordLayoutMain>
                <Work />
              </RecordLayoutMain>
              <RecordPanel>
                <TaskSections />
              </RecordPanel>
            </RecordLayout>
          </div>
        </div>
      </div>
    </RecordPanelProvider>
  );
}

export function recordLayout(): ReactNode {
  return (
    <Wrapper className="block p-4">
      <RecordFrame />
    </Wrapper>
  );
}

/**
 * The same page at 1440 and 1024: docked and open on load from 1088px of record width; below it,
 * closed, and ▥ floats the panel over the page edge to edge. At a phone's width the Details
 * button opens the sections as a sheet.
 */
export function recordLayoutWidths(): ReactNode {
  return (
    <Wrapper className="block p-4">
      <div className="flex gap-6 overflow-x-auto pb-2">
        {[1440, 1024].map((w) => (
          <figure key={w} className="flex shrink-0 flex-col gap-2">
            <figcaption className="text-xs text-muted-foreground tabular-nums">
              {w}px
            </figcaption>
            <RecordFrame width={w} height={460} />
          </figure>
        ))}
      </div>
    </Wrapper>
  );
}

/** Tabs in the main column: `RecordLayoutPanels` under the tab row. */
export function recordLayoutTabs(): ReactNode {
  return (
    <Wrapper>
      <RecordLayout className="w-full">
        <RecordLayoutMain>
          <Tabs defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="pt-2 text-sm">
              The team agreed the rollout plan and the next review date.
            </TabsContent>
            <TabsContent value="transcript" className="pt-2 text-sm">
              Transcript…
            </TabsContent>
          </Tabs>
        </RecordLayoutMain>
      </RecordLayout>
    </Wrapper>
  );
}
