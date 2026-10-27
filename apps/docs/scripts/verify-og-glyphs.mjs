// PR-time half of the OG glyph check: every docs page's title and description must be drawable
// by the OG image fonts. The deploy's `verify-metadata.mjs` asks the same question of the built
// export; asking it here, from the frontmatter, stops a lacking glyph at review (twice a `⋯` in a
// description reached a release, #779 and #795). `--self-test` observes the check failing.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  describeCharacter,
  loadOgFonts,
  unsupportedOgCharacters,
} from "./og-glyphs.mjs";

const APP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const CONTENT_DIR = path.join(APP_DIR, "content/docs");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return entry.name.endsWith(".mdx") ? [full] : [];
    }),
  );
  return files.flat();
}

/** The `title` and `description` of a page's frontmatter, unquoted. */
function ogFields(source) {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? "";
  const fields = [];
  for (const line of frontmatter.split("\n")) {
    const match = /^(title|description):\s*(.*)$/.exec(line);
    if (match) fields.push(match[2].replace(/^(["'])(.*)\1$/, "$2"));
  }
  return fields.join(" ");
}

const fonts = await loadOgFonts(APP_DIR);

if (process.argv.includes("--self-test")) {
  const lacking = ogFields(
    "---\ntitle: Block toolbar\ndescription: A ⋯ for the rest.\n---\n",
  );
  if (unsupportedOgCharacters(lacking, fonts).join("") !== "⋯")
    throw new Error(
      "verify-og-glyphs self-test: a ⋯ in a description was not rejected",
    );
  const drawable = ogFields(
    '---\ntitle: "Help menu"\ndescription: What\'s new · Docs ↗ — ⌘K.\n---\n',
  );
  if (unsupportedOgCharacters(drawable, fonts).length > 0)
    throw new Error(
      "verify-og-glyphs self-test: a drawable description was rejected",
    );
  console.log(
    "✓ verify-og-glyphs --self-test: a lacking glyph is rejected, a drawable one passes",
  );
} else {
  const problems = [];
  for (const file of await walk(CONTENT_DIR)) {
    const missing = unsupportedOgCharacters(
      ogFields(await readFile(file, "utf8")),
      fonts,
    );
    if (missing.length > 0)
      problems.push(
        `${path.relative(APP_DIR, file)}: ${missing.map(describeCharacter).join(", ")}`,
      );
  }
  if (problems.length > 0) {
    console.error(
      `✗ verify-og-glyphs: the OG image fonts cannot draw these title/description characters — use words or a drawable glyph:\n  ${problems.join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(
    "✓ verify-og-glyphs: every docs title and description is drawable by the OG fonts",
  );
}
