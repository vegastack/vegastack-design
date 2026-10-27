"use client";

import { useState, type ReactNode } from "react";
import {
  Calendar,
  CheckSquare,
  Hash,
  Link2,
  ListChecks,
  Sigma,
  Type,
  UserRound,
} from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FieldTypePicker } from "@/components/ui/field-type-picker";

const TYPES = [
  { id: "text", label: "Text", icon: <Type /> },
  {
    id: "number",
    label: "Number",
    icon: <Hash />,
    keywords: ["integer", "currency", "decimal"],
  },
  { id: "date", label: "Date", icon: <Calendar /> },
  { id: "checkbox", label: "Checkbox", icon: <CheckSquare /> },
  {
    id: "select",
    label: "Select",
    icon: <ListChecks />,
    description: "One option from a list",
  },
  { id: "person", label: "Person", icon: <UserRound />, group: "Relations" },
  {
    id: "relation",
    label: "Link to table",
    icon: <Link2 />,
    group: "Relations",
    description: "Rows in another table",
  },
  {
    id: "formula",
    label: "Formula",
    icon: <Sigma />,
    group: "Advanced",
    disabledReason: "Not available yet",
  },
];

/** + Add field: search the types, pick one. */
export function fieldTypePicker(): ReactNode {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string | undefined>();
  return (
    <Wrapper>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" />}>
          {type
            ? `Type: ${TYPES.find((t) => t.id === type)?.label}`
            : "Add field"}
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <FieldTypePicker
            types={TYPES}
            value={type}
            groupOrder={["Relations", "Advanced"]}
            onSelect={(id) => {
              setType(id);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}
