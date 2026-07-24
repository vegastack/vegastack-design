# detail/04 — Registry & Cloudflare (verbatim)

> **Historical plan.** Section 6's broad human-docs SSO topology is superseded by
> [`../public-docs-cutover.md`](../public-docs-cutover.md). Preserve it as the original implementation
> record; do not recreate the broad root application for the public-docs architecture.

Verified 2026-06-24 against current shadcn docs/CLI behavior, ui.shadcn.com, and developers.cloudflare.com. shadcn CLI v4 supports Base UI via `--base base`.

## 1. `registry.json`

`$schema`: `https://ui.shadcn.com/schema/registry.json`. Required: `name`, `homepage`, `items`. **No `version`, no `integrity` field exist** (DL9 — we add a hash in `meta`).

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "vegastack",
  "homepage": "https://design.vegastack.com",
  "items": [
    {
      "name": "button",
      "type": "registry:ui",
      "title": "Button",
      "description": "Trigger an action. Use for primary/secondary/destructive actions.",
      "categories": ["actions"],
      "dependencies": [
        "@base-ui/react@^1.6.0",
        "class-variance-authority@^0.7.1",
        "@vegastack/tokens@^0.1.0"
      ],
      "registryDependencies": ["utils"],
      "files": [{ "path": "registry/ui/button.tsx", "type": "registry:ui" }],
      "meta": {
        "whenToUse": "Any clickable action.",
        "whenNotToUse": "Navigation to a URL — use Link.",
        "integrity": "sha256-<filled-by-build>",
        "version": "0.1.0"
      }
    }
  ]
}
```

## 2. `registry-item.json` (per item) — key fields

Discriminated union on `type` (14 values: `registry:lib|block|component|ui|hook|page|file|theme|style|item|base|font|example|internal`). For `registry:file`/`registry:page`, `files[].target` is **required**; otherwise optional.

- **npm dep with version range (the only native pinning, DL9):** `"dependencies": ["@vegastack/tokens@^0.1.0", "@base-ui/react@^1.6.0"]` — CLI passes these to the package manager.
- **`cssVars`:** `{ theme?, light?, dark? }`, each `Record<string,string>`.
- **`css`:** raw CSS (layers/keyframes/utilities).
- **`meta`:** `Record<string,any>` — **our integrity hash + version live here** (schema is `strip`, so unknown top-level keys are dropped, but `meta` is the sanctioned free-form escape hatch and survives `shadcn build`).
- **`docs`:** custom install docs text. **`categories`:** for agent grouping.
  Source: https://ui.shadcn.com/docs/registry/registry-item-json

## 3. `shadcn build` + integrity hash

```bash
pnpm dlx shadcn@latest build ./registry.json -o ./apps/docs/public/r
```

Outputs one fully-resolved `public/r/<name>.json` per item (file `content` inlined). Served under `output:'export'` as static `/r/<name>.json`.

**Integrity (DL9 — Codex F4).** The hash covers the **whole canonical item** (name, type, dependencies, registryDependencies, files incl. target, css, cssVars, docs, categories, meta-minus-integrity) — **not just `files[].content`**. A shared hash module is used by a build-stamp script AND a consume preflight.

```js
// tooling/registry-hash.mjs — shared canonical hash
import { createHash } from "node:crypto";
export function canonical(o) {
  if (Array.isArray(o)) return o.map(canonical);
  if (o && typeof o === "object")
    return Object.fromEntries(
      Object.keys(o)
        .sort()
        .map((k) => [k, canonical(o[k])]),
    );
  return o;
}
export function itemHash(item) {
  const { meta = {}, ...rest } = item;
  const m = { ...meta };
  delete m.integrity;
  return (
    "sha256-" +
    createHash("sha256")
      .update(JSON.stringify(canonical({ ...rest, meta: m })))
      .digest("base64")
  );
}
```

```js
// tooling/registry-stamp.mjs — run AFTER `shadcn build`: stamp meta.integrity + emit a manifest
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { itemHash } from "./registry-hash.mjs";
const dir = "apps/docs/public/r",
  manifest = {};
for (const f of readdirSync(dir).filter(
  (n) => n.endsWith(".json") && n !== "integrity-manifest.json",
)) {
  const item = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  const hash = itemHash(item);
  item.meta = { ...(item.meta ?? {}), integrity: hash };
  writeFileSync(`${dir}/${f}`, JSON.stringify(item, null, 2));
  manifest[item.name] = hash;
}
writeFileSync(
  `${dir}/integrity-manifest.json`,
  JSON.stringify(manifest, null, 2),
);
```

Root `package.json`: `"registry:build": "shadcn build packages/ui/registry.json -o apps/docs/public/r && node tooling/registry-stamp.mjs"` (Codex F5).

**Trust root — Sigstore keyless signing (Codex F2).** Hash + manifest are served from the same origin, so the **deploy** workflow (which has `permissions: id-token: write`) **signs the manifest with cosign keyless (GitHub OIDC — no long-lived key)** after `registry:build`, before `wrangler deploy`:

```yaml
- uses: sigstore/cosign-installer@v3
- run: |
    cosign sign-blob --yes \
      --bundle apps/docs/public/r/integrity-manifest.sigstore \
      apps/docs/public/r/integrity-manifest.json
```

The `.sigstore` bundle (signature + Fulcio cert bound to the workflow's OIDC identity) is published next to the manifest and verified in the consume preflight (below).

**Consume preflight (fail-closed, BEFORE `shadcn add` — the real before-write gate, Codex F4):**

```js
// tooling/verify-item.mjs — verify the SIGNED manifest, then the item, then signal OK (fail closed)
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { itemHash } from "./registry-hash.mjs";
const name = process.argv[2];
const base = process.env.VEGASTACK_REGISTRY ?? "https://design.vegastack.com/r";
const headers = {
  "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID,
  "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET,
};

// 1. fetch manifest + its Sigstore bundle; verify the signature against the PINNED GitHub OIDC identity
const [mRes, bRes] = await Promise.all([
  fetch(`${base}/integrity-manifest.json`, { headers }),
  fetch(`${base}/integrity-manifest.sigstore`, { headers }),
]);
writeFileSync("/tmp/vega-manifest.json", await mRes.text());
writeFileSync("/tmp/vega-manifest.sigstore", await bRes.text());
execFileSync(
  "cosign",
  [
    "verify-blob",
    "--bundle",
    "/tmp/vega-manifest.sigstore",
    "--certificate-identity-regexp",
    "^https://github.com/VegaStack/vegastack-design/",
    "--certificate-oidc-issuer",
    "https://token.actions.githubusercontent.com",
    "/tmp/vega-manifest.json",
  ],
  { stdio: "inherit" },
); // throws → aborts if the signature is invalid

// 2. trusted manifest → verify the item hash
const manifest = JSON.parse(readFileSync("/tmp/vega-manifest.json", "utf8"));
const item = await fetch(`${base}/${name}.json`, { headers }).then((r) =>
  r.json(),
);
const got = itemHash(item);
if (got !== item.meta?.integrity || got !== manifest[name]) {
  console.error(`integrity mismatch for ${name}`);
  process.exit(1);
}
```

The `vegastack-consume` skill runs `node tooling/verify-item.mjs <name>` (aborts on **signature OR hash** mismatch), then `pnpm dlx shadcn@latest add @vegastack/<name>`, then **post-write re-hashes the copied files** vs the item. The `vegastack-design-audit` skill re-runs the hash later to catch drift.

> **Trust model (Codex F2):** the manifest is **Sigstore-signed by the GitHub-Actions OIDC identity** and the preflight **pins that identity**, so a compromised CF origin/bucket **cannot forge a passing manifest**. Residual risk = compromise of the GitHub Actions workflow identity itself (mitigated by branch protection + required reviews on `main`). shadcn still re-fetches the item with no native integrity, so this remains a fail-closed gate on the signed+published item + a post-write file re-hash — not a guarantee of the exact bytes shadcn writes; with CF Access + HTTPS it closes the realistic supply-chain surface.

## 4. `components.json` (internal consumer) + auth

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-vega",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@vegastack": {
      "url": "https://design.vegastack.com/r/{name}.json",
      "headers": {
        "CF-Access-Client-Id": "${CF_ACCESS_CLIENT_ID}",
        "CF-Access-Client-Secret": "${CF_ACCESS_CLIENT_SECRET}"
      }
    }
  }
}
```

`.env.local`: `CF_ACCESS_CLIENT_ID=...` / `CF_ACCESS_CLIENT_SECRET=...`. Install: `pnpm dlx shadcn@latest add @vegastack/button`. List a namespace: `pnpm dlx shadcn@latest list @vegastack`. Inspect before write: `pnpm dlx shadcn@latest add @vegastack/button --dry-run` (or `pnpm dlx shadcn@latest view @vegastack/button`). Update flow: `--diff` then `--overwrite`.

**Base UI selection (DL1):** at consumer init, `pnpm dlx shadcn@latest init --base base` → records Base UI configuration + `@base-ui/react` dependency. Our own component source already targets `@base-ui/react`.
Source: https://ui.shadcn.com/docs/registry/namespace · https://ui.shadcn.com/docs/registry/authentication · https://ui.shadcn.com/docs/components-json

## 4b. MCP server (wire into agents)

```bash
pnpm dlx shadcn@latest mcp init --client claude   # also: --client codex | cursor | vscode
```

Claude `.mcp.json` / Codex `~/.codex/config.toml` get a `shadcn` server (`pnpm dlx shadcn@latest mcp`). It reads the same `components.json` `registries` block (resolves `${VAR}`), so private auth applies automatically. Tools: `get_project_registries`, `list_items_in_registries`, `search_items_in_registries`, `view_items_in_registries`, `get_item_examples_from_registries`, `get_add_command_for_items`, `get_audit_checklist`.
Source: https://ui.shadcn.com/docs/mcp

## 5. Cloudflare Workers Static Assets deploy (DL7)

`apps/docs/wrangler.jsonc` (assets-only — no Worker script; `main` not required):

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "vegastack-design-docs",
  "compatibility_date": "2026-06-20",
  "assets": {
    "directory": "./out",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page",
  },
}
```

Build + deploy:

```bash
# from apps/docs
pnpm build            # next build (output:'export') → ./out  (includes public/r/*.json)
npx wrangler deploy   # uploads ./out to Workers Static Assets
npx wrangler dev      # local preview
```

Use Workers Static Assets, NOT Pages (Cloudflare 2026 direction). Switch to `@opennextjs/cloudflare` only if SSR/ISR/request-time logic is ever added.
Source: https://developers.cloudflare.com/workers/static-assets/ · https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/

## 6. Cloudflare Access — historical pre-cutover topology (superseded)

**Create a service token:** Zero Trust → Access controls → Service credentials → Service Tokens → Create → set duration (e.g. `8760h`) → copy Client ID + Client Secret (shown once).

**Two self-hosted Access applications on `design.vegastack.com` (Codex F8 — humans vs machines):**

1. **Human docs app** (all paths) — **identity login, NOT service-token.** Policy `Allow`, Include → emails ending in `@vegastack.com` (or an IdP group). Humans open the showcase via SSO; no machine credential is ever handed to a person.
2. **`/r/*` registry app** (path `/r/*`) — **service-token-only.** Policy `Service Auth`, Include → the registry Service Token (+ optional `Require` IP). Cloudflare evaluates the most-specific path first, so this governs `/r/*` independently of the human app.

Human-docs policy (`decision: "allow"`, identity):

```json
{
  "name": "vegastack staff",
  "decision": "allow",
  "include": [{ "email_domain": { "domain": "vegastack.com" } }]
}
```

Registry policy (`decision: "non_identity"`, service token):

```json
{
  "name": "registry service token",
  "decision": "non_identity",
  "include": [{ "service_token": { "token_id": "<R_TOKEN_ID>" } }],
  "require": [{ "ip": { "ip": "203.0.113.0/24" } }]
}
```

**P0 gate tests BOTH:** a browser SSO login opens the docs, AND `curl` with `CF-Access-Client-Id`/`-Secret` headers fetches `/r/health.json` (200) while a no-header hit on `/r/*` is blocked.
**Consumer headers** (exact):

```http
CF-Access-Client-Id: <CLIENT_ID>.access
CF-Access-Client-Secret: <CLIENT_SECRET>
```

**Rotation/revocation:** dashboard → token → Refresh (extend) / Edit (duration) / delete (revoke immediately). Set an expiry alert ~1 week prior. Internal rotation only affects internal CIs; external projects are tokenless (consume public npm + dev-time copy-in).
Source: https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/ · https://developers.cloudflare.com/cloudflare-one/access-controls/policies/common-policies/ · https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths

## 7. `registry:font` / `registry:base` (reference)

- `registry:font` carries a required `font` object (`{ family, provider:"google", import, variable, subsets?, dependency? }`) — for self-hosting we instead ship fonts via the token CSS, but this is the shadcn-native font item if needed.
- `registry:base` ships a whole design system as one payload (`config` = partial `components.json` + deps + `cssVars`). Useful later for a one-command consumer bootstrap.
  Source: https://ui.shadcn.com/docs/registry/examples

## Flags

- Base UI `registry:base` (the _type_) ≠ the Base-UI _primitive_ (a `style`) — do not conflate.
- `--view` exists; `shadcn view <item>` is the discrete inspector; `--dry-run` is the safest pre-write preview.
- Confirm `main`-optional assets-only Worker on first `wrangler deploy`.
