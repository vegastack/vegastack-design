#!/usr/bin/env node
// vegastack-design — the VegaStack design-system CLI.
//
// Subcommands:
//   check-updates   Show which copied-in components have newer registry versions (what to re-pull).
//   verify          Verify a registry item's integrity before/after `shadcn add` (Sigstore + hash).
//   skills          Install the bundled VegaStack agent skills into the consuming project.
//   doctor          Check a consuming project's setup (PostCSS plugin, preset import, registry).
//
// The bin is named `vegastack-design` (NOT `vegastack`) so it never collides with a platform CLI.
// `check-updates` is imported in-process; `verify` is spawned (it's the standalone, hash-parity-tested
// verifier — we run it untouched). Exit codes are forwarded from the subcommand.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HERE = new URL(".", import.meta.url);

const USAGE = `vegastack-design — VegaStack design-system CLI

Usage: vegastack-design <command> [options]

Commands:
  check-updates     Show which copied-in components have newer registry versions
  verify            Verify a registry item's integrity (pre/post \`shadcn add\`)
  skills            Install the VegaStack agent skills (Claude Code + Codex)
  doctor            Check this project's setup and report what is wrong

Run \`vegastack-design <command> --help\` for command options.
  -v, --version     Print version
  -h, --help        Show this help`;

function version() {
  try {
    return JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ).version;
  } catch {
    return "0.0.0";
  }
}

const [cmd, ...rest] = process.argv.slice(2);

if (cmd === "--version" || cmd === "-v") {
  console.log(version());
  process.exit(0);
}
if (cmd == null || cmd === "--help" || cmd === "-h" || cmd === "help") {
  console.log(USAGE);
  process.exit(0);
}

if (cmd === "check-updates") {
  // imported in-process (it's our own code with an exported main())
  const { main } = await import(new URL("./check-updates.mjs", HERE).href);
  process.exit(await main(rest));
}

if (cmd === "skills") {
  // imported in-process (our own code, no network, no credentials)
  const { main } = await import(new URL("./skills.mjs", HERE).href);
  process.exit(main(rest));
}

if (cmd === "doctor") {
  // imported in-process (our own code, read-only, no network, no credentials)
  const { main } = await import(new URL("./doctor.mjs", HERE).href);
  process.exit(main(rest));
}

if (cmd === "verify") {
  // spawn the standalone verifier untouched; mark the dispatch so it skips its deprecation notice.
  const verifier = fileURLToPath(new URL("./verify-registry-item.mjs", HERE));
  const r = spawnSync(process.execPath, [verifier, ...rest], {
    stdio: "inherit",
    env: { ...process.env, VEGASTACK_DESIGN_DISPATCH: "1" },
  });
  process.exit(r.status ?? 1);
}

// Name the installed version: the most common cause of "unknown command" is a consumer following
// documentation for a newer release than the one they actually have installed.
console.error(`unknown command: ${cmd}\n`);
console.error(
  `(this is @vegastack/design@${version()} — if you expected "${cmd}", check whether it`,
);
console.error(
  `requires a newer version: npm view @vegastack/design version)\n`,
);
console.error(USAGE);
process.exit(2);
