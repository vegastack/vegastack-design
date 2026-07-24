"use client";

import type { ReactNode } from "react";
import { BarChart3, Mail, Send, Workflow } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/onboarding-checklist` (dogfoods the registry) → auto-scanned.
import {
  OnboardingChecklist,
  OnboardingChecklistItem,
} from "@/components/ui/onboarding-checklist";

export function onboardingChecklist(): ReactNode {
  return (
    <Wrapper className="items-start justify-center gap-8">
      <OnboardingChecklist title="Getting started" done={1} total={4}>
        <OnboardingChecklistItem icon={<Mail aria-hidden />} done>
          Sync email account
        </OnboardingChecklistItem>
        <OnboardingChecklistItem icon={<BarChart3 aria-hidden />}>
          Create a report
        </OnboardingChecklistItem>
        <OnboardingChecklistItem icon={<Workflow aria-hidden />}>
          Create a workflow
        </OnboardingChecklistItem>
        <OnboardingChecklistItem icon={<Send aria-hidden />}>
          Create a sequence
        </OnboardingChecklistItem>
      </OnboardingChecklist>
      <OnboardingChecklist
        title="Getting started"
        done={1}
        total={4}
        defaultCollapsed
      >
        <OnboardingChecklistItem icon={<Mail aria-hidden />} done>
          Sync email account
        </OnboardingChecklistItem>
      </OnboardingChecklist>
    </Wrapper>
  );
}
