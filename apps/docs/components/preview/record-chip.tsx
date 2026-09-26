"use client";

import { useState, type ReactNode } from "react";
import { Building2, Folder } from "lucide-react";
import { Wrapper } from "./wrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityIcon } from "@/components/ui/priority-icon";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";
import { RecordChip } from "@/components/ui/record-chip";
import { DateTime, DueLabel } from "@/components/ui/relative-time";
import { StatusIcon } from "@/components/ui/status-icon";

const CUSTOMERS = ["Acme Corp", "Globex", "Initech"];
const PROJECTS = ["Q4 rollout", "Website refresh"];

function RecordChipDemo(): ReactNode {
  const [customer, setCustomer] = useState<string | undefined>("Acme Corp");
  const [project, setProject] = useState<string | undefined>();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <RecordChip
              icon={<Building2 />}
              value={customer}
              placeholder="Add customer"
              href={customer ? "#customer" : undefined}
              linkLabel={`Open ${customer ?? "customer"}`}
            />
          }
        />
        <DropdownMenuContent>
          {CUSTOMERS.map((name) => (
            <DropdownMenuItem key={name} onClick={() => setCustomer(name)}>
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {customer ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <RecordChip
                icon={<Folder />}
                value={project}
                placeholder="Add project"
                href={project ? "#project" : undefined}
                linkLabel={`Open ${project ?? "project"}`}
              />
            }
          />
          <DropdownMenuContent>
            {PROJECTS.map((name) => (
              <DropdownMenuItem key={name} onClick={() => setProject(name)}>
                {name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

export function recordChip(): ReactNode {
  return (
    <Wrapper>
      <RecordChipDemo />
    </Wrapper>
  );
}

const DAY = 86_400_000;

/** One labelled ghost chip in the states grid. */
function GhostRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <PropertyRow>
      <PropertyLabel>{label}</PropertyLabel>
      <PropertyValue>{children}</PropertyValue>
    </PropertyRow>
  );
}

function RecordChipGhostDemo(): ReactNode {
  const [status, setStatus] = useState<"todo" | "progress" | "done">(
    "progress",
  );
  const labels = { todo: "Todo", progress: "In progress", done: "Done" };
  return (
    <div className="flex w-80 flex-col gap-5">
      <PropertyList variant="inline" aria-label="Ghost chip states">
        <GhostRow label="Status">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <RecordChip
                  variant="ghost"
                  icon={<StatusIcon status={status} size="xs" label="" />}
                  value={labels[status]}
                  aria-label={`Status: ${labels[status]}`}
                />
              }
            />
            <DropdownMenuContent align="start">
              {(["todo", "progress", "done"] as const).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                  <StatusIcon status={s} size="sm" label="" />
                  {labels[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </GhostRow>
        <GhostRow label="Priority">
          <RecordChip
            variant="ghost"
            icon={<PriorityIcon priority="high" size="xs" label="" />}
            value="High"
            aria-label="Priority: High"
          />
        </GhostRow>
        <GhostRow label="Assignee">
          <RecordChip
            variant="ghost"
            person={{ name: "Asha Rao" }}
            aria-label="Assignee: Asha Rao"
          />
        </GhostRow>
        <GhostRow label="Reviewer">
          <RecordChip
            variant="ghost"
            person={{ name: "Priya Nair", badge: "Inactive" }}
            aria-label="Reviewer: Priya Nair"
          />
        </GhostRow>
        <GhostRow label="Due">
          <RecordChip
            variant="ghost"
            value={
              <DueLabel
                date={Date.now() - 4 * DAY}
                title={false}
                focusable={false}
              />
            }
            aria-label="Change due date"
          />
        </GhostRow>
        <GhostRow label="Follow-up">
          <RecordChip
            variant="ghost"
            placeholder="Set due date"
            aria-label="Set follow-up date"
          />
        </GhostRow>
        <GhostRow label="Open">
          <RecordChip
            variant="ghost"
            value="Hover, focus or open"
            aria-expanded
            aria-label="Open state"
          />
        </GhostRow>
        <GhostRow label="Disabled">
          <RecordChip
            variant="ghost"
            value="Locked"
            disabled
            aria-label="Disabled: Locked"
          />
        </GhostRow>
        <GhostRow label="Created">
          <DateTime date={Date.now() - 2 * DAY} variant="datetime" />
        </GhostRow>
      </PropertyList>
    </div>
  );
}

export function recordChipGhost(): ReactNode {
  return (
    <Wrapper>
      <RecordChipGhostDemo />
    </Wrapper>
  );
}

export function recordChipStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-start">
      <div className="flex flex-wrap items-center gap-2">
        <RecordChip placeholder="Add customer" icon={<Building2 />} />
        <RecordChip
          icon={<Building2 />}
          value="Acme Corp"
          href="#customer"
          linkLabel="Open Acme Corp"
        />
        <RecordChip
          icon={<Folder />}
          value="Q4 rollout"
          aria-expanded
          href="#project"
          linkLabel="Open Q4 rollout"
        />
        <RecordChip icon={<Folder />} value="Archived" disabled />
      </div>
    </Wrapper>
  );
}
