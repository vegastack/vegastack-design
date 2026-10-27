"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/formula-input` (dogfoods the registry) → auto-scanned.
import {
  FormulaInput,
  type FormulaInputField,
} from "@/components/ui/formula-input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

const FIELDS: FormulaInputField[] = [
  { key: "qty", label: "Qty", type: "Number" },
  { key: "price", label: "Unit price", type: "Currency" },
  { key: "discount", label: "Discount", type: "Percent" },
];

/** The first row, for the live preview. */
const FIRST_ROW: Record<string, number> = { qty: 4, price: 310, discount: 0.1 };

/** A toy evaluator for the preview: the host owns the real parser. */
function evaluate(formula: string): { value?: string; error?: string } {
  if (!formula.trim()) return {};
  let unknown: string | null = null;
  const expression = formula
    .replace(/\{\{([^{}]+)\}\}/g, (_, key: string) => {
      if (!(key in FIRST_ROW)) unknown ??= key;
      return String(FIRST_ROW[key] ?? 0);
    })
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  if (unknown) return { error: `Unknown field {${unknown}}` };
  if (/\{/.test(expression))
    return { error: "Pick a field from the list after {" };
  if (!/^[\d\s.+\-*/()]+$/.test(expression))
    return { error: "Use numbers, fields and + − × ÷" };
  const value = calculate(expression);
  if (value === null) return { error: "The formula isn't finished" };
  if (!Number.isFinite(value)) return { error: "The result isn't a number" };
  return {
    value: value.toLocaleString("en-GB", { maximumFractionDigits: 2 }),
  };
}

/** + − × ÷ and brackets over numbers, by recursive descent; null when it doesn't parse. */
function calculate(text: string): number | null {
  const tokens = text.match(/\d*\.?\d+|[-+*/()]/g) ?? [];
  // Every character must belong to a token: "1.. + 2" is not a formula.
  if (tokens.join("") !== text.replace(/\s+/g, "")) return null;
  let at = 0;
  const factor = (): number | null => {
    const token = tokens[at++];
    if (token === "(") {
      const inner = sum();
      return tokens[at++] === ")" ? inner : null;
    }
    if (token === "-") {
      const next = factor();
      return next === null ? null : -next;
    }
    return token !== undefined && /\d/.test(token) ? Number(token) : null;
  };
  const product = (): number | null => {
    let left = factor();
    while (left !== null && (tokens[at] === "*" || tokens[at] === "/")) {
      const op = tokens[at++];
      const right = factor();
      if (right === null) return null;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  };
  const sum = (): number | null => {
    let left = product();
    while (left !== null && (tokens[at] === "+" || tokens[at] === "-")) {
      const op = tokens[at++];
      const right = product();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  };
  const result = sum();
  return at === tokens.length ? result : null;
}

export function formulaInput(): ReactNode {
  const [formula, setFormula] = React.useState("{{qty}} × {{price}}");
  const result = evaluate(formula);
  return (
    <Wrapper className="block max-w-md">
      <Field>
        <FieldLabel>Formula</FieldLabel>
        <FormulaInput
          value={formula}
          onChange={setFormula}
          fields={FIELDS}
          preview={result.value}
          error={result.error}
        />
        <FieldDescription>Type {"{"} to add a field.</FieldDescription>
      </Field>
    </Wrapper>
  );
}

export function formulaInputError(): ReactNode {
  const [formula, setFormula] = React.useState("{{qty}} × {{qyt}}");
  const result = evaluate(formula);
  return (
    <Wrapper className="block max-w-md">
      <Field>
        <FieldLabel>Formula</FieldLabel>
        <FormulaInput
          value={formula}
          onChange={setFormula}
          fields={FIELDS}
          preview={result.value}
          error={result.error}
          invalidFields={result.error ? ["qyt"] : undefined}
        />
      </Field>
    </Wrapper>
  );
}
