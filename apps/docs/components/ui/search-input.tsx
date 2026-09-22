// @vegastack search-input@0.11.1 sha256-c6bGiePRSeMhMgP7fHGGVrHSeYTs5g2Oqq/9fYXKrlY=

"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { mergeRefs } from "@vegastack/design";

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
  /** Accessible name for the clear action. @default 'Clear search' */
  clearLabel?: string;
  /** Slot name applied to the InputGroup root. @default 'search-input' */
  "data-slot"?: string;
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
  clearLabel = "Clear search",
  className,
  disabled,
  readOnly,
  onChange,
  onKeyDown,
  ref,
  "data-slot": dataSlot = "search-input",
  ...props
}: SearchInputProps) {
  const controlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const [input, setInput] = React.useState<HTMLInputElement | null>(null);
  const currentValue = controlled ? value : uncontrolledValue;
  const canClear = currentValue.length > 0 && !disabled && !readOnly;

  const setInputRef = React.useMemo(() => mergeRefs(setInput, ref), [ref]);

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
    input?.focus();
  }, [canClear, input, updateValue]);

  return (
    <InputGroup className={className} data-slot={dataSlot}>
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
          onChange?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === "Escape" && canClear) {
            event.preventDefault();
            clear();
          }
        }}
      />
      {canClear ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            data-slot="search-input-clear"
            size="icon-xs"
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
