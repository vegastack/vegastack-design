"use client";

import { useState, type ReactNode } from "react";
import { CheckSquare, FileText, Table2 } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  RecordPicker,
  RecordPickerDialog,
  type RecordPickerItem,
  type RecordPickerSearch,
} from "@/components/ui/record-picker";

const KINDS = [
  { id: "page", noun: "Pages", icon: <FileText /> },
  { id: "table", noun: "Tables", icon: <Table2 /> },
  { id: "task", noun: "Tasks", icon: <CheckSquare /> },
];

const RECORDS: RecordPickerItem[] = [
  {
    id: "1",
    kind: "page",
    title: "Pricing note for the Q4 range",
    description: "Sales · Pricing",
  },
  { id: "2", kind: "table", title: "Sample requests", description: "Sales" },
  {
    id: "3",
    kind: "task",
    title: "Book the launch venue",
    description: "TASK-14",
  },
  {
    id: "4",
    kind: "page",
    title: "Launch plan",
    description: "Marketing",
    disabledReason: "Already linked",
  },
  { id: "5", kind: "table", title: "Price list", description: "Finance" },
];

const search: RecordPickerSearch = async (query, { kind }) => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return {
    items: RECORDS.filter(
      (r) =>
        (kind === null || r.kind === kind) &&
        r.title.toLowerCase().includes(query.toLowerCase()),
    ),
  };
};

/** In a popover: search, narrow by kind, start from recents, pick one. */
export function recordPicker(): ReactNode {
  const [picked, setPicked] = useState<RecordPickerItem | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <Wrapper>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" />}>
          {picked ? picked.title : "Link a record…"}
        </PopoverTrigger>
        <PopoverContent size="lg" className="p-0">
          <RecordPicker
            kinds={KINDS}
            search={search}
            recents={[RECORDS[1]!]}
            onPick={(item) => {
              setPicked(item);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

/** As a dialog, picking several: rows toggle, Done reports the set. */
export function recordPickerDialog(): ReactNode {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<RecordPickerItem[]>([]);
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {value.length ? `${value.length} linked` : "Link records…"}
      </Button>
      <RecordPickerDialog
        open={open}
        onOpenChange={setOpen}
        title="Link records"
        kinds={KINDS}
        search={search}
        multiple
        value={value}
        onConfirm={setValue}
      />
    </Wrapper>
  );
}
