"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import { RecordLayout, RecordLayoutMain } from "@/components/ui/record-layout";
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
