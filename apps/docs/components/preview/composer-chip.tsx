"use client";

import { useState, type ReactNode } from "react";
import { ListChecks, Sparkles } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/composer-chip` (dogfoods the registry) → auto-scanned.
import { ComposerChip } from "@/components/ui/composer-chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODELS = ["Haiku 5.5", "Sonnet 5.5", "Opus 5.5"];

export function composerChip(): ReactNode {
  function Demo(): ReactNode {
    const [plan, setPlan] = useState(false);
    const [model, setModel] = useState(MODELS[0]!);
    return (
      <div className="flex items-center gap-1">
        <ComposerChip
          icon={<ListChecks />}
          pressed={plan}
          onPressedChange={setPlan}
          tooltip="Plan first: it reads and proposes, and changes nothing until you accept"
        >
          Plan
        </ComposerChip>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <ComposerChip
                menu
                icon={<Sparkles />}
                aria-label={`Model: ${model}`}
              >
                {model}
              </ComposerChip>
            }
          />
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={model}
                onValueChange={(value) => setModel(value as string)}
              >
                {MODELS.map((m) => (
                  <DropdownMenuRadioItem key={m} value={m}>
                    {m}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  return (
    <Wrapper>
      <Demo />
    </Wrapper>
  );
}

export function composerChipStates(): ReactNode {
  return (
    <Wrapper>
      <ComposerChip icon={<ListChecks />} defaultPressed={false}>
        Plan
      </ComposerChip>
      <ComposerChip icon={<ListChecks />} defaultPressed>
        Plan
      </ComposerChip>
      <ComposerChip menu icon={<Sparkles />}>
        Haiku 5.5
      </ComposerChip>
      <ComposerChip icon={<ListChecks />} defaultPressed disabled>
        Plan
      </ComposerChip>
      <ComposerChip
        readOnly
        icon={<Sparkles />}
        tooltip="Maintainers and editors change the model in the agent's settings"
      >
        Sonnet 5.5
      </ComposerChip>
    </Wrapper>
  );
}
