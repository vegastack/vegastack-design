# Common rules for every audit implementer (epic #31, vegastack-design)

**Rewritten 2026-09-09, after the verification rebuild (WP0–WP6) landed on `main`.** Every batch
brief in this directory other than `g1b.md` predates the rebuild: **treat those files as SCOPE-ONLY**
and ignore every verification instruction in them. This file is the verification contract.

You are working in a git worktree (path given in your task). `cd` there; work ONLY there; never
touch the main checkout `/Users/mk/projects/vegastack-design`; never commit to `main`. Reason
carefully (high effort).

## What no longer exists — do not invoke, do not look for

`pnpm gates:*` (`gates:push`, `gates:component`, `gates:ship`) · `.gates/` and `receipt.json` ·
`receipt-guard` · the pre-push hook (`.husky/pre-push`) and therefore any reason to use `HUSKY=0` ·
`apps/docs/vrt/` and `vrt-review.mjs` · `contracts-run.mjs` · `classify-change.mjs` ·
`lib/route-scope.mjs` · `verify-gate-receipt*.mjs` · `gate-receipt-carry.mjs` ·
`runner-diagnostics.yml` · the `gates` skill · `$OPS/remote-gates-v2/v3/v4.sh` (they call
`gates:push`) · the remote sweep, the merge train, and the "one browser run per batch" budget.

There is no receipt to commit and nothing to copy back from a box. If a brief tells you to do any of
the above, it is stale.

## The verification ladder

```bash
pnpm check:component <name>   # ~10s  design-lint · typecheck · that one component's test — inner loop
pnpm verify                   # ~2m on the Mac — THE gate; byte-for-byte what CI runs
```

**`pnpm verify` runs on the Mac now.** The old "browser lanes never on the Mac" rule is dead: the
vitest browser lane is ~43 s and the whole command is ~2 min. Run it as often as you like; it ends
by running `workspace-clean.mjs --after-run` on pass, fail or interrupt, preserving the exit code.

`pnpm verify` = typecheck → lint → `design:verify` → the `@vegastack/ui` browser suite (unit, axe,
geometry contracts) + the `@vegastack/design` CLI node tests, through turbo. On failure it prints
`verify: FAILED at <stage>`; reproducing is re-running that one stage. Never self-clear a failure —
load the `review` skill to classify it at its root.

`pnpm verify:release` is deploy-only and is the orchestrator's job, not yours.

## The loop for a PR

```
git fetch origin '+refs/heads/*:refs/remotes/origin/*'   # the repo's refspec is main-only; this is required
git rebase origin/main                                    # or --onto origin/main <base-sha> if told to
<resolve conflicts at the root — see the trap below>
pnpm verify
git push -u origin <branch>
gh pr create --base main --title "<title>" --body-file <file>
```

Then report the PR URL. **Do not merge.** Rebases are cheap now — rebase whenever `main` moves.

Conflicts land almost entirely on generated files: `apps/docs/public/r/*.json`,
`packages/ui/component-contracts.json`, and AGENTS.md § Numbers. **Regenerate, never hand-merge:**
take either side to get a parseable file, then run `pnpm registry:build` and `pnpm design:derived`
and commit what they produce.

## Hard rules

- Production-grade, clean code. **No backward compatibility, no deprecation shims, no aliases kept
  "for safety".** Delete what the audit says to delete. Every decision in
  `docs/audits/2026-09-07-system-audit/00-decisions.md` (D1–D30, DD-1–5, TD-1–7) is FINAL; never
  re-open one. An uncovered decision → choose the option most consistent with `design.md`, record it
  in `docs/ledger/operator-review.md`, and flag it under "Needs MK" in the PR body. Then keep going.
- Never assume library behaviour from memory: check the installed version in `pnpm-lock.yaml`, read
  **that version's** official docs (`query-docs`/`resolve-library-id`, `WebFetch`, `WebSearch`), and
  record URL + version in the PR body.
- Read before acting: `AGENTS.md` (rewritten by WP6 — 150 lines, it is the rulebook),
  `design.md` prose, `00-decisions.md`, your batch brief's SCOPE, the issue body,
  `.claude/skills/component/SKILL.md` (+ `references/`), `.claude/skills/review/SKILL.md`. Then
  `git log origin/main..HEAD`, `git status`, `git diff` to reconstruct what a previous agent did;
  keep what is right, fix what is not.
- Known flakes — recognise, do not chase: `relative-time` 320 px / target-floor race; a Vite
  dep-optimizer storm on a cold worktree (`Cannot read properties of null (reading 'useState')`,
  `Cannot connect to the iframe`) — re-run once; `ERR_INSUFFICIENT_RESOURCES` / `Page crashed` under
  heavy machine load. A failure you cannot attribute to your change is reported in the PR body with
  evidence, not chased.
- Never `--no-verify`. Never skip a gate.

## Per-PR artefacts (WP5 changed this — the old CHANGELOG rule is gone)

**Four artefacts per PR:** the component source, its test, its MDX page, and **a changeset**.

- **Nobody hand-edits `/CHANGELOG.md` any more.** `tooling/changelog-assemble.mjs` writes the
  release entry at version time, inside `pnpm version-packages`. Editing `/CHANGELOG.md` or the
  generated docs Changelog page in a batch PR is wrong.
- A changeset's body must **open with exactly one** of the eight section markers
  (`🧩 🔧 🗑 🛠 📦 📚 🐛 ⚠️`) and something must follow it — `tooling/changeset-lint.mjs` enforces
  it, with no grandfather list. Commit shas linked in the body must exist on your branch **after**
  any rebase, and `/docs` links must resolve to a real content page.
- An **empty** front-matter block (`---\n---`) with body text is valid and is how a tooling/CI/repo-
  wide change still gets a CHANGELOG line. A changeset with an empty body is not valid.
- Package bumps: `@vegastack/ui` minor for registry-item changes; `@vegastack/design` /
  `@vegastack/design-tokens` when their published output changes.

**What does NOT belong in a batch PR:** `design.md`, skills (`skills/internal/**`,
`skills/public/**`), the ledgers (`docs/ledger/*`), and `AGENTS.md`. Per AGENTS.md § Verification
those go in a **separate wave PR that touches nothing else**, where `design:sync:check` and
`design:derived:check` resolve the code-vs-doctrine disagreement. Component **docs pages** (MDX
content) do belong in the batch PR.

## PR body

Plan; what changed per finding id; counts before → after; docs URLs + versions for every library
claim; acceptance evidence (commands + observed output, including the `pnpm verify` result);
left-out items with reason and owning batch; a "Needs MK" section. Final message = PR URL + body.

## Conflict trap: "take main's side" can silently delete your batch's work (C1, 2026-09-09)

When a component source file conflicts **only** on a provenance/integrity hash line, taking main's
side looks free — the code either side is otherwise identical, so the hash is the whole conflict. It
is not free. If your batch also changed that file earlier in the branch, resolving to main's side
discards that change too, and nothing in the rebase tells you.

C1 lost its `Empty bordered` → `variant="dashed"` migration exactly this way across `board.tsx`,
`dropzone.tsx` and `dashboard-01/page.tsx`. `pnpm typecheck` caught it; two stale docs references
(`foundations/empty-states.mdx`, `board.mdx`) were only found by grepping afterwards.

Rule: before resolving any conflict by taking one side wholesale, run
`git log --oneline origin/main..HEAD -- <file>` — if your branch touched that file, resolve it by
hand or re-apply your change after taking main's side. Then, after the rebase, diff your batch's
intended changes against the result (`git diff origin/main...HEAD -- <the files your brief names>`)
and grep the docs for the identifiers you renamed. A green `typecheck` is a floor, not a proof: a
dropped docs reference or a dropped prop default typechecks fine.

**During a rebase, `--ours` is `main` and `--theirs` is your commit.** This is inverted from a
merge and it has bitten this epic more than once. `git checkout --ours <file>` during
`git rebase origin/main` gives you **main's** version.

## Environment gotcha: the fetch refspec is main-only

The repo's fetch refspec is `+refs/heads/main:refs/remotes/origin/main`. Plain `git fetch origin`
does **not** update `origin/<anything-else>`, in any worktree. So:

```bash
git fetch origin '+refs/heads/*:refs/remotes/origin/*'                       # refresh everything
gh api repos/VegaStack/vegastack-design/branches/<branch> --jq .commit.sha   # the truth
```

`--force-with-lease` needs the explicit `--force-with-lease=<branch>:<sha>` form with a sha you
looked up, or it compares against a stale ref and does nothing useful.

## Rebasing a PRE-REBUILD batch branch (the nine batches opened before 2026-09-08)

Every one of these branches was authored under the old rules and carries commits that are now
wrong. When you rebase onto `origin/main`, resolve them like this — this is not optional:

- **`/CHANGELOG.md` — take `main`'s side, wholesale, every time.** WP5 made the release entry a
  build output (`tooling/changelog-assemble.mjs`, run inside `pnpm version-packages`). Your branch's
  hand-written `## [0.7.0]` bullets must not survive. **But do not lose the prose:** for every
  bullet you drop, make sure an equivalent line exists in a changeset under `.changeset/`. Add new
  changeset files as needed — one section marker each, valid commit shas (post-rebase) and valid
  `/docs` links. `node tooling/changeset-lint.mjs` must pass.
- **`AGENTS.md` — take `main`'s side, wholesale.** WP6 rewrote it from scratch as a 150-line
  rulebook; every hunk your branch has was written against a file that no longer exists. The only
  part of it a batch legitimately changes is § Numbers, which is generated: after taking main's
  side, run `pnpm design:derived` and commit what it writes.
- **`design.md`, `docs/ledger/*`, and `skills/**` — KEEP your branch's additions.** AGENTS.md now says doctrine and
  ledger edits belong in a separate wave PR; splitting nine already-written branches would risk
  losing work for no verification benefit, so for these nine batches they stay in the batch PR. Skills are included: keep `skills/internal/**` and `skills/public/**` edits your branch already made, and re-run `node tooling/sync-package-skills.mjs` so `packages/design/skills/**` matches.
  This is a deliberate, recorded deviation. It does **not** license new doctrine edits: anything
  you would add now goes to the orchestrator for the wave PR instead.
- **Generated files** (`apps/docs/public/r/*.json`, `packages/ui/component-contracts.json`,
  `docs/ledger/component-matrix.md`) — take either side to get a parseable file, then regenerate
  with `pnpm registry:build` and `pnpm design:derived` and commit the result. Never hand-merge one.
- Anything referencing the deleted machinery (`.gates/`, receipts, `apps/docs/vrt/`,
  `contracts-run.mjs`, the pre-push hook) — delete it from your branch.

## Five conflict traps this epic has actually hit (2026-09-09) — check every one

1. **`registry.json` / `component-contracts.json` must be hand-resolved.** `main` reformatted both, so a
   line-merge produces misaligned hunks and silently drops your batch's own entries. The technique
   that works (C1): compute your branch's **semantic** delta, take main's file wholesale, re-apply
   exactly those lines, then let `verify-registry-deps` and `verify-component-contracts` confirm.
2. **A count can auto-merge to a WRONG value with no conflict.** Fo1's branch and `main` both said
   `components: 113` — the same number for different reasons; the right answer was 114. Mk1 watched
   its counts silently revert **twice**. Recompute the arithmetic by hand after every rebase.
3. **`git checkout --ours` on a still-unstaged conflicted file silently discards your edits.** Mk1
   lost work to this twice. Stage deliberately, then re-verify.
4. **A conflict that looks header-only is the most dangerous kind.** C1 lost an entire
   `variant="dashed"` migration because the files conflicted "only" on a provenance hash line; Mk1
   restored a private `usePrefersReducedMotion` the same way. Always
   `git log --oneline origin/main..HEAD -- <file>` first, and re-run your acceptance greps after.
5. **A pre-WP5 changeset may carry no section marker** and fails `tooling/changeset-lint.mjs`.
   Rewrite it with exactly one of `🧩 🔧 🗑 🛠 📦 📚 🐛 ⚠️`.

`registry.json` is also not prettier-clean on `main` and not in `.prettierignore`, so the pre-commit
hook reflows it for any branch that stages it. Never let that churn hide a semantic change.
