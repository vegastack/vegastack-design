// @vegastack media-probe@0.23.108 sha256-wifMiMueSInTkg2YpJOG8mS36pAyakKOi81xH76dsi8=

/* ---
`media-probe` reads what an upload screen wants to store beside a file, in the browser, before
the upload finishes: a video's duration, size and a poster frame; an audio file's duration and the
peaks its waveform draws; and the preview picture PowerPoint (and Word or Excel, when asked to)
saves inside an Office file. Store the results with the file, and the grid, the `AudioPlayer`
waveform and the `FileViewer` card show them without downloading or decoding the file again.

Browser-only and dependency-free: a `<video>` and a canvas for the poster, an `OfflineAudioContext`
for the peaks, and a small zip central-directory reader with the browser's own
`DecompressionStream` for the Office thumbnail. Call these from an event handler or an effect,
never during a server render.

Deliberately NOT done here: uploading, choosing what to store, or reading anything else out of an
Office file (a sheet, a slide) — that needs a parser, which is the app's dependency to choose.
--- */

/** What `probeVideo` reads from a video file. */
export interface VideoProbe {
  /** Length in seconds. */
  duration: number;
  /** The frame's intrinsic width in pixels. */
  width: number;
  /** The frame's intrinsic height in pixels. */
  height: number;
  /** A JPEG of the frame at `at` seconds (the middle of a shorter clip), at most `posterWidth` wide. */
  poster: Blob;
}

/** Options for `probeVideo`. */
export interface ProbeVideoOptions {
  /**
   * The moment the poster frame is taken, in seconds. A clip shorter than twice this uses its
   * middle frame instead, so a one-second clip never posters its black first frame.
   * @default 1
   */
  at?: number;
  /**
   * The poster's largest width in pixels; a smaller video keeps its own width.
   * @default 1280
   */
  posterWidth?: number;
  /**
   * Give up after this many milliseconds (a file the browser cannot decode may never answer).
   * @default 20000
   */
  timeoutMs?: number;
}

/** What `probeAudio` reads from an audio file. */
export interface AudioProbe {
  /** Length in seconds. */
  duration: number;
  /**
   * Waveform amplitudes, 0–1 and scaled to the loudest, at most `count` of them — `[]` when the
   * file is over `maxBytes` or cannot be decoded. Pass them to `AudioPlayer`'s `peaks`.
   */
  peaks: number[];
}

/** Options for `probeAudio`. */
export interface ProbeAudioOptions {
  /**
   * How many peaks to compute (the most `AudioPlayer`'s waveform needs is a few hundred).
   * @default 200
   */
  count?: number;
  /**
   * Decode for peaks only up to this size; a larger file reads its duration alone. Decoding
   * holds the whole file and its samples in memory.
   * @default 50 * 1024 * 1024
   */
  maxBytes?: number;
  /**
   * Give up after this many milliseconds.
   * @default 20000
   */
  timeoutMs?: number;
}

const MB = 1024 * 1024;

/** Resolve on the first `resolveOn` event, reject on `error` or after `timeoutMs`. */
function nextEvent(
  target: HTMLMediaElement,
  resolveOn: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = (error?: Error) => {
      clearTimeout(timer);
      target.removeEventListener(resolveOn, onResolve);
      target.removeEventListener("error", onError);
      if (error) reject(error);
      else resolve();
    };
    const onResolve = () => done();
    const onError = () =>
      done(new Error("The browser cannot read this media file."));
    const timer = setTimeout(
      () => done(new Error("Timed out reading the media file.")),
      timeoutMs,
    );
    target.addEventListener(resolveOn, onResolve);
    target.addEventListener("error", onError);
  });
}

/** Load `file` into a detached, muted media element and hand it to `read`; always cleans up. */
async function withMedia<T>(
  tag: "video" | "audio",
  file: Blob,
  timeoutMs: number,
  read: (media: HTMLMediaElement) => Promise<T>,
): Promise<T> {
  const url = URL.createObjectURL(file);
  const media = document.createElement(tag);
  media.muted = true;
  media.preload = "auto";
  if (media instanceof HTMLVideoElement) media.playsInline = true;
  try {
    const loaded = nextEvent(media, "loadedmetadata", timeoutMs);
    media.src = url;
    await loaded;
    // A recorded WebM reports an Infinity duration until it has been seeked to the end.
    if (!Number.isFinite(media.duration)) {
      const measured = nextEvent(media, "durationchange", timeoutMs);
      media.currentTime = Number.MAX_SAFE_INTEGER;
      await measured;
      if (!Number.isFinite(media.duration))
        await nextEvent(media, "durationchange", timeoutMs);
      media.currentTime = 0;
    }
    return await read(media);
  } finally {
    media.removeAttribute("src");
    media.load();
    URL.revokeObjectURL(url);
  }
}

/**
 * Read a video's duration and frame size and grab a poster frame — about one second in — as a
 * JPEG. Rejects when the browser cannot decode the file (an HEVC `.mov` in Chrome, say), so
 * upload without a poster then.
 *
 * @example
 * const { duration, width, height, poster } = await probeVideo(file);
 * await upload(poster, { variant: "poster" });
 */
export async function probeVideo(
  file: Blob,
  { at = 1, posterWidth = 1280, timeoutMs = 20_000 }: ProbeVideoOptions = {},
): Promise<VideoProbe> {
  return withMedia("video", file, timeoutMs, async (media) => {
    const video = media as HTMLVideoElement;
    const duration = video.duration;
    const target = duration > 0 ? Math.min(at, duration / 2) : 0;
    const seeked = nextEvent(video, "seeked", timeoutMs);
    video.currentTime = target;
    await seeked;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
      await nextEvent(video, "loadeddata", timeoutMs);
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) throw new Error("The video has no picture.");
    const scale = Math.min(1, posterWidth / width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No canvas to draw the poster on.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const poster = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!poster) throw new Error("Could not encode the poster.");
    return { duration, width, height, poster };
  });
}

/** Up to `count` amplitudes (the loudest sample per bucket), scaled so the loudest is 1. */
function peaksOf(buffer: AudioBuffer, count: number): number[] {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
    buffer.getChannelData(i),
  );
  const length = buffer.length;
  const buckets = Math.max(1, Math.min(count, length));
  const size = length / buckets;
  const peaks: number[] = [];
  let loudest = 0;
  for (let bucket = 0; bucket < buckets; bucket++) {
    const start = Math.floor(bucket * size);
    const end = Math.max(start + 1, Math.floor((bucket + 1) * size));
    let peak = 0;
    for (const channel of channels) {
      for (let i = start; i < end && i < length; i++) {
        const sample = Math.abs(channel[i] ?? 0);
        if (sample > peak) peak = sample;
      }
    }
    peaks.push(peak);
    if (peak > loudest) loudest = peak;
  }
  // Two decimals: the bars cannot draw finer, and the array stays small enough to store.
  return peaks.map((peak) =>
    loudest > 0 ? Math.round((peak / loudest) * 100) / 100 : 0,
  );
}

/** Decode `file` at a low sample rate (peaks need no more), or `null` when the browser cannot. */
async function decode(file: Blob): Promise<AudioBuffer | null> {
  const Offline =
    typeof OfflineAudioContext === "undefined" ? null : OfflineAudioContext;
  if (!Offline) return null;
  const bytes = await file.arrayBuffer();
  let context: OfflineAudioContext;
  try {
    context = new Offline(1, 1, 8000);
  } catch {
    context = new Offline(1, 1, 44_100);
  }
  try {
    return await context.decodeAudioData(bytes);
  } catch {
    return null;
  }
}

/**
 * Read an audio file's duration and the peaks its waveform draws — decoded in an
 * `OfflineAudioContext`, at most `count` values. Over `maxBytes` (50 MB) it skips the decode and
 * returns the duration with `peaks: []`, and the player shows a plain seek bar.
 *
 * @example
 * const { duration, peaks } = await probeAudio(file);
 * <AudioPlayer src={url} variant="waveform" peaks={peaks} />
 */
export async function probeAudio(
  file: Blob,
  {
    count = 200,
    maxBytes = 50 * MB,
    timeoutMs = 20_000,
  }: ProbeAudioOptions = {},
): Promise<AudioProbe> {
  if (file.size <= maxBytes) {
    const buffer = await decode(file);
    if (buffer)
      return { duration: buffer.duration, peaks: peaksOf(buffer, count) };
  }
  const duration = await withMedia("audio", file, timeoutMs, async (media) =>
    Number.isFinite(media.duration) ? media.duration : 0,
  );
  return { duration, peaks: [] };
}

const ZIP_END = 0x06054b50;
const ZIP_ENTRY = 0x02014b50;
const ZIP_LOCAL = 0x04034b50;
const THUMBNAIL = /^docProps\/thumbnail\.(jpe?g|png)$/i;
/** A thumbnail is a few hundred KB at most; anything claiming more is not one. */
const MAX_THUMBNAIL_BYTES = 10 * MB;

async function view(file: Blob, start: number, end: number) {
  return new DataView(await file.slice(start, end).arrayBuffer());
}

/**
 * The preview picture inside an Office file (`docProps/thumbnail.jpeg`), or `null` when it has
 * none. PowerPoint saves one by default; Word and Excel only when "Save preview picture" is on.
 * Reads the zip's central directory and that one entry — never the whole file — and inflates it
 * with the browser's `DecompressionStream`.
 *
 * @example
 * const thumbnail = await extractPptxThumbnail(file);
 * if (thumbnail) await upload(thumbnail, { variant: "preview" });
 */
export async function extractPptxThumbnail(file: Blob): Promise<Blob | null> {
  try {
    // The end-of-central-directory record: 22 bytes, then a comment of up to 64 KB.
    const tailStart = Math.max(0, file.size - (22 + 0xffff));
    const tail = await view(file, tailStart, file.size);
    let end = -1;
    for (let i = tail.byteLength - 22; i >= 0; i--) {
      if (tail.getUint32(i, true) === ZIP_END) {
        end = i;
        break;
      }
    }
    if (end < 0) return null;
    const directorySize = tail.getUint32(end + 12, true);
    const directoryStart = tail.getUint32(end + 16, true);
    // 0xffffffff marks a ZIP64 archive — not an Office file anyone uploads.
    if (directoryStart === 0xffffffff) return null;
    const directory = await view(
      file,
      directoryStart,
      directoryStart + directorySize,
    );
    const names = new TextDecoder();
    for (let at = 0; at + 46 <= directory.byteLength;) {
      if (directory.getUint32(at, true) !== ZIP_ENTRY) return null;
      const method = directory.getUint16(at + 10, true);
      const compressedSize = directory.getUint32(at + 20, true);
      const size = directory.getUint32(at + 24, true);
      const nameLength = directory.getUint16(at + 28, true);
      const extraLength = directory.getUint16(at + 30, true);
      const commentLength = directory.getUint16(at + 32, true);
      const localStart = directory.getUint32(at + 42, true);
      const name = names.decode(
        new Uint8Array(
          directory.buffer,
          directory.byteOffset + at + 46,
          nameLength,
        ),
      );
      at += 46 + nameLength + extraLength + commentLength;
      const match = THUMBNAIL.exec(name);
      if (!match) continue;
      if (size > MAX_THUMBNAIL_BYTES || compressedSize > MAX_THUMBNAIL_BYTES)
        return null;
      const type =
        match[1]!.toLowerCase() === "png" ? "image/png" : "image/jpeg";
      const local = await view(file, localStart, localStart + 30);
      if (local.getUint32(0, true) !== ZIP_LOCAL) return null;
      const dataStart =
        localStart + 30 + local.getUint16(26, true) + local.getUint16(28, true);
      const data = file.slice(dataStart, dataStart + compressedSize);
      if (method === 0) return new Blob([data], { type });
      if (method !== 8 || typeof DecompressionStream === "undefined")
        return null;
      const inflated = await new Response(
        data.stream().pipeThrough(new DecompressionStream("deflate-raw")),
      ).blob();
      return new Blob([inflated], { type });
    }
    return null;
  } catch {
    return null;
  }
}
