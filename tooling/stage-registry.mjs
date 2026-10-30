#!/usr/bin/env node
// Stage the registry Worker's assets (30-10-2026): apps/docs/public/r → apps/docs/dist-registry/r,
// plus the `/r/*` header rules from apps/docs/public/_headers. The registry deploys from here,
// independently of the docs static export.
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const docs = fileURLToPath(new URL("../apps/docs/", import.meta.url));
const out = join(docs, "dist-registry");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(docs, "public/r"), join(out, "r"), { recursive: true });

// Keep the global hardening block and the `/r/*` block; drop rules for docs-only paths.
const blocks = readFileSync(join(docs, "public/_headers"), "utf8").split(
  /\n(?=\/)/,
);
const kept = blocks.filter((block) => /^(\/\*|\/r\/\*)\s*\n/.test(block));
if (kept.length !== 2)
  throw new Error("stage-registry: expected the /* and /r/* header rules");
const rules = kept.map((block) =>
  block
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .join("\n"),
);
writeFileSync(join(out, "_headers"), `${rules.join("\n\n")}\n`);
console.log(`✓ stage-registry: ${out}`);
