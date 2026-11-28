// @vegastack embed-providers@0.142.0 sha256-3AtMPC1urzhT+u7aFAewF3Sm7kEvr/U3Dt9/6ri6nmA=

import type { ReactNode } from "react";

/**
 * embed-providers — the video hosts a document may embed (YouTube and Loom), as plain functions: a
 * URL in, the provider and video id out, and the player `src` rebuilt from that id alone. No
 * dependencies, no React at runtime, no DOM: `TextEdit`'s schema (`@/lib/text-edit-schema`),
 * `MarkdownView` and server code (a Content-Security-Policy `frame-src`, an import) read the same
 * allowlist.
 *
 * Only an `https:` URL on an exact host, with a strictly shaped id, matches. Everything else in a
 * URL — tracking parameters, a playlist, a session id — is dropped; YouTube's start time (`t=`, or
 * `start=` on an embed link) is the one thing kept, as the player's `?start=`. The raw URL is never
 * a frame's `src`.
 *
 * One more provider is not a frame: **`app`**, a recording in the host app itself
 * (`https://<host>/recordings/<uuid>`), on hosts the app names at runtime (`AppEmbed`). The host
 * draws it with its own component; nothing here builds a `src` for it or adds a `frame-src` origin.
 */

/** A provider the document can embed. */
export type EmbedProviderId = "youtube" | "loom";

/** What `src` takes. */
export interface EmbedSrcOptions {
  /** Where playback starts, in whole seconds (YouTube only). */
  start?: number;
}

/** One embeddable host. */
export interface EmbedProvider {
  /** The provider's id, as an `embed` node stores it. */
  id: EmbedProviderId;
  /** The facade's name for what it holds: "YouTube video". */
  label: string;
  /** The one origin the player frame loads from — a `frame-src` entry. */
  frameOrigin: string;
  /** The video id a URL points at, or null when it is not this provider's video URL. */
  match(url: string): string | null;
  /** The player's frame URL, built from the id alone. */
  src(id: string, options?: EmbedSrcOptions): string;
}

/**
 * The providers a document shows as players — an opt-in `embeds` prop takes `EMBED_PROVIDERS`, or
 * a subset of it. A provider left out (or no prop) shows its videos as plain links.
 */
export type EmbedProviders = Partial<
  Readonly<Record<EmbedProviderId, EmbedProvider>>
>;

/** The provider an `embed` node stores for a recording in the host app itself (`AppEmbed`). */
export const APP_EMBED_PROVIDER = "app";

/** Every provider an `embed` node may store: a framed video host, or the host app. */
export type EmbedNodeProvider = EmbedProviderId | typeof APP_EMBED_PROVIDER;

/**
 * The host app's own embeds — opt-in on `TextEdit` and `MarkdownView` (`appEmbed`). A link alone on
 * its line to `https://<host>/recordings/<uuid>`, on one of `hosts`, is an embed block the host
 * draws with `render`: the design system draws no frame and loads nothing for it. Without it such a
 * link stays a plain link.
 *
 * @example
 * const appEmbed: AppEmbed = {
 *   hosts: ["app.vegastack.com"],
 *   render: (url) => <RecordingEmbed meetingId={url.split("/").pop()!} />,
 * };
 */
export interface AppEmbed {
  /**
   * The host names (`app.vegastack.com`, no scheme, no port) whose recording links embed. An entry
   * that is not a bare host name is ignored.
   */
  hosts: readonly string[];
  /** Draws the embed for `url`, the link as written (one `matchAppEmbed` accepted). */
  render: (url: string) => ReactNode;
}

/** A URL `matchAppEmbed` recognised. */
export interface AppEmbedMatch {
  provider: typeof APP_EMBED_PROVIDER;
  /** The recording's id: a lowercase UUID. */
  id: string;
  /** The URL, as written. */
  url: string;
}

/** A URL `matchEmbed` recognised. */
export interface EmbedMatch {
  provider: EmbedProviderId;
  /** The video id. */
  id: string;
  /** YouTube's start time, in seconds, when the URL carries one. */
  start?: number;
  /** The player's frame URL: `EMBED_PROVIDERS[provider].src(id, { start })`. */
  src: string;
}

/** A recording's path in the host app: `/recordings/` and a lowercase UUID, nothing after it. */
const APP_RECORDING_PATH =
  /^\/recordings\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
/** A bare host name: lowercase labels joined by dots, no port, no trailing dot. */
const HOST_NAME =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

/** The longest URL read: a real share link is far shorter. */
const MAX_URL_LENGTH = 2048;

/** A YouTube video id: 11 characters of URL-safe base64. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
/** A Loom video id: 32 lowercase hex characters, after an optional title slug (`my-demo-<id>`). */
const LOOM_SEGMENT = /^(?:[A-Za-z0-9-]{1,200}-)?([0-9a-f]{32})$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);
const LOOM_HOSTS = new Set(["loom.com", "www.loom.com"]);

/** The latest start a link may ask for: a day. */
const MAX_START = 86_400;

/**
 * `url` as an `https:` URL with no credentials and no port, or null. Whitespace, control
 * characters and quotes anywhere refuse it: what is embedded is exactly what was written.
 */
function parseHttps(url: string): URL | null {
  if (typeof url !== "string" || url.length > MAX_URL_LENGTH) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f<>"'`\\]/.test(url)) return null;
  if (!/^https:\/\//i.test(url)) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password || parsed.port) return null;
  return parsed;
}

/** The path's segments, without empty ones (`/embed//x/` reads as `embed`, `x`). */
function segments(url: URL): string[] {
  return url.pathname.split("/").filter(Boolean);
}

/**
 * A YouTube time — `90`, `90s`, `1m30s`, `1h2m3s` — in whole seconds, or null when it is not one.
 */
export function parseYouTubeTime(
  value: string | null | undefined,
): number | null {
  if (!value) return null;
  const match = /^(?:(\d{1,2})h)?(?:(\d{1,4})m)?(?:(\d{1,6})s?)?$/.exec(value);
  if (!match || (!match[1] && !match[2] && !match[3])) return null;
  const seconds =
    Number(match[1] ?? 0) * 3600 +
    Number(match[2] ?? 0) * 60 +
    Number(match[3] ?? 0);
  return seconds > 0 && seconds <= MAX_START ? seconds : null;
}

function youtubeId(url: string): string | null {
  const parsed = parseHttps(url);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  const path = segments(parsed);
  let id: string | null = null;
  if (host === "youtu.be") id = path.length === 1 ? path[0]! : null;
  else if (YOUTUBE_HOSTS.has(host)) {
    if (path.length === 1 && path[0] === "watch")
      id = parsed.searchParams.get("v");
    else if (path.length === 2 && (path[0] === "shorts" || path[0] === "embed"))
      id = path[1]!;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** A YouTube URL's start time: `t=` (or `start=`, an embed link's), in the query or the hash. */
function youtubeStart(url: string): number | null {
  const parsed = parseHttps(url);
  if (!parsed) return null;
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  return (
    parseYouTubeTime(parsed.searchParams.get("t")) ??
    parseYouTubeTime(parsed.searchParams.get("start")) ??
    parseYouTubeTime(hash.get("t"))
  );
}

function loomId(url: string): string | null {
  const parsed = parseHttps(url);
  if (!parsed || !LOOM_HOSTS.has(parsed.hostname.toLowerCase())) return null;
  const path = segments(parsed);
  if (path.length !== 2 || (path[0] !== "share" && path[0] !== "embed"))
    return null;
  return LOOM_SEGMENT.exec(path[1]!)?.[1] ?? null;
}

/**
 * The embeddable providers: YouTube (played from `www.youtube-nocookie.com`, YouTube's
 * privacy-enhanced host) and Loom.
 *
 * @example
 * EMBED_PROVIDERS.youtube.match("https://youtu.be/dQw4w9WgXcQ?si=abc"); // "dQw4w9WgXcQ"
 * EMBED_PROVIDERS.youtube.src("dQw4w9WgXcQ", { start: 42 });
 * // "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=42"
 */
export const EMBED_PROVIDERS: Readonly<Record<EmbedProviderId, EmbedProvider>> =
  {
    youtube: {
      id: "youtube",
      label: "YouTube video",
      frameOrigin: "https://www.youtube-nocookie.com",
      match: youtubeId,
      src: (id, options) => {
        if (!YOUTUBE_ID.test(id))
          throw new RangeError("Not a YouTube video id");
        const start =
          options?.start && Number.isInteger(options.start) && options.start > 0
            ? Math.min(options.start, MAX_START)
            : 0;
        return `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`;
      },
    },
    loom: {
      id: "loom",
      label: "Loom video",
      frameOrigin: "https://www.loom.com",
      match: loomId,
      src: (id) => {
        if (!/^[0-9a-f]{32}$/.test(id))
          throw new RangeError("Not a Loom video id");
        return `https://www.loom.com/embed/${id}`;
      },
    },
  };

/** Every provider id, in menu order. */
const EMBED_PROVIDER_IDS: readonly EmbedProviderId[] = ["youtube", "loom"];

/**
 * Every origin a player frame may load from — exactly a Content-Security-Policy's `frame-src`
 * allowlist for embeds.
 *
 * @example
 * `frame-src 'self' ${EMBED_FRAME_ORIGINS.join(" ")}`;
 */
export const EMBED_FRAME_ORIGINS: readonly string[] = EMBED_PROVIDER_IDS.map(
  (id) => EMBED_PROVIDERS[id].frameOrigin,
);

/**
 * The attributes every player frame carries: lazy, its own referrer policy (YouTube refuses to
 * play without a referrer — error 153 — on a `no-referrer` page), and a sandbox with no top
 * navigation and no forms.
 */
export const EMBED_FRAME_ATTRIBUTES = {
  loading: "lazy",
  referrerPolicy: "strict-origin-when-cross-origin",
  allow: "fullscreen; picture-in-picture; encrypted-media",
  sandbox: "allow-scripts allow-same-origin allow-popups allow-presentation",
} as const;

/**
 * The provider and video id `url` points at, with the player `src` rebuilt from them — or null
 * when it is not an embeddable video URL.
 *
 * @example
 * matchEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m2s&utm_source=x");
 * // { provider: "youtube", id: "dQw4w9WgXcQ", start: 62,
 * //   src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=62" }
 * matchEmbed("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ"); // null
 */
export function matchEmbed(url: string): EmbedMatch | null {
  for (const provider of EMBED_PROVIDER_IDS) {
    const id = EMBED_PROVIDERS[provider].match(url);
    if (!id) continue;
    const start = provider === "youtube" ? youtubeStart(url) : null;
    return {
      provider,
      id,
      ...(start ? { start } : {}),
      src: EMBED_PROVIDERS[provider].src(id, start ? { start } : undefined),
    };
  }
  return null;
}

/**
 * The recording `url` points at in the host app — or null unless it is exactly
 * `https://<host>/recordings/<uuid>` on one of `hosts`: a lowercase UUID, nothing after it (no
 * other path, no query, no hash), no credentials, no port. There is no `/meetings/…` alias.
 *
 * @example
 * matchAppEmbed("https://app.vegastack.com/recordings/0b0e…", ["app.vegastack.com"]);
 * // { provider: "app", id: "0b0e…", url: "https://app.vegastack.com/recordings/0b0e…" }
 * matchAppEmbed("https://app.vegastack.com/meetings/0b0e…", ["app.vegastack.com"]); // null
 */
export function matchAppEmbed(
  url: string,
  hosts: readonly string[] | null | undefined,
): AppEmbedMatch | null {
  if (!hosts?.length || /[?#]/.test(url ?? "")) return null;
  const parsed = parseHttps(url);
  if (!parsed || parsed.search || parsed.hash) return null;
  // The authority and path as written — never URL's normalisation of them (`host:443`, `@host`,
  // `%61pp…`, `/a/../recordings/…`, `%2F`): both must already be exactly what is allowed.
  const raw = /^https:\/\/([^/?#]+)(\/[^?#]*)$/i.exec(url);
  if (!raw) return null;
  const host = raw[1]!.toLowerCase();
  if (!HOST_NAME.test(host) || host !== parsed.hostname) return null;
  const allowed = hosts.some(
    (each) => typeof each === "string" && each.trim().toLowerCase() === host,
  );
  const path = raw[2]!;
  const id = APP_RECORDING_PATH.exec(path)?.[1];
  return allowed && id && path === parsed.pathname
    ? { provider: APP_EMBED_PROVIDER, id, url }
    : null;
}

/**
 * The provider an `embed` node stores for `url`: a framed video host (`matchEmbed`), else the host
 * app's when `appHosts` name its host (`matchAppEmbed`) — or null when `url` is neither.
 *
 * @example
 * embedProviderOf("https://youtu.be/dQw4w9WgXcQ"); // "youtube"
 * embedProviderOf("https://app.vegastack.com/recordings/0b0e…", ["app.vegastack.com"]); // "app"
 */
export function embedProviderOf(
  url: string,
  appHosts?: readonly string[] | null,
): EmbedNodeProvider | null {
  return (
    matchEmbed(url)?.provider ?? matchAppEmbed(url, appHosts)?.provider ?? null
  );
}
