#!/usr/bin/env node
// Surface a failing gate run to the agent, without anyone having to paste it.
//
// WHY
//   A git hook cannot call a model. So when `.husky/pre-push` blocks a push, the developer is left
//   holding raw output and the agent knows nothing about it. This bridges that: `.claude/settings.json`
//   runs it on SessionStart and UserPromptSubmit, and whatever it prints becomes context. The next
//   turn therefore starts already knowing which gate failed and where its report is.
//
// CONTRACT
//   Silent and exit 0 when there is nothing to report — it runs on EVERY prompt, so noise here is
//   noise in every conversation. It also never fails a hook: a broken digest must not be able to
//   block a session, so every error path exits 0.
//
//   It reports facts and points at the `gates` skill. It does not diagnose, because a hook has no
//   judgement and a wrong diagnosis injected as context is worse than none.
//
// STALENESS
//   A failure older than this many hours is not injected. A week-old failure the developer already
//   moved past would otherwise be presented as current, which is misinformation rather than context.
const MAX_AGE_HOURS = 12;

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function main() {
  let failure;
  try {
    failure = JSON.parse(
      readFileSync(join(ROOT, ".gates/last-failure.json"), "utf8"),
    );
  } catch {
    return; // No failure recorded, or not this repository. Both are silence.
  }

  const completedAt = Date.parse(failure.completedAt ?? "");
  if (!Number.isFinite(completedAt)) return;
  const ageHours = (Date.now() - completedAt) / 3_600_000;
  if (ageHours > MAX_AGE_HOURS) return;

  const failures = Array.isArray(failure.failures) ? failure.failures : [];
  if (failures.length === 0) return;

  const lines = [
    `The local gate ladder is currently FAILING (\`pnpm gates:${failure.mode}\`, ` +
      `${ageHours < 1 ? `${Math.round(ageHours * 60)} minute(s)` : `${ageHours.toFixed(1)} hour(s)`} ago).`,
    "",
  ];
  for (const entry of failures) {
    lines.push(`- **${entry.id}** — ${entry.label}`);
    if (entry.command) lines.push(`  command: \`${entry.command}\``);
    const excerpt = (entry.output ?? "")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .slice(-12)
      .join("\n");
    if (excerpt)
      lines.push("  ```", ...excerpt.split("\n").map((l) => `  ${l}`), "  ```");
  }
  if ((failure.retryTargets?.length ?? 0) > 0)
    lines.push(
      "",
      `Exact diagnostic selectors retained: ${failure.retryTargets.length}. Run \`pnpm gates:retry\`; a pass diagnoses only and does not clear this failure or write receipt evidence.`,
    );
  lines.push(
    "",
    `Full report: \`.gates/last-failure.json\`${
      failure.reports?.length
        ? ` · per-gate: ${failure.reports.join(" · ")}`
        : ""
    }`,
    "Load the `gates` skill to classify each failure at its root cause before changing anything.",
    "This digest is injected automatically and may be stale — re-run the gate to confirm it still fails.",
  );
  console.log(lines.join("\n"));
}

try {
  main();
} catch {
  // A digest must never be able to block a session.
}
process.exit(0);
