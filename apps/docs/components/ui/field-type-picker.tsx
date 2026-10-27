// @vegastack field-type-picker@0.25.91 sha256-RZKtx0aEHIKPeRMgVIZ07T450M3b/3vKGSA7mX+E3wc=

"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@vegastack/design";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/* ------------------------------------------------------------------------------------------------
 * FieldTypePicker — choose a field's type: a searchable list of the types the app offers, each
 * with its icon, in the app's groups ("Basic", "Relations", "Advanced"). The content of a popover
 * ("+ Add field") or a field's settings. It knows no field types: the app passes them.
 * ----------------------------------------------------------------------------------------------*/

/** One type of field on offer. */
export interface FieldTypeOption {
  /** Stable id ("text", "number", "relation"). */
  id: string;
  /** Its name ("Number"). */
  label: string;
  /** Its icon. */
  icon: React.ReactNode;
  /** The group heading it sits under; ungrouped types come first. @default undefined */
  group?: string;
  /** A muted line about it ("Links to rows in another table"). @default undefined */
  description?: string;
  /** Extra words a search matches ("integer", "currency"). @default undefined */
  keywords?: readonly string[];
  /** Why it can't be chosen here — shown, and the pick is refused. @default undefined */
  disabledReason?: string;
  /**
   * Choosing it opens a second step (`renderStep`) instead of calling `onSelect` — "Link to"
   * asking which record kind.
   * @default undefined
   */
  next?: boolean;
}

/** What `renderStep` gets besides the type: leave the step, or retitle its header. */
export interface FieldTypePickerStepControls {
  /** Back to the type list. */
  back: () => void;
  /** Replace the step header's label (a third view: "Which table's rows?"); `null` restores it. */
  setTitle: (title: React.ReactNode | null) => void;
}

/** Props accepted by `FieldTypePicker`. */
export interface FieldTypePickerProps {
  /** The types, in order within their groups. */
  types: readonly FieldTypeOption[];
  /** Called with the chosen type's id. */
  onSelect: (id: string) => void;
  /** The current type, checked. @default undefined */
  value?: string;
  /** Group order; groups not listed follow in first-seen order. @default undefined */
  groupOrder?: readonly string[];
  /** @default "Search field types" */
  placeholder?: string;
  /** @default "No field type matches." */
  emptyLabel?: string;
  /**
   * The second step for a type with `next`: a back header (the type's icon and label) and this.
   * The step reports its own final choice.
   * @default undefined
   */
  renderStep?: (
    type: FieldTypeOption,
    controls: FieldTypePickerStepControls,
  ) => React.ReactNode;
  /** Read after the current type's name. @default "current" */
  currentLabel?: string;
  /** The step header's back button name. @default "Back" */
  backLabel?: string;
  /** Classes on the command root. @default undefined */
  className?: string;
}

/**
 * `FieldTypePicker` — a searchable list of field types with their icons, in groups, for adding a
 * field or changing one's type. Search matches the name, the description and `keywords`; a type
 * with a `disabledReason` shows why and can't be chosen. Put it in a `PopoverContent`.
 *
 * @example
 * <PopoverContent size="md" className="p-0">
 *   <FieldTypePicker
 *     types={[
 *       { id: "text", label: "Text", icon: <Type /> },
 *       { id: "number", label: "Number", icon: <Hash />, keywords: ["integer", "currency"] },
 *       { id: "relation", label: "Link to table", icon: <Link2 />, group: "Relations" },
 *     ]}
 *     onSelect={(type) => addField(type)}
 *   />
 * </PopoverContent>
 */
export function FieldTypePicker({
  types,
  onSelect,
  value,
  groupOrder,
  placeholder = "Search field types",
  emptyLabel = "No field type matches.",
  renderStep,
  currentLabel = "current",
  backLabel = "Back",
  className,
}: FieldTypePickerProps) {
  const [step, setStep] = React.useState<FieldTypeOption | null>(null);
  const [stepTitle, setStepTitle] = React.useState<React.ReactNode | null>(
    null,
  );
  const back = React.useCallback(() => {
    setStep(null);
    setStepTitle(null);
  }, []);
  // Focus follows the view: into the step's first control on the way in (else its Back button),
  // and back to the search on the way out — the control that had it is gone either way.
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const wasStep = React.useRef(false);
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (step) {
      const content = root.querySelector<HTMLElement>(
        "[data-slot=field-type-picker-step-content]",
      );
      const candidates = content
        ? Array.from(
            content.querySelectorAll<HTMLElement>(
              "input:not([type=hidden]), textarea, select, button, [tabindex]:not([tabindex='-1'])",
            ),
          )
        : [];
      // The first control that actually takes focus: enabled, rendered and visible.
      const focused = candidates.some((el) => {
        if (
          el.matches(":disabled, [aria-disabled=true]") ||
          el.getClientRects().length === 0
        )
          return false;
        if (getComputedStyle(el).visibility === "hidden") return false;
        el.focus();
        return document.activeElement === el;
      });
      if (!focused)
        root
          .querySelector<HTMLElement>("[data-slot=field-type-picker-back]")
          ?.focus();
    } else if (wasStep.current) {
      root.querySelector<HTMLElement>("[cmdk-input]")?.focus();
    }
    wasStep.current = step !== null;
  }, [step]);
  const groups = React.useMemo(() => {
    const seen: string[] = [];
    for (const type of types) {
      const group = type.group ?? "";
      if (!seen.includes(group)) seen.push(group);
    }
    const order = groupOrder ?? [];
    const rank = (group: string) =>
      group === ""
        ? -1
        : order.includes(group)
          ? order.indexOf(group)
          : order.length + seen.indexOf(group);
    return seen
      .sort((a, b) => rank(a) - rank(b))
      .map((group) => ({
        group,
        types: types.filter((type) => (type.group ?? "") === group),
      }));
  }, [types, groupOrder]);

  if (step && renderStep) {
    return (
      <div
        ref={rootRef}
        data-slot="field-type-picker"
        data-step={step.id}
        className={cn("flex flex-col", className)}
      >
        <div
          data-slot="field-type-picker-step-header"
          className="flex h-9 items-center gap-1.5 border-b border-border px-1"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={backLabel}
            data-slot="field-type-picker-back"
            onClick={back}
          >
            <ChevronLeft className="rtl:-scale-x-100" />
          </Button>
          <span
            aria-hidden
            className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
          >
            {step.icon}
          </span>
          <span className="min-w-0 truncate text-sm font-medium">
            {stepTitle ?? step.label}
          </span>
        </div>
        <div
          data-slot="field-type-picker-step-content"
          className="flex min-h-0 flex-col"
        >
          {renderStep(step, { back, setTitle: setStepTitle })}
        </div>
      </div>
    );
  }

  return (
    <Command
      ref={rootRef}
      data-slot="field-type-picker"
      className={cn("flex flex-col", className)}
    >
      <CommandInput placeholder={placeholder} aria-label={placeholder} />
      <CommandList>
        <CommandEmpty>{emptyLabel}</CommandEmpty>
        {groups.map(({ group, types: inGroup }) => (
          <CommandGroup key={group || "_"} heading={group || undefined}>
            {inGroup.map((type) => (
              <CommandItem
                key={type.id}
                value={type.id}
                keywords={[
                  type.label,
                  ...(type.description ? [type.description] : []),
                  ...(type.keywords ?? []),
                ]}
                disabled={type.disabledReason !== undefined}
                data-checked={value === type.id ? "" : undefined}
                onSelect={() => {
                  if (type.disabledReason) return;
                  if (type.next && renderStep) setStep(type);
                  else onSelect(type.id);
                }}
                data-slot="field-type-picker-item"
              >
                <span
                  aria-hidden
                  className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
                >
                  {type.icon}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{type.label}</span>
                  {type.disabledReason || type.description ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {type.disabledReason ?? type.description}
                    </span>
                  ) : null}
                </span>
                {value === type.id ? (
                  <>
                    {/* cmdk owns aria-selected (its highlight), so "current" is read as text. */}
                    <span className="sr-only">{currentLabel}</span>
                    <Check aria-hidden className="ms-auto size-4" />
                  </>
                ) : type.next && renderStep ? (
                  <ChevronRight
                    aria-hidden
                    className="ms-auto size-4 text-muted-foreground rtl:-scale-x-100"
                  />
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
