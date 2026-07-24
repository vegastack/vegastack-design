# Public docs cutover runbook

Status: implementation prepared locally on 2026-07-22. No push, VRT workflow dispatch, deploy, cache
purge, Access mutation, or public cutover is authorized by this document. Each outward action still
requires a fresh MK approval through the `ship` workflow.

This runbook supersedes the broad human-docs SSO topology in `00-START-HERE.md` and
`detail/04-registry-and-cloudflare.md`. The package/distribution decisions in those historical plans
remain unchanged.

## Target boundary

| Surface                         | Anonymous result    | Discovery                                         |
| ------------------------------- | ------------------- | ------------------------------------------------- |
| `/`, `/docs/*`                  | `200`               | canonical, indexable, public sitemap/search/OG    |
| `/docs.md`, `/docs/*.md`        | `200` Markdown      | `X-Robots-Tag: noindex, nofollow`; not in sitemap |
| `/llms.txt`, `/llms-full.txt`   | `200` text          | public corpus only; `noindex`; not in sitemap     |
| `/api/search`                   | `200` JSON          | public corpus only; not in sitemap                |
| `/og/home/*`, `/og/docs/*`      | `200` PNG           | public for link unfurlers                         |
| `/internal/*`, `/internal/*.md` | Access SSO          | always `noindex`; absent from public artifacts    |
| `/r/*`                          | Access Service Auth | absent from every discovery surface               |

The two content collections are the security input boundary: `content/docs` requires
`audience: public`; `content/internal` requires `audience: internal`. The content lint rejects a
missing or mismatched audience. The public loader alone feeds navigation, static search, sitemap,
title-specific OG images, Markdown mirrors, and LLM exports. `SITE_VISIBILITY` only changes crawling
metadata; Cloudflare Access remains the authorization boundary.

## Required repository configuration

- **Approved Team/private operating model (2026-07-24):** GitHub limits required-reviewer
  environment protection on Free/Pro/Team to public repositories, so this private repository does
  not use GitHub Environments as approval gates. Review the change PR; merge the reviewed Version
  Packages PR to authorize npm publication; manually dispatch each deploy/cutover phase. Each remains
  a separate MK decision under the `ship` skill. Do not make the source repository public or add an
  environment name to the proven npm trusted-publisher identity as a workaround.
- Production builds set `SITE_VISIBILITY=public`; local builds default to `private`. Invalid values
  fail the build. Turborepo includes the value in its cache key.
- `deploy.yml` accepts only `refs/heads/main`, defaults to `cutover_phase=ordinary`, and separates the
  one-time cutover into `prepare` and `verify` dispatches. The `prepare` run ends before the Access
  mutation; `verify` is a later run after broad root SSO is removed. This two-run pause replaces the
  unavailable environment-review pause without weakening the boundary.
- npm trusted-publisher entries for both public packages name repository
  `vegastack/vegastack-design` and workflow `release.yml`, with **no environment name**. This is the
  identity proven by the 0.1.1 OIDC publish.
- Repository variables:
  - `DOCS_URL=https://design.vegastack.com`
  - `CF_ROOT_ACCESS_APPLICATION_ID` — the pre-cutover broad SSO app retained for rollback
  - `CF_INTERNAL_ACCESS_APPLICATION_ID` — the specific `/internal/*` SSO app
  - `CF_REGISTRY_ACCESS_APPLICATION_ID` — the specific `/r/*` Service Auth app
  - `CF_ACCESS_SERVICE_TOKEN_EXPIRES_AT` — parseable future timestamp
- Repository secrets:
  - `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_ZONE_ID`
  - `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`
- All workflow checkouts that build docs use `fetch-depth: 0`, because Git-derived modification dates
  are invalid in shallow checkouts.

## Pre-cutover evidence record

Before changing policy, attach the following to the approved change record. IDs are not credentials;
never record the service-token secret.

| Item                     | Required evidence                                                       |
| ------------------------ | ----------------------------------------------------------------------- |
| Root SSO application     | ID, hostname/path, session duration, ordered policies, enabled state    |
| Internal SSO application | ID, exact `/internal/*` path, IdP group/domain policy, successful login |
| Registry application     | ID, exact `/r/*` path, `Service Auth` decision, service-token selector  |
| Service token            | token ID/name, owner, expiry, rotation contact; never the secret        |
| Account-wide protection  | whether “Require Access protection” is enabled and its cutover impact   |
| Artifact rollback        | previous known-good Git SHA and deploy workflow run                     |
| DNS/Worker               | production custom domain, `workers_dev: false`, preview URLs disabled   |

Cloudflare selects the most specific matching Access application path. Verify the specific apps before
removing the broad root application; do not model the public site as a permanent broad bypass policy.

## Cutover sequence

1. Locally pass lint, typecheck, unit/browser/axe tests, private and public builds, link validation,
   registry idempotence, secret scan, and built-output metadata verification.
2. With separate approval, run the pinned Linux VRT workflow with `update_baselines=true`. The artifact
   must contain exactly the dynamically derived route/fixture inventory × configured Playwright
   projects and no Darwin/orphan images. Trust the baseline completeness verifier's current count,
   not a historical hardcoded total. Review and commit the complete regenerated set.
3. With separate approval, push the docs/deployment-only implementation. Do not add a changeset or npm
   version bump, and do not combine workflow edits with a changeset-bearing push.
4. Create the `/internal/*` SSO application while broad root SSO is still enabled. Confirm an authorized
   browser reaches both internal pages and their `.md` mirrors.
5. Revalidate `/r/*`: anonymous rejected; the named service token receives a valid registry JSON `200`.
6. With separate MK approval, dispatch `deploy.yml` from `main` with
   `cutover_phase=prepare`. It builds and validates without credentials, signs only in the OIDC job,
   reverifies and deploys the immutable artifact with the repository Cloudflare secrets, verifies
   broad root SSO plus service-token-only `/r/*`, validates the recorded topology/token expiry, and
   purges retired HTML/Markdown/text/RSC/OG derivatives plus affected LLM/search/sitemap aggregates.
   The run then **ends**; wait for success before exposing any public path.
7. Inspect the deployed artifact through authenticated access: public content is complete, the former
   public `Internal projects` route is absent, and internal operations are present only under
   `/internal/*`.
8. Under a separate approved Cloudflare change, disable/remove the broad root SSO application. If
   account-wide “Require Access protection” would still intercept the public paths, change that
   setting within the same approved window.
9. With a fresh MK approval, dispatch `deploy.yml` from `main` with `cutover_phase=verify`. Only this
   later run executes `verify-public-boundary`, with redirects disabled and propagation backoff. If it
   fails, immediately follow Rollback below; never set the completion variable on partial evidence.
10. **Record the cutover as finished**: set the repo variable `PUBLIC_DOCS_CUTOVER` to `complete`.
    This permanently retires `pre-cutover-purge` and promotes `verify-public-boundary` to the routine
    post-deploy gate that runs on _every_ subsequent deploy. Skipping this step leaves the boundary
    unverified on future deploys.
11. Test real unfurls in Slack, Teams, and LinkedIn using fresh URLs. Confirm title, description,
    official wordmark, off-white rule, and page-specific image.

The workflow does not automate Access-policy deletion: the broad application is the emergency rollback
control and must be changed deliberately by an approved operator after the curated artifact is live.

## Required probe contract

The production probe must pass all of the following without printing credential values:

- anonymous `/` and representative `/docs/*` are exactly `200`, contain absolute canonical plus full
  OG/Twitter metadata, use public robots metadata, and are not an Access interstitial;
- `/docs.md` and representative nested `.md` are `200`, Markdown MIME, contain the source HTML route,
  and include `X-Robots-Tag: noindex, nofollow`;
- home and page OG images are `200 image/png`, have a valid signature, and are exactly 1200×630;
- both LLM files are `200 text/plain`, public-only, and `noindex`;
- `/api/search` is `200 application/json`, parses, and contains no internal URL;
- every emitted internal HTML, Markdown, text, and RSC derivative receives a verified Cloudflare
  Access challenge (`401`/`403` or a redirect specifically to Access login), never `200`;
- every retired former-public route derivative is `404`/`410` after purge;
- anonymous registry index, manifest, signature bundle, and representative item all receive a
  verified Access challenge;
- service-token registry requests are exactly `200`; the index is schema-declared/non-empty, and a
  representative item recomputes to both its own integrity and the manifest entry.

## Rollback

Rollback immediately if either protected subtree becomes anonymous, a public path is still gated, the
artifact is defective, or any discovery surface contains internal material.

1. Re-enable the recorded broad root SSO application first. This restores a fail-closed origin while
   diagnosis continues.
2. Confirm anonymous `/`, `/internal/internal-projects`, and `/r/registry.json` are no longer public.
3. Redeploy the previous known-good SHA through the approved workflow; never edit `out/` manually.
4. Purge affected public HTML, Markdown, LLM, search, sitemap, robots, and OG URLs. Use an exact URL list
   unless the incident scope proves a broader purge is required.
5. Repeat the entire access probe. Do not declare recovery based only on the homepage.
6. Record the failure, rollback timestamps, Access application IDs, artifact SHA, cache purge, and probe
   output. Rotate/revoke the service token if its confidentiality or policy binding is in doubt.

References:

- [GitHub deployment environments and required-reviewer availability](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)
- Fumadocs access-control input filtering: <https://www.fumadocs.dev/docs/guides/access-control>
- Fumadocs static OG integration: <https://www.fumadocs.dev/docs/integrations/og/next>
- Fumadocs LLM integration: <https://www.fumadocs.dev/docs/integrations/llms>
- Fumadocs Git last-modified handling: <https://www.fumadocs.dev/docs/mdx/last-modified>
- Cloudflare Access path matching: <https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/>
- Cloudflare static `_headers`: <https://developers.cloudflare.com/workers/static-assets/headers/>
