// @vegastack composer-chip@0.81.0 sha256-xWwvamn4/2YYyrJ2N/PIU/5fImCe8VyNNtxthEHOp4U=

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * ComposerChip — a small round chip for the chat composer: Plan at the end of its context strip
 * (`ChatComposerHeader`), or something that travels with the message. Three forms from one look:
 *
 * - a toggle (pass `pressed` or `defaultPressed`): a mode such as Plan. Off it is a quiet outline,
 *   on it fills with the primary tint and says so with `aria-pressed`;
 * - a menu trigger (`menu`): a picker such as the model, "Haiku 5.5 ▾". It spreads every prop onto
 *   its button, so a menu's trigger can render it (`render={<ComposerChip menu … />}`);
 * - read-only (`readOnly`): the same words with no control, when the reader may not change them.
 * ----------------------------------------------------------------------------------------------*/

const CHIP =
  "h-6 min-w-0 gap-1 rounded-full border border-input bg-transparent px-2 text-xs font-normal text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5";

/** Props accepted by `ComposerChip`. */
export interface ComposerChipProps extends Omit<
  React.ComponentPropsWithRef<"button">,
  "children" | "onChange"
> {
  /** The chip's words: "Plan", "Haiku 5.5". */
  children: React.ReactNode;
  /** Leads the words. @default undefined */
  icon?: React.ReactNode;
  /** Makes the chip a toggle, controlled: on or off. @default undefined */
  pressed?: boolean;
  /** Makes the chip a toggle, uncontrolled: its first state. @default undefined */
  defaultPressed?: boolean;
  /** Called when the toggle flips. @default undefined */
  onPressedChange?: (pressed: boolean) => void;
  /** A menu trigger: a chevron follows the words. @default false */
  menu?: boolean;
  /** Shown, not changeable: no control, the words only. @default false */
  readOnly?: boolean;
  /** Explains the chip on hover and focus: "Plan first: it reads and proposes, and changes nothing until you accept". @default undefined */
  tooltip?: React.ReactNode;
}

/**
 * `ComposerChip` — a mode or a choice in the composer: the Plan toggle in `ChatComposerHeader`, a
 * picker's trigger, or a choice shown read-only.
 *
 * @example
 * <ComposerChip icon={<ListChecks />} pressed={plan} onPressedChange={setPlan} tooltip="Plan first">Plan</ComposerChip>
 * <DropdownMenuTrigger render={<ComposerChip menu aria-label="Model: Haiku 5.5">Haiku 5.5</ComposerChip>} />
 * <ComposerChip readOnly>Sonnet 5.5</ComposerChip>
 */
export function ComposerChip({
  children,
  icon,
  pressed,
  defaultPressed,
  onPressedChange,
  menu = false,
  readOnly = false,
  tooltip,
  className,
  ref,
  ...props
}: ComposerChipProps) {
  const words = (
    <>
      {icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
      {menu && !readOnly ? <ChevronDown aria-hidden /> : null}
    </>
  );

  if (readOnly) {
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        data-slot="composer-chip"
        data-read-only=""
        id={props.id}
        aria-label={props["aria-label"]}
        title={typeof tooltip === "string" ? tooltip : undefined}
        className={cn(
          "inline-flex h-6 max-w-full min-w-0 items-center gap-1 rounded-full bg-muted px-2 text-xs text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5",
          className,
        )}
      >
        {words}
      </span>
    );
  }

  const toggle =
    pressed !== undefined ||
    defaultPressed !== undefined ||
    onPressedChange !== undefined;

  const control = toggle ? (
    <Toggle
      ref={ref}
      data-slot="composer-chip"
      data-kind="toggle"
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={(next) => onPressedChange?.(next)}
      className={cn(
        CHIP,
        "aria-pressed:border-primary/30 aria-pressed:bg-primary/10 aria-pressed:text-primary aria-pressed:**:[svg]:text-primary",
        className,
      )}
      {...(props as React.ComponentProps<typeof Toggle>)}
    >
      {words}
    </Toggle>
  ) : (
    <Button
      ref={ref}
      variant="ghost"
      size="xs"
      data-slot="composer-chip"
      data-kind={menu ? "menu" : "button"}
      className={cn(CHIP, "max-w-full", className)}
      {...props}
    >
      {words}
    </Button>
  );

  if (!tooltip) return control;
  return (
    <Tooltip>
      <TooltipTrigger render={control} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
