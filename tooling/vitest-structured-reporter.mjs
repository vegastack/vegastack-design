import { relative, resolve } from "node:path";

import { ROOT } from "./lib/change-set.mjs";
import { atomicWriteJson } from "./lib/measurement-report.mjs";

/**
 * Vitest 4 reporter for exact diagnostic selectors. The terminal reporter remains enabled; this
 * reporter exists only to retain machine-readable file/engine/full-name failures.
 */
export default class VegaStackStructuredReporter {
  constructor() {
    this.startedAt = new Date().toISOString();
    this.results = [];
  }

  onTestCaseResult(testCase) {
    const result = testCase.result();
    const state = result?.state ?? "unknown";
    const modulePath = resolve(testCase.module.moduleId);
    const repoPath = relative(ROOT, modulePath).split("\\").join("/");
    const engine =
      testCase.project.config?.browser?.name || testCase.project.name || null;
    this.results.push({
      file: repoPath,
      engine,
      testName: testCase.fullName,
      status: state,
      errors: (result?.errors ?? [])
        .map((error) => error?.message ?? String(error))
        .join("\n")
        .slice(0, 4_000),
    });
  }

  onTestRunEnd(_modules, unhandledErrors, reason) {
    const output = process.env.VSK_VITEST_REPORT;
    if (!output)
      throw new Error(
        "VSK_VITEST_REPORT is required by the structured reporter",
      );
    const failures = this.results
      .filter((result) => result.status === "failed")
      .map(({ file, engine, testName, errors }) => ({
        kind: "vitest",
        lane: process.env.VSK_VITEST_LANE,
        file,
        engine,
        testName,
        error: errors,
      }));
    atomicWriteJson(output, {
      schema: 1,
      gate: process.env.VSK_VITEST_LANE,
      runId: process.env.VSK_GATE_RUN_ID ?? null,
      diagnosticOnly: process.env.VSK_RETRY_DIAGNOSTIC === "1",
      startedAt: this.startedAt,
      completedAt: new Date().toISOString(),
      status:
        reason === "passed" &&
        failures.length === 0 &&
        unhandledErrors.length === 0
          ? "pass"
          : "fail",
      reason,
      executed: this.results.filter((result) => result.status !== "skipped")
        .length,
      results: {
        passed: this.results.filter((result) => result.status === "passed")
          .length,
        failed: failures.length,
        skipped: this.results.filter((result) => result.status === "skipped")
          .length,
      },
      failures,
      unhandledErrors: unhandledErrors.map((error) =>
        String(error?.message ?? error).slice(0, 4_000),
      ),
    });
  }
}
