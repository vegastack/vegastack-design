#!/usr/bin/env node
// The anti-drift gate: every shared component is UPSTREAM'S FILE PLUS AN APPROVED PATCH, and every
// hunk traces to a decision MK marked **ours**.
//
//   node tooling/upstream/verify-parity.mjs
//   node tooling/upstream/verify-parity.mjs --self-test
//   node tooling/upstream/verify-parity.mjs --sync-decisions   (regenerate decisions.json)
//
// WHAT IT CHECKS (implementation.md § 3.3, plus § 6.3 of the mandate)
//   1. A migrated component exists at packages/ui/registry/ui/<name>.tsx.
//   2. With a patch: applying it to vendor/<cli>/ui/<name>.tsx reproduces the canonical file BYTE
//      FOR BYTE. Without one: the canonical file EQUALS the vendor file byte for byte.
//   3. Every ID in a patch header is a row in the decision register whose decision is **ours**.
//   4. Every required ID the exception map assigns to that component appears in its header.
//   5. A registry name with no upstream counterpart is listed in upstream/ours.json.
//   6. A retired name is absent from the registry, and carries no patch.
//
// WHY THE EXCEPTIONS CHECK LIVES HERE AND NOT IN ITS OWN FILE
//   The mandate (§ 5) sketches `verify-exceptions.mjs` as a fifth script. Checks 3 and 4 need the
//   same three inputs this file already has open — the patch header, the decision register and the
//   canonical/vendor pair — so a separate process would re-read all three to reach the same verdict
//   and give a failure two places to be reported from. One gate, one report.
//
// PATCH APPLICATION
//   Through `git apply` in a temp directory, not a hand-written differ. `git` is present wherever
//   this repository is, its unified-diff semantics are the ones `pnpm upstream:diff` produces, and
//   a differ written here would be a second implementation of a format git already owns.

import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { ROOT, walk, readJson, relativeToRoot } from "../lib/fs.mjs";
import {
  VENDOR,
  CANONICAL,
  UPSTREAM_DIR,
  canonicalPath,
  patchPath,
  parsePatch,
  parseDecisionsMarkdown,
  decisions,
  migrated,
  ours,
  retired,
  report,
  unifiedDiff,
} from "./lib.mjs";

const PREFIX = "upstream:parity";

/** Apply a unified diff to `content` in memory. Throws with git's own message when it does not apply. */
export function applyPatch(name, content, patchBody) {
  const dir = mkdtempSync(join(tmpdir(), "vs-parity-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    writeFileSync(join(dir, `${name}.tsx`), content);
    writeFileSync(join(dir, "patch.diff"), patchBody);
    execFileSync("git", ["apply", "--whitespace=nowarn", "patch.diff"], {
      cwd: dir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return readFileSync(join(dir, `${name}.tsx`), "utf8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The whole gate as a pure function of four directories, so `--self-test` can run it on fixtures. */
export function checkTree({
  vendorDir,
  canonicalDir,
  patchDir,
  register,
  map,
  migratedSet,
  oursMap,
  retiredSet,
}) {
  const failures = [];
  const upstreamNames = existsSync(join(vendorDir, "ui"))
    ? walk(join(vendorDir, "ui"))
        .map((p) => basename(p, ".tsx"))
        .sort()
    : [];
  const upstreamSet = new Set(upstreamNames);

  // Top level only. `registry/ui/icons/` holds the 467 animated-icon mirrors, which are generated
  // from lucide (ICO-6) and are not components in this sense — `icons` itself is the recorded entry.
  const registryNames = existsSync(canonicalDir)
    ? walk(canonicalDir, {
        include: (rel) => /^[^/]+\.tsx?$/.test(rel) && !rel.includes(".test."),
        prune: () => true,
      })
        .map((p) => basename(p).replace(/\.tsx?$/, ""))
        .sort()
    : [];

  // 6. Retired names must be gone.
  for (const name of retiredSet) {
    if (registryNames.includes(name)) {
      failures.push(
        `${name}: retired, but packages/ui/registry/ui still has it`,
      );
    }
    if (existsSync(join(patchDir, `${name}.patch`))) {
      failures.push(`${name}: retired, but still carries a patch`);
    }
  }

  // 5. Every registry name is upstream-backed or a recorded extra.
  for (const name of registryNames) {
    if (upstreamSet.has(name)) continue;
    if (!oursMap[name]) {
      failures.push(
        `${name}: no upstream counterpart and no entry in packages/ui/upstream/ours.json`,
      );
    }
  }

  // 1-4, for the migrated set only.
  let withPatch = 0;
  for (const name of [...migratedSet].sort()) {
    if (!upstreamSet.has(name)) {
      failures.push(
        `${name}: listed as migrated, but upstream ships no ui/${name}.tsx`,
      );
      continue;
    }
    const canonical = join(canonicalDir, `${name}.tsx`);
    if (!existsSync(canonical)) {
      failures.push(
        `${name}: listed as migrated, but ${relativeToRoot(canonical)} is missing`,
      );
      continue;
    }
    const vendor = readFileSync(join(vendorDir, "ui", `${name}.tsx`), "utf8");
    const mine = readFileSync(canonical, "utf8");
    const patchFile = join(patchDir, `${name}.patch`);

    if (!existsSync(patchFile)) {
      if (mine !== vendor) {
        failures.push(
          `${name}: no patch, so it must equal upstream byte for byte — it does not. ` +
            `Run \`pnpm upstream:diff ${name}\` and record the decision IDs.`,
        );
      }
      continue;
    }

    withPatch += 1;
    const patch = parsePatch(readFileSync(patchFile, "utf8"));
    if (patch.component !== name) {
      failures.push(
        `${name}: patch header says \`# component: ${patch.component}\``,
      );
    }
    if (!patch.decisions || patch.decisions.length === 0) {
      failures.push(`${name}: patch header has no \`# decisions:\` line`);
      continue;
    }
    for (const id of patch.decisions) {
      if (!(id in register))
        failures.push(`${name}: patch names unknown decision ${id}`);
      else if (register[id] !== "ours") {
        failures.push(
          `${name}: patch names ${id}, which the register decides as **${register[id]}** — ` +
            `only an **ours** row may justify a hunk`,
        );
      }
    }
    for (const [id, components] of Object.entries(map.required)) {
      if (components.includes(name) && !patch.decisions.includes(id)) {
        failures.push(
          `${name}: exception map assigns ${id} to it, but the patch header omits it`,
        );
      }
    }

    let patched;
    try {
      patched = applyPatch(name, vendor, patch.body);
    } catch (error) {
      failures.push(
        `${name}: patch does not apply to upstream — ${String(error.stderr || error.message).trim()}`,
      );
      continue;
    }
    if (patched !== mine) {
      failures.push(
        `${name}: upstream + patch does not reproduce ${relativeToRoot(canonical)} byte for byte. ` +
          `Regenerate with \`pnpm upstream:diff ${name}\`.`,
      );
    }
  }

  return {
    failures,
    summary:
      `${migratedSet.size}/${upstreamNames.length} upstream components migrated ` +
      `(${withPatch} patched, ${migratedSet.size - withPatch} verbatim) · ` +
      `${registryNames.length} registry names · ${Object.keys(oursMap).length} recorded extras · ` +
      `${retiredSet.size} retired`,
  };
}

function live() {
  return checkTree({
    vendorDir: VENDOR,
    canonicalDir: CANONICAL,
    patchDir: join(UPSTREAM_DIR, "patches"),
    register: decisions(),
    map: readJson(join(UPSTREAM_DIR, "exception-map.json")),
    migratedSet: migrated(),
    oursMap: ours(),
    retiredSet: retired(),
  });
}

/**
 * Observe the gate failing. Every claim is proven on a temp fixture tree, never on the repository,
 * so a self-test run cannot pass by accident and cannot damage anything.
 */
function selfTest() {
  const failures = [];
  const claim = (label, ok) => {
    console.log(
      `${PREFIX}:selftest ${ok ? "observed" : "DID NOT OBSERVE"} — ${label}`,
    );
    if (!ok) failures.push(label);
  };

  const dir = mkdtempSync(join(tmpdir(), "vs-parity-selftest-"));
  const vendorDir = join(dir, "vendor");
  const canonicalDir = join(dir, "canonical");
  const patchDir = join(dir, "patches");
  for (const d of [join(vendorDir, "ui"), canonicalDir, patchDir])
    mkdirSync(d, { recursive: true });

  const UPSTREAM = 'export const Demo = () => <button className="ring-3" />\n';
  const PATCHED =
    'export const Demo = () => <button className="outline-2" />\n';
  writeFileSync(join(vendorDir, "ui", "demo.tsx"), UPSTREAM);

  const register = { "FOC-1": "ours", "INT-2": "shadcn" };
  const base = {
    vendorDir,
    canonicalDir,
    patchDir,
    register,
    map: { required: { "FOC-1": ["demo"] } },
    migratedSet: new Set(["demo"]),
    oursMap: {},
    retiredSet: new Set(),
  };
  const fails = (overrides) =>
    checkTree({ ...base, ...overrides }).failures.length > 0;

  // A real patch, produced the way `upstream:diff` produces one.
  writeFileSync(join(canonicalDir, "demo.tsx"), PATCHED);
  const body = unifiedDiff("demo", UPSTREAM, PATCHED);
  const header =
    "# component: demo\n# decisions: FOC-1\n# hunks:\n#   1: drop the focus ring glow (FOC-1)\n";
  writeFileSync(join(patchDir, "demo.patch"), header + body);

  claim("a correct upstream + patch + canonical triple PASSES", !fails({}));

  writeFileSync(
    join(canonicalDir, "demo.tsx"),
    PATCHED.replace("outline-2", "outline-4"),
  );
  claim("a mutated canonical file is rejected", fails({}));
  writeFileSync(join(canonicalDir, "demo.tsx"), PATCHED);

  writeFileSync(
    join(patchDir, "demo.patch"),
    header.replace("FOC-1", "INT-2") + body,
  );
  claim("a patch naming a **shadcn** decision is rejected", fails({}));

  writeFileSync(
    join(patchDir, "demo.patch"),
    header.replace("FOC-1", "FOC-999") + body,
  );
  claim("a patch naming an unknown decision is rejected", fails({}));

  writeFileSync(
    join(patchDir, "demo.patch"),
    "# component: demo\n# decisions: A11Y-9\n" + body,
  );
  claim(
    "a patch omitting an assigned required ID is rejected",
    fails({ register: { ...register, "A11Y-9": "ours" } }),
  );

  writeFileSync(join(patchDir, "demo.patch"), header + body);
  rmSync(join(patchDir, "demo.patch"));
  claim(
    "a migrated component with no patch that differs from upstream is rejected",
    fails({}),
  );

  writeFileSync(
    join(canonicalDir, "extra.tsx"),
    "export const Extra = () => null\n",
  );
  claim(
    "a registry name that is neither upstream-backed nor a recorded extra is rejected",
    fails({}),
  );
  claim(
    "the same name PASSES once it is recorded in ours.json",
    !checkTree({
      ...base,
      migratedSet: new Set(),
      oursMap: { extra: { disposition: "keep" } },
    }).failures.length,
  );

  writeFileSync(join(canonicalDir, "demo.tsx"), UPSTREAM);
  claim(
    "a retired name still present in the registry is rejected",
    fails({
      migratedSet: new Set(),
      oursMap: { extra: {}, demo: {} },
      retiredSet: new Set(["demo"]),
    }),
  );

  rmSync(dir, { recursive: true, force: true });

  if (failures.length) {
    console.error(
      `${PREFIX}:selftest FAILED — ${failures.length} claim(s) not observed`,
    );
    return 1;
  }
  console.log(`${PREFIX}:selftest OK — 9 claims observed`);
  return 0;
}

const argv = process.argv.slice(2);
if (argv.includes("--self-test")) {
  process.exit(selfTest());
} else if (argv.includes("--sync-decisions")) {
  // Regenerate the committed machine register from the prose one. Only possible where the plan
  // directory exists (it is untracked by MK's instruction), which is why the JSON is committed.
  const source = join(ROOT, "docs/plans/2026-09-18-shadcn-reset/decisions.md");
  if (!existsSync(source)) {
    console.error(
      `${PREFIX}: ${relativeToRoot(source)} is not present — nothing to sync from`,
    );
    process.exit(2);
  }
  const parsed = parseDecisionsMarkdown(readFileSync(source, "utf8"));
  const ids = Object.keys(parsed);
  const oursCount = ids.filter((id) => parsed[id] === "ours").length;
  const target = join(UPSTREAM_DIR, "decisions.json");
  const current = readJson(target);
  writeFileSync(
    target,
    `${JSON.stringify(
      {
        ...current,
        counts: {
          total: ids.length,
          ours: oursCount,
          shadcn: ids.length - oursCount,
        },
        decisions: parsed,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `${PREFIX}: synced ${ids.length} decisions (${oursCount} ours) into ${relativeToRoot(target)}`,
  );
} else {
  const { failures, summary } = live();
  process.exit(report(PREFIX, failures, summary));
}
