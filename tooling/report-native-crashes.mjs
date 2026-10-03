#!/usr/bin/env node
// Preserve native failures as failures. Report only bounded ELF process/signal metadata,
// never argv, environment or raw memory; leave every dump and the clean-tree guard intact.
import {
  constants,
  openSync,
  closeSync,
  readSync,
  lstatSync,
  realpathSync,
  readdirSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

function readAt(fd, size, position) {
  const bytes = Buffer.alloc(size);
  if (readSync(fd, bytes, 0, size, position) !== size)
    throw new Error("truncated core metadata");
  return bytes;
}

function coreMetadata(path) {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const header = readAt(fd, 64, 0);
    if (
      !header.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46])) ||
      header[4] !== 2 ||
      header[5] !== 1
    )
      return { format: "unrecognized" };
    const phoff = Number(header.readBigUInt64LE(32));
    const phsize = header.readUInt16LE(54);
    const count = header.readUInt16LE(56);
    if (
      !Number.isSafeInteger(phoff) ||
      phsize < 56 ||
      phsize > 4096 ||
      count > 1024
    )
      throw new Error("invalid ELF program headers");
    const metadata = {
      format: "ELF64",
      process: "unknown",
      pid: null,
      signal: null,
    };
    for (let index = 0; index < count; index++) {
      const ph = readAt(fd, phsize, phoff + index * phsize);
      if (ph.readUInt32LE(0) !== 4) continue; // PT_NOTE only; no memory segments.
      const offset = Number(ph.readBigUInt64LE(8));
      const size = Number(ph.readBigUInt64LE(32));
      if (
        !Number.isSafeInteger(offset) ||
        !Number.isSafeInteger(size) ||
        size > 1024 * 1024
      )
        throw new Error("invalid ELF note bounds");
      const notes = readAt(fd, size, offset);
      for (let at = 0; at + 12 <= notes.length;) {
        const namesz = notes.readUInt32LE(at);
        const descsz = notes.readUInt32LE(at + 4);
        const type = notes.readUInt32LE(at + 8);
        at += 12;
        const descAt = at + Math.ceil(namesz / 4) * 4;
        const next = descAt + Math.ceil(descsz / 4) * 4;
        if (next > notes.length) throw new Error("truncated ELF note");
        const owner = notes
          .subarray(at, at + namesz)
          .toString("ascii")
          .replace(/\0+$/, "");
        const desc = notes.subarray(descAt, descAt + descsz);
        if (owner === "CORE" && type === 3 && desc.length >= 56) {
          metadata.pid = desc.readInt32LE(24);
          metadata.process = desc
            .subarray(40, 56)
            .toString("ascii")
            .split("\0")[0]
            .replace(/[^\x20-\x7e]/g, "?");
        }
        if (owner === "CORE" && type === 0x53494749 && desc.length >= 12)
          metadata.signal = desc.readInt32LE(0);
        at = next;
      }
    }
    return metadata;
  } finally {
    closeSync(fd);
  }
}

const rootArg = process.argv.indexOf("--root");
const root = realpathSync(
  rootArg < 0
    ? resolve(dirname(fileURLToPath(import.meta.url)), "..")
    : process.argv[rootArg + 1],
);
let found = 0;
for (const directory of [root, join(root, "packages/ui")]) {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  for (const name of entries.filter((entry) =>
    /^core(?:\.\d+)?$/.test(entry),
  )) {
    const path = join(directory, name);
    const info = lstatSync(path);
    if (
      !info.isFile() ||
      info.isSymbolicLink() ||
      !realpathSync(path).startsWith(root + sep)
    )
      throw new Error("refusing unsafe core path");
    found++;
    let metadata;
    try {
      metadata = coreMetadata(path);
    } catch {
      metadata = { format: "unreadable or invalid metadata" };
    }
    console.error(
      `native-crash: ${JSON.stringify({ file: relative(root, path), bytes: info.size, ...metadata })}`,
    );
  }
}
if (found) {
  console.error(
    "Native core dumps remain on disk. Raw memory was not logged or uploaded.",
  );
  process.exitCode = 1;
} else
  console.log("native-crash: no core dumps in browser working directories");
