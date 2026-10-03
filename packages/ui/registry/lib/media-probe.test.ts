import { describe, expect, it } from "vitest";
import { extractPptxThumbnail, probeAudio, probeVideo } from "./media-probe";

/** A 2-second, 32×24 grey VP8 WebM (744 bytes), made with ffmpeg's lavfi colour source. */
const WEBM =
  "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAK4EU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggElTbuMU6uEHFO7a1OsggKi7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjIuMTIuMTAwV0GNTGF2ZjYyLjEyLjEwMESJiECfQAAAAAAAFlSua8iuAQAAAAAAAD/XgQFzxYiP+37DGKnQ/pyBACK1nIN1bmSIgQCGhVZfVlA4g4EBI+ODhAvrwgDgkLCBILqBGJqBAlWwhFW5gQESVMNn/HNzoGPAgGfImkWjh0VOQ09ERVJEh41MYXZmNjIuMTIuMTAwc3PWY8CLY8WIj/t+wxip0P5nyKFFo4dFTkNPREVSRIeUTGF2YzYyLjI4LjEwMCBsaWJ2cHhnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAyLjAwMDAwMDAwMAAfQ7Z1QPbngQCjooEAAIAwAgCdASogABgAAEcIhYWIhYSIAgIAB5Eo2WD+aACjlYEAyACxAQABEBAAGAAYWC/0AAhwAKOVgQGQALEBAAEQEAAYABhYL/QACHAAo5WBAlgAsQEAARAQABgAGFgv9AAIcACjlYEDIACxAQABEBAAGAAYWC/0AAhwAKOVgQPoALEBAAEQEAAYABhYL/QACHAAo5WBBLAAsQEAARAQABgAGFgv9AAIcACjlYEFeACxAQABEBAUYABhYL/QACHAAKOVgQZAALEBAAEQEAAYABhYL/QACHAAo5WBBwgAsQEAARAQABgAGFgv9AAIcAAcU7trkbuPs4EAt4r3gQHxggGm8IED";

function bytesOf(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/** A mono 16-bit PCM WAV: one second of a 440 Hz tone whose second half is silent. */
function wav(seconds = 1, rate = 8000): Blob {
  const samples = Math.round(seconds * rate);
  const data = new DataView(new ArrayBuffer(44 + samples * 2));
  const text = (at: number, value: string) =>
    [...value].forEach((c, i) => data.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  data.setUint32(4, 36 + samples * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true);
  data.setUint16(22, 1, true);
  data.setUint32(24, rate, true);
  data.setUint32(28, rate * 2, true);
  data.setUint16(32, 2, true);
  data.setUint16(34, 16, true);
  text(36, "data");
  data.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const loud = i < samples / 2 ? 0.8 : 0;
    const value = Math.sin((2 * Math.PI * 440 * i) / rate) * loud;
    data.setInt16(44 + i * 2, Math.round(value * 32767), true);
  }
  return new Blob([data.buffer], { type: "audio/wav" });
}

/** A minimal zip with the given entries, stored (0) or deflated (8). */
async function zip(
  entries: { name: string; data: Uint8Array<ArrayBuffer>; deflate?: boolean }[],
): Promise<Blob> {
  const encoder = new TextEncoder();
  const locals: Uint8Array<ArrayBuffer>[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const body = entry.deflate
      ? new Uint8Array(
          await new Response(
            new Blob([entry.data])
              .stream()
              .pipeThrough(new CompressionStream("deflate-raw")),
          ).arrayBuffer(),
        )
      : entry.data;
    const local = new DataView(new ArrayBuffer(30 + name.length));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(8, entry.deflate ? 8 : 0, true);
    local.setUint32(18, body.length, true);
    local.setUint32(22, entry.data.length, true);
    local.setUint16(26, name.length, true);
    new Uint8Array(local.buffer).set(name, 30);
    const record = new DataView(new ArrayBuffer(46 + name.length));
    record.setUint32(0, 0x02014b50, true);
    record.setUint16(10, entry.deflate ? 8 : 0, true);
    record.setUint32(20, body.length, true);
    record.setUint32(24, entry.data.length, true);
    record.setUint16(28, name.length, true);
    record.setUint32(42, offset, true);
    new Uint8Array(record.buffer).set(name, 46);
    locals.push(new Uint8Array(local.buffer), body);
    central.push(new Uint8Array(record.buffer));
    offset += local.byteLength + body.length;
  }
  const size = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...locals, ...central, new Uint8Array(end.buffer)]);
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 0xff, 0xd9]);

describe("probeVideo", () => {
  it("reads the duration, the frame size and a JPEG poster", async () => {
    const file = new Blob([bytesOf(WEBM)], { type: "video/webm" });
    const probe = await probeVideo(file);
    expect(probe.duration).toBeCloseTo(2, 0);
    expect(probe.width).toBe(32);
    expect(probe.height).toBe(24);
    expect(probe.poster.type).toBe("image/jpeg");
    expect(probe.poster.size).toBeGreaterThan(0);
  });
  it("scales the poster down to posterWidth", async () => {
    const file = new Blob([bytesOf(WEBM)], { type: "video/webm" });
    const probe = await probeVideo(file, { posterWidth: 16 });
    const bitmap = await createImageBitmap(probe.poster);
    expect(bitmap.width).toBe(16);
    expect(bitmap.height).toBe(12);
  });
  it("rejects a file the browser cannot decode", async () => {
    const file = new Blob([new Uint8Array(64)], { type: "video/mp4" });
    await expect(probeVideo(file, { timeoutMs: 5000 })).rejects.toThrow();
  });
});

describe("probeAudio", () => {
  it("decodes the duration and at most 200 peaks, loudest scaled to 1", async () => {
    const probe = await probeAudio(wav());
    expect(probe.duration).toBeCloseTo(1, 1);
    expect(probe.peaks.length).toBe(200);
    expect(Math.max(...probe.peaks)).toBe(1);
    // The silent second half draws flat.
    expect(probe.peaks.slice(110).every((peak) => peak < 0.05)).toBe(true);
    expect(probe.peaks.slice(0, 90).every((peak) => peak > 0.5)).toBe(true);
  });
  it("takes a peak count", async () => {
    const probe = await probeAudio(wav(), { count: 32 });
    expect(probe.peaks.length).toBe(32);
  });
  it("skips the decode over maxBytes and still reads the duration", async () => {
    const probe = await probeAudio(wav(), { maxBytes: 100 });
    expect(probe.peaks).toEqual([]);
    expect(probe.duration).toBeCloseTo(1, 1);
  });
});

describe("extractPptxThumbnail", () => {
  it("reads a deflated docProps/thumbnail.jpeg out of the zip", async () => {
    const file = await zip([
      {
        name: "[Content_Types].xml",
        data: new TextEncoder().encode("<Types/>"),
      },
      { name: "docProps/thumbnail.jpeg", data: JPEG, deflate: true },
    ]);
    const thumbnail = await extractPptxThumbnail(file);
    expect(thumbnail?.type).toBe("image/jpeg");
    expect(new Uint8Array(await thumbnail!.arrayBuffer())).toEqual(JPEG);
  });
  it("reads a stored thumbnail too", async () => {
    const file = await zip([{ name: "docProps/thumbnail.jpeg", data: JPEG }]);
    const thumbnail = await extractPptxThumbnail(file);
    expect(new Uint8Array(await thumbnail!.arrayBuffer())).toEqual(JPEG);
  });
  it("returns null without a thumbnail, and for a file that is not a zip", async () => {
    const file = await zip([
      { name: "ppt/slides/slide1.xml", data: new TextEncoder().encode("<p/>") },
    ]);
    expect(await extractPptxThumbnail(file)).toBeNull();
    expect(await extractPptxThumbnail(new Blob(["not a zip"]))).toBeNull();
  });
});

it("rejects observed inflate output exceeding the forged declared thumbnail size", async () => {
  const file = await zip([
    {
      name: "docProps/thumbnail.jpeg",
      data: new Uint8Array(1024 * 1024),
      deflate: true,
    },
  ]);
  const bytes = await file.arrayBuffer();
  const view = new DataView(bytes);
  const directory = view.getUint32(bytes.byteLength - 6, true);
  view.setUint32(directory + 24, 1, true);
  expect(await extractPptxThumbnail(new Blob([bytes]))).toBeNull();
});
