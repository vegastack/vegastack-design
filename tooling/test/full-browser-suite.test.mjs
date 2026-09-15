import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { expect, it } from "vitest";

import { ROOT } from "../lib/fs.mjs";

const script = join(ROOT, "tooling/full-browser-suite.mjs");

it("rejects an engine set outside chromium|all before starting a browser", () => {
  const result = spawnSync("node", [script, "--engines", "firefox"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("--engines must be chromium or all");
});

it("rejects unknown options", () => {
  const result = spawnSync("node", [script, "--silent"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("unknown argument --silent");
});
