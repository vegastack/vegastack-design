"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/tag-group` (dogfoods the registry) → auto-scanned.
import { Tag, TagGroup } from "@/components/ui/tag-group";

export function tagGroup(): ReactNode {
  // The record-tag voice: hue-tinted chips (bordered-tint formula) + +N overflow.
  return (
    <Wrapper className="flex-col items-center gap-4">
      <TagGroup aria-label="Categories">
        <Tag hue="yellow">Information Technology</Tag>
        <Tag hue="blue">B2B</Tag>
        <Tag hue="green">SaaS</Tag>
        <Tag hue="purple">Enterprise</Tag>
        <Tag>Uncategorized</Tag>
      </TagGroup>
      <TagGroup max={3} aria-label="Markets" className="max-w-72">
        <Tag hue="cyan">Fintech</Tag>
        <Tag hue="orange">Logistics</Tag>
        <Tag hue="pink">Consumer</Tag>
        <Tag hue="lime">Climate</Tag>
        <Tag hue="magenta">Creator economy</Tag>
        <Tag hue="red">Security</Tag>
      </TagGroup>
    </Wrapper>
  );
}

export function tagGroupHues(): ReactNode {
  return (
    <Wrapper>
      <TagGroup aria-label="All hues">
        {(
          [
            "neutral",
            "blue",
            "cyan",
            "green",
            "lime",
            "yellow",
            "orange",
            "red",
            "pink",
            "magenta",
            "purple",
          ] as const
        ).map((hue) => (
          <Tag key={hue} hue={hue}>
            {hue}
          </Tag>
        ))}
      </TagGroup>
    </Wrapper>
  );
}

export function tagGroupRemovable(): ReactNode {
  return <TagGroupRemovableExample />;
}

function TagGroupRemovableExample() {
  const [tags, setTags] = React.useState([
    "Design partner",
    "Priority",
    "EMEA",
  ]);
  const hues = ["purple", "orange", "cyan"] as const;
  return (
    <Wrapper className="flex-col items-center gap-3">
      <TagGroup aria-label="Labels">
        {tags.map((t, i) => (
          <Tag
            key={t}
            hue={hues[i % hues.length]}
            onRemove={() => setTags((prev) => prev.filter((x) => x !== t))}
            removeLabel={`Remove ${t}`}
          >
            {t}
          </Tag>
        ))}
      </TagGroup>
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No labels</p>
      ) : null}
    </Wrapper>
  );
}
