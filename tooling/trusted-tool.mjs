#!/usr/bin/env node
// Install a pinned CI tool binary, verified by SHA-256 on every use, into a cache directory and
// put it on the job's PATH (30-10-2026). Replaces `sigstore/cosign-installer`, which downloaded and
// bootstrap-verified cosign on every run (2.5–6 min, twice per deploy).
//
//   node tooling/trusted-tool.mjs <cosign|actionlint|zizmor> [--dir <cache dir>]
//
// The cache defaults to /trusted-tools (a host volume only credentialed workflows mount) and falls
// back to $RUNNER_TEMP. A cached file whose hash does not match is replaced, never trusted.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const TOOLS = {
  cosign: {
    version: "v2.5.2",
    url: "https://github.com/sigstore/cosign/releases/download/v2.5.2/cosign-linux-amd64",
    sha256: "bcfeae05557a9f313ee4392d2f335d0ff69ebbfd232019e3736fb04999fe1734",
  },
  actionlint: {
    version: "1.7.12",
    url: "https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz",
    sha256: "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8",
    member: "actionlint",
  },
  zizmor: {
    version: "1.31.1",
    url: "https://github.com/zizmorcore/zizmor/releases/download/v1.31.1/zizmor-x86_64-unknown-linux-gnu.tar.gz",
    sha256: "d185f726bdaf92df78273217dfdd24ebcd6b0ef48cf3ce776ff5762b6e138c99",
    member: "zizmor",
  },
};

const name = process.argv[2];
const tool = TOOLS[name];
if (!tool) {
  console.error(
    `trusted-tool: unknown tool ${name}; expected ${Object.keys(TOOLS).join(" | ")}`,
  );
  process.exit(2);
}
if (process.arch !== "x64" || process.platform !== "linux") {
  console.error(
    `trusted-tool: pinned binaries are linux-x64 only (this is ${process.platform}-${process.arch})`,
  );
  process.exit(2);
}
const dirArg = process.argv.indexOf("--dir");
const base =
  dirArg > 0
    ? process.argv[dirArg + 1]
    : existsSync("/trusted-tools")
      ? "/trusted-tools"
      : (process.env.RUNNER_TEMP ?? "/tmp");
const dir = join(base, `${name}-${tool.version}`);
const download = join(dir, `download-${tool.sha256.slice(0, 12)}`);
const sha256 = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

mkdirSync(dir, { recursive: true });
if (!existsSync(download) || sha256(download) !== tool.sha256) {
  const response = await fetch(tool.url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${tool.url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== tool.sha256)
    throw new Error(`${name}: checksum mismatch (${actual} != ${tool.sha256})`);
  writeFileSync(`${download}.part-${process.pid}`, bytes);
  renameSync(`${download}.part-${process.pid}`, download);
}
// Rebuild the binary from the verified download every run, then rename it into place: a rename is
// atomic, so a concurrent job still executing the old copy is never handed a half-written file.
const binary = join(dir, name);
const staging = join(dir, `.staging-${process.pid}`);
mkdirSync(staging, { recursive: true });
if (tool.member) {
  execFileSync("tar", ["-xzf", download, "-C", staging, tool.member]);
} else {
  writeFileSync(join(staging, name), readFileSync(download));
}
chmodSync(join(staging, name), 0o755);
renameSync(join(staging, name), binary);
rmSync(staging, { recursive: true, force: true });
if (process.env.GITHUB_PATH)
  appendFileSync(process.env.GITHUB_PATH, `${dir}\n`);
console.error(
  `✓ trusted-tool: ${name} ${tool.version} (sha256 verified) at ${binary}`,
);
// stdout carries only the verified binary's path, for callers that execute it directly.
console.log(binary);
