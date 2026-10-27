// Registry fetch with retries — shared by `check-updates` and `verify-registry-item`.
//
// A CI runner's network flakes several times a day: "fetch failed" (a reset socket, a DNS blip),
// "terminated" (the body stream cut off mid-read) or a 5xx or 429 from the edge. None of those says
// anything about drift, so one of them must not fail a `check-updates --fail-on-update` run. Each
// request gets a timeout and up to `attempts` tries with jittered exponential backoff (a 429's
// `Retry-After` is honoured, capped); the body is read inside the attempt, so a stream cut off
// mid-read is retried too. Only after the last try does the caller see the failure and report the
// registry unreachable. Anything else — a 404, a 401/403, a 4xx — is an answer, returned at once,
// and integrity checks run on the body exactly as before.

/** How many tries a request gets before its failure is reported. */
export const REGISTRY_FETCH_ATTEMPTS = 3;

/** The first retry's base delay; each later one doubles it (jittered ±50%). Read per retry. */
function baseDelayMs() {
  const value = Number(process.env.VEGASTACK_REGISTRY_RETRY_BASE_MS);
  return Number.isFinite(value) && value >= 0 ? value : 400;
}

/** The longest a `Retry-After` is waited for. */
const MAX_RETRY_AFTER_MS = 5_000;

/** A status worth another try: the edge or the origin had a moment, not an answer. */
export function isTransientStatus(status) {
  return status === 429 || status === 408 || (status >= 500 && status <= 599);
}

/** A thrown fetch or body-read error worth another try (network, reset, cut-off stream, timeout). */
export function isTransientError(error) {
  if (!error) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  if (error.name === "TypeError") return true; // undici: "fetch failed"
  const text = `${error.message ?? ""} ${error.cause?.code ?? ""} ${error.cause?.message ?? ""}`;
  return /terminated|fetch failed|socket|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|EPIPE|UND_ERR/i.test(
    text,
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A `Retry-After` in milliseconds — delta-seconds or an HTTP date — or undefined when absent/bad. */
export function retryAfterMs(value, now = Date.now()) {
  if (value == null || value === "") return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const at = Date.parse(value);
  return Number.isFinite(at) ? Math.max(0, at - now) : undefined;
}

/** How long to wait before try `attempt + 1`: the server's `Retry-After` (capped), else backoff. */
export function backoff(attempt, retryAfter) {
  const asked = retryAfterMs(retryAfter);
  if (asked !== undefined) return Math.min(asked, MAX_RETRY_AFTER_MS);
  return baseDelayMs() * 2 ** attempt * (0.5 + Math.random());
}

/** A Response-like whose body was read as `body` (or is read once, lazily, from `response`). */
function settled(response, body) {
  let pending = body === undefined ? undefined : Promise.resolve(body);
  const read = () => (pending ??= response.text().catch(() => ""));
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    text: () => read(),
    json: async () => JSON.parse(await read()),
  };
}

/**
 * Fetch `url`, retrying transient failures. Resolves to a small Response-like object: a 2xx's body
 * is already read (so a cut-off body is retried); any other answer's is read once, lazily, and
 * never retried. Rejects with the last error when every try failed at the network level.
 *
 * @param {string | URL} url
 * @param {RequestInit} init  headers and redirect policy; the timeout signal is added per try
 * @param {{ timeoutMs?: number, attempts?: number }} [options]
 */
export async function fetchRegistryWithRetry(url, init, options = {}) {
  const attempts = options.attempts ?? REGISTRY_FETCH_ATTEMPTS;
  const timeoutMs = options.timeoutMs ?? 15_000;
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const last = attempt === attempts - 1;
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (isTransientStatus(response.status) && !last) {
        // Drain so the socket is released, then try again.
        await response.text?.().catch(() => {});
        await sleep(backoff(attempt, response.headers?.get?.("retry-after")));
        continue;
      }
      // A stub (or an odd runtime) may offer only `json()`: hand it back untouched, so its parse
      // still happens — and its errors are still redacted — at the caller.
      if (typeof response.text !== "function") return response;
      // Any other non-2xx (a 404, a 401/403, the last 5xx) is an answer: returned at once, its
      // body read lazily and never retried — a body cut off mid-read can't turn it into a retry.
      if (!response.ok) return settled(response);
      // A 2xx's body is read inside the try, so a stream cut off mid-read ("terminated") retries.
      return settled(response, await response.text());
    } catch (error) {
      lastError = error;
      if (!isTransientError(error) || last) throw error;
      await sleep(backoff(attempt));
    }
  }
  throw lastError;
}
