// @vegastack formula-input@0.26.2 sha256-uhW0wx/rATPY/N3Kk+cmJuYvbE7hJD2XFVnZGWgs1kk=

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  TemplateEditor,
  type TemplateEditorReplacement,
} from "@/components/ui/template-editor";

/* ---
`FormulaInput` is a calculated field's formula as one line: field chips, numbers and the four
operators, with the first row's result under it and the formula's error in its place.

It is a composition, not a second editor. `TemplateEditor` is already the system's mini editor
for text with chips (one Tiptap document, an atomic chip node, `@tiptap/suggestion` for the
picker, single-line mode, and typing replacements): here it runs single-line, opens its picker on
`{`, names its chips from `fields` and reads `*` and `/` as × and ÷. A full `TextEdit` would bring
blocks, a toolbar and collaboration a formula has no use for.

The value is TemplateEditor's: text with each field written as `{{key}}` ("{{qty}} × {{price}}").
Parsing, checking and evaluating it are the host's — it passes back `error` and `preview`.

Deliberately NOT done here:
- No parser or evaluator: the grammar is the host's (an unknown field, a stray operator).
- No field filtering: pass only the fields a formula may use (numbers, say).
--- */

/** One field a formula can use. */
export interface FormulaInputField {
  /** The field's id — written into the value as `{{key}}`. */
  key: string;
  /** The field's name, on its chip and in the picker. */
  label: string;
  /**
   * The field's type ("Number", "Currency"), muted beside its name in the picker.
   * @default undefined
   */
  type?: string;
}

/** Props accepted by `FormulaInput`. */
export interface FormulaInputProps {
  /** The formula: text with each field written as `{{key}}`. */
  value: string;
  /** Called with the new formula on every edit. */
  onChange: (value: string) => void;
  /** The fields `{` offers, in the picker's order. */
  fields: readonly FormulaInputField[];
  /**
   * The first row's result, worked out by the host ("1,240"), shown under the input as
   * "First row = 1,240". Hidden while `error` shows.
   * @default undefined
   */
  preview?: React.ReactNode;
  /**
   * The words before the preview.
   * @default "First row"
   */
  previewLabel?: string;
  /**
   * What is wrong with the formula ("Unknown field {Qyt}"), under the input in the destructive
   * ink; it marks the input invalid and is announced politely.
   * @default undefined
   */
  error?: React.ReactNode;
  /**
   * Keys whose chips show as invalid (a field the formula may not use).
   * @default undefined
   */
  invalidFields?: readonly string[];
  /**
   * Shown while the formula is empty.
   * @default "Type { to add a field"
   */
  placeholder?: string;
  /**
   * Typing replacements, applied as you type.
   * @default `*` → ×, `/` → ÷
   */
  operators?: readonly TemplateEditorReplacement[];
  /**
   * The field picker's accessible name.
   * @default "Insert field"
   */
  pickerLabel?: string;
  /**
   * Read-only and dimmed.
   * @default false
   */
  disabled?: boolean;
  /**
   * The editable surface's id (an enclosing `Field` supplies one).
   * @default undefined
   */
  id?: string;
  /**
   * Accessible name, when no `FieldLabel` names it.
   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Id of the element that names it.
   * @default undefined
   */
  "aria-labelledby"?: string;
  /**
   * Ids of more elements that describe it (a hint); the preview and the error are added.
   * @default undefined
   */
  "aria-describedby"?: string;
  /**
   * Classes for the root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the root (`data-slot="formula-input"`).
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

const DEFAULT_OPERATORS: readonly TemplateEditorReplacement[] = [
  { from: "*", to: "×" },
  { from: "/", to: "÷" },
];

/**
 * `FormulaInput` — a calculated field's formula on one line: `{` opens a picker of the table's
 * fields and inserts a chip, `*` and `/` read as × and ÷, the first row's result shows under it
 * (`preview`) and an `error` takes its place when the formula is wrong.
 *
 * @example
 * <Field>
 *   <FieldLabel>Formula</FieldLabel>
 *   <FormulaInput
 *     value={formula}
 *     onChange={setFormula}
 *     fields={[{ key: "qty", label: "Qty", type: "Number" }, { key: "price", label: "Unit price", type: "Currency" }]}
 *     preview={result.ok ? format(result.value) : undefined}
 *     error={result.ok ? undefined : result.message}
 *   />
 * </Field>
 */
export function FormulaInput({
  value,
  onChange,
  fields,
  preview,
  previewLabel = "First row",
  error,
  invalidFields,
  placeholder = "Type { to add a field",
  operators = DEFAULT_OPERATORS,
  pickerLabel = "Insert field",
  disabled = false,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  className,
  ref,
}: FormulaInputProps) {
  const statusId = React.useId();
  const tokens = React.useMemo(
    () =>
      fields.map((field) => ({
        id: field.key,
        label: field.label,
        hint: field.type,
      })),
    [fields],
  );
  const failed = error != null && error !== false && error !== "";
  return (
    <div
      ref={ref}
      data-slot="formula-input"
      data-invalid={failed ? "" : undefined}
      className={cn("flex w-full min-w-0 flex-col gap-1.5", className)}
    >
      <TemplateEditor
        singleLine
        triggers={["{"]}
        pickerLabel={pickerLabel}
        value={value}
        onChange={onChange}
        tokens={tokens}
        replacements={operators}
        invalidTokenIds={invalidFields}
        placeholder={placeholder}
        disabled={disabled}
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={
          [ariaDescribedBy, statusId].filter(Boolean).join(" ") || undefined
        }
        aria-invalid={failed ? true : undefined}
      />
      {/* One status line: the error, or else the preview. Polite, so a formula fixed or broken
          by the last keystroke is heard once it settles; mounted (visually collapsed, never
          display:none) while empty, so its first message is announced. */}
      <p
        id={statusId}
        data-slot="formula-input-status"
        aria-live="polite"
        className="min-h-5 text-xs leading-5 empty:sr-only"
      >
        {failed ? (
          <span
            data-slot="formula-input-error"
            className="text-destructive-text"
          >
            {error}
          </span>
        ) : preview != null && preview !== "" ? (
          <span
            data-slot="formula-input-preview"
            className="text-muted-foreground"
          >
            {previewLabel}{" "}
            <span className="font-medium text-foreground tabular-nums">
              = {preview}
            </span>
          </span>
        ) : null}
      </p>
    </div>
  );
}
