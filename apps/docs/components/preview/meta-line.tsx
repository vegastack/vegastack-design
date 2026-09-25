"use client";

import type { ReactNode } from "react";
import { Calendar, Clock, Mic, Video } from "lucide-react";
import { Wrapper } from "./wrapper";
import { MetaLine, MetaLineItem } from "@/components/ui/meta-line";

export function metaLine(): ReactNode {
  return (
    <Wrapper>
      <MetaLine>
        <MetaLineItem icon={<Video />}>Video call</MetaLineItem>
        <MetaLineItem icon={<Calendar />}>Sep 25 · 10:30 AM</MetaLineItem>
        <MetaLineItem icon={<Clock />}>42m</MetaLineItem>
        <MetaLineItem icon={<Mic />}>Recorded by Asha Kumar</MetaLineItem>
      </MetaLine>
    </Wrapper>
  );
}

export function metaLineNarrow(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64 rounded-lg border border-border p-3">
        <MetaLine>
          <MetaLineItem icon={<Video />}>Video call</MetaLineItem>
          <MetaLineItem icon={<Calendar />}>Sep 25 · 10:30 AM</MetaLineItem>
          <MetaLineItem icon={<Clock />}>42m</MetaLineItem>
          <MetaLineItem icon={<Mic />}>Recorded by Asha Kumar</MetaLineItem>
        </MetaLine>
      </div>
    </Wrapper>
  );
}
