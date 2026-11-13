// @vegastack composer-meta@0.81.0 sha256-2AAuQYMQRVsyPcrU8/F5Qz4I4llCjxMOqRIwiX/b1ug=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * ComposerMeta — the one quiet line under a chat's composer box: a short privacy note on the left
 * (its full sentence in a tooltip), and on the right Plan, the model and effort, and the chat memory
 * ring. Small muted text, no outlines; each control gets a faint pill on hover. On a narrow screen
 * the privacy note gives way first.
 * ----------------------------------------------------------------------------------------------*/

/** Plan mode's toggle in the line. */
export interface ComposerMetaPlan {
  /** Plan mode is on: the agent plans first and waits for a go-ahead. */
  on: boolean;
  /** Turn it on or off. */
  onToggle: () => void;
  /** Why it can't be turned on here; the toggle stays visible, held, with this as its tooltip. @default undefined */
  disabledReason?: string;
  /** What the toggle does, as its tooltip. @default "Plan first, then wait for your go-ahead" */
  description?: string;
  /** The keys that toggle it, shown in the tooltip ("⇧Tab"). @default undefined */
  shortcut?: string;
}

/** Props accepted by `ComposerMeta`. */
export interface ComposerMetaProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** The short privacy note: "Private · AI can make mistakes". @default undefined */
  privacy?: React.ReactNode;
  /** The note's full sentence, in a tooltip: who can see the chat, and the AI caveat. @default undefined */
  privacyDetail?: React.ReactNode;
  /** The Plan toggle; without it, no Plan. @default undefined */
  plan?: ComposerMetaPlan;
  /** The model and effort: a `ModelEffortMenu` (read-only when the person can't choose). @default undefined */
  model?: React.ReactNode;
  /** The chat memory: a `ContextRing`. @default undefined */
  context?: React.ReactNode;
}

/**
 * `ComposerMeta` — the quiet line under `ChatComposer` (its `meta` prop): the privacy note, then
 * right-aligned Plan, the model with its effort, and the chat memory ring. Plan on reads in the
 * primary ink with a small dot.
 *
 * @example
 * <ChatComposer
 *   meta={
 *     <ComposerMeta
 *       privacy="Private · AI can make mistakes"
 *       privacyDetail="Only you can see this chat. AI can make mistakes; check important info."
 *       plan={{ on: planOn, onToggle: togglePlan }}
 *       model={<ModelEffortMenu {...menu} />}
 *       context={<ContextRing used={25_900} window={200_000} />}
 *     />
 *   }
 * />
 */
export function ComposerMeta({
  privacy,
  privacyDetail,
  plan,
  model,
  context,
  className,
  ...props
}: ComposerMetaProps) {
  const note = privacy ? (
    <span
      data-slot="composer-meta-privacy"
      tabIndex={privacyDetail ? 0 : undefined}
      className="inline-block h-7 min-w-0 truncate rounded-md px-1 leading-7"
    >
      {privacy}
    </span>
  ) : null;
  return (
    <div
      data-slot="composer-meta"
      className={cn(
        "flex min-h-7 min-w-0 items-center gap-2 ps-2 pe-1 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      {note && privacyDetail ? (
        <Tooltip>
          <TooltipTrigger render={note} />
          <TooltipContent className="max-w-80">{privacyDetail}</TooltipContent>
        </Tooltip>
      ) : (
        note
      )}
      <div
        data-slot="composer-meta-controls"
        className="ms-auto flex min-w-0 shrink-0 items-center gap-0.5"
      >
        {plan ? <PlanToggle plan={plan} /> : null}
        {model ? (
          <span
            data-slot="composer-meta-model"
            className="flex min-w-0 items-center"
          >
            {model}
          </span>
        ) : null}
        {context ? (
          <span
            data-slot="composer-meta-context"
            className="flex shrink-0 items-center"
          >
            {context}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function PlanToggle({ plan }: { plan: ComposerMetaPlan }) {
  const held = !!plan.disabledReason && !plan.on;
  const tip =
    plan.disabledReason && !plan.on
      ? plan.disabledReason
      : (plan.description ?? "Plan first, then wait for your go-ahead");
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            aria-pressed={plan.on}
            aria-disabled={held || undefined}
            aria-keyshortcuts={plan.shortcut}
            data-slot="composer-meta-plan"
            data-on={plan.on ? "" : undefined}
            onClick={() => {
              if (!held) plan.onToggle();
            }}
            className={cn(
              "h-7 gap-1.5 rounded-md px-2 text-xs font-normal",
              plan.on
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
              held && "opacity-60",
            )}
          />
        }
      >
        {plan.on ? (
          <span
            aria-hidden
            data-slot="composer-meta-plan-dot"
            className="size-1.5 shrink-0 animate-in rounded-full bg-primary duration-quick ease-enter zoom-in-75"
          />
        ) : null}
        Plan
      </TooltipTrigger>
      <TooltipContent>
        {tip}
        {plan.shortcut && !held ? (
          <span className="text-muted-foreground"> · {plan.shortcut}</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
