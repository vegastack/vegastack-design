"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/announcement-banner` (dogfoods the registry) → auto-scanned.
import { AnnouncementBanner } from "@/components/ui/announcement-banner";

export function announcementBanner(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <AnnouncementBanner
        dismissable
        action={
          <a
            href="#announcement-banner"
            className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
          >
            Read more
            <ArrowRight aria-hidden />
          </a>
        }
      >
        Workflows now orchestrate revenue agents.
      </AnnouncementBanner>
    </Wrapper>
  );
}
