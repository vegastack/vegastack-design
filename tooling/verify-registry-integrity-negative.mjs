#!/usr/bin/env node

/** Positive whole-registry hash verification plus required tamper-negative probes. */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { itemHash } from "./registry-hash.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = join(root, "apps/docs/public/r");
const sourceRegistry = JSON.parse(
  readFileSync(join(root, "packages/ui/registry.json"), "utf8"),
);
const expectedNames = (sourceRegistry.items ?? [])
  .map((item) => item.name)
  .sort();
const manifest = JSON.parse(
  readFileSync(join(registryDir, "integrity-manifest.json"), "utf8"),
);
const names = readdirSync(registryDir)
  .filter(
    (name) =>
      name.endsWith(".json") &&
      !["integrity-manifest.json", "registry.json"].includes(name),
  )
  .map((name) => name.replace(/\.json$/, ""))
  .sort();

if (JSON.stringify(names) !== JSON.stringify(expectedNames)) {
  throw new Error(
    "registry item output does not exactly match packages/ui/registry.json",
  );
}
if (
  JSON.stringify(Object.keys(manifest).sort()) !== JSON.stringify(expectedNames)
) {
  throw new Error(
    "integrity manifest does not exactly match packages/ui/registry.json",
  );
}

const items = new Map();
for (const name of names) {
  const item = JSON.parse(
    readFileSync(join(registryDir, `${name}.json`), "utf8"),
  );
  if (item.name !== name)
    throw new Error(`${name}.json embeds the wrong item identity`);
  const actual = itemHash(item);
  if (actual !== item.meta?.integrity || actual !== manifest[name]) {
    throw new Error(`${name}: positive integrity verification failed`);
  }
  items.set(name, item);
}

const probeName = names.find((name) =>
  (items.get(name).files ?? []).some(
    (file) => typeof file.content === "string",
  ),
);
if (!probeName)
  throw new Error(
    "no registry item with a content payload exists for the tamper probe",
  );
const tamperedItem = structuredClone(items.get(probeName));
const contentFile = tamperedItem.files.find(
  (file) => typeof file.content === "string",
);
contentFile.content += "\n// deliberate negative-test tamper";
if (itemHash(tamperedItem) === manifest[probeName]) {
  throw new Error(`${probeName}: tampered item was incorrectly accepted`);
}

const tamperedManifest = structuredClone(manifest);
tamperedManifest[probeName] = manifest[probeName].replace(/^./, (character) =>
  character === "A" ? "B" : "A",
);
if (itemHash(items.get(probeName)) === tamperedManifest[probeName]) {
  throw new Error(
    `${probeName}: tampered manifest entry was incorrectly accepted`,
  );
}

console.log(
  `✓ registry integrity: ${names.length}/${names.length} positive hashes; tampered item rejected; tampered manifest entry rejected`,
);
