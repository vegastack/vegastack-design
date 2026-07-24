import assert from "node:assert/strict";
import {
  productionOrigin,
  retiredPublicArtifactPaths,
} from "./deployment-boundaries.mjs";

const origin = productionOrigin(process.env.DOCS_URL);
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

assert.ok(zoneId, "CLOUDFLARE_ZONE_ID must be set");
assert.ok(apiToken, "CLOUDFLARE_API_TOKEN must be set");

const files = retiredPublicArtifactPaths().map(
  (pathname) => `${origin}${pathname}`,
);
assert.ok(files.length <= 30, "single-file purge exceeds Cloudflare API limit");
const response = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}/purge_cache`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files }),
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  },
);
const result = await response.json();
assert.equal(
  response.ok,
  true,
  `Cloudflare cache purge returned HTTP ${response.status}`,
);
assert.equal(result.success, true, "Cloudflare cache purge was not successful");
console.log(`✓ Purged ${files.length} retired public artifact URLs`);
