import assert from "node:assert/strict";

export const PRODUCTION_ORIGIN = "https://design.vegastack.com";
export const ACCESS_LOGIN_ORIGIN = "https://peerxp.cloudflareaccess.com";
export const RETIRED_PUBLIC_ROUTE = "/docs/guides/internal-projects";

export function productionOrigin(value) {
  assert.ok(value, "DOCS_URL must be set to the production origin");
  const url = new URL(value);
  assert.equal(
    url.origin,
    PRODUCTION_ORIGIN,
    `DOCS_URL must use ${PRODUCTION_ORIGIN}`,
  );
  assert.equal(url.pathname, "/", "DOCS_URL must not include a path");
  assert.equal(url.search, "", "DOCS_URL must not include a query");
  assert.equal(url.hash, "", "DOCS_URL must not include a fragment");
  assert.equal(url.username, "", "DOCS_URL must not include credentials");
  assert.equal(url.password, "", "DOCS_URL must not include credentials");
  return url.origin;
}

export function retiredPageArtifactPaths() {
  const route = RETIRED_PUBLIC_ROUTE;
  return [
    route,
    `${route}.html`,
    `${route}.md`,
    `${route}.txt`,
    `${route}/__next._full.txt`,
    `${route}/__next._head.txt`,
    `${route}/__next._index.txt`,
    `${route}/__next._tree.txt`,
    `${route}/__next.docs.$oc$slug.__PAGE__.txt`,
    `${route}/__next.docs.$oc$slug.txt`,
    `${route}/__next.docs.txt`,
    `/og${route}/image.png`,
    `/llms.mdx${route}/content.md`,
  ];
}

export function retiredPublicArtifactPaths() {
  return [
    ...retiredPageArtifactPaths(),
    "/llms.txt",
    "/llms-full.txt",
    "/api/search",
    "/sitemap.xml",
  ];
}

export function internalArtifactPaths(route) {
  assert.match(route, /^\/internal\/[a-z0-9-]+$/);
  return [
    route,
    `${route}.html`,
    `${route}.md`,
    `${route}.txt`,
    `${route}/__next._full.txt`,
    `${route}/__next._head.txt`,
    `${route}/__next._index.txt`,
    `${route}/__next._tree.txt`,
    `${route}/__next.internal.$c$slug.__PAGE__.txt`,
    `${route}/__next.internal.$c$slug.txt`,
    `${route}/__next.internal.txt`,
  ];
}

export function isAccessChallenge(response) {
  if (response.status === 401 || response.status === 403) return true;
  if (response.status < 300 || response.status >= 400) return false;
  const location = response.headers.get("location");
  if (!location) return false;
  const url = new URL(location, PRODUCTION_ORIGIN);
  return (
    (url.origin === PRODUCTION_ORIGIN &&
      url.pathname.startsWith("/cdn-cgi/access/login")) ||
    (url.origin === ACCESS_LOGIN_ORIGIN &&
      url.pathname === "/cdn-cgi/access/login/design.vegastack.com")
  );
}
