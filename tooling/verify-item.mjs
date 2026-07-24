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
// run `shadcn add` are the ones who must run that post-write pass; see skills/public/vegastack-consume/SKILL.md.
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
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { itemHash } from "./registry-hash.mjs";
import {
  DEFAULT_REGISTRY,
  fetchRegistryText,
  serviceTokenHeaders,
} from "./registry-request.mjs";
import { assertGeneratedName } from "./safe-path.mjs";

const USAGE = `node tooling/verify-item.mjs [--hash-only] <name>

Modes:
  full (default)   Sigstore signature (cosign) + item hash. Needs the deployed signed
                   manifest and the cosign CLI. The real trust boundary.
  --hash-only      Item hash only (skips cosign). Local dev / no cosign / pre-deploy.
                   Does NOT prove provenance.

Credentialed requests require the exact HTTPS VEGASTACK_TRUSTED_REGISTRY_ORIGIN
(default https://design.vegastack.com) and reject redirects.`;

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}

const hashOnly = args.includes("--hash-only");
const name = args.filter((a) => !a.startsWith("-"))[0];
if (!name) {
  console.error(USAGE);
  process.exit(2);
}
assertGeneratedName(name, "registry item name");

const base = (process.env.VEGASTACK_REGISTRY ?? DEFAULT_REGISTRY).replace(
  /\/$/,
  "",
);
const headers = serviceTokenHeaders();
const workDir = mkdtempSync(join(tmpdir(), "vegastack-internal-verify-"));
const manifestPath = join(workDir, "manifest.json");
const signaturePath = join(workDir, "manifest.sigstore");

if (hashOnly) {
  const manifestText = await fetchRegistryText(
    `${base}/integrity-manifest.json`,
    headers,
    "integrity manifest",
  );
  writeFileSync(manifestPath, manifestText, { mode: 0o600 });
  console.warn(
    "[hash-only] skipping Sigstore signature verification — provenance NOT proven",
  );
} else {
  const [manifestText, signatureText] = await Promise.all([
    fetchRegistryText(
      `${base}/integrity-manifest.json`,
      headers,
      "integrity manifest",
    ),
    fetchRegistryText(
      `${base}/integrity-manifest.sigstore`,
      headers,
      "signature bundle",
    ),
  ]);
  writeFileSync(manifestPath, manifestText, { mode: 0o600 });
  writeFileSync(signaturePath, signatureText, { mode: 0o600 });

  // throws (aborts) if the signature is invalid or not from our EXACT release identity.
  // Pin the precise signer (the deploy workflow at the trusted ref) + repo, NOT a repo-prefix
  // regexp — a broad prefix would accept a manifest signed by ANY workflow/ref in the repo that
  // can obtain GitHub OIDC, defeating the registry trust boundary. Override the ref (e.g. a tag)
  // via env for tagged releases.
  const SIGNER_REPO =
    process.env.VEGASTACK_SIGNER_REPO ?? "vegastack/vegastack-design";
  const SIGNER_REF = process.env.VEGASTACK_SIGNER_REF ?? "refs/heads/main";
  const SIGNER_IDENTITY = `https://github.com/${SIGNER_REPO}/.github/workflows/deploy.yml@${SIGNER_REF}`;
  execFileSync(
    "cosign",
    [
      "verify-blob",
      "--bundle",
      signaturePath,
      "--certificate-identity",
      SIGNER_IDENTITY,
      "--certificate-oidc-issuer",
      "https://token.actions.githubusercontent.com",
      "--certificate-github-workflow-repository",
      SIGNER_REPO,
      "--certificate-github-workflow-ref",
      SIGNER_REF,
      manifestPath,
    ],
    { stdio: "inherit" },
  );
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const item = JSON.parse(
  await fetchRegistryText(
    `${base}/${name}.json`,
    headers,
    `registry item ${name}`,
  ),
);
const got = itemHash(item);
if (got !== item.meta?.integrity || got !== manifest[name]) {
  console.error(`integrity mismatch for ${name}`);
  process.exit(1);
}
console.log(`verified ${name}${hashOnly ? " (hash-only)" : ""}`);
