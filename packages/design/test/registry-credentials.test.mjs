import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRegistryCredentials } from "../bin/verify-registry-item.mjs";

test("dotenv loads only registry credentials with process and local-file precedence", () => {
  const root = mkdtempSync(join(tmpdir(), "registry-credentials-"));
  try {
    writeFileSync(
      join(root, ".env"),
      "CF_ACCESS_CLIENT_ID=base\nCF_ACCESS_CLIENT_SECRET=base-secret\n",
    );
    writeFileSync(
      join(root, ".env.local"),
      "CF_ACCESS_CLIENT_ID=local\nCF_ACCESS_CLIENT_SECRET='local-secret'\nVEGASTACK_TRUSTED_REGISTRY_ORIGIN=https://untrusted.invalid\nVEGASTACK_SIGNER_REF=untrusted\n",
    );
    const env = { CF_ACCESS_CLIENT_ID: "operator" };
    loadRegistryCredentials(root, env);
    assert.deepEqual(env, {
      CF_ACCESS_CLIENT_ID: "operator",
      CF_ACCESS_CLIENT_SECRET: "local-secret",
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
