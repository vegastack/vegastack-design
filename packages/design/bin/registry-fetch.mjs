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

function backoff(attempt, retryAfter) {
  if (retryAfter != null) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0)
      return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
  }
  return baseDelayMs() * 2 ** attempt * (0.5 + Math.random());
}

/**
 * Fetch `url` and read its body as text, retrying transient failures. Resolves to a small
 * Response-like object whose body is already read (`text()`/`json()` never touch the network);
 * rejects with the last error when every try failed at the network level.
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
      const body = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        text: async () => body,
        json: async () => JSON.parse(body),
      };
    } catch (error) {
      lastError = error;
      if (!isTransientError(error) || last) throw error;
      await sleep(backoff(attempt));
    }
  }
  throw lastError;
}
