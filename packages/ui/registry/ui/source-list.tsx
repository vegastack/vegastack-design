// @vegastack source-list@0.82.0 sha256-TJJ5O7m3cUt5P/FyuHw7Yfl5bu46jxX2PArrwyJv5B4=

"use client";

import * as React from "react";
import { ArrowUpRight, Globe } from "lucide-react";
import { cn } from "@vegastack/design";

import { ChatGroup } from "@/components/ui/chat-card";
import type { MarkdownCitation } from "@/components/ui/markdown-view";

/* ------------------------------------------------------------------------------------------------
 * SourceList — the web pages an answer cites, under its text, numbered as the answer's `[[n]]`
 * markers are. Only web results are sources: the person's own things (a Doc, a Meet, a Slack
 * message) are `ResourcePill`s in the text and never appear here.
 *
 * Closed, one quiet line on the chat's fold: up to three site icons and "Sources · 3 ›". Open,
 * one 28px row per page: its number, its site's icon, its title, the site in muted ink and ↗,
 * the whole row the link (a new tab). `sourceCitations` turns the same list into the
 * `citation` answer `MarkdownView` asks for, so each `[[n]]` pill opens a card for page n.
 *
 * A site's icon comes from the host (a favicon service or proxy); it sits on a light 16px tile in
 * dark mode, where dark marks would vanish, and a page with no icon shows a globe.
 * ----------------------------------------------------------------------------------------------*/

/** A web page the answer cites (a `source-url` part, with the site's icon). */
export interface WebSource {
  /** The page's address. */
  href: string;
  /** The page's title. Absent: the site stands in. @default undefined */
  title?: string | null;
  /** The site as people read it ("ies.org"). @default the address's host, without "www." */
  site?: string | null;
  /** The site's icon, served by the host. Absent or failing to load: a globe. @default undefined */
  icon?: string | null;
  /** A line or two from the page, for its card. @default undefined */
  snippet?: string | null;
}

/** The site as people read it: the host without "www.", or the address itself. */
export function siteOf(source: Pick<WebSource, "href" | "site">): string {
  if (source.site) return source.site;
  try {
    return new URL(source.href).hostname.replace(/^www\./i, "");
  } catch {
    return source.href;
  }
}

/** Props accepted by `SiteIcon`. */
export interface SiteIconProps {
  /** The icon's URL. Absent or failing to load: a globe. @default undefined */
  src?: string | null;
  /** Extra classes on the 16px tile. @default undefined */
  className?: string;
}

/**
 * A site's icon, decorative: 14px on a 16px tile that is light in dark mode, so a dark mark stays
 * visible; a globe when there is none or it fails to load.
 *
 * @example
 * <SiteIcon src="/api/favicon?site=ies.org" />
 */
export function SiteIcon({ src, className }: SiteIconProps) {
  const [failed, setFailed] = React.useState<string | null>(null);
  const image = src && failed !== src ? src : null;
  return (
    <span
      aria-hidden="true"
      data-slot="site-icon"
      data-fallback={image ? undefined : ""}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-sm text-muted-foreground dark:bg-foreground dark:data-fallback:bg-transparent",
        className,
      )}
    >
      {image ? (
        <img
          src={image}
          alt=""
          width={14}
          height={14}
          decoding="async"
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-3.5 object-contain"
          // An image that failed before hydration never fires `error` for React: check on mount.
          ref={(node) => {
            if (node?.complete && node.naturalWidth === 0) setFailed(image);
          }}
          onError={() => setFailed(image)}
        />
      ) : (
        <Globe strokeWidth={1.5} className="size-3.5" />
      )}
    </span>
  );
}

/** Props accepted by `SourceCard`. */
export interface SourceCardProps {
  /** The page. */
  source: WebSource;
  /** Read after the title, since it opens a new tab. @default "(opens in new tab)" */
  newTabLabel?: string;
}

/**
 * One web page as a citation's card: the site's icon and name, the title (the link, a new tab) and
 * a line from the page. What a `[[n]]` pill opens.
 *
 * @example
 * <SourceCard source={{ href: "https://www.ies.org/standards/tm-21", title: "TM-21-21", snippet: "Projecting long-term lumen maintenance…" }} />
 */
export function SourceCard({
  source,
  newTabLabel = "(opens in new tab)",
}: SourceCardProps) {
  const site = siteOf(source);
  return (
    <span data-slot="source-card" className="flex min-w-0 flex-col gap-1.5">
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <SiteIcon src={source.icon} />
        <span className="min-w-0 truncate">{site}</span>
      </span>
      <a
        href={source.href}
        target="_blank"
        rel="noreferrer noopener"
        data-slot="source-card-link"
        className="group/source-card line-clamp-2 text-sm font-medium text-foreground no-underline hover:underline hover:decoration-foreground/40 hover:underline-offset-2"
      >
        {source.title || site}
        <ArrowUpRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="ms-0.5 inline size-3.5 align-[-0.125em] text-muted-foreground group-hover/source-card:text-foreground"
        />
        <span className="sr-only"> {newTabLabel}</span>
      </a>
      {source.snippet ? (
        <span className="line-clamp-3 text-xs text-muted-foreground">
          {source.snippet}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The `citation` answer for `MarkdownView` from the answer's sources: `[[n]]` is page n (1-based),
 * named "Source n: <title>", opening its `SourceCard`. A number past the list stays literal text.
 *
 * @example
 * <MarkdownView citation={sourceCitations(sources)}>{text}</MarkdownView>
 */
export function sourceCitations(
  sources: readonly WebSource[],
): (n: number) => MarkdownCitation | null {
  return (n) => {
    const source = sources[n - 1];
    if (!source) return null;
    return {
      label: `Source ${n}: ${source.title || siteOf(source)}`,
      content: <SourceCard source={source} />,
    };
  };
}

/** Props accepted by `SourceList`. */
export interface SourceListProps {
  /** The pages the answer cites, in the order of its `[[n]]` markers. Empty: nothing renders. */
  sources: readonly WebSource[];
  /** The word on the closed line, which also names the list. @default "Sources" */
  label?: string;
  /** Read after each row's title, since it opens a new tab. @default "(opens in new tab)" */
  newTabLabel?: string;
  /** Uncontrolled initial open state. @default false */
  defaultOpen?: boolean;
  /** Extra classes on the root. @default undefined */
  className?: string;
}

/**
 * The web pages an answer cites: "Sources · 3 ›" with the first sites' icons, opening to one
 * numbered row per page (icon, title, site, ↗). Numbers match the answer's `[[n]]` pills.
 *
 * @example
 * <SourceList sources={[
 *   { href: "https://www.ies.org/standards/tm-21", title: "TM-21-21", icon: "/api/favicon?site=ies.org" },
 *   { href: "https://www.cibse.org/lg7", title: "LG7: Offices" },
 * ]} />
 */
export function SourceList({
  sources,
  label = "Sources",
  newTabLabel = "(opens in new tab)",
  defaultOpen = false,
  className,
}: SourceListProps) {
  if (!sources.length) return null;
  return (
    <div data-slot="source-list" className={cn("min-w-0", className)}>
      <ChatGroup
        guide={false}
        defaultOpen={defaultOpen}
        summary={
          <span className="inline-flex min-w-0 items-center gap-2 align-middle">
            <span
              aria-hidden="true"
              className="flex shrink-0 items-center -space-x-0.5"
            >
              {sources.slice(0, 3).map((source, index) => (
                <SiteIcon
                  key={`${source.href}-${index}`}
                  src={source.icon}
                  className="bg-background ring-2 ring-background"
                />
              ))}
            </span>
            <span className="min-w-0 truncate">
              {label} · {sources.length}
            </span>
          </span>
        }
      >
        <ol aria-label={label} className="flex min-w-0 flex-col">
          {sources.map((source, index) => {
            const site = siteOf(source);
            const title = source.title || site;
            return (
              <li key={`${source.href}-${index}`} className="min-w-0">
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={title}
                  data-slot="source-list-row"
                  className="group/source-row state-layer flex min-h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm no-underline"
                >
                  <span className="w-4 shrink-0 text-end text-xs text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <SiteIcon src={source.icon} />
                  <span className="min-w-0 truncate text-foreground">
                    {title}
                  </span>
                  {source.title ? (
                    <span className="max-w-40 min-w-0 shrink-0 truncate text-xs text-muted-foreground">
                      {site}
                    </span>
                  ) : null}
                  <ArrowUpRight
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="ms-auto size-3.5 shrink-0 text-muted-foreground group-hover/source-row:text-foreground"
                  />
                  <span className="sr-only">{newTabLabel}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </ChatGroup>
    </div>
  );
}
