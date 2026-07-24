// skills-install — the consumer-facing installer must be safe by default.
//
// The whole point of this command is that it writes into somebody else's repository. So the
// tests that matter are the refusals: it must not overwrite work, must not follow a symlink out
// of the target, and must not write anything at all during a dry run.
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
  readdirSync,
  existsSync,
  chmodSync,
} from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, "..");
const SKILLS = join(PKG, "skills");
const { main } = await import(join(PKG, "bin/skills.mjs"));

let failures = 0;
const tmpRoots = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`  ✗ ${name}\n    ${error.message}`);
  }
}

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "vegastack-skills-test-"));
  tmpRoots.push(dir);
  return dir;
}

/** Run the command with stdout/stderr captured, so test output stays readable. */
function run(args) {
  const out = [];
  const log = console.log;
  const err = console.error;
  console.log = (...a) => out.push(a.join(" "));
  console.error = (...a) => out.push(a.join(" "));
  try {
    return { code: main(args), output: out.join("\n") };
  } finally {
    console.log = log;
    console.error = err;
  }
}

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) =>
      relative(dir, join(e.parentPath ?? e.path, e.name))
        .split(sep)
        .join("/"),
    )
    .sort();
}

console.log("skills-install");

test("the package actually bundles the public skills", () => {
  assert.ok(
    existsSync(SKILLS),
    "packages/design/skills is missing — run tooling/sync-package-skills.mjs",
  );
  const skills = readdirSync(SKILLS, { withFileTypes: true }).filter((e) =>
    e.isDirectory(),
  );
  assert.ok(skills.length > 0, "no skills bundled");
  for (const skill of skills) {
    assert.ok(
      existsSync(join(SKILLS, skill.name, "SKILL.md")),
      `${skill.name} has no SKILL.md`,
    );
    assert.ok(
      skill.name.startsWith("vegastack-"),
      `${skill.name} is not vegastack-prefixed — it could collide in a consumer's skills dir`,
    );
  }
});

test("install writes both surfaces, byte-identical to the bundled source", () => {
  const dir = scratch();
  const { code } = run(["install", "--dir", dir]);
  assert.equal(code, 0);

  const bundled = filesUnder(SKILLS);
  assert.deepEqual(filesUnder(join(dir, ".claude/skills")), bundled);
  assert.deepEqual(filesUnder(join(dir, ".agents/skills")), bundled);

  for (const rel of bundled) {
    assert.ok(
      readFileSync(join(dir, ".claude/skills", rel)).equals(
        readFileSync(join(SKILLS, rel)),
      ),
      `${rel} differs from the bundled source`,
    );
  }
});

test("install is idempotent", () => {
  const dir = scratch();
  run(["install", "--dir", dir]);
  const { code, output } = run(["install", "--dir", dir]);
  assert.equal(code, 0);
  assert.match(output, /already up to date/);
});

test("--dry-run writes nothing", () => {
  const dir = scratch();
  const { code, output } = run(["install", "--dir", dir, "--dry-run"]);
  assert.equal(code, 0);
  assert.match(output, /dry run/);
  assert.equal(filesUnder(join(dir, ".claude/skills")).length, 0);
  assert.equal(filesUnder(join(dir, ".agents/skills")).length, 0);
});

test("--claude installs only the Claude surface", () => {
  const dir = scratch();
  const { code } = run(["install", "--dir", dir, "--claude"]);
  assert.equal(code, 0);
  assert.ok(filesUnder(join(dir, ".claude/skills")).length > 0);
  assert.equal(filesUnder(join(dir, ".agents/skills")).length, 0);
});

test("--codex installs only the Codex surface", () => {
  const dir = scratch();
  const { code } = run(["install", "--dir", dir, "--codex"]);
  assert.equal(code, 0);
  assert.ok(filesUnder(join(dir, ".agents/skills")).length > 0);
  assert.equal(filesUnder(join(dir, ".claude/skills")).length, 0);
});

test("refuses to overwrite a differing file, and leaves it untouched", () => {
  const dir = scratch();
  const target = join(dir, ".claude/skills/vegastack-design-system/SKILL.md");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, "MY OWN VERSION\n");

  const { code, output } = run(["install", "--dir", dir, "--claude"]);
  assert.equal(code, 1, "should exit non-zero rather than clobber");
  assert.match(output, /already exist and differ/);
  assert.equal(
    readFileSync(target, "utf8"),
    "MY OWN VERSION\n",
    "the existing file was modified",
  );
});

test("a refused install writes nothing at all — not even the non-conflicting files", () => {
  const dir = scratch();
  const target = join(dir, ".claude/skills/vegastack-design-system/SKILL.md");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, "MY OWN VERSION\n");

  run(["install", "--dir", dir, "--claude"]);
  assert.deepEqual(
    filesUnder(join(dir, ".claude/skills")),
    ["vegastack-design-system/SKILL.md"],
    "a conflict in one file must not let sibling files land half-installed",
  );
});

test("--force overwrites a differing file", () => {
  const dir = scratch();
  const target = join(dir, ".claude/skills/vegastack-design-system/SKILL.md");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, "MY OWN VERSION\n");

  const { code } = run(["install", "--dir", dir, "--claude", "--force"]);
  assert.equal(code, 0);
  assert.ok(
    readFileSync(target).equals(
      readFileSync(join(SKILLS, "vegastack-design-system/SKILL.md")),
    ),
    "--force did not restore the bundled content",
  );
});

test("refuses to write through a symlinked skill directory", () => {
  const dir = scratch();
  const elsewhere = scratch();
  mkdirSync(join(dir, ".claude/skills"), { recursive: true });
  symlinkSync(elsewhere, join(dir, ".claude/skills/vegastack-design-system"));

  const { code, output } = run(["install", "--dir", dir, "--claude"]);
  assert.equal(code, 1);
  assert.match(output, /symlink/);
  assert.equal(
    filesUnder(elsewhere).length,
    0,
    "wrote through the symlink into another directory",
  );
});

test("refuses to write through a symlinked surface directory", () => {
  const dir = scratch();
  const elsewhere = scratch();
  mkdirSync(join(dir, ".claude"), { recursive: true });
  symlinkSync(elsewhere, join(dir, ".claude/skills"));

  const { code, output } = run(["install", "--dir", dir, "--claude"]);
  assert.equal(code, 1);
  assert.match(output, /symlink/);
  assert.equal(
    filesUnder(elsewhere).length,
    0,
    "wrote through the symlink into another directory",
  );
});

test("rejects a target directory that does not exist", () => {
  const { code } = run(["install", "--dir", join(scratch(), "nope")]);
  assert.equal(code, 1);
});

test("a write failure exits non-zero and names what was written", () => {
  const dir = scratch();
  const surface = join(dir, ".claude/skills");
  mkdirSync(surface, { recursive: true });
  chmodSync(surface, 0o555); // read + execute, no write
  try {
    const { code, output } = run(["install", "--dir", dir, "--claude"]);
    // A root-run test bypasses mode bits; only assert the contract when the OS enforced it.
    if (filesUnder(surface).length === 0) {
      assert.equal(code, 1, "a failed write must exit non-zero");
      assert.match(output, /failed to write/);
    }
  } finally {
    chmodSync(surface, 0o755);
  }
});

test("rejects an unknown option instead of ignoring it", () => {
  const { code } = run(["install", "--dir", scratch(), "--overwrite"]);
  assert.equal(code, 2);
});

test("list reports every bundled skill", () => {
  const { code, output } = run(["list"]);
  assert.equal(code, 0);
  for (const entry of readdirSync(SKILLS, { withFileTypes: true }).filter((e) =>
    e.isDirectory(),
  )) {
    assert.match(output, new RegExp(entry.name));
  }
});

test("an unknown subcommand exits 2 with usage", () => {
  const { code, output } = run(["frobnicate"]);
  assert.equal(code, 2);
  assert.match(output, /Usage/);
});

for (const dir of tmpRoots) rmSync(dir, { recursive: true, force: true });

if (failures) {
  console.error(`\n✗ skills-install: ${failures} failure(s)`);
  process.exit(1);
}
console.log("✓ skills-install: all checks passed");
