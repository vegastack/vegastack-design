"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Clock,
  Component,
  Flag,
  Folder,
  Timer,
  UserRound,
  X,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { PriorityIcon } from "@/components/ui/priority-icon";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertySection,
  PropertyValue,
} from "@/components/ui/property-list";
import {
  ActionList,
  ActionListChips,
  ActionListEmpty,
  ActionListItem,
  ActionListSkeleton,
  PropertyClamp,
  PropertyListSkeleton,
  PropertyPerson,
  PropertySectionSkeleton,
  RecordAsideSectionSkeleton,
  RecordAsideAction,
  RecordAsideCard,
  RecordAsideSection,
} from "@/components/ui/record-aside";
import { AvatarStack } from "@/components/ui/person-hover-card";
import { RecordChip } from "@/components/ui/record-chip";
import { StatusIcon } from "@/components/ui/status-icon";

const PEOPLE = [
  { name: "Asha Rao", email: "asha@acme.com" },
  { name: "Dev Menon", email: "dev@acme.com" },
  { name: "Lena Ortiz", email: "lena@acme.com" },
  { name: "Northwind FM leads" },
  { name: "Yuki Tan", email: "yuki@acme.com" },
  { name: "Omar Haddad", email: "omar@acme.com" },
  { name: "Ines Costa" },
];

function Details() {
  return (
    <RecordAsideSection title="Details">
      <PropertyList variant="inline" aria-label="Meeting details">
        <PropertyRow>
          <PropertyLabel icon={<Component />}>Type</PropertyLabel>
          <PropertyValue>Client call</PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<Timer />}>Duration</PropertyLabel>
          <PropertyValue>42 min</PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<UserRound />}>Created by</PropertyLabel>
          <PropertyValue>
            <PropertyPerson name="Asha Rao" />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<Clock />}>Created at</PropertyLabel>
          <PropertyValue>25 Sep, 10:30</PropertyValue>
        </PropertyRow>
      </PropertyList>
      <PropertySection title="Participants">
        <AvatarStack people={PEOPLE} label="Participants" />
      </PropertySection>
      <PropertySection title="Linked to">
        <RecordChip icon={<Building2 />} value="Acme Industries" />
        <RecordChip icon={<Folder />} value="Plant 2 retrofit" />
      </PropertySection>
      <PropertySection title="Notes">
        <PropertyClamp>
          The customer wants the retrofit quote split into two phases, with the
          first phase covering the compressors only. Finance needs the revised
          numbers before the Thursday review, and the site team asked for a
          walkthrough the week after.
        </PropertyClamp>
      </PropertySection>
    </RecordAsideSection>
  );
}

function Actions() {
  return (
    <>
      <RecordAsideSection
        title="Tasks from this meeting"
        count={2}
        action={
          <RecordAsideAction
            label="View in all tasks"
            icon={<ArrowUpRight />}
          />
        }
      >
        <ActionList>
          <ActionListItem render={<button type="button" />}>
            <StatusIcon status="progress" size="sm" />
            <ItemContent className="min-w-0">
              <ItemTitle>Send the phase 1 quote</ItemTitle>
              <ItemDescription className="flex items-center gap-1.5">
                Asha Rao · 30 Sep
                <PriorityIcon priority="high" size="xs" />
              </ItemDescription>
            </ItemContent>
          </ActionListItem>
          <ActionListItem render={<button type="button" />}>
            <StatusIcon status="todo" size="sm" />
            <ItemContent className="min-w-0">
              <ItemTitle>Book the site walkthrough</ItemTitle>
              <ItemDescription className="flex items-center gap-1.5">
                Dev Menon · No due date
                <PriorityIcon priority="none" size="xs" />
              </ItemDescription>
            </ItemContent>
          </ActionListItem>
        </ActionList>
      </RecordAsideSection>
      <RecordAsideSection
        title="Action items"
        count={1}
        action={<Button size="xs">Create 1 task</Button>}
      >
        <ActionList>
          <ActionListItem>
            <Checkbox aria-label="Select Share the revised numbers" />
            <ItemContent className="min-w-0">
              <ItemTitle>Share the revised numbers with finance</ItemTitle>
              <ActionListChips>
                <Button variant="ghost" size="xs">
                  <UserRound data-icon="inline-start" />
                  Assignee
                </Button>
                <Button variant="ghost" size="xs">
                  <CalendarDays data-icon="inline-start" />
                  Due
                </Button>
                <Button variant="ghost" size="xs">
                  <Flag data-icon="inline-start" />
                  Priority
                </Button>
              </ActionListChips>
            </ItemContent>
            <Button variant="ghost" size="icon-xs" aria-label="Dismiss">
              <X />
            </Button>
          </ActionListItem>
        </ActionList>
      </RecordAsideSection>
    </>
  );
}

export function recordAside(): ReactNode {
  return (
    <Wrapper>
      <div className="w-80">
        <RecordAsideCard>
          <Details />
        </RecordAsideCard>
      </div>
    </Wrapper>
  );
}

export function recordAsideActions(): ReactNode {
  return (
    <Wrapper>
      <div className="w-80">
        <RecordAsideCard>
          <Actions />
        </RecordAsideCard>
      </div>
    </Wrapper>
  );
}

export function recordAsideSkeleton(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-80 flex-col gap-4">
        <RecordAsideCard>
          <RecordAsideSectionSkeleton>
            <PropertyListSkeleton rows={4} />
          </RecordAsideSectionSkeleton>
          <PropertySectionSkeleton chips={2} />
        </RecordAsideCard>
        <RecordAsideCard>
          <RecordAsideSectionSkeleton>
            <ActionListSkeleton rows={2} />
          </RecordAsideSectionSkeleton>
        </RecordAsideCard>
      </div>
    </Wrapper>
  );
}

export function recordAsideEmpty(): ReactNode {
  return (
    <Wrapper>
      <div className="w-80">
        <RecordAsideCard>
          <RecordAsideSection title="Tasks from this meeting" count={0}>
            <ActionListEmpty>No tasks yet</ActionListEmpty>
          </RecordAsideSection>
          <RecordAsideSection title="Action items" count={0}>
            <ActionListEmpty>No suggestions</ActionListEmpty>
          </RecordAsideSection>
        </RecordAsideCard>
      </div>
    </Wrapper>
  );
}
