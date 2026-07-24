import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const APP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const OUT_DIR = path.join(APP_DIR, "out");
const PUBLIC_CONTENT_DIR = path.join(APP_DIR, "content/docs");
const INTERNAL_CONTENT_DIR = path.join(APP_DIR, "content/internal");
const MARKDOWN_MANIFEST = path.join(
  APP_DIR,
  ".generated/markdown-manifest.json",
);
const BASE_URL = "https://design.vegastack.com";
const DOC_TITLE_SUFFIX = " · VegaStack Design";
const HOME_TITLE = "VegaStack Design — Components, Tokens & Patterns";
const DEFAULT_DESCRIPTION =
  "VegaStack components, design tokens, interaction patterns, implementation guidance, and authenticated registry installation for product teams and AI agents.";
const PRIVATE_ROBOTS = [
  "noindex",
  "nofollow",
  "noarchive",
  "nosnippet",
  "noimageindex",
];
const SITE_VISIBILITY = process.env.SITE_VISIBILITY ?? "private";

assert.ok(
  SITE_VISIBILITY === "private" || SITE_VISIBILITY === "public",
  `invalid SITE_VISIBILITY: ${SITE_VISIBILITY}`,
);

async function walk(dir, predicate = () => true) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute, predicate)));
    else if (predicate(absolute)) files.push(absolute);
  }
  return files;
}

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [
      match[1],
      decodeHtml(match[2]),
    ]),
  );
}

function parseHead(html) {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map((match) =>
    attributes(match[0]),
  );
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((match) =>
    attributes(match[0]),
  );
  const structuredData = [
    ...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g),
  ].map((match) => JSON.parse(match[1]));
  const byName = (name) => meta.filter((item) => item.name === name);
  const byProperty = (property) =>
    meta.filter((item) => item.property === property);
  const byRel = (rel) =>
    links.filter((item) => item.rel?.split(" ").includes(rel));
  return {
    title: titleMatch ? decodeHtml(titleMatch[1]) : "",
    byName,
    byProperty,
    byRel,
    structuredData,
  };
}

function only(items, label, pageUrl) {
  assert.equal(
    items.length,
    1,
    `${pageUrl}: expected exactly one ${label}, found ${items.length}`,
  );
  return items[0];
}

function canonicalForRoute(route) {
  return route === "/" ? BASE_URL : `${BASE_URL}${route}`;
}

function routeForHtml(file) {
  const relative = path.relative(OUT_DIR, file).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  return `/${relative.replace(/\.html$/, "")}`;
}

function outputPathForUrl(value) {
  const url = new URL(value);
  let output = path.join(OUT_DIR, url.pathname.replace(/^\//, ""));
  if (url.pathname.endsWith("/")) output = path.join(output, "index.html");
  return output;
}

function parseFrontmatter(file, contents, baseRoute) {
  const frontmatter = contents.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(frontmatter, `${file}: missing frontmatter`);
  const value = (key) => {
    const match = frontmatter[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    if (!match) return undefined;
    const raw = match[1].trim();
    return /^(?:"[\s\S]*"|'[\s\S]*')$/.test(raw) ? raw.slice(1, -1) : raw;
  };
  const relative = path
    .relative(baseRoute.contentDir, file)
    .replaceAll(path.sep, "/");
  const slug = relative.replace(/\.mdx$/, "");
  const route =
    slug === "index" ? baseRoute.route : `${baseRoute.route}/${slug}`;
  return {
    file,
    route,
    title: value("title"),
    description: value("description"),
    audience: value("audience"),
    body: contents.slice(frontmatter[0].length).trim(),
    lastModified: (() => {
      try {
        const value = execFileSync(
          "git",
          ["log", "-1", "--format=%aI", "--", file],
          {
            encoding: "utf8",
          },
        ).trim();
        return value ? new Date(value).toISOString() : undefined;
      } catch {
        return undefined;
      }
    })(),
  };
}

function normalizeLeakText(value) {
  return decodeHtml(value)
    .replace(/\\[nrt]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#|{}\[\]();,:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function leakSentinels(record, publicCorpus) {
  const candidates = record.body
    .replace(/^```[^\n]*$/gm, "")
    .replace(/^---+$/gm, "")
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map(normalizeLeakText)
    .filter((value) => value.length >= 48)
    .map((value) =>
      value.length <= 240 ? value : value.slice(0, 240).replace(/\s+\S*$/, ""),
    )
    .filter((value) => !publicCorpus.includes(value));
  return [...new Set(candidates)];
}

async function contentRecords(contentDir, route) {
  const files = await walk(contentDir, (file) => file.endsWith(".mdx"));
  return Promise.all(
    files.map(async (file) =>
      parseFrontmatter(file, await readFile(file, "utf8"), {
        contentDir,
        route,
      }),
    ),
  );
}

function findStructuredType(structuredData, type) {
  return structuredData
    .flatMap((value) => value["@graph"] ?? [value])
    .filter((value) => value["@type"] === type);
}

function assertStructuredUrls(value, label) {
  if (Array.isArray(value)) {
    for (const item of value) assertStructuredUrls(item, label);
    return;
  }
  if (value && typeof value === "object") {
    for (const child of Object.values(value))
      assertStructuredUrls(child, label);
    return;
  }
  if (typeof value !== "string" || !/^https?:\/\//.test(value)) return;
  if (value === "https://schema.org") return;
  assert.equal(
    new URL(value).origin,
    BASE_URL,
    `${label}: structured data references another host`,
  );
}

function paeth(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}

function decodePng(bytes, label) {
  assert.equal(
    bytes.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    `${label}: PNG signature`,
  );
  let offset = 8;
  let ihdr;
  const idat = [];
  let transparency;
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") ihdr = data;
    if (type === "IDAT") idat.push(data);
    if (type === "tRNS") transparency = data;
    offset += 12 + length;
    if (type === "IEND") break;
  }
  assert.ok(ihdr, `${label}: missing IHDR`);
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];
  const interlace = ihdr[12];
  assert.equal(bitDepth, 8, `${label}: expected 8-bit PNG`);
  assert.equal(
    interlace,
    0,
    `${label}: interlaced PNG is unsupported by verifier`,
  );
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  assert.ok(channels, `${label}: unsupported PNG color type ${colorType}`);
  const stride = width * channels;
  const inflated = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(height * stride);
  let inputOffset = 0;
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = inflated[inputOffset++];
    const current = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const raw = inflated[inputOffset++];
      const left = x >= channels ? current[x - channels] : 0;
      const up = previous[x] ?? 0;
      const upLeft = x >= channels ? previous[x - channels] : 0;
      const predictor =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? Math.floor((left + up) / 2)
                : filter === 4
                  ? paeth(left, up, upLeft)
                  : Number.NaN;
      assert.equal(
        Number.isNaN(predictor),
        false,
        `${label}: unsupported PNG filter ${filter}`,
      );
      current[x] = (raw + predictor) & 0xff;
    }
    current.copy(pixels, y * stride);
    previous = current;
  }
  return { width, height, colorType, channels, pixels, transparency };
}

function assertPng(
  bytes,
  expectedWidth,
  expectedHeight,
  label,
  { opaque = false } = {},
) {
  const png = decodePng(bytes, label);
  assert.equal(png.width, expectedWidth, `${label}: incorrect width`);
  assert.equal(png.height, expectedHeight, `${label}: incorrect height`);
  if (opaque) {
    if (png.colorType === 6 || png.colorType === 4) {
      const alphaIndex = png.channels - 1;
      for (
        let index = alphaIndex;
        index < png.pixels.length;
        index += png.channels
      ) {
        assert.equal(
          png.pixels[index],
          255,
          `${label}: contains translucent pixels`,
        );
      }
    } else if (png.colorType === 3 && png.transparency) {
      for (const alpha of png.transparency) {
        assert.equal(alpha, 255, `${label}: palette contains transparency`);
      }
    }
  }
  return png;
}

function assertOgPng(bytes, label) {
  const png = assertPng(bytes, 1200, 630, label, { opaque: true });
  const foreground = [230, 229, 227];
  assert.ok(
    png.colorType === 2 || png.colorType === 6,
    `${label}: expected an RGB(A) PNG`,
  );

  for (let y = 0; y < 6; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * png.channels;
      if (
        png.pixels[offset] !== foreground[0] ||
        png.pixels[offset + 1] !== foreground[1] ||
        png.pixels[offset + 2] !== foreground[2]
      ) {
        assert.fail(
          `${label}: the 6px top rule is not uniformly off-white at ${x},${y}`,
        );
      }
    }
  }

  const belowRule = 6 * png.width * png.channels;
  assert.notDeepEqual(
    [...png.pixels.subarray(belowRule, belowRule + 3)],
    foreground,
    `${label}: the off-white top rule must be exactly 6px high`,
  );
  for (let offset = 0; offset < png.pixels.length; offset += png.channels) {
    if (
      png.pixels[offset] === 86 &&
      png.pixels[offset + 1] === 245 &&
      png.pixels[offset + 2] === 124
    ) {
      assert.fail(`${label}: former green branding pixel remains`);
    }
  }
  return png;
}

function assertIcoFrames(bytes) {
  assert.equal(bytes.readUInt16LE(0), 0, "favicon.ico: invalid reserved field");
  assert.equal(bytes.readUInt16LE(2), 1, "favicon.ico: invalid type");
  const count = bytes.readUInt16LE(4);
  const frames = [];
  for (let index = 0; index < count; index++) {
    const offset = 6 + index * 16;
    frames.push({
      width: bytes[offset] || 256,
      height: bytes[offset + 1] || 256,
      length: bytes.readUInt32LE(offset + 8),
      imageOffset: bytes.readUInt32LE(offset + 12),
    });
  }
  assert.deepEqual(
    frames.map(({ width, height }) => ({ width, height })),
    [
      { width: 16, height: 16 },
      { width: 32, height: 32 },
      { width: 48, height: 48 },
    ],
  );
  for (const frame of frames) {
    assert.ok(frame.length > 0, `favicon.ico ${frame.width}px frame is empty`);
    assert.ok(
      frame.imageOffset + frame.length <= bytes.length,
      `favicon.ico ${frame.width}px frame exceeds the file bounds`,
    );
    assertPng(
      bytes.subarray(frame.imageOffset, frame.imageOffset + frame.length),
      frame.width,
      frame.height,
      `favicon.ico ${frame.width}px frame`,
      { opaque: true },
    );
  }
}

function getFontTable(bytes, tag, label) {
  if (bytes.subarray(0, 4).toString("ascii") === "wOFF") {
    const tableCount = bytes.readUInt16BE(12);
    for (let index = 0; index < tableCount; index++) {
      const entry = 44 + index * 20;
      if (bytes.subarray(entry, entry + 4).toString("ascii") !== tag) continue;
      const offset = bytes.readUInt32BE(entry + 4);
      const compressedLength = bytes.readUInt32BE(entry + 8);
      const originalLength = bytes.readUInt32BE(entry + 12);
      const table = bytes.subarray(offset, offset + compressedLength);
      return compressedLength === originalLength ? table : inflateSync(table);
    }
  } else {
    const tableCount = bytes.readUInt16BE(4);
    for (let index = 0; index < tableCount; index++) {
      const entry = 12 + index * 16;
      if (bytes.subarray(entry, entry + 4).toString("ascii") !== tag) continue;
      const offset = bytes.readUInt32BE(entry + 8);
      const length = bytes.readUInt32BE(entry + 12);
      return bytes.subarray(offset, offset + length);
    }
  }
  assert.fail(`${label}: missing ${tag} font table`);
}

function fontSupports(bytes, codePoint, label) {
  const cmap = getFontTable(bytes, "cmap", label);
  const subtableCount = cmap.readUInt16BE(2);
  for (let index = 0; index < subtableCount; index++) {
    const subtableOffset = cmap.readUInt32BE(4 + index * 8 + 4);
    const format = cmap.readUInt16BE(subtableOffset);
    if (format === 12) {
      const groupCount = cmap.readUInt32BE(subtableOffset + 12);
      for (let group = 0; group < groupCount; group++) {
        const groupOffset = subtableOffset + 16 + group * 12;
        const start = cmap.readUInt32BE(groupOffset);
        const end = cmap.readUInt32BE(groupOffset + 4);
        if (codePoint >= start && codePoint <= end) {
          return cmap.readUInt32BE(groupOffset + 8) + codePoint - start !== 0;
        }
      }
    }
    if (format === 4 && codePoint <= 0xffff) {
      const segmentCount = cmap.readUInt16BE(subtableOffset + 6) / 2;
      const endCodes = subtableOffset + 14;
      const startCodes = endCodes + segmentCount * 2 + 2;
      const idDeltas = startCodes + segmentCount * 2;
      const idRangeOffsets = idDeltas + segmentCount * 2;
      for (let segment = 0; segment < segmentCount; segment++) {
        const end = cmap.readUInt16BE(endCodes + segment * 2);
        const start = cmap.readUInt16BE(startCodes + segment * 2);
        if (codePoint < start || codePoint > end) continue;
        const delta = cmap.readInt16BE(idDeltas + segment * 2);
        const rangeOffsetAddress = idRangeOffsets + segment * 2;
        const rangeOffset = cmap.readUInt16BE(rangeOffsetAddress);
        if (rangeOffset === 0) return ((codePoint + delta) & 0xffff) !== 0;
        const glyphAddress =
          rangeOffsetAddress + rangeOffset + (codePoint - start) * 2;
        if (glyphAddress + 2 > cmap.length) return false;
        const glyph = cmap.readUInt16BE(glyphAddress);
        return glyph !== 0 && ((glyph + delta) & 0xffff) !== 0;
      }
    }
  }
  return false;
}

async function verifyPage(file, record, kind) {
  const html = await readFile(file, "utf8");
  const route = record?.route ?? "/";
  const pageUrl = canonicalForRoute(route);
  const head = parseHead(html);
  const isHome = kind === "home";
  const isInternal = kind === "internal";

  assert.ok(head.title, `${pageUrl}: missing title`);
  assert.equal(
    head.title,
    isHome ? HOME_TITLE : `${record.title}${DOC_TITLE_SUFFIX}`,
    `${pageUrl}: incorrect title convention`,
  );

  const description = only(
    head.byName("description"),
    "description",
    pageUrl,
  ).content;
  assert.ok(
    description.length >= 60 && description.length <= 160,
    `${pageUrl}: description budget`,
  );
  if (record)
    assert.equal(
      description,
      record.description,
      `${pageUrl}: source description drift`,
    );
  assert.equal(
    only(head.byRel("canonical"), "canonical link", pageUrl).href,
    pageUrl,
  );

  const expectedOpenGraph = [
    "og:title",
    "og:description",
    "og:url",
    "og:site_name",
    "og:type",
    "og:image",
    "og:image:width",
    "og:image:height",
    "og:image:type",
    "og:image:alt",
  ];
  const og = Object.fromEntries(
    expectedOpenGraph.map((property) => [
      property,
      only(head.byProperty(property), property, pageUrl).content,
    ]),
  );
  assert.equal(og["og:url"], pageUrl, `${pageUrl}: incorrect og:url`);
  assert.equal(
    og["og:site_name"],
    "VegaStack Design",
    `${pageUrl}: incorrect og:site_name`,
  );
  assert.equal(
    og["og:type"],
    isHome ? "website" : "article",
    `${pageUrl}: incorrect og:type`,
  );
  assert.equal(
    og["og:image:width"],
    "1200",
    `${pageUrl}: incorrect OG width metadata`,
  );
  assert.equal(
    og["og:image:height"],
    "630",
    `${pageUrl}: incorrect OG height metadata`,
  );
  assert.equal(
    og["og:image:type"],
    "image/png",
    `${pageUrl}: incorrect OG MIME metadata`,
  );
  assert.ok(og["og:image:alt"], `${pageUrl}: empty OG image alt`);
  assert.equal(
    og["og:title"],
    head.title,
    `${pageUrl}: Open Graph title drift`,
  );
  assert.equal(
    og["og:description"],
    description,
    `${pageUrl}: description drift`,
  );

  const expectedTwitter = [
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "twitter:image:width",
    "twitter:image:height",
    "twitter:image:type",
    "twitter:image:alt",
  ];
  const twitter = Object.fromEntries(
    expectedTwitter.map((name) => [
      name,
      only(head.byName(name), name, pageUrl).content,
    ]),
  );
  assert.equal(
    twitter["twitter:card"],
    "summary_large_image",
    `${pageUrl}: wrong Twitter card`,
  );
  assert.equal(
    twitter["twitter:title"],
    og["og:title"],
    `${pageUrl}: social title drift`,
  );
  assert.equal(
    twitter["twitter:description"],
    description,
    `${pageUrl}: Twitter description drift`,
  );
  assert.equal(
    twitter["twitter:image"],
    og["og:image"],
    `${pageUrl}: social image drift`,
  );
  assert.equal(
    twitter["twitter:image:alt"],
    og["og:image:alt"],
    `${pageUrl}: social alt drift`,
  );
  assert.equal(
    twitter["twitter:image:width"],
    og["og:image:width"],
    `${pageUrl}: Twitter width drift`,
  );
  assert.equal(
    twitter["twitter:image:height"],
    og["og:image:height"],
    `${pageUrl}: Twitter height drift`,
  );
  assert.equal(
    twitter["twitter:image:type"],
    og["og:image:type"],
    `${pageUrl}: Twitter MIME drift`,
  );

  if (!isHome && record.lastModified) {
    assert.equal(
      only(
        head.byProperty("article:modified_time"),
        "article modified time",
        pageUrl,
      ).content,
      record.lastModified,
      `${pageUrl}: Git-derived modified time drift`,
    );
  }

  const robots = only(
    head.byName("robots"),
    "robots metadata",
    pageUrl,
  ).content;
  if (isInternal || SITE_VISIBILITY === "private") {
    for (const directive of PRIVATE_ROBOTS) {
      assert.ok(
        robots.includes(directive),
        `${pageUrl}: robots metadata missing ${directive}`,
      );
    }
  } else {
    assert.ok(
      robots.includes("index"),
      `${pageUrl}: public robots missing index`,
    );
    assert.ok(
      robots.includes("follow"),
      `${pageUrl}: public robots missing follow`,
    );
    assert.equal(
      robots.includes("noindex"),
      false,
      `${pageUrl}: public page is noindex`,
    );
  }

  const imageUrl = new URL(og["og:image"]);
  assert.equal(
    imageUrl.origin,
    BASE_URL,
    `${pageUrl}: OG image uses another origin`,
  );
  if (isInternal) {
    assert.equal(
      imageUrl.pathname,
      "/og/home/image.png",
      `${pageUrl}: internal page leaks a titled OG`,
    );
  } else if (!isHome) {
    assert.ok(
      imageUrl.pathname.startsWith("/og/docs/"),
      `${pageUrl}: missing page-specific OG image`,
    );
  }
  const imagePath = outputPathForUrl(og["og:image"]);
  assert.equal(
    (await stat(imagePath)).isFile(),
    true,
    `${pageUrl}: missing OG image ${imagePath}`,
  );
  assertOgPng(await readFile(imagePath), `${pageUrl} OG image`);

  const organizations = findStructuredType(head.structuredData, "Organization");
  const websites = findStructuredType(head.structuredData, "WebSite");
  assert.equal(
    organizations.length,
    1,
    `${pageUrl}: missing Organization JSON-LD`,
  );
  assert.equal(websites.length, 1, `${pageUrl}: missing WebSite JSON-LD`);
  assert.deepEqual(organizations[0], {
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "VegaStack",
    url: `${BASE_URL}/`,
    logo: `${BASE_URL}/brand/icon-512.png`,
  });
  assert.deepEqual(websites[0], {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "VegaStack Design",
    description: DEFAULT_DESCRIPTION,
    url: `${BASE_URL}/`,
    publisher: { "@id": `${BASE_URL}/#organization` },
  });
  assertStructuredUrls(head.structuredData, pageUrl);

  if (kind === "public-doc") {
    const articles = findStructuredType(head.structuredData, "TechArticle");
    const breadcrumbs = findStructuredType(
      head.structuredData,
      "BreadcrumbList",
    );
    assert.equal(articles.length, 1, `${pageUrl}: missing TechArticle JSON-LD`);
    assert.equal(
      breadcrumbs.length,
      1,
      `${pageUrl}: missing BreadcrumbList JSON-LD`,
    );
    assert.equal(articles[0].url, pageUrl, `${pageUrl}: TechArticle URL drift`);
    assert.equal(
      articles[0].headline,
      record.title,
      `${pageUrl}: TechArticle title drift`,
    );
    assert.equal(
      articles[0]["@id"],
      `${pageUrl}#article`,
      `${pageUrl}: TechArticle ID drift`,
    );
    assert.equal(
      articles[0].description,
      record.description,
      `${pageUrl}: TechArticle description drift`,
    );
    assert.equal(
      articles[0].mainEntityOfPage,
      pageUrl,
      `${pageUrl}: TechArticle mainEntity drift`,
    );
    assert.deepEqual(articles[0].publisher, {
      "@id": `${BASE_URL}/#organization`,
    });
    assert.deepEqual(articles[0].isPartOf, { "@id": `${BASE_URL}/#website` });
    if (record.lastModified) {
      assert.equal(
        articles[0].dateModified,
        record.lastModified,
        `${pageUrl}: TechArticle date drift`,
      );
    } else {
      assert.equal(
        articles[0].dateModified,
        undefined,
        `${pageUrl}: unexpected TechArticle date`,
      );
    }
    const expectedBreadcrumbs = [
      {
        "@type": "ListItem",
        position: 1,
        name: "VegaStack Design",
        item: `${BASE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: record.route === "/docs" ? record.title : "Docs",
        item: `${BASE_URL}/docs`,
      },
      ...(record.route === "/docs"
        ? []
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: record.title,
              item: pageUrl,
            },
          ]),
    ];
    assert.equal(breadcrumbs[0]["@id"], `${pageUrl}#breadcrumbs`);
    assert.deepEqual(breadcrumbs[0].itemListElement, expectedBreadcrumbs);
  }
}

const publicRecords = await contentRecords(PUBLIC_CONTENT_DIR, "/docs");
const internalRecords = await contentRecords(INTERNAL_CONTENT_DIR, "/internal");
assert.equal(
  publicRecords.every(({ audience }) => audience === "public"),
  true,
);
assert.equal(
  internalRecords.every(({ audience }) => audience === "internal"),
  true,
);
assert.equal(
  new Set(publicRecords.map(({ title }) => title)).size,
  publicRecords.length,
  "public titles must be unique",
);
assert.equal(
  new Set(internalRecords.map(({ title }) => title)).size,
  internalRecords.length,
  "internal titles must be unique",
);

const publicByRoute = new Map(
  publicRecords.map((record) => [record.route, record]),
);
const internalByRoute = new Map(
  internalRecords.map((record) => [record.route, record]),
);
const nestedDocsHtml = await walk(path.join(OUT_DIR, "docs"), (file) =>
  file.endsWith(".html"),
);
const docsHtml = [path.join(OUT_DIR, "docs.html"), ...nestedDocsHtml];
const internalHtml = await walk(path.join(OUT_DIR, "internal"), (file) =>
  file.endsWith(".html"),
);
assert.equal(
  docsHtml.length,
  publicRecords.length,
  "public HTML count does not match source",
);
assert.equal(
  internalHtml.length,
  internalRecords.length,
  "internal HTML count does not match source",
);

await verifyPage(path.join(OUT_DIR, "index.html"), undefined, "home");
for (const file of docsHtml) {
  const route = routeForHtml(file);
  await verifyPage(file, publicByRoute.get(route), "public-doc");
}
for (const file of internalHtml) {
  const route = routeForHtml(file);
  await verifyPage(file, internalByRoute.get(route), "internal");
}

const homeHtml = await readFile(path.join(OUT_DIR, "index.html"), "utf8");
const homeHead = parseHead(homeHtml);
assert.equal(
  only(homeHead.byRel("manifest"), "manifest link", BASE_URL).href,
  "/manifest.webmanifest",
);
assert.equal(
  homeHead.byRel("icon").some(({ href }) => href?.startsWith("/favicon.ico")),
  true,
  "home metadata is missing favicon.ico",
);
assert.equal(
  homeHead.byRel("icon").some(({ href }) => href?.startsWith("/icon.svg")),
  true,
  "home metadata is missing themed SVG icon",
);
assert.equal(
  only(
    homeHead.byRel("apple-touch-icon"),
    "Apple touch icon",
    BASE_URL,
  ).href?.startsWith("/apple-icon.png"),
  true,
);

const ogImages = await walk(path.join(OUT_DIR, "og/docs"), (file) =>
  file.endsWith("/image.png"),
);
assert.equal(
  ogImages.length,
  publicRecords.length,
  "public OG count does not match source",
);

const commandOg = await readFile(
  path.join(OUT_DIR, "og/docs/components/command/image.png"),
);
assertOgPng(commandOg, "command OG fixture");

for (const relative of [
  "favicon.ico",
  "apple-icon.png",
  "icon.svg",
  "manifest.webmanifest",
  "brand/icon-192.png",
  "brand/icon-512.png",
  "brand/vegastack-mark.svg",
  "brand/vegastack-wordmark.svg",
]) {
  assert.equal(
    (await stat(path.join(OUT_DIR, relative))).isFile(),
    true,
    `missing asset: ${relative}`,
  );
}

assertIcoFrames(await readFile(path.join(OUT_DIR, "favicon.ico")));
assertPng(
  await readFile(path.join(OUT_DIR, "apple-icon.png")),
  180,
  180,
  "Apple icon",
  {
    opaque: true,
  },
);
assertPng(
  await readFile(path.join(OUT_DIR, "brand/icon-192.png")),
  192,
  192,
  "192px icon",
  {
    opaque: true,
  },
);
assertPng(
  await readFile(path.join(OUT_DIR, "brand/icon-512.png")),
  512,
  512,
  "512px icon",
  {
    opaque: true,
  },
);

const markSvg = await readFile(
  path.join(OUT_DIR, "brand/vegastack-mark.svg"),
  "utf8",
);
const iconSvg = await readFile(path.join(OUT_DIR, "icon.svg"), "utf8");
assert.equal(
  createHash("sha256").update(markSvg).digest("hex"),
  "ac6ecae3efb0fe0b7072f0cf5ca1e0faf2226f3e39dbbd14f99ae707b3c92319",
  "normalized official V mark drifted from its recorded provenance",
);
const markPath = only(
  [...markSvg.matchAll(/<path\b[^>]*d="([^"]+)"/g)],
  "V mark path",
  BASE_URL,
)[1];
const iconPath = only(
  [...iconSvg.matchAll(/<path\b[^>]*d="([^"]+)"/g)],
  "app icon path",
  BASE_URL,
)[1];
assert.equal(
  iconPath.replace(/\s+/g, ""),
  markPath.replace(/\s+/g, ""),
  "themed app icon does not preserve the official V path",
);
assert.match(
  iconSvg,
  /prefers-color-scheme:\s*dark/,
  "themed SVG icon lacks dark mode",
);
const wordmarkSvg = await readFile(
  path.join(OUT_DIR, "brand/vegastack-wordmark.svg"),
  "utf8",
);
assert.equal(
  createHash("sha256").update(wordmarkSvg).digest("hex"),
  "38e893431431bf0a92e10bbdac3495293b29d4e824beb67d5c4484cc5e5cef28",
  "normalized official wordmark drifted from its recorded provenance",
);
assert.equal(
  [...wordmarkSvg.matchAll(/<path\b/g)].length,
  9,
  "wordmark path count drifted",
);

const manifest = JSON.parse(
  await readFile(path.join(OUT_DIR, "manifest.webmanifest"), "utf8"),
);
assert.equal(manifest.name, "VegaStack Design");
assert.equal(manifest.short_name, "VegaStack Design");
assert.equal(manifest.description, DEFAULT_DESCRIPTION);
assert.equal(manifest.start_url, "/");
assert.equal(manifest.display, "standalone");
const colorHex = (channels) =>
  `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
assert.equal(manifest.background_color, colorHex([253, 253, 252]));
assert.equal(manifest.theme_color, colorHex([17, 16, 15]));
assert.deepEqual(
  manifest.icons.map(({ src, sizes, type }) => ({ src, sizes, type })),
  [
    { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
);

const sitemap = await readFile(path.join(OUT_DIR, "sitemap.xml"), "utf8");
const sitemapEntries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
  (match) => ({
    url: match[1].match(/<loc>([^<]+)<\/loc>/)?.[1],
    lastModified: match[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
  }),
);
const sitemapUrls = sitemapEntries.map(({ url }) => url);
const expectedSitemapUrls = [
  `${BASE_URL}/`,
  ...publicRecords.map(({ route }) => canonicalForRoute(route)),
];
assert.deepEqual(
  new Set(sitemapUrls),
  new Set(expectedSitemapUrls),
  "sitemap URL set is incomplete",
);
assert.equal(
  sitemapUrls.length,
  expectedSitemapUrls.length,
  "sitemap has duplicate or extra URLs",
);
for (const record of publicRecords) {
  const entry = sitemapEntries.find(
    ({ url }) => url === canonicalForRoute(record.route),
  );
  assert.ok(entry, `sitemap is missing ${record.route}`);
  if (record.lastModified) {
    assert.equal(
      entry.lastModified,
      record.lastModified,
      `sitemap lastModified drifted for ${record.route}`,
    );
  } else {
    assert.equal(
      entry.lastModified,
      undefined,
      `sitemap has an untracked lastModified for ${record.route}`,
    );
  }
}
assert.equal(
  sitemapUrls.some((url) =>
    /\/(?:r|internal|og|llms|api)(?:\/|$)|\.md$/.test(url),
  ),
  false,
  "sitemap contains a non-HTML or protected route",
);

const robotsTxt = await readFile(path.join(OUT_DIR, "robots.txt"), "utf8");
if (SITE_VISIBILITY === "public") {
  assert.match(robotsTxt, /Allow: \//);
  assert.match(robotsTxt, /Disallow: \/r\//);
  assert.match(robotsTxt, /Disallow: \/internal\//);
  assert.match(
    robotsTxt,
    /Sitemap: https:\/\/design\.vegastack\.com\/sitemap\.xml/,
  );
} else {
  assert.match(robotsTxt, /Disallow: \//);
  assert.doesNotMatch(robotsTxt, /Sitemap:/);
}

const markdownManifest = JSON.parse(await readFile(MARKDOWN_MANIFEST, "utf8"));
assert.equal(markdownManifest.publicPages, publicRecords.length);
assert.equal(markdownManifest.internalPages, internalRecords.length);
assert.equal(
  markdownManifest.entries.length,
  publicRecords.length + internalRecords.length,
);
assert.equal(
  new Set(markdownManifest.entries.map(({ route }) => route)).size,
  markdownManifest.entries.length,
);
await assert.rejects(
  stat(path.join(OUT_DIR, "llms.mdx")),
  /ENOENT/,
  "staging Markdown routes remain",
);
const emittedPublicMarkdown = [
  path.join(OUT_DIR, "docs.md"),
  ...(await walk(path.join(OUT_DIR, "docs"), (file) => file.endsWith(".md"))),
];
const emittedInternalMarkdown = await walk(
  path.join(OUT_DIR, "internal"),
  (file) => file.endsWith(".md"),
);
assert.equal(
  emittedPublicMarkdown.length,
  publicRecords.length,
  "public Markdown count drifted",
);
assert.equal(
  emittedInternalMarkdown.length,
  internalRecords.length,
  "internal Markdown count drifted",
);

for (const entry of markdownManifest.entries) {
  const outputPath = path.join(APP_DIR, entry.output);
  const markdown = await readFile(outputPath, "utf8");
  const htmlRoute = entry.route.replace(/\.md$/, "");
  const record =
    entry.audience === "public"
      ? publicByRoute.get(htmlRoute)
      : internalByRoute.get(htmlRoute);
  assert.ok(record, `${entry.route}: no source record`);
  assert.match(
    markdown,
    new RegExp(
      `^# ${record.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(${htmlRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
    ),
  );
  assert.equal(
    createHash("sha256").update(markdown).digest("hex"),
    entry.sha256,
  );
}

const llmsIndex = await readFile(path.join(OUT_DIR, "llms.txt"), "utf8");
const llmsFull = await readFile(path.join(OUT_DIR, "llms-full.txt"), "utf8");
assert.ok(
  Buffer.byteLength(llmsIndex) < 100 * 1024,
  "llms.txt exceeds 100 KiB",
);
assert.ok(
  Buffer.byteLength(llmsFull) < 2 * 1024 * 1024,
  "llms-full.txt exceeds 2 MiB",
);
assert.doesNotMatch(
  llmsIndex,
  /\/internal\//,
  "llms.txt exposes an internal route",
);
assert.doesNotMatch(
  llmsFull,
  /\/internal\//,
  "llms-full.txt exposes an internal route",
);
for (const record of publicRecords) {
  assert.ok(
    llmsIndex.includes(`](${record.route})`),
    `llms.txt is missing ${record.route}`,
  );
  assert.ok(
    llmsFull.includes(`# ${record.title} (${record.route})`),
    `llms-full is missing ${record.route}`,
  );
}
const llmsIndexRoutes = [
  ...llmsIndex.matchAll(/\]\((\/docs(?:\/[^)]+)?)\)/g),
].map((match) => match[1]);
assert.equal(
  llmsIndexRoutes.length,
  publicRecords.length,
  "llms.txt has duplicate or extra page links",
);
assert.deepEqual(
  new Set(llmsIndexRoutes),
  new Set(publicRecords.map(({ route }) => route)),
  "llms.txt route set drifted",
);
const llmsFullRoutes = [
  ...llmsFull.matchAll(/^# .+ \((\/docs(?:\/[^)]+)?)\)$/gm),
].map((match) => match[1]);
assert.equal(
  llmsFullRoutes.length,
  publicRecords.length,
  "llms-full.txt has duplicate or extra page headings",
);
assert.deepEqual(
  new Set(llmsFullRoutes),
  new Set(publicRecords.map(({ route }) => route)),
  "llms-full.txt route set drifted",
);

const searchIndex = await readFile(path.join(OUT_DIR, "api/search"), "utf8");
const parsedSearch = JSON.parse(searchIndex);
assert.doesNotMatch(
  searchIndex,
  /\/internal\//,
  "search index exposes an internal route",
);
const searchDocuments = Object.values(parsedSearch.docs?.docs ?? {});
assert.equal(
  parsedSearch.docs?.count,
  searchDocuments.length,
  "search document count drifted",
);
const expectedSearchRoutes = new Set(publicRecords.map(({ route }) => route));
const searchPageRoutes = searchDocuments
  .filter(({ type }) => type === "page")
  .map(({ page_id: pageId }) => pageId);
assert.equal(
  searchPageRoutes.length,
  publicRecords.length,
  "search has duplicate or extra page records",
);
assert.deepEqual(
  new Set(searchPageRoutes),
  expectedSearchRoutes,
  "search page set drifted",
);
for (const document of searchDocuments) {
  assert.ok(
    expectedSearchRoutes.has(document.page_id),
    `search contains unknown page_id ${document.page_id}`,
  );
  assert.equal(
    String(document.url).split("#")[0],
    document.page_id,
    `search URL escaped its page: ${document.url}`,
  );
}

const publicArtifacts = await walk(OUT_DIR, (file) => {
  const relative = path.relative(OUT_DIR, file).replaceAll(path.sep, "/");
  return (
    !relative.startsWith("internal/") &&
    /(?:\.html|\.md|\.txt|\.js|\.json)$|api\/search$/.test(relative)
  );
});
const normalizedPublicSource = normalizeLeakText(
  publicRecords
    .map(({ title, description, body }) => `${title}\n${description}\n${body}`)
    .join("\n"),
);
const internalSentinels = internalRecords.flatMap((record) => {
  const sentinels = leakSentinels(record, normalizedPublicSource);
  assert.ok(
    sentinels.length >= 3,
    `${record.file}: expected at least three internal-only leak sentinels, found ${sentinels.length}`,
  );
  return sentinels.map((sentinel) => ({ route: record.route, sentinel }));
});
for (const file of publicArtifacts) {
  const contents = normalizeLeakText(await readFile(file, "utf8"));
  for (const { route, sentinel } of internalSentinels) {
    assert.equal(
      contents.includes(sentinel),
      false,
      `${file}: leaked internal text from ${route}`,
    );
  }
}

const emittedHeaders = await readFile(path.join(OUT_DIR, "_headers"), "utf8");
for (const required of [
  "X-Content-Type-Options: nosniff",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "Permissions-Policy: camera=(), microphone=(), geolocation=()",
  "X-Frame-Options: DENY",
  "Content-Type: text/markdown; charset=utf-8",
  "Content-Type: application/json; charset=utf-8",
  "X-Robots-Tag: noindex, nofollow",
]) {
  assert.ok(
    emittedHeaders.includes(required),
    `_headers is missing ${required}`,
  );
}
assert.doesNotMatch(
  emittedHeaders,
  /^\/\*\.md\s*$/m,
  "_headers must not apply public caching to every Markdown path",
);
assert.match(
  emittedHeaders,
  /^\/docs\.md\n(?:  .+\n)+/m,
  "_headers is missing the root public Markdown rule",
);
assert.match(
  emittedHeaders,
  /^\/docs\/\*\.md\n(?:  .+\n)+/m,
  "_headers is missing the nested public Markdown rule",
);
const internalHeaders =
  emittedHeaders.match(/^\/internal\/\*\n((?:  .+\n)+)/m)?.[1] ?? "";
assert.match(internalHeaders, /Cache-Control: private, no-store/);
assert.match(internalHeaders, /Cloudflare-CDN-Cache-Control: no-store/);
const internalMarkdownHeaders =
  emittedHeaders.match(/^\/internal\/\*\.md\n((?:  .+\n)+)/m)?.[1] ?? "";
assert.match(
  internalMarkdownHeaders,
  /Content-Type: text\/markdown; charset=utf-8/,
);
assert.doesNotMatch(internalMarkdownHeaders, /Cache-Control:\s*public/);

const ogSource = await readFile(path.join(APP_DIR, "lib/og.tsx"), "utf8");
assert.doesNotMatch(ogSource, /#56f57c/i, "former green OG accent remains");
const fontBytes = new Map();
for (const [font, expectedHash] of Object.entries({
  "Geist-Regular.ttf":
    "5c8968eafb98a4c4f47033daf29e38e284a6f2a82eb017d171ab040fe7c4b615",
  "Geist-Bold.ttf":
    "e866b423b755233cae8bce6a37519f6fe630be9772fa08fc3114bff15bc8580f",
  "NotoSansSymbols2-Regular.woff":
    "037f0debac96bfbae0376e70a419ddef2c0b17b12655396c89ac6d950ee2bca0",
})) {
  const bytes = await readFile(path.join(APP_DIR, "assets/fonts", font));
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    expectedHash,
    `${font} drifted`,
  );
  fontBytes.set(font, bytes);
}
const publicOgText = [
  HOME_TITLE,
  "Design System",
  "design.vegastack.com",
  "⌘",
  ...publicRecords.flatMap(({ title, description }) => [title, description]),
].join("");
for (const character of new Set(publicOgText)) {
  const codePoint = character.codePointAt(0);
  if (/\s/u.test(character)) continue;
  assert.ok(
    [...fontBytes].some(([font, bytes]) =>
      fontSupports(bytes, codePoint, font),
    ),
    `OG fonts do not support ${character} (U+${codePoint.toString(16).toUpperCase().padStart(4, "0")})`,
  );
}

console.log(
  `✓ Metadata verified (${SITE_VISIBILITY}): ${publicRecords.length} public docs, ${internalRecords.length} internal docs, ${ogImages.length + 1} OG images`,
);
