"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
import {
  FieldCellDisplay,
  FieldCellEditor,
  FieldInput,
  type FieldConfig,
  type FieldType,
  type FieldValue,
} from "@/components/ui/field-cell";

const OPTIONS: FieldConfig["options"] = [
  { id: "requested", label: "Requested", hue: "blue" },
  { id: "sent", label: "Sent", hue: "green" },
  { id: "received", label: "Received", hue: "orange" },
  { id: "closed", label: "Closed" },
];

const ROWS: {
  type: FieldType;
  label: string;
  value: FieldValue;
  config?: FieldConfig;
}[] = [
  {
    type: "text",
    label: "Name",
    value: "ARC-120 sample for the Leeds showroom refit",
  },
  {
    type: "long_text",
    label: "Notes",
    value: "Ship with the **matte** finish.\nCall before delivery.",
  },
  { type: "number", label: "Qty", value: 2 },
  {
    type: "currency",
    label: "Price",
    value: 1240.5,
    config: { currency: "EUR" },
  },
  { type: "percent", label: "Discount", value: 0.125 },
  { type: "date", label: "Due", value: "2026-10-28" },
  { type: "datetime", label: "Visit", value: "2026-10-28T09:30:00.000Z" },
  {
    type: "single_choice",
    label: "Status",
    value: "sent",
    config: { options: OPTIONS },
  },
  {
    type: "multi_choice",
    label: "Tags",
    value: ["requested", "sent", "received", "closed"],
    config: { options: OPTIONS },
  },
  { type: "checkbox", label: "Sample sent", value: true },
  { type: "person", label: "Owner", value: { id: "u1", name: "Asha Rao" } },
  {
    type: "link",
    label: "Customer",
    value: [
      { id: "c1", label: "Acme Lighting", kind: "customer", href: "#" },
      { id: "c2", label: "Hidden", kind: "customer", state: "restricted" },
      { id: "c3", label: "Northwind", kind: "customer", state: "deleted" },
    ],
  },
  {
    type: "file",
    label: "Spec",
    value: [{ id: "f1", name: "arc-120.pdf", contentType: "application/pdf" }],
  },
  { type: "url", label: "Site", value: "example.com/arc-120" },
  { type: "email", label: "Contact", value: "asha@example.com" },
  { type: "phone", label: "Phone", value: "+44 20 7946 0958" },
  {
    type: "calculated",
    label: "Total",
    value: null,
    config: { missingInputs: ["Qty", "Price"] },
  },
  { type: "autonumber", label: "Ref", value: 12, config: { prefix: "SR-" } },
  {
    type: "created_by",
    label: "Created by",
    value: { id: "u2", name: "Ben Kim" },
  },
];

export function fieldCell(): ReactNode {
  return (
    <Wrapper className="block">
      <dl className="grid w-full max-w-xl grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        {ROWS.map((row) => (
          <div key={row.type} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0">
              <FieldCellDisplay
                type={row.type}
                value={row.value}
                config={row.config}
              />
            </dd>
          </div>
        ))}
      </dl>
    </Wrapper>
  );
}

export function fieldCellInputs(): ReactNode {
  const editable = ROWS.filter((row) =>
    [
      "text",
      "number",
      "currency",
      "date",
      "datetime",
      "single_choice",
      "multi_choice",
      "checkbox",
      "url",
    ].includes(row.type),
  );
  const [values, setValues] = useState<Record<string, FieldValue>>(
    Object.fromEntries(editable.map((row) => [row.type, row.value])),
  );
  return (
    <Wrapper className="block">
      <div className="grid w-full max-w-xl grid-cols-[8rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 text-sm">
        {editable.map((row) => (
          <div key={row.type} className="contents">
            <span className="text-muted-foreground">{row.label}</span>
            <FieldInput
              type={row.type}
              aria-label={row.label}
              value={values[row.type]}
              config={row.config}
              onChange={(next) =>
                setValues((current) => ({ ...current, [row.type]: next }))
              }
            />
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

export function fieldCellEditor(): ReactNode {
  const [value, setValue] = useState<FieldValue>("sent");
  const [editing, setEditing] = useState(false);
  return (
    <Wrapper className="block">
      <div className="flex h-10 w-64 items-center rounded-md border px-2">
        {editing ? (
          <FieldCellEditor
            type="single_choice"
            label="Status"
            value={value}
            config={{ options: OPTIONS }}
            onCommit={(next) => {
              setValue(next);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button
            type="button"
            className="w-full text-start"
            onClick={() => setEditing(true)}
          >
            <FieldCellDisplay
              type="single_choice"
              value={value}
              config={{ options: OPTIONS }}
            />
          </button>
        )}
      </div>
    </Wrapper>
  );
}
