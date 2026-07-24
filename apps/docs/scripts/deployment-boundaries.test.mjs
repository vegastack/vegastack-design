import assert from "node:assert/strict";
import {
  internalArtifactPaths,
  isAccessChallenge,
  productionOrigin,
  retiredPageArtifactPaths,
  retiredPublicArtifactPaths,
} from "./deployment-boundaries.mjs";

assert.equal(
  productionOrigin("https://design.vegastack.com/"),
  "https://design.vegastack.com",
);
for (const value of [
  "https://attacker.example",
  "http://design.vegastack.com",
  "https://design.vegastack.com/other",
  "https://design.vegastack.com/?next=evil",
  "https://user:pass@design.vegastack.com",
]) {
  assert.throws(() => productionOrigin(value));
}

const retired = retiredPublicArtifactPaths();
assert.equal(new Set(retired).size, retired.length);
for (const required of [
  "/docs/guides/internal-projects.html",
  "/docs/guides/internal-projects.txt",
  "/docs/guides/internal-projects/__next._full.txt",
  "/llms.mdx/docs/guides/internal-projects/content.md",
  "/llms.txt",
  "/llms-full.txt",
  "/api/search",
  "/sitemap.xml",
]) {
  assert.ok(
    retired.includes(required),
    `retired purge set is missing ${required}`,
  );
}
assert.ok(
  retiredPageArtifactPaths().includes(
    "/llms.mdx/docs/guides/internal-projects/content.md",
  ),
);

const internal = internalArtifactPaths("/internal/internal-projects");
assert.ok(internal.includes("/internal/internal-projects.html"));
assert.ok(
  internal.includes(
    "/internal/internal-projects/__next.internal.$c$slug.__PAGE__.txt",
  ),
);

assert.equal(
  isAccessChallenge(
    new Response(null, {
      status: 302,
      headers: {
        location: "https://attacker.example/cdn-cgi/access/login/forged",
      },
    }),
  ),
  false,
);
assert.equal(
  isAccessChallenge(
    new Response(null, {
      status: 302,
      headers: {
        location:
          "https://peerxp.cloudflareaccess.com/cdn-cgi/access/login/design.vegastack.com",
      },
    }),
  ),
  true,
);
assert.equal(
  isAccessChallenge(
    new Response(null, {
      status: 302,
      headers: {
        location:
          "https://attacker.cloudflareaccess.com/cdn-cgi/access/login/design.vegastack.com",
      },
    }),
  ),
  false,
);
assert.equal(
  isAccessChallenge(
    new Response(null, {
      status: 302,
      headers: { location: "https://attacker.example/" },
    }),
  ),
  false,
);
assert.equal(isAccessChallenge(new Response(null, { status: 403 })), true);

console.log("deployment-boundaries.test: passed");
