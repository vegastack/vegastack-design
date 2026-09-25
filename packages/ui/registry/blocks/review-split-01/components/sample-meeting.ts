// @vegastack review-split-01@0.23.27 sha256-QQBT9j0NuReksDhUdTEcuGi/AUdA9Th+ScuiVjQ1eGM=

/**
 * Sample data for `review-split-01`: one meeting's summary, action items and transcript. Replace it
 * with your own record; the shapes are the ones `ReviewSplit` reads.
 */

import type { TranscriptSegment } from "@/components/ui/transcript";

/** One action item from the meeting. */
export interface ActionItem {
  id: string;
  text: string;
  owner: string;
  done: boolean;
}

/** People who spoke, by speaker id. */
export const SPEAKERS: Record<string, string> = {
  ana: "Ana Ruiz",
  raj: "Raj Patel",
  mei: "Mei Chen",
};

/** The meeting's summary, one paragraph per point. */
export const SUMMARY: string[] = [
  "Marketing came in under plan because two events moved online, and online registrations were up by about a third.",
  "The team agreed to keep one event online next quarter, once the regional teams have weighed in.",
  "Support has two open roles; the first interviews are next week, and the event savings cover both offers.",
];

/** What the meeting agreed someone would do. */
export const ACTION_ITEMS: ActionItem[] = [
  {
    id: "a1",
    text: "Send the regional teams the event numbers",
    owner: "Raj Patel",
    done: false,
  },
  {
    id: "a2",
    text: "Collect regional answers by Friday",
    owner: "Raj Patel",
    done: false,
  },
  {
    id: "a3",
    text: "Confirm the support hiring budget with finance",
    owner: "Raj Patel",
    done: true,
  },
  {
    id: "a4",
    text: "Schedule the first support interviews",
    owner: "Mei Chen",
    done: false,
  },
];

const LINES: Array<[string, string]> = [
  ["ana", "Thanks for joining. Let’s start with the quarterly budget review."],
  [
    "raj",
    "Marketing came in under plan, mostly because two events moved online.",
  ],
  ["mei", "Did the online events reach the same number of people?"],
  ["raj", "More, actually. Registrations were up by about a third."],
  ["ana", "Then we should keep one of them online next quarter as well."],
  ["mei", "Agreed. I’d like the regional teams to weigh in before we decide."],
  ["raj", "I can send them the numbers today and collect answers by Friday."],
  ["ana", "Good. Next item: the hiring plan for the support team."],
  ["mei", "We have two open roles, and the first interviews are next week."],
  ["ana", "Let’s make sure the budget covers both before we make offers."],
  ["raj", "It does, with the savings from events. I’ll confirm with finance."],
  ["ana", "Great. That’s everything on the list. Thanks, everyone."],
];

/** The transcript, about seven seconds a line. */
export const SEGMENTS: TranscriptSegment[] = LINES.map(
  ([speaker, text], index) => ({
    id: `line-${index + 1}`,
    start: index * 7.5,
    speaker,
    text,
  }),
);

/** Where the recording is served from. */
export const RECORDING_SRC = "/recordings/weekly-sync.mp3";
