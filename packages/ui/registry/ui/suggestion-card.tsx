// @vegastack suggestion-card@0.44.0 sha256-S26eI97h277GKWeQePFgMFy5aFi5iCRSxnVfHBeWzTA=

import * as React from "react";
import { cn } from "@vegastack/design";

import { Checkbox } from "@/components/ui/checkbox";
import { TruncatedText } from "@/components/ui/truncated-text";

/* ------------------------------------------------------------------------------------------------
 * SuggestionCard — an agent offers a next step to one person: who offers, what it would do, the
 * items it would act on, and the host's buttons, which name the action. The card holds no action of
 * its own and no words of its own, so what it offers stays the host's: "Create 2 tasks", a quiet
 * "Dismiss". A card that merely appears announces nothing; the host announces what it does through
 * the conversation's one region, a failure included.
 * ----------------------------------------------------------------------------------------------*/

/** Where a suggestion stands. */
export type SuggestionCardState =
  "open" | "busy" | "accepted" | "expired" | "failed";

/** One thing the suggestion would act on. */
export interface SuggestionCardItem {
  /** A stable key, and what `onItemCheckedChange` reports. */
  id: string;
  /** What it is: "Order 3000 K samples". Cut with an ellipsis on one line. */
  label: React.ReactNode;
  /** A muted note kept whole at the row's end: "Ravi, Wed". @default undefined */
  meta?: React.ReactNode;
  /** Ticked. Leave it out for an item that can't be unticked: no checkbox. @default undefined */
  checked?: boolean;
}

/** Props accepted by `SuggestionCard`. */
export interface SuggestionCardProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "title" | "children"
> {
  /** What is offered, and the card's name: "Assistant · 3 decisions from this chat". */
  title: React.ReactNode;
  /** Who it is for, above the title: "Only you can see this". @default undefined */
  privateLabel?: React.ReactNode;
  /** The agent's avatar, before the title. @default undefined */
  avatar?: React.ReactNode;
  /** What it would act on. @default [] */
  items?: readonly SuggestionCardItem[];
  /** An item was ticked or unticked. @default undefined */
  onItemCheckedChange?: (id: string, checked: boolean) => void;
  /**
   * The buttons, which name the action: a secondary "Create 2 tasks", then ghost "Review" and
   * "Dismiss". Never primary, and never "Yes" or "No thanks". @default undefined
   */
  actions?: React.ReactNode;
  /** The ⋯ menu, at the card's top end. @default undefined */
  menu?: React.ReactNode;
  /** The quiet line at the foot: "Expires tomorrow". @default undefined */
  footnote?: React.ReactNode;
  /**
   * `busy` — accepting: the items hold still. The spinner goes on the host's main button, and the
   * host holds or drops the others, so Dismiss can't race the accept. `accepted` — the card gives
   * way to `outcome`, a plain line, with `actions` after it ("Undo"); it also fits something an
   * agent did by itself. `expired` — the title, `outcome` and `actions` ("Ask again"). `failed` —
   * the whole card with `outcome` over `actions` ("Retry"). After `accepted`, `ref` is what's left
   * to take focus: the button that had it is gone.
   * @default "open"
   */
  state?: SuggestionCardState;
  /** What became of it: "Asha created 2 tasks from Assistant's suggestion". @default undefined */
  outcome?: React.ReactNode;
  /**
   * `card` — in a conversation, full width. `row` — compact, for a list: the title and buttons side
   * by side, stacked in a container under 32rem; `privateLabel`, items and the footnote don't show.
   * @default "card"
   */
  variant?: "card" | "row";
}

/**
 * `SuggestionCard` — an agent offers one person a next step, in a card only they see. Put the
 * buttons in `actions`; they name what will happen.
 *
 * @example
 * <SuggestionCard
 *   privateLabel="Only you can see this"
 *   avatar={<PersonAvatar person={agent} size="sm" />}
 *   title="Assistant · 3 decisions from this chat"
 *   items={items}
 *   onItemCheckedChange={toggle}
 *   actions={<Button size="sm" variant="secondary" onClick={accept}>Create 2 tasks</Button>}
 *   footnote="Expires tomorrow"
 * />
 */
export function SuggestionCard({
  title,
  privateLabel,
  avatar,
  items = [],
  onItemCheckedChange,
  actions,
  menu,
  footnote,
  state = "open",
  outcome,
  variant = "card",
  className,
  ...props
}: SuggestionCardProps) {
  const titleId = React.useId();
  const busy = state === "busy";
  const expired = state === "expired";
  const buttons = actions ? (
    <div
      data-slot="suggestion-card-actions"
      className="flex min-w-0 flex-wrap items-center gap-1"
    >
      {actions}
    </div>
  ) : null;

  // A line left in the conversation, not a landmark: history would flood the region list.
  if (state === "accepted")
    return (
      <section
        data-slot="suggestion-card"
        data-state={state}
        data-variant={variant}
        className={cn(
          "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground",
          className,
        )}
        {...props}
      >
        <p
          data-slot="suggestion-card-outcome"
          className="min-w-0 wrap-anywhere"
        >
          {outcome ?? title}
        </p>
        {buttons}
      </section>
    );

  const result = outcome ? (
    <p
      data-slot="suggestion-card-outcome"
      className={cn(
        "text-sm wrap-anywhere",
        state === "failed" ? "text-destructive-text" : "text-muted-foreground",
      )}
    >
      {outcome}
    </p>
  ) : null;
  const heading = (
    <div
      data-slot="suggestion-card-heading"
      className="flex min-w-0 flex-1 items-start gap-2"
    >
      {avatar ? (
        <span
          data-slot="suggestion-card-avatar"
          className="inline-flex shrink-0"
        >
          {avatar}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          id={titleId}
          data-slot="suggestion-card-title"
          className="min-w-0 text-sm font-medium wrap-anywhere"
        >
          {title}
        </p>
        {variant === "row" ? result : null}
      </div>
    </div>
  );

  if (variant === "row")
    return (
      <section
        data-slot="suggestion-card"
        data-state={state}
        data-variant={variant}
        role="group"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
        className={cn(
          "@container/suggestion-card w-full min-w-0 rounded-lg py-1.5",
          className,
        )}
        {...props}
      >
        <div className="flex min-w-0 flex-col gap-1.5 @lg/suggestion-card:flex-row @lg/suggestion-card:items-center @lg/suggestion-card:gap-3">
          {heading}
          <div className="flex min-w-0 shrink-0 items-center gap-1">
            {buttons}
            {menu}
          </div>
        </div>
      </section>
    );

  return (
    <section
      data-slot="suggestion-card"
      data-state={state}
      data-variant={variant}
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground",
        className,
      )}
      {...props}
    >
      {privateLabel || menu ? (
        <div
          data-slot="suggestion-card-header"
          className="flex min-h-6 min-w-0 items-center justify-between gap-2"
        >
          <span
            data-slot="suggestion-card-private"
            className="min-w-0 text-xs text-muted-foreground wrap-anywhere"
          >
            {privateLabel}
          </span>
          {menu ? (
            <span
              data-slot="suggestion-card-menu"
              className="inline-flex shrink-0"
            >
              {menu}
            </span>
          ) : null}
        </div>
      ) : null}
      {heading}
      {items.length && !expired ? (
        <ul
          data-slot="suggestion-card-items"
          className="flex min-w-0 flex-col gap-1 pointer-coarse:gap-3"
        >
          {items.map((item) => (
            <li
              key={item.id}
              data-slot="suggestion-card-item"
              className="min-w-0"
            >
              <SuggestionItemRow
                item={item}
                disabled={busy}
                onCheckedChange={onItemCheckedChange}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {result}
      {buttons}
      {footnote && !expired ? (
        <p
          data-slot="suggestion-card-footnote"
          className="text-xs text-muted-foreground wrap-anywhere"
        >
          {footnote}
        </p>
      ) : null}
    </section>
  );
}

function SuggestionItemRow({
  item,
  disabled,
  onCheckedChange,
}: {
  item: SuggestionCardItem;
  disabled: boolean;
  onCheckedChange: SuggestionCardProps["onItemCheckedChange"];
}) {
  const text = (
    <>
      <TruncatedText
        data-slot="suggestion-card-item-label"
        focusable={false}
        className="min-w-0 flex-1"
      >
        {item.label}
      </TruncatedText>
      {item.meta != null ? (
        <span
          data-slot="suggestion-card-item-meta"
          className="max-w-1/2 shrink-0 truncate text-xs text-muted-foreground"
        >
          {item.meta}
        </span>
      ) : null}
    </>
  );
  if (item.checked === undefined)
    return (
      <div className="flex min-h-6 min-w-0 items-center gap-2 text-sm">
        {text}
      </div>
    );
  return (
    <label className="flex min-h-6 min-w-0 items-center gap-2 text-sm">
      <Checkbox
        checked={item.checked}
        disabled={disabled}
        onCheckedChange={
          onCheckedChange
            ? (checked) => onCheckedChange(item.id, checked)
            : undefined
        }
      />
      {text}
    </label>
  );
}
