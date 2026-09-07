import { readFileSync } from "node:fs";
import path from "node:path";
import { getContractRecord } from "@/lib/contracts";

/**
 * Row 10 of the page canon — the item's entries from `/CHANGELOG.md`, the canonical changelog
 * `tooling/sync-changelog.mjs` also renders the docs Changelog page from. Read at build time from
 * the same file, never from the generated page, so the two surfaces cannot disagree.
 *
 * A bullet names an item when it links the item's docs page
 * (`[docs](https://design.vegastack.com/docs/components/<name>)`) or leads with the item's bold
 * title in either spelling the changelog uses (`**Data Grid**` / `**DataGrid**`).
 */
const CHANGELOG_PATH = path.resolve(process.cwd(), "../../CHANGELOG.md");
const ENTRY_HEADING = /^## \[(\d+\.\d+\.\d+)\] — (.+)$/;

export interface ChangelogEntry {
  version: string;
  date: string;
  /** The section vocabulary label without its emoji — `Changed components`. */
  section: string;
  /** The bullet text with the trailing `[docs] · [sha]` reference line removed. */
  text: string;
}

interface ParsedBullet extends ChangelogEntry {
  raw: string;
}

let parsed: ParsedBullet[] | undefined;

function parseChangelog(): ParsedBullet[] {
  const lines = readFileSync(CHANGELOG_PATH, "utf8").split("\n");
  const bullets: ParsedBullet[] = [];
  let version = "";
  let date = "";
  let section = "";
  let current: string[] | undefined;

  const flush = () => {
    if (!current) return;
    const raw = current.join("\n");
    const text = raw
      .replace(/^- /, "")
      .replace(/\s*\[docs\]\([^)]*\)(\s*·\s*\[`[0-9a-f]+`\]\([^)]*\))?\s*$/, "")
      .replace(/\n\s+/g, " ")
      .trim();
    bullets.push({ version, date, section, text, raw });
    current = undefined;
  };

  for (const line of lines) {
    const entry = ENTRY_HEADING.exec(line);
    if (entry) {
      flush();
      [, version, date] = entry;
      section = "";
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      section = line
        .slice(4)
        .replace(/^\S+\s+/, "")
        .trim();
      continue;
    }
    if (line.startsWith("- ")) {
      flush();
      if (version) current = [line];
      continue;
    }
    if (current && /^\s+\S/.test(line)) {
      current.push(line);
      continue;
    }
    if (current && line.trim() === "") flush();
  }
  flush();
  return bullets;
}

export function getComponentChangelog(name: string): ChangelogEntry[] {
  parsed ??= parseChangelog();
  const record = getContractRecord(name);
  const spellings = [record.title, record.title.replace(/\s+/g, "")];
  const docsLink = `/docs/components/${name})`;
  return parsed
    .filter(
      (bullet) =>
        bullet.raw.includes(docsLink) ||
        spellings.some((title) => bullet.raw.includes(`**${title}**`)),
    )
    .map(({ version, date, section, text }) => ({
      version,
      date,
      section,
      text,
    }));
}
