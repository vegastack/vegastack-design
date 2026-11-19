"use client";

import type { ReactNode } from "react";
import {
  Calendar,
  Ellipsis,
  FileText,
  Mail,
  MessageSquare,
  Table,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/agent-directory-card` (dogfoods the registry) → auto-scanned.
import {
  AgentDirectoryCard,
  AgentDirectoryCardSkeleton,
} from "@/components/ui/agent-directory-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MembersStack } from "@/components/ui/members-stack";
import { PersonAvatar } from "@/components/ui/person-avatar";

const agentAvatar = (name: string) => (
  <PersonAvatar person={{ name, kind: "agent" }} size="lg" />
);

const maintainers = (
  <MembersStack
    label="Maintainers"
    people={[
      { id: "a", name: "Asha Rao", hue: "green" },
      { id: "p", name: "Priya Shah", hue: "purple" },
    ]}
  />
);

const APPS = [
  { icon: <Mail />, label: "Gmail" },
  { icon: <MessageSquare />, label: "Slack" },
  { icon: <FileText />, label: "Drive" },
  { icon: <Calendar />, label: "Calendar" },
  { icon: <Table />, label: "Sheets" },
  { icon: <Table />, label: "Tables" },
];

function More({ name }: { name: string }): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={`More for ${name}`}
          />
        }
      >
        <Ellipsis aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Pause</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Grid({ children }: { children: ReactNode }): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
        {children}
      </div>
    </Wrapper>
  );
}

export function agentDirectoryCard(): ReactNode {
  return (
    <Grid>
      <AgentDirectoryCard
        name="Expense checker"
        href="#"
        avatar={agentAvatar("Expense checker")}
        job="Checks expense claims against the travel policy and flags what needs a receipt."
        examples={["Check this week's claims", "Which claims lack a receipt?"]}
        onExample={() => undefined}
        place="Workspace · Finance team"
        apps={APPS.slice(0, 3)}
        verified={{ by: "Asha", at: "12 Nov", version: 4 }}
        chat={{ href: "#" }}
        people={maintainers}
        actions={<More name="Expense checker" />}
      />
      <AgentDirectoryCard
        name="Supplier follow-ups with a very long name that keeps going"
        href="#"
        avatar={agentAvatar("Supplier follow-ups")}
        job="Chases suppliers for delivery dates every Monday, updates the order table and tells the buyer when a date slips by more than two days."
        place="Space · Bay 3"
        apps={APPS}
        verified={{ by: "Priya", at: "2 Nov", version: 7, changedSince: true }}
        chat={{ onClick: () => undefined }}
        people={maintainers}
        actions={<More name="Supplier follow-ups" />}
      />
    </Grid>
  );
}

export function agentDirectoryCardStates(): ReactNode {
  return (
    <Grid>
      <AgentDirectoryCard
        name="Weekly digest"
        href="#"
        avatar={agentAvatar("Weekly digest")}
        job="Sends the team a Friday summary of what closed and what's stuck."
        place="Private"
        status="draft"
        chat={{ href: "#" }}
      />
      <AgentDirectoryCard
        name="Invoice reminders"
        href="#"
        avatar={agentAvatar("Invoice reminders")}
        job="Reminds customers about invoices past their due date."
        place="Workspace"
        status="paused"
        examples={["Who is overdue?"]}
        chat={{ href: "#" }}
        people={maintainers}
      />
      <AgentDirectoryCardSkeleton />
    </Grid>
  );
}

export function agentDirectoryCardRow(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="flex w-full flex-col">
        <AgentDirectoryCard
          layout="row"
          name="Expense checker"
          href="#"
          avatar={
            <PersonAvatar
              person={{ name: "Expense checker", kind: "agent" }}
              size="sm"
            />
          }
          job="Checks expense claims against the travel policy."
          place="Workspace · Finance team"
          apps={APPS.slice(0, 2)}
          verified={{ by: "Asha", at: "12 Nov", version: 4 }}
          chat={{ href: "#" }}
          people={maintainers}
          actions={<More name="Expense checker" />}
        />
        <AgentDirectoryCard
          layout="row"
          name="Invoice reminders"
          href="#"
          avatar={
            <PersonAvatar
              person={{ name: "Invoice reminders", kind: "agent" }}
              size="sm"
            />
          }
          job="Reminds customers about invoices past their due date."
          place="Workspace"
          status="paused"
          chat={{ href: "#" }}
        />
        <AgentDirectoryCardSkeleton layout="row" />
      </div>
    </Wrapper>
  );
}

export function agentDirectoryCardNarrow(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-[390px]">
        <AgentDirectoryCard
          name="Expense checker"
          href="#"
          avatar={agentAvatar("Expense checker")}
          job="Checks expense claims against the travel policy and flags what needs a receipt."
          examples={[
            "Check this week's claims",
            "Which claims lack a receipt from last month's trip?",
          ]}
          onExample={() => undefined}
          place="Workspace · Finance team"
          apps={APPS}
          verified={{ by: "Asha", at: "12 Nov", version: 4 }}
          chat={{ href: "#" }}
          people={maintainers}
          actions={<More name="Expense checker" />}
        />
      </div>
    </Wrapper>
  );
}
