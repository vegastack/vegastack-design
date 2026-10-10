// @vegastack people-picker@0.25.11 sha256-s8FQX/7txMrMjKtiYjyuQ83txXWpf1ITax4zw+Uciig=

"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandActions,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  PanelList,
  PanelSearch,
  PanelSearchField,
} from "@/components/ui/panel-search";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PersonOption } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAsyncSearch,
  type AsyncSearchLoader,
} from "@/components/ui/use-async-search";

/* ------------------------------------------------------------------------------------------------
 * PeoplePicker — the ONE picker for people and teams. Every surface that chooses a person (an
 * assignee, an owner, a manager, a filter) or several people and teams (members of a team or a
 * space, a share invite) composes it, so a row reads the same everywhere: the avatar on the left,
 * the name (with "(you)" for the viewer), then the email, a description or "Team · N people" in a
 * smaller truncated line. Three hosts share the rows, the search and the loading skeleton:
 *
 * - `PeoplePicker` — a field: its own trigger (one height per size, the same as `Button` and
 *   `Select`, so it sits flush beside them) over a popover, single or `multiple`.
 * - `PeoplePickerContent` — the popover body alone, for a trigger the host owns (a record pill).
 * - `PeoplePickerMenu` — the same list inside a `DropdownMenu` submenu ("Assign ›").
 *
 * Only active people are listed: an option with `active: false` (deactivated, or invited and not
 * yet joined) is left out unless the host passes `includeInactive`, which then badges it. The host's
 * `search` should leave them out too — this is the second line, not the first.
 * ----------------------------------------------------------------------------------------------*/

/** A person or team offered by `PeoplePicker`. */
export interface PeoplePickerOption extends Person {
  /** A stable id, unique across people and teams. */
  id: string;
  /**
   * The muted second line instead of the email — a role, a department. A team without one reads
   * "Team · N people" from `memberCount`.
   * @default undefined
   */
  description?: string | null;
  /** A team's size, for its "Team · N people" line. @default undefined */
  memberCount?: number | null;
  /**
   * `false` for someone who cannot be chosen — deactivated, or invited and not yet joined. Left
   * out of the list unless `includeInactive`.
   * @default true
   */
  active?: boolean;
  /**
   * An icon in the avatar's place, for an option that is not a person ("Unassigned" in a filter).
   * @default undefined
   */
  icon?: React.ReactNode;
}

/** A static footer action under the results — "Assign to me", "Unassign". */
export interface PeoplePickerAction {
  /** The action's label. */
  label: string;
  /** A leading icon. @default undefined */
  icon?: React.ReactNode;
  /** Disable the action when it would do nothing (already assigned to you). @default false */
  disabled?: boolean;
  /** Runs the action; a `PeoplePicker` closes after it. */
  onSelect: () => void;
}

/** Finds people (and teams) for a query, one keyset page at a time — `useAsyncSearch`'s loader. */
export type PeoplePickerSearch = AsyncSearchLoader<PeoplePickerOption>;

/** The list props every host shares. */
export interface PeoplePickerListProps {
  /**
   * Finds people and teams for the typed query (`""` on open), debounced and race-safe; return
   * `nextCursor` to page on scroll. Leave out anyone who cannot be chosen.
   * @default undefined
   */
  search?: PeoplePickerSearch;
  /**
   * A fixed list instead of `search`, filtered here by name, email and description.
   * @default undefined
   */
  options?: readonly PeoplePickerOption[];
  /**
   * Options always listed first and never filtered out — "Unassigned" in a filter. Give each an
   * `icon`.
   * @default []
   */
  leadingOptions?: readonly PeoplePickerOption[];
  /** Ids shown with a check (the current choice). @default [] */
  selected?: readonly string[];
  /** Ids never offered (a member cannot manage themselves). @default [] */
  exclude?: readonly string[];
  /** The viewer's id: their row reads "(you)" and is listed first. @default undefined */
  viewerId?: string | null;
  /** List people with `active: false`, badged "Inactive". @default false */
  includeInactive?: boolean;
  /** Static actions in the footer under the results. @default [] */
  actions?: readonly PeoplePickerAction[];
  /** The search field's placeholder and accessible name. @default "Search people" */
  searchPlaceholder?: string;
  /** Shown when nothing matches. @default "No people found" */
  emptyText?: string;
  /** The viewer's marker after their name. @default "(you)" */
  youLabel?: string;
  /** A team's second line. @default (n) => `Team · ${n} ${n === 1 ? "person" : "people"}` */
  teamLabel?: (memberCount: number) => string;
  /** The badge on an inactive person (with `includeInactive`). @default "Inactive" */
  inactiveLabel?: string;
}

const defaultTeamLabel = (n: number) =>
  `Team · ${n} ${n === 1 ? "person" : "people"}`;

const SKELETON_ROWS = 4;

/** The search, the rows and the paging behind every host. */
function usePeopleList(
  {
    search,
    options,
    leadingOptions = [],
    selected = [],
    exclude = [],
    viewerId,
    includeInactive = false,
  }: PeoplePickerListProps,
  pinned: readonly PeoplePickerOption[] = [],
) {
  const remote = useAsyncSearch<PeoplePickerOption>(
    search ?? (() => Promise.resolve({ items: [] })),
    { enabled: search !== undefined },
  );
  const [localQuery, setLocalQuery] = React.useState("");
  // The first request starts in an effect: until it has run, the list is loading, not empty.
  const [started, setStarted] = React.useState(false);
  if (remote.loading && !started) setStarted(true);
  const query = search ? remote.query : localQuery;
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = search
      ? remote.items
      : (options ?? []).filter(
          (o) =>
            !q ||
            [o.name, o.email, o.description].some((text) =>
              (text ?? "").toLowerCase().includes(q),
            ),
        );
    const skip = new Set(exclude);
    const seen = new Set<string>();
    // The current choice leads while nothing is typed, so a chosen row is always there to untick.
    const list = [...leadingOptions, ...(q ? [] : pinned), ...found].filter(
      (o) => {
        if (seen.has(o.id) || skip.has(o.id)) return false;
        if (o.active === false && !includeInactive) return false;
        seen.add(o.id);
        return true;
      },
    );
    if (!viewerId || q) return list;
    const me = list.findIndex((o) => o.id === viewerId);
    if (me < 0) return list;
    // The viewer leads the people, after the leading options.
    const at = list.findIndex(
      (o) => !leadingOptions.some((l) => l.id === o.id),
    );
    if (me <= at) return list;
    const rest = list.filter((_, i) => i !== me);
    return [...rest.slice(0, at), list[me]!, ...rest.slice(at)];
  }, [
    leadingOptions,
    query,
    search,
    remote.items,
    options,
    exclude,
    pinned,
    includeInactive,
    viewerId,
  ]);
  return {
    rows,
    query,
    onSearchChange: search ? remote.onSearchChange : setLocalQuery,
    // Skeleton rows only while nothing is listed yet; a search over shown rows keeps them.
    loading:
      Boolean(search) &&
      (remote.loading || (!started && !remote.error)) &&
      rows.length === 0,
    error: search ? remote.error : undefined,
    loadMore: remote.loadMore,
    checked: new Set(selected),
  };
}

/** One person or team row: avatar, name (+ "(you)"), then the email / description / team size. */
function PeoplePickerRow({
  option,
  checked = false,
  viewerId,
  youLabel = "(you)",
  teamLabel = defaultTeamLabel,
  inactiveLabel = "Inactive",
}: {
  option: PeoplePickerOption;
  /** The row is part of the choice: screen readers hear it (cmdk's aria-selected is the cursor). */
  checked?: boolean;
} & Pick<
  PeoplePickerListProps,
  "viewerId" | "youLabel" | "teamLabel" | "inactiveLabel"
>) {
  const team = option.kind === "team";
  const secondary =
    option.description ??
    (team
      ? option.memberCount != null
        ? teamLabel(option.memberCount)
        : null
      : option.email && option.email !== option.name
        ? option.email
        : null);
  return (
    <PersonOption
      avatar={
        option.icon ? (
          <span
            aria-hidden
            data-slot="people-picker-icon"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-3.5"
          >
            {option.icon}
          </span>
        ) : (
          <PersonAvatar person={option} aria-hidden />
        )
      }
      name={
        <>
          {option.name}
          {option.id === viewerId && !team ? (
            <>
              {" "}
              <span
                data-slot="people-picker-you"
                className="text-muted-foreground"
              >
                {youLabel}
              </span>
            </>
          ) : null}
          {checked ? <span className="sr-only">, selected</span> : null}
        </>
      }
      email={secondary ?? undefined}
      badge={option.active === false ? inactiveLabel : option.badge}
    />
  );
}

/** The loading state: skeleton rows the shape of a person row, never a spinner. */
function PeoplePickerSkeleton({ rows = SKELETON_ROWS }: { rows?: number }) {
  return (
    <div
      aria-hidden
      data-slot="people-picker-skeleton"
      className="flex flex-col"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className={cn("h-3", i % 2 ? "w-24" : "w-32")} />
            <Skeleton className="h-2.5 w-40 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

type Paging = { hasMore: boolean; loading?: boolean; onLoadMore: () => void };

/**
 * Pages on scroll: the next page loads as the list nears its end — and at once while the list
 * does not fill its box (a page the host's `exclude` emptied), so every page stays reachable.
 */
function usePaging(paging: Paging, error: unknown, rows: number) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const near = (el: HTMLElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  const ready = paging.hasMore && !paging.loading && !error;
  React.useEffect(() => {
    if (ready && ref.current && near(ref.current)) paging.onLoadMore();
  }, [ready, rows, paging]);
  return {
    ref,
    onScroll: (event: React.UIEvent<HTMLElement>) => {
      if (ready && near(event.currentTarget)) paging.onLoadMore();
    },
  };
}

/** Under the rows: skeleton rows while the next page loads, or the failure with Try again. */
function PeoplePickerTail({
  paging,
  error,
  rows,
}: {
  paging: Paging;
  error: React.ReactNode | undefined;
  rows: number;
}) {
  if (error)
    return (
      <div
        role="alert"
        data-slot="people-picker-error"
        // Enter and Space on Try again are the button's, never the list's (cmdk picks on Enter).
        onKeyDown={(event) => event.stopPropagation()}
        className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm"
      >
        <span className="min-w-0 text-destructive-text">{error}</span>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={paging.onLoadMore}
        >
          Try again
        </Button>
      </div>
    );
  return paging.loading && rows > 0 ? <PeoplePickerSkeleton rows={2} /> : null;
}

/** Props for `PeoplePickerContent`. */
export interface PeoplePickerContentProps extends PeoplePickerListProps {
  /** Called with the picked person or team. */
  onSelect: (option: PeoplePickerOption) => void;
  /** Chosen options listed first while nothing is typed (a multiple choice). @default [] */
  pinned?: readonly PeoplePickerOption[];
  /** Classes for the `Command` root. @default undefined */
  className?: string;
}

/**
 * `PeoplePickerContent` — the picker's popover body for a trigger the host owns: a search field,
 * the person and team rows (skeleton rows while the first page loads), paging on scroll, and a
 * footer of `actions`. Put it in a `PopoverContent` with no padding (`p-0`, `w-72`).
 *
 * @example
 * <Popover>
 *   <PopoverTrigger render={<RecordChip person={assignee} placeholder="Unassigned" />} />
 *   <PopoverContent className="w-72 p-0">
 *     <PeoplePickerContent
 *       search={searchMembers}
 *       selected={assignee ? [assignee.id] : []}
 *       viewerId={me.id}
 *       actions={[{ label: "Assign to me", icon: <UserCheck />, onSelect: assignMe }]}
 *       onSelect={assign}
 *     />
 *   </PopoverContent>
 * </Popover>
 */
export function PeoplePickerContent({
  onSelect,
  pinned,
  className,
  actions = [],
  searchPlaceholder = "Search people",
  emptyText = "No people found",
  ...list
}: PeoplePickerContentProps) {
  const { rows, query, onSearchChange, loading, error, loadMore, checked } =
    usePeopleList(list, pinned);
  const paging = usePaging(loadMore, error, rows.length);
  return (
    <Command
      shouldFilter={false}
      data-slot="people-picker-content"
      className={className}
    >
      <CommandInput
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        value={query}
        onValueChange={onSearchChange}
      />
      <CommandList
        ref={paging.ref}
        aria-busy={loading || loadMore.loading || undefined}
        onScroll={paging.onScroll}
      >
        {loading ? (
          <PeoplePickerSkeleton />
        ) : error ? null : (
          <CommandEmpty>{emptyText}</CommandEmpty>
        )}
        {rows.length > 0 ? (
          <CommandGroup>
            {rows.map((option) => (
              <CommandItem
                key={option.id}
                value={option.id}
                data-slot="people-picker-item"
                data-kind={option.kind ?? "person"}
                data-checked={checked.has(option.id) ? "true" : undefined}
                onSelect={() => onSelect(option)}
              >
                <PeoplePickerRow
                  option={option}
                  checked={checked.has(option.id)}
                  {...list}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        <PeoplePickerTail paging={loadMore} error={error} rows={rows.length} />
        {actions.length > 0 ? (
          <CommandActions>
            {actions.map((action) => (
              <CommandItem
                key={action.label}
                value={`__people-picker-action ${action.label}`}
                disabled={action.disabled}
                onSelect={action.onSelect}
              >
                {action.icon}
                {action.label}
              </CommandItem>
            ))}
          </CommandActions>
        ) : null}
      </CommandList>
    </Command>
  );
}

/** Props for `PeoplePickerMenu`. */
export interface PeoplePickerMenuProps extends Omit<
  PeoplePickerListProps,
  "actions"
> {
  /** Called with the picked person or team; the menu closes. */
  onSelect: (option: PeoplePickerOption) => void;
}

/**
 * `PeoplePickerMenu` — the picker inside a `DropdownMenu` submenu (a row action's `submenu`,
 * "Assign ›"): the same search, rows and skeleton as menu items. Its footer actions are the row
 * action's `items`, which the menu renders under the list.
 *
 * @example
 * { label: "Assign", submenu: <PeoplePickerMenu search={searchMembers} onSelect={assign} />, items: [assignToMe, unassign] }
 */
export function PeoplePickerMenu({
  onSelect,
  searchPlaceholder = "Search people",
  emptyText = "No people found",
  ...list
}: PeoplePickerMenuProps) {
  const { rows, query, onSearchChange, loading, error, loadMore, checked } =
    usePeopleList(list);
  const paging = usePaging(loadMore, error, rows.length);
  return (
    <>
      <PanelSearch>
        <PanelSearchField
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          // Typing stays in the field; the menu's typeahead would otherwise take the keys.
          onKeyDown={(event) => {
            if (!["ArrowDown", "ArrowUp", "Escape", "Tab"].includes(event.key))
              event.stopPropagation();
          }}
        />
      </PanelSearch>
      <PanelList
        data-slot="people-picker-menu"
        ref={paging.ref}
        aria-busy={loading || loadMore.loading || undefined}
        onScroll={paging.onScroll}
      >
        {loading ? <PeoplePickerSkeleton /> : null}
        {rows.map((option) => (
          <DropdownMenuItem
            key={option.id}
            data-slot="people-picker-item"
            data-kind={option.kind ?? "person"}
            disabled={checked.has(option.id)}
            onClick={() => onSelect(option)}
          >
            <PeoplePickerRow
              option={option}
              checked={checked.has(option.id)}
              {...list}
            />
          </DropdownMenuItem>
        ))}
        {!loading && !error && rows.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : null}
        <PeoplePickerTail paging={loadMore} error={error} rows={rows.length} />
      </PanelList>
    </>
  );
}

/** The selection type: one option (or `null`), or an array with `multiple`. */
export type PeoplePickerValue<Multiple extends boolean | undefined> =
  Multiple extends true ? PeoplePickerOption[] : PeoplePickerOption | null;

/** Props for `PeoplePicker`. */
export interface PeoplePickerProps<
  Multiple extends boolean | undefined = false,
> extends PeoplePickerListProps {
  /**
   * Choose several people and teams: rows toggle, the popover stays open, and the trigger reads
   * the chosen names.
   * @default false
   */
  multiple?: Multiple;
  /** The chosen option — or options, with `multiple` (controlled). */
  value: PeoplePickerValue<Multiple>;
  /** Called with the new choice. */
  onValueChange: (value: PeoplePickerValue<Multiple>) => void;
  /**
   * The trigger's height — the same as `Button` and `Select` at each size, so a picker sits flush
   * in a row with them ("Add people… | Can edit | Add").
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /** `ghost` is the inline trigger: no border at rest. @default "outline" */
  variant?: "outline" | "ghost";
  /** The trigger's text while nothing is chosen. @default "Select a person", or "Add people…" with `multiple` */
  placeholder?: string;
  /** Disable the trigger. @default false */
  disabled?: boolean;
  /** Open state (controlled). @default undefined */
  open?: boolean;
  /** Called when the popover opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** The trigger's id, for a `<label htmlFor>`. @default undefined */
  id?: string;
  /** The trigger's accessible name when no label names it. @default the placeholder or the choice */
  "aria-label"?: string;
  /** Mark the trigger invalid. @default undefined */
  "aria-invalid"?: boolean;
  /** Ids of elements that describe the trigger. @default undefined */
  "aria-describedby"?: string;
  /** Popover alignment against the trigger. @default "start" */
  align?: "start" | "center" | "end";
  /** Classes for the trigger. @default undefined */
  className?: string;
  /** Classes for the popover. @default undefined */
  contentClassName?: string;
  /** Ref to the trigger button. @default undefined */
  ref?: React.Ref<HTMLButtonElement>;
}

/** "Asha Rao", "Asha Rao, Dev Menon", "Asha Rao, Dev Menon +2". */
function namesOf(list: readonly PeoplePickerOption[]): string {
  const shown = list
    .slice(0, 2)
    .map((o) => o.name)
    .join(", ");
  return list.length > 2 ? `${shown} +${list.length - 2}` : shown;
}

/**
 * `PeoplePicker` — choose a person, or several people and teams, from a searched list. The
 * trigger reads the choice with its avatar(s); the popover lists active people (and teams, when
 * `search` returns them) with the footer `actions`. Its height matches `Button` and `Select` at
 * every `size`.
 *
 * @example
 * const [owner, setOwner] = React.useState<PeoplePickerOption | null>(null);
 * <PeoplePicker value={owner} onValueChange={setOwner} search={searchMembers} viewerId={me.id} />
 *
 * @example
 * const [adding, setAdding] = React.useState<PeoplePickerOption[]>([]);
 * <PeoplePicker multiple value={adding} onValueChange={setAdding} search={searchPeopleAndTeams} />
 */
export function PeoplePicker<Multiple extends boolean | undefined = false>({
  multiple,
  value,
  onValueChange,
  size = "default",
  variant = "outline",
  placeholder,
  disabled = false,
  open: openProp,
  onOpenChange,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  align = "start",
  className,
  contentClassName,
  ref,
  actions = [],
  ...list
}: PeoplePickerProps<Multiple>) {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const chosen: PeoplePickerOption[] = Array.isArray(value)
    ? value
    : value
      ? [value as PeoplePickerOption]
      : [];
  // The rows pinned on top are the choice as the popover opened, so a toggle never moves a row —
  // whoever opens it (the trigger, or a host's controlled `open`).
  const [pinned, setPinned] = React.useState<PeoplePickerOption[]>(() =>
    open ? chosen : [],
  );
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPinned(chosen);
  }
  const text = placeholder ?? (multiple ? "Add people…" : "Select a person");
  const face = chosen.length > 0 ? namesOf(chosen) : text;

  const pick = (option: PeoplePickerOption) => {
    if (multiple) {
      const has = chosen.some((o) => o.id === option.id);
      onValueChange(
        (has
          ? chosen.filter((o) => o.id !== option.id)
          : [...chosen, option]) as PeoplePickerValue<Multiple>,
      );
      return;
    }
    setOpen(false);
    onValueChange(option as PeoplePickerValue<Multiple>);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            ref={ref}
            id={id}
            variant="outline"
            size={size}
            aria-label={ariaLabel ?? (id ? undefined : face)}
            aria-invalid={ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy}
            data-slot="people-picker"
            data-size={size}
            data-variant={variant}
            data-placeholder={chosen.length ? undefined : ""}
            className={cn(
              "min-w-0 justify-start gap-2 font-normal",
              size === "sm" && "text-sm",
              variant === "ghost"
                ? "w-fit border-transparent bg-transparent shadow-none hover:border-input dark:bg-transparent"
                : "w-full",
              className,
            )}
          />
        }
      >
        {chosen.length > 0 ? (
          <span
            data-slot="people-picker-avatars"
            className="flex shrink-0 -space-x-1.5"
          >
            {chosen.slice(0, 3).map((o) => (
              <PersonAvatar
                key={o.id}
                person={o}
                aria-hidden
                className={cn(
                  "ring-2 ring-background",
                  size === "sm" ? "size-5" : "size-6",
                )}
              />
            ))}
          </span>
        ) : null}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-start",
            chosen.length === 0 && "text-muted-foreground",
          )}
        >
          {face}
        </span>
        <ChevronsUpDown aria-hidden className="ms-auto text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        data-slot="people-picker-popover"
        className={cn(
          "w-(--anchor-width) max-w-(--available-width) min-w-72 gap-0 p-0",
          contentClassName,
        )}
      >
        <PeoplePickerContent
          {...list}
          pinned={multiple ? pinned : []}
          selected={chosen.map((o) => o.id)}
          actions={actions.map((action) => ({
            ...action,
            onSelect: () => {
              setOpen(false);
              action.onSelect();
            },
          }))}
          onSelect={pick}
        />
      </PopoverContent>
    </Popover>
  );
}
