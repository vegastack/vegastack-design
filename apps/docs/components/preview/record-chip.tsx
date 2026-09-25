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
import { RecordChip } from "@/components/ui/record-chip";

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
