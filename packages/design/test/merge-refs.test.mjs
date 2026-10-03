import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeRefs } from "../dist/index.js";

test("merged callback cleanup is returned, runs once, and only legacy refs receive null", () => {
  const calls = [];
  const object = { current: null };
  const ref = mergeRefs(
    (node) => {
      calls.push(["cleanup-ref", node]);
      return () => calls.push(["cleanup"]);
    },
    (node) => {
      calls.push(["legacy", node]);
    },
    object,
  );
  const first = {};
  const cleanup = ref(first);
  assert.equal(object.current, first);
  cleanup();
  cleanup();
  assert.equal(object.current, null);
  assert.deepEqual(calls, [
    ["cleanup-ref", first],
    ["legacy", first],
    ["cleanup"],
    ["legacy", null],
  ]);
  const second = {};
  const detach = ref(second);
  assert.equal(object.current, second);
  detach();
  assert.equal(calls.filter(([kind]) => kind === "cleanup").length, 2);
});
