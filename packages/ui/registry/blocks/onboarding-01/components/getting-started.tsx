// @vegastack onboarding-01@0.9.1 sha256-p/iph+OlRAesh1Wuhl32xooYmZifg60qqRXlwVlbZ6Y=

"use client";

import * as React from "react";
import { Bot, CreditCard, Mail, Plug, Users } from "lucide-react";

import {
  OnboardingChecklist,
  OnboardingChecklistItem,
} from "@/components/ui/onboarding-checklist";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
  done: boolean;
}

const STEPS: Step[] = [
  {
    id: "workspace",
    label: "Name your workspace",
    icon: <Users />,
    done: true,
  },
  { id: "email", label: "Connect an inbox", icon: <Mail />, done: true },
  { id: "agent", label: "Create your first agent", icon: <Bot />, done: false },
  {
    id: "integration",
    label: "Install an integration",
    icon: <Plug />,
    done: false,
  },
  {
    id: "billing",
    label: "Add a payment method",
    icon: <CreditCard />,
    done: false,
  },
];

export function GettingStarted() {
  const [steps, setSteps] = React.useState(STEPS);
  const done = steps.filter((step) => step.done).length;

  return (
    <OnboardingChecklist
      title="Getting started"
      done={done}
      total={steps.length}
    >
      {steps.map((step) => (
        <OnboardingChecklistItem
          key={step.id}
          icon={step.icon}
          done={step.done}
          onClick={() =>
            setSteps((previous) =>
              previous.map((candidate) =>
                candidate.id === step.id
                  ? { ...candidate, done: true }
                  : candidate,
              ),
            )
          }
        >
          {step.label}
        </OnboardingChecklistItem>
      ))}
    </OnboardingChecklist>
  );
}
