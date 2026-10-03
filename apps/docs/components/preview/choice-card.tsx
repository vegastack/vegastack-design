"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Globe, Lock } from "lucide-react";
import { Wrapper } from "./wrapper";
import { ChoiceCard, ChoiceCardGroup } from "@/components/ui/choice-card";

/** A space's access: two cards, two across from `@sm`, stacked below. */
export function choiceCard(): ReactNode {
  const [access, setAccess] = React.useState("open");
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-lg">
        <ChoiceCardGroup
          aria-label="Access"
          value={access}
          onValueChange={(value) => setAccess(value as string)}
        >
          <ChoiceCard
            value="open"
            icon={<Globe />}
            title="Open"
            description="Everyone can find and join"
          />
          <ChoiceCard
            value="private"
            icon={<Lock />}
            title="Private"
            description="Only members can find and open it"
          />
        </ChoiceCardGroup>
      </div>
    </Wrapper>
  );
}

/** Without icons, and a disabled option. */
export function choiceCardDisabled(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-lg">
        <ChoiceCardGroup aria-label="Plan" defaultValue="team">
          <ChoiceCard value="team" title="Team" description="Up to 20 seats" />
          <ChoiceCard
            value="enterprise"
            title="Enterprise"
            description="Talk to sales"
            disabled
          />
        </ChoiceCardGroup>
      </div>
    </Wrapper>
  );
}
