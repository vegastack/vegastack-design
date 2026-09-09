---
"@vegastack/ui": patch
---

🛠 **`release-detect --check-npm` fails closed instead of fail-open, and `docs/RELEASING.md` matches
reality.** The registry probe spawned `npm view` with cwd = the repo root, where `package.json`
declares `devEngines.runtime` node 24.20.0; npm enforces that field, does not honour pnpm's
`onFail: download`, and exits `EBADDEVENGINES` on any other Node before it reaches the network. The
old `status !== 0` branch read that as "not published", so every push to `main` reported both live
public packages as unpublished, forced `publish=true`, ran `quality-gate`, and armed the
OIDC-capable `publish` job on changeset-free pushes (release run 34323665258 shows
`unpublished: @vegastack/design (none) → 0.3.2` with 0.3.2 live). The query now runs in an empty
temporary directory carrying a copy of the repo `.npmrc`, out of `devEngines`' reach but still on
the repo's own registry mapping, and `npm view --json` is parsed into three outcomes: **published**,
**absent** (a genuine `E404` — the only answer that may mean unpublished), and **unknown** (engine
refusal, transport, auth, missing npm, unparseable output). An unknown never contributes to
`publish`, is retried once, and exits non-zero when it was the only thing that could have set
`publish` — fail-closed and loud rather than a `false` that was never established. Nine cases in
`tooling/test/release-detect.test.mjs` pin it against a stubbed npm; six of them fail against the
previous script. `docs/RELEASING.md` no longer calls this public repo private in four places, states
the real reason provenance is off (npm rejects a self-hosted bundle with E422, not repository
visibility), describes the merged `build-sign-deploy` job rather than the deleted three-job artifact
split, and records that releases deliberately create no git tag or GitHub release. `AGENTS.md` gains
that tag decision and reconciles two deviations from the verification-rebuild plan.
