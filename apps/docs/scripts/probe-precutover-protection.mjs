import assert from "node:assert/strict";
import {
  isAccessChallenge,
  productionOrigin,
  RETIRED_PUBLIC_ROUTE,
} from "./deployment-boundaries.mjs";

const base = productionOrigin(process.env.DOCS_URL);
const clientId = process.env.CF_ACCESS_CLIENT_ID;
const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET;

assert.ok(clientId, "CF_ACCESS_CLIENT_ID must be set");
assert.ok(clientSecret, "CF_ACCESS_CLIENT_SECRET must be set");

const serviceHeaders = {
  "CF-Access-Client-Id": clientId,
  "CF-Access-Client-Secret": clientSecret,
};

async function request(pathname, init = {}) {
  return fetch(`${base}${pathname}`, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
}

for (const pathname of ["/", RETIRED_PUBLIC_ROUTE]) {
  const response = await request(pathname);
  assert.notEqual(
    response.status,
    200,
    `${pathname}: broad root SSO is not protecting the site`,
  );
  assert.equal(
    isAccessChallenge(response),
    true,
    `${pathname}: expected the pinned Cloudflare Access challenge before purge, received ${response.status}`,
  );
  console.log(
    `✓ ${pathname} remains behind broad root SSO (${response.status})`,
  );
}

for (const pathname of [
  "/r/registry.json",
  "/r/integrity-manifest.json",
  "/r/integrity-manifest.sigstore",
  "/r/button.json",
]) {
  const anonymous = await request(pathname);
  assert.notEqual(
    anonymous.status,
    200,
    `${pathname}: registry trust file is anonymously readable`,
  );
  assert.equal(
    isAccessChallenge(anonymous),
    true,
    `${pathname}: expected a Cloudflare Access challenge, received ${anonymous.status}`,
  );

  const authenticated = await request(pathname, { headers: serviceHeaders });
  assert.equal(
    authenticated.status,
    200,
    `${pathname}: service token was rejected`,
  );
  assert.ok(
    (await authenticated.arrayBuffer()).byteLength > 0,
    `${pathname}: empty response body`,
  );
  console.log(
    `✓ ${pathname} rejects anonymous access and accepts the service token`,
  );
}

console.log(
  "✓ Protected docs/registry boundary verified; retired-artifact purge may proceed when requested",
);
