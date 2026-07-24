# Registry integrity — what the three steps actually guarantee

The fail-closed add flow in the `vegastack-consume` skill is three commands. This explains what each
one proves, what it deliberately does not prove, and how to configure it.

## Contents

- [Why three steps and not one](#why-three-steps-and-not-one)
- [Step 1 — pre-write verification](#step-1--pre-write-verification)
- [Step 2 — copy-in](#step-2--copy-in)
- [Step 3 — post-write verification](#step-3--post-write-verification)
- [The guarantee, stated precisely](#the-guarantee-stated-precisely)
- [Limits](#limits)
- [Configuration](#configuration)
- [Staying up to date](#staying-up-to-date)

## Why three steps and not one

`shadcn add` **re-fetches** the item from the registry. A registry that changed between your
preflight and the copy-in would slip through a single-step check — a time-of-check/time-of-use
(TOCTOU) gap.

Step 1 saves the exact verified bytes. Step 3 proves the files on disk match **those saved bytes**,
not a fresh fetch. That is what closes the gap.

## Step 1 — pre-write verification

```bash
npx --package=@vegastack/design vegastack-design verify --save "$ITEM" button
```

Full mode (the default) checks the Sigstore signature via `cosign` **and** the canonical item hash.
The signature is the real trust boundary: it requires the deployed signed manifest and asserts the
exact pinned GitHub-OIDC release identity, not merely a valid signature from anyone.

```bash
npx --package=@vegastack/design vegastack-design verify --hash-only --save "$ITEM" button
```

Hash-only mode skips `cosign`. Use it for local development, where `cosign` is unavailable, or before
the signed manifest is deployed. **It does not prove provenance** — it only proves the item is
internally consistent.

Either mode aborts on mismatch and writes the verified item JSON to `--save`. If `--save` is omitted,
it creates a private unique temp directory and prints the path; reuse that path in step 3.

Retain the verified digest in the parent shell **before** `shadcn` or any dependency code runs:

```bash
EXPECTED="$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")).meta.integrity)' "$ITEM")"
```

Step 3 uses this independently retained value to detect replacement of the saved item itself, not
just drift in the copied files.

## Step 2 — copy-in

```bash
pnpm dlx shadcn@latest add @vegastack/button
```

The registry item content carries a provenance header (`// @vegastack <name>@<ver> sha256-…`), but
the current shadcn CLI **strips leading comments on copy-in**. That is expected and is never a
finding by itself — update tracking is header-optional.

## Step 3 — post-write verification

```bash
npx --package=@vegastack/design vegastack-design verify \
  --post-write --item "$ITEM" --expected-integrity "$EXPECTED" --target-dir .
```

Offline, no network. `--target-dir` is your project root, where shadcn wrote the files.

It first recomputes the saved item's hash against the independently retained digest, then compares
the bytes on disk against the item's `content` for every file. Exits 1 with a per-file diff on any
mismatch.

## The guarantee, stated precisely

shadcn's contiguous start-of-file comment/whitespace prologue removal is accepted **only** for the
file types it actually transforms. After that:

- every non-import line must match byte-for-byte;
- an `import` (or `export … from`) line may differ **only** in its module specifier, and **only** when
  that difference exactly matches the registry-source-alias → consumer-alias rewrite declared by your
  `components.json` (resolved using standard TypeScript/JavaScript `paths`).

Anything else exits 1: an injected or removed line, an altered non-import line, an import repointed to
a non-alias specifier, altered import bindings, or a missing file. No executable code can change
without being caught.

## Limits

It proves byte-faithfulness _modulo_ the exact transformed-code leading-comment removal and the
configured alias rewrite. It does **not** evaluate arbitrary build-tool alias plugins, package import
maps, or extended config files.

## Configuration

`--help` lists every flag and environment variable: `VEGASTACK_REGISTRY`,
`VEGASTACK_TRUSTED_REGISTRY_ORIGIN`, the `CF_ACCESS_*` service-token headers, and `VEGASTACK_SIGNER_*`.

Credentialed requests must use the exact trusted HTTPS origin (production is the default) and
redirects are rejected. A custom credentialed registry must set its trust anchor in
operator-controlled process or CI configuration — **never** in a checkout-local dotenv file.

If `@vegastack/design` is a devDependency, wire `verify:registry` (pre-write) and
`verify:registry:post` (post-write) scripts instead of invoking `npx` each time.

## Staying up to date

Copy-in means no automatic updates — you re-pull when you want them.

```bash
npx --package=@vegastack/design vegastack-design check-updates                  # ⬆ update · ≈ drift · ✓ up to date · ? not in registry
npx --package=@vegastack/design vegastack-design check-updates --fail-on-update # CI drift gate (exit 1 on update or drift)
```

A provenance header is used as a fast path when present. For normal headerless shadcn copies, the
tool maps the exact registry target by filename and compares the complete installed item after the
real leading-comment and configured-alias transforms.

`≈ drift` means the file differs from the registry item — either an upstream update or your own local
edits. It refuses to attach credentials to any origin other than `VEGASTACK_TRUSTED_REGISTRY_ORIGIN`
(default `https://design.vegastack.com`) and never follows registry redirects.

Per stale component: `shadcn add @vegastack/<name> --diff` to review, then `--overwrite` to apply,
then re-run the post-write verification above.

Status is computed by hash, so a component correctly reads `up to date` when the registry's global
version bumped but that component's content did not change.
