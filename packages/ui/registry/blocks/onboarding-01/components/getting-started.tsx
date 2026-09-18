// @vegastack onboarding-01@0.10.0 sha256-kIaWwhqdlhSAQjS/izOv7vO1lTuQZfPuoy38fN8SPLU=

"use client";

import * as React from "react";
import { Bot, CreditCard, Mail, Plug, Users } from "lucide-react";

import { OnboardingChecklist, OnboardingChecklistItem } from "./checklist";

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

/**
 * The checklist itself: `OnboardingChecklist` over five sample steps, with the host owning `done`
 * exactly as the component's contract requires. Clicking a step marks it complete here; in a real
 * app that call is the one that records the step server-side.
 *
 * @example
 * <GettingStarted />
 */
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
