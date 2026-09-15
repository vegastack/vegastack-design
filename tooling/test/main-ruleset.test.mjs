import { expect, it } from "vitest";

import {
  assertMainRuleset,
  comparableRuleset,
  expectedMainRuleset,
} from "../main-ruleset.mjs";

it("pins PR-only main, the affected check, linear history and no bypass", () => {
  const expected = expectedMainRuleset();
  expect(expected.conditions.ref_name.include).toEqual(["refs/heads/main"]);
  expect(expected.bypass_actors).toEqual([]);
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
  response.rules.find((rule) => rule.type === "pull_request").parameters = {
    ...response.rules.find((rule) => rule.type === "pull_request").parameters,
    required_reviewers: [],
    require_extra_approval_for_unattributed_changes: true,
  };
  expect(() => assertMainRuleset(response)).not.toThrow();
  expect(comparableRuleset(response)).toEqual(comparableRuleset(expected));
  response.rules.find(
    (rule) => rule.type === "required_status_checks",
  ).parameters.required_status_checks = [];
  expect(() => assertMainRuleset(response)).toThrow();
});

it("rejects any bypass actor", () => {
  const response = expectedMainRuleset();
  response.bypass_actors = [
    { actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" },
  ];
  expect(() => assertMainRuleset(response)).toThrow();
});
