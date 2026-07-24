# Plan: `vegastack-design` CLI + clean component-update loop

> **Superseded historical plan.** Package consolidation moved the CLI from `@vegastack/utils` to
> `@vegastack/design`, current shadcn removes leading comments during copy-in, and the active
> integrity/update workflow is defined by `skills/public/vegastack-consume/SKILL.md` plus `docs/RELEASING.md`.
> Preserve the details below as implementation history, not current operating instructions.

**Goal:** Let this repo ship component updates from the private GitHub repo and give downstream a clean **release → review → receive** loop. Centerpiece: a `vegastack-design` CLI (subcommands) shipped from `@vegastack/utils`, with a new `check-updates` ("one command shows me what to re-pull") and the existing verifier folded in as `verify`. Plus the supporting docs + release convention.

**Operating mode:** build LOCAL, stop at publish/deploy (user triggers npm publish / Cloudflare deploy). Everything uncommitted until "commit".

---

## 0. Locked decisions (from this thread)

- CLI name **`vegastack-design`** (umbrella, subcommands). Maps the domain (design.vegastack.com) + the suite (components/tokens/utils). Bin name is `vegastack-design` (NOT `vegastack`) → cannot collide with a platform `vegastack` CLI.
- Ships from **`@vegastack/utils`** (already installed by consumers; already ships the verify bin). Bin name is independent of package name. No new package.
- Subcommands: **`check-updates`** (new), **`verify`** (the current `vegastack-verify-registry-item` logic), `--help`, `--version`.
- Updates are **pull-based** (shadcn fundamentally never auto-pushes). The CLI + a changelog make the pull clean.
- Distribution architecture is unchanged + already built: npm packages via changesets (`release.yml`); signed `/r/*` registry to Cloudflare (`deploy.yml`); integrity = per-item SHA-256 + Sigstore manifest; consume via `components.json` `@vegastack` namespace + CF Access service-token headers.

### Open micro-decision (default chosen, toggleable)

**Back-compat for the old bin:** default = **keep `vegastack-verify-registry-item` as a deprecated alias** (the bin entry stays; both work; docs point to `vegastack-design verify`; a one-line stderr deprecation notice). Alternative = clean cutover (remove the old bin entry, update all docs). Plan is written for the alias; flip one bin-map line + drop the notice for cutover.

---

## 1. Verified facts the implementation relies on

- **Provenance header** (first line of every copied-in file, stamped by `tooling/registry-header.mjs`): `// @vegastack <name>@<version> sha256-<base64>=`. `<sha>` IS the item's `meta.integrity`. Survives `shadcn add` (consumers are told to keep it). Regex: `^\/\/ @vegastack (\S+)@(\S+) sha256-([A-Za-z0-9+/=]+)`.
- **Built index** `apps/docs/public/r/registry.json` items each carry `meta.version` AND `meta.integrity` → single fetch gives everything. (No `registry-stamp` change needed.)
- **`@vegastack/utils`**: `type: module`, `files: ["dist","bin"]` (bins ship), deps `clsx`+`tailwind-merge` only, `test: node test/compare.test.mjs`, bin `vegastack-verify-registry-item → ./bin/verify-registry-item.mjs`. The verify bin runs at module top-level (no `main()` guard) and `export`s its helpers.
- **`tooling/verify-shadcn-consume.mjs`** invokes the verifier by **file path** (`packages/utils/bin/verify-registry-item.mjs`), not by bin name → renaming the bin does NOT break it (the file stays).
- Consume config lives in `apps/docs/components.json` → `registries["@vegastack"]` (prod url + CF headers; local fallback `http://localhost:4000/{name}.json`). `${ENV}` is expanded by shadcn; our CLI must expand it too.
- Mirrored animated icons are normal registry items (provenance header + index entry) → `check-updates` reports them too (in `components/ui/icons/`).

---

## 2. File-by-file changes

### 2.1 NEW `packages/utils/bin/vegastack-design.mjs` (the dispatcher bin)

- `#!/usr/bin/env node`, `type: module`. Self-contained (node built-ins only).
- Parse `process.argv.slice(2)`; first token = subcommand.
- Routing:
  - `check-updates` → `import('./check-updates.mjs')` then `await main(rest)` (new code I own; importing avoids a 2nd process).
  - `verify` → **spawn** `node <new URL('./verify-registry-item.mjs', import.meta.url)> <rest>` with `stdio:'inherit'`; `process.exit(child.status ?? 1)`. (Spawn = zero refactor of the hash-tested verifier.)
  - `--version` / `-v` → read `version` from `new URL('../package.json', import.meta.url)`; print; exit 0.
  - `--help` / `-h` / `help` / no args → print top-level usage (lists subcommands); exit 0.
  - unknown → stderr usage; exit 2.
- Top-level usage text:
  ```
  vegastack-design — VegaStack design-system CLI

  Usage: vegastack-design <command> [options]

  Commands:
    check-updates     Show which copied-in components have newer registry versions
    verify            Verify a registry item's integrity (pre/post shadcn add)

  Run `vegastack-design <command> --help` for command options.
  ```

### 2.2 NEW `packages/utils/bin/check-updates.mjs` (the new subcommand)

`export async function main(argv)` + standalone guard `if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2))`.

**Algorithm (precise):**

1. **Parse flags:** `--dir <path>`, `--filter <a,b,...>`, `--json`, `--fail-on-update`, `--no-color`, `--cwd <path>`, `--registry <url>`, `--help`. (`--help` prints command usage, exit 0.)
2. **Resolve registry config** (precedence): (a) `--registry` value; else (b) `components.json` (in `--cwd`/cwd) `registries["@vegastack"]` — accept string or `{url, headers}`; else (c) env `VEGASTACK_REGISTRY` (default `https://design.vegastack.com/r`) + `CF_ACCESS_CLIENT_ID`/`CF_ACCESS_CLIENT_SECRET` headers. **Expand `${VAR}`** in url + every header value from `process.env` (unset → empty string + collect a warning).
3. **Derive index URL:** take the resolved item-url template and replace `{name}` → `registry` (e.g. `…/r/{name}.json` → `…/r/registry.json`). If no `{name}` token, append `/registry.json` to the base.
4. **Resolve components dir:** `--dir` else `components.json` `aliases.ui` mapped to fs (strip leading `@/` → relative to cwd; default `components/ui`). Document the `@/ = project root` assumption + `--dir` override.
5. **Scan** the dir recursively for `*.ts`/`*.tsx` (skip `node_modules`, `.next`, `dist`). Read the **first line** of each; keep files matching the provenance regex → `{ name, version, hash, file }`. Apply `--filter` (exact names or simple `*` globs). If none found → friendly message ("no VegaStack components found in <dir>"), exit 0.
6. **Fetch the index once** with the resolved headers. Non-200 → error (exit 2) with hint (auth headers unset? wrong url?). Build `Map(name → { version, integrity })` from `index.items[].meta`.
7. **Compare per component** (status by HASH, version is display-only — avoids false positives when the global version bumps but a component's content didn't change):
   - name not in index → `missing` (`?`).
   - `header.hash === index.integrity` → `current` (`✓`).
   - `header.hash !== index.integrity` → `update` (`⬆`), show `header.version → index.version`.
   - **No local-edit ("✎") status** — it cannot be derived from the static header alone (the header is the _published_ hash, not a hash of the current file body). Footer caveat instead: "`--overwrite` replaces files; if you've customized a component, `git diff` / `verify --post-write` before applying."
8. **Output:**
   - Default (human): aligned table, sorted (updates first, then current, then missing). Color via ANSI (suppress on `--no-color`, `NO_COLOR` env, or non-TTY). Summary line + the exact next commands for the FIRST stale item (and a note "(repeat per component)").
   - `--json`: `{ registry, checked: N, updates: M, items: [{ name, current, latest, status }] }`.
9. **Exit codes:** `0` clean / report-only; `1` only with `--fail-on-update` when ≥1 `update`; `2` on error (missing components.json, no registry config, fetch/auth failure).

**Command usage text** (`check-updates --help`):

```
vegastack-design check-updates — show which copied-in components have newer registry versions

Usage: vegastack-design check-updates [options]

Options:
  --dir <path>        Components directory (default: components.json aliases.ui, else components/ui)
  --filter <names>    Comma-separated component names (supports * globs)
  --json              Machine-readable output
  --fail-on-update    Exit 1 if any component has an update (for CI)
  --registry <url>    Override registry URL template (…/{name}.json)
  --cwd <path>        Project root holding components.json (default: cwd)
  --no-color          Disable ANSI colors
  -h, --help          Show this help

Config: reads the @vegastack registry url + headers from components.json (with ${ENV} expansion);
falls back to VEGASTACK_REGISTRY + CF_ACCESS_CLIENT_ID/SECRET env vars.
```

**Specimen output:**

```
Checking 7 VegaStack components against design.vegastack.com/r …

  ⬆  button        0.1.0 → 0.2.0    update available
  ⬆  dialog        0.1.0 → 0.2.0    update available
  ✓  field         0.2.0            up to date
  ✓  input         0.2.0            up to date
  ?  old-widget    0.1.0            not in registry (renamed/removed)

2 update(s) available. Review & apply (repeat per component):
  npx shadcn@latest add @vegastack/button --diff
  npx shadcn@latest add @vegastack/button --overwrite

Note: --overwrite replaces files; if you customized a component, git diff first.
```

### 2.3 EDIT `packages/utils/bin/verify-registry-item.mjs` (minimal)

- Update USAGE/example strings: `vegastack-verify-registry-item` → `vegastack-design verify`.
- (Alias path only) Prepend a one-line stderr deprecation notice when invoked under the old basename: if `basename(process.argv[1]) === 'verify-registry-item.mjs'` AND env `VEGASTACK_DESIGN_DISPATCH` is not set → `console.error('[deprecated] use \`vegastack-design verify\` …')`. The dispatcher sets `VEGASTACK_DESIGN_DISPATCH=1` when spawning so the notice doesn't show for the new path. (No behavior change otherwise.)
- Do NOT otherwise touch the verification logic (hash-parity-tested).

### 2.4 EDIT `packages/utils/package.json`

- `bin`:
  ```json
  "bin": {
    "vegastack-design": "./bin/vegastack-design.mjs",
    "vegastack-verify-registry-item": "./bin/verify-registry-item.mjs"
  }
  ```
  (cutover variant: drop the second line.)
- `scripts.test`: run both tests → `"test": "node --test test/"` (node's built-in runner over `test/*.test.mjs`), OR `"node test/compare.test.mjs && node test/check-updates.test.mjs"`. Use `node --test test/` for scalability.
- `files` already includes `bin` ✓. No new deps (self-contained). Version bump handled by changeset.

### 2.5 NEW `packages/utils/test/check-updates.test.mjs`

- Use `node:test` + `node:assert`. No network: stub `globalThis.fetch` to return a fixed index JSON; create a temp dir with fake component files (valid provenance headers — one current, one stale, one missing-from-index, one non-vegastack file ignored) + a `components.json`. Assert:
  - statuses (current/update/missing) computed correctly (hash-based).
  - `--json` shape + counts.
  - exit behavior: `--fail-on-update` → nonzero when a stale item exists; `0` otherwise. (Run `main()` and capture a thrown/returned code, or spawn the bin and assert `status`.)
  - `${ENV}` header expansion + index-URL derivation (`{name}`→`registry`).
  - config precedence (--registry > components.json > env).

### 2.6 EDIT `apps/docs/content/docs/install.mdx`

- Replace the two `vegastack-verify-registry-item` invocations with `vegastack-design verify …` (keep flags identical).
- Add a new **"## Updating components"** section AFTER "Add Components":
  - `npx vegastack-design check-updates` (+ what the statuses mean).
  - The review/apply loop: `shadcn add @vegastack/<item> --diff` → `--overwrite`; re-run `verify --post-write` after.
  - `--fail-on-update` for CI drift detection.
  - Note: no auto-update by design (shadcn "you own the code"); the header is the version pin.

### 2.7 EDIT `skills/consume/SKILL.md`

- Update the 3 `vegastack-verify-registry-item` references → `vegastack-design verify`.
- Add a `check-updates` step to the consume workflow (find stale → diff → overwrite → post-write verify).

### 2.8 NEW maintainer doc `docs/RELEASING.md` (or a section in `AGENTS.md`)

- The **release-side** runbook (see §3). Keep `install.mdx` consumer-only; put maintainer steps here.

### 2.9 EDIT `AGENTS.md`

- Add a short "Releasing & consuming updates" subsection: the `vegastack-design` CLI is the canonical consumer entrypoint; release = changeset → merge (npm via release.yml) → run Deploy workflow (registry → Cloudflare); link `docs/RELEASING.md`.

### 2.10 NEW `.changeset/<slug>.md`

- `@vegastack/utils` **minor**: "Add `vegastack-design` CLI (`check-updates` + `verify`); `vegastack-verify-registry-item` deprecated alias." This is what bumps the utils version + writes its CHANGELOG on release.

### 2.11 NOT changed (verified)

- `tooling/registry-stamp.mjs` — index already carries `meta.version`. No change.
- `tooling/verify-shadcn-consume.mjs` — calls the verifier by file path; unaffected.

---

## 3. Release-side runbook (this repo → ship a component update)

1. Edit canonical `packages/ui/registry/ui/<name>.tsx`.
2. `npm run registry:build` → regenerates copy-in + JSON + **re-stamps integrity + provenance** (hash changes = the machine signal).
3. `pnpm changeset` → bump `@vegastack/ui` (+ `@vegastack/utils` if CLI changed), **list the changed component(s)** in the summary (this is the consumer-facing "what changed").
4. PR → merge to `main` (private GH). `release.yml` runs full gates + `changeset version`/`publish` (npm, provenance) + writes CHANGELOGs.
5. Trigger **Deploy** workflow (`deploy.yml`, manual): `registry:build` → cosign-sign manifest → static-export → deploy signed `/r/*` to Cloudflare. New versions now served (gated).

## 4. Consume-side runbook (downstream → review & receive)

1. One-time: `components.json` `@vegastack` registry + `CF_ACCESS_*` in `.env.local`.
2. `npx vegastack-design check-updates` → see what's stale.
3. `npx --package=@vegastack/utils vegastack-design verify --save /tmp/<x>.json <x>` (preflight integrity).
4. `npx shadcn@latest add @vegastack/<x> --diff` → review → `--overwrite` → re-apply local tweaks.
5. `vegastack-design verify --post-write --item /tmp/<x>.json --target-dir .` (TOCTOU close).

## 5. Per-release component changelog convention

- Every changeset touching a component lists the affected component names in its summary. `@vegastack/ui`'s generated `CHANGELOG.md` becomes the canonical "what changed per version" consumers read alongside `check-updates`. (Lightweight; no new tooling.)

---

## 6. Verification plan (run after implementation)

1. `cd packages/utils && npx tsc --noEmit` (typecheck) — bins are `.mjs` (not type-checked by tsup) but keep clean.
2. `pnpm --filter @vegastack/utils test` (compare + check-updates tests pass).
3. `node packages/utils/bin/vegastack-design.mjs --help` / `--version` / `check-updates --help` / `verify --help` — usage renders, exit 0.
4. **Local e2e:** `pnpm --filter @vegastack/docs registry:serve` (serves `public/r` on :4000) + a temp consumer dir with `components.json` (`@vegastack → http://localhost:4000/{name}.json`) and a copied component file → `node …/vegastack-design.mjs check-updates --dir <tmp>` shows `✓`; then bump a component + `npm run registry:build` → re-run → shows `⬆`. Validate `--json`, `--fail-on-update` exit code, `--filter`.
5. Deprecated alias: `node packages/utils/bin/verify-registry-item.mjs --help` still works + prints the deprecation notice; dispatcher path does not.
6. `npm run registry:build` then `git status --porcelain` empty (idempotent — release gate).
7. `pnpm registry:verify-consume` still passes (verifier file path intact).
8. Repo-wide: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
9. Docs: build docs; the install page renders the new "Updating components" section; commands are correct.

## 7. Rollback

All uncommitted; `git checkout` per file. New files: delete `bin/vegastack-design.mjs`, `bin/check-updates.mjs`, `test/check-updates.test.mjs`, `docs/RELEASING.md`, the changeset. Revert the bin map + verify usage strings + install.mdx + SKILL.md + AGENTS.md.

## 8. Out of scope (future, flagged)

- **npm path for animated icons** (`@vegastack/icons/animated/*`) so they auto-update via `npm update` instead of copy-in — separate decision.
- **CI bot** that runs `check-updates --fail-on-update --json` on a schedule and opens a "design-system updates" PR in consumer repos.
- **Graduate to `@vegastack/cli`** if the CLI grows `init`/`add`/`migrate`/`doctor`.
- **Per-item independent semver** (instead of global `@vegastack/ui` version) — more granular signal, more machinery.
