// @vegastack inline-chip@0.26.0 sha256-QKqu88B0TLiDtJTZKGXATYwS7QwS7SyEsa5GWmExaUI=

"use client";

import * as React from "react";
import { Bot, CircleCheck, Link2, UserRound } from "lucide-react";
import { cn } from "@vegastack/design";
import { FileTypeIcon } from "@/lib/file-kind";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Badge } from "@/components/ui/badge";
import type { AvatarHue } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/* ------------------------------------------------------------------------------------------------
 * InlineChip — the one inline reference in running text: a person, an agent, a file or any record
 * kind the host names (`InlineChipResolver.kinds`), in an editor, a rendered Markdown body or a
 * comment. It is an inline-BLOCK that never wraps, never inline-flex: an inline-flex box whose
 * first item is an icon takes its baseline from the icon's bottom edge, which lifts the label above
 * the text beside it. Here the label is ordinary text on the line's own baseline, the icon is a 1em
 * glyph nudged down by the usual `-0.125em`, and the tint is the box's own background — so the
 * chip reads at the size, baseline and line height of whatever it sits in (a paragraph, a
 * heading, a list item). The chip is one unit (Regent POL-25): its icon and label never part
 * across a line break, and a chip wider than its line is cut with an ellipsis at `max-w-full`.
 * The cut is `overflow: clip`, not `hidden`: a `hidden` inline-block takes its baseline from its
 * bottom edge and drops off the line, while `clip` keeps the text's own baseline.
 * ----------------------------------------------------------------------------------------------*/

/**
 * What an inline chip points at: a person (`user`), a member's agent, a file (a file link's chip),
 * or any kind the host names and draws (`InlineChipResolver.kinds`).
 */
export type InlineChipKind = "user" | "agent" | "file" | (string & {});

/** How the host names and draws one of its kinds (`InlineChipResolver.kinds`). */
export interface InlineChipKindConfig {
  /**
   * The kind's glyph, set at 1em before the label. A `file` chip leads with its file type's icon
   * whatever this is.
   * @default a link glyph
   */
  icon?: React.ReactNode;
  /** One of it, in a sentence: the hover card's kind word and the chip's description ("Page"). */
  noun: string;
}

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
  /**
   * A deactivated member: the name is followed by the small muted outline "Inactive" badge (the
   * one every person surface shows) and the chip carries `data-inactive`. The label is never
   * rewritten, so the text a comment anchors to is unchanged. @default false
   */
  inactive?: boolean;
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
  /**
   * The host's kinds, by id: each one's glyph and noun. A kind not listed here (and not built in:
   * `user`, `agent`, `file`) shows a link glyph and the noun "Item".
   * @default undefined
   */
  kinds?: Readonly<Record<string, InlineChipKindConfig>>;
  /** Where a chip links, by kind and id. `null` for no link. */
  href?: (kind: InlineChipKind, id: string) => string | null | undefined;
  /** The person behind a `user` chip, by id: the hover card shows them. */
  person?: (id: string) => InlineChipPerson | null | undefined;
  /**
   * A record's state, for every chip that isn't given its own (`done`, `struck`, `status`): a
   * finished task's check, a canceled or duplicate task struck through with its status. One
   * answer for every surface — an editor, a rendered body, a comment. Answer `null` for none.
   */
  state?: (
    kind: InlineChipKind,
    id: string,
  ) => InlineChipState | null | undefined;
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
  /**
   * Another site's page, as a link names it: its title and icon. `TextEdit` asks once per URL
   * (and keeps the answer): a pasted link's text becomes the title, and the link card shows the
   * icon and title. Fetch it on the app's server and serve the icon from there, so a reader's
   * browser never contacts the site. `null` when there is nothing to show.
   */
  linkPreview?: (
    url: string,
    options: { signal: AbortSignal },
  ) => Promise<InlineChipLinkPreview | null>;
}

/** A chip's record state (`InlineChipResolver.state`): the same three props a chip takes. */
export interface InlineChipState {
  /** A finished task: the check instead of the task glyph. @default false */
  done?: boolean;
  /** Closed without being done: the label struck through. @default false */
  struck?: boolean;
  /** A small tag after the label ("Canceled", "Duplicate"). @default undefined */
  status?: string;
}

/** What `InlineChipResolver.linkPreview` answers for a link. */
export interface InlineChipLinkPreview {
  /** The page's title. */
  title: string;
  /** Its icon's URL (the app's own, proxied copy). @default undefined */
  icon?: string | null;
  /** The site's name ("GitHub"): a bookmark card's address line. @default undefined */
  siteName?: string | null;
  /** A line or two about the page: a bookmark card's blurb. @default undefined */
  description?: string | null;
  /** A picture of the page (the app's own, proxied copy): a bookmark card's thumbnail. @default undefined */
  image?: string | null;
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

/** The built-in kinds' glyphs and nouns; a `file` chip's glyph is its file type's icon. */
const BUILT_IN_KIND: Record<
  string,
  { icon?: React.ReactElement; noun: string }
> = {
  user: { icon: <UserRound />, noun: "Person" },
  agent: { icon: <Bot />, noun: "Agent" },
  file: { noun: "File" },
};

/** A kind's noun: the host's, else the built-in one, else "Item". */
function kindNoun(kind: InlineChipKind, resolver: InlineChipResolver | null) {
  return resolver?.kinds?.[kind]?.noun ?? BUILT_IN_KIND[kind]?.noun ?? "Item";
}

/**
 * Each kind's ground and ink. A person is the one coloured chip (the tag blue, as on every person
 * surface); every other chip — an agent, a file, any record — wears the same neutral page chip and is told apart by its icon alone, so a paragraph of
 * references reads as text rather than a legend. A restricted chip is muted whatever its kind.
 */
const PERSON_TONE =
  "bg-tag-blue-subtle [--inline-chip-ink:var(--color-tag-blue-text)]";
const RECORD_TONE = "bg-muted [--inline-chip-ink:var(--color-foreground)]";
const toneOf = (kind: InlineChipKind) =>
  kind === "user" ? PERSON_TONE : RECORD_TONE;

/**
 * The chip's box: one unbroken inline-block line, padded 4px each side, the small radius, cut
 * with an ellipsis at the line's width. It is an inline target in running text (WCAG 2.5.8's
 * inline exception), so the `before:` hit area clipped with it is a nicety, not the target. It never
 * spellchecks (a name is not a misspelling) and is atomic text in an editor. The ink is a
 * custom property worn by an inner span, so a prose root's link colour (`[&_a]:text-…`, which
 * out-specifies a class on the `<a>`) never reaches the label; `inlineChipProseClassName` undoes
 * the prose underline. A `before:` hit area, 1px past the 22px box each way, makes a 24px target without moving
 * anything.
 */
const CHIP =
  "relative inline-block max-w-full overflow-x-clip text-ellipsis -my-px whitespace-nowrap rounded-sm px-1 py-px font-medium no-underline transition-colors before:absolute before:inset-x-0 before:-inset-y-px before:content-[''] data-restricted:bg-muted data-restricted:[--inline-chip-ink:var(--color-muted-foreground)] data-interactive:cursor-pointer data-interactive:hover:underline data-interactive:hover:decoration-(--inline-chip-ink)/40 data-interactive:hover:underline-offset-2";

/** The leading glyph: 1em, a hair below the baseline's centre like any inline icon, muted. */
const ICON =
  "me-1 inline-block size-[1em] shrink-0 align-[-0.125em] opacity-70";

/**
 * The leading avatar, sized and set like the icon so it reads with the text at any size: `1.1em`,
 * centred where the icon is (`-0.175em` puts its middle on the icon's), inside the chip's own
 * ground at every font size. An `inline-block` with hidden overflow, so its baseline is its bottom
 * edge whatever is inside (an inline-flex avatar takes its initials' baseline and drops by half
 * its height). Its initials scale with it (`55%` of the chip's size, never the avatar's
 * fixed `text-xs`: no ramp step can follow a chip from a comment to a heading, the same reason the
 * icon is `1em`), and its photo is pinned to the circle: a prose root's descendant `img` rule (block,
 * margin, border, radius — the rules for a picture in the text) would otherwise move the photo
 * out of the chip, so the `[data-slot]` selectors here out-specify it.
 */
const AVATAR =
  "me-1 inline-block size-[1.1em] shrink-0 overflow-hidden align-[-0.175em] whitespace-nowrap select-none after:hidden data-[size=sm]:size-[1.1em] [&_[data-slot=avatar-fallback]]:text-[55%] [&_[data-slot=avatar-fallback]]:leading-none [&_[data-slot=avatar-fallback]]:font-medium [&_[data-slot=avatar-image]]:m-0 [&_[data-slot=avatar-image]]:max-w-none [&_[data-slot=avatar-image]]:rounded-full [&_[data-slot=avatar-image]]:border-0";

/**
 * The rule a prose root needs so a chip that is an `<a>` keeps its own ink and no underline: the
 * prose recipe's link rule is a descendant rule a class cannot beat. `MarkdownView` and `TextEdit`
 * wear it; any other prose surface rendering chips should too.
 */
export const inlineChipProseClassName =
  "[&_[data-slot=inline-chip]]:no-underline [&_[data-slot=inline-chip][data-interactive]:hover]:underline";

/** The ground, ink, padding and radius of a chip of `kind` — for a chip the app cannot make an `InlineChip` (a link mark in an editor). */
export function inlineChipClassName(kind: InlineChipKind): string {
  return cn(CHIP, toneOf(kind));
}

/** Props accepted by `InlineChip`. */
export interface InlineChipProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children" | "onClick"
> {
  /** What the chip points at; picks the icon (and, for a person, the blue ground). */
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
  /**
   * The label struck through: a target that is closed without being done (a canceled or duplicate
   * task). The chip carries `data-struck`; its tint and link are unchanged.
   * @default false
   */
  struck?: boolean;
  /**
   * A small status tag after the label ("Canceled", "Duplicate") — the same muted outline badge
   * as "Inactive". `""` or undefined shows none.
   * @default undefined
   */
  status?: string;
  /**
   * A finished target (a done task): the chip leads with a check instead of its kind's glyph.
   * @default false
   */
  done?: boolean;
}

/** Keys that leave a chip's card open: modifiers alone, and Tab (which moves focus to the chip). */
const CARD_KEEPING_KEYS = new Set([
  "Shift",
  "Meta",
  "Control",
  "Alt",
  "CapsLock",
  "Tab",
]);

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
 * `InlineChip` — a person, an agent, a file or any record the host names, referenced inline. It sits on the text's baseline at the text's size: a person on blue, every
 * record on the one neutral ground with its kind's icon. A person chip previews the person
 * (avatar, name, email) on hover or focus; any other chip previews what `preview` returns
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
  struck: struckProp,
  status: statusProp,
  done: doneProp,
  className,
  onKeyDown,
  ...props
}: InlineChipProps) {
  const resolver = React.useContext(InlineChipContext);
  // Its own state when given any; else the provider's, so every surface shows a record alike.
  const own =
    struckProp !== undefined ||
    doneProp !== undefined ||
    statusProp !== undefined;
  const restrictedState = restrictedProp ?? targetId.startsWith("restricted:");
  const given =
    own || restrictedState ? null : resolver?.state?.(kind, targetId);
  const struck = (own ? struckProp : given?.struck) === true;
  const done = (own ? doneProp : given?.done) === true;
  const status = own ? statusProp : (given?.status ?? undefined);
  // The card shows for a pointer resting on the chip (or focus on it), never in the way of
  // typing: a key pressed outside it — in the text it covers, a comment box under it — closes it.
  // Escape closes only the card: it goes no further (an editor keeps its caret, a dialog stays).
  const [cardOpen, setCardOpen] = React.useState(false);
  React.useEffect(() => {
    if (!cardOpen) return;
    const close = (event: KeyboardEvent) => {
      if (CARD_KEEPING_KEYS.has(event.key)) return;
      const inCard = (event.target as Element | null)?.closest?.(
        "[data-inline-chip-card]",
      );
      if (event.key === "Escape") {
        // An IME's Escape dismisses its candidates, not the card.
        if (event.isComposing || event.keyCode === 229) return;
        // On a chip inside a grid cell, the grid's Escape returns to the cell in one press
        // (and the card closes with it); anywhere else Escape closes only the card.
        const inGridCell = (event.target as Element | null)?.closest?.(
          '[data-slot="data-grid-cell"]:not([data-editing])',
        );
        if (!inGridCell) event.stopPropagation();
      } else if (inCard) return;
      setCardOpen(false);
    };
    document.addEventListener("keydown", close, true);
    return () => document.removeEventListener("keydown", close, true);
  }, [cardOpen]);
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

  const kindIcon = resolver?.kinds?.[kind]?.icon ??
    BUILT_IN_KIND[kind]?.icon ?? <Link2 />;
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
        className={AVATAR}
      />
    ) : done ? (
      // A done target's check is its state, so it is named; every other glyph is decoration.
      <CircleCheck
        role="img"
        aria-label="Done"
        data-slot="inline-chip-icon"
        className={ICON}
      />
    ) : kind === "file" ? (
      <FileTypeIcon
        contentType={contentType}
        name={label}
        data-slot="inline-chip-icon"
        className={cn(ICON, "text-current")}
      />
    ) : React.isValidElement<{ className?: string }>(kindIcon) ? (
      React.cloneElement(kindIcon, {
        "aria-hidden": true,
        "data-slot": "inline-chip-icon",
        className: cn(ICON, kindIcon.props.className),
      } as React.HTMLAttributes<HTMLElement>)
    ) : (
      <span aria-hidden data-slot="inline-chip-icon" className={ICON}>
        {kindIcon}
      </span>
    );

  const shared = {
    "data-slot": "inline-chip",
    "data-kind": kind,
    "data-restricted": restricted ? "" : undefined,
    "data-inactive": person?.inactive ? "" : undefined,
    "data-struck": struck ? "" : undefined,
    "data-done": done ? "" : undefined,
    "data-interactive": opens || person ? "" : undefined,
    spellCheck: false,
    className: cn(CHIP, toneOf(kind), className),
    ...props,
  };
  // The chip never wraps, so the lead and the label always share a line. A struck label's line
  // never crosses the lead: text decoration skips an inline-block.
  const words = (
    <>
      {lead}
      {label}
    </>
  );
  // The ink sits on an inner span, so a prose root's link colour on the `<a>` never reaches it.
  const body = (
    <span data-slot="inline-chip-label" className="text-(--inline-chip-ink)">
      {struck ? (
        <s
          data-slot="inline-chip-struck"
          className="decoration-(--inline-chip-ink)/60"
        >
          {words}
        </s>
      ) : (
        words
      )}
      {status ? (
        // A closed target's status ("Canceled"): the person surfaces' badge, at the chip's
        // baseline and no taller.
        <Badge
          variant="outline"
          data-slot="inline-chip-status"
          className="ms-1 h-auto px-1.5 py-px align-baseline leading-none font-normal text-muted-foreground"
        >
          {status}
        </Badge>
      ) : null}
      {person?.inactive ? (
        // The person surfaces' "Inactive" badge, at the chip's text baseline and no taller.
        <Badge
          variant="outline"
          data-slot="inline-chip-badge"
          className="ms-1 h-auto px-1.5 py-px align-baseline leading-none font-normal text-muted-foreground"
        >
          Inactive
        </Badge>
      ) : null}
    </span>
  );

  let chip: React.ReactElement;
  if (href) {
    chip = (
      <a
        {...(shared as React.ComponentProps<"a">)}
        href={href}
        onClick={open}
        onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLElement>}
      >
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
        {kindNoun(kind, resolver)}
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
    <HoverCard open={cardOpen} onOpenChange={setCardOpen}>
      <HoverCardTrigger delay={300} closeDelay={100} render={chip} />
      <HoverCardContent
        align="start"
        data-inline-chip-card=""
        className="w-60 p-2"
      >
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
