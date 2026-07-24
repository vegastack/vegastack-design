import assert from "node:assert/strict";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertGeneratedName,
  assertWritablePathInside,
  resolveInside,
} from "./safe-path.mjs";
import {
  assertRegistryRequest,
  serviceTokenHeaders,
} from "./registry-request.mjs";

assert.equal(
  resolveInside("/repo/docs", "components/ui/button.tsx"),
  "/repo/docs/components/ui/button.tsx",
);
assert.throws(
  () => resolveInside("/repo/docs", "../../tooling/evil.mjs"),
  /generated path escapes/,
);
assert.throws(
  () => resolveInside("/repo/docs", "/etc/passwd"),
  /generated path escapes/,
);

{
  const root = mkdtempSync(join(tmpdir(), "safe-path-root-"));
  const outside = mkdtempSync(join(tmpdir(), "safe-path-outside-"));
  try {
    symlinkSync(join(outside, "future.ts"), join(root, "button.ts"));
    assert.throws(
      () => assertWritablePathInside(root, join(root, "button.ts")),
      /traverses a symlink/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
}

assert.equal(assertGeneratedName("circle-check"), "circle-check");
for (const name of ["../probe", "nested/probe", "/absolute", "CircleCheck"])
  assert.throws(() => assertGeneratedName(name), /basename syntax/);

assert.deepEqual(serviceTokenHeaders({}), {});
assert.deepEqual(serviceTokenHeaders({ CF_ACCESS_CLIENT_ID: "id" }), {
  "CF-Access-Client-Id": "id",
});
assert.doesNotThrow(() =>
  assertRegistryRequest(
    "https://registry.example.test/r/button.json",
    { "CF-Access-Client-Secret": "secret" },
    "https://registry.example.test",
  ),
);
assert.throws(
  () =>
    assertRegistryRequest(
      "https://attacker.example/r/button.json",
      { "CF-Access-Client-Secret": "secret" },
      "https://registry.example.test",
    ),
  /refusing to send registry credentials/,
);
assert.throws(
  () =>
    assertRegistryRequest(
      "https://user:pass@registry.example.test/r/button.json",
      {},
      "https://registry.example.test",
    ),
  /embedded credentials/,
);

console.log("security-boundaries.test: passed");
