import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchRegistryWithRetry } from "../bin/registry-fetch.mjs";

// No real waiting between tries.
process.env.VEGASTACK_REGISTRY_RETRY_BASE_MS = "0";

const realFetch = globalThis.fetch;
function stub(responses) {
  let calls = 0;
  globalThis.fetch = async () => {
    const next = responses[Math.min(calls, responses.length - 1)];
    calls++;
    if (next instanceof Error) throw next;
    return next;
  };
  return () => calls;
}
function response(status, body = "{}", headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: new Headers(headers),
    text: async () => body,
  };
}
const fetchFailed = () =>
  Object.assign(new TypeError("fetch failed"), {
    cause: { code: "ECONNRESET" },
  });

test.afterEach(() => {
  globalThis.fetch = realFetch;
});

test("a network error is retried, then the answer is returned", async () => {
  const calls = stub([fetchFailed(), fetchFailed(), response(200, '{"a":1}')]);
  const res = await fetchRegistryWithRetry("https://r.test/x.json", {});
  assert.equal(res.ok, true);
  assert.deepEqual(await res.json(), { a: 1 });
  assert.equal(calls(), 3);
});

test("a body cut off mid-read ('terminated') is retried", async () => {
  const cut = {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    text: async () => {
      throw new TypeError("terminated");
    },
  };
  const calls = stub([cut, response(200, '{"b":2}')]);
  const res = await fetchRegistryWithRetry("https://r.test/x.json", {});
  assert.deepEqual(await res.json(), { b: 2 });
  assert.equal(calls(), 2);
});

test("5xx and 429 are retried (Retry-After honoured)", async () => {
  const calls = stub([
    response(503),
    response(429, "", { "retry-after": "0" }),
    response(200, "ok"),
  ]);
  const res = await fetchRegistryWithRetry("https://r.test/x.json", {});
  assert.equal(await res.text(), "ok");
  assert.equal(calls(), 3);
});

test("a 404 is an answer: returned at once, never retried", async () => {
  const calls = stub([response(404, "nope"), response(200)]);
  const res = await fetchRegistryWithRetry("https://r.test/x.json", {});
  assert.equal(res.ok, false);
  assert.equal(res.status, 404);
  assert.equal(calls(), 1);
});

test("a 5xx on the last try is returned for the caller to report", async () => {
  const calls = stub([response(502), response(502), response(502)]);
  const res = await fetchRegistryWithRetry("https://r.test/x.json", {});
  assert.equal(res.status, 502);
  assert.equal(calls(), 3);
});

test("only after every try fails does the network error reach the caller", async () => {
  const calls = stub([fetchFailed()]);
  await assert.rejects(
    fetchRegistryWithRetry("https://r.test/x.json", {}),
    /fetch failed/,
  );
  assert.equal(calls(), 3);
});

test("a non-network error (a bug, a refused redirect policy) is not retried", async () => {
  const calls = stub([new RangeError("bad input")]);
  await assert.rejects(
    fetchRegistryWithRetry("https://r.test/x.json", {}),
    /bad input/,
  );
  assert.equal(calls(), 1);
});
