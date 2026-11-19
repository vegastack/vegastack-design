"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/delegate-row` (dogfoods the registry) → auto-scanned.
import { DelegateRow } from "@/components/ui/delegate-row";
import { PersonAvatar } from "@/components/ui/person-avatar";

const avatar = (name: string, hue: "blue" | "green" | "purple") => (
  <PersonAvatar person={{ name, hue }} size="sm" />
);
const noop = () => undefined;

function Rows(): ReactNode {
  return (
    <>
      <DelegateRow
        area="Approvals · Expenses, Travel"
        person={{ name: "Rohan Mehta", avatar: avatar("Rohan Mehta", "blue") }}
        until="30 Nov"
        note="I'm at the Pune site this week; Rohan approves anything under ₹50,000 and asks me about the rest."
        state="active"
        onEdit={noop}
        onEnd={noop}
      />
      <DelegateRow
        area="Everything"
        person={{ name: "Priya Shah", avatar: avatar("Priya Shah", "purple") }}
        from="2 Dec"
        until="30 Dec"
        state="upcoming"
        onEdit={noop}
        onEnd={noop}
      />
      <DelegateRow
        area="Tasks"
        person={{ name: "Asha Rao", avatar: avatar("Asha Rao", "green") }}
        from="1 Nov"
        until="8 Nov"
        state="ended"
      />
      <DelegateRow
        area="Meetings"
        person={{ name: "Rohan Mehta", avatar: avatar("Rohan Mehta", "blue") }}
        until="30 Nov"
        state="active"
      />
    </>
  );
}

export function delegateRow(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="flex w-full max-w-md flex-col">
        <Rows />
      </div>
    </Wrapper>
  );
}

export function delegateRowNarrow(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="flex w-full max-w-[390px] flex-col">
        <Rows />
      </div>
    </Wrapper>
  );
}
