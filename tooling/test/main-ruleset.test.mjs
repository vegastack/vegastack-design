import { expect, it } from "vitest";

import {
  assertMainRuleset,
  comparableRuleset,
  expectedMainRuleset,
} from "../main-ruleset.mjs";

it("pins PR-only main, the affected check, linear history and the Actions bypass", () => {
  const expected = expectedMainRuleset();
  expect(expected.conditions.ref_name.include).toEqual(["refs/heads/main"]);
  expect(expected.bypass_actors).toEqual([
    { actor_id: 15368, actor_type: "Integration", bypass_mode: "always" },
  ]);
  expect(expected.rules.map((rule) => rule.type)).toEqual([
    "deletion",
    "non_fast_forward",
    "required_linear_history",
    "pull_request",
    "required_status_checks",
  ]);
  expect(
    expected.rules.find((rule) => rule.type === "required_status_checks")
      .parameters.required_status_checks,
  ).toEqual([{ context: "PR quality", integration_id: 15368 }]);
});

it("ignores API response metadata but rejects policy drift", () => {
  const expected = expectedMainRuleset();
  const response = { id: 42, source_type: "Repository", ...expected };
  expect(() => assertMainRuleset(response)).not.toThrow();
  expect(comparableRuleset(response)).toEqual(comparableRuleset(expected));
  response.rules.find(
    (rule) => rule.type === "required_status_checks",
  ).parameters.required_status_checks = [];
  expect(() => assertMainRuleset(response)).toThrow();
});

it("can verify workflow-visible rules when GitHub omits the bypass list", () => {
  const response = expectedMainRuleset();
  delete response.bypass_actors;
  expect(() =>
    assertMainRuleset(response, { requireBypass: false }),
  ).not.toThrow();
  expect(() => assertMainRuleset(response)).toThrow();
});
