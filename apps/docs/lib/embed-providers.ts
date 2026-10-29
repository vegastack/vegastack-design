// @vegastack embed-providers@0.25.103 sha256-dGHb2ysC71GrOPRId3iunOjo59uSNpFr3DkWuLiMGt8=

/**
 * embed-providers — the video hosts a document may embed (YouTube and Loom), as plain functions: a
 * URL in, the provider and video id out, and the player `src` rebuilt from that id alone. No
 * dependencies, no React, no DOM: `TextEdit`'s schema (`@/lib/text-edit-schema`), `MarkdownView`
 * and server code (a Content-Security-Policy `frame-src`, an import) read the same allowlist.
 *
 * Only an `https:` URL on an exact host, with a strictly shaped id, matches. Everything else in a
 * URL — tracking parameters, a playlist, a session id — is dropped; YouTube's start time (`t=`, or
 * `start=` on an embed link) is the one thing kept, as the player's `?start=`. The raw URL is never
 * a frame's `src`.
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
export const EMBED_PROVIDER_IDS: readonly EmbedProviderId[] = [
  "youtube",
  "loom",
];

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
