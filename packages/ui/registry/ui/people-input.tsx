// @vegastack people-input@0.24.5 sha256-OP3Ja6grTQV16TDH25HCocfgTHqosD8UaLA6ZWVpq2I=

"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { UserRound, UsersRound, XIcon } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import { PersonOption } from "@/components/ui/searchable-select";
import { Spinner } from "@/components/ui/spinner";
import { useAsyncSearch } from "@/components/ui/use-async-search";

/* ------------------------------------------------------------------------------------------------
 * PeopleInput — "Add people or teams…": a chips field over upstream's Combobox (ComboboxChips) that
 * searches the host's directory as you type and adds each pick as a removable chip. People and
 * teams are listed with PersonOption over PersonAvatar (a team is its rounded-square tile). The
 * search is the host's — `search(query)` — debounced and race-safe through `useAsyncSearch`.
 * Backspace in an empty field removes the last chip (Base UI's chips model); Escape never clears
 * the chips — it closes the list, then reaches the dialog around the field. A chip carries no
 * role of its own: a sharing invite picks one access level for the whole batch.
 * ----------------------------------------------------------------------------------------------*/

/** A person or team offered and chosen by `PeopleInput`. */
export interface PeopleInputOption extends Person {
  /** A stable id, unique across people and teams. */
  id: string;
}

/** Props for `PeopleInput`. */
export interface PeopleInputProps {
  /** The chosen people and teams, in the order they were added. */
  value: readonly PeopleInputOption[];
  /** Called with the new list when a chip is added or removed. */
  onValueChange: (value: PeopleInputOption[]) => void;
  /**
   * Finds people and teams for a query (`""` when the field opens empty). Called debounced; the
   * `signal` aborts when a newer query starts. Leave out anyone who cannot be added.
   */
  search: (
    query: string,
    context: { signal: AbortSignal },
  ) => Promise<PeopleInputOption[]>;
  /** The field's placeholder while no chip is chosen. @default "Add people or teams…" */
  placeholder?: string;
  /** Disable the field and its chips. @default false */
  disabled?: boolean;
  /** Shown when a search finds nobody. @default "No people or teams found" */
  emptyText?: string;
  /** Shown while a search is in flight. @default "Searching…" */
  loadingText?: string;
  /** The text input's accessible name, when no label names it. @default "Add people or teams" */
  "aria-label"?: string;
  /** The text input's id, for a `<label htmlFor>`. @default undefined */
  id?: string;
  /** The remove button's accessible name for one chip. @default (option) => `Remove ${option.name}` */
  removeLabel?: (option: PeopleInputOption) => string;
  /** Classes for the chips field. @default undefined */
  className?: string;
}

const defaultRemoveLabel = (option: PeopleInputOption) =>
  `Remove ${option.name}`;

/**
 * `PeopleInput` — choose several people and teams as removable chips, searched as you type.
 *
 * @example
 * const [invitees, setInvitees] = React.useState<PeopleInputOption[]>([]);
 * <PeopleInput
 *   value={invitees}
 *   onValueChange={setInvitees}
 *   search={(query, { signal }) => fetchDirectory(query, signal)}
 * />
 */
export function PeopleInput({
  value,
  onValueChange,
  search,
  placeholder = "Add people or teams…",
  disabled = false,
  emptyText = "No people or teams found",
  loadingText = "Searching…",
  "aria-label": ariaLabel = "Add people or teams",
  id,
  removeLabel = defaultRemoveLabel,
  className,
}: PeopleInputProps) {
  const anchor = useComboboxAnchor();
  const [open, setOpen] = React.useState(false);
  const results = useAsyncSearch<PeopleInputOption>(
    (query, { signal }) =>
      search(query, { signal }).then((items) => ({ items })),
    { enabled: open },
  );

  // The chosen options stay in the item list, so a chosen row keeps its check and a chip keeps
  // its label while the results move on to a new query.
  const items = React.useMemo(() => {
    const seen = new Set(results.items.map((item) => item.id));
    return [...results.items, ...value.filter((item) => !seen.has(item.id))];
  }, [results.items, value]);

  return (
    <Combobox<PeopleInputOption, true>
      multiple
      autoHighlight
      items={items}
      value={value as PeopleInputOption[]}
      onValueChange={(next, details) => {
        // Base UI clears every chip on Escape while the list is closed, and swallows the key. In
        // a dialog that Escape means "close": keep the chips and let the key reach the dialog.
        if (details.reason === "escape-key") {
          details.cancel();
          details.allowPropagation();
          return;
        }
        onValueChange(next);
      }}
      filter={null}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, chosen) => item.id === chosen.id}
      inputValue={results.query}
      onInputValueChange={(next) => results.onSearchChange(next)}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
    >
      <ComboboxChips
        ref={anchor}
        data-people-input=""
        className={cn("w-full", className)}
      >
        <ComboboxValue>
          {(chosen: PeopleInputOption[]) => (
            <React.Fragment>
              {chosen.map((option) => {
                const Icon = option.kind === "team" ? UsersRound : UserRound;
                return (
                  <ComboboxChip
                    key={option.id}
                    showRemove={false}
                    data-kind={option.kind ?? "person"}
                    className="pe-0"
                  >
                    <Icon
                      aria-hidden
                      className="size-3 shrink-0 text-muted-foreground"
                    />
                    <span className="max-w-48 truncate">{option.name}</span>
                    <BaseCombobox.ChipRemove
                      data-slot="people-input-chip-remove"
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={removeLabel(option)}
                          className="-ms-1 opacity-50 hover:opacity-100 active:not-aria-[haspopup]:translate-y-0"
                        />
                      }
                    >
                      <XIcon className="pointer-events-none" />
                    </BaseCombobox.ChipRemove>
                  </ComboboxChip>
                );
              })}
              <ComboboxChipsInput
                id={id}
                aria-label={ariaLabel}
                placeholder={chosen.length > 0 ? undefined : placeholder}
                className="placeholder:text-muted-foreground"
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor} aria-busy={results.loading || undefined}>
        <ComboboxStatus visible>
          {results.loading ? (
            <span className="flex items-center gap-2">
              <Spinner className="size-3.5" />
              {loadingText}
            </span>
          ) : results.error ? (
            <span className="text-destructive-text">{results.error}</span>
          ) : null}
        </ComboboxStatus>
        <ComboboxEmpty>
          {results.loading || results.error ? null : emptyText}
        </ComboboxEmpty>
        <ComboboxList aria-label={ariaLabel}>
          {(item: PeopleInputOption) => (
            <ComboboxItem key={item.id} value={item}>
              <PersonOption
                name={item.name}
                email={item.email}
                badge={item.badge}
                avatar={<PersonAvatar person={item} />}
              />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
