import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const script = fileURLToPath(
  new URL("../report-native-crashes.mjs", import.meta.url),
);
const run = (root) =>
  spawnSync(process.execPath, [script, "--root", root], { encoding: "utf8" });
test("native crash metadata fails the gate and preserves dumps without exposing payloads", () => {
  const root = mkdtempSync(join(tmpdir(), "native-crash-proof-"));
  try {
    mkdirSync(join(root, "packages/ui"), { recursive: true });
    expect(run(root).status).toBe(0);
    const header = Buffer.alloc(120);
    header.set([0x7f, 0x45, 0x4c, 0x46, 2, 1]);
    header.writeBigUInt64LE(64n, 32);
    header.writeUInt16LE(56, 54);
    header.writeUInt16LE(1, 56);
    header.writeUInt32LE(4, 64);
    header.writeBigUInt64LE(120n, 72);
    const note = (type, desc) => {
      const data = Buffer.alloc(20 + Math.ceil(desc.length / 4) * 4);
      data.writeUInt32LE(5, 0);
      data.writeUInt32LE(desc.length, 4);
      data.writeUInt32LE(type, 8);
      data.write("CORE\0", 12);
      desc.copy(data, 20);
      return data;
    };
    const processInfo = Buffer.alloc(136);
    processInfo.writeInt32LE(4462, 24);
    processInfo.write("chrome-headless", 40);
    processInfo.write("DO_NOT_LOG_ARGV_SECRET", 56);
    const signal = Buffer.alloc(128);
    signal.writeInt32LE(11, 0);
    const notes = Buffer.concat([
      note(3, processInfo),
      note(0x53494749, signal),
    ]);
    header.writeBigUInt64LE(BigInt(notes.length), 96);
    const path = join(root, "packages/ui/core.4462");
    writeFileSync(
      path,
      Buffer.concat([header, notes, Buffer.from("DO_NOT_LOG_MEMORY_SECRET")]),
    );
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"process":"chrome-headless"');
    expect(result.stderr).toContain('"signal":11');
    expect(result.stderr).not.toContain("SECRET");
    expect(existsSync(path)).toBe(true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("native crash inspection refuses symlinked dumps", () => {
  const root = mkdtempSync(join(tmpdir(), "native-crash-link-"));
  try {
    writeFileSync(join(root, "private"), "secret");
    symlinkSync(join(root, "private"), join(root, "core.1"));
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("refusing unsafe core path");
    expect(existsSync(join(root, "private"))).toBe(true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
