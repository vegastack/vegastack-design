// @vegastack radio-group@0.23.24 sha256-k/SrnJ8tC1dwabTjt6FOVGQrY1xP/lxrSHZUK9uhRO8=

"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import * as React from "react";
import { cn } from "@vegastack/design";
import { useFieldScope } from "@/components/ui/field";

// API-26: the Field a `RadioGroup` sits in names the GROUP. Base UI also hands that Field's label
// to every radio item, so each item would answer to the group's name; an item keeps its own name
// unless it sits in a `Field` of its own (the per-item choice-card pattern), whose label is its.
const RadioGroupFieldScope = React.createContext<object | false>(false);

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  const field = useFieldScope();
  return (
    <RadioGroupFieldScope.Provider value={field}>
      <RadioGroupPrimitive
        data-slot="radio-group"
        className={cn("grid w-full gap-3", className)}
        {...props}
      />
    </RadioGroupFieldScope.Provider>
  );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  const groupField = React.useContext(RadioGroupFieldScope);
  const itemField = useFieldScope();
  // Same Field as the group: that Field's label is the group's, not this item's.
  const sharedField = groupField !== false && groupField === itemField;
  return (
    <RadioPrimitive.Root
      // Base UI resolves the item's `aria-labelledby` from the Field label after the props it is
      // given, so the shared-Field case drops it at render time instead.
      {...(sharedField
        ? {
            render: (itemProps: React.ComponentProps<"span">) => (
              <span {...itemProps} aria-labelledby={undefined} />
            ),
          }
        : {})}
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-50 not-focus:aria-invalid:border-destructive not-focus:aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:not-focus:aria-invalid:border-destructive/50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 start-1/2 size-2 -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
