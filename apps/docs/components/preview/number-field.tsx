"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/number-field` (dogfoods the registry) → auto-scanned.
import { NumberField } from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function numberField(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-xs flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Quantity
        </span>
        <NumberField aria-label="Quantity" defaultValue={2} min={0} max={99} />
      </div>
    </Wrapper>
  );
}

const CURRENCIES = {
  usd: "USD",
  eur: "EUR",
  inr: "INR",
} as const;

export function numberFieldMoney(): ReactNode {
  const [currency, setCurrency] = useState<keyof typeof CURRENCIES>("usd");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-xs flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Deal amount
        </span>
        <NumberField
          key={currency}
          aria-label="Deal amount"
          defaultValue={12400}
          min={0}
          step={100}
          format={{ style: "currency", currency: CURRENCIES[currency] }}
          suffix={
            <Select
              items={CURRENCIES}
              value={currency}
              onValueChange={(next) =>
                setCurrency(next as keyof typeof CURRENCIES)
              }
            >
              <SelectTrigger
                size="sm"
                aria-label="Currency"
                className="border-none bg-transparent shadow-none dark:bg-transparent"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCIES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <p className="text-sm text-muted-foreground">
          Money is a format prop — the currency Select sits in the suffix slot.
        </p>
      </div>
    </Wrapper>
  );
}

export function numberFieldVariants(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-xs flex-col gap-3">
        <NumberField
          aria-label="Percent"
          size="sm"
          defaultValue={0.72}
          format={{ style: "percent" }}
          step={0.01}
        />
        <NumberField aria-label="Weight" defaultValue={12} suffix="kg" />
        <NumberField
          aria-label="Rows"
          size="lg"
          defaultValue={25}
          hideControls
        />
        <NumberField aria-label="Locked" defaultValue={5} disabled />
      </div>
    </Wrapper>
  );
}
