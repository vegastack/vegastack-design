"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/select` (dogfoods the registry) → auto-scanned.
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";

const themes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export function select(): ReactNode {
  return (
    <Wrapper>
      <Select items={themes}>
        <SelectTrigger className="w-[180px]" aria-label="Theme">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

export function selectComposition(): ReactNode {
  const fruits = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
  ];
  const vegetables = [
    { label: "Carrot", value: "carrot" },
    { label: "Leek", value: "leek" },
  ];
  const all = [
    { label: "Select produce", value: null },
    ...fruits,
    ...vegetables,
  ];
  return (
    <Wrapper>
      <Select items={all}>
        <SelectTrigger className="w-48" aria-label="Produce">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            {fruits.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            {vegetables.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

const fruitItems = [
  { label: "Select a fruit", value: null },
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Blueberry", value: "blueberry" },
  { label: "Grapes", value: "grapes" },
  { label: "Pineapple", value: "pineapple" },
];

export function selectAlignItemWithTrigger(): ReactNode {
  const [alignItemWithTrigger, setAlignItemWithTrigger] = React.useState(true);

  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto w-full max-w-xs">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="align-item">Align Item</FieldLabel>
            <FieldDescription>
              Toggle to align the item with the trigger.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="align-item"
            checked={alignItemWithTrigger}
            onCheckedChange={setAlignItemWithTrigger}
          />
        </Field>
        <Field>
          <Select items={fruitItems} defaultValue="banana">
            <SelectTrigger aria-label="Fruit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={alignItemWithTrigger}>
              <SelectGroup>
                {fruitItems.map((item) => (
                  <SelectItem key={String(item.value)} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function selectGroups(): ReactNode {
  const fruits = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Blueberry", value: "blueberry" },
  ];
  const vegetables = [
    { label: "Carrot", value: "carrot" },
    { label: "Broccoli", value: "broccoli" },
    { label: "Spinach", value: "spinach" },
  ];
  const allItems = [
    { label: "Select a fruit", value: null },
    ...fruits,
    ...vegetables,
  ];
  return (
    <Wrapper>
      <Select items={allItems}>
        <SelectTrigger className="w-full max-w-48" aria-label="Produce">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            {fruits.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            {vegetables.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

const northAmerica = [
  { label: "Eastern Standard Time", value: "est" },
  { label: "Central Standard Time", value: "cst" },
  { label: "Mountain Standard Time", value: "mst" },
  { label: "Pacific Standard Time", value: "pst" },
  { label: "Alaska Standard Time", value: "akst" },
  { label: "Hawaii Standard Time", value: "hst" },
];
const europeAfrica = [
  { label: "Greenwich Mean Time", value: "gmt" },
  { label: "Central European Time", value: "cet" },
  { label: "Eastern European Time", value: "eet" },
  { label: "Central Africa Time", value: "cat" },
  { label: "East Africa Time", value: "eat" },
];
const asia = [
  { label: "Moscow Time", value: "msk" },
  { label: "India Standard Time", value: "ist" },
  { label: "China Standard Time", value: "cst_china" },
  { label: "Japan Standard Time", value: "jst" },
  { label: "Korea Standard Time", value: "kst" },
];
const timezoneItems = [
  { label: "Select a timezone", value: null },
  ...northAmerica,
  ...europeAfrica,
  ...asia,
];

export function selectScrollable(): ReactNode {
  return (
    <Wrapper>
      <Select items={timezoneItems}>
        <SelectTrigger className="w-full max-w-64" aria-label="Timezone">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>North America</SelectLabel>
            {northAmerica.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Europe &amp; Africa</SelectLabel>
            {europeAfrica.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            {asia.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

export function selectDisabled(): ReactNode {
  const items = [
    { label: "Select a fruit", value: null },
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Grapes", value: "grapes", disabled: true },
  ];
  return (
    <Wrapper>
      <Select items={items} disabled>
        <SelectTrigger className="w-full max-w-48" aria-label="Fruit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem
                key={String(item.value)}
                value={item.value}
                disabled={item.disabled}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

export function selectInvalid(): ReactNode {
  const items = [
    { label: "Select a fruit", value: null },
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
  ];
  return (
    <Wrapper>
      <Field data-invalid className="w-full max-w-48">
        <FieldLabel>Fruit</FieldLabel>
        <Select items={items}>
          <SelectTrigger aria-invalid aria-label="Fruit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => (
                <SelectItem key={String(item.value)} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldError>Please select a fruit.</FieldError>
      </Field>
    </Wrapper>
  );
}

export function selectRtl(): ReactNode {
  const items = [
    { label: "اختر الحالة", value: null },
    { label: "مهام", value: "todo" },
    { label: "قيد التنفيذ", value: "in-progress" },
    { label: "منجز", value: "done" },
  ];
  return (
    <Wrapper className="flex-col items-center gap-4">
      <div dir="ltr">
        <Select items={themes}>
          <SelectTrigger className="w-48" aria-label="Theme">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {themes.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div dir="rtl">
        <Select items={items}>
          <SelectTrigger className="w-48" aria-label="الحالة">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => (
                <SelectItem key={String(item.value)} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </Wrapper>
  );
}

/** Ours: the two trigger size tiers. */
export function selectSizes(): ReactNode {
  return (
    <Wrapper>
      <Select items={themes} defaultValue="light">
        <SelectTrigger size="sm" className="w-36" aria-label="Small">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select items={themes} defaultValue="light">
        <SelectTrigger size="default" className="w-36" aria-label="Default">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

const priorities = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

/**
 * API-24: `variant="ghost"` is the inline tier — content width, no border at rest, the border on
 * hover, focus and open — beside the default trigger, which fills its parent.
 */
export function selectInlineTrigger(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <div className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <span className="min-w-0 truncate text-sm">
          Renew the SSL certificate
        </span>
        <Select items={priorities} defaultValue="medium">
          <SelectTrigger variant="ghost" size="sm" aria-label="Priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {priorities.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Field className="w-full max-w-xs">
        <FieldLabel>Default priority</FieldLabel>
        <Select items={priorities} defaultValue="low">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {priorities.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </Wrapper>
  );
}

/** Ours: the trigger's rest, invalid and disabled chrome, side by side and closed. */
export function selectStates(): ReactNode {
  return (
    <Wrapper>
      <Select items={themes} defaultValue="light">
        <SelectTrigger className="w-36" aria-label="Rest">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select items={themes} defaultValue="light">
        <SelectTrigger className="w-36" aria-invalid aria-label="Invalid">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select items={themes} defaultValue="light" disabled>
        <SelectTrigger className="w-36" aria-label="Disabled">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

/**
 * API-19: a two-line option composes `ItemContent` › `ItemTitle` + `ItemDescription`, and the
 * option links the description as its accessible description.
 */
export function selectTwoLineOptions(): ReactNode {
  return (
    <Wrapper>
      <Select defaultValue="depot">
        <SelectTrigger aria-label="Meeting" className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="depot">
            <ItemContent>
              <ItemTitle>Depot review</ItemTitle>
              <ItemDescription>Meeting · 3 Sep</ItemDescription>
            </ItemContent>
          </SelectItem>
          <SelectItem value="pricing">
            <ItemContent>
              <ItemTitle>Pricing sync</ItemTitle>
              <ItemDescription>Meeting · 5 Sep</ItemDescription>
            </ItemContent>
          </SelectItem>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}
