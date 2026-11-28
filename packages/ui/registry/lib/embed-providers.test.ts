import { describe, expect, test } from "vitest";
import {
  EMBED_FRAME_ATTRIBUTES,
  EMBED_FRAME_ORIGINS,
  EMBED_PROVIDERS,
  embedProviderOf,
  matchAppEmbed,
  matchEmbed,
  parseYouTubeTime,
} from "./embed-providers";

const ID = "dQw4w9WgXcQ";
const LOOM = "0281766fa2d04bb788eaf19e65135184";
const NOCOOKIE = `https://www.youtube-nocookie.com/embed/${ID}`;

describe("YouTube", () => {
  test.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://WWW.YouTube.com/watch?v=${ID}`,
    // Tracking parameters and a playlist are dropped: only the id is kept.
    `https://www.youtube.com/watch?v=${ID}&list=PL123&index=2&utm_source=x&si=abc`,
    `https://youtu.be/${ID}?si=Zx9_tracking-id&feature=shared`,
  ])("%s plays the video by id alone", (url) => {
    expect(EMBED_PROVIDERS.youtube.match(url)).toBe(ID);
    expect(matchEmbed(url)).toEqual({
      provider: "youtube",
      id: ID,
      src: NOCOOKIE,
    });
  });

  test("a start time is kept as the player's ?start=", () => {
    expect(matchEmbed(`https://youtu.be/${ID}?t=42`)?.src).toBe(
      `${NOCOOKIE}?start=42`,
    );
    expect(
      matchEmbed(`https://www.youtube.com/watch?v=${ID}&t=1m30s&si=x`),
    ).toEqual({
      provider: "youtube",
      id: ID,
      start: 90,
      src: `${NOCOOKIE}?start=90`,
    });
    expect(
      matchEmbed(`https://www.youtube.com/embed/${ID}?start=7`)?.start,
    ).toBe(7);
    expect(
      matchEmbed(`https://www.youtube.com/watch?v=${ID}#t=1h`)?.start,
    ).toBe(3600);
    // A time that is not one is ignored, never passed through.
    expect(matchEmbed(`https://youtu.be/${ID}?t=abc`)?.src).toBe(NOCOOKIE);
    expect(matchEmbed(`https://youtu.be/${ID}?t=0`)?.src).toBe(NOCOOKIE);
  });

  test("parseYouTubeTime reads seconds, minutes and hours", () => {
    expect(parseYouTubeTime("90")).toBe(90);
    expect(parseYouTubeTime("90s")).toBe(90);
    expect(parseYouTubeTime("2m")).toBe(120);
    expect(parseYouTubeTime("1h2m3s")).toBe(3723);
    expect(parseYouTubeTime("")).toBeNull();
    expect(parseYouTubeTime("1x")).toBeNull();
    expect(parseYouTubeTime("99h")).toBeNull();
  });

  test.each([
    // Look-alike hosts.
    `https://youtube.com.evil.com/watch?v=${ID}`,
    `https://evil.com/youtube.com/watch?v=${ID}`,
    `https://notyoutube.com/watch?v=${ID}`,
    `https://youtu.be.evil.com/${ID}`,
    `https://www.youtube.com@evil.com/watch?v=${ID}`,
    `https://user:pass@www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com:8443/watch?v=${ID}`,
    // Not https.
    `http://www.youtube.com/watch?v=${ID}`,
    `//www.youtube.com/watch?v=${ID}`,
    `www.youtube.com/watch?v=${ID}`,
    `javascript:alert(1)//https://youtu.be/${ID}`,
    `javascript://youtu.be/${ID}`,
    `data:text/html,https://youtu.be/${ID}`,
    // Ids not shaped like one.
    `https://youtu.be/${ID}x`,
    `https://youtu.be/short`,
    `https://www.youtube.com/watch?v=${ID.slice(0, 10)}%22`,
    `https://www.youtube.com/watch?v=<script>`,
    `https://www.youtube.com/watch?list=PL123`,
    `https://www.youtube.com/channel/UC123`,
    `https://www.youtube.com/embed/${ID}/extra`,
    `https://youtu.be/${ID}/extra`,
    // Whitespace or quotes anywhere: what is embedded is exactly what was written.
    ` https://youtu.be/${ID}`,
    `https://youtu.be/${ID} `,
    `https://youtu.be/${ID}"onload="x`,
  ])("%s is not a YouTube embed", (url) => {
    expect(EMBED_PROVIDERS.youtube.match(url)).toBeNull();
    expect(matchEmbed(url)).toBeNull();
  });

  test("src refuses an id that is not one", () => {
    expect(() => EMBED_PROVIDERS.youtube.src("../../evil")).toThrow(RangeError);
  });
});

describe("Loom", () => {
  test.each([
    `https://www.loom.com/share/${LOOM}`,
    `https://loom.com/share/${LOOM}`,
    `https://www.loom.com/embed/${LOOM}`,
    `https://www.loom.com/share/${LOOM}?sid=1a2b3c&t=10`,
    `https://www.loom.com/share/Quarterly-plan-walkthrough-${LOOM}`,
  ])("%s plays the video by id alone", (url) => {
    expect(EMBED_PROVIDERS.loom.match(url)).toBe(LOOM);
    expect(matchEmbed(url)).toEqual({
      provider: "loom",
      id: LOOM,
      src: `https://www.loom.com/embed/${LOOM}`,
    });
  });

  test.each([
    `https://loom.com.evil.com/share/${LOOM}`,
    `https://www.loom.com/share/${LOOM.toUpperCase()}`,
    `https://www.loom.com/share/${LOOM.slice(1)}`,
    `https://www.loom.com/looms/videos`,
    `https://www.loom.com/share/${LOOM}/extra`,
    `http://www.loom.com/share/${LOOM}`,
    `javascript:fetch('https://www.loom.com/share/${LOOM}')`,
  ])("%s is not a Loom embed", (url) => {
    expect(matchEmbed(url)).toBeNull();
  });
});

test("anything else is not an embed", () => {
  expect(matchEmbed("https://example.com/video.mp4")).toBeNull();
  expect(matchEmbed("https://vimeo.com/123456")).toBeNull();
  expect(matchEmbed("")).toBeNull();
  expect(matchEmbed(`https://youtu.be/${ID}`.padEnd(3000, "a"))).toBeNull();
});

test("the frame allowlist is the providers' origins, and the frame attributes are fixed", () => {
  expect(EMBED_FRAME_ORIGINS).toEqual([
    "https://www.youtube-nocookie.com",
    "https://www.loom.com",
  ]);
  expect(EMBED_FRAME_ATTRIBUTES).toEqual({
    loading: "lazy",
    referrerPolicy: "strict-origin-when-cross-origin",
    allow: "fullscreen; picture-in-picture; encrypted-media",
    sandbox: "allow-scripts allow-same-origin allow-popups allow-presentation",
  });
  expect(EMBED_PROVIDERS.youtube.label).toBe("YouTube video");
  expect(EMBED_PROVIDERS.loom.label).toBe("Loom video");
});

describe("the host app's recordings (app)", () => {
  const UUID = "0b0e5e2a-7c1d-4f3e-9a8b-1c2d3e4f5a6b";
  const HOSTS = ["app.vegastack.com"];
  const URL_OK = `https://app.vegastack.com/recordings/${UUID}`;

  test("a recording link on a named host is an app embed, the URL kept as written", () => {
    expect(matchAppEmbed(URL_OK, HOSTS)).toEqual({
      provider: "app",
      id: UUID,
      url: URL_OK,
    });
    expect(matchAppEmbed(URL_OK, [" App.VegaStack.com "])?.id).toBe(UUID);
    expect(embedProviderOf(URL_OK, HOSTS)).toBe("app");
  });

  test.each([
    // Another host, a look-alike, a subdomain.
    `https://evil.com/recordings/${UUID}`,
    `https://app.vegastack.com.evil.com/recordings/${UUID}`,
    `https://x.app.vegastack.com/recordings/${UUID}`,
    `https://app.vegastack.com./recordings/${UUID}`,
    // No /meetings alias, no other path.
    `https://app.vegastack.com/meetings/${UUID}`,
    `https://app.vegastack.com/recordings`,
    `https://app.vegastack.com/recordings/`,
    `https://app.vegastack.com/recordings/${UUID}/`,
    `https://app.vegastack.com/recordings/${UUID}/edit`,
    `https://app.vegastack.com/x/recordings/${UUID}`,
    `https://app.vegastack.com/recordings//${UUID}`,
    `https://app.vegastack.com/a/../recordings/${UUID}`,
    `https://app.vegastack.com/recordings%2F${UUID}`,
    `https://app.vegastack.com/RECORDINGS/${UUID}`,
    // Not a lowercase UUID.
    `https://app.vegastack.com/recordings/${UUID.toUpperCase()}`,
    `https://app.vegastack.com/recordings/123`,
    `https://app.vegastack.com/recordings/${UUID}0`,
    // Query, hash, credentials, port, scheme.
    `${URL_OK}?edit=1`,
    `${URL_OK}?`,
    `${URL_OK}#t=1`,
    `https://user:pw@app.vegastack.com/recordings/${UUID}`,
    `https://app.vegastack.com@evil.com/recordings/${UUID}`,
    `https://app.vegastack.com:8443/recordings/${UUID}`,
    // An authority URL would normalise to the host: refused as written.
    `https://app.vegastack.com:443/recordings/${UUID}`,
    `https://app.vegastack.com:/recordings/${UUID}`,
    `https://@app.vegastack.com/recordings/${UUID}`,
    `https://%61pp.vegastack.com/recordings/${UUID}`,
    `http://app.vegastack.com/recordings/${UUID}`,
    ` ${URL_OK}`,
  ])("%s is not an app embed", (url) => {
    expect(matchAppEmbed(url, HOSTS)).toBeNull();
    expect(embedProviderOf(url, HOSTS)).toBeNull();
  });

  test("without hosts nothing is an app embed, and a host entry that is not a bare name is ignored", () => {
    expect(matchAppEmbed(URL_OK, [])).toBeNull();
    expect(matchAppEmbed(URL_OK, undefined)).toBeNull();
    expect(embedProviderOf(URL_OK)).toBeNull();
    expect(
      matchAppEmbed(URL_OK, [
        "https://app.vegastack.com",
        "app.vegastack.com:443",
        "*.vegastack.com",
      ]),
    ).toBeNull();
  });

  test("an app embed adds no frame origin", () => {
    expect(EMBED_FRAME_ORIGINS).not.toContain("https://app.vegastack.com");
    expect(EMBED_FRAME_ORIGINS).toHaveLength(2);
  });
});
