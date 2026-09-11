# Rebasing an audit batch after the verification rebuild

**For:** the session finishing epic #31 (batches on `audit/*`). **Written:** 2026-09-09, against
`main` at `c40cc68d`.

Between 2026-09-08 and 2026-09-09 the verification topology was rebuilt (`docs/plans/2026-09-08-verification-rebuild.md`,
decisions R1–R5 in `AGENTS.md` § Locked decisions). Every open audit branch predates it, so every
one conflicts with `main` in the same places. The conflicts look alarming and are almost all
mechanical. This is the recipe.

Nothing here is a decision. If a resolution is not listed, stop and ask rather than guessing.

## 0. Before you touch anything: unpushed work lives on this machine

Four branches carry commits that exist **only** in the worktrees under
`/Users/mk/projects/vegastack-design/.claude/worktrees/`, and two more are not on GitHub at all:

| Branch                          | Unpushed commits     |
| ------------------------------- | -------------------- |
| `audit/fo1-forms`               | 21                   |
| `audit/t1-tables-grids`         | 15                   |
| `audit/m2-rich-text-toolbars`   | 12                   |
| `audit/c1-composition-feedback` | 4                    |
| `audit/execution-board`         | 1                    |
| `audit/o2-toasts`               | branch not on origin |
| `audit/d2-deps-fumadocs-lucide` | branch not on origin |

So, until that work is pushed:

- Do **not** delete any `.claude/worktrees/*`.
- Do **not** run `pnpm run clean --weekly` (it removes worktrees whose branch is merged; these are
  not merged, so it should refuse, but do not rely on that while the work is unpushed).
- Push each branch before rebasing it, so the pre-rebase state is recoverable from GitHub.

Check any branch with `git rev-list --count origin/<branch>..<branch>`.

## 1. What changed under you

| Gone                                                                              | Replaced by                                                                                                                     |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `.husky/pre-push`, the gate ladder, `pnpm gates:*`                                | `pnpm verify` — one command, also what CI runs                                                                                  |
| `.gates/` and `receipt.json`                                                      | nothing; CI executes the browser lanes instead of attesting them                                                                |
| `apps/docs/vrt/` (contracts, docs-shell, pixel specs), the docs Playwright runner | `packages/ui/test/geometry.browser.test.tsx` inside `pnpm verify`; `tooling/verify-docs-shell.mjs` inside `pnpm verify:release` |
| the change classifier and route scoping                                           | nothing; every run is the full ~2 minute loop                                                                                   |
| committed `*.generated.*` docs files                                              | build outputs, gitignored, written by `prepare:content`                                                                         |
| hand-edited `/CHANGELOG.md` per PR                                                | a changeset per PR; the entry is assembled at version time                                                                      |

Your inner loop is now:

```bash
pnpm check:component <name>   # ~10s
pnpm verify                   # ~2m — the whole gate, same as CI
```

There is no receipt to commit and no hook to satisfy. A push runs nothing locally.

## 2. The rebase

```bash
git fetch origin
git rebase origin/main
```

Expect conflicts in the files below, on every batch. Resolve in this order.

> **`--ours` and `--theirs` are inverted during a rebase, and getting it wrong silently keeps the
> wrong file.** A rebase replays your commits on top of `main`, so `HEAD` is `main`: `--ours` gives
> you **`main`'s** version and `--theirs` gives you **your branch's**. That is the opposite of a
> merge. Verified on this repo's git:
>
> ```
> during a rebase of feature onto main:
>   git checkout --ours   f.txt  →  MAIN-VERSION
>   git checkout --theirs f.txt  →  FEATURE-VERSION
> ```
>
> Every "take `main`'s side" instruction below therefore means `--ours`. After resolving, read the
> file before staging it rather than trusting the flag.

### 2a. Always resolve as **delete** — the rebuild removed these files

`git rm` them and continue. They are conflicts only because your branch edited a file `main`
deleted; nothing of yours is lost, because these are either regenerated or obsolete.

| Path                                                                                                                                                                     | Why                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `apps/docs/vrt/contract-routes.generated.ts`                                                                                                                             | build output, gitignored           |
| `apps/docs/lib/home-component-catalog.generated.ts`                                                                                                                      | build output, gitignored           |
| `apps/docs/components/animated-icon-gallery.generated.tsx`                                                                                                               | build output, gitignored           |
| `packages/ui/contract-smoke-tests.generated.json`                                                                                                                        | the smoke lane is gone             |
| `.gates/receipt.json`                                                                                                                                                    | the receipt system is gone         |
| `apps/docs/vrt/*.spec.ts`, `apps/docs/playwright.config.ts`, `apps/docs/tsconfig.vrt.json`                                                                               | the docs Playwright runner is gone |
| `tooling/contracts-run.mjs`, `tooling/gates.mjs`, `tooling/classify-change.mjs`, `tooling/lib/route-scope.mjs`, `tooling/lib/gate-receipt.mjs`, `tooling/vrt-review.mjs` | deleted with the attestation stack |

```bash
git rm -q apps/docs/vrt/contract-routes.generated.ts \
          apps/docs/lib/home-component-catalog.generated.ts \
          apps/docs/components/animated-icon-gallery.generated.tsx 2>/dev/null
```

If your branch **added** a component and therefore added rows to a generated file, do not try to
carry the rows across. Add the component to `packages/ui/component-contracts.json` (a real merge,
see 2d) and run `pnpm design:derived` — the rows come back generated.

### 2b. `CHANGELOG.md` — take `main`'s side, then write a changeset

`main` no longer carries a `## [0.7.0]` heading. The rebuild moved every bullet that used to live
there into changesets, and `tooling/changelog-assemble.mjs` now writes the entry at version time
from those changesets (R5). A hand-written heading for an unreleased version makes the assembler
**fail**, on purpose.

1. Resolve the conflict by taking `main`'s file unchanged: `git checkout --ours CHANGELOG.md`
   (per the warning above, during a rebase `--ours` is `main`), then confirm with
   `grep '^## \[' CHANGELOG.md | head -1` that the top entry is `[0.6.0]`.
2. Move each bullet your batch had added into a changeset, one bullet per changeset file:

```markdown
---
"@vegastack/ui": minor
---

🔧 **`Field`** — one sentence in the past tense, then the detail.
```

The body **must** open with exactly one of the eight section emoji, or `pnpm lint` fails:
`🧩` new · `🔧` changed · `🗑` removed · `🛠` tooling · `📦` npm · `📚` docs · `🐛` fixed · `⚠️` breaking.
`tooling/changeset-lint.mjs` enforces it; `node tooling/changelog-assemble.mjs --check` shows what
the release entry would look like. A change spanning two sections is two changesets.

### 2c. `AGENTS.md` — take `main`'s side, then re-apply only your rule

`AGENTS.md` went from 478 lines to 150. It is a rulebook now; the narrative history moved to
`docs/ledger/operator-review.md`. Your branch's diff will not apply, and most of it should not.

1. Take `main`'s file: `git checkout --ours AGENTS.md`.
2. Re-add **only** the durable rule your batch introduced, in the section where it belongs
   (usually § Build rules), in one or two sentences. Do not restore any paragraph you find missing:
   it was deleted deliberately.
3. Never hand-edit the `## Numbers` block. `pnpm design:derived` writes it.

### 2d. Real merges — both sides are right

| File                                                | How                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/component-contracts.json`              | Merge both sides' records, then `pnpm design:derived`. If your batch removed `coverage.crossBrowserSmoke` conflicts, drop that field: the smoke lane is gone. |
| `design.md`                                         | Merge the doctrine text, then `pnpm design:sync`. Never edit `apps/docs/public/design.md` — take `main`'s and let the sync rewrite it.                        |
| `docs/ledger/*.md`                                  | Append-only. Keep both sides' entries in date order.                                                                                                          |
| `apps/docs/content/docs/changelog.mdx`              | Generated. Take `main`'s, then `node tooling/sync-changelog.mjs`.                                                                                             |
| `README.md`, `skills/internal/**`                   | Merge by hand, then `node tooling/sync-package-skills.mjs` and `node tooling/skill-lint.mjs`.                                                                 |
| `packages/ui/registry.json`, `apps/docs/public/r/*` | Take `main`'s, then `pnpm registry:build`. Never resolve these by hand.                                                                                       |

### 2e. After every rebase, diff the co-touched files against main

This is not optional, and it is the one trap that bit this repo during the rebuild: a rebase can
drop another commit's inserted block **without reporting a conflict** when one hunk spans it. It
happened to `turbo.json` and was caught only by diffing.

```bash
git diff origin/main HEAD -- turbo.json AGENTS.md .gitignore package.json
```

Read the removals. Anything removed that your batch did not deliberately remove must go back.

## 3. Regenerate, then verify

```bash
pnpm registry:build          # if any registry item changed
pnpm design:derived          # if component-contracts.json changed
pnpm design:sync             # if design.md changed
git status --porcelain       # must be empty afterwards
pnpm verify                  # ~2m, the whole gate
```

`pnpm verify` cleans its own artefacts on pass, fail, or Ctrl-C, so a failed run still leaves a
clean tree. When it fails it prints `verify: FAILED at <stage>`; reproduce by re-running that one
stage.

## 4. Push and merge

```bash
git push --force-with-lease
```

CI is two jobs: `verify` on a LAN Linux runner in the pinned Playwright container (~3 min, browsers
included) and `verify-macos` on the mac mini (~2 min, static half). Both must be green. `verify-macos`
also runs `changeset status`, so a `packages/**` change with no changeset fails there — that is the
changeset from 2b.

Merge on green. Shipping (the Version PR merge, npm publish, deploy dispatch) remains MK's decision
and is not part of landing a batch.

## 5. Known state you do not need to rediscover

- **The geometry defects are closed.** The lane still carries one explicitly accepted entry,
  `resizableNested`: nested handles overlap by design and both remain independently operable. The
  `EXCLUDED` guard in `packages/ui/test/geometry.browser.test.tsx` still executes that assertion in
  expect-failure mode, so the acceptance turns red if the geometry changes and cannot rot silently.
- **The docs fullscreen focus trap is closed.** The composition makes pre-existing outside body
  roots natively inert while preserving later nested demo portals. `tooling/verify-docs-shell.mjs`
  asserts a 25-Tab containment walk, Escape, focus return and background isolation; its self-test
  removes inert and must observe the assertion fail.
- **PR #53 (G1-a) is closed unmerged.** Its two surviving pieces, `tooling/lib/fs.mjs` and the
  motion-pairing lint anchor, landed in `09b2107e`. Do not reopen it.
- **Never copy a pending changeset count from this runbook.** Read the live count and assembly
  target with `node tooling/changelog-assemble.mjs --check`.
