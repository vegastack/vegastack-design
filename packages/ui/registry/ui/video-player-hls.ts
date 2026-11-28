// @vegastack video-player@0.141.0 sha256-uzDg9RHyYkauSh7KzFDOChd9PVV3AAYorCGKEQliCjM=

/**
 * The HLS engine behind `VideoPlayer`'s `hls` source: hls.js, loaded with a dynamic `import()` the
 * first time a player attaches a playlist in a browser that can't play HLS itself (Chrome, Edge,
 * Firefox, Electron). Safari on macOS and iOS plays HLS natively and never downloads it. This is the
 * one registry file that imports hls.js (`docs/decisions.md` › Sanctioned dependency exceptions).
 *
 * Only ever called from an effect, so it never runs on the server.
 */

import type HlsType from "hls.js";

/** What the player hears back from an attached hls.js instance. */
export interface HlsAttachHandlers {
  /** A playlist or segment answered 403: the signed URL has expired. */
  onForbidden: () => void;
  /** An error hls.js could not recover from (network down, an unplayable stream). */
  onFatal: () => void;
  /** The playlist is parsed and the first media is about to load. */
  onReady: () => void;
}

/** Options for `attachHls`. */
export interface HlsAttachOptions extends HlsAttachHandlers {
  /** A same-origin URL of hls.js's `hls.worker.js`, so transmuxing runs off the main thread under `worker-src 'self'`. */
  workerPath?: string;
  /** Where to start, in seconds (`-1`: the start of the playlist). */
  startPosition?: number;
}

/** True when the element plays HLS itself (Safari, iOS), so hls.js is never loaded. */
export function playsHlsNatively(media: HTMLMediaElement): boolean {
  return media.canPlayType("application/vnd.apple.mpegurl") !== "";
}

/**
 * Attach `url` to `media` through hls.js and resolve to a detach function. Resolves to `null` when
 * the browser has neither native HLS nor Media Source Extensions — the caller shows its "can't play"
 * card. A detach before the import finishes is honoured: the instance is never created.
 */
export async function attachHls(
  media: HTMLMediaElement,
  url: string,
  options: HlsAttachOptions,
  signal: AbortSignal,
): Promise<(() => void) | null> {
  const { default: Hls } = (await import("hls.js")) as {
    default: typeof HlsType;
  };
  if (signal.aborted) return () => {};
  if (!Hls.isSupported()) return null;

  const hls = new Hls({
    // The player's buffering budget (plan §7.3): 30 s ahead and behind, the first rendition
    // fixed — a recording has one.
    maxBufferLength: 30,
    backBufferLength: 30,
    startLevel: 0,
    startPosition: options.startPosition ?? -1,
    enableWorker: true,
    workerPath: options.workerPath ?? null,
  });
  let mediaRecoveries = 0;

  hls.on(Hls.Events.MANIFEST_PARSED, () => options.onReady());
  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (data.response?.code === 403) {
      options.onForbidden();
      return;
    }
    if (!data.fatal) return;
    // One decode recovery (a bad append, a codec hiccup) before giving up; network failures are
    // already retried inside hls.js by the time they turn fatal.
    if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 1) {
      mediaRecoveries += 1;
      hls.recoverMediaError();
      return;
    }
    options.onFatal();
  });

  hls.attachMedia(media as HTMLVideoElement);
  hls.loadSource(url);
  return () => hls.destroy();
}
