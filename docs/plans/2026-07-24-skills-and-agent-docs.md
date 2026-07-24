# Plan — Skills reorganization + agent-doc overhaul (2026-07-24)

**Status: EXECUTED 2026-07-24** (MK approved). Outcome, including deviations, in §12 at the end.
**Scope:** `skills/**`, `.claude/**`, `.agents/**`, `tooling/skill-lint.mjs`,
`tooling/sync-component-derived.mjs`, `packages/design/**` (bin + files), `AGENTS.md`,
`CLAUDE.md`, `README.md`, `CHANGELOG.md`, `docs/requirements.md`, one new docs guide page.
**Non-goals:** no component source changes, no publish, no deploy, no VRT baseline generation
(Linux-only — see §7.4), no re-opening any locked architecture decision.

---

## 1. Verified problem statement

Every claim below was checked against source, not assumed.

| #   | Finding                                                                                                                                                                                                                                                                                                                                                          | Evidence                                                                                                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **6 of 7 skills are invisible to every agent.** Claude Code reads `.claude/skills/`, Codex reads `.agents/skills/`; neither reads a bare `skills/` at repo root. Only `ship` is symlinked.                                                                                                                                                                       | `git ls-files -s .claude .agents` → exactly two symlinks, both `ship`                                                                                                                                                                    |
| P2  | The lint that enforces discovery **hardcodes the gap**.                                                                                                                                                                                                                                                                                                          | `tooling/skill-lint.mjs:13` `const DISCOVERABLE = ['ship']` + the comment "legacy … exempt until migrated"                                                                                                                               |
| P3  | **No downstream distribution exists.** No skill is in a published package, registry item, or public mirror.                                                                                                                                                                                                                                                      | `packages/design/package.json` `files: ["dist","bin","css","preset.css"]`; no `skills` anywhere in `registry.json`; `vegastack-design-starter/` has no `.claude/` or `.agents/`                                                          |
| P4  | The docs never tell a consumer a skill exists.                                                                                                                                                                                                                                                                                                                   | `grep -ri skill apps/docs/content/` → 3 incidental prose mentions, zero install instructions                                                                                                                                             |
| P5  | **`skills/SKILL.md` is dead weight.** Declares `name: vegastack-design-skills` but sits at the skills root, not in a matching directory — `skill-lint` skips it (it only walks `skills/<dir>/SKILL.md`) and no agent can load it.                                                                                                                                | `tooling/skill-lint.mjs:22-25`; `readdirSync` + `existsSync(join(SKILLS, 'SKILL.md', 'SKILL.md'))` → false                                                                                                                               |
| P6  | **Content drift is live and ungated.** `design-system/SKILL.md:13` claims "97 components + 2 hooks + 1 block" and "539 items".                                                                                                                                                                                                                                   | `registry.json` → 538 items; 440 `icon-`-prefixed of which `icon-button` is a component → **96 components + 439 icons + 2 hooks + 1 block**. `component-contracts.json.expectedCounts` agrees. AGENTS.md is correct; the skill is stale. |
| P7  | `skill-lint`'s own doc-comment claims it enforces "name matches the directory" and "EXACTLY name + description". It enforces **neither**. `skills/add-component/` declares `name: vegastack-add-component`; every skill but `ship` carries an undeclared `metadata:` block.                                                                                      | `tooling/skill-lint.mjs:5-7` vs. the actual checks at `:31-36`                                                                                                                                                                           |
| P8  | **Internal/public leakage risk.** `ship` (MK-gated release authority, deploy dispatch, Cloudflare Access topology, the full public-cutover probe list) sits in the same flat directory as consumer-facing skills. Any "ship the skills folder" action publishes the release runbook to clients.                                                                  | `skills/` is flat; `ship/SKILL.md:91-129`                                                                                                                                                                                                |
| P9  | `skills/release/` is a deprecated tombstone that no agent can see (not symlinked) and nothing links to.                                                                                                                                                                                                                                                          | `skills/release/SKILL.md`; `grep -rn "skills/release"` → 0 hits outside itself                                                                                                                                                           |
| P10 | **AGENTS.md is loaded into every session** (via `CLAUDE.md` → `@AGENTS.md`) at ~18.7 KB ≈ 5k tokens, yet omits the workflows the user needs covered: planning discipline, updating an existing component, docs-page authoring, adversarial review, and the audit loop. What it _does_ spend tokens on is rationale and decision history that belongs in `docs/`. | `AGENTS.md` (180 lines); compare `docs/plans/2026-07-decisions-log.md`, `docs/ledger/codex-rounds.md`                                                                                                                                    |
| P11 | AGENTS.md hardcodes 8 counts (538/96/439/2/1/872/200/124) with a self-aware warning to "verify against source before quoting a stale one" — the warning is the tell that generation is missing.                                                                                                                                                                  | `AGENTS.md` § Numbers                                                                                                                                                                                                                    |

**External facts verified** (so the design is not guesswork):

- Claude Code **follows symlinked skill directories** and loads the target once even if reachable
  from two places — the repo's symlink approach is sanctioned, not a hack.
  ([Claude Code skills docs](https://code.claude.com/docs/en/skills), "Where skills live")
- For personal/project skills the **invoked command name comes from the directory name**, not
  frontmatter `name` — so `.claude/skills/vegastack-design-system/` → `/vegastack-design-system`,
  and an internal `design-audit` cannot collide with a public `vegastack-design-audit`.
- `description` (+ optional `when_to_use`) is truncated at **1,536 chars** in the skill listing.
- Codex discovers skills from `.agents/skills/` (project) and `~/.agents/skills/` (personal);
  SKILL.md is the cross-tool [Agent Skills](https://agentskills.io) standard adopted by both.

---

## 2. Decisions taken (MK, this session)

1. **Physical split** — `skills/internal/` vs `skills/public/`.
2. **Distribution via the public `@vegastack/design` npm package** + a `skills` CLI subcommand.
3. **Split the dual-use audit skill** — repo-internal audit stays internal; a consumer-facing
   audit ships public with zero repo-internal paths.
4. **Generate + gate** the volatile roster/counts from `component-contracts.json`.

### Micro-decisions I will take unless told otherwise

| #   | Decision                                                                            | Rationale                                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Internal audit skill keeps the directory name `design-audit` (not `registry-audit`) | Matches the layout you selected; the public one is `vegastack-design-audit`, and command names come from directory names, so there is no collision                                             |
| M2  | Rename `add-component` → **`component`**                                            | It already documents editing an existing component (§0), but the name only triggers on "add". `/component` triggers on author **and** update                                                   |
| M3  | **Delete** `skills/release/`                                                        | Unreachable by any agent (never symlinked), zero inbound links, superseded by `ship`                                                                                                           |
| M4  | Drop the `metadata:` frontmatter block from all skills                              | Not a Claude Code field; skill-creator guidance is name + description only; version for public skills is the package version, for internal skills it is git                                    |
| M5  | New internal skill **`review`**                                                     | "Adversarial review" is a real, repeated practice (`docs/ledger/codex-rounds.md`, `docs/plans/codex-review-prompt.md`) with no skill; it is procedure, so it belongs in a skill, not AGENTS.md |
| M6  | Public skills are symlinked into this repo too                                      | Dogfooding: the docs app _is_ product UI, and a broken public skill should fail here first                                                                                                     |

---

## 3. Target layout

```
skills/
├── README.md                                  # maintainer map — NOT a skill (replaces skills/SKILL.md)
├── internal/                                  # consumed WHILE developing this repo. Never published.
│   ├── ship/            SKILL.md + references/{changelog-format,vrt-baselines}.md
│   ├── component/       SKILL.md + references/{tokens,testing}.md      (was add-component)
│   ├── design-audit/    SKILL.md + references/lint-rules.md            (repo audit)
│   └── review/          SKILL.md                                       (NEW — adversarial review loop)
└── public/                                    # OUTPUT — mirrored into @vegastack/design, shipped
    ├── vegastack-design-system/  SKILL.md + references/components.md   (components.md GENERATED)
    ├── vegastack-consume/        SKILL.md
    ├── vegastack-design-audit/   SKILL.md
    └── vegastack-brand/          SKILL.md                              (honest stub)

.claude/skills/<name>  →  ../../skills/{internal,public}/<name>         # 8 symlinks
.agents/skills/<name>  →  ../../skills/{internal,public}/<name>         # 8 symlinks
packages/design/skills/**  =  byte-identical committed mirror of skills/public/**
```

Two independent guarantees make the split load-bearing rather than cosmetic:

- **Packaging is a directory glob** (`skills/public/**`), so an internal skill cannot be published
  by mistake.
- **`skill-lint` denies repo-internal paths inside `skills/public/**`** (`packages/`, `tooling/`,
  `apps/docs/`, `docs/plans/`, `.changeset`, `pnpm run registry:build`) — a consumer has none of
  those directories, so a reference to one is a bug by construction.

---

## 4. Workstream A — reorganize

1. `git mv` the four existing internal skills into `skills/internal/` (`ship`, `component`,
   `design-audit`, and delete `release`).
2. `git mv` `design-system`/`consume`/`brand` into `skills/public/` with the `vegastack-` prefix;
   fork the consumer half of `design-audit` into `skills/public/vegastack-design-audit/`.
3. Convert `skills/SKILL.md` → `skills/README.md` (maintainer map: which skill for which task,
   internal vs public, the mirror/symlink discipline). It stops being a skill.
4. Create 16 symlinks (8 skills × 2 surfaces).
5. Frontmatter pass on all 8: `name` == directory name, `metadata:` removed, description rewritten
   to carry all trigger phrasing (bodies lose any "when to use this skill" section — the body only
   loads _after_ triggering, so that text is dead weight there).

## 5. Workstream B — distribution

1. `tooling/sync-package-skills.mjs` — mirrors `skills/public/**` → `packages/design/skills/**`,
   `--check` for the drift gate. Same discipline as the existing Toaster mirror.
2. `packages/design/package.json` — `files` gains `"skills"`.
3. New CLI subcommand in `packages/design/bin/vegastack-design.mjs`, implemented in
   `bin/skills.mjs`:

   ```
   vegastack-design skills install [--claude] [--codex] [--dir <path>] [--force] [--dry-run]
   vegastack-design skills list
   vegastack-design skills check      # installed copies vs the installed package version
   ```

   - Defaults: both surfaces, cwd, **refuses to overwrite** without `--force` (lists what would
     change), **refuses to write through a symlink** at the destination (same posture as
     `verify-registry-item.mjs --save`), copies files rather than symlinking (node_modules is
     ephemeral).
   - `--dry-run` writes nothing and prints the exact plan.

4. `packages/design/test/skills-install.test.mjs` — fresh install, refuse-overwrite, `--force`,
   `--claude`-only, `--dry-run` writes nothing, destination-symlink refusal, byte-identity with
   canonical. Wired into the package's existing `test` script.

## 6. Workstream C — generation + gates

1. **`tooling/sync-component-derived.mjs`** gains one output:
   `skills/public/vegastack-design-system/references/components.md`, generated from
   `component-contracts.json` (`expectedCounts` + per-component `family`/`title`/`summary`/
   `docsSlug`). Already wired into `pnpm design:derived:check` → `design:verify` → root `lint`.
   The SKILL.md then carries **zero** hardcoded counts and links to the reference — killing P6 at
   the root instead of patching the number.
2. **`AGENTS.md` § Numbers becomes a generated region** (`<!-- BEGIN:generated:numbers -->`),
   same generator, same gate — killing P11.
3. **`tooling/skill-lint.mjs` rewritten** to enforce what it currently only claims:
   - walks `skills/{internal,public}/*`
   - `name` present, kebab-case, **equal to the directory name**; `description` 40–1024 chars;
     no undeclared frontmatter keys
   - public dirs **must** be `vegastack-`-prefixed; internal dirs **must not** be
   - public SKILL.md bodies **must not** reference repo-internal paths (deny-list above)
   - relative links resolve
   - symlink completeness **and** the absence of stale/extra entries in either surface (a deleted
     skill leaving a dangling link is currently undetectable)
   - `DISCOVERABLE` becomes derived from the filesystem — no hardcoded allowlist to drift
   - delegates the package-mirror check to `sync-package-skills.mjs --check`

## 7. Workstream D — AGENTS.md / CLAUDE.md

**The governing principle** (this is what "no fluff" means operationally): AGENTS.md is loaded
into _every_ session, so it may only contain (a) rules an agent can violate _before_ loading any
skill, (b) the repo map, (c) a router. Anything that is a **procedure** moves into a skill (loaded
on demand, free until needed). Anything that is **rationale or decision history** moves to
`docs/requirements.md` / `docs/plans/2026-07-decisions-log.md`, which are already its canonical
homes. Nothing is deleted — it is relocated to where it is paid for only when read.

### Target structure

| §   | Content                                                                                                                                                                                                                      | Source                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | What this repo is + the 5 non-negotiables (edit canonical only · semantic tokens only · server-safe by default · shipping is MK-gated · never hand-edit a generated file)                                                    | condensed from current §Status + §Editing                                                                         |
| 2   | **Task router** — a table: _want to X → load skill S / read doc D / run command C_. Covers plan · author or change a component · author a docs page · run the gates · audit · adversarial review · ship · consume downstream | **new**                                                                                                           |
| 3   | Locked decisions — facts only, rationale linked                                                                                                                                                                              | current §Locked, ~50% shorter                                                                                     |
| 4   | Build rules — the lint-enforced rule list, scannable                                                                                                                                                                         | current §Component build rules, compressed; full detail lives in `skills/internal/component/references/tokens.md` |
| 5   | Single source of truth — canonical → `registry:build` → generated copies                                                                                                                                                     | current §Editing, ~5 lines                                                                                        |
| 6   | Workflows — planning discipline (`docs/plans/`, approval before implementing), the verification ladder (what each gate proves and when it is required), docs-page authoring, review/audit loop                               | **new**, assembled from `package.json` scripts + the ledger practice                                              |
| 7   | Repo map                                                                                                                                                                                                                     | current §Layout + `skills/` split                                                                                 |
| 8   | Numbers — **generated region**                                                                                                                                                                                               | current §Numbers, generated                                                                                       |
| 9   | Escalation — what needs MK, what to do when a rule conflicts or something is missing                                                                                                                                         | **new**                                                                                                           |

Target: **≈7 KB with strictly more coverage than today's 18.7 KB.**

`CLAUDE.md` stays `@AGENTS.md` + the deliberate MK-gate restatement (3 lines — a safety repeat,
not fluff) + one new line pointing at the `.claude/skills/` surface.

### 7.4 Known follow-up, not fixed here

The new docs guide page adds a route, and routes require VRT baselines. Baselines are
**pinned-Linux only** and can only be produced by the VRT workflow's `update_baselines` run. The
repo is already at 200/872 committed. I will register the route and state the delta; I will not
fabricate darwin baselines.

## 8. Workstream E — README / CHANGELOG / docs / requirements

- `README.md` — fix the `skills/` layout line (P1/P3), correct the "538 items" phrasing to point
  at the machine authority, add the two-line skills-distribution fact. It is otherwise tight;
  no rewrite.
- `CHANGELOG.md` — a `0.3.0` entry under `🛠 CLI & tooling` (new `skills` subcommand), `📦 npm`
  (`@vegastack/design` minor), `📚 Docs` (new guide). Format per
  `skills/internal/ship/references/changelog-format.md`; then `sync-changelog.mjs`.
- `.changeset/` — a minor changeset for `@vegastack/design` (new subcommand + new `files` entry
  is consumer-visible). **Prepared, not pushed** — pushing is an MK gate.
- `apps/docs/content/docs/guides/agent-skills.mdx` + `meta.json` entry — the consumer install
  path, what each public skill does, how to update.
- `docs/requirements.md` §11.3 + the layout tree — updated to the new paths (currently lists the
  old flat layout).

## 9. Workstream F — verification (the "does installation actually work" proof)

| #   | Check                                                                                                                                                               | Proves                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| V1  | `pnpm lint && pnpm typecheck && pnpm test`                                                                                                                          | nothing regressed; new skill-lint + drift gates pass                                       |
| V2  | `npm pack --dry-run` in `packages/design`                                                                                                                           | `skills/**` is actually in the tarball                                                     |
| V3  | build → `npm pack` → install the tarball into a scratch dir → `npx vegastack-design skills install` → diff installed vs canonical                                   | the real published artifact installs correctly, byte-identical                             |
| V4  | Run V3's flow against the **reference consumer** `vegastack-design-starter`                                                                                         | the executable ground truth per AGENTS.md — the same repo the guides are validated against |
| V5  | `readlink` every `.claude/skills/*` and `.agents/skills/*`; assert 8+8 resolve to canonical                                                                         | in-repo discovery for both tools                                                           |
| V6  | Re-run `skill-lint` after deliberately breaking each new rule (stale symlink, repo path in a public skill, name/dir mismatch, drifted mirror)                       | the gates fail closed, not just pass on a clean tree                                       |
| V7  | Adversarial pass over every rewritten doc: every command executed, every path resolved, every count checked against `component-contracts.json`, every link followed | no new stale claims introduced — the exact failure mode P6/P11 represent                   |

## 10. Risks

| Risk                                                                | Mitigation                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Symlinks break on Windows checkouts (`core.symlinks=false`)         | Already the status quo for `ship`; note it in `skills/README.md`. The published path is a **copy**, so consumers are unaffected                        |
| Mirror drift between `skills/public/` and `packages/design/skills/` | `--check` gate in `design:verify` → root `lint`; identical to the Toaster mirror discipline the repo already runs                                      |
| `npm pack` without a prior build ships an empty/stale mirror        | Mirror is **committed**, not a build artifact — present at pack time regardless                                                                        |
| AGENTS.md rewrite loses a load-bearing rule                         | Rule-by-rule diff table in the PR body: every current line mapped to its new home (kept / moved-to-skill / moved-to-docs). Nothing is dropped silently |
| Renaming `add-component` → `component` breaks inbound references    | `grep -rn "add-component"` and update all hits (`AGENTS.md:22`, `docs/requirements.md`, plans) in the same commit                                      |

## 11. Todo checklist

- [ ] A1 `git mv` internal skills; delete `release`
- [ ] A2 `git mv` + prefix public skills; fork the consumer audit skill
- [ ] A3 `skills/SKILL.md` → `skills/README.md`
- [ ] A4 16 discovery symlinks
- [ ] A5 frontmatter + description pass on all 8; strip body "when to use" sections
- [ ] B1 `tooling/sync-package-skills.mjs` (+ `--check`)
- [ ] B2 `files: ["…","skills"]`
- [ ] B3 `skills` CLI subcommand + `bin/skills.mjs`
- [ ] B4 `test/skills-install.test.mjs`
- [ ] C1 generate `references/components.md` from the contract
- [ ] C2 generated `numbers` region in AGENTS.md
- [ ] C3 rewrite `tooling/skill-lint.mjs`
- [ ] D1 rewrite AGENTS.md to the §7 structure
- [ ] D2 CLAUDE.md touch-up
- [ ] D3 relocate rationale/history into `docs/`
- [ ] E1 README fixes
- [ ] E2 CHANGELOG entry + sync
- [ ] E3 changeset (prepared, not pushed)
- [ ] E4 `guides/agent-skills.mdx` + meta + VRT route registration
- [ ] E5 requirements.md §11.3 + layout tree
- [ ] F1–F7 verification ladder

---

## 12. Outcome (2026-07-24)

All six workstreams landed. Everything below was verified by execution, not by inspection.

### Deviations from the plan

| #   | Planned                                        | Actual                                                   | Why                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | AGENTS.md "≈7 KB with more coverage"           | **17.6 KB** (was 14.7 KB committed / 18.7 KB working)    | The size target was wrong, not the principle. Pre-existing material compressed ~26%; ~6.8 KB of previously-absent coverage was added (task router, planning, verification ladder, docs authoring, review/audit, escalation). Coverage was the goal; the byte target was invented. |
| 2   | `references/components.md` via a marker region | Whole-file generation through the existing `outputs` Map | It fits `sync-component-derived.mjs`'s existing shape exactly and keeps SKILL.md free of counts entirely. Same drift gate.                                                                                                                                                        |
| 3   | VRT/docs counts generated into AGENTS.md       | **Replaced with the command that computes them**         | Those figures live in the VRT verifier and the filesystem, not the contract. A number no generator owns is a number that goes stale — so §Numbers generates only contract-derived counts.                                                                                         |
| 4   | CHANGELOG `[0.3.0]` entry                      | **Deferred to the ship flow**                            | `changelog-lint` requires commit SHAs that pass `git cat-file`. This work is uncommitted, so any entry written now would carry a fabricated SHA. The changeset is prepared; the entry is `ship` skill §3.                                                                         |
| 5   | Internal audit skill named `registry-audit`    | Kept `design-audit`                                      | Matches the layout MK selected. No collision: command names come from the directory, so internal `design-audit` and public `vegastack-design-audit` coexist.                                                                                                                      |
| 6   | —                                              | **Added: a README `INVENTORY` generated region**         | The README opening hardcoded the same counts. Same drift class, so it got the same fix.                                                                                                                                                                                           |
| 7   | —                                              | **Added: `design-lint` rule-id parity gate**             | The audit reference calls itself a 1:1 mirror. `skill-lint` now proves it in both directions, so "re-sync it, don't trust memory" is enforced rather than requested.                                                                                                              |

### Verified

- **V1** `pnpm lint` (7/7, cache-busted), `pnpm typecheck` (7/7), `@vegastack/design` tests 42 + 23 + 15.
- **V2** `skills/**` present in the packed tarball (6 files).
- **V3** `pnpm pack` → `npm i` into a clean consumer → the installed bin writes 12 files, byte-identical
  to `skills/public`. (`npm pack` leaves pnpm's `catalog:` protocol unresolved and cannot be installed —
  the release pipeline packs with pnpm, which rewrites it.)
- **V4** Same flow against `vegastack-design-starter`: additive only, two untracked directories.
- **V5** 16/16 discovery symlinks resolve to a real `SKILL.md`.
- **V6** 11/11 fail-closed probes caught: stale symlink, missing symlink, symlink replaced by a real
  directory, repo-internal path in a public skill, name≠directory, extra frontmatter key, broken
  relative link, missing `vegastack-` prefix, fabricated rule id, mirror drift, hand-edited generated
  region.
- **V7** 89/89 inline paths in the rewritten docs resolve; all 7 AGENTS.md command targets exist;
  `registry:build` byte-idempotent across two runs.

### Found and fixed during V7 that were not in the plan

- **The public audit skill's own grep guidance produced false positives.** Every hex hit in
  `chart.tsx` is inside a JSDoc comment describing recharts' defaults. Added an explicit
  "candidates, not findings" rule so a consumer following it verbatim does not file comments as errors.
- **`ship` §4 contradicted `docs/RELEASING.md`** — it said `git push origin main`; RELEASING step 4
  requires a reviewed PR merged by a non-MK operator. `ship` was the permissive one, and `ship` is what
  an agent follows. Corrected.
- **`ship` §5 described two cutover approvals that never appear on a routine deploy.** Both jobs are
  gated on the `run_public_cutover` input, which its own command did not pass — an agent would wait
  forever. Both paths now documented explicitly.
- **`ship` §1 preflight omitted `verify:vrt-baselines`**, the gate that actually blocks the ship, and
  had no remedy for its own "`git status` must be empty". Both added.
- **`ship/references/vrt-baselines.md` was stale three ways** — a hardcoded "~200 PNGs", the
  hand-maintained `PAGES` array (routes are generated now), and a copy step that took one snapshot
  directory when the artifact contains several. Rewritten against `vrt.yml`.
- **A dangling `§7.6` cross-reference** — the section no longer exists in the generated component
  matrix, and `design-audit` gated accepting a new render exemption on it. Removed from both skills.
- **`verify-registry-deps.mjs` does not check version ranges**, so "copy the pin from a recent item"
  was a coin flip: `registry.json` carries both `lucide-react@^1.20.0` and `@^0.525.0`, across a major
  boundary. The rule is now "take the pin from `packages/ui/package.json`".
- **`design:verify` and `registry:verify-consume` were owned by no skill.** The `component` skill's
  verify block passed while `pnpm design:verify` could fail; both are now in it, with that trap stated.

### Known follow-ups (not in scope here)

- The new `/docs/guides/agent-skills` route needs pinned-Linux VRT baselines. The route is registered;
  baselines come from the VRT workflow's `update_baselines` run, and the suite is already short of a
  full bootstrap — run `pnpm --filter @vegastack/docs verify:vrt-baselines` for the live figure.
- `docs/plans/2026-07-24-full-system-review.md` §10 (stale plans carrying live-voiced autonomy grants)
  is untouched and remains the cheapest high-value fix outstanding.
- `tooling/design-lint.mjs` is repo-internal, so a consumer cannot run it. Shipping a consumer-runnable
  linter would turn the public audit skill from a manual checklist into a gate — worth considering,
  needs its own decision.

---

## 13. Round 2 — adversarial skill review (2026-07-24)

A second pass over every skill and agent doc, from a realistic-workflow point of view.

### Codex discovery: verified against primary sources, and the repo was right

Secondary blogs claim Codex reads `~/.codex/skills/` and `.codex/skills/`. **That is wrong.** OpenAI's
own docs specify:

- `$CWD/.agents/skills`, `$CWD/../.agents/skills`, `$REPO_ROOT/.agents/skills`
- `$HOME/.agents/skills`, `/etc/codex/skills`
- explicitly "Codex reads `.agents/skills` directories — not `.claude/skills`"
- "Codex supports symlinked skill folders and follows the symlink target when scanning these locations"

Claude Code documents the same symlink behaviour for `.claude/skills`. So **one canonical skill plus
two symlinks genuinely serves both agents**, and neither surface can be dropped. This is now written
into `skills/README.md` as a table so it is not re-derived from blogs next time.

### Merged: `design-audit` → `review` (8 skills → 7)

The two internal skills competed for the same requests — both descriptions claimed _audit_, _review_,
_check_, and _find_. A maintainer asking "review my changes before shipping" had no deterministic
answer. They are now one skill with two explicit modes: **audit** (§2–§4, run the gates and triage)
and **adversarial review** (§5 onward). `references/lint-rules.md` moved with it.

The public `vegastack-design-audit` stays separate — different audience, different repo, and
correctly read-only for someone else's codebase.

A trigger-collision sweep now shows zero same-audience collisions that are not disambiguated by the
_object_ of the verb (verify a component vs. verify a claim; update a component vs. update the
changelog).

### Spec conformance — I was both too strict and too lax

Checked against [agentskills.io/specification](https://agentskills.io/specification):

- **Too strict:** `skill-lint` rejected `license`, `compatibility`, `metadata`, and `allowed-tools`,
  which the spec explicitly allows. It now accepts the full spec vocabulary and rejects only keys
  outside it — agents ignore unknown keys silently, so lint is the only thing that can catch a typo.
- **Too lax:** it did not enforce the spec's `name` rules (≤64 chars, no consecutive hyphens, no
  leading/trailing hyphen) or the recommended 500-line `SKILL.md` ceiling. Both added.

Six new probes confirm each rule fails closed, plus one confirming a spec-legal `license` key is
**not** falsely rejected.

### Also fixed

- **AGENTS.md told Codex to type `/component`.** Slash invocation is Claude Code syntax; Codex selects
  by description. The cross-tool file now states the neutral behaviour and leaves slash syntax to
  `CLAUDE.md`.
- **`vegastack-consume` assumed `components.json` already existed.** A fresh project has none. It now
  starts with `shadcn init --base base` (flag verified against the real CLI — `radix` would be wrong).
- **`lint-rules.md` claimed "1–25"** in its own contents while listing 32 entries — a stale count I
  introduced. Both that and "all 34 rules" in the review skill are gone: the parity gate governs the
  id set, so no prose count is needed and none can drift.
- Verified `pnpm dlx shadcn list @vegastack` is a real command (`search|list`) before leaving it in a
  shipped skill.

### Unresolved

`@vegastack/design#lint` exited 2 twice under `pnpm lint`, both times on a cache-miss run immediately
following another command in the same shell invocation. **Not reproducible**: six forced cache-miss
runs and three direct `eslint .` runs in that package all exit 0, and the failing task's own output
showed its steps completing. Not introduced by this work — flagged rather than declared fixed.

---

## 14. Round 3 — cross-model review correction (2026-07-24)

Codex reviewed the summary of this work and caught a real error, independently reproduced here.

**The installer is implemented and locally verified, but NOT published.** Confirmed against the live
registry: `@vegastack/design@0.1.1` is `latest`, and its published tarball contains **zero** skill
files and no `bin/skills.mjs`. `npx … vegastack-design skills` against that version exits `2` with
`unknown command: skills`. Everything ships only when the prepared changeset is released — which is
MK-gated and has not happened. The summary presented the install command as currently usable; it is
not.

**A supply-chain hazard found while verifying that.** The bin is `vegastack-design` but the package
is `@vegastack/design`, so a bare `npx vegastack-design …` in a project that does not already have
the package installed resolves the **unscoped** name `vegastack-design` from npm. That name is
currently **unregistered** (404), so today it merely fails — but it is an open typosquat slot, and
guidance telling consumers to run it would execute a stranger's package the day someone claims it.

Eleven occurrences fixed across the shipped skills, the docs guides, and the README — including one
pre-existing in `docs/install.mdx` that predates this work. The `verify` command already used the
safe form; `check-updates` and the new `skills` did not. Guidance now uses `pnpm exec
vegastack-design …` (resolves from `node_modules`, never contacts the registry) or
`npx --package=@vegastack/design vegastack-design …` for a standalone run, with the reason stated
once in the consume skill.

The public guide also gained a version gate: the `skills` subcommand requires `@vegastack/design`
**0.2.0 or newer**, since that page is readable before the release lands.

**A wrong claim of my own, corrected:** an earlier round removed a `<Cards>` block from the guide on
the grounds that it "isn't registered". It **is** — `defaultMdxComponents` from `fumadocs-ui/mdx`
exports `Card`, `Cards`, and `Callout`. The replacement table is fine and stays, but the stated
reason was false. `Callout type="warn"` was verified against the component's actual accepted values
(`info | warn | error | success | warning | idea`) before use.

Codex's three wording nuances are accepted and accurate: "eight files" means eight numbered
deliverables (some touch more than one physical file); the generated roster cannot _silently_ drift
because regeneration is fail-closed in CI, rather than being immune to drift; and the `review` skill
edits only when the task authorises it, stopping at a report for a pure audit.

---

## 15. Round 4 — staleness discipline + production hardening (2026-07-24)

Two directives: stop AGENTS.md and the skills from treating point-in-time docs as current truth, and
make the installer genuinely production-grade rather than locally-passing.

### Truth hierarchy

AGENTS.md pointed agents at `docs/requirements.md` §3, `docs/gap-analysis.md`, and
`docs/plans/2026-07-decisions-log.md` for "why is it built this way", and hardcoded package versions
in its Status line. All three docs self-identify as snapshots — gap-analysis literally says "preserved
as the historical record"; requirements is dated at project start with "Next artifact… being written
now". Citing them for current behaviour manufactures confident stale answers.

Added an explicit **§Truth hierarchy** ranking sources: (1) source + enforcing scripts, (2) machine
authorities (`component-contracts.json`, `registry.json`), (3) official docs for the _installed_
dependency version, (4) `design.md` (canonical + gated + living), (5) this file, (6) skills. Anything
under `docs/plans/`, `docs/gap-analysis.md`, `docs/audits/`, `docs/requirements.md` is labelled a
point-in-time record — read for _why_, never for _what is true now_. The Status line no longer prints
versions; it gives the two commands that report the real ones.

`design.md` is correctly identified as **living, not historical** — it is already gated by
`pnpm design:sync:check`. The `component` skill now states that a component-direction change that
leaves `design.md` behind is an incomplete change, and that source + lint + version-matched official
docs outrank any plan doc.

### Installer hardening (production-grade, not locally-passing)

Verified the real published state first: the released `@vegastack/design@0.1.1` still has zero skill
files, so the install command lands only with the prepared 0.2.0. The pipeline that gets it there was
traced end to end and is sound:

- `pnpm changeset publish` (not `npm publish`) resolves pnpm's `catalog:` protocol, so the published
  tarball is installable — the failure mode my earlier `npm pack` test hit does not occur on the real
  release path.
- The mirror is committed (not a build artifact) → present at pack time. `release.yml` runs `pnpm lint`
  (which includes `sync-package-skills --check`), asserts a clean tree, and runs `pnpm test` (the
  installer suite) before the isolated OIDC publish job.
- The minor changeset lands exactly 0.2.0, matching the documented version floor.

Tested against a **real strict-pnpm consumer** (symlinked `node_modules`), using the exact documented
command `pnpm exec vegastack-design skills install`: installs all four skills into both surfaces,
byte-identical to the packaged copy, idempotent on re-run.

Two robustness gaps fixed, both surfaced by the production test:

- **Write failures were unhandled.** A read-only checkout or a full disk would throw a raw stack trace
  out of a freshly-installed CLI. The installer now catches per-file write errors, exits 1, and lists
  what it managed to write with a "re-run, it's idempotent" note. Verified with a real read-only
  directory: clean message, exit 1, propagated correctly through `pnpm exec` (an earlier `| head` in a
  test harness had masked the exit code — the code was always correct; the test was lying).
- **`unknown command` gave no recovery path.** The most common cause is following newer docs than the
  installed version, so the message now names the installed version and points at
  `npm view @vegastack/design version`.

Added a write-failure test to the suite (skipped automatically when run as root, where mode bits are
bypassed).

### Verified clean

`pnpm lint` green three consecutive runs; every lint task exits 0 in isolation; `@vegastack/design`
tests 42 + 23 + 16 pass; starter parity holds. The intermittent Turbo exit-2 from round 2 recurred
once and again cleared on the next run with every task passing in isolation — a Turbo
concurrency/caching flake on the first cache-miss run after edits, not introduced by this work and not
a real failure. Flagged, not "fixed".
