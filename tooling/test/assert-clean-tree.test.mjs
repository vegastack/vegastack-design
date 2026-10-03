import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const script = fileURLToPath(
  new URL("../assert-clean-tree.mjs", import.meta.url),
);
test("content and index changes cannot hide behind unchanged porcelain status", () => {
  const root = mkdtempSync(join(tmpdir(), "tree-snapshot-"));
  const baseline = join(root, ".git/baseline");
  try {
    const git = (...args) =>
      execFileSync("git", args, { cwd: root, stdio: "pipe" });
    const check = (...args) =>
      spawnSync("node", [script, ...args], { cwd: root, encoding: "utf8" });
    git("init");
    writeFileSync(join(root, "generated"), "tracked");
    git("add", "generated");
    writeFileSync(join(root, "generated"), "existing dirt");
    writeFileSync(join(root, "scratch"), "preserved");
    expect(check("--snapshot", baseline).status).toBe(0);
    expect(check("--against", baseline).status).toBe(0);
    writeFileSync(join(root, "generated"), "new bytes, same status");
    expect(check("--against", baseline).status).toBe(1);
    writeFileSync(join(root, "generated"), "existing dirt");
    writeFileSync(join(root, "scratch"), "new untracked bytes");
    expect(check("--against", baseline).status).toBe(1);
    writeFileSync(join(root, "scratch"), "preserved");
    git("add", "generated");
    expect(check("--against", baseline).status).toBe(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
