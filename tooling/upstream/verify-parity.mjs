#!/usr/bin/env node
// The anti-drift gate: every shared component is UPSTREAM'S FILE PLUS AN APPROVED PATCH, and every
// hunk traces to a decision MK marked **ours**.
//
//   node tooling/upstream/verify-parity.mjs
//   node tooling/upstream/verify-parity.mjs --self-test
//   node tooling/upstream/verify-parity.mjs --sync-decisions   (regenerate decisions.json)
//
// WHAT IT CHECKS (implementation.md § 3.3, plus § 6.3 of the mandate)
//   0. THE ENFORCED SET IS DERIVED, never listed: it is every `vendor/<cli>/ui/*.tsx` the pinned
//      upstream ships, minus the fileless items recorded in upstream/migrated.json `exempt`. A
//      hand-maintained list would be a switch that turns both this gate and variant coverage off
//      for a component, silently, by deleting one line (Codex review of `main..HEAD`, 2026-09-18).
//   1. A migrated component exists at packages/ui/registry/ui/<name>.tsx.
//   2. With a patch: applying it to vendor/<cli>/ui/<name>.tsx reproduces the canonical file BYTE
//      FOR BYTE. Without one: the canonical file EQUALS the vendor file byte for byte.
//      Both sides are compared HEADERLESS — see below.
//   3. Every ID in a patch header is a row in the decision register whose decision is **ours**.
//   4. Every required ID the exception map assigns to that component appears in its header.
//   5. A registry name with no upstream counterpart is listed in upstream/ours.json.
//   6. A retired name is absent from the registry, and carries no patch.
//   7. A name recorded as a FILELESS upstream item (upstream/migrated.json `exempt`) really has no
//      file on either side — upstream ships none, and neither do we.
//
// WHY THE PROVENANCE HEADER IS EXCLUDED FROM CHECK 2
//   `// @vegastack <name>@<version> sha256-<hash>` is GENERATED metadata, written onto every
//   shipped copy by `tooling/registry-header.mjs` and re-written on every release, because
//   `pnpm version-packages` runs `version-sync`, which re-stamps the new version onto all of them.
//   It is not "upstream's source plus our recorded exceptions", and it already has its own
//   authority: `tooling/verify-headers.mjs` asserts that every shipped copy carries exactly one
//   header, on line 1, naming the current @vegastack/ui version and the item's own meta.integrity.
//   While the header was encoded INSIDE the patches, a version bump moved all 62 canonical files
//   and no patch, so byte parity failed for every patched component on every Version Packages PR —
//   the gate could not survive the one event it is guaranteed to meet (PR #152, 2026-09-19).
//   Both sides are therefore compared through `stripProvenanceHeader`, the same function `itemHash`
//   uses to keep the embedded sha self-consistent. Everything else stays byte-exact, and
//   `--self-test` observes both directions: a re-stamp passes, real drift beside it still fails.
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
import { provenanceHeader, stripProvenanceHeader } from "../registry-hash.mjs";
import {
  VENDOR,
  CANONICAL,
  UPSTREAM_DIR,
  canonicalPath,
  patchPath,
  parsePatch,
  parseDecisionsMarkdown,
  decisions,
  exemptUpstreamItems,
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
  oursMap,
  retiredSet,
  exemptMap = {},
}) {
  const failures = [];
  const upstreamNames = existsSync(join(vendorDir, "ui"))
    ? walk(join(vendorDir, "ui"))
        .map((p) => basename(p, ".tsx"))
        .sort()
    : [];
  const upstreamSet = new Set(upstreamNames);
  // Check 0: the enforced set, derived. Nothing in this repository can remove a name from it.
  const migratedSet = new Set(
    upstreamNames.filter((name) => !(name in exemptMap)),
  );

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

  // 7. An exempt name really is fileless, on BOTH sides.
  for (const name of Object.keys(exemptMap)) {
    if (upstreamSet.has(name)) {
      failures.push(
        `${name}: recorded as an upstream item with no file, but vendor ships ui/${name}.tsx — ` +
          `migrate it instead of exempting it`,
      );
    }
    if (registryNames.includes(name)) {
      failures.push(
        `${name}: recorded as an upstream item with no file, but packages/ui/registry/ui has one`,
      );
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
        `${name}: in the enforced set, but upstream ships no ui/${name}.tsx`,
      );
      continue;
    }
    const canonical = join(canonicalDir, `${name}.tsx`);
    if (!existsSync(canonical)) {
      failures.push(
        `${name}: upstream ships ui/${name}.tsx, but ${relativeToRoot(canonical)} is missing`,
      );
      continue;
    }
    const vendor = readFileSync(join(vendorDir, "ui", `${name}.tsx`), "utf8");
    // Headerless on BOTH sides: the generated provenance header is not part of the claim (see the
    // note at the top of this file). Upstream never carries one, so stripping it there is a no-op
    // that keeps the two sides spelled the same way.
    const mine = stripProvenanceHeader(readFileSync(canonical, "utf8"));
    const patchFile = join(patchDir, `${name}.patch`);

    if (!existsSync(patchFile)) {
      if (mine !== stripProvenanceHeader(vendor)) {
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
    if (stripProvenanceHeader(patched) !== mine) {
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
      `${Object.keys(exemptMap).length} fileless upstream items · ${retiredSet.size} retired`,
  };
}

function live() {
  return checkTree({
    vendorDir: VENDOR,
    canonicalDir: CANONICAL,
    patchDir: join(UPSTREAM_DIR, "patches"),
    register: decisions(),
    map: readJson(join(UPSTREAM_DIR, "exception-map.json")),
    oursMap: ours(),
    retiredSet: retired(),
    exemptMap: exemptUpstreamItems(),
  });
}

/**
 * Observe the gate failing. Every claim is proven on a temp fixture tree, never on the repository,
 * so a self-test run cannot pass by accident and cannot damage anything.
 *
 * Claims match the FAILURE TEXT, not just "something failed": with the enforced set derived from the
 * fixture's own vendor directory, several mutations below would trip more than one check, and a
 * bare `failures.length > 0` would let the wrong one stand in for the right one.
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
  // A canonical file as it is actually shipped: with the generated provenance header on line 1,
  // written through the very function `registry-header.mjs` uses, so the fixture cannot drift from
  // the real format. `version` is the knob a release turns.
  const stamped = (name, body, version) =>
    `${provenanceHeader(name, version, `sha256-${"d".repeat(43)}=`)}\n\n${body}`;
  const STAMPED = stamped("demo", PATCHED, "0.9.1");
  writeFileSync(join(vendorDir, "ui", "demo.tsx"), UPSTREAM);

  const register = { "FOC-1": "ours", "INT-2": "shadcn" };
  const base = {
    vendorDir,
    canonicalDir,
    patchDir,
    register,
    map: { required: { "FOC-1": ["demo"] } },
    oursMap: {},
    retiredSet: new Set(),
  };
  const run = (overrides) => checkTree({ ...base, ...overrides }).failures;
  const says = (text, overrides = {}) =>
    run(overrides).some((failure) => failure.includes(text));
  const clean = (overrides = {}) => run(overrides).length === 0;

  // A real patch, produced the way `upstream:diff` produces one: upstream against the HEADERLESS
  // canonical file, because the header is generated metadata and no longer belongs in a patch.
  writeFileSync(join(canonicalDir, "demo.tsx"), STAMPED);
  const body = unifiedDiff("demo", UPSTREAM, PATCHED);
  const header =
    "# component: demo\n# decisions: FOC-1\n# hunks:\n#   1: drop the focus ring glow (FOC-1)\n";
  writeFileSync(join(patchDir, "demo.patch"), header + body);

  claim("a correct upstream + patch + canonical triple PASSES", clean());

  writeFileSync(
    join(canonicalDir, "demo.tsx"),
    stamped("demo", PATCHED.replace("outline-2", "outline-4"), "0.9.1"),
  );
  claim("a mutated canonical file is rejected", says("does not reproduce"));
  writeFileSync(join(canonicalDir, "demo.tsx"), STAMPED);

  // ---- a release must be survivable (regression: Version Packages PR #152, 2026-09-19) ----
  //
  // `pnpm version-packages` runs `version-sync`, which re-stamps EVERY canonical file with the new
  // version. No patch moves with it, and none can. While the header lived inside the patches this
  // made byte parity unsatisfiable on every Version PR — 62 of 62 patched components failed at
  // once. The two claims below are the scenario and its guard rail: the bump alone must pass, and
  // a real edge carried in beside the bump must still be caught, or the exclusion would be a hole.
  writeFileSync(
    join(canonicalDir, "demo.tsx"),
    stamped("demo", PATCHED, "0.10.0"),
  );
  claim(
    "a canonical file RE-STAMPED to a new version still PASSES — a version bump cannot break parity",
    clean(),
  );

  writeFileSync(
    join(canonicalDir, "demo.tsx"),
    stamped("demo", PATCHED.replace("outline-2", "outline-4"), "0.10.0"),
  );
  claim(
    "…and real drift smuggled in beside the bump is STILL rejected",
    says("does not reproduce"),
  );
  writeFileSync(join(canonicalDir, "demo.tsx"), STAMPED);

  // The PATCHED side is stripped as well, so a patch authored before the header moved out of
  // patches — which is every patch that has ever existed here — still verifies, rather than failing
  // against whichever version it happened to record. Both sides speak the same headerless language.
  writeFileSync(
    join(patchDir, "demo.patch"),
    header + unifiedDiff("demo", UPSTREAM, stamped("demo", PATCHED, "0.4.0")),
  );
  claim(
    "an OLD-STYLE patch that still encodes a header hunk verifies against a differently stamped canonical file",
    clean(),
  );
  writeFileSync(join(patchDir, "demo.patch"), header + body);

  writeFileSync(
    join(patchDir, "demo.patch"),
    header.replace("FOC-1", "INT-2") + body,
  );
  claim(
    "a patch naming a **shadcn** decision is rejected",
    says("only an **ours** row may justify a hunk"),
  );

  writeFileSync(
    join(patchDir, "demo.patch"),
    header.replace("FOC-1", "FOC-999") + body,
  );
  claim(
    "a patch naming an unknown decision is rejected",
    says("patch names unknown decision FOC-999"),
  );

  writeFileSync(
    join(patchDir, "demo.patch"),
    "# component: demo\n# decisions: A11Y-9\n" + body,
  );
  claim(
    "a patch omitting an assigned required ID is rejected",
    says("the patch header omits it", {
      register: { ...register, "A11Y-9": "ours" },
    }),
  );

  rmSync(join(patchDir, "demo.patch"));
  claim(
    "a migrated component with no patch that differs from upstream is rejected",
    says("it must equal upstream byte for byte"),
  );
  writeFileSync(join(patchDir, "demo.patch"), header + body);

  // ---- the enforced set is DERIVED from the vendor tree (check 0) ----
  //
  // The three claims below are the ones a hand-maintained `migrated.json` list could not make. Each
  // takes a name out of the enforced set the only way that is left — by changing what upstream
  // ships or what this repository ships — and watches the gate notice.

  writeFileSync(join(vendorDir, "ui", "second.tsx"), UPSTREAM);
  claim(
    "a SECOND upstream component nobody listed anywhere is enforced too",
    says("second.tsx, but"),
  );
  claim(
    "…and passes once this repository ships it verbatim (stamped, like every shipped copy)",
    (() => {
      writeFileSync(
        join(canonicalDir, "second.tsx"),
        stamped("second", UPSTREAM, "0.9.1"),
      );
      return clean();
    })(),
  );
  rmSync(join(canonicalDir, "second.tsx"));
  claim(
    "deleting our copy of it is rejected, with no list to delete it from",
    says("is missing"),
  );
  rmSync(join(vendorDir, "ui", "second.tsx"));

  rmSync(join(vendorDir, "ui", "demo.tsx"));
  claim(
    "removing a name from the DERIVED INPUT does not disable the gate — the canonical file " +
      "becomes an unrecorded extra",
    says("no upstream counterpart and no entry"),
  );
  writeFileSync(join(vendorDir, "ui", "demo.tsx"), UPSTREAM);

  writeFileSync(
    join(canonicalDir, "extra.tsx"),
    "export const Extra = () => null\n",
  );
  claim(
    "a registry name that is neither upstream-backed nor a recorded extra is rejected",
    says("no upstream counterpart and no entry"),
  );
  claim(
    "the same name PASSES once it is recorded in ours.json",
    clean({ oursMap: { extra: { disposition: "keep" } } }),
  );

  claim(
    "a retired name still present in the registry is rejected",
    says("retired, but packages/ui/registry/ui still has it", {
      oursMap: { extra: {} },
      retiredSet: new Set(["demo"]),
    }),
  );

  claim(
    "a fileless-upstream exemption naming a name upstream DOES ship a file for is rejected",
    says("migrate it instead of exempting it", {
      oursMap: { extra: {} },
      exemptMap: { demo: "reason" },
    }),
  );

  rmSync(dir, { recursive: true, force: true });

  if (failures.length) {
    console.error(
      `${PREFIX}:selftest FAILED — ${failures.length} claim(s) not observed`,
    );
    return 1;
  }
  console.log(`${PREFIX}:selftest OK — 17 claims observed`);
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
