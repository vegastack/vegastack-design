"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/plan-card` (dogfoods the registry) → auto-scanned.
import {
  PlanCard,
  type PlanCardState,
  type PlanSpec,
} from "@/components/ui/plan-card";

const noop = () => {};

const PLAN: PlanSpec = {
  agent: { id: "ops", name: "Ops assistant", avatar: null },
  version: 1,
  title: "Clean up overdue tasks in Ops",
  goal: "Every task due before today is in Backlog with a note.",
  steps: [
    {
      text: "Find tasks in Ops due before today",
      effect: "read",
      touches: "12 tasks",
    },
    {
      text: "Move them to Backlog",
      effect: "change",
      touches: "12 tasks",
      detail: "One status change per task; nothing else on the task moves.",
    },
    { text: "Add a note “Moved by Ops assistant, 12 Nov”", effect: "change" },
    { text: "Post a summary in #ops", effect: "send", touches: "#ops" },
  ],
  assumptions: ["Overdue means due date before today."],
  outOfScope: ["Touch other spaces", "Email anyone"],
  willAsk: "1 post to #ops (moving is already allowed)",
  risk: "medium",
  riskReason: "changes 12 items, posts to a channel",
};

const REVISED: PlanSpec = {
  ...PLAN,
  version: 2,
  steps: [
    PLAN.steps[0]!,
    PLAN.steps[1]!,
    { ...PLAN.steps[2]!, change: "changed" },
    { text: "Email each task's owner", effect: "send", change: "removed" },
    {
      text: "Post a summary in #ops-weekly",
      effect: "send",
      touches: "#ops-weekly",
      change: "new",
    },
  ],
  revisionNote: "Dropped the email step and moved the summary to #ops-weekly.",
};

const LONG: PlanSpec = {
  ...PLAN,
  title: "Close out the Q4 launch",
  goal: "Every launch task is done or handed over, and the team has the report.",
  steps: [
    { text: "Read the launch board", effect: "read", touches: "48 tasks" },
    { text: "Draft the handover notes", effect: "draft" },
    { text: "Close the finished tasks", effect: "change", touches: "31 tasks" },
    { text: "Reassign the open ones", effect: "change", touches: "9 tasks" },
    { text: "Archive the old drafts", effect: "remove", touches: "6 files" },
    { text: "Create the report PDF", effect: "draft" },
    {
      text: "Email it to the launch team",
      effect: "send",
      touches: "8 people",
    },
    { text: "Renew the dashboard seat", effect: "spend", touches: "$12" },
    { text: "Post the wrap-up in #launch", effect: "send", touches: "#launch" },
  ],
  risk: "high",
  riskReason: "removes files, emails 8 people and spends money",
};

const answers = {
  onAccept: noop,
  onAcceptAndAllow: noop,
  onRequestChanges: noop,
  onReject: noop,
};

function Column({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-3">
      <div
        className={
          narrow
            ? "flex w-full max-w-90 flex-col gap-3"
            : "flex w-full max-w-180 flex-col gap-3"
        }
      >
        {children}
      </div>
    </Wrapper>
  );
}

export function planCard(): ReactNode {
  function Demo(): ReactNode {
    const [state, setState] = useState<PlanCardState>("pending");
    const [busy, setBusy] = useState(false);
    const answer = (next: PlanCardState) => () => {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        setState(next);
      }, 800);
    };
    return (
      <PlanCard
        plan={PLAN}
        state={state}
        answeredBy="you"
        busy={busy}
        onAccept={answer("accepted")}
        onAcceptAndAllow={answer("accepted_allowed")}
        onRequestChanges={answer("changes_requested")}
        onReject={answer("rejected")}
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function planCardRevised(): ReactNode {
  return (
    <Column>
      <PlanCard plan={REVISED} {...answers} />
    </Column>
  );
}

export function planCardLong(): ReactNode {
  return (
    <Column>
      <PlanCard plan={LONG} {...answers} />
    </Column>
  );
}

export function planCardStates(): ReactNode {
  return (
    <Column>
      <PlanCard plan={PLAN} {...answers} busy />
      <PlanCard plan={PLAN} canAnswer={false} waitingFor="Manoj" />
      <PlanCard plan={PLAN} state="accepted" answeredBy="Priya" />
      <PlanCard plan={PLAN} state="accepted_allowed" answeredBy="Priya" />
      <PlanCard plan={PLAN} state="changes_requested" answeredBy="Priya" />
      <PlanCard plan={PLAN} state="rejected" answeredBy="Priya" />
      <PlanCard plan={PLAN} state="replaced" replacedBy={3} />
      <PlanCard plan={PLAN} state="expired" />
      <PlanCard plan={PLAN} {...answers} error="Couldn't answer. Try again." />
    </Column>
  );
}

export function planCardNarrow(): ReactNode {
  return (
    <Column narrow>
      <PlanCard plan={REVISED} {...answers} />
      <PlanCard plan={PLAN} state="accepted" answeredBy="Priya" />
    </Column>
  );
}
