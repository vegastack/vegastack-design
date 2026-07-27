// @vegastack chip-input@0.4.0 sha256-1xlfMba3EGTQD+kAHrKWGsOEJdfItMPocsquO7S/lOA=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag-group";
import {
  mergeRefs,
  useShakeOnInvalid,
  type ShakeSignal,
} from "@/components/ui/use-animation-replay";

/* ---
`ChipInput` exists because nothing in the roster can commit an arbitrary token:
`TagGroup` is a display list with no input, and Base UI's Combobox value model is
selection-from-items — there is no create seam. Domains, e-mail recipients, tags,
webhook events all need "type, Enter/comma/paste, chip".

The field chrome is `comboboxInputGroupVariants` borrowed literally — same border, same
focus/invalid/disabled treatment, same flatten-the-inner-input technique — retargeted at
`data-slot="input"` (the inner control here is the real `Input` component, so no raw
`<input>` and no lint exemption). The chip is the real `Tag`, which already ships
`onRemove` and a compliant 24px hit area.

Validation model: entries are ADDED and marked, not silently dropped. A pasted list of
20 addresses with 2 typos should show 20 chips with 2 flagged for fixing — a per-chip
`data-invalid` (the one channel `Tag`/`Combobox` lack) — while duplicates are the only
rejected class. Accepted/invalid/duplicate outcomes are announced politely.

Deliberately NOT done here:
- No suggestion popup. An autocomplete-backed chip field is a Combobox composition, not
  this component — building it in would re-implement filtering Base UI already owns.
- No TagGroup re-export. Its `max`/`+N` collapse is display-list semantics; an editable
  field must keep every chip reachable.
- No hue prop on chips. `Tag` hue is decorative labelling, never status — invalid is the
  only state a chip carries here, and it is not a colour alone (border + description).
--- */

/**
 * Field chrome — `comboboxInputGroupVariants`' class list, with the state
 * selectors driven by this component (`focus-within`, our own `data-invalid`/
 * `data-disabled`) and the flattening retargeted at the inner `Input`
 * (`data-slot="input"`).
 */
export const chipInputVariants = cva(
  [
    "flex w-full min-w-0 flex-wrap items-center gap-1 rounded-md border border-input bg-transparent p-1",
    "dark:bg-input/(--alpha-input)",
    "focus-within:border-ring/(--alpha-tint-border)",
    "data-[invalid]:border-destructive-border/(--alpha-tint-border)",
    "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--opacity-dim) data-[disabled]:bg-muted",
    // The inner input keeps a 24px minimum box (h-6 tier) — a replaced element cannot host a ::before hit-area, so the box itself must meet the pointer-target floor.
    "[&_[data-slot=input]]:min-h-6 [&_[data-slot=input]]:h-full [&_[data-slot=input]]:min-w-12 [&_[data-slot=input]]:flex-1 [&_[data-slot=input]]:border-none [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:px-1.5 [&_[data-slot=input]]:py-0 [&_[data-slot=input]]:focus:border-transparent [&_[data-slot=input]]:dark:bg-transparent",
  ].join(" "),
  {
    variants: {
      size: {
        // sm tightens the padding so the 24px inner input still fits the 28px tier.
        sm: "min-h-(--size-sm) p-0.5",
        default: "min-h-(--size-md)",
        lg: "min-h-(--size-lg)",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** Props accepted by `ChipInput`. */
export interface ChipInputProps extends VariantProps<typeof chipInputVariants> {
  /** Controlled chip list. Pair with `onValueChange`; omit for uncontrolled use.
   * @default undefined
   */
  value?: string[];
  /**
   * Initial chips for uncontrolled use.
   * @default []
   */
  defaultValue?: string[];
  /** Fired with the next chip list on every add or remove.
   * @default undefined
   */
  onValueChange?: (value: string[]) => void;
  /**
   * Normalise a raw entry before it is committed (and before duplicate
   * checking). The default trims whitespace.
   * @default (raw) => raw.trim()
   */
  normalize?: (raw: string) => string;
  /**
   * Per-chip validity. Invalid entries are still **added**, marked with
   * `data-invalid` on their chip, described as invalid for assistive tech, and
   * flip the whole field invalid (with a shake) until fixed or removed —
   * a pasted list keeps every entry visible instead of silently dropping the
   * malformed ones.

   * @default undefined
   */
  validate?: (chip: string) => boolean;
  /**
   * Pattern the paste handler splits on, in addition to the Enter/comma commit
   * keys.
   * @default /[,\n]/
   */
  splitOn?: RegExp;
  /**
   * Allow the same chip twice. When `false`, a duplicate entry is rejected and
   * announced.
   * @default false
   */
  allowDuplicates?: boolean;
  /** Placeholder for the inner input while the field has room.
   * @default undefined
   */
  placeholder?: string;
  /** Accessible name for the inner input. The control must never be unnamed.
   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Disables the field and every chip's remove button.
   * @default false
   */
  disabled?: boolean;
  /**
   * Bump to re-shake the field while it is already invalid. See
   * `useShakeOnInvalid`.

   * @default undefined
   */
  shakeSignal?: ShakeSignal;
  /** Extra classes for the field group root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref forwarded to the group root `<div>` (`data-slot="chip-input"`).

   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
  /**
   * Ref forwarded to the inner `<input>`.

   * @default undefined
   */
  inputRef?: React.Ref<HTMLInputElement>;
}

const defaultNormalize = (raw: string) => raw.trim();
const DEFAULT_SPLIT = /[,\n]/;

/**
 * `ChipInput` — free-token entry: type, then <kbd>Enter</kbd> or comma to
 * commit a chip; paste splits on the same delimiters; <kbd>Backspace</kbd> in
 * the empty input removes the last chip. The field is
 * `comboboxInputGroupVariants`' chrome, the chips are real `Tag`s (24px remove
 * targets included), and validation is per-chip: invalid entries stay visible
 * with `data-invalid` instead of being silently dropped.
 *
 * @example
 * const [emails, setEmails] = React.useState<string[]>([]);
 * <ChipInput
 *   aria-label="Recipients"
 *   value={emails}
 *   onValueChange={setEmails}
 *   validate={(chip) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(chip)}
 *   placeholder="Add recipients…"
 * />
 */
export function ChipInput({
  value: controlledValue,
  defaultValue = [],
  onValueChange,
  normalize = defaultNormalize,
  validate,
  splitOn = DEFAULT_SPLIT,
  allowDuplicates = false,
  placeholder,
  "aria-label": ariaLabel,
  disabled = false,
  size = "default",
  shakeSignal,
  className,
  ref,
  inputRef,
}: ChipInputProps) {
  // Chip list — controlled when `value` is provided, else internal.
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const chips = isControlled ? controlledValue : internalValue;
  const [draft, setDraft] = React.useState("");
  const [announcement, setAnnouncementState] = React.useState({
    text: "",
    seq: 0,
  });
  // Sequence-keyed so an IDENTICAL consecutive announcement (a second rejected
  // duplicate) still mutates the DOM and re-announces.
  const setAnnouncement = React.useCallback(
    (text: string) =>
      setAnnouncementState((prev) => ({ text, seq: prev.seq + 1 })),
    [],
  );
  const describeId = React.useId();

  const commitValue = React.useCallback(
    (next: string[]) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const isInvalidChip = React.useCallback(
    (chip: string) => (validate ? !validate(chip) : false),
    [validate],
  );
  const hasInvalidChip = chips.some(isInvalidChip);

  // The reject/invalid cue: the group border flips destructive via
  // `data-invalid`, and the shake replays on that live transition.
  const {
    invalidRef: shakeInvalidRef,
    className: shakeClassName,
    onAnimationEnd: shakeAnimationEnd,
  } = useShakeOnInvalid({ shakeSignal });
  const rootRef = React.useMemo(
    () => mergeRefs(ref, shakeInvalidRef),
    [ref, shakeInvalidRef],
  );
  // Removing a chip via its own button unmounts the focused element — return
  // focus to the field's input instead of letting it fall to <body>.
  const internalInputRef = React.useRef<HTMLInputElement | null>(null);
  const mergedInputRef = React.useMemo(
    () => mergeRefs(inputRef, internalInputRef),
    [inputRef],
  );

  /** Commit one or more raw entries (typed or pasted). */
  const addEntries = React.useCallback(
    (raws: string[]) => {
      const next = [...chips];
      let added = 0;
      let invalid = 0;
      let duplicates = 0;
      for (const raw of raws) {
        const chip = normalize(raw);
        if (chip.length === 0) continue;
        if (!allowDuplicates && next.includes(chip)) {
          duplicates += 1;
          continue;
        }
        next.push(chip);
        added += 1;
        if (isInvalidChip(chip)) invalid += 1;
      }
      if (added > 0) commitValue(next);
      // Voice: sentence case, no "successfully", counts only when they inform.
      const parts: string[] = [];
      if (added > 0)
        parts.push(
          added === 1
            ? `Added ${next[next.length - 1]}`
            : `Added ${added} entries`,
        );
      if (invalid > 0)
        parts.push(
          invalid === 1
            ? "1 entry is invalid"
            : `${invalid} entries are invalid`,
        );
      if (duplicates > 0)
        parts.push(
          duplicates === 1
            ? "1 duplicate skipped"
            : `${duplicates} duplicates skipped`,
        );
      if (parts.length > 0) setAnnouncement(parts.join(" · "));
      return added > 0 || duplicates > 0;
    },
    [
      chips,
      normalize,
      allowDuplicates,
      isInvalidChip,
      commitValue,
      setAnnouncement,
    ],
  );

  const removeChip = React.useCallback(
    (index: number) => {
      const removed = chips[index];
      const next = chips.filter((_, i) => i !== index);
      commitValue(next);
      if (removed != null) setAnnouncement(`Removed ${removed}`);
      internalInputRef.current?.focus();
    },
    [chips, commitValue, setAnnouncement],
  );

  const commitDraft = React.useCallback(() => {
    if (draft.trim().length === 0) return;
    if (addEntries(draft.split(splitOn))) setDraft("");
  }, [draft, addEntries, splitOn]);

  return (
    <div
      ref={rootRef}
      data-slot="chip-input"
      data-size={size}
      data-invalid={hasInvalidChip ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(chipInputVariants({ size }), shakeClassName, className)}
      onAnimationEnd={shakeAnimationEnd}
    >
      {chips.map((chip, index) => {
        const invalid = isInvalidChip(chip);
        return (
          <Tag
            // Duplicate chips are only possible with `allowDuplicates` — key by
            // position then, identity otherwise.
            key={allowDuplicates ? `${chip}-${index}` : chip}
            data-invalid={invalid ? "" : undefined}
            className={cn(
              invalid &&
                "border-destructive/(--alpha-outline-border) text-destructive-text",
            )}
            onRemove={disabled ? undefined : () => removeChip(index)}
            removeLabel={`Remove ${chip}`}
          >
            {chip}
            {invalid ? (
              // Real text in the accessible name — aria-description is an
              // ARIA 1.3 draft with no shipped AT support.
              <span className="sr-only">, invalid entry</span>
            ) : null}
          </Tag>
        );
      })}
      <Input
        ref={mergedInputRef}
        aria-label={ariaLabel}
        aria-describedby={hasInvalidChip ? describeId : undefined}
        aria-invalid={hasInvalidChip || undefined}
        placeholder={chips.length === 0 ? placeholder : undefined}
        disabled={disabled}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Never commit mid-IME-composition — Enter there accepts the
          // candidate, not the chip.
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commitDraft();
          } else if (
            event.key === "Backspace" &&
            draft.length === 0 &&
            chips.length > 0
          ) {
            event.preventDefault();
            removeChip(chips.length - 1);
          }
        }}
        onBlur={commitDraft}
        onPaste={(event) => {
          const text = event.clipboardData.getData("text");
          // `split`, never `.test()` — a caller-supplied /g regex would make
          // `test` stateful and silently drop alternate pastes.
          const parts = text.split(splitOn);
          if (parts.length < 2) return;
          event.preventDefault();
          addEntries(parts);
        }}
      />
      {/* Static description target — separate from the live region so the
          field's description never carries stale transient announcements. */}
      <span id={describeId} className="sr-only">
        Some entries are invalid
      </span>
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        <span key={announcement.seq}>{announcement.text}</span>
      </span>
    </div>
  );
}
