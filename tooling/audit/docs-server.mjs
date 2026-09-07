// The static docs server every audit probe runs against — started once, here, and FAIL-CLOSED.
//
// WHY THIS FILE EXISTS
//   `capture.mjs` and the three `probe-*.mjs` each grew their own copy of "reserve a port, spawn
//   `serve out`, poll it 50×". Two of the four copies fell THROUGH the poll: after 10s of refused
//   connections they carried on to `page.goto`, every navigation failed, every route reported zero
//   elements, and the script exited 0. Reproduced 2026-09-07 by renaming `apps/docs/out` away —
//   `probe-states --routes button` printed `button: 0 probed, 0 flagged` and exited 0. A probe that
//   reports "nothing wrong" when it never looked is worse than one that crashes.
//
//   So readiness is checked in exactly one place, both preconditions are stated separately (a
//   missing export is a different fix from a server that will not bind), and neither is recoverable:
//   exit 2, the ladder-wide "could not run".
//
// NOT A BUILD INPUT
//   Nothing under `tooling/audit/` is executed by a build — see out-dir.mjs.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

import { ROOT } from "../lib/fs.mjs";

const DOCS = join(ROOT, "apps/docs");
const BUILD_HINT = "pnpm exec turbo run build --filter=@vegastack/docs";
/** 50 × 200ms. `serve` binds in well under a second idle; this covers a saturated box. */
const ATTEMPTS = 50;
const INTERVAL_MS = 200;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function reservePort() {
  return new Promise((ok, fail) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", fail);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => ok(port));
    });
  });
}

/** Print `message` and exit 2 — a precondition the run cannot proceed without. */
function refuse(message) {
  console.error(`${message}\n`);
  process.exit(2);
}

/**
 * A reachable docs server, or exit 2.
 *
 *   startDocsServer()            build a static export server on a free port
 *   startDocsServer({ port })    reuse an already-running `serve out` on that port
 *
 * Returns `{ base, port, stop() }`. `stop()` is a no-op for a reused port — a probe must never kill
 * a server it did not start.
 */
export async function startDocsServer({ port: existing = null } = {}) {
  if (existing) {
    const base = `http://127.0.0.1:${existing}`;
    if (!(await reachable(base)))
      refuse(
        `--port ${existing} was given but nothing answers on ${base} — start \`pnpm exec serve out\` ` +
          `in apps/docs, or drop --port and let this script start one`,
      );
    return { base, port: existing, stop: () => {} };
  }

  if (!existsSync(join(DOCS, "out/index.html")))
    refuse(
      `apps/docs/out is missing, so there is nothing to probe — run \`${BUILD_HINT}\`. ` +
        "(Refusing rather than probing an empty site: a probe that finds no elements would " +
        "otherwise report every route clean.)",
    );

  const port = await reservePort();
  const server = spawn("pnpm", ["exec", "serve", "out", "-l", String(port)], {
    cwd: DOCS,
    stdio: "ignore",
    detached: true,
  });
  const stop = () => {
    try {
      process.kill(-server.pid);
    } catch {}
  };
  const base = `http://127.0.0.1:${port}`;

  // POLL for readiness, never sleep a fixed interval. A 1500ms sleep was enough on an idle machine
  // and not enough on a loaded one — `serve` had not bound the port yet and the first `page.goto`
  // died with ERR_CONNECTION_REFUSED, which reads as a broken probe rather than a slow one.
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (await reachable(base)) return { base, port, stop };
    await sleep(INTERVAL_MS);
  }
  stop();
  refuse(
    `the docs server never became reachable on ${base} after ` +
      `${(ATTEMPTS * INTERVAL_MS) / 1000}s — apps/docs/out exists, so check that \`serve\` is ` +
      `installed and the port is free, then rebuild with \`${BUILD_HINT}\``,
  );
}

async function reachable(base) {
  try {
    return (await fetch(`${base}/`)).ok;
  } catch {
    return false;
  }
}

/**
 * A non-empty route list that probed nothing is a FAILURE, not a clean result — the same rule
 * `contracts-run.mjs` applies to a scope that selects zero tests. Call it with what was asked for
 * and what was actually seen.
 */
export function requireProbedSomething({ label, routes, probed }) {
  if (routes.length === 0 || probed > 0) return;
  console.error(
    `${label}: ${routes.length} route(s) requested and 0 elements probed — refusing to report a ` +
      "clean run over nothing. Either the export is stale (rebuild with " +
      `\`${BUILD_HINT}\`) or the selector matches nothing on these routes.\n`,
  );
  process.exit(2);
}
