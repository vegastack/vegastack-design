// @vegastack agent-edit-banner@0.33.0 sha256-CvY24UXNm1EBEnnpeXmmb+e2wWV76oGlwOisj6ZoLmw=

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  PersonAvatar,
  personDisplayName,
  type Person,
} from "@/components/ui/person-avatar";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeTime } from "@/components/ui/relative-time";

/* ------------------------------------------------------------------------------------------------
 * AgentEditBanner — the strip pinned under a document's header after an agent changed it: the
 * agent's purple bot, "Edited by Claude (for Manoj) · 3 changes · 2m ago", View changes, Approve,
 * Undo this agent's changes and a dismiss ✕. Presentational: the host owns the runs, the undo, the
 * approval, the refusal and the dismiss memory, and passes the state back. Which buttons show is decided by the
 * callbacks passed, so a read-only viewer (no callbacks) gets the words and the ✕ only.
 * ----------------------------------------------------------------------------------------------*/

/** The agent a banner names: `name` is the short form ("Claude"), `via` its owner ("Manoj"). */
export type AgentEditBannerAgent = Pick<Person, "name" | "via" | "image">;

/**
 * Where the banner's actions stand. `idle` — View changes, Approve and Undo; `undoing` — Undo shows
 * a spinner and every action is disabled; `approving` — the same, with the spinner on Approve;
 * `refused` — the undo could not run: the reason line, then View changes, Approve and Open
 * versions.
 */
export type AgentEditBannerStatus =
  "idle" | "undoing" | "approving" | "refused";

/** What the agent did: changed the document, or created it. */
export type AgentEditBannerKind = "edited" | "created";

/** Every string the banner renders or names a control with. */
export interface AgentEditBannerLabels {
  /** The lead of an edit: "Edited by Claude (for Manoj)". */
  edited: (agent: string) => string;
  /** The lead of a creation: "Created by Claude (for Manoj)". */
  created: (agent: string) => string;
  /** The change count: "3 changes". */
  changes: (count: number) => string;
  /** The View changes button. */
  viewChanges: string;
  /** View changes' accessible name: "View Claude (for Manoj)'s changes". */
  viewChangesName: (agent: string) => string;
  /** The Undo button. */
  undo: string;
  /** The Undo button in a narrow banner (under a 24rem container). */
  undoShort: string;
  /** Undo's accessible name: "Undo Claude (for Manoj)'s changes". */
  undoName: (agent: string) => string;
  /** The Approve button (the banner's and each row's in "+N more agents"). */
  approve: string;
  /** Approve's accessible name: "Approve Claude (for Manoj)'s changes". */
  approveName: (agent: string) => string;
  /** The Open versions button (refused). */
  openVersions: string;
  /** The ✕ button's accessible name. */
  dismiss: string;
  /** The refused line; `agentShort` is the agent's `name` ("Claude"). */
  refused: (agentShort: string) => string;
  /** The trigger that lists the other agents: "+1 more agent". */
  moreAgents: (count: number) => string;
  /** The heading of that list. */
  moreAgentsTitle: string;
  /** The Undo button on a row of that list. */
  moreUndo: string;
}

const DEFAULT_LABELS: AgentEditBannerLabels = {
  edited: (agent) => `Edited by ${agent}`,
  created: (agent) => `Created by ${agent}`,
  changes: (count) => (count === 1 ? "1 change" : `${count} changes`),
  viewChanges: "View changes",
  viewChangesName: (agent) => `View ${agent}'s changes`,
  undo: "Undo this agent's changes",
  undoShort: "Undo changes",
  undoName: (agent) => `Undo ${agent}'s changes`,
  approve: "Approve",
  approveName: (agent) => `Approve ${agent}'s changes`,
  openVersions: "Open versions",
  dismiss: "Dismiss",
  refused: (agentShort) =>
    `Couldn't undo only ${agentShort}'s changes because people edited the page since.`,
  moreAgents: (count) =>
    count === 1 ? "+1 more agent" : `+${count} more agents`,
  moreAgentsTitle: "More agents",
  moreUndo: "Undo",
};

/** Another agent listed behind the banner's "+N more agents", each with its own Undo. */
export interface AgentEditBannerMoreAgent {
  /** A stable key. */
  id: string;
  /** The agent. */
  agent: AgentEditBannerAgent;
  /** Edited or created. @default "edited" */
  kind?: AgentEditBannerKind;
  /** How many changes it made; omit to leave the count out. @default undefined */
  changeCount?: number;
  /** When it last changed the document. */
  at: Date | string | number;
  /**
   * Where its actions stand; `undoing`/`approving` spin that button and disable both, `refused`
   * shows the reason in place of Undo. @default "idle"
   */
  status?: AgentEditBannerStatus;
  /** The refused line in place of the default. @default labels.refused(agent.name) */
  refusedReason?: React.ReactNode;
  /** Undo this agent's changes; the row's Undo shows when set. @default undefined */
  onUndo?: () => void;
  /**
   * Approve this agent's changes (they are fine as they are); the row's Approve shows when set.
   * The host stores the approval. @default undefined
   */
  onApprove?: () => void;
}

/** Props for `AgentEditBanner`. */
export interface AgentEditBannerProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** The agent: `{ name: "Claude", via: "Manoj" }` reads "Claude (for Manoj)". */
  agent: AgentEditBannerAgent;
  /** Edited the document ("· 3 changes"), or created it. @default "edited" */
  kind?: AgentEditBannerKind;
  /** How many changes, after the name; omit to leave the count out. @default undefined */
  changeCount?: number;
  /** When the agent last changed (or created) the document. */
  at: Date | string | number;
  /** Where the actions stand (`AgentEditBannerStatus`). @default "idle" */
  status?: AgentEditBannerStatus;
  /**
   * The line `refused` shows, in place of "Couldn't undo only Claude's changes because people
   * edited the page since." — for another reason, such as a restore. @default labels.refused(agent.name)
   */
  refusedReason?: React.ReactNode;
  /** Open the diff of the agent's changes; View changes shows when set. @default undefined */
  onViewChanges?: () => void;
  /** Undo the agent's changes; Undo shows when set, except while `refused`. @default undefined */
  onUndo?: () => void;
  /**
   * Approve the agent's changes — the viewer has checked them and they stay; Approve shows when
   * set, beside Undo. The banner keeps no memory of it: the host stores the approval and stops
   * rendering the banner (or passes `status="approving"` while it saves). @default undefined
   */
  onApprove?: () => void;
  /** Open the version history; Open versions shows when set and `refused`. @default undefined */
  onOpenVersions?: () => void;
  /** Dismiss the banner for this viewer; the ✕ shows when set. @default undefined */
  onDismiss?: () => void;
  /** The other agents, behind "+N more agents" at the line's end. @default [] */
  moreAgents?: readonly AgentEditBannerMoreAgent[];
  /** Replace any of the strings (`AgentEditBannerLabels`). @default undefined */
  labels?: Partial<AgentEditBannerLabels>;
  /** Pin the relative times' clock (docs, tests). @default undefined */
  now?: number;
}

/** The agent as a `Person`, so the avatar draws the purple bot. */
function asPerson(agent: AgentEditBannerAgent) {
  return { ...agent, kind: "agent" as const };
}

/** "Edited by Claude (for Manoj) · 3 changes · 2m ago". */
function Summary({
  agent,
  kind,
  changeCount,
  at,
  now,
  labels,
  children,
}: {
  agent: AgentEditBannerAgent;
  kind: AgentEditBannerKind;
  changeCount: number | undefined;
  at: Date | string | number;
  now: number | undefined;
  labels: AgentEditBannerLabels;
  children?: React.ReactNode;
}) {
  const label = personDisplayName(asPerson(agent));
  return (
    <>
      <span className="text-foreground">
        {kind === "created" ? labels.created(label) : labels.edited(label)}
      </span>
      {kind === "edited" && changeCount != null ? (
        <>
          {" "}
          <span aria-hidden>·</span> {labels.changes(changeCount)}
        </>
      ) : null}{" "}
      <span aria-hidden>·</span>{" "}
      {/* The label ticks every minute; inside the polite region it must not be re-announced. */}
      <RelativeTime date={at} now={now} aria-live="off" />
      {children}
    </>
  );
}

/**
 * `AgentEditBanner` — the strip under a document's header after an agent changed it: the agent's
 * purple bot, "Edited by Claude (for Manoj) · 3 changes · 2m ago", View changes, Approve and "Undo
 * this agent's changes", and a ✕. `status="undoing"` spins Undo and `"approving"` spins Approve,
 * each disabling every action; `refused` adds the reason line and swaps Undo for Open versions. The callbacks decide which buttons show: none for
 * a read-only viewer, no Undo or View changes when the agent's checkpoint is gone. `kind="created"`
 * reads "Created by Claude (for Manoj) · 5m ago". `moreAgents` ends the line with "+1 more agent",
 * a popover listing the rest, each with its own Undo. Under a 42rem container the buttons move to
 * their own row; the banner is a polite live region.
 *
 * @example
 * <AgentEditBanner
 *   agent={{ name: "Claude", via: "Manoj" }}
 *   changeCount={3}
 *   at={run.lastWriteAt}
 *   status={undoing ? "undoing" : "idle"}
 *   onViewChanges={() => openDiff(run.checkpointId)}
 *   onApprove={() => approveAgentChanges(run.ids)}
 *   onUndo={() => undoAgentChanges(run.connectionId)}
 *   onDismiss={() => dismiss(run.ids)}
 * />
 */
export function AgentEditBanner({
  agent,
  kind = "edited",
  changeCount,
  at,
  status = "idle",
  refusedReason,
  onViewChanges,
  onUndo,
  onApprove,
  onOpenVersions,
  onDismiss,
  moreAgents = [],
  labels: labelsProp,
  now,
  className,
  ...props
}: AgentEditBannerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const agentLabel = personDisplayName(asPerson(agent));
  const refused = status === "refused";
  const undoing = status === "undoing";
  const approving = status === "approving";
  // Either one running holds every action: an approval and an undo never race.
  const busy = undoing || approving;
  const showUndo = !!onUndo && !refused;
  const showOpenVersions = !!onOpenVersions && refused;
  const hasActions =
    !!onViewChanges || !!onApprove || showUndo || showOpenVersions;
  const dismissible = !!onDismiss;

  return (
    <Alert
      data-slot="agent-edit-banner"
      data-status={status}
      data-kind={kind}
      aria-live="polite"
      className={cn(
        "items-start gap-x-2.5 gap-y-2",
        dismissible
          ? "grid-cols-[auto_minmax(0,1fr)_auto]"
          : "grid-cols-[auto_minmax(0,1fr)]",
        hasActions &&
          (dismissible
            ? "@2xl/alert:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
            : "@2xl/alert:grid-cols-[auto_minmax(0,1fr)_auto]"),
        className,
      )}
      {...props}
    >
      <PersonAvatar
        person={asPerson(agent)}
        aria-hidden
        className="col-start-1 row-start-1 mt-0.5"
      />
      <div
        data-slot="agent-edit-banner-body"
        className="col-start-2 row-start-1 flex min-w-0 flex-col gap-0.5"
      >
        <p
          data-slot="agent-edit-banner-summary"
          className="min-h-7 content-center text-muted-foreground wrap-break-word"
        >
          <Summary
            agent={agent}
            kind={kind}
            changeCount={changeCount}
            at={at}
            now={now}
            labels={labels}
          >
            {moreAgents.length > 0 ? (
              <>
                {" "}
                <span aria-hidden>·</span>{" "}
                <MoreAgents agents={moreAgents} labels={labels} now={now} />
              </>
            ) : null}
          </Summary>
        </p>
        {refused ? (
          <p
            data-slot="agent-edit-banner-reason"
            className="text-foreground wrap-break-word"
          >
            {refusedReason ?? labels.refused(agent.name)}
          </p>
        ) : null}
      </div>
      {hasActions ? (
        <div
          data-slot="agent-edit-banner-actions"
          className="col-span-full row-start-2 flex flex-wrap items-center gap-2 @2xl/alert:col-span-1 @2xl/alert:col-start-3 @2xl/alert:row-start-1 @2xl/alert:flex-nowrap"
        >
          {onViewChanges ? (
            <Button
              variant="outline"
              size="sm"
              aria-label={labels.viewChangesName(agentLabel)}
              disabled={busy}
              onClick={onViewChanges}
            >
              {labels.viewChanges}
            </Button>
          ) : null}
          {onApprove ? (
            <Button
              data-slot="agent-edit-banner-approve"
              variant="outline"
              size="sm"
              aria-label={labels.approveName(agentLabel)}
              loading={approving}
              disabled={undoing}
              onClick={onApprove}
            >
              {labels.approve}
            </Button>
          ) : null}
          {showUndo ? (
            <Button
              variant="outline"
              size="sm"
              aria-label={labels.undoName(agentLabel)}
              loading={undoing}
              disabled={approving}
              onClick={onUndo}
            >
              <span className="@sm/alert:hidden">{labels.undoShort}</span>
              <span className="hidden @sm/alert:inline">{labels.undo}</span>
            </Button>
          ) : null}
          {showOpenVersions ? (
            <Button variant="outline" size="sm" onClick={onOpenVersions}>
              {labels.openVersions}
            </Button>
          ) : null}
        </div>
      ) : null}
      {dismissible ? (
        <Button
          data-slot="agent-edit-banner-dismiss"
          variant="ghost"
          size="icon-sm"
          aria-label={labels.dismiss}
          onClick={onDismiss}
          className={cn(
            "col-start-3 row-start-1",
            hasActions && "@2xl/alert:col-start-4",
          )}
        >
          <X />
        </Button>
      ) : null}
    </Alert>
  );
}

/** "+1 more agent": a popover listing the other agents, each with its own Approve and Undo. */
function MoreAgents({
  agents,
  labels,
  now,
}: {
  agents: readonly AgentEditBannerMoreAgent[];
  labels: AgentEditBannerLabels;
  now: number | undefined;
}) {
  return (
    <Popover>
      <PopoverTrigger
        data-slot="agent-edit-banner-more"
        render={
          <Button
            variant="link"
            size="xs"
            className="px-0 align-baseline text-sm font-normal underline underline-offset-4"
          />
        }
      >
        {labels.moreAgents(agents.length)}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[var(--available-height)] w-80 overflow-y-auto"
      >
        <PopoverHeader>
          <PopoverTitle>{labels.moreAgentsTitle}</PopoverTitle>
        </PopoverHeader>
        <ul
          data-slot="agent-edit-banner-more-list"
          className="flex flex-col gap-2"
        >
          {agents.map((item) => {
            const label = personDisplayName(asPerson(item.agent));
            const itemStatus = item.status ?? "idle";
            return (
              <li
                key={item.id}
                data-slot="agent-edit-banner-more-item"
                data-status={itemStatus}
                className="flex min-w-0 items-start gap-2"
              >
                <PersonAvatar
                  person={asPerson(item.agent)}
                  aria-hidden
                  className="mt-0.5"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-muted-foreground wrap-break-word">
                    <Summary
                      agent={item.agent}
                      kind={item.kind ?? "edited"}
                      changeCount={item.changeCount}
                      at={item.at}
                      now={now}
                      labels={labels}
                    />
                  </p>
                  {itemStatus === "refused" ? (
                    <p className="text-xs text-muted-foreground">
                      {item.refusedReason ?? labels.refused(item.agent.name)}
                    </p>
                  ) : null}
                </div>
                {item.onApprove || (item.onUndo && itemStatus !== "refused") ? (
                  <div
                    data-slot="agent-edit-banner-more-actions"
                    className="flex shrink-0 items-center gap-2"
                  >
                    {item.onApprove ? (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={labels.approveName(label)}
                        loading={itemStatus === "approving"}
                        disabled={itemStatus === "undoing"}
                        onClick={item.onApprove}
                      >
                        {labels.approve}
                      </Button>
                    ) : null}
                    {item.onUndo && itemStatus !== "refused" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={labels.undoName(label)}
                        loading={itemStatus === "undoing"}
                        disabled={itemStatus === "approving"}
                        onClick={item.onUndo}
                      >
                        {labels.moreUndo}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
