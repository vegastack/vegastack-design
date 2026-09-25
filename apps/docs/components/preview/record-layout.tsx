"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import {
  RecordDetailsSheet,
  RecordLayout,
  RecordLayoutMain,
  RecordLayoutRail,
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
          <div className="flex items-start gap-2">
            <h2 className="min-w-0 flex-1 font-heading text-xl font-medium">
              Weekly sync with Acme
            </h2>
            <RecordDetailsSheet>
              <Facts />
            </RecordDetailsSheet>
          </div>
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
        <RecordLayoutRail aria-label="Meeting details">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <Facts />
            </CardContent>
          </Card>
        </RecordLayoutRail>
      </RecordLayout>
    </Wrapper>
  );
}
