// @vegastack add-filter-menu@0.25.104 sha256-QmVmgO3bhg8BOol44VTCgzeVQepFsHxn7WyAQ+0sBaM=

"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  ListToolbarPopover,
  useListToolbar,
} from "@/components/ui/list-toolbar";
import { Spinner } from "@/components/ui/spinner";

/* ---
`AddFilterMenu` is `+ Filter`, at the end of a `FilterRow`. Its popover opens on one input,
"Filter by…", that takes both a field name and plain language. Typing narrows the field list; when
the page passes `ai` and the text reads as a phrase (two or more words, or a word no field
matches), the first item is "✦ Filter with AI: “…”", and Enter on it sends the text to the page's
AI filter, whose result comes back as ordinary chips. Nothing is sent while typing. Without `ai`
there is no ✦ anywhere and nothing else changes, so the feature hides cleanly. Picking a field
with an editor drills into it in the same popover (‹ back); a field without one goes to the host.
The DS holds no AI: `ai.onSubmit` is the page's.
--- */

/** A field + Filter offers. */
export interface AddFilterField {
  /** Stable key. */
  key: string;
  /** The field's name ("Priority"). */
  label: string;
  /**
   * A leading icon.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * The value picker that opens in place when the field is picked. A function gets `done`, which
   * closes the popover. Omitted, picking the field calls `onPick` and closes.
   * @default undefined
   */
  editor?: React.ReactNode | ((done: () => void) => React.ReactNode);
  /**
   * Other words that find the field ("owner" for Assignee).
   * @default []
   */
  keywords?: readonly string[];
}

/** What the page's AI filter did with a request. */
export interface AiFilterResult {
  /** How many filters it added (as chips the page renders). */
  added: number;
  /**
   * The words it could not match — listed, never guessed.
   * @default []
   */
  unmatched?: readonly string[];
}

/** The page's AI filter. Absent: no ✦ anywhere. */
export interface AddFilterAi {
  /** Turn the request into filters. Reject (or throw) when the AI is unavailable or over its limit. */
  onSubmit: (text: string) => Promise<AiFilterResult> | AiFilterResult;
}

/** The words `AddFilterMenu` shows. */
export interface AddFilterMenuLabels {
  /** The trigger's text and the popover's name. */
  filter: string;
  /** The input's placeholder. */
  placeholder: string;
  /** The fields group's heading. */
  fields: string;
  /** The AI item ("Filter with AI: “…”"). */
  withAi: (text: string) => string;
  /** While the AI works. */
  working: string;
  /** No AI, and no field matches the text. */
  noMatch: string;
  /** The AI added nothing. */
  nothingAdded: string;
  /** The AI could not run. */
  unavailable: string;
  /** The words it could not match. */
  unmatched: (terms: readonly string[]) => string;
  /** The drill-in's back button. */
  back: string;
  /** The advanced filter entry. */
  advanced: string;
}

const DEFAULT_LABELS: AddFilterMenuLabels = {
  filter: "Filter",
  placeholder: "Filter by…",
  fields: "Fields",
  withAi: (text) => `Filter with AI: “${text}”`,
  working: "Working…",
  noMatch: "No field matches",
  nothingAdded: "No filters added.",
  unavailable: "AI filters aren't available right now; pick a field instead.",
  unmatched: (terms) =>
    `Couldn't match ${terms.map((term) => `“${term}”`).join(", ")}.`,
  back: "Back",
  advanced: "Advanced filter…",
};

/* ------------------------------------------------------------------------------------------------
 * AddFilterMenu
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `AddFilterMenu`. */
export interface AddFilterMenuProps {
  /** The fields that can filter, in the order offered. */
  fields: readonly AddFilterField[];
  /**
   * Called when a field without an `editor` is picked: add its chip (with its editor open).
   * @default undefined
   */
  onPick?: (key: string) => void;
  /**
   * The page's AI filter. Omit it where the AI module is off: no ✦ anywhere.
   * @default undefined
   */
  ai?: AddFilterAi;
  /**
   * "Advanced filter…" at the foot (a condition builder dialog).
   * @default undefined
   */
  onAdvanced?: () => void;
  /**
   * Whether the popover is open (controlled).
   * @default undefined
   */
  open?: boolean;
  /**
   * Called when it opens or closes.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The text the input opens with — the last AI prompt when "Edit filters" reopens the menu from
   * a list with no results. Each opening starts from it.
   * @default ""
   */
  initialQuery?: string;
  /**
   * The component's words.
   * @default English
   */
  labels?: Partial<AddFilterMenuLabels>;
}

/** Words in the text: runs of non-space characters. */
const wordCount = (text: string) =>
  text === "" ? 0 : text.split(/\s+/u).length;

type Option =
  | { kind: "ai"; id: string }
  | { kind: "field"; id: string; field: AddFilterField };

/**
 * `AddFilterMenu` — `+ Filter`: one input ("Filter by…") that both narrows the field list and, when
 * the page passes `ai` and the text reads as a phrase, offers "✦ Filter with AI: “…”" first —
 * Enter on it sends the request. Arrow keys pick a field; a field with an editor opens it in the
 * same popover (‹ back).
 * A pending spinner, then the popover closes on success (the page shows the chips and its
 * `FilterRow` note), or says what went wrong and keeps the fields usable. A bottom sheet on a phone.
 *
 * @example
 * <AddFilterMenu
 *   fields={[{ key: "priority", label: "Priority", editor: <PriorityPicker /> }]}
 *   onPick={addFilter}
 *   ai={aiOn ? { onSubmit: (text) => applyAiFilter("tasks", text) } : undefined}
 * />
 */
export function AddFilterMenu({
  fields,
  onPick,
  ai,
  onAdvanced,
  open: openProp,
  onOpenChange,
  initialQuery = "",
  labels: labelsProp,
}: AddFilterMenuProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const toolbar = useListToolbar();
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const listId = React.useId();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // The toolbar opened the filter row with nothing applied: open, focus in the input.
  const request = toolbar?.addFilterRequest ?? 0;
  const seen = React.useRef(request);
  React.useEffect(() => {
    if (request !== seen.current) {
      seen.current = request;
      setOpen(true);
    }
  }, [request, setOpen]);

  // Every opening starts fresh, focus in the input.
  React.useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setPage(null);
    setMessage(null);
    setActive(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = query.trim();
  const needle = text.toLowerCase();
  const matches = fields.filter(
    (field) =>
      needle === "" ||
      field.label.toLowerCase().includes(needle) ||
      field.keywords?.some((word) => word.toLowerCase().includes(needle)),
  );
  const exact = matches.findIndex(
    (field) => field.label.toLowerCase() === needle,
  );
  // A phrase goes to the AI: two or more words, or a word no field matches.
  const offerAi =
    ai != null && text !== "" && (wordCount(text) >= 2 || matches.length === 0);
  const options: Option[] = [
    ...(offerAi ? [{ kind: "ai", id: `${listId}-ai` } as const] : []),
    ...matches.map((field) => ({
      kind: "field" as const,
      id: `${listId}-${field.key}`,
      field,
    })),
  ];
  // Typing points at the exact field if there is one, else at the AI item.
  React.useEffect(() => {
    setActive(exact >= 0 ? exact + (offerAi ? 1 : 0) : 0);
    setMessage(null);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the highlighted option inside the list's own scroll box (never the page).
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const activeId = options[active]?.id;
  React.useEffect(() => {
    const list = listRef.current;
    const option = activeId ? document.getElementById(activeId) : null;
    if (!list || !option || !list.contains(option)) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (
      option.offsetTop + option.offsetHeight >
      list.scrollTop + list.clientHeight
    )
      list.scrollTop =
        option.offsetTop + option.offsetHeight - list.clientHeight;
    // Back from a field's editor remounts the list at the top: reveal the option again.
  }, [activeId, page]);

  const done = () => setOpen(false);
  const runAi = async (request: string) => {
    if (!ai || pending) return;
    setPending(true);
    setMessage(null);
    try {
      const result = await ai.onSubmit(request);
      if (result.added > 0) {
        done();
        return;
      }
      setMessage(
        [
          labels.nothingAdded,
          result.unmatched?.length ? labels.unmatched(result.unmatched) : null,
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch {
      setMessage(labels.unavailable);
    } finally {
      setPending(false);
    }
  };
  const choose = (option: Option | undefined) => {
    if (!option) return;
    if (option.kind === "ai") {
      void runAi(text);
      return;
    }
    if (option.field.editor != null) {
      setPage(option.field.key);
      return;
    }
    onPick?.(option.field.key);
    done();
  };

  const drilled =
    page != null ? fields.find((field) => field.key === page) : undefined;

  const body = drilled ? (
    <div
      data-slot="add-filter-menu-editor"
      className="flex min-w-0 flex-col gap-1"
    >
      <div className="flex h-7 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={labels.back}
          data-slot="add-filter-menu-back"
          onClick={() => setPage(null)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {drilled.label}
        </span>
      </div>
      {typeof drilled.editor === "function"
        ? drilled.editor(done)
        : drilled.editor}
    </div>
  ) : (
    <div data-slot="add-filter-menu-body" className="flex min-w-0 flex-col">
      {/* The people dropdown's input: a quiet filled field inside the menu's inset, no divider. */}
      <InputGroup
        data-slot="add-filter-menu-input"
        className="mb-1 shrink-0 border-input/30 bg-input/30"
      >
        <InputGroupAddon align="inline-start" aria-hidden="true">
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={labels.placeholder}
          aria-label={labels.filter}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={options[active]?.id}
          className="[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (
              event.key === "Enter" &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
              event.preventDefault();
              choose(options[active]);
            }
          }}
        />
        {pending ? (
          <InputGroupAddon align="inline-end" aria-hidden="true">
            <Spinner />
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {message != null ? (
        <p
          role="status"
          data-slot="add-filter-menu-message"
          className="px-1.5 py-1 text-sm text-muted-foreground"
        >
          {message}
        </p>
      ) : null}
      <div
        id={listId}
        ref={listRef}
        role="listbox"
        aria-label={labels.fields}
        data-slot="add-filter-menu-list"
        className="relative flex max-h-72 min-w-0 flex-col overflow-y-auto overscroll-contain"
      >
        {options.map((option, index) =>
          option.kind === "ai" ? (
            <div
              key={option.id}
              id={option.id}
              role="option"
              aria-selected={index === active}
              data-slot="add-filter-menu-ai"
              data-highlighted={index === active ? "" : undefined}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(option)}
              className="flex h-7 min-w-0 cursor-default items-center gap-1.5 rounded-md px-1.5 text-sm data-highlighted:bg-accent"
            >
              <Sparkles
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="min-w-0 truncate">
                {pending ? labels.working : labels.withAi(text)}
              </span>
            </div>
          ) : (
            <div
              key={option.id}
              id={option.id}
              role="option"
              aria-selected={index === active}
              data-slot="add-filter-menu-field"
              data-highlighted={index === active ? "" : undefined}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(option)}
              className="flex h-7 min-w-0 cursor-default items-center gap-1.5 rounded-md px-1.5 text-sm data-highlighted:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
            >
              {option.field.icon}
              <span className="min-w-0 flex-1 truncate">
                {option.field.label}
              </span>
              {option.field.editor != null ? (
                <ChevronRight aria-hidden />
              ) : null}
            </div>
          ),
        )}
        {options.length === 0 ? (
          <p className="px-1.5 py-1 text-sm text-muted-foreground">
            {labels.noMatch}
          </p>
        ) : null}
      </div>
      {onAdvanced != null ? (
        <>
          <div aria-hidden className="-mx-1 my-1 h-px bg-border" />
          <Button
            variant="ghost"
            data-slot="add-filter-menu-advanced"
            className="h-7 w-full justify-start rounded-md px-1.5 font-normal"
            onClick={() => {
              done();
              onAdvanced();
            }}
          >
            {labels.advanced}
          </Button>
        </>
      ) : null}
    </div>
  );

  return (
    <ListToolbarPopover
      title={labels.filter}
      align="end"
      size="md"
      open={open}
      onOpenChange={setOpen}
      data-slot="add-filter-menu-content"
      trigger={
        <Button
          variant="ghost"
          // The toolbar's tool height: 32px, 28px in a compact toolbar.
          size={toolbar?.compact ? "sm" : "default"}
          data-slot="add-filter-menu-trigger"
          className="shrink-0 font-normal text-muted-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
        >
          <Plus aria-hidden />
          {labels.filter}
        </Button>
      }
    >
      {body}
    </ListToolbarPopover>
  );
}
