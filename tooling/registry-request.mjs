const DEFAULT_REGISTRY = "https://design.vegastack.com/r";
const DEFAULT_TRUSTED_ORIGIN = new URL(DEFAULT_REGISTRY).origin;
const REQUEST_TIMEOUT_MS = 15_000;

export function serviceTokenHeaders(env = process.env) {
  return Object.fromEntries(
    Object.entries({
      "CF-Access-Client-Id": env.CF_ACCESS_CLIENT_ID,
      "CF-Access-Client-Secret": env.CF_ACCESS_CLIENT_SECRET,
    }).filter(([, value]) => value != null && value !== ""),
  );
}

// Deliberate floor — see the matching note in packages/design/bin/check-updates.mjs. Substring
// matching a short value would refuse every URL that merely contains those characters.
const MIN_SECRET_LENGTH = 8;

/**
 * Credential material that must never appear in a request URL. The trusted-origin check below is
 * scoped to requests carrying credential HEADERS, so a URL with the token in a query string skipped
 * it and was fetched. Credentials belong in headers: a URL is recorded in server access logs, proxy
 * logs and CDN caches even when the origin is fully trusted — so this bar is unconditional.
 * Kept in step with the two published bins in packages/design/bin; these three copies must not
 * diverge on a security boundary.
 */
export function assertNoSecretInUrl(url, env = process.env) {
  const text = String(url);
  for (const name of ["CF_ACCESS_CLIENT_SECRET", "CF_ACCESS_CLIENT_ID"]) {
    const secret = env[name];
    if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH)
      continue;
    const encoded = encodeURIComponent(secret);
    if (
      text.includes(secret) ||
      (encoded !== secret && text.includes(encoded))
    ) {
      throw new Error(
        `refusing to put \${${name}} in a registry URL — credentials must be sent as headers, ` +
          `never in a URL (URLs are recorded in access, proxy, and CDN logs).`,
      );
    }
  }
}

export function assertRegistryRequest(
  url,
  headers,
  trustedOrigin = process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN ??
    DEFAULT_TRUSTED_ORIGIN,
) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`registry URL is invalid: ${url}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error("registry URL must not contain embedded credentials");
  }
  // Unconditional, and BEFORE the header-scoped origin check: an uncredentialed request skips
  // everything below, and a URL-borne secret leaks even to the trusted origin.
  assertNoSecretInUrl(url);
  if (Object.keys(headers).length === 0) return parsed;

  let trusted;
  try {
    trusted = new URL(trustedOrigin);
  } catch {
    throw new Error(
      "VEGASTACK_TRUSTED_REGISTRY_ORIGIN must be an absolute HTTPS origin",
    );
  }
  if (
    trusted.protocol !== "https:" ||
    trusted.username ||
    trusted.password ||
    trusted.pathname !== "/" ||
    trusted.search ||
    trusted.hash
  ) {
    throw new Error(
      "VEGASTACK_TRUSTED_REGISTRY_ORIGIN must be an HTTPS origin with no path, credentials, query, or hash",
    );
  }
  if (parsed.protocol !== "https:" || parsed.origin !== trusted.origin) {
    throw new Error(
      `refusing to send registry credentials to ${parsed.origin}; trusted origin is ${trusted.origin}`,
    );
  }
  return parsed;
}

export async function fetchRegistryText(url, headers, label) {
  assertRegistryRequest(url, headers);
  const response = await fetch(url, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `${label} fetch failed: HTTP ${response.status} ${response.statusText}`,
    );
  }
  return response.text();
}

export { DEFAULT_REGISTRY };
