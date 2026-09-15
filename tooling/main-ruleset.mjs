#!/usr/bin/env node

// Idempotent authority for the GitHub `main` ruleset required by affected-only CI. `--check` is
// read-only. `--apply` is an explicit external mutation and is used only after the new PR workflow
// exists on main, so the required check can actually be produced.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RULESET_NAME = "VegaStack main";
export const GITHUB_ACTIONS_APP_ID = 15368;

export function expectedMainRuleset() {
  return {
    name: RULESET_NAME,
    target: "branch",
    enforcement: "active",
    bypass_actors: [
      {
        actor_id: GITHUB_ACTIONS_APP_ID,
        actor_type: "Integration",
        bypass_mode: "always",
      },
    ],
    conditions: {
      ref_name: { include: ["refs/heads/main"], exclude: [] },
    },
    rules: [
      { type: "deletion" },
      { type: "non_fast_forward" },
      { type: "required_linear_history" },
      {
        type: "pull_request",
        parameters: {
          required_approving_review_count: 0,
          dismiss_stale_reviews_on_push: false,
          require_code_owner_review: false,
          require_last_push_approval: false,
          required_review_thread_resolution: false,
          allowed_merge_methods: ["squash"],
        },
      },
      {
        type: "required_status_checks",
        parameters: {
          do_not_enforce_on_create: false,
          required_status_checks: [
            { context: "PR quality", integration_id: GITHUB_ACTIONS_APP_ID },
          ],
          strict_required_status_checks_policy: true,
        },
      },
    ],
  };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, stable(child)]),
  );
}

export function comparableRuleset(actual, { requireBypass = true } = {}) {
  const expected = expectedMainRuleset();
  return stable({
    name: actual.name,
    target: actual.target,
    enforcement: actual.enforcement,
    ...(requireBypass ? { bypass_actors: actual.bypass_actors } : {}),
    conditions: actual.conditions,
    rules: (actual.rules ?? []).map((rule) => {
      const expectedRule = expected.rules.find(
        (entry) => entry.type === rule.type,
      );
      return expectedRule?.parameters
        ? { type: rule.type, parameters: rule.parameters }
        : { type: rule.type };
    }),
  });
}

function gh(args, { input } = {}) {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    input,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw new Error(`gh did not run: ${result.error.message}`);
  if (result.status !== 0)
    throw new Error(
      `gh ${args.join(" ")} failed: ${(result.stderr ?? "").trim()}`,
    );
  return result.stdout;
}

function repository() {
  return gh([
    "repo",
    "view",
    "--json",
    "nameWithOwner",
    "--jq",
    ".nameWithOwner",
  ]).trim();
}

function currentRuleset(repo) {
  const summaries = JSON.parse(gh(["api", `repos/${repo}/rulesets`]));
  const summary = summaries.find((entry) => entry.name === RULESET_NAME);
  return summary
    ? JSON.parse(gh(["api", `repos/${repo}/rulesets/${summary.id}`]))
    : null;
}

export function assertMainRuleset(actual, { requireBypass = true } = {}) {
  assert.ok(actual, `${RULESET_NAME} ruleset is missing`);
  const expected = expectedMainRuleset();
  if (!requireBypass) delete expected.bypass_actors;
  assert.deepEqual(
    comparableRuleset(actual, { requireBypass }),
    stable(expected),
  );
}

const isMain =
  resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
if (isMain) {
  const apply = process.argv.includes("--apply");
  const checkFileIndex = process.argv.indexOf("--check-file");
  const checkFile =
    checkFileIndex === -1 ? null : process.argv[checkFileIndex + 1];
  if (checkFileIndex !== -1 && (!checkFile || checkFile.startsWith("--"))) {
    console.error("main-ruleset: --check-file requires a path");
    process.exit(2);
  }
  const consumed = new Set(
    ["--apply", "--check", "--check-file", checkFile].filter(Boolean),
  );
  const unexpected = process.argv.slice(2).filter((arg) => !consumed.has(arg));
  if (unexpected.length > 0) {
    console.error(
      `main-ruleset: unknown argument(s): ${unexpected.join(", ")}`,
    );
    process.exit(2);
  }
  try {
    if (checkFile) {
      // A workflow GITHUB_TOKEN has metadata access but GitHub may omit bypass_actors unless the
      // caller has Administration permission. The generated push itself remains the fail-closed
      // proof of the Actions bypass. Local/admin `--check` validates the complete object.
      assertMainRuleset(JSON.parse(readFileSync(checkFile, "utf8")), {
        requireBypass: false,
      });
      console.log("main-ruleset: supplied ruleset verified");
      process.exit(0);
    }
    const repo = repository();
    let current = currentRuleset(repo);
    if (apply) {
      const body = JSON.stringify(expectedMainRuleset());
      if (current)
        gh(
          [
            "api",
            "--method",
            "PUT",
            `repos/${repo}/rulesets/${current.id}`,
            "--input",
            "-",
          ],
          {
            input: body,
          },
        );
      else
        gh(
          ["api", "--method", "POST", `repos/${repo}/rulesets`, "--input", "-"],
          {
            input: body,
          },
        );
      current = currentRuleset(repo);
    }
    assertMainRuleset(current);
    console.log(`main-ruleset: ${apply ? "applied and verified" : "verified"}`);
  } catch (error) {
    console.error(`main-ruleset: ${error.message}`);
    process.exit(1);
  }
}
