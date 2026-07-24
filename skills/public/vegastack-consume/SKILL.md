---
name: vegastack-consume
description: Set up a project to consume the VegaStack design system — install the public npm layer, wire the Tailwind v4 CSS and the provider, configure registry access, add components through the fail-closed integrity flow, override tokens, and keep copies up to date. Use when initialising a new project on VegaStack, adding the first component, fixing setup or registry-auth problems, or wiring the provider.
---

# Consume VegaStack

Once setup is done, use the `vegastack-design-system` skill for day-to-day UI work.

## 1. Install the public layer

```bash
npm i @vegastack/design
```

No credentials needed. It pulls in `@vegastack/design-tokens` as a dependency and provides `cn()`,
the icon runtime, the Tailwind v4 preset, and the `vegastack-design` CLI.

**Invoking the CLI.** The bin is `vegastack-design` but the package is `@vegastack/design`, so a
bare `npx vegastack-design …` in a project that does not already have it installed would try to
fetch an unrelated, unscoped package from npm. Use one of these instead — the first once it is a
local dependency (it resolves from `node_modules` and never contacts the registry), the second for a
standalone one-off:

```bash
pnpm exec vegastack-design <command>
npx --package=@vegastack/design vegastack-design <command>
```

`@vegastack/ui` is private and is never installed downstream — components arrive by copy-in.

## 2. Tailwind v4 CSS

You must be on Tailwind v4.

```css
@import "tailwindcss";
@import "@vegastack/design/theme.css"; /* :root + .dark + the @theme inline bridge */
@import "@vegastack/design/base.css"; /* border-border, body bg, :focus-visible, pointer cursor
                                            on interactive controls, reduced-motion, and
                                            body { isolation: isolate } — see step 3 */
```

Or one import that bundles all of it plus tw-animate:

```css
@import "@vegastack/design/preset.css";
```

**No manual `@source` is required.** The preset already declares `@source` for the classes that live
inside the published builds — the icon runtime, and the provider/Toaster classNames (sonner emits
`group-[.toaster]:bg-popover`-style classes that Tailwind must be told to generate). Your own
application and component source is scanned by Tailwind as usual.

## 3. Wrap the app root in the provider

```bash
npx shadcn@latest add @vegastack/provider
```

This copies `VegaStackProvider` and `useVegaStackTheme` into your project, composing the `sonner`
Toaster item.

```tsx
import { VegaStackProvider } from "@/components/ui/provider";

// <html suppressHydrationWarning>  — next-themes mutates it
<body className="isolate">
  <VegaStackProvider>{children}</VegaStackProvider>
</body>;
```

It bundles theme (next-themes, class-based dark), the Sonner toaster, and the Base UI tooltip and
direction providers.

**The `isolate` is required, not cosmetic.** Overlay components (Dialog, Sheet, Popover, Tooltip,
Select, menus) portal to `<body>` and depend on a root stacking context to render above page
content. Get it from `@vegastack/design/base.css` (which sets `body { isolation: isolate }`) or by
putting `className="isolate"` on your `<body>` yourself. Without it, popups can render _under_ app
chrome or mis-position in stacking-context-heavy layouts.

## 4. Configure registry access

Components come from a private registry behind Cloudflare Access service tokens.

If the project has no `components.json` yet, create one first — pick the **base** style, never
`radix`, because VegaStack components are Base UI:

```bash
pnpm dlx shadcn@latest init --base base
```

Then add the registry block to `components.json`:

```json
{
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

Put the credentials in `.env.local`. Inspect before writing anything:

```bash
pnpm dlx shadcn@latest add @vegastack/button --dry-run
```

External and client projects are **tokenless** — components are copied in during development, and
the shipped application holds zero VegaStack credentials.

## 5. Add a component (fail-closed, three steps)

This is the only safe way to add a component. Do not collapse it to a bare `shadcn add`: that leaves
a time-of-check/time-of-use gap, because `shadcn add` re-fetches the item after any preflight.

```bash
# Create a private directory and choose a NEW file path inside it. The verifier refuses an
# existing path or a symlink rather than overwriting or following it.
DIR="$(mktemp -d "${TMPDIR:-/tmp}/vegastack-verify.XXXXXX")"; ITEM="$DIR/button.json"

# 1) PRE-WRITE — verify signature + hash, and save the trusted bytes for step 3.
npx --package=@vegastack/design vegastack-design verify --save "$ITEM" button

# Retain the verified digest in the parent shell BEFORE shadcn or dependency code runs.
EXPECTED="$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")).meta.integrity)' "$ITEM")"

# 2) COPY-IN — shadcn writes the files, rewriting import aliases per your components.json.
pnpm dlx shadcn@latest add @vegastack/button

# 3) POST-WRITE — prove the copied files match the SAVED item. Exits 1 on any tampering.
npx --package=@vegastack/design vegastack-design verify \
  --post-write --item "$ITEM" --expected-integrity "$EXPECTED" --target-dir .
```

Add `--hash-only` to step 1 only for local development or before the signed manifest is deployed —
it skips `cosign` and therefore does **not** prove provenance.

What each step guarantees, what it deliberately does not, and every flag and environment variable:
[references/registry-integrity.md](references/registry-integrity.md).

## 6. Override tokens

One file, one variable, and every component repaints in both themes:

```css
:root {
  --primary: oklch(0.55 0.2 264);
}
```

Never override a `--color-*` variable — that is the build-inlined bridge, not the runtime contract.

## 7. Stay current

Copy-in means no automatic updates.

```bash
npx --package=@vegastack/design vegastack-design check-updates    # ⬆ update · ≈ drift · ✓ up to date
```

Then per stale component: `shadcn add @vegastack/<name> --diff` to review, `--overwrite` to apply,
and re-run the step-3 post-write verification. Details and CI wiring:
[references/registry-integrity.md](references/registry-integrity.md).

Add the Renovate preset `github>VegaStack/renovate-config` so additive token bumps arrive as PRs.

## Install the agent skills

If this project's agents do not already have them:

```bash
npx --package=@vegastack/design vegastack-design skills install
```

Writes the public VegaStack skills into `.claude/skills/` and `.agents/skills/`.
