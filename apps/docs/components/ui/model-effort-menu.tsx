// @vegastack model-effort-menu@0.81.0 sha256-ESi2dVnBs0qHK7gRT8T0mQ5v8itKCal5ziTQNawfmWw=

"use client";

import * as React from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import {
  ChatMenu,
  ChatMenuItem,
  ChatMenuSeparator,
  ChatMenuSub,
} from "@/components/ui/chat-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * ModelEffortMenu — the model and its effort, as quiet text under a chat's composer ("Sonnet 5.5
 * Medium ▾"), opening one compact menu: the models with a primary ✓ and a number shortcut sharing
 * the right slot, then "Effort  Medium ›" (only the levels the chosen model supports, Recommended on
 * its default, a usage warning on Max), then "More models ›" with the ones this person can't use,
 * muted, "Off · ask an admin". No detail pane: a model's purpose is a tooltip.
 * ----------------------------------------------------------------------------------------------*/

/** How hard the model thinks: higher thinks longer and uses more of the limit. */
export type EffortLevel = "low" | "medium" | "high" | "max";

/** One model in the menu. */
export interface ModelOption {
  /** The model's id, passed to `onModel`. */
  id: string;
  /** Its name: "Sonnet 5.5". */
  label: string;
  /** A one-line purpose, as a tooltip on hover: "Everyday work". @default undefined */
  description?: string;
  /** This person may pick it here. Only `moreModels` may hold unavailable ones, listed muted. */
  available: boolean;
  /** Why it's unavailable. @default "Off · ask an admin" */
  offReason?: string;
}

/** The menu's words. */
export interface ModelEffortMenuLabels {
  /** The Effort row. @default "Effort" */
  effort?: string;
  /** The line at the top of the Effort submenu. @default "Higher effort thinks longer and uses more of your limit. For this chat." */
  effortNote?: string;
  /** Each level's name. @default Low, Medium, High, Max */
  levels?: Partial<Record<EffortLevel, string>>;
  /** The pill on the model's default level. @default "Recommended" */
  recommended?: string;
  /** The More models row. @default "More models" */
  moreModels?: string;
  /** An unavailable model's line. @default "Off · ask an admin" */
  off?: string;
  /** The trigger's accessible name. @default (model, effort) => `Model: ${model}${effort ? `, effort ${effort}` : ""}` */
  trigger?: (model: string, effort: string | undefined) => string;
}

/** Props accepted by `ModelEffortMenu`. */
export interface ModelEffortMenuProps {
  /** The models listed first, each with a number shortcut (1–9). */
  models: readonly ModelOption[];
  /** The rest, under More models; unavailable ones are muted. @default [] */
  moreModels?: readonly ModelOption[];
  /** The chat's model. */
  modelId: string;
  /** A model was picked. @default undefined */
  onModel?: (id: string) => void;
  /** The levels the chosen model supports, lowest first; none hides the Effort row. @default [] */
  efforts?: readonly EffortLevel[];
  /** The model's default level, marked Recommended. @default undefined */
  recommended?: EffortLevel;
  /** The chat's level. @default recommended */
  effort?: EffortLevel;
  /** A level was picked. @default undefined */
  onEffort?: (effort: EffortLevel) => void;
  /**
   * Beside Max, in the warning ink: "about 3× usage" once measured, else "uses more of your limit".
   * @default "uses more of your limit"
   */
  maxWarning?: string;
  /**
   * The keys work while the page has focus: ⌘⇧I (Ctrl+Shift+I) opens the menu, ⌘⇧E (Ctrl+Shift+E)
   * opens it at Effort. Turn on for the one composer on screen. @default false
   */
  shortcuts?: boolean;
  /**
   * The person can't choose here: the same words as plain text, with this reason as a tooltip
   * ("Set on the agent"). @default undefined
   */
  readOnly?: string;
  /** Controlled open state. @default undefined */
  open?: boolean;
  /** Called when the menu opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** The menu's words. @default undefined */
  labels?: ModelEffortMenuLabels;
  /** Extra classes on the trigger. @default undefined */
  className?: string;
}

const LEVELS: Record<EffortLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  max: "Max",
};

const TRIGGER =
  "h-7 min-w-0 gap-1 rounded-md px-2 text-xs font-normal text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3";

/** Is this a Mac (⌘) or everything else (Ctrl)? */
const isMac = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * `ModelEffortMenu` — the model and effort as quiet text ("Sonnet 5.5 Medium ▾") that opens one
 * compact menu: models with number shortcuts, an Effort submenu with only the chosen model's levels,
 * and More models. With `readOnly`, the same words without a menu.
 *
 * @example
 * <ModelEffortMenu
 *   models={[
 *     { id: "sonnet", label: "Sonnet 5.5", description: "Everyday work", available: true },
 *     { id: "opus", label: "Opus 5.5", description: "Hard problems", available: true },
 *   ]}
 *   moreModels={[{ id: "gpt", label: "GPT-6", available: false }]}
 *   modelId="sonnet"
 *   onModel={setModel}
 *   efforts={["low", "medium", "high", "max"]}
 *   recommended="medium"
 *   effort={effort}
 *   onEffort={setEffort}
 *   shortcuts
 * />
 */
export function ModelEffortMenu({
  models,
  moreModels = [],
  modelId,
  onModel,
  efforts = [],
  recommended,
  effort: effortProp,
  onEffort,
  maxWarning,
  shortcuts = false,
  readOnly,
  open: openProp,
  onOpenChange,
  labels,
  className,
}: ModelEffortMenuProps) {
  const [ownOpen, setOwnOpen] = React.useState(false);
  const open = openProp ?? ownOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOwnOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const [effortOpen, setEffortOpen] = React.useState(false);

  const model =
    models.find((m) => m.id === modelId) ??
    moreModels.find((m) => m.id === modelId);
  const effort =
    effortProp && efforts.includes(effortProp) ? effortProp : recommended;
  const levelName = (level: EffortLevel) =>
    labels?.levels?.[level] ?? LEVELS[level];
  const modelName = model?.label ?? modelId;
  const effortName =
    efforts.length > 0 && effort ? levelName(effort) : undefined;
  const name =
    labels?.trigger?.(modelName, effortName) ??
    `Model: ${modelName}${effortName ? `, effort ${effortName}` : ""}`;

  const words = (
    <>
      <span className="min-w-0 truncate text-foreground">{modelName}</span>
      {effortName ? <span className="shrink-0">{effortName}</span> : null}
    </>
  );

  // ⌘⇧I opens the menu; ⌘⇧E opens it at Effort and puts focus on the chat's level.
  React.useEffect(() => {
    if (!shortcuts || readOnly) return;
    const onKey = (event: KeyboardEvent) => {
      const mod = isMac() ? event.metaKey : event.ctrlKey;
      if (!mod || !event.shiftKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "i") {
        event.preventDefault();
        setEffortOpen(false);
        setOpen(!open);
      } else if (key === "e" && efforts.length > 0) {
        event.preventDefault();
        setOpen(true);
        setEffortOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts, readOnly, open, setOpen, efforts.length]);

  // Opened at Effort by its key: focus lands on the chat's level, so numbers and arrows work there.
  React.useEffect(() => {
    if (!open || !effortOpen) return;
    const frame = requestAnimationFrame(() => {
      // Effort is the only submenu open at this point.
      const sub = document.querySelector<HTMLElement>(
        "[data-slot=chat-menu-sub-content]",
      );
      const target =
        sub?.querySelector<HTMLElement>(
          "[data-slot=chat-menu-item][data-selected]",
        ) ?? sub?.querySelector<HTMLElement>("[data-slot=chat-menu-item]");
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, effortOpen]);

  if (readOnly) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              aria-label={name}
              data-slot="model-effort-menu"
              data-readonly=""
              className={cn(
                "inline-flex h-7 min-w-0 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground",
                className,
              )}
            />
          }
        >
          {words}
        </TooltipTrigger>
        <TooltipContent>{readOnly}</TooltipContent>
      </Tooltip>
    );
  }

  const pick = (id: string) => onModel?.(id);
  const off = labels?.off ?? "Off · ask an admin";
  const chosenMore = moreModels.find((m) => m.id === modelId);
  const keys = isMac() ? "⌘⇧I" : "Ctrl+Shift+I";

  return (
    <ChatMenu
      side="top"
      align="end"
      open={open}
      onOpenChange={(next) => {
        if (!next) setEffortOpen(false);
        setOpen(next);
      }}
      className="min-w-48"
      trigger={
        <Button
          variant="ghost"
          size="sm"
          aria-label={name}
          aria-keyshortcuts={
            shortcuts
              ? isMac()
                ? "Meta+Shift+I"
                : "Control+Shift+I"
              : undefined
          }
          title={shortcuts ? keys : undefined}
          data-slot="model-effort-menu"
          className={cn(TRIGGER, className)}
        >
          {words}
          <ChevronDown aria-hidden className="shrink-0" />
        </Button>
      }
    >
      {models.map((option, index) => (
        <ChatMenuItem
          key={option.id}
          selected={option.id === modelId}
          shortcut={index < 9 ? String(index + 1) : undefined}
          description={option.description}
          onSelect={() => pick(option.id)}
        >
          {option.label}
        </ChatMenuItem>
      ))}
      {efforts.length > 0 ? (
        <>
          <ChatMenuSeparator />
          <ChatMenuSub
            label={labels?.effort ?? "Effort"}
            value={effortName}
            open={effortOpen}
            onOpenChange={setEffortOpen}
            note={
              labels?.effortNote ??
              "Higher effort thinks longer and uses more of your limit. For this chat."
            }
          >
            {efforts.map((level) => (
              <ChatMenuItem
                key={level}
                selected={level === effort}
                onSelect={() => onEffort?.(level)}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span>{levelName(level)}</span>
                  {level === recommended ? (
                    <span
                      data-slot="model-effort-menu-recommended"
                      className="rounded-full border border-border px-1.5 text-xs leading-4 text-muted-foreground"
                    >
                      {labels?.recommended ?? "Recommended"}
                    </span>
                  ) : null}
                  {level === "max" ? (
                    <span
                      data-slot="model-effort-menu-warning"
                      className="inline-flex items-center gap-1 text-xs text-warning-text"
                    >
                      <TriangleAlert aria-hidden className="size-3" />
                      {maxWarning ?? "uses more of your limit"}
                    </span>
                  ) : null}
                </span>
              </ChatMenuItem>
            ))}
          </ChatMenuSub>
        </>
      ) : null}
      {moreModels.length > 0 ? (
        <>
          <ChatMenuSeparator />
          <ChatMenuSub
            label={labels?.moreModels ?? "More models"}
            value={chosenMore?.label}
          >
            {moreModels.map((option) => (
              <ChatMenuItem
                key={option.id}
                selected={option.id === modelId}
                description={option.description}
                disabled={!option.available}
                muted={!option.available}
                hint={option.available ? undefined : (option.offReason ?? off)}
                onSelect={option.available ? () => pick(option.id) : undefined}
              >
                {option.label}
              </ChatMenuItem>
            ))}
          </ChatMenuSub>
        </>
      ) : null}
    </ChatMenu>
  );
}
