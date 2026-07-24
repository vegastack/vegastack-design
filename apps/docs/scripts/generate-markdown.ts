import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const OUT_DIR = path.join(APP_DIR, "out");
const STAGING_DIR = path.join(OUT_DIR, "llms.mdx");
const GENERATED_DIR = path.join(APP_DIR, ".generated");
const MANIFEST_PATH = path.join(GENERATED_DIR, "markdown-manifest.json");

interface ManifestEntry {
  audience: "public" | "internal";
  route: string;
  output: string;
  sha256: string;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

async function materializeAudience(
  audience: ManifestEntry["audience"],
  routeRoot: "docs" | "internal",
) {
  const sourceRoot = path.join(STAGING_DIR, routeRoot);
  const stagingFiles = (await walk(sourceRoot)).filter((file) =>
    file.endsWith("content.md"),
  );
  const entries: ManifestEntry[] = [];

  for (const stagingFile of stagingFiles.sort()) {
    const relativeDirectory = path.dirname(
      path.relative(sourceRoot, stagingFile),
    );
    const route =
      relativeDirectory === "."
        ? `/${routeRoot}.md`
        : `/${routeRoot}/${relativeDirectory.replaceAll(path.sep, "/")}.md`;
    const outputPath = path.join(OUT_DIR, route.slice(1));
    const markdown = await readFile(stagingFile);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, markdown);
    entries.push({
      audience,
      route,
      output: path.relative(APP_DIR, outputPath).replaceAll(path.sep, "/"),
      sha256: createHash("sha256").update(markdown).digest("hex"),
    });
  }

  return entries;
}

const entries = [
  ...(await materializeAudience("public", "docs")),
  ...(await materializeAudience("internal", "internal")),
];

await rm(STAGING_DIR, { recursive: true, force: true });
await mkdir(GENERATED_DIR, { recursive: true });
await writeFile(
  MANIFEST_PATH,
  `${JSON.stringify(
    {
      version: 1,
      publicPages: entries.filter((entry) => entry.audience === "public")
        .length,
      internalPages: entries.filter((entry) => entry.audience === "internal")
        .length,
      entries,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `✓ Markdown generated: ${entries.filter((entry) => entry.audience === "public").length} public, ${entries.filter((entry) => entry.audience === "internal").length} internal`,
);
