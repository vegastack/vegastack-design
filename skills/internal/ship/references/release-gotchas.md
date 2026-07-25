# Release gotchas — what actually breaks, and the check that catches it

Every entry here cost a full merge-and-watch cycle on 2026-07-25/26. Seven cycles, because each
blocker was found _serially_ — fix, push, merge, watch, discover the next one. **The lesson above all
others: exercise the whole chain in one pass before starting.** `node tooling/verify-release-chain.mjs`
does that; it simulates a version bump in a throwaway worktree and asserts every link. It would have
found five of these at once.

Nothing here is theoretical. Each has a run id.

---

## 0. The meta-rule

**Never discover release blockers serially.** A release is a chain — bump → sync → build → consume →
classify → carry → guard → publish. A defect anywhere fails the whole thing, and each discovery costs
a full cycle. Run the whole chain locally first:

```bash
node tooling/verify-release-chain.mjs     # ~5min, no network, no side effects
```

Second rule: **most of these only appear on a MINOR bump.** The 0.1.0 → 0.1.1 release exercised none
of them, because `^0.1.0` still matched and no route set moved. A patch release proves very little
about the next minor.

---

## 1. Registry npm ranges do not follow the packages they point at

- **Symptom:** `registry:verify-consume` fails with
  `ERR_PNPM_NO_MATCHING_VERSION: No matching version found for @vegastack/design@^0.1.0`.
- **Cause:** every registry item declares `"@vegastack/design@^0.1.0"` in its npm `dependencies`.
  `^0.1.0` means `>=0.1.0 <0.2.0`, so it **excludes** 0.2.0.
- **Why it hid:** 0.1.0 → 0.1.1 still satisfied `^0.1.0`. The first minor bump broke it.
- **Blast radius if shipped:** every `shadcn add @vegastack/<component>` installs the PREVIOUS runtime
  beneath components built against the new tokens. **npm versions are immutable** — unrecoverable.
- **Now:** `version-sync` rewrites the ranges in both authorities. Run 30172679327.

## 2. The two authorities must move together

- **Symptom:** `verify-component-contracts: 96 problem(s) … expected ^0.2.0, received ^0.1.0`.
- **Cause:** `packages/ui/component-contracts.json` records the same ranges as
  `packages/ui/registry.json`, and that gate compares them. Fixing one alone fails the other.
- **Knock-on:** changing the contract JSON moves its SHA-256, so **`pnpm design:derived` must run**
  and its output is part of the same commit.

## 3. A pure version bump must require no gate

- **Symptom:** `receipt-guard` demands the `unit` lane; the carried receipt records it skipped.
- **Cause:** `packages/ui/package.json` matches the unit-lane surface, so a version bump looked like a
  package change. The publish path could never open.
- **Now:** `classify-change` short-circuits on `versionBumpOnly`. Run 30172679327.

## 4. The receipt cannot cross a version bump on its own

- **Symptom:** `receipt-guard` rejects the Version PR; no publish is reachable.
- **Cause:** `changeset version` + `version-sync` move the tree hash — versions, package CHANGELOGs,
  consumed changesets, and a re-stamped provenance header in 1082 files. Measured: 77a346c0 → 1b5796df.
- **Unfixable by re-running gates:** that branch is bot-authored and browsers cannot run in CI.
- **Now:** `gate-receipt-carry` carries it, the guard re-derives the proof. If the carry **refuses**,
  do not work around it — something other than a version bump is in that branch.

## 5. Never anchor a cross-machine proof to a tree hash

- **Symptom:** `fatal: bad object e8a242b8…` on a runner.
- **Cause:** `workingTreeContentHash()` builds its tree through a throwaway index, so the object is
  **dangling** — never reachable from a ref, therefore never pushed, therefore absent everywhere else.
- **Rule:** a tree hash is fine for "does this describe the same content" (both sides recompute it).
  It is useless as a **diff endpoint**. Anchor those to commits. Run 30168750521.

## 6. version-sync must not reformat what it rewrites

- **Symptom:** ~20KB of noise in the release diff; the carry refuses to cross it.
- **Cause:** `JSON.stringify(…, 2)` expands every short array that prettier keeps on one line.
  408,865 → 428,665 bytes across 538 items.
- **Rule:** after programmatically rewriting a checked-in file, hand it back to prettier — via the
  **API**, not `pnpm exec`, which fails in a detached worktree.

## 7. `changeset status` gates any `packages/**` change

- **Symptom:** `Some packages have been changed but no changesets were found`.
- **Rule:** a fix that corrects an **unpublished** release takes an **empty changeset** (`---\n---`),
  which is changesets' own sanctioned answer and has precedent here. It costs one extra Version-PR
  cycle — budget for it, or fold the fix in before the Version PR is opened.

## 8. Generated surfaces vs prettier

- **Symptom:** `prettier --check` and `design:derived --check` each undo the other.
- **Rule:** anything a generator owns belongs in `.prettierignore` — or the generator must emit
  prettier's shape. Already caught: `component-matrix.md`, `*.generated.*`,
  `design-tokens/src/tokens.ts`, `audit-register.json`, `audits/coverage.json`.
- **Deliberately NOT ignored:** `component-contracts.json` is a hand-maintained authority.

## 9. A script can depend on generated output it does not generate

- **Symptom:** `Cannot find package 'collections'` from `apps/docs/lib/source.ts` on a clean clone.
- **Cause:** the docs lint chain needed `.source`, which only `typecheck`/`build` produced. It passed
  in CI purely because `typecheck` happens to run first in the same job.
- **Rule:** a package script must produce its own prerequisites. Ordering is not a contract.

## 10. `pnpm lint` ≠ `turbo run lint`

The umbrella adds `design:verify`, the security gates, secret-scan, and every negative fixture.
`gates push` runs the umbrella for exactly this reason — a green `turbo run lint` proves less than it
appears to.

## 11. Reaping a server: kill the group, and filter the port

- `pnpm exec serve` spawns a child; killing the wrapper orphans the server. Use `detached: true` and
  kill the **process group**.
- `lsof -ti tcp:<port>` matches sockets with that port on **either** end — including the process that
  just polled the server. Without `-sTCP:LISTEN` it SIGKILLs the runner: exit 137 after a clean
  `768 passed`, with the report already written as `"pass"`. **The deleted workflows used the
  unfiltered idiom.**

## 12. Receipt ordering

Run `pnpm gates:push` **before** committing, then commit code and `.gates/receipt.json` together.
`.gates/` is excluded from the tree hash, so including it cannot invalidate the receipt. Commit first
and HEAD carries a receipt for the previous tree. `gates push` now blocks on this.

## 13. `continue-on-error` steps report `conclusion: success`

A diagnostic whose steps are `continue-on-error` will look green in the API even when the command
failed. Read the step **`outcome`**, or have the job compute its own verdict from every outcome — the
first version of the mini diagnostic reported "Green" while `pnpm lint` had failed inside it.

## 14. Fetch before you compare

Two false diagnoses in one session came from a stale `origin/main`. Any classification against
`origin/*` starts with `git fetch origin --prune`.

---

## The one thing still open

**The forced-colors focus assertion cannot fail.** Chromium paints its own ≥2px ring in that mode and
forced-colors repaints borders, so both branches of `hasOutline || hasTextEntryTint` are always true —
deleting the design system's focus ring leaves all 768 checks green. Pre-existing, reproduced against
the spec before the 2026-07-25 rewrite. Fixing it changes what 192 checks assert, so it is scoped
separately. **Until then it is not coverage.** Evidence: `docs/ledger/bugs.md`, 2026-07-25.
