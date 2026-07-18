#!/usr/bin/env node
// skill-lint — fail-closed validation of repo skills against the agentskills standard
// (shared by Claude Code and Codex):
//   • every skills/*/SKILL.md has YAML frontmatter with EXACTLY name + description
//   • name matches the directory, kebab-case
//   • description is non-trivial (contains a "use when"-style trigger)
//   • every relative link in SKILL.md resolves to a file in the skill
//   • cross-tool discovery: .agents/skills/<name> and .claude/skills/<name> symlinks exist
//     and resolve to the canonical skills/<name> for every DISCOVERABLE skill (ship — the
//     legacy authoring/consume skills predate the symlink convention and are exempt until
//     migrated; add names to DISCOVERABLE as they are).
import { readFileSync, readdirSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');
const DISCOVERABLE = ['ship'];

const problems = [];

for (const dir of readdirSync(SKILLS)) {
  const skillMd = join(SKILLS, dir, 'SKILL.md');
  if (!existsSync(skillMd)) continue; // non-skill files in skills/
  const src = readFileSync(skillMd, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(src);
  if (!fm) {
    problems.push(`${dir}: SKILL.md missing YAML frontmatter`);
    continue;
  }
  const name = /^name:\s*(.+)$/m.exec(fm[1])?.[1]?.trim();
  const desc = /^description:\s*(.+)$/m.exec(fm[1])?.[1]?.trim();
  if (!name) problems.push(`${dir}: frontmatter missing "name"`);
  if (!desc) problems.push(`${dir}: frontmatter missing "description"`);
  if (name && !/^[a-z0-9][a-z0-9-]*$/.test(name)) problems.push(`${dir}: name "${name}" not kebab-case`);
  if (desc && desc.length < 40) problems.push(`${dir}: description too short to trigger reliably`);
  // relative links resolve
  for (const m of src.matchAll(/\]\((?!https?:|#|\/)([^)]+)\)/g)) {
    if (!existsSync(join(SKILLS, dir, m[1]))) problems.push(`${dir}: broken relative link ${m[1]}`);
  }
}

for (const name of DISCOVERABLE) {
  for (const surface of ['.agents/skills', '.claude/skills']) {
    const link = join(ROOT, surface, name);
    try {
      if (!lstatSync(link).isSymbolicLink()) {
        problems.push(`${surface}/${name}: exists but is not a symlink (must point at skills/${name})`);
      } else if (realpathSync(link) !== realpathSync(join(SKILLS, name))) {
        problems.push(`${surface}/${name}: symlink does not resolve to skills/${name}`);
      }
    } catch {
      problems.push(`${surface}/${name}: missing (Codex/Claude discovery symlink)`);
    }
  }
}

if (problems.length) {
  console.error(`✗ skill-lint: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('✓ skill-lint: frontmatter, links, and cross-tool discovery symlinks all valid');
