# Releasing — shipping component & package updates

How VegaStack ships updates from this **private** GitHub repo, and how downstream pulls them. Two
distribution channels, both already wired:

- **npm packages** (`@vegastack/design` + `@vegastack/design-tokens`) → published by `release.yml`
  (changesets) on push to `main`, via **npm OIDC trusted publishing** (same pattern as
  vegastack-cli): no `NPM_TOKEN` secret exists, the account keeps 2FA, and provenance attestations
  are minted automatically. One-time setup: each package on npmjs.com has a Trusted Publisher entry
  → GitHub Actions → `vegastack/vegastack-design` → `release.yml`. (The very first 0.1.0 publish
  was done locally with `pnpm -r publish` + OTP, since a trusted-publisher entry can only be added
  to an existing package.) Consumers get these via `npm update` (semver).
- **Component registry** (`/r/*.json`) → built, **Sigstore-signed**, and deployed to Cloudflare by
  `deploy.yml` (manual `workflow_dispatch`). Consumers **pull** updates with `shadcn add` — copy-in,
  so there is **no auto-push** (that's the shadcn model; the provenance header is the version pin).

> The registry is **not** served from the private GitHub repo directly — shadcn's `owner/repo/item`
> address form doesn't support private repos. GitHub is the source; the signed `/r/*` is served from
> Cloudflare (`design.vegastack.com/r/`) behind Cloudflare Access service tokens.

## Release a component update (maintainer)

1. Edit the **canonical** source only: `packages/ui/registry/ui/<name>.tsx`.
2. `npm run registry:build` — regenerates the docs copy-in + per-item JSON and **re-stamps the
   SHA-256 integrity + provenance header**. The changed hash is the machine-readable "this changed"
   signal consumers' `vegastack-design check-updates` reads.
3. `pnpm changeset` — bump `@vegastack/ui` (and any other changed package). **List the affected
   component name(s) in the summary** — `@vegastack/ui`'s generated `CHANGELOG.md` is the
   consumer-facing "what changed per version".
4. PR → review → merge to `main`. `release.yml` runs the full gate (typecheck, lint, test, build,
   `registry:build` idempotency, `registry:verify-consume`) then `changeset version` + `changeset
   publish` (npm, with provenance) and writes CHANGELOGs.
5. **Publish the registry**: run the **Deploy** workflow (`deploy.yml`, manual). It runs
   `registry:build` → `cosign sign-blob` the integrity manifest (keyless, GitHub OIDC) → static-export
   the docs → asserts the signed registry is in `out/r` → `wrangler deploy` to Cloudflare. The new
   versions are now served (gated). Updates are now *available* — consumers still pull them.

### Versioning model
`meta.version` on every registry item = `@vegastack/ui`'s package version (global). A bump moves all
items to the same number; `check-updates` compares by **integrity hash**, so a component only reports
an update when its content actually changed (no false positives from the global bump). The changeset
summary + `@vegastack/ui` CHANGELOG tell consumers *which* components moved.

## Receive an update (downstream)

See `apps/docs/content/docs/install.mdx` → "Updating components". In short:

```bash
npx vegastack-design check-updates                       # what's stale
npx vegastack-design verify --save /tmp/x.json <name>    # integrity preflight
npx shadcn@latest add @vegastack/<name> --diff           # review
npx shadcn@latest add @vegastack/<name> --overwrite      # apply (re-apply local edits)
npx vegastack-design verify --post-write --item /tmp/x.json --target-dir .  # TOCTOU close
```

## Future (not yet built)
- Scheduled CI bot: `check-updates --fail-on-update --json` → opens a "design-system updates" PR.
- npm path for animated icons (`@vegastack/design/icons` animated mirrors) so they update via `npm update`.
- Per-item independent semver instead of the global `@vegastack/ui` version.

## Known edge: workflow files + the Version PR

The Actions `GITHUB_TOKEN` cannot push changes to `.github/workflows/*`. If a release run's
commit has workflow files that differ from the current `main` tip (e.g. a workflow edit landed
right after it, or the same push carries both a changeset AND a workflow change), the changesets
action's `changeset-release/main` branch push is rejected with
`refusing to allow a GitHub App to … update workflow … without 'workflows' permission`.
**Fix:** re-run the Release workflow on the current `main` tip (or push any no-op commit) — a run
whose base matches main has no workflow diff and the Version PR push succeeds. Avoid bundling
workflow edits with changeset-bearing pushes.

Downstream lifecycles (who gets updates and how, handover model): the docs Guides —
Internal projects + Client projects pages.
