"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/direction` (dogfoods the registry) → auto-scanned.
import { Badge } from "@/components/ui/badge";
import { DirectionProvider, useDirection } from "@/components/ui/direction";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function direction(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <DirectionProvider direction="ltr">
        <div dir="ltr">
          <Field className="max-w-xs">
            <FieldLabel htmlFor="direction-ltr">Full name</FieldLabel>
            <Input id="direction-ltr" placeholder="Ada Lovelace" />
            <FieldDescription>Laid out left to right.</FieldDescription>
          </Field>
        </div>
      </DirectionProvider>
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Field className="max-w-xs">
            <FieldLabel htmlFor="direction-rtl">الاسم الكامل</FieldLabel>
            <Input id="direction-rtl" placeholder="آدا لوفلايس" />
            <FieldDescription>مُخطَّط من اليمين إلى اليسار.</FieldDescription>
          </Field>
        </div>
      </DirectionProvider>
    </Wrapper>
  );
}

function CurrentDirection(): ReactNode {
  const resolved = useDirection();
  return <Badge variant="secondary">direction: {resolved}</Badge>;
}

export function directionUseDirection(): ReactNode {
  return (
    <Wrapper>
      <DirectionProvider direction="ltr">
        <CurrentDirection />
      </DirectionProvider>
      <DirectionProvider direction="rtl">
        <CurrentDirection />
      </DirectionProvider>
    </Wrapper>
  );
}
