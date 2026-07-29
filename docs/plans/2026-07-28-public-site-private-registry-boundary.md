# Public site, private registry boundary

Status: approved by MK on 2026-07-28 during production deployment recovery. This decision
supersedes the uncompleted cutover phase recorded in `public-docs-cutover.md`.

## Decision

- Every non-registry route on `design.vegastack.com` is anonymously readable, including the
  `/internal/*` operations pages and their generated derivatives.
- `/internal/*` stays out of navigation, search, sitemap, OG, and LLM discovery and keeps
  `noindex, nofollow` plus no-store response headers. “Internal” is a discovery/content grouping,
  not an authorization boundary.
- `/r/*` remains the only private surface. Anonymous requests must receive a verified Cloudflare
  Access challenge; the repository service token must receive the registry index, manifest,
  signature bundle, and items.
- The deployment workflow has one routine live-boundary verifier. The former `prepare`/`verify`
  cutover phases and `PUBLIC_DOCS_CUTOVER` switch are retired so an unset variable cannot select an
  obsolete whole-site SSO contract.

## Scope

- Update `deploy.yml` to run the public-site/private-registry probe after every deployment.
- Update the probe to require anonymous success (or a same-origin canonical redirect) plus
  noindex/no-store headers for exported `/internal/*` derivatives while retaining
  discovery-exclusion assertions.
- Keep all registry anonymous-denial, service-token, item-integrity, and Sigstore assertions.
- Update workflow-security gates, maintainer shipping instructions, and current topology docs.
- Preserve historical cutover and release evidence as history, marked superseded where necessary.

## Non-goals

- No change to registry authentication, service-token values, token rotation, or Sigstore identity.
- No change to npm package versions or registry item versions.
- No changeset: this is deployment-policy and verification plumbing only.
- No expansion of internal pages into public discovery surfaces.

## Verification

1. Unit-test the deployment boundary helpers and run workflow security plus its negative fixtures.
2. Run `pnpm lint`, `pnpm typecheck`, and both public/private docs builds through the repository
   gates; require a clean generated tree.
3. Run `pnpm gates:ship` so the new deploy commit carries a full-sweep receipt.
4. Push a focused PR, require `receipt-guard` and `verify` to pass, and merge it.
5. Dispatch `deploy.yml` from `main`; require build, Sigstore signing/reverification, Cloudflare
   upload, the single external boundary job, and terminal `deployment-complete` to pass. Read its
   summary and retain the structured Cloudflare version ID; upload alone is not completion.
6. Independently confirm public docs and canonical `/internal/*` routes return `200`, derivatives
   remain anonymous or redirect only to the same origin, retired routes remain `404`, anonymous
   `/r/*` remains denied, and the authenticated workflow validates registry version, integrity,
   and signature.

## Risks and controls

- **Accidentally opening the registry:** the external probe checks four anonymous trust-file/item
  paths before using credentials, and fails fast on any `200`.
- **Publishing internal pages into discovery:** LLM, search, and sitemap assertions continue to
  reject `/internal/*`; internal routes must carry `noindex, nofollow`.
- **Workflow drift reintroducing cutover branches:** `verify-workflow-security.mjs` requires exactly
  one hosted boundary job, an unconditional dependency on `deploy-curated`, and the canonical probe.
- **Calling an upload success a deployment success:** completion requires the external boundary job,
  independent live probes, terminal `deployment-complete`, and its structured Cloudflare version ID,
  not only Wrangler output.
