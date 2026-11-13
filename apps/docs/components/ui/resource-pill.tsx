// @vegastack resource-pill@0.81.0 sha256-Q0o46wOYVet7bC+snVDQlSNyn9ZsHZcR9+j8Z8nMJFM=

"use client";

import * as React from "react";
import {
  BookMarked,
  CalendarDays,
  CircleDot,
  File,
  FileText,
  Folder,
  GitPullRequest,
  Hash,
  Link2,
  Mail,
  MessageSquare,
  Presentation,
  Sheet,
  Video,
} from "lucide-react";

import {
  InlineChip,
  InlineChipPreview,
  InlineChipProvider,
  useInlineChipResolver,
  type InlineChipKindConfig,
  type InlineChipResolver,
} from "@/components/ui/inline-chip";
import { linkAction, useLinkProvider } from "@/components/ui/link-provider";

/* ------------------------------------------------------------------------------------------------
 * ResourcePill — something of the person's own that an agent touched: a Google Doc, Sheet or
 * Slides deck, a Drive file, a Meet call, a calendar event, a GitHub pull request, issue or repo,
 * a Slack message or channel, an email thread or draft, a workspace record. It reads as the thing
 * itself — its type's icon and its real title — and opens it. It is never numbered and never
 * listed under Sources: those are web pages the answer cites (`SourceList`).
 *
 * It is an `InlineChip`, so it sits on the text's baseline at the text's size like every other
 * reference in running text, neutral, told apart by its icon. Hovering shows what it is ("Google
 * Doc") over the title and its second line ("Today 15:00", "#sales").
 * ----------------------------------------------------------------------------------------------*/

/** What a resource is: the connector's own kinds, the server's `ResourceKind` twin. */
export type ResourceKind =
  | "drive_file"
  | "folder"
  | "doc"
  | "sheet"
  | "slides"
  | "meet"
  | "calendar_event"
  | "github_pr"
  | "github_issue"
  | "github_repo"
  | "slack_message"
  | "slack_channel"
  | "gmail_thread"
  | "gmail_draft"
  | "record";

/** A thing a connector tool returned or made, as the chat draws it (a `data-resource` part's data). */
export interface ResourceRef {
  /** What it is: picks the icon and the word in the hover card. */
  kind: ResourceKind;
  /** Where it opens: another site opens in a new tab, an in-app path in place. */
  url: string;
  /** Its real title, as people wrote it: "Q3 pricing", "Weekly sync". */
  title: string;
  /** The service's own id (a Drive file id, an event id, `owner/repo#12`). @default undefined */
  externalId?: string;
  /** A Drive file's type: its icon follows it. @default undefined */
  mimeType?: string;
  /** A short second line in the hover card: "Today 15:00", "#sales". @default undefined */
  meta?: string;
}

/** Each kind's icon and word. A Drive file's icon follows its type (`mimeType`). */
const KINDS: Record<ResourceKind, { icon: React.ReactElement; noun: string }> =
  {
    drive_file: { icon: <File />, noun: "Drive file" },
    folder: { icon: <Folder />, noun: "Drive folder" },
    doc: { icon: <FileText />, noun: "Google Doc" },
    sheet: { icon: <Sheet />, noun: "Google Sheet" },
    slides: { icon: <Presentation />, noun: "Google Slides" },
    meet: { icon: <Video />, noun: "Google Meet" },
    calendar_event: { icon: <CalendarDays />, noun: "Calendar event" },
    github_pr: { icon: <GitPullRequest />, noun: "Pull request" },
    github_issue: { icon: <CircleDot />, noun: "GitHub issue" },
    github_repo: { icon: <BookMarked />, noun: "GitHub repository" },
    slack_message: { icon: <MessageSquare />, noun: "Slack message" },
    slack_channel: { icon: <Hash />, noun: "Slack channel" },
    gmail_thread: { icon: <Mail />, noun: "Email" },
    gmail_draft: { icon: <Mail />, noun: "Email draft" },
    record: { icon: <Link2 />, noun: "Item" },
  };

/** A Drive file's kind by its type: a Doc, Sheet or deck is named as one. */
function kindOf(ref: ResourceRef): ResourceKind {
  if (ref.kind !== "drive_file" || !ref.mimeType) return ref.kind;
  const type = ref.mimeType.toLowerCase();
  if (type === "application/vnd.google-apps.document") return "doc";
  if (type === "application/vnd.google-apps.spreadsheet") return "sheet";
  if (type === "application/vnd.google-apps.presentation") return "slides";
  if (type === "application/vnd.google-apps.folder") return "folder";
  return "drive_file";
}

/** The word for a resource's kind, as its hover card says it ("Google Doc"). */
export function resourceNoun(ref: Pick<ResourceRef, "kind" | "mimeType">) {
  return KINDS[kindOf(ref as ResourceRef)]?.noun ?? KINDS.record.noun;
}

const CHIP_KINDS: Readonly<Record<string, InlineChipKindConfig>> =
  Object.fromEntries(
    Object.entries(KINDS).map(([kind, config]) => [`resource:${kind}`, config]),
  );

/** Props accepted by `ResourcePill`. */
export interface ResourcePillProps {
  /** The thing: its kind, link and title. */
  data: ResourceRef;
  /** Extra classes on the chip. @default undefined */
  className?: string;
}

/**
 * The person's own thing in an answer — its type's icon and its real title, opening it (another
 * site in a new tab). Never a numbered source.
 *
 * @example
 * <ResourcePill data={{ kind: "doc", url: "https://docs.google.com/document/d/1x", title: "Q3 pricing" }} />
 *
 * @example
 * <ResourcePill data={{ kind: "meet", url: "https://meet.google.com/abc-defg-hij", title: "Weekly sync", meta: "Thu 15:00" }} />
 */
export function ResourcePill({ data, className }: ResourcePillProps) {
  const parent = useInlineChipResolver();
  // The host's resolver, with the resource kinds added. A resource is a link: the host's
  // `onOpen` (a file in the viewer, a task in a sheet) is not asked.
  const resolver = React.useMemo<InlineChipResolver>(
    () => ({
      ...parent,
      kinds: { ...parent?.kinds, ...CHIP_KINDS },
      onOpen: undefined,
      preview: undefined,
      state: undefined,
    }),
    [parent],
  );
  const links = useLinkProvider();
  const kind = kindOf(data);
  const external = linkAction(data.url, links).kind === "external";
  return (
    <InlineChipProvider value={resolver}>
      <InlineChip
        kind={`resource:${kind}`}
        targetId={data.externalId ?? data.url}
        label={data.title}
        href={data.url}
        preview={<InlineChipPreview title={data.title} meta={data.meta} />}
        aria-label={`${data.title}, ${KINDS[kind].noun}${external ? " (opens in new tab)" : ""}`}
        data-resource-kind={kind}
        className={className}
      />
    </InlineChipProvider>
  );
}
