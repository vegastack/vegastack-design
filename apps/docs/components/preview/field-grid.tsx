"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  FieldChoices,
  FieldGrid,
  FieldGridItem,
} from "@/components/ui/field-grid";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const SPECS = [
  "Width",
  "Height",
  "Depth",
  "Weight",
  "Wattage",
  "Colour temperature",
];

export function fieldGrid(): ReactNode {
  return (
    <Wrapper>
      <FieldGrid>
        {SPECS.map((spec) => (
          <Field key={spec}>
            <FieldLabel htmlFor={`spec-${spec}`}>{spec}</FieldLabel>
            <Input id={`spec-${spec}`} />
          </Field>
        ))}
        <Field>
          <FieldLabel htmlFor="spec-notes">Notes</FieldLabel>
          <Textarea id="spec-notes" />
          <FieldDescription>A textarea takes the whole row.</FieldDescription>
        </Field>
      </FieldGrid>
    </Wrapper>
  );
}

export function fieldGridTwoColumns(): ReactNode {
  return (
    <Wrapper>
      <FieldGrid columns={2}>
        <Field>
          <FieldLabel htmlFor="two-first">First name</FieldLabel>
          <Input id="two-first" />
        </Field>
        <Field>
          <FieldLabel htmlFor="two-last">Last name</FieldLabel>
          <Input id="two-last" />
        </Field>
        <FieldGridItem span="full">
          <Field>
            <FieldLabel htmlFor="two-email">Email</FieldLabel>
            <Input id="two-email" type="email" />
          </Field>
        </FieldGridItem>
      </FieldGrid>
    </Wrapper>
  );
}

export function fieldChoicesHorizontal(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col gap-6">
        <FieldSet>
          <FieldLegend variant="label">Type</FieldLegend>
          <FieldChoices orientation="horizontal">
            <RadioGroup defaultValue="standard">
              {["Standard", "Custom", "Made to order"].map((t) => (
                <Field key={t} orientation="horizontal">
                  <RadioGroupItem value={t.toLowerCase()} id={`type-${t}`} />
                  <FieldLabel htmlFor={`type-${t}`}>{t}</FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </FieldChoices>
        </FieldSet>
        <FieldSet>
          <FieldLegend variant="label">Classification</FieldLegend>
          <FieldChoices orientation="horizontal">
            {["Indoor", "Outdoor", "Industrial"].map((c) => (
              <Field key={c} orientation="horizontal">
                <Checkbox id={`class-${c}`} />
                <FieldLabel htmlFor={`class-${c}`}>{c}</FieldLabel>
              </Field>
            ))}
          </FieldChoices>
        </FieldSet>
      </div>
    </Wrapper>
  );
}

export function fieldChoicesVertical(): ReactNode {
  return (
    <Wrapper>
      <FieldSet>
        <FieldLegend variant="label">Notify me</FieldLegend>
        <FieldChoices>
          {["Mentions", "Assignments", "Due dates"].map((c) => (
            <Field key={c} orientation="horizontal">
              <Checkbox id={`notify-${c}`} />
              <FieldLabel htmlFor={`notify-${c}`}>{c}</FieldLabel>
            </Field>
          ))}
        </FieldChoices>
      </FieldSet>
    </Wrapper>
  );
}
