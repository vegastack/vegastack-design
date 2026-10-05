// @vegastack inline-chip@0.23.124 sha256-+uUZcmkQFS16svsn6TbkPCIwfZkIgunXIwyrY0k6fzQ=

"use client";

import * as React from "react";
import {
  Building2,
  CalendarDays,
  CircleCheck,
  FileText,
  FolderKanban,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { FileTypeIcon } from "@/lib/file-kind";
import { PersonAvatar } from "@/components/ui/person-avatar";
import type { AvatarHue } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/* ------------------------------------------------------------------------------------------------
 * InlineChip — the one inline reference in running text: a person, page, file, task, meeting,
 * customer or project, in an editor, a rendered Markdown body or a comment. It is an INLINE box,
 * never inline-flex: an inline-flex box whose first item is an icon takes its baseline from the
 * icon's bottom edge, which lifts the label above the text beside it. Here the label is ordinary
 * inline text on the line's own baseline, the icon is a 1em glyph nudged down by the usual
 * `-0.125em`, and the tint is the inline box's own background — so the chip reads at the size,
 * baseline and line height of whatever it sits in (a paragraph, a heading, a list item) and wraps
 * with it (`box-decoration-clone` keeps the ground and padding on both lines).
 * ----------------------------------------------------------------------------------------------*/

/** What an inline chip points at. */
export type InlineChipKind =
  "user" | "page" | "file" | "task" | "meeting" | "customer" | "project";

/** Every inline chip kind, in menu order. */
export const INLINE_CHIP_KINDS: readonly InlineChipKind[] = [
  "user",
  "page",
  "file",
  "task",
  "meeting",
  "customer",
  "project",
];

/** A person behind a `user` chip: the hover card's avatar, name and email. */
export interface InlineChipPerson {
  /** The person's name. */
  name: string;
  /** Their email, under the name in the hover card. @default undefined */
  email?: string | null;
  /**
   * Their photo, small (the chip's 18px avatar — pass the app's small image variant). @default undefined
   */
  image?: string | null;
  /**
   * Their photo for the hover card's larger avatar (the app's larger variant); falls back to
   * `image`. @default undefined
   */
  cardImage?: string | null;
  /**
   * Their colour behind their initials, as on every `PersonAvatar` (comment avatars included).
   * @default undefined
   */
  hue?: AvatarHue | null;
}

/** What a chip opens: passed to `onOpen`. */
export interface InlineChipTarget {
  kind: InlineChipKind;
  id: string;
  label: string;
  href: string | null;
  /** A `file` chip's content type, when the host passed one. */
  contentType?: string | null;
}

/**
 * What an app tells every chip below it, so a chip rendered deep inside `MarkdownView`, `TextEdit`
 * or `Comments` can link, open and preview without threading props. A chip's own props win.
 */
export interface InlineChipResolver {
  /** Where a chip links, by kind and id. `null` for no link. */
  href?: (kind: InlineChipKind, id: string) => string | null | undefined;
  /** The person behind a `user` chip, by id: the hover card shows them. */
  person?: (id: string) => InlineChipPerson | null | undefined;
  /** A small preview for a non-person chip's hover card (a task's title and status). */
  preview?: (kind: InlineChipKind, id: string) => React.ReactNode;
  /**
   * Opens a chip on a plain click or Enter (a file in the viewer, a task in a sheet). ⌘/Ctrl-click
   * and middle-click still open a linked chip in a new tab. Return `false` to let the link
   * navigate instead.
   */
  onOpen?: (
    target: InlineChipTarget,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void | boolean;
}

const InlineChipContext = React.createContext<InlineChipResolver | null>(null);

/**
 * `InlineChipProvider` — tells every `InlineChip` below it how to link, open and preview. Wrap
 * the app (or one surface) once.
 *
 * @example
 * <InlineChipProvider value={{ href: (kind, id) => `/${kind}s/${id}`, person: (id) => people[id] }}>…</InlineChipProvider>
 */
export function InlineChipProvider({
  value,
  children,
}: {
  value: InlineChipResolver;
  children: React.ReactNode;
}) {
  return (
    <InlineChipContext.Provider value={value}>
      {children}
    </InlineChipContext.Provider>
  );
}

/** The nearest `InlineChipProvider`'s resolver, or `null`. */
export function useInlineChipResolver(): InlineChipResolver | null {
  return React.useContext(InlineChipContext);
}

const KIND_ICON: Record<InlineChipKind, LucideIcon> = {
  user: UserRound,
  page: FileText,
  file: FileText,
  task: CircleCheck,
  meeting: CalendarDays,
  customer: Building2,
  project: FolderKanban,
};

/** The hover card's kind word, and the chip's accessible description. */
export const INLINE_CHIP_KIND_LABEL: Record<InlineChipKind, string> = {
  user: "Person",
  page: "Page",
  file: "File",
  task: "Task",
  meeting: "Meeting",
  customer: "Customer",
  project: "Project",
};

/**
 * Each kind's soft ground and ink, from the tag hues: people blue, tasks green, meetings orange,
 * customers purple, projects cyan; pages and files on the neutral muted ground. A restricted chip
 * is muted whatever its kind.
 */
const KIND_TONE: Record<InlineChipKind, string> = {
  user: "bg-tag-blue-subtle [--inline-chip-ink:var(--color-tag-blue-text)]",
  page: "bg-muted [--inline-chip-ink:var(--color-foreground)]",
  file: "bg-muted [--inline-chip-ink:var(--color-foreground)]",
  task: "bg-tag-green-subtle [--inline-chip-ink:var(--color-tag-green-text)]",
  meeting:
    "bg-tag-orange-subtle [--inline-chip-ink:var(--color-tag-orange-text)]",
  customer:
    "bg-tag-purple-subtle [--inline-chip-ink:var(--color-tag-purple-text)]",
  project: "bg-tag-cyan-subtle [--inline-chip-ink:var(--color-tag-cyan-text)]",
};

/**
 * The chip's box: inline, padded 4px each side, the small radius, cloned on a wrap. The ink is a
 * custom property worn by an inner span, so a prose root's link colour (`[&_a]:text-…`, which
 * out-specifies a class on the `<a>`) never reaches the label; `inlineChipProseClassName` undoes
 * the prose underline. A `before:` hit area lifts the line to a 24px target without moving
 * anything.
 */
const CHIP =
  "relative box-decoration-clone rounded-sm px-1 py-px font-medium no-underline transition-colors before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] data-restricted:bg-muted data-restricted:[--inline-chip-ink:var(--color-muted-foreground)] data-interactive:cursor-pointer data-interactive:hover:underline data-interactive:hover:decoration-(--inline-chip-ink)/40 data-interactive:hover:underline-offset-2";

/** The leading glyph: 1em, a hair below the baseline's centre like any inline icon, muted. */
const ICON =
  "me-1 inline-block size-[1em] shrink-0 align-[-0.125em] opacity-70";

/**
 * The rule a prose root needs so a chip that is an `<a>` keeps its own ink and no underline: the
 * prose recipe's link rule is a descendant rule a class cannot beat. `MarkdownView` and `TextEdit`
 * wear it; any other prose surface rendering chips should too.
 */
export const inlineChipProseClassName =
  "[&_[data-slot=inline-chip]]:no-underline [&_[data-slot=inline-chip][data-interactive]:hover]:underline";

/** The ground, ink, padding and radius of a chip of `kind` — for a chip the app cannot make an `InlineChip` (a link mark in an editor). */
export function inlineChipClassName(kind: InlineChipKind): string {
  return cn(CHIP, KIND_TONE[kind]);
}

/** Props accepted by `InlineChip`. */
export interface InlineChipProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children" | "onClick"
> {
  /** What the chip points at; picks the icon and the tint. */
  kind: InlineChipKind;
  /** The name shown. */
  label: string;
  /**
   * The target's id: the provider's `href`, `person` and `preview` are asked by it. An id starting
   * with `restricted:` is a target the reader may not open — a muted chip, never a link.
   * @default ""
   */
  targetId?: string;
  /**
   * Where the chip links. Overrides the provider's `href`. `null` for no link.
   * @default the provider's href(kind, targetId)
   */
  href?: string | null;
  /**
   * Opens the chip on a plain click or Enter; ⌘/Ctrl-click still opens `href` in a new tab.
   * Overrides the provider's `onOpen`.
   * @default the provider's onOpen
   */
  onOpen?: InlineChipResolver["onOpen"];
  /**
   * A `user` chip's person: their photo shows in the chip, and the hover card shows the avatar,
   * name and email. Overrides the provider's `person`.
   * @default the provider's person(targetId)
   */
  person?: InlineChipPerson | null;
  /**
   * A `user` chip's photo, when there is no `person`.
   * @default undefined
   */
  image?: string | null;
  /**
   * A `file` chip's content type: the icon follows it, not only the name's extension.
   * @default undefined
   */
  contentType?: string | null;
  /**
   * The hover card's body for a non-person chip. `null` turns the card off.
   * @default the provider's preview(kind, targetId)
   */
  preview?: React.ReactNode;
  /**
   * A muted chip that never links or opens: a target the reader may not see.
   * @default targetId starts with "restricted:"
   */
  restricted?: boolean;
  /**
   * `click` — a plain click opens. `modifier` — only ⌘/Ctrl-click opens (in a new tab), so a click
   * inside an editor places the caret instead.
   * @default "click"
   */
  openOn?: "click" | "modifier";
}

/** A link or image URL that is relative or uses a safe protocol; anything else becomes `""`. */
function safeUrl(value: string): string {
  const colon = value.indexOf(":");
  const question = value.indexOf("?");
  const hash = value.indexOf("#");
  const slash = value.indexOf("/");
  if (
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (question !== -1 && colon > question) ||
    (hash !== -1 && colon > hash) ||
    /^(https?|mailto)$/i.test(value.slice(0, colon))
  )
    return value;
  return "";
}

/**
 * `InlineChip` — a person, page, file, task, meeting, customer or project referenced inline. It
 * sits on the text's baseline at the text's size, tinted by kind. A person chip previews the
 * person (avatar, name, email) on hover or focus; any other chip previews what `preview` returns
 * and opens on click (`onOpen`, else its `href`), with ⌘/Ctrl-click opening a link in a new tab.
 *
 * @example
 * <InlineChip kind="user" targetId="u1" label="Asha Rao" person={{ name: "Asha Rao", email: "asha@acme.com" }} />
 * <InlineChip kind="task" targetId="t1" label="Ship v2" href="/tasks/t1" />
 * <InlineChip kind="file" label="spec.pdf" contentType="application/pdf" onOpen={openViewer} />
 */
export function InlineChip({
  kind,
  label,
  targetId = "",
  href: hrefProp,
  onOpen: onOpenProp,
  person: personProp,
  image,
  contentType,
  preview: previewProp,
  restricted: restrictedProp,
  openOn = "click",
  className,
  onKeyDown,
  ...props
}: InlineChipProps) {
  const resolver = React.useContext(InlineChipContext);
  const restricted = restrictedProp ?? targetId.startsWith("restricted:");
  const person =
    kind !== "user" || restricted
      ? null
      : // An unknown person still gets a card: initials and the chip's name.
        ((personProp !== undefined
          ? personProp
          : resolver?.person?.(targetId)) ?? { name: label, image });
  const rawHref =
    restricted || kind === "user"
      ? null
      : hrefProp !== undefined
        ? hrefProp
        : (resolver?.href?.(kind, targetId) ?? null);
  const href = rawHref ? safeUrl(rawHref) || null : null;
  const onOpen = restricted ? undefined : (onOpenProp ?? resolver?.onOpen);
  const preview =
    restricted || kind === "user"
      ? null
      : previewProp !== undefined
        ? previewProp
        : (resolver?.preview?.(kind, targetId) ?? null);
  const photo = restricted ? "" : safeUrl(person?.image ?? image ?? "");
  const target: InlineChipTarget = {
    kind,
    id: targetId,
    label,
    href,
    ...(contentType ? { contentType } : {}),
  };
  const opens = Boolean(href || (onOpen && kind !== "user"));

  const open = (event: React.MouseEvent | React.KeyboardEvent) => {
    const modifier =
      "metaKey" in event && (event.metaKey || event.ctrlKey || event.shiftKey);
    if (modifier) {
      // A link opens in a new tab natively; in an editor (`modifier`), the anchor's default may be
      // eaten by the contenteditable, so open it here.
      if (href && openOn === "modifier") {
        event.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (openOn === "modifier") {
      if (href) event.preventDefault();
      return;
    }
    if (onOpen && kind !== "user") {
      if (onOpen(target, event) !== false) event.preventDefault();
    }
  };

  const KindIcon = KIND_ICON[kind];
  // A person chip leads with their avatar — the photo, else their initials on their colour — as
  // a comment's avatar does; other chips with a photo show it too.
  const lead =
    photo || person ? (
      <PersonAvatar
        person={{
          name: person?.name ?? label,
          image: photo || null,
          hue: person?.hue ?? null,
        }}
        size="sm"
        aria-hidden
        data-slot="inline-chip-avatar"
        className="me-1 inline-flex size-[1.125em] align-middle select-none after:hidden data-[size=sm]:size-[1.125em]"
      />
    ) : kind === "file" ? (
      <FileTypeIcon
        contentType={contentType}
        name={label}
        data-slot="inline-chip-icon"
        className={cn(ICON, "text-current")}
      />
    ) : (
      <KindIcon aria-hidden data-slot="inline-chip-icon" className={ICON} />
    );

  const shared = {
    "data-slot": "inline-chip",
    "data-kind": kind,
    "data-restricted": restricted ? "" : undefined,
    "data-interactive": opens || person ? "" : undefined,
    className: cn(CHIP, KIND_TONE[kind], className),
    ...props,
  };
  // The ink sits on an inner span, so a prose root's link colour on the `<a>` never reaches it.
  const body = (
    <span data-slot="inline-chip-label" className="text-(--inline-chip-ink)">
      {lead}
      {label}
    </span>
  );

  let chip: React.ReactElement;
  if (href) {
    chip = (
      <a {...(shared as React.ComponentProps<"a">)} href={href} onClick={open}>
        {body}
      </a>
    );
  } else if (opens && openOn === "click") {
    chip = (
      <span
        {...shared}
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Enter" || event.key === " ") open(event);
        }}
      >
        {body}
      </span>
    );
  } else if (person && openOn === "click") {
    // A person opens nothing; the chip is a tab stop only so the hover card opens on focus.
    chip = (
      <span {...shared} tabIndex={0} onKeyDown={onKeyDown}>
        {body}
      </span>
    );
  } else {
    chip = (
      <span {...shared} onKeyDown={onKeyDown}>
        {body}
      </span>
    );
  }

  const card = person ? (
    <span
      data-slot="inline-chip-person"
      className="flex min-w-0 items-center gap-2.5"
    >
      <PersonAvatar
        person={{
          name: person.name,
          email: person.email,
          image: restricted
            ? null
            : safeUrl(person.cardImage ?? "") || photo || null,
          hue: person.hue ?? null,
        }}
        size="default"
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium wrap-anywhere">{person.name}</span>
        {person.email ? (
          <span className="text-xs wrap-anywhere text-muted-foreground">
            {person.email}
          </span>
        ) : null}
      </span>
    </span>
  ) : preview != null && preview !== false ? (
    <span
      data-slot="inline-chip-preview"
      className="flex min-w-0 flex-col gap-1"
    >
      <span className="text-xs text-muted-foreground">
        {INLINE_CHIP_KIND_LABEL[kind]}
      </span>
      {typeof preview === "string" ? (
        <span className="text-sm font-medium wrap-anywhere">{preview}</span>
      ) : (
        preview
      )}
    </span>
  ) : null;

  if (!card) return chip;
  return (
    <HoverCard>
      <HoverCardTrigger delay={300} closeDelay={100} render={chip} />
      <HoverCardContent align="start" className="w-60 p-2">
        {card}
      </HoverCardContent>
    </HoverCard>
  );
}

/** Props accepted by `InlineChipPreview`. */
export interface InlineChipPreviewProps {
  /** The record's title. */
  title: React.ReactNode;
  /** A status line under it — a task's status, a meeting's time. @default undefined */
  meta?: React.ReactNode;
}

/**
 * `InlineChipPreview` — the standard preview card body: the title, and a muted line under it.
 *
 * @example
 * preview: (kind, id) => <InlineChipPreview title={tasks[id].title} meta={tasks[id].status} />
 */
export function InlineChipPreview({ title, meta }: InlineChipPreviewProps) {
  return (
    <>
      <span className="text-sm font-medium wrap-anywhere">{title}</span>
      {meta ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
          {meta}
        </span>
      ) : null}
    </>
  );
}
