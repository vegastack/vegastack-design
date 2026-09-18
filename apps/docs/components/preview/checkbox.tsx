"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/checkbox` (dogfoods the registry) → auto-scanned.
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function checkbox(): ReactNode {
  return (
    <Wrapper>
      <Checkbox aria-label="Accept terms and conditions" />
    </Wrapper>
  );
}

export function checkboxCheckedState(): ReactNode {
  const [checked, setChecked] = React.useState(false);
  return (
    <Wrapper>
      <FieldGroup className="mx-auto w-56">
        <Field orientation="horizontal">
          <Checkbox
            id="checkbox-controlled"
            checked={checked}
            onCheckedChange={setChecked}
          />
          <FieldLabel htmlFor="checkbox-controlled">
            {checked ? "Checked" : "Unchecked"}
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="checkbox-uncontrolled" defaultChecked />
          <FieldLabel htmlFor="checkbox-uncontrolled">
            Uncontrolled, checked by default
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="checkbox-indeterminate" indeterminate />
          <FieldLabel htmlFor="checkbox-indeterminate">
            Indeterminate
          </FieldLabel>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function checkboxInvalidState(): ReactNode {
  return (
    <Wrapper>
      <FieldGroup className="mx-auto w-56">
        <Field orientation="horizontal" data-invalid>
          <Checkbox
            id="terms-checkbox-invalid"
            name="terms-checkbox-invalid"
            aria-invalid
          />
          <FieldLabel htmlFor="terms-checkbox-invalid">
            Accept terms and conditions
          </FieldLabel>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function checkboxBasic(): ReactNode {
  return (
    <Wrapper>
      <FieldGroup className="mx-auto w-56">
        <Field orientation="horizontal">
          <Checkbox id="terms-checkbox-basic" name="terms-checkbox-basic" />
          <FieldLabel htmlFor="terms-checkbox-basic">
            Accept terms and conditions
          </FieldLabel>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function checkboxDescription(): ReactNode {
  return (
    <Wrapper>
      <FieldGroup className="mx-auto w-72">
        <Field orientation="horizontal">
          <Checkbox
            id="terms-checkbox-desc"
            name="terms-checkbox-desc"
            defaultChecked
          />
          <FieldContent>
            <FieldLabel htmlFor="terms-checkbox-desc">
              Accept terms and conditions
            </FieldLabel>
            <FieldDescription>
              By clicking this checkbox, you agree to the terms and conditions.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function checkboxDisabled(): ReactNode {
  return (
    <Wrapper>
      <FieldGroup className="mx-auto w-56">
        <Field orientation="horizontal" data-disabled>
          <Checkbox
            id="toggle-checkbox-disabled"
            name="toggle-checkbox-disabled"
            disabled
          />
          <FieldLabel htmlFor="toggle-checkbox-disabled">
            Enable notifications
          </FieldLabel>
        </Field>
        <Field orientation="horizontal" data-disabled>
          <Checkbox
            id="toggle-checkbox-disabled-checked"
            name="toggle-checkbox-disabled-checked"
            disabled
            defaultChecked
          />
          <FieldLabel htmlFor="toggle-checkbox-disabled-checked">
            Enable sounds
          </FieldLabel>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function checkboxFieldGroup(): ReactNode {
  const items = [
    { id: "hard-disks", label: "Hard disks", checked: true },
    { id: "external-disks", label: "External disks", checked: true },
    { id: "cds-dvds", label: "CDs, DVDs, and iPods", checked: false },
    { id: "connected-servers", label: "Connected servers", checked: false },
  ];
  return (
    <Wrapper>
      <FieldSet>
        <FieldLegend variant="label">
          Show these items on the desktop:
        </FieldLegend>
        <FieldDescription>
          Select the items you want to show on the desktop.
        </FieldDescription>
        <FieldGroup className="gap-3">
          {items.map((item) => (
            <Field key={item.id} orientation="horizontal">
              <Checkbox
                id={`desktop-${item.id}`}
                name={`desktop-${item.id}`}
                defaultChecked={item.checked}
              />
              <FieldLabel
                htmlFor={`desktop-${item.id}`}
                className="font-normal"
              >
                {item.label}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>
    </Wrapper>
  );
}

const tableData = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@example.com" },
  { id: "2", name: "Marcus Rodriguez", email: "marcus.r@example.com" },
  { id: "3", name: "Priya Patel", email: "priya.patel@example.com" },
];

export function checkboxTable(): ReactNode {
  const [selected, setSelected] = React.useState<Set<string>>(new Set(["1"]));
  const allSelected = selected.size === tableData.length;

  return (
    <Wrapper className="items-stretch">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                aria-label="Select all rows"
                checked={allSelected}
                indeterminate={selected.size > 0 && !allSelected}
                onCheckedChange={(next) =>
                  setSelected(
                    next ? new Set(tableData.map((row) => row.id)) : new Set(),
                  )
                }
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Checkbox
                  aria-label={`Select ${row.name}`}
                  checked={selected.has(row.id)}
                  onCheckedChange={(next) =>
                    setSelected((current) => {
                      const draft = new Set(current);
                      if (next) draft.add(row.id);
                      else draft.delete(row.id);
                      return draft;
                    })
                  }
                />
              </TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

export function checkboxRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <FieldGroup className="w-full max-w-xs" dir="ltr">
        <Field orientation="horizontal">
          <Checkbox id="checkbox-rtl-ltr" defaultChecked />
          <FieldContent>
            <FieldLabel htmlFor="checkbox-rtl-ltr">
              Accept terms and conditions
            </FieldLabel>
            <FieldDescription>
              By clicking this checkbox, you agree to the terms.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
      <FieldGroup className="w-full max-w-xs" dir="rtl">
        <Field orientation="horizontal">
          <Checkbox id="checkbox-rtl-ar" defaultChecked />
          <FieldContent>
            <FieldLabel htmlFor="checkbox-rtl-ar">
              قبول الشروط والأحكام
            </FieldLabel>
            <FieldDescription>
              بالنقر على هذا المربع، فإنك توافق على الشروط.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

/**
 * Ours, and a geometry canary: rest, checked, indeterminate, invalid and disabled in one frame.
 */
export function checkboxStates(): ReactNode {
  return (
    // `gap-6`, not the Wrapper's default `gap-3`: each checkbox carries a 40px-wide invisible hit
    // area (`after:-inset-x-3`), so at a 12px gap the neighbouring areas overlap and the later
    // sibling wins the shared band. 24px of gap puts the centres exactly 40px apart, which is what
    // lets `test/geometry.browser.test.tsx` prove each target is unobstructed.
    <Wrapper className="gap-6">
      <Checkbox aria-label="Rest" />
      <Checkbox aria-label="Checked" defaultChecked />
      <Checkbox aria-label="Indeterminate" indeterminate />
      <Checkbox aria-label="Invalid" aria-invalid />
      <Checkbox aria-label="Disabled" disabled />
      <Checkbox aria-label="Disabled and checked" disabled defaultChecked />
    </Wrapper>
  );
}
