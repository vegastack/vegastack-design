"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/coverage-banner` (dogfoods the registry) → auto-scanned.
import { CoverageBanner } from "@/components/ui/coverage-banner";
import { PersonAvatar } from "@/components/ui/person-avatar";

const rohan = {
  name: "Rohan",
  avatar: (
    <PersonAvatar person={{ name: "Rohan Mehta", hue: "blue" }} size="xs" />
  ),
};
const noop = () => undefined;

function Column({
  children,
  width = "max-w-2xl",
}: {
  children: ReactNode;
  width?: string;
}): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={`flex w-full flex-col gap-4 ${width}`}>{children}</div>
    </Wrapper>
  );
}

export function coverageBanner(): ReactNode {
  return (
    <Column>
      <CoverageBanner
        person={rohan}
        text="Rohan covers your expense approvals until 30 Nov"
        action={{ label: "Change", onClick: noop }}
      />
      <CoverageBanner
        person={rohan}
        tone="warning"
        text="Anu is away: Rohan covers this approval, due today"
        action={{ label: "End", onClick: noop }}
      />
    </Column>
  );
}

export function coverageBannerInline(): ReactNode {
  return (
    <Column width="max-w-xs">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm">Anu Sharma</span>
        <CoverageBanner
          variant="inline"
          person={rohan}
          text="Away · Rohan covers approvals until 30 Nov"
        />
      </div>
    </Column>
  );
}

export function coverageBannerNarrow(): ReactNode {
  return (
    <Column width="max-w-[390px]">
      <CoverageBanner
        person={rohan}
        text="Rohan covers your expense, travel and purchase approvals until 30 Nov while you're at the Pune site"
        action={{ label: "Change", onClick: noop }}
      />
    </Column>
  );
}
