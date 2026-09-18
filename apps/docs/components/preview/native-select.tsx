"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/native-select` (dogfoods the registry) → auto-scanned.
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function nativeSelect(): ReactNode {
  return (
    <Wrapper>
      <NativeSelect aria-label="Fruit">
        <NativeSelectOption value="">Select a fruit</NativeSelectOption>
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
        <NativeSelectOption value="banana">Banana</NativeSelectOption>
        <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
        <NativeSelectOption value="pineapple">Pineapple</NativeSelectOption>
      </NativeSelect>
    </Wrapper>
  );
}

export function nativeSelectComposition(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-4">
      <NativeSelect aria-label="Simple">
        <NativeSelectOption value="">Simple</NativeSelectOption>
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
        <NativeSelectOption value="banana">Banana</NativeSelectOption>
      </NativeSelect>
      <NativeSelect aria-label="With groups">
        <NativeSelectOption value="">With groups</NativeSelectOption>
        <NativeSelectOptGroup label="Fruit">
          <NativeSelectOption value="apple">Apple</NativeSelectOption>
          <NativeSelectOption value="banana">Banana</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Vegetables">
          <NativeSelectOption value="carrot">Carrot</NativeSelectOption>
          <NativeSelectOption value="leek">Leek</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </Wrapper>
  );
}

export function nativeSelectGroups(): ReactNode {
  return (
    <Wrapper>
      <NativeSelect aria-label="Department">
        <NativeSelectOption value="">Select department</NativeSelectOption>
        <NativeSelectOptGroup label="Engineering">
          <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
          <NativeSelectOption value="backend">Backend</NativeSelectOption>
          <NativeSelectOption value="devops">DevOps</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Sales">
          <NativeSelectOption value="sales-rep">Sales Rep</NativeSelectOption>
          <NativeSelectOption value="account-manager">
            Account Manager
          </NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Operations">
          <NativeSelectOption value="support">
            Customer Support
          </NativeSelectOption>
          <NativeSelectOption value="product-manager">
            Product Manager
          </NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </Wrapper>
  );
}

export function nativeSelectDisabled(): ReactNode {
  return (
    <Wrapper>
      <NativeSelect disabled aria-label="Disabled">
        <NativeSelectOption value="">Disabled</NativeSelectOption>
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
        <NativeSelectOption value="banana">Banana</NativeSelectOption>
      </NativeSelect>
    </Wrapper>
  );
}

export function nativeSelectInvalid(): ReactNode {
  return (
    <Wrapper>
      <Field data-invalid className="w-fit">
        <FieldLabel htmlFor="native-select-invalid">Fruit</FieldLabel>
        <NativeSelect id="native-select-invalid" aria-invalid="true">
          <NativeSelectOption value="">Error state</NativeSelectOption>
          <NativeSelectOption value="apple">Apple</NativeSelectOption>
          <NativeSelectOption value="banana">Banana</NativeSelectOption>
        </NativeSelect>
        <FieldError>Pick a fruit to continue.</FieldError>
      </Field>
    </Wrapper>
  );
}

export function nativeSelectVsSelect(): ReactNode {
  return (
    <Wrapper className="items-start gap-8">
      <Field className="w-52">
        <FieldLabel htmlFor="native-vs">NativeSelect</FieldLabel>
        <NativeSelect id="native-vs" className="w-full">
          <NativeSelectOption value="">Select status</NativeSelectOption>
          <NativeSelectOption value="todo">Todo</NativeSelectOption>
          <NativeSelectOption value="done">Done</NativeSelectOption>
        </NativeSelect>
        <FieldDescription>
          The platform picker — fastest, and the right control on mobile.
        </FieldDescription>
      </Field>
      <Field className="w-52">
        <FieldLabel htmlFor="custom-vs">Select</FieldLabel>
        <Select>
          <SelectTrigger id="custom-vs" className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>
          A rendered popup — icons, descriptions and animation.
        </FieldDescription>
      </Field>
    </Wrapper>
  );
}

export function nativeSelectRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-4">
      <NativeSelect dir="ltr" aria-label="Status">
        <NativeSelectOption value="">Select status</NativeSelectOption>
        <NativeSelectOption value="todo">Todo</NativeSelectOption>
        <NativeSelectOption value="in-progress">In Progress</NativeSelectOption>
        <NativeSelectOption value="done">Done</NativeSelectOption>
      </NativeSelect>
      <NativeSelect dir="rtl" aria-label="الحالة">
        <NativeSelectOption value="">اختر الحالة</NativeSelectOption>
        <NativeSelectOption value="todo">مهام</NativeSelectOption>
        <NativeSelectOption value="in-progress">قيد التنفيذ</NativeSelectOption>
        <NativeSelectOption value="done">منجز</NativeSelectOption>
      </NativeSelect>
    </Wrapper>
  );
}

/** Ours: the two size tiers side by side. */
export function nativeSelectSizes(): ReactNode {
  return (
    <Wrapper>
      <NativeSelect size="sm" aria-label="Small">
        <NativeSelectOption value="sm">Small</NativeSelectOption>
      </NativeSelect>
      <NativeSelect size="default" aria-label="Default">
        <NativeSelectOption value="default">Default</NativeSelectOption>
      </NativeSelect>
    </Wrapper>
  );
}
