// Consume preflight (fail-closed) — run BEFORE `shadcn add <name>`.
//
// REPO-INTERNAL copy (used by our own CI). The SHIPPED verifier that downstream
// consumers run is the self-contained bin in packages/design/bin/verify-registry-item.mjs
// (delivered via the public @vegastack/design package — consumers have no tooling/ dir).
// Both share the SAME canonical item-hash logic: this file imports it from
// ./registry-hash.mjs (the source of truth); the bin inlines a byte-identical copy.
//
// SCOPE: this CI verifier is PRE-WRITE only (it never runs `shadcn add`, so it has no
// copied files to check). The post-write / TOCTOU closer — comparing the files shadcn
// actually copied on disk against the EXACT verified item bytes — lives in the shipped
// bin's `--post-write` mode (packages/design/bin/verify-registry-item.mjs). Consumers who
// run `shadcn add` are the ones who must run that post-write pass; see skills/consume/SKILL.md.
//
// Two modes:
//   • full (default)  — 1) verify the Sigstore-signed manifest against the pinned GitHub
//                          OIDC identity (cosign verify-blob),
//                       2) verify the item hash against the trusted manifest.
//                       Requires the deployed signed manifest + the `cosign` CLI.
//   • --hash-only     — SKIP the cosign signature step; ONLY fetch the manifest and verify
//                       the item hash against it (and against meta.integrity). For local dev /
//                       environments without cosign or before the signed manifest is deployed.
//                       Trusts the manifest transport; does NOT prove provenance.
//
// Usage:
//   node tooling/verify-item.mjs [--hash-only] <name>
//   node tooling/verify-item.mjs --help
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { itemHash } from './registry-hash.mjs';

const USAGE = `node tooling/verify-item.mjs [--hash-only] <name>

Modes:
  full (default)   Sigstore signature (cosign) + item hash. Needs the deployed signed
                   manifest and the cosign CLI. The real trust boundary.
  --hash-only      Item hash only (skips cosign). Local dev / no cosign / pre-deploy.
                   Does NOT prove provenance.`;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}

const hashOnly = args.includes('--hash-only');
const name = args.filter((a) => !a.startsWith('-'))[0];
if (!name) { console.error(USAGE); process.exit(2); }

const base = process.env.VEGASTACK_REGISTRY ?? 'https://design.vegastack.com/r';
const headers = {
  'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
  'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
};

if (hashOnly) {
  const mRes = await fetch(`${base}/integrity-manifest.json`, { headers });
  writeFileSync('/tmp/vega-manifest.json', await mRes.text());
  console.warn('[hash-only] skipping Sigstore signature verification — provenance NOT proven');
} else {
  const [mRes, bRes] = await Promise.all([
    fetch(`${base}/integrity-manifest.json`, { headers }),
    fetch(`${base}/integrity-manifest.sigstore`, { headers }),
  ]);
  writeFileSync('/tmp/vega-manifest.json', await mRes.text());
  writeFileSync('/tmp/vega-manifest.sigstore', await bRes.text());

  // throws (aborts) if the signature is invalid or not from our EXACT release identity.
  // Pin the precise signer (the deploy workflow at the trusted ref) + repo, NOT a repo-prefix
  // regexp — a broad prefix would accept a manifest signed by ANY workflow/ref in the repo that
  // can obtain GitHub OIDC, defeating the registry trust boundary. Override the ref (e.g. a tag)
  // via env for tagged releases.
  const SIGNER_REPO = process.env.VEGASTACK_SIGNER_REPO ?? 'VegaStack/vegastack-design';
  const SIGNER_REF = process.env.VEGASTACK_SIGNER_REF ?? 'refs/heads/main';
  const SIGNER_IDENTITY = `https://github.com/${SIGNER_REPO}/.github/workflows/deploy.yml@${SIGNER_REF}`;
  execFileSync(
    'cosign',
    [
      'verify-blob',
      '--bundle', '/tmp/vega-manifest.sigstore',
      '--certificate-identity', SIGNER_IDENTITY,
      '--certificate-oidc-issuer', 'https://token.actions.githubusercontent.com',
      '--certificate-github-workflow-repository', SIGNER_REPO,
      '--certificate-github-workflow-ref', SIGNER_REF,
      '/tmp/vega-manifest.json',
    ],
    { stdio: 'inherit' },
  );
}

const manifest = JSON.parse(readFileSync('/tmp/vega-manifest.json', 'utf8'));
const item = await fetch(`${base}/${name}.json`, { headers }).then((r) => r.json());
const got = itemHash(item);
if (got !== item.meta?.integrity || got !== manifest[name]) {
  console.error(`integrity mismatch for ${name}`);
  process.exit(1);
}
console.log(`verified ${name}${hashOnly ? ' (hash-only)' : ''}`);
