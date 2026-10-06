// @vegastack choice-card@0.24.1 sha256-+7+2XCUQaobn92rPVSEAW0QZY7TQKZbNmMNh5h8t3c8=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ------------------------------------------------------------------------------------------------
 * ChoiceCard — a radio option drawn as a card: an optional icon, a title, a one-line description
 * and the radio at the end; the checked card takes the primary tint. A thin wrapper over the
 * documented Field choice-card pattern (`FieldLabel` around a horizontal `Field`, see Field), so
 * the look, the hover and the checked tint are Field's and RadioGroup's own. `ChoiceCardGroup`
 * lays the cards out two across once its container is `@sm` wide, stacked below that.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `ChoiceCardGroup` — `RadioGroup`'s own. */
export type ChoiceCardGroupProps = React.ComponentProps<typeof RadioGroup>;

/**
 * `ChoiceCardGroup` — the radio group holding `ChoiceCard`s: two across from `@sm` of its own
 * container, stacked below. Name it with `aria-label` or `aria-labelledby`.
 *
 * @example
 * <ChoiceCardGroup aria-label="Access" value={access} onValueChange={setAccess}>
 *   <ChoiceCard value="open" title="Open" description="Everyone can find and join" icon={<Globe />} />
 *   <ChoiceCard value="private" title="Private" description="Only members can find and open it" icon={<Lock />} />
 * </ChoiceCardGroup>
 */
export function ChoiceCardGroup({ className, ...props }: ChoiceCardGroupProps) {
  return (
    <div
      data-slot="choice-card-group-container"
      className="@container/choice-cards w-full"
    >
      <RadioGroup
        data-slot="choice-card-group"
        className={cn(
          "grid-cols-1 gap-2 @sm/choice-cards:grid-cols-2",
          className,
        )}
        {...props}
      />
    </div>
  );
}

/** Props for `ChoiceCard`. */
export interface ChoiceCardProps {
  /** The option's value. */
  value: string;
  /** The option's name. */
  title: React.ReactNode;
  /** One muted line under the title. @default undefined */
  description?: React.ReactNode;
  /** A leading icon (a lucide icon), drawn muted at 16px. @default undefined */
  icon?: React.ReactNode;
  /** Shown but not choosable. @default false */
  disabled?: boolean;
  /** The radio's id; one is generated when omitted. @default undefined */
  id?: string;
  /** Classes for the card. @default undefined */
  className?: string;
}

/**
 * `ChoiceCard` — one option in a `ChoiceCardGroup`. The whole card is the radio's label, so a
 * click anywhere chooses it; arrow keys move between cards.
 *
 * @example
 * <ChoiceCard value="open" title="Open" description="Everyone can find and join" icon={<Globe />} />
 */
export function ChoiceCard({
  value,
  title,
  description,
  icon,
  disabled = false,
  id: idProp,
  className,
}: ChoiceCardProps) {
  const generated = React.useId();
  const id = idProp ?? `choice-card-${generated}`;
  return (
    <FieldLabel
      htmlFor={id}
      data-slot="choice-card"
      className={cn("w-full", className)}
    >
      <Field
        orientation="horizontal"
        data-disabled={disabled ? "true" : undefined}
      >
        {icon != null ? (
          <span
            aria-hidden
            data-slot="choice-card-icon"
            className="flex shrink-0 self-start pt-0.5 text-muted-foreground [&_svg]:size-4"
          >
            {icon}
          </span>
        ) : null}
        <FieldContent>
          <FieldTitle>{title}</FieldTitle>
          {description != null ? (
            <FieldDescription>{description}</FieldDescription>
          ) : null}
        </FieldContent>
        <RadioGroupItem value={value} id={id} disabled={disabled} />
      </Field>
    </FieldLabel>
  );
}
