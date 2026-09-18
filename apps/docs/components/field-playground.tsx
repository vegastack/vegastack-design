"use client";

import type { ReactNode } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  PropsPlayground,
  type PlaygroundConfig,
} from "@/components/playground";

type FieldPlaygroundKey =
  "orientation" | "showDescription" | "showError" | "disabled";

const ORIENTATION_OPTIONS = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "responsive", label: "Responsive" },
] as const;

const DESCRIPTION = "We'll never share it.";
const ERROR = "Enter a valid email address.";

const orientationOf = (value: string | boolean) =>
  value === "horizontal" || value === "responsive" ? value : "vertical";

const fieldPlaygroundConfig: PlaygroundConfig<FieldPlaygroundKey> = {
  controls: [
    {
      type: "select",
      key: "orientation",
      label: "Orientation",
      options: ORIENTATION_OPTIONS,
      defaultValue: "vertical",
    },
    {
      type: "switch",
      key: "showDescription",
      label: "Description",
      defaultValue: false,
    },
    { type: "switch", key: "showError", label: "Error", defaultValue: false },
    { type: "switch", key: "disabled", label: "Disabled", defaultValue: false },
  ],
  render: (state): ReactNode => {
    const field = (
      <Field
        orientation={orientationOf(state.orientation)}
        data-disabled={state.disabled ? true : undefined}
        data-invalid={state.showError ? true : undefined}
      >
        <FieldLabel htmlFor="field-playground-email">Email</FieldLabel>
        <Input
          id="field-playground-email"
          type="email"
          placeholder="you@vegastack.com"
          disabled={Boolean(state.disabled)}
          aria-invalid={state.showError ? true : undefined}
        />
        {state.showDescription ? (
          <FieldDescription>{DESCRIPTION}</FieldDescription>
        ) : null}
        {state.showError ? <FieldError>{ERROR}</FieldError> : null}
      </Field>
    );
    // `responsive` reacts to the wrapping FieldGroup's @container width; the others don't need it.
    return state.orientation === "responsive" ? (
      <FieldGroup className="w-80">{field}</FieldGroup>
    ) : (
      <div className="w-80">{field}</div>
    );
  },
  toCode: (state) => {
    const props: string[] = [];
    if (state.orientation !== "vertical")
      props.push(`orientation="${state.orientation}"`);
    if (state.disabled) props.push("data-disabled");
    if (state.showError) props.push("data-invalid");
    const open = props.length > 0 ? `<Field ${props.join(" ")}>` : "<Field>";
    const field = [
      open,
      '  <FieldLabel htmlFor="email">Email</FieldLabel>',
      `  <Input id="email" type="email" placeholder="you@vegastack.com"${
        state.disabled ? " disabled" : ""
      }${state.showError ? " aria-invalid" : ""} />`,
      ...(state.showDescription
        ? [`  <FieldDescription>${DESCRIPTION}</FieldDescription>`]
        : []),
      ...(state.showError ? [`  <FieldError>${ERROR}</FieldError>`] : []),
      "</Field>",
    ];
    if (state.orientation === "responsive") {
      return [
        "<FieldGroup>",
        ...field.map((line) => `  ${line}`),
        "</FieldGroup>",
      ].join("\n");
    }
    return field.join("\n");
  },
};

/**
 * `FieldPlayground` — interactive props playground for `Field` (orientation / description / error
 * / disabled) wrapping an `Input`. Upstream's Field is composition only: the label, description
 * and error are CHILDREN rather than props, and `data-disabled`/`data-invalid` carry the state.
 * Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/field.mdx`.
 */
export function FieldPlayground() {
  return <PropsPlayground {...fieldPlaygroundConfig} />;
}
