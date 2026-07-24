"use client";

import * as React from "react";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

/**
 * The playground's control state — every control's `key` maps to a `string` (select) or
 * `boolean` (switch) value. Generic over the component's own prop-name union so `render`/
 * `toCode` get typed keys instead of a bare `string`.
 */
export type PlaygroundState<Keys extends string> = Record<
  Keys,
  string | boolean
>;

export interface PlaygroundSelectControl<Keys extends string> {
  type: "select";
  key: Keys;
  label: string;
  options: readonly { value: string; label: string }[];
  defaultValue: string;
}

export interface PlaygroundSwitchControl<Keys extends string> {
  type: "switch";
  key: Keys;
  label: string;
  defaultValue: boolean;
}

export type PlaygroundControl<Keys extends string> =
  PlaygroundSelectControl<Keys> | PlaygroundSwitchControl<Keys>;

export interface PlaygroundConfig<Keys extends string> {
  /** Controls rendered below the live preview, each keyed to one entry of the state object. */
  controls: readonly PlaygroundControl<Keys>[];
  /** Renders the live component from the current control state. */
  render: (state: PlaygroundState<Keys>) => React.ReactNode;
  /** Generates the JSX snippet shown under the controls, from the same state. */
  toCode: (state: PlaygroundState<Keys>) => string;
}

function initialState<Keys extends string>(
  controls: readonly PlaygroundControl<Keys>[],
) {
  return Object.fromEntries(
    controls.map((c) => [c.key, c.defaultValue]),
  ) as PlaygroundState<Keys>;
}

/**
 * `PropsPlayground` — generic interactive props playground: a declarative config of controls
 * (select / switch, composed from our own `Select`/`Switch`/`Field`) drives a live component
 * render plus a generated JSX snippet. Deterministic initial state (every control's
 * `defaultValue`) — a fresh page load, and therefore VRT, is stable; state only changes on
 * reader interaction, never on mount.
 *
 * Generalization path: this component takes no component-specific knowledge — a new playground
 * is just a new `PlaygroundConfig` (see `apps/docs/components/button-playground.tsx` for the
 * Button one) passed to `<PropsPlayground controls={…} render={…} toCode={…} />`, registered in
 * `mdx.tsx` and dropped into that component's `.mdx` page. No changes to this file are needed to
 * add a second, third, … playground.
 */
export function PropsPlayground<Keys extends string>({
  controls,
  render,
  toCode,
}: PlaygroundConfig<Keys>) {
  const [state, setState] = React.useState<PlaygroundState<Keys>>(() =>
    initialState(controls),
  );

  const setValue = React.useCallback((key: Keys, value: string | boolean) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const code = toCode(state);

  return (
    <div className="not-prose my-4 overflow-hidden rounded-lg border border-fd-border bg-fd-secondary">
      <div className="vs-type-product flex min-h-32 items-center justify-center border-b border-fd-border bg-fd-background p-6">
        {render(state)}
      </div>
      <div className="flex flex-wrap items-end gap-4 border-b border-fd-border p-4">
        {controls.map((control) => (
          <PlaygroundControlField
            key={control.key}
            control={control}
            value={state[control.key]}
            onChange={(value) => setValue(control.key, value)}
          />
        ))}
      </div>
      <div className="relative">
        <pre className="overflow-x-auto p-4 pe-12 font-mono text-sm text-fd-foreground">
          <code>{code}</code>
        </pre>
        <CopyButton
          value={code}
          variant="outline"
          className="absolute top-2 end-2 bg-fd-background"
        />
      </div>
    </div>
  );
}

function PlaygroundControlField<Keys extends string>({
  control,
  value,
  onChange,
}: {
  control: PlaygroundControl<Keys>;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  if (control.type === "switch") {
    return (
      <Field label={control.label} orientation="horizontal">
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </Field>
    );
  }

  const selected = typeof value === "string" ? value : control.defaultValue;
  const selectedOption = control.options.find(
    (option) => option.value === selected,
  );

  return (
    <Field label={control.label} className={cn("w-40")}>
      <Select
        value={selected}
        onValueChange={(next) => onChange(next as string)}
      >
        <SelectTrigger size="sm" aria-label={control.label}>
          <SelectValue>{selectedOption?.label ?? selected}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {control.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
