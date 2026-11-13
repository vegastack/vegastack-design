"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/model-effort-menu` (dogfoods the registry) → auto-scanned.
import {
  ModelEffortMenu,
  type EffortLevel,
} from "@/components/ui/model-effort-menu";

const MODELS = [
  {
    id: "sonnet",
    label: "Sonnet 5.5",
    description: "Everyday work",
    available: true,
  },
  {
    id: "opus",
    label: "Opus 5.5",
    description: "Hard problems, longer thinking",
    available: true,
  },
  {
    id: "haiku",
    label: "Haiku 5.5",
    description: "Quick answers",
    available: true,
  },
];
const MORE = [
  {
    id: "gemini",
    label: "Gemini 3 Pro",
    description: "Long documents",
    available: true,
  },
  { id: "gpt", label: "GPT-6", available: false },
];
const LEVELS: Record<string, EffortLevel[]> = {
  sonnet: ["low", "medium", "high", "max"],
  opus: ["low", "medium", "high", "max"],
  haiku: ["low", "medium", "high", "max"],
  gemini: ["low", "medium", "high"],
};

export function modelEffortMenu(): ReactNode {
  function Demo(): ReactNode {
    const [model, setModel] = useState("sonnet");
    const [effort, setEffort] = useState<EffortLevel>("high");
    const efforts = LEVELS[model] ?? [];
    return (
      <ModelEffortMenu
        models={MODELS}
        moreModels={MORE}
        modelId={model}
        onModel={setModel}
        efforts={efforts}
        recommended={model === "sonnet" ? "high" : "medium"}
        effort={effort}
        onEffort={setEffort}
        maxWarning="about 3× usage"
      />
    );
  }
  return (
    <Wrapper className="items-end">
      <Demo />
    </Wrapper>
  );
}

export function modelEffortMenuReadOnly(): ReactNode {
  return (
    <Wrapper>
      <ModelEffortMenu
        models={MODELS}
        modelId="haiku"
        efforts={["low", "medium", "high", "max"]}
        recommended="medium"
        effort="high"
        readOnly="Set on the agent"
      />
    </Wrapper>
  );
}

export function modelEffortMenuNoEffort(): ReactNode {
  return (
    <Wrapper>
      <ModelEffortMenu
        models={[{ id: "mini", label: "Mini 2", available: true }]}
        modelId="mini"
        onModel={() => {}}
      />
    </Wrapper>
  );
}
