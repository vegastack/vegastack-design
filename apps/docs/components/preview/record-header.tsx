"use client";

import { useState, type ReactNode } from "react";
import {
  Bell,
  Calendar,
  Clock,
  Ellipsis,
  FileText,
  Share2,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  RecordHeader,
  RecordHeaderSkeleton,
} from "@/components/ui/record-header";
import { MetaLine, MetaLineItem } from "@/components/ui/meta-line";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/person-hover-card";

const PEOPLE = [
  { name: "Asha Kumar", hue: "blue" as const },
  { name: "Ravi Menon", hue: "green" as const },
];

/** A record's full-page head: where it lives, its key, the title renamed in place, status, meta. */
export function recordHeader(): ReactNode {
  const [title, setTitle] = useState("Pricing note for the Q4 range");
  return (
    <Wrapper className="block">
      <RecordHeader
        eyebrow={<span className="truncate">Sales · Pricing</span>}
        keyBadge="DOC-31"
        icon={<FileText />}
        title={title}
        onRename={setTitle}
        status={<Badge variant="secondary">In review</Badge>}
        presence={<AvatarStack people={PEOPLE} max={3} label="Viewing now" />}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Share2 />
              Share
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Watch">
              <Bell />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Page actions">
              <Ellipsis />
            </Button>
          </>
        }
        meta={
          <MetaLine>
            <MetaLineItem icon={<Calendar />}>Created 12 Oct</MetaLineItem>
            <MetaLineItem icon={<Clock />}>Updated 2h ago</MetaLineItem>
          </MetaLine>
        }
      />
    </Wrapper>
  );
}

/** The level-2 head a peek uses, with only a key and a title. */
export function recordHeaderPeek(): ReactNode {
  return (
    <Wrapper className="block max-w-md">
      <RecordHeader
        level={2}
        keyBadge="TASK-12"
        title="Draft the Q4 pricing note"
      />
    </Wrapper>
  );
}

/** The loading shape at the same heights. */
export function recordHeaderSkeleton(): ReactNode {
  return (
    <Wrapper className="block max-w-md">
      <RecordHeaderSkeleton level={2} />
    </Wrapper>
  );
}
