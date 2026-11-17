"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { FileText, Info, MessageSquare, Paperclip } from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  DocumentLayout,
  DocumentLayoutBody,
  DocumentLayoutContents,
  DocumentLayoutHeader,
  DocumentLayoutTitle,
} from "@/components/ui/document-layout";
import { TableOfContents } from "@/components/ui/table-of-contents";
import { Switch } from "@/components/ui/switch";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import {
  RecordLayout,
  RecordLayoutMain,
  RecordLayoutPanel,
  RecordLayoutSide,
  RecordLayoutStrip,
  RecordLayoutStripItem,
  RecordLayoutStripSlot,
} from "@/components/ui/record-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Facts() {
  return (
    <PropertyList aria-label="Meeting details">
      <PropertyRow>
        <PropertyLabel>Type</PropertyLabel>
        <PropertyValue>Client call</PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>When</PropertyLabel>
        <PropertyValue>25 Sep, 10:30</PropertyValue>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Length</PropertyLabel>
        <PropertyValue>42 min</PropertyValue>
      </PropertyRow>
    </PropertyList>
  );
}

export function recordLayout(): ReactNode {
  return (
    <Wrapper>
      <RecordLayout className="w-full">
        <RecordLayoutMain>
          <h2 className="min-w-0 font-heading text-xl font-medium">
            Weekly sync with Acme
          </h2>
          <Facts />
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

/** The strip and its panels, shared by the examples below. */
function Panels({
  panel,
  onPanelChange,
  defaultPanel,
}: {
  panel?: string | null;
  onPanelChange?: (panel: string | null) => void;
  defaultPanel?: string | null;
}) {
  const [width, setWidth] = React.useState(360);
  return (
    <RecordLayoutSide
      panel={panel}
      defaultPanel={defaultPanel}
      onPanelChange={onPanelChange}
      panelWidth={width}
      onPanelWidthChange={setWidth}
    >
      <RecordLayoutPanel value="details" title="Details">
        <Facts />
      </RecordLayoutPanel>
      <RecordLayoutPanel value="transcript" title="Transcript">
        <p className="text-sm">
          <span className="text-muted-foreground tabular-nums">00:12 </span>
          Asha: Let&apos;s agree the rollout plan first.
        </p>
      </RecordLayoutPanel>
      <RecordLayoutPanel value="files" title="Files">
        <ul className="flex flex-col gap-2 text-sm">
          <li>rollout-plan.pdf</li>
          <li>pricing.xlsx</li>
          <li>notes.md</li>
        </ul>
      </RecordLayoutPanel>
      <RecordLayoutPanel value="threads" title="Comment threads">
        <p className="text-sm text-muted-foreground">No open threads.</p>
      </RecordLayoutPanel>
      <RecordLayoutStrip>
        <RecordLayoutStripItem
          value="details"
          label="Details"
          icon={<Info />}
        />
        <RecordLayoutStripItem
          value="transcript"
          label="Transcript"
          icon={<FileText />}
        />
        <RecordLayoutStripItem
          value="files"
          label="Files"
          icon={<Paperclip />}
          count={3}
        />
        <RecordLayoutStripItem
          value="threads"
          label="Comment threads"
          icon={<MessageSquare />}
        />
      </RecordLayoutStrip>
    </RecordLayoutSide>
  );
}

/**
 * A record page with its reference panels: the strip on the right edge opens one panel at a
 * time (here the meeting's default, Transcript). From 1200px of record width the panel docks;
 * narrower, as here, it floats over the main column. On a phone the strip is a row of buttons
 * under the title and each panel is a bottom sheet.
 */
export function recordLayoutSide(): ReactNode {
  return (
    <Wrapper className="block p-0">
      <RecordLayout className="h-[26rem] w-full overflow-hidden">
        <RecordLayoutMain className="overflow-y-auto p-6">
          <h2 className="min-w-0 font-heading text-xl font-medium">
            Weekly sync with Acme
          </h2>
          <RecordLayoutStripSlot />
          <p className="text-sm">
            The team agreed the rollout plan and the next review date. Comments,
            decisions and tasks follow here, in reading order.
          </p>
        </RecordLayoutMain>
        <Panels defaultPanel="transcript" />
      </RecordLayout>
    </Wrapper>
  );
}

const OUTLINE = ["Seats", "Renewal", "Limits"].map((text) => ({
  id: `reading-${text.toLowerCase()}`,
  level: 2,
  text,
}));

/** One reading-width page in a frame of a given width, with or without its side panel. */
function ReadingFrame({ width, open }: { width: number; open: boolean }) {
  return (
    <figure className="flex shrink-0 flex-col gap-2">
      <figcaption className="text-xs text-muted-foreground tabular-nums">
        {width}px · panel {open ? "open" : "closed"}
      </figcaption>
      <div
        className="overflow-hidden rounded-card border bg-background"
        style={{ width, height: 360 }}
      >
        <RecordLayout className="h-full">
          <RecordLayoutMain className="overflow-y-auto py-8">
            <DocumentLayout>
              <DocumentLayoutHeader>
                <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
              </DocumentLayoutHeader>
              <DocumentLayoutContents>
                <TableOfContents
                  variant="rail"
                  side="start"
                  sticky={false}
                  items={OUTLINE}
                />
              </DocumentLayoutContents>
              <DocumentLayoutBody>
                <p className="text-base">
                  Pricing for the annual plan is set per seat and billed once a
                  year. Teams that grow during the term add seats at the same
                  rate, prorated to the renewal date.
                </p>
              </DocumentLayoutBody>
            </DocumentLayout>
          </RecordLayoutMain>
          <Panels panel={open ? "details" : null} />
        </RecordLayout>
      </div>
    </figure>
  );
}

/**
 * The reading-width model at 1440, 1280 and 1024: the text keeps its measure and stays centred
 * in the room the panel leaves (it slides to the start when the panel docks); the contents rail
 * keeps its gap in the start gutter; below 1200px the panel floats over the text instead.
 * Scroll sideways to compare; the switch opens and closes the panel in all three.
 */
export function recordLayoutReadingWidths(): ReactNode {
  const [open, setOpen] = React.useState(true);
  return (
    <Wrapper className="block p-4">
      <label className="mb-3 flex items-center gap-2 text-sm">
        <Switch checked={open} onCheckedChange={setOpen} />
        Side panel open
      </label>
      <div className="flex gap-6 overflow-x-auto pb-2">
        {[1440, 1280, 1024].map((w) => (
          <ReadingFrame key={w} width={w} open={open} />
        ))}
      </div>
    </Wrapper>
  );
}
