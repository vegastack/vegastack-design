#!/usr/bin/env node
// vegastack-design skills — install the public VegaStack agent skills into a consuming project.
//
// The skills ship inside this package (see `files` in package.json), so this is a pure local
// copy: no network, no credentials, no registry access. Files are COPIED rather than symlinked
// because node_modules is ephemeral — a symlink into it breaks on the next clean install.
//
// Safety posture, matching the registry verifier:
//   • never overwrite an existing file without --force (it reports what would change instead)
//   • never write THROUGH a symlink at the destination — refuse it, do not follow it
//   • --dry-run performs every check and writes nothing
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  lstatSync,
} from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(PKG_ROOT, "skills");

const SURFACES = {
  claude: ".claude/skills",
  codex: ".agents/skills",
};

const USAGE = `vegastack-design skills — install the VegaStack agent skills

Usage:
  vegastack-design skills install [options]   Copy the skills into this project
  vegastack-design skills list                Show the skills bundled with this package

Options:
  --dir <path>    Project root to install into (default: the current directory)
  --claude        Only install for Claude Code (.claude/skills)
  --codex         Only install for Codex (.agents/skills)
  --force         Overwrite files that already exist and differ
  --dry-run       Report what would change; write nothing
  -h, --help      Show this help

With neither --claude nor --codex, both surfaces are installed.`;

/** Skill directory names bundled in this package. */
function bundledSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(
      (e) =>
        e.isDirectory() && existsSync(join(SKILLS_DIR, e.name, "SKILL.md")),
    )
    .map((e) => e.name)
    .sort();
}

/** Files of one skill, relative to that skill's directory. */
function skillFiles(skill) {
  const base = join(SKILLS_DIR, skill);
  const out = [];
  for (const entry of readdirSync(base, {
    withFileTypes: true,
    recursive: true,
  })) {
    if (!entry.isFile()) continue;
    const abs = join(entry.parentPath ?? entry.path, entry.name);
    out.push(relative(base, abs).split(sep).join("/"));
  }
  return out.sort();
}

function describe(skill) {
  const src = readFileSync(join(SKILLS_DIR, skill, "SKILL.md"), "utf8");
  const fm = /^---\n([\s\S]*?)\n---/.exec(src);
  const desc = fm && /^description:\s*(.+)$/m.exec(fm[1])?.[1]?.trim();
  if (!desc) return "";
  return desc.length > 100 ? `${desc.slice(0, 99)}…` : desc;
}

function parseArgs(argv) {
  const opts = {
    dir: process.cwd(),
    surfaces: [],
    force: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      const value = argv[++i];
      if (!value) throw new Error("--dir needs a path");
      opts.dir = resolve(value);
    } else if (arg === "--claude") opts.surfaces.push("claude");
    else if (arg === "--codex") opts.surfaces.push("codex");
    else if (arg === "--force") opts.force = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  if (opts.surfaces.length === 0) opts.surfaces = ["claude", "codex"];
  return opts;
}

function list() {
  const skills = bundledSkills();
  if (skills.length === 0) {
    console.error("no skills are bundled with this build of @vegastack/design");
    return 1;
  }
  console.log(`${skills.length} skill(s) bundled with @vegastack/design:\n`);
  for (const skill of skills)
    console.log(`  ${skill}\n    ${describe(skill)}\n`);
  console.log("Install with: vegastack-design skills install");
  return 0;
}

function install(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    console.error(`${error.message}\n`);
    console.error(USAGE);
    return 2;
  }

  const skills = bundledSkills();
  if (skills.length === 0) {
    console.error("no skills are bundled with this build of @vegastack/design");
    return 1;
  }
  if (!existsSync(opts.dir)) {
    console.error(`target directory does not exist: ${opts.dir}`);
    return 1;
  }

  const planned = []; // { to, from, action }
  const blocked = [];
  const conflicts = [];

  for (const surface of opts.surfaces) {
    for (const skill of skills) {
      for (const file of skillFiles(skill)) {
        const from = join(SKILLS_DIR, skill, file);
        const to = join(opts.dir, SURFACES[surface], skill, file);

        // Refuse to write through a symlink anywhere on the destination path we own.
        let symlinked = false;
        for (
          let probe = to;
          probe.startsWith(join(opts.dir, SURFACES[surface].split("/")[0]));
          probe = dirname(probe)
        ) {
          try {
            if (lstatSync(probe).isSymbolicLink()) {
              symlinked = true;
              break;
            }
          } catch {
            /* does not exist yet — fine */
          }
        }
        if (symlinked) {
          blocked.push(relative(opts.dir, to));
          continue;
        }

        if (existsSync(to)) {
          if (readFileSync(to).equals(readFileSync(from))) continue; // already correct
          if (!opts.force) {
            conflicts.push(relative(opts.dir, to));
            continue;
          }
          planned.push({ from, to, action: "overwrite" });
        } else {
          planned.push({ from, to, action: "write" });
        }
      }
    }
  }

  if (blocked.length) {
    console.error("refusing to write through a symlink:");
    for (const path of blocked) console.error(`  ${path}`);
    console.error("\nRemove or relocate these entries, then run again.");
    return 1;
  }

  if (conflicts.length) {
    console.error("these files already exist and differ — not overwriting:");
    for (const path of conflicts) console.error(`  ${path}`);
    console.error(
      "\nRe-run with --force to overwrite, or move your versions aside first.",
    );
    return 1;
  }

  if (planned.length === 0) {
    console.log(`✓ skills already up to date in ${opts.dir}`);
    return 0;
  }

  if (opts.dryRun) {
    console.log(`Would write ${planned.length} file(s) into ${opts.dir}:\n`);
    for (const { to, action } of planned)
      console.log(`  ${action}  ${relative(opts.dir, to)}`);
    console.log("\n(dry run — nothing was written)");
    return 0;
  }

  // A read-only checkout, a permissions problem, or a full disk must fail with something a human
  // can act on — not an unhandled stack trace out of a CLI a consumer just installed.
  const written = [];
  for (const { from, to } of planned) {
    try {
      mkdirSync(dirname(to), { recursive: true });
      writeFileSync(to, readFileSync(from));
      written.push(to);
    } catch (error) {
      console.error(
        `failed to write ${relative(opts.dir, to)}: ${error.code ?? ""} ${error.message}`,
      );
      if (written.length) {
        console.error(
          `\n${written.length} file(s) were already written before this failed:`,
        );
        for (const path of written)
          console.error(`  ${relative(opts.dir, path)}`);
        console.error(
          "Re-run once the cause is fixed; the command is idempotent.",
        );
      }
      return 1;
    }
  }

  const surfaceLabel = opts.surfaces.map((s) => SURFACES[s]).join(" and ");
  console.log(`✓ installed ${skills.length} skill(s) into ${surfaceLabel}`);
  for (const skill of skills) console.log(`  ${skill}`);
  console.log(
    "\nRestart your agent if it was already running, so it picks up the new directory.",
  );
  return 0;
}

export function main(argv) {
  const [sub, ...rest] = argv;
  if (sub === "--help" || sub === "-h" || sub === "help" || sub == null) {
    console.log(USAGE);
    return 0;
  }
  if (sub === "list") return list();
  if (sub === "install") return install(rest);
  console.error(`unknown skills subcommand: ${sub}\n`);
  console.error(USAGE);
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
