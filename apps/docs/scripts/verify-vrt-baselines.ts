import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import playwrightConfig from "../playwright.config";
import {
  BLOCK_ROUTES,
  COMPONENT_ROUTES,
} from "../vrt/contract-routes.generated";
import { ANIMATED_ICON_CHUNK_COUNT } from "../vrt/icon-chunks.generated";

const APP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const SPEC_PATH = path.join(APP_DIR, "vrt/components.spec.ts");
const SNAPSHOT_DIR = path.join(APP_DIR, "vrt/components.spec.ts-snapshots");

const spec = await readFile(SPEC_PATH, "utf8");
const pagesBlock = spec.match(/const PAGES = \[([\s\S]*?)\];/);
assert.ok(
  pagesBlock,
  "Could not find the PAGES inventory in components.spec.ts",
);

const pages = [
  ...[...pagesBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]),
  ...COMPONENT_ROUTES,
  ...BLOCK_ROUTES,
];
assert.ok(pages.length > 0, "The VRT page inventory is empty");
assert.equal(
  new Set(pages).size,
  pages.length,
  "The VRT page inventory contains duplicates",
);

const projects = (playwrightConfig.projects ?? []).map(
  (project) => project.name,
);
assert.ok(projects.length > 0, "Playwright has no configured VRT projects");
assert.equal(
  new Set(projects).size,
  projects.length,
  "Playwright project names are not unique",
);

const projectWidths = new Map(
  (playwrightConfig.projects ?? []).map((project) => [
    project.name,
    (project.use?.viewport as { width?: number } | undefined)?.width ??
      (playwrightConfig.use?.viewport as { width?: number } | undefined)?.width,
  ]),
);
const expected = new Map<string, number | undefined>();
for (const route of pages) {
  for (const project of projects) {
    expected.set(
      `${route.replaceAll("/", "-")}-${project}-linux.png`,
      projectWidths.get(project),
    );
    if (route.startsWith("/docs/components/")) {
      expected.set(
        `${route.replaceAll("/", "-")}-state-${project}-linux.png`,
        undefined,
      );
    }
  }
}
for (const project of projects) {
  for (let index = 1; index <= ANIMATED_ICON_CHUNK_COUNT; index++) {
    expected.set(
      `-docs-foundations-icons-icon-chunk-${index}-${project}-linux.png`,
      undefined,
    );
  }
}
const actual = new Set(
  (await readdir(SNAPSHOT_DIR)).filter((file) => file.endsWith(".png")),
);
const nonLinux = [...actual]
  .filter((file) => !file.endsWith("-linux.png"))
  .sort();
const missing = [...expected.keys()].filter((file) => !actual.has(file)).sort();
const orphaned = [...actual].filter((file) => !expected.has(file)).sort();
const invalidImages: string[] = [];
for (const file of [...actual].filter((name) => expected.has(name))) {
  const bytes = await readFile(path.join(SNAPSHOT_DIR, file));
  const validSignature = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!validSignature || bytes.length < 24) {
    invalidImages.push(`${file}: invalid PNG signature/header`);
    continue;
  }
  const width = bytes.readUInt32BE(16);
  const expectedWidth = expected.get(file);
  if (expectedWidth != null && width !== expectedWidth) {
    invalidImages.push(
      `${file}: width ${width}px; expected ${expectedWidth}px`,
    );
  }
}

function sample(values: string[]) {
  const shown = values
    .slice(0, 20)
    .map((value) => `  - ${value}`)
    .join("\n");
  const remainder =
    values.length > 20 ? `\n  …and ${values.length - 20} more` : "";
  return `${shown}${remainder}`;
}

assert.equal(
  nonLinux.length,
  0,
  `Only pinned Linux VRT baselines are authoritative; remove ${nonLinux.length} other image(s):\n${sample(nonLinux)}`,
);
assert.equal(
  missing.length,
  0,
  `Missing ${missing.length}/${expected.size} Linux VRT baseline(s):\n${sample(missing)}`,
);
assert.equal(
  orphaned.length,
  0,
  `Found ${orphaned.length} orphan VRT baseline(s):\n${sample(orphaned)}`,
);
assert.equal(
  invalidImages.length,
  0,
  `Found ${invalidImages.length} invalid or wrong-lane VRT image(s):\n${sample(invalidImages)}`,
);

console.log(
  `✓ VRT baselines complete: ${pages.length} full pages + ${pages.filter((route) => route.startsWith("/docs/components/")).length} component fixtures × ${projects.length} projects + ${ANIMATED_ICON_CHUNK_COUNT * projects.length} icon chunks = ${actual.size} Linux images`,
);
