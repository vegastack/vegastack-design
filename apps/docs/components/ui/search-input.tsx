// @vegastack search-input@0.25.102 sha256-zlph+uT5+VVxeVY1LQQp4CXNbTiz0AfB+qZ49guI2XI=

"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { mergeRefs, TIMINGS } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

/** Props for the token-safe {@link SearchInput}. */
export interface SearchInputProps extends Omit<
  React.ComponentPropsWithRef<"input">,
  "defaultValue" | "size" | "type" | "value"
> {
  /** The controlled search value. @default undefined */
  value?: string;
  /** The initial value when the search field is uncontrolled. @default '' */
  defaultValue?: string;
  /** Called with the next value after typing or clearing. @default undefined */
  onValueChange?: (value: string) => void;
  /**
   * Called with the SETTLED value: after `debounceMs` of quiet, and at once on
   * Enter and on clear. The field itself stays instant — `onValueChange` still
   * fires on every keystroke. Use this one to send the query.
   * @default undefined
   */
  onValueCommitted?: (value: string) => void;
  /**
   * Quiet time after the last keystroke before `onValueCommitted` fires.
   * @default TIMINGS.searchDebounceMs (300)
   */
  debounceMs?: number;
  /** Accessible name for the clear action. @default 'Clear search' */
  clearLabel?: string;
  /** Slot name applied to the InputGroup root. @default 'search-input' */
  "data-slot"?: string;
  /**
   * Fold to a Search icon button while empty and unfocused. Pressing the button opens the field
   * with focus in it; the field stays open while it holds a query, and folds back once it is empty
   * and focus leaves it, or on Escape (focus returns to the button). The button's name is the
   * field's `aria-label` (or its `placeholder`).
   * @default false
   */
  collapsible?: boolean;
  /**
   * Called when a `collapsible` field opens or folds — a toolbar lays the open field over its
   * neighbours.
   * @default undefined
   */
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * Search field with a consistent, token-colored clear action.
 *
 * `className` styles the InputGroup root. The forwarded ref targets the native
 * search input so labels, forms, selection, and focus keep their native boundary.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={query}
 *   onValueChange={setQuery}
 *   aria-label="Search projects"
 * />
 * ```
 */
function SearchInput({
  value,
  defaultValue = "",
  onValueChange,
  onValueCommitted,
  debounceMs = TIMINGS.searchDebounceMs,
  clearLabel = "Clear search",
  className,
  disabled,
  readOnly,
  onChange,
  onKeyDown,
  ref,
  "data-slot": dataSlot = "search-input",
  collapsible = false,
  onExpandedChange,
  ...props
}: SearchInputProps) {
  const controlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const [input, setInput] = React.useState<HTMLInputElement | null>(null);
  const currentValue = controlled ? value : uncontrolledValue;
  const canClear = currentValue.length > 0 && !disabled && !readOnly;

  const inputNode = React.useRef<HTMLInputElement | null>(null);
  const setInputRef = React.useMemo(
    () => mergeRefs(setInput, inputNode, ref),
    [ref],
  );

  // Collapsible: a Search button until pressed, then the field; open while it holds a query.
  const [expandedState, setExpandedState] = React.useState(false);
  const open = !collapsible || expandedState || currentValue !== "";
  const toggleButton = React.useRef<HTMLButtonElement | null>(null);
  const focusAfter = React.useRef<"field" | "button" | null>(null);
  const expandedReport = React.useRef(onExpandedChange);
  React.useLayoutEffect(() => {
    expandedReport.current = onExpandedChange;
  });
  const reportedOpen = React.useRef(open);
  React.useEffect(() => {
    if (reportedOpen.current !== open) {
      reportedOpen.current = open;
      if (collapsible) expandedReport.current?.(open);
    }
    const target = focusAfter.current;
    if (target == null) return;
    focusAfter.current = null;
    if (target === "field") inputNode.current?.focus();
    else toggleButton.current?.focus();
  }, [open, collapsible]);

  React.useEffect(() => {
    const form = input?.form;
    if (controlled || form == null) return;

    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    const handleReset = () => {
      resetTimer = setTimeout(() => setUncontrolledValue(defaultValue));
    };
    form.addEventListener("reset", handleReset);
    return () => {
      form.removeEventListener("reset", handleReset);
      if (resetTimer !== undefined) clearTimeout(resetTimer);
    };
  }, [controlled, defaultValue, input]);

  // The settled-value channel: one pending timer, flushed by Enter and clear.
  const commitRef = React.useRef(onValueCommitted);
  React.useLayoutEffect(() => {
    commitRef.current = onValueCommitted;
  });
  const commitTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValue = React.useRef("");
  const cancelCommit = React.useCallback(() => {
    if (commitTimer.current != null) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
  }, []);
  const commitNow = React.useCallback(
    (nextValue: string) => {
      cancelCommit();
      commitRef.current?.(nextValue);
    },
    [cancelCommit],
  );
  const scheduleCommit = React.useCallback(
    (nextValue: string) => {
      if (commitRef.current == null) return;
      cancelCommit();
      pendingValue.current = nextValue;
      commitTimer.current = setTimeout(() => {
        commitTimer.current = null;
        commitRef.current?.(nextValue);
      }, debounceMs);
    },
    [cancelCommit, debounceMs],
  );
  React.useEffect(() => cancelCommit, [cancelCommit]);
  // A value set from outside (a host's "Clear filters") replaces what was typed, so the typed
  // value's pending commit is dropped rather than settling the old query afterwards.
  React.useEffect(() => {
    if (currentValue !== pendingValue.current) cancelCommit();
  }, [currentValue, cancelCommit]);

  const updateValue = React.useCallback(
    (nextValue: string) => {
      if (!controlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [controlled, onValueChange],
  );

  const clear = React.useCallback(() => {
    if (!canClear) return;
    updateValue("");
    commitNow("");
    input?.focus();
  }, [canClear, commitNow, input, updateValue]);

  if (!open)
    return (
      <Button
        ref={toggleButton}
        variant="ghost"
        size="icon"
        data-slot={`${dataSlot}-toggle`}
        aria-label={props["aria-label"] ?? props.placeholder ?? "Search"}
        disabled={disabled}
        className="shrink-0 text-muted-foreground"
        onClick={() => {
          focusAfter.current = "field";
          setExpandedState(true);
        }}
      >
        <Search aria-hidden />
      </Button>
    );

  return (
    <InputGroup
      className={className}
      data-slot={dataSlot}
      data-collapsible={collapsible ? "" : undefined}
      onBlur={
        collapsible
          ? (event: React.FocusEvent<HTMLDivElement>) => {
              // Focus moving between the field and its clear button keeps it open; leaving the
              // group with the field empty folds it.
              if (
                event.relatedTarget instanceof Node &&
                event.currentTarget.contains(event.relatedTarget)
              )
                return;
              setExpandedState(false);
            }
          : undefined
      }
    >
      <InputGroupAddon align="inline-start" aria-hidden="true">
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        {...props}
        ref={setInputRef}
        type="search"
        value={currentValue}
        disabled={disabled}
        readOnly={readOnly}
        className="[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        onChange={(event) => {
          updateValue(event.currentTarget.value);
          scheduleCommit(event.currentTarget.value);
          onChange?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            !event.defaultPrevented &&
            event.key === "Enter" &&
            !event.nativeEvent.isComposing &&
            event.keyCode !== 229 &&
            onValueCommitted != null
          ) {
            commitNow(event.currentTarget.value);
          }
          if (!event.defaultPrevented && event.key === "Escape" && canClear) {
            event.preventDefault();
            clear();
          } else if (
            collapsible &&
            !event.defaultPrevented &&
            event.key === "Escape" &&
            event.currentTarget.value === ""
          ) {
            // Escape on an empty collapsible field folds it, focus back on the button.
            event.preventDefault();
            focusAfter.current = "button";
            setExpandedState(false);
          }
        }}
      />
      {canClear ? (
        // Upstream's inline-end addon pulls a button toward the edge with `me-[-0.3rem]`, so the
        // addon's box ends ~4px OUTSIDE the group: a SearchInput filling a narrow container (a
        // FilterBar at 320px) overflowed it by exactly that much. Zero the margin and take the
        // same distance out of the padding (`pe-2` − 0.3rem ≈ `pe-1`), so the clear button sits
        // where it did and the box stays inside — `number-field`'s stepper slot does the same.
        <InputGroupAddon align="inline-end" className="pe-1 has-[>button]:me-0">
          <InputGroupButton
            data-slot="search-input-clear"
            size="icon-xs"
            className="active:not-aria-[haspopup]:translate-y-0"
            aria-label={clearLabel}
            onClick={clear}
          >
            <X aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export { SearchInput };
