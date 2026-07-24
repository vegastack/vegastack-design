---
"@vegastack/design": minor
"@vegastack/ui": minor
---

**Breaking (both packages — `minor` is the breaking position pre-1.0).** Two changes here alter
existing behaviour and were previously filed as `patch`, which would have broken consumers on an
upgrade they had no reason to review:

- `vegastack-design verify --post-write` now **requires** `--expected-integrity <sha256-base64>`,
  a flag that did not exist before. Any existing consumer CI step invoking `--post-write` with just
  `--item`/`--target-dir` now exits 2. Take the value from the pre-write run, which prints the exact
  integrity-pinned command to use.
- `MarkdownView` images are **same-origin by default**. Remote `<img>` sources previously rendered
  unconditionally and are now dropped unless their origin is listed in the new `allowedImageOrigins`
  prop. Consumers rendering markdown that references remote images must opt those origins in.

Constrain registry credentials and copied-file verification to trusted origins and contained paths,
pin post-write checks to a digest retained before copy-in, match shadcn's inherited TypeScript alias
resolution, and make Markdown images same-origin by default with an explicit remote-origin allowlist.

Refuse to place credential material in a registry URL, and redact it from CLI output. The
trusted-origin check only inspected request HEADERS, so a `components.json` registry entry such as
`"@vegastack": "http://host/r/{name}.json?k=${CF_ACCESS_CLIENT_SECRET}"` declared no headers, skipped
the check entirely, and sent the Cloudflare Access service token to an arbitrary origin over plain
http — while `check-updates` exited 0. The token was also echoed verbatim into stderr, and therefore
into CI logs. Credentials now must travel as headers: a URL is recorded in server access, proxy and
CDN logs even when the origin is fully trusted, so the refusal is unconditional rather than
origin-scoped. Applied identically in `check-updates`, `verify`, and the shared internal helper so
the three do not diverge on this boundary. Uncredentialed registries (including plain-http localhost
mirrors) are unaffected.
