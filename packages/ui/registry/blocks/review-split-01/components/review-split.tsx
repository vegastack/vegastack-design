// @vegastack review-split-01@0.23.0 sha256-wt1IKc9+o+cwsz/8ah+BaOXAsmGp+Afmtk0pe36J/mo=

"use client";

import * as React from "react";

import {
  AudioPlayer,
  type AudioPlayerActions,
} from "@/components/ui/audio-player";
import { Checkbox } from "@/components/ui/checkbox";
import { useContainerWidth } from "@/components/ui/data-table-parts";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Transcript,
  TranscriptList,
  TranscriptSearch,
  type TranscriptSegment,
} from "@/components/ui/transcript";
import { cn } from "@vegastack/design";

import type { ActionItem } from "./sample-meeting";

/** Props for {@link ReviewSplit}. */
export interface ReviewSplitProps {
  /** The summary, one paragraph per point. */
  summary: string[];
  /** The action items; their checked state is the block's own until you wire it. */
  actionItems: ActionItem[];
  /** The transcript segments. */
  segments: TranscriptSegment[];
  /** Speaker id → display name. */
  speakers: Record<string, string>;
  /** The recording's URL, or a function that resolves it on first play. */
  recordingSrc: string | (() => Promise<string>);
  /**
   * The record is still loading: each panel shows a skeleton in its own proportions.
   * @default false
   */
  loading?: boolean;
}

type PanelId = "summary" | "actions" | "transcript";

/** The width (in rem) at which the split turns into tabs — the `@4xl` container size. */
const SPLIT_AT_REM = 56;

function rootFontSize(): number {
  if (typeof window === "undefined") return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/**
 * A review page's two panes from ONE measure. The block measures its own container
 * (`useContainerWidth`) and its layout classes use the same `@4xl/review` container query, so the
 * layout (grid or single column) and the mode (side by side or tabs) switch together — whether the
 * window resized or the sidebar opened. Before the first measurement it assumes narrow, the
 * server-rendered answer.
 *
 * Wide: summary and action items on the left with the docked player at the end of the column —
 * one flex column, so the player sticks to the viewport's bottom edge while the column scrolls —
 * and the transcript in a sticky right pane that scrolls on its own. Narrow: `Tabs` over the SAME
 * three panels. Each panel mounts once and only its tab semantics change, so a checked action item
 * or a transcript search survives a switch.
 *
 * @example
 * <ReviewSplit
 *   summary={SUMMARY}
 *   actionItems={ACTION_ITEMS}
 *   segments={SEGMENTS}
 *   speakers={SPEAKERS}
 *   recordingSrc="/recordings/weekly-sync.mp3"
 * />
 */
export function ReviewSplit({
  summary,
  actionItems,
  segments,
  speakers,
  recordingSrc,
  loading = false,
}: ReviewSplitProps) {
  const [measureRef, width] = useContainerWidth();
  const narrow = width === null || width < SPLIT_AT_REM * rootFontSize();
  const [tab, setTab] = React.useState<PanelId>("summary");
  const [done, setDone] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(actionItems.map((item) => [item.id, item.done])),
  );
  const [time, setTime] = React.useState(0);
  const player = React.useRef<AudioPlayerActions>(null);
  const [media, setMedia] = React.useState<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (!media) return;
    const update = () => setTime(media.currentTime);
    media.addEventListener("timeupdate", update);
    return () => media.removeEventListener("timeupdate", update);
  }, [media]);

  const openCount = actionItems.filter((item) => !done[item.id]).length;

  // In wide mode a panel is a plain region: no tab role, never hidden or inert. The SAME element renders in
  // both modes (only these props change), so nothing inside it remounts on a switch.
  const panelProps = (id: PanelId) =>
    narrow
      ? { "data-slot": "review-split-panel", "data-panel": id }
      : {
          "data-slot": "review-split-panel",
          "data-panel": id,
          role: undefined,
          hidden: false,
          inert: undefined,
          "data-hidden": undefined,
          tabIndex: undefined,
          "aria-labelledby": undefined,
        };

  return (
    <div
      ref={measureRef}
      data-slot="review-split"
      data-mode={narrow ? "narrow" : "wide"}
      className="@container/review min-w-0 [--review-split-offset:4rem]"
    >
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as PanelId)}
        className="grid min-w-0 gap-6 @4xl/review:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] @4xl/review:items-start"
      >
        {narrow ? (
          <TabsList variant="line" aria-label="Meeting">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="actions">
              Action items{" "}
              <span
                aria-hidden="true"
                className="text-muted-foreground tabular-nums"
              >
                {openCount}
              </span>
              <span className="sr-only">{openCount} open</span>
            </TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>
        ) : null}

        {/* The left column is ONE element in wide mode, so the docked player's `sticky bottom-0` has
            the whole column to stick within; narrow, it is `contents` and its panels are the tab grid's
            own rows. */}
        <div
          data-slot="review-split-column"
          className="contents @4xl/review:col-start-1 @4xl/review:row-start-1 @4xl/review:flex @4xl/review:min-w-0 @4xl/review:flex-col @4xl/review:gap-6"
        >
          <TabsContent
            value="summary"
            keepMounted
            className="flex flex-col gap-3"
            {...panelProps("summary")}
          >
            <h2 className="font-heading text-base font-medium">Summary</h2>
            {loading ? (
              <div className="flex flex-col gap-2" aria-hidden>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              summary.map((point) => (
                <p key={point} className="text-sm leading-relaxed">
                  {point}
                </p>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="actions"
            keepMounted
            className="flex flex-col gap-3"
            {...panelProps("actions")}
          >
            <h2 className="font-heading text-base font-medium">
              Action items{" "}
              <span className="font-sans text-muted-foreground tabular-nums">
                {openCount} open
              </span>
            </h2>
            {loading ? (
              <div className="flex flex-col gap-3" aria-hidden>
                {actionItems.map((item) => (
                  <Skeleton key={item.id} className="h-5 w-2/3" />
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {actionItems.map((item) => (
                  <li key={item.id}>
                    <Field orientation="horizontal">
                      <Checkbox
                        checked={done[item.id] ?? false}
                        onCheckedChange={(checked) =>
                          setDone((current) => ({
                            ...current,
                            [item.id]: checked === true,
                          }))
                        }
                      />
                      <FieldContent>
                        <FieldLabel className="font-normal">
                          {item.text}
                        </FieldLabel>
                        <FieldDescription>{item.owner}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* Narrow, the player still closes the page, after whichever panel is showing. */}
          <AudioPlayer
            docked
            label="Meeting recording"
            src={recordingSrc}
            mediaRef={setMedia}
            actionsRef={player}
            className="order-last min-w-0 @4xl/review:order-none"
          />
        </div>

        <TabsContent
          value="transcript"
          keepMounted
          className={cn(
            "flex min-h-0 flex-col gap-3",
            "@4xl/review:sticky @4xl/review:top-(--review-split-offset) @4xl/review:col-start-2 @4xl/review:row-start-1 @4xl/review:max-h-[calc(100dvh-var(--review-split-offset))]",
          )}
          {...panelProps("transcript")}
        >
          <h2 className="font-heading text-base font-medium">Transcript</h2>
          <Transcript
            aria-label="Transcript"
            segments={segments}
            speakerName={(id) => speakers[id] ?? id}
            currentTime={time}
            onSeek={(seconds) => player.current?.seek(seconds, { play: true })}
            loading={loading}
            className="h-[60dvh] min-h-0 rounded-lg border border-border @4xl/review:h-auto @4xl/review:flex-1"
          >
            <TranscriptSearch />
            <TranscriptList />
          </Transcript>
        </TabsContent>
      </Tabs>
    </div>
  );
}
