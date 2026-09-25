"use client";

import type { ReactNode } from "react";
import {
  Building2,
  Clock,
  Component,
  Globe,
  Tags,
  Timer,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/property-list` (dogfoods the registry) → auto-scanned.
import {
  PropertyEmpty,
  PropertySection,
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import { Tag, TagGroup } from "@/components/ui/tag-group";

export function propertyList(): ReactNode {
  // The record-facts pane: label track + value column, values are compositions.
  return (
    <Wrapper>
      <PropertyList aria-label="Record details" className="w-full max-w-sm">
        <PropertyRow>
          <PropertyLabel icon={<Globe />}>Domains</PropertyLabel>
          <PropertyValue>
            <a
              className="text-info-text hover:text-info-text/88"
              href="#property-list"
            >
              attio.com
            </a>
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<Building2 />}>Name</PropertyLabel>
          <PropertyValue>Attio</PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<UsersRound />}>Team</PropertyLabel>
          <PropertyValue>
            <span className="text-sm text-muted-foreground">Set a value…</span>
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<Tags />}>Categories</PropertyLabel>
          <PropertyValue className="overflow-visible whitespace-normal">
            <TagGroup max={2} aria-label="Categories">
              <Tag hue="yellow">Information Technology</Tag>
              <Tag hue="blue">B2B</Tag>
              <Tag hue="green">SaaS</Tag>
            </TagGroup>
          </PropertyValue>
        </PropertyRow>
      </PropertyList>
    </Wrapper>
  );
}

export function propertyListNarrow(): ReactNode {
  // The pane at its narrowest: a long value truncates inside its own column instead of
  // widening the list, and an unset property reads as an honest empty value rather than a
  // blank row.
  return (
    <Wrapper>
      <PropertyList aria-label="Record details" className="w-full max-w-64">
        <PropertyRow>
          <PropertyLabel icon={<Globe />}>Domains</PropertyLabel>
          <PropertyValue>
            marketing.internal.example-corporation.com
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<Building2 />}>Name</PropertyLabel>
          <PropertyValue>Example Corporation Holdings</PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel icon={<UsersRound />}>Team</PropertyLabel>
          <PropertyValue>
            <span className="text-sm text-muted-foreground">Set a value…</span>
          </PropertyValue>
        </PropertyRow>
      </PropertyList>
    </Wrapper>
  );
}

export function propertyListInline(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-72 flex-col gap-5">
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
            <PropertyLabel icon={<UserRound />}>Owner</PropertyLabel>
            <PropertyValue>
              <Button variant="ghost" size="xs">
                Asha Rao
              </Button>
            </PropertyValue>
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel icon={<Clock />}>Follow-up</PropertyLabel>
            <PropertyValue>
              <PropertyEmpty />
            </PropertyValue>
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel icon={<Building2 />}>Customer</PropertyLabel>
            <PropertyValue>
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
              >
                + Add
              </Button>
            </PropertyValue>
          </PropertyRow>
        </PropertyList>
        <PropertySection title="Tags">
          <span className="text-sm">Renewal, Q4</span>
        </PropertySection>
      </div>
    </Wrapper>
  );
}
