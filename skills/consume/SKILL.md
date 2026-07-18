---
name: vegastack-consume
description: Use when setting up a downstream project to consume VegaStack — install the public token layer, wire the provider, add components via the fail-closed shadcn registry, and override tokens.
metadata:
  author: vegastack
  version: "0.1.0"
---

# vegastack-consume — downstream setup

## 1. Install the public token layer (no credentials) + the provider

```bash
# public runtime layer (no creds) — pulls @vegastack/design-tokens in as a dependency:
npm i @vegastack/design
```

> **The provider (`VegaStackProvider` + `Toaster`, wired in step 3) — distribution is an UNRESOLVED owner
> decision; not yet downstream-consumable.** `@vegastack/ui` ships these in this repo but is marked
> `private`, and there is **no `provider` registry item** yet — so today the provider is workspace-internal
> only (the docs dogfood it via `workspace:*`). The locked model (requirements §NG4, as amended by
> `docs/plans/package-consolidation.md`) makes only `@vegastack/design` + `@vegastack/design-tokens`
> public and keeps component source private (registry copy-in), which does not place
> the *provider*. **The owner must pick ONE and implement it before this consume path works:**
> 1. **Publish `@vegastack/ui`** as a public runtime package (extend §NG4 to list it, flip `private` off,
>    re-add a changeset) → then downstream does `npm i @vegastack/ui` and imports `VegaStackProvider` (step 3).
> 2. **Ship a real `provider` registry item** (source + tests + integrity + docs) → then downstream does
>    `shadcn add @vegastack/provider` and imports it from the copied-in `@/components/...` path.
>
> See `docs/plans/HANDOFF-STATUS.md` → §4 for this decision. The steps below assume option 1's import path;
> adjust the import if option 2 is chosen. Component *source* always comes via the registry copy-in (step 4).

## 2. Tailwind v4 CSS (consumers must be on v4)
```css
@import "tailwindcss";
@import "@vegastack/design/theme.css";   /* :root + .dark + @theme inline bridge (re-export of @vegastack/design-tokens) */
@import "@vegastack/design/base.css";    /* recommended: border-border, body bg, :focus-visible, pointer cursor on interactive controls, reduced-motion, AND `body { isolation: isolate }` (the Base UI portal stacking context — see step 3) */
```
Or one import: `@import "@vegastack/design/preset.css";` (bundles tailwind + tw-animate + tokens + base).

**You do NOT need a manual `@source` for the provider/icon classes.** The preset already declares
`@source` for the classes shipped *inside* our published builds: `@source "./dist"` covers the icon
runtime (`BrandIcon`) that now lives inside `@vegastack/design` itself, and `@source "../ui/dist"`
covers `@vegastack/ui` (the `VegaStackProvider` + `Toaster`, whose sonner classNames like
`group-[.toaster]:bg-popover` must be generated) — when installed, ui sits as a sibling under the
`@vegastack` scope so the relative path resolves in any layout (flat npm or strict pnpm). If you
install `@vegastack/ui`, the Toaster/provider styles are generated automatically; if you don't, the
`@source` simply no-ops (no build error). The repo gates this contract permanently via
`tooling/verify-preset-source.mjs`. (Your own app/registry component source is auto-scanned by Tailwind as
usual; this `@source` is *only* for the classes that live inside our published package builds.)

## 3. Wrap the app root in the provider
```tsx
import { VegaStackProvider } from '@vegastack/ui';
// <html suppressHydrationWarning> (next-themes mutates it)
<body className="isolate"><VegaStackProvider>{children}</VegaStackProvider></body>
```
Bundles theme (next-themes, class-based dark), Sonner toaster, Base UI tooltip + direction providers.

**Base UI portal contract (required):** overlay components (Dialog, Sheet, Popover, Tooltip, Select,
menus) portal to `<body>` and rely on a **root stacking context** to render above page content. Give
your app root `isolation: isolate` — either by importing `@vegastack/design/base.css` (it sets
`body { isolation: isolate }`) or by adding `className="isolate"` / `style={{ isolation: 'isolate' }}`
to your `<body>`/root yourself. Without it, popups can render *under* app chrome or mis-position in
stacking-context-heavy layouts.

## 4. Add components (internal — registry copy-in)
`components.json` registry block (CF Access service-token headers from `.env.local`):
```json
{ "registries": { "@vegastack": {
  "url": "https://design.vegastack.com/r/{name}.json",
  "headers": { "CF-Access-Client-Id": "${CF_ACCESS_CLIENT_ID}", "CF-Access-Client-Secret": "${CF_ACCESS_CLIENT_SECRET}" } } } }
```
Inspect first: `pnpm dlx shadcn@latest add @vegastack/button --dry-run`.

**Integrity flow (fail-closed, three steps) — this is the ONLY safe way to add a component.**
The verifier ships as a bin from the public `@vegastack/design` package (you have no `tooling/` dir), so
run it via npx — no repo path. The flow closes the **time-of-check/time-of-use (TOCTOU)** gap: `shadcn add`
**re-fetches** the item from the registry, so a registry that changed *between* your preflight and the
copy-in would otherwise slip through. Step 1 saves the EXACT verified bytes; step 3 proves the copied files
match those saved bytes — not a re-fetch.

```bash
# ── 1) PRE-WRITE: verify the item AND --save the trusted bytes for step 3 ──
# full mode (default): Sigstore signature (cosign) + item hash — the real trust boundary.
# needs the deployed signed manifest + the `cosign` CLI.
npx --package=@vegastack/design vegastack-design verify \
  --save /tmp/vega-button.json button

# hash-only mode: item hash only, skips cosign. for local dev / no cosign / before the
# signed manifest is deployed. trusts the manifest transport; does NOT prove provenance.
npx --package=@vegastack/design vegastack-design verify \
  --hash-only --save /tmp/vega-button.json button

# ── 2) COPY-IN: shadcn writes the files (rewriting import aliases per your components.json) ──
# Each copied file's line 1 is a provenance header that ships INSIDE the registry item content —
# `// @vegastack <name>@<version> sha256-<integrity>` — so shadcn writes it verbatim (it is not a
# shadcn feature; it travels in the item). The design-audit skill reads it later for drift detection.
pnpm dlx shadcn@latest add @vegastack/button

# ── 3) POST-WRITE: prove the COPIED files match the SAVED item — fail-closed (exit 1 on tamper) ──
# offline, no network. --target-dir is your project root (where shadcn wrote the files).
npx --package=@vegastack/design vegastack-design verify \
  --post-write --item /tmp/vega-button.json --target-dir .
```

Step 1 recomputes the canonical item hash and aborts on mismatch (full mode additionally aborts unless the
manifest is signed by our EXACT pinned GitHub-OIDC release identity), then writes the verified item JSON to
`--save`. Step 3 reads that saved item and, for every file in it, compares the bytes shadcn wrote on disk
against the item's `content`. **Guarantee:** every non-import line must match byte-for-byte; an import (or
`export … from`) line may differ ONLY in its module specifier, and ONLY when that change is a sanctioned
import-alias rewrite (the registry's source alias → your `components.json` alias — e.g. `@/components/ui/*`
→ `@/components/ui/*`, `~/ui/*`, or `#components/ui/*`). **Any** other difference — an injected/removed line,
an altered non-import line, an import repointed to a non-alias specifier, altered import bindings, or a
missing file — exits 1 with a per-file diff. **This is what closes the check→copy gap:** because step 3
diffs against the bytes step 1 verified, a registry swapped after the preflight cannot land tampered code
undetected. **Limit:** it proves byte-faithfulness *modulo* alias rewriting; it does not re-derive your exact
alias map, so a rewrite from one sanctioned alias root to another is accepted — but no code, logic, or
non-import line can change without being caught.

Pass `--help` to see all flags and env vars (`VEGASTACK_REGISTRY`, the `CF_ACCESS_*` service-token headers,
`VEGASTACK_SIGNER_*`). If `--save` is omitted, step 1 defaults to a temp file and prints its path (reuse it
in step 3). If `@vegastack/design` is a devDep, wire `verify:registry` (pre-write) + `verify:registry:post`
(post-write) scripts instead of npx.

> Status: the bin (all three steps, including `--post-write`) is delivered the moment `@vegastack/design`
> is published. Until then it lives at `packages/utils/bin/verify-registry-item.mjs` (run with `node …`).
> Our own CI uses the repo-internal `tooling/verify-item.mjs`, which is **pre-write only** (CI never runs
> `shadcn add`, so it has no copied files to post-write-check); both share the same canonical hash logic.

## Staying up to date

Copy-in means **no automatic updates** — you re-pull when you want them. `vegastack-design check-updates`
reads the provenance header of every copied component and compares its integrity hash to the live
registry index (one fetch), so it lists exactly what changed:

```bash
npx vegastack-design check-updates                 # ⬆ update / ✓ up to date / ? not in registry
npx vegastack-design check-updates --fail-on-update # CI drift gate (exit 1 if stale)
```

Then per stale component: `shadcn add @vegastack/<name> --diff` (review) → `--overwrite` (apply, re-run
the post-write verify above). Status is by hash, so a component stays `up to date` when the registry's
global version bumped but its content didn't change.

External/client projects are **tokenless** — components are copied in by us during development; the
shipped app holds zero VegaStack credentials.

## 5. Override tokens (one file)
```css
:root { --primary: oklch(0.55 0.2 264); }  /* repaints every component, light + dark */
```

## 6. Stay current
Add the Renovate preset (`github>VegaStack/renovate-config`) so additive token bumps auto-PR. For a
component improvement, re-run `shadcn add @vegastack/<x> --diff` then `--overwrite`.
