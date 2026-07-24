import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { itemHash } from "../../../tooling/registry-hash.mjs";
import {
  internalArtifactPaths,
  isAccessChallenge,
  productionOrigin,
  RETIRED_PUBLIC_ROUTE,
  retiredPageArtifactPaths,
} from "./deployment-boundaries.mjs";

const base = productionOrigin(process.env.DOCS_URL);
const clientId = process.env.CF_ACCESS_CLIENT_ID;
const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET;
const signerRepository = process.env.SIGNER_REPOSITORY;
const signerRef = process.env.SIGNER_REF;

assert.ok(clientId, "CF_ACCESS_CLIENT_ID must be set");
assert.ok(clientSecret, "CF_ACCESS_CLIENT_SECRET must be set");
assert.equal(signerRepository?.toLowerCase(), "vegastack/vegastack-design");
assert.equal(signerRef, "refs/heads/main");

const MAX_ATTEMPTS = 8;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestUntil(
  pathname,
  init = {},
  { accept, failFast = () => false } = {},
) {
  let lastError;
  let lastResponse;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${base}${pathname}`, {
        ...init,
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
      });
      lastResponse = response;
      if (accept(response) || failFast(response) || attempt === MAX_ATTEMPTS)
        return response;
      lastError = new Error(
        `${pathname} has not reached its expected state (HTTP ${response.status})`,
      );
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) break;
    }
    await sleep(Math.min(1_000 * 2 ** (attempt - 1), 15_000));
  }
  throw new Error(
    `${pathname} did not stabilize after ${MAX_ATTEMPTS} attempts`,
    {
      cause:
        lastError ??
        new Error(`last HTTP response: ${lastResponse?.status ?? "none"}`),
    },
  );
}

function contentType(response) {
  return response.headers.get("content-type")?.toLowerCase() ?? "";
}

function assertContentType(
  response,
  pathname,
  expectedType,
  { utf8 = false } = {},
) {
  const raw = contentType(response);
  const [type, ...parameters] = raw.split(";").map((part) => part.trim());
  assert.equal(
    type,
    expectedType,
    `${pathname}: unexpected Content-Type ${raw}`,
  );
  if (utf8) {
    const charset = parameters
      .map((parameter) => parameter.split("=").map((part) => part.trim()))
      .find(([name]) => name === "charset")?.[1];
    assert.equal(
      charset,
      "utf-8",
      `${pathname}: Content-Type must declare charset=utf-8`,
    );
  }
}

function assertRobotsHeader(response, pathname) {
  const value = response.headers.get("x-robots-tag")?.toLowerCase() ?? "";
  assert.match(
    value,
    /noindex/,
    `${pathname}: X-Robots-Tag must include noindex`,
  );
  assert.match(
    value,
    /nofollow/,
    `${pathname}: X-Robots-Tag must include nofollow`,
  );
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1];
}

function metaContent(html, selector, value, pathname) {
  const tag = (html.match(/<meta\b[^>]*>/gi) ?? []).find(
    (candidate) => attribute(candidate, selector) === value,
  );
  assert.ok(tag, `${pathname}: missing <meta ${selector}="${value}">`);
  const content = attribute(tag, "content");
  assert.ok(content, `${pathname}: empty ${value} metadata`);
  return content;
}

function linkHref(html, rel, pathname) {
  const tag = (html.match(/<link\b[^>]*>/gi) ?? []).find(
    (candidate) => attribute(candidate, "rel") === rel,
  );
  assert.ok(tag, `${pathname}: missing <link rel="${rel}">`);
  const href = attribute(tag, "href");
  assert.ok(href, `${pathname}: empty ${rel} href`);
  return href;
}

function assertPublicHtml(html, { pathname, canonical, image, type }) {
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  assert.ok(title, `${pathname}: missing title`);
  const description = metaContent(html, "name", "description", pathname);
  assert.equal(
    linkHref(html, "canonical", pathname),
    canonical,
    `${pathname}: canonical drift`,
  );

  assert.equal(metaContent(html, "property", "og:title", pathname), title);
  assert.equal(
    metaContent(html, "property", "og:description", pathname),
    description,
  );
  assert.equal(metaContent(html, "property", "og:url", pathname), canonical);
  assert.equal(
    metaContent(html, "property", "og:site_name", pathname),
    "VegaStack Design",
  );
  assert.equal(metaContent(html, "property", "og:type", pathname), type);
  assert.equal(metaContent(html, "property", "og:image", pathname), image);
  assert.equal(
    metaContent(html, "property", "og:image:width", pathname),
    "1200",
  );
  assert.equal(
    metaContent(html, "property", "og:image:height", pathname),
    "630",
  );
  assert.equal(
    metaContent(html, "property", "og:image:type", pathname),
    "image/png",
  );
  const imageAlt = metaContent(html, "property", "og:image:alt", pathname);

  assert.equal(
    metaContent(html, "name", "twitter:card", pathname),
    "summary_large_image",
  );
  assert.equal(metaContent(html, "name", "twitter:title", pathname), title);
  assert.equal(
    metaContent(html, "name", "twitter:description", pathname),
    description,
  );
  assert.equal(metaContent(html, "name", "twitter:image", pathname), image);
  assert.equal(
    metaContent(html, "name", "twitter:image:alt", pathname),
    imageAlt,
  );

  const robots = metaContent(html, "name", "robots", pathname).toLowerCase();
  assert.match(
    robots,
    /(?:^|,)\s*index(?:,|$)/,
    `${pathname}: robots must include index`,
  );
  assert.match(
    robots,
    /(?:^|,)\s*follow(?:,|$)/,
    `${pathname}: robots must include follow`,
  );
  assert.doesNotMatch(
    robots,
    /noindex|nofollow/,
    `${pathname}: private robots leaked public`,
  );
  assert.doesNotMatch(
    html,
    /(?:https?:\/\/[^"']*cloudflareaccess\.com)?\/cdn-cgi\/access\/login/i,
    `${pathname}: received a Cloudflare Access interstitial`,
  );
}

async function expectText(pathname, expectedType, validate, options) {
  const response = await requestUntil(
    pathname,
    {},
    { accept: (candidate) => candidate.status === 200 },
  );
  assert.equal(response.status, 200, `${pathname}: expected HTTP 200`);
  assertContentType(response, pathname, expectedType, options);
  const body = await response.text();
  validate(body, response);
  console.log(`✓ ${pathname} → 200`);
}

async function expectPng(pathname) {
  const response = await requestUntil(
    pathname,
    {},
    { accept: (candidate) => candidate.status === 200 },
  );
  assert.equal(response.status, 200, `${pathname}: expected HTTP 200`);
  assertContentType(response, pathname, "image/png");
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(
    bytes.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    `${pathname}: bad PNG`,
  );
  assert.equal(
    bytes.subarray(12, 16).toString("ascii"),
    "IHDR",
    `${pathname}: missing IHDR`,
  );
  assert.equal(
    bytes.readUInt32BE(16),
    1200,
    `${pathname}: incorrect PNG width`,
  );
  assert.equal(
    bytes.readUInt32BE(20),
    630,
    `${pathname}: incorrect PNG height`,
  );
  console.log(`✓ ${pathname} → 200 image/png 1200×630`);
}

async function expectProtected(pathname) {
  const response = await requestUntil(
    pathname,
    {},
    {
      accept: isAccessChallenge,
      failFast: (candidate) => candidate.status === 200,
    },
  );
  assert.notEqual(
    response.status,
    200,
    `${pathname}: protected route returned anonymous HTTP 200`,
  );
  assert.equal(
    isAccessChallenge(response),
    true,
    `${pathname}: expected a Cloudflare Access challenge, received ${response.status} ${response.headers.get("location") ?? ""}`,
  );
  console.log(`✓ ${pathname} rejects anonymous requests (${response.status})`);
}

async function expectRetired(pathname) {
  const response = await requestUntil(
    pathname,
    {},
    {
      accept: (candidate) =>
        candidate.status === 404 || candidate.status === 410,
      failFast: (candidate) => candidate.status === 200,
    },
  );
  assert.ok(
    response.status === 404 || response.status === 410,
    `${pathname}: retired public artifact returned ${response.status}, expected 404/410`,
  );
  console.log(`✓ ${pathname} is retired (${response.status})`);
}

await expectText("/", "text/html", (html) =>
  assertPublicHtml(html, {
    pathname: "/",
    canonical: "https://design.vegastack.com",
    image: "https://design.vegastack.com/og/home/image.png",
    type: "website",
  }),
);

for (const pathname of [
  "/docs",
  "/docs/guides/registry-auth",
  "/docs/components/button",
]) {
  await expectText(pathname, "text/html", (html) =>
    assertPublicHtml(html, {
      pathname,
      canonical: `https://design.vegastack.com${pathname}`,
      image: `https://design.vegastack.com/og${pathname}/image.png`,
      type: "article",
    }),
  );
}

// The design contract, published for agents to fetch directly. It is a static `public/` asset, so
// nothing but the `_headers` rule gives it a Content-Type — assert the served type, not just a 200,
// or a lost header rule would silently start serving the doctrine as octet-stream/plain.
await expectText(
  "/design.md",
  "text/markdown",
  (markdown, response) => {
    assert.match(
      markdown,
      /^# /m,
      "/design.md: expected the design contract heading",
    );
    assert.ok(
      markdown.length > 10_000,
      "/design.md: contract is implausibly short — truncated?",
    );
    assertRobotsHeader(response, "/design.md");
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "*",
      "/design.md must be cross-origin readable — agents fetch it from other origins",
    );
  },
  { utf8: true },
);

await expectText(
  "/docs.md",
  "text/markdown",
  (markdown, response) => {
    assert.match(markdown, /^# .+ \(\/docs\)/m);
    assertRobotsHeader(response, "/docs.md");
  },
  { utf8: true },
);
await expectText(
  "/docs/components/button.md",
  "text/markdown",
  (markdown, response) => {
    assert.match(markdown, /^# Button \(\/docs\/components\/button\)/m);
    assertRobotsHeader(response, "/docs/components/button.md");
  },
  { utf8: true },
);

await expectPng("/og/home/image.png");
await expectPng("/og/docs/components/button/image.png");

for (const pathname of ["/llms.txt", "/llms-full.txt"]) {
  await expectText(
    pathname,
    "text/plain",
    (body, response) => {
      assert.doesNotMatch(
        body,
        /\/internal\//,
        `${pathname}: internal URL leaked`,
      );
      assert.ok(
        !body.includes(RETIRED_PUBLIC_ROUTE),
        `${pathname}: retired public route leaked`,
      );
      assert.match(
        body,
        /\/docs\/components\/button/,
        `${pathname}: public corpus missing`,
      );
      assertRobotsHeader(response, pathname);
    },
    { utf8: true },
  );
}

await expectText("/api/search", "application/json", (body, response) => {
  JSON.parse(body);
  assert.doesNotMatch(body, /\/internal\//, "/api/search: internal URL leaked");
  assert.ok(
    !body.includes(RETIRED_PUBLIC_ROUTE),
    "/api/search: retired public route leaked",
  );
  assert.match(
    body,
    /\/docs\/components\/button/,
    "/api/search: public corpus missing",
  );
  assertRobotsHeader(response, "/api/search");
});

await expectText("/sitemap.xml", "application/xml", (body) => {
  assert.match(
    body,
    /<loc>https:\/\/design\.vegastack\.com\/docs\/components\/button<\/loc>/,
  );
  assert.doesNotMatch(
    body,
    /\/internal\//,
    "/sitemap.xml: internal URL leaked",
  );
  assert.ok(
    !body.includes(RETIRED_PUBLIC_ROUTE),
    "/sitemap.xml: retired public route leaked",
  );
});

for (const pathname of [
  ...internalArtifactPaths("/internal/internal-projects"),
  ...internalArtifactPaths("/internal/registry-operations"),
]) {
  await expectProtected(pathname);
}

for (const pathname of retiredPageArtifactPaths()) {
  await expectRetired(pathname);
}

const registryPaths = [
  "/r/registry.json",
  "/r/integrity-manifest.json",
  "/r/integrity-manifest.sigstore",
  "/r/button.json",
];
for (const pathname of registryPaths) await expectProtected(pathname);

const serviceHeaders = {
  "CF-Access-Client-Id": clientId,
  "CF-Access-Client-Secret": clientSecret,
};
const registryResponse = await requestUntil(
  "/r/registry.json",
  { headers: serviceHeaders },
  {
    accept: (candidate) => candidate.status === 200,
  },
);
assert.equal(
  registryResponse.status,
  200,
  "/r/registry.json: service token was rejected",
);
assertContentType(registryResponse, "/r/registry.json", "application/json");
const registry = await registryResponse.json();
assert.ok(
  Array.isArray(registry.items) && registry.items.length > 0,
  "registry items are empty",
);
assert.equal(
  typeof registry.$schema,
  "string",
  "registry schema declaration is missing",
);
console.log(
  `✓ /r/registry.json accepts the service token (${registry.items.length} items)`,
);

const manifestResponse = await requestUntil(
  "/r/integrity-manifest.json",
  {
    headers: serviceHeaders,
  },
  {
    accept: (candidate) => candidate.status === 200,
  },
);
assert.equal(
  manifestResponse.status,
  200,
  "integrity manifest: service token was rejected",
);
assertContentType(
  manifestResponse,
  "/r/integrity-manifest.json",
  "application/json",
);
const manifestText = await manifestResponse.text();
const manifest = JSON.parse(manifestText);

const itemResponse = await requestUntil(
  "/r/button.json",
  { headers: serviceHeaders },
  {
    accept: (candidate) => candidate.status === 200,
  },
);
assert.equal(
  itemResponse.status,
  200,
  "button item: service token was rejected",
);
assertContentType(itemResponse, "/r/button.json", "application/json");
const item = await itemResponse.json();
const computedIntegrity = itemHash(item);
assert.equal(item.name, "button");
assert.equal(
  item.meta?.integrity,
  computedIntegrity,
  "button item self-integrity mismatch",
);
assert.equal(
  manifest.button,
  computedIntegrity,
  "button item does not match signed-manifest input",
);

const signatureResponse = await requestUntil(
  "/r/integrity-manifest.sigstore",
  {
    headers: serviceHeaders,
  },
  {
    accept: (candidate) => candidate.status === 200,
  },
);
assert.equal(
  signatureResponse.status,
  200,
  "signature bundle: service token was rejected",
);
const signatureText = await signatureResponse.text();
assert.ok(signatureText.length > 0, "signature bundle is empty");
JSON.parse(signatureText);
const signatureDir = mkdtempSync(join(tmpdir(), "vegastack-live-signature-"));
try {
  const manifestPath = join(signatureDir, "integrity-manifest.json");
  const bundlePath = join(signatureDir, "integrity-manifest.sigstore");
  writeFileSync(manifestPath, manifestText, { mode: 0o600 });
  writeFileSync(bundlePath, signatureText, { mode: 0o600 });
  execFileSync(
    "cosign",
    [
      "verify-blob",
      "--bundle",
      bundlePath,
      "--certificate-identity",
      `https://github.com/${signerRepository}/.github/workflows/deploy.yml@${signerRef}`,
      "--certificate-oidc-issuer",
      "https://token.actions.githubusercontent.com",
      "--certificate-github-workflow-repository",
      signerRepository,
      "--certificate-github-workflow-ref",
      signerRef,
      manifestPath,
    ],
    { stdio: "inherit" },
  );
} finally {
  rmSync(signatureDir, { recursive: true, force: true });
}
console.log(
  "✓ registry index, cryptographically verified manifest, and representative item validate",
);

console.log("✓ Public docs cutover probe passed");
