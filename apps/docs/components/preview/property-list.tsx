"use client";

import type { ReactNode } from "react";
import { Building2, Globe, Tags, Users } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/property-list` (dogfoods the registry) → auto-scanned.
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import { EmptyValue } from "@/components/ui/empty";
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
              className="text-info-text hover:text-info-text/(--alpha-link-hover)"
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
          <PropertyLabel icon={<Users />}>Team</PropertyLabel>
          <PropertyValue>
            <EmptyValue>Set a value…</EmptyValue>
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
